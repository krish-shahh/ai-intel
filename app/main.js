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

function readDir(folder) {
  const dir = path.join(vaultPath, folder);
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith('.md')) continue;
    try {
      const raw = fs.readFileSync(path.join(dir, f), 'utf8');
      const slug = f.replace(/\.md$/, '');
      out.push({ slug, name: slug, folder, ...renderNote(raw) });
    } catch (e) { /* skip unreadable file */ }
  }
  return out;
}

function loadVault() {
  return {
    vaultPath,
    briefs: readDir('briefs').sort((a, b) =>
      (b.data.date || '').localeCompare(a.data.date || '') || a.name.localeCompare(b.name)),
    people: readDir('people').sort((a, b) => a.name.localeCompare(b.name)),
    topics: readDir('topics').sort((a, b) => a.name.localeCompare(b.name)),
  };
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
ipcMain.on('open:external', (_e, url) => { if (/^https?:/.test(url)) shell.openExternal(url); });

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
