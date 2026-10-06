import { C, fig, beMap, beCover, card, steps, panel, cross, tick, hourglass, hose, lanes, seg, crowd, sheet, signpost, gauge, bubble, shield, browser } from '../lib/be-kit.js';
import { pipe, bolt } from '../lib/sd-kit.js';
import { world, arc } from '../lib/world.js';

const PARTS = ['Reverse proxies', 'Nginx internals', 'Load balancing', 'TCP load balancers', 'Service discovery', 'Gateways and service meshes', 'Private networks and Tailscale', 'Sockets and connections in production', 'Cloud building blocks', 'A request across the network'];
export const where_be_net = (stage = 99) => beMap('where_be_net', PARTS, stage);

function house(d, x, y, w, o = {}) {
  d.poly([[x, y + w * 0.4], [x + w / 2, y], [x + w, y + w * 0.4]], { fill: o.fill ?? C.card, stroke: o.stroke ?? C.ink2 });
  d.rect(x + w * 0.08, y + w * 0.4, w * 0.84, w * 0.6, { r: 2, fill: C.paper, stroke: o.stroke ?? C.ink2 });
  d.rect(x + w * 0.4, y + w * 0.66, w * 0.2, w * 0.34, { r: 1, fill: C.card, stroke: o.stroke ?? C.ink2 });
  if (o.label) d.text(x + w / 2, y + w + 14, o.label, { cls: 'xs' });
}

function fence(d, x, y, h, o = {}) {
  for (let i = 0; i < 5; i++) d.rect(x + i * 9, y, 6, h, { r: 1, fill: o.fill ?? C.card, stroke: o.stroke ?? C.ink2, sw: 0.8 });
  d.line(x - 2, y + h * 0.3, x + 44, y + h * 0.3, { stroke: o.stroke ?? C.ink2, single: true }); d.line(x - 2, y + h * 0.7, x + 44, y + h * 0.7, { stroke: o.stroke ?? C.ink2, single: true });
}

export const cover_be_net = () => beCover('cover_be_net', 'XI', ['Proxies, load', 'balancers, networks'], 'From the edge of the data centre to the socket', (d, y) => {
  d.rect(220, y + 40, 120, 180, { r: 6, fill: C.accFaint, stroke: C.acc }); d.text(280, y + 60, 'proxy', { cls: 'ttl', color: C.acc });
  crowd(d, 60, y + 120, 4, { s: 26, gap: 34 });
  [0, 1, 2].forEach((i) => { d.server(420, y + 30 + i * 70, 60, 54, { unit: 12, led: (k) => k === i }); d.arrow(344, y + 130, 414, y + 57 + i * 70, { stroke: i === 1 ? C.acc : C.ink2 }); });
  house(d, 70, y + 220, 60); fence(d, 140, y + 236, 50); house(d, 480, y + 220, 60); fence(d, 430, y + 236, 50);
  d.path(`M190,${y + 260} Q320,${y + 200} 430,${y + 260}`, { stroke: C.acc, sw: 2, dash: [6, 4] }); d.hand(320, y + 300, 'a tunnel through two NATs', { size: 16 });
}, [['Proxies', 'Nginx, headers, buffering'], ['Load balancing', 'L4, L7, algorithms'], ['Discovery and meshes', 'names, gateways, sidecars'], ['Production networking', 'sockets, ports, NAT, cloud']]);

export function be_px_fwd_rev() {
  const d = fig('be_px_fwd_rev', 'A FORWARD PROXY SPEAKS FOR CLIENTS; A REVERSE PROXY SPEAKS FOR SERVERS', 320);
  panel(d, 20, 40, 290, 250, 'forward proxy'); panel(d, 330, 40, 290, 250, 'reverse proxy', true);
  [0, 1, 2].forEach((i) => d.laptop(40, 80 + i * 60, 40));
  d.rect(130, 120, 60, 80, { r: 6, fill: C.card }); d.text(160, 214, 'office proxy', { cls: 'xs' });
  d.cloud(220, 130, 80, 50, { label: 'internet' });
  [0, 1, 2].forEach((i) => d.arrow(84, 96 + i * 60, 126, 160, { stroke: C.gray, hl: 4 })); d.arrow(194, 160, 220, 156, { stroke: C.ink2, hl: 5 });
  d.text(165, 260, 'sites see the proxy, not the client', { cls: 'xs' });
  d.cloud(340, 130, 80, 50, { label: 'internet' });
  d.rect(440, 120, 60, 80, { r: 6, fill: C.accSoft, stroke: C.acc }); d.text(470, 214, 'Nginx', { cls: 'xs', color: C.acc });
  [0, 1, 2].forEach((i) => { d.server(540, 76 + i * 60, 50, 46, { unit: 12 }); d.arrow(504, 160, 536, 99 + i * 60, { stroke: C.acc, hl: 4 }); }); d.arrow(424, 156, 436, 160, { stroke: C.ink2, hl: 5 });
  d.text(475, 260, 'clients see the proxy, not the servers', { cls: 'xs' });
  return d.svg();
}

export function be_px_jobs() {
  const d = fig('be_px_jobs', 'WHAT A REVERSE PROXY DOES ON THE WAY THROUGH', 340);
  d.circle(320, 175, 110, { fill: C.accFaint, stroke: C.acc }); d.text(320, 175, 'reverse\nproxy', { cls: 'ttl', vc: true, color: C.acc });
  const j = [['TLS termination', 'decrypt once at the edge'], ['routing', 'by host and path'], ['load balancing', 'across instances'], ['compression', 'gzip, brotli'], ['static files', 'served without the app'], ['caching', 'responses at the edge'], ['buffering', 'absorb slow clients'], ['limits', 'rate, size, timeouts'], ['health checks', 'skip dead backends'], ['header rewriting', 'X-Forwarded-*']];
  j.forEach(([t, s], i) => { const a = i / j.length * 2 * Math.PI - Math.PI / 2, x = 320 + Math.cos(a) * 230, y = 175 + Math.sin(a) * 130; d.line(320 + Math.cos(a) * 58, 175 + Math.sin(a) * 58, x - Math.cos(a) * 50, y - Math.sin(a) * 14, { stroke: C.line, single: true }); d.text(x, y - 6, t, { cls: 'ttl', size: 10 }); d.text(x, y + 9, s, { cls: 'xs' }); });
  return d.svg();
}

export function be_px_xff() {
  const d = fig('be_px_xff', 'X-FORWARDED-FOR GROWS AT EACH HOP; ONLY THE ENTRIES YOUR OWN PROXIES ADDED ARE TRUSTWORTHY', 320);
  const hops = [['client', '198.51.100.7', 40], ['CDN', '203.0.113.50', 180], ['cloud LB', '10.0.1.20', 320], ['Nginx', '10.0.2.5', 460], ['app', '', 590]];
  hops.forEach(([s, ip, x], i) => { if (i === 0) d.phone(x - 12, 70, 50); else d.server(x - 24, 70, 48, 50, { unit: 12, fill: i === 4 ? C.accSoft : C.card }); d.text(x, 136, s, { cls: 'xs' }); if (ip) d.mono(x, 150, ip, { size: 8 }); if (i < 4) d.arrow(x + 28, 96, hops[i + 1][2] - 30, 96, { stroke: C.gray, hl: 5 }); });
  card(d, 30, 180, 580, ['X-Forwarded-For: 1.2.3.4, 198.51.100.7, 203.0.113.50, 10.0.1.20', '                 ↑ forged by the client   ↑ added by CDN    ↑ by LB   (Nginx adds 10.0.1.20)'], { size: 9.5 });
  d.text(320, 270, 'walk from the right, skip addresses of your own proxies, take the first one you do not trust: 198.51.100.7', { cls: 'xs', color: C.acc });
  d.text(320, 296, 'Forwarded: for=198.51.100.7;proto=https (RFC 7239) carries the same information in one standard header', { cls: 'xs' });
  return d.svg();
}

export function be_ngx_workers() {
  const d = fig('be_ngx_workers', 'NGINX: ONE MASTER, ONE WORKER PER CORE, EACH AN EVENT LOOP OVER THOUSANDS OF SOCKETS', 340);
  d.gear(320, 60, 24); d.text(320, 96, 'master: reads config, binds ports, manages workers', { cls: 'xs' });
  for (let w = 0; w < 4; w++) {
    const cx = 100 + w * 146; d.arrow(320, 108, cx, 140, { stroke: C.line, hl: 4 });
    d.circle(cx, 210, 110, { stroke: w === 1 ? C.acc : C.ink2 }); d.travel(`M${cx},155 A55,55 0 1 1 ${cx - 0.1},155`, { r: 4, dur: 2 + w * 0.3 });
    for (let k = 0; k < 18; k++) { const a = k / 18 * 2 * Math.PI; d.dot(cx + Math.cos(a) * 38, 210 + Math.sin(a) * 38, 2.2, k % 5 === 0 ? C.acc : C.gray); }
    d.text(cx, 284, `worker ${w + 1}`, { cls: 'xs' });
  }
  d.text(320, 316, '8 workers × worker_connections 10,000 = 80,000 sockets; a proxied request uses 2, so about 40,000 clients', { cls: 'xs' });
  return d.svg();
}

export function be_ngx_buffering() {
  const d = fig('be_ngx_buffering', 'PROXY BUFFERING: NGINX TAKES THE RESPONSE FAST AND FEEDS THE SLOW CLIENT ITSELF', 320);
  const y = lanes(d, ['app', 'Nginx buffer', 'slow phone'], { y: 80, gap: 70, x0: 120, x1: 610, tl: 's' });
  seg(d, 130, y(0), 60, 'send 2 MB', { hot: true, size: 8.5 }); d.text(250, y(0), 'free for the next request', { cls: 'xs', a: 'start' });
  seg(d, 130, y(1), 60, 'filled'); seg(d, 192, y(1), 400, 'draining at the phone\'s speed', { fill: C.paper, size: 9 });
  seg(d, 192, y(2), 400, 'receives over 8 s');
  d.text(320, 300, 'with proxy_buffering off, the app\'s worker or thread is tied up for all 8 s', { cls: 'xs' });
  return d.svg();
}

export function be_ngx_keepalive() {
  const d = fig('be_ngx_keepalive', 'UPSTREAM KEEPALIVE: REUSE CONNECTIONS TO THE APP INSTEAD OF OPENING ONE PER REQUEST', 320);
  panel(d, 20, 40, 290, 250, 'no keepalive', true); panel(d, 330, 40, 290, 250, 'keepalive 32');
  d.rect(40, 120, 50, 70, { r: 6, fill: C.card }); d.server(240, 110, 50, 80, { unit: 12 });
  for (let i = 0; i < 8; i++) d.during([i / 8, 1], (g) => g.line(94, 125 + i * 8, 236, 125 + i * 8, { stroke: C.acc, single: true, dash: [2, 3] }));
  d.text(165, 220, '2,000 req/s → 2,000 new connections/s\n× 60 s TIME_WAIT = 120,000 sockets', { cls: 'xs', vc: true, color: C.acc });
  d.rect(350, 120, 50, 70, { r: 6, fill: C.card }); d.server(550, 110, 50, 80, { unit: 12 });
  for (let i = 0; i < 4; i++) hose(d, 404, 135 + i * 14, 546, 135 + i * 14, { hot: i === 1, th: 2 });
  d.text(475, 220, 'a few warm connections\ncarry every request', { cls: 'xs', vc: true });
  return d.svg();
}

export function be_ngx_sendfile() {
  const d = fig('be_ngx_sendfile', 'SENDFILE: THE KERNEL MOVES FILE BYTES TO THE SOCKET WITHOUT COPYING THROUGH THE PROCESS', 320);
  panel(d, 20, 40, 290, 250, 'read() + write()'); panel(d, 330, 40, 290, 250, 'sendfile()', true);
  const stack = (x, hot) => { d.disk(x + 135, 250, 40); [['page cache', 200], ['user buffer', 140], ['socket buffer', 80]].forEach(([s, y], i) => { if (hot && i === 1) { d.rect(x + 40, y - 14, 190, 28, { r: 4, fill: C.paper, stroke: C.line, dash: [3, 3] }); d.text(x + 135, y, 'skipped', { cls: 'xs', color: C.gray }); } else { d.rect(x + 40, y - 14, 190, 28, { r: 4, fill: C.card }); d.text(x + 135, y, s, { cls: 'xs' }); } }); };
  stack(20, false); stack(330, true);
  d.carrow([[155, 228], [140, 214]], { stroke: C.ink2 }); d.arrow(155, 186, 155, 154, { stroke: C.ink2 }); d.arrow(155, 126, 155, 94, { stroke: C.ink2 }); d.text(250, 140, '2 copies,\n2 syscalls', { cls: 'xs', vc: true });
  d.carrow([[465, 228], [450, 214]], { stroke: C.acc }); d.carrow([[465, 186], [520, 140], [465, 94]], { stroke: C.acc }); d.text(560, 140, 'one syscall,\nno user copy', { cls: 'xs', vc: true, color: C.acc });
  return d.svg();
}

export function be_lb_l4_l7() {
  const d = fig('be_lb_l4_l7', 'L4 READS THE ENVELOPE; L7 OPENS IT AND READS THE LETTER', 320);
  panel(d, 20, 40, 290, 250, 'layer 4 (TCP)'); panel(d, 330, 40, 290, 250, 'layer 7 (HTTP)', true);
  d.envelope(90, 90, 150, 90, {}); d.mono(165, 200, '198.51.100.7:51234 → :443', { size: 9 }); d.text(165, 230, 'IP, port, protocol;\none decision per connection', { cls: 'xs', vc: true });
  d.doc(420, 80, 110, 120, { lines: false, fill: C.paper, stroke: C.acc }); ['GET /orders/123', 'Host: api.wren.example', 'Cookie: sess=…', 'X-Api-Version: 2'].forEach((s, i) => d.mono(428, 100 + i * 18, s, { size: 8, a: 'start' }));
  d.text(475, 230, 'host, path, headers, cookies;\none decision per request', { cls: 'xs', vc: true });
  return d.svg();
}

export function be_lb_algos() {
  const d = fig('be_lb_algos', 'SIX WAYS TO PICK A BACKEND, AND WHAT EACH ONE LOOKS AT', 340);
  const a = [['round robin', 'next in turn', [5, 5, 5, 5]], ['weighted', 'bigger gets more', [8, 4, 4, 4]], ['least connections', 'fewest open', [3, 4, 3, 4]], ['least response time', 'fastest recently', [6, 2, 6, 6]], ['random', 'coin toss', [7, 3, 6, 4]], ['power of two', 'better of 2 random', [5, 4, 5, 5]]];
  a.forEach(([t, s, v], i) => { const x = 30 + (i % 3) * 200, y = 50 + Math.floor(i / 3) * 145; d.rect(x, y, 180, 130, { r: 8, fill: i === 5 ? C.accFaint : C.paper, stroke: i === 5 ? C.acc : C.line }); d.text(x + 90, y + 18, t, { cls: 'ttl', size: 10.5 }); d.text(x + 90, y + 34, s, { cls: 'xs' }); v.forEach((h, k) => d.rect(x + 26 + k * 34, y + 118 - h * 8, 24, h * 8, { r: 2, fill: i === 5 ? C.accSoft : C.card, stroke: i === 5 ? C.acc : C.ink2 })); });
  return d.svg();
}

export function be_lb_p2c() {
  const d = fig('be_lb_p2c', 'POWER OF TWO CHOICES: PICK TWO AT RANDOM, SEND TO THE LESS LOADED', 300);
  const load = [6, 2, 5, 3, 7, 4, 2, 6];
  load.forEach((h, i) => { const x = 80 + i * 62; d.rect(x, 230 - h * 18, 40, h * 18, { r: 3, fill: [1, 4].includes(i) ? C.accSoft : C.card, stroke: [1, 4].includes(i) ? C.acc : C.ink2 }); d.mono(x + 20, 246, `b${i}`, { size: 9 }); });
  d.text(130, 60, 'sampled b1 (2) and b4 (7)', { cls: 'xs', color: C.acc }); d.arrow(130, 70, 102, 182, { stroke: C.acc });
  d.text(450, 60, 'max load with n backends: about ln ln n ÷ ln 2,\nagainst ln n ÷ ln ln n for one random pick', { cls: 'xs', vc: true });
  d.text(320, 278, 'no global view needed, so many independent balancers can use it without herding onto one backend', { cls: 'xs' });
  return d.svg();
}

export function be_lb_consistent() {
  const d = fig('be_lb_consistent', 'CONSISTENT HASHING: ADD A NODE AND ONLY ITS SLICE OF KEYS MOVES', 340);
  const cx = 200, cy = 180, r = 120;
  d.circle(cx, cy, r * 2, { stroke: C.ink2, sw: 1.4 });
  const nodes = [[0.05, 'A'], [0.3, 'B'], [0.55, 'C'], [0.8, 'D']];
  nodes.forEach(([t, s]) => { const a = t * 2 * Math.PI - Math.PI / 2; d.circle(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 26, { fill: C.card, stroke: C.ink2 }); d.text(cx + Math.cos(a) * r, cy + Math.sin(a) * r, s, { cls: 'ttl', size: 10 }); });
  d.during([0.4, 1], (g) => { const a = 0.43 * 2 * Math.PI - Math.PI / 2; g.circle(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 26, { fill: C.accSoft, stroke: C.acc }); g.text(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 'E', { cls: 'ttl', size: 10, color: C.acc }); });
  for (let k = 0; k < 24; k++) { const t = k / 24, a = t * 2 * Math.PI - Math.PI / 2; d.dot(cx + Math.cos(a) * (r - 18), cy + Math.sin(a) * (r - 18), 2.5, t > 0.3 && t < 0.43 ? C.acc : C.gray); }
  d.text(470, 110, 'hash(key) → a point on the ring;\nthe next node clockwise owns it', { cls: 'xs', vc: true });
  d.text(470, 170, 'adding E to 4 nodes moves about 1/5\nof keys, all from one neighbour', { cls: 'xs', vc: true, color: C.acc });
  d.text(470, 230, 'hash mod n moves 80% of keys\nwhen n goes from 4 to 5', { cls: 'xs', vc: true });
  d.text(470, 290, '100 to 200 virtual nodes per server\nsmooth out uneven slices', { cls: 'xs', vc: true });
  return d.svg();
}

export function be_lb_health() {
  const d = fig('be_lb_health', 'ACTIVE AND PASSIVE HEALTH CHECKS, THEN A SLOW START', 320);
  d.rect(40, 110, 80, 80, { r: 8, fill: C.card }); d.text(80, 150, 'LB', { cls: 'ttl' });
  [0, 1, 2].forEach((i) => { d.server(260, 60 + i * 80, 60, 60, { unit: 12, fill: i === 1 ? C.accSoft : C.card, stroke: i === 1 ? C.acc : C.ink2 }); d.arrow(124, 150, 254, 90 + i * 80, { stroke: i === 1 ? C.acc : C.line, hl: 5, dash: i === 1 ? [3, 3] : undefined }); });
  cross(d, 340, 170, 8);
  d.text(470, 70, 'active: GET /healthz every 5 s;\n2 failures → out, 3 passes → in', { cls: 'xs', vc: true });
  d.text(470, 140, 'passive: 5 consecutive 5xx or\nresets on real traffic → eject 30 s', { cls: 'xs', vc: true, color: C.acc });
  const M = d.axes(380, 200, 220, 80, { xmin: 0, xmax: 60, ymin: 0, ymax: 1, xl: 's', yl: 'share' });
  d.fn((t) => Math.min(1, t / 30), 0, 60, M, { stroke: C.slate }); d.text(500, 300, 'slow start over 30 s', { cls: 'xs' });
  return d.svg();
}

export function be_lb_drain() {
  const d = fig('be_lb_drain', 'CONNECTION DRAINING: STOP SENDING NEW WORK, LET OLD WORK FINISH, THEN STOP', 300);
  const y = lanes(d, ['instance', 'new requests', 'in flight'], { y: 70, gap: 60, x0: 120, x1: 610, tl: 's' });
  const X = (s) => 130 + s * 14;
  seg(d, X(0), y(0), X(10) - X(0), 'serving'); seg(d, X(10), y(0), X(30) - X(10), 'draining', { hot: true }); seg(d, X(30), y(0), 40, 'exit', { size: 8.5 });
  seg(d, X(0), y(1), X(10) - X(0), 'routed here'); d.text(X(10) + 6, y(1), 'removed from the pool', { cls: 'xs', a: 'start' });
  seg(d, X(0), y(2), X(24) - X(0), 'finish naturally, up to 20 s');
  d.text(320, 270, 'SIGTERM → fail readiness → wait for the LB to notice → finish in-flight → close idle keep-alives → exit', { cls: 'xs' });
  return d.svg();
}

export function be_lb_sticky() {
  const d = fig('be_lb_sticky', 'STICKY SESSIONS PIN A USER TO ONE BACKEND, AND ITS FATE', 300);
  d.person(60, 110, 40); card(d, 100, 70, 170, ['Cookie: lb=backend-2'], { size: 9.5 });
  d.rect(300, 110, 60, 80, { r: 6, fill: C.card }); d.text(330, 206, 'LB', { cls: 'xs' });
  [0, 1, 2].forEach((i) => { d.server(450, 50 + i * 75, 60, 56, { unit: 12, fill: i === 1 ? C.accSoft : C.card, stroke: i === 1 ? C.acc : C.ink2 }); d.arrow(364, 150, 444, 78 + i * 75, { stroke: i === 1 ? C.acc : C.line, hl: 5 }); });
  d.during([0.5, 1], (g) => cross(g, 480, 153, 22));
  d.text(320, 270, 'useful for in-memory session state or warm caches; when backend 2 dies, its users lose their state', { cls: 'xs' });
  return d.svg();
}

export function be_tcp_full_proxy() {
  const d = fig('be_tcp_full_proxy', 'A FULL PROXY TERMINATES ONE CONNECTION AND OPENS ANOTHER', 260);
  d.phone(40, 90, 70); d.rect(270, 90, 100, 80, { r: 8, fill: C.accFaint, stroke: C.acc }); d.text(320, 130, 'L4 proxy', { cls: 'ttl', color: C.acc }); d.server(540, 90, 60, 80, { unit: 12 });
  hose(d, 80, 125, 266, 125, { hot: true }); hose(d, 374, 125, 536, 125, { hot: true, reverse: true });
  d.text(173, 104, 'connection 1', { cls: 'xs' }); d.text(455, 104, 'connection 2', { cls: 'xs' });
  d.text(320, 212, 'two TCP handshakes, two sets of buffers; the server sees the proxy\'s address unless told otherwise', { cls: 'xs' });
  return d.svg();
}

export function be_tcp_nat_dsr() {
  const d = fig('be_tcp_nat_dsr', 'NAT MODE SENDS REPLIES BACK THROUGH THE BALANCER; DSR LETS SERVERS REPLY DIRECTLY', 320);
  panel(d, 20, 40, 290, 250, 'NAT'); panel(d, 330, 40, 290, 250, 'direct server return', true);
  d.phone(40, 120, 60); d.rect(130, 120, 50, 60, { r: 6, fill: C.card }); d.server(240, 120, 50, 60, { unit: 12 });
  d.arrow(74, 140, 126, 140, { stroke: C.ink2, hl: 4 }); d.arrow(184, 140, 236, 140, { stroke: C.ink2, hl: 4 }); d.arrow(236, 165, 184, 165, { stroke: C.acc, hl: 4 }); d.arrow(126, 165, 74, 165, { stroke: C.acc, hl: 4 });
  d.text(165, 230, 'every response byte passes\nthe balancer', { cls: 'xs', vc: true });
  d.phone(350, 120, 60); d.rect(440, 80, 50, 60, { r: 6, fill: C.card }); d.server(550, 140, 50, 60, { unit: 12 });
  d.arrow(384, 130, 436, 110, { stroke: C.ink2, hl: 4 }); d.arrow(494, 116, 546, 160, { stroke: C.ink2, hl: 4 });
  d.carrow([[546, 190], [470, 230], [386, 170]], { stroke: C.acc, sw: 2.2 }); d.text(475, 256, 'responses, often 10× the requests,\nskip the balancer entirely', { cls: 'xs', vc: true, color: C.acc });
  return d.svg();
}

export function be_tcp_proxy_protocol() {
  const d = fig('be_tcp_proxy_protocol', 'THE PROXY PROTOCOL: ONE LINE IN FRONT OF THE STREAM SAYS WHO THE CLIENT REALLY WAS', 260);
  d.rect(40, 90, 420, 40, { r: 4, fill: C.accSoft, stroke: C.acc }); d.mono(250, 110, 'PROXY TCP4 198.51.100.7 203.0.113.10 51234 443\\r\\n', { size: 10, color: C.acc });
  d.rect(460, 90, 140, 40, { r: 4, fill: C.card }); d.mono(530, 110, 'TLS ClientHello…', { size: 9.5 });
  [['source IP', 140], ['dest IP', 245], ['ports', 340]].forEach(([s, x]) => d.text(x, 150, s, { cls: 'xs' }));
  d.text(320, 200, 'v1 is this text line; v2 is a binary header with optional fields such as TLS details', { cls: 'sm' });
  d.text(320, 228, 'both sides must agree to use it, or the backend reads "PROXY …" as garbage', { cls: 'xs' });
  return d.svg();
}

export function be_tcp_long_lived() {
  const d = fig('be_tcp_long_lived', 'AFTER SCALING OUT, LONG-LIVED HTTP/2 CONNECTIONS STAY ON THE OLD PODS', 320);
  panel(d, 20, 40, 290, 250, 'L4: balance connections', true); panel(d, 330, 40, 290, 250, 'L7: balance requests');
  [9, 9, 9, 0, 0, 0].forEach((h, i) => { const x = 46 + i * 42; d.rect(x, 250 - h * 18, 30, Math.max(3, h * 18), { r: 2, fill: i < 3 ? C.accSoft : C.card, stroke: i < 3 ? C.acc : C.ink2 }); d.mono(x + 15, 266, i < 3 ? 'old' : 'new', { size: 8 }); });
  [4.5, 4.5, 4.5, 4.5, 4.5, 4.5].forEach((h, i) => { const x = 356 + i * 42; d.rect(x, 250 - h * 18, 30, h * 18, { r: 2, fill: C.card, stroke: C.ink2 }); });
  d.text(165, 80, 'gRPC clients keep their connections\nfor hours; new pods get nothing', { cls: 'xs', vc: true });
  d.text(475, 80, 'each request picks a backend, so\nnew pods share the load at once', { cls: 'xs', vc: true });
  return d.svg();
}

export function be_sd_discovery() {
  const d = fig('be_sd_discovery', 'CLIENT-SIDE AND SERVER-SIDE DISCOVERY', 320);
  panel(d, 20, 40, 290, 250, 'client-side'); panel(d, 330, 40, 290, 250, 'server-side', true);
  d.server(40, 140, 50, 60, { unit: 12, label: 'orders' }); d.db(150, 70, 80, 50, { label: 'registry', size: 9 }); d.arrow(70, 136, 150, 104, { stroke: C.ink2, hl: 5 }); d.text(96, 108, '1 where?', { cls: 'xs' });
  [0, 1].forEach((i) => d.server(220, 150 + i * 56, 50, 44, { unit: 12 })); d.arrow(94, 170, 216, 172, { stroke: C.acc, hl: 5 }); d.text(150, 196, '2 call directly', { cls: 'xs', color: C.acc });
  d.server(350, 140, 50, 60, { unit: 12, label: 'orders' }); d.rect(440, 140, 50, 60, { r: 6, fill: C.accSoft, stroke: C.acc }); d.text(465, 216, 'LB / proxy', { cls: 'xs' }); d.db(440, 60, 60, 44, { label: 'registry', size: 8.5 }); d.arrow(465, 136, 470, 108, { stroke: C.ink2, hl: 4 });
  [0, 1].forEach((i) => d.server(550, 130 + i * 56, 50, 44, { unit: 12 })); d.arrow(404, 170, 436, 170, { stroke: C.ink2, hl: 4 }); d.arrow(494, 170, 546, 152, { stroke: C.ink2, hl: 4 });
  d.text(165, 270, 'smart clients, one fewer hop', { cls: 'xs' }); d.text(475, 270, 'simple clients, one more hop', { cls: 'xs' });
  return d.svg();
}

export function be_sd_registry() {
  const d = fig('be_sd_registry', 'A SERVICE REGISTRY WITH HEARTBEATS: SILENT INSTANCES DROP OUT', 300);
  d.db(260, 60, 120, 100, { label: 'Consul / etcd', stroke: C.acc, fill: C.accFaint });
  [0, 1, 2].forEach((i) => { const x = 80 + i * 240; d.server(x - 30, 200, 60, 56, { unit: 12 }); d.text(x, 270, `payments-${i + 1}`, { cls: 'xs' }); if (i !== 2) d.travel([[x, 196], [320, 162]], { r: 3, at: [i * 0.2, i * 0.2 + 0.3] }); });
  d.during([0.5, 1], (g) => cross(g, 560, 228, 18));
  d.text(500, 100, 'TTL check 15 s:\nno heartbeat, no entry', { cls: 'xs', vc: true });
  return d.svg();
}

export function be_sd_k8s() {
  const d = fig('be_sd_k8s', 'A KUBERNETES SERVICE: A STABLE NAME AND IP IN FRONT OF CHANGING PODS', 320);
  d.mono(320, 52, 'payments.default.svc.cluster.local → 10.96.14.7', { size: 10 });
  d.server(40, 120, 60, 70, { unit: 12, label: 'orders pod' });
  d.rect(190, 110, 120, 90, { r: 8, fill: C.accFaint, stroke: C.acc }); d.text(250, 140, 'ClusterIP', { cls: 'ttl', size: 11, color: C.acc }); d.text(250, 162, 'kube-proxy rules\n(iptables / IPVS)', { cls: 'xs', vc: true });
  d.arrow(104, 155, 186, 155, { stroke: C.ink2 });
  [0, 1, 2].forEach((i) => { d.server(420, 70 + i * 70, 60, 54, { unit: 12, fill: i === 2 ? C.paper : C.card, stroke: i === 2 ? C.line : C.ink2 }); d.mono(500, 97 + i * 70, ['10.244.1.8', '10.244.2.3', 'not ready'][i], { size: 8.5, a: 'start' }); if (i < 2) d.arrow(314, 155, 416, 97 + i * 70, { stroke: C.acc, hl: 5 }); });
  d.text(320, 300, 'EndpointSlices list ready pods; headless Services return pod IPs directly from DNS', { cls: 'xs' });
  return d.svg();
}

export function be_gw_jobs() {
  const d = fig('be_gw_jobs', 'AN API GATEWAY IS A TOLL PLAZA: EVERY REQUEST STOPS ONCE, THEN TAKES ITS LANE', 320);
  for (let i = 0; i < 5; i++) { d.rect(200, 60 + i * 44, 80, 36, { r: 4, fill: C.card }); d.line(280, 78 + i * 44, 300, 78 + i * 44, { stroke: C.acc, sw: 3, single: true }); }
  ['TLS + auth', 'rate limits, quotas', 'routing, versions', 'transforms', 'logs, metrics'].forEach((s, i) => d.text(240, 78 + i * 44, s, { cls: 'xs' }));
  crowd(d, 60, 140, 3, { s: 24, gap: 36 });
  [['users', 100], ['orders', 170], ['payments', 240]].forEach(([s, y]) => { d.server(460, y - 26, 50, 50, { unit: 12 }); d.text(530, y, s, { cls: 'sm', a: 'start' }); d.arrow(304, 170, 456, y, { stroke: C.gray, hl: 5 }); });
  return d.svg();
}

export function be_gw_not() {
  const d = fig('be_gw_not', 'KEEP THE GATEWAY DUMB AND THE SERVICES SMART', 300);
  panel(d, 20, 40, 290, 230, 'gateway with business logic', true); panel(d, 330, 40, 290, 230, 'thin gateway, optional BFFs');
  d.rect(60, 80, 210, 120, { r: 8, fill: C.accSoft, stroke: C.acc }); ['pricing rules', 'order validation', 'per-client joins', 'feature logic'].forEach((s, i) => d.text(165, 100 + i * 24, s, { cls: 'xs', color: C.acc }));
  d.text(165, 236, 'every team waits on one\nshared deploy', { cls: 'xs', vc: true });
  d.rect(370, 80, 210, 30, { r: 6, fill: C.card }); d.text(475, 95, 'gateway: auth, limits, routing', { cls: 'xs' });
  [['web BFF', 400], ['mobile BFF', 520]].forEach(([s, x]) => { d.rect(x - 40, 140, 80, 40, { r: 6, fill: C.paper }); d.text(x, 160, s, { cls: 'xs' }); });
  d.text(475, 236, 'client-specific shaping lives in\nservices owned by those teams', { cls: 'xs', vc: true });
  return d.svg();
}

export function be_mesh_sidecar() {
  const d = fig('be_mesh_sidecar', 'A SERVICE MESH: EVERY POD GETS A PROXY, AND A CONTROL PLANE PROGRAMS THEM ALL', 340);
  d.rect(220, 40, 200, 50, { r: 8, fill: C.accFaint, stroke: C.acc }); d.text(320, 65, 'control plane (istiod)', { cls: 'ttl', size: 11, color: C.acc });
  [['orders', 100], ['payments', 320], ['kitchen', 540]].forEach(([s, x], i) => { d.rect(x - 70, 160, 140, 110, { r: 10, fill: C.paper }); d.server(x - 60, 190, 50, 60, { unit: 12 }); d.rect(x + 10, 200, 50, 40, { r: 6, fill: C.accSoft, stroke: C.acc }); d.text(x + 35, 220, 'Envoy', { cls: 'xs' }); d.text(x, 286, s, { cls: 'xs' }); d.line(320, 92, x + 35, 196, { stroke: C.acc, dash: [3, 3], single: true }); });
  d.arrow(164, 225, 324, 225, { stroke: C.ink2 }); d.arrow(384, 225, 544, 225, { stroke: C.ink2 });
  d.text(320, 120, 'xDS: routes, clusters, certificates, policies', { cls: 'xs' });
  d.text(320, 320, 'the app talks plain HTTP to localhost; the sidecars do mTLS, retries, breaking and metrics', { cls: 'xs' });
  return d.svg();
}

export function be_mesh_mtls() {
  const d = fig('be_mesh_mtls', 'MUTUAL TLS BETWEEN SIDECARS: BOTH SIDES PROVE A WORKLOAD IDENTITY', 280);
  d.rect(60, 90, 140, 80, { r: 8, fill: C.card }); d.text(130, 110, 'orders sidecar', { cls: 'xs' }); d.doc(100, 120, 60, 40, { lines: false, fill: C.paper });
  d.rect(440, 90, 140, 80, { r: 8, fill: C.card }); d.text(510, 110, 'payments sidecar', { cls: 'xs' }); d.doc(480, 120, 60, 40, { lines: false, fill: C.paper });
  d.lock(305, 110, 30, { stroke: C.acc, fill: C.accSoft }); d.arrow(204, 130, 296, 130, { stroke: C.acc, both: true }); d.arrow(344, 130, 436, 130, { stroke: C.acc, both: true });
  d.mono(130, 190, 'spiffe://wren/ns/prod/sa/orders', { size: 8 }); d.mono(510, 190, 'spiffe://wren/ns/prod/sa/payments', { size: 8 });
  d.text(320, 240, 'certificates last hours and rotate automatically; policy says orders may call payments, nothing else may', { cls: 'xs' });
  return d.svg();
}

export function be_mesh_cost() {
  const d = fig('be_mesh_cost', 'WHAT A SIDECAR MESH COSTS (ILLUSTRATIVE)', 300);
  [['memory', '400 pods × 50 MB = 20 GB'], ['latency', '2 extra proxy hops per call'], ['CPU', 'TLS and parsing in every hop'], ['operations', 'upgrades, config, debugging two layers']].forEach(([t, s], i) => { const y = 60 + i * 52; d.text(150, y, t, { cls: 'ttl', a: 'end' }); d.rect(170, y - 14, 300, 28, { r: 4, fill: i === 3 ? C.accSoft : C.card, stroke: i === 3 ? C.acc : C.ink2 }); d.text(320, y, s, { cls: 'xs' }); });
  d.text(320, 280, 'sidecarless designs (Istio ambient, Cilium with eBPF) move the work to per-node proxies', { cls: 'xs' });
  return d.svg();
}

export function be_wg_tunnel() {
  const d = fig('be_wg_tunnel', 'WIREGUARD: PEERS KNOW EACH OTHER BY PUBLIC KEY AND TALK IN ENCRYPTED UDP', 300);
  d.laptop(40, 100, 90); d.text(85, 180, 'laptop', { cls: 'xs' }); d.key(60, 210, 30, { stroke: C.acc }); d.mono(110, 212, 'pub: Xq3…', { size: 8.5, a: 'start' });
  d.server(520, 90, 80, 90, { label: 'db-bastion' }); d.key(530, 220, 30, { stroke: C.acc }); d.mono(580, 222, 'pub: 9kL…', { size: 8.5 });
  pipe(d, 150, 500, 135, 40, true);
  for (let i = 0; i < 3; i++) d.travel([[160, 135], [490, 135]], { token: 'packet', at: [i * 0.3, i * 0.3 + 0.4] });
  d.text(325, 100, 'UDP 51820, ChaCha20-Poly1305', { cls: 'mono', size: 9 });
  d.text(320, 270, 'Curve25519 keys, a 1-RTT handshake, in the Linux kernel since 5.6; silent to anyone without a key', { cls: 'xs' });
  return d.svg();
}

export function be_nat_problem() {
  const d = fig('be_nat_problem', 'TWO DEVICES BEHIND TWO NATS: NEITHER HAS AN ADDRESS THE OTHER CAN DIAL', 300);
  house(d, 40, 100, 90, { label: 'laptop 192.168.1.20' }); fence(d, 150, 120, 80); d.mono(172, 214, 'NAT 198.51.100.7', { size: 8.5 });
  house(d, 510, 100, 90, { label: 'server 10.0.3.9' }); fence(d, 450, 120, 80); d.mono(472, 214, 'NAT 203.0.113.80', { size: 8.5 });
  d.cloud(260, 90, 120, 70, { label: 'internet' });
  d.arrow(390, 140, 446, 140, { stroke: C.acc }); cross(d, 430, 160, 9);
  d.text(320, 260, 'a NAT drops unsolicited inbound packets, because it has no mapping saying where they should go', { cls: 'xs' });
  return d.svg();
}

export function be_nat_punch() {
  const d = fig('be_nat_punch', 'UDP HOLE PUNCHING: LEARN YOUR PUBLIC ADDRESS, SHARE IT, AND SEND AT THE SAME TIME', 340);
  const y = lanes(d, ['laptop', 'STUN / coord', 'server'], { y: 80, gap: 80, x0: 120, x1: 610, time: false });
  d.arrow(140, y(0), 140, y(1) - 10, { stroke: C.ink2, hl: 5 }); d.text(150, (y(0) + y(1)) / 2, '1 who am I?', { cls: 'xs', a: 'start' });
  d.arrow(160, y(1) - 10, 160, y(0) + 10, { stroke: C.ink2, hl: 5, dash: [3, 3] }); d.text(170, y(0) + 26, '198.51.100.7:41641', { cls: 'mono', size: 8.5, a: 'start' });
  d.arrow(240, y(2), 240, y(1) + 10, { stroke: C.ink2, hl: 5 }); d.text(250, y(2) - 26, '203.0.113.80:52010', { cls: 'mono', size: 8.5, a: 'start' });
  d.text(380, y(1), '2 exchange endpoints through the coordinator', { cls: 'xs' });
  d.arrow(470, y(0), 560, y(2) - 10, { stroke: C.acc }); d.arrow(470, y(2), 560, y(0) + 10, { stroke: C.acc }); d.text(520, y(1) - 20, '3 both send', { cls: 'xs', color: C.acc });
  d.text(320, 320, 'each outgoing packet opens a mapping in its own NAT, so the other side\'s packets are let in', { cls: 'xs' });
  return d.svg();
}

export function be_ts_planes() {
  const d = fig('be_ts_planes', 'TAILSCALE: A CONTROL PLANE THAT HANDS OUT KEYS, A DATA PLANE THAT GOES DIRECT', 340);
  d.cloud(240, 40, 160, 70, { label: 'coordination server' });
  d.laptop(40, 170, 80); d.server(540, 160, 60, 80, { label: 'db-bastion' });
  d.line(80, 166, 270, 110, { stroke: C.ink2, dash: [3, 3], single: true }); d.line(570, 156, 380, 110, { stroke: C.ink2, dash: [3, 3], single: true }); d.text(160, 120, 'keys, endpoints, ACLs', { cls: 'xs' });
  pipe(d, 130, 530, 200, 22, true); d.text(330, 186, 'direct WireGuard (after hole punching)', { cls: 'xs', color: C.acc });
  d.circle(330, 290, 60, { fill: C.card, stroke: C.ink2 }); d.text(330, 290, 'DERP', { cls: 'xs' });
  d.carrow([[90, 230], [200, 300], [300, 292]], { stroke: C.gray, dash: [4, 3] }); d.carrow([[360, 292], [460, 300], [560, 248]], { stroke: C.gray, dash: [4, 3] });
  d.text(330, 330, 'relay over HTTPS when no direct path exists; still end-to-end encrypted', { cls: 'xs' });
  return d.svg();
}

export function be_ts_features() {
  const d = fig('be_ts_features', 'WHAT A TAILNET ADDS ON TOP OF THE TUNNELS', 320);
  [['MagicDNS', 'db-bastion → 100.101.7.3'], ['ACLs / grants', 'group:oncall may reach tag:db:5432'], ['subnet router', 'reach 10.0.0.0/16 without agents'], ['exit node', 'send all traffic out via one node']].forEach(([t, s], i) => { const x = 30 + (i % 2) * 300, y = 50 + Math.floor(i / 2) * 130; d.rect(x, y, 280, 110, { r: 8, fill: i === 1 ? C.accFaint : C.paper, stroke: i === 1 ? C.acc : C.line }); d.text(x + 140, y + 24, t, { cls: 'ttl' }); d.text(x + 140, y + 60, s, { cls: 'mono', size: 9 }); });
  d.text(320, 304, 'identity comes from the device key plus the user\'s SSO login; keys expire and rotate', { cls: 'xs' });
  return d.svg();
}

export function be_sock_queues() {
  const d = fig('be_sock_queues', 'A LISTENING SOCKET HAS TWO WAITING ROOMS', 320);
  d.rect(60, 80, 200, 150, { r: 8, fill: C.paper }); d.text(160, 70, 'SYN queue (half open)', { cls: 'xs' });
  for (let i = 0; i < 5; i++) d.envelope(80 + (i % 3) * 56, 110 + Math.floor(i / 3) * 50, 40, 26, { label: 'SYN', stroke: C.ink2 });
  d.arrow(264, 155, 324, 155, { stroke: C.gray }); d.text(294, 140, 'ACK', { cls: 'mono', size: 9 });
  d.rect(330, 80, 200, 150, { r: 8, fill: C.accFaint, stroke: C.acc }); d.text(430, 70, 'accept queue (backlog)', { cls: 'xs', color: C.acc });
  crowd(d, 350, 120, 6, { s: 22, gap: 28, hot: () => true });
  d.gear(580, 155, 20, { spin: 3 }); d.text(580, 190, 'accept()', { cls: 'mono', size: 9 }); d.arrow(534, 155, 558, 155, { stroke: C.ink2, hl: 4 });
  d.text(320, 270, 'listen(fd, backlog) is capped by net.core.somaxconn, 4,096 by default since Linux 5.4 (128 before)', { cls: 'xs' });
  d.text(320, 296, 'a full accept queue drops or resets new connections while the app looks idle', { cls: 'xs', color: C.acc });
  return d.svg();
}

export function be_sock_states() {
  const d = fig('be_sock_states', 'THE TWO CLOSING STATES THAT MATTER IN PRODUCTION', 300);
  const y = lanes(d, ['side that closes first', 'side that closes second'], { y: 90, gap: 100, x0: 170, x1: 610, time: false });
  seg(d, 180, y(0), 90, 'FIN_WAIT'); seg(d, 290, y(0), 200, 'TIME_WAIT 60 s', { hot: true }); seg(d, 500, y(0), 70, 'CLOSED');
  seg(d, 180, y(1), 160, 'CLOSE_WAIT', { hot: true }); seg(d, 350, y(1), 90, 'LAST_ACK'); seg(d, 450, y(1), 70, 'CLOSED');
  d.text(320, 250, 'many TIME_WAIT: lots of short connections you closed; many CLOSE_WAIT: your code never calls close()', { cls: 'xs' });
  return d.svg();
}

export function be_sock_ephemeral() {
  const d = fig('be_sock_ephemeral', 'EPHEMERAL PORTS: 28,232 PER DESTINATION, EACH HELD 60 S IN TIME_WAIT', 300);
  for (let r = 0; r < 8; r++) for (let c = 0; c < 40; c++) { const k = r * 40 + c; d.during([k / 320 * 0.9, 1], (g) => g.fillRect(60 + c * 13, 60 + r * 16, 11, 13, C.acc, 0.7)); d.rect(60 + c * 13, 60 + r * 16, 11, 13, { r: 1, stroke: C.line, sw: 0.4, single: true }); }
  d.text(320, 210, 'net.ipv4.ip_local_port_range 32768 to 60999', { cls: 'mono', size: 10 });
  d.text(320, 236, '28,232 ÷ 60 s ≈ 470 new connections per second to one ip:port before ports run out', { cls: 'mono', size: 10, color: C.acc });
  d.text(320, 266, 'fix with keep-alive and pooling first; then more destination IPs, wider ranges, tcp_tw_reuse', { cls: 'xs' });
  return d.svg();
}

export function be_sock_keepalive() {
  const d = fig('be_sock_keepalive', 'AN IDLE CONNECTION THROUGH A NAT: SILENTLY DROPPED AFTER 350 S', 300);
  const X = (s) => 60 + s * 1.1;
  seg(d, X(0), 100, X(350) - X(0), 'idle, no packets', { fill: C.paper, dash: [4, 3] }); d.text(X(350), 80, 'NAT forgets the mapping', { cls: 'xs', color: C.acc }); cross(d, X(350), 100, 8);
  seg(d, X(360), 100, 70, 'next query', { hot: true, size: 8.5 }); d.text(X(400), 130, 'hangs, then reset', { cls: 'xs' });
  [60, 120, 180, 240, 300].forEach((s) => d.line(X(s), 160, X(s), 176, { stroke: C.ink2, sw: 1.6, single: true }));
  seg(d, X(0), 190, X(420) - X(0), 'TCP keepalive every 60 s keeps the mapping alive', { size: 9 });
  d.text(320, 250, 'Linux default keepalive starts after 7,200 s idle, far too late for NAT, load balancer or firewall timeouts', { cls: 'xs' });
  return d.svg();
}

export function be_sock_cpu20() {
  const d = fig('be_sock_cpu20', 'CPU 20%, MEMORY 40%, AND THE SERVICE IS DOWN', 320);
  gauge(d, 100, 130, 60, 0.2, { value: 'CPU 20%' }); gauge(d, 250, 130, 60, 0.4, { value: 'RAM 40%' });
  [['file descriptors', 1], ['ephemeral ports', 0.98], ['conntrack table', 0.97], ['accept queue', 1]].forEach(([s, v], i) => { const x = 380 + (i % 2) * 130, y = 100 + Math.floor(i / 2) * 120; gauge(d, x, y, 46, v, { hot: true }); d.text(x, y + 20, s, { cls: 'xs' }); });
  d.text(320, 270, 'ss -s, ls /proc/<pid>/fd | wc -l, netstat -s | grep overflow, dmesg | grep conntrack', { cls: 'mono', size: 9 });
  d.text(320, 296, 'the limits that fail first are often not the ones on the dashboard', { cls: 'xs' });
  return d.svg();
}

export function be_cloud_compute() {
  const d = fig('be_cloud_compute', 'VM, CONTAINER, SERVERLESS: A HOUSE, A FLAT, A HOTEL ROOM', 300);
  house(d, 70, 80, 110, { label: 'VM: your own OS, minutes to boot' });
  d.rect(270, 70, 110, 140, { r: 2, fill: C.card }); for (let r = 0; r < 4; r++) for (let c = 0; c < 2; c++) d.rect(284 + c * 46, 84 + r * 32, 36, 22, { r: 1, fill: r === 1 && c === 0 ? C.accSoft : C.paper, stroke: C.line }); d.text(325, 226, 'container: shared kernel, seconds', { cls: 'xs' });
  d.rect(470, 90, 110, 110, { r: 2, fill: C.paper }); d.rect(490, 120, 70, 40, { r: 6, fill: C.card }); d.key(500, 180, 26, { stroke: C.acc }); d.text(525, 226, 'serverless: per request, milliseconds', { cls: 'xs' });
  d.text(320, 270, 'less to manage at each step, and less control over runtime, limits and cold starts', { cls: 'xs' });
  return d.svg();
}

export function be_cloud_vpc() {
  const d = fig('be_cloud_vpc', 'A VPC ACROSS TWO ZONES: PUBLIC SUBNETS FOR THE EDGE, PRIVATE ONES FOR EVERYTHING ELSE', 360);
  d.rect(30, 50, 580, 290, { r: 12, fill: C.paper, stroke: C.ink2 }); d.text(50, 66, 'VPC 10.0.0.0/16', { cls: 'mono', size: 9.5, a: 'start' });
  [0, 1].forEach((z) => { const x = 50 + z * 285; d.rect(x, 80, 265, 250, { r: 8, stroke: C.line, dash: [4, 3] }); d.text(x + 132, 96, `zone ${z === 0 ? 'a' : 'b'}`, { cls: 'xs' });
    d.rect(x + 12, 106, 241, 70, { r: 6, fill: C.slateSoft, stroke: C.slate }); d.text(x + 132, 120, `public 10.0.${z}.0/24`, { cls: 'mono', size: 8.5 }); d.rect(x + 30, 132, 80, 34, { r: 4, fill: C.card }); d.text(x + 70, 149, 'LB node', { cls: 'xs' }); d.rect(x + 150, 132, 80, 34, { r: 4, fill: C.card }); d.text(x + 190, 149, 'NAT gateway', { cls: 'xs' });
    d.rect(x + 12, 190, 241, 130, { r: 6, fill: C.accFaint, stroke: C.acc }); d.text(x + 132, 204, `private 10.0.${10 + z}.0/24`, { cls: 'mono', size: 8.5 }); [0, 1, 2].forEach((k) => d.server(x + 30 + k * 72, 218, 44, 52, { unit: 12 })); d.db(x + 90, 280, 80, 34, { label: z ? 'replica' : 'primary', size: 8.5 }); });
  d.cloud(260, 0, 120, 44, { label: 'internet gateway', size: 9 });
  return d.svg();
}

export function be_cloud_sg() {
  const d = fig('be_cloud_sg', 'SECURITY GROUPS FOLLOW INSTANCES; NETWORK ACLS GUARD SUBNETS', 300);
  panel(d, 20, 40, 290, 230, 'security group', true); panel(d, 330, 40, 290, 230, 'network ACL');
  d.server(130, 110, 70, 80, {}); d.circle(165, 150, 150, { stroke: C.acc, dash: [5, 4] });
  d.text(165, 240, 'stateful: replies allowed\nautomatically; allow rules only;\nreference other groups', { cls: 'xs', vc: true });
  d.rect(370, 90, 210, 110, { r: 6, stroke: C.ink2, dash: [5, 4] }); [0, 1, 2].forEach((k) => d.server(390 + k * 66, 115, 44, 56, { unit: 12 }));
  d.text(475, 240, 'stateless: return traffic needs\nits own rule; numbered allow\nand deny rules', { cls: 'xs', vc: true });
  return d.svg();
}

export function be_cloud_regions() {
  const d = fig('be_cloud_regions', 'REGIONS ARE FAR APART; ZONES INSIDE A REGION ARE CLOSE BUT INDEPENDENT', 320);
  const m = world(d, 20, 40, 400, 220, { lat: [-50, 75] });
  ['mumbai', 'singapore', 'frankfurt', 'virginia', 'tokyo'].forEach((c, i) => { const [x, y] = m.at(c); d.circle(x, y, 12, { fill: i === 0 ? C.accSoft : C.card, stroke: i === 0 ? C.acc : C.ink2 }); });
  d.circle(530, 150, 170, { stroke: C.acc, dash: [5, 4] }); d.text(530, 54, 'region ap-south-1', { cls: 'xs', color: C.acc });
  [[490, 110, 'zone a'], [570, 110, 'zone b'], [530, 190, 'zone c']].forEach(([x, y, s]) => { d.rect(x - 30, y - 22, 60, 44, { r: 6, fill: C.card }); d.text(x, y, s, { cls: 'xs' }); });
  d.text(530, 250, 'zones ~1 to 2 ms apart, separate\npower and network; regions tens\nto hundreds of ms apart', { cls: 'xs', vc: true });
  return d.svg();
}

export function be_cloud_iam() {
  const d = fig('be_cloud_iam', 'IAM: A WORKLOAD ASSUMES A ROLE AND GETS SHORT-LIVED CREDENTIALS', 280);
  d.server(40, 90, 70, 80, { label: 'orders pod' });
  d.rect(190, 90, 130, 80, { r: 8, fill: C.accFaint, stroke: C.acc }); d.text(255, 116, 'role: orders-prod', { cls: 'xs', color: C.acc }); d.mono(255, 140, 's3:GetObject on', { size: 8 }); d.mono(255, 154, 'wren-receipts/*', { size: 8 });
  d.key(360, 130, 34, { stroke: C.acc }); d.text(380, 160, '1 h credentials', { cls: 'xs' });
  d.db(470, 90, 120, 80, { label: 'object storage' });
  d.arrow(114, 130, 186, 130, { stroke: C.ink2, hl: 5 }); d.arrow(324, 130, 352, 130, { stroke: C.ink2, hl: 5 }); d.arrow(400, 130, 466, 130, { stroke: C.acc, hl: 5 });
  d.text(320, 230, 'no long-lived keys in the pod; identity comes from the platform, permissions from the role', { cls: 'xs' });
  return d.svg();
}

export function be_net_e2e() {
  const d = fig('be_net_e2e', 'GET /orders/123 ACROSS THE NETWORK, HOP BY HOP', 360);
  const st = [['DNS', 'api.wren.example'], ['CDN edge', 'TLS, WAF'], ['cloud LB', 'L4 or L7'], ['ingress Nginx', 'route, buffer'], ['sidecar', 'mTLS'], ['orders pod', 'handler'], ['sidecar', 'to payments'], ['payments', 'by Service name']];
  st.forEach(([t, s], i) => { const x = 50 + (i % 4) * 150, y = 90 + Math.floor(i / 4) * 140; d.circle(x, y, 58, { fill: i === 5 ? C.accSoft : C.card, stroke: i === 5 ? C.acc : C.ink2 }); d.mono(x, y, i + 1, { size: 10 }); d.text(x, y + 44, t, { cls: 'ttl', size: 10.5 }); d.text(x, y + 60, s, { cls: 'xs' }); if (i % 4 < 3) d.arrow(x + 32, y, x + 118, y, { stroke: C.gray, hl: 5 }); });
  d.carrow([[500, 120], [560, 160], [80, 190], [50, 200]], { stroke: C.gray, dash: [3, 4] });
  d.travel('M50,90 L500,90 L50,230 L500,230', { r: 5, dur: 8 });
  d.text(320, 336, 'each hop has its own timeouts, keep-alives, health checks and headers to pass along', { cls: 'xs' });
  return d.svg();
}

export function be_net_failures() {
  const d = fig('be_net_failures', 'THREE NETWORK INCIDENTS THAT LOOKED LIKE SOMETHING ELSE', 340);
  [['spike, then connect errors at CPU 20%', 'no upstream keep-alive: ports stuck in TIME_WAIT', 'keepalive pool, connection reuse'], ['new pods idle after a scale-out', 'gRPC connections pinned by an L4 balancer', 'L7 balancing, max connection age'], ['queries hang after quiet nights', 'NAT dropped idle pooled connections at 350 s', 'TCP keepalive 60 s, pool max idle 300 s']].forEach(([t, s, f], i) => { const y = 50 + i * 94; d.rect(30, y, 580, 80, { r: 8, fill: i === 0 ? C.accFaint : C.paper, stroke: i === 0 ? C.acc : C.line }); d.text(50, y + 20, t, { cls: 'ttl', a: 'start', color: i === 0 ? C.acc : undefined }); d.text(50, y + 42, s, { cls: 'sm', a: 'start' }); d.text(50, y + 62, f, { cls: 'xs', a: 'start' }); });
  return d.svg();
}

export function be_net_components() {
  const d = fig('be_net_components', 'THE UNIT ON ONE PAGE', 340);
  d.rect(40, 60, 110, 90, { r: 8, fill: C.accFaint, stroke: C.acc }); d.text(95, 105, 'proxies', { cls: 'ttl', color: C.acc });
  d.circle(260, 105, 90, { stroke: C.ink2 }); [0, 1, 2, 3].forEach((k) => { const a = k * Math.PI / 2; d.dot(260 + Math.cos(a) * 30, 105 + Math.sin(a) * 30, 6, C.ink2); }); d.text(260, 170, 'load balancing', { cls: 'xs' });
  d.db(360, 65, 90, 70, { label: 'registry', size: 9 }); d.text(405, 170, 'discovery', { cls: 'xs' });
  house(d, 500, 60, 70); fence(d, 575, 80, 40); d.text(560, 170, 'private networks', { cls: 'xs' });
  d.text(320, 230, 'every hop terminates, inspects, routes and re-originates connections, each with its own limits', { cls: 'sm' });
  d.text(320, 262, 'sockets, ports, descriptors and NAT tables are finite, and they run out before CPU does', { cls: 'xs' });
  d.text(320, 290, 'clouds rename the same ideas: networks, subnets, firewalls, identities, zones', { cls: 'xs' });
  return d.svg();
}
