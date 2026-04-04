"""
Gemini API Load Balancer
Mengelola ratusan API key, auto failover saat kena rate limit
"""

import json
import sqlite3
import time
import threading
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import requests
from pathlib import Path

class GeminiLoadBalancer:
    def __init__(self, db_path: str = None):
        if db_path is None:
            db_path = Path.home() / 'Documents/DramaTool/database/api_keys.db'
        
        self.db_path = db_path
        self._init_database()
        self._lock = threading.Lock()
        self.current_index = 0
        
    def _init_database(self):
        """Initialize SQLite database untuk API keys"""
        Path(self.db_path).parent.mkdir(parents=True, exist_ok=True)
        
        self.conn = sqlite3.connect(self.db_path, check_same_thread=False)
        self.cursor = self.conn.cursor()
        
        # Tabel API keys
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS api_keys (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                key_value TEXT UNIQUE NOT NULL,
                key_name TEXT,
                status TEXT DEFAULT 'active',
                daily_usage INTEGER DEFAULT 0,
                daily_limit INTEGER DEFAULT 1000000,
                minute_usage INTEGER DEFAULT 0,
                minute_limit INTEGER DEFAULT 60000,
                fail_count INTEGER DEFAULT 0,
                last_used TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Tabel usage log
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS key_usage_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                key_id INTEGER,
                request_type TEXT,
                tokens_used INTEGER,
                status TEXT,
                response_time_ms INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (key_id) REFERENCES api_keys(id)
            )
        ''')
        
        # Tabel untuk reset quota harian
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS daily_reset_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                reset_date DATE,
                keys_reset INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        self.conn.commit()
    
    def add_api_key(self, api_key: str, name: str = None) -> int:
        """Tambah API key baru"""
        with self._lock:
            try:
                self.cursor.execute('''
                    INSERT INTO api_keys (key_value, key_name, status)
                    VALUES (?, ?, 'active')
                ''', (api_key, name or f"Key_{int(time.time())}"))
                self.conn.commit()
                return self.cursor.lastrowid
            except sqlite3.IntegrityError:
                return None
    
    def add_multiple_keys(self, keys: List[Dict]) -> int:
        """Tambah banyak API key sekaligus"""
        added = 0
        for key in keys:
            result = self.add_api_key(key.get('key'), key.get('name'))
            if result:
                added += 1
        return added
    
    def get_active_keys(self) -> List[Dict]:
        """Ambil semua API key yang aktif"""
        self.cursor.execute('''
            SELECT id, key_value, key_name, status, daily_usage, daily_limit,
                   minute_usage, minute_limit, fail_count, last_used
            FROM api_keys 
            WHERE status = 'active'
            ORDER BY fail_count ASC, last_used ASC NULLS FIRST
        ''')
        
        keys = []
        for row in self.cursor.fetchall():
            keys.append({
                'id': row[0],
                'key': row[1],
                'name': row[2],
                'status': row[3],
                'daily_usage': row[4],
                'daily_limit': row[5],
                'minute_usage': row[6],
                'minute_limit': row[7],
                'fail_count': row[8],
                'last_used': row[9]
            })
        return keys
    
    def get_next_key(self, strategy: str = 'round_robin') -> Optional[Dict]:
        """Ambil key berikutnya berdasarkan strategi"""
        active_keys = self.get_active_keys()
        
        if not active_keys:
            return None
        
        if strategy == 'round_robin':
            with self._lock:
                self.current_index = (self.current_index + 1) % len(active_keys)
                return active_keys[self.current_index]
        
        elif strategy == 'least_used':
            return min(active_keys, key=lambda k: k.get('daily_usage', 0))
        
        elif strategy == 'priority':
            return min(active_keys, key=lambda k: k.get('fail_count', 0))
        
        else:  # random
            import random
            return random.choice(active_keys)
    
    def mark_key_limited(self, key_id: int):
        """Tandai key kena rate limit"""
        with self._lock:
            self.cursor.execute('''
                UPDATE api_keys 
                SET status = 'limited', 
                    fail_count = fail_count + 1,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            ''', (key_id,))
            self.conn.commit()
    
    def mark_key_active(self, key_id: int):
        """Reactivate key yang sebelumnya limited"""
        with self._lock:
            self.cursor.execute('''
                UPDATE api_keys 
                SET status = 'active',
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            ''', (key_id,))
            self.conn.commit()
    
    def update_usage(self, key_id: int, tokens_used: int, success: bool):
        """Update usage tracking"""
        with self._lock:
            if success:
                self.cursor.execute('''
                    UPDATE api_keys 
                    SET daily_usage = daily_usage + ?,
                        minute_usage = minute_usage + ?,
                        last_used = CURRENT_TIMESTAMP,
                        fail_count = 0
                    WHERE id = ?
                ''', (tokens_used, tokens_used, key_id))
            else:
                self.cursor.execute('''
                    UPDATE api_keys 
                    SET fail_count = fail_count + 1
                    WHERE id = ?
                ''', (key_id,))
            
            # Log usage
            self.cursor.execute('''
                INSERT INTO key_usage_log (key_id, tokens_used, status)
                VALUES (?, ?, ?)
            ''', (key_id, tokens_used, 'success' if success else 'failed'))
            
            self.conn.commit()
    
    def call_gemini_with_failover(self, prompt: str, model: str = 'gemini-1.5-flash',
                                   max_retries: int = None) -> Dict:
        """Panggil Gemini API dengan auto failover ke key berikutnya"""
        if max_retries is None:
            active_keys = self.get_active_keys()
            max_retries = len(active_keys)
        
        last_error = None
        
        for attempt in range(max_retries):
            key = self.get_next_key()
            if not key:
                raise Exception("No active API keys available")
            
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key['key']}"
            
            payload = {
                "contents": [{
                    "parts": [{"text": prompt}]
                }]
            }
            
            start_time = time.time()
            
            try:
                response = requests.post(url, json=payload, timeout=30)
                response_time = int((time.time() - start_time) * 1000)
                
                if response.status_code == 200:
                    result = response.json()
                    tokens_used = result.get('usageMetadata', {}).get('totalTokenCount', 0)
                    self.update_usage(key['id'], tokens_used, True)
                    
                    return {
                        'success': True,
                        'text': result['candidates'][0]['content']['parts'][0]['text'],
                        'usage': tokens_used,
                        'key_id': key['id'],
                        'response_time': response_time
                    }
                
                elif response.status_code == 429:
                    # Rate limit, tandai key dan coba yang lain
                    self.mark_key_limited(key['id'])
                    last_error = f"Rate limit on key {key['id']}"
                    continue
                
                else:
                    # Error lain
                    self.update_usage(key['id'], 0, False)
                    last_error = f"API Error {response.status_code}: {response.text}"
                    continue
                    
            except requests.exceptions.Timeout:
                last_error = f"Timeout on key {key['id']}"
                continue
            except Exception as e:
                last_error = str(e)
                continue
        
        raise Exception(f"All API keys failed: {last_error}")
    
    def auto_reactivate_keys(self):
        """Cek dan reactivate key yang sudah pulih dari rate limit"""
        # Reset daily usage at midnight
        now = datetime.now()
        if now.hour == 0 and now.minute < 5:  # After midnight
            self.cursor.execute('''
                UPDATE api_keys 
                SET daily_usage = 0,
                    minute_usage = 0,
                    updated_at = CURRENT_TIMESTAMP
            ''')
            self.conn.commit()
        
        # Reactivate keys that were limited more than 1 hour ago
        self.cursor.execute('''
            UPDATE api_keys 
            SET status = 'active'
            WHERE status = 'limited' 
            AND julianday('now') - julianday(updated_at) > 1.0/24
        ''')
        self.conn.commit()
    
    def get_stats(self) -> Dict:
        """Dapatkan statistik semua API keys"""
        self.cursor.execute('''
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
                SUM(CASE WHEN status = 'limited' THEN 1 ELSE 0 END) as limited,
                SUM(daily_usage) as total_daily_usage,
                AVG(daily_usage) as avg_daily_usage
            FROM api_keys
        ''')
        
        row = self.cursor.fetchone()
        return {
            'total_keys': row[0] or 0,
            'active_keys': row[1] or 0,
            'limited_keys': row[2] or 0,
            'total_daily_usage': row[3] or 0,
            'avg_daily_usage': row[4] or 0
        }


# CLI untuk testing
if __name__ == '__main__':
    import sys
    
    lb = GeminiLoadBalancer()
    
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == 'add':
            key = sys.argv[2]
            name = sys.argv[3] if len(sys.argv) > 3 else None
            result = lb.add_api_key(key, name)
            print(f"Added key ID: {result}")
        
        elif command == 'list':
            keys = lb.get_active_keys()
            print(json.dumps(keys, indent=2))
        
        elif command == 'stats':
            stats = lb.get_stats()
            print(json.dumps(stats, indent=2))
        
        elif command == 'test':
            key = sys.argv[2]
            try:
                result = lb.call_gemini_with_failover("Say 'Hello'", max_retries=1)
                print(json.dumps(result, indent=2))
            except Exception as e:
                print(f"Error: {e}")
        
        else:
            print("Commands: add, list, stats, test")
    else:
        print("Gemini Load Balancer - CLI")
        print("Usage: python gemini_load_balancer.py [add|list|stats|test]")