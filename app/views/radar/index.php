<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Radar — JKT48 Timetable</title>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garant:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Inter:wght@400;500&display=swap" rel="stylesheet"/>
  <link rel="stylesheet" href="<?= url('public/css/timetable.css') ?>"/>
  <link rel="stylesheet" href="<?= url('public/css/radar.css') ?>"/>
</head>
<body>

<!-- Page loader -->
<div id="page-loader">
  <div>
    <div class="loader-title">JKT48 <em>Radar</em></div>
    <div class="loader-dots"><span></span><span></span><span></span></div>
  </div>
</div>

<!-- Header -->
<header class="site-header">
  <div class="perf-top"></div>
  <div class="perf-bot"></div>
  <div class="header-inner">
    <div>
      <div class="header-eyebrow">Quota Alert System</div>
      <h1 class="header-h1">Radar <em>Hampir</em><br><em>Habis</em></h1>
      <p class="header-sub">Semua jalur dengan sisa tiket &le; 30 — diperbarui otomatis tiap menit</p>
    </div>
    <div class="header-right">
      <div class="header-domain">
        <a href="<?= url() ?>" class="back-link">← Timetable</a>
      </div>
      <button class="btn-refresh" id="refresh-btn" onclick="refreshRadar()">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M13.5 8A5.5 5.5 0 1 1 8 2.5c1.8 0 3.4.86 4.4 2.2"/>
          <path d="M13.5 2.5v2.7h-2.7" stroke-linecap="round"/>
        </svg>
        Refresh
        <span class="refresh-divider"></span>
        <span id="countdown" class="refresh-countdown">60s</span>
      </button>
      <div class="last-update" id="last-update"></div>
    </div>
  </div>
</header>

<!-- Main -->
<main class="main">

  <!-- Summary bar -->
  <div class="radar-summary" id="radar-summary">
    <div class="rsum-stat">
      <div class="rsum-num" id="sum-total">—</div>
      <div class="rsum-lbl">Jalur hampir habis</div>
    </div>
    <div class="rsum-stat">
      <div class="rsum-num" id="sum-critical">—</div>
      <div class="rsum-lbl">Kritis (&le; 10)</div>
    </div>
    <div class="rsum-stat">
      <div class="rsum-num" id="sum-events">—</div>
      <div class="rsum-lbl">Event dipantau</div>
    </div>
    <div class="rsum-stat">
      <div class="rsum-num" id="sum-new">—</div>
      <div class="rsum-lbl">Baru masuk radar</div>
    </div>
  </div>

  <!-- Date picker -->
  <div id="date-picker-wrap" style="display:none;margin-top:24px"></div>

  <!-- Team tabs -->
  <div class="team-tabs" id="radar-tabs" style="margin-top:12px"></div>

  <!-- Alert list -->
  <div id="radar-list">
    <div class="empty-state">
      <span class="empty-icon">◇</span>
      Memuat data radar...
    </div>
  </div>

  <!-- History section -->
  <div class="history-section" id="history-section" style="display:none">
    <div class="history-header">
      <h2 class="history-title">Riwayat Perubahan</h2>
    </div>
    <div id="history-list"></div>
  </div>

</main>

<script src="<?= url('public/js/radar.js') ?>"></script>
</body>
</html>