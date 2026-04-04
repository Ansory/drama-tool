#!/usr/bin/env python3
"""
Subtitle Remover - Modul 3
Fungsi: Deteksi dan hapus hardcoded subtitle menggunakan OCR dan Inpainting
"""

import json
import sys
import cv2
import numpy as np
import easyocr

# Inisialisasi OCR reader
reader = easyocr.Reader(['en', 'zh'])

def detect_subtitle_areas(video_path, sample_interval=30):
    """Deteksi area subtitle dengan OCR"""
    cap = cv2.VideoCapture(video_path)
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    
    # Area yang mungkin berisi subtitle (biasanya bottom 20%)
    subtitle_zone = (0, int(height * 0.8), width, int(height * 0.2))
    
    detected_areas = []
    frame_count = 0
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        
        if frame_count % sample_interval == 0:
            # Crop area subtitle
            x, y, w, h = subtitle_zone
            crop = frame[y:y+h, x:x+w]
            
            # OCR detection
            results = reader.readtext(crop)
            if results:
                for (bbox, text, confidence) in results:
                    if confidence > 0.5 and len(text) > 3:
                        detected_areas.append({
                            'x': bbox[0][0] + x,
                            'y': bbox[0][1] + y,
                            'width': bbox[2][0] - bbox[0][0],
                            'height': bbox[2][1] - bbox[0][1],
                            'text': text,
                            'confidence': confidence
                        })
        
        frame_count += 1
    
    cap.release()
    
    # Merge overlapping areas
    merged = merge_areas(detected_areas)
    return merged

def merge_areas(areas, threshold=10):
    """Gabungkan area yang berdekatan"""
    if not areas:
        return []
    
    merged = []
    areas_sorted = sorted(areas, key=lambda x: (x['y'], x['x']))
    current = areas_sorted[0]
    
    for area in areas_sorted[1:]:
        if (area['y'] - current['y'] - current['height'] < threshold and
            area['x'] - current['x'] - current['width'] < threshold):
            # Merge
            current = {
                'x': min(current['x'], area['x']),
                'y': min(current['y'], area['y']),
                'width': max(current['x'] + current['width'], area['x'] + area['width']) - min(current['x'], area['x']),
                'height': max(current['y'] + current['height'], area['y'] + area['height']) - min(current['y'], area['y'])
            }
        else:
            merged.append(current)
            current = area
    
    merged.append(current)
    return merged

def inpaint_area(frame, area, method='telea'):
    """Inpaint area subtitle"""
    x, y, w, h = area['x'], area['y'], area['width'], area['height']
    mask = np.zeros(frame.shape[:2], dtype=np.uint8)
    mask[y:y+h, x:x+w] = 255
    
    if method == 'telea':
        result = cv2.inpaint(frame, mask, 3, cv2.INPAINT_TELEA)
    else:
        result = cv2.inpaint(frame, mask, 3, cv2.INPAINT_NS)
    
    return result

def remove_subtitles(video_path, output_path, subtitle_areas, algorithm='sttn'):
    """Hapus subtitle dari video"""
    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS)
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        
        for area in subtitle_areas:
            frame = inpaint_area(frame, area)
        
        out.write(frame)
    
    cap.release()
    out.release()
    
    return {'success': True, 'output': output_path}

def main():
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'No command specified'}))
        return
    
    command = sys.argv[1]
    
    if command == 'detect':
        video_path = sys.argv[2]
        areas = detect_subtitle_areas(video_path)
        print(json.dumps(areas))
    
    elif command == 'remove':
        video_path = sys.argv[2]
        output_path = sys.argv[3]
        areas_json = sys.argv[4]
        algorithm = sys.argv[5] if len(sys.argv) > 5 else 'sttn'
        
        areas = json.loads(areas_json)
        result = remove_subtitles(video_path, output_path, areas, algorithm)
        print(json.dumps(result))

if __name__ == '__main__':
    main()
