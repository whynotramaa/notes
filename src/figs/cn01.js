import { scene as illustration, page as figPage, shelf as figShelf, label as figLabel, mapSite } from '../lib/figure-details.js';
import { D, C } from '../lib/draw.js';
import values from '../data/fundamentals/numbers.json' with { type: 'json' };
import { canvas, flow, cards, ledger, lanes, map, cover } from '../lib/fundamentals-figures.js';
const N = values.cn;
const stages = ['Network models and\nphysical signals','Data link and\nEthernet switching','VLANs and\nIP addressing','IP forwarding\nand routing','Transport and TCP','Flow and\ncongestion control','DNS and HTTP','QUIC, TLS and\nweb sessions','Proxies, tunnels\nand firewalls','Socket programming\nand I/O','CDN, P2P and\ncloud networking','The complete\nbrowser request'];
import { world } from '../lib/world.js';
const chip = (d, x, y, w, s, hot = false, h = 22) => d.box(x, y, w, h, s, { r: 4, fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2, cls: 'mono', size: 9.5 });
const panel = (d, x, y, w, h, s, hot) => { d.rect(x, y, w, h, { r: 6, fill: hot ? C.accFaint : C.paper, stroke: hot ? C.acc : C.line }); d.text(x + w / 2, y + 18, s, { cls: 'ttl', color: hot ? C.acc : undefined }); };
const crcRem = (data, gen) => { let a = (data + '0'.repeat(gen.length - 1)).split('').map(Number); const g = gen.split('').map(Number), steps = []; for (let i = 0; i + g.length <= a.length; i++) if (a[i]) { steps.push([i, a.slice(i, i + g.length).join('')]); g.forEach((b, j) => { a[i + j] ^= b; }); } return { rem: a.slice(-(g.length - 1)).join(''), steps }; };
export function where_fund_cn(stage=99){ return map('where_fund_cn', stages, stage); }
export function cover_fund_cn(){ return cover('cover_fund_cn',['Computer','networks'],['Ethernet, IP, TCP, TLS and HTTP in one packet path.','Follow Finch from a private address to a public server.'],[['Put bytes on wire','signals, frames, errors'],['Choose the next hop','ARP, IP, routes, NAT'],['Protect the exchange','TCP, TLS, HTTP'],['Operate the path','proxies, sockets, cloud']],2); }
const f = (id, cap, labels, notes=[], focus=1) => flow(id, cap, labels, notes, focus);
const c = (id, cap, headers, rows, focus=0) => ledger(id, cap, headers, rows, focus);
export function cn_network() {
const d=illustration('cn_network','A LOCAL NETWORK IS ONE NEIGHBOURHOOD ON A MUCH LONGER PATH',350);
  d.rect(26,54,269,248,{fill:C.accFaint,stroke:C.acc,dash:[5,4]});d.text(45,73,'LAN / local site',{cls:'ttl',a:'start',color:C.acc});
  d.laptop(51,105,87,{label:'Finch'});d.phone(206,106,65);d.router(119,237,69,{label:'gateway'});
  d.line(100,189,144,234,{stroke:C.ink2,single:true});d.line(222,182,165,234,{stroke:C.ink2,single:true});
  d.cloud(360,90,223,121,{fill:C.card,label:'WAN / Internet'});d.server(456,250,72,70,{label:'remote server'});
  d.arrow(192,250,384,183,{stroke:C.acc});d.arrow(488,220,488,243,{stroke:C.ink2});
  d.text(367,276,'several links and routers',{cls:'sm'});return d.svg();
}
export function cn_topology() {
const d=illustration('cn_topology','THE LINK GEOMETRY REVEALS EACH SHARED FAILURE POINT',380);
  const centers=[[161,119],[480,119],[161,286],[480,286]];
  centers.forEach(([x,y],i)=>{
    d.text(x,y-68,['star','bus','ring','mesh'][i],{cls:'ttl'});
    const pts=[[-75,-23],[75,-23],[-75,35],[75,35]].map(([a,b])=>[x+a,y+b]);
    if(i===0){pts.forEach(p=>d.line(x,y,...p,{stroke:C.line,single:true}));d.router(x-23,y-8,46,{stroke:C.acc,fill:C.accSoft});}
    if(i===1){d.line(x-106,y,x+106,y,{stroke:C.acc,single:true,sw:2});pts.forEach(p=>d.line(p[0],p[1],p[0],y,{stroke:C.ink2,single:true}));}
    if(i===2){[0,1,3,2,0].slice(1).forEach((p,j)=>d.line(...pts[[0,1,3,2][j]],...pts[p],{stroke:C.ink2,single:true}));}
    if(i===3)pts.forEach((p,j)=>pts.slice(j+1).forEach(q=>d.line(...p,...q,{stroke:C.line,single:true})));
    pts.forEach(p=>d.cpu(p[0]-10,p[1]-10,20));
  });return d.svg();
}
export function cn_clients() {
  const d = illustration('cn_clients', 'WHO TALKS TO WHOM, AND WHETHER THE PATH IS RESERVED OR SHARED', 330);
  panel(d, 18, 40, 296, 130, 'client-server', false);
  d.server(144, 70, 40, 56, { label: 'server' });
  [[40, 70], [40, 120], [250, 70], [250, 120]].forEach(([x, y]) => { d.laptop(x, y, 36); d.line(x + (x < 164 ? 40 : -4), y + 12, x < 164 ? 140 : 188, 98, { stroke: C.line, single: true }); });
  panel(d, 326, 40, 296, 130, 'peer-to-peer', false);
  const peers = [[380, 80], [474, 70], [560, 90], [420, 130], [530, 135]];
  peers.forEach((p, i) => peers.slice(i + 1).forEach((q) => d.line(p[0] + 14, p[1] + 8, q[0] + 14, q[1] + 8, { stroke: C.faint, single: true })));
  peers.forEach(([x, y]) => d.laptop(x, y, 30));
  panel(d, 18, 182, 296, 130, 'circuit switching', false);
  const hops = [[50, 250], [120, 230], [190, 262], [270, 240]];
  hops.forEach(([x, y]) => d.router(x - 18, y, 36));
  d.lines(hops.map(([x, y]) => [x, y + 6]), { stroke: C.ink, sw: 3, single: true });
  d.text(166, 298, 'path reserved for the whole call', { cls: 'xs' });
  panel(d, 326, 182, 296, 130, 'packet switching', true);
  const net = [[360, 260], [430, 225], [430, 285], [510, 225], [510, 285], [590, 255]];
  [[0, 1], [0, 2], [1, 3], [2, 4], [1, 4], [3, 5], [4, 5]].forEach(([a, b]) => d.line(...net[a], ...net[b], { stroke: C.line, single: true }));
  net.forEach(([x, y]) => d.circle(x, y, 14, { fill: C.card, stroke: C.ink2 }));
  d.travel([net[0], net[1], net[3], net[5]], { dur: 3, token: 'packet' });
  d.travel([net[0], net[2], net[4], net[5]], { dur: 3, at: [0.3, 1], token: 'packet' });
  d.travel([net[0], net[1], net[4], net[5]], { dur: 3, at: [0.15, 0.85], token: 'packet' });
  return d.svg();
}
export function cn_metrics() {
  const d = illustration('cn_metrics', `ONE ${N.packet_bytes}-BYTE PACKET, ONE LINK: ${N.one_link_delay_ms} MS, AND DISTANCE IS MOST OF IT`, 340);
  d.router(40, 120, 70); d.router(530, 120, 70);
  [0, 1, 2].forEach((i) => d.envelope(8 + i * 22, 94, 18, 12));
  d.text(30, 80, 'queue', { cls: 'xs' });
  d.line(112, 132, 528, 132, { stroke: C.ink2, sw: 2, single: true });
  d.text(320, 116, `${N.distance_m / 1000} km of fibre at ${N.speed_mps / 1e3} km/s`, { cls: 'sm' });
  d.travel([[112, 132], [528, 132]], { dur: 4, token: 'packet' });
  d.glow((g) => g.circle(75, 126, 52, { stroke: C.acc, sw: 1.4 }));
  d.text(75, 168, 'processing', { cls: 'xs', color: C.acc });
  const parts = [['transmission', N.transmission_ms, `${N.packet_bytes * 8} bits ÷ ${N.rate_bps / 1e6} Mb/s`], ['propagation', N.propagation_ms, `${N.distance_m} m ÷ ${N.speed_mps} m/s`], ['queue', N.queue_ms, 'waiting behind others'], ['processing', N.processing_ms, 'header lookup']];
  const X0 = 40, W = 560, tot = N.one_link_delay_ms;
  let x = X0;
  parts.forEach(([s, v], i) => { const w = v / tot * W; d.rect(x, 210, Math.max(w, 3), 30, { r: 1, fill: i === 3 ? C.accSoft : i === 1 ? C.card : C.paper, stroke: i === 3 ? C.acc : C.ink2 }); x += w; });
  d.text(X0 + N.transmission_ms / tot * W + N.propagation_ms / tot * W / 2, 225, `propagation ${N.propagation_ms} ms`, { cls: 'mono', size: 10.5 });
  parts.forEach(([s, v, how], i) => d.mono(40 + i * 150, 270, `${s} ${+v.toFixed(2)} ms`, { a: 'start', size: 10, color: i === 3 ? C.acc : undefined }));
  parts.forEach(([s, v, how], i) => d.text(40 + i * 150, 288, how, { cls: 'xs', a: 'start' }));
  d.mono(600, 196, `total ${tot} ms`, { a: 'end', size: 11 });
  return d.svg();
}
export function cn_layers() {
const d=illustration('cn_layers','THE SAME EXCHANGE IS SEEN AT DIFFERENT LAYERS',350);
  const layers=[['application','HTTP names the resource'],['transport','TCP names the process'],['network','IP selects the next hop'],['link','Ethernet reaches a neighbour'],['physical','signals carry bits']];
  layers.forEach(([s,t],i)=>{const y=57+i*53;d.poly([[54,y+10],[286,y+10],[316,y],[84,y]],{fill:i===0?C.accSoft:C.card,stroke:i===0?C.acc:C.line});d.rect(54,y+11,232,34,{r:0,fill:i===0?C.accSoft:C.card,stroke:i===0?C.acc:C.ink2});d.mono(170,y+28,s,{size:12});d.line(321,y+24,357,y+24,{stroke:C.line,single:true});d.text(366,y+24,t,{cls:'sm',a:'start',size:11});});return d.svg();
}
export function cn_encapsulation() {
const d=illustration('cn_encapsulation','HEADERS WRAP THE SAME APPLICATION BYTES',352);
  const layers=[['HTTP','application data'],['TCP','ports + sequence'],['IP','addresses + TTL'],['Ethernet','MAC + checksum']];
  layers.forEach(([s,t],i)=>{const x=36,y=58+i*69,total=566,header=78;d.text(38,y-12,s,{cls:'ttl',a:'start'});for(let k=0;k<=i;k++){d.rect(x+k*header,y,header,35,{r:0,fill:k===0&&i===3?C.accSoft:C.card,stroke:k===0&&i===3?C.acc:C.ink2});d.mono(x+k*header+header/2,y+17,layers[i-k][0],{size:10});}const px=x+(i+1)*header;d.rect(px,y,total-(i+1)*header,35,{r:0,fill:C.paper,stroke:C.ink2});d.mono(px+(total-(i+1)*header)/2,y+17,'same payload',{size:11});d.text(603,y+48,t,{cls:'sm',a:'end'});});return d.svg();
}
export function cn_headers() {
  const d = illustration('cn_headers', 'EACH LAYER WRAPS THE ONE ABOVE: THE IP PACKET CARRIES TCP, WHICH CARRIES HTTP', 330);
  const L = [['Ethernet', 'dst MAC, src MAC, type', 30, 50, 580, 240, false], ['IP', 'src 192.168.10.70, dst 203.0.113.20', 60, 82, 520, 190, true], ['TCP', 'ports 51000 → 443, seq', 90, 114, 460, 140, false], ['HTTP', 'GET /users/123', 120, 146, 400, 90, false]];
  L.forEach(([s, h, x, y, w, hh, hot]) => {
    const draw = (g) => { g.rect(x, y, w, hh, { r: 5, fill: hot ? C.accFaint : C.paper, stroke: hot ? C.acc : C.ink2, sw: hot ? 1.6 : 1 }); g.fillRect(x + 2, y + 2, 110, 26, hot ? C.accSoft : C.card, 1, 3); };
    if (hot) d.glow(draw); else draw(d);
    d.text(x + 10, y + 15, s, { cls: 'ttl', a: 'start', color: hot ? C.acc : undefined });
    d.mono(x + 120, y + 15, h, { a: 'start', size: 9.5 });
  });
  d.mono(320, 196, 'application bytes', { size: 11 });
  d.fillRect(574, 52, 34, 236, C.card, 1, 3); d.text(591, 170, 'FCS', { cls: 'xs', rot: -90 });
  d.hand(320, 312, 'routers open only as far as the IP envelope', { size: 15 });
  return d.svg();
}
export function cn_signals() {
const d=illustration('cn_signals','CONTINUOUS WAVES AND CHOSEN SYMBOL LEVELS',310);
  d.text(39,48,'analog amplitude',{cls:'ttl',a:'start'});d.arrow(42,140,603,140,{stroke:C.line});
  d.curve(Array.from({length:80},(_,i)=>[42+i*7,98+Math.sin(i/6)*29]),{stroke:C.ink2,single:true,sw:1.5});
  d.text(39,182,'illustrative binary symbols',{cls:'ttl',a:'start'});
  const bits=[1,0,1,1,0,0,1,0],pts=[];bits.forEach((b,i)=>{const x=43+i*70,y=b?215:264;pts.push([x,y],[x+70,y]);d.mono(x+35,289,b);});d.lines(pts,{stroke:C.acc,single:true,sw:1.8});return d.svg();
}
export function cn_media() {
const d=illustration('cn_media','ELECTRICITY, LIGHT AND RADIO CARRY THE SAME LOGICAL BITS',330);
  d.text(33,57,'copper',{cls:'ttl',a:'start'});d.text(33,148,'fiber',{cls:'ttl',a:'start'});d.text(33,248,'radio',{cls:'ttl',a:'start'});
  [80,94].forEach(y=>d.curve(Array.from({length:60},(_,i)=>[156+i*7.5,y+Math.sin(i/3)*5]),{stroke:C.ink2,single:true}));
  d.line(155,176,596,176,{stroke:C.line,sw:15,single:true});d.line(155,176,596,176,{stroke:C.acc,sw:2,single:true});[215,311,407,503].forEach(x=>d.arrow(x,176,x+31,176,{stroke:C.acc,hl:5}));
  d.router(160,280,53);d.router(549,280,53);[80,130,180,230].forEach(w=>d.path(`M${199+w/4},264 Q${193+w/2},230 ${199+w/4},196`,{stroke:C.line,single:true}));
  d.text(421,285,'shared spectrum',{cls:'sm'});return d.svg();
}
export function cn_frame() {
  const d = illustration('cn_frame', `AN ETHERNET FRAME IS A TRAIN: ${N.ethernet_frame_bytes} BYTES FROM HEADER TO CHECKSUM`, 280);
  d.line(10, 210, 630, 210, { stroke: C.ink2, sw: 1.5, single: true });
  for (let x = 20; x < 630; x += 22) d.line(x, 206, x, 214, { stroke: C.line, single: true });
  d.shift(40, 0, (g) => {
    const cars = [['preamble', '8 B', 60, false], ['header', '14 B', 110, false], ['payload: IP packet', '≤ 1500 B', 270, true], ['FCS', '4 B', 60, false]];
    let x = 20;
    cars.forEach(([s, b, w, hot], i) => {
      const draw = (h) => h.rect(x, 130, w, 64, { r: i === 0 ? 14 : 4, fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2 });
      if (hot) g.glow(draw); else draw(g);
      g.text(x + w / 2, 152, s, { cls: 'ttl', size: 11, color: hot ? C.acc : undefined }); g.mono(x + w / 2, 174, b, { size: 10 });
      g.circle(x + 14, 200, 14, { fill: C.paper, stroke: C.ink2 }); g.circle(x + w - 14, 200, 14, { fill: C.paper, stroke: C.ink2 });
      if (i < 3) g.line(x + w, 170, x + w + 10, 170, { stroke: C.ink2, sw: 2, single: true });
      x += w + 10;
    });
  }, { at: [0, 0.6], back: true, dur: 5 });
  d.text(110, 64, 'clock sync', { cls: 'xs' }); d.text(190, 64, 'dst + src MAC, type', { cls: 'xs' });
  d.text(410, 64, 'the next router unloads this car and builds a new train', { cls: 'xs' });
  d.text(610, 64, 'CRC', { cls: 'xs', a: 'end' });
  d.mono(320, 250, `14 + 1500 + 4 = ${N.ethernet_frame_bytes} bytes counted as the frame`, { size: 10.5 });
  return d.svg();
}
export function cn_mac() {
  const d = illustration('cn_mac', `A ${N.mac_bits}-BIT MAC NAMES ONE INTERFACE; BROADCAST REACHES EVERY HOST BUT STOPS AT THE ROUTER`, 330);
  ['3c', '22', 'fb', '9a', '41', '07'].forEach((o, i) => chip(d, 150 + i * 56, 44, 48, o, false, 26));
  d.brace(150, 222, 80, { label: 'vendor (OUI)' }); d.brace(318, 478, 80, { label: 'interface' });
  const kinds = [['unicast', [2]], ['multicast', [1, 3]], ['broadcast ff:ff:ff:ff:ff:ff', [0, 1, 2, 3, 4]]];
  kinds.forEach(([s, to], k) => {
    const x0 = 20 + k * 205, hot = k === 2;
    panel(d, x0, 112, 190, 200, s, hot);
    d.laptop(x0 + 76, 140, 38);
    for (let h = 0; h < 5; h++) {
      const x = x0 + 18 + h * 34, y = 240, on = to.includes(h);
      d.circle(x + 10, y, 22, { fill: on ? (hot ? C.accSoft : C.card) : C.paper, stroke: on ? (hot ? C.acc : C.ink2) : C.line });
      if (on) { d.line(x0 + 95, 172, x + 10, y - 12, { stroke: hot ? C.acc : C.gray, single: true, sw: 0.9 }); d.travel([[x0 + 95, 172], [x + 10, y - 12]], { dur: 2.4, r: 2.6, color: hot ? C.acc : C.ink2 }); }
    }
  });
  d.router(500, 276, 50); d.line(498, 270, 552, 300, { stroke: C.acc, sw: 1.5, single: true });
  return d.svg();
}
export function cn_errors() {
  const d = illustration('cn_errors', 'A TWO-BIT BURST: PARITY MISSES IT, A CRC CATCHES IT', 320);
  const sent = '1101001', got = '1011001';
  d.text(40, 50, 'sent', { cls: 'xs', a: 'start' }); d.tape(90, 38, sent.split(''), { cw: 30, h: 24 });
  d.text(40, 84, 'received', { cls: 'xs', a: 'start' }); d.tape(90, 72, got.split(''), { cw: 30, h: 24, hot: (i) => sent[i] !== got[i] });
  d.path('M150,108 L162,122 L156,124 L168,138', { stroke: C.ink2, sw: 1.5, single: true }); d.text(176, 126, 'noise flips bits 1 and 2', { cls: 'sm', a: 'start' });
  const ones = (s) => s.split('').filter((c) => c === '1').length;
  const rows = [['parity', `ones: ${ones(sent)} sent, ${ones(got)} received; both even`, 'missed', false], ['checksum', 'adds 16-bit words; reordered words cancel out', 'weak', false], ['CRC', `divide by 1011: remainder ${crcRem(got.slice(0, 4), '1011').rem === got.slice(4) ? '000' : 'non-zero'}`, 'caught', true]];
  rows.forEach(([s, how, verdict, hot], i) => {
    const y = 160 + i * 46;
    if (hot) d.fillRect(20, y - 18, 600, 38, C.accFaint, 1, 4);
    d.text(40, y, s, { cls: 'ttl', a: 'start', color: hot ? C.acc : undefined }); d.mono(140, y, how, { a: 'start', size: 10 });
    if (hot) d.glow((g) => g.mono(600, y, verdict, { a: 'end', size: 11, color: C.acc })); else d.mono(600, y, verdict, { a: 'end', size: 11, color: C.gray });
  });
  d.text(320, 300, 'none of these stops an attacker: anyone can recompute them', { cls: 'xs' });
  return d.svg();
}
export function cn_crc() {
  const data = '1101', gen = '1011', { rem, steps } = crcRem(data, gen), code = data + rem, check = crcRem(code.slice(0, 4), gen);
  const d = illustration('cn_crc', `CRC: DIVIDE ${data}000 BY ${gen}, SEND REMAINDER ${rem}, RECEIVER GETS ZERO`, 340);
  const X = (i) => 80 + i * 22;
  d.mono(40, 56, gen, { a: 'start', size: 13 }); d.line(X(0) - 6, 44, X(0) - 6, 66, { stroke: C.ink2, single: true }); d.line(X(0) - 6, 44, X(7), 44, { stroke: C.ink2, single: true });
  (data + '000').split('').forEach((b, i) => d.mono(X(i) + 5, 56, b, { size: 13, color: i >= 4 ? C.gray : undefined }));
  let a = (data + '000').split('').map(Number);
  steps.forEach(([i], k) => {
    const y = 80 + k * 44;
    gen.split('').forEach((b, j) => d.mono(X(i + j) + 5, y, b, { size: 13, color: C.gray }));
    d.line(X(i) - 4, y + 10, X(i + 4) - 4, y + 10, { stroke: C.ink2, single: true });
    gen.split('').forEach((b, j) => { a[i + j] ^= Number(b); });
    a.forEach((b, j) => { if (j >= i + 1 && j < Math.min(7, i + 5)) d.mono(X(j) + 5, y + 22, String(b), { size: 13, color: j >= 4 && k === steps.length - 1 ? C.acc : undefined }); });
  });
  d.text(300, 70, 'XOR, no carries', { cls: 'sm', a: 'start' });
  d.text(300, 92, `remainder ${rem}`, { cls: 'ttl', a: 'start', color: C.acc });
  d.tape(330, 150, code.split(''), { cw: 32, h: 30, hot: (i) => i >= 4 });
  d.text(330, 200, `codeword ${code} goes on the wire`, { cls: 'sm', a: 'start' });
  d.laptop(360, 238, 50);
  d.glow((g) => g.box(450, 244, 140, 40, `remainder ${check.rem}: accept`, { fill: C.accSoft, stroke: C.acc, cls: 'mono', size: 10.5 }));
  d.travel([[400, 186], [400, 236]], { dur: 3, r: 3.5 });
  return d.svg();
}
export function cn_ethernet() {
  const d = illustration('cn_ethernet', 'A SWITCH GIVES EVERY HOST ITS OWN FULL-DUPLEX LINK, BUT BROADCASTS STILL REACH THEM ALL', 340);
  d.ellipse(320, 180, 580, 270, { stroke: C.gray, dash: [6, 5] }); d.text(320, 58, 'one broadcast domain', { cls: 'xs' });
  d.router(280, 166, 80, { label: 'switch' });
  const hosts = [[100, 100], [100, 240], [540, 100], [540, 240]];
  hosts.forEach(([x, y], i) => {
    const hot = i === 2;
    d.laptop(x - 22, y - 16, 44);
    const sx = x < 320 ? 280 : 360, sy = 180;
    const dx = x < 320 ? 26 : -26;
    const a = [x + dx, y - 3], b = [sx, sy - 6], c1 = [x + dx, y + 5], c2 = [sx, sy + 2];
    if (hot) d.glow((g) => { g.line(...a, ...b, { stroke: C.acc, single: true }); g.line(...c1, ...c2, { stroke: C.acc, single: true }); });
    else { d.line(...a, ...b, { stroke: C.ink2, single: true }); d.line(...c1, ...c2, { stroke: C.ink2, single: true }); }
    d.travel([a, b], { dur: 2, r: 2.6, color: hot ? C.acc : C.ink2 }); d.travel([c2, c1], { dur: 2, r: 2.6, color: hot ? C.acc : C.ink2 });
    d.circle((x + sx) / 2, (y + sy) / 2, 54, { stroke: C.faint, dash: [3, 3] });
  });
  d.text(450, 312, 'full duplex: send and receive at once, no collisions', { cls: 'sm', color: C.acc });
  d.text(180, 312, 'dotted circles: one collision domain per port', { cls: 'xs' });
  return d.svg();
}
export function cn_devices() {
  const d = illustration('cn_devices', 'EACH BOX READS A DIFFERENT PART OF THE FRAME BEFORE DECIDING WHERE IT GOES', 340);
  const dev = [['hub', 'bits only', 'repeats out every port', 1], ['bridge / switch', 'MAC address', 'forwards to one port', 2], ['router', 'IP address', 'picks the next hop', 3], ['gateway', 'whole message', 'translates or terminates', 7]];
  dev.forEach(([s, reads, does, layer], i) => {
    const x = 30 + i * 150, hot = i === 2;
    d.text(x + 60, 52, `layer ${layer}`, { cls: 'xs' });
    if (hot) d.glow((g) => g.router(x + 20, 96, 80, { stroke: C.acc, fill: C.accSoft })); else d.router(x + 20, 96, 80);
    d.text(x + 60, 150, s, { cls: 'ttl', color: hot ? C.acc : undefined });
    d.rect(x + 6, 180, 108, 70, { r: 3, fill: C.paper, stroke: C.line });
    const depth = [0, 1, 2, 4][i];
    for (let k = 0; k < 4; k++) d.rect(x + 12 + k * 12, 188 + k * 6, 96 - k * 24, 54 - k * 12, { r: 2, fill: k <= depth && k > 0 ? (hot ? C.accSoft : C.card) : 'none', stroke: k === depth ? (hot ? C.acc : C.ink) : C.faint, sw: k === depth ? 1.4 : 0.7 });
    d.text(x + 60, 268, `reads: ${reads}`, { cls: 'sm' }); d.text(x + 60, 286, does, { cls: 'xs' });
  });
  d.hand(320, 318, 'deeper inside the envelope = more state and more choice', { size: 14 });
  return d.svg();
}
export function cn_switch() {
const d=illustration('cn_switch','THE SWITCH LEARNS THE SOURCE PORT BEFORE CHOOSING AN EXIT',330);
  d.server(266,114,105,72,{label:'switch'});
  [[75,93,'A'],[507,66,'B'],[507,230,'C']].forEach(([x,y,s])=>d.laptop(x,y,65,{label:s}));
  d.arrow(147,121,258,139,{stroke:C.acc});d.text(195,99,'source A',{cls:'sm',color:C.acc});
  d.arrow(379,135,500,92,{stroke:C.acc});d.line(379,169,500,250,{stroke:C.line,single:true});
  figShelf(d,216,243,['A → port 1','B → port 2'],{width:210,hot:0,height:30});
  d.text(320,291,'known B: forward only on port 2',{cls:'sm'});return d.svg();
}
export function cn_vlan(){
  const d=canvas('cn_vlan','A TRUNK CARRIES DISTINCT BROADCAST DOMAINS',290);
  d.box(30,65,250,65,'VLAN 10 membership',{fill:C.accSoft,stroke:C.acc});
  d.box(360,65,250,65,'VLAN 20 membership',{fill:C.card,stroke:C.ink2});
  d.box(155,195,330,55,'802.1Q trunk: both tagged memberships',{fill:C.card,stroke:C.ink2});
  d.arrow(155,136,245,189,{stroke:C.acc});d.arrow(485,136,395,189,{stroke:C.gray});
  d.text(320,162,'No ordinary layer-2 broadcast crosses between VLANs.',{cls:'sm'});
  return d.svg();
}
export function cn_arp() {
const d=illustration('cn_arp','THE REMOTE IP PACKET LEAVES INSIDE A FRAME ADDRESSED TO THE GATEWAY',350);
  d.laptop(35,67,91,{label:'Finch'});d.router(267,105,84,{label:'gateway'});d.server(523,66,78,89,{label:'remote server'});
  d.arrow(134,98,260,115,{stroke:C.acc});d.text(195,74,'ARP: who has gateway IP?',{cls:'sm',size:10});
  d.arrow(260,151,134,137,{stroke:C.ink2});d.text(188,174,'gateway MAC reply',{cls:'sm'});
  d.arrow(360,123,515,111,{stroke:C.ink2});
  d.rect(53,222,531,83,{r:1,fill:C.accSoft,stroke:C.acc});d.mono(70,242,'Ethernet destination = gateway MAC',{a:'start',size:11});
  d.rect(71,259,491,30,{r:0,fill:C.paper,stroke:C.ink2});d.mono(316,274,'IP destination = remote server',{size:11});
  d.text(320,330,'remote destination, local next-hop neighbour',{cls:'sm'});return d.svg();
}
export function cn_ipv4() {
const d=illustration('cn_ipv4','A /26 PREFIX DIVIDES THE ADDRESS INTO NETWORK AND HOST BITS',320);
  const bits=[192,168,10,70].map(v=>v.toString(2).padStart(8,'0')).join('');
  bits.split('').forEach((b,i)=>{const x=32+i*18;d.rect(x,95,18,37,{r:0,fill:i<26?C.card:C.accSoft,stroke:i<26?C.line:C.acc});d.mono(x+9,113,b,{size:9});});
  d.brace(32,32+26*18,151,{label:'26 network bits'});d.brace(32+26*18,608,151,{label:'6 host bits',stroke:C.acc,color:C.acc});
  d.mono(320,57,'192.168.10.70',{size:17});
  figShelf(d,54,221,['network .64','Finch .70','broadcast .127'],{width:532,hot:1,height:36});
  d.mono(320,285,`${2**6} addresses − 2 reserved = ${2**6-2} ordinary hosts`,{size:12});return d.svg();
}
export function cn_subnet() {
  const s = N.subnets;
  const d = illustration('cn_subnet', `192.168.10.0/24 HALVES TWICE: THE /26 BLOCK .64 TO .127 HOLDS ${s[26].addresses} ADDRESSES, ${s[26].ordinary_hosts} HOSTS`, 330);
  const X = (a) => 40 + a * 560 / 256;
  [[24, 1, 60], [25, 2, 110], [26, 4, 160]].forEach(([p, k, y]) => {
    d.text(30, y + 14, '/' + p, { cls: 'mono', a: 'end', size: 11 });
    for (let i = 0; i < k; i++) { const a = i * 256 / k, hot = p === 26 && i === 1; d.rect(X(a) + 2, y, 560 / k - 4, 28, { r: 3, fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2 }); d.mono((X(a) + X(a + 256 / k)) / 2, y + 14, `.${a} – .${a + 256 / k - 1}`, { size: 10 }); }
    d.mono(600, y + 40, `${s[p].addresses} addresses each`, { a: 'end', size: 9.5, color: C.gray });
  });
  d.glow((g) => g.rect(X(64), 156, X(128) - X(64), 36, { r: 4, stroke: C.acc, sw: 1.4 }));
  const marks = [[N.network, 64, 'network'], [N.first_host, 65, 'first host'], [N.last_host, 126, 'last host'], [N.broadcast, 127, 'broadcast']];
  marks.forEach(([ip, a, s2], i) => { const x = 60 + i * 150; d.line(X(a), 194, x + 50, 236, { stroke: C.line, single: true }); chip(d, x, 238, 110, ip, i === 1 || i === 2, 22); d.text(x + 55, 274, s2, { cls: 'xs' }); });
  d.mono(320, 304, `${s[26].addresses} − network − broadcast = ${s[26].ordinary_hosts} usable`, { size: 10.5, color: C.acc });
  return d.svg();
}
export function cn_public_private() {
  const d = illustration('cn_public_private', 'ADDRESS SCOPES ARE NESTED RINGS: HOST, LINK, SITE, INTERNET', 350);
  const cx = 230, cy = 190;
  [[200, 'public: routed on the Internet', C.paper, C.line], [150, 'private 10/8, 172.16/12, 192.168/16', C.accFaint, C.acc], [96, 'link-local 169.254/16', C.card, C.ink2], [46, '', C.paper, C.ink2]].forEach(([r, s, f, st], i) => {
    const draw = (g) => g.ellipse(cx, cy, r * 2.1, r * 1.6, { fill: f, stroke: st, sw: i === 1 ? 1.6 : 1 });
    if (i === 1) d.glow(draw); else draw(d);
    if (s) d.text(cx, cy - r * 0.8 + 14, s, { cls: 'xs', color: i === 1 ? C.acc : undefined });
  });
  d.laptop(cx - 20, cy - 12, 40); d.mono(cx, cy + 30, '127.0.0.1', { size: 9.5 });
  d.router(cx + 150, cy + 40, 50); d.text(cx + 175, cy + 70, 'NAT at the edge', { cls: 'xs' });
  d.text(470, 120, 'private addresses are reused', { cls: 'sm', a: 'start' }); d.text(470, 138, 'in millions of homes;', { cls: 'sm', a: 'start' }); d.text(470, 156, 'routers drop them on the', { cls: 'sm', a: 'start' }); d.text(470, 174, 'public Internet', { cls: 'sm', a: 'start' });
  d.mono(470, 230, '0.0.0.0:443', { a: 'start', size: 10.5 }); d.text(470, 248, 'listen on every local address', { cls: 'xs', a: 'start' });
  d.travel([[cx, cy], [cx + 175, cy + 46], [cx + 300, cy - 120]], { dur: 4, token: 'packet' });
  return d.svg();
}
export function cn_dhcp() {
  const d = illustration('cn_dhcp', 'DHCP IN FOUR MESSAGES: A NEW LAPTOP SHOUTS, A SERVER OFFERS, THE LAPTOP ACCEPTS', 340);
  d.laptop(40, 130, 80, { label: 'Finch, no address yet' });
  d.server(520, 110, 60, 80, { label: 'DHCP server' });
  const msgs = [['Discover', 1, 'broadcast to 255.255.255.255'], ['Offer', -1, `${N.client_ip}, /26`], ['Request', 1, 'I take that offer'], ['Ack', -1, 'lease confirmed']];
  msgs.forEach(([s, dir, sub], i) => {
    const y = 66 + i * 50, hot = i === 0;
    const [x1, x2] = dir > 0 ? [140, 510] : [510, 140];
    if (hot) d.glow((g) => g.arrow(x1, y, x2, y, { stroke: C.acc, sw: 1.6 })); else d.arrow(x1, y, x2, y, { stroke: C.ink2 });
    d.text(325, y - 12, `${i + 1} ${s}`, { cls: 'ttl', size: 11, color: hot ? C.acc : undefined }); d.text(325, y + 12, sub, { cls: 'xs' });
    d.travel([[x1, y], [x2, y]], { at: [i / 4, (i + 1) / 4], dur: 8, token: 'packet' });
  });
  [0, 1, 2].forEach((k) => d.pulse(80, 150, { r0: 10, r1: 60, at: [k * 0.08, 0.25 + k * 0.08], dur: 8 }));
  d.doc(170, 262, 300, 64, { lines: false, fill: C.paper });
  d.mono(186, 280, `address ${N.client_ip}/26   gateway ${N.gateway}`, { a: 'start', size: 10 });
  d.mono(186, 302, 'plus DNS server and lease duration', { a: 'start', size: 10 });
  return d.svg();
}
export function cn_nat() {
  const d = illustration('cn_nat', 'PAT REWRITES THE SOURCE ON THE WAY OUT AND LOOKS IT UP ON THE WAY BACK', 340);
  d.rect(20, 40, 210, 230, { r: 8, fill: C.card, stroke: C.line, dash: [5, 4] }); d.text(125, 58, 'home, 192.168.10.0/26', { cls: 'xs' });
  d.laptop(60, 110, 70, { label: '192.168.10.70:51000' });
  d.router(220, 150, 70, { label: 'gateway' });
  d.cloud(380, 90, 120, 70, { fill: C.paper }); d.server(560, 110, 40, 60, { label: '203.0.113.20:443' });
  d.rect(170, 234, 260, 70, { r: 4, fill: C.paper, stroke: C.ink2 }); d.text(300, 248, 'translation table', { cls: 'xs' });
  d.mono(186, 270, '192.168.10.70:51000', { a: 'start', size: 9.5 }); d.mono(310, 270, '↔', { size: 10 }); d.mono(326, 270, '198.51.100.7:40001', { a: 'start', size: 9.5 });
  d.glow((g) => g.rect(180, 258, 240, 24, { r: 3, stroke: C.acc }));
  d.travel([[110, 140], [255, 140]], { at: [0, 0.22], dur: 9, label: 'src .70:51000', w: 92, fill: C.card, color: C.ink2 });
  d.travel([[285, 140], [560, 130]], { at: [0.25, 0.5], dur: 9, label: 'src 198.51.100.7:40001', w: 150, fill: C.card, color: C.ink2 });
  d.travel([[560, 150], [290, 170]], { at: [0.55, 0.8], dur: 9, label: 'dst 198.51.100.7:40001', w: 150 });
  d.travel([[255, 170], [110, 160]], { at: [0.82, 1], dur: 9, label: 'dst .70:51000', w: 92 });
  d.text(470, 230, 'a reply without a table\nentry is dropped', { cls: 'sm', vc: true });
  return d.svg();
}
export function cn_ipv4_header() {
  const d = illustration('cn_ipv4_header', 'THE 20-BYTE IPV4 HEADER, AND THE TTL THAT EACH ROUTER COUNTS DOWN', 350);
  const x0 = 40, W = 400, bw = W / 32, rows = [[['ver', 4], ['IHL', 4], ['DSCP/ECN', 8], ['total length', 16]], [['identification', 16], ['flags', 3], ['fragment offset', 13]], [['TTL', 8], ['protocol', 8], ['header checksum', 16]], [['source address', 32]], [['destination address', 32]]];
  for (let b = 0; b <= 32; b += 8) d.mono(x0 + b * bw, 44, String(b), { size: 9, color: C.gray });
  rows.forEach((r, i) => { let b = 0; r.forEach(([s, w]) => { const hot = s === 'TTL'; const draw = (g) => g.box(x0 + b * bw, 54 + i * 40, w * bw, 40, s, { r: 0, fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2, cls: 'mono', size: 10 }); if (hot) d.glow(draw); else draw(d); b += w; }); });
  d.text(470, 74, '32 bits per row,', { cls: 'sm', a: 'start' }); d.text(470, 92, '5 rows = 20 bytes', { cls: 'sm', a: 'start' });
  d.text(470, 150, 'protocol 6 = TCP', { cls: 'sm', a: 'start' }); d.text(470, 168, '17 = UDP, 1 = ICMP', { cls: 'sm', a: 'start' });
  const hops = [60, 200, 340, 480];
  hops.forEach((x, i) => { d.router(x, 286, 50); d.mono(x + 25, 324, `TTL ${64 - i}`, { size: 10, color: i === 3 ? C.acc : undefined }); if (i < 3) d.line(x + 52, 294, x + 138, 294, { stroke: C.line, single: true }); });
  d.travel([[85, 278], [505, 278]], { dur: 5, token: 'packet' });
  d.text(600, 294, 'at 0: dropped,\nICMP sent back', { cls: 'xs', a: 'end', vc: true });
  return d.svg();
}
export function cn_ipv6() {
  const d = illustration('cn_ipv6', `IPV4 IS ${N.ipv4_bits} BITS, IPV6 IS ${N.ipv6_bits}: FOUR TIMES THE LENGTH, 2^96 TIMES THE SPACE`, 320);
  d.text(40, 60, 'IPv4', { cls: 'ttl', a: 'start' }); d.rect(100, 48, 124, 24, { r: 2, fill: C.card, stroke: C.ink2 }); d.mono(162, 60, '203.0.113.20', { size: 10 });
  d.text(40, 104, 'IPv6', { cls: 'ttl', a: 'start', color: C.acc });
  d.glow((g) => g.rect(100, 92, 16 * 31, 24, { r: 2, fill: C.accSoft, stroke: C.acc }));
  for (let i = 1; i < 8; i++) d.line(100 + i * 62, 92, 100 + i * 62, 116, { stroke: C.acc, single: true, sw: 0.6 });
  d.mono(348, 104, '2001:0db8:0000:0000:0000:0000:0000:0001', { size: 10 });
  d.mono(348, 132, 'written 2001:db8::1', { size: 10, color: C.gray });
  const tiles = [['link-local', 'fe80::/10', 'talk to neighbours, no router needed'], ['multicast', 'ff02::1', 'all nodes on this link; no broadcast'], ['SLAAC', 'prefix from router + own 64-bit ID', 'host builds its own address']];
  tiles.forEach(([s, ex, sub], i) => { const x = 30 + i * 200; panel(d, x, 168, 186, 120, s, false); d.mono(x + 93, 214, ex, { size: 9.5 }); d.text(x + 93, 250, sub, { cls: 'xs' }); });
  return d.svg();
}
export function cn_routing() {
const d=illustration('cn_routing','LONGEST PREFIX MATCH PICKS THE NARROWEST CONTAINING ADDRESS RANGE',330);
  [['10.0.0.0/8',46,520],['10.1.0.0/16',126,362],['10.1.2.0/24',227,158]].forEach(([s,x,w],i)=>{const y=67+i*71;d.rect(x,y,w,48,{r:0,fill:i===2?C.accSoft:C.card,stroke:i===2?C.acc:C.ink2});d.mono(x+10,y+24,s,{a:'start',size:12});});
  d.arrow(340,265,340,241,{stroke:C.acc});d.mono(340,286,'destination 10.1.2.50',{size:13});
  d.text(320,315,'nested ranges are schematic, not drawn to address-space scale',{cls:'sm'});return d.svg();
}
export function cn_protocols() {
  const d = illustration('cn_protocols', 'RIP COUNTS HOPS, OSPF MAPS THE AREA, BGP CHOOSES PATHS BETWEEN NETWORKS BY POLICY', 420);
  panel(d, 18, 40, 296, 140, 'RIP: distance vector', false);
  const r = [[60, 110], [140, 90], [220, 120], [290, 100]];
  r.forEach(([x, y], i) => { d.router(x - 18, y, 36); d.mono(x, y + 28, `${i} hops`, { size: 9 }); if (i) d.line(r[i - 1][0] + 18, r[i - 1][1] + 6, x - 18, y + 6, { stroke: C.line, single: true }); });
  d.text(166, 168, 'tells neighbours only distances', { cls: 'xs' });
  panel(d, 326, 40, 296, 140, 'OSPF: link state + Dijkstra', false);
  const o = [[370, 90], [440, 75], [510, 100], [580, 80], [420, 140], [540, 145]];
  [[0, 1], [1, 2], [2, 3], [0, 4], [4, 5], [5, 3], [1, 4], [2, 5]].forEach(([a, b]) => d.line(...o[a], ...o[b], { stroke: C.line, single: true }));
  [[0, 1], [1, 2], [2, 3]].forEach(([a, b]) => d.line(...o[a], ...o[b], { stroke: C.ink, sw: 2, single: true }));
  o.forEach(([x, y]) => d.circle(x, y, 14, { fill: C.card, stroke: C.ink2 }));
  d.text(474, 168, 'every router holds the whole map', { cls: 'xs' });
  panel(d, 18, 192, 604, 210, 'BGP: path vector between autonomous systems', true);
  const m = world(d, 40, 216, 560, 160, { lat: [-50, 72] });
  const as = [['virginia', 'AS64500'], ['frankfurt', 'AS3356'], ['mumbai', 'AS9498'], ['singapore', 'AS15169']];
  const P = as.map(([c]) => m.at(c));
  for (let i = 0; i < 3; i++) d.glow((g) => g.path(`M${P[i][0]},${P[i][1]} Q${(P[i][0] + P[i + 1][0]) / 2},${Math.min(P[i][1], P[i + 1][1]) - 30} ${P[i + 1][0]},${P[i + 1][1]}`, { stroke: C.acc, sw: 1.5, single: true }));
  as.forEach(([c, s], i) => { const [x, y] = P[i]; d.circle(x, y, 10, { fill: C.accSoft, stroke: C.acc }); d.mono(x, y + 16, s, { size: 9 }); });
  d.travel(`M${P[0][0]},${P[0][1]} Q${(P[0][0] + P[1][0]) / 2},${Math.min(P[0][1], P[1][1]) - 30} ${P[1][0]},${P[1][1]} Q${(P[1][0] + P[2][0]) / 2},${Math.min(P[1][1], P[2][1]) - 30} ${P[2][0]},${P[2][1]} Q${(P[2][0] + P[3][0]) / 2},${Math.min(P[2][1], P[3][1]) - 30} ${P[3][0]},${P[3][1]}`, { dur: 6, r: 4 });
  d.mono(320, 392, 'route 8.8.8.0/24, AS path 3356 9498 15169: shortest is not required, policy wins', { size: 9.5 });
  return d.svg();
}
export function cn_icmp() {
  const d = illustration('cn_icmp', 'PING ASKS FOR AN ECHO; TRACEROUTE SENDS TTL 1, 2, 3 AND COLLECTS THE COMPLAINTS', 330);
  d.laptop(30, 140, 60, { label: 'host' });
  const R = [170, 290, 410]; R.forEach((x, i) => d.router(x, 156, 50, { label: `router ${i + 1}` }));
  d.server(540, 130, 46, 60, { label: 'target' });
  d.line(92, 165, 540, 165, { stroke: C.line, single: true });
  d.glow((g) => g.arrow(92, 70, 536, 70, { stroke: C.acc, sw: 1.6 })); d.text(314, 58, 'Echo Request', { cls: 'mono', size: 10, color: C.acc });
  d.arrow(536, 96, 92, 96, { stroke: C.ink2 }); d.text(314, 108, 'Echo Reply', { cls: 'mono', size: 10 });
  d.travel([[92, 70], [536, 70]], { at: [0, 0.2], dur: 10, r: 3.5 }); d.travel([[536, 96], [92, 96]], { at: [0.2, 0.36], dur: 10, r: 3.5, color: C.ink2 });
  R.forEach((x, i) => {
    const y = 214 + i * 30;
    d.arrow(92, y, x + 20, y, { stroke: C.gray, hl: 6 }); d.mono(98, y - 9, `TTL ${i + 1}`, { size: 9, a: 'start' });
    d.carrow([[x + 25, y], [x + 30, y + 10], [x, y + 12], [96, y + 12]], { stroke: C.ink2, dash: [3, 3], hl: 5 });
    d.mono(x + 34, y + 2, 'Time Exceeded', { size: 9, a: 'start' });
    d.travel([[92, y], [x + 20, y]], { at: [0.4 + i * 0.2, 0.5 + i * 0.2], dur: 10, r: 3, color: C.ink2 });
  });
  return d.svg();
}
