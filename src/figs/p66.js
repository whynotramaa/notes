import { C } from '../lib/draw.js';
import { canvas, flow, cards, ledger, lanes } from '../lib/fundamentals-figures.js';
import { systemFigure, systemMap, systemCover } from '../lib/system-figures.js';
import n from '../data/system-design/traffic-routing-numbers.json' with { type: 'json' };

const parts = ['Reverse proxies and API gateways', 'L4 and L7 load balancing', 'Load balancing algorithms', 'Consistent hashing and sticky sessions', 'Health checks and failover', 'Service discovery', 'DNS, CDN and geographic routing', 'The complete routed request'];
export function where_sd_traffic_routing(stage = 99) { return systemMap('sd_traffic_routing', parts, stage); }
export function cover_sd_traffic_routing() { return systemCover('sd_traffic_routing', 7, ['Load', 'balancing'], 'One request, every routing decision', parts); }
export function sd_tr_proxy() { return flow('sd_tr_proxy', 'TWO CONNECTIONS, ONE PUBLIC ENDPOINT', ['browser', 'public proxy', 'private application'], ['client connection', 'select upstream', 'upstream connection'], 1); }
export function sd_tr_gateway() { return systemFigure('sd_tr_gateway', 'SELECT A SERVICE BEFORE SELECTING A SERVER', 'fan', { source: 'gateway route table', targets: ['GET /scores → score pool', 'POST /clips → media pool'] }); }
export function sd_tr_tls() { return flow('sd_tr_tls', 'TRUSTED METADATA STARTS AT A TRUSTED HOP', ['client TLS', 'proxy terminates', 'normalize headers', 'upstream TLS', 'application'], ['public input', 'peer identity', 'replace claimed origin', 'verify upstream peer', 'business authorization'], 2); }
export function sd_tr_pool() { return ledger('sd_tr_pool', 'REUSE SOCKETS WITHOUT CONFUSING THEM WITH REQUESTS', ['Scope', 'Limit', 'Meaning'], [['per endpoint', '20 sockets', 'active + idle pool'], ['five endpoints', `${n.pool_sockets} sockets`, 'one proxy total'], ['reuse', 'existing connection', 'skip new handshake']], 2); }
export function sd_tr_l4() { return flow('sd_tr_l4', 'TRANSPORT ROUTING SELECTS THE CONNECTION OWNER', ['client flow', 'address + port', 'gateway A', 'same flow stays'], ['encrypted HTTP inside', 'L4 selection input', 'established socket', 'no per-path decision'], 2); }
export function sd_tr_l7() { return systemFigure('sd_tr_l7', 'REQUEST MESSAGES CAN CHOOSE DIFFERENT POOLS', 'fan', { source: 'one HTTP connection', targets: ['/scores → score service', '/clips → media service'] }); }
export function sd_tr_multiplex() { return ledger('sd_tr_multiplex', 'SOCKET COUNT AND REQUEST WORK CAN DISAGREE', ['Server', 'Connections', 'Active requests'], [['A', n.http2_connections[0], n.http2_active[0]], ['B', n.http2_connections[1], n.http2_active[1]], ['next request', 'least sockets picks B', 'least requests picks A']], 1); }
export function sd_tr_drain() { return lanes('sd_tr_drain', 'RECONNECT RESUMES APPLICATION PROGRESS', 'viewer', 'gateway', [[1, 'socket to A; last seen sequence saved'], [-1, 'A drains and closes'], [1, 'reconnect through route to B'], [1, 'resume from saved cursor'], [-1, 'replay gap, then live events']], 'a routing weight changes new assignments'); }
export function sd_tr_rr() { return ledger('sd_tr_rr', 'EQUAL REQUEST COUNTS CAN HIDE UNEQUAL WORK', ['Endpoint', 'Request costs', 'Total service'], [['A', '10 + 10', `${n.rr_cost_ms[0]} ms`], ['B', '100 + 100', `${n.rr_cost_ms[1]} ms`], ['C', '10 + 10', `${n.rr_cost_ms[2]} ms`]], 1); }
export function sd_tr_weight() { return systemFigure('sd_tr_weight', 'WEIGHTS DIVIDE ASSIGNMENTS BY RELATIVE SHARE', 'bars', [['A weight 1', n.weighted_qps[0], '/s'], ['C weight 1', n.weighted_qps[2], '/s'], ['B weight 2', n.weighted_qps[1], '/s']]); }
export function sd_tr_canary() { return systemFigure('sd_tr_canary', 'REQUEST SHARE IS NOT CONNECTION SHARE', 'bars', [['established version', n.remaining_qps, '/s'], ['candidate version', n.canary_qps, '/s']]); }
export function sd_tr_least_conn() { return ledger('sd_tr_least_conn', 'LEAST CONNECTIONS SELECTS THE SMALLER SOCKET COUNT', ['Endpoint', 'Sockets', 'Active requests'], [['A', n.least_connection_A, n.least_outstanding_A], ['B selected', n.least_connection_B, n.least_outstanding_B]], 1); }
export function sd_tr_least_req() { return ledger('sd_tr_least_req', 'LEAST REQUESTS SELECTS THE SMALLER ACTIVE COUNT', ['Endpoint', 'Sockets', 'Active requests'], [['A selected', n.least_connection_A, n.least_outstanding_A], ['B', n.least_connection_B, n.least_outstanding_B]], 0); }
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
export function sd_tr_hot() { return systemFigure('sd_tr_hot', 'KEY OWNERSHIP DOES NOT BALANCE KEY POPULARITY', 'bars', [['B', n.sticky_qps[1], '/s'], ['C', n.sticky_qps[2], '/s'], ['D', n.sticky_qps[3], '/s'], ['A hot owner', n.sticky_qps[0], '/s']]); }
export function sd_tr_sticky() { return flow('sd_tr_sticky', 'AFFINITY IS A PREFERENCE WITH A FAILURE POLICY', ['session key', 'preferred owner', 'eligibility check', 'fallback endpoint', 'restore session'], ['stable identity', 'locality benefit', 'failed owner removed', 'new transport owner', 'shared durable state'], 3); }
export function sd_tr_affinity_failure() { return systemFigure('sd_tr_affinity_failure', 'CONNECTION CAPACITY AFTER ONE GATEWAY LOSS', 'bars', [['five → four', n.five_one_failure_load, 'each'], ['six → five', n.six_one_failure_load, 'each'], ['seven → six', Number(n.seven_one_failure_load.toFixed(6)), 'each']]); }
export function sd_tr_health() { return cards('sd_tr_health', 'EVIDENCE MUST MATCH THE ROUTING DECISION', [['active probe', 'scheduled request to named readiness contract'], ['passive result', 'real timeout or classified connection error'], ['remove endpoint', 'failure threshold met'], ['not machine failure', 'one user denied permission']], 2); }
export function sd_tr_detection() { return systemFigure('sd_tr_detection', 'PROBE PHASE AND TIMEOUT SET DETECTION', 'timeline', { events: [[0, 'just after success'], [5, 'first probe'], [10, 'second probe'], [15, 'third probe'], [16, 'removed']], end: n.detection_max_s }); }
export function sd_tr_readiness() { return flow('sd_tr_readiness', 'PROCESS SURVIVAL AND NEW ASSIGNMENT DIFFER', ['starting', 'ready', 'draining', 'stopped'], ['alive, not selected', 'new work allowed', 'no new assignment', 'remaining sockets close'], 2); }
export function sd_tr_capacity() { return systemFigure('sd_tr_capacity', 'BALANCING CANNOT CREATE MISSING CAPACITY', 'bars', [['five endpoints', n.normal_capacity, '/s'], ['four survivors', n.one_failure_capacity, '/s'], ['three survivors', n.two_failure_capacity, '/s']], 'peak demand remains 1,000 requests/s'); }
export function sd_tr_registry() { return flow('sd_tr_registry', 'MEMBERSHIP PUBLICATION AND USE HAPPEN AT DIFFERENT TIMES', ['instance starts', 'registry updated', 'router cached list', 'eligible endpoint'], ['stable service name', 'new endpoint recorded', 'refresh required', 'health checked too'], 1); }
export function sd_tr_discovery_modes() { return systemFigure('sd_tr_discovery_modes', 'THE LOCATION OF SELECTION CHANGES', 'split', [['client discovery', 'caller → directory\ncaller → chosen endpoint'], ['proxy discovery', 'caller → stable proxy\nproxy → chosen endpoint']]); }
export function sd_tr_stale() { return systemFigure('sd_tr_stale', 'EXPIRY IS NOT AN APPLIED CONFIGURATION', 'timeline', { events: [[n.cached_at_s, 'list fetched'], [n.registry_update_s, 'registry changes'], [n.discovery_lifetime_s, 'cache expires'], [n.refresh_s, 'router refreshes']], end: n.refresh_s }); }
export function sd_tr_remove() { return systemFigure('sd_tr_remove', 'A REMOVED WRITER CAN STILL BE RUNNING', 'sequence', { actors: ['old owner', 'registry', 'storage'], steps: [[1, 0, 'lease no longer current'], [0, 2, 'late write, old generation'], [2, 0, 'reject stale fencing token']] }); }
export function sd_tr_geo_path() { return flow('sd_tr_geo_path', 'ONE PUBLIC PATH, DIFFERENT DECISIONS AT EACH HOP', ['user', 'DNS', 'CDN or edge', 'load balancer', 'application'], ['request identity', 'entry address', 'permitted cached response', 'eligible endpoint', 'authorized state'], 3); }
export function sd_tr_dns() { return systemFigure('sd_tr_dns', 'A PREVIOUS ANSWER CAN OUTLIVE A ROUTE UPDATE', 'timeline', { events: [[0, 'answer cached'], [n.registry_update_s, 'record changes'], [n.dns_ttl_s, 'old answer expires']], end: n.dns_ttl_s }); }
export function sd_tr_cache() { return systemFigure('sd_tr_cache', 'COLD FAILOVER CHANGES ORIGIN DEMAND', 'bars', [['warm edge misses', n.origin_cache_qps, '/s'], ['cold edge misses', n.origin_cold_qps, '/s']]); }
export function sd_tr_region() { return systemFigure('sd_tr_region', 'TRAFFIC MOVEMENT DOES NOT TRANSFER WRITE AUTHORITY', 'split', [['read path', 'fresh enough replica\nauthorized response'], ['write path', 'history ready\nnew generation fenced']]); }
export function sd_tr_recovery() { return systemFigure('sd_tr_recovery', 'RECOVERY REPLAY ADDS TO LIVE DELIVERY', 'bars', [['live payload', n.live_bytes_s / 1000000, 'MB/s'], ['replay payload', n.replay_bytes_s / 1000000, 'MB/s'], ['combined', n.gateway_replay_total_bytes_s / 1000000, 'MB/s']]); }
export function sd_tr_deadline() { return ledger('sd_tr_deadline', 'CARRY THE REMAINING DEADLINE THROUGH EVERY HOP', ['Budget step', 'Used / reserved', 'Time left'], [['total deadline', '250 ms', '250 ms'], ['setup + routing', '100 ms', '150 ms'], ['reserve return path', '40 ms', `${n.backend_budget_ms} ms`], ['application work', '60 ms', '50 ms slack']], 2); }
export function sd_tr_trace() { return ledger('sd_tr_trace', 'THE SERIAL TRACE RECONCILES TO 200 MILLISECONDS', ['Stage', 'Decision', 'Duration'], [['DNS', 'resolve entry', `${n.serial_route_ms[0]} ms`], ['transport', 'establish connection', `${n.serial_route_ms[1]} ms`], ['TLS', 'authenticate hop', `${n.serial_route_ms[2]} ms`], ['edge + routing', 'cache miss, select', `${n.serial_route_ms[3]} ms`], ['application', 'authorize and read', `${n.serial_route_ms[4]} ms`], ['transfer', 'return payload', `${n.serial_route_ms[5]} ms`]], 4); }
export function sd_tr_write_retry() { return systemFigure('sd_tr_write_retry', 'A LOST RESPONSE DOES NOT PROVE A ROLLBACK', 'sequence', { actors: ['scorer', 'application', 'state store'], steps: [[0, 1, 'score command, stable key'], [1, 2, 'commit effect + identity'], [1, 0, 'response lost'], [0, 1, 'retry same key, new endpoint'], [1, 2, 'read recorded outcome'], [1, 0, 'return original result']] }); }
export function sd_tr_sizing() { return ledger('sd_tr_sizing', 'SIZE REQUESTS, CONNECTIONS AND REPLAY SEPARATELY', ['Resource', 'Surviving budget', 'Offered demand'], [['apps, one loss', `${n.one_failure_capacity}/s`, `${n.peak_qps}/s; 200/s margin`], ['6 gateways, lose 1', '50,000 sockets', '50,000 viewers'], ['7 gateways, lose 1', '60,000 sockets', '50,000 viewers'], ['recovery payload', 'measure NIC limit', '210,000,000 bytes/s']], 0); }
export function sd_tr_jobs() { return cards('sd_tr_jobs', 'EACH LAYER OWNS A SPECIFIC DECISION', [['DNS', 'resolve entry; future connections'], ['edge cache', 'reuse permitted content'], ['gateway + proxy', 'policy, trusted forwarding'], ['balancer', 'eligible connection or request owner'], ['discovery + health', 'membership and ability to serve'], ['application + state', 'authorization, version, effect identity']], 5); }
