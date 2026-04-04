#!/usr/bin/env python3
"""
Trending Tracker - Modul 8 & 10
Fungsi: Track trending audio, hashtag, dan konten viral
"""

import json
import sys
from datetime import datetime, timedelta

def get_trending_audio():
    """Dapatkan daftar backsound yang sedang viral"""
    mock_audio = [
        {'name': 'See Tinh (remix)', 'usageCount': 15234, 'platform': 'TikTok'},
        {'name': 'Drama China OST Compilation', 'usageCount': 12456, 'platform': 'Instagram'},
        {'name': 'Sad Piano - Emotional', 'usageCount': 9876, 'platform': 'Facebook'},
        {'name': 'Epic Battle Music', 'usageCount': 8765, 'platform': 'YouTube Shorts'},
        {'name': 'Romantic Chinese Ballad', 'usageCount': 7654, 'platform': 'Facebook'}
    ]
    return mock_audio

def get_hashtag_suggestions(keyword):
    """Rekomendasi hashtag berdasarkan keyword"""
    mock_suggestions = [
        f'#{keyword.replace(" ", "")}',
        f'#{keyword.replace(" ", "")}SubIndo',
        f'#{keyword.replace(" ", "")}FYP',
        f'#{keyword.replace(" ", "")}Viral',
        f'#{keyword.replace(" ", "")}Scene',
        '#DramaChina',
        '#ChineseDrama',
        '#FYP',
        '#ReelsDrama',
        '#DrakorChina'
    ]
    return mock_suggestions[:10]

def get_viral_content():
    """Dapatkan konten yang sedang viral"""
    mock_viral = [
        {
            'name': 'The Double - Plot Twist Episode 5',
            'volume': 15234,
            'score': 95,
            'expiryTime': (datetime.now() + timedelta(hours=6)).timestamp() * 1000
        },
        {
            'name': 'Xue Fangfei Revenge Scene',
            'volume': 12456,
            'score': 92,
            'expiryTime': (datetime.now() + timedelta(hours=8)).timestamp() * 1000
        },
        {
            'name': 'Sad Scene with OST - Hidden Love',
            'volume': 9876,
            'score': 88,
            'expiryTime': (datetime.now() + timedelta(hours=4)).timestamp() * 1000
        }
    ]
    return mock_viral

def main():
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'No command specified'}))
        return
    
    command = sys.argv[1]
    
    if command == 'audio':
        audio = get_trending_audio()
        print(json.dumps(audio))
    
    elif command == 'hashtag':
        keyword = sys.argv[2] if len(sys.argv) > 2 else 'drama'
        suggestions = get_hashtag_suggestions(keyword)
        print(json.dumps(suggestions))
    
    elif command == 'viral':
        viral = get_viral_content()
        print(json.dumps(viral))

if __name__ == '__main__':
    main()
