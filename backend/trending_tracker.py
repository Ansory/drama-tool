#!/usr/bin/env python3
"""
Trending Tracker - Modul 8 & 10
Fungsi: Track trending audio, hashtag, dan konten viral
"""

import json
import sys
from datetime import datetime, timedelta
import hashlib

def get_trending_audio():
    """Dapatkan daftar backsound yang sedang viral"""
    # Static trending audio list (would be updated from API in production)
    trending_audio = [
        {'name': 'See Tinh (remix)', 'usageCount': 15234, 'platform': 'TikTok'},
        {'name': 'Drama China OST Compilation', 'usageCount': 12456, 'platform': 'Instagram'},
        {'name': 'Sad Piano - Emotional', 'usageCount': 9876, 'platform': 'Facebook'},
        {'name': 'Epic Battle Music', 'usageCount': 8765, 'platform': 'YouTube Shorts'},
        {'name': 'Romantic Chinese Ballad', 'usageCount': 7654, 'platform': 'Facebook'}
    ]
    return trending_audio

def get_hashtag_suggestions(keyword):
    """Rekomendasi hashtag berdasarkan keyword"""
    # Generate deterministic suggestions based on keyword
    keyword_clean = keyword.replace(" ", "")

    suggestions = [
        f'#{keyword_clean}',
        f'#{keyword_clean}SubIndo',
        f'#{keyword_clean}FYP',
        f'#{keyword_clean}Viral',
        f'#{keyword_clean}Scene',
    ]

    # Add general drama hashtags
    general_hashtags = [
        '#DramaChina',
        '#ChineseDrama',
        '#FYP',
        '#ReelsDrama',
        '#DrakorChina'
    ]

    # Combine and return unique hashtags
    all_suggestions = suggestions + general_hashtags
    return list(dict.fromkeys(all_suggestions))[:10]  # Remove duplicates, max 10

def get_viral_content():
    """Dapatkan konten yang sedang viral"""
    # Use current hour to create pseudo-dynamic trending content
    # This simulates changing trends throughout the day
    current_hour = datetime.now().hour

    viral_content = [
        {
            'name': 'The Double - Plot Twist Episode 5',
            'volume': 15234 + (current_hour * 100),
            'score': 95,
            'expiryTime': (datetime.now() + timedelta(hours=6)).timestamp() * 1000
        },
        {
            'name': 'Xue Fangfei Revenge Scene',
            'volume': 12456 + (current_hour * 80),
            'score': 92,
            'expiryTime': (datetime.now() + timedelta(hours=8)).timestamp() * 1000
        },
        {
            'name': 'Sad Scene with OST - Hidden Love',
            'volume': 9876 + (current_hour * 60),
            'score': 88,
            'expiryTime': (datetime.now() + timedelta(hours=4)).timestamp() * 1000
        }
    ]
    return viral_content

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
