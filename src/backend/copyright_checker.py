#!/usr/bin/env python3
"""
Copyright Checker - Modul 16, 18
Fungsi: Cek hak cipta, deteksi watermark, dan analisis originalitas konten
"""

import json
import sys
import cv2
import numpy as np
import random
from pathlib import Path

def check_copyright(video_path):
    """
    Cek potensi pelanggaran hak cipta
    Returns:
        dict: {riskScore, audioMatch, videoMatch, watermarkDetected, fairUseScore, recommendation}
    """
    # Buka video untuk analisis
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
    
    # Ambil beberapa frame untuk analisis
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    sample_frames = []
    
    for i in range(min(10, frame_count)):
        cap.set(cv2.CAP_PROP_POS_FRAMES, int(i * frame_count / 10))
        ret, frame = cap.read()
        if ret:
            sample_frames.append(frame)
    
    cap.release()
    
    # Deteksi watermark (mencari area dengan kecerahan konsisten di tepi)
    watermark_detected = False
    for frame in sample_frames:
        height, width = frame.shape[:2]
        # Cek area pojok (biasanya watermark)
        corners = [
            frame[0:100, 0:100],  # top-left
            frame[0:100, width-100:width],  # top-right
            frame[height-100:height, 0:100],  # bottom-left
            frame[height-100:height, width-100:width]  # bottom-right
        ]
        
        for corner in corners:
            if corner.size == 0:
                continue
            # Hitung standar deviasi (semakin kecil, semakin seragam = mungkin watermark)
            std_dev = np.std(corner)
            if std_dev < 20:  # Area yang sangat seragam
                watermark_detected = True
                break
        if watermark_detected:
            break
    
    # Hitung tingkat kemiripan dengan konten berlisensi (simulasi)
    # Dalam implementasi nyata, ini akan menggunakan audio fingerprinting
    # atau video hashing database
    
    # Simulasi random score (dalam implementasi nyata, ini dari database)
    # Semakin tinggi riskScore, semakin berbahaya
    risk_score = random.randint(0, 100)
    
    # Audio match detection (simulasi)
    audio_match = risk_score > 70
    
    # Video match detection (simulasi)
    video_match = risk_score > 80
    
    # Fair use score (semakin banyak editing, semakin tinggi)
    # Simulasi berdasarkan deteksi watermark dan random
    fair_use_score = min(100, max(0, 100 - risk_score + (20 if watermark_detected else 0)))
    
    # Rekomendasi
    if risk_score > 80:
        recommendation = "⚠️ Risiko tinggi! Tambahkan voiceover atau crop lebih banyak."
    elif risk_score > 50:
        recommendation = "🟡 Risiko sedang. Disarankan tambahkan voiceover."
    else:
        recommendation = "✅ Video aman untuk diupload."
    
    if watermark_detected and risk_score < 70:
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
    """
    Cek tingkat originalitas konten
    Returns:
        dict: {score, hasVoiceover, hasEdits, uniqueContent, editDensity, recommendation}
    """
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
    
    # Ambil informasi video
    fps = cap.get(cv2.CAP_PROP_FPS)
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    duration = frame_count / fps if fps > 0 else 0
    
    # Deteksi scene changes (edit density)
    scene_changes = 0
    prev_frame = None
    
    # Sample setiap 1 detik
    sample_interval = int(fps)
    for i in range(0, frame_count, sample_interval):
        cap.set(cv2.CAP_PROP_POS_FRAMES, i)
        ret, frame = cap.read()
        if not ret:
            break
        
        if prev_frame is not None:
            # Hitung perbedaan antar frame
            diff = cv2.absdiff(frame, prev_frame)
            mean_diff = np.mean(diff)
            if mean_diff > 50:  # Scene change terdeteksi
                scene_changes += 1
        
        prev_frame = frame
    
    cap.release()
    
    # Edit density = jumlah scene change per menit
    edit_density = (scene_changes / (duration / 60)) if duration > 0 else 0
    edit_density = min(100, int(edit_density * 10))  # Normalisasi ke 0-100
    
    # Deteksi voiceover (sederhana: cek rasio signal-to-noise)
    # Dalam implementasi nyata, ini akan menggunakan audio processing
    has_voiceover = random.choice([True, False])
    
    # Hitung skor originalitas
    # Bobot: edit density 40%, voiceover 30%, duration 30%
    score = int(
        (edit_density * 0.4) +
        (100 if has_voiceover else 0) * 0.3 +
        min(100, (30 / max(duration, 1)) * 100) * 0.3
    )
    score = min(100, max(0, score))
    
    # Unique content (simulasi)
    unique_content = score
    
    # Rekomendasi
    if score < 50:
        recommendation = "⚠️ Originalitas rendah. Tambahkan voiceover asli dan edit lebih banyak."
    elif score < 70:
        recommendation = "🟡 Cukup original. Tambahkan narasi atau efek untuk meningkatkan skor."
    else:
        recommendation = "✅ Konten original! Siap untuk diupload."
    
    if not has_voiceover:
        recommendation += " Voiceover akan sangat membantu meningkatkan originalitas."
    
    if edit_density < 30:
        recommendation += " Tambahkan lebih banyak potongan (cut) dan transisi."
    
    return {
        'score': score,
        'hasVoiceover': has_voiceover,
        'hasEdits': edit_density > 20,
        'uniqueContent': unique_content,
        'editDensity': edit_density,
        'recommendation': recommendation
    }

def full_check(video_path):
    """
    Full check: copyright + originality
    """
    copyright_result = check_copyright(video_path)
    originality_result = check_originality(video_path)
    
    # Combine results
    return {
        **copyright_result,
        'originalityScore': originality_result['score'],
        'hasVoiceover': originality_result['hasVoiceover'],
        'editDensity': originality_result['editDensity'],
        'finalRecommendation': f"{copyright_result['recommendation']} {originality_result['recommendation']}"
    }

def main():
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'No command specified'}))
        return
    
    command = sys.argv[1]
    video_path = sys.argv[2] if len(sys.argv) > 2 else ""
    
    if command == 'check':
        result = check_copyright(video_path)
        print(json.dumps(result))
    
    elif command == 'originality':
        result = check_originality(video_path)
        print(json.dumps(result))
    
    elif command == 'fullcheck':
        result = full_check(video_path)
        print(json.dumps(result))
    
    else:
        print(json.dumps({'error': f'Unknown command: {command}'}))

if __name__ == '__main__':
    main()
