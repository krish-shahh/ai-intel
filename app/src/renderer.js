const $ = (s, r = document) => r.querySelector(s);
const elem = (t, c, h) => { const e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; };
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));

let DATA = { briefs: [], people: [], topics: [], vaultPath: '' };
let SLUG = {};
let VIEW = 'dashboard';
let CURRENT = null;
let GRAPH = null;

const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : '');
function fmtDate(d, long) {
  if (!d) return '';
  const dt = new Date(d + 'T12:00:00');
  if (isNaN(dt)) return d;
  return dt.toLocaleDateString(undefined, long
    ? { weekday: 'long', month: 'long', day: 'numeric' }
    : { weekday: 'short', month: 'short', day: 'numeric' });
}
function nextRun() {
  const now = new Date();
  for (let d = 0; d < 2; d++) for (const h of [8, 20]) {
    const c = new Date(now); c.setDate(now.getDate() + d); c.setHours(h, 0, 0, 0);
    if (c > now) return c;
  }
}
function mentions(field) {
  const m = {};
  for (const b of DATA.briefs) for (const x of (b.data[field] || [])) m[x] = (m[x] || 0) + 1;
  return m;
}
function noteTitle(n) {
  if (!n) return '';
  if (n.folder === 'people') return n.data.name || n.slug;
  if (n.folder === 'topics') return n.data.title || n.slug;
  return cap(n.data.session || '') + ' brief';
}

async function load() {
  DATA = await window.vault.load();
  SLUG = {};
  for (const f of ['briefs', 'people', 'topics']) for (const n of DATA[f]) SLUG[n.slug] = n;
  if (!CURRENT || !SLUG[CURRENT.slug]) CURRENT = DATA.briefs[0] || DATA.people[0] || null;
  else CURRENT = SLUG[CURRENT.slug];
  render();
}
function openNote(slug) {
  if (!SLUG[slug]) return;
  CURRENT = SLUG[slug]; VIEW = 'files'; render();
}
function setView(v) { VIEW = v; render(); }

/* ---------------- Dashboard ---------------- */
function Dashboard() {
  const wrap = elem('div', 'dash');
  const latest = DATA.briefs[0];
  const nr = nextRun().toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' });
  const pc = mentions('people'), tc = mentions('topics');

  const recent = DATA.briefs.slice(0, 12).map((b) =>
    `<div class="brow" data-open="${esc(b.slug)}"><span>${esc(fmtDate(b.data.date) || b.slug)}</span><span class="s">${esc(b.data.session || '')}</span></div>`
  ).join('') || '<div class="how">No briefs yet.</div>';

  wrap.appendChild(elem('aside', 'rail', `
    <div class="rblk"><div class="logo">ai<i>·</i>intel</div><div class="sub">self-writing AI intel</div></div>
    <div class="rblk"><div class="lbl">Next brief</div><div class="next"><span class="dot"></span>${esc(nr)}</div><div class="cad">Runs 8:00 AM &amp; 8:00 PM EST</div></div>
    <div class="rblk"><div class="stat">
      <div><b>${DATA.briefs.length}</b><span>briefs</span></div>
      <div><b>${DATA.people.length}</b><span>people</span></div>
      <div><b>${DATA.topics.length}</b><span>topics</span></div></div></div>
    <div class="rblk"><div class="lbl">Recent briefs</div><div class="blist">${recent}</div></div>
    <div class="rblk foot"><div class="how">
      <div>📡&nbsp; Live from your vault</div>
      <div>🔄&nbsp; Updates when Git pulls</div>
      <div>🔔&nbsp; Alerts via ntfy · ai-intel</div></div></div>`));

  const chips = (arr, counts) => [...arr]
    .sort((a, b) => (counts[b.slug] || 0) - (counts[a.slug] || 0) || a.slug.localeCompare(b.slug))
    .map((p) => `<span class="chip" data-open="${esc(p.slug)}">${esc(p.slug)}${counts[p.slug] ? `<b>${counts[p.slug]}</b>` : ''}</span>`).join('');

  const canvas = elem('section', 'canvas');
  if (latest) {
    canvas.innerHTML = `
      <div class="eyebrow">${esc(fmtDate(latest.data.date, true))} · ${esc(cap(latest.data.session))}</div>
      <h1 class="title">${esc(cap(latest.data.session))} brief</h1>
      <div class="meta">${(latest.data.people || []).length} people · ${(latest.data.topics || []).length} topics covered</div>
      <article class="prose">${latest.html}</article>
      <div class="browse">
        <div class="lbl">People (${DATA.people.length})</div><div class="chips">${chips(DATA.people, pc)}</div>
        <div class="lbl">Topics (${DATA.topics.length})</div><div class="chips">${chips(DATA.topics, tc)}</div>
      </div>`;
  } else {
    canvas.innerHTML = `<div class="empty">No briefs yet — the first one lands ${esc(nr)}.</div>`;
  }
  wrap.appendChild(canvas);
  return wrap;
}

/* ---------------- Graph ---------------- */
function buildGraphData() {
  const nodes = [], links = [], have = new Set();
  const add = (id, label, type) => { if (!have.has(id)) { have.add(id); nodes.push({ id, label, type }); } };
  DATA.people.forEach((p) => add('person:' + p.slug, p.data.name || p.slug, 'person'));
  DATA.topics.forEach((t) => add('topic:' + t.slug, t.data.title || t.slug, 'topic'));
  DATA.briefs.forEach((b) => {
    const id = 'brief:' + b.slug; add(id, fmtDate(b.data.date) || b.slug, 'brief');
    const link = (s) => { if (have.has('person:' + s)) links.push({ source: id, target: 'person:' + s }); else if (have.has('topic:' + s)) links.push({ source: id, target: 'topic:' + s }); };
    (b.data.people || []).forEach((s) => have.has('person:' + s) && links.push({ source: id, target: 'person:' + s }));
    (b.data.topics || []).forEach((s) => have.has('topic:' + s) && links.push({ source: id, target: 'topic:' + s }));
    (b.links || []).forEach(link);
  });
  return { nodes, links };
}
function Graph() {
  const wrap = elem('div', 'graphwrap');
  const cv = elem('canvas');
  wrap.appendChild(cv);
  wrap.appendChild(elem('div', 'legend', `
    <div class="row"><span class="swatch" style="background:var(--brief)"></span>Briefs</div>
    <div class="row"><span class="swatch" style="background:var(--person)"></span>People</div>
    <div class="row"><span class="swatch" style="background:var(--topic)"></span>Topics</div>`));
  wrap.appendChild(elem('div', 'ghint', 'drag to pan · scroll to zoom · click a node to open'));
  // init after layout so canvas has size
  requestAnimationFrame(() => {
    if (GRAPH) GRAPH.destroy();
    GRAPH = window.ForceGraph(cv, buildGraphData(), (n) => openNote(n.id.split(':').slice(1).join(':')));
  });
  return wrap;
}

/* ---------------- Files ---------------- */
function Files() {
  const wrap = elem('div', 'files');
  const groups = [['briefs', 'Briefs'], ['people', 'People'], ['topics', 'Topics']];
  const tree = elem('aside', 'tree');
  for (const [key, label] of groups) {
    const g = elem('div', 'group');
    g.appendChild(elem('div', 'ghead', `${label} (${DATA[key].length})`));
    for (const n of DATA[key]) {
      const it = elem('div', 'item' + (CURRENT && CURRENT.slug === n.slug ? ' sel' : ''), esc(noteTitle(n)));
      it.dataset.open = n.slug;
      g.appendChild(it);
    }
    tree.appendChild(g);
  }
  const reader = elem('section', 'reader');
  if (CURRENT) {
    const sub = CURRENT.folder === 'briefs'
      ? `${fmtDate(CURRENT.data.date, true)} · ${cap(CURRENT.data.session || '')}`
      : (CURRENT.data.handle || cap(CURRENT.folder.replace(/s$/, '')));
    reader.innerHTML = `<h1 class="rhead">${esc(noteTitle(CURRENT))}</h1><div class="rmeta">${esc(sub)}</div><article class="prose">${CURRENT.html}</article>`;
  } else {
    reader.innerHTML = `<div class="empty">Select a note.</div>`;
  }
  wrap.appendChild(tree); wrap.appendChild(reader);
  return wrap;
}

/* ---------------- shell ---------------- */
function render() {
  if (GRAPH && VIEW !== 'graph') { GRAPH.destroy(); GRAPH = null; }
  document.querySelectorAll('#switch button').forEach((b) => b.classList.toggle('active', b.dataset.v === VIEW));
  const view = $('#view');
  view.innerHTML = '';
  view.appendChild(VIEW === 'dashboard' ? Dashboard() : VIEW === 'graph' ? Graph() : Files());
}

/* quick open / search */
function quickOpen(q) {
  const box = $('#quickopen');
  q = q.trim().toLowerCase();
  if (!q) { box.hidden = true; return; }
  const all = [...DATA.briefs, ...DATA.people, ...DATA.topics];
  const hits = all.filter((n) => (noteTitle(n) + ' ' + n.slug).toLowerCase().includes(q)).slice(0, 12);
  box.innerHTML = hits.map((n, i) =>
    `<div class="qo${i === 0 ? ' sel' : ''}" data-open="${esc(n.slug)}"><span>${esc(noteTitle(n))}</span><small>${esc(n.folder)}</small></div>`
  ).join('') || '<div class="qo"><span>No matches</span></div>';
  box.hidden = false;
}

document.addEventListener('click', (e) => {
  const op = e.target.closest('[data-open]');
  if (op) { e.preventDefault(); $('#quickopen').hidden = true; $('#search').value = ''; openNote(op.dataset.open); return; }
  const a = e.target.closest('a');
  if (a) {
    const href = a.getAttribute('href') || '';
    if (href.startsWith('#note:')) { e.preventDefault(); openNote(decodeURIComponent(href.slice(6))); }
    else if (/^https?:/.test(href)) { e.preventDefault(); window.vault.openExternal(href); }
    return;
  }
  if (!e.target.closest('#quickopen') && !e.target.closest('#search')) $('#quickopen').hidden = true;
});

/* sync status */
let lastSyncAt = 0;
function relTime(ts) {
  if (!ts) return '';
  const s = Math.round((Date.now() - ts) / 1000);
  if (s < 45) return 'just now';
  if (s < 3600) return Math.round(s / 60) + 'm ago';
  return Math.round(s / 3600) + 'h ago';
}
function paintSync() {
  const el = $('#sync');
  if (!lastSyncAt) return;
  el.className = '';
  el.textContent = 'synced ' + relTime(lastSyncAt);
}
window.vault.onPull((d) => {
  $('#refresh').classList.remove('spin');
  const el = $('#sync');
  if (d.skipped) { el.className = 'err'; el.textContent = 'not a git repo'; return; }
  if (!d.ok) { el.className = 'err'; el.textContent = 'sync failed'; el.title = d.msg || ''; return; }
  lastSyncAt = d.at || Date.now();
  paintSync();
});
setInterval(paintSync, 30000);

async function pullNow() {
  $('#refresh').classList.add('spin');
  $('#sync').className = 'busy';
  $('#sync').textContent = 'syncing…';
  await window.vault.pull();
  await load(); // ensure view reflects latest even if no file-change event fired
}

document.querySelectorAll('#switch button').forEach((b) => b.addEventListener('click', () => setView(b.dataset.v)));
$('#refresh').addEventListener('click', pullNow);
$('#search').addEventListener('input', (e) => quickOpen(e.target.value));
$('#search').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { const sel = $('#quickopen .qo[data-open]'); if (sel) sel.click(); }
  if (e.key === 'Escape') { $('#quickopen').hidden = true; e.target.blur(); }
});
window.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); $('#search').focus(); }
  if ((e.metaKey || e.ctrlKey) && ['1', '2', '3'].includes(e.key)) {
    e.preventDefault(); setView({ 1: 'dashboard', 2: 'graph', 3: 'files' }[e.key]);
  }
});

window.vault.onChanged(() => load());
load();
