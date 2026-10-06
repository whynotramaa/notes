import { D, C } from './draw.js';
import { scene, routeMap } from './figure-details.js';

export { C };
export const fig = scene;
export const beMap = (id, labels, stage = 99) => routeMap(id, labels, stage);

export function card(d, x, y, w, lines, o = {}) {
  const lh = o.lh ?? 15, h = o.h ?? lines.length * lh + 16;
  d.rect(x, y, w, h, { r: 5, fill: o.fill ?? C.paper, stroke: o.stroke ?? C.ink2 });
  if (o.title) d.text(x + 8, y - 9, o.title, { cls: 'xs', a: 'start' });
  lines.forEach((s, i) => {
    const hot = o.hot?.includes(i);
    if (hot) d.fillRect(x + 4, y + 8 + i * lh, w - 8, lh - 1, C.accSoft, 1, 2);
    d.mono(x + 10, y + 8 + i * lh + lh / 2, s, { a: 'start', size: o.size ?? 10, color: hot ? C.acc : undefined, w: i === 0 && o.bold !== false ? 600 : undefined });
  });
  return h;
}

export function actors(d, list, y, bottom, o = {}) {
  const x0 = o.x0 ?? 70, x1 = o.x1 ?? 570;
  const xs = list.map((_, i) => list.length === 1 ? 320 : x0 + i * (x1 - x0) / (list.length - 1));
  list.forEach((s, i) => {
    const hot = o.hot === i;
    d.box(xs[i] - 55, y, 110, 30, s, { r: 6, fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2, size: 11 });
    d.line(xs[i], y + 34, xs[i], bottom, { stroke: C.line, dash: [3, 5], single: true });
  });
  return xs;
}

export function say(d, xa, xb, y, label, o = {}) {
  const col = o.hot ? C.acc : (o.color ?? C.ink2);
  d.arrow(xa, y, xb, y, { stroke: col, sw: o.hot ? 1.5 : 1.05, hl: 6, dash: o.dash });
  d.text((xa + xb) / 2, y - 9, label, { cls: o.cls ?? 'mono', size: o.size ?? 9.5, color: o.hot ? C.acc : undefined });
}

export function steps(d, items, y, hot = -1, o = {}) {
  const n = items.length, gap = o.gap ?? 18, x0 = o.x0 ?? 24, w = (o.w ?? (592 - (n - 1) * gap) / n), h = o.h ?? 56;
  items.forEach(([a, b], i) => {
    const x = x0 + i * (w + gap), on = i === hot || (Array.isArray(hot) && hot.includes(i));
    d.rect(x, y, w, h, { r: 7, fill: on ? C.accSoft : C.card, stroke: on ? C.acc : C.ink2 });
    d.text(x + w / 2, y + (b ? h / 2 - 8 : h / 2), a, { cls: 'ttl', size: o.size ?? 11, color: on ? C.acc : undefined });
    if (b) d.text(x + w / 2, y + h / 2 + 10, b, { cls: 'xs' });
    if (i < n - 1) d.arrow(x + w + 2, y + h / 2, x + w + gap - 2, y + h / 2, { stroke: C.gray, hl: 5 });
  });
  return { w, x: (i) => x0 + i * (w + gap) };
}

export function panel(d, x, y, w, h, title = '', hot = false) {
  d.rect(x, y, w, h, { r: 7, fill: hot ? C.accFaint : C.paper, stroke: hot ? C.acc : C.line });
  if (title) d.text(x + w / 2, y + 18, title, { cls: 'ttl', color: hot ? C.acc : undefined });
}

export function hbars(d, rows, o = {}) {
  const x = o.x ?? 190, w = o.w ?? 300, y0 = o.y ?? 56, h = o.h ?? 24, gap = o.gap ?? 40;
  const max = o.max ?? Math.max(...rows.map((r) => r[1]));
  rows.forEach(([label, v, txt, hot], i) => {
    const y = y0 + i * gap;
    d.text(x - 12, y + h / 2, label, { cls: 'sm', a: 'end' });
    d.rect(x, y, Math.max(3, v / max * w), h, { r: 2, fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2 });
    d.mono(x + Math.max(3, v / max * w) + 8, y + h / 2, txt ?? String(v), { a: 'start', size: 10, color: hot ? C.acc : undefined });
  });
}

export const cross = (d, x, y, s = 8, color = C.acc) => { d.line(x - s, y - s, x + s, y + s, { stroke: color, sw: 1.8, single: true }); d.line(x - s, y + s, x + s, y - s, { stroke: color, sw: 1.8, single: true }); };
export const tick = (d, x, y, s = 8, color = C.acc) => d.lines([[x - s, y], [x - s / 3, y + s * 0.7], [x + s, y - s * 0.8]], { stroke: color, sw: 1.8, single: true });

export function shield(d, x, y, s = 40, o = {}) {
  const p = `M${x},${y} L${x + s / 2},${y + s * 0.14} L${x + s / 2},${y + s * 0.55} Q${x + s / 2},${y + s * 0.9} ${x},${y + s * 1.1} Q${x - s / 2},${y + s * 0.9} ${x - s / 2},${y + s * 0.55} L${x - s / 2},${y + s * 0.14} Z`;
  d.path(p, { stroke: o.stroke ?? C.ink2, fill: o.fill ?? C.card, single: true });
  if (o.label) d.text(x, y + s * 0.5, o.label, { cls: 'mono', size: o.size ?? 9.5 });
}

export function browser(d, x, y, w, h, url, o = {}) {
  d.rect(x, y, w, h, { r: 6, fill: o.fill ?? C.paper, stroke: o.stroke ?? C.ink2 });
  d.line(x, y + 22, x + w, y + 22, { stroke: o.stroke ?? C.ink2, single: true, sw: 0.8 });
  [0, 1, 2].forEach((i) => d.circle(x + 11 + i * 10, y + 11, 6, { stroke: C.gray, sw: 0.8 }));
  d.rect(x + 42, y + 5, w - 50, 13, { r: 6, fill: C.card, stroke: C.line, sw: 0.7 });
  d.mono(x + 50, y + 11.5, url, { a: 'start', size: 8.5, color: o.urlColor });
}

export function beCover(id, unit, lines, subtitle, art, stations = []) {
  const d = new D(640, 830, id);
  d.text(10, 16, `BACKEND ENGINEERING / UNIT ${unit} / FIELD GUIDE`, { cls: 'cap', a: 'start' });
  lines.forEach((s, i) => d.text(42, 112 + i * 65, s, { a: 'start', size: 48, w: 600 }));
  d.hl(42, 112 + (lines.length - 1) * 65 + 20, 42 + lines.at(-1).length * 27, 112 + (lines.length - 1) * 65 + 20, { th: 10, op: 0.35 });
  d.text(45, 112 + lines.length * 65 + 6, subtitle, { a: 'start', size: 15 });
  art(d, 330);
  d.line(42, 672, 598, 672, { stroke: C.line, single: true });
  stations.slice(0, 4).forEach(([s, detail], i) => {
    const x = 43 + (i % 2) * 292, y = 704 + Math.floor(i / 2) * 53;
    d.text(x, y, s, { a: 'start', cls: 'ttl', size: 12 });
    d.text(x, y + 18, detail, { a: 'start', cls: 'sm', size: 10.5 });
  });
  return d.svg();
}

export function hourglass(d, x, y, h, o = {}) {
  const w = h * 0.62, st = o.stroke ?? C.ink2, f = o.level ?? 0.5;
  d.line(x - w / 2 - 3, y, x + w / 2 + 3, y, { stroke: st, sw: 1.6, single: true });
  d.line(x - w / 2 - 3, y + h, x + w / 2 + 3, y + h, { stroke: st, sw: 1.6, single: true });
  const top = h / 2 * (1 - f), bot = h / 2 * f;
  if (top > 1) d.poly([[x - w / 2 * (top / (h / 2)), y + h / 2 - top], [x + w / 2 * (top / (h / 2)), y + h / 2 - top], [x, y + h / 2]], { fill: o.sand ?? C.accSoft, stroke: 'none', single: true, sw: 0 });
  if (bot > 1) d.poly([[x - w / 2, y + h], [x + w / 2, y + h], [x + w / 2 * (1 - bot / (h / 2)), y + h - bot], [x - w / 2 * (1 - bot / (h / 2)), y + h - bot]], { fill: o.sand ?? C.accSoft, stroke: 'none', single: true, sw: 0 });
  d.lines([[x - w / 2, y + 1], [x - 3, y + h / 2], [x - w / 2, y + h - 1]], { stroke: st, single: true });
  d.lines([[x + w / 2, y + 1], [x + 3, y + h / 2], [x + w / 2, y + h - 1]], { stroke: st, single: true });
  if (o.label) d.text(x, y + h + 14, o.label, { cls: 'sm', color: o.lcolor });
}

export function hose(d, x1, y1, x2, y2, o = {}) {
  const col = o.hot ? C.acc : (o.stroke ?? C.ink2), off = o.th ?? 4;
  const a = Math.atan2(y2 - y1, x2 - x1), nx = -Math.sin(a) * off, ny = Math.cos(a) * off;
  d.line(x1 + nx, y1 + ny, x2 + nx, y2 + ny, { stroke: col, single: true, sw: 0.9 });
  d.line(x1 - nx, y1 - ny, x2 - nx, y2 - ny, { stroke: col, single: true, sw: 0.9 });
  if (o.hot) d.flowline([[x1, y1], [x2, y2]], { gap: o.gap ?? 7, dur: o.dur ?? 0.9, sw: 1.8, reverse: o.reverse });
}

export function lanes(d, labels, o = {}) {
  const y0 = o.y ?? 70, gap = o.gap ?? 60, x0 = o.x0 ?? 110, x1 = o.x1 ?? 610;
  labels.forEach((s, i) => {
    const y = y0 + i * gap;
    d.text(x0 - 12, y, s, { cls: 'sm', a: 'end', color: o.hot === i ? C.acc : undefined });
    d.line(x0, y, x1, y, { stroke: C.line, single: true, dash: [2, 4] });
  });
  if (o.time !== false) { const yb = y0 + (labels.length - 1) * gap + (o.tb ?? 34); d.arrow(x0, yb, x1, yb, { stroke: C.gray, hl: 6, sw: 0.9 }); d.text(x1, yb + 13, o.tl ?? 'time', { cls: 'xs', a: 'end' }); }
  return (i) => y0 + i * gap;
}

export function seg(d, x, y, w, label, o = {}) {
  const h = o.h ?? 22, hot = o.hot;
  d.rect(x, y - h / 2, w, h, { r: 4, fill: hot ? C.accSoft : (o.fill ?? C.card), stroke: hot ? C.acc : (o.stroke ?? C.ink2), dash: o.dash });
  if (label) d.mono(x + w / 2, y + 0.5, label, { size: o.size ?? 9.5, color: hot ? C.acc : undefined });
}

export function crowd(d, x, y, n, o = {}) {
  const s = o.s ?? 18, gap = o.gap ?? s * 0.85;
  for (let i = 0; i < n; i++) d.person(x + (o.dir === -1 ? -i : i) * gap, y, s, { stroke: o.hot && o.hot(i) ? C.acc : (o.stroke ?? C.ink2), fill: o.hot && o.hot(i) ? C.accSoft : C.card });
}

export function sheet(d, x, y, cols, rows, o = {}) {
  const rh = o.rh ?? 22, ws = cols.map((c) => c[1]), tw = ws.reduce((a, b) => a + b, 0);
  d.rect(x, y, tw, rh * (rows.length + 1), { r: 3, fill: C.paper, stroke: o.stroke ?? C.ink2 });
  d.fillRect(x + 1, y + 1, tw - 2, rh - 1, C.card);
  let cx = x;
  cols.forEach(([name, w], j) => { d.text(cx + w / 2, y + rh / 2, name, { cls: 'xs', w: 600 }); if (j) d.line(cx, y, cx, y + rh * (rows.length + 1), { stroke: C.line, single: true, sw: 0.7 }); cx += w; });
  rows.forEach((r, i) => {
    const yy = y + rh * (i + 1), hot = o.hot?.includes(i);
    d.line(x, yy, x + tw, yy, { stroke: C.line, single: true, sw: 0.7 });
    if (hot) d.fillRect(x + 2, yy + 2, tw - 4, rh - 3, C.accSoft, 1, 2);
    let xx = x;
    r.forEach((v, j) => { d.mono(xx + ws[j] / 2, yy + rh / 2 + 0.5, v, { size: o.size ?? 9.5, color: hot ? C.acc : (o.dim?.includes(i) ? C.gray : undefined) }); xx += ws[j]; });
  });
  return { h: rh * (rows.length + 1), w: tw, row: (i) => y + rh * (i + 1) + rh / 2 };
}

export function signpost(d, x, y, text, o = {}) {
  const w = o.w ?? Math.max(60, text.length * 6.6 + 18), hot = o.hot;
  d.line(x, y, x, y + (o.pole ?? 46), { stroke: C.ink2, sw: 1.6, single: true });
  d.poly([[x - w / 2, y - 24], [x + w / 2 - 8, y - 24], [x + w / 2, y - 12], [x + w / 2 - 8, y], [x - w / 2, y]], { fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2 });
  d.text(x - 4, y - 12, text, { cls: 'mono', size: o.size ?? 9.5, color: hot ? C.acc : undefined });
}

export function gauge(d, cx, cy, r, v, o = {}) {
  const a0 = Math.PI, pt = (t, rr) => [cx + Math.cos(a0 + t * Math.PI) * rr, cy + Math.sin(a0 + t * Math.PI) * rr];
  d.path(`M${pt(0, r)[0]},${pt(0, r)[1]} A${r},${r} 0 0 1 ${pt(1, r)[0]},${pt(1, r)[1]}`, { stroke: C.ink2, single: true, sw: 1.2 });
  if (o.red != null) d.path(`M${pt(o.red, r - 5)[0]},${pt(o.red, r - 5)[1]} A${r - 5},${r - 5} 0 0 1 ${pt(1, r - 5)[0]},${pt(1, r - 5)[1]}`, { stroke: C.acc, single: true, sw: 4, op: 0.5 });
  for (let i = 0; i <= 10; i++) { const [a, b] = pt(i / 10, r), [c, e] = pt(i / 10, r - (i % 5 ? 4 : 8)); d.line(a, b, c, e, { stroke: C.gray, single: true, rough: 0.2, sw: 0.8 }); }
  const [nx, ny] = pt(Math.max(0, Math.min(1, v)), r - 10);
  d.line(cx, cy, nx, ny, { stroke: o.hot ? C.acc : C.ink, sw: 1.8, single: true, rough: 0.2 }); d.dot(cx, cy, 3, C.ink);
  if (o.label) d.text(cx, cy + 16, o.label, { cls: 'sm' });
  if (o.value) d.mono(cx, cy - r * 0.38, o.value, { size: 10, color: o.hot ? C.acc : undefined });
}

export function bubble(d, x, y, w, h, text, o = {}) {
  const tx = o.tx ?? x + 18, ty = o.ty ?? y + h + 12;
  d.rect(x, y, w, h, { r: 8, fill: o.fill ?? C.paper, stroke: o.stroke ?? C.ink2 });
  d.lines([[tx - 6, y + h - 1], [tx, ty], [tx + 8, y + h - 1]], { stroke: o.stroke ?? C.ink2, single: true });
  d.fillRect(tx - 5, y + h - 2, 12, 3, o.fill ?? C.paper);
  d.text(x + w / 2, y + h / 2, text, { cls: o.cls ?? 'sm', vc: true, size: o.size, color: o.color });
}
