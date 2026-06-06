// Minimal canvas force-directed graph. No deps.
// ForceGraph(canvas, {nodes:[{id,label,type}], links:[{source,target}]}, onOpen)
window.ForceGraph = function (canvas, data, onOpen) {
  const ctx = canvas.getContext('2d');
  const nodes = data.nodes.map((n) => ({ ...n, x: 0, y: 0, vx: 0, vy: 0 }));
  const byId = {};
  nodes.forEach((n) => (byId[n.id] = n));
  const links = data.links.filter((l) => byId[l.source] && byId[l.target]);

  const deg = {};
  links.forEach((l) => { deg[l.source] = (deg[l.source] || 0) + 1; deg[l.target] = (deg[l.target] || 0) + 1; });
  nodes.forEach((n) => (n.deg = deg[n.id] || 0));
  const nbr = {};
  links.forEach((l) => {
    (nbr[l.source] = nbr[l.source] || new Set()).add(l.target);
    (nbr[l.target] = nbr[l.target] || new Set()).add(l.source);
  });

  nodes.forEach((n, i) => {
    const a = (i / Math.max(1, nodes.length)) * Math.PI * 2;
    n.x = Math.cos(a) * 140 + (Math.random() * 40 - 20);
    n.y = Math.sin(a) * 140 + (Math.random() * 40 - 20);
  });

  const cs = getComputedStyle(document.documentElement);
  const v = (k, f) => (cs.getPropertyValue(k).trim() || f);
  const col = { brief: v('--brief', '#7c6cff'), person: v('--person', '#36b6a4'), topic: v('--topic', '#e0883b') };
  const lineCol = v('--line', '#2b2b33');
  const inkCol = v('--ink', '#e8e8ec');

  let W = 0, H = 0;
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const cam = { x: 0, y: 0, z: 1 };
  let hover = null, drag = null, dragging = false, panning = false, down = null, raf = null;

  function resize() {
    const r = canvas.getBoundingClientRect();
    W = r.width; H = r.height;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  const radius = (n) => 4 + Math.min(11, n.deg * 1.7) + (n.type === 'brief' ? 2 : 0);
  const toScreen = (n) => ({ x: W / 2 + cam.x + n.x * cam.z, y: H / 2 + cam.y + n.y * cam.z });
  const fromScreen = (px, py) => ({ x: (px - W / 2 - cam.x) / cam.z, y: (py - H / 2 - cam.y) / cam.z });

  function tick() {
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        let dx = a.x - b.x, dy = a.y - b.y;
        const d2 = dx * dx + dy * dy + 0.01, d = Math.sqrt(d2);
        if (d > 420) continue;
        const f = 2400 / d2, fx = (dx / d) * f, fy = (dy / d) * f;
        a.vx += fx; a.vy += fy; b.vx -= fx; b.vy -= fy;
      }
    }
    for (const l of links) {
      const a = byId[l.source], b = byId[l.target];
      let dx = b.x - a.x, dy = b.y - a.y;
      const d = Math.sqrt(dx * dx + dy * dy) || 0.01;
      const f = (d - 74) * 0.02, fx = (dx / d) * f, fy = (dy / d) * f;
      a.vx += fx; a.vy += fy; b.vx -= fx; b.vy -= fy;
    }
    for (const n of nodes) {
      n.vx += -n.x * 0.004; n.vy += -n.y * 0.004;
      n.vx *= 0.86; n.vy *= 0.86;
      if (n !== drag) { n.x += n.vx; n.y += n.vy; }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.lineWidth = 1;
    for (const l of links) {
      const a = toScreen(byId[l.source]), b = toScreen(byId[l.target]);
      const hot = hover && (l.source === hover.id || l.target === hover.id);
      ctx.strokeStyle = hot ? col[hover.type] : lineCol;
      ctx.globalAlpha = hot ? 0.9 : 0.5;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    for (const n of nodes) {
      const s = toScreen(n), r = radius(n) * cam.z;
      const dim = hover && hover !== n && !(nbr[hover.id] && nbr[hover.id].has(n.id));
      ctx.globalAlpha = dim ? 0.22 : 1;
      ctx.fillStyle = col[n.type] || '#888';
      ctx.beginPath(); ctx.arc(s.x, s.y, r, 0, 7); ctx.fill();
      if (n === hover || n.deg >= 2 || cam.z > 1.4) {
        ctx.fillStyle = inkCol; ctx.globalAlpha = dim ? 0.3 : 0.92;
        ctx.font = '11px -apple-system, system-ui, sans-serif';
        ctx.fillText(n.label, s.x + r + 5, s.y + 4);
      }
    }
    ctx.globalAlpha = 1;
  }

  function loop() { tick(); tick(); draw(); raf = requestAnimationFrame(loop); }

  function nodeAt(px, py) {
    let best = null, bd = Infinity;
    for (const n of nodes) {
      const s = toScreen(n);
      const d = (s.x - px) ** 2 + (s.y - py) ** 2;
      const rr = (radius(n) * cam.z + 6) ** 2;
      if (d < rr && d < bd) { bd = d; best = n; }
    }
    return best;
  }
  const rel = (e) => { const r = canvas.getBoundingClientRect(); return { px: e.clientX - r.left, py: e.clientY - r.top }; };

  canvas.addEventListener('mousedown', (e) => {
    const { px, py } = rel(e); down = { px, py };
    drag = nodeAt(px, py); dragging = !!drag;
    if (!drag) { panning = true; down.cx = cam.x; down.cy = cam.y; }
  });
  window.addEventListener('mousemove', (e) => {
    const { px, py } = rel(e);
    if (dragging && drag) { const w = fromScreen(px, py); drag.x = w.x; drag.y = w.y; drag.vx = drag.vy = 0; }
    else if (panning && down) { cam.x = down.cx + (px - down.px); cam.y = down.cy + (py - down.py); }
    else { hover = nodeAt(px, py); canvas.style.cursor = hover ? 'pointer' : 'grab'; }
  });
  window.addEventListener('mouseup', (e) => {
    if (drag && down) {
      const { px, py } = rel(e);
      if (Math.hypot(px - down.px, py - down.py) < 4 && onOpen) onOpen(drag);
    }
    drag = null; dragging = false; panning = false; down = null;
  });
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    cam.z = Math.max(0.3, Math.min(3, cam.z * (e.deltaY < 0 ? 1.1 : 0.9)));
  }, { passive: false });

  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize(); loop();

  return { destroy() { cancelAnimationFrame(raf); ro.disconnect(); } };
};
