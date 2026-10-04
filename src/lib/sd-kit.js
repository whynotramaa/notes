import { C } from './draw.js';

export const chip = (d, x, y, w, s, hot = false, h = 22) => d.box(x, y, w, h, s, { r: 4, fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2, cls: 'mono', size: 9.5 });
export const panel = (d, x, y, w, h, s = '', hot = false) => { d.rect(x, y, w, h, { r: 6, fill: hot ? C.accFaint : C.paper, stroke: hot ? C.acc : C.line }); if (s) d.text(x + w / 2, y + 18, s, { cls: 'ttl', color: hot ? C.acc : undefined }); };
export const pipe = (d, x1, x2, y, th = 16, hot = false) => { d.fillRect(x1, y - th / 2, x2 - x1, th, hot ? C.accFaint : C.card); d.line(x1, y - th / 2, x2, y - th / 2, { stroke: hot ? C.acc : C.ink2, single: true }); d.line(x1, y + th / 2, x2, y + th / 2, { stroke: hot ? C.acc : C.ink2, single: true }); };
export const cross = (d, x, y, s = 8, color = C.acc) => { d.line(x - s, y - s, x + s, y + s, { stroke: color, sw: 1.8, single: true }); d.line(x - s, y + s, x + s, y - s, { stroke: color, sw: 1.8, single: true }); };
export const tick = (d, x, y, s = 8, color = C.acc) => d.lines([[x - s, y], [x - s / 3, y + s * 0.7], [x + s, y - s * 0.8]], { stroke: color, sw: 1.8, single: true });
export const bolt = (d, x, y, s = 1, color = C.acc) => d.poly([[x, y], [x - 9 * s, y + 18 * s], [x - 1 * s, y + 18 * s], [x - 6 * s, y + 34 * s], [x + 9 * s, y + 12 * s], [x + 1 * s, y + 12 * s], [x + 5 * s, y]], { fill: C.accSoft, stroke: color, sw: 1.1 });
export const ruler = (d, x, y, w, max, step, unit = '', o = {}) => { d.line(x, y, x + w, y, { stroke: C.ink2, single: true }); for (let v = 0; v <= max; v += step) { const t = x + v / max * w; d.line(t, y, t, y + 5, { stroke: C.ink2, single: true, rough: 0.2 }); d.mono(t, y + 15, `${v.toLocaleString('en-US')}${v === max ? unit : ''}`, { size: o.size ?? 9 }); } };
