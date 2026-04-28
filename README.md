# 💰 DompetKu — Panduan Setup Lengkap

Aplikasi pencatat keuangan pribadi berbasis web yang bisa diinstall di Android (PWA) dan menyimpan data ke Google Sheets secara otomatis.

---

## 📁 Isi File

| File | Fungsi |
|------|--------|
| `index.html` | Tampilan utama aplikasi |
| `app.js` | Logika aplikasi (transaksi, budget, grafik) |
| `manifest.json` | Konfigurasi PWA untuk install di Android |
| `appscript.js` | Kode backend Google Apps Script |

---

## 🚀 Cara Setup (3 Langkah)

### Langkah 1 — Setup Google Apps Script

1. Buka [script.google.com](https://script.google.com)
2. Klik **New project**
3. Hapus semua kode yang ada
4. Copy-paste seluruh isi `appscript.js` ke editor
5. Klik tombol **Save** (ikon disket atau Ctrl+S)
6. Beri nama project: `DompetKu`

### Langkah 2 — Deploy sebagai Web App

1. Klik menu **Deploy** → **New deployment**
2. Klik ikon ⚙️ di sebelah "Select type" → pilih **Web app**
3. Isi kolom:
   - **Description**: `DompetKu v1`
   - **Execute as**: `Me`
   - **Who has access**: `Anyone`
4. Klik **Deploy**
5. Klik **Authorize access** → pilih akun Google kamu → izinkan
6. **Copy URL** yang muncul (formatnya: `https://script.google.com/macros/s/XXXXX/exec`)

### Langkah 3 — Hosting Aplikasi

**Opsi A: GitHub Pages (Gratis & Mudah)**
1. Buat akun di [github.com](https://github.com)
2. Buat repository baru → upload semua file
3. Masuk ke Settings → Pages → Source: `main branch`
4. Aplikasi tersedia di: `https://username.github.io/nama-repo`

**Opsi B: Netlify (Drag & Drop)**
1. Buka [netlify.com](https://netlify.com)
2. Drag & drop folder `dompetku` ke halaman utama
3. Langsung dapat URL publik

**Opsi C: Jalankan Lokal**
```bash
# Butuh Python
python -m http.server 8080
# Buka http://localhost:8080
```

---

## 📱 Cara Install di Android

1. Buka URL aplikasi di **Chrome** di HP Android
2. Tunggu beberapa detik, akan muncul banner "Add to Home Screen"
3. Atau: ketuk menu ⋮ → **Add to Home Screen** / **Install App**
4. Aplikasi akan muncul di layar utama HP seperti app biasa!

---

## 🔧 Cara Pakai Pertama Kali

1. Buka aplikasi
2. Masukkan **Web App URL** dari Langkah 2
3. Isi nama dan pilih mata uang
4. Klik **Mulai Pakai DompetKu**

---

## ✨ Fitur

| Fitur | Keterangan |
|-------|-----------|
| ➕ Tambah Transaksi | Catat pemasukan & pengeluaran dengan kategori |
| 📊 Grafik | Tren 6 bulan + pengeluaran per kategori |
| 🎯 Budget | Atur batas pengeluaran per kategori |
| 🔄 Sync Google Sheets | Data tersimpan otomatis ke Sheets |
| 📥 Export CSV | Download data sebagai file CSV |
| 📱 Install Android | Bisa diinstall sebagai app di HP |
| 💾 Offline | Data tersimpan lokal, sync saat online |

---

## 📊 Tampilan Google Sheets

Setelah pertama kali sync, file **DompetKu** akan otomatis dibuat di Google Drive kamu dengan 2 sheet:

- **Transaksi** — semua data transaksi dengan warna (hijau = pemasukan, merah = pengeluaran)
- **Ringkasan** — ringkasan bulanan + pengeluaran per kategori (auto-update)

---

## ❓ FAQ

**Q: Data hilang kalau hapus aplikasi?**
A: Data tersimpan di browser (localStorage). Kalau sudah sync ke Sheets, data aman.

**Q: Bisa dipakai tanpa internet?**
A: Bisa! Tambah transaksi tetap berjalan offline. Sync ke Sheets akan dilakukan saat online.

**Q: Bisa dipakai banyak orang?**
A: Saat ini per user/perangkat. Untuk berbagi, gunakan Google Sheets yang sama dengan berbagi URL script yang sama.

**Q: Kenapa ada notif "akses tidak aman"?**
A: Mode no-cors di fetch adalah normal untuk Apps Script. Data tetap terkirim dengan benar.

---

## 🆘 Troubleshooting

**Sync tidak berhasil:**
- Pastikan URL Apps Script sudah benar (berakhir `/exec`)
- Coba deploy ulang di Apps Script → New deployment
- Pastikan saat deploy pilih "Anyone" bukan "Anyone with Google Account"

**Grafik tidak muncul:**
- Pastikan ada transaksi yang sudah diinput
- Refresh halaman grafik dengan navigasi ulang

---

*DompetKu v1.0 — Dibuat dengan ❤️ untuk pencatatan keuangan yang mudah*
