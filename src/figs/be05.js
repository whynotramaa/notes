import { C, fig, beMap, beCover, card, actors, say, steps, panel, hbars, cross, tick, shield, browser, hourglass, signpost, gauge, crowd, seg, lanes, sheet, hose, bubble } from '../lib/be-kit.js';
import { pipe, bolt } from '../lib/sd-kit.js';

const PARTS = ['REST resources', 'Pagination', 'Bulk APIs, partial updates, versioning', 'Idempotency keys', 'RPC, GraphQL and gRPC', 'API contracts', 'Application architecture', 'Error handling', 'Backend testing', 'Code quality and the full request'];
function drawer(d, x, y, w, h, label, o = {}) {
  d.rect(x, y, w, h, { r: 3, fill: o.hot ? C.accSoft : C.card, stroke: o.hot ? C.acc : C.ink2 });
  d.rect(x + w / 2 - 14, y + h - 12, 28, 6, { r: 3, fill: C.paper, stroke: C.ink2, sw: 0.8 });
  if (label) d.mono(x + w / 2, y + h / 2 - 4, label, { size: o.size ?? 10, color: o.hot ? C.acc : undefined });
}

function sticky(d, x, y, w, h, lines, o = {}) {
  d.poly([[x, y], [x + w, y + 2], [x + w - 2, y + h], [x + 2, y + h - 2]], { fill: C.accSoft, stroke: C.acc });
  lines.forEach((s, i) => d.text(x + w / 2, y + 16 + i * 15, s, { cls: 'hand', size: 13 }));
}

function funnel(d, x, y, w, h, o = {}) {
  d.poly([[x, y], [x + w, y], [x + w * 0.6, y + h * 0.7], [x + w * 0.6, y + h], [x + w * 0.4, y + h], [x + w * 0.4, y + h * 0.7]], { fill: o.fill ?? C.card, stroke: o.stroke ?? C.ink2 });
}

function tree(d, nodes, edges, o = {}) {
  edges.forEach(([a, b]) => d.line(nodes[a][0], nodes[a][1], nodes[b][0], nodes[b][1], { stroke: C.ink2, single: true }));
  nodes.forEach(([x, y, s, hot]) => { d.rect(x - (o.w ?? 46), y - 12, (o.w ?? 46) * 2, 24, { r: 12, fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2 }); d.mono(x, y, s, { size: o.size ?? 9, color: hot ? C.acc : undefined }); });
}

function plug(d, x, y, label, o = {}) {
  d.rect(x, y, 90, 34, { r: 6, fill: o.fill ?? C.card, stroke: o.stroke ?? C.ink2, dash: o.dash });
  d.line(x + 90, y + 11, x + 104, y + 11, { stroke: o.stroke ?? C.ink2, sw: 2.4, single: true });
  d.line(x + 90, y + 23, x + 104, y + 23, { stroke: o.stroke ?? C.ink2, sw: 2.4, single: true });
  d.text(x + 45, y + 17, label, { cls: 'mono', size: 8.5, vc: true });
}

function socket(d, x, y, label, o = {}) {
  d.rect(x, y, 30, 34, { r: 4, fill: C.paper, stroke: o.stroke ?? C.acc });
  d.line(x + 8, y + 11, x + 22, y + 11, { stroke: C.ink2, sw: 2.4, single: true });
  d.line(x + 8, y + 23, x + 22, y + 23, { stroke: C.ink2, sw: 2.4, single: true });
  if (label) d.text(x + 15, y + 46, label, { cls: 'xs' });
}

function stopSign(d, x, y, r) {
  const p = Array.from({ length: 8 }, (_, i) => [x + r * Math.cos(Math.PI / 8 + i * Math.PI / 4), y + r * Math.sin(Math.PI / 8 + i * Math.PI / 4)]);
  d.poly(p, { fill: C.paper, stroke: C.ink2, sw: 1.6 }); d.text(x, y, 'STOP', { cls: 'mono', size: r * 0.42, w: 600 });
}

function floor(d, x, y, w, h, label, detail, hot) {
  d.rect(x, y, w, h, { r: 0, fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2 });
  d.text(x + 12, y + h / 2, label, { cls: 'ttl', a: 'start', color: hot ? C.acc : undefined });
  if (detail) d.text(x + w - 12, y + h / 2, detail, { cls: 'xs', a: 'end' });
}

export const where_be_api = (stage = 99) => beMap('where_be_api', PARTS, stage);

export const cover_be_api = () => beCover('cover_be_api', 'V', ['API design', 'and architecture'], 'Resources, contracts, layers, errors and tests', (d, y) => {
  ['router', 'middleware', 'controller', 'service', 'repository'].forEach((s, i) => {
    d.rect(60 + i * 18, y + 20 + i * 42, 260, 34, { r: 6, fill: i === 3 ? C.accSoft : C.card, stroke: i === 3 ? C.acc : C.ink2 });
    d.text(190 + i * 18, y + 37 + i * 42, s, { cls: 'mono', size: 11 });
  });
  d.db(430, y + 150, 100, 80, { label: 'DB' });
  d.arrow(410, y + 207, 424, y + 195, { stroke: C.gray });
  card(d, 400, y + 20, 200, ['GET /orders/123', '200 OK', '{"id":123,...}'], { hot: [1] });
  d.text(320, y + 270, 'one request, one clear home for each concern', { cls: 'sm' });
}, [['REST', 'resources, pagination, versions'], ['RPC', 'GraphQL and gRPC'], ['Architecture', 'layers and boundaries'], ['Errors and tests', 'models and pyramids']]);

export function be_api_resources() {
  const d = fig('be_api_resources', 'URLS NAME NOUNS; METHODS SUPPLY THE VERBS', 320);
  d.rect(40, 50, 170, 230, { r: 4, fill: C.paper, stroke: C.ink2 });
  [['/users', 0], ['/orders', 1], ['/restaurants', 2]].forEach(([s, i]) => drawer(d, 50, 60 + i * 72, 150, 62, s, { hot: i === 1 }));
  d.rect(210, 132, 70, 50, { r: 2, fill: C.accSoft, stroke: C.acc });
  d.doc(300, 70, 120, 150, { fill: C.paper, stroke: C.acc }); d.mono(360, 90, '/orders/123', { size: 10, color: C.acc });
  d.doc(450, 110, 120, 130, { fill: C.card }); d.mono(510, 130, '/orders/123/items', { size: 9 });
  d.arrow(282, 157, 296, 157, { stroke: C.acc, hl: 5 }); d.arrow(422, 160, 446, 170, { stroke: C.gray, hl: 5 });
  d.hand(470, 270, 'collection → item → sub-collection', { size: 14 });
  return d.svg();
}

export function be_api_nesting() {
  const d = fig('be_api_nesting', 'NEST ONE LEVEL FOR OWNERSHIP; LINK INSTEAD OF NESTING DEEPER', 300);
  for (let i = 0; i < 6; i++) d.rect(30 + i * 14, 50 + i * 12, 280 - i * 28, 180 - i * 24, { r: 6, fill: i === 5 ? C.accSoft : C.paper, stroke: i === 5 ? C.acc : C.ink2 });
  ['restaurants/9', 'menus/3', 'sections/2', 'items/17', 'options/4'].forEach((s, i) => d.mono(40 + i * 14, 62 + i * 12, s, { a: 'start', size: 8.5 }));
  cross(d, 170, 255, 9); d.text(170, 280, 'every level validated, kept in step', { cls: 'xs' });
  d.doc(400, 70, 90, 110, { fill: C.card }); d.mono(445, 194, '/restaurants/9/menu', { size: 9 });
  d.doc(520, 100, 90, 110, { fill: C.accSoft, stroke: C.acc }); d.mono(565, 224, '/menu-items/17', { size: 9, color: C.acc });
  d.carrow([[540, 120], [500, 80], [470, 110]], { stroke: C.acc, dash: [4, 3] }); d.text(510, 64, 'restaurant_id: 9', { cls: 'mono', size: 8.5 });
  tick(d, 505, 255, 9); d.text(505, 280, 'flat item, linked to its owner', { cls: 'xs' });
  return d.svg();
}

export function be_api_stateless() {
  const d = fig('be_api_stateless', 'STATELESS: EVERY REQUEST CARRIES ALL IT NEEDS, SO ANY INSTANCE CAN ANSWER', 290);
  d.phone(40, 90, 90);
  [0, 1, 2, 3].forEach((i) => { d.server(400 + (i % 2) * 110, 50 + Math.floor(i / 2) * 110, 70, 80, { label: `app ${i + 1}`, stroke: i === 2 ? C.acc : C.ink2, fill: i === 2 ? C.accSoft : C.card }); });
  card(d, 110, 90, 240, ['GET /orders?cursor=eyJ...', 'Authorization: Bearer ...', 'Accept-Language: hi'], { size: 9.5 });
  d.arrow(354, 130, 394, 190, { stroke: C.acc });
  d.text(320, 270, 'state lives in the request and in shared stores, never in one server\'s memory', { cls: 'xs' });
  return d.svg();
}

export function be_api_representation() {
  const d = fig('be_api_representation', 'ONE RESOURCE, SEVERAL REPRESENTATIONS', 260);
  d.doc(270, 60, 100, 120, { fill: C.accFaint, stroke: C.acc }); d.mono(320, 195, 'order 123', { size: 10 });
  card(d, 20, 60, 220, ['Accept: application/json', '{"id":123,"total":450}'], {});
  card(d, 400, 60, 220, ['Accept: text/csv', 'id,total', '123,450'], {});
  d.arrow(244, 100, 266, 110, { stroke: C.gray, hl: 5 }); d.arrow(396, 100, 374, 110, { stroke: C.gray, hl: 5 });
  d.text(320, 235, 'the resource is the thing; JSON is one picture of it', { cls: 'xs' });
  return d.svg();
}

export function be_api_verb_map() {
  const d = fig('be_api_verb_map', 'THE REST MAPPING FOR /orders AND /orders/{id}', 330);
  for (let i = 0; i < 5; i++) d.doc(80 + i * 6, 110 - i * 6, 90, 110, { fill: C.card });
  d.mono(150, 240, '/orders', { size: 11 });
  d.doc(440, 90, 110, 130, { fill: C.paper, stroke: C.acc }); d.mono(495, 240, '/orders/{id}', { size: 11, color: C.acc });
  [['GET', 'list · 200', 60], ['POST', 'create · 201 + Location', 290]].forEach(([m, s, y], i) => { d.mono(150, y, m, { size: 11, w: 600, color: i ? C.acc : undefined }); d.text(150, y + 16, s, { cls: 'xs' }); });
  d.travel([[150, 300], [150, 140]], { token: (dd) => dd.doc(-12, -15, 24, 30, { fill: C.accSoft, stroke: C.acc, lines: false }), at: [0, 0.6] });
  [['GET', 'read · 200 / 404'], ['PUT', 'replace · 200 / 204'], ['PATCH', 'partial · 200'], ['DELETE', 'remove · 204']].forEach(([m, s], i) => { const y = 70 + i * 50; d.mono(300, y, m, { size: 10.5, w: 600, a: 'start' }); d.text(300, y + 16, s, { cls: 'xs', a: 'start' }); d.arrow(380, y + 8, 432, 110 + i * 25, { stroke: C.gray, hl: 4 }); });
  return d.svg();
}

export function be_api_filtering() {
  const d = fig('be_api_filtering', 'ONE QUERY STRING, FOUR JOBS', 330);
  d.chips(20, 40, ['/orders?', 'status=paid', '&sort=-created_at', '&fields=id,total', '&q=biryani'], { h: 28, size: 10, fill: (i) => (i === 2 ? C.accSoft : C.card), stroke: (i) => (i === 2 ? C.acc : C.ink2) });
  for (let i = 0; i < 9; i++) d.doc(70 + (i % 3) * 22, 90 + Math.floor(i / 3) * 10, 20, 26, { fill: i % 3 === 1 ? C.card : C.paper, lines: false });
  funnel(d, 170, 95, 90, 80); d.text(215, 190, 'filter', { cls: 'xs' });
  [0, 1, 2].forEach((i) => d.rect(290, 150 - i * 22, 40 + i * 14, 16, { r: 2, fill: i === 2 ? C.accSoft : C.card, stroke: i === 2 ? C.acc : C.ink2 }));
  d.text(320, 190, 'sort, newest first', { cls: 'xs', color: C.acc });
  d.doc(400, 100, 60, 70, { fill: C.card }); d.line(470, 110, 500, 110, { stroke: C.gray, single: true }); d.doc(510, 100, 60, 40, { fill: C.paper, lines: false }); d.mono(540, 115, 'id, total', { size: 8 });
  d.text(485, 190, 'field selection', { cls: 'xs' });
  d.arrow(140, 130, 166, 130, { stroke: C.ink2, hl: 5 }); d.arrow(262, 140, 286, 140, { stroke: C.ink2, hl: 5 }); d.arrow(372, 140, 396, 140, { stroke: C.ink2, hl: 5 });
  d.text(320, 260, 'allowlist every field name; each filter or sort needs a supporting index', { cls: 'xs' });
  return d.svg();
}

export function be_page_offset() {
  const d = fig('be_page_offset', 'LIMIT 20 OFFSET 100000: THE DATABASE READS 100,020 ROWS TO RETURN 20', 300);
  for (let i = 0; i < 26; i++) d.rect(40 + i * 20, 90, 16, 60, { r: 1, fill: i >= 24 ? C.accSoft : C.paper, stroke: i >= 24 ? C.acc : C.line, sw: 0.8 });
  d.travel([[44, 80], [520, 80]], { token: (dd) => { dd.circle(0, 0, 18, { fill: C.paper, stroke: C.ink2 }); dd.line(6, 6, 12, 12, { stroke: C.ink2, sw: 2.5, single: true }); }, at: [0, 0.8] });
  d.brace(40, 520, 162, { label: '100,000 rows read and thrown away' });
  d.text(550, 170, '20 kept', { cls: 'xs', color: C.acc });
  for (let i = 0; i < 6; i++) d.doc(100 + i * 12, 205 + (i % 2) * 6, 18, 22, { fill: C.paper, lines: false });
  d.text(320, 270, 'cost grows with the page number: page 5,000 is 5,000 times the work of page 1', { cls: 'xs' });
  return d.svg();
}

export function be_page_offset_shift() {
  const d = fig('be_page_offset_shift', 'A NEW ROW ARRIVES BETWEEN PAGES: OFFSET SHOWS ONE ORDER TWICE', 310);
  const L = ['o51', 'o50', 'o49', 'o48', 'o47', 'o46'];
  d.rect(60, 60, 120, 104, { r: 6, stroke: C.ink2, dash: [5, 3] }); d.text(120, 48, 'page 1 at 20:00', { cls: 'xs' });
  ['o50', 'o49', 'o48'].forEach((s, i) => d.box(70, 68 + i * 32, 100, 26, s, { r: 4, cls: 'mono', size: 10, fill: i === 2 ? C.accSoft : C.card, stroke: i === 2 ? C.acc : C.ink2 }));
  L.forEach((s, i) => d.box(270, 50 + i * 32, 100, 26, s, { r: 4, cls: 'mono', size: 10, fill: i === 0 ? C.accSoft : i === 3 ? C.accSoft : C.card, stroke: i === 0 || i === 3 ? C.acc : C.ink2 }));
  d.text(320, 255, 'o51 arrives, the list slides down by one', { cls: 'xs', color: C.acc });
  d.rect(460, 140, 120, 104, { r: 6, stroke: C.ink2, dash: [5, 3] }); d.text(520, 128, 'page 2: offset 3', { cls: 'xs' });
  ['o48', 'o47', 'o46'].forEach((s, i) => d.box(470, 148 + i * 32, 100, 26, s, { r: 4, cls: 'mono', size: 10, fill: i === 0 ? C.accSoft : C.card, stroke: i === 0 ? C.acc : C.ink2 }));
  d.hand(130, 220, 'o48 twice', { size: 16 });
  d.text(320, 290, 'a delete between pages would skip a row instead', { cls: 'xs' });
  return d.svg();
}

export function be_page_cursor() {
  const d = fig('be_page_cursor', 'A CURSOR IS AN OPAQUE BOOKMARK: "CONTINUE AFTER THIS ROW"', 320);
  d.path('M60,80 L300,70 L300,250 L60,260 Z', { fill: C.card, stroke: C.ink2 }); d.path('M300,70 L540,80 L540,260 L300,250 Z', { fill: C.paper, stroke: C.ink2 });
  for (let i = 0; i < 8; i++) { d.line(80, 100 + i * 18, 280, 96 + i * 18, { stroke: C.line, single: true }); d.line(320, 96 + i * 18, 520, 100 + i * 18, { stroke: C.line, single: true }); }
  d.poly([[300, 60], [318, 60], [318, 200], [309, 188], [300, 200]], { fill: C.accSoft, stroke: C.acc });
  d.mono(420, 286, '"next_cursor": "eyJjcmVhdGVkX2F0Ijoi…"', { size: 9 });
  bubble(d, 360, 110, 170, 50, 'created_at 10:00:00\nid 812345', { size: 10, tx: 330, ty: 170 });
  d.text(170, 286, 'sign it if clients must not edit it', { cls: 'xs' });
  return d.svg();
}

export function be_page_keyset() {
  const d = fig('be_page_keyset', 'KEYSET PAGINATION: SEEK INTO THE INDEX, READ 20 ROWS', 320);
  d.box(270, 50, 100, 30, '(created_at, id)', { r: 4, cls: 'mono', size: 8.5, fill: C.card });
  [150, 320, 490].forEach((x, i) => { d.box(x - 50, 120, 100, 28, '', { r: 4, fill: i === 1 ? C.accSoft : C.card, stroke: i === 1 ? C.acc : C.ink2 }); d.line(320, 80, x, 120, { stroke: i === 1 ? C.acc : C.ink2, single: true }); });
  for (let i = 0; i < 12; i++) { const x = 70 + i * 42, hot = i >= 5 && i < 7; d.rect(x, 190, 36, 46, { r: 2, fill: hot ? C.accSoft : C.paper, stroke: hot ? C.acc : C.line }); }
  d.line(320, 148, 300, 186, { stroke: C.acc, single: true });
  d.travel([[320, 60], [320, 135], [300, 210]], { at: [0, 0.5] });
  d.mono(320, 266, 'WHERE (created_at, id) < (\'2026-10-06 10:00\', 812345) LIMIT 20', { size: 9 });
  d.text(320, 292, 'same cost on page 1 and page 5,000; inserts never shift the window', { cls: 'xs' });
  return d.svg();
}

export function be_page_tiebreak() {
  const d = fig('be_page_tiebreak', 'ORDER BY created_at ALONE IS NOT STABLE: ADD A UNIQUE TIEBREAKER', 290);
  [812346, 812345, 812344].forEach((id, i) => { const x = 90 + i * 160; d.doc(x, 60, 110, 130, { fill: i === 1 ? C.accSoft : C.card, stroke: i === 1 ? C.acc : C.ink2 }); d.rect(x + 14, 80, 82, 24, { r: 12, fill: C.paper, stroke: C.ink2 }); d.mono(x + 55, 92, '10:00:00', { size: 9.5 }); d.mono(x + 55, 160, `id ${id}`, { size: 10, color: i === 1 ? C.acc : undefined }); });
  d.line(370, 40, 370, 210, { stroke: C.acc, dash: [5, 4], single: true }); d.text(370, 225, 'page boundary', { cls: 'xs', color: C.acc });
  d.text(320, 262, 'three orders share a timestamp: the cursor stores (created_at, id), and the index covers both', { cls: 'xs' });
  return d.svg();
}

export function be_api_bulk() {
  const d = fig('be_api_bulk', 'A BULK REQUEST NEEDS A RESULT PER ITEM', 310);
  d.rect(30, 110, 150, 70, { r: 4, fill: C.card, stroke: C.ink2 }); [0, 1, 2].forEach((i) => d.envelope(42 + i * 44, 126, 36, 26, { label: ['17', '18', '19'][i] }));
  d.text(105, 200, 'POST /menu-items/batch', { cls: 'mono', size: 9 });
  d.server(280, 90, 80, 110, { label: 'API' });
  d.arrow(184, 145, 274, 145, { stroke: C.ink2, hl: 6 });
  [['17', '200', 0], ['18', '409 stale version', 1], ['19', '204', 0]].forEach(([id, s, bad], i) => { const y = 80 + i * 50; d.doc(430, y, 40, 40, { fill: bad ? C.accSoft : C.paper, stroke: bad ? C.acc : C.ink2, lines: false }); d.mono(450, y + 20, id, { size: 9 }); (bad ? cross : tick)(d, 490, y + 20, 7, bad ? C.acc : C.ink2); d.mono(505, y + 20, s, { size: 9, a: 'start', color: bad ? C.acc : undefined }); });
  d.arrow(364, 145, 424, 145, { stroke: C.ink2, hl: 6 });
  d.text(320, 270, 'decide up front: all-or-nothing in one transaction, or independent items with partial success', { cls: 'xs' });
  return d.svg();
}

export function be_api_partial() {
  const d = fig('be_api_partial', 'MERGE PATCH: null DELETES, ABSENT KEEPS, VALUE REPLACES', 300);
  d.doc(40, 60, 160, 150, { fill: C.card, lines: false }); ['note: "no onions"', 'tip: 20', 'gate: "B"'].forEach((s, i) => d.mono(52, 92 + i * 30, s, { a: 'start', size: 10 }));
  d.text(120, 228, 'stored', { cls: 'xs' });
  sticky(d, 240, 90, 130, 70, ['tip: 30', 'gate: null']); d.text(305, 228, 'PATCH body', { cls: 'xs' });
  d.arrow(210, 130, 236, 130, { stroke: C.gray, hl: 5 }); d.arrow(376, 130, 410, 130, { stroke: C.gray, hl: 5 });
  d.doc(420, 60, 160, 150, { fill: C.paper, stroke: C.acc, lines: false }); d.mono(432, 92, 'note: "no onions"', { a: 'start', size: 10 }); d.mono(432, 122, 'tip: 30', { a: 'start', size: 10, color: C.acc }); d.mono(432, 152, 'gate', { a: 'start', size: 10, color: C.gray }); d.line(430, 152, 470, 152, { stroke: C.acc, single: true });
  d.text(500, 228, 'result', { cls: 'xs' });
  d.text(320, 270, 'Content-Type: application/merge-patch+json (RFC 7396)', { cls: 'xs' });
  return d.svg();
}

export function be_api_versioning() {
  const d = fig('be_api_versioning', 'THREE PLACES TO PUT A VERSION', 300);
  [['URL', 'visible, cacheable, easy to route'], ['header', 'clean URLs, date versions (Stripe)'], ['media type', 'precise, hard to test in a browser']].forEach(([t, s], i) => {
    const x = 30 + i * 205;
    d.envelope(x, 70, 170, 110, {});
    if (i === 0) { d.rect(x + 20, 140, 130, 24, { r: 3, fill: C.accSoft, stroke: C.acc }); d.mono(x + 85, 152, 'GET /v2/orders', { size: 9.5, color: C.acc }); }
    if (i === 1) { d.rect(x + 120, 80, 40, 44, { r: 2, fill: C.accSoft, stroke: C.acc }); d.mono(x + 140, 102, '2026\n10-01', { size: 8, vc: true }); d.mono(x + 70, 152, 'Api-Version', { size: 9 }); }
    if (i === 2) { d.rect(x + 14, 136, 142, 34, { r: 3, fill: C.accSoft, stroke: C.acc }); d.mono(x + 85, 153, 'vnd.wren.v2+json', { size: 9, color: C.acc }); }
    d.text(x + 85, 206, t, { cls: 'ttl' }); d.text(x + 85, 228, s, { cls: 'xs' });
  });
  return d.svg();
}

export function be_api_compat() {
  const d = fig('be_api_compat', 'COMPATIBLE CHANGES VERSUS BREAKING CHANGES', 320);
  panel(d, 20, 40, 290, 250, 'safe to ship', true);
  d.phone(50, 80, 90, { label: 'app v4.2' }); d.doc(160, 80, 120, 120, { lines: false, fill: C.card });
  ['id', 'total', 'status'].forEach((s, i) => d.mono(172, 100 + i * 20, s, { a: 'start', size: 9.5 })); d.mono(172, 160, '+ eta', { a: 'start', size: 9.5, color: C.acc });
  tick(d, 95, 220, 10); d.text(165, 260, 'add fields, endpoints, optional inputs', { cls: 'xs' });
  panel(d, 330, 40, 290, 250, 'breaking');
  d.phone(360, 80, 90, { label: 'app v4.2' }); d.doc(470, 80, 120, 120, { lines: false, fill: C.card });
  d.mono(482, 100, 'id', { a: 'start', size: 9.5 }); d.mono(482, 120, 'total', { a: 'start', size: 9.5 }); d.line(480, 120, 530, 120, { stroke: C.acc, single: true }); d.mono(482, 140, 'amount', { a: 'start', size: 9.5 });
  cross(d, 405, 220, 10); d.text(475, 260, 'rename, remove, retype, make required', { cls: 'xs' });
  return d.svg();
}

export function be_api_deprecation() {
  const d = fig('be_api_deprecation', 'DEPRECATING v1: ANNOUNCE, SIGNAL, MEASURE, THEN TURN OFF', 310);
  const X = (m) => 70 + m * 80;
  [100, 92, 70, 40, 18, 6, 0].forEach((v, m) => { d.rect(X(m) - 14, 210 - v * 1.2, 28, v * 1.2, { r: 2, fill: C.card, stroke: C.ink2 }); });
  d.text(60, 90, 'v1 traffic', { cls: 'xs', a: 'start' });
  d.line(40, 210, 600, 210, { stroke: C.ink2, single: true });
  [['v2 ships', 0], ['Deprecation header', 1], ['email top callers', 3], ['Sunset', 6]].forEach(([s, m], i) => { d.mono(X(m), 228, `month ${m}`, { size: 8.5 }); d.text(X(m), 248, s, { cls: 'xs', color: i === 3 ? C.acc : undefined }); });
  d.path(`M${X(6) - 30},210 A30,30 0 0 1 ${X(6) + 30},210`, { stroke: C.acc, fill: C.accSoft, single: true });
  [0, 1, 2, 3, 4].forEach((k) => { const a = Math.PI + k * Math.PI / 4; d.line(X(6) + Math.cos(a) * 38, 210 + Math.sin(a) * 38, X(6) + Math.cos(a) * 48, 210 + Math.sin(a) * 48, { stroke: C.acc, single: true }); });
  d.text(320, 285, 'Deprecation and Sunset headers (RFC 9745, RFC 8594) tell clients in-band', { cls: 'xs' });
  return d.svg();
}

export function be_idem_store() {
  const d = fig('be_idem_store', 'THE IDEMPOTENCY TABLE: ONE ROW PER CLIENT OPERATION', 320);
  d.phone(20, 80, 80); d.envelope(70, 70, 40, 26, { label: '7f3a' }); d.envelope(70, 130, 40, 26, { label: '7f3a' });
  d.arrow(114, 100, 160, 150, { stroke: C.ink2, hl: 5 }); d.arrow(114, 150, 160, 160, { stroke: C.acc, hl: 5, dash: [4, 3] }); d.text(130, 190, 'retry', { cls: 'xs', color: C.acc });
  d.db(170, 120, 70, 80, {});
  d.grid(260, 70, 3, 5, 72, 32, { val: (r, c) => [['key', 'user', 'fingerpr.', 'status', 'response'], ['7f3a', '42', 'sha256', 'done', '201 pay_88'], ['91c0', '42', 'sha256', 'running', '']][r][c], cellFill: (r) => (r === 0 ? C.card : r === 1 ? C.accFaint : null), vsize: 9 });
  d.text(440, 200, 'primary key (user, key), written in the payment\'s transaction', { cls: 'xs' });
  d.text(440, 222, 'same key, new fingerprint → 422 · still running → 409', { cls: 'xs' });
  d.text(440, 244, 'done → replay the stored 201', { cls: 'xs', color: C.acc });
  return d.svg();
}

export function be_idem_concurrent() {
  const d = fig('be_idem_concurrent', 'TWO COPIES ARRIVE TOGETHER: THE UNIQUE INSERT PICKS ONE WINNER', 310);
  d.db(270, 110, 100, 100, { label: 'UNIQUE\n(user, key)', size: 9 });
  d.envelope(60, 80, 50, 32, { label: 'copy A' }); d.envelope(530, 80, 50, 32, { label: 'copy B' });
  d.travel([[110, 96], [265, 150]], { token: 'packet', at: [0, 0.45] }); d.travel([[530, 96], [375, 150]], { token: 'packet', at: [0.05, 0.5], fill: C.card, color: C.ink2 });
  d.lock(312, 70, 18, { stroke: C.acc });
  tick(d, 150, 200, 9); d.text(150, 226, 'A inserts "running" → charges', { cls: 'xs', color: C.acc }); d.text(150, 244, 'then UPDATE done + response', { cls: 'xs' });
  cross(d, 490, 200, 9, C.ink2); d.text(490, 226, 'B hits unique violation → 409', { cls: 'xs' }); d.text(490, 244, 'retries later, gets A\'s response', { cls: 'xs' });
  return d.svg();
}

export function be_idem_size() {
  const d = fig('be_idem_size', '24-HOUR RETENTION AT 50 PAYMENTS PER SECOND', 250);
  hourglass(d, 70, 60, 110, { level: 0.6, label: '24 h' });
  hbars(d, [['keys held', 4320000, '4,320,000 rows'], ['bytes at 300 B/row', 1296000000, '1,296,000,000 B', true]], { y: 70, gap: 50, w: 220, x: 280 });
  d.text(340, 210, 'partition by day or TTL; expiry outlasts the longest client retry window', { cls: 'xs' });
  return d.svg();
}

export function be_rpc_vs_rest() {
  const d = fig('be_rpc_vs_rest', 'RPC NAMES ACTIONS; REST NAMES RESOURCES', 310);
  d.rect(60, 50, 160, 220, { r: 14, fill: C.card, stroke: C.ink2 }); d.text(140, 70, 'RPC: a remote with buttons', { cls: 'xs' });
  ['createOrder', 'cancelOrder', 'chargeCard', 'getOrderStatus'].forEach((s, i) => d.box(78, 88 + i * 42, 124, 30, s, { r: 15, cls: 'mono', size: 9, fill: i === 1 ? C.accSoft : C.paper, stroke: i === 1 ? C.acc : C.ink2 }));
  d.rect(360, 60, 220, 200, { r: 4, fill: C.paper, stroke: C.ink2 }); d.text(470, 46, 'REST: shelves of things, standard verbs', { cls: 'xs' });
  [['/orders', 0], ['/orders/123/cancellation', 1], ['/payments', 2]].forEach(([s, i]) => drawer(d, 370, 70 + i * 62, 200, 54, s, { size: 9, hot: i === 1 }));
  d.text(320, 290, 'REST lets caches, proxies and tools understand every call', { cls: 'xs' });
  return d.svg();
}

export function be_gql_query() {
  const d = fig('be_gql_query', 'GRAPHQL: THE QUERY\'S SHAPE IS THE RESPONSE\'S SHAPE', 320);
  tree(d, [[150, 70, 'order(123)'], [60, 140, 'total'], [150, 140, 'restaurant'], [250, 140, 'items'], [150, 200, 'name'], [250, 200, 'name, qty']], [[0, 1], [0, 2], [0, 3], [2, 4], [3, 5]], { w: 40, size: 8.5 });
  tree(d, [[480, 70, 'order', true], [390, 140, '450', true], [480, 140, 'restaurant', true], [580, 140, 'items[1]', true], [480, 200, '"Spice"', true], [580, 200, 'biryani ×1', true]], [[0, 1], [0, 2], [0, 3], [2, 4], [3, 5]], { w: 40, size: 8.5 });
  d.arrow(300, 140, 340, 140, { stroke: C.acc, hl: 6 });
  d.text(150, 245, 'query', { cls: 'ttl' }); d.text(480, 245, 'response', { cls: 'ttl', color: C.acc });
  d.text(320, 290, 'one POST /graphql; the client picks fields, so no over- or under-fetching', { cls: 'xs' });
  return d.svg();
}

export function be_gql_resolvers() {
  const d = fig('be_gql_resolvers', 'EACH FIELD HAS A RESOLVER; THE ENGINE WALKS THE TREE', 320);
  tree(d, [[320, 60, 'Query.order', true], [130, 140, 'Order.total'], [320, 140, 'Order.restaurant'], [510, 140, 'Order.items']], [[0, 1], [0, 2], [0, 3]], { w: 64, size: 9 });
  [130, 320, 510].forEach((x, i) => d.person(x - 40, 160, 22, { stroke: i ? C.ink2 : C.gray }));
  d.text(130, 210, 'field on the parent', { cls: 'xs' });
  [320, 510].forEach((x) => { d.db(x - 25, 200, 50, 44, {}); d.arrow(x, 154, x, 196, { stroke: C.acc, hl: 5 }); });
  d.text(320, 280, 'each resolver is simple, which is how resolvers quietly multiply database queries', { cls: 'xs' });
  return d.svg();
}

export function be_gql_n_plus_1() {
  const d = fig('be_gql_n_plus_1', 'N+1: 20 ORDERS WITH RESTAURANT AND 5 ITEMS EACH', 300);
  d.server(40, 70, 70, 90, {}); d.db(250, 80, 80, 80, {});
  for (let i = 0; i < 24; i++) d.line(114, 80 + i * 3.4, 246, 92 + (i * 7) % 60, { stroke: C.acc, single: true, sw: 0.6, op: 0.7 });
  d.text(180, 185, '1 + 20 + 100 = 121 queries', { cls: 'mono', size: 9.5, color: C.acc });
  d.server(370, 70, 70, 90, {}); d.db(560, 80, 60, 80, {});
  [0, 1, 2].forEach((i) => d.arrow(444, 95 + i * 25, 554, 100 + i * 20, { stroke: C.ink2, hl: 5 }));
  d.text(500, 185, 'with DataLoader: 3 queries', { cls: 'mono', size: 9.5 });
  d.text(320, 250, 'one list query, then one batched query per relation', { cls: 'xs' });
  return d.svg();
}

export function be_gql_dataloader() {
  const d = fig('be_gql_dataloader', 'DATALOADER COLLECTS KEYS FOR ONE TICK, THEN ISSUES ONE BATCHED QUERY', 300);
  [9, 10, 9, 11, 10, 9].forEach((k, i) => { d.person(40 + i * 34, 80, 24, { stroke: k === 9 ? C.acc : C.ink2 }); d.mono(40 + i * 34, 120, `${k}`, { size: 9 }); });
  signpost(d, 270, 90, 'tick', { pole: 40 });
  const bus = (dd) => { dd.rect(-60, -22, 120, 40, { r: 8, fill: C.accSoft, stroke: C.acc }); dd.mono(0, -2, '{9, 10, 11}', { size: 9.5 }); dd.circle(-36, 20, 14, { fill: C.paper, stroke: C.ink2 }); dd.circle(36, 20, 14, { fill: C.paper, stroke: C.ink2 }); };
  d.travel([[330, 180], [480, 180]], { token: bus, at: [0.1, 0.8] });
  d.line(260, 202, 600, 202, { stroke: C.ink2, single: true });
  d.db(540, 130, 70, 60, {});
  d.mono(420, 236, 'WHERE id IN (9, 10, 11)', { size: 10 });
  d.text(320, 276, 'also a per-request cache: restaurant 9 is fetched once though asked for three times', { cls: 'xs' });
  return d.svg();
}

export function be_gql_complexity() {
  const d = fig('be_gql_complexity', 'QUERY COST: orders(first:50) { items(first:20) } TOUCHES 1,050 NODES', 310);
  d.dot(60, 150, 5, C.ink);
  for (let i = 0; i < 25; i++) { const y = 54 + i * 8; d.line(60, 150, 200, y, { stroke: C.ink2, single: true, sw: 0.5 }); for (let k = 0; k < 8; k++) d.line(200, y, 360, y - 3 + k, { stroke: C.acc, single: true, sw: 0.25, op: 0.6 }); }
  d.text(200, 270, '50 orders', { cls: 'xs' }); d.text(360, 270, '1,000 items', { cls: 'xs', color: C.acc });
  gauge(d, 500, 170, 70, 1.05, { red: 0.8, hot: true, label: 'cost 1,050 vs budget 1,000', value: 'reject' });
  d.text(320, 296, 'check cost and depth before executing; rate-limit by cost, not by request', { cls: 'xs' });
  return d.svg();
}

export function be_gql_persisted() {
  const d = fig('be_gql_persisted', 'PERSISTED QUERIES: CLIENTS SEND A HASH, THE SERVER RUNS ONLY KNOWN QUERIES', 280);
  card(d, 20, 60, 260, ['POST /graphql', '{"id":"sha256:8c1f...",', ' "variables":{"id":123}}'], { hot: [1], size: 9.5 });
  d.db(330, 60, 110, 90, { label: 'allowlist' }); d.mono(385, 170, '8c1f -> query {...}', { size: 9.5 });
  d.arrow(284, 100, 324, 100, { stroke: C.acc });
  d.text(530, 100, 'unknown hash -> rejected', { cls: 'sm', color: C.acc });
  d.text(320, 240, 'smaller requests, GET-cacheable, and no arbitrary queries from attackers', { cls: 'xs' });
  return d.svg();
}

export function be_grpc_proto() {
  const d = fig('be_grpc_proto', 'A gRPC SERVICE IS DEFINED IN A .proto FILE', 320);
  card(d, 20, 50, 330, ['service Orders {', '  rpc GetOrder(GetOrderRequest) returns (Order);', '  rpc WatchOrder(GetOrderRequest)', '      returns (stream OrderEvent);', '}', 'message Order {', '  int64 id = 1;  int64 total_paise = 2;', '  string status = 3; }'], { bold: false, size: 9, hot: [6] });
  d.gear(410, 130, 30, { spin: 6 }); d.text(410, 176, 'protoc', { cls: 'mono', size: 9 });
  d.arrow(352, 130, 376, 130, { stroke: C.gray, hl: 5 });
  d.server(490, 60, 70, 70, { label: 'server stub' }); d.phone(500, 170, 80, { label: 'typed client' });
  d.arrow(444, 120, 486, 95, { stroke: C.ink2, hl: 5 }); d.arrow(444, 140, 494, 200, { stroke: C.ink2, hl: 5 });
  d.text(185, 280, 'field numbers, not names, go on the wire', { cls: 'xs', color: C.acc });
  return d.svg();
}

export function be_grpc_streams() {
  const d = fig('be_grpc_streams', 'FOUR KINDS OF gRPC CALL', 340);
  [['unary', 1, 1], ['server streaming', 1, 3], ['client streaming', 3, 1], ['bidirectional', 3, 3]].forEach(([t, a, b], i) => {
    const y = 60 + i * 62;
    d.text(110, y + 16, t, { cls: 'sm', a: 'end', color: i === 1 ? C.acc : undefined });
    d.phone(124, y - 2, 40); d.server(540, y, 40, 36, {});
    pipe(d, 150, 536, y + 8, 10); pipe(d, 150, 536, y + 26, 10, i === 1);
    for (let k = 0; k < a; k++) d.travel([[156, y + 8], [530, y + 8]], { at: [k * 0.25, k * 0.25 + 0.35], r: 3, color: C.ink2 });
    for (let k = 0; k < b; k++) d.travel([[530, y + 26], [156, y + 26]], { at: [0.3 + k * 0.2, 0.6 + k * 0.2], r: 3 });
  });
  d.text(320, 316, 'all multiplexed as HTTP/2 streams; flow control applies per stream', { cls: 'xs' });
  return d.svg();
}

export function be_grpc_varint() {
  const d = fig('be_grpc_varint', 'PROTOBUF ON THE WIRE: id = 123 IS 2 BYTES; IN JSON IT IS 10', 300);
  d.tape(60, 70, ['08', '7B'], { cw: 50, h: 34, hot: (i) => i === 1, size: 13 });
  d.text(85, 120, 'field 1,\nvarint', { cls: 'xs', vc: true }); d.text(135, 120, '123', { cls: 'xs' });
  d.tape(300, 70, '{"id":123}'.split(''), { cw: 28, h: 34, size: 12 }); d.text(440, 120, '10 bytes', { cls: 'xs' });
  d.tape(60, 170, ['1', '0', '1', '0', '1', '1', '0', '0'], { cw: 22, h: 26, hot: (i) => i === 0, size: 10 }); d.tape(250, 170, ['0', '0', '0', '0', '0', '0', '1', '0'], { cw: 22, h: 26, size: 10 });
  d.mono(148, 212, 'AC', { size: 10 }); d.mono(338, 212, '02', { size: 10 });
  d.text(500, 183, '300 = 0101100 + 0000010', { cls: 'mono', size: 9 }); d.text(500, 203, 'high bit 1 = more bytes', { cls: 'xs', color: C.acc });
  d.text(320, 260, 'compact and fast, but unreadable without the schema', { cls: 'xs' });
  return d.svg();
}

export function be_grpc_deadline() {
  const d = fig('be_grpc_deadline', 'DEADLINE PROPAGATION: EACH HOP GETS WHAT IS LEFT OF 300 MS', 270);
  const s = [['gateway', 300, 50], ['orders', 250, 100], ['payments', 150, 0]];
  s.forEach(([n, budget, used], i) => { const x = 40 + i * 200; d.server(x, 80, 70, 80, { label: n }); d.mono(x + 35, 190, `budget ${budget} ms`, { size: 10, color: i === 2 ? C.acc : undefined }); if (used) d.mono(x + 35, 208, `spends ${used} ms`, { size: 9 }); if (i < 2) d.arrow(x + 76, 120, x + 194, 120, { stroke: C.gray }); });
  d.text(320, 250, 'payments sees 150 ms left and refuses to start work it cannot finish', { cls: 'xs' });
  return d.svg();
}

export function be_grpc_interceptors() {
  const d = fig('be_grpc_interceptors', 'INTERCEPTORS WRAP EVERY CALL, LIKE HTTP MIDDLEWARE', 320);
  [['retry', 230], ['tracing', 180], ['deadline', 130], ['auth', 80]].reverse().forEach(([s, r], i) => { d.circle(380, 160, r, { fill: i === 0 ? C.paper : C.card, stroke: C.ink2 }); });
  [['auth', 80], ['deadline', 130], ['tracing', 180], ['retry', 230]].forEach(([s, r]) => d.text(380 - r / 2 + 14, 160, s, { cls: 'xs', a: 'start' }));
  d.circle(380, 160, 44, { fill: C.accSoft, stroke: C.acc }); d.mono(380, 160, 'GetOrder', { size: 9, color: C.acc });
  d.travel([[40, 160], [370, 160]], { token: 'packet', at: [0, 0.6] });
  d.text(140, 140, 'metadata: authorization,', { cls: 'xs' }); d.text(140, 156, 'trace id, request id', { cls: 'xs' });
  return d.svg();
}

export function be_api_choose() {
  const d = fig('be_api_choose', 'REST, GRAPHQL OR gRPC: WHERE EACH FITS', 320);
  [['REST', 'public APIs, HTTP caching, browsers', 110], ['GraphQL', 'many client shapes, one round trip', 320], ['gRPC', 'service to service, streaming', 530]].forEach(([s, t, x], i) => { signpost(d, x, 90, s, { hot: i === 0, pole: 50, w: 100 }); d.text(x, 170, t, { cls: 'xs' }); });
  browser(d, 50, 200, 120, 70, 'api.wren.example'); d.phone(270, 195, 70); d.laptop(330, 205, 70);
  d.server(490, 200, 34, 60, {}); d.server(560, 200, 34, 60, {}); d.arrow(526, 230, 556, 230, { stroke: C.acc, hl: 4, both: true });
  return d.svg();
}

export function be_openapi() {
  const d = fig('be_openapi', 'ONE OPENAPI DOCUMENT FEEDS DOCS, CLIENTS, VALIDATION AND MOCKS', 320);
  d.doc(240, 100, 140, 160, { fill: C.accFaint, stroke: C.acc }); d.mono(310, 92, 'openapi.yaml', { size: 9.5, color: C.acc });
  d.path('M60,70 L120,64 L120,140 L60,146 Z', { fill: C.card, stroke: C.ink2 }); d.path('M120,64 L180,70 L180,146 L120,140 Z', { fill: C.paper, stroke: C.ink2 }); d.text(120, 162, 'reference docs', { cls: 'xs' });
  d.phone(90, 190, 70); d.text(150, 280, 'generated clients', { cls: 'xs' });
  shield(d, 500, 60, 70, { label: 'validate', fill: C.accSoft, stroke: C.acc }); d.text(500, 150, 'request validation', { cls: 'xs' });
  d.server(470, 190, 60, 70, { stroke: C.gray, fill: C.paper }); d.text(500, 280, 'mock server', { cls: 'xs' });
  [[236, 140, 186, 110], [236, 220, 160, 225], [384, 140, 460, 100], [384, 220, 466, 225]].forEach(([a, b, c, e]) => d.arrow(a, b, c, e, { stroke: C.gray, hl: 5 }));
  return d.svg();
}

export function be_contract_flow() {
  const d = fig('be_contract_flow', 'SCHEMA-FIRST: THE CONTRACT IS THE SOURCE, CODE IS GENERATED FROM IT', 300);
  d.line(30, 170, 610, 170, { stroke: C.ink2, sw: 2, single: true }); [60, 180, 300, 420, 540].forEach((x) => d.circle(x, 178, 14, { fill: C.paper, stroke: C.ink2 }));
  [['edit schema', 60], ['lint + diff', 180], ['generate', 300], ['implement', 420], ['publish', 540]].forEach(([s, x], i) => { if (i === 1) { shield(d, x, 70, 60, { label: 'breaking?', fill: C.accSoft, stroke: C.acc, size: 8.5 }); } else if (i === 2) d.gear(x, 100, 26, { spin: 5 }); else d.doc(x - 22, 70, 44, 56, { fill: C.card }); d.text(x, 212, s, { cls: 'xs', color: i === 1 ? C.acc : undefined }); });
  d.travel([[20, 156], [610, 156]], { token: (dd) => dd.doc(-10, -14, 20, 26, { fill: C.accSoft, stroke: C.acc, lines: false }) });
  d.text(320, 260, 'a breaking-change check on the schema diff blocks the merge, not the outage', { cls: 'xs' });
  return d.svg();
}

export function be_contract_tests() {
  const d = fig('be_contract_tests', 'CONSUMER-DRIVEN CONTRACTS: CONSUMERS WRITE EXPECTATIONS, THE PROVIDER VERIFIES THEM', 300);
  d.phone(40, 70, 90); d.text(64, 180, 'mobile app', { cls: 'xs' });
  d.laptop(30, 200, 80, { label: 'web app' });
  d.doc(230, 90, 110, 120, { fill: C.accSoft, stroke: C.acc }); d.text(285, 225, 'contracts\n(broker)', { cls: 'xs', vc: true });
  d.arrow(110, 120, 224, 130, { stroke: C.gray }); d.arrow(116, 230, 224, 180, { stroke: C.gray });
  d.server(480, 90, 90, 110, { label: 'orders API CI' });
  d.arrow(346, 150, 472, 150, { stroke: C.acc }); d.text(410, 138, 'replay', { cls: 'xs' });
  d.text(320, 285, 'the provider learns which fields real consumers use before removing one', { cls: 'xs' });
  return d.svg();
}

export function be_arch_layers() {
  const d = fig('be_arch_layers', 'THE CLASSIC LAYERS AND THE ONE JOB OF EACH', 370);
  d.poly([[90, 50], [330, 20], [570, 50]], { fill: C.paper, stroke: C.ink2 });
  const L = [['router', 'URL + method → handler'], ['middleware', 'auth, limits, logging, errors'], ['controller', 'HTTP in, DTO, HTTP out'], ['service', 'business rules, transactions'], ['repository', 'queries, no business logic']];
  L.forEach(([a, b], i) => floor(d, 90, 50 + i * 50, 480, 50, a, b, i === 3));
  d.db(280, 310, 100, 50, { label: 'database', size: 9.5 });
  d.rect(60, 50, 24, 250, { r: 2, fill: C.paper, stroke: C.ink2 });
  d.travel([[72, 60], [72, 290]], { token: (dd) => dd.rect(-9, -10, 18, 20, { r: 2, fill: C.accSoft, stroke: C.acc }) });
  d.text(330, 362, 'the service knows nothing about HTTP; the controller nothing about SQL', { cls: 'xs' });
  return d.svg();
}

export function be_arch_di() {
  const d = fig('be_arch_di', 'DEPENDENCY INJECTION: THE SERVICE RECEIVES ITS COLLABORATORS', 300);
  d.rect(250, 60, 140, 170, { r: 8, fill: C.accSoft, stroke: C.acc }); d.text(320, 80, 'OrderService', { cls: 'ttl', color: C.acc });
  ['repo', 'payments', 'clock'].forEach((s, i) => { socket(d, 255, 100 + i * 42); socket(d, 355, 100 + i * 42); d.text(320, 117 + i * 42, s, { cls: 'xs' }); });
  ['PostgresOrderRepo', 'StripePayments', 'SystemClock'].forEach((s, i) => plug(d, 140, 100 + i * 42, s));
  d.text(110, 245, 'production wiring', { cls: 'xs' });
  ['InMemoryRepo', 'FakePayments', 'FixedClock'].forEach((s, i) => { const y = 100 + i * 42; d.rect(410, y, 90, 34, { r: 6, fill: C.paper, stroke: C.gray, dash: [3, 3] }); d.line(396, y + 11, 410, y + 11, { stroke: C.gray, sw: 2.4, single: true }); d.line(396, y + 23, 410, y + 23, { stroke: C.gray, sw: 2.4, single: true }); d.text(455, y + 17, s, { cls: 'mono', size: 8.5, vc: true }); });
  d.text(455, 245, 'test wiring', { cls: 'xs' });
  return d.svg();
}

export function be_arch_dto_model() {
  const d = fig('be_arch_dto_model', 'THREE SHAPES OF ONE ORDER, EACH OWNED BY A DIFFERENT LAYER', 310);
  d.doc(30, 60, 150, 150, { fill: C.paper, lines: false }); ['CreateOrderRequest', 'restaurant_id', 'items[]', 'note'].forEach((s, i) => d.mono(40, 82 + i * 22, s, { a: 'start', size: 9 }));
  d.text(105, 228, 'DTO in (form)', { cls: 'xs' });
  d.rect(240, 60, 160, 150, { r: 8, fill: C.card, stroke: C.ink2 }); ['Order', 'id, user_id, items, total', 'status, version', 'fraud_score', 'place(), cancel()'].forEach((s, i) => d.mono(252, 82 + i * 24, s, { a: 'start', size: 9, color: i === 3 ? C.acc : undefined }));
  d.text(320, 228, 'domain model', { cls: 'xs' });
  d.rect(440, 150, 80, 40, { r: 3, fill: C.paper, stroke: C.ink2 }); for (let i = 0; i < 6; i++) d.line(450 + i * 12, 190, 450 + i * 12, 220, { stroke: C.gray, single: true }); d.text(480, 240, 'version, fraud_score', { cls: 'xs', color: C.acc });
  d.doc(470, 50, 130, 90, { fill: C.paper, lines: false }); ['OrderResponse', 'id, status', 'total, eta'].forEach((s, i) => d.mono(480, 70 + i * 20, s, { a: 'start', size: 9 }));
  d.arrow(184, 130, 236, 130, { stroke: C.gray, hl: 5 }); d.arrow(404, 110, 466, 95, { stroke: C.gray, hl: 5 }); d.arrow(404, 150, 436, 165, { stroke: C.acc, hl: 5, dash: [3, 3] });
  d.text(320, 285, 'internal fields never reach the response by accident', { cls: 'xs' });
  return d.svg();
}

export function be_arch_modular() {
  const d = fig('be_arch_modular', 'A MODULAR MONOLITH: ONE DEPLOYABLE, ENFORCED BOUNDARIES INSIDE', 320);
  d.poly([[20, 70], [320, 30], [620, 70]], { fill: C.paper, stroke: C.ink2 }); d.text(320, 58, 'wren-api, one process', { cls: 'ttl' });
  d.rect(20, 70, 600, 210, { r: 0, fill: C.paper, stroke: C.ink2 });
  [['orders', 40], ['payments', 240], ['menus', 440]].forEach(([s, x], i) => {
    d.rect(x, 90, 160, 170, { r: 2, fill: i === 0 ? C.accFaint : C.card, stroke: i === 0 ? C.acc : C.ink2 });
    d.text(x + 80, 110, s, { cls: 'ttl' }); d.db(x + 50, 180, 60, 60, {}); d.text(x + 80, 254, 'own tables', { cls: 'xs' });
    d.rect(x + 150, 130, 14, 40, { r: 1, fill: C.accSoft, stroke: C.acc });
  });
  d.arrow(206, 150, 236, 150, { stroke: C.acc, hl: 5 }); d.arrow(406, 150, 436, 150, { stroke: C.acc, hl: 5 });
  d.text(320, 304, 'doors are public APIs; nobody walks into another module\'s tables', { cls: 'xs' });
  return d.svg();
}

export function be_arch_hexagonal() {
  const d = fig('be_arch_hexagonal', 'PORTS AND ADAPTERS: THE CORE DEFINES INTERFACES, ADAPTERS PLUG IN', 340);
  const hx = (cx, cy, r) => Array.from({ length: 6 }, (_, i) => [cx + r * Math.cos(Math.PI / 3 * i), cy + r * Math.sin(Math.PI / 3 * i)]);
  d.poly(hx(320, 170, 120), { fill: C.card, stroke: C.ink2 });
  d.poly(hx(320, 170, 60), { fill: C.accSoft, stroke: C.acc }); d.text(320, 170, 'domain\ncore', { cls: 'ttl', vc: true, color: C.acc });
  d.phone(40, 60, 60); d.text(110, 86, 'HTTP', { cls: 'xs', a: 'start' }); d.server(40, 220, 40, 50, {}); d.text(92, 246, 'gRPC', { cls: 'xs', a: 'start' });
  d.db(540, 60, 60, 60, {}); d.text(530, 90, 'Postgres', { cls: 'xs', a: 'end' });
  d.rect(540, 230, 66, 40, { r: 5, fill: C.card, stroke: C.ink2 }); d.line(540, 242, 606, 242, { stroke: C.ink2, sw: 3, single: true }); d.text(530, 250, 'Stripe', { cls: 'xs', a: 'end' });
  [[100, 100, 222, 140], [84, 240, 222, 205], [418, 140, 536, 95], [418, 205, 536, 245]].forEach(([a, b, c, e], i) => d.arrow(a, b, c, e, { stroke: i < 2 ? C.ink2 : C.gray, hl: 5, dash: i < 2 ? undefined : [4, 3] }));
  d.text(320, 320, 'driving adapters call in; driven adapters implement the core\'s ports', { cls: 'xs' });
  return d.svg();
}

export function be_arch_dependency_rule() {
  const d = fig('be_arch_dependency_rule', 'THE DEPENDENCY RULE: SOURCE CODE DEPENDENCIES POINT INWARD', 320);
  [[250, 'frameworks, DB, web'], [180, 'adapters'], [110, 'use cases'], [50, 'entities']].forEach(([r, s], i) => { d.circle(320, 160, r * 2 * 0.55, { fill: i === 3 ? C.accSoft : i === 2 ? C.accFaint : C.paper, stroke: i >= 2 ? C.acc : C.ink2 }); d.text(320, 160 - r * 0.55 + 14, s, { cls: 'xs' }); });
  d.db(100, 130, 50, 50, {}); browser(d, 470, 140, 90, 50, 'web');
  d.flowline([[150, 160], [290, 160]], { gap: 6 }); d.flowline([[470, 170], [350, 165]], { gap: 6 });
  d.text(320, 300, 'the core never imports the ORM; the ORM adapter imports the core', { cls: 'xs' });
  return d.svg();
}

export function be_err_categories() {
  const d = fig('be_err_categories', 'ERROR CATEGORIES AND WHAT EACH DESERVES', 340);
  const T = [['422 validation', 0], ['401 authentication', 0], ['403 / 404 authz', 0], ['409 conflict', 1], ['502 / 503 dependency', 1], ['504 timeout', 1], ['500 bug', 2]];
  T.forEach(([s, b], i) => { const x = 30 + i * 84; d.rect(x, 50, 76, 34, { r: 3, fill: b === 2 ? C.accSoft : C.card, stroke: b === 2 ? C.acc : C.ink2 }); d.text(x + 38, 67, s, { cls: 'xs', vc: true, size: 9 }); d.arrow(x + 38, 88, [110, 320, 530][b], 170, { stroke: C.line, hl: 4 }); });
  [['fix the request', 'no retry', 110], ['try again later', 'backoff; 409 after re-read', 320], ['page someone', '500 + alert, no retry', 530]].forEach(([a, s, x], i) => { d.path(`M${x - 80},180 L${x + 80},180 L${x + 66},250 L${x - 66},250 Z`, { fill: i === 2 ? C.accFaint : C.paper, stroke: i === 2 ? C.acc : C.ink2 }); d.text(x, 205, a, { cls: 'ttl', color: i === 2 ? C.acc : undefined }); d.text(x, 228, s, { cls: 'xs' }); });
  d.text(320, 300, 'the category decides the status, the body and whether anyone is woken', { cls: 'xs' });
  return d.svg();
}

export function be_err_problem() {
  const d = fig('be_err_problem', 'A STRUCTURED ERROR BODY (RFC 9457 PROBLEM DETAILS)', 320);
  d.envelope(20, 150, 140, 90, { label: 'HTTP/1.1 409 Conflict' });
  d.doc(190, 40, 260, 250, { fill: C.paper, lines: false });
  ['Content-Type: application/problem+json', '', '"type": ".../errors/order-paid",', '"title": "Order already paid",', '"status": 409,', '"code": "ORDER_ALREADY_PAID",', '"request_id": "req_7Hq2",', '"retryable": false'].forEach((s, i) => d.mono(202, 66 + i * 26, s, { a: 'start', size: 9, color: [5, 6].includes(i) ? C.acc : undefined }));
  d.arrow(162, 190, 186, 170, { stroke: C.gray, hl: 5 });
  d.text(540, 200, 'code: for programs', { cls: 'sm' }); d.text(540, 120, 'title: for people', { cls: 'sm' }); d.text(540, 230, 'request_id: for support', { cls: 'sm', color: C.acc });
  d.person(540, 140, 24);
  return d.svg();
}

export function be_err_propagation() {
  const d = fig('be_err_propagation', 'WRAP ERRORS WITH CONTEXT ON THE WAY UP; KEEP THE CAUSE', 330);
  const L = [['driver', 'ConnectionResetError'], ['repository', 'OrderLoadError("order 123")'], ['service', 'PaymentFailed("pay order 123")'], ['middleware', '503, logs the whole chain']];
  L.forEach(([a, b], i) => { const w = 160 + i * 110, h = 60 + i * 50, x = 320 - w / 2, y = 290 - h; d.rect(x, y, w, h, { r: 8, fill: i === 0 ? C.accSoft : 'none', stroke: i === 0 ? C.acc : C.ink2 }); d.text(x + 10, y + 14, `${a}: ${b}`, { cls: 'mono', size: 8.5, a: 'start', color: i === 0 ? C.acc : undefined }); });
  d.arrow(600, 280, 600, 70, { stroke: C.gray, hl: 6 }); d.text(596, 60, 'up the stack', { cls: 'xs', a: 'end' });
  return d.svg();
}

export function be_err_middleware() {
  const d = fig('be_err_middleware', 'ONE GLOBAL HANDLER MAPS EXCEPTIONS TO RESPONSES', 320);
  funnel(d, 60, 60, 140, 120); d.text(130, 50, 'any exception', { cls: 'xs' });
  d.rect(200, 160, 300, 30, { r: 4, fill: C.card, stroke: C.ink2 });
  [['ValidationError', '422'], ['NotFound', '404'], ['Conflict', '409'], ['DependencyDown', '503 + Retry-After'], ['anything else', '500, alert, generic body']].forEach(([a, b], i) => { const x = 220 + i * 70; d.line(x, 190, x, 220, { stroke: i === 4 ? C.acc : C.ink2, single: true }); d.text(x, 236, a, { cls: 'mono', size: 8, rot: 0 }); d.text(x, 254 + (i % 2) * 14, b, { cls: 'xs', color: i === 4 ? C.acc : undefined }); });
  d.travel([[130, 70], [130, 175], [500, 175]], { token: 'packet' });
  return d.svg();
}

export function be_err_leak() {
  const d = fig('be_err_leak', 'INTERNAL DETAIL GOES TO LOGS; THE CLIENT GETS A CODE AND A REQUEST ID', 320);
  browser(d, 20, 50, 280, 170, 'app.wren.example');
  ['psycopg2.errors.UndefinedColumn:', 'column "fraud_scor" …', 'File "/srv/wren/app/orders.py"', 'line 214, DB host 10.0.3.7'].forEach((s, i) => d.mono(32, 92 + i * 20, s, { a: 'start', size: 8.5, color: i === 3 ? C.acc : undefined }));
  cross(d, 270, 200, 9); d.text(160, 240, 'leaky 500', { cls: 'ttl' });
  browser(d, 340, 50, 280, 120, 'app.wren.example');
  ['{"code":"INTERNAL",', ' "title":"Something went wrong",', ' "request_id":"req_7Hq2"}'].forEach((s, i) => d.mono(352, 92 + i * 20, s, { a: 'start', size: 8.5 }));
  d.doc(420, 190, 120, 90, { fill: C.card }); d.text(480, 296, 'log line req_7Hq2 holds the trace', { cls: 'xs', color: C.acc });
  d.arrow(480, 172, 480, 186, { stroke: C.acc, hl: 5 });
  return d.svg();
}

export function be_err_retryable() {
  const d = fig('be_err_retryable', 'TELL THE CLIENT WHETHER TRYING AGAIN CAN HELP', 300);
  d.clock(160, 110, 90, { spin: 4 }); d.carrow([[215, 80], [240, 110], [215, 140]], { stroke: C.acc });
  ['429 with Retry-After', '503 overload', '502 / 504 if idempotent', 'connection reset'].forEach((s, i) => d.text(160, 180 + i * 22, s, { cls: 'sm' }));
  stopSign(d, 480, 110, 50);
  ['400, 422 bad input', '401, 403 identity', '404, 409 state', '500 bug (usually)'].forEach((s, i) => d.text(480, 180 + i * 22, s, { cls: 'sm' }));
  return d.svg();
}

export function be_test_pyramid() {
  const d = fig('be_test_pyramid', 'THE TEST PYRAMID WITH WREN\'S COUNTS AND RUN TIMES', 330);
  const rows = [[1, 'e2e', 1], [3, 'integration / API', 0], [6, 'unit', 0]];
  let y = 60;
  [[2, 280], [5, 200], [9, 120]].forEach(([n, x0], r) => { for (let k = 0; k < n; k++) d.rect(x0 + k * (r === 0 ? 40 : r === 1 ? 48 : 46), y, r === 0 ? 38 : r === 1 ? 46 : 44, 60, { r: 2, fill: r === 2 ? C.accSoft : C.card, stroke: r === 2 ? C.acc : C.ink2 }); y += 70; });
  d.text(320, 90, 'e2e', { cls: 'ttl' }); d.text(320, 160, 'integration / API', { cls: 'ttl' }); d.text(320, 230, 'unit', { cls: 'ttl', color: C.acc });
  d.clock(560, 90, 30, { t: 0.5 }); d.mono(600, 90, '200 s', { size: 9, a: 'start' }); d.clock(560, 160, 30, { t: 0.2 }); d.mono(600, 160, '40 s', { size: 9, a: 'start' }); d.clock(560, 230, 30, { t: 0.02 }); d.mono(600, 230, '2 s', { size: 9, a: 'start' });
  d.text(320, 300, '20 × 10 s · 200 × 0.2 s · 1,000 × 2 ms', { cls: 'mono', size: 9.5 });
  return d.svg();
}

export function be_test_doubles() {
  const d = fig('be_test_doubles', 'FOUR KINDS OF TEST DOUBLE', 300);
  [['stub', 'returns canned answers'], ['mock', 'asserts how it was called'], ['fake', 'a working light version'], ['spy', 'records calls to check later']].forEach(([t, s], i) => {
    const x = 90 + i * 150; d.person(x, 70, 50, { stroke: i === 2 ? C.acc : C.ink2, fill: i === 2 ? C.accSoft : C.card });
    if (i === 0) d.rect(x + 20, 110, 30, 20, { r: 2, fill: C.paper, stroke: C.ink2 });
    if (i === 1) { d.rect(x + 18, 100, 28, 36, { r: 2, fill: C.paper, stroke: C.ink2 }); tick(d, x + 32, 116, 5, C.ink2); }
    if (i === 2) d.db(x + 18, 100, 30, 34, {});
    if (i === 3) { d.circle(x + 34, 112, 22, { fill: C.paper, stroke: C.ink2 }); d.line(x + 42, 120, x + 50, 128, { stroke: C.ink2, sw: 2.5, single: true }); }
    d.text(x, 160, t, { cls: 'ttl', color: i === 2 ? C.acc : undefined }); d.text(x, 180, s, { cls: 'xs' });
  });
  d.text(320, 250, 'prefer fakes and real databases for behaviour; mocks couple tests to calls', { cls: 'xs' });
  return d.svg();
}

export function be_test_rollback() {
  const d = fig('be_test_rollback', 'EACH TEST RUNS IN A TRANSACTION THAT IS ROLLED BACK', 300);
  d.db(270, 140, 100, 90, { label: 'test DB', size: 10 });
  [['BEGIN', 80, 80], ['load fixtures', 200, 50], ['POST /orders', 440, 50], ['assert', 560, 80]].forEach(([s, x, y], i) => { d.box(x - 50, y, 100, 30, s, { r: 15, cls: 'mono', size: 9, fill: C.card }); });
  d.arrow(130, 95, 150, 65, { stroke: C.gray, hl: 5 }); d.arrow(250, 65, 390, 65, { stroke: C.gray, hl: 5 }); d.arrow(490, 65, 510, 85, { stroke: C.gray, hl: 5 });
  d.carrow([[560, 112], [470, 260], [180, 260], [80, 112]], { stroke: C.acc, sw: 1.5 }); d.text(320, 278, 'ROLLBACK: clean state for the next test', { cls: 'xs', color: C.acc });
  d.text(320, 120, 'cannot test code that commits itself or opens a second connection', { cls: 'xs' });
  return d.svg();
}

export function be_test_flaky() {
  const d = fig('be_test_flaky', '300 TESTS THAT EACH FAIL 1% OF THE TIME: THE SUITE PASSES ONLY 4.9% OF RUNS', 300);
  for (let i = 0; i < 300; i++) { const x = 30 + (i % 30) * 10, y = 60 + Math.floor(i / 30) * 14; const bad = [17, 133, 251].includes(i); d.dot(x, y, bad ? 3.6 : 2.6, bad ? C.acc : C.gray); }
  d.text(175, 210, 'a typical run: 3 random failures', { cls: 'xs', color: C.acc });
  hbars(d, [['1% each', 4.9, '4.9% green', true], ['0.1% each', 74.1, '74.1% green']], { y: 70, gap: 56, w: 150, x: 420, max: 100 });
  d.text(320, 260, 'P(all pass) = (1 − p)ⁿ; flakiness compounds until nobody trusts red', { cls: 'xs' });
  return d.svg();
}

export function be_test_beyond() {
  const d = fig('be_test_beyond', 'TESTS BEYOND CORRECTNESS', 300);
  d.doc(60, 60, 90, 110, { fill: C.card }); tick(d, 105, 150, 9); d.text(105, 200, 'contract', { cls: 'ttl' }); d.text(105, 220, 'does the provider still', { cls: 'xs' }); d.text(105, 236, 'satisfy its consumers?', { cls: 'xs' });
  gauge(d, 320, 140, 70, 0.75, { hot: true, value: '2,000/s' }); d.text(320, 200, 'load', { cls: 'ttl', color: C.acc }); d.text(320, 220, 'p99 at peak and 2× peak?', { cls: 'xs' });
  d.server(500, 70, 70, 90, {}); bolt(d, 560, 60, 1.2); d.text(535, 200, 'chaos', { cls: 'ttl' }); d.text(535, 220, 'what if Redis or a zone', { cls: 'xs' }); d.text(535, 236, 'disappears?', { cls: 'xs' });
  return d.svg();
}

export function be_quality_dip() {
  const d = fig('be_quality_dip', 'DEPENDENCY INVERSION: POLICY OWNS THE INTERFACE, DETAILS IMPLEMENT IT', 300);
  d.rect(60, 70, 200, 150, { r: 8, fill: C.accSoft, stroke: C.acc }); d.text(160, 92, 'OrderService', { cls: 'ttl', color: C.acc });
  socket(d, 245, 130, ''); d.mono(160, 150, '<<PaymentGateway>>', { size: 9 }); d.text(160, 172, 'owned by the policy', { cls: 'xs' });
  plug(d, 380, 100, 'StripeGateway'); d.rect(380, 170, 90, 34, { r: 6, fill: C.paper, stroke: C.gray, dash: [3, 3] }); d.text(425, 187, 'Razorpay', { cls: 'mono', size: 8.5, vc: true });
  d.arrow(376, 117, 282, 145, { stroke: C.ink2, hl: 5 }); d.arrow(376, 187, 282, 152, { stroke: C.gray, hl: 5, dash: [3, 3] });
  d.text(320, 260, 'swap Stripe for Razorpay without touching OrderService', { cls: 'xs' });
  return d.svg();
}

export function be_quality_abstraction() {
  const d = fig('be_quality_abstraction', 'WHEN AN ABSTRACTION PAYS FOR ITSELF', 280);
  const M = d.axes(80, 50, 480, 170, { xmin: 0, xmax: 6, ymin: 0, ymax: 6, xl: 'implementations / call sites', yl: 'cost of change' });
  d.fn((x) => 0.6 + x * 0.9, 0, 6, M, { stroke: C.ink2, sw: 1.3 });
  d.fn((x) => 2.2 + x * 0.25, 0, 6, M, { stroke: C.acc });
  d.text(140, 120, 'no abstraction', { cls: 'xs' }); d.text(470, 130, 'with interface', { cls: 'xs', color: C.acc });
  d.text(320, 265, 'illustrative: an interface costs up front and pays back from roughly the second implementation', { cls: 'xs' });
  return d.svg();
}

export function be_api_e2e() {
  const d = fig('be_api_e2e', 'POST /orders THROUGH THE WHOLE ARCHITECTURE', 380);
  const s = [['router', 'POST /orders'], ['middleware', 'auth, limits, id'], ['controller', 'DTO validate'], ['idempotency', 'key lookup'], ['service', 'price, rules, tx'], ['repository', 'INSERT order'], ['error map', 'or 201'], ['response', 'Location: /orders/124']];
  s.forEach(([a, b], i) => floor(d, 120, 40 + i * 38, 400, 38, a, b, i === 4));
  d.phone(30, 50, 70); d.db(540, 230, 70, 60, {});
  d.rect(96, 40, 20, 304, { r: 2, fill: C.paper, stroke: C.ink2 });
  d.travel([[106, 50], [106, 334]], { token: (dd) => dd.rect(-8, -10, 16, 20, { r: 2, fill: C.accSoft, stroke: C.acc }) });
  d.arrow(522, 248, 538, 255, { stroke: C.gray, hl: 4 });
  d.text(320, 366, 'business decisions happen on one floor; the rest is plumbing with one job each', { cls: 'xs' });
  return d.svg();
}

export function be_api_components() {
  const d = fig('be_api_components', 'THE UNIT ON ONE PAGE', 340);
  const c = [['resources + verbs', 'predictable URLs and codes'], ['keyset cursors', 'stable, cheap pagination'], ['versioning + deprecation', 'change without breaking'], ['idempotency keys', 'safe retries for POST'], ['GraphQL / gRPC', 'flexible reads, fast internal calls'], ['contracts', 'one schema, generated code'], ['layers + ports', 'one home per concern'], ['errors + tests', 'honest failures, trusted CI']];
  const icon = [(dd, x, y) => drawer(dd, x, y, 34, 26, ''), (dd, x, y) => dd.poly([[x + 8, y], [x + 22, y], [x + 22, y + 30], [x + 15, y + 24], [x + 8, y + 30]], { fill: C.accSoft, stroke: C.acc }), (dd, x, y) => dd.envelope(x, y + 4, 34, 22, {}), (dd, x, y) => dd.key(x + 2, y + 14, 30, {}), (dd, x, y) => { dd.dot(x + 17, y + 4, 4, C.ink2); dd.dot(x + 5, y + 26, 4, C.ink2); dd.dot(x + 29, y + 26, 4, C.ink2); dd.line(x + 17, y + 4, x + 5, y + 26, { stroke: C.ink2, single: true }); dd.line(x + 17, y + 4, x + 29, y + 26, { stroke: C.ink2, single: true }); }, (dd, x, y) => dd.doc(x + 6, y, 24, 30, {}), (dd, x, y) => { [0, 1, 2].forEach((k) => dd.rect(x, y + k * 10, 34, 9, { r: 1, fill: k === 1 ? C.accSoft : C.card, stroke: C.ink2 })); }, (dd, x, y) => stopSign(dd, x + 17, y + 15, 14)];
  c.forEach(([t, s], i) => { const x = 20 + (i % 2) * 310, y = 44 + Math.floor(i / 2) * 72; d.rect(x, y, 290, 58, { r: 7, fill: i === 3 ? C.accFaint : C.card, stroke: i === 3 ? C.acc : C.line }); icon[i](d, x + 12, y + 14); d.text(x + 60, y + 20, t, { cls: 'ttl', a: 'start' }); d.text(x + 60, y + 40, s, { cls: 'sm', a: 'start' }); });
  return d.svg();
}
