import { C, fig, beMap, beCover, card, actors, say, steps, panel, hbars, cross, tick, shield, browser } from '../lib/be-kit.js';

const PARTS = ['REST resources', 'Pagination', 'Bulk APIs, partial updates, versioning', 'Idempotency keys', 'RPC, GraphQL and gRPC', 'API contracts', 'Application architecture', 'Error handling', 'Backend testing', 'Code quality and the full request'];
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
  const d = fig('be_api_resources', 'URLS NAME NOUNS; METHODS SUPPLY THE VERBS', 300);
  const n = [['/users', 80, 70], ['/users/42', 80, 150], ['/users/42/orders', 80, 230], ['/orders/123', 360, 150], ['/orders/123/items', 360, 230], ['/restaurants/9/menu', 360, 70]];
  n.forEach(([s, x, y], i) => d.box(x, y - 18, 220, 36, s, { r: 6, cls: 'mono', size: 11, fill: i === 3 ? C.accSoft : C.card, stroke: i === 3 ? C.acc : C.ink2 }));
  d.arrow(190, 92, 190, 128, { stroke: C.gray, hl: 5 }); d.arrow(190, 172, 190, 208, { stroke: C.gray, hl: 5 }); d.arrow(470, 172, 470, 208, { stroke: C.gray, hl: 5 });
  d.text(320, 285, 'collections are plural nouns; an item is collection + id', { cls: 'xs' });
  return d.svg();
}

export function be_api_nesting() {
  const d = fig('be_api_nesting', 'NEST ONE LEVEL FOR OWNERSHIP; LINK INSTEAD OF NESTING DEEPER', 260);
  d.mono(40, 80, '/restaurants/9/menus/3/sections/2/items/17/options/4', { a: 'start', size: 11, color: C.acc }); cross(d, 600, 80, 8);
  d.text(40, 104, 'every level must be validated and kept in step', { cls: 'xs', a: 'start' });
  d.mono(40, 160, '/restaurants/9/menu', { a: 'start', size: 11 }); tick(d, 600, 160, 8);
  d.mono(40, 186, '/menu-items/17   (item knows its restaurant)', { a: 'start', size: 11 }); tick(d, 600, 186, 8);
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
  const d = fig('be_api_verb_map', 'THE REST MAPPING FOR /orders AND /orders/{id}', 320);
  const rows = [['GET', 'list (200)', 'read (200 / 404)'], ['POST', 'create (201 + Location)', 'action? prefer sub-resource'], ['PUT', 'replace all (rare)', 'replace (200 / 204)'], ['PATCH', 'bulk change (rare)', 'partial update (200)'], ['DELETE', 'delete all (avoid)', 'delete (204)']];
  d.text(250, 52, '/orders', { cls: 'ttl' }); d.text(480, 52, '/orders/{id}', { cls: 'ttl' });
  rows.forEach(([m, a, b], i) => { const y = 70 + i * 46; d.chips(30, y, [m], { h: 30, width: 80, fill: C.card }); d.rect(140, y, 220, 30, { r: 4, fill: i === 1 ? C.accSoft : C.paper, stroke: i === 1 ? C.acc : C.line }); d.text(250, y + 15, a, { cls: 'sm' }); d.rect(380, y, 220, 30, { r: 4, fill: C.paper, stroke: C.line }); d.text(490, y + 15, b, { cls: 'sm' }); });
  return d.svg();
}

export function be_api_filtering() {
  const d = fig('be_api_filtering', 'ONE QUERY STRING, FOUR JOBS', 260);
  d.chips(20, 80, ['/orders?', 'status=paid', '&sort=-created_at', '&fields=id,total', '&q=biryani'], { h: 32, size: 10.5, fill: (i) => (i === 2 ? C.accSoft : C.card), stroke: (i) => (i === 2 ? C.acc : C.ink2) });
  [['filter', 150], ['sort, newest first', 265], ['field selection', 395], ['search', 510]].forEach(([s, x]) => d.text(x, 135, s, { cls: 'xs' }));
  d.text(320, 190, 'allowlist every field name; each filter or sort needs a supporting index', { cls: 'xs' });
  return d.svg();
}

export function be_page_offset() {
  const d = fig('be_page_offset', 'LIMIT 20 OFFSET 100000: THE DATABASE READS 100,020 ROWS TO RETURN 20', 260);
  d.rect(40, 90, 500, 34, { r: 2, fill: C.card, stroke: C.ink2 });
  d.rect(40, 90, 480, 34, { r: 2, fill: C.paper, stroke: C.line, dash: [3, 3] }); d.text(280, 107, '100,000 rows read and thrown away', { cls: 'sm' });
  d.rect(520, 90, 20, 34, { r: 2, fill: C.accSoft, stroke: C.acc }); d.text(530, 140, '20', { cls: 'mono', size: 10, color: C.acc });
  d.text(320, 190, 'cost grows with the page number: page 5,000 is 5,000 times the work of page 1', { cls: 'xs' });
  return d.svg();
}

export function be_page_offset_shift() {
  const d = fig('be_page_offset_shift', 'A NEW ROW ARRIVES BETWEEN PAGES: OFFSET SHOWS ONE ORDER TWICE', 290);
  d.text(110, 56, 'page 1 (offset 0)', { cls: 'ttl' });
  ['o50', 'o49', 'o48'].forEach((s, i) => d.chips(60, 72 + i * 32, [s], { h: 26, width: 100 }));
  d.text(330, 56, 'new order o51 inserted', { cls: 'ttl', color: C.acc });
  d.text(520, 56, 'page 2 (offset 3)', { cls: 'ttl' });
  ['o48', 'o47', 'o46'].forEach((s, i) => d.chips(470, 72 + i * 32, [s], { h: 26, width: 100, fill: i === 0 ? C.accSoft : C.card, stroke: i === 0 ? C.acc : C.ink2 }));
  d.text(320, 230, 'the list shifted by one, so o48 appears on both pages; a delete would skip a row', { cls: 'xs' });
  return d.svg();
}

export function be_page_cursor() {
  const d = fig('be_page_cursor', 'A CURSOR IS AN OPAQUE BOOKMARK: "CONTINUE AFTER THIS ROW"', 300);
  card(d, 20, 50, 600, ['{"data":[ ... 20 orders ...],', ' "next_cursor":"eyJjcmVhdGVkX2F0IjoiMjAyNi0xMC0wNlQxMDowMDowMFoiLCJpZCI6ODEyMzQ1fQ=="}'], { hot: [1], size: 9 });
  d.arrow(320, 108, 320, 140, { stroke: C.gray });
  card(d, 160, 150, 320, ['base64url decode', '{"created_at":"2026-10-06T10:00:00Z",', ' "id":812345}'], { size: 9.5 });
  d.text(320, 270, 'sign or encrypt it if clients must not edit it; it is not an API to parse', { cls: 'xs' });
  return d.svg();
}

export function be_page_keyset() {
  const d = fig('be_page_keyset', 'KEYSET PAGINATION: SEEK INTO THE INDEX, READ 20 ROWS', 300);
  card(d, 20, 50, 330, ['SELECT * FROM orders', 'WHERE (created_at, id) <', '      (\'2026-10-06 10:00\', 812345)', 'ORDER BY created_at DESC, id DESC', 'LIMIT 20'], { hot: [1, 2], size: 9.5 });
  for (let i = 0; i < 10; i++) d.rect(400 + i * 22, 120, 20, 30, { r: 1, fill: i >= 5 && i < 7 ? C.accSoft : C.card, stroke: i >= 5 && i < 7 ? C.acc : C.line });
  d.arrow(520, 90, 520, 116, { stroke: C.acc }); d.text(520, 80, 'seek', { cls: 'xs', color: C.acc });
  d.text(510, 175, 'index on (created_at, id)', { cls: 'xs' });
  d.text(320, 260, 'same cost on page 1 and page 5,000; no skipped or repeated rows when rows are inserted', { cls: 'xs' });
  return d.svg();
}

export function be_page_tiebreak() {
  const d = fig('be_page_tiebreak', 'ORDER BY created_at ALONE IS NOT STABLE: ADD A UNIQUE TIEBREAKER', 270);
  [['10:00:00', 'id 812346'], ['10:00:00', 'id 812345'], ['10:00:00', 'id 812344']].forEach(([t, id], i) => { d.mono(120, 80 + i * 32, t, { size: 11 }); d.mono(240, 80 + i * 32, id, { size: 11, color: C.acc }); });
  d.text(450, 110, 'three orders share one\ntimestamp; without the id,\nthe page boundary is ambiguous', { cls: 'sm', vc: true });
  d.text(320, 220, 'the cursor stores both values; the index covers both columns', { cls: 'xs' });
  return d.svg();
}

export function be_api_bulk() {
  const d = fig('be_api_bulk', 'A BULK REQUEST NEEDS A RESULT PER ITEM', 300);
  card(d, 20, 50, 260, ['POST /menu-items/batch', '[{"op":"update","id":17,...},', ' {"op":"update","id":18,...},', ' {"op":"delete","id":19}]'], { size: 9.5 });
  d.arrow(290, 100, 340, 100, { stroke: C.gray });
  card(d, 350, 50, 270, ['200 OK', '[{"id":17,"status":200},', ' {"id":18,"status":409,', '  "error":"stale version"},', ' {"id":19,"status":204}]'], { size: 9.5, hot: [2, 3] });
  d.text(320, 230, 'decide up front: all-or-nothing in one transaction, or independent items with partial success', { cls: 'xs' });
  return d.svg();
}

export function be_api_partial() {
  const d = fig('be_api_partial', 'MERGE PATCH: null DELETES, ABSENT KEEPS, VALUE REPLACES', 260);
  card(d, 20, 50, 190, ['stored', '{"note":"no onions",', ' "tip":20,', ' "gate":"B"}'], { size: 9.5 });
  card(d, 230, 50, 180, ['PATCH body', '{"tip":30,', ' "gate":null}'], { size: 9.5, hot: [1, 2] });
  card(d, 430, 50, 190, ['result', '{"note":"no onions",', ' "tip":30}'], { size: 9.5 });
  d.text(320, 200, 'Content-Type: application/merge-patch+json (RFC 7396)', { cls: 'xs' });
  return d.svg();
}

export function be_api_versioning() {
  const d = fig('be_api_versioning', 'THREE PLACES TO PUT A VERSION', 270);
  [['URL', 'GET /v2/orders', 'visible, cacheable,\neasy to route', true], ['header', 'Api-Version: 2026-10-01', 'clean URLs, date\nversions (Stripe)', false], ['media type', 'Accept: application/\nvnd.wren.v2+json', 'precise, hard to\ntest in a browser', false]].forEach(([t, ex, s, hot], i) => { const x = 20 + i * 205; panel(d, x, 40, 190, 200, t, hot); d.text(x + 95, 95, ex, { cls: 'mono', size: 9.5, vc: true }); d.text(x + 95, 175, s, { cls: 'xs', vc: true }); });
  return d.svg();
}

export function be_api_compat() {
  const d = fig('be_api_compat', 'COMPATIBLE CHANGES VERSUS BREAKING CHANGES', 300);
  panel(d, 20, 40, 290, 230, 'safe to ship', true);
  ['add an optional request field', 'add a response field', 'add an endpoint', 'add an enum value (if clients\ntolerate unknowns)'].forEach((s, i) => d.text(165, 85 + i * 42, s, { cls: 'sm', vc: true }));
  panel(d, 330, 40, 290, 230, 'breaking');
  ['remove or rename a field', 'change a type or format', 'make an optional field required', 'change status codes or meaning'].forEach((s, i) => d.text(475, 85 + i * 42, s, { cls: 'sm' }));
  return d.svg();
}

export function be_api_deprecation() {
  const d = fig('be_api_deprecation', 'DEPRECATING v1: ANNOUNCE, SIGNAL, MEASURE, THEN TURN OFF', 270);
  const X = (m) => 60 + m * 80;
  d.arrow(50, 150, 610, 150, { stroke: C.gray });
  [['v2 ships', 0], ['Deprecation header', 1], ['email top callers', 3], ['Sunset date', 6]].forEach(([s, m], i) => { d.dot(X(m), 150, 4, i === 3 ? C.acc : C.ink); d.text(X(m), i % 2 ? 180 : 120, s, { cls: 'sm', color: i === 3 ? C.acc : undefined }); d.mono(X(m), i % 2 ? 198 : 102, `month ${m}`, { size: 9 }); });
  d.text(320, 240, 'Deprecation and Sunset response headers (RFC 9745, RFC 8594) tell clients in-band', { cls: 'xs' });
  return d.svg();
}

export function be_idem_store() {
  const d = fig('be_idem_store', 'THE IDEMPOTENCY TABLE: ONE ROW PER CLIENT OPERATION', 280);
  d.grid(20, 70, 3, 5, 120, 32, { val: (r, c) => [['key', 'user', 'fingerprint', 'status', 'response'], ['7f3a', '42', 'sha256(..)', 'done', '201 pay_88'], ['91c0', '42', 'sha256(..)', 'running', '']][r][c], cellFill: (r) => (r === 0 ? C.card : r === 1 ? C.accFaint : null), vsize: 10 });
  d.text(320, 200, 'primary key (user, key); written in the same transaction as the payment', { cls: 'xs' });
  d.text(320, 222, 'same key + different fingerprint -> 422; status running -> 409', { cls: 'xs' });
  return d.svg();
}

export function be_idem_concurrent() {
  const d = fig('be_idem_concurrent', 'TWO COPIES ARRIVE TOGETHER: THE UNIQUE INSERT PICKS ONE WINNER', 300);
  const xs = actors(d, ['copy A', 'database', 'copy B'], 44, 280, { x0: 90, x1: 550 });
  say(d, xs[0], xs[1], 100, 'INSERT key 7f3a running'); say(d, xs[2], xs[1], 130, 'INSERT key 7f3a running');
  say(d, xs[1], xs[0], 170, 'ok -> charge', { hot: true }); say(d, xs[1], xs[2], 200, 'unique violation -> 409');
  say(d, xs[0], xs[1], 240, 'UPDATE done + response');
  return d.svg();
}

export function be_idem_size() {
  const d = fig('be_idem_size', '24-HOUR RETENTION AT 50 PAYMENTS PER SECOND', 220);
  hbars(d, [['keys held', 4320000, '4,320,000 rows'], ['bytes at 300 B/row', 1296000000, '1,296,000,000 B', true]], { y: 70, gap: 50, w: 260, x: 200 });
  d.text(320, 190, 'partition by day or use TTL; expiry must outlast the longest client retry window', { cls: 'xs' });
  return d.svg();
}

export function be_rpc_vs_rest() {
  const d = fig('be_rpc_vs_rest', 'RPC NAMES ACTIONS; REST NAMES RESOURCES', 280);
  panel(d, 20, 40, 290, 210, 'RPC style');
  ['POST /createOrder', 'POST /cancelOrder', 'POST /chargeCard', 'POST /getOrderStatus'].forEach((s, i) => d.mono(165, 85 + i * 30, s, { size: 10.5 }));
  d.text(165, 220, 'easy to read as function calls', { cls: 'xs' });
  panel(d, 330, 40, 290, 210, 'REST style', true);
  ['POST /orders', 'POST /orders/123/cancellation', 'POST /payments', 'GET /orders/123'].forEach((s, i) => d.mono(475, 85 + i * 30, s, { size: 10.5 }));
  d.text(475, 220, 'caches, proxies and tools understand it', { cls: 'xs' });
  return d.svg();
}

export function be_gql_query() {
  const d = fig('be_gql_query', 'GRAPHQL: THE QUERY\'S SHAPE IS THE RESPONSE\'S SHAPE', 300);
  card(d, 20, 50, 280, ['query {', '  order(id: 123) {', '    total', '    restaurant { name }', '    items { name qty }', '  }', '}'], { bold: false, size: 10 });
  card(d, 340, 50, 280, ['{"data":{"order":{', '  "total": 450,', '  "restaurant":{"name":"Spice"},', '  "items":[{"name":"biryani",', '            "qty":1}]', '}}}'], { bold: false, size: 10, hot: [2] });
  d.text(320, 270, 'one POST /graphql endpoint; the client picks fields, so no over- or under-fetching', { cls: 'xs' });
  return d.svg();
}

export function be_gql_resolvers() {
  const d = fig('be_gql_resolvers', 'EACH FIELD HAS A RESOLVER; THE ENGINE WALKS THE TREE', 300);
  d.box(250, 50, 140, 36, 'Query.order', { r: 6, cls: 'mono', size: 10, fill: C.accSoft, stroke: C.acc });
  [['Order.total', 110], ['Order.restaurant', 320], ['Order.items', 530]].forEach(([s, x]) => { d.line(320, 86, x, 130, { stroke: C.gray, single: true }); d.box(x - 75, 130, 150, 34, s, { r: 6, cls: 'mono', size: 10 }); });
  d.text(110, 190, 'field on the parent', { cls: 'xs' }); d.text(320, 190, 'SELECT restaurant', { cls: 'xs' }); d.text(530, 190, 'SELECT items', { cls: 'xs' });
  d.text(320, 250, 'resolvers are simple, which is how they quietly multiply database queries', { cls: 'xs' });
  return d.svg();
}

export function be_gql_n_plus_1() {
  const d = fig('be_gql_n_plus_1', 'N+1: 20 ORDERS WITH RESTAURANT AND 5 ITEMS EACH', 250);
  hbars(d, [['naive resolvers', 121, '1 + 20 + 100 = 121 queries'], ['with DataLoader', 3, '3 queries', true]], { y: 70, gap: 56, w: 240, x: 170 });
  d.text(320, 210, 'one list query, then one batched query per relation', { cls: 'xs' });
  return d.svg();
}

export function be_gql_dataloader() {
  const d = fig('be_gql_dataloader', 'DATALOADER COLLECTS KEYS FOR ONE TICK, THEN ISSUES ONE BATCHED QUERY', 280);
  for (let i = 0; i < 6; i++) { d.mono(70, 70 + i * 28, `load(restaurant ${[9, 10, 9, 11, 10, 9][i]})`, { size: 10 }); d.arrow(150, 66 + i * 28, 250, 150, { stroke: C.line, hl: 4 }); }
  d.rect(260, 120, 140, 60, { r: 8, fill: C.accSoft, stroke: C.acc }); d.text(330, 142, 'dedupe + batch', { cls: 'ttl', color: C.acc }); d.mono(330, 162, '{9, 10, 11}', { size: 10 });
  d.arrow(404, 150, 450, 150, { stroke: C.acc }); d.mono(530, 150, 'WHERE id IN (9,10,11)', { size: 9.5 });
  d.text(320, 260, 'also a per-request cache: restaurant 9 is fetched once even if asked for three times', { cls: 'xs' });
  return d.svg();
}

export function be_gql_complexity() {
  const d = fig('be_gql_complexity', 'QUERY COST: orders(first:50) { items(first:20) } TOUCHES 1,050 NODES', 280);
  card(d, 20, 60, 280, ['query {', '  orders(first: 50) {', '    items(first: 20) { name }', '  }', '}'], { bold: false, size: 10 });
  d.mono(460, 90, '50 orders', { size: 11 }); d.mono(460, 116, '+ 50 x 20 = 1,000 items', { size: 11 }); d.mono(460, 142, '= 1,050', { size: 12, color: C.acc });
  d.text(320, 230, 'reject over a cost budget and a depth limit before executing; rate-limit by cost, not by request', { cls: 'xs' });
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
  const d = fig('be_grpc_proto', 'A gRPC SERVICE IS DEFINED IN A .proto FILE', 300);
  card(d, 20, 50, 360, ['syntax = "proto3";', 'service Orders {', '  rpc GetOrder(GetOrderRequest) returns (Order);', '  rpc WatchOrder(GetOrderRequest)', '      returns (stream OrderEvent);', '}', 'message Order {', '  int64 id = 1;  int64 total_paise = 2;', '  string status = 3;', '}'], { bold: false, size: 9.5, lh: 22, hot: [7] });
  d.text(510, 130, 'field numbers, not names,\ngo on the wire', { cls: 'sm', vc: true, color: C.acc });
  d.text(510, 200, 'protoc generates server\nstubs and typed clients', { cls: 'xs', vc: true });
  return d.svg();
}

export function be_grpc_streams() {
  const d = fig('be_grpc_streams', 'FOUR KINDS OF gRPC CALL', 290);
  [['unary', 1, 1], ['server streaming', 1, 4], ['client streaming', 4, 1], ['bidirectional', 4, 4]].forEach(([t, a, b], i) => {
    const x = 20 + i * 152; panel(d, x, 40, 140, 220, t, i === 1);
    for (let k = 0; k < a; k++) d.arrow(x + 20, 90 + k * 22, x + 120, 90 + k * 22, { stroke: C.ink2, hl: 5 });
    for (let k = 0; k < b; k++) d.arrow(x + 120, 180 + k * 18, x + 20, 180 + k * 18, { stroke: i === 1 ? C.acc : C.ink2, hl: 5 });
  });
  d.text(320, 280, 'all multiplexed as HTTP/2 streams; flow control applies per stream', { cls: 'xs' });
  return d.svg();
}

export function be_grpc_varint() {
  const d = fig('be_grpc_varint', 'PROTOBUF ON THE WIRE: id = 123 IS 2 BYTES; IN JSON IT IS 10', 260);
  d.chips(60, 80, ['08', '7B'], { h: 34, size: 13, fill: (i) => (i ? C.accSoft : C.card), stroke: (i) => (i ? C.acc : C.ink2) });
  d.text(80, 132, 'tag: field 1,\nvarint', { cls: 'xs', vc: true }); d.text(130, 132, 'value 123', { cls: 'xs' });
  d.chips(300, 80, ['{"id":123}'], { h: 34, size: 13 }); d.text(370, 132, '10 bytes', { cls: 'xs' });
  d.mono(320, 190, 'value 300 -> varint AC 02 (7 bits per byte, high bit = more)', { size: 10 });
  d.text(320, 225, 'compact and fast, but unreadable without the schema', { cls: 'xs' });
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
  const d = fig('be_grpc_interceptors', 'INTERCEPTORS WRAP EVERY CALL, LIKE HTTP MIDDLEWARE', 240);
  steps(d, [['auth', 'metadata token'], ['deadline', 'check, shrink'], ['tracing', 'span + ids'], ['retry', 'idempotent only'], ['handler', 'GetOrder']], 80, 4);
  d.text(320, 180, 'metadata carries headers: authorization, trace id, request id', { cls: 'xs' });
  return d.svg();
}

export function be_api_choose() {
  const d = fig('be_api_choose', 'REST, GRAPHQL OR gRPC: WHERE EACH FITS', 320);
  const cols = ['REST', 'GraphQL', 'gRPC'], rows = [['public API', 'best', 'good', 'awkward'], ['many client shapes', 'ok', 'best', 'ok'], ['service to service', 'ok', 'rare', 'best'], ['HTTP caching', 'best', 'hard', 'none'], ['streaming', 'SSE/WS', 'subscriptions', 'native'], ['browser support', 'native', 'native', 'needs proxy']];
  cols.forEach((c, j) => d.text(300 + j * 110, 52, c, { cls: 'ttl' }));
  rows.forEach(([r, ...v], i) => { const y = 66 + i * 40; d.text(220, y + 14, r, { cls: 'sm', a: 'end' }); v.forEach((x, j) => { const cx = 300 + j * 110; d.rect(cx - 48, y, 96, 28, { r: 4, fill: x === 'best' || x === 'native' && j === 2 ? C.accSoft : C.paper, stroke: x === 'best' ? C.acc : C.line }); d.text(cx, y + 14, x, { cls: 'xs' }); }); });
  return d.svg();
}

export function be_openapi() {
  const d = fig('be_openapi', 'ONE OPENAPI DOCUMENT FEEDS DOCS, CLIENTS, VALIDATION AND MOCKS', 300);
  card(d, 20, 60, 260, ['openapi: 3.1.0', 'paths:', '  /orders/{id}:', '    get:', '      responses:', '        "200": {$ref: Order}'], { bold: false, size: 9.5 });
  [['reference docs', 60], ['generated clients', 120], ['request validation', 180], ['mock server', 240]].forEach(([s, y], i) => { d.arrow(286, 140, 380, y, { stroke: i === 2 ? C.acc : C.gray, hl: 5 }); d.box(390, y - 18, 200, 36, s, { r: 6, size: 11, fill: i === 2 ? C.accSoft : C.card, stroke: i === 2 ? C.acc : C.ink2 }); });
  return d.svg();
}

export function be_contract_flow() {
  const d = fig('be_contract_flow', 'SCHEMA-FIRST: THE CONTRACT IS THE SOURCE, CODE IS GENERATED FROM IT', 260);
  steps(d, [['edit schema', 'OpenAPI / .proto'], ['lint + diff', 'breaking?'], ['generate', 'stubs, clients'], ['implement', 'handlers'], ['publish', 'docs, SDKs']], 80, 1);
  d.text(320, 180, 'a breaking-change check on the schema diff blocks the merge, not the outage', { cls: 'xs' });
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
  const d = fig('be_arch_layers', 'THE CLASSIC LAYERS AND THE ONE JOB OF EACH', 360);
  const L = [['router', 'URL + method -> handler'], ['middleware', 'auth, limits, logging, errors'], ['controller', 'HTTP in, DTO, HTTP out'], ['service', 'business rules, transactions'], ['repository', 'queries, no business logic'], ['database', 'storage']];
  L.forEach(([a, b], i) => { const y = 44 + i * 50; d.rect(120, y, 180, 38, { r: 7, fill: i === 3 ? C.accSoft : C.card, stroke: i === 3 ? C.acc : C.ink2 }); d.text(210, y + 19, a, { cls: 'ttl', color: i === 3 ? C.acc : undefined }); d.text(330, y + 19, b, { cls: 'sm', a: 'start' }); if (i < 5) d.arrow(210, y + 40, 210, y + 50, { stroke: C.gray, hl: 4 }); });
  d.text(320, 346, 'the service knows nothing about HTTP; the controller knows nothing about SQL', { cls: 'xs' });
  return d.svg();
}

export function be_arch_di() {
  const d = fig('be_arch_di', 'DEPENDENCY INJECTION: THE SERVICE RECEIVES ITS COLLABORATORS', 280);
  d.rect(240, 100, 160, 70, { r: 8, fill: C.accSoft, stroke: C.acc }); d.text(320, 125, 'OrderService', { cls: 'ttl', color: C.acc }); d.text(320, 148, 'needs repo, payments, clock', { cls: 'xs' });
  [['PostgresOrderRepo', 60], ['StripePayments', 135], ['SystemClock', 210]].forEach(([s, y]) => { d.box(20, y - 16, 170, 32, s, { r: 6, cls: 'mono', size: 9.5 }); d.arrow(194, y, 234, 135, { stroke: C.gray, hl: 5 }); });
  [['InMemoryOrderRepo', 60], ['FakePayments', 135], ['FixedClock', 210]].forEach(([s, y]) => { d.box(450, y - 16, 170, 32, s, { r: 6, cls: 'mono', size: 9.5, fill: C.paper, stroke: C.line }); d.arrow(446, y, 406, 135, { stroke: C.line, hl: 5, dash: [3, 3] }); });
  d.text(105, 250, 'production wiring', { cls: 'xs' }); d.text(535, 250, 'test wiring', { cls: 'xs' });
  return d.svg();
}

export function be_arch_dto_model() {
  const d = fig('be_arch_dto_model', 'THREE SHAPES OF ONE ORDER, EACH OWNED BY A DIFFERENT LAYER', 280);
  card(d, 20, 60, 180, ['CreateOrderRequest', 'restaurant_id', 'items[]', 'note'], { title: 'DTO in' });
  card(d, 230, 60, 180, ['Order (domain)', 'id, user_id', 'items, total', 'status, version', 'place(), cancel()'], { title: 'model', hot: [4] });
  card(d, 440, 60, 180, ['OrderResponse', 'id, status', 'total, items', 'eta'], { title: 'DTO out' });
  d.arrow(204, 100, 226, 100, { stroke: C.gray, hl: 5 }); d.arrow(414, 100, 436, 100, { stroke: C.gray, hl: 5 });
  d.text(320, 240, 'the response never exposes internal fields like version or fraud_score by accident', { cls: 'xs' });
  return d.svg();
}

export function be_arch_modular() {
  const d = fig('be_arch_modular', 'A MODULAR MONOLITH: ONE DEPLOYABLE, ENFORCED BOUNDARIES INSIDE', 300);
  d.rect(20, 40, 600, 220, { r: 10, fill: C.paper, stroke: C.ink2 }); d.text(320, 58, 'wren-api (one process)', { cls: 'ttl' });
  [['orders', 40], ['payments', 240], ['menus', 440]].forEach(([s, x], i) => { d.rect(x, 80, 160, 150, { r: 8, fill: i === 0 ? C.accFaint : C.card, stroke: i === 0 ? C.acc : C.ink2 }); d.text(x + 80, 100, s, { cls: 'ttl' }); d.box(x + 20, 120, 120, 28, 'public API', { r: 5, size: 10, fill: C.accSoft, stroke: C.acc }); d.box(x + 20, 160, 120, 50, 'internals +\nown tables', { r: 5, size: 10 }); });
  d.arrow(204, 134, 256, 134, { stroke: C.acc }); d.arrow(404, 134, 456, 134, { stroke: C.acc });
  return d.svg();
}

export function be_arch_hexagonal() {
  const d = fig('be_arch_hexagonal', 'PORTS AND ADAPTERS: THE CORE DEFINES INTERFACES, ADAPTERS PLUG IN', 340);
  const hx = (cx, cy, r) => Array.from({ length: 6 }, (_, i) => [cx + r * Math.cos(Math.PI / 3 * i), cy + r * Math.sin(Math.PI / 3 * i)]);
  d.poly(hx(320, 175, 120), { fill: C.card, stroke: C.ink2 });
  d.poly(hx(320, 175, 60), { fill: C.accSoft, stroke: C.acc }); d.text(320, 175, 'domain\ncore', { cls: 'ttl', vc: true, color: C.acc });
  [['HTTP controller', 70, 90], ['gRPC handler', 70, 260], ['Postgres repo', 570, 90], ['Stripe client', 570, 260]].forEach(([s, x, y]) => { d.box(x - 60, y - 16, 120, 32, s, { r: 6, size: 10 }); d.arrow(x < 320 ? x + 64 : x - 64, y, x < 320 ? 222 : 418, y < 175 ? 140 : 210, { stroke: C.gray, hl: 5 }); });
  d.text(320, 320, 'driving adapters on the left call in; driven adapters on the right implement ports', { cls: 'xs' });
  return d.svg();
}

export function be_arch_dependency_rule() {
  const d = fig('be_arch_dependency_rule', 'THE DEPENDENCY RULE: SOURCE CODE DEPENDENCIES POINT INWARD', 300);
  [[250, 'frameworks, DB, web'], [180, 'adapters'], [110, 'use cases'], [50, 'entities']].forEach(([r, s], i) => { d.circle(320, 150, r * 2 * 0.55, { fill: i === 3 ? C.accSoft : i === 2 ? C.accFaint : C.paper, stroke: i >= 2 ? C.acc : C.ink2 }); d.text(320, 150 - r * 0.55 + 14, s, { cls: 'xs' }); });
  d.arrow(520, 150, 360, 150, { stroke: C.acc, sw: 1.5 });
  d.text(320, 290, 'the core never imports the ORM; the ORM adapter imports the core', { cls: 'xs' });
  return d.svg();
}

export function be_err_categories() {
  const d = fig('be_err_categories', 'ERROR CATEGORIES AND WHAT EACH DESERVES', 330);
  const r = [['validation', '422, field list', 'no'], ['authentication', '401', 'no'], ['authorization', '403 / 404', 'no'], ['conflict', '409', 'after re-read'], ['dependency failure', '502 / 503', 'yes, backoff'], ['timeout', '504', 'if idempotent'], ['programmer error', '500 + alert', 'no']];
  d.text(140, 50, 'category', { cls: 'ttl' }); d.text(340, 50, 'response', { cls: 'ttl' }); d.text(510, 50, 'retry?', { cls: 'ttl' });
  r.forEach(([a, b, c], i) => { const y = 66 + i * 36; if (i === 6) d.fillRect(40, y - 2, 560, 30, C.accFaint); d.text(140, y + 13, a, { cls: 'sm' }); d.mono(340, y + 13, b, { size: 10 }); d.text(510, y + 13, c, { cls: 'sm', color: i === 6 ? C.acc : undefined }); });
  return d.svg();
}

export function be_err_problem() {
  const d = fig('be_err_problem', 'A STRUCTURED ERROR BODY (RFC 9457 PROBLEM DETAILS)', 300);
  card(d, 20, 50, 380, ['HTTP/1.1 409 Conflict', 'Content-Type: application/problem+json', '', '{"type": "https://api.wren.example/errors/order-paid",', ' "title": "Order already paid",', ' "status": 409,', ' "code": "ORDER_ALREADY_PAID",', ' "request_id": "req_7Hq2",', ' "retryable": false}'], { size: 9, lh: 22, hot: [6, 7] });
  d.text(510, 120, 'code: stable, for programs', { cls: 'sm' }); d.text(510, 150, 'title: for people', { cls: 'sm' }); d.text(510, 180, 'request_id: for support', { cls: 'sm', color: C.acc });
  return d.svg();
}

export function be_err_propagation() {
  const d = fig('be_err_propagation', 'WRAP ERRORS WITH CONTEXT ON THE WAY UP; KEEP THE CAUSE', 300);
  [['driver', 'ConnectionResetError'], ['repository', 'OrderLoadError("order 123") from ...'], ['service', 'PaymentFailed("pay order 123") from ...'], ['middleware', 'maps to 503, logs the chain']].forEach(([a, b], i) => { const y = 230 - i * 52; d.rect(40, y, 140, 36, { r: 6, fill: i === 3 ? C.accSoft : C.card, stroke: i === 3 ? C.acc : C.ink2 }); d.text(110, y + 18, a, { cls: 'ttl', size: 11 }); d.mono(200, y + 18, b, { a: 'start', size: 9.5 }); if (i < 3) d.arrow(110, y - 2, 110, y - 14, { stroke: C.gray, hl: 4 }); });
  return d.svg();
}

export function be_err_middleware() {
  const d = fig('be_err_middleware', 'ONE GLOBAL HANDLER MAPS EXCEPTIONS TO RESPONSES', 280);
  [['ValidationError', '422'], ['NotFound', '404'], ['Conflict', '409'], ['DependencyDown', '503 + Retry-After'], ['anything else', '500, alert, generic body']].forEach(([a, b], i) => { const y = 56 + i * 40; d.mono(170, y, a, { size: 10.5, a: 'end' }); d.arrow(180, y, 300, y, { stroke: i === 4 ? C.acc : C.gray, hl: 5 }); d.mono(310, y, b, { size: 10.5, a: 'start', color: i === 4 ? C.acc : undefined }); });
  return d.svg();
}

export function be_err_leak() {
  const d = fig('be_err_leak', 'INTERNAL DETAIL GOES TO LOGS; THE CLIENT GETS A CODE AND A REQUEST ID', 300);
  panel(d, 20, 40, 290, 230, 'leaky 500');
  card(d, 36, 80, 258, ['psycopg2.errors.UndefinedColumn:', 'column "fraud_scor" ...', 'File "/srv/wren/app/orders.py"', 'line 214, DB host 10.0.3.7'], { size: 8.5, hot: [3] });
  panel(d, 330, 40, 290, 230, 'safe 500', true);
  card(d, 346, 80, 258, ['{"code":"INTERNAL",', ' "title":"Something went wrong",', ' "request_id":"req_7Hq2"}'], { size: 9 });
  d.text(475, 200, 'log line with req_7Hq2 holds\nthe stack trace', { cls: 'xs', vc: true });
  return d.svg();
}

export function be_err_retryable() {
  const d = fig('be_err_retryable', 'TELL THE CLIENT WHETHER TRYING AGAIN CAN HELP', 260);
  panel(d, 20, 40, 290, 190, 'retryable', true);
  ['429 with Retry-After', '503 overload', '502 / 504 if idempotent', 'connection reset'].forEach((s, i) => d.text(165, 82 + i * 32, s, { cls: 'sm' }));
  panel(d, 330, 40, 290, 190, 'not retryable');
  ['400, 422 bad input', '401, 403 identity', '404, 409 state', '500 bug (usually)'].forEach((s, i) => d.text(475, 82 + i * 32, s, { cls: 'sm' }));
  return d.svg();
}

export function be_test_pyramid() {
  const d = fig('be_test_pyramid', 'THE TEST PYRAMID WITH WREN\'S COUNTS AND RUN TIMES', 320);
  d.poly([[320, 40], [520, 280], [120, 280]], { fill: C.paper, stroke: C.ink2 });
  d.line(255, 118, 385, 118, { stroke: C.ink2, single: true }); d.line(185, 202, 455, 202, { stroke: C.ink2, single: true });
  d.text(320, 95, 'e2e', { cls: 'ttl' }); d.text(320, 165, 'integration / API', { cls: 'ttl' }); d.text(320, 245, 'unit', { cls: 'ttl', color: C.acc });
  d.mono(560, 90, '20 x 10 s = 200 s', { size: 10, a: 'start' }); d.mono(560, 165, '200 x 0.2 s = 40 s', { size: 10, a: 'start' }); d.mono(560, 245, '1,000 x 2 ms = 2 s', { size: 10, a: 'start' });
  return d.svg();
}

export function be_test_doubles() {
  const d = fig('be_test_doubles', 'FOUR KINDS OF TEST DOUBLE', 280);
  [['stub', 'returns canned\nanswers'], ['mock', 'asserts it was\ncalled as expected'], ['fake', 'working light\nversion (in-memory DB)'], ['spy', 'records calls\nfor later checks']].forEach(([t, s], i) => { const x = 20 + i * 152; panel(d, x, 40, 140, 190, t, i === 2); d.text(x + 70, 130, s, { cls: 'sm', vc: true }); });
  d.text(320, 255, 'prefer fakes and real databases for logic that depends on behaviour; mocks couple tests to calls', { cls: 'xs' });
  return d.svg();
}

export function be_test_rollback() {
  const d = fig('be_test_rollback', 'EACH TEST RUNS IN A TRANSACTION THAT IS ROLLED BACK', 260);
  steps(d, [['BEGIN', ''], ['load fixtures', 'user 42, menu'], ['run test', 'POST /orders'], ['assert', 'rows, response'], ['ROLLBACK', 'clean state']], 80, 4);
  d.text(320, 180, 'fast and isolated; cannot test code that commits itself or uses a second connection', { cls: 'xs' });
  return d.svg();
}

export function be_test_flaky() {
  const d = fig('be_test_flaky', '300 TESTS THAT EACH FAIL 1% OF THE TIME: THE SUITE PASSES ONLY 4.9% OF RUNS', 240);
  hbars(d, [['1% flake per test', 4.9, '4.9% green runs', true], ['0.1% flake per test', 74.1, '74.1% green runs']], { y: 70, gap: 56, w: 300, x: 180, max: 100 });
  d.text(320, 200, 'P(all pass) = (1 - p)^n; flakiness compounds until nobody trusts red', { cls: 'xs' });
  return d.svg();
}

export function be_test_beyond() {
  const d = fig('be_test_beyond', 'TESTS BEYOND CORRECTNESS', 280);
  [['contract', 'does the provider still\nsatisfy its consumers?'], ['load', 'p99 at 2,000 req/s\nand 2x peak?'], ['chaos', 'what if Redis or one\nzone disappears?']].forEach(([t, s], i) => { const x = 20 + i * 205; panel(d, x, 40, 190, 200, t, i === 1); d.text(x + 95, 130, s, { cls: 'sm', vc: true }); });
  return d.svg();
}

export function be_quality_dip() {
  const d = fig('be_quality_dip', 'DEPENDENCY INVERSION: POLICY OWNS THE INTERFACE, DETAILS IMPLEMENT IT', 280);
  d.box(60, 70, 180, 50, 'OrderService', { r: 7, fill: C.accSoft, stroke: C.acc, tw: 600 });
  d.box(60, 170, 180, 50, '<<PaymentGateway>>', { r: 7, cls: 'mono', size: 10 });
  d.arrow(150, 124, 150, 166, { stroke: C.acc });
  d.box(380, 170, 200, 50, 'StripeGateway', { r: 7 }); d.arrow(376, 195, 244, 195, { stroke: C.gray, dash: [4, 3] }); d.text(310, 182, 'implements', { cls: 'xs' });
  d.text(320, 250, 'swap Stripe for Razorpay without touching OrderService', { cls: 'xs' });
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
  const d = fig('be_api_e2e', 'POST /orders THROUGH THE WHOLE ARCHITECTURE', 360);
  const s = [['router', 'POST /orders'], ['middleware', 'auth, limits, id'], ['controller', 'DTO validate'], ['idempotency', 'key lookup'], ['service', 'price, rules, tx'], ['repository', 'INSERT order'], ['error map', 'or 201'], ['response', 'Location: /orders/124']];
  s.forEach(([a, b], i) => { const r = Math.floor(i / 4), c = r ? 3 - (i % 4) : i % 4, x = 24 + c * 152, y = 60 + r * 140; const hot = i === 4; d.rect(x, y, 132, 64, { r: 8, fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2 }); d.text(x + 66, y + 24, a, { cls: 'ttl', color: hot ? C.acc : undefined }); d.text(x + 66, y + 44, b, { cls: 'xs' }); if (i % 4 < 3) d.arrow(r ? x - 4 : x + 136, y + 32, r ? x - 16 : x + 148, y + 32, { stroke: C.gray, hl: 5 }); if (i === 3) d.arrow(x + 66, y + 68, x + 66, y + 136, { stroke: C.gray, hl: 5 }); });
  d.text(320, 320, 'business decisions happen in one orange box; the rest is plumbing with one job each', { cls: 'xs' });
  return d.svg();
}

export function be_api_components() {
  const d = fig('be_api_components', 'THE UNIT ON ONE PAGE', 330);
  const c = [['resources + verbs', 'predictable URLs and codes'], ['keyset cursors', 'stable, cheap pagination'], ['versioning + deprecation', 'change without breaking'], ['idempotency keys', 'safe retries for POST'], ['GraphQL / gRPC', 'flexible reads, fast internal calls'], ['contracts', 'one schema, generated code'], ['layers + ports', 'one home per concern'], ['errors + tests', 'honest failures, trusted CI']];
  c.forEach(([t, s], i) => { const x = 20 + (i % 2) * 310, y = 44 + Math.floor(i / 2) * 70; d.rect(x, y, 290, 56, { r: 7, fill: i === 3 ? C.accFaint : C.card, stroke: i === 3 ? C.acc : C.line }); d.text(x + 14, y + 19, t, { cls: 'ttl', a: 'start' }); d.text(x + 14, y + 39, s, { cls: 'sm', a: 'start' }); });
  return d.svg();
}
