#!/usr/bin/env python3
"""
Video Processor - Modul 1 & 5
Fungsi: Crop video, resize, deteksi scene, pecah video panjang
BUG FIX v1.0.11: Division by zero handling and proper error handling
"""

import json
import sys
import os
import cv2
import numpy as np
try:
    from scenedetect import VideoManager, SceneManager
    _USE_VIDEO_MANAGER = True
except ImportError:
    from scenedetect import open_video, SceneManager
    _USE_VIDEO_MANAGER = False
from scenedetect.detectors import ContentDetector
import subprocess
import ffmpeg

def get_video_info(video_path):
    """Dapatkan informasi video dengan proper error handling"""
    if not os.path.isfile(video_path):
        raise FileNotFoundError(f"Video file not found: {video_path}")

    valid_extensions = ['.mp4', '.avi', '.mov', '.mkv', '.flv', '.wmv', '.webm']
    if not any(video_path.lower().endswith(ext) for ext in valid_extensions):
        raise ValueError(f"Invalid video file format. Supported: {', '.join(valid_extensions)}")

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError(f"Cannot open video file: {video_path}")

    fps = cap.get(cv2.CAP_PROP_FPS)
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    
    # BUG FIX: Handle fps <= 0
    if fps <= 0:
        fps = 30.0  # Assume default 30fps
    
    # BUG FIX: Handle frame_count <= 0
    if frame_count <= 0:
        cap.release()
        raise ValueError(f"Invalid video: no frames detected in {video_path}")
    
    info = {
        'width': int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)),
        'height': int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)),
        'fps': fps,
        'frame_count': frame_count,
        'duration': frame_count / fps
    }
    cap.release()
    return info

def detect_scenes(video_path, threshold=30.0):
    """Deteksi pergantian scene menggunakan PySceneDetect"""
    scene_manager = SceneManager()
    scene_manager.add_detector(ContentDetector(threshold=threshold))

    if _USE_VIDEO_MANAGER:
        video_manager = VideoManager([video_path])
        video_manager.start()
        scene_manager.detect_scenes(frame_source=video_manager)
        scenes = scene_manager.get_scene_list()
        video_manager.release()
    else:
        video = open_video(video_path)
        scene_manager.detect_scenes(video)
        scenes = scene_manager.get_scene_list()

    return [(scene[0].get_seconds(), scene[1].get_seconds()) for scene in scenes]

def calculate_viral_score(frame, scene_type='general'):
    """Hitung skor viral potensial berdasarkan frame"""
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 100, 200)
    edge_density = np.sum(edges > 0) / edges.size
    
    score = min(100, int(edge_density * 200))
    return score

def split_video(video_path, output_folder, min_duration=15, max_duration=30):
    """Pecah video menjadi clip-clip pendek"""
    scenes = detect_scenes(video_path)
    clips = []
    
    for i, (start, end) in enumerate(scenes):
        duration = end - start
        if min_duration <= duration <= max_duration:
            output_path = os.path.join(output_folder, f'clip_{i+1}.mp4')
            
            try:
                (
                    ffmpeg
                    .input(video_path, ss=start, t=duration)
                    .output(output_path, c='copy')
                    .run(quiet=True, overwrite_output=True)
                )
                
                cap = cv2.VideoCapture(output_path)
                ret, frame = cap.read()
                viral_score = calculate_viral_score(frame) if ret else 50
                cap.release()
                
                clips.append({
                    'index': i + 1,
                    'start': start,
                    'end': end,
                    'duration': duration,
                    'path': output_path,
                    'viralScore': viral_score
                })
            except Exception as e:
                print(f"Error processing clip {i}: {e}", file=sys.stderr)
                continue
    
    return clips

def main():
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'No command specified'}))
        return

    try:
        command = sys.argv[1]

        if command == 'info':
            if len(sys.argv) < 3:
                print(json.dumps({'error': 'Video path required'}))
                return
            video_path = sys.argv[2]
            info = get_video_info(video_path)
            print(json.dumps(info))

        elif command == 'scenes':
            if len(sys.argv) < 3:
                print(json.dumps({'error': 'Video path required'}))
                return
            video_path = sys.argv[2]
            scenes = detect_scenes(video_path)
            print(json.dumps(scenes))

        elif command == 'split':
            if len(sys.argv) < 4:
                print(json.dumps({'error': 'Video path and output folder required'}))
                return
            video_path = sys.argv[2]
            output_folder = sys.argv[3]
            min_dur = int(sys.argv[4]) if len(sys.argv) > 4 else 15
            max_dur = int(sys.argv[5]) if len(sys.argv) > 5 else 30

            if min_dur <= 0 or max_dur <= 0 or min_dur >= max_dur:
                print(json.dumps({'error': 'Invalid duration values'}))
                return

            clips = split_video(video_path, output_folder, min_dur, max_dur)
            print(json.dumps(clips))
            
    except Exception as e:
        print(json.dumps({'error': str(e)}))
        sys.exit(1)

if __name__ == '__main__':
    main()
