# JKT48 Timetable & Radar

Aplikasi web berbasis PHP (vanilla, MVC ringan) untuk melihat jadwal event **EXCLUSIVE** JKT48 (Meet & Greet dan 2-Shot) serta memantau ketersediaan kuota tiket secara real-time lewat fitur **Radar**.

## Fitur

- **Timetable** — menampilkan jadwal event Meet & Greet dan 2-Shot per bulan, dikelompokkan per team.
- **Radar** — memindai semua event exclusive bulan berjalan dan menampilkan alert untuk sesi yang kuotanya menipis (tidak kosong, tidak juga masih longgar).
- **API internal** (dikonsumsi oleh JavaScript di frontend):
  - `GET /api/schedules?month=&year=` — daftar jadwal
  - `GET /api/exclusive/:code` — detail sesi & kuota per jalur untuk satu event
  - `GET /api/radar?month=&year=` — daftar alert kuota

## Tech Stack

- PHP native (tanpa framework), dengan struktur MVC sederhana:
  - `core/` — Router & base Controller
  - `app/controllers/` — TimetableController, RadarController
  - `app/models/` — TimetableModel (fetch & parsing data dari jkt48.com)
  - `app/views/` — tampilan halaman
- `public/` — CSS & JS untuk halaman timetable dan radar
- Data diambil dari API tidak resmi `jkt48.com/api/v1/...` menggunakan cURL dengan cookie sesi

## Instalasi

1. Clone repo ini ke folder server lokal (misalnya `htdocs/timetable` untuk XAMPP/Laragon).
2. Pastikan PHP >= 8.0 dan ekstensi `curl` aktif.
3. Salin `config/credentials.example.php` menjadi `config/credentials.php`, lalu isi dengan cookie sesi dari browser (lihat bagian **Konfigurasi Credentials** di bawah).
4. Arahkan virtual host / document root ke folder project, atau jalankan dengan PHP built-in server:
   ```bash
   php -S localhost:8000
   ```
5. Buka `http://localhost:8000` di browser.

Jika menggunakan Apache, pastikan `mod_rewrite` aktif — file `.htaccess` sudah disediakan (sesuaikan `RewriteBase` dengan path project Anda).

## Konfigurasi Credentials

Aplikasi ini mengambil data dari `jkt48.com` menggunakan cookie sesi milik akun Anda sendiri, karena endpoint tersebut memerlukan autentikasi. Cara mendapatkan cookie:

1. Login ke [jkt48.com](https://jkt48.com) di browser.
2. Buka DevTools → tab **Application** → **Cookies** → domain `jkt48.com`.
3. Salin nilai berikut ke `config/credentials.php`:
   - `__Secure-next-auth.session-token` → `JKT48_SESSION_TOKEN`
   - `cf_clearance` → `JKT48_CF_CLEARANCE`
   - `__Host-next-auth.csrf-token` → `JKT48_CSRF_TOKEN`

> ⚠️ **Cookie ini bersifat sensitif dan biasanya expire dalam beberapa jam**, jadi perlu diperbarui secara berkala. **Jangan pernah commit file `config/credentials.php` yang berisi cookie asli ke repository publik** — tambahkan ke `.gitignore` dan gunakan file contoh (`credentials.example.php`) sebagai referensi format.

## Struktur Folder

```
Timetable/
├── app/
│   ├── controllers/
│   │   ├── TimetableController.php
│   │   └── RadarController.php
│   ├── models/
│   │   └── TimetableModel.php
│   └── views/
│       ├── timetable/index.php
│       └── radar/index.php
├── core/
│   ├── Router.php
│   └── Controller.php
├── config/
│   └── credentials.php
├── public/
│   ├── css/
│   └── js/
├── index.php
└── .htaccess
```

## Disclaimer

Proyek ini bersifat tidak resmi (unofficial) dan tidak berafiliasi dengan JKT48 atau manajemennya. Data diambil dari endpoint publik/semi-publik `jkt48.com` untuk keperluan pribadi. Gunakan dengan bijak dan sesuai ketentuan layanan situs terkait.

## Lisensi

Belum ditentukan — tambahkan file `LICENSE` sesuai kebutuhan (misalnya MIT) jika ingin membuat proyek ini open source.