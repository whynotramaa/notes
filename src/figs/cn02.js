import { C } from '../lib/draw.js';
import { canvas, ledger, lanes, flow } from '../lib/fundamentals-figures.js';
import values from '../data/fundamentals/numbers.json' with { type: 'json' };
import extra from '../data/fundamentals/cn-extra-numbers.json' with { type: 'json' };
const N = values.cn;
const box = (d,x,y,w,h,label,on=false) => d.box(x,y,w,h,label,{fill:on?C.accSoft:C.card,stroke:on?C.acc:C.ink2,size:11});

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
export function cn_tcp_udp(){
  const d=canvas('cn_tcp_udp','DATAGRAM BOUNDARIES VERSUS ORDERED BYTES',260);
  d.text(170,50,'UDP messages',{cls:'ttl'});d.text(480,50,'TCP receive buffer',{cls:'ttl'});
  [0,1,2].forEach(i=>box(d,35+i*90,85,76,52,['A','B','C'][i]));
  box(d,335,85,275,52,'A bytes | B bytes | C bytes',true);
  d.arrow(170,148,170,185,{stroke:C.gray});d.arrow(480,148,480,185,{stroke:C.acc});
  d.text(170,208,'one datagram per receive',{cls:'sm'});d.text(480,208,'reads can split or combine writes',{cls:'sm'});
  return d.svg();
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
export function cn_close(){return lanes('cn_close','FIN ENDS ONE DIRECTION, THEN THE OTHER','active closer','peer',[[1,'FIN ends outgoing bytes'],[-1,'ACK confirms FIN'],[-1,'remaining response, then FIN'],[1,'ACK, retain TIME_WAIT']],'half-close keeps the reverse direction usable');}
export function cn_reliable(){
  const d=canvas('cn_reliable','THE ACK IS THE NEXT CONTIGUOUS BYTE',240);
  box(d,28,76,90,55,'SYN\n1000');box(d,132,76,350,55,'data begins 1001\n1460 contiguous bytes');box(d,496,76,116,55,'ACK\n2461',true);
  d.brace(132,482,149,{label:'1001 + 1460 = 2461'});
  d.text(320,205,'A duplicate range does not become duplicate application bytes.',{cls:'sm'});
  return d.svg();
}
export function cn_window(){return ledger('cn_window','OUTSTANDING BYTES LIMIT A HIGH-RTT PATH',['policy','data allowance','rate ceiling'],[['Stop-and-Wait','1500-byte model','0.29910269 Mb/s'],['windowed',`${N.window_bytes} bytes`,`${N.window_mbps} Mb/s`],['path BDP',`${N.bdp_bytes} bytes`,'100 Mb/s']],1);}
export function cn_flow(){
  const d=canvas('cn_flow','APPLICATION READS CREATE RECEIVE-WINDOW SPACE',270);
  box(d,20,95,140,52,'sender');box(d,240,80,270,82,'receive buffer',true);box(d,240,190,270,42,'application reads bytes');
  d.arrow(165,120,235,120,{stroke:C.gray});d.text(200,99,'data',{cls:'sm'});
  d.arrow(375,168,375,185,{stroke:C.acc});
  d.arrow(240,65,80,65,{stroke:C.gray});d.text(150,48,'ACK + free-space allowance',{cls:'sm'});
  d.text(532,115,'full buffer\nrwnd = 0',{cls:'sm',a:'start',vc:true});return d.svg();
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
export function cn_dns(){
  const d=canvas('cn_dns','THE RECURSOR FOLLOWS REFERRALS, THEN CACHES THE ANSWER',330);
  box(d,18,120,135,55,'Finch stub');box(d,210,120,145,55,'recursive\nresolver');d.arrow(158,147,205,147,{stroke:C.gray});
  [60,155,250].forEach((y,i)=>{
    box(d,455,y-22,165,48,['root: TLD referral','TLD: NS referral','authority: A answer'][i],i===2);
    d.arrow(360,145,450,y,{stroke:i===2?C.acc:C.gray});
  });
  d.mono(285,285,'300 s TTL - 120 s age = 180 s');return d.svg();
}
export function cn_http(){return ledger('cn_http','A RESOURCE OPERATION HAS AN EXPLICIT RESULT',['message','field','value'],[['request','method and target','GET /users/123'],['request','virtual host','example.com'],['response','status','200 OK'],['proxy failure','status','504 upstream timeout']],0);}
export function cn_cache_headers(){return lanes('cn_cache_headers','A VALIDATOR CHECK AVOIDS AN UNCHANGED BODY','browser cache','origin',[[1,'GET + If-None-Match: "abc123"'],[-1,'ETag matches: 304 Not Modified']],'browser reuses stored body locally');}
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
export function cn_tls(){
  const d=canvas('cn_tls','LOCAL CERTIFICATE CHECKS AUTHENTICATE THE WIRE EXCHANGE',410);
  d.text(105,48,'Finch',{cls:'ttl'});d.text(535,48,'server',{cls:'ttl'});
  [105,535].forEach(x=>d.line(x,68,x,365,{stroke:C.line}));
  [[1,90,'ClientHello + offered key share'],[-1,142,'ServerHello + key share'],[-1,194,'certificate, proof and Finished'],[1,316,'client Finished, then encrypted HTTP']].forEach(([dir,y,label],i)=>{
    d.arrow(dir>0?110:530,y,dir>0?530:110,y,{stroke:i===0?C.acc:C.gray});
    d.text(320,y-15,label,{cls:'mono',size:10.5});
  });
  box(d,20,239,220,49,'local verification\nname, chain and proof');
  d.text(320,387,'Traffic keys derive from the authenticated ephemeral exchange.',{cls:'sm'});
  return d.svg();
}
export function cn_sessions(){return ledger('cn_sessions','THE BROWSER CREDENTIAL NAMES A SERVER-SIDE CHECK',['model','browser sends','server checks'],[['session','opaque identifier','lookup and revocation'],['signed token','claims and signature','issuer, audience, expiry'],['cookie policy','scope and flags','browser attachment'],['authorization','requested action','identity permission']],0);}
export function cn_cors(){return lanes('cn_cors','PREFLIGHT PRECEDES A REQUEST THAT NEEDS PERMISSION','browser','API',[[1,'OPTIONS: origin, intended method, headers'],[-1,'allowed origin, methods, headers'],[1,'actual request if permitted'],[-1,'response with exposure permission']],'CORS controls browser reads, not server identity');}
export function cn_websocket(){return lanes('cn_websocket','AFTER UPGRADE, BOTH PEERS SEND FRAMED MESSAGES','browser','server',[[1,'HTTP Upgrade request'],[-1,'101 Switching Protocols'],[1,'WebSocket data frame'],[-1,'WebSocket data frame'],[1,'ping'],[-1,'pong']],'reconnect still needs application resynchronization');}
export function cn_proxy(){
  const d=canvas('cn_proxy','THE REVERSE PROXY OWNS TWO SEPARATE EXCHANGES',260);
  box(d,20,95,155,60,'Finch\npublic client');box(d,240,95,160,60,'reverse proxy\nTLS endpoint',true);box(d,465,95,155,60,'private backend');
  d.arrow(181,115,234,115,{stroke:C.gray});d.arrow(406,115,459,115,{stroke:C.gray});
  d.arrow(234,142,181,142,{stroke:C.gray});d.arrow(459,142,406,142,{stroke:C.gray});
  d.text(205,72,'public exchange',{cls:'sm'});d.text(430,72,'upstream exchange',{cls:'sm'});d.text(320,210,'Forwarded client identity needs a trusted proxy chain.',{cls:'sm'});return d.svg();
}
export function cn_lb(){return ledger('cn_lb','BALANCERS NEED BOTH A KEY AND A HEALTH VIEW',['layer / policy','selection input','limitation'],[['L4','connection tuple','no HTTP path'],['L7','host or path','plaintext trust'],['round robin','next healthy target','unequal request work'],['sticky','session key','target owns local state']],1);}
export function cn_tunnel(){
  const d=canvas('cn_tunnel','AN OUTER ROUTE CARRIES AN INNER PACKET',250);
  box(d,20,60,600,130,'',true);d.text(35,82,'outer packet: tunnel endpoints',{a:'start',cls:'ttl'});
  box(d,70,112,500,55,'inner packet: original source and destination');
  d.text(320,223,'Outer headers spend part of the path MTU.',{cls:'sm'});return d.svg();
}
export function cn_firewall(){return ledger('cn_firewall','ADMISSION AND REPLY STATE ARE SEPARATE DECISIONS',['packet','observed state','decision'],[['inbound TCP 443','new flow','explicit allow'],['unlisted listener','new flow','default policy'],['return packet','matching admitted flow','state permits'],['expired mapping','no valid flow state','evaluate anew']],0);}
export function cn_attacks(){return ledger('cn_attacks','DEFENSES MUST MATCH THE STATE UNDER ATTACK',['attack','target','corresponding boundary'],[['ARP spoofing','local neighbour map','local policy + TLS'],['DNS poisoning','name result','resolver validation'],['SYN flood','pending connection','bounded admission'],['replay','valid earlier request','nonce or effect dedupe'],['session theft','bearer credential','credential protection']],0);}
export function cn_socket(){
  const d=canvas('cn_socket','ACCEPT ADDS A STREAM WITHOUT REMOVING THE LISTENER',300);
  box(d,25,105,170,58,'socket, bind, listen');
  [50,145,240].forEach((y,i)=>{d.arrow(201,134,300,y,{stroke:i===1?C.acc:C.gray});box(d,308,y-23,260,46,['accepted stream A','accept: new descriptor','accepted stream B'][i],i===1);});
  d.text(35,248,'listener stays open',{a:'start',cls:'sm'});return d.svg();
}
export function cn_io(){
  const d=canvas('cn_io','A READY SUBSET CAN ADVANCE WITHOUT A THREAD PER IDLE SOCKET',270);
  box(d,20,80,175,120,'registered sockets\nidle and active');box(d,255,115,140,52,'epoll\nready subset',true);box(d,455,115,165,52,'event loop\nper-stream state');
  d.arrow(201,141,249,141,{stroke:C.acc});d.arrow(401,141,449,141,{stroke:C.gray});
  d.text(320,235,'Readiness permits progress; it does not promise a whole message.',{cls:'sm'});return d.svg();
}
export function cn_cdn(){
  const d=canvas('cn_cdn','A HIT RETURNS AT THE EDGE; A MISS REACHES THE ORIGIN',300);
  box(d,20,115,130,50,'Finch');box(d,240,115,145,50,'edge cache',true);box(d,470,200,150,50,'origin');
  d.arrow(156,140,234,140,{stroke:C.gray});d.arrow(240,103,90,103,{stroke:C.acc});d.text(165,81,'hit response',{cls:'sm'});
  d.arrow(389,161,465,220,{stroke:C.gray});d.text(445,182,'miss',{cls:'sm'});d.arrow(469,259,314,178,{stroke:C.gray});return d.svg();
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
export function cn_cloud(){return flow('cn_cloud','A CONTAINER STILL NEEDS A COMPLETE FORWARD AND RETURN PATH',['namespace vNIC','host bridge','host forwarding','VPC subnet','gateway / route','server listener'],['local binding','local link lookup','policy and translation','address boundary','external next hop','accepted transport'],3);}
export function cn_url_cache(){
  const d=canvas('cn_url_cache','CACHED REPRESENTATIONS CAN END THE TRACE BEFORE DNS',280);
  box(d,20,112,150,52,'typed URL');box(d,240,112,155,52,'HTTP cache');box(d,470,50,145,48,'reuse body');box(d,470,188,145,48,'network branch',true);
  d.arrow(176,139,234,139,{stroke:C.gray});d.arrow(401,128,465,78,{stroke:C.gray});d.arrow(401,149,465,208,{stroke:C.acc});
  d.text(440,108,'hit',{cls:'sm'});d.text(440,183,'miss / validation',{cls:'sm'});return d.svg();
}
export function cn_tuple_trace(){return ledger('cn_tuple_trace','THE GATEWAY RECONSTRUCTS THE PRIVATE RETURN TUPLE',['stage','source','destination'],[['client outbound','192.168.10.70:51000','203.0.113.20:443'],['NAT outbound','198.51.100.7:40001','203.0.113.20:443'],['server reply','203.0.113.20:443','198.51.100.7:40001'],['NAT restore','203.0.113.20:443','192.168.10.70:51000']],1);}
export function cn_budget(){
  const d=canvas('cn_budget','ILLUSTRATIVE COLD EXCHANGE HAS THREE SEQUENTIAL RTT COSTS',260);
  ['TCP','TLS','HTTP request'].forEach((t,i)=>{const x=35+i*195;box(d,x,82,175,62,t,i<2);d.mono(x+87,166,'40 ms');});
  d.brace(35,600,189,{label:'40 + 40 + 40 = 120 ms'});d.text(320,237,'Excludes DNS, computation and separately counted serialization.',{cls:'sm'});return d.svg();
}
export function cn_diagnosis(){return ledger('cn_diagnosis','THE LAST SUCCESS DETERMINES THE NEXT DIAGNOSTIC QUESTION',['observation','known success','next boundary'],[['no gateway MAC','local configuration','ARP and link'],['SYN retries','route selected','path / listener'],['hostname failure','TLS peer reached','server identity'],['HTTP 504','HTTP parsed','proxy upstream']],3);}
export function cn_complete(){return lanes('cn_complete','ONE URL, ONE RESTORABLE ENDPOINT TRACE','Finch','server',[[1,'check caches and resolve example.com'],[1,'route to gateway, ARP, Ethernet'],[1,'NAT public source and IP forwarding'],[1,'TCP or QUIC, then authenticated HTTP'],[-1,'response to public mapping'],[-1,'gateway restores private endpoint']],'192.168.10.70 to 203.0.113.20, then back');}
