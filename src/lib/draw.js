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

const kt = (a) => a.map((v) => +v.toFixed(4)).join(';');
const win = (at) => { const a = Math.max(0, Math.min(1, at[0])), b = Math.max(a, Math.min(1, at[1])); return [a, b]; };

Object.assign(D.prototype, {
  cycle: 6,
  wrap(fn, open, close = '</g>') {
    const i = this.parts.length;
    fn(this);
    const inner = this.parts.splice(i).join('');
    this.parts.push(open + inner + close);
    return this;
  },
  during(at, fn, o = {}) {
    const [a, b] = win(at), dur = o.dur ?? this.cycle;
    const vals = b >= 1 ? (a <= 0 ? '1;1' : '0;1') : (a <= 0 ? '1;0' : '0;1;0');
    const keys = b >= 1 ? (a <= 0 ? '0;1' : kt([0, a])) : (a <= 0 ? kt([0, b]) : kt([0, a, b]));
    return this.wrap(fn, `<g class="anim">`, `<animate attributeName="opacity" values="${vals}" keyTimes="${keys}" calcMode="discrete" dur="${dur}s" repeatCount="indefinite"/></g>`);
  },
  phase(i, n, fn, o = {}) { return this.during([i / n, o.hold ? 1 : (i + 1) / n], fn, o); },
  travel(pts, o = {}) {
    const d = typeof pts === 'string' ? pts : 'M' + pts.map((p) => p.join(',')).join(' L');
    const [a, b] = win(o.at ?? [0, 1]), dur = o.dur ?? this.cycle;
    const i = this.parts.length;
    if (typeof o.token === 'function') o.token(this);
    else if (o.token === 'packet') this.envelope(-9, -6, 18, 12, { fill: o.fill ?? C.accSoft, stroke: o.color ?? C.acc, sw: 0.9 });
    else if (o.label) { const w = o.w ?? Math.max(26, String(o.label).length * 6.4 + 12); this.rect(-w / 2, -9, w, 18, { r: 5, fill: o.fill ?? C.accSoft, stroke: o.color ?? C.acc, sw: 0.9 }); this.text(0, 0.5, o.label, { cls: 'mono', size: o.size ?? 9.5 }); }
    else this.parts.push(`<circle r="${o.r ?? 4}" style="fill:${o.color ?? C.acc}"/>`);
    const tok = this.parts.splice(i).join('');
    const kp = a <= 0 && b >= 1 ? '' : ` keyPoints="${a <= 0 ? '0;1;1' : b >= 1 ? '0;0;1' : '0;0;1;1'}" keyTimes="${a <= 0 ? kt([0, b, 1]) : b >= 1 ? kt([0, a, 1]) : kt([0, a, b, 1])}" calcMode="linear"`;
    const vis = a <= 0 && b >= 1 ? '' : `<animate attributeName="opacity" values="${a <= 0 ? '1;0' : b >= 1 ? '0;1' : '0;1;0'}" keyTimes="${a <= 0 ? kt([0, b]) : b >= 1 ? kt([0, a]) : kt([0, a, b])}" calcMode="discrete" dur="${dur}s" repeatCount="indefinite"/>`;
    this.parts.push(`<g class="anim" opacity="${a <= 0 ? 1 : 0}">${tok}<animateMotion path="${d}" dur="${dur}s" repeatCount="indefinite"${kp}${o.rotate ? ' rotate="auto"' : ''}/>${vis}</g>`);
    return this;
  },
  pulse(x, y, o = {}) {
    const [a, b] = win(o.at ?? [0, 1]), dur = o.dur ?? this.cycle, r0 = o.r0 ?? 4, r1 = o.r1 ?? 20;
    const keys = kt([0, a, b, 1]);
    this.parts.push(`<circle class="anim" cx="${x}" cy="${y}" r="${r0}" style="fill:none;stroke:${o.color ?? C.acc}" stroke-width="${o.sw ?? 1.4}" opacity="0"><animate attributeName="r" values="${r0};${r0};${r1};${r1}" keyTimes="${keys}" dur="${dur}s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;0.9;0;0" keyTimes="${keys}" dur="${dur}s" repeatCount="indefinite"/></circle>`);
    return this;
  },
  blink(fn, o = {}) {
    const dur = o.dur ?? 1.6;
    return this.wrap(fn, `<g class="anim">`, `<animate attributeName="opacity" values="1;${o.low ?? 0.25};1" dur="${dur}s" repeatCount="indefinite"/></g>`);
  },
  shift(dx, dy, fn, o = {}) {
    const [a, b] = win(o.at ?? [0, 1]), dur = o.dur ?? this.cycle;
    const keys = o.back ? kt([0, a, b, (b + 1) / 2, 1]) : kt([0, a, b, 1]);
    const vals = o.back ? `0 0;0 0;${dx} ${dy};${dx} ${dy};0 0` : `0 0;0 0;${dx} ${dy};${dx} ${dy}`;
    return this.wrap(fn, `<g class="anim">`, `<animateTransform attributeName="transform" type="translate" values="${vals}" keyTimes="${keys}" dur="${dur}s" repeatCount="indefinite"/></g>`);
  },
  spin(cx, cy, fn, o = {}) {
    const dur = o.dur ?? 4, dir = o.ccw ? -360 : 360;
    return this.wrap(fn, `<g class="anim">`, `<animateTransform attributeName="transform" type="rotate" from="0 ${cx} ${cy}" to="${dir} ${cx} ${cy}" dur="${dur}s" repeatCount="indefinite"/></g>`);
  },
  glow(fn) { return this.wrap(fn, '<g>'); },
  beacon(x, y, o = {}) {
    this.glow((d) => d.dot(x, y, o.r ?? 4, o.color ?? C.acc));
    return this.pulse(x, y, { r0: o.r ?? 4, r1: o.r1 ?? 16, dur: o.dur ?? 2.4, at: o.at ?? [0, 0.7], color: o.color });
  },
  flowline(pts, o = {}) {
    const d = typeof pts === 'string' ? pts : 'M' + pts.map((p) => p.join(',')).join(' L');
    const gap = o.gap ?? 9, dir = o.reverse ? -1 : 1;
    this.parts.push(`<path class="anim" d="${d}" style="fill:none;stroke:${o.color ?? C.acc}" stroke-width="${o.sw ?? 1.6}" stroke-linecap="round" stroke-dasharray="2 ${gap}"><animate attributeName="stroke-dashoffset" from="${dir * (gap + 2) * 2}" to="0" dur="${o.dur ?? 1.2}s" repeatCount="indefinite"/></path>`);
    return this;
  },

  server(x, y, w, h, o = {}) {
    const fill = o.fill ?? C.card, stroke = o.stroke ?? C.ink2, u = o.unit ?? 15;
    this.rect(x, y, w, h, { r: 3, fill, stroke, sw: o.sw });
    const n = Math.max(1, Math.floor((h - 6) / u));
    for (let i = 0; i < n; i++) {
      const yy = y + 4 + i * u;
      if (i) this.line(x + 4, yy, x + w - 4, yy, { stroke: C.line, sw: 0.7, single: true, rough: 0.4 });
      for (let k = 0; k < 3; k++) this.line(x + 8 + k * 4, yy + 4, x + 8 + k * 4, yy + u - 4, { stroke: C.line, sw: 0.7, single: true, rough: 0.3 });
      this.dot(x + w - 9, yy + u / 2, 1.8, o.led && o.led(i) ? C.acc : C.gray);
    }
    if (o.label) this.text(x + w / 2, y + h + 13, o.label, { cls: o.lcls ?? 'sm', size: o.size });
    return this;
  },
  db(x, y, w, h, o = {}) {
    const fill = o.fill ?? C.card, stroke = o.stroke ?? C.ink2, e = Math.min(16, h * 0.28);
    this.fillRect(x + 1, y + e / 2, w - 2, h - e, fill);
    this.ellipse(x + w / 2, y + h - e / 2, w, e, { fill, stroke, sw: o.sw });
    this.fillRect(x + 1, y + e / 2, w - 2, h - e, fill);
    this.line(x, y + e / 2, x, y + h - e / 2, { stroke, single: true });
    this.line(x + w, y + e / 2, x + w, y + h - e / 2, { stroke, single: true });
    this.path(`M${x},${y + h - e / 2} Q${x + w / 2},${y + h + e / 2} ${x + w},${y + h - e / 2}`, { stroke, single: true });
    for (const t of o.bands ?? [0.42, 0.7]) this.path(`M${x},${y + e / 2 + (h - e) * t} Q${x + w / 2},${y + e + (h - e) * t + e / 2} ${x + w},${y + e / 2 + (h - e) * t}`, { stroke: C.line, single: true, sw: 0.8 });
    this.ellipse(x + w / 2, y + e / 2, w, e, { fill: o.top ?? fill, stroke, sw: o.sw });
    if (o.label) this.text(x + w / 2, y + h / 2 + e / 3, o.label, { cls: o.lcls ?? 'lbl', size: o.size ?? 11, vc: true });
    if (o.under) this.text(x + w / 2, y + h + 14, o.under, { cls: 'sm' });
    return this;
  },
  disk(cx, cy, dia, o = {}) {
    const stroke = o.stroke ?? C.ink2;
    this.circle(cx, cy, dia, { fill: o.fill ?? C.card, stroke });
    this.circle(cx, cy, dia * 0.62, { stroke: C.line, sw: 0.7 });
    this.circle(cx, cy, dia * 0.18, { fill: C.paper, stroke });
    if (o.arm !== false) this.line(cx + dia * 0.55, cy + dia * 0.42, cx + dia * 0.12, cy - dia * 0.2, { stroke: C.ink, sw: 1.6, single: true });
    if (o.label) this.text(cx, cy + dia / 2 + 14, o.label, { cls: 'sm' });
    return this;
  },
  ram(x, y, w, h, o = {}) {
    this.rect(x, y, w, h, { r: 2, fill: o.fill ?? C.card, stroke: o.stroke ?? C.ink2 });
    const n = o.chips ?? Math.max(2, Math.floor(w / 34));
    const cw = (w - 12 - (n - 1) * 6) / n;
    for (let i = 0; i < n; i++) this.rect(x + 6 + i * (cw + 6), y + 5, cw, h - 16, { r: 1, fill: o.chip ? o.chip(i) : C.paper, stroke: C.ink2, sw: 0.8 });
    for (let t = x + 5; t < x + w - 4; t += 5) this.line(t, y + h - 6, t, y + h - 1, { stroke: C.gray, sw: 0.8, single: true, rough: 0.2 });
    if (o.label) this.text(x + w / 2, y + h + 13, o.label, { cls: 'sm' });
    return this;
  },
  cpu(x, y, s, o = {}) {
    const p = Math.max(3, Math.round(s / 12));
    for (let i = 0; i < p; i++) {
      const t = x + s * (i + 1) / (p + 1);
      const u = y + s * (i + 1) / (p + 1);
      this.line(t, y - 6, t, y, { stroke: C.gray, single: true, rough: 0.3 });
      this.line(t, y + s, t, y + s + 6, { stroke: C.gray, single: true, rough: 0.3 });
      this.line(x - 6, u, x, u, { stroke: C.gray, single: true, rough: 0.3 });
      this.line(x + s, u, x + s + 6, u, { stroke: C.gray, single: true, rough: 0.3 });
    }
    this.rect(x, y, s, s, { r: 3, fill: o.fill ?? C.card, stroke: o.stroke ?? C.ink2 });
    this.rect(x + s * 0.22, y + s * 0.22, s * 0.56, s * 0.56, { r: 2, fill: o.die ?? C.paper, stroke: C.line, sw: 0.8 });
    if (o.label) this.text(x + s / 2, y + s / 2, o.label, { cls: o.lcls ?? 'mono', size: o.size ?? 10, vc: true });
    if (o.under) this.text(x + s / 2, y + s + 18, o.under, { cls: 'sm' });
    return this;
  },
  laptop(x, y, w, o = {}) {
    const h = w * 0.62;
    this.rect(x + w * 0.08, y, w * 0.84, h, { r: 3, fill: o.fill ?? C.card, stroke: o.stroke ?? C.ink2 });
    this.rect(x + w * 0.13, y + h * 0.1, w * 0.74, h * 0.76, { r: 1, fill: o.screen ?? C.paper, stroke: C.line, sw: 0.7 });
    this.poly([[x, y + h + 8], [x + w * 0.08, y + h], [x + w * 0.92, y + h], [x + w, y + h + 8]], { fill: o.fill ?? C.card, stroke: o.stroke ?? C.ink2 });
    if (o.label) this.text(x + w / 2, y + h + 22, o.label, { cls: 'sm' });
    return this;
  },
  phone(x, y, h, o = {}) {
    const w = h * 0.52;
    this.rect(x, y, w, h, { r: 6, fill: o.fill ?? C.card, stroke: o.stroke ?? C.ink2 });
    this.rect(x + 4, y + 9, w - 8, h - 20, { r: 1, fill: o.screen ?? C.paper, stroke: C.line, sw: 0.7 });
    this.dot(x + w / 2, y + h - 5.5, 1.6, C.gray);
    if (o.label) this.text(x + w / 2, y + h + 13, o.label, { cls: 'sm' });
    return this;
  },
  person(x, y, s = 30, o = {}) {
    const st = o.stroke ?? C.ink2;
    this.circle(x, y + s * 0.18, s * 0.34, { fill: o.fill ?? C.card, stroke: st });
    this.path(`M${x - s * 0.32},${y + s} Q${x - s * 0.32},${y + s * 0.42} ${x},${y + s * 0.42} Q${x + s * 0.32},${y + s * 0.42} ${x + s * 0.32},${y + s}`, { stroke: st, fill: o.fill ?? C.card, single: true });
    if (o.label) this.text(x, y + s + 13, o.label, { cls: 'sm' });
    return this;
  },
  envelope(x, y, w, h, o = {}) {
    this.rect(x, y, w, h, { r: 1.5, fill: o.fill ?? C.paper, stroke: o.stroke ?? C.ink2, sw: o.sw ?? 1 });
    this.lines([[x + 1, y + 1], [x + w / 2, y + h * 0.58], [x + w - 1, y + 1]], { stroke: o.stroke ?? C.ink2, sw: (o.sw ?? 1) * 0.8, single: true, rough: 0.3 });
    if (o.label) this.text(x + w / 2, y + h + 11, o.label, { cls: 'mono', size: 9 });
    return this;
  },
  doc(x, y, w, h, o = {}) {
    const f = Math.min(12, w * 0.25);
    this.poly([[x, y], [x + w - f, y], [x + w, y + f], [x + w, y + h], [x, y + h]], { fill: o.fill ?? C.paper, stroke: o.stroke ?? C.ink2 });
    this.lines([[x + w - f, y], [x + w - f, y + f], [x + w, y + f]], { stroke: o.stroke ?? C.ink2, single: true, sw: 0.8 });
    if (o.lines !== false) for (let yy = y + f + 6; yy < y + h - 5; yy += 6) this.line(x + 5, yy, x + w - 6 - ((yy * 7) % 9), yy, { stroke: C.line, sw: 0.7, single: true, rough: 0.3 });
    if (o.label) this.text(x + w / 2, y + h + 13, o.label, { cls: 'sm' });
    return this;
  },
  cloud(x, y, w, h, o = {}) {
    const d = `M${x + w * 0.18},${y + h} C${x - w * 0.04},${y + h} ${x - w * 0.02},${y + h * 0.52} ${x + w * 0.16},${y + h * 0.5} C${x + w * 0.14},${y + h * 0.1} ${x + w * 0.46},${y - h * 0.04} ${x + w * 0.56},${y + h * 0.22} C${x + w * 0.66},${y + h * 0.04} ${x + w * 0.9},${y + h * 0.16} ${x + w * 0.86},${y + h * 0.44} C${x + w * 1.04},${y + h * 0.46} ${x + w * 1.04},${y + h} ${x + w * 0.82},${y + h} Z`;
    if (o.fill) this.parts.push(`<path d="${d}" style="fill:${o.fill}"/>`);
    this.path(d, { stroke: o.stroke ?? C.ink2, single: true });
    if (o.label) this.text(x + w / 2, y + h * 0.62, o.label, { cls: o.lcls ?? 'lbl', size: o.size, vc: true });
    return this;
  },
  lock(x, y, s = 18, o = {}) {
    const st = o.stroke ?? C.ink2;
    this.path(`M${x + s * 0.22},${y + s * 0.45} L${x + s * 0.22},${y + s * 0.28} Q${x + s * 0.22},${y} ${x + s * 0.5},${y} Q${x + s * 0.78},${y} ${x + s * 0.78},${y + s * 0.28} L${x + s * 0.78},${y + s * 0.45}`, { stroke: st, single: true, sw: 1.4 });
    this.rect(x, y + s * 0.45, s, s * 0.6, { r: 2, fill: o.fill ?? C.card, stroke: st });
    this.dot(x + s / 2, y + s * 0.72, 1.6, st);
    return this;
  },
  key(x, y, s = 24, o = {}) {
    const st = o.stroke ?? C.ink2;
    this.circle(x + s * 0.2, y, s * 0.36, { fill: o.fill ?? C.card, stroke: st });
    this.lines([[x + s * 0.38, y], [x + s, y], [x + s, y + s * 0.18]], { stroke: st, single: true, sw: 1.3 });
    this.line(x + s * 0.8, y, x + s * 0.8, y + s * 0.14, { stroke: st, single: true, sw: 1.3 });
    return this;
  },
  router(x, y, w, o = {}) {
    const h = w * 0.34, st = o.stroke ?? C.ink2;
    this.line(x + w * 0.25, y, x + w * 0.18, y - h * 0.9, { stroke: st, single: true });
    this.line(x + w * 0.75, y, x + w * 0.82, y - h * 0.9, { stroke: st, single: true });
    this.rect(x, y, w, h, { r: h / 2.4, fill: o.fill ?? C.card, stroke: st });
    for (let i = 0; i < 4; i++) this.dot(x + w * 0.3 + i * w * 0.13, y + h / 2, 1.6, o.led && o.led(i) ? C.acc : C.gray);
    if (o.label) this.text(x + w / 2, y + h + 13, o.label, { cls: 'sm' });
    return this;
  },
  clock(cx, cy, dia, o = {}) {
    this.circle(cx, cy, dia, { fill: o.fill ?? C.paper, stroke: o.stroke ?? C.ink2 });
    for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; this.line(cx + Math.cos(a) * dia * 0.4, cy + Math.sin(a) * dia * 0.4, cx + Math.cos(a) * dia * 0.46, cy + Math.sin(a) * dia * 0.46, { stroke: C.gray, single: true, rough: 0.2, sw: 0.8 }); }
    const hand = (dd) => dd.line(cx, cy, cx, cy - dia * 0.36, { stroke: o.hand ?? C.acc, sw: 1.6, single: true, rough: 0.2 });
    if (o.spin) this.spin(cx, cy, hand, { dur: o.spin }); else { const a = (o.t ?? 0) * 2 * Math.PI - Math.PI / 2; this.line(cx, cy, cx + Math.cos(a) * dia * 0.36, cy + Math.sin(a) * dia * 0.36, { stroke: o.hand ?? C.acc, sw: 1.6, single: true, rough: 0.2 }); }
    this.dot(cx, cy, 2, C.ink);
    if (o.label) this.text(cx, cy + dia / 2 + 13, o.label, { cls: 'sm' });
    return this;
  },
  gear(cx, cy, r, o = {}) {
    const n = o.teeth ?? 8, pts = [];
    for (let i = 0; i < n * 2; i++) { const a = i * Math.PI / n, rr = i % 2 ? r * 0.78 : r; pts.push([cx + Math.cos(a - 0.18) * rr, cy + Math.sin(a - 0.18) * rr], [cx + Math.cos(a + 0.18) * rr, cy + Math.sin(a + 0.18) * rr]); }
    const draw = (dd) => { dd.poly(pts, { fill: o.fill ?? C.card, stroke: o.stroke ?? C.ink2 }); dd.circle(cx, cy, r * 0.6, { fill: C.paper, stroke: o.stroke ?? C.ink2 }); };
    if (o.spin) this.spin(cx, cy, draw, { dur: o.spin, ccw: o.ccw }); else draw(this);
    return this;
  },
  pin(x, y, o = {}) {
    const st = o.stroke ?? C.ink, f = o.fill ?? C.card;
    this.path(`M${x},${y} C${x - 2},${y - 6} ${x - 7},${y - 9} ${x - 7},${y - 14} A7,7 0 1 1 ${x + 7},${y - 14} C${x + 7},${y - 9} ${x + 2},${y - 6} ${x},${y} Z`, { stroke: st, fill: f, single: true });
    this.dot(x, y - 14, 2.2, st);
    if (o.label) this.text(x + (o.dx ?? 0), y + (o.dy ?? 12), o.label, { cls: o.lcls ?? 'sm', a: o.a, size: o.size });
    return this;
  },
  tape(x, y, cells, o = {}) {
    const cw = o.cw ?? 34, h = o.h ?? 26;
    cells.forEach((c, i) => {
      const hot = o.hot ? o.hot(i) : false;
      this.rect(x + i * cw, y, cw, h, { r: 0, fill: hot ? C.accSoft : (o.fill ? o.fill(i) : C.card), stroke: hot ? C.acc : C.ink2, sw: 0.9 });
      if (c != null && c !== '') this.text(x + i * cw + cw / 2, y + h / 2 + 0.5, c, { cls: 'mono', size: o.size ?? 10 });
      if (o.idx) this.text(x + i * cw + cw / 2, y + h + 10, String(o.idx(i)), { cls: 'xs' });
    });
    return this;
  },
});
