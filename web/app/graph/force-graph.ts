import type { GraphNode, GraphLink } from '../../lib/graph-data';

interface SimNode extends GraphNode {
  x: number; y: number; vx: number; vy: number; deg: number;
}
interface SimLink extends GraphLink {}

export interface ForceGraphData { nodes: GraphNode[]; links: GraphLink[] }

export interface ForceGraphHandle {
  destroy(): void;
  toggleType(t: string): boolean;
  fit(): void;
  reset(): void;
}

const ALPHA_MIN = 0.001;
const ALPHA_DECAY = 0.012;

export function createForceGraph(
  canvas: HTMLCanvasElement,
  data: ForceGraphData,
  colors: Record<string, string>,
  onTap: (node: GraphNode) => void,
  onHover: (node: GraphNode | null) => void
): ForceGraphHandle {
  const ctx = canvas.getContext('2d')!;
  let nodes: SimNode[] = data.nodes.map((n, i) => {
    const a = (i / Math.max(1, data.nodes.length)) * Math.PI * 2;
    const r = 60 + Math.sqrt(data.nodes.length) * 14;
    return { ...n, x: Math.cos(a) * r, y: Math.sin(a) * r, vx: 0, vy: 0, deg: 0 };
  });
  let byId: Record<string, SimNode> = {};
  nodes.forEach((n) => (byId[n.id] = n));
  let links: SimLink[] = data.links.filter((l) => byId[l.source] && byId[l.target]);
  const deg: Record<string, number> = {};
  links.forEach((l) => { deg[l.source] = (deg[l.source] || 0) + 1; deg[l.target] = (deg[l.target] || 0) + 1; });
  nodes.forEach((n) => (n.deg = deg[n.id] || 0));

  const lineCol = getComputedStyle(document.documentElement).getPropertyValue('--line').trim() || '#2b2b33';
  const inkCol = getComputedStyle(document.documentElement).getPropertyValue('--ink').trim() || '#e8e8ec';

  let W = 0, H = 0;
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const cam = { x: 0, y: 0, z: 1 };
  let hover: SimNode | null = null;
  let selected: SimNode | null = null;
  let drag: SimNode | null = null;
  let dragOffset = { x: 0, y: 0 };
  let dragging = false;
  let panning = false;
  let down: { px: number; py: number; cx?: number; cy?: number; moved: boolean } | null = null;
  let raf = 0;
  let alpha = 1;
  const hiddenTypes = new Set<string>();

  // Two-finger pinch-zoom: the original desktop version only ever handled `wheel`
  // for zoom, which never fires on mobile pinch — track active pointers by id and
  // scale off the change in distance between them each move.
  const activePointers = new Map<number, { x: number; y: number }>();
  let pinchStartDist = 0;
  let pinchStartZoom = 1;

  function resize() {
    const r = canvas.getBoundingClientRect();
    W = r.width; H = r.height;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  const radius = (n: SimNode) => (n.type === 'brief' ? 3 + Math.min(6, n.deg) : 6 + Math.min(12, n.deg * 1.7));
  const toScreen = (n: { x: number; y: number }) => ({ x: W / 2 + cam.x + n.x * cam.z, y: H / 2 + cam.y + n.y * cam.z });
  const fromScreen = (px: number, py: number) => ({ x: (px - W / 2 - cam.x) / cam.z, y: (py - H / 2 - cam.y) / cam.z });

  // Repulsion scales up with node count so dense "All"-range graphs (150+ briefs)
  // spread out instead of settling into one unreadable clump.
  const REPULSE = 3400 + nodes.length * 12;
  const MAX_INTERACT_DIST = 500 + Math.min(300, nodes.length * 2);

  function tick() {
    if (alpha < ALPHA_MIN) return;
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const d2 = Math.max(dx * dx + dy * dy, 100), d = Math.sqrt(d2);
        if (d > MAX_INTERACT_DIST) continue;
        const f = REPULSE / d2, fx = (dx / d) * f, fy = (dy / d) * f;
        a.vx += fx; a.vy += fy; b.vx -= fx; b.vy -= fy;
      }
    }
    for (const l of links) {
      const a = byId[l.source], b = byId[l.target];
      const dx = b.x - a.x, dy = b.y - a.y;
      const d = Math.sqrt(dx * dx + dy * dy) || 0.01;
      const rest = 130, k = 0.012;
      const f = (d - rest) * k, fx = (dx / d) * f, fy = (dy / d) * f;
      a.vx += fx; a.vy += fy; b.vx -= fx; b.vy -= fy;
    }
    for (const n of nodes) {
      n.vx += -n.x * 0.0014; n.vy += -n.y * 0.0014;
      n.vx *= 0.8; n.vy *= 0.8;
      if (n !== drag) { n.x += n.vx * alpha; n.y += n.vy * alpha; }
    }
    alpha = Math.max(ALPHA_MIN, alpha * (1 - ALPHA_DECAY));
  }

  function typeOf(n: SimNode) { return n.type; }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.lineWidth = 1;
    for (const l of links) {
      const na = byId[l.source], nb = byId[l.target];
      if (hiddenTypes.has(typeOf(na)) || hiddenTypes.has(typeOf(nb))) continue;
      const a = toScreen(na), b = toScreen(nb);
      const hot = hover && (l.source === hover.id || l.target === hover.id);
      ctx.strokeStyle = hot ? colors[hover!.type] : lineCol;
      ctx.globalAlpha = hot ? 0.85 : 0.4;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    for (const n of nodes) {
      if (hiddenTypes.has(typeOf(n))) continue;
      const s = toScreen(n), r = radius(n) * cam.z;
      const dim = !!hover && hover !== n;
      const color = colors[n.type] || '#888';
      if (n === selected) {
        ctx.globalAlpha = 0.55; ctx.strokeStyle = color; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(s.x, s.y, r + 6, 0, Math.PI * 2); ctx.stroke(); ctx.lineWidth = 1;
      }
      ctx.beginPath(); ctx.arc(s.x, s.y, r, 0, Math.PI * 2 + 1);
      ctx.globalAlpha = dim ? 0.25 : (n.type === 'brief' ? 0.7 : 1);
      ctx.fillStyle = color; ctx.fill();
      // Briefs are dated slugs, not meaningful to skim, and there are far more of
      // them than entities — labeling every one is what turned the graph into text
      // soup. Only entity nodes (person/company/topic) get an always-on label; a
      // brief's label appears only when you're actually interacting with it.
      const showLabel = n.type !== 'brief' ? (n === hover || n.deg >= 1) : (n === hover || n === selected);
      if (showLabel) {
        ctx.fillStyle = inkCol; ctx.globalAlpha = dim ? 0.35 : 0.92;
        ctx.font = n.type === 'brief' ? '10px -apple-system, system-ui, sans-serif' : '600 11px -apple-system, system-ui, sans-serif';
        ctx.fillText(n.label, s.x + r + 5, s.y + 4);
      }
    }
    ctx.globalAlpha = 1;
  }

  function loop() { tick(); draw(); raf = requestAnimationFrame(loop); }

  function nodeAt(px: number, py: number): SimNode | null {
    let best: SimNode | null = null, bd = Infinity;
    for (const n of nodes) {
      if (hiddenTypes.has(typeOf(n))) continue;
      const s = toScreen(n);
      const d = (s.x - px) ** 2 + (s.y - py) ** 2;
      const rr = (radius(n) * cam.z + 8) ** 2;
      if (d < rr && d < bd) { bd = d; best = n; }
    }
    return best;
  }
  const rel = (e: PointerEvent) => { const r = canvas.getBoundingClientRect(); return { px: e.clientX - r.left, py: e.clientY - r.top }; };

  function onPointerDown(e: PointerEvent) {
    canvas.setPointerCapture(e.pointerId);
    const { px, py } = rel(e);
    activePointers.set(e.pointerId, { x: px, y: py });

    if (activePointers.size === 2) {
      const pts = [...activePointers.values()];
      pinchStartDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) || 1;
      pinchStartZoom = cam.z;
      drag = null; dragging = false; panning = false;
      return;
    }

    down = { px, py, moved: false };
    drag = nodeAt(px, py);
    dragging = !!drag;
    if (drag) {
      const world = fromScreen(px, py);
      dragOffset = { x: drag.x - world.x, y: drag.y - world.y };
      drag.vx = 0; drag.vy = 0;
    } else {
      panning = true; down.cx = cam.x; down.cy = cam.y;
    }
  }

  function onPointerMove(e: PointerEvent) {
    const { px, py } = rel(e);

    if (activePointers.has(e.pointerId)) activePointers.set(e.pointerId, { x: px, y: py });

    if (activePointers.size === 2) {
      const pts = [...activePointers.values()];
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) || 1;
      cam.z = Math.max(0.3, Math.min(3, pinchStartZoom * (dist / pinchStartDist)));
      return;
    }

    if (dragging && drag) {
      const w = fromScreen(px, py);
      drag.x = w.x + dragOffset.x; drag.y = w.y + dragOffset.y;
      drag.vx = 0; drag.vy = 0;
      if (down) { down.moved = down.moved || Math.hypot(px - down.px, py - down.py) > 4; }
    } else if (panning && down) {
      cam.x = (down.cx || 0) + (px - down.px); cam.y = (down.cy || 0) + (py - down.py);
      down.moved = down.moved || Math.hypot(px - down.px, py - down.py) > 4;
    } else {
      const h = nodeAt(px, py);
      if (h !== hover) { hover = h; onHover(hover); }
    }
  }

  function onPointerUp(e: PointerEvent) {
    activePointers.delete(e.pointerId);
    if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);

    if (drag && down && !down.moved) {
      selected = drag;
      onTap(drag);
    }
    drag = null; dragging = false; panning = false; down = null;
  }

  function onWheel(e: WheelEvent) {
    e.preventDefault();
    cam.z = Math.max(0.3, Math.min(3, cam.z * (e.deltaY < 0 ? 1.1 : 0.9)));
  }

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);
  canvas.addEventListener('wheel', onWheel, { passive: false });

  for (let i = 0; i < 500 && alpha > ALPHA_MIN; i++) tick();

  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  function fit() {
    const visible = nodes.filter((n) => !hiddenTypes.has(typeOf(n)));
    if (!visible.length || !W || !H) return;
    const xs = visible.map((n) => n.x), ys = visible.map((n) => n.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    const spanX = Math.max(120, maxX - minX), spanY = Math.max(120, maxY - minY);
    cam.z = Math.max(0.3, Math.min(1.6, Math.min((W - 120) / spanX, (H - 100) / spanY)));
    cam.x = -((minX + maxX) / 2) * cam.z; cam.y = -((minY + maxY) / 2) * cam.z;
  }
  fit();
  loop();

  return {
    destroy() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
      canvas.removeEventListener('wheel', onWheel);
    },
    toggleType(t: string) {
      hiddenTypes.has(t) ? hiddenTypes.delete(t) : hiddenTypes.add(t);
      return hiddenTypes.has(t);
    },
    fit,
    reset() {
      const r = 60 + Math.sqrt(nodes.length) * 14;
      nodes.forEach((n, i) => { const a = (i / Math.max(1, nodes.length)) * Math.PI * 2; n.x = Math.cos(a) * r; n.y = Math.sin(a) * r; n.vx = n.vy = 0; });
      cam.x = 0; cam.y = 0; cam.z = 1; selected = null; alpha = 1;
    },
  };
}
