import { D, C } from './draw.js';
import { world, arc } from './world.js';

export function scene(id, title, height = 360) {
  const d = new D(640, height, id);
  d.text(10, 16, title, { cls: 'cap', a: 'start' });
  d.raw(`<title>${title.replaceAll('&', '&amp;').replaceAll('<', '&lt;')}</title>`);
  return d;
}

// A page is a physical sheet or a fixed-size memory unit, never a generic node.
export function page(d, x, y, w, h, label, hot = false) {
  d.doc(x, y, w, h, { lines: false, fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2 });
  if (label) d.mono(x + w / 2, y + h / 2 + 3, label, { size: 11 });
}

export function shelf(d, x, y, labels, { width = 240, hot = -1, height = 30 } = {}) {
  const w = width / labels.length;
  labels.forEach((label, i) => {
    d.rect(x + i * w, y, w, height, { r: 0, fill: i === hot ? C.accSoft : C.card, stroke: i === hot ? C.acc : C.line });
    d.mono(x + i * w + w / 2, y + height / 2, label, { size: 10 });
  });
  d.line(x - 4, y + height + 4, x + width + 4, y + height + 4, { stroke: C.ink2, single: true });
}

export function label(d, x, y, title, detail = '', anchor = 'middle') {
  d.text(x, y, title, { cls: 'ttl', a: anchor });
  if (detail) d.text(x, y + 19, detail, { cls: 'sm', a: anchor });
}

export function routeMap(id, labels, stage = 99) {
  const rows = Math.ceil(labels.length / 3), d = scene(id + stage, 'CHAPTER ATLAS / FOLLOW THE READING PATH', 62 + rows * 99);
  const points = labels.map((_, i) => [110 + (Math.floor(i / 3) % 2 ? 2 - i % 3 : i % 3) * 210, 65 + Math.floor(i / 3) * 99]);
  points.slice(1).forEach((p, i) => {
    const a = points[i];
    if (a[1] === p[1]) d.line(a[0], a[1], p[0], p[1], { stroke: C.line, sw: 2, single: true });
    else d.path(`M${a[0]},${a[1]} C${a[0] + (a[0] > 320 ? 75 : -75)},${a[1]} ${p[0] + (p[0] > 320 ? 75 : -75)},${p[1]} ${p[0]},${p[1]}`, { stroke: C.line, sw: 2, single: true });
  });
  labels.forEach((text, i) => {
    const [x, y] = points[i], on = stage === 99 || stage === i + 1;
    if (on) d.circle(x, y, 37, { fill: C.accFaint, stroke: C.accFaint });
    d.circle(x, y, 24, { fill: on ? C.accSoft : C.paper, stroke: on ? C.acc : C.ink2, sw: 1.3 });
    d.mono(x, y, i + 1, { size: 10, color: on ? C.acc : C.ink2 });
    const words = text.replaceAll('\n', ' ').split(' '), lines = [''];
    for (const word of words) {
      if ((lines.at(-1) + ' ' + word).trim().length > 25 && lines.at(-1)) lines.push(word);
      else lines[lines.length - 1] = (lines.at(-1) + ' ' + word).trim();
    }
    d.text(x, y + 27, lines.join('\n'), { size: 11, color: on ? C.ink : C.gray, lh: 14 });
  });
  return d.svg();
}

export function mapSite(d, m, city, text, { dx = 0, dy = 30, hot = false } = {}) {
  const [x, y] = m.at(city);
  if (hot) {
    d.circle(x, y, 48, { fill: C.accFaint, stroke: C.accFaint });
    d.circle(x, y, 30, { stroke: C.acc, sw: .7, op: .5 });
  }
  d.server(x - 10, y - 15, 20, 30, { unit: 10, fill: hot ? C.accSoft : C.paper, stroke: hot ? C.acc : C.ink2, led: () => hot });
  d.text(x + dx, y + dy, text, { cls: 'sm', size: 11 });
  return [x, y];
}

// Cover art uses the subject's structures. Positions are illustrative, not scale.
export function coverArtwork(d, id, top = 340) {
  const y = top;
  if (/cdn|network|traffic/.test(id)) {
    const m = world(d, 35, y, 570, 255, { graticule: false });
    const a = m.at('virginia');
    ['london', 'mumbai', 'tokyo', 'sydney', 'saopaulo'].forEach(city => {
      const b = m.at(city);
      d.path(arc(a, b, .15), { stroke: C.line, single: true });
      mapSite(d, m, city, '', { hot: city === 'mumbai' });
    });
    d.db(a[0] - 16, a[1] - 20, 32, 40, { stroke: C.acc, fill: C.accSoft });
    label(d, 320, y + 292, 'A request has somewhere to go', 'Routes, serving sites and the source of truth');
  } else if (/fund_os/.test(id)) {
    d.cpu(56, y + 75, 100, { label: 'CPU', die: C.accSoft });
    d.ram(227, y + 49, 165, 58, { chips: 4, chip: i => i === 1 ? C.accSoft : C.paper });
    ['code', 'heap', 'stack'].forEach((s, i) => page(d, 235 + i * 58, y + 147, 46, 60, s, i === 1));
    d.disk(517, y + 138, 112);
    d.lines([[166, y + 124], [201, y + 124], [201, y + 78], [221, y + 78]], { stroke: C.ink2, single: true });
    d.lines([[398, y + 78], [438, y + 78], [438, y + 138], [458, y + 138]], { stroke: C.ink2, single: true });
    label(d, 320, y + 266, 'The machine behind your program', 'A core, private address spaces and persistent bytes');
  } else if (/database|fund_dbms|nosql/.test(id)) {
    shelf(d, 248, y + 14, ['key'], { width: 144, hot: 0 });
    [[48, 'rows'], [248, 'index'], [448, 'rows']].forEach(([x, s]) => {
      d.arrow(320, y + 53, x + 68, y + 108, { stroke: C.line });
      page(d, x, y + 116, 136, 92, s, s === 'index');
      for (let r = 0; r < 3; r++) d.line(x + 15, y + 157 + r * 14, x + 120, y + 157 + r * 14, { stroke: C.line, single: true });
    });
    label(d, 320, y + 266, 'Facts become pages', 'Keys choose an access path; the engine preserves the result');
  } else if (/queue|kafka|pipeline/.test(id)) {
    for (let i = 0; i < 7; i++) page(d, 53 + i * 76, y + 83, 53, 70, i < 4 ? 'event' : '', i === 3);
    d.line(34, y + 166, 607, y + 166, { stroke: C.ink2, sw: 2, single: true });
    for (let i = 0; i < 9; i++) d.circle(55 + i * 65, y + 181, 14, { stroke: C.line });
    d.arrow(398, y + 214, 596, y + 214, { stroke: C.acc });
    label(d, 320, y + 266, 'Work keeps moving', 'Stored events, independent readers and recoverable progress');
  } else if (/rate_limiting/.test(id)) {
    d.path(`M180,${y + 57} L203,${y + 226} Q320,${y + 257} 437,${y + 226} L460,${y + 57}`, { stroke: C.ink2, single: true, sw: 1.7 });
    d.ellipse(320, y + 57, 280, 50, { stroke: C.ink2 });
    for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) d.circle(238 + c * 41, y + 109 + r * 42, 26, { fill: C.accSoft, stroke: C.acc });
    d.arrow(320, y - 10, 320, y + 28, { stroke: C.acc });
    label(d, 320, y + 291, 'Admission spends a limited resource', 'Refill, burst allowance and the cost of each request');
  } else if (/security/.test(id)) {
    d.doc(86, y + 47, 144, 180, { lines: false });
    d.person(158, y + 70, 43);
    d.mono(158, y + 146, 'identity');
    d.mono(158, y + 169, 'scope');
    d.mono(158, y + 192, 'expiry');
    d.lock(352, y + 40, 112, { fill: C.accSoft, stroke: C.acc });
    d.key(282, y + 159, 48);
    d.server(511, y + 92, 70, 102);
    label(d, 320, y + 266, 'A credential opens a specific door', 'Identity, permission and the boundary that enforces them');
  } else if (/observability|performance/.test(id)) {
    const spans = [[65, 34, 500, 'request'], [125, 91, 300, 'database'], [195, 148, 160, 'storage']];
    spans.forEach(([x, yy, w, s], i) => {
      d.rect(x, y + yy, w, 34, { r: 2, fill: i === 1 ? C.accSoft : C.card, stroke: i === 1 ? C.acc : C.ink2 });
      d.text(x + 12, y + yy + 17, s, { cls: 'mono', a: 'start' });
    });
    d.arrow(65, y + 218, 575, y + 218, { stroke: C.gray });
    label(d, 320, y + 266, 'See where the time goes', 'Nested work, waiting and the request the user experiences');
  } else if (/reliability|distributed/.test(id)) {
    [95, 278, 461].forEach((x, i) => {
      d.rect(x - 28, y + 20, 154, 216, { fill: i === 1 ? C.accFaint : C.paper, stroke: C.line, dash: [4, 4] });
      d.server(x, y + 64, 98, 130, { fill: i === 1 ? C.accSoft : C.card, stroke: i === 1 ? C.acc : C.ink2 });
      d.text(x + 49, y + 220, 'failure domain', { cls: 'sm' });
    });
    label(d, 320, y + 278, 'Keep failures inside their boundaries', 'Copies help when their failure causes are independent');
  } else if (/storage/.test(id)) {
    d.disk(141, y + 125, 148);
    for (let i = 0; i < 3; i++) shelf(d, 305, y + 55 + i * 60, ['key', 'bytes', 'meta'], { width: 275, hot: i === 1 ? 1 : -1 });
    label(d, 320, y + 266, 'Bytes need an address and a lifetime', 'Blocks, file paths and immutable object identities');
  } else if (/realtime/.test(id)) {
    d.server(266, y + 68, 106, 126, { led: () => true });
    [[58, 43], [494, 43], [58, 173], [494, 173]].forEach(([x, yy]) => {
      d.phone(x, y + yy, 76);
      d.carrow([[x + 41, y + yy + 38], [210 + (x > 320 ? 210 : 0), y + yy + 38], [x > 320 ? 380 : 260, y + 131]], { stroke: C.acc, hl: 6 });
    });
    label(d, 320, y + 291, 'One event reaches many screens', 'Connection state, replay and evidence of delivery');
  } else {
    d.laptop(62, y + 72, 165, { screen: C.accFaint });
    d.server(300, y + 61, 92, 119, { led: i => i === 1 });
    d.db(478, y + 80, 99, 114);
    d.arrow(233, y + 124, 292, y + 124, { stroke: C.acc });
    d.arrow(398, y + 124, 469, y + 124, { stroke: C.ink2 });
    label(d, 320, y + 266, 'Follow the operation, then its consequences', 'The caller, the decision and the durable state');
  }
}
