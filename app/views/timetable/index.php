<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Timetable M&amp;G &amp; 2-Shot — JKT48</title>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garant:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Inter:wght@400;500&display=swap" rel="stylesheet"/>
  <link rel="stylesheet" href="<?= url('public/css/timetable.css') ?>"/>
</head>
<body>

<!-- Page loader -->
<div id="page-loader">
  <div>
    <div class="loader-title">JKT48 <em>Timetable</em></div>
    <div class="loader-dots"><span></span><span></span><span></span></div>
  </div>
</div>

<!-- Header -->
<header class="site-header">
  <div class="perf-top"></div>
  <div class="perf-bot"></div>
  <div class="header-inner">
    <div>
      <div class="header-eyebrow">Official Fan Timetable</div>
      <h1 class="header-h1">Meet &amp; Greet<br><em>&amp; 2-Shot</em></h1>
      <p class="header-sub">Data real-time dari jkt48.com &mdash; quota per jalur per member</p>
    </div>
    <div class="header-right">
      <div class="header-domain" style="display:flex;align-items:center;gap:12px;justify-content:flex-end">
        <span>jkt48-timetable</span>
        <a href="<?= url('radar') ?>" class="radar-link">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="8" r="6"/><circle cx="8" cy="8" r="3"/><circle cx="8" cy="8" r=".8" fill="currentColor"/></svg>
          Radar
        </a>
      </div>
      <button class="btn-refresh" id="refresh-btn" onclick="refreshAll()">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M13.5 8A5.5 5.5 0 1 1 8 2.5c1.8 0 3.4.86 4.4 2.2"/>
          <path d="M13.5 2.5v2.7h-2.7" stroke-linecap="round"/>
        </svg>
        Refresh
      </button>
      <div class="last-update" id="last-update"></div>
    </div>
  </div>
</header>

<!-- Main -->
<main class="main">

  <!-- Month nav -->
  <div class="month-nav">
    <button onclick="changeMonth(-1)" title="Bulan sebelumnya">&#8592;</button>
    <div class="month-label" id="month-label"></div>
    <button onclick="changeMonth(1)" title="Bulan berikutnya">&#8594;</button>
  </div>

  <!-- Team tabs -->
  <div class="team-tabs" id="team-tabs"></div>

  <!-- Event list -->
  <div class="events-list" id="events-list">
    <div class="empty-state">
      <span class="empty-icon">◇</span>
      Memuat jadwal...
    </div>
  </div>

</main>

<script src="<?= url('public/js/timetable.js') ?>"></script>
</body>
</html>
