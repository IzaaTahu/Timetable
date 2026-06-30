'use strict';

const MONTHS_ID = ['Januari','Februari','Maret','April','Mei','Juni',
                   'Juli','Agustus','September','Oktober','November','Desember'];
const DAYS_ID   = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];

let state = {
  month: new Date().getMonth() + 1,
  year:  new Date().getFullYear(),
  team:  'all',
  items: [],
  detailCache: {},
};

let autoRefreshTimer = null;
let countdownTimer   = null;
let countdownSisa    = 60;

// ── Helpers ──────────────────────────────────────────────────
function fmt(t) { return t ? String(t).slice(0, 5) : '—'; }

function wibDate(iso) {
  const d   = new Date(iso);
  const wib = new Date(d.getTime() + 7 * 3600 * 1000);
  return {
    day:   DAYS_ID[wib.getUTCDay()],
    date:  wib.getUTCDate(),
    month: MONTHS_ID[wib.getUTCMonth()],
    year:  wib.getUTCFullYear(),
    raw:   wib,
  };
}

function isMG(t)    { return /meet\s*(and|&|n)?\s*greet/i.test(t); }
function is2Shot(t) { return /2.?shot/i.test(t); }

function detectTeam(t) {
  if (/passion/i.test(t))              return 'passion';
  if (/trainee/i.test(t))             return 'trainee';
  if (/love.*dream|dream.*love/i.test(t)) return 'multi';
  if (/love/i.test(t))                return 'love';
  if (/dream/i.test(t))               return 'dream';
  return 'other';
}

// Format tanggal sales period
function fmtSalesDate(iso) {
  const d   = new Date(iso);
  const wib = new Date(d.getTime() + 7 * 3600 * 1000);
  return wib.getUTCDate() + '/' + (wib.getUTCMonth() + 1);
}

// Countdown general sales
function salesCountdown(salesPeriod) {
  if (!salesPeriod || !salesPeriod.length) return '';
  const gen = salesPeriod.find(s => !s.is_ofc_only);
  if (!gen) return '';
  const genOpen = new Date(new Date(gen.start_date).getTime() + 7 * 3600 * 1000);
  const now = new Date();
  if (genOpen <= now) return '';
  const diff = genOpen - now;
  const days = Math.floor(diff / 86400000);
  const hrs  = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const label = days > 0 ? days + 'h ' + hrs + 'j lagi' : hrs + 'j ' + mins + 'm lagi';
  return '<span class="sales-countdown">General buka ' + label + '</span>';
}

// ── Fetch schedules ──────────────────────────────────────────
async function loadSchedules() {
  setMonthLabel();
  document.getElementById('events-list').innerHTML =
    '<div class="empty-state"><span class="empty-icon">◇</span>Memuat jadwal...</div>';
  document.getElementById('team-tabs').innerHTML = '';

  try {
    const res  = await fetch('api/schedules?month=' + state.month + '&year=' + state.year);
    const json = await res.json();
    if (json.error) throw new Error(json.error);

    state.items       = json.items ?? [];
    state.detailCache = {};
    state.team        = 'all';

    buildTabs();
    renderList();
  } catch (e) {
    document.getElementById('events-list').innerHTML =
      '<div class="empty-state"><span class="empty-icon">◇</span>Gagal memuat: ' + e.message + '</div>';
  }

  document.getElementById('last-update').textContent =
    'Update ' + new Date().toLocaleTimeString('id-ID');
}

// ── Tabs ─────────────────────────────────────────────────────
const TEAM_LABEL = {
  all: 'Semua', passion: 'Team Passion', love: 'Team Love',
  dream: 'Team Dream', multi: 'Love & Dream', trainee: 'Trainee', other: 'Lainnya',
};

function buildTabs() {
  const teams = ['all', ...new Set(state.items.map(e => detectTeam(e.title)))];
  document.getElementById('team-tabs').innerHTML = teams.map(function(t) {
    return '<button class="team-tab' + (t === state.team ? ' active' : '') +
      '" onclick="selectTeam(\'' + t + '\')">' + (TEAM_LABEL[t] ?? t) + '</button>';
  }).join('');
}

function selectTeam(team) {
  state.team = team;
  buildTabs();
  renderList();
}

// ── Render list ──────────────────────────────────────────────
function renderList() {
  const filtered = state.team === 'all'
    ? state.items
    : state.items.filter(function(e) { return detectTeam(e.title) === state.team; });

  const el = document.getElementById('events-list');

  if (!filtered.length) {
    el.innerHTML =
      '<div class="empty-state"><span class="empty-icon">◇</span>Tidak ada event M&amp;G atau 2-Shot bulan ini.</div>';
    return;
  }

  // Filter event yang udah selesai
  const active = filtered.filter(function(e) {
    const eventDate = new Date(e.date_wib ?? e.date);
    const todayEnd  = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    // Anggap selesai kalau tanggalnya sebelum hari ini
    return eventDate >= new Date(new Date().toDateString());
  });

  if (!active.length) {
    el.innerHTML =
      '<div class="empty-state"><span class="empty-icon">◇</span>Tidak ada event M&amp;G atau 2-Shot yang akan datang bulan ini.</div>';
    return;
  }

  el.innerHTML = active.map(function(e) {
    const ld   = wibDate(e.date);
    const mg   = isMG(e.title);
    const pill = mg
      ? '<span class="type-pill pill-mg">Meet &amp; Greet</span>'
      : '<span class="type-pill pill-shot">2-Shot</span>';

    // Cek apakah event sudah lewat
    const eventDate = new Date(e.date_wib ?? e.date);
    const isPast    = eventDate < new Date(new Date().toDateString());

    // Sales period info
    var salesHtml = '';
    if (e.sales_period && e.sales_period.length) {
      const ofc = e.sales_period.find(function(s) { return s.is_ofc_only; });
      const gen = e.sales_period.find(function(s) { return !s.is_ofc_only; });
      const parts = [];
      if (ofc) parts.push('OFC: ' + fmtSalesDate(ofc.start_date));
      if (gen) parts.push('General: ' + fmtSalesDate(gen.start_date));
      if (parts.length) salesHtml = '<span class="sales-info">' + parts.join(' · ') + '</span>';
    }

    const cdHtml = salesCountdown(e.sales_period);

    var cardId = e.schedule_id || e.reference_code;
    return '<div class="event-card" id="card-' + cardId + '">' +
      '<div class="event-card-header" onclick="toggleCard(' + cardId + ', \'' + e.reference_code + '\')">' +
        '<div class="event-left">' +
          '<div class="event-date">' + ld.day + ', ' + ld.date + ' ' + ld.month + ' ' + ld.year + '</div>' +
          '<div class="event-name">' + e.title + '</div>' +
          '<div class="event-time">' + fmt(e.start_time) + ' – ' + fmt(e.end_time) + ' WIB' +
            salesHtml + cdHtml +
          '</div>' +
        '</div>' +
        '<div class="event-right">' +
          '<span class="event-ref">' + e.reference_code + '</span>' +
          pill +
          '<svg class="chevron" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">' +
            '<path d="M4 6l4 4 4-4" stroke-linecap="round" stroke-linejoin="round"/>' +
          '</svg>' +
        '</div>' +
      '</div>' +
      '<div class="event-detail" id="detail-' + cardId + '">' +
        '<div class="detail-loading"><span class="spin">↻</span>&ensp;Memuat data...</div>' +
      '</div>' +
    '</div>';
  }).join('');
}

// ── Accordion ────────────────────────────────────────────────
async function toggleCard(cardId, refCode) {
  // Fallback kalau dipanggil dengan satu argument (auto-refresh)
  if (!refCode) refCode = cardId;
  const card   = document.getElementById('card-' + cardId);
  const detail = document.getElementById('detail-' + cardId);
  if (!card) return;
  const isOpen = card.classList.contains('open');

  document.querySelectorAll('.event-card.open').forEach(function(c) { c.classList.remove('open'); });
  if (isOpen) return;

  card.classList.add('open');
  setTimeout(function() { card.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 50);

  if (detail.dataset.loaded) return;

  detail.innerHTML =
    '<div class="detail-loading"><span class="spin">↻</span>&ensp;Memuat dari jkt48.com...</div>';

  try {
    const res  = await fetch('api/exclusive/' + refCode);
    const json = await res.json();
    if (json.error) throw new Error(json.error);

    state.detailCache[refCode] = json.data;
    detail.innerHTML = renderDetail(json.data);
    detail.dataset.loaded = '1';
  } catch (e) {
    detail.innerHTML = '<div class="detail-error">Gagal memuat: ' + e.message + '</div>';
  }
}

// ── Render detail ─────────────────────────────────────────────
function renderDetail(d) {
  const allSlots = d.session.flatMap(function(s) { return s.session_detail; });
  const soCount  = allSlots.filter(function(s) { return s.available_quota === 0; }).length;
  const avCount  = allSlots.length - soCount;
  const sold     = allSlots.reduce(function(a, s) { return a + s.tickets_sold; }, 0);

  const summary =
    '<div class="detail-summary">' +
      '<div class="sum-stat"><div class="sum-num">' + d.session.length + '</div><div class="sum-lbl">Sesi</div></div>' +
      '<div class="sum-stat"><div class="sum-num red">' + soCount + '</div><div class="sum-lbl">Sold out</div></div>' +
      '<div class="sum-stat"><div class="sum-num green">' + avCount + '</div><div class="sum-lbl">Tersedia</div></div>' +
      '<div class="sum-stat"><div class="sum-num">' + sold.toLocaleString('id-ID') + '</div><div class="sum-lbl">Tiket terjual</div></div>' +
      '<div class="sum-stat"><div class="sum-num">Rp' + (d.default_price ?? 0).toLocaleString('id-ID') + '</div><div class="sum-lbl">Harga</div></div>' +
    '</div>';

  const sessions = d.session.map(function(sesi) {
    const soS = sesi.session_detail.filter(function(s) { return s.available_quota === 0; }).length;
    const avS = sesi.session_detail.length - soS;

    const slots = sesi.session_detail.map(function(slot) {
      const total  = slot.tickets_sold + slot.available_quota;
      const pct    = total > 0 ? Math.round(slot.tickets_sold / total * 100) : 100;
      const isSold = slot.available_quota === 0;
      const isLow  = !isSold && slot.available_quota <= 30;

      const cls     = isSold ? 'is-sold' : isLow ? 'is-low' : '';
      const fillCls = isSold ? 'fill-sold' : isLow ? 'fill-low' : 'fill-ok';
      const stCls   = isSold ? 'st-sold'   : isLow ? 'st-low'  : 'st-ok';
      const stText  = isSold ? 'Sold out'
        : isLow ? 'Sisa ' + slot.available_quota + ' — hampir habis'
        : 'Sisa ' + slot.available_quota;

      return '<div class="member-slot ' + cls + '">' +
        '<div class="slot-jalur">' + slot.label + '</div>' +
        '<div class="slot-name">' + slot.jkt48_member_name + '</div>' +
        '<div class="quota-track"><div class="quota-fill ' + fillCls + '" style="width:' + pct + '%"></div></div>' +
        '<div class="slot-status ' + stCls + '">' + stText + '</div>' +
      '</div>';
    }).join('');

    return '<div class="session-block">' +
      '<div class="session-head">' +
        '<div>' +
          '<div class="session-label">' + sesi.label + '</div>' +
          '<div class="session-time">' + fmt(sesi.start_time) + ' – ' + fmt(sesi.end_time) + ' WIB' +
            ' &nbsp;·&nbsp; Resepsi ' + fmt(sesi.reception_start_time) + '</div>' +
        '</div>' +
        '<div class="session-badges">' +
          '<span class="s-badge s-sold">' + soS + ' sold out</span>' +
          '<span class="s-badge s-avail">' + avS + ' tersedia</span>' +
        '</div>' +
      '</div>' +
      '<div class="member-grid">' + slots + '</div>' +
    '</div>';
  }).join('');

  return summary + '<div class="sessions">' + sessions + '</div>';
}

// ── Month nav ─────────────────────────────────────────────────
function setMonthLabel() {
  document.getElementById('month-label').textContent =
    MONTHS_ID[state.month - 1] + ' ' + state.year;
}

function changeMonth(dir) {
  state.month += dir;
  if (state.month > 12) { state.month = 1; state.year++; }
  if (state.month < 1)  { state.month = 12; state.year--; }
  loadSchedules();
}

// ── Refresh manual ────────────────────────────────────────────
function refreshAll() {
  state.detailCache = {};
  document.querySelectorAll('.event-card.open').forEach(function(c) {
    c.classList.remove('open');
    const det = c.querySelector('.event-detail');
    if (det) det.dataset.loaded = '';
  });
  loadSchedules();
  resetCountdown();
}

// ── Auto-refresh & countdown ──────────────────────────────────
function startAutoRefresh() {
  clearInterval(autoRefreshTimer);
  autoRefreshTimer = setInterval(async function() {
    const openCode = document.querySelector('.event-card.open')?.id?.replace('card-', '');
    if (openCode) delete state.detailCache[openCode];
    await loadSchedules();
    if (openCode) {
      const card = document.getElementById('card-' + openCode);
      if (card) toggleCard(openCode);
    }
    resetCountdown();
  }, 60 * 1000);
}

function resetCountdown() {
  clearInterval(countdownTimer);
  countdownSisa = 60;
  const el = document.getElementById('countdown');
  if (el) el.textContent = countdownSisa + 's';
  countdownTimer = setInterval(function() {
    countdownSisa--;
    const el = document.getElementById('countdown');
    if (el) el.textContent = countdownSisa + 's';
    if (countdownSisa <= 0) clearInterval(countdownTimer);
  }, 1000);
}

// ── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async function() {
  await loadSchedules();
  startAutoRefresh();
  resetCountdown();
  const loader = document.getElementById('page-loader');
  loader.classList.add('out');
  setTimeout(function() { loader.remove(); }, 400);
});