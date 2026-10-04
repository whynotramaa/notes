import { C } from '../lib/draw.js';
import { canvas, flow, cards, ledger } from '../lib/fundamentals-figures.js';
import { systemFigure, systemMap, systemCover } from '../lib/system-figures.js';
import n from '../data/system-design/queues-numbers.json' with { type: 'json' };

const parts = ['Why message queues', 'Queues, pub/sub and event streams', 'Consumer groups, partitions and offsets', 'Acknowledgements and delivery semantics', 'Retries and dead-letter queues', 'Exactly-once and backpressure', 'Transactional outbox and complete flow'];
export function where_sd_queues(stage = 99) { return systemMap('sd_queues', parts, stage); }
export function cover_sd_queues() { return systemCover('sd_queues', 8, ['Message', 'queues'], 'Acceptance, delivery and recovery', parts); }
export function sd_q_sync_wait() { return systemFigure('sd_q_sync_wait', 'SAME ARRIVALS, DIFFERENT REQUEST LIFETIMES', 'bars', [['inline transcode', n.sync_inflight, 'open'], ['commit then answer', n.async_inflight, 'open']], 'the work moves; it does not disappear'); }
export function sd_q_shape() { return systemFigure('sd_q_shape', 'ACCEPTANCE AND COMPLETION ARE SEPARATE', 'split', [['synchronous', 'request → service → database\nresponse means complete'], ['asynchronous', 'service → queue → worker\nresponse means accepted']]); }
export function sd_q_kinds() { return ledger('sd_q_kinds', 'A MESSAGE IS NOT THE WHOLE JOB', ['Meaning', 'Example', 'Owner'], [['command', 'transcode clip', 'one handler'], ['event', 'clip uploaded', 'independent readers'], ['job row', 'accepted → succeeded', 'database lifecycle']], 2); }
export function sd_q_status() { return systemFigure('sd_q_status', 'THE CLIENT SEES A JOB RESOURCE', 'sequence', { actors: ['client', 'API', 'job table'], steps: [[0, 1, 'POST clip, stable request key'], [1, 2, 'commit job and publication intent'], [1, 0, '202 + job URL'], [0, 1, 'GET job URL'], [1, 2, 'read committed status'], [1, 0, 'succeeded + rendition URLs']] }); }
export function sd_q_submit_retry() { return ledger('sd_q_submit_retry', 'A LOST RESPONSE MUST NOT CREATE A SECOND JOB', ['Attempt', 'Request key', 'Result'], [['first POST', 'upload-key-A', 'commit job J'], ['response lost', 'upload-key-A', 'client uncertain'], ['repeat POST', 'upload-key-A', 'return existing J']], 2); }
export function sd_q_competing() { return systemFigure('sd_q_competing', 'COMPETING WORKERS DIVIDE THE JOBS', 'fan', { source: 'one durable queue', targets: ['worker A owns J', 'worker B owns K', 'worker C owns L'], labels: ['one lease', 'one lease', 'one lease'] }, 'delivery can repeat after a lease is lost'); }
export function sd_q_fanout() {
  const d = canvas('sd_q_fanout', 'EACH SUBSCRIPTION HAS ITS OWN PROGRESS', 330);
  d.box(20, 133, 128, 48, `${n.events_s}/s score topic`, { fill: C.card });
  ['live delivery', 'search backlog', 'analytics backlog'].forEach((s, i) => {
    const y = 64 + i * 86;
    d.arrow(154, 157, 236, y + 21, { stroke: C.gray });
    d.box(242, y, 160, 42, s, { fill: C.card });
    if (i === 1) {
      ['search A', 'search B'].forEach((w, j) => { d.arrow(407, y + 21, 467, y - 7 + j * 56, { stroke: C.acc }); d.box(472, y - 24 + j * 56, 144, 34, w, { fill: C.accSoft, stroke: C.acc }); });
    } else { d.arrow(408, y + 21, 468, y + 21, { stroke: C.gray }); d.box(473, y + 4, 143, 34, 'one reader', { fill: C.card }); }
  });
  d.mono(320, 304, `${n.events_s} × ${n.subscribers} = ${n.fanout_deliveries_s} deliveries/s`);
  return d.svg();
}
export function sd_q_log() {
  const d = canvas('sd_q_log', 'READING MOVES A BOOKMARK, NOT THE RECORD', 270);
  ['A', 'B', 'C', 'D', 'E', 'F'].forEach((s, i) => d.box(98 + i * 73, 66, 62, 38, s, { fill: C.card }));
  d.arrow(275, 160, 275, 111, { stroke: C.gray }); d.text(275, 181, 'analytics bookmark', { cls: 'sm' });
  d.arrow(494, 214, 494, 111, { stroke: C.acc }); d.text(494, 236, 'live bookmark', { cls: 'sm', color: C.acc });
  return d.svg();
}
export function sd_q_choose() { return cards('sd_q_choose', 'CHOOSE THE READER CONTRACT FIRST', [['one handler, remove on ack', 'queue for clip jobs'], ['independent copies', 'pub/sub for notifications'], ['retain and replay', 'stream for score events'], ['per-key ordering', 'partition a retained stream']], 2); }
export function sd_q_prefetch() { return systemFigure('sd_q_prefetch', 'BOUNDED IN-FLIGHT WORK RETURNS ON CRASH', 'rows', [['broker', 'waiting', 'waiting', 'waiting'], ['worker holds', String(n.prefetch), 'unacked', 'bounded'], ['worker crash', 'return all', 'redeliver', 'new owners']]); }
export function sd_q_groups() {
  const d = canvas('sd_q_groups', 'PARTITIONS CAP ACTIVE MEMBERS OF ONE GROUP', 390);
  [4, 6, 16].forEach((count, r) => {
    const y = 74 + r * 104;
    d.text(22, y, `${count} members`, { a: 'start', cls: 'mono', size: 11 });
    for (let p = 0; p < n.partitions; p++) {
      const owner = Math.floor(p / Math.ceil(n.partitions / Math.min(count, n.partitions)));
      d.box(158 + p * 38, y - 20, 32, 40, `P${p}\nC${owner}`, { fill: r === 2 ? C.accSoft : C.card, stroke: r === 2 ? C.acc : C.line, size: 9 });
    }
    d.text(158, y + 47, count > n.partitions ? `${count - n.partitions} members idle` : `${n.partitions / count} partitions per member`, { a: 'start', cls: 'sm' });
  });
  return d.svg();
}
export function sd_q_rebalance() { return systemFigure('sd_q_rebalance', 'REVOKE OWNERSHIP BEFORE TRANSFERRING IT', 'rows', [['before', 'A: P0 to P2', 'B: P3 to P5', 'C,D: P6 to P11'], ['eager revoke', 'A: pause all', 'B: gone', 'C,D: pause all'], ['B leaves', 'A retained', 'P3 to P5 move', 'C,D retained'], ['cooperative', 'keep reading', 'pause transfer', 'keep reading']]); }
export function sd_q_fencing() { return systemFigure('sd_q_fencing', 'A STALE OWNER MUST NOT KEEP WRITING', 'sequence', { actors: ['old member', 'coordinator', 'new member'], steps: [[1, 0, 'revoke old generation'], [1, 2, 'assign new generation'], [0, 1, 'late commit from old owner'], [1, 0, 'reject stale generation']] }, 'external effects need their own ownership check'); }
export function sd_q_partition_key() { return ledger('sd_q_partition_key', 'ORDER IS LOCAL TO A PARTITION', ['Key', 'Partition', 'Local order'], [['match-7', 'P4', 'goal → correction'], ['match-12', 'P9', 'goal → correction'], ['cross-partition', 'P4 and P9', 'no shared order']], 0); }
export function sd_q_hot_key() { return systemFigure('sd_q_hot_key', 'ONE KEY CAN EXHAUST ONE OWNER', 'bars', [['other partition mean', n.cold_rate, '/s'], ['consumer limit', n.consumer_partition_rate, '/s'], ['hot match', n.hot_rate, '/s']], `${n.hot_lag_hour.toLocaleString('en-US')} extra events each hour`); }
export function sd_q_offsets() { return systemFigure('sd_q_offsets', 'COMMIT POINTS TO THE NEXT RECORD', 'rows', [['offset', '7', '8', '9'], ['after commit 8', 'covered', 'replay', 'replay'], ['restart', 'skip', 'start here', 'then continue']]); }
export function sd_q_gap() { return systemFigure('sd_q_gap', 'COMPLETION BEYOND A GAP DOES NOT ADVANCE COMMIT', 'rows', [['offset', '7', '8', '9'], ['effect', 'done', 'unfinished', 'done'], ['commit 8', 'safe', 'must replay', 'also replay']]); }
export function sd_q_visibility() { return systemFigure('sd_q_visibility', 'LEASE EXPIRY DOES NOT STOP THE FIRST WORKER', 'timeline', { events: [[0, 'worker A starts'], [n.timeout_s, 'worker B starts'], [n.p99_s, 'A finishes']], end: n.p99_s }, 'heartbeat extends the lease while work continues'); }
export function sd_q_at_most_once() { return flow('sd_q_at_most_once', 'ACK BEFORE EFFECT LEAVES A LOSS WINDOW', ['deliver', 'ack stored', 'process crashes', 'effect absent'], ['message present', 'broker may discard', 'no recovery owner', 'work lost'], 3); }
export function sd_q_at_least_once() { return systemFigure('sd_q_at_least_once', 'EFFECT BEFORE ACK LEAVES A DUPLICATE WINDOW', 'sequence', { actors: ['broker', 'worker', 'database'], steps: [[0, 1, 'deliver J'], [1, 2, 'commit effect'], [1, 0, 'ack lost'], [0, 1, 'redeliver J'], [1, 2, 'effect attempted again']] }); }
export function sd_q_idempotent() { return ledger('sd_q_idempotent', 'EFFECT AND IDENTITY SHARE ONE COMMIT', ['Delivery', 'Unique insert', 'Business effect'], [['first J', 'insert J', 'commit with J'], ['duplicate J', 'conflict on J', 'keep previous effect'], ['ack', 'after commit', 'safe to discard']], 1); }
export function sd_q_classify() { return cards('sd_q_classify', 'RETRY POLICY FOLLOWS THE FAILURE CLASS', [['temporary dependency error', 'delayed retry, bounded attempts'], ['invalid message', 'quarantine with original bytes'], ['unknown cause', 'small retry budget, then quarantine'], ['permission failure', 'repair access before redrive']], 0); }
export function sd_q_retry_topics() { return systemFigure('sd_q_retry_topics', 'FAILED WORK WAITS OUTSIDE THE MAIN PARTITION', 'fan', { source: 'main score stream', targets: ['healthy events continue', 'retry after delay', 'DLQ after budget'] }, 'moving work changes its order'); }
export function sd_q_poison() { return ledger('sd_q_poison', 'ONE POISON RECORD CAN BLOCK THE PARTITION', ['Account', 'Calculation', 'Result'], [['attempt work', `${n.poison_attempts} × ${n.service_s}`, `${n.poison_attempts * n.service_s} s`], ['backoff', n.attempt_delays.join(' + '), `${n.retry_total_s} s`], ['blocked', 'work + backoff', `${n.poison_block_s} s`], ['waiting arrivals', '20/12 × 181', `${n.poison_backlog} events`]], 3); }
export function sd_q_dlq() { return flow('sd_q_dlq', 'QUARANTINE NEEDS AN OWNER AND A RETURN PATH', ['attempt exhausted', 'retain bytes + error', 'repair and inspect', 'bounded redrive', 'original ID', 'duplicate-safe effect'], [], 3); }
export function sd_q_eos_boundary() {
  const d = canvas('sd_q_eos_boundary', 'TRANSACTION SCOPE DEFINES EXACTLY-ONCE', 310);
  d.rect(24, 53, 362, 175, { stroke: C.acc, fill: C.accFaint });
  d.text(42, 76, 'Kafka transaction', { a: 'start', cls: 'ttl' });
  d.box(44, 101, 144, 54, 'input offsets', { fill: C.card });
  d.box(216, 101, 144, 54, 'output records', { fill: C.card });
  d.text(205, 194, 'commit or abort together', { cls: 'sm', color: C.acc });
  d.arrow(391, 127, 433, 127, { stroke: C.gray });
  d.box(439, 101, 174, 54, 'external email', { fill: C.card });
  d.text(526, 194, 'separate effect', { cls: 'sm' });
  d.hand(320, 276, 'name the systems inside the commit');
  return d.svg();
}
export function sd_q_backlog() {
  const d = canvas('sd_q_backlog', 'RECOVERY USES SPARE CAPACITY', 335);
  const M = d.axes(65, 69, 496, 195, { xmin: 0, xmax: n.burst_s + n.drain_200_s, ymin: 0, ymax: n.backlog, xl: 'seconds', yl: 'queued jobs' });
  d.lines([[M.X(0), M.Y(0)], [M.X(n.burst_s), M.Y(n.backlog)], [M.X(n.burst_s + n.drain_200_s), M.Y(0)]], { stroke: C.acc, sw: 2 });
  d.mono(90, 48, `${n.backlog} at ${n.burst_s} s`, { a: 'start' });
  d.mono(561, 291, `${n.burst_s + n.drain_200_s} s`, { a: 'end' });
  d.text(334, 124, `${n.drain_200_s} s to drain`, { cls: 'sm' });
  return d.svg();
}
export function sd_q_lag_time() { return systemFigure('sd_q_lag_time', 'QUEUE COUNT NEEDS A SERVICE RATE', 'bars', [['score worker at 200/s', n.score_backlog_work_s, 's'], ['transcode pool', n.wait_at_peak_s, 's']], 'same message count, different waiting time'); }
export function sd_q_backpressure() { return cards('sd_q_backpressure', 'PROPAGATE CAPACITY TO THE PRODUCER', [['consumer credit', `${n.credit} messages, ${n.credit_inflight_s} s of pool work`], ['bounded publisher buffer', 'wait or fail when broker cannot accept'], ['edge admission', 'reject before durable acceptance'], ['accepted job', 'retain until completed or explicitly failed']], 2); }
export function sd_q_autoscale() { return systemFigure('sd_q_autoscale', 'MORE SPARE CAPACITY SHORTENS RECOVERY', 'bars', [['200 workers', n.drain_200_s, 's'], ['300 workers', n.drain_300_s, 's']], 'stop scaling at the dependency ceiling'); }
export function sd_q_dual_write() { return systemFigure('sd_q_dual_write', 'BOTH WRITE ORDERS HAVE A CRASH WINDOW', 'split', [['database first', 'job committed\nCRASH\nmessage absent'], ['broker first', 'message published\nCRASH\njob absent']]); }
export function sd_q_outbox() { return systemFigure('sd_q_outbox', 'PUBLICATION INTENT SHARES THE BUSINESS COMMIT', 'sequence', { actors: ['API', 'database', 'relay', 'broker'], steps: [[0, 1, 'commit job + outbox J'], [2, 1, 'read committed rows'], [1, 2, 'return pending J'], [2, 3, 'publish J'], [3, 2, 'publisher confirm'], [2, 1, 'mark J sent']] }, 'a lost confirmation repeats J with the same ID'); }
export function sd_q_full_trace() { return flow('sd_q_full_trace', 'ONE CLIP JOB ACROSS EVERY RECOVERY BOUNDARY', ['API accepts J', 'job + outbox commit', 'relay publishes J', 'broker retains J', 'worker effect + ID', 'status + ack'], ['stable submit key', 'one database commit', 'duplicates possible', 'redelivery possible', 'duplicate-safe commit', 'client polls job URL'], 4); }
export function sd_q_components() { return cards('sd_q_components', 'EACH COMPONENT OWNS ONE PROMISE', [['API + job resource', 'validate, accept, expose progress'], ['outbox + relay', 'retain publication intent, retry sends'], ['broker', 'retain and redeliver accepted work'], ['worker + inbox', 'commit effect with its identity'], ['status store', 'retain authoritative lifecycle state'], ['admission controller', 'bound future work before accepting']], 3); }
export function sd_q_interview() { return ledger('sd_q_interview', 'THE ANSWER NEEDS GUARANTEES AND ARITHMETIC', ['Step', 'Decision', 'Heron result'], [['justify', 'move slow work', `${n.sync_inflight} → ${n.async_inflight} open`], ['choose', 'queue vs stream', 'clips vs scores'], ['order', 'partition key', `${n.partitions} score partitions`], ['recover', 'effect then ack', 'stable ID + transaction'], ['publish', 'transactional outbox', `${n.outbox_max_rate}/s relay ceiling`], ['size', 'spare capacity', `${n.drain_200_min} min burst recovery`]], 5); }
