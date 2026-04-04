"""
Gemini API Load Balancer
Mengelola ratusan API key, auto failover saat kena rate limit
FIXED: thread-safe, connection pool, auto-scheduler, minute usage reset
"""

import json
import sqlite3
import time
import threading
import schedule
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import requests
from pathlib import Path


class ConnectionPool:
    """Thread-safe SQLite connection pool"""

    def __init__(self, db_path: str, pool_size: int = 5):
        self.db_path = db_path
        self._pool = []
        self._lock = threading.Lock()
        for _ in range(pool_size):
            conn = sqlite3.connect(db_path, check_same_thread=False)
            conn.row_factory = sqlite3.Row
            self._pool.append(conn)

    def get_connection(self):
        with self._lock:
            if self._pool:
                return self._pool.pop()
            # Buat koneksi baru jika pool habis
            conn = sqlite3.connect(self.db_path, check_same_thread=False)
            conn.row_factory = sqlite3.Row
            return conn

    def return_connection(self, conn):
        with self._lock:
            self._pool.append(conn)

    def close_all(self):
        with self._lock:
            for conn in self._pool:
                conn.close()
            self._pool.clear()


class GeminiLoadBalancer:

    def __init__(self, db_path: str = None):
        if db_path is None:
            db_path = str(Path.home() / 'Documents/DramaTool/database/api_keys.db')

        self.db_path = db_path
        Path(db_path).parent.mkdir(parents=True, exist_ok=True)

        # FIXED: Gunakan connection pool agar thread-safe
        self._pool = ConnectionPool(db_path, pool_size=5)
        self._lock = threading.Lock()
        self.current_index = 0

        self._init_database()
        self._start_scheduler()

    def _init_database(self):
        """Initialize SQLite database untuk API keys"""
        conn = self._pool.get_connection()
        try:
            cursor = conn.cursor()
            cursor.execute('''
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
                    limited_at TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            cursor.execute('''
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
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS daily_reset_log (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    reset_date DATE,
                    keys_reset INTEGER,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            conn.commit()
        finally:
            self._pool.return_connection(conn)

    # -------------------------------------------------------------------------
    # FIXED: Scheduler otomatis untuk reset & reactivate
    # -------------------------------------------------------------------------

    def _start_scheduler(self):
        """Jalankan background thread untuk reset harian dan reactivate per menit"""
        def run_scheduler():
            # Reset daily usage setiap tengah malam
            schedule.every().day.at("00:00").do(self._reset_daily_usage)
            # FIXED: Reset minute_usage setiap 1 menit
            schedule.every(1).minutes.do(self._reset_minute_usage)
            # Cek reactivate key setiap 5 menit
            schedule.every(5).minutes.do(self._reactivate_limited_keys)

            while True:
                schedule.run_pending()
                time.sleep(10)

        thread = threading.Thread(target=run_scheduler, daemon=True)
        thread.start()

    def _reset_daily_usage(self):
        """Reset daily usage semua key pada tengah malam"""
        conn = self._pool.get_connection()
        try:
            cursor = conn.cursor()
            cursor.execute('''
                UPDATE api_keys SET daily_usage = 0, updated_at = CURRENT_TIMESTAMP
            ''')
            keys_reset = cursor.rowcount
            cursor.execute('''
                INSERT INTO daily_reset_log (reset_date, keys_reset)
                VALUES (DATE('now'), ?)
            ''', (keys_reset,))
            conn.commit()
        finally:
            self._pool.return_connection(conn)

    def _reset_minute_usage(self):
        """FIXED: Reset minute_usage setiap 1 menit (sebelumnya tidak pernah di-reset)"""
        conn = self._pool.get_connection()
        try:
            cursor = conn.cursor()
            cursor.execute('''
                UPDATE api_keys SET minute_usage = 0, updated_at = CURRENT_TIMESTAMP
            ''')
            conn.commit()
        finally:
            self._pool.return_connection(conn)

    def _reactivate_limited_keys(self):
        """FIXED: Reactivate key yang sudah 1 jam kena rate limit (sebelumnya tidak pernah dipanggil)"""
        conn = self._pool.get_connection()
        try:
            cursor = conn.cursor()
            cursor.execute('''
                UPDATE api_keys
                SET status = 'active', updated_at = CURRENT_TIMESTAMP
                WHERE status = 'limited'
                AND limited_at IS NOT NULL
                AND julianday('now') - julianday(limited_at) > 1.0/24
            ''')
            conn.commit()
        finally:
            self._pool.return_connection(conn)

    # -------------------------------------------------------------------------
    # CRUD API Keys
    # -------------------------------------------------------------------------

    def add_api_key(self, api_key: str, name: str = None) -> Optional[int]:
        """Tambah API key baru"""
        conn = self._pool.get_connection()
        try:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO api_keys (key_value, key_name, status)
                VALUES (?, ?, 'active')
            ''', (api_key, name or f"Key_{int(time.time())}"))
            conn.commit()
            return cursor.lastrowid
        except sqlite3.IntegrityError:
            return None
        finally:
            self._pool.return_connection(conn)

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
        conn = self._pool.get_connection()
        try:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT id, key_value, key_name, status, daily_usage, daily_limit,
                       minute_usage, minute_limit, fail_count, last_used
                FROM api_keys
                WHERE status = 'active'
                ORDER BY fail_count ASC, last_used ASC NULLS FIRST
            ''')
            keys = []
            for row in cursor.fetchall():
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
        finally:
            self._pool.return_connection(conn)

    def get_next_key(self, strategy: str = 'round_robin') -> Optional[Dict]:
        """
        FIXED: Ambil key berikutnya secara thread-safe.
        Sebelumnya current_index dibaca di luar lock.
        """
        active_keys = self.get_active_keys()
        if not active_keys:
            return None

        if strategy == 'round_robin':
            with self._lock:
                # FIXED: index dibaca DAN diupdate di dalam lock yang sama
                self.current_index = self.current_index % len(active_keys)
                key = active_keys[self.current_index]
                self.current_index = (self.current_index + 1) % len(active_keys)
            return key
        elif strategy == 'least_used':
            return min(active_keys, key=lambda k: k.get('daily_usage', 0))
        elif strategy == 'priority':
            return min(active_keys, key=lambda k: k.get('fail_count', 0))
        else:  # random
            import random
            return random.choice(active_keys)

    def mark_key_limited(self, key_id: int):
        """FIXED: Tambah kolom limited_at agar reactivate bisa bekerja"""
        conn = self._pool.get_connection()
        try:
            cursor = conn.cursor()
            cursor.execute('''
                UPDATE api_keys
                SET status = 'limited',
                    fail_count = fail_count + 1,
                    limited_at = CURRENT_TIMESTAMP,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            ''', (key_id,))
            conn.commit()
        finally:
            self._pool.return_connection(conn)

    def mark_key_active(self, key_id: int):
        """Reactivate key yang sebelumnya limited"""
        conn = self._pool.get_connection()
        try:
            cursor = conn.cursor()
            cursor.execute('''
                UPDATE api_keys
                SET status = 'active',
                    limited_at = NULL,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            ''', (key_id,))
            conn.commit()
        finally:
            self._pool.return_connection(conn)

    def update_usage(self, key_id: int, tokens_used: int, success: bool,
                     response_time_ms: int = 0):
        """Update usage tracking"""
        conn = self._pool.get_connection()
        try:
            cursor = conn.cursor()
            if success:
                cursor.execute('''
                    UPDATE api_keys
                    SET daily_usage = daily_usage + ?,
                        minute_usage = minute_usage + ?,
                        last_used = CURRENT_TIMESTAMP,
                        fail_count = 0,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                ''', (tokens_used, tokens_used, key_id))
            else:
                cursor.execute('''
                    UPDATE api_keys
                    SET fail_count = fail_count + 1,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                ''', (key_id,))

            cursor.execute('''
                INSERT INTO key_usage_log (key_id, tokens_used, status, response_time_ms)
                VALUES (?, ?, ?, ?)
            ''', (key_id, tokens_used, 'success' if success else 'failed', response_time_ms))
            conn.commit()
        finally:
            self._pool.return_connection(conn)

    # -------------------------------------------------------------------------
    # Core API Call
    # -------------------------------------------------------------------------

    def call_gemini_with_failover(self, prompt: str, model: str = 'gemini-1.5-flash',
                                   max_retries: int = None) -> Dict:
        """Panggil Gemini API dengan auto failover ke key berikutnya"""
        if max_retries is None:
            active_keys = self.get_active_keys()
            max_retries = len(active_keys) if active_keys else 1

        last_error = None

        for attempt in range(max_retries):
            key = self.get_next_key()
            if not key:
                raise Exception("Tidak ada API key aktif yang tersedia")

            url = (
                f"https://generativelanguage.googleapis.com/v1beta/models/"
                f"{model}:generateContent?key={key['key']}"
            )
            payload = {
                "contents": [{"parts": [{"text": prompt}]}]
            }

            start_time = time.time()
            try:
                response = requests.post(url, json=payload, timeout=30)
                response_time = int((time.time() - start_time) * 1000)

                if response.status_code == 200:
                    result = response.json()
                    tokens_used = result.get('usageMetadata', {}).get('totalTokenCount', 0)
                    self.update_usage(key['id'], tokens_used, True, response_time)
                    return {
                        'success': True,
                        'text': result['candidates'][0]['content']['parts'][0]['text'],
                        'usage': tokens_used,
                        'key_id': key['id'],
                        'response_time': response_time
                    }
                elif response.status_code == 429:
                    self.mark_key_limited(key['id'])
                    last_error = f"Rate limit pada key {key['id']}"
                    continue
                else:
                    self.update_usage(key['id'], 0, False)
                    last_error = f"API Error {response.status_code}: {response.text}"
                    continue

            except requests.exceptions.Timeout:
                last_error = f"Timeout pada key {key['id']}"
                continue
            except Exception as e:
                last_error = str(e)
                continue

        raise Exception(f"Semua API key gagal: {last_error}")

    def get_stats(self) -> Dict:
        """Dapatkan statistik semua API keys"""
        conn = self._pool.get_connection()
        try:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
                    SUM(CASE WHEN status = 'limited' THEN 1 ELSE 0 END) as limited,
                    SUM(daily_usage) as total_daily_usage,
                    AVG(daily_usage) as avg_daily_usage
                FROM api_keys
            ''')
            row = cursor.fetchone()
            return {
                'total_keys': row[0] or 0,
                'active_keys': row[1] or 0,
                'limited_keys': row[2] or 0,
                'total_daily_usage': row[3] or 0,
                'avg_daily_usage': round(row[4] or 0, 2)
            }
        finally:
            self._pool.return_connection(conn)

    def close(self):
        """Tutup semua koneksi database"""
        self._pool.close_all()


# -------------------------------------------------------------------------
# CLI untuk testing
# -------------------------------------------------------------------------
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

    lb.close()
