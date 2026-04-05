#!/usr/bin/env python3
"""
Social Listening - Modul 28
Fungsi: Analisis sentimen dan tracking keyword
"""

import json
import sys
from collections import Counter

def analyze_sentiment(comments):
    """Analisis sentimen komentar"""
    positive_words = ['bagus', 'keren', 'mantap', 'suka', 'best', 'recommended', 'lucu', 'seru', 'kereen']
    negative_words = ['jelek', 'gak suka', 'boring', 'capek', 'spam', 'kurang', 'pendek', 'cepetan']
    
    positive_count = 0
    negative_count = 0
    neutral_count = 0
    all_words = []
    
    for comment in comments:
        comment_lower = comment.lower()
        words = comment_lower.split()
        all_words.extend(words)
        
        if any(word in comment_lower for word in positive_words):
            positive_count += 1
        elif any(word in comment_lower for word in negative_words):
            negative_count += 1
        else:
            neutral_count += 1
    
    total = len(comments)
    if total == 0:
        return {
            'positive': 0,
            'neutral': 0,
            'negative': 0,
            'topKeywords': [],
            'crisisDetected': False
        }
    
    # Hitung kata terbanyak
    word_counts = Counter(all_words)
    top_keywords = [word for word, count in word_counts.most_common(10) if len(word) > 3]
    
    # Deteksi krisis (lebih dari 20% komentar negatif)
    crisis_detected = (negative_count / total) > 0.2
    
    return {
        'positive': round(positive_count / total * 100),
        'neutral': round(neutral_count / total * 100),
        'negative': round(negative_count / total * 100),
        'topKeywords': top_keywords[:10],
        'crisisDetected': crisis_detected
    }

def main():
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'No command specified'}))
        return
    
    command = sys.argv[1]
    
    if command == 'sentiment':
        comments_json = sys.argv[2] if len(sys.argv) > 2 else '[]'
        try:
            comments = json.loads(comments_json)
        except:
            comments = []
        result = analyze_sentiment(comments)
        print(json.dumps(result))

if __name__ == '__main__':
    main()
