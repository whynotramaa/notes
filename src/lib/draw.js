import rough from 'roughjs';

export const C = {
  ink: 'var(--f-ink)', ink2: 'var(--f-ink2)', gray: 'var(--f-gray)', line: 'var(--f-line)', faint: 'var(--f-faint)',
  paper: 'var(--f-paper)', card: 'var(--f-card)', white: 'var(--f-paper)', onAcc: 'var(--f-on-acc)',
  acc: 'var(--f-acc)', accSoft: 'var(--f-acc-soft)', accFaint: 'var(--f-acc-faint)',
  slate: 'var(--f-slate)', slateSoft: 'var(--f-slate-soft)', red: 'var(--f-red)',
};

function hash(s) { let h = 2166136261; for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return Math.abs(h) % 100000 + 1; }
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export class D {
  constructor(w, h, id = 'x') {
    this.w = w; this.h = h; this.gen = rough.generator(); this.parts = []; this.seed = hash(id); this.id = id;
  }
  o(o = {}) {
    return {
      roughness: o.rough ?? 0.85, bowing: o.bow ?? 0.7, stroke: o.stroke ?? C.ink,
      strokeWidth: o.sw ?? 1.05, seed: this.seed++, fill: o.fill, fillStyle: o.fs ?? 'solid',
      hachureGap: o.gap ?? 5, hachureAngle: o.angle ?? -41, fillWeight: o.fw ?? 0.7,
      disableMultiStroke: o.single ?? false, strokeLineDash: o.dash, preserveVertices: false,
    };
  }
  push(dr, o = {}) {
    const op = o.op != null ? ` opacity="${o.op}"` : '';
    const dash = o.dash ? ` stroke-dasharray="${o.dash.join(' ')}"` : '';
    for (const p of this.gen.toPaths(dr)) {
      this.parts.push(`<path d="${p.d}" style="stroke:${p.stroke};fill:${p.fill || 'none'}" stroke-width="${p.strokeWidth}" stroke-linecap="round" stroke-linejoin="round"${op}${dash}/>`);
    }
    return this;
  }
  raw(s) { this.parts.push(s); return this; }
  fillRect(x, y, w, h, color, op = 1, r = 0) { w = Math.max(0, w); h = Math.max(0, h); this.parts.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" style="fill:${color}" opacity="${op}"/>`); return this; }
  rect(x, y, w, h, o = {}) {
    const r = Math.min(o.r ?? 7, w / 2, h / 2);
    if (o.fill && (o.fs ?? 'solid') === 'solid') this.fillRect(x + 1.5, y + 1.5, w - 3, h - 3, o.fill, o.fop ?? 1, r);
    const oo = this.o({ ...o, fill: (o.fs && o.fs !== 'solid') ? o.fill : undefined });
    if (r <= 0.5) this.push(this.gen.rectangle(x, y, w, h, oo), o);
    else {
      const d = `M${x + r},${y} L${x + w - r},${y} Q${x + w},${y} ${x + w},${y + r} L${x + w},${y + h - r} Q${x + w},${y + h} ${x + w - r},${y + h} L${x + r},${y + h} Q${x},${y + h} ${x},${y + h - r} L${x},${y + r} Q${x},${y} ${x + r},${y} Z`;
      this.push(this.gen.path(d, oo), o);
    }
    return this;
  }
  line(x1, y1, x2, y2, o = {}) { return this.push(this.gen.line(x1, y1, x2, y2, this.o(o)), o); }
  path(d, o = {}) { return this.push(this.gen.path(d, this.o(o)), o); }
  poly(pts, o = {}) {
    if (o.fill && (o.fs ?? 'solid') === 'solid') this.parts.push(`<polygon points="${pts.map(p => p.join(',')).join(' ')}" style="fill:${o.fill}" opacity="${o.fop ?? 1}"/>`);
    return this.push(this.gen.polygon(pts, this.o({ ...o, fill: (o.fs && o.fs !== 'solid') ? o.fill : undefined })), o);
  }
  lines(pts, o = {}) { return this.push(this.gen.linearPath(pts, this.o(o)), o); }
  curve(pts, o = {}) { return this.push(this.gen.curve(pts, this.o(o)), o); }
  circle(cx, cy, d, o = {}) {
    if (o.fill && (o.fs ?? 'solid') === 'solid') this.parts.push(`<circle cx="${cx}" cy="${cy}" r="${d / 2 - 1}" style="fill:${o.fill}" opacity="${o.fop ?? 1}"/>`);
    return this.push(this.gen.circle(cx, cy, d, this.o({ ...o, fill: (o.fs && o.fs !== 'solid') ? o.fill : undefined })), o);
  }
  ellipse(cx, cy, w, h, o = {}) {
    if (o.fill && (o.fs ?? 'solid') === 'solid') this.parts.push(`<ellipse cx="${cx}" cy="${cy}" rx="${w / 2 - 1}" ry="${h / 2 - 1}" style="fill:${o.fill}" opacity="${o.fop ?? 1}"/>`);
    return this.push(this.gen.ellipse(cx, cy, w, h, this.o({ ...o, fill: undefined })), o);
  }
  head(x, y, ang, o = {}) {
    const L = o.hl ?? 8, a = 0.42;
    const p1 = [x - L * Math.cos(ang - a), y - L * Math.sin(ang - a)];
    const p2 = [x - L * Math.cos(ang + a), y - L * Math.sin(ang + a)];
    return this.push(this.gen.linearPath([p1, [x, y], p2], this.o({ ...o, rough: 0.4, single: true })), o);
  }
  arrow(x1, y1, x2, y2, o = {}) {
    this.line(x1, y1, x2, y2, { single: true, ...o });
    this.head(x2, y2, Math.atan2(y2 - y1, x2 - x1), o);
    if (o.both) this.head(x1, y1, Math.atan2(y1 - y2, x1 - x2), o);
    return this;
  }
  carrow(pts, o = {}) {
    this.curve(pts, { single: true, ...o });
    const a = pts[pts.length - 2], b = pts[pts.length - 1];
    return this.head(b[0], b[1], Math.atan2(b[1] - a[1], b[0] - a[0]), o);
  }
  text(x, y, s, o = {}) {
    const cls = o.cls ?? 'lbl';
    const anchor = o.a ?? 'middle';
    const attrs = [`x="${x}"`, `y="${y}"`, `class="${cls}"`, `text-anchor="${anchor}"`];
    const st = [];
    if (o.size) st.push(`font-size:${o.size}px`);
    if (o.color) st.push(`fill:${o.color}`);
    if (o.w) st.push(`font-weight:${o.w}`);
    if (st.length) attrs.push(`style="${st.join(';')}"`);
    if (o.rot) attrs.push(`transform="rotate(${o.rot} ${x} ${y})"`);
    if (o.ls) attrs.push(`letter-spacing="${o.ls}"`);
    const lines = String(s).split('\n');
    const lh = o.lh ?? (o.size ?? (cls === 'hand' ? 17 : 12)) * 1.22;
    const dy0 = o.vc ? -((lines.length - 1) * lh) / 2 : 0;
    const body = lines.length === 1 ? fmt(lines[0]) :
      lines.map((l, i) => `<tspan x="${x}" dy="${i === 0 ? dy0 : lh}">${fmt(l)}</tspan>`).join('');
    this.parts.push(`<text ${attrs.join(' ')} dominant-baseline="${o.base ?? 'middle'}">${body}</text>`);
    return this;
  }
  hand(x, y, s, o = {}) { return this.text(x, y, s, { cls: 'hand', ...o }); }
  mono(x, y, s, o = {}) { return this.text(x, y, s, { cls: 'mono', ...o }); }
  hl(x1, y1, x2, y2, o = {}) { return this.line(x1, y1, x2, y2, { stroke: o.color ?? C.acc, sw: o.th ?? 12, op: o.op ?? 0.18, rough: 1.2, single: true }); }
  box(x, y, w, h, label, o = {}) {
    this.rect(x, y, w, h, o);
    if (label != null) this.text(x + w / 2, y + h / 2 + (o.dy ?? 0), label, { cls: o.cls ?? 'lbl', vc: true, size: o.size, color: o.tc, w: o.tw });
    return this;
  }
  brace(x1, x2, y, o = {}) {
    const d = o.dir ?? 1, k = 7 * d, m = (x1 + x2) / 2;
    const p = `M${x1},${y - k} Q${x1},${y} ${x1 + 10},${y} L${m - 8},${y} Q${m},${y} ${m},${y + k} Q${m},${y} ${m + 8},${y} L${x2 - 10},${y} Q${x2},${y} ${x2},${y - k}`;
    this.path(p, { stroke: o.stroke ?? C.gray, rough: 0.5, single: true, sw: 1 });
    if (o.label) this.text(m, y + k + 10 * d, o.label, { cls: o.cls ?? 'sm', color: o.color });
    return this;
  }
  vbrace(x, y1, y2, o = {}) {
    const d = o.dir ?? 1, k = 7 * d, m = (y1 + y2) / 2;
    const p = `M${x - k},${y1} Q${x},${y1} ${x},${y1 + 10} L${x},${m - 8} Q${x},${m} ${x + k},${m} Q${x},${m} ${x},${m + 8} L${x},${y2 - 10} Q${x},${y2} ${x - k},${y2}`;
    this.path(p, { stroke: o.stroke ?? C.gray, rough: 0.5, single: true, sw: 1 });
    if (o.label) this.text(x + k + 6 * d, m, o.label, { cls: o.cls ?? 'sm', a: d > 0 ? 'start' : 'end', color: o.color });
    return this;
  }
  grid(x, y, rows, cols, cw, ch, o = {}) {
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const s = o.shade ? o.shade(r, c) : 0;
      if (s > 0) this.fillRect(x + c * cw + 0.6, y + r * ch + 0.6, cw - 1.2, ch - 1.2, o.color ?? C.acc, Math.min(1, s) * (o.maxop ?? 0.85));
      if (o.cellFill) { const f = o.cellFill(r, c); if (f) this.fillRect(x + c * cw + 0.6, y + r * ch + 0.6, cw - 1.2, ch - 1.2, f, 1); }
      if (o.val) { const v = o.val(r, c); if (v != null && v !== '') this.text(x + c * cw + cw / 2, y + r * ch + ch / 2 + 0.5, v, { cls: o.vcls ?? 'mono', size: o.vsize ?? 10, color: o.vcolor ? o.vcolor(r, c, s) : undefined }); }
    }
    const lo = { stroke: o.lineColor ?? C.ink2, sw: o.lsw ?? 0.7, rough: 0.6, single: true };
    if (o.inner !== false) {
      for (let r = 1; r < rows; r++) this.line(x, y + r * ch, x + cols * cw, y + r * ch, lo);
      for (let c = 1; c < cols; c++) this.line(x + c * cw, y, x + c * cw, y + rows * ch, lo);
    }
    this.rect(x, y, cols * cw, rows * ch, { r: 0, sw: 1.1, rough: 0.7 });
    return this;
  }
  axes(x, y, w, h, o = {}) {
    const { xmin = 0, xmax = 1, ymin = 0, ymax = 1 } = o;
    const X = (v) => x + ((v - xmin) / (xmax - xmin)) * w;
    const Y = (v) => y + h - ((v - ymin) / (ymax - ymin)) * h;
    const y0 = (ymin <= 0 && ymax >= 0) ? Y(0) : y + h;
    const x0 = (xmin <= 0 && xmax >= 0) ? X(0) : x;
    this.arrow(x - 4, y0, x + w + 10, y0, { stroke: C.ink2, sw: 0.9, hl: 6 });
    this.arrow(x0, y + h + 4, x0, y - 10, { stroke: C.ink2, sw: 0.9, hl: 6 });
    if (o.xl) this.text(x + w + 12, y0 + 16, o.xl, { cls: 'sm', a: 'end' });
    if (o.yl) this.text(x0 + 6, y - 12, o.yl, { cls: 'sm', a: 'start' });
    return { X, Y, x0, y0 };
  }
  fn(f, a, b, M, o = {}) {
    const n = o.n ?? 80, pts = [];
    for (let i = 0; i <= n; i++) { const t = a + (b - a) * i / n; pts.push([M.X(t), M.Y(f(t))]); }
    return this.lines(pts, { rough: 0.35, single: true, sw: o.sw ?? 1.6, stroke: o.stroke ?? C.acc, ...o });
  }
  dot(x, y, r = 2.6, color = C.ink) { this.parts.push(`<circle cx="${x}" cy="${y}" r="${r}" style="fill:${color}"/>`); return this; }
  chips(x, y, toks, o = {}) {
    const h = o.h ?? 26, gap = o.gap ?? 5, pad = o.pad ?? 9, cw = o.cw ?? 6.9;
    let cx = x; const centers = [];
    toks.forEach((t, i) => {
      const w = o.width ?? Math.max(o.minw ?? 24, t.length * cw + pad * 2);
      const f = o.fill ? (typeof o.fill === 'function' ? o.fill(i) : o.fill) : C.card;
      const s = o.stroke ? (typeof o.stroke === 'function' ? o.stroke(i) : o.stroke) : C.ink2;
      this.rect(cx, y, w, h, { r: 5, fill: f, sw: 0.95, stroke: s });
      this.text(cx + w / 2, y + h / 2 + 0.5, t, { cls: o.cls ?? 'mono', size: o.size ?? 11, color: o.tc ? o.tc(i) : undefined });
      centers.push([cx + w / 2, cx, w]); cx += w + gap;
    });
    centers.end = cx - gap;
    return centers;
  }
  svg(cls = '') {
    return `<svg class="fig ${cls}" viewBox="0 0 ${this.w} ${this.h}" xmlns="http://www.w3.org/2000/svg" role="img">${this.parts.join('')}</svg>`;
  }
}

function fmt(s) {
  return esc(s)
    .replace(/_\{([^}]*)\}/g, '<tspan baseline-shift="sub" font-size="75%">$1</tspan>')
    .replace(/\^\{([^}]*)\}/g, '<tspan baseline-shift="super" font-size="75%">$1</tspan>')
    .replace(/\*\*([^*]+)\*\*/g, '<tspan font-weight="600">$1</tspan>');
}

export const fmtN = (v) => Math.round(v).toLocaleString('en-US');
export const softmax = (xs) => { const m = Math.max(...xs); const e = xs.map((x) => Math.exp(x - m)); const s = e.reduce((a, b) => a + b, 0); return e.map((x) => x / s); };
