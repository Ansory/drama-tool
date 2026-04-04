#!/usr/bin/env python3
"""
Copyright Checker - Modul 16-20
Fungsi: Cek hak cipta dan originalitas konten
"""

import json
import sys
import random

def check_copyright(video_path):
    """Cek potensi pelanggaran hak cipta"""
    # Placeholder - implementasi nyata dengan audio fingerprinting
    
    # Simulasi hasil cek
    risk_score = random.randint(0, 100)
    
    result = {
        "riskScore": risk_score,
        "audioMatch": risk_score > 70,
        "videoMatch": risk_score > 80,
        "watermarkDetected": random.choice([True, False]),
        "fairUseScore": min(100, max(0, 100 - risk_score + 20)),
        "recommendation": ""
    }
    
    if risk_score > 80:
        result["recommendation"] = "⚠️ Risiko tinggi! Tambahkan voiceover atau crop lebih banyak."
    elif risk_score > 50:
        result["recommendation"] = "🟡 Risiko sedang. Disarankan tambahkan voiceover."
    else:
        result["recommendation"] = "✅ Video aman untuk diupload."
    
    return result

def check_originality(video_path):
    """Cek tingkat originalitas konten"""
    # Placeholder
    
    result = {
        "score": random.randint(40, 95),
        "hasVoiceover": random.choice([True, False]),
        "hasEdits": True,
        "uniqueContent": random.randint(30, 90),
        "recommendation": ""
    }
    
    if result["score"] < 50:
        result["recommendation"] = "⚠️ Originalitas rendah. Tambahkan voiceover asli dan edit lebih banyak."
    elif result["score"] < 70:
        result["recommendation"] = "🟡 Cukup original. Tambahkan narasi atau efek untuk meningkatkan skor."
    else:
        result["recommendation"] = "✅ Konten original! Siap untuk diupload."
    
    return result

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No command specified"}))
        return
    
    command = sys.argv[1]
    video_path = sys.argv[2] if len(sys.argv) > 2 else ""
    
    if command == "check":
        result = check_copyright(video_path)
        print(json.dumps(result))
    
    elif command == "originality":
        result = check_originality(video_path)
        print(json.dumps(result))

if __name__ == "__main__":
    main()
