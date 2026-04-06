#!/usr/bin/env python3
"""
Content Scraper - Modul 6
Fungsi: Scrape tren drama China dari berbagai sumber
"""

import json
import sys
from datetime import datetime

def get_trending_dramas(keyword='drama china'):
    """Ambil tren drama dari berbagai sumber"""
    trends = []
    
    # Mock data - dalam implementasi nyata, ini akan scrape dari:
    # - Weibo trending
    # - Douyin
    # - Facebook Reels trending
    # - TikTok
    
    mock_trends = [
        {'name': 'The Double - Episode 5 Plot Twist', 'volume': 15234, 'platform': 'Facebook'},
        {'name': 'Love Between Fairy and Devil OST', 'volume': 12456, 'platform': 'TikTok'},
        {'name': 'Xue Fangfei Revenge Scene', 'volume': 9876, 'platform': 'Instagram'},
        {'name': 'Hidden Love - New Episode', 'volume': 8765, 'platform': 'Facebook'},
        {'name': 'Zhang Linghe Interview', 'volume': 7654, 'platform': 'YouTube'}
    ]
    
    for trend in mock_trends:
        trends.append({
            'name': trend['name'],
            'volume': trend['volume'],
            'platform': trend['platform'],
            'timestamp': datetime.now().isoformat()
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
