const $ = (s, r = document) => r.querySelector(s);
const elem = (t, c, h) => { const e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; };
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));

let DATA = { briefs: [], people: [], topics: [], notes: [], tree: null, vaultPath: '' };
let SLUG = {};
let PATHMAP = {};
let COLLAPSED = new Set();
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
  if (n.top === 'people') return n.data.name || n.slug;
  if (n.top === 'topics') return n.data.title || n.slug;
  if (n.top === 'briefs') return cap(n.data.session || '') + ' brief';
  return n.name;
}

async function load() {
  const v = await window.vault.load();
  DATA.vaultPath = v.vaultPath; DATA.notes = v.notes; DATA.tree = v.tree;
  const by = (t) => v.notes.filter((n) => n.top === t);
  DATA.briefs = by('briefs').sort((a, b) => (b.data.date || '').localeCompare(a.data.date || '') || a.name.localeCompare(b.name));
  DATA.people = by('people').sort((a, b) => a.name.localeCompare(b.name));
  DATA.topics = by('topics').sort((a, b) => a.name.localeCompare(b.name));
  SLUG = {}; PATHMAP = {};
  for (const n of v.notes) { PATHMAP[n.path] = n; if (!SLUG[n.slug]) SLUG[n.slug] = n; }
  if (!CURRENT || !PATHMAP[CURRENT.path]) CURRENT = DATA.briefs[0] || v.notes[0] || null;
  else CURRENT = PATHMAP[CURRENT.path];
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
    <div class="rblk foot"><div class="lbl">Status</div><div class="status" id="statusblk"><div class="srow ok2"><span class="sdot"></span>checking…</div></div></div>`));

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

/* ---------------- Files (tree) ---------------- */
function treeRows(node, depth, out) {
  for (const child of (node.children || [])) {
    if (child.type === 'dir') {
      const collapsed = COLLAPSED.has(child.path);
      const count = countFiles(child);
      out.push(`<div class="tnode tdir" data-dir="${esc(child.path)}" style="padding-left:${depth * 14 + 8}px"><span class="chev">${collapsed ? '▸' : '▾'}</span><span class="tname">${esc(child.name)}</span><span class="tcount">${count}</span></div>`);
      if (!collapsed) treeRows(child, depth + 1, out);
    } else {
      const sel = CURRENT && CURRENT.path === child.path ? ' sel' : '';
      out.push(`<div class="tnode tfile${sel}" data-path="${esc(child.path)}" style="padding-left:${depth * 14 + 24}px">${esc(child.name)}</div>`);
    }
  }
}
function countFiles(node) {
  let n = 0;
  for (const c of (node.children || [])) n += c.type === 'file' ? 1 : countFiles(c);
  return n;
}
function Files() {
  const wrap = elem('div', 'files');
  const tree = elem('aside', 'tree');
  const rows = [];
  if (DATA.tree) treeRows(DATA.tree, 0, rows);
  tree.innerHTML = rows.join('') || '<div class="how">Empty vault.</div>';

  const reader = elem('section', 'reader');
  if (CURRENT) {
    let sub;
    if (CURRENT.top === 'briefs') {
      sub = `${esc(fmtDate(CURRENT.data.date, true))} · ${esc(cap(CURRENT.data.session || ''))}`;
    } else if (CURRENT.data.handle) {
      const h = String(CURRENT.data.handle).replace(/^@/, '');
      sub = `<a href="https://x.com/${esc(h)}">@${esc(h)}</a>`;
    } else {
      sub = esc(CURRENT.path);
    }
    reader.innerHTML = `<h1 class="rhead">${esc(noteTitle(CURRENT))}</h1><div class="rmeta">${sub}</div><article class="prose">${CURRENT.html}</article>`;
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
  if (VIEW === 'dashboard') refreshStatus();
}

/* live CI + sync status (replaces the old static blurb) */
async function refreshStatus() {
  const blk = document.getElementById('statusblk');
  if (!blk) return;
  let s;
  try { s = await window.vault.status(); } catch (e) { blk.innerHTML = '<div class="srow ok2"><span class="sdot"></span>status unavailable</div>'; return; }
  const g = s.git || {}, ci = s.ci || {};
  const rows = [];
  if (!g.repo) rows.push(`<div class="srow ok2"><span class="sdot"></span>not a git repo</div>`);
  else if (g.behind > 0) rows.push(`<div class="srow warn" id="pullrow"><span class="sdot err"></span>${g.behind} behind · pull now</div>`);
  else if (g.ahead > 0) rows.push(`<div class="srow ok2"><span class="sdot run"></span>${g.ahead} unpushed</div>`);
  else rows.push(`<div class="srow ok2"><span class="sdot ok"></span>up to date</div>`);

  if (!ci.ghOk) {
    rows.push(`<div class="srow ok2"><span class="sdot"></span>CI: needs gh CLI</div>`);
  } else {
    const order = ['Brief notification', 'Brief link check', 'Brief heartbeat'];
    const short = { 'Brief notification': 'notify', 'Brief link check': 'link-check', 'Brief heartbeat': 'heartbeat' };
    const wf = (ci.workflows || []).slice().sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name));
    for (const w of wf) {
      let cls = '';
      if (w.status !== 'completed') cls = 'run';
      else if (w.conclusion === 'success') cls = 'ok';
      else if (['failure', 'timed_out', 'cancelled'].includes(w.conclusion)) cls = 'err';
      rows.push(`<div class="srow"><span class="sdot ${cls}"></span>${esc(short[w.name] || w.name)}<span class="t">${esc(relTime(Date.parse(w.at)))}</span></div>`);
    }
    if (!wf.length) rows.push(`<div class="srow ok2"><span class="sdot"></span>no CI runs yet</div>`);
  }
  blk.innerHTML = rows.join('');
  const pr = document.getElementById('pullrow');
  if (pr) pr.addEventListener('click', pullNow);
}

/* quick open / search */
function quickOpen(q) {
  const box = $('#quickopen');
  q = q.trim().toLowerCase();
  if (!q) { box.hidden = true; return; }
  const all = [...DATA.briefs, ...DATA.people, ...DATA.topics];
  const hits = all.filter((n) => (noteTitle(n) + ' ' + n.slug).toLowerCase().includes(q)).slice(0, 12);
  box.innerHTML = hits.map((n, i) =>
    `<div class="qo${i === 0 ? ' sel' : ''}" data-open="${esc(n.slug)}"><span>${esc(noteTitle(n))}</span><small>${esc(n.top || 'root')}</small></div>`
  ).join('') || '<div class="qo"><span>No matches</span></div>';
  box.hidden = false;
}

document.addEventListener('click', (e) => {
  const op = e.target.closest('[data-open]');
  if (op) { e.preventDefault(); $('#quickopen').hidden = true; $('#search').value = ''; openNote(op.dataset.open); return; }
  const td = e.target.closest('[data-dir]');
  if (td) { const p = td.dataset.dir; COLLAPSED.has(p) ? COLLAPSED.delete(p) : COLLAPSED.add(p); render(); return; }
  const tp = e.target.closest('[data-path]');
  if (tp) { CURRENT = PATHMAP[tp.dataset.path] || CURRENT; render(); return; }
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
  refreshStatus();
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
setInterval(() => { if (VIEW === 'dashboard') refreshStatus(); }, 60000);
load();
