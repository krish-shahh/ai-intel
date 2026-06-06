const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const MarkdownIt = require('markdown-it');

const PULL_INTERVAL_MS = 10 * 60 * 1000; // auto-pull every 10 minutes
let pullTimer = null;

const md = new MarkdownIt({ html: false, linkify: true, typographer: true });

let win = null;
// The app lives at <vault>/app, so the vault is the parent directory by default.
let vaultPath = path.resolve(__dirname, '..');
let watcher = null;

function createWindow() {
  win = new BrowserWindow({
    width: 1320,
    height: 880,
    minWidth: 960,
    minHeight: 620,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#16161a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.loadFile(path.join(__dirname, 'src', 'index.html'));
  watchVault();
  win.webContents.on('did-finish-load', startAutoPull);
}

function gitPull(reason) {
  return new Promise((resolve) => {
    if (!fs.existsSync(path.join(vaultPath, '.git'))) {
      const res = { ok: false, skipped: true, reason, at: Date.now() };
      if (win) win.webContents.send('vault:pull', res);
      return resolve(res);
    }
    exec('git pull --ff-only', { cwd: vaultPath, timeout: 60000 }, (err, stdout, stderr) => {
      const out = ((stdout || '') + (stderr || '')).trim();
      const changed = !err && !/Already up to date/i.test(out);
      const res = { ok: !err, changed, reason, at: Date.now(), msg: err ? out : (changed ? 'updated' : 'up to date') };
      if (win) win.webContents.send('vault:pull', res);
      if (changed && win) win.webContents.send('vault:changed');
      resolve(res);
    });
  });
}

function startAutoPull() {
  clearInterval(pullTimer);
  gitPull('startup');
  pullTimer = setInterval(() => gitPull('interval'), PULL_INTERVAL_MS);
}

function watchVault() {
  if (watcher) { try { watcher.close(); } catch (e) {} }
  let t = null;
  try {
    watcher = fs.watch(vaultPath, { recursive: true }, (_ev, file) => {
      if (file && !String(file).endsWith('.md')) return;
      clearTimeout(t);
      t = setTimeout(() => win && win.webContents.send('vault:changed'), 250);
    });
  } catch (e) { /* recursive watch unsupported on some platforms — skip */ }
}

function parseFrontmatter(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---\s*([\s\S]*)$/);
  if (!m) return { data: {}, body: raw };
  const data = {};
  for (const line of m[1].split('\n')) {
    const mm = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!mm) continue;
    let k = mm[1];
    let v = mm[2].trim();
    if (v.startsWith('[') && v.endsWith(']')) {
      data[k] = v.slice(1, -1).split(',').map((s) => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
    } else {
      data[k] = v.replace(/^["']|["']$/g, '');
    }
  }
  return { data, body: m[2] };
}

function wikilinksToMd(body) {
  return body.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g,
    (_, slug, label) => `[${(label || slug).trim()}](#note:${slug.trim()})`);
}

function renderNote(raw) {
  const { data, body } = parseFrontmatter(raw);
  const html = md.render(wikilinksToMd(body));
  const links = [];
  const re = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;
  let mm;
  while ((mm = re.exec(body))) links.push(mm[1].trim());
  return { data, html, links };
}

const IGNORE = new Set(['.git', 'node_modules', 'app', '.obsidian', 'dist', '.github']);

function collect(dir, rel, notes) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return; }
  for (const e of entries) {
    if (e.name.startsWith('.') || IGNORE.has(e.name)) continue;
    const full = path.join(dir, e.name);
    const r = rel ? rel + '/' + e.name : e.name;
    if (e.isDirectory()) collect(full, r, notes);
    else if (e.name.endsWith('.md')) {
      try {
        const raw = fs.readFileSync(full, 'utf8');
        notes.push({
          path: r, name: e.name.replace(/\.md$/, ''), slug: e.name.replace(/\.md$/, ''),
          top: r.includes('/') ? r.split('/')[0] : '', ...renderNote(raw),
        });
      } catch (e2) { /* skip */ }
    }
  }
}

function buildTree(dir, rel) {
  const node = { name: rel ? path.basename(dir) : '', path: rel, type: 'dir', children: [] };
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return node; }
  entries.sort((a, b) => (Number(b.isDirectory()) - Number(a.isDirectory())) || a.name.localeCompare(b.name));
  for (const e of entries) {
    if (e.name.startsWith('.') || IGNORE.has(e.name)) continue;
    const full = path.join(dir, e.name);
    const r = rel ? rel + '/' + e.name : e.name;
    if (e.isDirectory()) { const c = buildTree(full, r); if (c.children.length) node.children.push(c); }
    else if (e.name.endsWith('.md')) node.children.push({ name: e.name.replace(/\.md$/, ''), path: r, type: 'file' });
  }
  return node;
}

function loadVault() {
  const notes = [];
  collect(vaultPath, '', notes);
  return { vaultPath, notes, tree: buildTree(vaultPath, '') };
}

function sh(cmd) {
  return new Promise((res) => exec(cmd, { cwd: vaultPath, timeout: 30000 },
    (e, o, er) => res({ ok: !e, out: (o || '').trim(), err: (er || '').trim() })));
}
async function gitInfo() {
  if (!fs.existsSync(path.join(vaultPath, '.git'))) return { repo: false };
  await sh('git fetch --quiet');
  const branch = (await sh('git rev-parse --abbrev-ref HEAD')).out;
  const c = (await sh('git rev-list --left-right --count HEAD...@{u}')).out.split(/\s+/);
  return { repo: true, branch, ahead: +(c[0] || 0), behind: +(c[1] || 0) };
}
async function ciInfo() {
  const r = await sh('gh run list -L 30 --json workflowName,status,conclusion,createdAt');
  if (!r.ok) return { ghOk: false };
  let runs = [];
  try { runs = JSON.parse(r.out); } catch (e) { return { ghOk: false }; }
  const latest = {};
  for (const run of runs) {
    const n = run.workflowName;
    if (!latest[n] || run.createdAt > latest[n].createdAt) latest[n] = run;
  }
  return { ghOk: true, workflows: Object.values(latest).map((w) =>
    ({ name: w.workflowName, status: w.status, conclusion: w.conclusion, at: w.createdAt })) };
}

ipcMain.handle('vault:load', () => loadVault());
ipcMain.handle('vault:pick', async () => {
  const r = await dialog.showOpenDialog(win, { properties: ['openDirectory'] });
  if (!r.canceled && r.filePaths[0]) {
    vaultPath = r.filePaths[0];
    watchVault();
    startAutoPull();
    return loadVault();
  }
  return null;
});
ipcMain.handle('vault:pull', () => gitPull('manual'));
ipcMain.handle('vault:status', async () => ({ git: await gitInfo(), ci: await ciInfo() }));
ipcMain.on('open:external', (_e, url) => { if (/^https?:/.test(url)) shell.openExternal(url); });

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
