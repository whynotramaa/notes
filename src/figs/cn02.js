import { scene as illustration, page as figPage, shelf as figShelf, label as figLabel, mapSite } from '../lib/figure-details.js';
import { D, C } from '../lib/draw.js';
import { canvas, ledger, lanes, flow } from '../lib/fundamentals-figures.js';
import { world, arc } from '../lib/world.js';
import values from '../data/fundamentals/numbers.json' with { type: 'json' };
import extra from '../data/fundamentals/cn-extra-numbers.json' with { type: 'json' };
const N = values.cn;
const box = (d,x,y,w,h,label,on=false) => d.box(x,y,w,h,label,{fill:on?C.accSoft:C.card,stroke:on?C.acc:C.ink2,size:11});

const chip = (d, x, y, w, s, hot = false, h = 22) => d.box(x, y, w, h, s, { r: 4, fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2, cls: 'mono', size: 9.5 });
const panel = (d, x, y, w, h, s, hot) => { d.rect(x, y, w, h, { r: 6, fill: hot ? C.accFaint : C.paper, stroke: hot ? C.acc : C.line }); d.text(x + w / 2, y + 18, s, { cls: 'ttl', color: hot ? C.acc : undefined }); };
const letter = (d, x, y, w, lines, hot) => { d.doc(x, y, w, 20 + lines.length * 18, { lines: false, fill: hot ? C.accFaint : C.paper, stroke: hot ? C.acc : C.ink2 }); lines.forEach((s, i) => d.mono(x + 12, y + 20 + i * 18, s, { a: 'start', size: 10, color: hot && i === 0 ? C.acc : undefined })); };
export function cn_transport(){
  const d=canvas('cn_transport','ONE IP ENDPOINT, SEPARATE TRANSPORT CONVERSATIONS',280);
  box(d,20,105,170,70,'IP destination\n203.0.113.20');
  [60,145,230].forEach((y,i)=>{
    d.arrow(194,140,310,y,{stroke:i===0?C.acc:C.gray});
    box(d,320,y-24,282,48,['TCP 443\nHTTPS listener','TCP other port\nseparate service','UDP endpoint\ndatagram socket'][i],i===0);
  });
  d.text(22,235,'Protocol and port select transport state.',{a:'start',cls:'sm'});
  return d.svg();
}
export function cn_tcp_udp() {
const d=illustration('cn_tcp_udp','TCP REASSEMBLES AN ORDERED BYTE STREAM; UDP EXPOSES INDIVIDUAL DATAGRAMS',340);
  d.text(42,48,'TCP',{cls:'ttl',a:'start'});figShelf(d,129,75,['A','gap','C'],{width:294,height:39,hot:1});
  d.lock(460,76,38);d.text(542,97,'wait for gap',{cls:'sm'});d.arrow(129,146,406,146,{stroke:C.line});d.text(271,171,'only contiguous bytes become visible',{cls:'sm'});
  d.text(42,221,'UDP',{cls:'ttl',a:'start'});[130,262,394].forEach((x,i)=>{d.envelope(x,228,90,51,{fill:i===1?C.paper:C.card,stroke:i===1?C.line:C.ink2});d.mono(x+45,253,['A','lost','C'][i]);});
  d.text(320,316,'an application using UDP supplies any ordering or recovery it requires',{cls:'sm'});return d.svg();
}
export function cn_handshake() {
  const d = canvas('cn_handshake', 'INITIAL SEQUENCES NEED CONFIRMATION IN BOTH DIRECTIONS', 345);
  d.cycle = 7.5;
  d.laptop(40, 40, 90, { label: 'Finch' });
  d.server(520, 34, 70, 66, { label: 'server', led: (i) => i === 1 });
  d.line(85, 112, 85, 330, { stroke: C.line, dash: [4, 5] });
  d.line(555, 116, 555, 330, { stroke: C.line, dash: [4, 5] });
  const msgs = [
    [[85, 140], [555, 182], `SYN  seq=${N.tcp_isn}`],
    [[555, 204], [85, 246], `SYN+ACK  seq=y  ack=${N.syn_next}`],
    [[85, 268], [555, 310], 'ACK  ack=y+1'],
  ];
  msgs.forEach(([a, b, label], i) => {
    d.arrow(a[0], a[1], b[0], b[1], { stroke: i === 2 ? C.acc : C.ink2 });
    d.mono(320, (a[1] + b[1]) / 2 - 14, label, { size: 10.5 });
    d.travel([a, b], { at: [i / 3 + 0.02, i / 3 + 0.26], token: 'packet', rotate: false, fill: i === 2 ? C.accSoft : C.paper, color: i === 2 ? C.acc : C.ink2 });
  });
  d.pulse(555, 310, { at: [0.92, 1], r1: 20 });
  const st = (x, y, s, a) => d.text(x, y, s, { cls: 'mono', size: 9, a, color: C.gray });
  st(75, 140, 'SYN-SENT', 'end');
  st(75, 268, 'ESTABLISHED', 'end');
  st(565, 130, 'LISTEN', 'start');
  st(565, 206, 'SYN-RCVD', 'start');
  st(565, 312, 'ESTABLISHED', 'start');
  d.hand(170, 208, 'SYN consumes\na sequence position', { size: 15, vc: true });
  d.text(320, 336, 'y is the server ISN', { cls: 'xs' });
  return d.svg();
}
export function cn_close() {
  const d = illustration('cn_close', 'A TCP CONNECTION IS TWO ONE-WAY LANES; FIN CLOSES ONE LANE AT A TIME', 340);
  d.laptop(30, 120, 70, { label: 'active closer' }); d.server(560, 104, 50, 80, { label: 'peer' });
  d.rect(120, 110, 420, 26, { r: 4, fill: C.paper, stroke: C.ink2 }); d.rect(120, 150, 420, 26, { r: 4, fill: C.paper, stroke: C.ink2 });
  d.text(330, 100, 'closer → peer', { cls: 'xs' }); d.text(330, 190, 'peer → closer: still open', { cls: 'xs' });
  d.glow((g) => g.rect(140, 106, 10, 34, { r: 2, fill: C.accSoft, stroke: C.acc }));
  d.mono(160, 123, 'FIN', { a: 'start', size: 10, color: C.acc });
  d.travel([[540, 163], [120, 163]], { dur: 3, token: 'packet' });
  d.travel([[530, 163], [120, 163]], { at: [0.4, 1], dur: 3, token: 'packet' });
  const steps = [['1', 'FIN: I have nothing more to send'], ['2', 'ACK: peer confirms the FIN'], ['3', 'peer finishes the response, then sends its FIN'], ['4', 'ACK, then the closer waits in TIME_WAIT']];
  steps.forEach(([k, s], i) => { d.circle(60, 222 + i * 26, 18, { fill: i === 0 ? C.accSoft : C.card, stroke: i === 0 ? C.acc : C.ink2 }); d.mono(60, 223 + i * 26, k, { size: 10 }); d.text(78, 222 + i * 26, s, { cls: 'sm', a: 'start' }); });
  d.clock(520, 266, 50, { spin: 4 }); d.text(520, 306, 'TIME_WAIT: 2 × MSL', { cls: 'xs' });
  return d.svg();
}
export function cn_reliable(){
  const d=canvas('cn_reliable','THE ACK IS THE NEXT CONTIGUOUS BYTE',240);
  box(d,28,76,90,55,'SYN\n1000');box(d,132,76,350,55,'data begins 1001\n1460 contiguous bytes');box(d,496,76,116,55,'ACK\n2461',true);
  d.brace(132,482,149,{label:'1001 + 1460 = 2461'});
  d.text(320,205,'A duplicate range does not become duplicate application bytes.',{cls:'sm'});
  return d.svg();
}
export function cn_window() {
  const fill = N.window_bytes / N.bdp_bytes;
  const d = illustration('cn_window', `THE PATH HOLDS ${N.bdp_bytes.toLocaleString('en-US')} BYTES IN FLIGHT; A ${N.window_bytes.toLocaleString('en-US')}-BYTE WINDOW FILLS ${(fill * 100).toFixed(1)}% OF IT`, 330);
  const x0 = 110, W = 420;
  d.laptop(20, 120, 70, { label: 'sender' }); d.server(560, 110, 50, 70, { label: 'receiver' });
  [['stop-and-wait', 70, N.packet_bytes / N.bdp_bytes, `${N.stop_wait_mbps.toFixed(2)} Mb/s`, false], ['64,000-byte window', 150, fill, `${N.window_mbps} Mb/s`, true], ['window = BDP', 230, 1, `${N.rate_bps / 1e6} Mb/s`, false]].forEach(([s, y, f, rate, hot]) => {
    d.rect(x0, y, W, 36, { r: 18, fill: C.paper, stroke: hot ? C.acc : C.ink2, sw: hot ? 1.5 : 1 });
    const draw = (g) => g.fillRect(x0 + 3, y + 3, Math.max(4, (W - 6) * f), 30, hot ? C.acc : C.gray, hot ? 0.55 : 0.35, 15);
    if (hot) d.glow(draw); else draw(d);
    d.text(x0, y - 10, s, { cls: 'sm', a: 'start', color: hot ? C.acc : undefined }); d.mono(x0 + W, y - 10, rate, { a: 'end', size: 10.5, color: hot ? C.acc : undefined });
    d.shift(W - 6 - (W - 6) * f, 0, (g) => g.fillRect(x0 + 3, y + 3, Math.max(4, (W - 6) * f), 30, hot ? C.acc : C.gray, 0.25, 15), { at: [0, 0.8], dur: 4 });
  });
  d.text(320, 296, `pipe size = ${N.rate_bps / 1e6} Mb/s × ${N.rtt_ms} ms RTT = ${N.bdp_bytes.toLocaleString('en-US')} bytes`, { cls: 'mono', size: 10.5 });
  d.text(320, 316, `${N.window_bytes.toLocaleString('en-US')} × 8 bits ÷ ${N.rtt_ms} ms = ${N.window_mbps} Mb/s`, { cls: 'mono', size: 10.5, color: C.acc });
  return d.svg();
}
export function cn_flow() {
const d=illustration('cn_flow','THE RECEIVER ADVERTISES FREE BUFFER SPACE TO BOUND THE SENDER',315);
  d.server(37,89,81,100,{label:'sender'});d.ram(348,57,233,46,{chips:5,chip:i=>i<3?C.accSoft:C.paper});d.text(464,131,'receiver buffer',{cls:'ttl'});
  figShelf(d,353,164,['used','used','used','free','free'],{width:230,height:44,hot:3});
  d.arrow(126,123,339,123,{stroke:C.acc});d.text(221,105,'payload bytes',{cls:'sm'});
  d.arrow(339,248,126,248,{stroke:C.ink2});d.text(228,270,'advertised receive window',{cls:'sm'});
  d.text(320,301,'available receiver space and network congestion are different limits',{cls:'sm'});return d.svg();
}
export function cn_congestion(){
  const d=canvas('cn_congestion','ILLUSTRATIVE SLOW START DOUBLES SUCCESSFUL ROUNDS',280);
  d.line(60,220,590,220,{stroke:C.line});
  N.cwnd.forEach((v,i)=>{
    const h=150*v/N.cwnd.at(-1),x=95+i*125;
    d.rect(x,220-h,70,h,{fill:i===3?C.accSoft:C.card,stroke:i===3?C.acc:C.ink2});
    d.mono(x+35,206-h,String(v));d.text(x+35,240,`round ${i+1}`,{cls:'sm'});
  });return d.svg();
}
export function cn_control(){
  const d=canvas('cn_control','PATH FEEDBACK RETURNS TO THE SENDER',280);
  box(d,25,70,150,60,'sender\ncwnd and pacing');box(d,240,70,155,60,'router queue');box(d,465,70,150,60,'receiver');
  d.arrow(180,100,234,100,{stroke:C.gray});d.arrow(401,100,459,100,{stroke:C.gray});
  box(d,190,195,265,48,'ACK, loss, delay or ECN',true);
  d.carrow([[540,135],[540,216],[460,216]],{stroke:C.gray});d.carrow([[185,216],[100,216],[100,136]],{stroke:C.acc});
  return d.svg();
}
export function cn_bucket(){
  const d=canvas('cn_bucket','SAVED TOKENS PERMIT A BOUNDED BURST',275);
  box(d,22,65,170,52,'refill\n25 tokens/s');box(d,245,58,180,125,'',true);d.text(335,81,'capacity 50',{cls:'ttl'});
  [0,1,2,3,4].forEach(i=>d.rect(265+i*28,111,18,44,{stroke:C.acc,fill:C.accSoft}));
  d.arrow(197,92,240,92,{stroke:C.gray});d.arrow(431,120,480,120,{stroke:C.gray});box(d,486,96,135,48,'admit burst');
  d.mono(320,230,`empty to full = ${extra.bucket_fill_seconds} s`);return d.svg();
}
export function cn_dns() {
const d=illustration('cn_dns','DNS FOLLOWS REFERRALS TOWARD AN AUTHORITATIVE NAME ANSWER',360);
  d.laptop(31,72,79,{label:'Finch'});d.server(195,67,81,85,{label:'recursive resolver',unit:24});
  [['root',48],['TLD',165],['zone',282]].forEach(([s,y],i)=>{d.server(489,y,94,54,{unit:16});d.text(536,y+71,s,{cls:'ttl'});d.arrow(284,111,481,y+27,{stroke:i===2?C.acc:C.line,hl:5});});
  d.arrow(117,105,187,105,{stroke:C.ink2});figShelf(d,179,247,['name','address','TTL'],{width:167,height:36,hot:1});d.text(264,304,'cached answer',{cls:'sm'});
  d.text(320,339,'the resolver follows delegation and reuses answers while permitted',{cls:'sm'});return d.svg();
}
export function cn_http() {
  const d = illustration('cn_http', 'AN HTTP EXCHANGE IS A LETTER AND A REPLY: METHOD AND PATH OUT, STATUS BACK', 330);
  letter(d, 30, 50, 230, ['GET /users/123 HTTP/1.1', 'Host: example.com', 'Accept: application/json'], true);
  letter(d, 380, 50, 230, ['HTTP/1.1 200 OK', 'Content-Type: application/json', '{"id": 123, ...}'], false);
  d.glow((g) => g.arrow(266, 80, 372, 80, { stroke: C.acc, sw: 1.6 })); d.arrow(372, 110, 266, 110, { stroke: C.ink2 });
  d.travel([[266, 80], [372, 80]], { at: [0, 0.45], dur: 5, token: 'packet' }); d.travel([[372, 110], [266, 110]], { at: [0.5, 0.95], dur: 5, token: 'packet', fill: C.card, color: C.ink2 });
  d.text(145, 160, 'GET reads; POST changes state', { cls: 'sm' });
  d.router(120, 220, 60, { label: 'proxy' }); d.server(300, 196, 40, 60, { label: 'upstream' });
  d.line(182, 228, 296, 228, { stroke: C.line, dash: [4, 4], single: true }); d.clock(240, 214, 24, { spin: 1.5 });
  d.rect(400, 200, 190, 56, { r: 4, fill: C.paper, stroke: C.ink2, rot: -4 }); d.mono(495, 222, '504 Gateway Timeout', { size: 10.5 }); d.text(495, 242, 'proxy waited, upstream silent', { cls: 'xs' });
  d.text(320, 300, '2xx success, 3xx go elsewhere, 4xx your fault, 5xx server or upstream fault', { cls: 'sm' });
  return d.svg();
}
export function cn_cache_headers() {
  const d = illustration('cn_cache_headers', 'THE BROWSER SENDS ITS ETAG; IF NOTHING CHANGED, THE SERVER SAYS 304 AND SENDS NO BODY', 330);
  d.rect(30, 60, 170, 200, { r: 6, fill: C.paper, stroke: C.ink2 }); d.text(115, 78, 'browser cache', { cls: 'ttl' });
  d.doc(60, 96, 110, 120, { fill: C.card }); d.mono(115, 236, 'ETag "abc123"', { size: 10 });
  d.server(520, 100, 70, 110, { label: 'origin' });
  d.glow((g) => g.arrow(206, 110, 510, 110, { stroke: C.acc, sw: 1.6 }));
  d.mono(358, 96, 'GET  If-None-Match: "abc123"', { size: 10, color: C.acc });
  d.arrow(510, 190, 206, 190, { stroke: C.ink2 }); d.mono(358, 176, '304 Not Modified', { size: 10.5 }); d.text(358, 206, 'headers only, no body bytes', { cls: 'xs' });
  d.travel([[206, 110], [510, 110]], { at: [0, 0.45], dur: 5, label: '"abc123"', w: 64 });
  d.travel([[510, 190], [206, 190]], { at: [0.5, 0.9], dur: 5, label: '304', w: 34, fill: C.card, color: C.ink2 });
  d.hand(320, 296, 'one round trip still paid; the body is reused from disk', { size: 15 });
  return d.svg();
}
export function cn_versions(){
  const d=canvas('cn_versions','ORDERING EXISTS AT DIFFERENT BOUNDARIES',340);
  ['HTTP/1.1','HTTP/2 over TCP','HTTP/3 over QUIC'].forEach((t,r)=>{
    const y=72+r*86;d.text(20,y+20,t,{a:'start',cls:'ttl'});
    [0,1,2,3].forEach(i=>box(d,220+i*98,y,86,42,r===2?['A gap','B ready','A waits','B ready'][i]:['gap','later A','later B','blocked'][i],r===2&&i===1));
  });
  d.text(320,321,'Separate QUIC streams retain their own ordered-byte obligations.',{cls:'sm'});return d.svg();
}
export function cn_quic(){
  const d=canvas('cn_quic','ONE LOST PACKET DOES NOT REQUIRE EVERY STREAM TO WAIT',290);
  box(d,20,75,165,120,'UDP packet\nQUIC frames');
  [80,165].forEach((y,i)=>{
    d.arrow(191,135,257,y+21,{stroke:i===1?C.acc:C.gray});
    box(d,265,y,140,42,`stream ${i===0?'A':'B'}`,i===1);box(d,455,y,155,42,i===0?'gap waits':'complete bytes',i===1);
    d.arrow(411,y+21,449,y+21,{stroke:i===1?C.acc:C.gray});
  });
  d.text(320,249,'Shared congestion capacity; independent stream delivery.',{cls:'sm'});return d.svg();
}
export function cn_tls() {
const d=illustration('cn_tls','TLS PROTECTS THE EXCHANGE AFTER VERIFYING THE EXPECTED ENDPOINT',350);
  d.laptop(31,107,112,{label:'client'});d.server(493,89,104,113,{label:'expected server',unit:25});
  d.doc(258,50,122,98,{lines:false});d.text(319,71,'certificate',{cls:'ttl'});d.key(280,104,68);d.text(319,167,'identity check',{cls:'sm'});
  d.rect(166,200,286,67,{fill:C.accFaint,stroke:C.acc,r:33});d.lock(293,211,45,{fill:C.accSoft,stroke:C.acc});
  d.arrow(151,230,281,230,{stroke:C.acc});d.arrow(351,230,486,230,{stroke:C.acc});
  d.text(320,297,'protected session bytes',{cls:'ttl',color:C.acc});d.text(320,328,'encryption needs endpoint authentication and an agreed session',{cls:'sm'});return d.svg();
}
export function cn_sessions() {
  const d = illustration('cn_sessions', 'A SESSION COOKIE IS A CLAIM TICKET; A SIGNED TOKEN IS A STAMPED PASS', 330);
  panel(d, 20, 40, 290, 250, 'server-side session', true);
  d.rect(50, 90, 90, 50, { r: 4, fill: C.accSoft, stroke: C.acc }); d.mono(95, 108, 'sid=7f3a', { size: 10 }); d.text(95, 126, 'means nothing alone', { cls: 'xs' });
  d.db(200, 160, 80, 80, { label: 'sessions' });
  d.glow((g) => g.carrow([[140, 115], [220, 110], [240, 156]], { stroke: C.acc, sw: 1.6 }));
  d.mono(165, 262, '7f3a → user 42, role admin', { size: 9.5 });
  d.text(165, 280, 'delete the row: logged out', { cls: 'xs' });
  panel(d, 330, 40, 290, 250, 'signed token', false);
  d.rect(360, 80, 150, 110, { r: 6, fill: C.paper, stroke: C.ink2 });
  ['sub: 42', 'aud: api', 'exp: 15:30'].forEach((s, i) => d.mono(374, 104 + i * 20, s, { a: 'start', size: 10 }));
  d.circle(480, 168, 34, { fill: C.card, stroke: C.ink2 }); d.text(480, 169, 'sig', { cls: 'xs' });
  d.key(540, 140, 32); d.text(556, 170, 'verify', { cls: 'xs' });
  d.text(475, 230, 'no lookup needed; valid', { cls: 'sm' }); d.text(475, 248, 'until expiry unless denylisted', { cls: 'sm' });
  d.travel([[95, 140], [220, 110], [240, 156]], { dur: 4, r: 3.5 });
  return d.svg();
}
export function cn_cors() {
  const d = illustration('cn_cors', 'BEFORE A CROSS-ORIGIN PUT, THE BROWSER ASKS PERMISSION WITH OPTIONS', 340);
  d.rect(20, 50, 220, 200, { r: 6, fill: C.paper, stroke: C.ink2 }); d.fillRect(22, 52, 216, 20, C.card, 1, 4); d.mono(32, 62, 'app.example.com', { a: 'start', size: 9.5 });
  d.person(130, 110, 40); d.text(130, 176, 'browser enforces the rule', { cls: 'xs' });
  d.server(520, 90, 70, 110, { label: 'api.example.com' });
  const msgs = [['OPTIONS  Origin: app.example.com', 'Access-Control-Request-Method: PUT', 1, true], ['Access-Control-Allow-Origin: app.example.com', 'Allow-Methods: PUT', -1, false], ['PUT /profile', 'only if the answer allowed it', 1, false]];
  msgs.forEach(([a, b, dir, hot], i) => {
    const y = 90 + i * 60, [x1, x2] = dir > 0 ? [246, 512] : [512, 246];
    if (hot) d.glow((g) => g.arrow(x1, y, x2, y, { stroke: C.acc, sw: 1.6 })); else d.arrow(x1, y, x2, y, { stroke: C.ink2 });
    d.mono(379, y - 22, a, { size: 9, color: hot ? C.acc : undefined }); d.text(379, y + 12, b, { cls: 'xs' });
    d.travel([[x1, y], [x2, y]], { at: [i / 3, (i + 1) / 3], dur: 7, token: 'packet' });
  });
  d.hand(320, 296, 'CORS limits what pages may read; the API must still authenticate', { size: 14 });
  return d.svg();
}
export function cn_websocket() {
  const d = illustration('cn_websocket', 'ONE HTTP UPGRADE, THEN A LONG-LIVED PIPE WHERE EITHER SIDE CAN SPEAK FIRST', 320);
  d.laptop(20, 120, 70, { label: 'browser' }); d.server(560, 104, 50, 80, { label: 'server' });
  d.glow((g) => g.rect(110, 70, 90, 46, { r: 4, fill: C.accSoft, stroke: C.acc }));
  d.mono(155, 86, 'Upgrade:', { size: 9.5 }); d.mono(155, 102, 'websocket', { size: 9.5 });
  d.text(155, 132, 'HTTP/1.1 → 101', { cls: 'xs' });
  d.rect(210, 120, 340, 56, { r: 28, fill: C.paper, stroke: C.ink2, sw: 1.4 });
  d.line(226, 148, 534, 148, { stroke: C.faint, single: true, dash: [4, 4] });
  [0, 0.33, 0.66].forEach((t) => d.travel([[220, 136], [540, 136]], { at: [t, t + 0.4], dur: 4, label: 'msg', w: 34 }));
  [0.15, 0.6].forEach((t) => d.travel([[540, 162], [220, 162]], { at: [t, t + 0.4], dur: 4, label: 'msg', w: 34, fill: C.card, color: C.ink2 }));
  d.text(380, 200, 'framed messages both ways; ping and pong keep it alive', { cls: 'sm' });
  d.path('M380,232 L396,248 L388,250 L404,268', { stroke: C.ink2, sw: 1.5, single: true });
  d.text(420, 252, 'connection drops: client reconnects and', { cls: 'xs', a: 'start' }); d.text(420, 266, 'asks what it missed', { cls: 'xs', a: 'start' });
  return d.svg();
}
export function cn_proxy(){
  const d=canvas('cn_proxy','THE REVERSE PROXY OWNS TWO SEPARATE EXCHANGES',260);
  box(d,20,95,155,60,'Finch\npublic client');box(d,240,95,160,60,'reverse proxy\nTLS endpoint',true);box(d,465,95,155,60,'private backend');
  d.arrow(181,115,234,115,{stroke:C.gray});d.arrow(406,115,459,115,{stroke:C.gray});
  d.arrow(234,142,181,142,{stroke:C.gray});d.arrow(459,142,406,142,{stroke:C.gray});
  d.text(205,72,'public exchange',{cls:'sm'});d.text(430,72,'upstream exchange',{cls:'sm'});d.text(320,210,'Forwarded client identity needs a trusted proxy chain.',{cls:'sm'});return d.svg();
}
export function cn_lb() {
  const d = illustration('cn_lb', 'AN L4 BALANCER SEES ONLY THE ENVELOPE; AN L7 BALANCER OPENS IT AND READS THE PATH', 340);
  panel(d, 20, 40, 290, 270, 'L4: IP and port', false);
  d.envelope(70, 90, 70, 46); d.mono(105, 150, '203.0.113.20:443', { size: 9.5 });
  d.router(130, 180, 60); [0, 1, 2].forEach((i) => { d.server(60 + i * 70, 240, 30, 40); d.line(160, 202, 75 + i * 70, 238, { stroke: C.line, single: true }); });
  d.travel([[105, 140], [160, 180], [145, 238]], { dur: 3, r: 3.5, color: C.ink2 });
  panel(d, 330, 40, 290, 270, 'L7: host and path', true);
  d.doc(360, 70, 100, 70, { lines: false, fill: C.paper }); d.mono(410, 94, 'GET /api/x', { size: 9.5, color: C.acc }); d.mono(410, 114, 'GET /img/a', { size: 9.5 });
  d.glow((g) => g.router(450, 170, 60, { stroke: C.acc, fill: C.accSoft }));
  d.rect(350, 230, 110, 60, { r: 4, stroke: C.acc, dash: [4, 3] }); d.text(405, 300, 'api pool', { cls: 'xs', color: C.acc });
  d.rect(490, 230, 110, 60, { r: 4, stroke: C.ink2, dash: [4, 3] }); d.text(545, 300, 'static pool', { cls: 'xs' });
  [0, 1].forEach((i) => { d.server(366 + i * 44, 238, 26, 40); d.server(506 + i * 44, 238, 26, 40); });
  d.travel([[410, 140], [480, 172], [395, 236]], { at: [0, 0.5], dur: 4, r: 3.5 }); d.travel([[410, 140], [480, 172], [540, 236]], { at: [0.5, 1], dur: 4, r: 3.5, color: C.ink2 });
  d.text(475, 154, 'TLS ends here', { cls: 'xs' });
  return d.svg();
}
export function cn_tunnel() {
const d=illustration('cn_tunnel','TUNNELLING CARRIES THE ORIGINAL PACKET INSIDE AN OUTER PACKET',330);
  d.rect(42,85,556,161,{fill:C.accFaint,stroke:C.acc,r:2});d.mono(62,113,'outer header: tunnel endpoints',{a:'start',size:12});
  d.rect(83,139,474,75,{fill:C.paper,stroke:C.ink2,r:0});d.mono(320,158,'inner header: original endpoints',{size:12});d.rect(258,181,263,24,{fill:C.card,stroke:C.line,r:0});d.text(389,194,'original payload',{cls:'mono',size:11});
  d.text(320,53,'outer reachability does not replace inner policy',{cls:'sm'});d.text(320,286,'decapsulation removes the outer wrapper at the tunnel exit',{cls:'sm'});return d.svg();
}
export function cn_firewall() {
  const d = illustration('cn_firewall', 'NEW TRAFFIC NEEDS A RULE; REPLIES PASS BECAUSE THE FIREWALL REMEMBERS THE FLOW', 340);
  for (let y = 50; y < 290; y += 20) for (let x = 290 + ((y / 20) % 2) * 15; x < 350; x += 30) d.rect(x, y, 28, 18, { r: 1, fill: C.card, stroke: C.line, sw: 0.7 });
  d.fillRect(290, 120, 60, 30, C.paper);
  d.glow((g) => g.rect(290, 120, 60, 30, { r: 2, stroke: C.acc, sw: 1.6 }));
  d.mono(320, 136, ':443', { size: 10, color: C.acc });
  d.cloud(30, 80, 160, 90, { fill: C.paper, label: 'Internet' }); d.server(520, 90, 60, 100, { label: 'web server' });
  d.travel([[180, 135], [510, 135]], { dur: 4, at: [0, 0.5], label: 'SYN :443', w: 60 });
  d.arrow(180, 210, 284, 210, { stroke: C.gray }); d.line(278, 200, 290, 220, { stroke: C.ink2, sw: 2, single: true }); d.line(290, 200, 278, 220, { stroke: C.ink2, sw: 2, single: true });
  d.mono(232, 196, 'SYN :22', { size: 9.5 }); d.text(232, 232, 'no rule: dropped', { cls: 'xs' });
  d.rect(380, 230, 230, 70, { r: 4, fill: C.paper, stroke: C.ink2 }); d.text(495, 244, 'connection table', { cls: 'xs' });
  d.mono(392, 266, '203.0.113.9:5011 ↔ :443 ESTABLISHED', { a: 'start', size: 9 });
  d.travel([[510, 160], [180, 160]], { dur: 4, at: [0.5, 1], label: 'reply', w: 40, fill: C.card, color: C.ink2 });
  d.text(160, 300, 'expired entry: the next packet is judged as new', { cls: 'xs' });
  return d.svg();
}
export function cn_attacks() {
  const d = illustration('cn_attacks', 'EACH ATTACK CORRUPTS ONE PIECE OF STATE ALONG THE PATH; THE DEFENSE HAS TO GUARD THAT PIECE', 350);
  const pts = [[60, 150], [190, 150], [320, 150], [450, 150], [580, 150]];
  d.line(60, 150, 580, 150, { stroke: C.line, sw: 4, single: true, op: 0.6 });
  d.laptop(36, 116, 50); d.router(166, 138, 50); d.server(300, 120, 40, 56); d.cloud(410, 110, 80, 50, { fill: C.paper }); d.server(560, 116, 40, 64);
  d.text(61, 196, 'browser', { cls: 'xs' }); d.text(191, 196, 'LAN', { cls: 'xs' }); d.text(320, 196, 'resolver', { cls: 'xs' }); d.text(450, 196, 'Internet', { cls: 'xs' }); d.text(580, 196, 'server', { cls: 'xs' });
  const atk = [['ARP spoofing', 'fake "gateway is my MAC"', 'TLS above it, port security', 191, true], ['DNS poisoning', 'forged name answer', 'DNSSEC, validating resolver', 320, false], ['SYN flood', 'half-open backlog', 'SYN cookies, rate limits', 580, false], ['replay', 'resent valid request', 'nonce, idempotency key', 450, false], ['session theft', 'stolen cookie', 'HttpOnly, Secure, short life', 61, false]];
  atk.forEach(([s, what, def, x, hot], i) => {
    const y = i % 2 ? 236 : 56, up = !(i % 2);
    d.line(x, up ? y + 30 : y - 8, x, up ? 116 : 200, { stroke: hot ? C.acc : C.gray, single: true, dash: [3, 3] });
    if (hot) d.glow((g) => g.circle(x, 150, 30, { stroke: C.acc, sw: 1.6 }));
    d.text(x, y, s, { cls: 'ttl', size: 11, color: hot ? C.acc : undefined }); d.text(x, y + 16, what, { cls: 'xs' }); d.text(x, y + 30 + (up ? 0 : 0), def, { cls: 'xs', color: C.ink2 });
  });
  d.travel([[60, 150], [580, 150]], { dur: 5, token: 'packet' });
  return d.svg();
}
export function cn_socket() {
const d=illustration('cn_socket','ONE LISTENER ACCEPTS CONNECTIONS WITH DISTINCT REMOTE ENDPOINTS',330);
  d.rect(213,51,387,240,{fill:C.paper,stroke:C.line,dash:[4,4]});d.text(408,73,'server process',{cls:'ttl'});
  d.router(253,120,86,{label:'listening socket'});
  d.phone(44,96,64,{label:'client A'});d.phone(44,219,64,{label:'client B'});
  d.arrow(89,125,245,134,{stroke:C.acc});d.arrow(89,249,245,155,{stroke:C.ink2});
  ['accepted A','accepted B'].forEach((s,i)=>{d.envelope(441,103+i*103,108,57);d.text(495,180+i*103,s,{cls:'sm'});d.arrow(347,136,431,130+i*103,{stroke:i?C.line:C.acc,hl:5});});return d.svg();
}
export function cn_io() {
const d=illustration('cn_io','THE EVENT LOOP SELECTS READY SOCKETS FROM A LARGER REGISTERED SET',320);
  d.text(151,49,'registered sockets',{cls:'ttl'});
  for(let r=0;r<4;r++)for(let c=0;c<6;c++){const hot=(r===1&&c===2)||(r===3&&c===4);d.circle(48+c*39,85+r*40,23,{fill:hot?C.accSoft:C.card,stroke:hot?C.acc:C.line});}
  d.arrow(292,163,349,163,{stroke:C.acc});d.doc(361,104,97,133,{lines:false});d.text(410,87,'ready subset',{cls:'ttl'});[146,193].forEach(y=>d.envelope(385,y-13,49,26,{fill:C.accSoft,stroke:C.acc}));
  d.cpu(531,135,61,{label:'loop'});d.arrow(465,166,523,166,{stroke:C.acc});d.text(560,229,'per-stream state',{cls:'sm'});
  d.text(320,295,'readiness permits progress; a whole message may still be incomplete',{cls:'sm'});return d.svg();
}
export function cn_cdn() {
const d=illustration('cn_cdn','CDN ATLAS / MANY SERVING EDGES, ONE SOURCE OF CONTENT',440);
  const m=world(d,33,65,574,259,{graticule:false});
  const source=m.at('virginia'),selected=m.at('mumbai');
  ['london','mumbai','tokyo','saopaulo','sydney'].forEach(city=>{
    const target=m.at(city);d.path(arc(source,target,.12),{stroke:city==='mumbai'?C.acc:C.line,single:true,sw:city==='mumbai'?1.5:.9,dash:city==='mumbai'?[5,4]:undefined});
  });
  [['london','London',0,-31],['mumbai','Mumbai',0,34],['tokyo','Tokyo',26,26],['saopaulo','São Paulo',-3,31],['sydney','Sydney',0,33]].forEach(([city,s,dx,dy])=>mapSite(d,m,city,s,{dx,dy,hot:city==='mumbai'}));
  d.db(source[0]-15,source[1]-19,30,38,{fill:C.accSoft,stroke:C.acc});d.text(source[0]-20,source[1],'origin',{cls:'ttl',a:'end',color:C.acc});
  d.line(32,358,608,358,{stroke:C.line,single:true});
  d.phone(38,378,42);d.arrow(72,395,145,395,{stroke:C.acc});d.server(153,377,34,39,{fill:C.accSoft,stroke:C.acc,unit:12});
  d.text(206,385,'hit: selected edge serves permitted bytes',{cls:'sm',a:'start'});
  d.text(206,408,'miss: fetch from source, then retain a usable copy',{cls:'sm',a:'start'});
  d.travel(arc(source,selected,.12),{dur:9,at:[.2,.65],r:4});d.pulse(selected[0],selected[1],{dur:9,at:[.6,.85],r1:27});
  return d.svg();
}
export function cn_p2p(){
  const d=canvas('cn_p2p','DISCOVER, TEST A DIRECT PATH, OR RELAY',330);
  box(d,22,160,150,55,'peer A + NAT');box(d,468,160,150,55,'peer B + NAT');box(d,244,55,150,50,'STUN server');box(d,244,260,150,50,'TURN relay');
  d.arrow(150,156,270,110,{stroke:C.gray});d.arrow(490,156,370,110,{stroke:C.gray});
  d.arrow(178,185,462,185,{stroke:C.acc,both:true});d.text(320,161,'ICE tests the direct pair',{cls:'sm'});
  d.arrow(170,220,239,275,{stroke:C.gray});d.arrow(401,275,469,220,{stroke:C.gray});return d.svg();
}
export function cn_virtual(){
  const d=canvas('cn_virtual','LOGICAL DELIVERY USES A DISTINCT UNDERLAY ROUTE',310);
  box(d,20,65,150,55,'tenant A vNIC');box(d,470,65,150,55,'tenant B vNIC');d.arrow(175,89,465,89,{stroke:C.gray});
  box(d,20,200,150,55,'tunnel endpoint');box(d,470,200,150,55,'tunnel endpoint');box(d,235,190,170,75,'underlay\nouter IP route',true);
  d.arrow(95,125,95,195,{stroke:C.gray});d.arrow(175,228,230,228,{stroke:C.acc});d.arrow(410,228,465,228,{stroke:C.gray});d.arrow(545,195,545,125,{stroke:C.gray});
  d.text(320,145,'inner MAC and tenant addresses',{cls:'sm'});return d.svg();
}
export function cn_cloud() {
  const d = illustration('cn_cloud', 'A CONTAINER\'S PACKET LEAVES THROUGH FOUR NESTED BOUNDARIES BEFORE IT REACHES THE INTERNET', 360);
  d.glow((g) => g.rect(20, 40, 470, 290, { r: 10, stroke: C.acc, sw: 1.6, dash: [8, 5] }));
  d.text(36, 56, 'VPC 10.0.0.0/16: routes and security groups', { cls: 'sm', a: 'start', color: C.acc });
  d.rect(40, 70, 330, 240, { r: 8, fill: C.paper, stroke: C.ink2, dash: [5, 4] }); d.text(54, 86, 'subnet 10.0.1.0/24', { cls: 'xs', a: 'start' });
  d.rect(60, 100, 280, 190, { r: 6, fill: C.card, stroke: C.ink2 }); d.text(74, 116, 'host VM 10.0.1.12', { cls: 'xs', a: 'start' });
  d.rect(80, 130, 120, 80, { r: 5, fill: C.paper, stroke: C.ink2 }); d.text(140, 146, 'container ns', { cls: 'xs' }); d.mono(140, 176, 'eth0 172.17.0.2', { size: 9 });
  d.box(230, 160, 90, 30, 'docker0 bridge', { r: 4, fill: C.paper, cls: 'mono', size: 9 });
  d.box(140, 236, 160, 30, 'iptables MASQUERADE', { r: 4, fill: C.paper, cls: 'mono', size: 9 });
  d.router(400, 160, 60); d.text(430, 196, 'internet gateway', { cls: 'xs' });
  d.server(560, 140, 50, 70, { label: 'public server' });
  const path = [[160, 176], [230, 175], [275, 192], [220, 236], [300, 250], [400, 172], [556, 172]];
  d.lines(path, { stroke: C.line, single: true, dash: [3, 3] });
  d.travel(path, { dur: 7, token: 'packet' });
  d.travel(path.slice().reverse(), { dur: 7, at: [0.5, 1], token: 'packet', fill: C.card, color: C.ink2 });
  d.hand(320, 346, 'the reply needs the same path, in reverse, to be allowed', { size: 14 });
  return d.svg();
}
export function cn_url_cache() {
const d=illustration('cn_url_cache','A REUSABLE BROWSER COPY CAN END THE REQUEST BEFORE TRANSPORT',335);
  d.laptop(40,109,119,{label:'Finch'});d.doc(256,54,124,95,{lines:false,fill:C.accSoft,stroke:C.acc});d.mono(318,83,'URL key',{size:12});d.mono(318,115,'stored bytes',{size:11});
  d.arrow(166,144,248,104,{stroke:C.acc});d.text(194,96,'usable hit',{cls:'sm'});
  d.cloud(264,219,115,65,{fill:C.card,label:'network',size:11});d.server(491,214,93,74,{label:'origin',unit:21});
  d.arrow(166,194,256,251,{stroke:C.ink2});d.text(185,244,'miss',{cls:'sm'});d.arrow(387,251,483,251,{stroke:C.ink2});
  d.text(320,316,'request transport is needed only after local reuse fails',{cls:'sm'});return d.svg();
}
export function cn_tuple_trace() {
  const d = illustration('cn_tuple_trace', 'THE SAME FLOW HAS FOUR ADDRESS PAIRS; THE GATEWAY HOLDS THE KEY TO THE LAST ONE', 360);
  d.laptop(20, 150, 60, { label: N.client_ip }); d.router(250, 160, 70, { label: 'gateway NAT' }); d.server(560, 140, 50, 70, { label: N.server_ip });
  d.line(84, 172, 246, 172, { stroke: C.line, single: true }); d.line(324, 172, 556, 172, { stroke: C.line, single: true });
  const env = [[60, 50, `${N.client_ip}:51000`, `${N.server_ip}:443`, 'client out', false], [350, 50, `${N.public_ip}:40001`, `${N.server_ip}:443`, 'after NAT', true], [350, 250, `${N.server_ip}:443`, `${N.public_ip}:40001`, 'server reply', false], [60, 250, `${N.server_ip}:443`, `${N.client_ip}:51000`, 'restored', false]];
  env.forEach(([x, y, src, dst, s, hot]) => {
    const draw = (g) => g.envelope(x, y, 230, 64, { fill: hot ? C.accSoft : C.paper, stroke: hot ? C.acc : C.ink2 });
    if (hot) d.glow(draw); else draw(d);
    d.text(x + 115, y - 10, s, { cls: 'xs', color: hot ? C.acc : undefined });
    d.mono(x + 12, y + 46, `src ${src}`, { a: 'start', size: 9 }); d.mono(x + 12, y + 58, `dst ${dst}`, { a: 'start', size: 9 });
  });
  d.travel([[84, 166], [246, 166]], { at: [0, 0.25], dur: 8, token: 'packet', fill: C.card, color: C.ink2 });
  d.travel([[324, 166], [556, 166]], { at: [0.25, 0.5], dur: 8, token: 'packet' });
  d.travel([[556, 178], [324, 178]], { at: [0.5, 0.75], dur: 8, token: 'packet', fill: C.card, color: C.ink2 });
  d.travel([[246, 178], [84, 178]], { at: [0.75, 1], dur: 8, token: 'packet', fill: C.card, color: C.ink2 });
  return d.svg();
}
export function cn_budget(){
  const d=canvas('cn_budget','ILLUSTRATIVE COLD EXCHANGE HAS THREE SEQUENTIAL RTT COSTS',260);
  ['TCP','TLS','HTTP request'].forEach((t,i)=>{const x=35+i*195;box(d,x,82,175,62,t,i<2);d.mono(x+87,166,'40 ms');});
  d.brace(35,600,189,{label:'40 + 40 + 40 = 120 ms'});d.text(320,237,'Excludes DNS, computation and separately counted serialization.',{cls:'sm'});return d.svg();
}
export function cn_diagnosis() {
  const d = illustration('cn_diagnosis', 'DEBUG FROM THE BOTTOM: THE LAST LAYER THAT WORKED TELLS YOU WHERE TO LOOK NEXT', 360);
  const rungs = [['link + ARP', 'gateway MAC known?', 'no MAC: check cable, VLAN, ARP'], ['route + TCP', 'SYN answered?', 'retries: path, firewall, listener'], ['TLS', 'certificate matches name?', 'mismatch: wrong host or proxy'], ['HTTP', 'status from origin?', '504: proxy reached, upstream slow']];
  d.line(120, 320, 120, 50, { stroke: C.ink2, sw: 2, single: true }); d.line(200, 320, 200, 50, { stroke: C.ink2, sw: 2, single: true });
  rungs.forEach(([s, q, ans], i) => {
    const y = 290 - i * 70, hot = i === 3;
    d.line(120, y, 200, y, { stroke: C.ink2, sw: 2, single: true });
    d.text(104, y, s, { cls: 'ttl', a: 'end', size: 11, color: hot ? C.acc : undefined });
    if (hot) d.glow((g) => g.circle(160, y, 22, { fill: C.accSoft, stroke: C.acc })); else d.path(`M150,${y - 2} L158,${y + 6} L172,${y - 10}`, { stroke: C.ink, sw: 1.8, single: true });
    if (hot) d.mono(160, y + 1, '504', { size: 9, color: C.acc });
    d.text(224, y - 8, q, { cls: 'sm', a: 'start' }); d.text(224, y + 10, ans, { cls: 'xs', a: 'start', color: hot ? C.acc : undefined });
  });
  d.person(160, 300, 26);
  d.shift(0, -210, (g) => g.dot(160, 296, 4, C.acc), { at: [0, 0.8], dur: 5 });
  return d.svg();
}
export function cn_complete() {
  const d = illustration('cn_complete', `ONE URL ACROSS THE WORLD: ${N.client_ip} TO ${N.server_ip} AND BACK`, 400);
  const m = world(d, 20, 40, 600, 250, { lat: [-50, 75] });
  const A = m.at('mumbai'), B = m.at('virginia');
  d.glow((g) => g.circle(A[0], A[1], 46, { stroke: C.acc, sw: 1.4 }));
  d.laptop(A[0] - 14, A[1] - 12, 28);
  d.server(B[0] - 10, B[1] - 16, 20, 32, { unit: 10 });
  const path = `M${A[0]},${A[1]} Q${(A[0] + B[0]) / 2},${Math.min(A[1], B[1]) - 120} ${B[0]},${B[1]}`;
  d.path(path, { stroke: C.ink2, single: true, dash: [5, 4] });
  d.travel(path, { at: [0, 0.48], dur: 8, token: 'packet' });
  d.travel(`M${B[0]},${B[1]} Q${(A[0] + B[0]) / 2},${Math.min(A[1], B[1]) - 120} ${A[0]},${A[1]}`, { at: [0.52, 1], dur: 8, token: 'packet', fill: C.card, color: C.ink2 });
  d.text(A[0], A[1] + 34, 'Finch', { cls: 'sm', color: C.acc }); d.text(B[0], B[1] + 30, 'server', { cls: 'sm' });
  const steps = ['caches, then DNS for example.com', 'route to gateway, ARP, Ethernet', 'NAT to a public source, IP hops', 'TCP or QUIC, TLS, HTTP request', 'response to the public mapping', 'gateway restores the private address'];
  steps.forEach((s, i) => { const x = 30 + (i % 3) * 200, y = 310 + Math.floor(i / 3) * 38; d.circle(x + 9, y, 18, { fill: i === 0 ? C.accSoft : C.card, stroke: i === 0 ? C.acc : C.ink2 }); d.mono(x + 9, y + 1, String(i + 1), { size: 10 }); d.text(x + 24, y, s, { cls: 'xs', a: 'start' }); });
  return d.svg();
}
