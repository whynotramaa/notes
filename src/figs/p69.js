import { scene as illustration, page as figPage, shelf as figShelf, label as figLabel, mapSite } from '../lib/figure-details.js';
import { D, C } from '../lib/draw.js';
import { systemFigure, systemMap, systemCover } from '../lib/system-figures.js';
const stages=['Resources and actions','Pages and query bounds','Versions and retries','Trust and admission','Service boundaries','Distributed workflows','The complete contract'];
import { chip, panel, pipe, cross, tick, bolt, ruler } from '../lib/sd-kit.js';
export function where_sd_apis_and_services(stage=99) { return systemMap("sd_apis_and_services", ["Resource modeling and HTTP methods", "Pagination, filtering and sorting", "Versioning and idempotency keys", "Auth, validation and API gateway", "Monoliths and microservices", "Sagas and distributed transactions", "Case study: one API end to end"], stage); }
export function cover_sd_apis_and_services() { return systemCover("sd_apis_and_services", 10, ["API design and", "microservices"], "API design and microservices", ["Resource modeling and HTTP methods", "Pagination, filtering and sorting", "Versioning and idempotency keys", "Auth, validation and API gateway", "Monoliths and microservices", "Sagas and distributed transactions", "Case study: one API end to end"]); }
export function sd_api_resource() {
  const d = illustration('sd_api_resource', 'ONE RESOURCE, /matches/m7, SEEN BY A VIEWER AND BY A SCORER', 320);
  d.rect(250, 70, 140, 120, { r: 8, fill: C.accSoft, stroke: C.acc });
  d.mono(320, 110, '/matches/m7', { size: 11, color: C.acc }); d.text(320, 136, 'stable identity', { cls: 'xs' });
  d.text(320, 160, 'not a table name', { cls: 'xs' });
  d.phone(40, 70, 70, { label: 'viewer' }); d.arrow(82, 110, 244, 120, { stroke: C.ink2 }); d.mono(160, 100, 'GET: score JSON', { size: 9.5 }); d.text(160, 132, 'read permission', { cls: 'xs' });
  d.person(560, 80, 34, { label: 'scorer' }); d.arrow(540, 120, 396, 130, { stroke: C.ink2 }); d.mono(470, 108, 'POST correction', { size: 9.5 }); d.text(470, 146, 'write permission', { cls: 'xs' });
  d.db(280, 220, 80, 60); d.line(320, 194, 320, 216, { stroke: C.line, dash: [3, 3], single: true });
  d.text(420, 256, 'storage can change underneath', { cls: 'xs', a: 'start' });
  return d.svg();
}
export function sd_api_relations() {
  const d = illustration('sd_api_relations', 'MATCH, EVENT, CLIP AND ASSIGNMENT ARE LINKED, BUT EACH RULE HAS ONE OWNER', 330);
  d.doc(260, 46, 120, 80, { lines: false, fill: C.accSoft, stroke: C.acc }); d.mono(320, 86, 'match m7', { size: 11 });
  const kids = [['event e9', 'score service', 90], ['clip c4', 'media service', 320], ['scorer assignment', 'identity service', 550]];
  kids.forEach(([s, owner, x]) => {
    d.arrow(320, 130, x, 186, { stroke: C.ink2, hl: 6 });
    d.doc(x - 60, 190, 120, 60, { lines: false });
    d.mono(x, 220, s, { size: 10 });
    d.text(x, 270, `owner: ${owner}`, { cls: 'xs' });
  });
  d.text(320, 310, 'storing two things together does not decide who owns the rule between them', { cls: 'xs' });
  return d.svg();
}
export function sd_api_method_effects() {
  const d = illustration('sd_api_method_effects', 'GET READS, PUT REPLACES, POST SUBMITS, DELETE REMOVES; ONLY POST NEEDS A KEY TO RETRY', 340);
  const rows = [['GET', 'read the representation', 'safe', false], ['PUT', 'replace named state', 'idempotent: twice = once', false], ['POST', 'submit a command', 'needs an operation key', true], ['DELETE', 'remove named state', 'second reply may be 404', false]];
  rows.forEach(([m, what, rule, hot], i) => {
    const y = 52 + i * 66;
    d.rect(30, y, 90, 40, { r: 6, fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2 }); d.mono(75, y + 20, m, { size: 12, color: hot ? C.acc : undefined });
    d.text(140, y + 12, what, { cls: 'sm', a: 'start' });
    d.text(140, y + 32, rule, { cls: 'xs', a: 'start', color: hot ? C.acc : undefined });
    const x = 470;
    if (m === 'GET') { d.db(x, y, 40, 40); d.arrow(x + 44, y + 20, x + 90, y + 20, { stroke: C.gray, hl: 5 }); }
    if (m === 'PUT') { chip(d, x, y + 8, 50, '= 3', false); chip(d, x + 60, y + 8, 50, '= 3', false); }
    if (m === 'POST') { chip(d, x, y + 8, 50, '+1', true); chip(d, x + 60, y + 8, 50, '+1?', true); }
    if (m === 'DELETE') { chip(d, x, y + 8, 50, '204', false); chip(d, x + 60, y + 8, 50, '404', false); }
  });
  return d.svg();
}
export function sd_api_validation() {
  const d = illustration('sd_api_validation', 'CHEAP CHECKS FIRST; THE FINAL INVARIANT CHECK SITS WITH THE EFFECT', 300);
  const st = [['bounded parse', '≤ 16 KB'], ['field types', 'runs: int 0–6'], ['permission + rule', 'assigned scorer?'], ['state change', 'seq > current']];
  st.forEach(([s, t], i) => {
    const x = 30 + i * 150, w = 120 - i * 0, hot = i === 3;
    d.poly([[x, 70], [x + w, 70], [x + w - 16 + i * 4, 150], [x + 16 - i * 4, 150]], { fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2 });
    d.text(x + w / 2, 96, s, { cls: 'ttl', size: 12, color: hot ? C.acc : undefined });
    d.mono(x + w / 2, 124, t, { size: 9 });
    if (i < 3) d.arrow(x + w + 4, 110, x + 146, 110, { stroke: C.gray, hl: 5 });
  });
  for (let k = 0; k < 6; k++) d.travel([[90, 60], [90 + Math.min(k, 3) * 150, 110], [90 + Math.min(k, 3) * 150, 190]], { dur: 6, at: [k / 7, k / 7 + 0.4], r: 3, color: k > 2 ? C.acc : C.ink2 });
  d.text(320, 230, 'most bad requests stop on the left, before any expensive work', { cls: 'sm' });
  d.text(320, 254, 'syntactically valid is not authorized', { cls: 'xs' });
  return d.svg();
}
export function sd_api_page_work() {
  const d = illustration('sd_api_page_work', 'THE PAGE HAS 20 ROWS; THE QUERY TOUCHED 10,000: 500 PER RESULT', 300);
  for (let r = 0; r < 10; r++) for (let c = 0; c < 20; c++) d.fillRect(30 + c * 14, 56 + r * 16, 11, 12, C.card, 1, 2);
  d.text(170, 230, '10,000 candidates (each cell = 50)', { cls: 'xs' });
  d.arrow(330, 130, 390, 130, { stroke: C.ink2 });
  d.doc(410, 70, 120, 140, { lines: false, fill: C.accSoft, stroke: C.acc });
  for (let k = 0; k < 10; k++) d.line(424, 90 + k * 11, 516, 90 + k * 11, { stroke: C.acc, single: true, sw: 0.8 });
  d.text(470, 230, '20 returned', { cls: 'sm', color: C.acc });
  d.travel([[30, 50], [310, 50]], { dur: 4, token: (g) => g.line(0, 0, 0, 166, { stroke: C.acc, sw: 1.2, single: true }) });
  d.text(320, 274, 'limit the access path with an index, not just the page size', { cls: 'xs' });
  return d.svg();
}
export function sd_api_offset_shift() {
  const d = illustration('sd_api_offset_shift', 'OFFSET 3 AFTER A NEW EVENT ARRIVES RETURNS EVENT 7 A SECOND TIME', 300);
  d.text(40, 66, 'page 1', { cls: 'ttl', a: 'start' });
  d.tape(140, 52, ['9', '8', '7', '6', '5', '4'], { cw: 56, h: 28, hot: (i) => i < 3 });
  d.text(40, 140, 'event 10 arrives', { cls: 'sm', a: 'start' });
  d.tape(140, 126, ['10', '9', '8', '7', '6', '5', '4'], { cw: 56, h: 28 });
  d.brace(140, 140 + 3 * 56, 162, { label: 'skip 3' });
  d.text(40, 224, 'page 2', { cls: 'ttl', a: 'start' });
  d.tape(140, 210, ['7', '6', '5'], { cw: 56, h: 28, hot: (i) => i === 0 });
  d.text(400, 224, 'event 7 again', { cls: 'sm', a: 'start', color: C.acc });
  return d.svg();
}
export function sd_api_cursor_next() {
const d=illustration('sd_api_cursor_next','A KEY CURSOR KEEPS ITS BOUNDARY WHEN NEW ITEMS APPEAR ABOVE IT',330);
  const keys=[10,9,8,7,6,5,4];
  keys.forEach((v,i)=>{const y=55+i*34;figShelf(d,251,y,[v,'event'],{width:146,height:26,hot:v===7?0:-1});if(v===10)d.text(233,y+13,'new event',{cls:'sm',a:'end',color:C.acc});if(v<7)d.arrow(408,y+13,460,y+13,{stroke:C.acc,hl:5});});
  d.line(231,183,423,183,{stroke:C.acc,sw:2,single:true});d.text(137,188,'cursor: last key 7',{cls:'ttl'});
  d.text(502,245,'next page',{cls:'ttl',color:C.acc});d.mono(502,271,'6, 5, 4');
  d.text(320,316,'seek below the key, without recounting shifted row positions',{cls:'sm'});return d.svg();
}
export function sd_api_cursor_ties() {
  const d = illustration('sd_api_cursor_ties', 'TWO EVENTS AT TIME 100: THE CURSOR CARRIES (TIME, ID) SO NONE IS SKIPPED', 300);
  d.tape(60, 70, ['100, 12', '100, 11', '99, 10', '99, 9'], { cw: 120, h: 32, hot: (i) => i === 1 });
  d.brace(60, 300, 112, { label: 'page 1' });
  d.brace(300, 540, 112, { label: 'page 2' });
  chip(d, 200, 170, 200, 'cursor = (100, 11)', true, 28);
  d.text(320, 236, 'time alone ("after 100") would drop nothing here but could skip a tie', { cls: 'xs' });
  d.text(320, 256, 'at a page boundary that splits two rows with the same time', { cls: 'xs' });
  return d.svg();
}
export function sd_api_filter_order() {
  const d = illustration('sd_api_filter_order', 'SCOPE, FILTER, ORDER AND CURSOR TOGETHER NAME ONE INDEX', 300);
  const st = ['match = m7', 'type = goal', 'order (time, id) desc', 'after cursor, limit 20'];
  st.forEach((s, i) => { chip(d, 40 + i * 145, 80, 130, s, i === 2, 30); if (i < 3) d.arrow(172 + i * 145, 95, 182 + i * 145, 95, { stroke: C.gray, hl: 4 }); });
  d.mono(320, 160, 'INDEX (match_id, type, created_at DESC, id DESC)', { size: 10.5, color: C.acc });
  d.text(320, 204, 'change the sort to "most popular" and you need a different index', { cls: 'sm' });
  d.text(320, 226, 'and the old cursor means nothing', { cls: 'sm' });
  return d.svg();
}
export function sd_api_snapshot() {
  const d = illustration('sd_api_snapshot', 'A LIVE WALK SEES CHANGES BETWEEN PAGES; A SNAPSHOT WALK SEES ONE MOMENT', 320);
  panel(d, 20, 44, 292, 230, 'live walk');
  [0, 1, 2].forEach((k) => { d.doc(50 + k * 80, 80, 60, 80, { lines: false }); d.mono(80 + k * 80, 176, `page ${k + 1}`, { size: 9 }); });
  d.during([0.3, 1], (g) => g.envelope(140, 64, 24, 14, { fill: C.card }));
  d.text(166, 220, 'new rows can appear;\nkey boundary keeps it sane', { cls: 'xs', vc: true });
  panel(d, 328, 44, 292, 230, 'snapshot walk', true);
  d.clock(380, 110, 40);
  d.text(380, 146, 'as of v812', { cls: 'xs', color: C.acc });
  d.doc(460, 76, 110, 100, { fill: C.accSoft, stroke: C.acc }); d.text(515, 194, 'export job', { cls: 'xs' });
  d.text(474, 230, 'costs version retention\nor a materialized export', { cls: 'xs', vc: true });
  return d.svg();
}
export function sd_api_observed_version() {
  const d = illustration('sd_api_observed_version', 'A AND B BOTH SAW VERSION 7; A COMMITS 8; B STILL REMEMBERS 7', 300);
  d.person(60, 70, 32, { label: 'scorer A' }); d.person(60, 190, 32, { label: 'scorer B' });
  chip(d, 110, 76, 70, 'saw v7', false); chip(d, 110, 196, 70, 'saw v7', true);
  d.db(400, 100, 120, 110, { label: 'match m7' });
  d.during([0, 0.4], (g) => g.mono(460, 190, 'v7', { size: 12 }));
  d.during([0.4, 1], (g) => g.mono(460, 190, 'v8', { size: 12, color: C.acc }));
  d.arrow(186, 88, 392, 140, { stroke: C.ink2 }); d.travel([[186, 88], [392, 140]], { dur: 5, at: [0, 0.4], label: 'v7→8', w: 40, fill: C.card, color: C.ink2 });
  d.text(230, 250, 'B\'s memory does not update itself', { cls: 'sm', color: C.acc });
  return d.svg();
}
export function sd_api_command_identity() {
  const d = illustration('sd_api_command_identity', 'KEY K BELONGS TO THE OPERATION, SO A RETRY THROUGH INSTANCE B RECOVERS A\'S RESULT', 320);
  d.person(40, 120, 32, { label: 'scorer' });
  d.server(240, 50, 70, 70, { unit: 15, label: 'instance A' });
  d.server(240, 200, 70, 70, { unit: 15, label: 'instance B', fill: C.accSoft, stroke: C.acc });
  d.db(460, 120, 120, 100, { label: 'K → result' });
  d.arrow(72, 130, 234, 86, { stroke: C.ink2 }); d.arrow(316, 86, 452, 150, { stroke: C.ink2 });
  d.arrow(234, 100, 80, 140, { stroke: C.gray }); bolt(d, 150, 102, 0.6);
  d.arrow(72, 160, 234, 230, { stroke: C.acc }); d.arrow(316, 230, 452, 190, { stroke: C.acc });
  d.travel([[72, 160], [234, 230], [316, 230], [452, 190], [316, 246], [80, 176]], { dur: 5, label: 'K', w: 20 });
  d.text(320, 306, 'a new deliberate correction gets a new key', { cls: 'xs' });
  return d.svg();
}
export function sd_api_conditional_write() {
  const d = illustration('sd_api_conditional_write', 'UPDATE … WHERE version = 7: A CHANGES ONE ROW, B LATER CHANGES ZERO', 300);
  d.mono(320, 56, 'UPDATE matches SET score=…, version=8 WHERE id=m7 AND version=7', { size: 9.5 });
  d.server(40, 100, 70, 80, { label: 'A' }); d.server(530, 100, 70, 80, { label: 'B' });
  d.db(260, 90, 120, 110, { label: 'v7 → v8' });
  d.arrow(116, 130, 252, 140, { stroke: C.acc }); d.mono(184, 120, '1 row', { size: 10, color: C.acc });
  d.arrow(524, 130, 388, 140, { stroke: C.ink2, dash: [4, 4] }); d.mono(456, 120, '0 rows', { size: 10 });
  d.travel([[116, 130], [252, 140]], { dur: 5, at: [0, 0.4], r: 3.5 });
  d.travel([[524, 130], [388, 140], [524, 160]], { dur: 5, at: [0.5, 0.95], r: 3.5, color: C.ink2 });
  d.text(320, 246, 'zero rows means "conflict": return 409 or 412, never silent success', { cls: 'sm' });
  return d.svg();
}
export function sd_api_contract_versions() {
  const d = illustration('sd_api_contract_versions', 'ADDING AN OPTIONAL FIELD IS SAFE; CHANGING A FIELD\'S MEANING IS NOT', 320);
  panel(d, 20, 44, 292, 230, 'compatible');
  d.doc(60, 76, 210, 110, { lines: false });
  d.mono(76, 100, '"score": 2', { size: 10, a: 'start' }); d.mono(76, 124, '"clock": 71', { size: 10, a: 'start' }); d.mono(76, 148, '+ "var": true', { size: 10, a: 'start', color: C.ink2 });
  d.text(166, 220, 'old clients ignore the new field', { cls: 'xs' });
  panel(d, 328, 44, 292, 230, 'breaking', true);
  d.doc(368, 76, 210, 110, { lines: false, stroke: C.acc });
  d.mono(384, 100, '"score": 2', { size: 10, a: 'start' }); d.mono(384, 124, '"clock": 4260', { size: 10, a: 'start', color: C.acc }); d.text(530, 124, 'now seconds', { cls: 'xs', color: C.acc });
  d.text(474, 220, 'it still parses; it means the wrong thing', { cls: 'xs', color: C.acc });
  d.text(320, 300, 'test the meaning, not just that the JSON parses', { cls: 'xs' });
  return d.svg();
}
export function sd_api_permissions() {
const d=illustration('sd_api_permissions','A KNOWN CALLER NEEDS PERMISSION FOR THIS SPECIFIC MATCH',330);
  d.person(69,62,40);d.text(70,122,'scorer',{cls:'ttl'});d.person(69,222,40);d.text(70,283,'viewer',{cls:'ttl'});
  ['m7','m8'].forEach((s,i)=>{figPage(d,280+i*190,82,130,114,s,i===0);d.lock(325+i*190,226,38,{stroke:i?C.ink2:C.acc});});
  d.arrow(116,103,272,132,{stroke:C.acc});d.text(179,79,'grant',{cls:'sm',color:C.acc});
  d.line(184,172,214,202,{stroke:C.ink2,single:true});d.line(214,172,184,202,{stroke:C.ink2,single:true});d.text(201,230,'no viewer grant',{cls:'sm'});
  d.text(320,313,'illustrative policy: scorer may correct m7, but not m8',{cls:'sm'});return d.svg();
}

export function sd_api_validation_layers() {
  const d = illustration('sd_api_validation_layers', 'SHAPE IS CHECKED AT THE EDGE; STATE RULES ARE CHECKED WHERE THE EFFECT COMMITS', 300);
  d.server(40, 90, 80, 90, { label: 'gateway' }); d.server(270, 90, 80, 90, { label: 'score service' }); d.db(480, 90, 110, 90, { label: 'one transaction' });
  chip(d, 20, 200, 120, 'size ≤ 16 KB', false); chip(d, 20, 228, 120, 'runs: integer', false);
  chip(d, 250, 200, 120, 'match exists', false); chip(d, 250, 228, 120, 'caller assigned', false);
  chip(d, 470, 200, 130, 'seq > current', true); chip(d, 470, 228, 130, 'apply effect', true);
  d.arrow(126, 135, 262, 135, { stroke: C.gray, hl: 6 }); d.arrow(356, 135, 472, 135, { stroke: C.gray, hl: 6 });
  d.travel([[80, 135], [535, 135]], { dur: 4, r: 4 });
  return d.svg();
}
export function sd_api_admission() {
  const d = illustration('sd_api_admission', 'A USER QUOTA (100/MIN) AND A SERVER\'S FREE SLOTS ARE DIFFERENT GATES', 300);
  d.person(40, 100, 32, { label: 'user' });
  d.rect(130, 70, 150, 110, { r: 8, fill: C.card, stroke: C.ink2 }); d.text(205, 90, 'user quota', { cls: 'ttl', size: 12 });
  d.mono(205, 120, '100 per minute', { size: 10 }); d.mono(205, 142, '= 100/60 tokens/s', { size: 9 });
  d.rect(340, 70, 160, 110, { r: 8, fill: C.accFaint, stroke: C.acc }); d.text(420, 90, 'server capacity', { cls: 'ttl', size: 12, color: C.acc });
  [0, 1, 2, 3].forEach((k) => d.rect(360 + k * 32, 116, 26, 30, { r: 3, fill: k < 4 ? C.accSoft : C.paper, stroke: C.acc }));
  d.text(420, 164, 'all slots busy', { cls: 'xs', color: C.acc });
  d.arrow(76, 120, 124, 120, { stroke: C.ink2, hl: 6 }); d.arrow(286, 120, 334, 120, { stroke: C.ink2, hl: 6 }); tick(d, 310, 104, 6, C.ink2);
  d.arrow(506, 120, 560, 120, { stroke: C.gray, dash: [4, 4] }); cross(d, 540, 120, 7);
  d.text(320, 236, 'within quota, still refused: the server is full', { cls: 'sm' });
  return d.svg();
}
export function sd_api_gateway_trust() {
  const d = illustration('sd_api_gateway_trust', 'THE GATEWAY VERIFIES WHO; THE SCORE SERVICE DECIDES WHETHER THEY MAY CHANGE m7', 320);
  d.person(40, 100, 32, { label: 'client' }); d.key(40, 160, 28);
  d.server(220, 80, 90, 100, { label: 'gateway' });
  d.server(450, 80, 90, 100, { label: 'score service', fill: C.accSoft, stroke: C.acc });
  d.arrow(76, 120, 214, 120, { stroke: C.ink2 }); d.mono(146, 108, 'token + correction', { size: 9 });
  d.arrow(316, 120, 444, 120, { stroke: C.ink2 }); d.mono(380, 108, 'caller = ana', { size: 9 });
  chip(d, 430, 196, 130, 'ana assigned to m7?', true);
  d.travel([[76, 120], [214, 120], [316, 120], [444, 120]], { dur: 4, r: 3.5 });
  d.server(600, 220, 30, 40, { unit: 12 }); d.carrow([[600, 230], [560, 260], [520, 180]], { stroke: C.gray, dash: [3, 3] });
  d.text(320, 290, 'an internal caller that skips the gateway must face the same check', { cls: 'xs' });
  return d.svg();
}
export function sd_api_monolith() {
const d=illustration('sd_api_monolith','CLEAR MODULE OWNERSHIP CAN LIVE INSIDE ONE DEPLOYMENT',330);
  d.rect(44,48,550,237,{fill:C.paper,stroke:C.ink2});d.text(318,70,'one application process',{cls:'ttl'});
  [71,339].forEach((x,i)=>{d.rect(x,108,230,149,{fill:i?C.card:C.accFaint,stroke:i?C.line:C.acc});d.text(x+115,130,i?'media module':'score module',{cls:'ttl'});d.db(x+70,159,88,72,{label:i?'upload + job':'match + event',size:9});});
  d.text(320,311,'module interfaces define ownership; deployment defines where code runs',{cls:'sm'});return d.svg();
}

export function sd_api_boundaries() {
  const d = illustration('sd_api_boundaries', 'SPLIT SERVICES WHERE A FAILURE BETWEEN THEM CAN BE RECOVERED', 320);
  panel(d, 20, 44, 292, 220, 'score service', true);
  d.db(60, 90, 90, 90, { fill: C.accSoft, stroke: C.acc }); d.text(105, 198, 'match + event intent', { cls: 'xs' });
  d.text(230, 120, 'one local\ntransaction', { cls: 'sm', vc: true, color: C.acc });
  panel(d, 328, 44, 292, 220, 'media service');
  d.db(368, 90, 90, 90); d.text(413, 198, 'clips + jobs', { cls: 'xs' });
  d.gear(540, 130, 40, { spin: 6 });
  d.arrow(312, 154, 328, 154, { stroke: C.ink2, hl: 5 }); d.travel([[230, 170], [400, 170]], { dur: 3, token: 'packet' });
  d.text(320, 296, 'a service per table can cut one invariant in half', { cls: 'xs' });
  return d.svg();
}
export function sd_api_sync_budget() {
  const d = illustration('sd_api_sync_budget', 'FOUR 20 MS CALLS: 80 MS ONE AFTER ANOTHER, 20 MS SIDE BY SIDE', 300);
  const X = 140, s = 5.5;
  d.text(X - 14, 76, 'serial', { cls: 'ttl', a: 'end' });
  [0, 1, 2, 3].forEach((i) => d.rect(X + i * 20 * s, 64, 20 * s, 24, { r: 2, fill: C.card, stroke: C.ink2 }));
  d.mono(X + 80 * s + 8, 76, '80 ms', { size: 10, a: 'start' });
  d.text(X - 14, 150, 'parallel', { cls: 'ttl', a: 'end', color: C.acc });
  [0, 1, 2, 3].forEach((i) => d.rect(X, 118 + i * 16, 20 * s, 13, { r: 2, fill: C.accSoft, stroke: C.acc }));
  d.mono(X + 20 * s + 8, 150, '20 ms', { size: 10, a: 'start', color: C.acc });
  ruler(d, X, 200, 80 * s, 80, 20, ' ms');
  d.text(320, 256, 'assumes equal timings, no overhead and independent calls', { cls: 'xs' });
  return d.svg();
}
export function sd_api_async_boundary() {
  const d = illustration('sd_api_async_boundary', 'THE SCORE IS AT REVISION 8; THE MEDIA VIEW STILL SHOWS 7 UNTIL EVENT E LANDS', 300);
  d.db(40, 80, 100, 100, { label: 'authority\nrev 8', fill: C.accSoft, stroke: C.acc });
  d.envelope(230, 110, 70, 40, { label: 'event E: pending' });
  d.db(440, 80, 100, 100, { label: 'media view\nrev 7' });
  d.arrow(146, 130, 224, 130, { stroke: C.ink2, hl: 6 }); d.arrow(306, 130, 434, 130, { stroke: C.gray, dash: [4, 4] });
  d.travel([[306, 130], [434, 130]], { dur: 5, at: [0.3, 0.9], token: 'packet' });
  d.text(320, 236, 'say which observation the reply proves: "rev 8 committed", not "everywhere"', { cls: 'xs' });
  return d.svg();
}
export function sd_api_partial_commit() {
  const d = illustration('sd_api_partial_commit', 'THE DEBIT COMMITTED (10,000 → 7,500 CENTS), THEN SCHEDULING FAILED', 300);
  d.server(40, 90, 80, 90, { label: 'caller' });
  d.db(220, 80, 110, 100, { label: '7,500 ¢', fill: C.accSoft, stroke: C.acc }); d.text(275, 200, 'credit: committed', { cls: 'xs' });
  d.server(460, 90, 80, 90, { label: 'scheduler' }); bolt(d, 500, 60);
  d.arrow(126, 120, 214, 120, { stroke: C.ink2 }); d.arrow(126, 150, 454, 150, { stroke: C.gray, dash: [4, 4] });
  d.text(320, 246, 'an exception in the caller cannot roll back the remote debit', { cls: 'sm' });
  d.text(320, 268, 'next: recover job J, do not debit again', { cls: 'sm', color: C.acc });
  return d.svg();
}
export function sd_api_saga_states() {
const d=illustration('sd_api_saga_states','A WORKFLOW TRACKS A NAMED RESERVATION THROUGH RECOVERY',355);
  const steps=[['requested',10],['reserved',9],['released',10]];
  steps.forEach(([s,v],i)=>{const x=44+i*204;d.text(x+74,50,s,{cls:'ttl'});for(let r=0;r<2;r++)for(let c=0;c<5;c++){const j=r*5+c;d.circle(x+14+c*29,88+r*35,20,{fill:j<v?C.accSoft:C.paper,stroke:j<v?C.acc:C.line});}d.mono(x+73,163,`${v} available`,{size:11});});
  d.doc(246,221,142,80,{lines:false});d.mono(317,243,'workflow W');d.mono(317,276,'reservation R',{size:11});
  d.text(120,266,'job fails',{cls:'sm'});d.arrow(396,259,486,259,{stroke:C.acc});d.text(551,259,'release R once',{cls:'sm'});
  d.text(320,333,'if the job outcome is unknown, recover it before releasing the hold',{cls:'sm'});return d.svg();
}

export function sd_api_compensation() {
  const d = illustration('sd_api_compensation', 'RELEASING RESERVATION R TWICE CHANGES IT ONCE; OTHER PURCHASES ARE UNTOUCHED', 300);
  const st = [['R held', C.card], ['R released', C.accSoft], ['R released', C.accSoft]];
  st.forEach(([s, f], i) => { d.rect(40 + i * 190, 80, 150, 60, { r: 8, fill: f, stroke: i ? C.acc : C.ink2 }); d.text(115 + i * 190, 110, s, { cls: 'ttl', size: 12 }); });
  d.arrow(194, 110, 226, 110, { stroke: C.acc, hl: 6 }); d.text(210, 96, 'release', { cls: 'xs' });
  d.arrow(384, 110, 416, 110, { stroke: C.gray, hl: 6 }); d.text(400, 96, 'again', { cls: 'xs' });
  d.text(495, 158, 'same recorded result', { cls: 'xs' });
  d.text(320, 220, 'never "restore the account to its old balance": that erases unrelated work', { cls: 'sm' });
  return d.svg();
}
export function sd_api_orchestration() {
  const d = illustration('sd_api_orchestration', 'THE COORDINATOR STORES EACH STEP; A RETRY REUSES THE STEP\'S IDENTITY', 330);
  d.server(250, 50, 140, 90, { label: 'coordinator W', fill: C.accSoft, stroke: C.acc });
  d.server(40, 200, 90, 80, { label: 'credit' }); d.server(510, 200, 90, 80, { label: 'media' });
  d.arrow(250, 110, 136, 210, { stroke: C.ink2 }); d.mono(150, 150, '1 reserve (W, step 1)', { size: 9 });
  d.arrow(136, 240, 250, 130, { stroke: C.gray }); d.mono(220, 196, 'R confirmed', { size: 9 });
  d.arrow(390, 110, 504, 210, { stroke: C.ink2 }); d.mono(480, 150, '2 create job (W, step 2)', { size: 9 });
  d.arrow(504, 240, 390, 130, { stroke: C.gray }); bolt(d, 448, 172, 0.6);
  d.carrow([[400, 90], [460, 70], [510, 200]], { stroke: C.acc }); d.text(560, 76, 'same command', { cls: 'xs', color: C.acc });
  chip(d, 270, 160, 100, 'state: reserved', false);
  return d.svg();
}
export function sd_api_choreography() {
  const d = illustration('sd_api_choreography', 'NO COORDINATOR: EACH SERVICE REACTS TO A FACT AND PUBLISHES THE NEXT', 300);
  const st = [['credit', 'CreditReserved(W)'], ['media', 'create gated J'], ['media', 'JobCreated(W, J)'], ['credit', 'finalize debit']];
  st.forEach(([svc, s], i) => {
    const x = 30 + i * 150, hot = i === 3;
    d.server(x + 30, 60, 60, 60, { unit: 14, fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2 });
    d.text(x + 60, 136, svc, { cls: 'xs' });
    d.mono(x + 60, 160, s, { size: 9, color: hot ? C.acc : undefined });
    if (i < 3) { d.envelope(x + 110, 82, 26, 16); d.arrow(x + 96, 90, x + 174, 90, { stroke: C.gray, hl: 5 }); }
  });
  d.travel([[90, 90], [540, 90]], { dur: 5, token: 'packet' });
  d.text(320, 220, 'every step needs correlation id W, duplicate-safe effects, and', { cls: 'sm' });
  d.text(320, 242, 'a visible rule for when the whole thing counts as done', { cls: 'sm' });
  return d.svg();
}
export function sd_api_entitlement() {
  const d = illustration('sd_api_entitlement', 'RESERVATION R ENDS IN EXACTLY ONE STATE; ONLY "FINALIZED FOR J" OPENS J\'S GATE', 330);
  d.rect(250, 60, 140, 60, { r: 8, fill: C.card, stroke: C.ink2 }); d.text(320, 82, 'R held', { cls: 'ttl' }); d.mono(320, 104, '10 → 9 free', { size: 9 });
  d.rect(60, 180, 180, 60, { r: 8, fill: C.accSoft, stroke: C.acc }); d.text(150, 202, 'finalized for J', { cls: 'ttl', color: C.acc }); d.text(150, 222, 'release now rejected', { cls: 'xs' });
  d.rect(400, 180, 180, 60, { r: 8, fill: C.card, stroke: C.ink2 }); d.text(490, 202, 'released', { cls: 'ttl' }); d.text(490, 222, '10 free; finalize rejected', { cls: 'xs' });
  d.arrow(290, 124, 180, 174, { stroke: C.acc }); d.arrow(350, 124, 460, 174, { stroke: C.ink2 });
  d.lock(140, 260, 24, { stroke: C.acc }); d.text(180, 280, 'J gate opens on confirmed finalize', { cls: 'xs', a: 'start', color: C.acc });
  return d.svg();
}
export function sd_api_outbox_windows() {
  const d = illustration('sd_api_outbox_windows', 'REVISION 8 AND EVENT E COMMIT TOGETHER; SENDING E CAN STILL REPEAT', 320);
  d.rect(30, 60, 200, 110, { r: 8, fill: C.accFaint, stroke: C.acc, dash: [5, 4] }); d.text(130, 78, 'one local commit', { cls: 'ttl', size: 12, color: C.acc });
  chip(d, 46, 96, 168, 'match m7 → rev 8', true); chip(d, 46, 128, 168, 'outbox: E', true);
  d.server(280, 80, 70, 80, { label: 'publisher' });
  d.arrow(236, 140, 274, 120, { stroke: C.ink2, hl: 6 });
  d.server(410, 80, 70, 80, { label: 'broker' });
  d.arrow(356, 110, 404, 110, { stroke: C.ink2 }); d.during([0.4, 1], (g) => bolt(g, 314, 168, 0.7));
  d.text(316, 220, 'crash before "sent" is marked: E goes out again', { cls: 'xs' });
  d.server(540, 80, 70, 80, { label: 'consumer' }); d.arrow(486, 120, 534, 120, { stroke: C.acc, hl: 6 });
  d.text(575, 186, 'records E\nwith effect', { cls: 'xs', vc: true, color: C.acc });
  d.text(320, 290, 'atomic intent does not make transport exactly once', { cls: 'xs' });
  return d.svg();
}
export function sd_api_full_command() {
  const d = illustration('sd_api_full_command', 'FOUR IDENTITIES, FOUR JOBS: CALLER, RESOURCE, COMMAND, OBSERVATION', 320);
  const ids = [['caller', 'scorer ana', 'may she?'], ['resource', 'match m7', 'who owns it?'], ['command', 'key K', 'is this a retry?'], ['observation', 'saw rev 7', 'is it still true?']];
  ids.forEach(([s, v, q], i) => {
    const x = 30 + i * 150, hot = i === 2;
    d.rect(x, 70, 130, 100, { r: 8, fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2 });
    d.text(x + 65, 94, s, { cls: 'ttl', size: 12, color: hot ? C.acc : undefined });
    d.mono(x + 65, 122, v, { size: 10 });
    d.text(x + 65, 148, q, { cls: 'xs' });
  });
  d.envelope(270, 200, 100, 50, { fill: C.paper });
  d.text(320, 270, 'event E names the committed correction (rev 7 → 8)', { cls: 'xs' });
  return d.svg();
}
export function sd_api_failure_matrix() {
  const d = illustration('sd_api_failure_matrix', 'THE RIGHT RECOVERY DEPENDS ON WHICH BOUNDARY THE FAILURE CROSSED', 330);
  const rows = [['bad shape', 'no effect', 'fix the input'], ['conflict', 'old observation', 're-read, reconcile'], ['reply lost', 'effect possible', 'recover with K'], ['view behind', 'effect committed', 'wait or read authority']];
  d.text(150, 52, 'what happened', { cls: 'xs' }); d.text(330, 52, 'what is known', { cls: 'xs' }); d.text(510, 52, 'next action', { cls: 'xs' });
  rows.forEach(([a, b, c], i) => {
    const y = 70 + i * 56, hot = i === 2;
    if (hot) d.fillRect(30, y - 6, 580, 44, C.accFaint, 1, 6);
    chip(d, 80, y, 140, a, hot, 30); d.arrow(226, y + 15, 258, y + 15, { stroke: C.gray, hl: 5 });
    d.text(330, y + 15, b, { cls: 'sm' }); d.arrow(402, y + 15, 434, y + 15, { stroke: C.gray, hl: 5 });
    d.text(510, y + 15, c, { cls: 'sm', color: hot ? C.acc : undefined });
  });
  d.text(320, 310, 'retry is not one universal operation', { cls: 'xs' });
  return d.svg();
}
export function sd_api_retained_work() {
  const d = illustration('sd_api_retained_work', '1,000 COMMANDS/S × 86,400 S × 300 B = 25,920,000,000 B OF COMMAND RECORDS', 300);
  for (let i = 0; i < 24; i++) d.doc(30 + (i % 12) * 26, 70 + Math.floor(i / 12) * 44, 20, 32, { lines: false, stroke: C.gray });
  d.text(180, 170, 'one day at peak: 86,400,000 records', { cls: 'xs' });
  d.arrow(340, 110, 390, 110, { stroke: C.ink2 });
  d.db(410, 60, 140, 120, { fill: C.accSoft, stroke: C.acc, label: '25.92 GB' });
  d.text(320, 230, 'B = λ × T × b: longer retry support means proportionally more storage', { cls: 'sm' });
  d.text(320, 254, 'indexes, replicas and cleanup are extra', { cls: 'xs' });
  return d.svg();
}
export function sd_api_contract_card() {
  const d = illustration('sd_api_contract_card', 'A REQUEST KEEPS ITS MEANING FROM INTENTION TO RECOVERABLE RESULT', 300);
  const st = [['intention', 'K, saw rev 7'], ['authority', 'assigned scorer'], ['atomic effect', 'rev 8 + outbox E'], ['recoverable result', 'K → stored reply']];
  st.forEach(([s, t], i) => {
    const x = 30 + i * 150, hot = i === 3;
    d.circle(x + 60, 110, 90, { fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2 });
    d.text(x + 60, 104, s, { cls: 'ttl', size: 11.5, color: hot ? C.acc : undefined });
    d.mono(x + 60, 124, t, { size: 8.5 });
    if (i < 3) d.arrow(x + 108, 110, x + 160, 110, { stroke: C.gray, hl: 6 });
  });
  d.travel([[90, 110], [540, 110]], { dur: 5, r: 4 });
  d.text(320, 220, 'derived views can lag behind the committed intention', { cls: 'xs' });
  return d.svg();
}
export function sd_api_resource_states() {
  const d = illustration('sd_api_resource_states', 'BYTES UPLOADED, JOB ACCEPTED AND PLAYABLE ARE THREE DIFFERENT CLIP STATES', 300);
  const st = [['uploaded', 'bytes present', 'not published'], ['processing', 'job accepted', 'variants pending'], ['ready', 'checked variants', 'playable link']];
  st.forEach(([s, a, b], i) => {
    const x = 40 + i * 200, hot = i === 2;
    d.doc(x + 40, 60, 80, 90, { lines: false, fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2 });
    if (i === 1) d.gear(x + 80, 105, 26, { spin: 4 });
    if (i === 2) d.poly([[x + 70, 88], [x + 70, 122], [x + 98, 105]], { fill: C.acc, stroke: C.acc });
    if (i === 0) for (let k = 0; k < 4; k++) d.line(x + 52, 80 + k * 14, x + 108, 80 + k * 14, { stroke: C.line, single: true });
    d.text(x + 80, 170, s, { cls: 'ttl', color: hot ? C.acc : undefined });
    d.text(x + 80, 192, a, { cls: 'xs' }); d.text(x + 80, 210, b, { cls: 'xs' });
    if (i < 2) d.arrow(x + 130, 105, x + 236, 105, { stroke: C.gray, hl: 6 });
  });
  return d.svg();
}
export function sd_api_cursor_predicate() {
  const d = illustration('sd_api_cursor_predicate', 'AFTER (100, 11): time < 100, OR time = 100 AND id < 11', 300);
  d.tape(60, 70, ['100, 12', '100, 11', '100, 10', '99, 10', '99, 9'], { cw: 104, h: 30, hot: (i) => i === 2 || i === 3 || i === 4 });
  d.pin(60 + 1.5 * 104, 66, { label: 'cursor', dy: -36, fill: C.card });
  d.mono(320, 150, 'WHERE created_at < 100', { size: 11 });
  d.mono(320, 172, '   OR (created_at = 100 AND id < 11)', { size: 11, color: C.acc });
  d.text(320, 220, 'the equality branch catches (100, 10), which "time < 100" alone would skip', { cls: 'xs' });
  return d.svg();
}
export function sd_api_deadline() {
  const d = illustration('sd_api_deadline', '500 MS TOTAL − 40 ENTRY − 60 REPLY = 400 MS FOR ALL DEPENDENCIES TOGETHER', 300);
  const X = 40, W = 560, s = W / 500;
  const seg = [[0, 40, 'entry'], [40, 240, 'dependency 1'], [240, 440, 'dependency 2'], [440, 500, 'reply']];
  seg.forEach(([a, b, t], i) => { d.rect(X + a * s, 90, (b - a) * s, 40, { r: 0, fill: i === 1 || i === 2 ? C.accSoft : C.card, stroke: i === 1 || i === 2 ? C.acc : C.ink2 }); d.text(X + (a + b) / 2 * s, 110, t, { cls: 'xs' }); });
  ruler(d, X, 144, W, 500, 100, ' ms');
  d.brace(X + 40 * s, X + 440 * s, 82, { dir: -1, label: '400 ms shared' });
  d.text(320, 222, 'two serial stages cannot each take 400 ms; split or propagate what remains', { cls: 'sm' });
  return d.svg();
}
