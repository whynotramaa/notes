import { scene as illustration, page as figPage, shelf as figShelf, label as figLabel, mapSite } from '../lib/figure-details.js';
import { D, C } from '../lib/draw.js';
import { canvas, flow, cards, ledger, lanes } from '../lib/fundamentals-figures.js';
import { systemFigure, systemMap, systemCover } from '../lib/system-figures.js';
import n from '../data/system-design/traffic-routing-numbers.json' with { type: 'json' };

const parts = ['Reverse proxies and API gateways', 'L4 and L7 load balancing', 'Load balancing algorithms', 'Consistent hashing and sticky sessions', 'Health checks and failover', 'Service discovery', 'DNS, CDN and geographic routing', 'The complete routed request'];
import { chip, panel, pipe, cross, tick, bolt, ruler } from '../lib/sd-kit.js';
import { world, arc } from '../lib/world.js';
const fmt = (v) => Number(v).toLocaleString('en-US', { maximumFractionDigits: 6 });
export function where_sd_traffic_routing(stage = 99) { return systemMap('sd_traffic_routing', parts, stage); }
export function cover_sd_traffic_routing() { return systemCover('sd_traffic_routing', 7, ['Load', 'balancing'], 'One request, every routing decision', parts); }
export function sd_tr_proxy() {
  const d = illustration('sd_tr_proxy', 'THE BROWSER ALWAYS DIALS THE PROXY; THE PROXY PICKS WHICH SERVER ANSWERS', 330);
  d.laptop(24, 110, 86, { label: 'browser' });
  d.server(250, 84, 100, 120, { fill: C.accSoft, stroke: C.acc, led: () => true });
  d.mono(300, 222, 'scores.heron.test', { size: 10, color: C.acc }); d.text(300, 240, 'stable public endpoint', { cls: 'xs' });
  pipe(d, 118, 248, 145, 22, true);
  d.travel([[122, 145], [244, 145]], { dur: 3, r: 3.5 });
  [0, 1, 2, 3, 4].forEach((i) => {
    const y = 52 + i * 50, gone = i === 1;
    d.server(520, y, 60, 40, { unit: 13, fill: gone ? C.paper : C.card, stroke: gone ? C.gray : C.ink2 });
    d.line(356, 145, 516, y + 20, { stroke: gone ? C.faint : C.line, single: true, dash: gone ? [3, 3] : undefined });
  });
  d.during([0.5, 1], (g) => { g.server(520, 102, 60, 40, { unit: 13, fill: C.card, stroke: C.acc }); g.text(600, 122, 'new', { cls: 'xs', a: 'start', color: C.acc }); });
  d.travel([[356, 145], [516, 222]], { dur: 3, r: 3, color: C.ink2 });
  d.text(320, 300, 'in flight: 1,000/s × 0.2 s = 200 requests through the proxy', { cls: 'xs' });
  return d.svg();
}
export function sd_tr_gateway() {
  const d = illustration('sd_tr_gateway', 'THE ROUTE TABLE PICKS THE SERVICE, THEN A BALANCER PICKS THE SERVER', 330);
  d.envelope(30, 120, 70, 44, { label: 'POST /clips' });
  d.rect(150, 60, 190, 190, { r: 8, fill: C.paper, stroke: C.ink2 }); d.text(245, 80, 'gateway route table', { cls: 'ttl', size: 12 });
  chip(d, 166, 104, 158, 'GET /scores → score', false, 26);
  chip(d, 166, 140, 158, 'POST /clips → media', true, 26);
  chip(d, 166, 176, 158, '/admin → deny', false, 26);
  d.arrow(106, 142, 160, 152, { stroke: C.acc, hl: 6 });
  d.travel([[106, 142], [166, 153], [324, 153], [430, 210]], { dur: 4, r: 3.5 });
  [['score pool', 60, false], ['media pool', 190, true]].forEach(([s, y, hot]) => {
    d.rect(420, y, 190, 90, { r: 6, fill: hot ? C.accFaint : C.paper, stroke: hot ? C.acc : C.line, dash: [4, 3] });
    d.text(515, y + 16, s, { cls: 'sm', color: hot ? C.acc : undefined });
    [0, 1, 2].forEach((k) => d.server(436 + k * 56, y + 30, 40, 48, { unit: 14 }));
  });
  d.arrow(346, 117, 414, 105, { stroke: C.gray, hl: 6 }); d.arrow(346, 153, 414, 230, { stroke: C.acc, hl: 6 });
  d.text(320, 312, 'a 5% canary at 1,000/s means 50/s to the candidate, 950/s to the rest', { cls: 'xs' });
  return d.svg();
}
export function sd_tr_tls() {
  const d = illustration('sd_tr_tls', 'THE PROXY ENDS PUBLIC TLS, STRIPS CLAIMED HEADERS, AND ADDS ITS OWN', 330);
  d.laptop(20, 100, 80);
  pipe(d, 106, 220, 130, 22); d.lock(150, 106, 20);
  d.text(162, 168, 'client TLS', { cls: 'xs' });
  d.rect(226, 70, 180, 130, { r: 6, fill: C.card, stroke: C.ink2 }); d.text(316, 88, 'proxy', { cls: 'ttl' });
  d.mono(240, 116, 'X-User: admin', { size: 9.5, a: 'start', color: C.gray }); cross(d, 330, 116, 6, C.gray);
  chip(d, 240, 134, 152, 'X-Client-Cert: ana', true, 22);
  chip(d, 240, 162, 152, 'X-Request-Id: r41', false, 22);
  pipe(d, 406, 520, 130, 22); d.lock(450, 106, 20);
  d.text(462, 168, 'upstream TLS', { cls: 'xs' });
  d.server(528, 84, 80, 96, { label: 'application' });
  d.travel([[110, 130], [516, 130]], { dur: 5, token: 'packet' });
  d.text(320, 240, 'trusted metadata begins at a hop you control', { cls: 'sm', color: C.acc });
  d.text(320, 262, 'the application still decides what the user may do', { cls: 'sm' });
  d.text(320, 300, 'proxy payload: 1,000/s × 2,000 B = 2,000,000 B/s before overhead', { cls: 'xs' });
  return d.svg();
}
export function sd_tr_pool() {
  const d = illustration('sd_tr_pool', `ONE PROXY, FIVE ENDPOINTS × 20 SOCKETS = ${n.pool_sockets} UPSTREAM SOCKETS`, 330);
  d.server(40, 100, 90, 120, { label: 'proxy', led: () => true });
  [0, 1, 2, 3, 4].forEach((i) => {
    const y = 50 + i * 54;
    d.server(520, y, 80, 42, { unit: 13 });
    for (let k = 0; k < 4; k++) d.line(136, 160, 514, y + 8 + k * 9, { stroke: (i === 2 && k === 1) ? C.acc : C.line, single: true, sw: (i === 2 && k === 1) ? 1.8 : 0.7 });
    d.mono(470, y + 21, '20', { size: 9, color: C.gray });
  });
  d.travel([[136, 160], [514, 167]], { dur: 2, r: 3.5 });
  d.text(320, 306, 'reusing a socket skips a handshake; a socket count is not a request count', { cls: 'xs' });
  return d.svg();
}
export function sd_tr_l4() {
  const d = illustration('sd_tr_l4', 'AN L4 BALANCER PINS THE WHOLE CONNECTION TO ONE GATEWAY', 330);
  d.phone(30, 100, 80);
  d.router(170, 140, 100, { label: 'L4 balancer' });
  d.mono(220, 112, '5-tuple hash', { size: 9.5 });
  [['gateway A', 60, true], ['gateway B', 150, false], ['gateway C', 240, false]].forEach(([s, y, hot]) => {
    d.server(470, y, 70, 60, { unit: 14, fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2, label: s });
    d.line(274, 157, 464, y + 30, { stroke: hot ? C.acc : C.line, single: true, sw: hot ? 2 : 0.8 });
  });
  d.line(76, 140, 168, 157, { stroke: C.acc, single: true, sw: 2 });
  ['GET /a', 'GET /b', 'GET /c'].forEach((s, i) => d.travel([[76, 140], [168, 157], [274, 157], [464, 90]], { dur: 6, at: [i * 0.25, i * 0.25 + 0.5], label: s, w: 46 }));
  d.text(320, 300, `50,000 viewers ÷ 10,000 per gateway = ${n.nominal_gateways} gateways before any failure`, { cls: 'xs' });
  return d.svg();
}
export function sd_tr_l7() {
const d=illustration('sd_tr_l7','AN HTTP ROUTER SELECTS THE SERVICE BEFORE A SERVER IN THAT SERVICE',350);
  d.laptop(37,127,88,{label:'caller'});d.server(233,98,98,120,{label:'HTTP router',unit:27});
  d.envelope(139,144,58,32);d.arrow(203,160,225,160,{stroke:C.acc});
  [['/scores','score pool',65],['/clips','media pool',232]].forEach(([path,s,y],i)=>{d.rect(461,y-25,141,118,{fill:C.paper,stroke:C.line,dash:[3,4]});[475,540].forEach(x=>d.server(x,y,44,48,{unit:14,fill:i?C.card:C.accSoft,stroke:i?C.ink2:C.acc}));d.text(531,y+79,s,{cls:'sm'});d.arrow(339,160,452,y+25,{stroke:i?C.ink2:C.acc,hl:6});d.mono(393,y+14,path,{size:10});});return d.svg();
}
export function sd_tr_multiplex() {
  const d = illustration('sd_tr_multiplex', 'A HAS 100 SOCKETS AND 5 REQUESTS; B HAS 10 SOCKETS AND 200 REQUESTS', 330);
  const srv = (x, s, socks, reqs, hot) => {
    d.server(x + 60, 70, 90, 110, { fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2 });
    d.text(x + 105, 52, s, { cls: 'ttl', color: hot ? C.acc : undefined });
    const nLines = Math.min(12, socks / 8 | 0 || 1);
    for (let k = 0; k < nLines; k++) d.line(x, 76 + k * 9, x + 56, 76 + k * 9, { stroke: C.line, single: true, sw: 0.7 });
    const dots = Math.min(40, reqs / 5);
    for (let k = 0; k < dots; k++) d.dot(x + 70 + (k % 8) * 10, 192 + Math.floor(k / 8) * 10, 2.5, hot ? C.acc : C.ink2);
    d.mono(x + 105, 262, `${socks} sockets · ${reqs} active`, { size: 10 });
  };
  srv(30, 'server A', n.http2_connections[0], n.http2_active[0], false);
  srv(340, 'server B', n.http2_connections[1], n.http2_active[1], true);
  d.text(320, 300, `${n.http2_active[0]}/${n.http2_connections[0]} = 0.05 vs ${n.http2_active[1]}/${n.http2_connections[1]} = 20 requests per socket (each dot = 5)`, { cls: 'xs' });
  return d.svg();
}
export function sd_tr_drain() {
  const d = illustration('sd_tr_drain', 'A DRAINS; 10,000 VIEWERS RECONNECT TO B AND RESUME FROM THEIR CURSORS', 340);
  d.phone(30, 110, 76, { label: 'viewer' });
  chip(d, 14, 210, 92, 'last seen 841', true, 22);
  d.server(260, 50, 90, 80, { label: 'gateway A: draining' });
  d.server(260, 190, 90, 80, { label: 'gateway B', fill: C.accSoft, stroke: C.acc });
  d.arrow(76, 130, 252, 92, { stroke: C.gray, dash: [4, 4] }); cross(d, 170, 112, 7, C.gray);
  d.arrow(76, 160, 252, 228, { stroke: C.acc });
  d.mono(150, 210, 'resume after 841', { size: 9.5, color: C.acc });
  d.db(470, 150, 110, 90, { label: 'event history' });
  d.arrow(462, 200, 358, 222, { stroke: C.ink2, hl: 6 });
  d.text(530, 70, `${fmt(n.reconnect_connections)} ÷ ${n.reconnect_window_s} s\n= ${n.reconnect_per_s} reconnects/s`, { cls: 'sm', vc: true });
  d.travel([[76, 160], [252, 228]], { dur: 3, at: [0.2, 0.7], r: 3.5 });
  d.text(320, 320, 'each viewer replays 100 missed events, then joins the live stream', { cls: 'xs' });
  return d.svg();
}
export function sd_tr_rr() {
const d=illustration('sd_tr_rr','EQUAL ASSIGNMENT COUNTS CAN STILL PRODUCE VERY UNEQUAL WORK',330);
  const totals=n.rr_cost_ms,max=Math.max(...totals);
  ['A','B','C'].forEach((s,i)=>{d.server(35,56+i*82,60,58,{unit:16});d.text(63,124+i*82,s,{cls:'ttl'});d.rect(126,64+i*82,totals[i]/max*345,41,{r:1,fill:i===1?C.accSoft:C.card,stroke:i===1?C.acc:C.ink2});d.mono(514,85+i*82,`${totals[i]} ms`,{a:'start',size:12});d.text(151,117+i*82,i===1?'100 + 100':'10 + 10',{cls:'sm',a:'start'});});
  d.text(320,312,'two requests per server; the costs of those requests differ',{cls:'sm'});return d.svg();
}
export function sd_tr_weight() {
  const d = illustration('sd_tr_weight', 'WEIGHTS 1 : 2 : 1 SPLIT 1,000 REQUESTS/S INTO 250, 500 AND 250', 330);
  d.server(30, 120, 80, 90, { label: '1,000/s' });
  const s = [['A', 1, n.weighted_qps[0], 60], ['B', 2, n.weighted_qps[1], 140], ['C', 1, n.weighted_qps[2], 240]];
  s.forEach(([name, w, q, y]) => {
    const hot = w === 2;
    pipe(d, 116, 380, y + 30, w * 14, hot);
    d.server(400, y, 70 + (hot ? 20 : 0), 60 + (hot ? 10 : 0), { unit: 14, fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2 });
    d.mono(510, y + 32, `${name}: weight ${w} → ${q}/s`, { size: 10, a: 'start', color: hot ? C.acc : undefined });
  });
  for (let k = 0; k < 4; k++) d.travel([[120, 170], [376, k === 1 || k === 3 ? 170 : k === 0 ? 90 : 270]], { dur: 2, at: [k / 4, k / 4 + 0.4], r: 3 });
  d.text(320, 316, 'B must really be able to serve twice as much', { cls: 'xs' });
  return d.svg();
}
export function sd_tr_canary() {
  const d = illustration('sd_tr_canary', `A 5% CANARY: ${n.canary_qps} REQUESTS/S TO THE CANDIDATE, ${n.remaining_qps} TO THE ESTABLISHED VERSION`, 310);
  for (let i = 0; i < 20; i++) d.envelope(30 + (i % 10) * 30, 70 + Math.floor(i / 10) * 30, 22, 16, { fill: i === 19 ? C.accSoft : C.paper, stroke: i === 19 ? C.acc : C.ink2 });
  d.text(170, 146, 'each envelope = 50 requests/s', { cls: 'xs' });
  d.server(420, 50, 90, 90, { label: `v41: ${n.remaining_qps}/s` });
  d.server(540, 170, 60, 60, { unit: 14, label: `v42: ${n.canary_qps}/s`, fill: C.accSoft, stroke: C.acc });
  d.arrow(330, 90, 412, 90, { stroke: C.ink2 }); d.arrow(330, 110, 534, 196, { stroke: C.acc });
  d.travel([[330, 110], [534, 196]], { dur: 3, r: 3 });
  d.text(320, 270, 'a share of requests, not of connections or users', { cls: 'sm' });
  return d.svg();
}
const balance = (d, pick) => {
  const S = [['A', n.least_connection_A, n.least_outstanding_A], ['B', n.least_connection_B, n.least_outstanding_B]];
  S.forEach(([s, socks, reqs], i) => {
    const x = 70 + i * 290, hot = i === pick;
    d.server(x + 60, 56, 90, 100, { fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2 });
    d.text(x + 105, 176, `server ${s}`, { cls: 'ttl', color: hot ? C.acc : undefined });
    d.mono(x + 105, 200, `${socks} sockets`, { size: 10.5, color: pick === 1 && hot ? C.acc : undefined });
    d.mono(x + 105, 220, `${reqs} active requests`, { size: 10.5, color: pick === 0 && hot ? C.acc : undefined });
  });
  d.envelope(296, 250, 48, 30, { fill: C.accSoft, stroke: C.acc });
  d.arrow(pick ? 350 : 290, 260, pick ? 430 : 210, 170, { stroke: C.acc });
};
export function sd_tr_least_conn() {
  const d = illustration('sd_tr_least_conn', `LEAST CONNECTIONS PICKS B, BECAUSE ${n.least_connection_B} < ${n.least_connection_A} SOCKETS`, 310);
  balance(d, 1);
  d.text(320, 300, 'and sends the next request to the busier server', { cls: 'xs' });
  return d.svg();
}
export function sd_tr_least_req() {
  const d = illustration('sd_tr_least_req', `LEAST OUTSTANDING REQUESTS PICKS A, BECAUSE ${n.least_outstanding_A} < ${n.least_outstanding_B}`, 310);
  balance(d, 0);
  d.text(320, 300, 'with unequal servers, combine the count with weights', { cls: 'xs' });
  return d.svg();
}
export function sd_tr_p2() {
  const d = canvas('sd_tr_p2', 'SAMPLE TWO, THEN COMPARE THEIR LOAD', 255);
  n.p2_loads.forEach((load, i) => {
    const selected = i === n.p2_selected;
    d.box(25 + i * 122, 69, 102, 60, `${'ABCDE'[i]}\n${load} active`, { fill: selected ? C.accSoft : C.card, stroke: selected ? C.acc : C.line });
    if (n.p2_pair.includes(i)) d.arrow(25 + i * 122 + 51, 187, 25 + i * 122 + 51, 136, { stroke: selected ? C.acc : C.gray });
  });
  d.text(320, 219, 'sample B and E; select B', { cls: 'sm' });
  return d.svg();
}
export function sd_tr_slowstart() {
  const d = canvas('sd_tr_slowstart', 'RAMP ASSIGNMENT AFTER READINESS', 300);
  const M = d.axes(70, 65, 475, 165, { xmin: 0, xmax: n.slowstart_s, ymin: 0, ymax: 1, xl: 'seconds', yl: 'fraction of final weight' });
  d.line(M.X(0), M.Y(0), M.X(n.slowstart_s), M.Y(1), { stroke: C.ink2 });
  d.dot(M.X(n.slowstart_at_s), M.Y(n.slowstart_weight), 5, C.acc);
  d.mono(265, 152, `${n.slowstart_at_s} s → ${n.slowstart_weight}`, { color: C.acc });
  d.mono(545, 255, `${n.slowstart_s} s`, { a: 'end' });
  return d.svg();
}
export function sd_tr_ring() {
  const d = canvas('sd_tr_ring', 'A NEW POSITION TAKES ONLY ITS PRECEDING INTERVAL', 355);
  const cx = 310, cy = 178, radius = 103;
  d.circle(cx, cy, radius * 2, { stroke: C.line });
  const point = v => [cx + Math.cos(v / 100 * 2 * Math.PI - Math.PI / 2) * radius, cy + Math.sin(v / 100 * 2 * Math.PI - Math.PI / 2) * radius];
  const arc = Array.from({ length: 21 }, (_, i) => point(30 + i));
  d.lines(arc, { stroke: C.acc, sw: 3 });
  [[10, 'A'], [30, 'B'], [50, 'E new'], [60, 'C'], [90, 'D']].forEach(([pos, label]) => {
    const [x, y] = point(pos); d.dot(x, y, 4, pos === 50 ? C.acc : C.ink); d.text(x + (x < cx ? -16 : 16), y, `${label} (${pos})`, { a: x < cx ? 'end' : 'start', cls: 'sm', color: pos === 50 ? C.acc : C.ink });
  });
  d.mono(cx, cy, 'key 45 → E', { color: C.acc });
  d.text(320, 325, 'keys 5, 20, 70 and 95 retain their owners', { cls: 'sm' });
  return d.svg();
}
export function sd_tr_modulo() {
  const d = canvas('sd_tr_modulo', 'CHANGING THE DIVISOR REMAPS MANY FIXED KEYS', 260);
  ['key', '% 4', '% 5'].forEach((s, r) => d.text(20, 76 + r * 58, s, { a: 'start', cls: 'mono' }));
  for (let k = 0; k < 12; k++) {
    const x = 118 + k * 41;
    d.mono(x + 16, 76, String(k), { size: 10 });
    [4, 5].forEach((divisor, r) => d.box(x, 111 + r * 58, 32, 32, String(k % divisor), { fill: r === 1 && n.modulo_changed_keys.includes(k) ? C.accSoft : C.card, stroke: r === 1 && n.modulo_changed_keys.includes(k) ? C.acc : C.line, size: 10 }));
  }
  return d.svg();
}
export function sd_tr_hot() {
  const d = illustration('sd_tr_hot', 'EQUAL KEY COUNTS, UNEQUAL TRAFFIC: ONE OWNER GETS 700 OF 1,000 REQUESTS/S', 320);
  ['A', 'B', 'C', 'D'].forEach((s, i) => {
    const x = 40 + i * 150, q = n.sticky_qps[i], hot = i === 0;
    d.server(x + 20, 230 - q * 0.22, 90, q * 0.22, { unit: 16, fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2 });
    d.mono(x + 65, 250, `${s}: ${q}/s`, { size: 10.5, color: hot ? C.acc : undefined });
    d.text(x + 65, 270, '25% of keys', { cls: 'xs' });
  });
  for (let k = 0; k < 7; k++) d.travel([[100, 30], [105, 70]], { dur: 1, at: [k / 7, k / 7 + 0.4], r: 2.5 });
  d.text(320, 300, 'one live match carries 70% of the requests', { cls: 'xs' });
  return d.svg();
}
export function sd_tr_sticky() {
  const d = illustration('sd_tr_sticky', 'AFFINITY PREFERS A, CHECKS IT IS ELIGIBLE, AND FALLS BACK TO B WHEN IT IS NOT', 330);
  d.person(40, 120, 34); chip(d, 10, 170, 90, 'session s9', false, 22);
  d.router(150, 140, 90, { label: 'balancer' });
  d.server(360, 50, 80, 80, { label: 'A preferred' });
  d.during([0.45, 1], (g) => cross(g, 400, 90, 18));
  d.server(360, 190, 80, 80, { label: 'B fallback', fill: C.accSoft, stroke: C.acc });
  d.arrow(244, 150, 352, 96, { stroke: C.ink2, dash: [4, 4] });
  d.arrow(244, 165, 352, 226, { stroke: C.acc });
  d.travel([[244, 165], [352, 226]], { dur: 6, at: [0.5, 0.9], r: 3.5 });
  d.db(510, 140, 90, 80, { label: 'session store' });
  d.arrow(446, 226, 504, 190, { stroke: C.acc, hl: 6 });
  d.text(320, 312, 'affinity buys locality; the session must live where B can read it', { cls: 'xs' });
  return d.svg();
}
export function sd_tr_affinity_failure() {
  const d = illustration('sd_tr_affinity_failure', 'LOSE ONE GATEWAY: 50,000 SOCKETS SPREAD OVER THE SURVIVORS', 330);
  const rows = [[5, n.five_one_failure_load], [6, n.six_one_failure_load], [7, n.seven_one_failure_load]];
  rows.forEach(([g, load], r) => {
    const y = 56 + r * 80, over = load > n.gateway_capacity, hot = g === 7;
    d.text(30, y + 20, `${g} → ${g - 1}`, { cls: 'ttl', a: 'start' });
    for (let i = 0; i < g; i++) {
      const x = 110 + i * 54, dead = i === g - 1;
      d.server(x, y, 40, 48, { unit: 14, fill: dead ? C.paper : hot ? C.accSoft : over ? C.paper : C.card, stroke: dead ? C.gray : hot ? C.acc : C.ink2 });
      if (dead) cross(d, x + 20, y + 24, 9, C.gray);
    }
    d.mono(500, y + 16, `${fmt(Number(load.toFixed(6)))} each`, { size: 10.5, a: 'start', color: over ? C.acc : undefined });
    d.text(500, y + 34, over ? 'over the 10,000 limit' : load === n.gateway_capacity ? 'exactly at the limit' : 'room to spare', { cls: 'xs', a: 'start' });
  });
  return d.svg();
}
export function sd_tr_health() {
  const d = illustration('sd_tr_health', 'PROBES AND REAL FAILURES FEED ONE DECISION: REMOVE AFTER THE THRESHOLD', 330);
  d.server(40, 90, 80, 100, { label: 'endpoint' });
  d.text(240, 56, 'active probe /ready', { cls: 'sm' });
  [0, 1, 2].forEach((k) => { d.arrow(126 + k * 0, 100, 340, 100, { stroke: C.line, hl: 5 }); });
  d.travel([[340, 100], [126, 100]], { dur: 2, r: 3, color: C.ink2 });
  d.text(240, 156, 'passive: real timeouts', { cls: 'sm' });
  d.arrow(340, 170, 126, 170, { stroke: C.line, hl: 5 });
  d.rect(360, 80, 240, 120, { r: 8, fill: C.paper, stroke: C.ink2 });
  d.text(480, 100, 'consecutive failures', { cls: 'xs' });
  [0, 1, 2].forEach((k) => { d.circle(420 + k * 60, 140, 34, { fill: C.card, stroke: C.ink2 }); d.during([(k + 1) / 4, 1], (g) => cross(g, 420 + k * 60, 140, 9)); });
  d.during([0.75, 1], (g) => { g.rect(360, 220, 240, 36, { r: 6, fill: C.accSoft, stroke: C.acc }); g.text(480, 238, 'removed from rotation', { cls: 'sm', color: C.acc }); });
  d.text(240, 276, 'a 403 for one user is not machine failure', { cls: 'xs' });
  return d.svg();
}
export function sd_tr_detection() {
  const d = illustration('sd_tr_detection', `WORST PHASE: PROBES START AT 5, 10, 15; THE LAST TIMES OUT AT ${n.detection_max_s} S`, 300);
  const X = 60, s = 32;
  ruler(d, X, 200, 16 * s, 16, 2, ' s');
  d.pin(X, 120, { label: 'fails just after a success', dy: 20 });
  [5, 10, 15].forEach((t, i) => { d.rect(X + t * s, 100, s, 30, { r: 3, fill: C.card, stroke: C.ink2 }); cross(d, X + t * s + s / 2, 115, 6, C.ink2); d.mono(X + t * s + s / 2, 86, `probe ${i + 1}`, { size: 9 }); });
  d.line(X + 16 * s, 70, X + 16 * s, 196, { stroke: C.acc, sw: 2, single: true }); d.text(X + 16 * s, 60, 'removed', { cls: 'sm', color: C.acc, a: 'end' });
  d.travel([[X, 160], [X + 16 * s, 160]], { dur: 6, r: 4 });
  d.text(320, 256, `detection ranges from ${n.detection_min_s} to ${n.detection_max_s} s with a 5 s interval, 3 failures, 1 s timeout`, { cls: 'xs' });
  return d.svg();
}
export function sd_tr_readiness() {
  const d = illustration('sd_tr_readiness', 'ALIVE IS NOT READY: NEW WORK FLOWS ONLY IN THE READY STATE', 310);
  const st = [['starting', 'alive, not selected'], ['ready', 'new work allowed'], ['draining', 'no new work,\nfinish the rest'], ['stopped', 'sockets closed']];
  st.forEach(([s, t], i) => {
    const x = 30 + i * 150, hot = i === 2;
    d.server(x + 30, 60, 60, 80, { unit: 16, fill: hot ? C.accSoft : i === 3 ? C.paper : C.card, stroke: hot ? C.acc : i === 3 ? C.gray : C.ink2, led: i === 1 ? () => true : undefined });
    d.text(x + 60, 160, s, { cls: 'ttl', color: hot ? C.acc : undefined });
    d.text(x + 60, 188, t, { cls: 'xs', vc: true });
    if (i < 3) d.arrow(x + 96, 100, x + 174, 100, { stroke: C.gray, hl: 6 });
  });
  d.travel([[20, 40], [210, 80]], { dur: 3, at: [0.2, 0.7], r: 3 });
  d.text(320, 264, `slow start: ${n.slowstart_s} s ramp, weight ${n.slowstart_weight} after ${n.slowstart_at_s} s`, { cls: 'xs' });
  return d.svg();
}
export function sd_tr_capacity() {
  const d = illustration('sd_tr_capacity', 'AT 300/S PER SERVER: 1,500 → 1,200 → 900 AGAINST A 1,000/S PEAK', 320);
  const rows = [[5, n.normal_capacity], [4, n.one_failure_capacity], [3, n.two_failure_capacity]];
  rows.forEach(([k, cap], r) => {
    const y = 60 + r * 74, short = cap < n.peak_qps;
    for (let i = 0; i < 5; i++) d.server(40 + i * 46, y, 36, 46, { unit: 14, fill: i >= k ? C.paper : short ? C.accSoft : C.card, stroke: i >= k ? C.faint : short ? C.acc : C.ink2 });
    d.rect(300, y + 10, cap * 0.18, 26, { r: 2, fill: short ? C.accSoft : C.card, stroke: short ? C.acc : C.ink2 });
    d.mono(300 + cap * 0.18 + 8, y + 23, `${fmt(cap)}/s`, { size: 10, a: 'start', color: short ? C.acc : undefined });
  });
  d.line(300 + 1000 * 0.18, 50, 300 + 1000 * 0.18, 286, { stroke: C.ink, dash: [4, 4], single: true });
  d.text(300 + 1000 * 0.18, 300, 'peak 1,000/s', { cls: 'xs' });
  return d.svg();
}
export function sd_tr_registry() {
  const d = illustration('sd_tr_registry', 'THE REGISTRY KNOWS ABOUT E; THE ROUTER IS STILL USING ITS OLD LIST', 320);
  d.server(30, 90, 70, 80, { label: 'new instance E' });
  d.arrow(106, 130, 196, 130, { stroke: C.ink2 }); d.text(150, 116, 'register', { cls: 'xs' });
  d.db(200, 80, 110, 100, { fill: C.accSoft, stroke: C.acc, label: 'A B C D E' });
  d.text(255, 200, 'registry', { cls: 'sm', color: C.acc });
  d.router(420, 120, 100, { label: 'router' });
  chip(d, 410, 60, 120, 'cached: A B C D', false, 24);
  d.arrow(316, 130, 412, 130, { stroke: C.gray, dash: [4, 4] }); d.text(364, 116, 'refresh due later', { cls: 'xs' });
  d.text(320, 270, 'published is not the same as consumed, and both need a health check', { cls: 'xs' });
  return d.svg();
}
export function sd_tr_discovery_modes() {
  const d = illustration('sd_tr_discovery_modes', 'CLIENT-SIDE DISCOVERY PICKS IN THE CALLER; PROXY-SIDE PICKS IN THE PROXY', 330);
  panel(d, 20, 44, 292, 250, 'client-side');
  d.server(40, 90, 60, 70, { unit: 14, label: 'caller' }); d.db(200, 70, 80, 60, { label: 'directory' });
  d.arrow(104, 110, 196, 100, { stroke: C.ink2, hl: 6 });
  [0, 1, 2].forEach((i) => d.server(150 + i * 50, 200, 36, 46, { unit: 13 }));
  d.arrow(90, 166, 210, 196, { stroke: C.ink2, hl: 6 });
  panel(d, 328, 44, 292, 250, 'proxy-side', true);
  d.server(348, 90, 60, 70, { unit: 14, label: 'caller' }); d.router(470, 120, 80, { label: 'stable proxy' });
  d.arrow(412, 125, 466, 128, { stroke: C.acc, hl: 6 });
  [0, 1, 2].forEach((i) => { d.server(460 + i * 50, 200, 36, 46, { unit: 13 }); d.line(510, 150, 478 + i * 50, 196, { stroke: C.acc, single: true }); });
  d.text(474, 274, 'proxy owns the pool: 5 × 20 = 100 sockets', { cls: 'xs', color: C.acc });
  d.text(166, 274, 'caller owns selection and its pools', { cls: 'xs' });
  return d.svg();
}
export function sd_tr_stale() {
  const d = illustration('sd_tr_stale', 'FETCHED AT 0, CHANGED AT 10, EXPIRED AT 30, ACTUALLY APPLIED AT 31', 280);
  const X = 50, s = 17;
  ruler(d, X, 170, 32 * s, 32, 4, ' s');
  d.rect(X, 100, 31 * s, 30, { r: 2, fill: C.card, stroke: C.ink2 }); d.text(X + 15 * s, 115, 'router uses the old list', { cls: 'sm' });
  d.rect(X + 10 * s, 100, 21 * s, 30, { r: 2, fill: C.accFaint, stroke: C.acc, dash: [4, 3] });
  [[n.cached_at_s, 'fetched'], [n.registry_update_s, 'registry changes'], [n.discovery_lifetime_s, 'expires']].forEach(([t, l]) => d.pin(X + t * s, 96, { label: l, dy: -36 }));
  d.line(X + n.refresh_s * s, 90, X + n.refresh_s * s, 166, { stroke: C.acc, sw: 2, single: true }); d.text(X + n.refresh_s * s, 200, 'applied at 31', { cls: 'sm', color: C.acc });
  d.text(320, 250, `${n.discovery_lifetime_s} − ${n.registry_update_s} = ${n.cache_remaining_at_update_s} s more on the old list`, { cls: 'xs' });
  return d.svg();
}
export function sd_tr_remove() {
  const d = illustration('sd_tr_remove', 'A REMOVED WRITER CAN STILL BE RUNNING; STORAGE CHECKS ITS GENERATION', 310);
  d.server(40, 80, 80, 100, { label: 'old owner (gen 7)' });
  d.db(250, 60, 100, 70, { label: 'registry' });
  d.mono(300, 150, 'lease gone', { size: 10 });
  d.arrow(244, 96, 126, 110, { stroke: C.gray, dash: [4, 4] });
  d.db(450, 120, 130, 110, { fill: C.accSoft, stroke: C.acc, label: 'storage\ncurrent gen 8' });
  d.arrow(126, 160, 442, 180, { stroke: C.acc });
  d.travel([[126, 160], [442, 180], [300, 230]], { dur: 4, label: 'gen 7 write', w: 70 });
  cross(d, 430, 180, 9);
  d.text(320, 286, 'a stale router can still reach it; the fencing check is what stops harm', { cls: 'xs' });
  return d.svg();
}
export function sd_tr_geo_path() {
  const d = illustration('sd_tr_geo_path', 'A VIEWER IN MUMBAI: DNS GIVES AN ENTRY, THE EDGE SERVES WHAT IT MAY, THE ORIGIN DECIDES', 380);
  const m = world(d, 20, 40, 600, 250, { graticule: false });
  const [ux, uy] = m.at('mumbai'), [ox, oy] = m.at('virginia'), [ex, ey] = m.at('singapore');
  d.person(ux - 8, uy + 6, 22);
  mapSite(d, m, 'singapore', 'edge', { dy: 26 });
  mapSite(d, m, 'virginia', 'balancer + app', { hot: true, dy: 28 });
  d.path(arc([ux, uy], [ex, ey], 0.3), { stroke: C.ink2, single: true });
  d.path(arc([ex, ey], [ox, oy], 0.25), { stroke: C.acc, single: true, dash: [5, 4] });
  d.travel(arc([ux, uy], [ex, ey], 0.3) + ' ' + arc([ex, ey], [ox, oy], 0.25).replace('M', 'L'), { dur: 6, r: 4 });
  const st = ['user', 'DNS', 'edge', 'load balancer', 'application'];
  st.forEach((s, i) => { const x = 60 + i * 130, hot = i === 3; chip(d, x - 50, 312, 100, s, hot, 24); if (i < 4) d.arrow(x + 52, 324, x + 78, 324, { stroke: C.gray, hl: 5 }); });
  d.text(320, 358, 'entry address · permitted cached copy · eligible endpoint · authorized state', { cls: 'xs' });
  return d.svg();
}
export function sd_tr_dns() {
  const d = illustration('sd_tr_dns', `CACHED AT 0 WITH TTL ${n.dns_ttl_s} S; THE RECORD CHANGES AT 10, THE OLD ANSWER LIVES TO 60`, 280);
  const X = 50, s = 9;
  ruler(d, X, 170, 60 * s, 60, 10, ' s');
  d.rect(X, 100, 60 * s, 30, { r: 2, fill: C.card, stroke: C.ink2 }); d.text(X + 5 * s, 115, 'old', { cls: 'xs' });
  d.rect(X + 10 * s, 100, 50 * s, 30, { r: 2, fill: C.accFaint, stroke: C.acc, dash: [4, 3] });
  d.text(X + 35 * s, 115, `${n.dns_refresh_remaining_s} s of an outdated answer`, { cls: 'sm', color: C.acc });
  d.pin(X + 10 * s, 96, { label: 'record changes', dy: -36 });
  d.line(X + 60 * s, 90, X + 60 * s, 166, { stroke: C.acc, sw: 2, single: true }); d.text(X + 60 * s, 200, 'expires', { cls: 'sm', color: C.acc });
  d.text(320, 246, 'existing connections may keep the old address even longer', { cls: 'xs' });
  return d.svg();
}
export function sd_tr_cache() {
  const d = illustration('sd_tr_cache', 'A WARM EDGE SENDS 100/S TO ORIGIN; A COLD ONE SENDS ALL 1,000/S', 320);
  panel(d, 20, 44, 292, 230, 'warm edge, 90% hits');
  d.server(50, 100, 70, 90, { unit: 16, label: 'edge' }); d.db(210, 110, 70, 70, { label: 'origin' });
  pipe(d, 126, 206, 145, 4);
  d.mono(166, 240, `${n.origin_cache_qps}/s to origin`, { size: 10 });
  panel(d, 328, 44, 292, 230, 'cold replacement edge', true);
  d.server(358, 100, 70, 90, { unit: 16, label: 'edge (empty)', fill: C.paper });
  d.db(518, 110, 70, 70, { label: 'origin', fill: C.accSoft, stroke: C.acc });
  pipe(d, 434, 514, 145, 30, true); d.flowline([[436, 145], [512, 145]], { sw: 2 });
  d.mono(474, 240, `${fmt(n.origin_cold_qps)}/s: ${n.cold_multiplier}× warm`, { size: 10, color: C.acc });
  d.text(320, 300, 'failing over to a cold edge moves the load to the origin', { cls: 'xs' });
  return d.svg();
}
export function sd_tr_region() {
const d=illustration('sd_tr_region','A NEW TRAFFIC DESTINATION STILL NEEDS A SAFE WRITE AUTHORITY',335);
  [44,397].forEach((x,i)=>{d.rect(x,54,196,235,{fill:C.paper,stroke:C.line,dash:[4,4]});d.text(x+98,76,`region ${i?'B':'A'}`,{cls:'ttl'});d.server(x+55,99,85,76,{label:i?'new route':'old route'});d.db(x+61,214,75,59);});
  d.arrow(249,138,387,138,{stroke:C.acc});d.text(319,113,'move traffic',{cls:'ttl',color:C.acc});
  d.lock(299,221,38);d.text(319,284,'fence writers',{cls:'sm'});
  d.text(320,318,'read freshness and write ownership are separate checks',{cls:'sm'});return d.svg();
}
export function sd_tr_recovery() {
  const d = illustration('sd_tr_recovery', 'LIVE 200 MB/S PLUS REPLAY 10 MB/S = 210 MB/S OUT OF THE GATEWAYS', 300);
  const X = 60, s = 2.4;
  d.rect(X, 90, 200 * s, 40, { r: 2, fill: C.card, stroke: C.ink2 }); d.text(X + 100 * s, 110, 'live 200,000,000 B/s', { cls: 'sm' });
  d.rect(X + 200 * s, 90, 10 * s, 40, { r: 2, fill: C.accSoft, stroke: C.acc });
  d.line(X + 205 * s, 136, X + 205 * s, 160, { stroke: C.acc, single: true }); d.text(X + 205 * s, 174, 'replay 10,000,000 B/s', { cls: 'xs', color: C.acc, a: 'end' });
  d.brace(X, X + 210 * s, 82, { dir: -1, label: '210,000,000 B/s combined' });
  d.text(320, 220, '1,000,000 replayed events × 200 B over 20 s = 10,000,000 B/s', { cls: 'xs' });
  d.text(320, 244, 'handshakes and history lookups need their own limits', { cls: 'xs' });
  return d.svg();
}
export function sd_tr_deadline() {
  const d = illustration('sd_tr_deadline', '250 MS DEADLINE: 100 SPENT GETTING THERE, 40 KEPT FOR THE RETURN, 110 FOR THE APP', 300);
  const X = 40, W = 560, s = W / 250;
  const seg = [[0, 100, 'DNS + TCP + TLS + routing', C.card], [100, 210, 'application budget 110', C.accSoft], [210, 250, 'return 40', C.paper]];
  seg.forEach(([a, b, t, f], i) => { d.rect(X + a * s, 90, (b - a) * s, 40, { r: 0, fill: f, stroke: i === 1 ? C.acc : C.ink2 }); d.text(X + (a + b) / 2 * s, 110, t, { cls: i === 1 ? 'ttl' : 'xs', color: i === 1 ? C.acc : undefined }); });
  ruler(d, X, 144, W, 250, 50, ' ms');
  d.rect(X + 100 * s, 190, 60 * s, 24, { r: 2, fill: C.card, stroke: C.ink2 }); d.text(X + 130 * s, 202, 'work 60', { cls: 'xs' });
  d.text(X + 185 * s, 202, '50 ms slack', { cls: 'xs', color: C.acc });
  return d.svg();
}
export function sd_tr_trace() {
  const d = illustration('sd_tr_trace', 'SIX SERIAL STAGES ADD TO 200 MS; THE APPLICATION IS THE 60 MS DECISION', 320);
  const names = ['DNS: resolve entry', 'transport: connect', 'TLS: authenticate', 'edge + routing: select', 'application: authorize, read', 'transfer: return'];
  let t = 0; const X = 200, s = 1.9;
  n.serial_route_ms.forEach((v, i) => {
    const y = 50 + i * 38, hot = i === 4;
    d.text(X - 12, y + 12, names[i], { cls: 'sm', a: 'end', color: hot ? C.acc : undefined });
    d.rect(X + t * s, y, v * s, 24, { r: 2, fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2 });
    d.mono(X + (t + v) * s + 6, y + 12, `${v}`, { size: 9.5, a: 'start' });
    t += v;
  });
  ruler(d, X, 286, 200 * s, 200, 50, ' ms');
  return d.svg();
}
export function sd_tr_write_retry() {
  const d = illustration('sd_tr_write_retry', 'THE COMMIT HAPPENED, THE RESPONSE DIDN\'T ARRIVE; A RETRY VIA ANOTHER SERVER GETS THE SAME RESULT', 330);
  d.person(40, 120, 32, { label: 'scorer' });
  d.server(230, 50, 70, 70, { unit: 15, label: 'app 1' });
  d.server(230, 200, 70, 70, { unit: 15, label: 'app 2', fill: C.accSoft, stroke: C.acc });
  d.db(460, 110, 120, 110, { label: 'K → committed' });
  d.arrow(76, 130, 224, 86, { stroke: C.ink2 }); d.arrow(306, 86, 452, 140, { stroke: C.ink2 });
  d.arrow(224, 100, 90, 140, { stroke: C.gray }); bolt(d, 150, 102, 0.6);
  d.arrow(76, 160, 224, 232, { stroke: C.acc }); d.mono(150, 214, 'retry, key K', { size: 9.5, color: C.acc });
  d.arrow(306, 232, 452, 190, { stroke: C.acc }); d.mono(380, 228, 'read K', { size: 9.5 });
  d.travel([[76, 160], [224, 232], [306, 232], [452, 190], [306, 246], [80, 176]], { dur: 6, label: 'K', w: 20 });
  d.text(320, 312, 'the retry spends what is left of the same 250 ms deadline', { cls: 'xs' });
  return d.svg();
}
export function sd_tr_sizing() {
  const d = illustration('sd_tr_sizing', 'SIZE EACH RESOURCE SEPARATELY: REQUESTS, CONNECTIONS, RECOVERY BYTES', 330);
  const rows = [['app servers, one lost', '4 × 300 = 1,200/s', 'peak 1,000/s: 200/s margin', true], ['6 gateways, one lost', '5 × 10,000 = 50,000', '50,000 viewers: no margin', false], ['7 gateways, one lost', '6 × 10,000 = 60,000', '50,000 viewers', false], ['recovery payload', 'measure the NIC', '210,000,000 B/s', false]];
  rows.forEach(([s, cap, dem, hot], i) => {
    const y = 56 + i * 62;
    if (i === 0) d.server(30, y, 40, 40, { unit: 13, fill: C.accSoft, stroke: C.acc });
    else if (i < 3) d.router(24, y + 16, 52);
    else pipe(d, 24, 76, y + 20, 14);
    d.text(90, y + 12, s, { cls: 'ttl', a: 'start', size: 12, color: hot ? C.acc : undefined });
    d.mono(90, y + 32, cap, { size: 10, a: 'start' });
    d.text(600, y + 22, dem, { cls: 'sm', a: 'end' });
  });
  d.text(320, 316, 'no row can borrow another row\'s headroom', { cls: 'xs' });
  return d.svg();
}
export function sd_tr_jobs() {
  const d = illustration('sd_tr_jobs', 'EACH LAYER OWNS ONE DECISION; ONLY THE APPLICATION OWNS THE ANSWER', 340);
  const L = [['DNS', 'which entry address'], ['edge cache', 'reuse permitted content'], ['gateway + proxy', 'policy, trusted headers'], ['balancer', 'which eligible endpoint'], ['discovery + health', 'who exists and can serve'], ['application + state', 'authorization, version, effect']];
  L.forEach(([s, t], i) => {
    const y = 46 + i * 46, hot = i === 5, w = 560 - i * 24;
    d.rect(40 + i * 12, y, w, 38, { r: 6, fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2 });
    d.text(56 + i * 12, y + 19, s, { cls: 'ttl', a: 'start', size: 12, color: hot ? C.acc : undefined });
    d.text(40 + i * 12 + w - 16, y + 19, t, { cls: 'sm', a: 'end' });
  });
  d.travel([[30, 40], [30, 320]], { dur: 5, r: 4 });
  return d.svg();
}
