'use strict';

const THRESHOLD   = 30;
const STORAGE_KEY = 'jkt48_radar_history';
const MAX_HISTORY = 200;

const MONTHS_ID = ['Januari','Februari','Maret','April','Mei','Juni',
                   'Juli','Agustus','September','Oktober','November','Desember'];
const TEAM_LABEL = {
  passion: 'Team Passion', love: 'Team Love', dream: 'Team Dream',
  multi: 'Love & Dream', trainee: 'Trainee', other: 'Lainnya',
};

let currentTeam = 'all';
let currentDate = 'all';
let lastAlerts  = [];
let allDates    = {}; // { 'YYYY-MM-DD': 'Senin, 27/06' }
let autoTimer   = null;
let cdTimer     = null;
let cdSisa      = 60;

// ── LocalStorage history ──────────────────────────────────────
function loadHistory() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}
function saveHistory(entries) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(-MAX_HISTORY))); }
  catch {}
}
function slotKey(a) { return `${a.event_code}|${a.session_label}|${a.jalur}|${a.member}`; }

function diffAlerts(newAlerts, oldAlerts) {
  const oldMap = {};
  oldAlerts.forEach(a => { oldMap[slotKey(a)] = a.quota; });
  const changes = [];
  newAlerts.forEach(a => {
    const key  = slotKey(a);
    const oldQ = oldMap[key];
    if (oldQ === undefined) changes.push({ ...a, change: 'new', delta: null });
    else if (a.quota !== oldQ) changes.push({ ...a, change: 'delta', delta: a.quota - oldQ });
  });
  const newKeys = new Set(newAlerts.map(slotKey));
  oldAlerts.forEach(a => {
    if (!newKeys.has(slotKey(a)) && a.quota <= THRESHOLD)
      changes.push({ ...a, quota: 0, change: 'soldout', delta: null });
  });
  return changes;
}

function recordHistory(changes) {
  if (!changes.length) return;
  const history = loadHistory();
  const now = Date.now();
  changes.forEach(c => {
    history.push({
      ts: now, type: c.change,
      member: c.member, event: c.event_title,
      session: c.session_label, jalur: c.jalur,
      quota: c.quota, delta: c.delta,
      date_label: c.date_label ?? '',
    });
  });
  saveHistory(history);
}

// ── Fetch ─────────────────────────────────────────────────────
// ── Fetch ─────────────────────────────────────────────────────
async function fetchRadar() {
  const now       = new Date();
  const month     = now.getMonth() + 1;
  const year      = now.getFullYear();
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear  = month === 12 ? year + 1 : year;

  try {
    const [res1, res2] = await Promise.all([
      fetch(`api/radar?month=${month}&year=${year}`),
      fetch(`api/radar?month=${nextMonth}&year=${nextYear}`),
    ]);
    const [j1, j2] = await Promise.all([res1.json(), res2.json()]);

    const alerts = [...(j1.alerts ?? []), ...(j2.alerts ?? [])];
    const dates  = { ...(j1.dates ?? {}), ...(j2.dates ?? {}) };

    return {
      alerts,
      dates,
      checked: (j1.checked ?? 0) + (j2.checked ?? 0),
      error:   j1.error || j2.error || null,
    };
  } catch (e) {
    return { alerts: [], total: 0, checked: 0, dates: {}, error: e.message };
  }
}

// ── Date Picker ───────────────────────────────────────────────
function renderDatePicker(dates) {
  allDates = dates;
  const el = document.getElementById('date-picker-wrap');
  if (!el) return;

  const dateKeys = Object.keys(dates);
  if (!dateKeys.length) { el.style.display = 'none'; return; }

  el.style.display = 'flex';

  const pills = ['all', ...dateKeys].map(k => {
    const label = k === 'all' ? 'Semua Tanggal' : dates[k];
    const active = k === currentDate ? ' active' : '';
    return `<button class="date-pill${active}" onclick="setDate('${k}')">${label}</button>`;
  }).join('');

  el.innerHTML = `<div class="date-pills">${pills}</div>`;
}

function setDate(d) {
  currentDate = d;
  renderDatePicker(allDates);
  renderAlerts(lastAlerts);
  updateSummary(lastAlerts);
}

// ── Render ────────────────────────────────────────────────────
function updateSummary(alerts) {
  const filtered = getFiltered(alerts);
  const critical = filtered.filter(a => a.quota <= 10).length;
  const newCount = lastAlerts.length === 0 ? 0
    : filtered.filter(a => !lastAlerts.some(o => slotKey(o) === slotKey(a))).length;

  document.getElementById('sum-total').textContent    = filtered.length;
  document.getElementById('sum-critical').textContent = critical;
  document.getElementById('sum-new').textContent      = newCount;
  document.getElementById('sum-total').className    = 'rsum-num' + (filtered.length > 0 ? ' red' : '');
  document.getElementById('sum-critical').className = 'rsum-num' + (critical > 0 ? ' red' : '');
  document.getElementById('sum-new').className      = 'rsum-num' + (newCount > 0 ? ' amber' : '');
}

function buildTeamTabs(alerts) {
  const teams = ['all', ...new Set(alerts.map(a => a.team))];
  document.getElementById('radar-tabs').innerHTML = teams.map(t =>
    `<button class="team-tab${t === currentTeam ? ' active' : ''}"
             onclick="setTeam('${t}')">${t === 'all' ? 'Semua' : (TEAM_LABEL[t] ?? t)}</button>`
  ).join('');
}

function setTeam(team) {
  currentTeam = team;
  buildTeamTabs(lastAlerts);
  renderAlerts(lastAlerts);
  updateSummary(lastAlerts);
}

function getFiltered(alerts) {
  return alerts.filter(a => {
    const teamOk = currentTeam === 'all' || a.team === currentTeam;
    const dateOk = currentDate === 'all' || a.date_wib === currentDate;
    return teamOk && dateOk;
  });
}

function renderAlerts(alerts) {
  const el       = document.getElementById('radar-list');
  const filtered = getFiltered(alerts);
  const history  = loadHistory();

  // Prev quota map dari history
  const prevMap = {};
  history.slice().reverse().forEach(h => {
    const k = `${h.event}|${h.session}|${h.jalur}|${h.member}`;
    if (!prevMap[k]) prevMap[k] = h;
  });

  if (!filtered.length) {
    el.innerHTML = `
    <div class="radar-all-clear">
      <span class="clear-icon">◇</span>
      <div class="clear-title">Semua aman</div>
      <div class="clear-sub">Tidak ada jalur dengan sisa tiket &le; ${THRESHOLD}</div>
    </div>`;
    return;
  }

  el.innerHTML = filtered.map(a => {
    const level   = a.quota <= 10 ? 'level-critical' : 'level-warning';
    const total   = a.tickets_sold + a.quota;
    const pct     = total > 0 ? Math.round(a.tickets_sold / total * 100) : 100;
    const typeTag = a.event_type === 'mg'
      ? '<span class="alert-tag tag-mg">Meet &amp; Greet</span>'
      : '<span class="alert-tag tag-2shot">2-Shot</span>';

    const hKey = `${a.event_title}|${a.session_label}|${a.jalur}|${a.member}`;
    const prev = prevMap[hKey];
    let trendHtml = '<span class="alert-trend">—</span>';
    if (prev && prev.quota !== a.quota) {
      const delta = a.quota - prev.quota;
      const cls   = delta < 0 ? 'trend-down' : 'trend-up';
      const sign  = delta < 0 ? '▼' : '▲';
      trendHtml = `<span class="alert-trend ${cls}">${sign} ${Math.abs(delta)}</span>`;
    }

    const isNew = lastAlerts.length > 0 && !lastAlerts.some(o => slotKey(o) === slotKey(a));

    return `
    <div class="alert-card ${level}${isNew ? ' is-new' : ''}">
      <div class="alert-left">
        <div class="alert-quota">${a.quota}</div>
        <div class="alert-quota-lbl">sisa tiket</div>
      </div>
      <div class="alert-mid">
        <div class="alert-member">${a.member}</div>
        <div class="alert-event">${a.event_title}</div>
        <div class="alert-meta">
          <span class="alert-tag tag-date">📅 ${a.date_label ?? '—'}</span>
          <span class="alert-tag tag-jalur">${a.jalur}</span>
          <span class="alert-tag tag-sesi">${a.session_label} · ${a.session_start}–${a.session_end}</span>
          ${typeTag}
        </div>
      </div>
      <div class="alert-right">
        <div class="alert-bar-wrap">
          <div class="alert-bar" style="width:${pct}%"></div>
        </div>
        ${trendHtml}
      </div>
    </div>`;
  }).join('');
}

function renderHistory() {
  const history = loadHistory();
  const section = document.getElementById('history-section');
  const list    = document.getElementById('history-list');
  if (!history.length) { section.style.display = 'none'; return; }
  section.style.display = 'block';

  list.innerHTML = history.slice(-50).reverse().map(h => {
    const d    = new Date(h.ts);
    const time = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    let text = '', diffHtml = '';

    if (h.type === 'soldout') {
      text = `<strong>${h.member}</strong> — ${h.jalur}, ${h.session} <span style="color:var(--sold)">SOLD OUT</span>`;
    } else if (h.type === 'new') {
      text = `<strong>${h.member}</strong> masuk radar — ${h.jalur}, ${h.session} · sisa <strong>${h.quota}</strong>`;
    } else if (h.type === 'delta') {
      const cls  = h.delta < 0 ? 'diff-down' : 'diff-up';
      const sign = h.delta < 0 ? '▼' : '▲';
      text     = `<strong>${h.member}</strong> — ${h.jalur}, ${h.session} · sisa <strong>${h.quota}</strong>`;
      diffHtml = `<div class="history-diff ${cls}">${sign} ${Math.abs(h.delta)} tiket</div>`;
    }

    return `
    <div class="history-entry">
      <div class="history-time">${time}</div>
      <div class="history-body">
        <div class="history-text">${text}</div>
        ${diffHtml}
        <div style="font-size:11px;color:var(--faint);margin-top:2px">${h.event}${h.date_label ? ' · ' + h.date_label : ''}</div>
      </div>
    </div>`;
  }).join('');
}

// ── Main load ─────────────────────────────────────────────────
async function loadRadar() {
  document.getElementById('radar-list').innerHTML = `
  <div class="radar-scanning">
    <div class="scanning-pulse"></div>
    <div>Memindai semua event aktif...</div>
  </div>`;

  const data = await fetchRadar();

  if (data.error) {
    document.getElementById('radar-list').innerHTML =
      `<div class="empty-state"><span class="empty-icon">◇</span>Error: ${data.error}</div>`;
    return;
  }

  const changes  = diffAlerts(data.alerts, lastAlerts);
  if (lastAlerts.length > 0) recordHistory(changes);

  lastAlerts = data.alerts;

  document.getElementById('sum-events').textContent = data.checked;

  renderDatePicker(data.dates ?? {});
  buildTeamTabs(data.alerts);
  updateSummary(data.alerts);
  renderAlerts(data.alerts);
  renderHistory();

  document.getElementById('last-update').textContent =
    'Update ' + new Date().toLocaleTimeString('id-ID');
}

// ── Auto-refresh & countdown ──────────────────────────────────
function startAutoRefresh() {
  clearInterval(autoTimer);
  autoTimer = setInterval(async () => {
    await loadRadar();
    resetCountdown();
  }, 60 * 1000);
}

function resetCountdown() {
  clearInterval(cdTimer);
  cdSisa = 60;
  const el = document.getElementById('countdown');
  if (el) el.textContent = cdSisa + 's';
  cdTimer = setInterval(() => {
    cdSisa--;
    const el = document.getElementById('countdown');
    if (el) el.textContent = cdSisa + 's';
    if (cdSisa <= 0) clearInterval(cdTimer);
  }, 1000);
}

function refreshRadar() { loadRadar(); resetCountdown(); }

function clearHistory() {
  if (!confirm('Hapus semua riwayat perubahan quota?')) return;
  localStorage.removeItem(STORAGE_KEY);
  renderHistory();
}

// ── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await loadRadar();
  startAutoRefresh();
  resetCountdown();
  const loader = document.getElementById('page-loader');
  loader.classList.add('out');
  setTimeout(() => loader.remove(), 400);
});