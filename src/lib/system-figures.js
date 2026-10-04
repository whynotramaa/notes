import { D, C } from './draw.js';

// The shared compositions only place geometry. Each diagram supplies its own
// mechanism, labels, values and highlighted decision.
export function systemFigure(id, title, kind, data, note = '') {
  const rowHeight = kind === 'rows' ? 63 + Math.max(0, data.length - 1) * 57 + 35 + 54 : 310;
  const sequenceEnd = kind === 'sequence' ? 111 + Math.max(0, data.steps.length - 1) * 44 + 24 : 304;
  const height = kind === 'sequence' ? Math.max(365, sequenceEnd + 60)
    : kind === 'fan' ? 332
    : kind === 'bars' ? Math.max(310, 64 + Math.max(0, data.length - 1) * 52 + 25 + 55)
    : Math.max(310, rowHeight);
  const d = new D(640, height, id);
  d.text(10, 16, title, { cls: 'cap', a: 'start' });
  if (kind === 'flow') {
    const labels = data;
    const count = labels.length, width = Math.min(170, (588 - (count - 1) * 24) / count);
    labels.forEach((s, i) => {
      const x = 26 + i * (width + 24);
      d.box(x, 104, width, 66, s, { fill: i === count - 1 ? C.accSoft : C.card, stroke: i === count - 1 ? C.acc : C.ink2, size: 12 });
      if (i < count - 1) d.arrow(x + width + 3, 137, x + width + 20, 137, { stroke: C.gray });
    });
  } else if (kind === 'sequence') {
    const { actors, steps } = data;
    const xs = actors.map((_, i) => 70 + i * 500 / (actors.length - 1));
    actors.forEach((s, i) => {
      d.box(xs[i] - 59, 47, 118, 34, s, { fill: C.card, size: 11 });
      d.line(xs[i], 84, xs[i], sequenceEnd, { stroke: C.line, dash: [4, 5] });
    });
    steps.forEach(([from, to, label], i) => {
      const y = 111 + i * 44;
      d.arrow(xs[from], y, xs[to], y, { stroke: i === steps.length - 1 ? C.acc : C.ink2 });
      d.text((xs[from] + xs[to]) / 2, y - 13, label, { cls: 'sm', size: 11 });
    });
  } else if (kind === 'rows') {
    data.forEach(([label, ...values], i) => {
      const y = 63 + i * 57;
      d.text(20, y + 16, label, { a: 'start', cls: 'mono', size: 10 });
      const w = Math.min(204, 428 / values.length - 10);
      values.forEach((s, j) => d.box(170 + j * (w + 10), y, w, 35, s, { fill: i === data.length - 1 ? C.accSoft : C.card, stroke: i === data.length - 1 ? C.acc : C.line, cls: 'mono', size: 11 }));
    });
  } else if (kind === 'bars') {
    const max = Math.max(...data.map(v => v[1]));
    data.forEach(([s, value, unit], i) => {
      const y = 64 + i * 52;
      d.text(18, y + 13, s, { a: 'start', cls: 'sm', size: 11 });
      d.rect(192, y, value / max * 305, 25, { fill: i === data.length - 1 ? C.accSoft : C.card, stroke: i === data.length - 1 ? C.acc : C.ink2, r: 2 });
      d.mono(516, y + 13, `${value} ${unit || ''}`, { a: 'start', size: 10 });
    });
  } else if (kind === 'fan') {
    const { source, targets, labels = [] } = data;
    d.box(24, 119, 150, 60, source, { fill: C.card, size: 12 });
    targets.forEach((s, i) => {
      const y = 50 + i * 188 / Math.max(1, targets.length - 1);
      d.box(410, y, 201, 40, s, { fill: i === targets.length - 1 ? C.accSoft : C.card, stroke: i === targets.length - 1 ? C.acc : C.ink2, size: 11 });
      d.lines([[178, 149], [278, 149], [278, y + 20], [404, y + 20]], { single: true, stroke: C.gray });
      d.head(404, y + 20, 0, { stroke: C.gray });
      if (labels[i]) d.text(335, y + 7, labels[i], { cls: 'sm', size: 10 });
    });
  } else if (kind === 'tree') {
    d.box(233, 53, 174, 42, data[0], { fill: C.accSoft, stroke: C.acc, cls: 'mono', size: 12 });
    data.slice(1).forEach((s, i, a) => {
      const width = 540 / a.length - 18, x = 50 + i * 540 / a.length;
      d.arrow(320, 99, x + width / 2, 176, { stroke: C.gray });
      d.box(x, 184, width, 48, s, { fill: C.card, cls: 'mono', size: 11 });
    });
  } else if (kind === 'ring') {
    d.circle(322, 148, 184, { stroke: C.gray });
    data.forEach((s, i) => {
      const a = 2 * Math.PI * i / data.length - Math.PI / 2;
      const x = 322 + Math.cos(a) * 110, y = 148 + Math.sin(a) * 94;
      d.box(x - 62, y - 19, 124, 38, s, { fill: i === data.length - 1 ? C.accSoft : C.card, stroke: i === data.length - 1 ? C.acc : C.ink2, size: 10 });
    });
    d.text(322, 150, 'clockwise owner', { cls: 'sm', size: 10 });
  } else if (kind === 'matrix') {
    const { rows, cols, values } = data;
    const w = Math.min(200, 410 / cols.length), h = Math.min(41, 162 / rows.length);
    const x = 187, y = 92;
    cols.forEach((s, i) => d.text(x + i * w + w / 2, y - 21, s, { cls: 'sm', size: 10 }));
    rows.forEach((s, i) => d.text(x - 19, y + i * h + h / 2, s, { a: 'end', cls: 'sm', size: 10 }));
    d.grid(x, y, rows.length, cols.length, w, h, { val: (r, c) => values[r][c], cellFill: (r, c) => values[r][c] === 'yes' || values[r][c] === 'commit' ? C.accSoft : C.card, vsize: 10 });
  } else if (kind === 'split') {
    data.forEach(([title, body], i) => {
      const x = 27 + i * 310;
      d.text(x + 137, 57, title, { cls: 'ttl', size: 13 });
      d.box(x, 86, 276, 129, body, { fill: i ? C.accSoft : C.card, stroke: i ? C.acc : C.ink2, size: 13 });
    });
  } else if (kind === 'timeline') {
    const { events, end } = data;
    d.arrow(44, 172, 606, 172, { stroke: C.gray });
    events.forEach(([t, label], i) => {
      const x = 50 + t / end * 536, up = i % 2 === 0;
      d.dot(x, 172, 3, i === events.length - 1 ? C.acc : C.ink);
      d.line(x, 172, x, up ? 120 : 209, { stroke: C.line });
      d.text(x, up ? 105 : 225, label, { cls: 'sm', size: 11 });
      d.mono(x, up ? 85 : 247, String(t), { size: 10 });
    });
  }
  if (note) d.hand(320, height - 26, note, { size: 18 });
  return d.svg();
}

export function systemMap(id, labels, stage = 99) {
  const height = 54 + Math.ceil(labels.length / 2) * 62;
  const d = new D(640, height, id + stage);
  d.text(10, 16, 'THE REQUEST, THE STATE, AND THE FAILURE', { cls: 'cap', a: 'start' });
  labels.forEach((s, i) => {
    const x = 24 + (i % 2) * 308, y = 51 + Math.floor(i / 2) * 62;
    const active = stage === 99 || stage === i + 1;
    d.box(x, y, 282, 39, s, { fill: active ? C.accSoft : C.card, stroke: active ? C.acc : C.line, size: 12 });
    d.mono(x + 5, y - 10, String(i + 1).padStart(2, '0'), { a: 'start', size: 9, color: active ? C.acc : C.gray });
  });
  return d.svg();
}

export function systemCover(id, unit, lines, subtitle, labels) {
  const d = new D(640, 830, id);
  for (let x = 15; x < 640; x += 23) for (let y = 34; y < 795; y += 23) d.dot(x, y, .6, C.faint);
  d.text(10, 16, `SYSTEM DESIGN / UNIT ${unit} / FIELD GUIDE`, { cls: 'cap', a: 'start' });
  lines.forEach((s, i) => d.text(42, 112 + i * 65, s, { a: 'start', size: 48, w: 600 }));
  d.hl(44, 195, Math.min(584, 44 + lines.at(-1).length * 25), 195, { th: 15 });
  d.text(45, 249, subtitle, { a: 'start', size: 15 });
  labels.slice(0, 5).forEach((s, i) => {
    const y = 346 + i * 74;
    d.box(211, y, 356, 49, s, { fill: i === 4 ? C.accSoft : C.card, stroke: i === 4 ? C.acc : C.ink2, size: 15 });
    if (i < 4) d.arrow(389, y + 52, 389, y + 70, { stroke: C.gray });
  });
  d.hand(109, 469, 'follow one\nreal request', { size: 25, vc: true });
  d.carrow([[109, 505], [141, 531], [201, 531]], { stroke: C.acc });
  d.text(44, 787, 'DRAW EVERY BOX. DEFEND EVERY CHOICE.', { a: 'start', cls: 'cap', size: 11 });
  return d.svg();
}
