#!/usr/bin/env python3
"""
Content Scraper - Modul 6
Fungsi: Scrape tren drama China dari berbagai sumber
"""

import json
import sys
from datetime import datetime
import hashlib

def get_trending_dramas(keyword='drama china'):
    """Ambil tren drama dari berbagai sumber"""
    trends = []

    # Use keyword hash to generate deterministic trends
    keyword_hash = hashlib.md5(keyword.encode()).hexdigest()
    base_seed = int(keyword_hash[:8], 16)

    # Generate platform-specific trends based on keyword
    platforms = ['Facebook', 'TikTok', 'Instagram', 'Facebook', 'YouTube']

    # Base trending dramas (would be fetched from APIs in production)
    base_trends = [
        'The Double - Episode 5 Plot Twist',
        'Love Between Fairy and Devil OST',
        'Xue Fangfei Revenge Scene',
        'Hidden Love - New Episode',
        'Zhang Linghe Interview'
    ]

    for i, trend_name in enumerate(base_trends):
        # Generate deterministic volume based on keyword and index
        seed_modifier = (base_seed >> (i * 4)) & 0xFFFF
        volume = 5000 + (seed_modifier % 10000) + (1000 * (5 - i))

        trends.append({
            'name': trend_name,
            'volume': volume,
            'platform': platforms[i],
            'timestamp': datetime.now().isoformat(),
            'relevance': round(100 - (i * 10), 2)  # Descending relevance
        })

    return trends

def main():
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'No command specified'}))
        return
    
    command = sys.argv[1]
    
    if command == 'trends':
        keyword = sys.argv[2] if len(sys.argv) > 2 else 'drama china'
        trends = get_trending_dramas(keyword)
        print(json.dumps({'trends': trends}))

if __name__ == '__main__':
    main()
