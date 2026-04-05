#!/usr/bin/env python3
"""
Auto Content Generator - Backend
Analisis video dan generate judul, caption, hashtag otomatis via Gemini AI
"""

import json
import sys
import os
import cv2
import numpy as np
from pathlib import Path

# Import load balancer yang sudah ada
sys.path.insert(0, str(Path(__file__).parent))
try:
    from gemini_load_balancer import GeminiLoadBalancer
    lb = GeminiLoadBalancer()
    HAS_GEMINI = True
except Exception as e:
    HAS_GEMINI = False
    lb = None


def extract_video_metadata(video_path):
    """Analisis video untuk konteks AI"""
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return {}

    fps        = cap.get(cv2.CAP_PROP_FPS)
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    width      = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height     = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    duration   = frame_count / fps if fps > 0 else 0

    # Sample beberapa frame untuk analisis visual
    sample_frames = []
    sample_points = [0.1, 0.3, 0.5, 0.7, 0.9]

    for point in sample_points:
        cap.set(cv2.CAP_PROP_POS_FRAMES, int(frame_count * point))
        ret, frame = cap.read()
        if ret:
            sample_frames.append(frame)

    cap.release()

    # Hitung rata-rata brightness (scene gelap/terang)
    brightness = 0
    if sample_frames:
        gray_frames = [cv2.cvtColor(f, cv2.COLOR_BGR2GRAY) for f in sample_frames]
        brightness = int(np.mean([np.mean(g) for g in gray_frames]))

    # Deteksi motion (action vs dialog)
    motion_score = 0
    if len(sample_frames) > 1:
        diffs = []
        for i in range(1, len(sample_frames)):
            diff = cv2.absdiff(sample_frames[i-1], sample_frames[i])
            diffs.append(np.mean(diff))
        motion_score = int(np.mean(diffs))

    # Aspect ratio
    is_vertical = height > width
    aspect = f"{width}x{height}"

    return {
        'duration': round(duration, 1),
        'fps': round(fps, 1),
        'resolution': aspect,
        'is_vertical': is_vertical,
        'brightness': brightness,      # 0-255, < 80 = gelap/dramatis
        'motion_score': motion_score,  # > 30 = action, < 10 = dialog
        'frame_count': frame_count
    }


def detect_scene_type(metadata):
    """Deteksi jenis scene dari metadata video"""
    motion  = metadata.get('motion_score', 0)
    bright  = metadata.get('brightness', 128)
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
    duration   = metadata.get('duration', 30)
    is_vertical = metadata.get('is_vertical', True)
    scene_type = detect_scene_type(metadata)

    # Override scene type jika user kasih hint
    if scene_hint and scene_hint != 'auto':
        scene_type = scene_hint

    scene_labels = {
        'action':          'adegan action/pertarungan seru',
        'sad_dramatic':    'adegan sedih/haru/menangis',
        'romantic_bright': 'adegan romantis/sweet moment',
        'plot_twist':      'plot twist mengejutkan',
        'drama_general':   'adegan drama menarik',
        'confrontation':   'konfrontasi/tamparan balik',
        'comedy':          'adegan lucu/kocak'
    }

    scene_label = scene_labels.get(scene_type, 'adegan drama')

    platform_notes = {
        'facebook':  'Facebook Reels (max caption 2200 karakter, 30 hashtag)',
        'instagram': 'Instagram Reels (max caption 2200 karakter, 30 hashtag)',
        'tiktok':    'TikTok (caption singkat, max 150 karakter)',
        'youtube':   'YouTube Shorts (judul max 100 karakter, deskripsi panjang ok)'
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
  "best_post_time": "HH:MM WIB",
  "scene_type": "{scene_type}",
  "viral_tips": ["tip1 untuk maksimalkan jangkauan", "tip2", "tip3"],
  "thumbnail_text": "teks singkat max 5 kata untuk overlay thumbnail"
}}

Aturan penting:
- Judul harus memancing rasa penasaran, pakai angka/pertanyaan/cliffhanger
- Caption harus natural bahasa Indonesia sehari-hari (bukan formal)
- Hashtag mix: drama spesifik + genre + trending (#FYP #DramaChina dll)
- Best post time berdasarkan peak engagement Indonesia (biasanya 19:00-21:00 WIB)
- Semua teks dalam Bahasa Indonesia"""

    return prompt


def generate_content(video_path, drama_name='', scene_hint='auto', platform='facebook'):
    """Main function: analisis video + generate konten dengan AI"""

    # 1. Analisis video
    metadata = extract_video_metadata(video_path)
    if not metadata:
        return {'error': 'Tidak dapat membaca file video'}

    # 2. Fallback jika Gemini tidak tersedia
    if not HAS_GEMINI or lb is None:
        return generate_fallback(metadata, drama_name, scene_hint)

    # 3. Cek apakah ada API key aktif
    active_keys = lb.get_active_keys()
    if not active_keys:
        return {'error': 'Tidak ada Gemini API key aktif. Tambahkan key di Load Balancer.', 'needs_key': True}

    # 4. Build prompt dan panggil Gemini
    prompt = build_prompt(metadata, drama_name, scene_hint, platform)

    try:
        result = lb.call_gemini_with_failover(prompt, model='gemini-1.5-flash')

        if not result.get('success'):
            return generate_fallback(metadata, drama_name, scene_hint)

        # Parse JSON response
        text = result['text'].strip()

        # Bersihkan markdown code block jika ada
        if '```json' in text:
            text = text.split('```json')[1].split('```')[0].strip()
        elif '```' in text:
            text = text.split('```')[1].split('```')[0].strip()

        content = json.loads(text)

        # Tambahkan metadata
        content['metadata'] = metadata
        content['generated_by'] = 'gemini'
        content['tokens_used'] = result.get('usage', 0)

        return content

    except json.JSONDecodeError:
        # Gemini response tidak valid JSON, pakai fallback
        return generate_fallback(metadata, drama_name, scene_hint)
    except Exception as e:
        return {'error': str(e), 'fallback': generate_fallback(metadata, drama_name, scene_hint)}


def generate_fallback(metadata, drama_name='', scene_hint='auto'):
    """Fallback template jika Gemini tidak tersedia"""
    scene_type = detect_scene_type(metadata) if scene_hint == 'auto' else scene_hint
    name = drama_name or 'Drama China'

    templates = {
        'action': {
            'titles': [
                f'🔥 Scene Action Paling Epic di {name}! Bikin Merinding!',
                f'⚔️ {name} - Pertarungan yang Gak Akan Terlupakan!',
                f'Adegan Paling Seru {name} yang Bikin Jantung Deg-degan!'
            ],
            'caption_short': f'Scene action {name} ini bikin deg-degan banget! 😱🔥',
            'caption_long': f'Adegan action di {name} ini benar-benar di luar ekspektasi bestie! Setiap gerakan terasa sangat intens dan penuh emosi. Kalau kamu suka drama action China, wajib banget nonton ini! Drop 🔥 di kolom komentar kalau kamu setuju!',
            'hashtags': ['#DramaChina', '#ChineseDrama', f'#{name.replace(" ","")}', '#FYP', '#ActionScene', '#DramaAction', '#ViralDrama', '#ReelsDrama', '#DrakorChina', '#Trending'],
            'thumbnail_text': 'SCENE PALING EPIC!'
        },
        'sad_dramatic': {
            'titles': [
                f'😭 Scene Paling Sedih {name} - Siapkan Tisu!',
                f'Adegan Haru {name} yang Bikin Nangis Semalaman',
                f'{name} - Plot Twist yang Bikin Patah Hati!'
            ],
            'caption_short': f'Scene ini dari {name} bikin nangis tiap kali nonton... 😭💔',
            'caption_long': f'Bestie, scene ini dari {name} benar-benar heartbreaking banget. Setiap kali nontonnya rasanya ikut ngerasain kesedihan karakternya. Kalau kamu punya hati, pasti bakal nangis nonton ini! Siapkan tisu dulu ya... 😭 Like kalau kamu juga nangis!',
            'hashtags': ['#DramaChina', '#SadScene', f'#{name.replace(" ","")}', '#FYP', '#Nangis', '#Haru', '#DramaRomance', '#ChineseDrama', '#ViralDrama', '#DramaRecommendation'],
            'thumbnail_text': 'BIKIN NANGIS!'
        },
        'romantic_bright': {
            'titles': [
                f'💕 Momen Romantis Paling Manis di {name}!',
                f'{name} - Sweet Moment yang Bikin Baper Parah!',
                f'❤️ Adegan Romantis {name} Bikin Pengen Punya Pacar!'
            ],
            'caption_short': f'Momen romantis di {name} ini bikin baper level dewa! 💕😍',
            'caption_long': f'Bestie kalau belum nonton {name} rugi banget! Scene romantis ini benar-benar bikin baper parah, chemistry antara dua karakternya off the chart! 💕 Kalau kamu suka drama romance China, ini wajib masuk watchlist! Share ke temen yang butuh referensi drama bagus!',
            'hashtags': ['#DramaChina', '#RomanceScene', f'#{name.replace(" ","")}', '#FYP', '#Baper', '#SweetMoment', '#ChineseDrama', '#DramaRomance', '#ViralDrama', '#Recommend'],
            'thumbnail_text': 'MOMEN PALING BAPER!'
        },
        'plot_twist': {
            'titles': [
                f'😱 Plot Twist {name} yang Gak Ada yang Nebak!',
                f'HAAAH?! Ending {name} Episode Ini Bikin Shock!',
                f'{name} - Plot Twist Paling Gila yang Pernah Ada!'
            ],
            'caption_short': f'Plot twist {name} ini literally gak ada yang bisa nebak! 😱🤯',
            'caption_long': f'SPOILER ALERT! Plot twist di {name} ini benar-benar gak ada yang nyangka bestie! Dari awal udah curiga tapi ternyata... Ya Allah plotnya seteriak ini! 😱 Kalau belum nonton, langsung search sekarang! Drop 🤯 kalau kamu juga kaget!',
            'hashtags': ['#PlotTwist', f'#{name.replace(" ","")}', '#DramaChina', '#FYP', '#Spoiler', '#Kaget', '#ChineseDrama', '#ViralDrama', '#DramaTwist', '#MustWatch'],
            'thumbnail_text': 'PLOT TWIST GILA!'
        },
        'drama_general': {
            'titles': [
                f'🎭 Scene Terbaik {name} yang Wajib Ditonton!',
                f'{name} - Kenapa Drama Ini Bikin Ketagihan?',
                f'Adegan {name} yang Bikin Susah Move On!'
            ],
            'caption_short': f'Drama {name} ini emang gak ada obatnya, selalu bikin ketagihan! 🎭',
            'caption_long': f'Bestie, {name} ini benar-benar drama yang worth it banget buat ditonton! Setiap episodenya penuh kejutan dan bikin susah berhenti. Kalau kamu suka drama China berkualitas, langsung cek ini! Follow untuk update scene-scene seru lainnya! 🎬',
            'hashtags': ['#DramaChina', f'#{name.replace(" ","")}', '#FYP', '#ChineseDrama', '#DramaRecommendation', '#ViralDrama', '#DrakorChina', '#WajibNonton', '#Reels', '#Trending'],
            'thumbnail_text': 'WAJIB NONTON!'
        }
    }

    template = templates.get(scene_type, templates['drama_general'])

    return {
        **template,
        'best_post_time': '20:00',
        'scene_type': scene_type,
        'viral_tips': [
            'Upload di jam 19:00-21:00 WIB untuk jangkauan maksimal',
            'Tambahkan voiceover asli untuk meningkatkan originalitas',
            'Pin komentar dengan link full episode'
        ],
        'metadata': metadata,
        'generated_by': 'template',
        'needs_key': False
    }


def main():
    if len(sys.argv) < 3:
        print(json.dumps({'error': 'Usage: generate <video_path> [drama_name] [scene_hint] [platform]'}))
        return

    command    = sys.argv[1]
    video_path = sys.argv[2]
    drama_name = sys.argv[3] if len(sys.argv) > 3 else ''
    scene_hint = sys.argv[4] if len(sys.argv) > 4 else 'auto'
    platform   = sys.argv[5] if len(sys.argv) > 5 else 'facebook'

    if command == 'generate':
        if not os.path.exists(video_path):
            print(json.dumps({'error': f'File tidak ditemukan: {video_path}'}))
            return
        result = generate_content(video_path, drama_name, scene_hint, platform)
        print(json.dumps(result, ensure_ascii=False))

    elif command == 'metadata':
        meta = extract_video_metadata(video_path)
        print(json.dumps(meta))

if __name__ == '__main__':
    main()
