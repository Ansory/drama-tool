# Drama Tool — Panduan Setup & Build

## Prasyarat

Pastikan semua tools berikut sudah terinstall:
- Node.js >= 18
- Python >= 3.10
- NSIS (untuk build installer Windows)
- FFmpeg (opsional, bisa di-bundel)

## Instalasi

```bash
npm install
pip install -r backend/requirements.txt
```

## Development

```bash
npm run dev
```

## Build untuk Windows

```bash
npm run build:win
```

---

## ⚠️ File Assets yang Wajib Ada Sebelum Build NSIS

File-file berikut **harus ada** di folder `assets/` sebelum menjalankan build installer:

| File | Keterangan |
|------|-----------|
| `assets/installer.ico` | Icon aplikasi (.ico, min 256x256) |
| `assets/banner.bmp` | Banner installer (.bmp, 164x314 px) |
| `assets/LICENSE.txt` | Teks lisensi yang ditampilkan di installer |

Tanpa file-file ini, build NSIS akan **gagal**.

---

## Struktur Folder

```
drama-tool/
├── assets/              ← File installer (ico, bmp, LICENSE)
├── src/
│   └── main/
│       └── main.js      ← Electron main process
├── backend/             ← Python backend
│   └── requirements.txt
├── autoUpdater.js
├── preload.js
├── vite.config.js
├── package.json
└── DramaTool.nsi
```

## Menjalankan Gemini Load Balancer

```bash
# Tambah API key
python gemini_load_balancer.py add YOUR_API_KEY nama_key

# Lihat semua key aktif
python gemini_load_balancer.py list

# Cek statistik
python gemini_load_balancer.py stats

# Test koneksi
python gemini_load_balancer.py test YOUR_API_KEY
```
