#!/usr/bin/env python3
"""
Watermark Inpainting - Modul 2
Fungsi: Deteksi dan hapus watermark dengan AI inpainting
"""

import json
import sys
import cv2
import numpy as np
from skimage.feature import match_template

def detect_watermark(video_path, template_path=None):
    """Deteksi watermark dalam video"""
    cap = cv2.VideoCapture(video_path)
    
    # Ambil sample frame
    ret, frame = cap.read()
    cap.release()
    
    if not ret:
        return []
    
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    
    # Cari area dengan kecerahan rendah atau pola berulang
    # Ini adalah deteksi sederhana - bisa dikembangkan dengan deep learning
    
    # Deteksi berdasarkan edge density
    edges = cv2.Canny(gray, 50, 150)
    
    # Cari area dengan edge density tinggi (mungkin watermark)
    kernel = np.ones((50, 50), np.float32) / 2500
    edge_density = cv2.filter2D(edges.astype(np.float32), -1, kernel)
    
    _, high_density = cv2.threshold(edge_density, 0.3, 1, cv2.THRESH_BINARY)
    
    # Temukan contours dari area high density
    contours, _ = cv2.findContours(high_density.astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    watermarks = []
    for cnt in contours:
        x, y, w, h = cv2.boundingRect(cnt)
        if w > 50 and h > 20:  # Filter area terlalu kecil
            watermarks.append({
                'x': int(x),
                'y': int(y),
                'width': int(w),
                'height': int(h)
            })
    
    return watermarks

def inpaint_watermark(video_path, output_path, watermark_areas):
    """Hapus watermark dengan inpainting"""
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
        
        # Buat mask untuk area watermark
        mask = np.zeros(frame.shape[:2], dtype=np.uint8)
        for area in watermark_areas:
            x, y, w, h = area['x'], area['y'], area['width'], area['height']
            mask[y:y+h, x:x+w] = 255
        
        # Inpaint
        result = cv2.inpaint(frame, mask, 5, cv2.INPAINT_TELEA)
        out.write(result)
    
    cap.release()
    out.release()
    
    return {'success': True, 'output': output_path}

def add_watermark(video_path, output_path, watermark_path, position='bottom-right', opacity=0.8):
    """Tambahkan watermark ke video"""
    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS)
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    
    # Load watermark
    watermark = cv2.imread(watermark_path, cv2.IMREAD_UNCHANGED)
    if watermark is None:
        return {'error': 'Cannot load watermark image'}
    
    # Resize watermark (maks 15% dari video)
    wm_height = int(height * 0.1)
    wm_width = int(watermark.shape[1] * wm_height / watermark.shape[0])
    watermark = cv2.resize(watermark, (wm_width, wm_height))
    
    # Tentukan posisi
    positions = {
        'top-left': (10, 10),
        'top-right': (width - wm_width - 10, 10),
        'bottom-left': (10, height - wm_height - 10),
        'bottom-right': (width - wm_width - 10, height - wm_height - 10)
    }
    pos = positions.get(position, positions['bottom-right'])
    
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        
        # Overlay watermark
        if watermark.shape[2] == 4:  # With alpha channel
            alpha = watermark[:, :, 3] / 255.0 * opacity
            for c in range(3):
                frame[pos[1]:pos[1]+wm_height, pos[0]:pos[0]+wm_width, c] = \
                    (1 - alpha) * frame[pos[1]:pos[1]+wm_height, pos[0]:pos[0]+wm_width, c] + \
                    alpha * watermark[:, :, c]
        else:
            # No alpha, simple overlay
            roi = frame[pos[1]:pos[1]+wm_height, pos[0]:pos[0]+wm_width]
            blended = cv2.addWeighted(roi, 1 - opacity, watermark, opacity, 0)
            frame[pos[1]:pos[1]+wm_height, pos[0]:pos[0]+wm_width] = blended
        
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
        watermarks = detect_watermark(video_path)
        print(json.dumps(watermarks))
    
    elif command == 'remove':
        video_path = sys.argv[2]
        output_path = sys.argv[3]
        areas_json = sys.argv[4]
        areas = json.loads(areas_json)
        result = inpaint_watermark(video_path, output_path, areas)
        print(json.dumps(result))
    
    elif command == 'add':
        video_path = sys.argv[2]
        output_path = sys.argv[3]
        watermark_path = sys.argv[4]
        position = sys.argv[5] if len(sys.argv) > 5 else 'bottom-right'
        opacity = float(sys.argv[6]) if len(sys.argv) > 6 else 0.8
        result = add_watermark(video_path, output_path, watermark_path, position, opacity)
        print(json.dumps(result))

if __name__ == '__main__':
    main()
