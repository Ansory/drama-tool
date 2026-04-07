#!/usr/bin/env python3
"""
Auto Content Generator - Backend
Analisis video dan generate judul, caption, hashtag otomatis via Gemini AI
BUG FIX v1.0.11: Added proper error handling and logging
"""

import json
import sys
import os
import cv2
import numpy as np
from pathlib import Path
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import load balancer yang sudah ada
sys.path.insert(0, str(Path(__file__).parent))
try:
    from gemini_load_balancer import GeminiLoadBalancer
    lb = GeminiLoadBalancer()
    HAS_GEMINI = True
    logger.info("Gemini Load Balancer initialized successfully")
except Exception as e:
    HAS_GEMINI = False
    lb = None
    # BUG FIX: Log error properly instead of silent fail
    logger.error(f"Failed to initialize Gemini Load Balancer: {str(e)}")
    logger.warning("Auto Content Generator will run in fallback mode")

def extract_video_metadata(video_path):
    """Analisis video untuk konteks AI"""
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        logger.error(f"Cannot open video: {video_path}")
        return {}

    fps = cap.get(cv2.CAP_PROP_FPS)
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    duration = frame_count / fps if fps > 0 else 0

    sample_frames = []
    sample_points = [0.1, 0.3, 0.5, 0.7, 0.9]

    for point in sample_points:
        cap.set(cv2.CAP_PROP_POS_FRAMES, int(frame_count * point))
        ret, frame = cap.read()
        if ret:
            sample_frames.append(frame)

    cap.release()

    brightness = 0
    if sample_frames:
        gray_frames = [cv2.cvtColor(f, cv2.COLOR_BGR2GRAY) for f in sample_frames]
        brightness = int(np.mean([np.mean(g) for g in gray_frames]))

    motion_score = 0
    if len(sample_frames) > 1:
        diffs = []
        for i in range(1, len(sample_frames)):
            diff = cv2.absdiff(sample_frames[i-1], sample_frames[i])
            diffs.append(np.mean(diff))
        motion_score = int(np.mean(diffs))

    is_vertical = height > width
    aspect = f"{width}x{height}"

    return {
        'duration': round(duration, 1),
        'fps': round(fps, 1),
        'resolution': aspect,
        'is_vertical': is_vertical,
        'brightness': brightness,
        'motion_score': motion_score,
        'frame_count': frame_count
    }

def detect_scene_type(metadata):
    """Deteksi jenis scene dari metadata video"""
    motion = metadata.get('motion_score', 0)
    bright = metadata.get('brightness', 128)
    duration = metadata.get('duration', 30)

    if motion > 40:
        return 'action'
    elif bright < 70:
        return 'sad_dramatic'
    elif bright > 180:
        return 'romantic_bright'
    elif duration < 15:
        return 'plot_twist'
    else:
        return 'drama_general'

def build_prompt(metadata, drama_name, scene_hint, platform):
    """Buat prompt untuk Gemini"""
    duration = metadata.get('duration', 30)
    is_vertical = metadata.get('is_vertical', True)
    scene_type = detect_scene_type(metadata)

    if scene_hint and scene_hint != 'auto':
        scene_type = scene_hint

    scene_labels = {
        'action': 'adegan action/pertarungan seru',
        'sad_dramatic': 'adegan sedih/haru/menangis',
        'romantic_bright': 'adegan romantis/sweet moment',
        'plot_twist': 'plot twist mengejutkan',
        'drama_general': 'adegan drama menarik',
        'confrontation': 'konfrontasi/tamparan balik',
        'comedy': 'adegan lucu/kocak'
    }

    scene_label = scene_labels.get(scene_type, 'adegan drama')

    platform_notes = {
        'facebook': 'Facebook Reels (max caption 2200 karakter, 30 hashtag)',
        'instagram': 'Instagram Reels (max caption 2200 karakter, 30 hashtag)',
        'tiktok': 'TikTok (caption singkat, max 150 karakter)',
        'youtube': 'YouTube Shorts (judul max 100 karakter, deskripsi panjang ok)'
    }

    platform_note = platform_notes.get(platform, platform_notes['facebook'])
    drama_context = f'Drama: "{drama_name}"' if drama_name else 'Drama China (judul tidak diketahui)'

    prompt = f"""Kamu adalah ahli konten viral drama China di media sosial Indonesia.

Analisis video berikut dan buat konten optimal:
- {drama_context}
- Jenis scene: {scene_label}
- Durasi video: {duration} detik
- Format: {'Vertikal 9:16 (optimal untuk Reels)' if is_vertical else 'Horizontal (kurang optimal untuk Reels)'}
- Platform target: {platform_note}

Berikan output dalam format JSON PERSIS seperti ini (tanpa penjelasan lain):
{{
  "titles": [
    "judul1 yang menarik dan bikin penasaran",
    "judul2 alternatif dengan angle berbeda",
    "judul3 lebih emosional/dramatis"
  ],
  "caption_short": "caption pendek 1-2 kalimat max 150 karakter, cocok untuk TikTok, tanpa hashtag",
  "caption_long": "caption panjang 3-5 kalimat yang engaging, cerita singkat scene, ajak interaksi (tanya pendapat/like jika setuju), tanpa hashtag",
  "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3", "#hashtag4", "#hashtag5", "#hashtag6", "#hashtag7", "#hashtag8", "#hashtag9", "#hashtag10"],
  "hook_suggestions": ["saran hook 1", "saran hook 2", "saran hook 3"],
  "viral_potential": "alasannya kenapa video ini bisa viral"
}}

PENTING: Gunakan bahasa Indonesia gaul yang sering dipakai di media sosial seperti TikTok dan Instagram. Gunakan kata-kata seperti 'bestie', 'auto', 'fyp', 'viral', 'gak', 'banget', dll."""

    return prompt

def generate_content(video_path, drama_name='', scene_hint='auto', platform='facebook'):
    """Generate judul, caption, hashtag otomatis"""
    
    # BUG FIX: Check if file exists first
    if not os.path.exists(video_path):
        error_msg = f"Video file not found: {video_path}"
        logger.error(error_msg)
        return {
            'error': error_msg,
            'titles': ['Error: Video tidak ditemukan'],
            'caption_short': '',
            'caption_long': '',
            'hashtags': [],
            'hook_suggestions': [],
            'viral_potential': ''
        }
    
    metadata = extract_video_metadata(video_path)
    
    # BUG FIX: Check if metadata extraction succeeded
    if not metadata:
        error_msg = "Failed to extract video metadata"
        logger.error(error_msg)
        return {
            'error': error_msg,
            'titles': ['Error: Gagal membaca metadata video'],
            'caption_short': '',
            'caption_long': '',
            'hashtags': [],
            'hook_suggestions': [],
            'viral_potential': ''
        }
    
    if not HAS_GEMINI or lb is None:
        # Fallback mode with default templates
        logger.warning("Running in fallback mode - Gemini not available")
        scene_type = detect_scene_type(metadata)
        
        fallback_titles = {
            'action': ['Adegan Action Seru! Auto Viral!', 'Pertarungan Epic! Jangan Sampai Lewat!', 'Action Scene Terbaik!'],
            'sad_dramatic': ['Scene Menangis Ini Bikin Mewek', 'Sedih Banget! Siapkan Tisu', 'Emotional Scene Terbaik'],
            'romantic_bright': ['Moment Romantis Bikin Baper', 'Scene Sweet Ini Auto Gemas!', 'Romantis Banget!'],
            'plot_twist': ['Plot Twist Gak Terduga!', 'Ending Bikin Kaget!', 'Twist Scene Viral!'],
            'drama_general': ['Adegan Drama Menarik', 'Scene Viral Drama China', 'Drama Scene Terbaik']
        }
        
        return {
            'titles': fallback_titles.get(scene_type, fallback_titles['drama_general']),
            'caption_short': f'Scene {scene_type} dari drama china! Jangan lupa like dan share bestie!',
            'caption_long': f'Kalian tim yang mana bestie? Komen di bawah ya! Scene {scene_type} ini emang bikin nagih banget sih. Jangan lupa follow buat dapet update terbaru!',
            'hashtags': ['#DramaChina', '#FYP', '#Viral', '#DramaClip', '#SceneDrama'],
            'hook_suggestions': ['Tambahkan teks hook di awal', 'Gunakan backsound viral', 'Tambahkan reaksi emoticon'],
            'viral_potential': 'Video memiliki potensi viral dengan konten yang menarik',
            'note': 'Generated in fallback mode - Gemini API not available'
        }
    
    prompt = build_prompt(metadata, drama_name, scene_hint, platform)
    
    try:
        # Call Gemini API via load balancer
        response = lb.generate_content(prompt)
        
        # Parse JSON response
        try:
            result = json.loads(response)
            result['metadata'] = metadata  # Include metadata for frontend
            return result
        except json.JSONDecodeError:
            # If not valid JSON, wrap in fallback
            logger.error(f"Invalid JSON response from Gemini: {response[:200]}")
            return {
                'titles': ['Error: Invalid AI response format'],
                'caption_short': '',
                'caption_long': response[:500] if response else '',
                'hashtags': [],
                'hook_suggestions': [],
                'viral_potential': '',
                'metadata': metadata,
                'error': 'Invalid JSON from AI'
            }
            
    except Exception as e:
        # BUG FIX: Properly log and return error
        error_msg = f"Gemini API error: {str(e)}"
        logger.error(error_msg)
        return {
            'error': error_msg,
            'titles': ['Error: Gagal generate konten'],
            'caption_short': '',
            'caption_long': '',
            'hashtags': [],
            'hook_suggestions': [],
            'viral_potential': '',
            'metadata': metadata
        }

def main():
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'No command specified'}))
        return
    
    command = sys.argv[1]
    
    if command == 'generate':
        video_path = sys.argv[2] if len(sys.argv) > 2 else ''
        drama_name = sys.argv[3] if len(sys.argv) > 3 else ''
        scene_hint = sys.argv[4] if len(sys.argv) > 4 else 'auto'
        platform = sys.argv[5] if len(sys.argv) > 5 else 'facebook'
        
        result = generate_content(video_path, drama_name, scene_hint, platform)
        print(json.dumps(result))

if __name__ == '__main__':
    main()
