# JKT48 Timetable — Deploy Guide

## Struktur
```
timetable/
├── app/
│   ├── controllers/
│   │   └── TimetableController.php
│   ├── models/
│   │   └── TimetableModel.php
│   └── views/
│       └── timetable/
│           └── index.php
├── config/
│   └── credentials.php       ← isi credentials di sini
├── core/
│   ├── Controller.php
│   └── Router.php
├── public/
│   ├── css/
│   │   └── timetable.css
│   └── js/
│       └── timetable.js
├── .htaccess
└── index.php
```

## Deploy ke InfinityFree

### 1. Upload semua file
Upload ke `htdocs/timetable/` (atau root kalau mau domain sendiri).

### 2. Isi credentials
Buka `config/credentials.php`, isi 3 nilai:

```php
define('JKT48_SESSION_TOKEN', 'paste_di_sini');
define('JKT48_CF_CLEARANCE',  'paste_di_sini');
define('JKT48_CSRF_TOKEN',    'paste_di_sini');
```

Cara ambil dari browser:
1. Login ke jkt48.com
2. DevTools (F12) → Application → Cookies → https://jkt48.com
3. Salin nilai:
   - `__Secure-next-auth.session-token`
   - `cf_clearance`
   - `__Host-next-auth.csrf-token`

### 3. Update .htaccess
Kalau di-deploy bukan di `/timetable/`, sesuaikan `RewriteBase`:
- Root domain → `RewriteBase /`
- Subfolder lain → `RewriteBase /nama-folder/`

### 4. Test
Buka:
```
https://domain-lo.rf.gd/timetable/
https://domain-lo.rf.gd/timetable/api/schedules?month=6&year=2026
https://domain-lo.rf.gd/timetable/api/exclusive/EXCB75
```

## Catatan penting
- `cf_clearance` expire tiap beberapa jam → perlu update manual di `credentials.php`
- `session-token` lebih panjang masa aktifnya, tapi tetap expire
- Kalau API return error 401/403, berarti credentials expired → update ulang
