'use strict';
const Ink = (() => {
  const NS = 'http://www.w3.org/2000/svg';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const CH = window.CH || [];

  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const f = n => +(+n).toFixed(1);
  const rand = (a, b) => { const n = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return n - Math.floor(n); };
  const jit = (a, b, amt = 1) => (rand(a, b) - 0.5) * 2 * amt;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const map = (v, a, b, c, d) => c + (v - a) * (d - c) / (b - a);

  const box = (x, y, w, h, s = 0) => `M${f(x)} ${f(y)} ${f(x + w)} ${f(y - 1 + jit(s, 1))} ${f(x + w + 1)} ${f(y + h)} ${f(x - 1)} ${f(y + h + 1 + jit(s, 2))}Z`;
  const rect = (x, y, w, h) => `M${f(x)} ${f(y)}H${f(x + w)}V${f(y + h)}H${f(x)}Z`;
  const tile = (x, y, w, h) => { const g = Math.min(w, h) > 14 ? 2 : 1, r = Math.min(w, h) / 6; return `M${f(x + g + r)} ${f(y + g)}H${f(x + w - g - r)}Q${f(x + w - g)} ${f(y + g)} ${f(x + w - g)} ${f(y + g + r)}V${f(y + h - g - r)}Q${f(x + w - g)} ${f(y + h - g)} ${f(x + w - g - r)} ${f(y + h - g)}H${f(x + g + r)}Q${f(x + g)} ${f(y + h - g)} ${f(x + g)} ${f(y + h - g - r)}V${f(y + g + r)}Q${f(x + g)} ${f(y + g)} ${f(x + g + r)} ${f(y + g)}Z`; };
  const o = (cx, cy, r) => `M${f(cx - r)} ${f(cy)}a${f(r)} ${f(r)} 0 1 0 ${f(r * 2)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-r * 2)} 0`;
  const head = (x1, y1, x2, y2, len = 10) => {
    const a = Math.atan2(y2 - y1, x2 - x1);
    const h = d => `${f(x2 - len * Math.cos(a + d))} ${f(y2 - len * Math.sin(a + d))}`;
    return `M${h(0.5)} ${f(x2)} ${f(y2)} ${h(-0.5)}`;
  };
  const ln = (x1, y1, x2, y2, s = 0) => {
    const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len, w = Math.min(3, len / 40) * (rand(s, 7) > 0.5 ? 1 : -1);
    return `M${f(x1)} ${f(y1)}C${f(x1 + dx / 3 + nx * w)} ${f(y1 + dy / 3 + ny * w)} ${f(x1 + 2 * dx / 3 - nx * w * 0.6)} ${f(y1 + 2 * dy / 3 - ny * w * 0.6)} ${f(x2)} ${f(y2)}`;
  };
  const arr = (x1, y1, x2, y2, s = 0) => ln(x1, y1, x2, y2, s) + head(x1, y1, x2, y2);
  const carr = (x1, y1, x2, y2, bend = 30) => {
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1;
    const cx = mx - dy / len * bend, cy = my + dx / len * bend;
    return `M${f(x1)} ${f(y1)}Q${f(cx)} ${f(cy)} ${f(x2)} ${f(y2)}` + head(cx, cy, x2, y2);
  };
  const poly = pts => pts.map((p, i) => (i ? 'L' : 'M') + f(p[0]) + ' ' + f(p[1])).join('');
  const smooth = pts => {
    if (pts.length < 3) return poly(pts);
    let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`;
    }
    return d;
  };
  const check = (x, y, s = 1) => `M${f(x)} ${f(y)} ${f(x + 8 * s)} ${f(y + 9 * s)} ${f(x + 24 * s)} ${f(y - 12 * s)}`;
  const cross = (x, y, r = 9) => `M${f(x - r)} ${f(y - r)} ${f(x + r)} ${f(y + r)}M${f(x + r)} ${f(y - r)} ${f(x - r)} ${f(y + r)}`;
  const ticks = (x, y) => `M${x} ${y} ${x + 7} ${y - 13}M${x + 4} ${y + 8} ${x + 17} ${y + 3}M${x + 2} ${y + 17} ${x + 13} ${y + 23}`;
  const squig = (x, y, w, amp = 4) => { let d = `M${f(x)} ${f(y)}`; for (let i = 0; i < w; i += 12) d += `q3 ${-amp} 6 0t6 0`; return d; };

  class Sk {
    constructor() { this.L = { b: '', p: '', c: '', a: '', i: '', t: '', x: '' }; this.k = 0; }
    add(l, s) { this.L[l] += s; return this; }
    paper(d, c = '') { return this.add('p', `<path class="sk-paper ${c}" d="${d}"/>`); }
    fill(d, c, style = '') { return this.add('p', `<path class="${c}" d="${d}" style="${style}"/>`); }
    zone(d, red = false) { return this.fill(d, red ? 'sk-red-zone' : 'sk-zone'); }
    cell(d, a, neg = false) { return this.add('c', `<path class="${neg ? 'sk-neg' : 'sk-cell'}" style="--a:${(+a).toFixed(3)}" d="${d}"/>`); }
    accent(d, c = '') { return this.add('a', `<path class="sk-accent ${c}" d="${d}"/>`); }
    ink(d, c = 'sk-ink') { return this.add('i', `<path class="${c}" d="${d}" pathLength="1" style="--k:${this.k++}"/>`); }
    pop(d) { return this.ink(d, 'sk-pop'); }
    red(d) { return this.ink(d, 'sk-red'); }
    thin(d) { return this.add('i', `<path class="sk-thin" d="${d}"/>`); }
    dash(d) { return this.add('i', `<path class="sk-dash" d="${d}"/>`); }
    plot(d, c = '') { return this.add('x', `<path class="sk-plot ${c}" d="${d}"/>`); }
    text(x, y, t, o = {}) {
      const font = o.f || 'hand', s = Math.max(o.s || (font === 'mono' ? 12 : 20), font === 'mono' ? 10.5 : 14), a = o.a || 'middle';
      const tr = o.r ? ` transform="rotate(${o.r} ${f(x)} ${f(y)})"` : '';
      const el = `<text class="sk-t sk-${font} ${o.c || ''}" x="${f(x)}" y="${f(y)}" font-size="${s}" text-anchor="${a}"${tr}>${esc(t)}</text>`;
      return this.add(o.crisp ?? font !== 'hand' ? 'x' : 't', el);
    }
    mono(x, y, t, o = {}) { return this.text(x, y, t, { f: 'mono', ...o }); }
    hand(x, y, t, s = 20, r = 0, o = {}) { return this.text(x, y, t, { s, r, ...o }); }
    serif(x, y, t, s = 22, o = {}) { return this.text(x, y, t, { f: 'serif', s, ...o }); }
    raw(s, layer = 'x') { return this.add(layer, s); }
    hit(d, key, label) { return this.add('x', `<path class="sk-hit" d="${d}" tabindex="0" role="button" aria-label="${esc(label)}" data-hit="${esc(key)}"/>`); }
    mover(path, o = {}) {
      if (reduced) return this;
      return this.add('x', `<circle class="sk-accent sk-mover" r="${o.r || 5}"><animateMotion dur="${o.dur || 3}s" begin="${o.begin || 0}s" repeatCount="indefinite" path="${path}"/></circle>`);
    }
    g(cls, fn, style = '') {
      const s = new Sk(); s.k = this.k; fn(s); this.k = s.k;
      const at = `class="${cls}" style="${style}"`;
      this.add('i', `<g ${at}>${s.L.p}${s.L.c}${s.L.a}${s.L.i}${s.L.t}</g>`);
      if (s.L.x) this.add('x', `<g ${at}>${s.L.x}</g>`);
      if (s.L.b) this.add('b', `<g ${at}>${s.L.b}</g>`);
      return this;
    }
    out(id) { const L = this.L; return `${L.b}<g filter="url(#${id})">${L.p}${L.c}${L.a}${L.i}${L.t}</g>${L.x}`; }
  }

  const node = (sk, x, y, w, h, label, o = {}) => {
    if (o.fill === 'accent') sk.accent(box(x, y, w, h, x + y)); else if (o.fill === 'sunk') sk.fill(box(x, y, w, h, x + y), 'sk-sunk'); else if (o.fill !== 'none') sk.paper(box(x, y, w, h, x + y));
    if (o.zone) sk.zone(box(x, y, w, h, x));
    sk.ink(box(x, y, w, h, x + y));
    const cy = y + h / 2 + (o.sub ? -3 : 6);
    if (o.font === 'mono') sk.mono(x + w / 2, cy + 1, label, { s: o.s || 12 });
    else if (o.font === 'serif') sk.serif(x + w / 2, cy + 2, label, o.s || 18);
    else sk.hand(x + w / 2, cy + 1, label, o.s || 20);
    if (o.sub) sk.mono(x + w / 2, y + h / 2 + 14, o.sub, { s: o.subS || 10, c: 'muted' });
    return sk;
  };
  const chip = (sk, x, y, w, h, t, o = {}) => {
    if (o.hi) sk.accent(box(x, y, w, h, x)); else if (o.dim) sk.fill(box(x, y, w, h, x), 'sk-sunk'); else sk.paper(box(x, y, w, h, x));
    if (o.red) sk.red(box(x, y, w, h, x)); else sk.ink(box(x, y, w, h, x));
    sk.mono(x + w / 2, y + h / 2 + 4, t, { s: o.s || 12, c: o.dim ? 'muted' : '' });
    if (o.sub != null) sk.mono(x + w / 2, y + h + 13, o.sub, { s: 9.5, c: 'muted' });
    return sk;
  };
  const heat = (sk, M, x, y, cw, ch, o = {}) => {
    const max = o.max ?? Math.max(1e-9, ...M.flat().filter(Number.isFinite).map(Math.abs));
    M.forEach((row, i) => row.forEach((v, j) => {
      const X = x + j * cw, Y = y + i * ch;
      if (v === -Infinity || v === null || Number.isNaN(v)) { sk.fill(tile(X, Y, cw, ch), 'sk-sunk'); if (o.masked !== false) sk.thin(`M${f(X + cw * 0.3)} ${f(Y + ch * 0.7)} ${f(X + cw * 0.7)} ${f(Y + ch * 0.3)}`); }
      else { sk.fill(tile(X, Y, cw, ch), 'sk-sunk'); sk.cell(tile(X, Y, cw, ch), clamp(Math.abs(v) / max, 0.06, 1) * (o.alpha ?? 0.95), v < 0 && o.neg !== false); }
      if (o.nums && Number.isFinite(v)) sk.mono(X + cw / 2, Y + ch / 2 + 4, (o.fmt || (n => n.toFixed(2)))(v), { s: o.numS || Math.min(11, cw / 4) });
      if (o.nums && v === -Infinity && o.inf !== false) sk.mono(X + cw / 2, Y + ch / 2 + 4, '−∞', { s: o.numS || Math.min(11, cw / 4), c: 'muted' });
    }));
    const R = M.length, C = M[0].length;
    if (o.rows) o.rows.forEach((t, i) => sk.mono(x - 10, y + i * ch + ch / 2 + 4, t, { a: 'end', s: o.labS || 11 }));
    if (o.cols) o.cols.forEach((t, j) => sk.mono(x + j * cw + cw / 2, y - 10, t, { s: o.labS || 11, r: o.colR || 0, a: o.colR ? 'start' : 'middle' }));
    if (o.hiRow != null) sk.pop(box(x - 2, y + o.hiRow * ch - 1, C * cw + 4, ch + 2, 3));
    if (o.hiCol != null) sk.pop(box(x + o.hiCol * cw - 1, y - 2, cw + 2, R * ch + 4, 4));
    if (o.hiCell) sk.pop(box(x + o.hiCell[1] * cw - 1, y + o.hiCell[0] * ch - 1, cw + 2, ch + 2, 5));
    return sk;
  };
  const vec = (sk, v, x, y, cw, ch, o = {}) => {
    const max = o.max ?? Math.max(1e-9, ...v.map(Math.abs)), vert = o.vertical;
    v.forEach((val, i) => {
      const X = vert ? x : x + i * cw, Y = vert ? y + i * ch : y;
      sk.fill(tile(X, Y, cw, ch), 'sk-sunk'); sk.cell(tile(X, Y, cw, ch), clamp(Math.abs(val) / max, 0.06, 1) * 0.95, val < 0);
      if (o.nums) sk.mono(X + cw / 2, Y + ch / 2 + 4, (o.fmt || (n => n.toFixed(1)))(val), { s: o.numS || 10 });
    });
    const W = vert ? cw : cw * v.length, H = vert ? ch * v.length : ch;
    if (o.label) sk.mono(vert ? x + cw / 2 : x - 10, vert ? y - 8 : y + ch / 2 + 4, o.label, { a: vert ? 'middle' : 'end', s: o.labS || 11 });
    return sk;
  };
  const axes = (sk, x, y, w, h, o = {}) => {
    sk.ink(arr(x, y + h, x, y - 6));
    sk.ink(arr(x, y + h, x + w + 6, y + h));
    if (o.xl) sk.hand(x + w, y + h + 28, o.xl, o.s || 18, 0, { a: 'end' });
    if (o.yl) sk.hand(x + 8, y - 10, o.yl, o.s || 18, 0, { a: 'start' });
    return sk;
  };
  const bars = (sk, vals, x, y, w, h, o = {}) => {
    const n = vals.length, gap = o.gap ?? 6, bw = (w - gap * (n - 1)) / n, max = o.max ?? Math.max(1e-9, ...vals);
    vals.forEach((v, i) => {
      const bh = Math.max(0, Math.min(1, v / max)) * h, X = x + i * (bw + gap), Y = y + h - bh;
      if (bh > 0.5) {
        const r = Math.min(bw / 2, bh, 8), d = `M${f(X)} ${f(y + h)}V${f(Y + r)}Q${f(X)} ${f(Y)} ${f(X + r)} ${f(Y)}H${f(X + bw - r)}Q${f(X + bw)} ${f(Y)} ${f(X + bw)} ${f(Y + r)}V${f(y + h)}Z`;
        if (o.hi === i || (o.hiSet && o.hiSet.has(i))) sk.accent(d); else sk.cell(d, o.alpha ?? 0.3);
      }
      if (o.labels) sk.mono(X + bw / 2, y + h + 18, o.labels[i], { s: o.labS || 11, r: o.labR || 0, a: o.labR ? 'end' : 'middle' });
      if (o.vals) sk.mono(X + bw / 2, Y - 8, (o.fmt || (n => n.toFixed(2)))(v), { s: o.valS || 10 });
    });
    sk.thin(`M${f(x - 4)} ${f(y + h)}H${f(x + w + 4)}`);
    return sk;
  };
  const code = (sk, lines, x, y, o = {}) => {
    const lh = o.lh || 20, w = o.w || 420, h = lines.length * lh + 18;
    sk.paper(box(x, y, w, h, x + 1)); sk.ink(box(x, y, w, h, x + 1));
    lines.forEach((t, i) => {
      const Y = y + 9 + i * lh;
      if (o.hi && o.hi.includes(i)) sk.cell(rect(x + 5, Y, w - 10, lh), 0.32);
      if (o.red && o.red.includes(i)) sk.zone(rect(x + 5, Y, w - 10, lh), true);
      sk.mono(x + 14, Y + lh * 0.7, t, { a: 'start', s: o.s || 12, c: o.dim && o.dim.includes(i) ? 'muted' : '' });
    });
    return sk;
  };
  const tape = (sk, x, y, w = 50, r = -4) => sk.fill(`M${x} ${y}h${w}l-2 13h${-w}z`, 'sk-sunk', `transform-box:fill-box;transform-origin:center;rotate:${r}deg;opacity:.8`);

  const dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0);
  const T = M => M[0].map((_, j) => M.map(r => r[j]));
  const matmul = (A, B) => A.map(r => B[0].map((_, j) => r.reduce((s, v, k) => s + v * B[k][j], 0)));
  const softmax = (xs, t = 1) => {
    const m = Math.max(...xs);
    if (m === -Infinity) return xs.map(() => NaN);
    const e = xs.map(x => x === -Infinity ? 0 : Math.exp((x - m) / t)), s = e.reduce((a, b) => a + b, 0);
    return e.map(v => v / s);
  };
  const norm = v => Math.hypot(...v);
  const cos = (a, b) => dot(a, b) / (norm(a) * norm(b) || 1);
  const mean = v => v.reduce((a, b) => a + b, 0) / v.length;
  const std = v => { const m = mean(v); return Math.sqrt(mean(v.map(x => (x - m) ** 2))); };
  const gauss = (i, j) => { const u = Math.max(1e-9, rand(i, j)), w = rand(j + 3.1, i + 7.7); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * w); };
  const fmtBytes = b => { const u = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']; let i = 0; while (b >= 1024 && i < u.length - 1) { b /= 1024; i++; } return (b >= 100 ? b.toFixed(0) : b >= 10 ? b.toFixed(1) : b.toFixed(2)) + ' ' + u[i]; };
  const fmtN = n => n >= 1e12 ? (n / 1e12).toFixed(1) + 'T' : n >= 1e9 ? (n / 1e9).toFixed(1) + 'B' : n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(1) + 'k' : String(Math.round(n));

  const narrow = matchMedia('(max-width: 760px)');
  const stack = (svg, g, W) => {
    const fg = g.querySelector(':scope > g[filter]');
    const leaves = [...g.children].flatMap(c => c === fg ? [...c.children] : [c]).map(el => {
      let b; try { b = el.getBBox(); } catch { b = { x: 0, y: 0, width: 0, height: 0 }; }
      const cls = el.getAttribute('class') || '';
      return { el, b, free: el.tagName === 'text', mover: cls.includes('sk-mover'), wire: el.tagName === 'path' && /sk-(ink|pop|red|thin|dash)\b/.test(cls) && b.height < 40 };
    });
    if (leaves.some(l => !l.free && !l.mover && l.b.width > W * 0.6)) return;
    const spans = leaves.filter(l => !l.free && !l.mover && !l.wire && l.b.width + l.b.height > 0).map(l => [l.b.x, l.b.x + l.b.width]).sort((a, b) => a[0] - b[0]);
    const cols = [];
    for (const [a, b] of spans) { const c = cols.at(-1); if (c && a - c[1] < 32) c[1] = Math.max(c[1], b); else cols.push([a, b]); }
    const panels = [];
    for (const c of cols) { const p = panels.at(-1); if (p && c[1] - p[0] <= 520) p[1] = c[1]; else panels.push([...c]); }
    if (panels.length < 2) return;
    const off = (p, x) => Math.max(p[0] - x, x - p[1], 0);
    const pick = l => {
      if (l.mover) return -1;
      if (l.wire) return panels.findIndex(p => l.b.x >= p[0] - 12 && l.b.x + l.b.width <= p[1] + 12);
      const cx = l.b.x + l.b.width / 2;
      return panels.reduce((best, p, i) => off(p, cx) < off(panels[best], cx) ? i : best, 0);
    };
    const ext = panels.map(() => [Infinity, Infinity, -Infinity, -Infinity]);
    for (const l of leaves) {
      l.p = pick(l);
      if (l.p < 0) { l.el.style.display = 'none'; continue; }
      const e = ext[l.p], { x, y, width: w, height: h } = l.b;
      if (w + h === 0) continue;
      e[0] = Math.min(e[0], x); e[1] = Math.min(e[1], y); e[2] = Math.max(e[2], x + w); e[3] = Math.max(e[3], y + h);
    }
    const pad = 12, gap = 56, Wn = Math.max(...ext.map(e => e[2] - e[0])) + pad * 2;
    let cy = pad;
    const shift = ext.map(e => { const d = [(Wn - (e[2] - e[0])) / 2 - e[0], cy - e[1]]; cy += e[3] - e[1] + gap; return d; });
    const wraps = new Map();
    for (const l of leaves) {
      if (l.p < 0) continue;
      const par = l.el.parentNode, k = par === fg ? `f${l.p}` : `r${l.p}`;
      let w = wraps.get(k);
      if (!w) { w = document.createElementNS(NS, 'g'); w.setAttribute('transform', `translate(${f(shift[l.p][0])} ${f(shift[l.p][1])})`); par.insertBefore(w, l.el); wraps.set(k, w); }
      w.append(l.el);
    }
    svg.setAttribute('viewBox', `0 0 ${f(Wn)} ${f(cy - gap + pad)}`);
  };

  let nf = 0;
  function fig(id, o) {
    const el = document.getElementById(id);
    if (!el) return null;
    const n = ++nf, fid = `f${n}`, view = o.view || '0 0 640 300';
    if (o.hue) el.style.setProperty('--h', o.hue);
    let art = el.querySelector(':scope > .art');
    if (!art) {
      art = document.createElement('div'); art.className = 'art';
      const cap = el.querySelector(':scope > figcaption');
      cap ? el.insertBefore(art, cap) : el.append(art);
    }
    art.innerHTML = `<svg viewBox="${view}" role="img" aria-label="${esc(o.label || el.dataset.label || el.querySelector('h3,h4')?.textContent || '')}"><defs><filter id="${fid}"><feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="${(n * 7) % 11 + 1}"/><feDisplacementMap in="SourceGraphic" scale="3.2"/></filter></defs><g class="content"></g></svg>`;
    const svg = art.firstChild, g = svg.querySelector('.content'), turb = svg.querySelector('feTurbulence');
    const st = { ...(o.state || {}) }, syncs = [];
    const render = () => {
      const sk = new Sk(); o.draw(sk, st); g.innerHTML = sk.out(fid); svg.setAttribute('viewBox', view);
      if (narrow.matches) stack(svg, g, +view.split(/[\s,]+/)[2]);
      syncs.forEach(s => s());
    };
    narrow.addEventListener('change', render);
    const set = p => { Object.assign(st, p); render(); };
    if (!reduced) {
      el.addEventListener('pointerenter', () => {
        if (turb.firstChild) return;
        const a = document.createElementNS(NS, 'animate');
        for (const [k, v] of Object.entries({ attributeName: 'seed', values: '1;4;7;10', dur: '0.6s', calcMode: 'discrete', repeatCount: 'indefinite' })) a.setAttribute(k, v);
        turb.append(a); a.beginElement?.();
      });
      el.addEventListener('pointerleave', () => turb.replaceChildren());
    }
    if (o.hit) {
      const fire = e => { const t = e.target.closest('[data-hit]'); if (t) { o.hit(t.dataset.hit, st, set); requestAnimationFrame(() => svg.querySelector(`[data-hit="${CSS.escape(t.dataset.hit)}"]`)?.focus({ preventScroll: true })); } };
      svg.addEventListener('click', fire);
      svg.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fire(e); } });
    }
    let bar = null;
    const ctl = () => {
      if (!bar) { bar = document.createElement('div'); bar.className = 'ctl'; art.after(bar); }
      return bar;
    };
    const api = {
      st, set, el,
      slider(key, label, min, max, step, show = v => v) {
        const l = document.createElement('label'), inp = document.createElement('input'), out = document.createElement('output');
        Object.assign(inp, { type: 'range', min, max, step, value: st[key] });
        l.append(label + ' ', inp, out); ctl().append(l);
        inp.addEventListener('input', () => set({ [key]: +inp.value }));
        syncs.push(() => { inp.value = st[key]; out.textContent = show(st[key]); });
        return api;
      },
      button(label, fn, cls = '') {
        const b = document.createElement('button'); b.className = 'btn ' + cls; b.type = 'button'; b.textContent = label;
        b.addEventListener('click', () => fn(st, set)); ctl().append(b);
        return api;
      },
      toggle(key, label) {
        const b = document.createElement('button'); b.className = 'btn'; b.type = 'button'; b.textContent = label;
        b.addEventListener('click', () => set({ [key]: !st[key] })); ctl().append(b);
        syncs.push(() => b.setAttribute('aria-pressed', String(!!st[key])));
        return api;
      },
      choice(key, label, options) {
        const wrap = document.createElement('span'); wrap.className = 'player'; wrap.setAttribute('role', 'group'); wrap.setAttribute('aria-label', label);
        if (label) { const s = document.createElement('span'); s.textContent = label; wrap.append(s); }
        const btns = options.map(([v, t]) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'btn ghost'; b.textContent = t; b.addEventListener('click', () => set({ [key]: v })); wrap.append(b); return [v, b]; });
        ctl().append(wrap);
        syncs.push(() => btns.forEach(([v, b]) => b.setAttribute('aria-pressed', String(st[key] === v))));
        return api;
      },
      text(key, label, maxLength = 40) {
        const l = document.createElement('label'), inp = document.createElement('input');
        Object.assign(inp, { type: 'text', value: st[key], maxLength, spellcheck: false });
        l.append(label + ' ', inp); ctl().append(l);
        inp.addEventListener('input', () => set({ [key]: inp.value }));
        return api;
      },
      read(fn) {
        const s = document.createElement('span'); s.className = 'read'; s.setAttribute('aria-live', 'polite'); ctl().append(s);
        syncs.push(() => { s.textContent = fn(st); });
        return api;
      },
      note(t) { const s = document.createElement('span'); s.className = 'note'; s.textContent = t; ctl().append(s); return api; },
      player(key, count, opt = {}) {
        const N = () => typeof count === 'function' ? count(st) : count;
        const wrap = document.createElement('span'); wrap.className = 'player';
        const mk = (t, lab, cls = 'btn ghost') => { const b = document.createElement('button'); b.type = 'button'; b.className = cls; b.textContent = t; b.setAttribute('aria-label', lab); wrap.append(b); return b; };
        const play = mk('▶ Play', 'Play animation', 'btn solid'), back = mk('‹', 'Previous step'), fwd = mk('›', 'Next step'), rst = mk('↺', 'Back to the start');
        const rng = document.createElement('input'); Object.assign(rng, { type: 'range', min: 0, step: 1 }); rng.setAttribute('aria-label', 'Scrub through the steps');
        const rd = document.createElement('span'); rd.className = 'read';
        wrap.append(rng, rd); ctl().prepend(wrap);
        let timer = null;
        const stop = () => { clearInterval(timer); timer = null; play.textContent = '▶ Play'; play.setAttribute('aria-pressed', 'false'); };
        const go = i => set({ [key]: clamp(i, 0, N() - 1) });
        play.addEventListener('click', () => {
          if (timer) return stop();
          if (st[key] >= N() - 1) go(0);
          play.textContent = '❚❚ Pause'; play.setAttribute('aria-pressed', 'true');
          timer = setInterval(() => { if (st[key] >= N() - 1) { if (opt.loop) go(0); else stop(); } else go(st[key] + 1); }, opt.ms || 900);
        });
        back.addEventListener('click', () => { stop(); go(st[key] - 1); });
        fwd.addEventListener('click', () => { stop(); go(st[key] + 1); });
        rst.addEventListener('click', () => { stop(); go(0); });
        rng.addEventListener('input', () => { stop(); go(+rng.value); });
        syncs.push(() => { const n = N(); if (st[key] > n - 1) st[key] = n - 1; rng.max = n - 1; rng.value = st[key]; rd.textContent = `${opt.name || 'step'} ${st[key] + 1}/${n}`; back.disabled = st[key] <= 0; fwd.disabled = st[key] >= n - 1; });
        if (st[key] == null) st[key] = reduced ? N() - 1 : 0;
        api.stop = stop;
        return api;
      },
    };
    queueMicrotask(render);
    if (o.controls) o.controls(api);
    return api;
  }

  function checklist(id, items, o = {}) {
    const el = document.getElementById(id);
    if (!el) return;
    if (o.hue) el.style.setProperty('--h', o.hue);
    const done = items.map((_, i) => !!o.done?.[i]);
    const list = document.createElement('ul'); list.className = 'checklist';
    items.forEach(([t, sub], i) => {
      const li = document.createElement('li');
      li.innerHTML = `<label><input class="sr-only" type="checkbox"${done[i] ? ' checked' : ''}><svg viewBox="0 0 36 36" aria-hidden="true"><g filter="url(#ink-edge)"><path class="sk-paper" d="${box(5, 6, 25, 25, i)}"/><path class="sk-ink" pathLength="1" d="${box(5, 6, 25, 25, i)}"/><path class="tick" pathLength="1" d="${check(9, 20, 0.95)}"/></g></svg><b>${esc(t)}</b><small>${esc(sub)}</small></label>`;
      li.querySelector('input').addEventListener('change', e => { done[i] = e.target.checked; sync(); });
      list.append(li);
    });
    const meter = document.createElement('div'); meter.className = 'checklist-meter';
    meter.innerHTML = '<span class="bar"><i></i></span><b aria-live="polite"></b><small></small>';
    const sync = () => {
      const n = done.filter(Boolean).length, all = n === items.length;
      items.forEach((_, i) => list.children[i].classList.toggle('on', done[i]));
      meter.style.setProperty('--p', n / items.length);
      meter.querySelector('b').textContent = `${n} / ${items.length} ${o.unit || ''}`;
      meter.querySelector('small').textContent = all ? o.full : `${items.length - n} ${o.left || 'to go'}`;
      el.classList.toggle('all', all);
    };
    el.append(list, meter);
    sync();
  }

  function chrome() {
    const root = document.documentElement, dlg = document.getElementById('contents');
    document.getElementById('menu')?.addEventListener('click', () => dlg.showModal());
    dlg?.addEventListener('click', e => { if (e.target === dlg || e.target.closest('[data-close]')) dlg.close(); });
    document.getElementById('theme')?.addEventListener('click', () => {
      const next = getComputedStyle(root).colorScheme === 'dark' ? 'light' : 'dark';
      root.dataset.theme = next;
      try { localStorage.setItem('ink-theme', next); } catch {}
    });
    document.getElementById('still')?.addEventListener('click', e => {
      const on = root.classList.toggle('still');
      e.currentTarget.setAttribute('aria-pressed', String(on));
      document.querySelectorAll('svg').forEach(s => on ? s.pauseAnimations?.() : s.unpauseAnimations?.());
    });
  }
  chrome();

  return { CH, reduced, esc, f, rand, jit, clamp, lerp, map, box, rect, tile, o, head, ln, arr, carr, poly, smooth, check, cross, ticks, squig, Sk, node, chip, heat, vec, axes, bars, tape, code, dot, T, matmul, softmax, norm, cos, mean, std, gauss, fmtBytes, fmtN, fig, checklist };
})();
