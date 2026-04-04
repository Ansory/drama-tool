#!/usr/bin/env python3
"""
Comment AI - Modul 26
Fungsi: Klasifikasi dan generate balasan komentar dengan AI
"""

import json
import sys
import random

def classify_comment(comment_text):
    """Klasifikasi jenis komentar"""
    comment_lower = comment_text.lower()
    
    # Deteksi kategori
    if any(word in comment_lower for word in ['apa', 'judul', 'drama', 'episode', 'siapa', 'dimana', 'kapan']):
        category = 'question'
        sentiment = 'neutral'
    elif any(word in comment_lower for word in ['bagus', 'keren', 'mantap', 'suka', 'best', 'recommended']):
        category = 'praise'
        sentiment = 'positive'
    elif any(word in comment_lower for word in ['jelek', 'gak suka', 'boring', 'capek', 'spam']):
        category = 'negative'
        sentiment = 'negative'
    else:
        category = 'general'
        sentiment = 'neutral'
    
    needs_reply = category != 'negative'
    
    return {
        'category': category,
        'sentiment': sentiment,
        'needsReply': needs_reply
    }

def generate_reply(comment_text, style='friendly'):
    """Generate balasan komentar"""
    comment_lower = comment_text.lower()
    
    # Template balasan berdasarkan kategori
    templates = {
        'question': [
            "Judul dramanya adalah [judul] bestie! 😊 Udah nonton episode terbaru? #DramaChina",
            "Oh itu drama [judul]! Rekomended banget, wajib nonton! 🔥",
            "Episode terbaru tayang setiap [hari] ya bestie! Jangan sampai kelewatan! 🎬"
        ],
        'praise': [
            "Makasih banyak bestie! ❤️ Supportnya bikin semangat terus bikin konten!",
            "Aamiin, terima kasih ya! 😊 Share juga ke temen-temen biar pada tau!",
            "Wah makasih bestie! 🙏 Like dan subscribe biar gak ketinggalan update!"
        ],
        'general': [
            "Makasih komennya bestie! 😊 Jangan lupa like dan share ya! #DramaChina",
            "Halo bestie! Makasih sudah nonton. Ada request drama? Komen aja! 🎬",
            "Terima kasih sudah mampir bestie! ❤️ Follow biar gak ketinggalan konten seru!"
        ],
        'negative': []  # Tidak dibalas
    }
    
    category = classify_comment(comment_text)['category']
    
    if category == 'negative':
        return None
    
    reply = random.choice(templates.get(category, templates['general']))
    
    # Replace placeholders
    reply = reply.replace('[judul]', 'The Double')
    reply = reply.replace('[hari]', 'Senin dan Kamis')
    
    return reply

def main():
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'No command specified'}))
        return
    
    command = sys.argv[1]
    text = sys.argv[2] if len(sys.argv) > 2 else ""
    
    if command == 'classify':
        result = classify_comment(text)
        print(json.dumps(result))
    
    elif command == 'generate':
        style = sys.argv[3] if len(sys.argv) > 3 else 'friendly'
        reply = generate_reply(text, style)
        print(json.dumps({
            'reply': reply,
            'confidence': random.randint(70, 95),
            'category': classify_comment(text)['category']
        }))

if __name__ == '__main__':
    main()
