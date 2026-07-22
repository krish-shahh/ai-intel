const $ = (s, r = document) => r.querySelector(s);
const elem = (t, c, h) => { const e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; };
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));

let DATA = { briefs: [], people: [], topics: [], notes: [], tree: null, vaultPath: '' };
let SLUG = {};
let PATHMAP = {};
let COLLAPSED = new Set();
let TREE_FILTER = '';
let VIEW = 'dashboard';
let CURRENT = null;
let GRAPH = null;
let QUICK_INDEX = 0;
let EXPANDED_MONTH = null;
let EXPANDED_WEEK = null;
let FILE_HISTORY = [];
let FILE_HISTORY_INDEX = -1;
let READER_SCROLL = new Map();
let COMMAND_RETURN_FOCUS = null;
let TREE_FOCUS_KEY = null;

const LAST_READ_KEY = 'ai-intel:last-read-brief';
const LAST_FILE_KEY = 'ai-intel:last-file';

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
const SESSION_SHORT = { morning: 'AM', evening: 'PM' };
function briefLabel(b) {
  const session = SESSION_SHORT[b.data.session] || cap(b.data.session || '');
  return `${fmtDate(b.data.date) || b.slug}${session ? ' ' + session : ''}`;
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
  const savedPath = localStorage.getItem(LAST_FILE_KEY);
  if (!CURRENT && savedPath && PATHMAP[savedPath]) CURRENT = PATHMAP[savedPath];
  if (!CURRENT || !PATHMAP[CURRENT.path]) CURRENT = DATA.briefs[0] || v.notes[0] || null;
  else CURRENT = PATHMAP[CURRENT.path];
  if (CURRENT && FILE_HISTORY_INDEX < 0) {
    FILE_HISTORY = [CURRENT.path];
    FILE_HISTORY_INDEX = 0;
  }
  render();
}
function selectNote(note, record = true) {
  if (!note) return;
  if (CURRENT && CURRENT.path === note.path && VIEW === 'files') return;
  const previousReader = document.querySelector('.reader');
  if (CURRENT && previousReader) READER_SCROLL.set(CURRENT.path, previousReader.scrollTop);
  CURRENT = note;
  localStorage.setItem(LAST_FILE_KEY, note.path);
  if (record) {
    FILE_HISTORY = FILE_HISTORY.slice(0, FILE_HISTORY_INDEX + 1);
    if (FILE_HISTORY.at(-1) !== note.path) FILE_HISTORY.push(note.path);
    FILE_HISTORY_INDEX = FILE_HISTORY.length - 1;
  }
  VIEW = 'files';
  render();
}
function openNote(slug) {
  if (!SLUG[slug]) return;
  selectNote(SLUG[slug]);
}
function moveFileHistory(delta) {
  const next = FILE_HISTORY_INDEX + delta;
  if (next < 0 || next >= FILE_HISTORY.length) return;
  FILE_HISTORY_INDEX = next;
  selectNote(PATHMAP[FILE_HISTORY[next]], false);
}
function setView(v) {
  const reader = document.querySelector('.reader');
  if (VIEW === 'files' && CURRENT && reader) READER_SCROLL.set(CURRENT.path, reader.scrollTop);
  VIEW = v;
  render();
}
function unreadBriefs() {
  const lastRead = localStorage.getItem(LAST_READ_KEY);
  if (!lastRead) return DATA.briefs.slice(0, 1);
  const index = DATA.briefs.findIndex((b) => b.slug === lastRead);
  return index < 0 ? DATA.briefs.slice(0, 1) : DATA.briefs.slice(0, index);
}
function markCaughtUp() {
  const latest = DATA.briefs[0];
  if (!latest) return;
  localStorage.setItem(LAST_READ_KEY, latest.slug);
  render();
}

/* ---------------- Dashboard ---------------- */
function Dashboard() {
  const wrap = elem('div', 'dash');
  const latest = DATA.briefs[0];
  const nr = nextRun().toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' });
  const unread = unreadBriefs();
  const sessionLabel = unread.length ? `${unread.length} new since your last visit` : 'Latest brief';

  const recent = DATA.briefs.slice(0, 8).map((b) =>
    `<button class="brow" type="button" data-open="${esc(b.slug)}"><span>${esc(fmtDate(b.data.date) || b.slug)}</span><span class="s">${esc(b.data.session || '')}</span></button>`
  ).join('') || '<div class="how">No briefs yet.</div>';

  wrap.appendChild(elem('aside', 'rail', `
    <div class="rblk session"><div class="lbl">Reading session</div><div class="session-state">${esc(sessionLabel)}</div><div class="cad">Next brief ${esc(nr)}</div></div>
    <div class="rblk history"><div class="lbl">Recent</div><div class="blist">${recent}</div></div>
    <details class="health rblk foot"><summary><span>System health</span><span class="health-summary" id="healthsummary">Checking</span></summary><div class="status" id="statusblk"><div class="srow ok2"><span class="sdot"></span>Checking status…</div></div></details>`));

  const chips = (slugs) => slugs
    .map((slug) => SLUG[slug])
    .filter(Boolean)
    .map((p) => `<button class="chip" type="button" data-open="${esc(p.slug)}">${esc(noteTitle(p))}</button>`).join('');

  const canvas = elem('section', 'canvas');
  if (latest) {
    canvas.innerHTML = `
      <div class="eyebrow">${esc(sessionLabel)}</div>
      <h1 class="title">${esc(cap(latest.data.session))} brief</h1>
      <div class="briefline"><div class="meta">${esc(fmtDate(latest.data.date, true))} · ${(latest.data.people || []).length} people · ${(latest.data.topics || []).length} topics</div>${unread.length ? '<button class="caught-up" type="button" data-caught-up>Mark caught up</button>' : '<span class="caught-label">Caught up</span>'}</div>
      <article class="prose">${latest.html}</article>
      <div class="browse">
        ${(latest.data.people || []).length ? `<div class="lbl">People in this brief</div><div class="chips">${chips(latest.data.people)}</div>` : ''}
        ${(latest.data.topics || []).length ? `<div class="lbl">Topics in this brief</div><div class="chips">${chips(latest.data.topics)}</div>` : ''}
      </div>`;
  } else {
    canvas.innerHTML = `<div class="empty">No briefs yet — the first one lands ${esc(nr)}.</div>`;
  }
  wrap.appendChild(canvas);
  return wrap;
}

/* ---------------- Graph ---------------- */
function monthKey(date) { return date.slice(0, 7); }
function weekKey(date) {
  const d = new Date(date + 'T12:00:00');
  const monday = new Date(d); monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return monday.toISOString().slice(0, 10);
}
function monthLabel(key) {
  const [y, m] = key.split('-');
  return new Date(+y, +m - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}
function weekLabel(key) {
  const start = new Date(key + 'T12:00:00');
  const end = new Date(start); end.setDate(start.getDate() + 6);
  return `${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}–${end.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
}
function briefRefs(b, have) {
  const refs = new Set();
  (b.data.people || []).forEach((s) => have.has('person:' + s) && refs.add('person:' + s));
  (b.data.topics || []).forEach((s) => have.has('topic:' + s) && refs.add('topic:' + s));
  (b.links || []).forEach((s) => { if (have.has('person:' + s)) refs.add('person:' + s); else if (have.has('topic:' + s)) refs.add('topic:' + s); });
  return refs;
}
function buildGraphData() {
  const nodes = [], links = [], have = new Set();
  const add = (id, label, type) => { if (!have.has(id)) { have.add(id); nodes.push({ id, label, type, kind: 'leaf' }); } };
  DATA.people.forEach((p) => add('person:' + p.slug, p.data.name || p.slug, 'person'));
  DATA.topics.forEach((t) => add('topic:' + t.slug, t.data.title || t.slug, 'topic'));

  const months = new Map();
  for (const b of DATA.briefs) {
    if (!b.data.date) continue;
    const mk = monthKey(b.data.date), wk = weekKey(b.data.date);
    if (!months.has(mk)) months.set(mk, new Map());
    const weeks = months.get(mk);
    if (!weeks.has(wk)) weeks.set(wk, []);
    weeks.get(wk).push(b);
  }

  for (const [mk, weeks] of months) {
    const monthId = 'month:' + mk;
    const monthExpanded = mk === EXPANDED_MONTH;
    let monthCount = 0; for (const bs of weeks.values()) monthCount += bs.length;
    nodes.push({ id: monthId, label: monthLabel(mk), type: 'month', baseType: 'brief', kind: 'cluster', count: monthCount });

    if (!monthExpanded) {
      const refs = new Set();
      for (const bs of weeks.values()) for (const b of bs) for (const r of briefRefs(b, have)) refs.add(r);
      refs.forEach((r) => links.push({ source: monthId, target: r }));
      continue;
    }

    for (const [wk, briefs] of weeks) {
      const weekId = 'week:' + wk;
      links.push({ source: monthId, target: weekId, hier: true });
      const weekExpanded = wk === EXPANDED_WEEK;
      nodes.push({ id: weekId, label: weekLabel(wk), type: 'week', baseType: 'brief', kind: 'cluster', count: briefs.length, parent: monthId });

      if (!weekExpanded) {
        const refs = new Set();
        for (const b of briefs) for (const r of briefRefs(b, have)) refs.add(r);
        refs.forEach((r) => links.push({ source: weekId, target: r }));
        continue;
      }

      for (const b of briefs) {
        const briefId = 'brief:' + b.slug;
        have.add(briefId);
        nodes.push({ id: briefId, label: briefLabel(b), type: 'brief', kind: 'leaf', parent: weekId });
        links.push({ source: weekId, target: briefId, hier: true });
        for (const r of briefRefs(b, have)) links.push({ source: briefId, target: r });
      }
    }
  }
  return { nodes, links };
}
function Graph() {
  const wrap = elem('div', 'graphwrap');
  const cv = elem('canvas');
  wrap.appendChild(cv);
  const legend = elem('div', 'legend', `
    <div class="row" data-gtype="brief"><span class="swatch" style="background:var(--brief)"></span>Briefs</div>
    <div class="row" data-gtype="person"><span class="swatch" style="background:var(--person)"></span>People</div>
    <div class="row" data-gtype="topic"><span class="swatch" style="background:var(--topic)"></span>Topics</div>`);
  wrap.appendChild(legend);
  wrap.appendChild(elem('div', 'ghint', 'drag to pan · scroll to zoom · click a cluster to expand · click a note to open · click legend to filter'));
  legend.addEventListener('click', (e) => {
    const row = e.target.closest('.row');
    if (!row || !GRAPH) return;
    row.classList.toggle('off', GRAPH.toggleType(row.dataset.gtype));
  });
  const onNodeClick = (n) => {
    if (n.kind !== 'cluster') { openNote(n.id.split(':').slice(1).join(':')); return; }
    if (n.type === 'month') {
      const mk = n.id.slice('month:'.length);
      EXPANDED_MONTH = EXPANDED_MONTH === mk ? null : mk;
      EXPANDED_WEEK = null;
    } else if (n.type === 'week') {
      const wk = n.id.slice('week:'.length);
      EXPANDED_WEEK = EXPANDED_WEEK === wk ? null : wk;
    }
    GRAPH.update(buildGraphData());
  };
  // init after layout so canvas has size
  requestAnimationFrame(() => {
    if (GRAPH) GRAPH.destroy();
    GRAPH = window.ForceGraph(cv, buildGraphData(), onNodeClick);
  });
  return wrap;
}

/* ---------------- Files (tree) ---------------- */
function nodeMatches(node, q) {
  if (node.type === 'file') return node.name.toLowerCase().includes(q);
  return (node.children || []).some((c) => nodeMatches(c, q));
}
function briefTreeRows(depth, out, q) {
  const months = new Map();
  for (const brief of DATA.briefs) {
    if (q && !`${brief.name} ${briefLabel(brief)}`.toLowerCase().includes(q)) continue;
    const key = (brief.data.date || brief.slug).slice(0, 7);
    if (!months.has(key)) months.set(key, []);
    months.get(key).push(brief);
  }
  for (const [key, briefs] of months) {
    const id = `brief-month:${key}`;
    const collapsed = !q && COLLAPSED.has(id);
    out.push(`<button type="button" role="treeitem" aria-level="${depth + 1}" tabindex="-1" class="tnode tdir" data-dir="${id}" data-depth="${depth}" aria-expanded="${!collapsed}" style="padding-left:${depth * 14 + 8}px"><span class="chev">${collapsed ? '▸' : '▾'}</span><span class="tname">${esc(monthLabel(key))}</span><span class="tcount">${briefs.length}</span></button>`);
    if (!collapsed) for (const brief of briefs) {
      const sel = CURRENT && CURRENT.path === brief.path ? ' sel' : '';
      out.push(`<button type="button" role="treeitem" aria-level="${depth + 2}" tabindex="${sel ? '0' : '-1'}" class="tnode tfile${sel}" data-path="${esc(brief.path)}" data-depth="${depth + 1}"${sel ? ' aria-current="page"' : ''} style="padding-left:${(depth + 1) * 14 + 24}px">${esc(briefLabel(brief))}</button>`);
    }
  }
}
function treeRows(node, depth, out, q) {
  for (const child of (node.children || [])) {
    if (q && !nodeMatches(child, q)) continue;
    if (child.type === 'dir') {
      const collapsed = !q && COLLAPSED.has(child.path);
      const count = countFiles(child);
      out.push(`<button type="button" role="treeitem" aria-level="${depth + 1}" tabindex="-1" class="tnode tdir" data-dir="${esc(child.path)}" data-depth="${depth}" aria-expanded="${!collapsed}" style="padding-left:${depth * 14 + 8}px"><span class="chev">${collapsed ? '▸' : '▾'}</span><span class="tname">${esc(child.name)}</span><span class="tcount">${count}</span></button>`);
      if (!collapsed && child.path === 'briefs') briefTreeRows(depth + 1, out, q);
      else if (!collapsed) treeRows(child, depth + 1, out, q);
    } else {
      const sel = CURRENT && CURRENT.path === child.path ? ' sel' : '';
      out.push(`<button type="button" role="treeitem" aria-level="${depth + 1}" tabindex="${sel ? '0' : '-1'}" class="tnode tfile${sel}" data-path="${esc(child.path)}" data-depth="${depth}"${sel ? ' aria-current="page"' : ''} style="padding-left:${depth * 14 + 24}px">${esc(child.name)}</button>`);
    }
  }
}
function countFiles(node) {
  let n = 0;
  for (const c of (node.children || [])) n += c.type === 'file' ? 1 : countFiles(c);
  return n;
}
function renderTreeRows(rowsEl) {
  const q = TREE_FILTER.trim().toLowerCase();
  const rows = [];
  if (DATA.tree) treeRows(DATA.tree, 0, rows, q);
  rowsEl.innerHTML = rows.join('') || `<div class="how">${q ? 'No matches.' : 'Empty vault.'}</div>`;
  const nodes = rowsEl.querySelectorAll('.tnode');
  const focused = TREE_FOCUS_KEY && rowsEl.querySelector(`[data-path="${CSS.escape(TREE_FOCUS_KEY)}"], [data-dir="${CSS.escape(TREE_FOCUS_KEY)}"]`);
  if (focused) { nodes.forEach((node) => { node.tabIndex = node === focused ? 0 : -1; }); requestAnimationFrame(() => focused.focus()); }
  if (nodes.length && !rowsEl.querySelector('.tnode[tabindex="0"]')) nodes[0].tabIndex = 0;
}
function focusTreeNode(rowsEl, node) {
  rowsEl.querySelectorAll('.tnode').forEach((item) => { item.tabIndex = item === node ? 0 : -1; });
  node.focus();
  node.scrollIntoView({ block: 'nearest' });
}
function onTreeKeydown(e, rowsEl) {
  const current = e.target.closest('.tnode');
  if (!current) return;
  TREE_FOCUS_KEY = current.dataset.path || current.dataset.dir || null;
  const nodes = [...rowsEl.querySelectorAll('.tnode')];
  const index = nodes.indexOf(current);
  if (e.key === 'ArrowDown' && nodes[index + 1]) { e.preventDefault(); focusTreeNode(rowsEl, nodes[index + 1]); }
  if (e.key === 'ArrowUp' && nodes[index - 1]) { e.preventDefault(); focusTreeNode(rowsEl, nodes[index - 1]); }
  if (e.key === 'Home' && nodes[0]) { e.preventDefault(); focusTreeNode(rowsEl, nodes[0]); }
  if (e.key === 'End' && nodes.length) { e.preventDefault(); focusTreeNode(rowsEl, nodes[nodes.length - 1]); }
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); current.click(); }
  if (e.key === 'ArrowRight' && current.matches('[data-dir]')) {
    e.preventDefault();
    if (current.getAttribute('aria-expanded') === 'false') current.click();
    else if (nodes[index + 1]) focusTreeNode(rowsEl, nodes[index + 1]);
  }
  if (e.key === 'ArrowLeft') {
    e.preventDefault();
    if (current.matches('[data-dir]') && current.getAttribute('aria-expanded') === 'true') { current.click(); return; }
    const depth = Number(current.dataset.depth);
    for (let i = index - 1; i >= 0; i--) {
      if (Number(nodes[i].dataset.depth) < depth) { focusTreeNode(rowsEl, nodes[i]); break; }
    }
  }
}
function noteBacklinks(note) {
  return DATA.notes.filter((candidate) => (candidate.links || []).includes(note.slug)).length;
}
function addReaderOutline(reader) {
  const body = reader.querySelector('.reader-body');
  const outline = reader.querySelector('.outline');
  if (!body || !outline) return;
  const headings = [...body.querySelectorAll('h2, h3')];
  if (!headings.length) { outline.hidden = true; return; }
  outline.innerHTML = `<div class="outline-label">On this page</div>${headings.map((heading, index) => {
    heading.id = `section-${index + 1}`;
    return `<button type="button" class="outline-link ${heading.tagName === 'H3' ? 'sub' : ''}" data-section="${heading.id}">${esc(heading.textContent)}</button>`;
  }).join('')}`;
}
function Files() {
  const wrap = elem('div', 'files');
  const tree = elem('aside', 'tree');

  const filterWrap = elem('div', 'treefilter-wrap');
  const filterInput = elem('input', 'treefilter');
  filterInput.type = 'text';
  filterInput.placeholder = 'Filter files…';
  filterInput.setAttribute('aria-label', 'Filter files');
  filterInput.value = TREE_FILTER;
  filterWrap.appendChild(filterInput);

  const rowsEl = elem('div', 'treerows');
  renderTreeRows(rowsEl);
  rowsEl.setAttribute('role', 'tree');
  rowsEl.addEventListener('keydown', (e) => onTreeKeydown(e, rowsEl));
  filterInput.addEventListener('input', () => { TREE_FILTER = filterInput.value; renderTreeRows(rowsEl); });
  filterInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && TREE_FILTER) { TREE_FILTER = ''; filterInput.value = ''; renderTreeRows(rowsEl); }
  });

  tree.appendChild(filterWrap);
  tree.appendChild(rowsEl);

  const reader = elem('section', 'reader');
  reader.addEventListener('scroll', () => { if (CURRENT) READER_SCROLL.set(CURRENT.path, reader.scrollTop); }, { passive: true });
  if (CURRENT) {
    const sub = CURRENT.top === 'briefs'
      ? `${esc(fmtDate(CURRENT.data.date, true))} · ${esc(cap(CURRENT.data.session || ''))}`
      : '';
    const backlinks = noteBacklinks(CURRENT);
    const metaParts = [sub, `${backlinks} backlink${backlinks === 1 ? '' : 's'}`].filter(Boolean).join(' · ');
    reader.innerHTML = `<div class="reader-toolbar"><div class="history-controls"><button type="button" data-history="-1" aria-label="Previous note" title="Previous note" ${FILE_HISTORY_INDEX <= 0 ? 'disabled' : ''}>←</button><button type="button" data-history="1" aria-label="Next note" title="Next note" ${FILE_HISTORY_INDEX >= FILE_HISTORY.length - 1 ? 'disabled' : ''}>→</button></div><span class="file-kind">${esc(CURRENT.top || 'note')}</span></div><h1 class="rhead">${esc(noteTitle(CURRENT))}</h1><div class="rmeta">${esc(metaParts)}</div><div class="reader-layout"><article class="prose reader-body">${CURRENT.html}</article><aside class="outline" aria-label="Document outline"></aside></div>`;
    addReaderOutline(reader);
  } else {
    reader.innerHTML = `<div class="empty">Select a note.</div>`;
  }
  wrap.appendChild(tree); wrap.appendChild(reader);
  return wrap;
}

/* ---------------- shell ---------------- */
function render() {
  if (GRAPH && VIEW !== 'graph') { GRAPH.destroy(); GRAPH = null; }
  document.querySelectorAll('#switch button').forEach((b) => {
    const active = b.dataset.v === VIEW;
    b.classList.toggle('active', active);
    active ? b.setAttribute('aria-current', 'page') : b.removeAttribute('aria-current');
  });
  const view = $('#view');
  const prevRows = view.querySelector('.treerows');
  const treeScroll = prevRows ? prevRows.scrollTop : null;
  view.innerHTML = '';
  view.appendChild(VIEW === 'dashboard' ? Dashboard() : VIEW === 'graph' ? Graph() : Files());
  if (VIEW === 'files') {
    const rowsEl = view.querySelector('.treerows');
    if (rowsEl) {
      if (treeScroll != null) rowsEl.scrollTop = treeScroll;
      const sel = rowsEl.querySelector('.tfile.sel');
      if (sel) sel.scrollIntoView({ block: 'nearest' });
    }
    const reader = view.querySelector('.reader');
    if (reader && CURRENT) reader.scrollTop = READER_SCROLL.get(CURRENT.path) || 0;
  }
  if (VIEW === 'dashboard') refreshStatus();
}

/* live CI + sync status (replaces the old static blurb) */
async function refreshStatus() {
  const blk = document.getElementById('statusblk');
  if (!blk) return;
  let s;
  const summary = document.getElementById('healthsummary');
  try { s = await window.vault.status(); } catch (e) {
    blk.innerHTML = '<div class="srow"><span class="sdot err"></span><span>Status unavailable. Check your connection, then retry.</span><button type="button" class="text-action" data-retry-status>Retry</button></div>';
    if (summary) summary.textContent = 'Needs attention';
    return;
  }
  const g = s.git || {}, ci = s.ci || {};
  const rows = [];
  if (!g.repo) rows.push(`<div class="srow ok2"><span class="sdot"></span>This vault is not connected to Git.</div>`);
  else if (g.behind > 0) rows.push(`<div class="srow warn"><span class="sdot err"></span><span>${g.behind} update${g.behind === 1 ? '' : 's'} ready</span><button type="button" class="text-action" id="pullrow">Pull now</button></div>`);
  else if (g.ahead > 0) rows.push(`<div class="srow ok2"><span class="sdot run"></span>${g.ahead} unpushed</div>`);
  else rows.push(`<div class="srow ok2"><span class="sdot ok"></span>up to date</div>`);

  if (!ci.ghOk) {
    rows.push(`<div class="srow ok2"><span class="sdot"></span>Workflow status needs GitHub CLI authentication.</div>`);
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
  if (summary) summary.textContent = g.behind > 0 || !ci.ghOk ? 'Needs attention' : 'All clear';
  const pr = document.getElementById('pullrow');
  if (pr) pr.addEventListener('click', pullNow);
}

/* command palette */
function commandItem(label, hint, attrs, selected = false) {
  return `<button type="button" role="option" aria-selected="${selected}" class="command-item${selected ? ' selected' : ''}" ${attrs}><span>${esc(label)}</span>${hint ? `<small>${esc(hint)}</small>` : ''}</button>`;
}
function renderCommandPalette(q = '') {
  const list = $('#commandlist');
  const query = q.trim().toLowerCase();
  const actions = [
    { label: 'Go to Dashboard', hint: '⌘1', command: 'view:dashboard' },
    { label: 'Go to Graph', hint: '⌘2', command: 'view:graph' },
    { label: 'Go to Files', hint: '⌘3', command: 'view:files' },
    { label: 'Pull latest updates', hint: '', command: 'pull' },
  ].filter((item) => !query || item.label.toLowerCase().includes(query));
  const notes = [...DATA.briefs, ...DATA.people, ...DATA.topics]
    .filter((note) => !query || `${noteTitle(note)} ${note.slug} ${note.top}`.toLowerCase().includes(query))
    .slice(0, query ? 14 : 7);
  let first = true;
  const group = (title, items) => items.length ? `<div class="command-group"><div class="command-heading">${title}</div>${items.map((item) => {
    const html = item.html(first);
    first = false;
    return html;
  }).join('')}</div>` : '';
  const actionGroup = group('Actions', actions.map((item) => ({ html: (selected) => commandItem(item.label, item.hint, `data-command="${item.command}"`, selected) })));
  const noteGroup = group(query ? 'Notes' : 'Recent notes', notes.map((note) => ({ html: (selected) => commandItem(note.top === 'briefs' ? `${briefLabel(note)}` : noteTitle(note), note.top || 'note', `data-open="${esc(note.slug)}"`, selected) })));
  list.innerHTML = actionGroup + noteGroup || '<div class="command-empty">No results found.</div>';
  QUICK_INDEX = 0;
}
function openCommandPalette() {
  const palette = $('#commandpalette');
  COMMAND_RETURN_FOCUS = document.activeElement;
  palette.hidden = false;
  $('#commandinput').value = '';
  renderCommandPalette();
  requestAnimationFrame(() => $('#commandinput').focus());
}
function closeCommandPalette() {
  const palette = $('#commandpalette');
  if (palette.hidden) return;
  palette.hidden = true;
  if (COMMAND_RETURN_FOCUS && document.contains(COMMAND_RETURN_FOCUS)) COMMAND_RETURN_FOCUS.focus();
}
function moveQuickSelection(delta) {
  const options = [...document.querySelectorAll('#commandlist .command-item')];
  if (!options.length) return;
  QUICK_INDEX = (QUICK_INDEX + delta + options.length) % options.length;
  options.forEach((option, index) => {
    const selected = index === QUICK_INDEX;
    option.classList.toggle('selected', selected);
    option.setAttribute('aria-selected', String(selected));
  });
  options[QUICK_INDEX].scrollIntoView({ block: 'nearest' });
}
function runCommand(command) {
  closeCommandPalette();
  if (command.startsWith('view:')) setView(command.slice(5));
  if (command === 'pull') pullNow();
}

document.addEventListener('click', (e) => {
  const op = e.target.closest('[data-open]');
  if (op) { e.preventDefault(); closeCommandPalette(); openNote(op.dataset.open); return; }
  const command = e.target.closest('[data-command]');
  if (command) { runCommand(command.dataset.command); return; }
  if (e.target.closest('[data-caught-up]')) { markCaughtUp(); return; }
  if (e.target.closest('[data-retry-status]')) { refreshStatus(); return; }
  const history = e.target.closest('[data-history]');
  if (history) { moveFileHistory(Number(history.dataset.history)); return; }
  const section = e.target.closest('[data-section]');
  if (section) { document.getElementById(section.dataset.section)?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }); return; }
  const td = e.target.closest('[data-dir]');
  if (td) { const p = td.dataset.dir; COLLAPSED.has(p) ? COLLAPSED.delete(p) : COLLAPSED.add(p); render(); return; }
  const tp = e.target.closest('[data-path]');
  if (tp) { selectNote(PATHMAP[tp.dataset.path]); return; }
  const a = e.target.closest('a');
  if (a) {
    const href = a.getAttribute('href') || '';
    if (href.startsWith('#note:')) { e.preventDefault(); openNote(decodeURIComponent(href.slice(6))); }
    else if (/^https?:/.test(href)) { e.preventDefault(); window.vault.openExternal(href); }
    return;
  }
  if (e.target.id === 'commandpalette') closeCommandPalette();
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
  if (d.skipped) { el.className = 'err'; el.textContent = 'Vault is not connected to Git'; return; }
  if (!d.ok) { el.className = 'err'; el.textContent = 'Sync failed. Open System health to retry.'; el.title = d.msg || ''; return; }
  lastSyncAt = d.at || Date.now();
  paintSync();
});
setInterval(paintSync, 30000);

async function pullNow() {
  const refresh = $('#refresh');
  if (refresh.disabled) return;
  refresh.disabled = true;
  $('#refresh').classList.add('spin');
  $('#sync').className = 'busy';
  $('#sync').textContent = 'syncing…';
  try {
    await window.vault.pull();
    await load(); // ensure view reflects latest even if no file-change event fired
    refreshStatus();
  } finally {
    refresh.disabled = false;
    refresh.classList.remove('spin');
  }
}

document.querySelectorAll('#switch button').forEach((b) => b.addEventListener('click', () => setView(b.dataset.v)));
$('#refresh').addEventListener('click', pullNow);
$('#commandtrigger').addEventListener('click', openCommandPalette);
$('#commandinput').addEventListener('input', (e) => renderCommandPalette(e.target.value));
$('#commandinput').addEventListener('keydown', (e) => {
  if (e.key === 'ArrowDown') { e.preventDefault(); moveQuickSelection(1); }
  if (e.key === 'ArrowUp') { e.preventDefault(); moveQuickSelection(-1); }
  if (e.key === 'Enter') { const selected = $('#commandlist .command-item.selected'); if (selected) selected.click(); }
  if (e.key === 'Escape') closeCommandPalette();
});
window.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); $('#commandpalette').hidden ? openCommandPalette() : closeCommandPalette(); }
  if (e.key === 'Escape' && !$('#commandpalette').hidden) closeCommandPalette();
  if ((e.metaKey || e.ctrlKey) && ['1', '2', '3'].includes(e.key)) {
    e.preventDefault(); setView({ 1: 'dashboard', 2: 'graph', 3: 'files' }[e.key]);
  }
});

window.vault.onChanged(() => load());
setInterval(() => { if (VIEW === 'dashboard') refreshStatus(); }, 60000);
load();
