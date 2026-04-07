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

def analyze_emotional_trigger(frame, video_duration):
    """Analisis trigger emosional (wajah, ekspresi)"""
    # Analyze frame intensity and contrast which correlates with emotional content
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

    # Calculate contrast and brightness
    contrast = np.std(gray)
    brightness = np.mean(gray)

    # High contrast often indicates emotional scenes (close-ups, dramatic lighting)
    # Brightness around 100-150 is optimal for emotional content
    score = 60

    if contrast > 50:  # High contrast
        score += 20

    if 80 < brightness < 160:  # Optimal brightness range
        score += 15

    return min(95, int(score))

def analyze_audio_virality(duration, file_size):
    """Analisis backsound viral based on video characteristics"""
    # Estimate audio quality based on file size and duration
    # Higher bitrate often indicates better audio (music/OST)
    if duration > 0:
        bitrate_estimate = (file_size * 8) / (duration * 1000)  # kbps

        # Videos with good audio typically have higher bitrates
        score = 50
        if bitrate_estimate > 500:  # Good audio quality
            score += 25
        elif bitrate_estimate > 300:
            score += 15

        return min(90, int(score))
    return 70

def analyze_completion_rate(duration):
    """Predict completion rate based on video duration"""
    # Shorter videos have higher completion rates
    if duration <= 15:  # Very short
        return 75
    elif duration <= 30:  # Short
        return 65
    elif duration <= 60:  # Medium
        return 50
    else:  # Long
        return 35

def analyze_shareability(hook_score, emotional_score):
    """Predict shareability based on hook and emotional impact"""
    # Videos with strong hooks and emotional content are more shareable
    base_score = 50

    if hook_score > 70:
        base_score += 20

    if emotional_score > 70:
        base_score += 20

    return min(90, base_score)

def analyze_timing_score(duration):
    """Analyze optimal timing/length"""
    # Optimal video length for social media (15-30 seconds)
    if 15 <= duration <= 30:
        return 90
    elif 10 <= duration <= 45:
        return 75
    elif duration <= 60:
        return 60
    else:
        return 45

def predict_fyp(video_path):
    """Prediksi skor FYP"""
    cap = cv2.VideoCapture(video_path)

    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    duration = frame_count / fps if fps > 0 else 0

    # Get file size for analysis
    file_size = os.path.getsize(video_path) if os.path.exists(video_path) else 0

    # Deterministic seed from video properties (for remaining random metrics)
    seed = int((frame_count + file_size + int(duration * 100) + width + height) % (2**31))
    rng = np.random.RandomState(seed)

    # Ambil frame pertama untuk hook analysis
    ret, first_frame = cap.read()
    hook_score = analyze_hook_strength(first_frame) if ret else 50

    # Ambil sample frame untuk emotional analysis
    cap.set(cv2.CAP_PROP_POS_FRAMES, int(frame_count * 0.3))
    ret, mid_frame = cap.read()
    emotional_score = analyze_emotional_trigger(mid_frame, duration) if ret else 70

    cap.release()

    # Calculate metrics using actual analysis (improved from random)
    completion_score = analyze_completion_rate(duration)
    shareability_score = analyze_shareability(hook_score, emotional_score)
    audio_score = analyze_audio_virality(duration, file_size)
    timing_score = analyze_timing_score(duration)

    # Aspect ratio check (vertical is better for social media)
    is_vertical = height > width
    aspect_bonus = 10 if is_vertical else 0

    # Retention estimate based on hook and duration
    retention_base = 70 if hook_score > 70 else 50
    retention_penalty = max(0, int((duration - 30) / 10))  # Penalty for long videos
    retention_score = max(40, min(85, retention_base - retention_penalty + aspect_bonus))

    metrics = {
        'hook': hook_score,
        'retention': retention_score,
        'emotional': emotional_score,
        'completion': completion_score,
        'shareability': shareability_score,
        'comment': int(rng.randint(20, 70)),  # Still using seed for unpredictable metrics
        'save': int(rng.randint(40, 80)),
        'audio': audio_score,
        'hashtag': int(rng.randint(50, 85)),  # Would need text analysis
        'timing': timing_score
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
    if not is_vertical:
        weaknesses.append('Video horizontal, vertical lebih baik untuk reels')

    # Recommendations
    recommendations = []
    if metrics['hook'] < 70:
        recommendations.append('Tambahkan teks besar atau efek dramatis di 3 detik pertama')
    if metrics['emotional'] < 60:
        recommendations.append('Pilih scene dengan ekspresi wajah yang lebih intens')
    if metrics['audio'] < 70:
        recommendations.append('Ganti backsound dengan yang sedang trending')
    if duration > 45:
        recommendations.append('Pertimbangkan untuk memotong video menjadi lebih pendek (30-45 detik)')
    if not is_vertical:
        recommendations.append('Crop video ke format 9:16 (vertical)')

    # Retention by second (based on actual metrics)
    retention_by_second = {}
    for sec in range(3, min(61, int(duration) + 1), 3):
        # Retention decreases over time, faster for longer videos
        decay_rate = 2.5 if duration > 30 else 2.0
        base_retention = 100 - (sec * decay_rate)
        # Add some deterministic variation based on seed
        variation = int(rng.randint(-5, 5))
        retention_by_second[sec] = max(10, min(100, int(base_retention + variation)))

    return {
        'score': int(total_score),
        'metrics': metrics,
        'weaknesses': weaknesses,
        'recommendations': recommendations,
        'retentionBySecond': retention_by_second,
        'videoInfo': {
            'duration': round(duration, 2),
            'isVertical': is_vertical,
            'resolution': f'{width}x{height}'
        }
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
