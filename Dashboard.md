```dataviewjs
/* ============ styles ============ */
const style = document.createElement('style');
style.textContent = `
.markdown-preview-view:has(.aii) .markdown-preview-sizer{max-width:100% !important;}
.aii{font-size:14px;}
.aii .hero{display:flex;flex-wrap:wrap;align-items:center;gap:10px 16px;
  background:linear-gradient(135deg,var(--background-secondary),var(--background-secondary-alt));
  border:1px solid var(--background-modifier-border);border-radius:16px;padding:16px 20px;margin:2px 0 14px;}
.aii .hero .t{font-size:1.5em;font-weight:800;letter-spacing:-.01em;}
.aii .pill{background:var(--background-modifier-hover);border-radius:999px;padding:5px 13px;font-weight:600;}
.aii .pill.go{background:var(--interactive-accent);color:var(--text-on-accent);}
.aii .muted{opacity:.6;}
.aii .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:14px;}
.aii .card{background:var(--background-secondary);border:1px solid var(--background-modifier-border);
  border-radius:16px;padding:15px 17px;}
.aii .card h3{margin:0 0 11px;font-size:.72em;letter-spacing:.08em;text-transform:uppercase;opacity:.55;}
.aii .stats{display:flex;gap:26px;}
.aii .stats .n{font-size:2.1em;font-weight:800;line-height:1;}
.aii .stats .l{font-size:.7em;opacity:.55;text-transform:uppercase;letter-spacing:.05em;margin-top:3px;}
.aii .chips{display:flex;flex-wrap:wrap;gap:7px;}
.aii .chip{background:var(--background-modifier-hover);border-radius:999px;padding:3px 11px;font-size:.88em;cursor:pointer;}
.aii .chip b{opacity:.5;font-weight:700;margin-left:6px;}
.aii a.aii-link{font-weight:700;cursor:pointer;}
.aii .tldr{margin-top:7px;opacity:.75;line-height:1.45;}
.aii .how{display:flex;flex-direction:column;gap:7px;}
.aii .how div{display:flex;gap:9px;align-items:baseline;}
.aii .how .k{font-size:1.05em;width:18px;text-align:center;}
`;
dv.container.appendChild(style);

/* ============ data ============ */
const briefs = dv.pages('"briefs"').sort(b => b.date, 'desc');
const people = dv.pages('"people"');
const topics = dv.pages('"topics"');
const latest = briefs.length ? briefs[0] : null;

const now = new Date();
let next = null;
for (let d = 0; d < 2 && !next; d++) for (const h of [8, 20]) {
  const c = new Date(now); c.setDate(now.getDate() + d); c.setHours(h, 0, 0, 0);
  if (c > now) { next = c; break; }
}
const nextStr = next.toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' });

const tally = (f) => {
  const m = {};
  for (const b of briefs) for (const x of (b[f] || [])) m[x] = (m[x] || 0) + 1;
  return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 8);
};
const topPeople = tally('people'), topTopics = tally('topics');

let tldr = '';
if (latest) try {
  const lines = (await dv.io.load(latest.file.path)).split('\n');
  const i = lines.findIndex(l => /^TL;DR/i.test(l.trim()));
  tldr = (i >= 0 ? lines[i + 1] : lines.find(l => l.trim() && !/^(---|#|date:|session:|tags:|people:|topics:)/.test(l.trim()))) || '';
  tldr = tldr.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').trim();
} catch (e) {}

/* ============ render ============ */
const il = (slug, label) => `<a class="aii-link" data-href="${slug}">${label || slug}</a>`;
const chips = (arr) => arr.length
  ? arr.map(([k, n]) => `<span class="chip" data-href="${k}">${k}<b>${n}</b></span>`).join('')
  : '<span class="muted">— nothing yet</span>';

const el = dv.el('div', '', { cls: 'aii' });
el.innerHTML = `
<div class="hero">
  <span class="t">🗞️ ai-intel</span>
  <span class="pill">⏰ 8:00 AM & 8:00 PM EST</span>
  <span class="pill go">⏭️ Next run · ${nextStr}</span>
</div>
<div class="grid">
  <div class="card">
    <h3>At a glance</h3>
    <div class="stats">
      <div><div class="n">${briefs.length}</div><div class="l">briefs</div></div>
      <div><div class="n">${people.length}</div><div class="l">people</div></div>
      <div><div class="n">${topics.length}</div><div class="l">topics</div></div>
    </div>
  </div>
  <div class="card">
    <h3>Latest brief</h3>
    ${latest ? `${il(latest.file.name)} <span class="muted">· ${latest.session || ''}</span>
      <div class="tldr">${tldr ? (tldr.length > 180 ? tldr.slice(0, 180) + '…' : tldr) : ''}</div>`
      : '<span class="muted">No briefs yet — first one lands next run.</span>'}
  </div>
  <div class="card">
    <h3>How it works</h3>
    <div class="how">
      <div><span class="k">📅</span><span>Auto-writes twice a day, 8am &amp; 8pm EST</span></div>
      <div><span class="k">👀</span><span>View in <b>Reading mode</b>; syncs via Obsidian&nbsp;Git</span></div>
      <div><span class="k">🔔</span><span>Phone alert via ntfy topic <b>ai-intel</b></span></div>
    </div>
  </div>
  <div class="card">
    <h3>Top people</h3>
    <div class="chips">${chips(topPeople)}</div>
  </div>
  <div class="card">
    <h3>Top topics</h3>
    <div class="chips">${chips(topTopics)}</div>
  </div>
</div>`;

/* make injected links + chips clickable */
const src = latest ? latest.file.path : '';
el.querySelectorAll('[data-href]').forEach(a =>
  a.addEventListener('click', e => { e.preventDefault(); app.workspace.openLinkText(a.getAttribute('data-href'), src, false); }));
```
