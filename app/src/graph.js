// Minimal canvas force-directed graph. No deps.
// ForceGraph(canvas, {nodes:[{id,label,type,kind,parent,count}], links:[{source,target}]}, onOpen)
// kind: 'cluster' nodes (month/week) toggle expand/collapse via onOpen; 'leaf' nodes open a note.
window.ForceGraph = function (canvas, initialData, onOpen) {
  const ctx = canvas.getContext('2d');
  const typeOf = (n) => n.baseType || n.type;

  let nodes = [], links = [], byId = {}, nbr = {};

  function place(data) {
    const prevById = byId;
    const nextNodes = data.nodes.map((n) => {
      const old = prevById[n.id];
      if (old) return { ...old, ...n, x: old.x, y: old.y, vx: old.vx, vy: old.vy };
      const parent = n.parent && prevById[n.parent];
      const x = parent ? parent.x + (Math.random() * 40 - 20) : (Math.random() * 60 - 30);
      const y = parent ? parent.y + (Math.random() * 40 - 20) : (Math.random() * 60 - 30);
      return { ...n, x, y, vx: 0, vy: 0 };
    });
    const nextById = {};
    nextNodes.forEach((n) => (nextById[n.id] = n));
    const nextLinks = data.links.filter((l) => nextById[l.source] && nextById[l.target]);
    const nextDeg = {};
    nextLinks.forEach((l) => { nextDeg[l.source] = (nextDeg[l.source] || 0) + 1; nextDeg[l.target] = (nextDeg[l.target] || 0) + 1; });
    nextNodes.forEach((n) => (n.deg = nextDeg[n.id] || 0));
    const nextNbr = {};
    nextLinks.forEach((l) => {
      (nextNbr[l.source] = nextNbr[l.source] || new Set()).add(l.target);
      (nextNbr[l.target] = nextNbr[l.target] || new Set()).add(l.source);
    });
    nodes = nextNodes; links = nextLinks; byId = nextById; nbr = nextNbr;
    drag = drag && byId[drag.id] ? byId[drag.id] : null;
    hover = hover && byId[hover.id] ? byId[hover.id] : null;
    dragging = !!drag;
  }

  const cs = getComputedStyle(document.documentElement);
  const v = (k, f) => (cs.getPropertyValue(k).trim() || f);
  const col = { brief: v('--brief', '#7c6cff'), person: v('--person', '#36b6a4'), topic: v('--topic', '#e0883b') };
  const lineCol = v('--line', '#2b2b33');
  const inkCol = v('--ink', '#e8e8ec');

  let W = 0, H = 0;
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const cam = { x: 0, y: 0, z: 1 };
  let hover = null, drag = null, dragOffset = null, dragging = false, panning = false, down = null, raf = null;
  let alpha = 1;
  const ALPHA_MIN = 0.001, ALPHA_DECAY = 0.012;
  const hiddenTypes = new Set();

  place(initialData);
  const startR = 90 + Math.sqrt(nodes.length) * 32;
  nodes.forEach((n, i) => {
    const a = (i / Math.max(1, nodes.length)) * Math.PI * 2;
    n.x = Math.cos(a) * startR + (Math.random() * 40 - 20);
    n.y = Math.sin(a) * startR + (Math.random() * 40 - 20);
  });

  function resize() {
    const r = canvas.getBoundingClientRect();
    W = r.width; H = r.height;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  const radius = (n) => n.kind === 'cluster'
    ? 10 + Math.min(16, Math.sqrt(n.count || 1) * 3)
    : 4 + Math.min(11, n.deg * 1.7) + (n.type === 'brief' ? 2 : 0);
  const toScreen = (n) => ({ x: W / 2 + cam.x + n.x * cam.z, y: H / 2 + cam.y + n.y * cam.z });
  const fromScreen = (px, py) => ({ x: (px - W / 2 - cam.x) / cam.z, y: (py - H / 2 - cam.y) / cam.z });

  function tick() {
    if (alpha < ALPHA_MIN) return;
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        let dx = a.x - b.x, dy = a.y - b.y;
        const d2 = Math.max(dx * dx + dy * dy, 100), d = Math.sqrt(d2);
        if (d > 650) continue;
        const f = 4200 / d2, fx = (dx / d) * f, fy = (dy / d) * f;
        a.vx += fx; a.vy += fy; b.vx -= fx; b.vy -= fy;
      }
    }
    for (const l of links) {
      const a = byId[l.source], b = byId[l.target];
      let dx = b.x - a.x, dy = b.y - a.y;
      const d = Math.sqrt(dx * dx + dy * dy) || 0.01;
      const rest = l.hier ? 210 : 145, k = l.hier ? 0.011 : 0.01;
      const f = (d - rest) * k, fx = (dx / d) * f, fy = (dy / d) * f;
      a.vx += fx; a.vy += fy; b.vx -= fx; b.vy -= fy;
    }
    for (const n of nodes) {
      n.vx += -n.x * 0.0012; n.vy += -n.y * 0.0012;
      n.vx *= 0.8; n.vy *= 0.8;
      if (n !== drag) { n.x += n.vx * alpha; n.y += n.vy * alpha; }
    }
    alpha = Math.max(ALPHA_MIN, alpha * (1 - ALPHA_DECAY));
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.lineWidth = 1;
    for (const l of links) {
      const na = byId[l.source], nb = byId[l.target];
      if (hiddenTypes.has(typeOf(na)) || hiddenTypes.has(typeOf(nb))) continue;
      const a = toScreen(na), b = toScreen(nb);
      const hot = hover && (l.source === hover.id || l.target === hover.id);
      ctx.strokeStyle = hot ? col[hover.type] : lineCol;
      ctx.globalAlpha = l.hier ? (hot ? 0.7 : 0.35) : (hot ? 0.9 : 0.5);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    for (const n of nodes) {
      if (hiddenTypes.has(typeOf(n))) continue;
      const s = toScreen(n), r = radius(n) * cam.z;
      const dim = hover && hover !== n && !(nbr[hover.id] && nbr[hover.id].has(n.id));
      const color = col[typeOf(n)] || '#888';
      ctx.beginPath(); ctx.arc(s.x, s.y, r, 0, 7);
      if (n.kind === 'cluster') {
        ctx.globalAlpha = (dim ? 0.22 : 1) * 0.3; ctx.fillStyle = color; ctx.fill();
        ctx.globalAlpha = dim ? 0.3 : 0.95; ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke(); ctx.lineWidth = 1;
      } else {
        ctx.globalAlpha = dim ? 0.22 : 1; ctx.fillStyle = color; ctx.fill();
      }
      if (n.kind === 'cluster' || n === hover || n.deg >= 2 || cam.z > 1.4) {
        const label = n.kind === 'cluster' ? `${n.label} · ${n.count}` : n.label;
        ctx.fillStyle = inkCol; ctx.globalAlpha = dim ? 0.3 : 0.92;
        ctx.font = n.kind === 'cluster' ? '600 11px -apple-system, system-ui, sans-serif' : '11px -apple-system, system-ui, sans-serif';
        ctx.fillText(label, s.x + r + 5, s.y + 4);
      }
    }
    ctx.globalAlpha = 1;
  }

  function loop() { tick(); draw(); raf = requestAnimationFrame(loop); }

  function nodeAt(px, py) {
    let best = null, bd = Infinity;
    for (const n of nodes) {
      if (hiddenTypes.has(typeOf(n))) continue;
      const s = toScreen(n);
      const d = (s.x - px) ** 2 + (s.y - py) ** 2;
      const rr = (radius(n) * cam.z + 6) ** 2;
      if (d < rr && d < bd) { bd = d; best = n; }
    }
    return best;
  }
  const rel = (e) => { const r = canvas.getBoundingClientRect(); return { px: e.clientX - r.left, py: e.clientY - r.top }; };

  canvas.addEventListener('pointerdown', (e) => {
    canvas.setPointerCapture(e.pointerId);
    const { px, py } = rel(e); down = { px, py };
    drag = nodeAt(px, py); dragging = !!drag;
    if (drag) {
      const world = fromScreen(px, py);
      dragOffset = { x: drag.x - world.x, y: drag.y - world.y };
      drag.vx = 0; drag.vy = 0;
      canvas.style.cursor = 'grabbing';
    }
    if (!drag) { panning = true; down.cx = cam.x; down.cy = cam.y; }
  });
  canvas.addEventListener('pointermove', (e) => {
    const { px, py } = rel(e);
    if (dragging && drag) {
      const w = fromScreen(px, py);
      drag.x = w.x + dragOffset.x; drag.y = w.y + dragOffset.y;
      drag.vx = 0; drag.vy = 0;
    }
    else if (panning && down) { cam.x = down.cx + (px - down.px); cam.y = down.cy + (py - down.py); }
    else { hover = nodeAt(px, py); canvas.style.cursor = hover ? 'pointer' : 'grab'; }
  });
  canvas.addEventListener('pointerup', (e) => {
    if (drag && down) {
      const { px, py } = rel(e);
      if (Math.hypot(px - down.px, py - down.py) < 4 && onOpen) onOpen(drag);
    }
    if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
    drag = null; dragOffset = null; dragging = false; panning = false; down = null;
    canvas.style.cursor = hover ? 'pointer' : 'grab';
  });
  canvas.addEventListener('pointercancel', (e) => {
    if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
    drag = null; dragOffset = null; dragging = false; panning = false; down = null;
    canvas.style.cursor = 'grab';
  });
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    cam.z = Math.max(0.3, Math.min(3, cam.z * (e.deltaY < 0 ? 1.1 : 0.9)));
  }, { passive: false });

  for (let i = 0; i < 600 && alpha > ALPHA_MIN; i++) tick();

  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize(); loop();

  return {
    destroy() { cancelAnimationFrame(raf); ro.disconnect(); },
    toggleType(t) { hiddenTypes.has(t) ? hiddenTypes.delete(t) : hiddenTypes.add(t); return hiddenTypes.has(t); },
    update(newData) { place(newData); alpha = 1; },
  };
};
