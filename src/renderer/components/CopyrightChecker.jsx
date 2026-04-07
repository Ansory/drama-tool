#!/usr/bin/env python3
"""
Copyright Checker - Modul 16, 18
Fungsi: Cek hak cipta, deteksi watermark, dan analisis originalitas konten
BUG FIX v1.0.11: Fair use score calculation logic fixed
"""

import json
import sys
import cv2
import numpy as np
from pathlib import Path

def check_copyright(video_path):
    """
    Cek potensi pelanggaran hak cipta
    Returns:
        dict: {riskScore, audioMatch, videoMatch, watermarkDetected, fairUseScore, recommendation}
    """
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return {
            'riskScore': 50,
            'audioMatch': False,
            'videoMatch': False,
            'watermarkDetected': False,
            'fairUseScore': 50,
            'recommendation': 'Tidak dapat membaca file video'
        }
    
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    sample_frames = []
    
    for i in range(min(10, frame_count)):
        cap.set(cv2.CAP_PROP_POS_FRAMES, int(i * frame_count / 10))
        ret, frame = cap.read()
        if ret:
            sample_frames.append(frame)
    
    cap.release()
    
    # Deteksi watermark
    watermark_detected = False
    for frame in sample_frames:
        height, width = frame.shape[:2]
        margin = min(100, height // 4, width // 4)
        if margin < 10:
            continue
        corners = [
            frame[0:margin, 0:margin],
            frame[0:margin, width-margin:width],
            frame[height-margin:height, 0:margin],
            frame[height-margin:height, width-margin:width]
        ]
        
        for corner in corners:
            if corner.size == 0:
                continue
            std_dev = np.std(corner)
            if std_dev < 20:
                watermark_detected = True
                break
        if watermark_detected:
            break
    
    # Hitung risk score
    risk_score = 30
    if watermark_detected:
        risk_score += 40

    if len(sample_frames) > 1:
        frame_variances = []
        for frame in sample_frames:
            frame_variances.append(np.std(frame))
        avg_variance = np.mean(frame_variances)
        if avg_variance < 40:
            risk_score += 20

    risk_score = min(100, max(0, risk_score))
    
    audio_match = risk_score > 70
    video_match = risk_score > 80
    
    # BUG FIX: Fair use score calculation
    # Formula baru: 100 - (risk_score * 0.5) - watermark_penalty
    # Sebelumnya: 100 - risk_score - penalty (selalu menghasilkan score rendah)
    watermark_penalty = 15 if watermark_detected else 0
    fair_use_score = min(100, max(0, 100 - int(risk_score * 0.5) - watermark_penalty))
    
    # Rekomendasi
    if risk_score > 80:
        recommendation = "Risiko tinggi! Tambahkan voiceover atau crop lebih banyak."
    elif risk_score > 50:
        recommendation = "Risiko sedang. Disarankan tambahkan voiceover."
    else:
        recommendation = "Video aman untuk diupload."
    
    if watermark_detected:
        recommendation += " Terdeteksi watermark. Hapus dengan fitur inpainting."
    
    return {
        'riskScore': risk_score,
        'audioMatch': audio_match,
        'videoMatch': video_match,
        'watermarkDetected': watermark_detected,
        'fairUseScore': fair_use_score,
        'recommendation': recommendation
    }

def check_originality(video_path):
    """Cek tingkat originalitas konten"""
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return {
            'score': 50,
            'hasVoiceover': False,
            'hasEdits': False,
            'uniqueContent': 50,
            'editDensity': 0,
            'recommendation': 'Tidak dapat membaca file video'
        }
    
    fps = cap.get(cv2.CAP_PROP_FPS)
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    duration = frame_count / fps if fps > 0 else 0
    
    scene_changes = 0
    prev_frame = None
    
    for _ in range(min(100, frame_count)):
        ret, frame = cap.read()
        if not ret:
            break
        if prev_frame is not None:
            diff = cv2.absdiff(frame, prev_frame)
            if np.mean(diff) > 30:
                scene_changes += 1
        prev_frame = frame
    
    cap.release()
    
    edit_density = scene_changes / duration if duration > 0 else 0
    
    has_edits = edit_density > 0.5
    has_voiceover = False
    
    unique_score = min(100, 40 + int(edit_density * 20) + (10 if has_voiceover else 0))
    
    if unique_score > 70:
        recommendation = "Konten original tinggi, aman untuk upload."
    elif unique_score > 40:
        recommendation = "Tambahkan voiceover untuk meningkatkan originalitas."
    else:
        recommendation = "Lakukan editing lebih banyak atau tambahkan komentar."
    
    return {
        'score': unique_score,
        'hasVoiceover': has_voiceover,
        'hasEdits': has_edits,
        'uniqueContent': unique_score,
        'editDensity': round(edit_density, 2),
        'recommendation': recommendation
    }

def main():
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'No command specified'}))
        return
    
    command = sys.argv[1]
    
    if command == 'check':
        video_path = sys.argv[2] if len(sys.argv) > 2 else ''
        result = check_copyright(video_path)
        print(json.dumps(result))
    
    elif command == 'originality':
        video_path = sys.argv[2] if len(sys.argv) > 2 else ''
        result = check_originality(video_path)
        print(json.dumps(result))

if __name__ == '__main__':
    main()
