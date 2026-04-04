#!/usr/bin/env python3
"""
FYP Predictor - Modul 7
Fungsi: Prediksi potensi viral video berdasarkan 11 metrik
"""

import json
import sys
import cv2
import numpy as np
import os

def analyze_hook_strength(frame):
    """Analisis 3 detik pertama video"""
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 100, 200)
    edge_density = np.sum(edges > 0) / edges.size
    
    # Deteksi teks dalam frame
    text_detected = False  # Placeholder untuk OCR
    
    score = min(100, int(edge_density * 200))
    if text_detected:
        score += 10
    
    return min(100, score)

def analyze_emotional_trigger(frame):
    """Analisis trigger emosional (wajah, ekspresi)"""
    # Placeholder - bisa pakai face detection + emotion recognition
    return np.random.randint(60, 95)

def analyze_audio_virality(audio_path):
    """Analisis backsound viral"""
    # Placeholder - bisa pakai audio fingerprinting
    return np.random.randint(50, 90)

def predict_fyp(video_path):
    """Prediksi skor FYP"""
    cap = cv2.VideoCapture(video_path)
    
    # Ambil frame pertama untuk hook analysis
    ret, first_frame = cap.read()
    hook_score = analyze_hook_strength(first_frame) if ret else 50
    
    # Ambil sample frame untuk emotional analysis
    cap.set(cv2.CAP_PROP_POS_FRAMES, int(cap.get(cv2.CAP_PROP_FRAME_COUNT) * 0.3))
    ret, mid_frame = cap.read()
    emotional_score = analyze_emotional_trigger(mid_frame) if ret else 70
    
    cap.release()
    
    # Metrik lainnya (mock data)
    metrics = {
        'hook': hook_score,
        'retention': np.random.randint(40, 85),
        'emotional': emotional_score,
        'completion': np.random.randint(30, 75),
        'shareability': np.random.randint(50, 90),
        'comment': np.random.randint(20, 70),
        'save': np.random.randint(40, 80),
        'audio': np.random.randint(60, 95),
        'hashtag': np.random.randint(50, 85),
        'timing': np.random.randint(40, 90)
    }
    
    # Hitung skor total (weighted average)
    weights = {
        'hook': 0.25, 'retention': 0.20, 'emotional': 0.15,
        'completion': 0.15, 'shareability': 0.10, 'comment': 0.05,
        'save': 0.05, 'audio': 0.03, 'hashtag': 0.01, 'timing': 0.01
    }
    
    total_score = sum(metrics[k] * weights[k] for k in metrics)
    
    # Weaknesses detection
    weaknesses = []
    if metrics['hook'] < 70:
        weaknesses.append('Hook di 3 detik pertama kurang kuat')
    if metrics['retention'] < 50:
        weaknesses.append('Retensi penonton diprediksi rendah')
    if metrics['emotional'] < 60:
        weaknesses.append('Kurang trigger emosional')
    if metrics['completion'] < 40:
        weaknesses.append('Video terlalu panjang atau membosankan')
    
    # Recommendations
    recommendations = []
    if metrics['hook'] < 70:
        recommendations.append('Tambahkan teks besar atau efek dramatis di 3 detik pertama')
    if metrics['emotional'] < 60:
        recommendations.append('Pilih scene dengan ekspresi wajah yang lebih intens')
    if metrics['audio'] < 70:
        recommendations.append('Ganti backsound dengan yang sedang trending')
    
    # Retention by second (mock)
    retention_by_second = {}
    for sec in range(3, 31, 3):
        retention_by_second[sec] = max(10, 100 - (sec * 2) + np.random.randint(-10, 10))
    
    return {
        'score': int(total_score),
        'metrics': metrics,
        'weaknesses': weaknesses,
        'recommendations': recommendations,
        'retentionBySecond': retention_by_second
    }

def main():
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'No command specified'}))
        return
    
    command = sys.argv[1]
    
    if command == 'predict':
        video_path = sys.argv[2]
        result = predict_fyp(video_path)
        print(json.dumps(result))

if __name__ == '__main__':
    main()
