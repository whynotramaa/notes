import { D, C } from '../lib/draw.js';
import { systemMap, systemCover } from '../lib/system-figures.js';

const parts = ['Records and constraints', 'Useful index order', 'Query execution', 'Transactions and anomalies', 'Versions and locks', 'Write-ahead and recovery', 'Copies and visibility', 'Partitions and the complete write'];
export function where_sd_databases(stage=99) { return systemMap("sd_databases", ["Tables, keys and constraints", "B-tree, composite and covering indexes", "Query execution and joins", "Transactions and isolation levels", "MVCC, locks and deadlocks", "WAL, recovery and connection pools", "Replication and replication lag", "Sharding and consistent hashing"], stage); }
export function cover_sd_databases() { return systemCover("sd_databases", 3, ["Relational", "databases"], "Relational databases", ["Tables, keys and constraints", "B-tree, composite and covering indexes", "Query execution and joins", "Transactions and isolation levels", "MVCC, locks and deadlocks", "WAL, recovery and connection pools", "Replication and replication lag", "Sharding and consistent hashing"]); }

function frame(id, kicker, height = 310) {
  const d = new D(640, height, id);
  d.text(10, 16, kicker, { cls: 'cap', a: 'start' });
  return d;
}
function table(id, kicker, headings, rows, note, active = rows.length - 1) {
  const h = 106 + rows.length * 43;
  const d = frame(id, kicker, h + 54), x = 24, y = 73, width = 592 / headings.length;
  headings.forEach((v, i) => d.text(x + width * (i + .5), 48, v, { cls: 'ttl', size: 11 }));
  d.grid(x, y, rows.length, headings.length, width, 43, {
    val: (r, c) => rows[r][c], vcls: 'lbl', vsize: 11,
    cellFill: r => r === active ? C.accSoft : C.card,
  });
  if (note) d.hand(320, h + 28, note, { size: 18 });
  return d.svg();
}
function path(id, kicker, stations, notes, hand) {
  const d = frame(id, kicker), w = (584 - (stations.length - 1) * 26) / stations.length;
  stations.forEach((s, i) => {
    const x = 28 + i * (w + 26);
    d.box(x, 103, w, 68, s, { size: 12, fill: i === stations.length - 1 ? C.accSoft : C.card, stroke: i === stations.length - 1 ? C.acc : C.ink2 });
    if (notes[i]) d.text(x + w / 2, 201, notes[i], { cls: 'sm', size: 10, vc: true });
    if (i < stations.length - 1) d.arrow(x + w + 3, 138, x + w + 22, 138, { stroke: C.gray });
  });
  if (hand) d.hand(320, 276, hand, { size: 18 });
  return d.svg();
}
function sequence(id, kicker, actors, steps, hand) {
  const h = 140 + steps.length * 44, d = frame(id, kicker, h), xs = actors.map((_, i) => 85 + i * 470 / (actors.length - 1));
  actors.forEach((a, i) => { d.box(xs[i] - 69, 43, 138, 36, a, { fill: C.card, size: 11 }); d.line(xs[i], 87, xs[i], h - 57, { stroke: C.line, dash: [4, 5] }); });
  steps.forEach(([from, to, label], i) => {
    const y = 117 + i * 44, center = (xs[from] + xs[to]) / 2;
    d.arrow(xs[from], y, xs[to], y, { stroke: i === steps.length - 1 ? C.acc : C.ink2 });
    if (Math.abs(from - to) > 1) d.fillRect(center - 116, y - 27, 232, 22, C.paper);
    d.text(center, y - 15, label, { cls: 'sm', size: 11 });
  });
  if (hand) d.hand(320, h - 22, hand, { size: 18 });
  return d.svg();
}

export function sd_databases_tables() {
  return table('sd_databases_tables', 'FOUR EVENTS REFER TO THREE SCORERS', ['event', 'match', 'sequence', 'scorer'], [['e1', 'm7', '1', 'u4: Asha'], ['e2', 'm7', '2', 'u8: Bo'], ['e3', 'm7', '3', 'u4: Asha'], ['e4', 'm8', '1', 'u9: Chen']], 'one user can appear in several events', 2);
}
export function sd_databases_unique_race() {
  return sequence('sd_databases_unique_race', 'TWO ABSENCE CHECKS DO NOT RESERVE A KEY', ['caller A', 'database', 'caller B'], [[0, 1, 'check m7: absent'], [2, 1, 'check m7: absent'], [0, 1, 'insert m7; commit'], [2, 1, 'insert m7: unique conflict']], 'the shared rule decides at insertion');
}
export function sd_databases_keys() {
  const d = frame('sd_databases_keys', 'MANDATORY REFERENCES NEED NOT NULL AS WELL');
  d.box(200, 54, 240, 65, 'event e1\nmatch m7; scorer u4', { fill: C.accSoft, stroke: C.acc, size: 13 });
  d.box(31, 193, 225, 51, 'matches: m7 exists', { fill: C.card, size: 13 });
  d.box(384, 193, 225, 51, 'users: u4 exists', { fill: C.card, size: 13 });
  d.arrow(254, 125, 145, 187, { stroke: C.gray }); d.arrow(386, 125, 496, 187, { stroke: C.gray });
  d.text(124, 145, 'match_id FK', { cls: 'sm' }); d.text(517, 145, 'scorer_id FK', { cls: 'sm' });
  d.hand(320, 282, 'nullable is a separate relationship choice'); return d.svg();
}
export function sd_databases_index_cost() { return path('sd_databases_index_cost', 'ONE INSERT MAINTAINS THREE LOGICAL STRUCTURES', ['base row', 'event-id index', 'match-seq index'], ['stored fact', 'identity lookup', 'history lookup'], 'logical structure changes are not physical IOPS'); }
export function sd_databases_btree() {
  const d = frame('sd_databases_btree', 'SEPARATORS SELECT THE RANGE CONTAINING 16');
  d.box(223, 51, 194, 48, '12 | 20', { fill: C.card, cls: 'mono', size: 15 });
  const leaves = ['4 | 8', '12 | 14 | 16 | 18', '20 | 24'];
  leaves.forEach((s, i) => { const x = 20 + i * 211; d.arrow(260 + i * 60, 103, x + 89, 180, { stroke: i === 1 ? C.acc : C.gray }); d.box(x, 187, 178, 46, s, { fill: i === 1 ? C.accSoft : C.card, stroke: i === 1 ? C.acc : C.ink2, cls: 'mono', size: 11 }); });
  d.text(320, 251, '12 <= 16 < 20: choose the middle range', { cls: 'mono', color: C.acc, size: 11 });
  d.hand(320, 278, 'a page visit rules out whole ranges'); return d.svg();
}
export function sd_databases_leaf_scan() {
  const d = frame('sd_databases_leaf_scan', 'DESCEND ONCE, THEN FOLLOW LEAVES');
  [['4 | 8', false], ['12 | 14 | 16 | 18', true], ['20 | 24', true]].forEach(([s, active], i) => {
    const x = 20 + i * 211; d.box(x, 112, 178, 59, s, { fill: active ? C.accSoft : C.card, stroke: active ? C.acc : C.line, cls: 'mono', size: 11 });
    if (i < 2) d.arrow(x + 181, 142, x + 207, 142, { stroke: i === 1 ? C.acc : C.line });
  });
  d.text(320, 205, 'return 12, 14, 16, 18, 20; stop before 24', { cls: 'mono', size: 11 });
  d.arrow(320, 54, 320, 104, { stroke: C.acc }); d.text(416, 74, 'lower bound 12', { cls: 'sm' });
  d.hand(320, 278, 'finding the start differs from returning the range'); return d.svg();
}
export function sd_databases_leaf_split() {
  const d = frame('sd_databases_leaf_split', 'INSERT 15, THEN SPLIT THE FULL LEAF', 345);
  d.box(170, 57, 300, 42, '12 | 14 | 16 | 18', { fill: C.card, cls: 'mono', size: 13 });
  d.text(320, 125, '+ 15 gives five entries; capacity is four', { cls: 'sm', size: 12 });
  d.box(61, 188, 198, 46, '12 | 14', { fill: C.card, cls: 'mono', size: 13 });
  d.box(379, 188, 198, 46, '15 | 16 | 18', { fill: C.accSoft, stroke: C.acc, cls: 'mono', size: 13 });
  d.arrow(271, 211, 367, 211, { stroke: C.acc }); d.text(320, 181, 'leaf link', { cls: 'sm' });
  d.arrow(244, 141, 160, 177, { stroke: C.gray }); d.arrow(396, 141, 477, 177, { stroke: C.acc });
  d.text(320, 267, 'parent gains separator 15', { cls: 'mono', size: 12 }); d.hand(320, 316, 'repair the search path as well as the leaf'); return d.svg();
}
export function sd_databases_composite() { return table('sd_databases_composite', 'MATCH EQUALITY, THEN A SEQUENCE RANGE', ['tuple', 'match = m7?', 'sequence >= 2?', 'return?'], [['m7, 1', 'yes', 'no', 'no'], ['m7, 2', 'yes', 'yes', 'yes'], ['m7, 3', 'yes', 'yes', 'yes'], ['m8, 1', 'no', 'no', 'no']], 'stop when the leading match changes', 2); }
export function sd_databases_covering() { return path('sd_databases_covering', 'COLUMNS AND VISIBILITY ARE SEPARATE CHECKS', ['key range', 'index payload', 'visible?', 'return values'], ['match + seq', 'event + scorer', 'map or heap', 'two events'], 'covering does not prove zero heap fetches'); }
export function sd_databases_clustered() { return table('sd_databases_clustered', 'KEY ORDER DOES NOT IMPLY BASE-ROW ORDER', ['event order', 'separate heap locator', 'clustered range'], [['e1', 'page A', 'nearby key'], ['e2', 'page C', 'next key'], ['e3', 'page B', 'next key']], 'one base ordering cannot serve every range'); }
export function sd_databases_plan() { return table('sd_databases_plan', 'A ROW ESTIMATE CAN CHANGE THE PHYSICAL PLAN', ['operator', 'estimated rows', 'actual rows'], [['filter', '10', '1,000'], ['inner lookup', 'few loops', 'many loops'], ['consequence', 'cheap probes?', '100x row mismatch']], 'inspect rows and loops together', 0); }
export function sd_databases_scans() { return table('sd_databases_scans', 'PAGE COUNTS UNDER STATED TOY ASSUMPTIONS', ['path', 'count', 'meaning'], [['full sequential', '100', 'distinct table pages'], ['selective index', '3 + 10 = 13', 'logical visit bound'], ['broad index', '3 + 8,000 = 8,003', 'loose visit bound']], 'revisiting a page is not another distinct page', 1); }
export function sd_databases_nested() { return table('sd_databases_nested', 'ONE INNER LOOKUP FOR EACH OUTER EVENT', ['outer event', 'probe', 'result'], [['e1', 'u4', 'Asha'], ['e2', 'u8', 'Bo'], ['e3', 'u4', 'Asha'], ['e4', 'u9', 'Chen']], 'four indexed probes, or twelve full-scan tests'); }
export function sd_databases_hash_join() { return path('sd_databases_hash_join', 'BUILD ONCE, THEN PROBE EACH EVENT', ['3 users', 'hash table', '4 probes', '4 outputs'], ['u4, u8, u9', 'key -> name', 'u4, u8, u4, u9', 'same join result'], 'three build inserts plus four probes'); }
export function sd_databases_merge_join() { return table('sd_databases_merge_join', 'ADVANCE THE LOWER KEY; EMIT EQUAL KEYS', ['comparison', 'event key', 'user key', 'action'], [['first', 'u4:e1', 'u4', 'emit Asha'], ['next', 'u4:e3', 'u4', 'emit Asha'], ['advance', 'u8:e2', 'u4', 'advance user'], ['match', 'u8:e2', 'u8', 'emit Bo'], ['advance', 'u9:e4', 'u8', 'advance user'], ['match', 'u9:e4', 'u9', 'emit Chen']], 'six comparisons in this unique-inner trace'); }
export function sd_databases_transaction() { return path('sd_databases_transaction', 'THREE RELATED FACTS SHARE ONE COMMIT', ['score 11', 'event e5', 'key k7', 'commit group'], ['new current state', 'ordered history', 'saved result', 'or roll back all'], 'a partial group is not a successful command'); }
export function sd_databases_transfer() { return table('sd_databases_transfer', 'TRANSFER 2,500 CENTS WITHOUT CHANGING THE TOTAL', ['state', 'account A', 'account B', 'total cents'], [['before', '10,000', '2,000', '12,000'], ['after', '7,500', '4,500', '12,000']], 'atomicity groups the writes; logic preserves the total'); }
export function sd_databases_acid() { return table('sd_databases_acid', 'FOUR DIFFERENT QUESTIONS ABOUT A COMMIT', ['promise', 'question'], [['atomicity', 'does the whole group commit?'], ['consistency', 'do declared invariants hold?'], ['isolation', 'which concurrent history is allowed?'], ['durability', 'which failures can the commit survive?']], 'each word names a separate obligation'); }
export function sd_databases_lost_update() { return table('sd_databases_lost_update', 'TWO PRIVATE INCREMENTS CAN OVERWRITE EACH OTHER', ['step', 'caller A', 'caller B'], [['read', '10', '10'], ['compute', '10 + 1 = 11', '10 + 1 = 11'], ['write stale value', '11', '11'], ['intended total', '10 + 1 + 1', '12']], 'express or protect the actual operation', 2); }
export function sd_databases_isolation() { return table('sd_databases_isolation', 'SQL STANDARD MINIMUM PROTECTIONS', ['level', 'dirty read', 'row reread', 'phantom'], [['uncommitted', 'allowed', 'allowed', 'allowed'], ['committed', 'prevented', 'allowed', 'allowed'], ['repeatable', 'prevented', 'prevented', 'allowed'], ['serializable', 'prevented', 'prevented', 'prevented']], 'engines can provide stronger guarantees'); }
export function sd_databases_anomalies() { return sequence('sd_databases_anomalies', 'A COMMITTED CHANGE BETWEEN TWO READS', ['reader A', 'database', 'writer B'], [[0, 1, 'first read: score 10'], [2, 1, 'commit score 11'], [0, 1, 'second read'], [1, 0, 'fresh statement sees 11']], 'non-repeatable does not mean uncommitted'); }
export function sd_databases_phantom() { return table('sd_databases_phantom', 'THE MATCHING SET CHANGES WITHOUT A ROW REREAD', ['moment', 'active set', 'count'], [['A first query', 'Asha, Bo', '2'], ['B commits insert', 'Asha, Bo, Chen', '3'], ['A fresh query', 'Asha, Bo, Chen', '3']], 'the predicate includes possible new rows'); }
export function sd_databases_write_skew() { return table('sd_databases_write_skew', 'DIFFERENT WRITES CAN BREAK THE SAME RULE', ['step', 'Asha transaction', 'Bo transaction'], [['snapshot', 'both active', 'both active'], ['private decision', 'Bo will remain', 'Asha will remain'], ['write', 'Asha off', 'Bo off'], ['combined result', 'zero active scorers', 'rule broken']], 'no serial order permits both departures'); }
export function sd_databases_mvcc() { return table('sd_databases_mvcc', 'A SNAPSHOT SELECTS ITS PERMITTED VERSION', ['reader', 'snapshot boundary', 'visible score'], [['A', 'before B commit', '10'], ['B', 'own pending update', '11'], ['C', 'after B commit', '11']], 'ordinary readers do not adopt B uncommitted state'); }
export function sd_databases_version_retention() { return path('sd_databases_version_retention', 'AN OLD SNAPSHOT CAN RETAIN OBSOLETE VERSIONS', ['old reader', '5,000 versions', '500 B each', '2.5 MB payload'], ['still needs history', 'not yet reclaimable', 'illustrative size', 'before overhead'], 'safe reclamation need not shrink the file'); }
export function sd_databases_row_lock() { return sequence('sd_databases_row_lock', 'CONFLICTING WRITERS NEED A DECISION BOUNDARY', ['writer A', 'match m7', 'writer B'], [[0, 1, 'lock and prepare update'], [2, 1, 'conflicting lock: wait'], [0, 1, 'commit; release'], [1, 2, 'continue under isolation rules']], 'versions do not remove write conflicts'); }
export function sd_databases_deadlock() {
  const d = frame('sd_databases_deadlock', 'EACH TRANSACTION WAITS FOR THE OTHER OWNER');
  d.box(32, 103, 240, 89, 'A holds X\nA waits for Y', { fill: C.card, size: 15 });
  d.box(368, 103, 240, 89, 'B holds Y\nB waits for X', { fill: C.accSoft, stroke: C.acc, size: 15 });
  d.arrow(279, 120, 361, 120, { stroke: C.gray }); d.arrow(361, 175, 279, 175, { stroke: C.acc });
  d.text(320, 85, 'Y owner', { cls: 'sm' }); d.text(320, 214, 'X owner', { cls: 'sm' });
  d.hand(320, 277, 'a long wait is not necessarily a cycle'); return d.svg();
}
export function sd_databases_wal() { return path('sd_databases_wal', 'RECOVERY LOG BEFORE DEPENDENT PAGE PERSISTENCE', ['change records', 'required flush', 'acknowledge', 'page later'], ['3 x 200 B', '600 B toy payload', 'chosen policy', 'dirty page write'], 'the surviving log can recover an older page'); }
export function sd_databases_recovery() { return table('sd_databases_recovery', 'REDO RECONSTRUCTS THE COMMITTED GROUP', ['object', 'at crash', 'after recovery'], [['table score', '10 persisted', '11'], ['committed log', '11 + e5 + k7', 'recovery input'], ['related records', 'missing on page', 'e5 and k7 present']], 'do not turn replay into another logical increment'); }
export function sd_databases_pool() { return table('sd_databases_pool', 'TWENTY CONNECTIONS WITH TWO OCCUPANCY BUDGETS', ['work', 'occupancy', 'ideal operations/s'], [['database only', '0.01 s', '2,000'], ['plus remote wait', '0.01 + 0.09 s', '200'], ['five process pools', '20 sessions each', '100 total sessions']], 'session count is different from throughput', 1); }
export function sd_databases_replica_positions() { return table('sd_databases_replica_positions', 'A FOLLOWER HAS SEVERAL PROGRESS BOUNDARIES', ['state', 'position', 'read current score?'], [['leader commit', '8', 'authoritative history'], ['follower receive', '8', 'not sufficient'], ['follower durable', '8', 'not sufficient'], ['follower apply', '7', 'still older']], 'durable history can wait for application'); }
export function sd_databases_acknowledgement() {
  const d = frame('sd_databases_acknowledgement', 'ABSOLUTE COMPLETION TIMES IN MILLISECONDS');
  d.arrow(48, 161, 598, 161, { stroke: C.gray });
  [[4, 'local flush'], [7, 'follower flush'], [12, 'follower apply']].forEach(([t, label], i) => { const x = 52 + t / 12 * 527; d.dot(x, 161, 4, i === 1 ? C.acc : C.ink); d.line(x, 161, x, i === 1 ? 205 : 115, { stroke: C.line }); d.text(x, i === 1 ? 225 : 92, label, { cls: 'sm', size: 11 }); d.mono(x, i === 1 ? 248 : 69, `${t} ms`, { size: 11 }); });
  d.hand(320, 286, 'remote durable acknowledgement can precede a fresh read'); return d.svg();
}
export function sd_databases_lag() { return sequence('sd_databases_lag', 'ACKNOWLEDGED AT THE LEADER, STILL OLD AT FOLLOWER', ['scorer', 'leader', 'follower'], [[0, 1, 'commit position 8'], [1, 0, 'acknowledge position 8'], [0, 2, 'read immediately'], [2, 0, 'applied 7: old score'], [1, 2, 'position 8 applies later']], 'carry a comparable minimum position for fenced reads'); }
export function sd_databases_partition_shard() { return table('sd_databases_partition_shard', 'SUBSETS AND SEPARATE OWNERSHIP ARE DISTINCT', ['design', 'data boundary', 'machine ownership'], [['time partitions', 'retention interval', 'can stay local'], ['match shards', 'match identifier', 'separate owners'], ['cross-shard query', 'several subsets', 'network and merge']], 'partitioning alone does not distribute writes'); }
export function sd_databases_partition_key() { return table('sd_databases_partition_key', 'EQUAL OWNERS DO NOT IMPLY EQUAL REQUEST DEMAND', ['owner', 'requests/s', 'share of demand'], [['A', '100', 'small'], ['B', '100', 'small'], ['C', '800', 'hot owner']], 'total 1,000 hides the owner receiving 800'); }
export function sd_databases_reshard() { return path('sd_databases_reshard', 'COPY, CATCH UP, INSTALL AUTHORITY, THEN ROUTE', ['snapshot', 'change replay', 'install epoch', 'new route'], ['1M / 10k = 100 s', '300 / 20 = 15 s', 'reject old writes', 'retry same identity'], 'an issued epoch must reach the protected resource'); }
export function sd_databases_shard() {
  const d = frame('sd_databases_shard', 'OWNER E TAKES ONLY THE NEIGHBORING INTERVAL', 390);
  d.circle(303, 171, 202, { stroke: C.gray });
  [[0, 'A'], [25, 'B'], [50, 'C'], [60, 'E'], [75, 'D']].forEach(([v, label]) => {
    const angle = v / 100 * Math.PI * 2 - Math.PI / 2, x = 303 + Math.cos(angle) * 127, y = 171 + Math.sin(angle) * 117;
    d.box(x - 28, y - 19, 56, 38, `${label}: ${v}`, { fill: label === 'E' ? C.accSoft : C.card, stroke: label === 'E' ? C.acc : C.ink2, cls: 'mono', size: 11 });
  });
  d.text(303, 153, '55 and 58', { cls: 'mono', size: 12, color: C.acc }); d.text(303, 185, 'D -> E', { cls: 'mono', size: 12, color: C.acc });
  d.text(566, 163, 'clockwise', { cls: 'sm', size: 10 }); d.hand(320, 357, 'two of six sample keys move; not an equal-share ring'); return d.svg();
}
export function sd_databases_hot_partition() { return table('sd_databases_hot_partition', 'A HOT KEY REQUIRES A WORK-SPECIFIC REMEDY', ['pressure', 'possible path', 'contract to preserve'], [['repeated reads', 'cache or read copies', 'freshness'], ['append overhead', 'batch suitable events', 'ordering and latency'], ['one contested row', 'coordinate or redesign', 'invariants']], 'another owner elsewhere does not split this key'); }
export function sd_databases_complete() { return path('sd_databases_complete', 'LOCAL ATOMIC TRUTH, THEN RECOVERED PROPAGATION', ['fenced owner', 'local group', 'WAL commit', 'replica + outbox'], ['current authority', 'score, key, intent', 'chosen survival', 'read fence + dedup'], 'external delivery retains its own failure boundary'); }
