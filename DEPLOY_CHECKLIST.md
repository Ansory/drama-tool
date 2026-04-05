# ✅ Deploy Checklist Drama Tool

## File yang WAJIB di-copy ke repo (urutan penting)

### 1. Root folder
| File output | Copy ke repo | Keterangan |
|-------------|-------------|------------|
| `package.json` | `/package.json` | Versi 1.0.1, wajib! |
| `main.yml` | `/.github/workflows/main.yml` | Build + release fix |

### 2. src/main/
| File output | Copy ke repo | Keterangan |
|-------------|-------------|------------|
| `main.js` | `src/main/main.js` | IPC handlers lengkap |
| `preload.js` | `src/main/preload.js` | Expose semua API ke renderer |
| `autoUpdater.js` | `src/main/autoUpdater.js` | Versi dari app.getVersion() |
| `facebookOAuth.js` | `src/main/facebookOAuth.js` | OAuth Facebook (Pilihan A) |

### 3. src/renderer/components/
| File output | Copy ke repo | Keterangan |
|-------------|-------------|------------|
| `FacebookIntegration.jsx` | `src/renderer/components/FacebookIntegration.jsx` | Setup + AI auto-fill |
| `WatermarkInpainting.jsx` | `src/renderer/components/WatermarkInpainting.jsx` | Fix openDialog |
| `ImportFromSocial.jsx` | `src/renderer/components/ImportFromSocial.jsx` | Fix require('os') |
| `RightsManager.jsx` | `src/renderer/components/RightsManager.jsx` | Fix getStore async |
| `Settings.jsx` | `src/renderer/components/Settings.jsx` | Fix versi dinamis |
| `BurnoutProtection.jsx` | `src/renderer/components/BurnoutProtection.jsx` | Fix localStorage |
| `UpdateNotification.jsx` | `src/renderer/components/UpdateNotification.jsx` | Fix download error handling |
| `UpdateNotification.css` | `src/renderer/components/UpdateNotification.css` | CSS yang benar |

### 4. src/renderer/
| File output | Copy ke repo | Keterangan |
|-------------|-------------|------------|
| `App.jsx` | `src/renderer/App.jsx` | Tanpa license check |

### 5. backend/
| File output | Copy ke repo | Keterangan |
|-------------|-------------|------------|
| `auto_content_generator.py` | `backend/auto_content_generator.py` | AI auto-fill konten |
| `requirements.txt` | `backend/requirements.txt` | Tambah schedule + requests |

---

## Verifikasi setelah copy

### Cek versi package.json sudah 1.0.1:
```bash
node -e "console.log(require('./package.json').version)"
# Output harus: 1.0.1
```

### Cek file backend ada:
```bash
ls backend/
# Harus ada: auto_content_generator.py, requirements.txt, gemini_load_balancer.py, dll
```

### Cek build berhasil:
```bash
npm run build
# Harus: ✓ built in X.XXs
```

---

## Untuk release baru (update otomatis bekerja)

1. Setelah semua file di-copy dan build berhasil lokal
2. Commit + push ke GitHub
3. Di GitHub Actions → pilih workflow → Run workflow
4. Set **"Buat GitHub Release"** = `true`
5. Setelah selesai, di GitHub Releases → edit release lama (v1.0.0) → **uncheck Pre-release** → **check Set as latest** → Save
6. User yang install v1.0.0 akan otomatis dapat notif update ke v1.0.1

---

## Kenapa update tidak bekerja sebelumnya

❌ `package.json` di repo masih `1.0.0` → tag yang dibuat juga `v1.0.0` → tidak ada versi lebih tinggi
❌ Release lama statusnya **Pre-release** → `electron-updater` channel stable mengabaikan pre-release
❌ `main.js` masih versi dummy → semua fitur tidak bekerja

✅ Setelah copy semua file di atas → semua masalah teratasi
