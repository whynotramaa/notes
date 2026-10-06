import { C, fig, beMap, beCover, card, steps, panel, cross, tick, hourglass, hose, lanes, seg, crowd, sheet, signpost, gauge, bubble } from '../lib/be-kit.js';
import { pipe, bolt } from '../lib/sd-kit.js';

const PARTS = ['Why work leaves the request', 'Consuming safely', 'Delivery semantics', 'Retries, poison messages and DLQs', 'Kafka fundamentals', 'Kafka reliability', 'Running Kafka', 'Event-driven design', 'Outbox, inbox and sagas', 'Scheduled work and the order end to end'];
export const where_be_events = (stage = 99) => beMap('where_be_events', PARTS, stage);

function rail(d, x, y, w, tickets, o = {}) {
  d.line(x, y, x + w, y, { stroke: C.ink2, sw: 2.4, single: true });
  tickets.forEach((s, i) => { const tx = x + 10 + i * (o.gap ?? 54); d.poly([[tx, y + 2], [tx + 44, y + 2], [tx + 44, y + 58], [tx + 38, y + 62], [tx + 32, y + 58], [tx + 26, y + 62], [tx + 20, y + 58], [tx + 14, y + 62], [tx + 8, y + 58], [tx, y + 62]], { fill: o.hot === i ? C.accSoft : C.paper, stroke: o.hot === i ? C.acc : C.ink2 }); d.text(tx + 22, y + 26, s, { cls: 'mono', size: 8.5, vc: true }); });
}

function logTape(d, x, y, n, o = {}) {
  const cw = o.cw ?? 34;
  for (let i = 0; i < n; i++) d.rect(x + i * cw, y, cw, o.h ?? 26, { r: 0, fill: o.hot && o.hot(i) ? C.accSoft : (o.dim && o.dim(i) ? C.paper : C.card), stroke: o.hot && o.hot(i) ? C.acc : (o.dim && o.dim(i) ? C.line : C.ink2), sw: 0.9 });
  if (o.idx !== false) for (let i = 0; i < n; i++) d.mono(x + i * cw + cw / 2, y + (o.h ?? 26) / 2, String((o.start ?? 0) + i), { size: 8.5, color: o.dim && o.dim(i) ? C.gray : undefined });
  if (o.label) d.text(x - 8, y + (o.h ?? 26) / 2, o.label, { cls: 'mono', size: 9, a: 'end' });
}

function bookmark(d, x, y, label, hot) {
  d.poly([[x - 6, y - 26], [x + 6, y - 26], [x + 6, y - 6], [x, y - 11], [x - 6, y - 6]], { fill: hot ? C.acc : C.ink2, stroke: hot ? C.acc : C.ink2 });
  if (label) d.text(x, y - 34, label, { cls: 'xs', color: hot ? C.acc : undefined });
}

export const cover_be_events = () => beCover('cover_be_events', 'VIII', ['Queues, Kafka', 'and events'], 'Work that happens after the response, reliably', (d, y) => {
  rail(d, 50, y + 30, 330, ['order\n124', 'order\n125', 'order\n126', 'order\n127', 'order\n128'], { hot: 0, gap: 64 });
  logTape(d, 60, y + 170, 14, { cw: 36, hot: (i) => i === 13, idx: true, start: 4810 });
  bookmark(d, 60 + 9 * 36 + 18, y + 168, 'kitchen', true); bookmark(d, 60 + 5 * 36 + 18, y + 168, 'analytics');
  d.travel([[600, y + 150], [60 + 13 * 36 + 18, y + 170]], { token: 'packet', at: [0, 0.4] });
  d.hand(470, y + 70, 'say it once, read it many times', { size: 18 });
}, [['Queues', 'acks, retries, DLQs'], ['Kafka', 'partitions, offsets, ISR'], ['Events', 'schemas, outbox, sagas'], ['Schedules', 'one job, twenty instances']]);

export function be_q_sync_path() {
  const d = fig('be_q_sync_path', 'EVERYTHING INSIDE THE REQUEST: THE USER WAITS FOR THE SLOWEST CHORE', 300);
  const y = lanes(d, ['inline', 'with a queue'], { y: 90, gap: 100, x0: 110, x1: 610, tl: 'ms' });
  const X = (ms) => 120 + ms * 0.32;
  [['save order', 0, 20], ['email 300', 20, 320], ['receipt PDF 800', 320, 1120], ['kitchen API 200', 1120, 1320]].forEach(([s, a, b], i) => seg(d, X(a), y(0), X(b) - X(a), s, { hot: i === 2, size: 8.5 }));
  d.text(X(1320), y(0) + 26, '1,320 ms', { cls: 'mono', size: 9.5, a: 'end' });
  seg(d, X(0), y(1), X(20) - X(0), '', {}); seg(d, X(20), y(1), X(25) - X(20) + 4, '', { hot: true }); d.text(X(30), y(1) - 18, 'save order + enqueue: 25 ms', { cls: 'mono', size: 9, a: 'start', color: C.acc });
  rail(d, X(200), y(1) + 18, 220, ['email', 'PDF', 'kitchen'], { gap: 60 });
  return d.svg();
}

export function be_q_availability() {
  const d = fig('be_q_availability', 'IN SERIES, AVAILABILITIES MULTIPLY; BEHIND A QUEUE, THEY STOP MATTERING TO THE REQUEST', 280);
  ['email', 'PDF', 'kitchen'].forEach((s, i) => { const x = 110 + i * 150; d.circle(x, 100, 50, { fill: C.card, stroke: C.ink2 }); d.text(x, 100, '99.9%', { cls: 'mono', size: 10 }); d.text(x, 138, s, { cls: 'sm' }); if (i < 2) d.line(x + 26, 100, x + 124, 100, { stroke: C.ink2, sw: 1.6, single: true }); });
  d.line(20, 100, 84, 100, { stroke: C.ink2, sw: 1.6, single: true }); d.line(436, 100, 520, 100, { stroke: C.ink2, sw: 1.6, single: true });
  d.text(570, 100, '= 99.70%', { cls: 'mono', size: 12, color: C.acc });
  d.text(320, 190, '0.999 × 0.999 × 0.999 = 0.997: about three times the failures of any one dependency', { cls: 'sm' });
  d.text(320, 220, 'with a queue, the request depends on the queue only; chores retry later on their own', { cls: 'xs' });
  return d.svg();
}

export function be_q_roles() {
  const d = fig('be_q_roles', 'PRODUCER, BROKER, CONSUMER: A POSTBOX BETWEEN TWO PEOPLE WHO NEVER MEET', 320);
  d.server(30, 120, 70, 80, { label: 'producer (API)' });
  d.rect(240, 90, 120, 150, { r: 14, fill: C.accFaint, stroke: C.acc }); d.rect(270, 110, 60, 8, { r: 2, fill: C.ink2, stroke: C.ink2 }); d.text(300, 260, 'broker', { cls: 'sm', color: C.acc });
  for (let i = 0; i < 4; i++) d.envelope(262, 150 + i * 18, 76, 14, { stroke: C.acc, fill: C.paper });
  d.travel([[104, 150], [262, 114]], { token: 'packet', at: [0, 0.3] });
  d.gear(470, 140, 22, { spin: 5 }); d.text(470, 176, 'consumer (worker)', { cls: 'sm' });
  d.travel([[340, 200], [450, 150]], { token: 'packet', at: [0.4, 0.7] });
  d.during([0.75, 1], (g) => { g.arrow(450, 190, 362, 230, { stroke: C.acc, hl: 5 }); g.text(420, 232, 'ack', { cls: 'mono', size: 10, color: C.acc }); });
  d.text(320, 300, 'a job is a message describing work; the broker keeps it until a consumer acknowledges it', { cls: 'xs' });
  return d.svg();
}

export function be_q_designs() {
  const d = fig('be_q_designs', 'THREE SHAPES OF BROKER', 330);
  [['RabbitMQ', 'exchange routes, broker pushes'], ['SQS', 'consumers poll, messages hide'], ['Kafka', 'a log; readers keep bookmarks']].forEach(([t, s], i) => { const x = 20 + i * 207; panel(d, x, 40, 193, 270, t, i === 2); d.text(x + 96, 76, s, { cls: 'xs' }); });
  d.poly([[60, 130], [100, 110], [100, 150]], { fill: C.card, stroke: C.ink2 }); d.text(80, 170, 'exchange', { cls: 'xs' });
  ['kitchen', 'email', 'audit'].forEach((s, i) => { d.arrow(104, 130, 140, 100 + i * 40, { stroke: C.gray, hl: 4 }); d.box(144, 88 + i * 40, 60, 24, s, { r: 4, cls: 'mono', size: 8.5, fill: C.card }); });
  d.text(116, 260, 'routing keys, bindings,\nprefetch, per-message acks', { cls: 'xs', vc: true });
  d.rect(270, 100, 100, 110, { r: 6, fill: C.paper }); for (let i = 0; i < 5; i++) d.envelope(286 + (i % 2) * 36, 114 + Math.floor(i / 2) * 30, 30, 20, { stroke: i === 1 ? C.line : C.ink2, fill: C.card });
  d.person(320, 220, 22); d.text(323, 270, 'ReceiveMessage, then\nDeleteMessage when done', { cls: 'xs', vc: true });
  logTape(d, 440, 130, 5, { cw: 32 }); bookmark(d, 440 + 2 * 32 + 16, 128, 'g1', true); bookmark(d, 440 + 4 * 32 + 16, 128, 'g2');
  d.text(530, 260, 'messages stay for days;\nmany groups, replay', { cls: 'xs', vc: true });
  return d.svg();
}

export function be_q_visibility() {
  const d = fig('be_q_visibility', 'A 30 S VISIBILITY TIMEOUT AND A 40 S JOB: THE MESSAGE COMES BACK WHILE STILL IN PROGRESS', 300);
  const y = lanes(d, ['message', 'worker A', 'worker B'], { y: 80, gap: 60, x0: 110, x1: 610, tl: 'seconds' });
  const X = (s) => 120 + s * 7.5;
  seg(d, X(0), y(0), X(30) - X(0), 'invisible 30 s', { fill: C.paper, dash: [4, 3] }); seg(d, X(30), y(0), 10, '', { hot: true }); d.text(X(30) + 14, y(0) - 16, 'visible again', { cls: 'xs', a: 'start', color: C.acc });
  seg(d, X(0), y(1), X(40) - X(0), 'charging card, 40 s'); seg(d, X(40), y(1), 30, 'ack', { size: 8.5 });
  seg(d, X(30.5), y(2), X(60) - X(30.5), 'charges the card again', { hot: true });
  d.text(320, 270, 'set the timeout above the longest job, extend it while working, and make the job idempotent anyway', { cls: 'xs' });
  return d.svg();
}

export function be_q_prefetch() {
  const d = fig('be_q_prefetch', 'PREFETCH: HOW MANY UNACKNOWLEDGED MESSAGES EACH WORKER MAY HOLD', 300);
  panel(d, 20, 40, 290, 230, 'prefetch 100'); panel(d, 330, 40, 290, 230, 'prefetch 1 to 10', true);
  [0, 1].forEach((k) => { const x = 60 + k * 130; d.gear(x, 90, 18, { spin: k ? 2 : 9 }); d.text(x, 120, k ? 'fast worker' : 'slow worker', { cls: 'xs' }); d.rect(x - 34, 134, 68, 110, { r: 4, fill: C.paper }); for (let i = 0; i < (k ? 2 : 9); i++) d.envelope(x - 26, 230 - i * 11, 52, 9, { stroke: k ? C.ink2 : C.acc, fill: C.paper }); });
  d.text(165, 258, 'the slow one hoards; the fast one idles', { cls: 'xs', color: C.acc });
  [0, 1].forEach((k) => { const x = 410 + k * 130; d.gear(x, 90, 18, { spin: k ? 2 : 9 }); d.text(x, 120, k ? 'fast worker' : 'slow worker', { cls: 'xs' }); d.rect(x - 34, 134, 68, 110, { r: 4, fill: C.paper }); for (let i = 0; i < 2; i++) d.envelope(x - 26, 230 - i * 11, 52, 9); });
  d.text(475, 258, 'work flows to whoever is free', { cls: 'xs' });
  return d.svg();
}

export function be_q_bathtub() {
  const d = fig('be_q_bathtub', 'A BACKLOG IS A BATHTUB: 50 IN, 40 OUT, AND THE LEVEL RISES 36,000 AN HOUR', 320);
  d.path('M150,110 L160,260 Q165,280 190,280 L430,280 Q455,280 460,260 L470,110', { stroke: C.ink2, sw: 1.6 });
  [0.15, 0.35, 0.55, 0.75].forEach((lv, i) => d.during([i * 0.25, 1], (g) => g.fillRect(162, 270 - lv * 160, 296, lv * 160, C.accFaint, 0.9)));
  d.path('M100,60 L100,90 L150,90', { stroke: C.ink2, sw: 3 }); d.flowline([[150, 92], [170, 150]], { gap: 5, sw: 3 }); d.text(100, 50, 'arrivals 50/s', { cls: 'mono', size: 10 });
  d.path('M440,280 L440,300 L520,300', { stroke: C.ink2, sw: 3 }); d.flowline([[442, 300], [520, 300]], { gap: 7, sw: 3, color: C.ink2 }); d.text(560, 300, 'workers 40/s', { cls: 'mono', size: 10 });
  d.text(310, 190, 'depth grows by 10 per second', { cls: 'sm', color: C.acc });
  d.text(560, 150, 'fix the rate,\nnot the tub:\nadd workers,\nspeed them up,\nor shed input', { cls: 'xs', vc: true });
  return d.svg();
}

export function be_q_semantics() {
  const d = fig('be_q_semantics', 'THREE DELIVERY PROMISES', 320);
  [['at-most-once', 'never twice, maybe never'], ['at-least-once', 'never lost, maybe twice'], ['effectively once', 'twice delivered, once applied']].forEach(([t, s], i) => { const x = 20 + i * 207; panel(d, x, 40, 193, 250, t, i === 2); d.text(x + 96, 76, s, { cls: 'xs' }); });
  d.envelope(80, 120, 60, 40); bolt(d, 150, 110, 0.8); d.text(116, 210, 'ack first, then work:\na crash loses the job', { cls: 'xs', vc: true });
  d.envelope(260, 110, 60, 40); d.envelope(276, 126, 60, 40, { stroke: C.acc }); d.text(323, 210, 'work first, then ack:\na crash redelivers', { cls: 'xs', vc: true });
  d.envelope(470, 110, 60, 40); d.envelope(486, 126, 60, 40, { stroke: C.acc }); cross(d, 560, 146, 7); d.text(530, 210, 'at-least-once plus an\nidempotent consumer that\ndrops the repeat', { cls: 'xs', vc: true });
  return d.svg();
}

export function be_q_ack_order() {
  const d = fig('be_q_ack_order', 'WHERE THE ACK GOES DECIDES WHAT A CRASH COSTS', 280);
  const y = lanes(d, ['ack first', 'ack last'], { y: 90, gap: 90, x0: 110, x1: 610 });
  seg(d, 120, y(0), 60, 'receive'); seg(d, 190, y(0), 50, 'ack', { hot: true }); seg(d, 250, y(0), 200, 'send email'); bolt(d, 330, y(0) - 40, 0.8); d.text(470, y(0) - 22, 'crash: email never sent, message gone', { cls: 'xs', a: 'start', color: C.acc });
  seg(d, 120, y(1), 60, 'receive'); seg(d, 190, y(1), 200, 'send email'); bolt(d, 400, y(1) - 40, 0.8); seg(d, 400, y(1), 50, 'ack', { dash: [3, 3], fill: C.paper }); d.text(470, y(1) - 22, 'crash: redelivered, email sent twice', { cls: 'xs', a: 'start' });
  return d.svg();
}

export function be_q_exactly_once() {
  const d = fig('be_q_exactly_once', 'WHY EXACTLY-ONCE IS HARD: THE EFFECT AND THE ACK ARE TWO SEPARATE EVENTS', 300);
  d.gear(120, 140, 26, { spin: 6 }); d.text(120, 180, 'worker', { cls: 'sm' });
  d.cloud(290, 70, 140, 70, { label: 'email provider' }); d.db(300, 200, 120, 70, { label: 'broker' });
  d.arrow(146, 126, 286, 106, { stroke: C.ink2 }); d.text(210, 100, '1 send', { cls: 'xs' });
  d.arrow(146, 156, 294, 230, { stroke: C.acc, dash: [4, 3] }); d.text(210, 210, '2 ack', { cls: 'xs', color: C.acc });
  bolt(d, 230, 150, 0.9);
  d.text(530, 120, 'a crash between 1 and 2\nleaves the email sent and\nthe message unacknowledged', { cls: 'sm', vc: true });
  d.text(530, 210, 'no protocol makes two\nsystems change together\nwithout shared state', { cls: 'xs', vc: true });
  return d.svg();
}

export function be_q_inbox() {
  const d = fig('be_q_inbox', 'AN IDEMPOTENT CONSUMER: RECORD THE MESSAGE ID IN THE SAME TRANSACTION AS THE EFFECT', 300);
  d.envelope(40, 90, 70, 44, { label: 'msg m-77 #1' }); d.envelope(40, 180, 70, 44, { label: 'msg m-77 #2', stroke: C.acc });
  d.rect(190, 70, 250, 180, { r: 10, fill: C.paper, stroke: C.ink2, dash: [5, 4] }); d.text(315, 86, 'one transaction', { cls: 'xs' });
  d.mono(206, 120, 'INSERT INTO inbox (msg_id)', { size: 9.5, a: 'start' }); d.mono(206, 136, "  VALUES ('m-77');", { size: 9.5, a: 'start' });
  d.mono(206, 168, 'UPDATE orders SET status', { size: 9.5, a: 'start' }); d.mono(206, 184, "  = 'paid' WHERE id = 124;", { size: 9.5, a: 'start' });
  d.arrow(114, 112, 186, 128, { stroke: C.ink2, hl: 5 }); tick(d, 460, 120, 8);
  d.arrow(114, 202, 186, 202, { stroke: C.acc, hl: 5 }); d.text(470, 210, '23505: already done,\nack and move on', { cls: 'xs', a: 'start', vc: true, color: C.acc });
  return d.svg();
}

export function be_q_backoff() {
  const d = fig('be_q_backoff', 'EXPONENTIAL BACKOFF WITH FULL JITTER: EACH WAIT IS RANDOM UP TO A DOUBLING CAP', 300);
  const caps = [1, 2, 4, 8, 16, 32, 64, 128];
  caps.forEach((c, i) => { const x = 60 + i * 66, h = c * 1.4; d.rect(x, 230 - h, 44, h, { r: 2, fill: C.accFaint, stroke: C.line }); const r = c * [0.7, 0.3, 0.9, 0.5, 0.6, 0.2, 0.8, 0.4][i]; d.rect(x + 8, 230 - r * 1.4, 28, r * 1.4, { r: 2, fill: C.accSoft, stroke: C.acc }); d.mono(x + 22, 246, `${c} s`, { size: 9 }); d.text(x + 22, 262, `try ${i + 2}`, { cls: 'xs' }); });
  d.text(320, 52, 'caps 1 + 2 + … + 128 = 255 s in the worst case', { cls: 'mono', size: 10 });
  d.text(320, 286, 'random waits spread retries from many clients so they do not land together', { cls: 'xs' });
  return d.svg();
}

export function be_q_retry_storm() {
  const d = fig('be_q_retry_storm', '1,000 CLIENTS RETRYING ON A FIXED SCHEDULE VERSUS WITH JITTER (ILLUSTRATIVE)', 300);
  const M = d.axes(60, 50, 240, 170, { xmin: 0, xmax: 16, ymin: 0, ymax: 1000, xl: 's', yl: 'retries/s' });
  [1, 3, 7, 15].forEach((t) => d.rect(M.X(t) - 3, M.Y(1000), 6, M.Y(0) - M.Y(1000), { r: 0, fill: C.accSoft, stroke: C.acc }));
  d.text(180, 240, 'synchronized spikes', { cls: 'xs', color: C.acc });
  const M2 = d.axes(370, 50, 240, 170, { xmin: 0, xmax: 16, ymin: 0, ymax: 1000, xl: 's', yl: 'retries/s' });
  d.fn((t) => 250 * Math.exp(-t / 6) + 40, 0, 16, M2, { stroke: C.slate });
  d.text(490, 240, 'a smooth, falling trickle', { cls: 'xs' });
  return d.svg();
}

export function be_q_dlq() {
  const d = fig('be_q_dlq', 'A POISON MESSAGE BOUNCES FIVE TIMES, THEN GOES TO THE DEAD-LETTER QUEUE', 320);
  d.rect(40, 80, 160, 120, { r: 8, fill: C.paper }); d.text(120, 70, 'kitchen-jobs', { cls: 'mono', size: 9.5 });
  d.gear(330, 140, 26, { spin: 4 }); d.text(330, 184, 'worker', { cls: 'sm' });
  d.travel('M200,140 L300,140 L200,140 L300,140 L200,140 L300,140 L200,140 L300,140 L200,140 L300,140 L330,200 L470,250', { label: 'm-91', w: 44, dur: 8 });
  for (let i = 1; i <= 5; i++) d.mono(220 + i * 14, 112, String(i), { size: 9, color: C.acc });
  d.text(250, 98, 'receive count', { cls: 'xs' });
  d.rect(470, 220, 140, 70, { r: 8, fill: C.accFaint, stroke: C.acc }); d.text(540, 240, 'kitchen-jobs-dlq', { cls: 'mono', size: 9, color: C.acc }); d.text(540, 268, 'alert, inspect, redrive', { cls: 'xs' });
  d.text(160, 260, 'bad JSON, a deleted restaurant,\na bug: retrying cannot help', { cls: 'xs', vc: true });
  return d.svg();
}

export function be_q_reorder() {
  const d = fig('be_q_reorder', 'RETRIES REORDER MESSAGES: "CANCELLED" CAN ARRIVE BEFORE "PAID"', 280);
  const y = lanes(d, ['queue order', 'processed'], { y: 90, gap: 90, x0: 110, x1: 610 });
  [['1 placed', 0], ['2 paid', 1], ['3 cancelled', 2]].forEach(([s, i]) => seg(d, 130 + i * 110, y(0), 100, s, { hot: i === 1 }));
  seg(d, 130, y(1), 100, '1 placed'); seg(d, 240, y(1), 100, '3 cancelled'); seg(d, 350, y(1), 100, '2 paid', { hot: true });
  d.carrow([[290, y(0) + 14], [330, 140], [400, y(1) - 14]], { stroke: C.acc, dash: [4, 3] }); d.text(380, 136, 'failed once, retried', { cls: 'xs', color: C.acc });
  d.text(320, 250, 'the order ends up "paid" after it was cancelled unless consumers check versions or states', { cls: 'xs' });
  return d.svg();
}

export function be_kafka_log() {
  const d = fig('be_kafka_log', 'A TOPIC IS A SET OF APPEND-ONLY LOGS; CONSUMERS KEEP THEIR OWN BOOKMARKS', 330);
  [0, 1, 2].forEach((p) => { const n = [9, 12, 7][p]; logTape(d, 110, 70 + p * 70, n, { label: `partition ${p}`, cw: 36, hot: (i) => i === n - 1 }); d.during([0.5, 1], (g) => g.rect(110 + n * 36, 70 + p * 70, 36, 26, { r: 0, fill: C.accSoft, stroke: C.acc, dash: [3, 2] })); });
  bookmark(d, 110 + 5 * 36 + 18, 68, 'kitchen', true); bookmark(d, 110 + 9 * 36 + 18, 138, 'kitchen', true); bookmark(d, 110 + 6 * 36 + 18, 208, 'kitchen', true);
  bookmark(d, 110 + 1 * 36 + 18, 138, 'analytics');
  d.text(320, 290, 'offsets number each partition separately; reading does not remove anything', { cls: 'xs' });
  d.text(560, 50, 'new records\nappend here', { cls: 'hand', size: 14, vc: true });
  return d.svg();
}

export function be_kafka_not_queue() {
  const d = fig('be_kafka_not_queue', 'A QUEUE FORGETS WHAT IT DELIVERED; A LOG REMEMBERS', 300);
  panel(d, 20, 40, 290, 230, 'queue'); panel(d, 330, 40, 290, 230, 'log', true);
  for (let i = 0; i < 5; i++) d.during([0, 1 - i * 0.18], (g) => g.envelope(60 + i * 46, 110, 38, 26));
  d.gear(165, 190, 18, { spin: 4 }); d.text(165, 226, 'consumed messages are deleted', { cls: 'xs' });
  logTape(d, 360, 110, 7, { cw: 34 });
  bookmark(d, 360 + 6 * 34 + 17, 108, 'live', true); bookmark(d, 360 + 2 * 34 + 17, 108, 'replay');
  d.text(475, 190, 'new consumers start anywhere;\nretention is days, not "until read"', { cls: 'xs', vc: true });
  return d.svg();
}

export function be_kafka_partitioner() {
  const d = fig('be_kafka_partitioner', 'THE KEY PICKS THE PARTITION: murmur2(key) MOD 12', 300);
  const k = [['order-123', 1], ['order-124', 11], ['order-125', 3], ['user-42', 4]];
  k.forEach(([s, p], i) => { const y = 70 + i * 46; d.chips(30, y, [s], { h: 28, size: 10, width: 100 }); d.arrow(136, y + 14, 196, y + 14, { stroke: C.gray, hl: 5 }); d.gear(220, y + 14, 12); d.arrow(236, y + 14, 300, 60 + p * 18 + 8, { stroke: i === 0 ? C.acc : C.line, hl: 5 }); });
  for (let p = 0; p < 12; p++) d.box(306, 60 + p * 18, 80, 16, `p${p}`, { r: 2, cls: 'mono', size: 8.5, fill: [1, 11, 3, 4].includes(p) ? C.accSoft : C.card, stroke: [1, 11, 3, 4].includes(p) ? C.acc : C.line });
  d.text(510, 120, 'same key, same partition,\nso all events for order 123\nstay in order', { cls: 'sm', vc: true });
  d.text(510, 220, 'no key: spread across\npartitions in batches', { cls: 'xs', vc: true });
  return d.svg();
}

export function be_kafka_batching() {
  const d = fig('be_kafka_batching', 'THE PRODUCER BATCHES PER PARTITION, THEN SENDS', 300);
  d.server(30, 110, 70, 80, { label: 'producer' });
  [0, 1, 2].forEach((p) => { const y = 80 + p * 50; d.rect(160, y, 200, 34, { r: 4, fill: C.paper }); for (let i = 0; i < [5, 3, 6][p]; i++) d.rect(166 + i * 30, y + 6, 26, 22, { r: 2, fill: C.card, stroke: C.ink2 }); d.text(150, y + 17, `p${p}`, { cls: 'mono', size: 9, a: 'end' }); });
  d.arrow(104, 150, 150, 150, { stroke: C.gray, hl: 5 });
  hourglass(d, 400, 120, 40, { level: 0.6, label: 'linger.ms 5' });
  d.arrow(430, 140, 500, 140, { stroke: C.acc });
  d.db(510, 100, 100, 90, { label: 'brokers' });
  d.text(320, 270, 'a batch leaves when it reaches batch.size or linger.ms passes; compression works per batch', { cls: 'xs' });
  return d.svg();
}

export function be_kafka_acks() {
  const d = fig('be_kafka_acks', 'acks: HOW MANY REPLICAS MUST HAVE A RECORD BEFORE THE PRODUCER HEARS "OK"', 320);
  [['acks=0', 'fire and forget', 0], ['acks=1', 'leader has it', 1], ['acks=all', 'every in-sync replica has it', 3]].forEach(([t, s, n], i) => {
    const x = 20 + i * 207; panel(d, x, 40, 193, 250, t, i === 2); d.text(x + 96, 76, s, { cls: 'xs' });
    [0, 1, 2].forEach((r) => { d.db(x + 20 + r * 56, 110, 44, 56, { stroke: r < n || (n === 1 && r === 0) ? C.acc : C.ink2, fill: r < n ? C.accFaint : C.card }); d.text(x + 42 + r * 56, 186, r === 0 ? 'leader' : `f${r}`, { cls: 'xs' }); });
  });
  d.text(116, 230, 'lost if the leader\ncrashes, or never arrived', { cls: 'xs', vc: true });
  d.text(323, 230, 'lost if the leader\ndies before followers copy', { cls: 'xs', vc: true });
  d.text(530, 230, 'survives a broker loss;\nwith min.insync.replicas 2', { cls: 'xs', vc: true });
  return d.svg();
}

export function be_kafka_groups() {
  const d = fig('be_kafka_groups', 'A CONSUMER GROUP SPLITS PARTITIONS; A SECOND GROUP READS EVERYTHING AGAIN', 340);
  for (let p = 0; p < 12; p++) d.box(40, 50 + p * 22, 70, 18, `p${p}`, { r: 2, cls: 'mono', size: 8.5, fill: C.card, stroke: C.ink2 });
  [0, 1, 2].forEach((c) => { d.gear(260, 80 + c * 90, 16, { spin: 4, stroke: C.acc }); d.text(290, 80 + c * 90, `kitchen-${c + 1}`, { cls: 'xs', a: 'start', color: C.acc }); for (let k = 0; k < 4; k++) d.line(112, 59 + (c * 4 + k) * 22, 242, 80 + c * 90, { stroke: C.acc, single: true, sw: 0.8 }); });
  d.gear(260, 330, 14, { stroke: C.line }); d.text(290, 330, 'kitchen-13: idle', { cls: 'xs', a: 'start' });
  d.gear(520, 180, 20, { spin: 3 }); d.text(520, 214, 'analytics group', { cls: 'xs' }); d.text(520, 230, 'one consumer, all 12', { cls: 'xs' });
  for (let p = 0; p < 12; p += 2) d.line(112, 59 + p * 22, 498, 180, { stroke: C.line, single: true, sw: 0.6 });
  d.text(520, 100, 'parallelism ≤ partitions', { cls: 'hand', size: 15 });
  return d.svg();
}

export function be_kafka_offsets() {
  const d = fig('be_kafka_offsets', 'COMMIT AFTER PROCESSING: A CRASH REPLAYS FROM THE LAST COMMITTED OFFSET', 300);
  logTape(d, 60, 100, 14, { cw: 36, start: 400, hot: (i) => i >= 5 && i <= 8 });
  bookmark(d, 60 + 5 * 36, 98, 'committed 405', true);
  d.arrow(60 + 9 * 36, 150, 60 + 9 * 36, 128, { stroke: C.ink2, hl: 5 }); d.text(60 + 9 * 36, 164, 'processing 409 when it crashed', { cls: 'xs' });
  d.brace(60 + 5 * 36 + 2, 60 + 9 * 36 - 2, 90, { dir: -1, label: '405 to 408 run again', cls: 'xs', color: C.acc });
  d.text(320, 220, 'auto-commit every 5 s can commit offsets before processing finishes, losing records on a crash', { cls: 'sm' });
  d.text(320, 250, 'commit after the work, and make the work idempotent so the replay is harmless', { cls: 'xs' });
  return d.svg();
}

export function be_kafka_isr() {
  const d = fig('be_kafka_isr', 'REPLICATION FACTOR 3, MIN IN-SYNC REPLICAS 2', 320);
  d.db(60, 80, 110, 90, { label: 'broker 1\nleader p1', stroke: C.acc, fill: C.accFaint });
  d.db(260, 80, 110, 90, { label: 'broker 2\nfollower' });
  d.db(460, 80, 110, 90, { label: 'broker 3\nfollower' });
  d.arrow(174, 125, 254, 125, { stroke: C.ink2 }); d.arrow(174, 140, 454, 140, { stroke: C.ink2, dash: [4, 3] });
  d.rect(40, 60, 350, 130, { r: 12, stroke: C.acc, dash: [6, 4] }); d.text(215, 210, 'ISR = {1, 2}', { cls: 'mono', size: 10, color: C.acc });
  d.during([0.4, 1], (g) => g.text(515, 200, 'fell behind:\nout of the ISR', { cls: 'xs', vc: true }));
  d.text(320, 260, 'acks=all waits for the ISR; with only the leader left, writes fail rather than risk loss', { cls: 'sm' });
  d.text(320, 290, 'unclean leader election off: an out-of-sync replica never becomes leader', { cls: 'xs' });
  return d.svg();
}

export function be_kafka_idempotent() {
  const d = fig('be_kafka_idempotent', 'AN IDEMPOTENT PRODUCER: THE BROKER DROPS A RETRIED BATCH IT ALREADY HAS', 300);
  d.server(30, 100, 70, 80, { label: 'producer PID 7' });
  d.db(460, 80, 140, 120, { label: 'leader p1' });
  d.arrow(104, 120, 454, 120, { stroke: C.ink2 }); d.text(280, 108, 'seq 41', { cls: 'mono', size: 9.5 });
  d.arrow(454, 150, 104, 150, { stroke: C.gray, dash: [4, 3] }); cross(d, 280, 150, 8); d.text(280, 170, 'ack lost', { cls: 'xs' });
  d.arrow(104, 200, 454, 190, { stroke: C.acc }); d.text(280, 212, 'retry seq 41 → duplicate, dropped', { cls: 'mono', size: 9.5, color: C.acc });
  d.text(320, 270, 'on by default since Kafka 3.0: no duplicates and no reordering from producer retries', { cls: 'xs' });
  return d.svg();
}

export function be_kafka_txn() {
  const d = fig('be_kafka_txn', 'A KAFKA TRANSACTION COMMITS OUTPUT RECORDS AND INPUT OFFSETS TOGETHER', 300);
  logTape(d, 40, 90, 5, { cw: 34, start: 70, label: 'in' });
  d.gear(260, 105, 22, { spin: 5, stroke: C.acc }); d.text(260, 140, 'read, process, write', { cls: 'xs' });
  logTape(d, 380, 90, 5, { cw: 34, start: 20, hot: (i) => i === 4, label: 'out' });
  d.rect(330, 160, 280, 50, { r: 8, fill: C.accFaint, stroke: C.acc, dash: [5, 4] }); d.text(470, 185, 'commit: record 24 + offset 75', { cls: 'mono', size: 9.5, color: C.acc });
  d.text(320, 250, 'consumers with isolation.level=read_committed never see aborted output', { cls: 'sm' });
  d.text(320, 278, 'exactly-once holds inside Kafka; an email sent from the processor is still outside it', { cls: 'xs' });
  return d.svg();
}

export function be_kafka_rebalance() {
  const d = fig('be_kafka_rebalance', 'REBALANCING: STOP EVERYONE, OR MOVE ONLY WHAT MUST MOVE', 300);
  const y = lanes(d, ['eager', 'cooperative'], { y: 90, gap: 100, x0: 110, x1: 610, tl: 'seconds' });
  seg(d, 120, y(0), 120, 'consuming'); seg(d, 245, y(0), 160, 'all partitions revoked: pause', { hot: true, size: 8.5 }); seg(d, 410, y(0), 180, 'consuming');
  seg(d, 120, y(1), 470, 'consuming throughout'); seg(d, 300, y(1) + 22, 70, 'p7 moves', { hot: true, size: 8.5, h: 16 });
  d.text(320, 270, 'triggers: a consumer joins, leaves, crashes, or misses max.poll.interval.ms; static membership avoids restarts', { cls: 'xs' });
  return d.svg();
}

export function be_kafka_retention() {
  const d = fig('be_kafka_retention', 'DELETE RETENTION DROPS OLD SEGMENTS; COMPACTION KEEPS THE LATEST VALUE PER KEY', 340);
  d.text(40, 54, 'retention.ms = 7 days', { cls: 'ttl', a: 'start' });
  ['day 1', 'day 2', 'day 3', '…', 'day 7', 'day 8'].forEach((s, i) => { d.rect(40 + i * 92, 70, 84, 40, { r: 3, fill: i === 0 ? C.paper : C.card, stroke: i === 0 ? C.line : C.ink2, dash: i === 0 ? [3, 3] : undefined }); d.mono(82 + i * 92, 90, s, { size: 9.5, color: i === 0 ? C.gray : undefined }); });
  cross(d, 82, 90, 14, C.gray);
  d.text(40, 160, 'cleanup.policy = compact', { cls: 'ttl', a: 'start' });
  const before = [['r9', 'open'], ['r3', 'open'], ['r9', 'busy'], ['r5', 'open'], ['r9', 'closed'], ['r3', '∅']];
  before.forEach(([k, v], i) => d.box(40 + i * 92, 176, 84, 40, `${k}: ${v}`, { r: 3, cls: 'mono', size: 9, fill: [3, 4, 5].includes(i) ? C.accSoft : C.card, stroke: [3, 4, 5].includes(i) ? C.acc : C.line }));
  d.text(320, 240, 'after compaction: r5 open, r9 closed; r3 deleted by its tombstone (∅) after a grace period', { cls: 'xs' });
  d.text(320, 290, 'order-events: 250 events/s × 1 KB × 86,400 s = 21.6 GB/day; × 3 replicas × 7 days = 453.6 GB', { cls: 'mono', size: 9.5 });
  return d.svg();
}

export function be_kafka_lag() {
  const d = fig('be_kafka_lag', 'CONSUMER LAG: SIX HOURS BEHIND, AND HOW LONG IT TAKES TO CATCH UP', 330);
  const M = d.axes(70, 50, 500, 190, { xmin: 0, xmax: 24, ymin: 0, ymax: 3.5, xl: 'hours', yl: 'lag (millions)' });
  d.fn((t) => (t < 6 ? 3.24 * t / 6 : Math.max(0, 3.24 - (t - 6) * 0.18)), 0, 24, M, { n: 200 });
  d.fn((t) => (t < 6 ? 3.24 * t / 6 : Math.max(0, 3.24 - (t - 6) * 2.34)), 6, 9, M, { stroke: C.slate, n: 100 });
  d.text(M.X(6), M.Y(3.24) - 12, '3,240,000 behind', { cls: 'mono', size: 9.5 });
  d.text(M.X(16), M.Y(1.6), '3 consumers: +50/s, 18 h', { cls: 'xs', a: 'start', color: C.acc });
  d.text(M.X(7.6), M.Y(0.4), '12 consumers: +650/s, 83 min', { cls: 'xs', a: 'start' });
  d.text(320, 300, 'lag in records and in time; alert on time behind, because rates vary through the day', { cls: 'xs' });
  return d.svg();
}

export function be_kafka_ordering() {
  const d = fig('be_kafka_ordering', 'ADDING PARTITIONS MOVES KEYS: order-124 GOES FROM PARTITION 11 TO 3', 300);
  d.text(160, 60, '12 partitions', { cls: 'ttl' }); d.text(480, 60, '16 partitions', { cls: 'ttl' });
  [['order-123', 1, 1], ['order-124', 11, 3], ['order-125', 3, 7]].forEach(([k, a, b], i) => { const y = 100 + i * 50; d.chips(40, y, [k], { h: 26, width: 90, size: 9.5 }); d.box(150, y, 60, 26, `p${a}`, { r: 3, cls: 'mono', size: 9.5, fill: C.card }); d.box(450, y, 60, 26, `p${b}`, { r: 3, cls: 'mono', size: 9.5, fill: a === b ? C.card : C.accSoft, stroke: a === b ? C.ink2 : C.acc }); d.arrow(214, y + 13, 444, y + 13, { stroke: a === b ? C.line : C.acc, hl: 5, dash: a === b ? [3, 3] : undefined }); });
  d.text(320, 270, 'old events for a key sit in one partition and new ones in another, so per-key order breaks during the change', { cls: 'xs' });
  return d.svg();
}

export function be_kafka_hot_partition() {
  const d = fig('be_kafka_hot_partition', 'A HOT KEY MAKES A HOT PARTITION', 300);
  for (let p = 0; p < 12; p++) { const h = p === 11 ? 180 : 20 + ((p * 37) % 25); d.rect(50 + p * 46, 250 - h, 36, h, { r: 2, fill: p === 11 ? C.accSoft : C.card, stroke: p === 11 ? C.acc : C.ink2 }); d.mono(68 + p * 46, 264, `p${p}`, { size: 8.5 }); }
  d.text(560, 60, 'keyed by restaurant:\nrestaurant-9\'s promotion\nlands on p11', { cls: 'xs', vc: true, color: C.acc });
  d.text(300, 290, 'key by order instead, or salt the hot key, and accept order only within that finer key', { cls: 'xs' });
  return d.svg();
}

export function be_q_compare() {
  const d = fig('be_q_compare', 'FOUR SYSTEMS, ONE QUESTION EACH: WHAT HAPPENS TO A MESSAGE AFTER IT IS READ?', 320);
  sheet(d, 20, 50, [['', 110], ['RabbitMQ', 125], ['SQS', 125], ['Kafka', 125], ['Redis Streams', 115]], [['after ack', 'deleted', 'deleted', 'kept (retention)', 'kept (trim)'], ['ordering', 'per queue', 'FIFO queues', 'per partition', 'per stream'], ['replay', 'no', 'no', 'yes, any offset', 'yes, by id'], ['scaling unit', 'queue', 'managed', 'partition', 'stream'], ['strength', 'routing', 'zero ops', 'throughput, log', 'simplicity']], { rh: 36, size: 9.5, hot: [2] });
  return d.svg();
}

export function be_ev_command_event() {
  const d = fig('be_ev_command_event', 'A COMMAND ASKS ONE SERVICE TO DO SOMETHING; AN EVENT TELLS EVERYONE IT HAPPENED', 300);
  d.envelope(60, 90, 120, 70, { stroke: C.ink2 }); d.text(120, 180, 'PlaceOrder', { cls: 'mono', size: 10 }); d.text(120, 198, 'to: order service', { cls: 'xs' }); d.text(120, 214, 'may be refused', { cls: 'xs' });
  d.arrow(186, 125, 250, 125, { stroke: C.ink2 }); d.server(256, 90, 50, 70, { unit: 12 });
  d.rect(360, 70, 240, 130, { r: 4, fill: C.paper }); d.text(480, 86, 'notice board', { cls: 'xs' });
  d.rect(420, 100, 120, 50, { r: 2, fill: C.accSoft, stroke: C.acc }); d.text(480, 125, 'OrderPlaced 124', { cls: 'mono', size: 9.5, color: C.acc });
  crowd(d, 400, 214, 4, { s: 20, gap: 44 }); d.text(480, 262, 'kitchen, email, analytics, search', { cls: 'xs' });
  d.text(320, 286, 'commands are imperative and addressed; events are past tense, facts, and have no addressee', { cls: 'xs' });
  return d.svg();
}

export function be_ev_bus() {
  const d = fig('be_ev_bus', 'AN EVENT BUS: PRODUCERS DO NOT KNOW WHO LISTENS', 300);
  pipe(d, 40, 600, 150, 30, true); d.text(320, 150, 'order-events', { cls: 'mono', size: 10, color: C.acc });
  d.server(80, 50, 60, 60, { label: 'orders' }); d.arrow(110, 126, 110, 138, { stroke: C.acc, hl: 5 });
  [['kitchen', 200], ['email', 320], ['analytics', 440], ['search', 560]].forEach(([s, x]) => { d.arrow(x, 166, x, 200, { stroke: C.ink2, hl: 5 }); d.gear(x, 222, 16, { spin: 5 }); d.text(x, 252, s, { cls: 'xs' }); });
  for (let i = 0; i < 3; i++) d.travel([[60, 150], [600, 150]], { token: 'packet', at: [i * 0.33, i * 0.33 + 0.5] });
  d.text(320, 286, 'adding a new consumer needs no change to the order service', { cls: 'xs' });
  return d.svg();
}

export function be_ev_schema() {
  const d = fig('be_ev_schema', 'A SCHEMA REGISTRY CHECKS EACH NEW VERSION BEFORE ANY PRODUCER USES IT', 320);
  card(d, 30, 60, 210, ['OrderPlaced v1', 'order_id: long', 'user_id: long', 'total_paise: long'], { size: 9.5 });
  card(d, 30, 170, 210, ['OrderPlaced v2', 'order_id: long', 'user_id: long', 'total_paise: long', 'tip_paise: long = 0'], { size: 9.5, hot: [4] });
  d.rect(300, 110, 130, 90, { r: 8, fill: C.accFaint, stroke: C.acc }); d.text(365, 140, 'registry', { cls: 'ttl', color: C.acc }); d.text(365, 164, 'compatibility:\nBACKWARD', { cls: 'xs', vc: true });
  d.arrow(244, 220, 296, 170, { stroke: C.acc }); tick(d, 455, 150, 9);
  d.text(530, 120, 'new field has a default,\nso v2 readers can read v1\nrecords', { cls: 'xs', vc: true });
  d.text(530, 210, 'renaming or removing a\nrequired field is refused', { cls: 'xs', vc: true });
  return d.svg();
}

export function be_ev_compat() {
  const d = fig('be_ev_compat', 'WHO MUST UNDERSTAND WHOM', 300);
  sheet(d, 50, 60, [['mode', 120], ['new readers read old data', 200], ['old readers read new data', 200]], [['BACKWARD', 'yes', 'not promised'], ['FORWARD', 'not promised', 'yes'], ['FULL', 'yes', 'yes']], { rh: 38, size: 10, hot: [2] });
  d.text(320, 230, 'upgrade consumers first under BACKWARD, producers first under FORWARD, either order under FULL', { cls: 'sm' });
  d.text(320, 262, 'safe changes for FULL: add or remove optional fields that have defaults', { cls: 'xs' });
  return d.svg();
}

export function be_ev_eventual() {
  const d = fig('be_ev_eventual', 'EVENTUAL CONSISTENCY: THE ORDER EXISTS BEFORE THE KITCHEN SCREEN KNOWS', 300);
  const y = lanes(d, ['orders DB', 'Kafka', 'kitchen view'], { y: 80, gap: 60, x0: 110, x1: 610, tl: 'ms' });
  const X = (ms) => 120 + ms * 3.5;
  d.dot(X(0), y(0), 5, C.ink); d.text(X(0) + 8, y(0) - 14, 'commit order 124', { cls: 'xs', a: 'start' });
  d.arrow(X(0), y(0) + 4, X(40), y(1) - 6, { stroke: C.gray, hl: 5 }); d.dot(X(40), y(1), 4); d.text(X(40) + 8, y(1) - 14, 'relayed at 40 ms', { cls: 'xs', a: 'start' });
  d.arrow(X(40), y(1) + 4, X(120), y(2) - 6, { stroke: C.gray, hl: 5 }); d.dot(X(120), y(2), 5, C.acc); d.text(X(120) + 8, y(2) - 14, 'shown at 120 ms', { cls: 'xs', a: 'start', color: C.acc });
  d.brace(X(0), X(120), y(2) + 30, { label: 'the inconsistency window', cls: 'xs' });
  return d.svg();
}

export function be_ev_sourcing() {
  const d = fig('be_ev_sourcing', 'EVENT SOURCING: STORE WHAT HAPPENED; DERIVE WHAT IS', 320);
  const ev = ['Placed 450', 'TipAdded 30', 'ItemRemoved −80', 'Paid 400', 'Refunded 80'];
  ev.forEach((s, i) => d.box(30 + i * 118, 70, 110, 40, s, { r: 4, cls: 'mono', size: 9, fill: C.card }));
  d.arrow(320, 120, 320, 160, { stroke: C.acc }); d.text(330, 140, 'fold', { cls: 'hand', size: 15, a: 'start' });
  card(d, 220, 168, 200, ['order 124', 'total 400, paid 400', 'refunded 80, status refunded'], { size: 9.5, hot: [2] });
  d.text(320, 268, 'the state is a function of the history; replay the events and you get it back', { cls: 'sm' });
  d.text(320, 296, 'snapshots every N events keep replays short; events are never edited, only appended', { cls: 'xs' });
  return d.svg();
}

export function be_ev_cqrs() {
  const d = fig('be_ev_cqrs', 'CQRS: ONE MODEL TO DECIDE, OTHERS SHAPED FOR READING', 320);
  d.text(130, 54, 'write side', { cls: 'ttl' }); d.text(480, 54, 'read side', { cls: 'ttl' });
  d.box(50, 80, 160, 40, 'commands', { r: 6, fill: C.card }); d.arrow(130, 122, 130, 150, { stroke: C.gray, hl: 5 });
  d.db(80, 150, 100, 80, { label: 'orders' });
  pipe(d, 190, 360, 190, 18, true); d.text(275, 176, 'events', { cls: 'xs', color: C.acc });
  [['kitchen board', 80], ['user history', 160], ['search index', 240]].forEach(([s, y]) => { d.db(380, y - 30, 70, 52, {}); d.text(470, y - 4, s, { cls: 'sm', a: 'start' }); d.line(362, 190, 380, y - 4, { stroke: C.acc, single: true }); });
  d.text(320, 300, 'each read model is a projection, rebuilt by replaying events, and lags the write side', { cls: 'xs' });
  return d.svg();
}

export function be_ev_dual_write() {
  const d = fig('be_ev_dual_write', 'THE DUAL-WRITE PROBLEM: TWO SYSTEMS, NO SHARED COMMIT', 300);
  d.server(50, 110, 70, 80, { label: 'order service' });
  d.db(280, 50, 110, 80, { label: 'PostgreSQL' }); d.db(280, 180, 110, 80, { label: 'Kafka' });
  d.arrow(124, 130, 274, 90, { stroke: C.ink2 }); tick(d, 410, 90, 9); d.text(200, 96, '1 COMMIT', { cls: 'mono', size: 9.5 });
  d.arrow(124, 170, 274, 220, { stroke: C.acc, dash: [4, 3] }); bolt(d, 200, 170, 0.8); d.text(196, 240, '2 publish', { cls: 'mono', size: 9.5, color: C.acc });
  d.text(530, 120, 'crash between 1 and 2:\nthe order exists, the\nkitchen never hears', { cls: 'sm', vc: true });
  d.text(530, 220, 'publish first instead:\nthe kitchen cooks an\norder that rolled back', { cls: 'xs', vc: true });
  return d.svg();
}

export function be_ev_outbox() {
  const d = fig('be_ev_outbox', 'THE TRANSACTIONAL OUTBOX: WRITE THE EVENT AS A ROW, PUBLISH IT LATER', 320);
  d.rect(40, 60, 260, 170, { r: 10, fill: C.paper, stroke: C.acc, dash: [6, 4] }); d.text(170, 76, 'one transaction', { cls: 'xs', color: C.acc });
  d.mono(60, 108, 'INSERT INTO orders …', { size: 10, a: 'start' }); d.mono(60, 132, 'INSERT INTO outbox (id, topic,', { size: 10, a: 'start', color: C.acc }); d.mono(60, 148, '  key, payload) …', { size: 10, a: 'start', color: C.acc }); d.mono(60, 180, 'COMMIT', { size: 10, a: 'start' });
  d.gear(370, 145, 22, { spin: 5 }); d.text(370, 182, 'relay', { cls: 'sm' });
  d.arrow(304, 145, 346, 145, { stroke: C.ink2, hl: 5 }); d.arrow(394, 145, 450, 145, { stroke: C.acc, hl: 5 });
  d.db(460, 100, 130, 90, { label: 'Kafka\norder-events' });
  for (let i = 0; i < 3; i++) d.travel([[394, 145], [454, 145]], { token: 'packet', at: [i * 0.33, i * 0.33 + 0.25] });
  d.text(320, 270, 'the order and its event commit or vanish together; the relay retries until Kafka has it', { cls: 'sm' });
  d.text(320, 298, 'at-least-once to Kafka, so consumers stay idempotent', { cls: 'xs' });
  return d.svg();
}

export function be_ev_relay() {
  const d = fig('be_ev_relay', 'TWO WAYS TO RELAY: POLL THE TABLE, OR READ THE WAL', 300);
  panel(d, 20, 40, 290, 230, 'polling relay'); panel(d, 330, 40, 290, 230, 'log-based CDC', true);
  d.db(60, 100, 80, 70, { label: 'outbox' }); d.clock(200, 130, 46, { spin: 2 }); d.text(200, 172, 'every 100 ms', { cls: 'xs' });
  d.mono(165, 210, 'SELECT … LIMIT 500 FOR UPDATE SKIP LOCKED', { size: 8 }); d.text(165, 238, 'simple; adds query load', { cls: 'xs' });
  d.db(370, 100, 80, 70, { label: 'WAL' }); d.gear(520, 135, 22, { spin: 5, stroke: C.acc }); d.text(520, 172, 'Debezium', { cls: 'xs', color: C.acc });
  for (let i = 0; i < 2; i++) d.travel([[454, 135], [496, 135]], { r: 3, at: [i * 0.5, i * 0.5 + 0.3] });
  d.text(475, 220, 'low latency, commit order,\nno polling; more to run', { cls: 'xs', vc: true });
  return d.svg();
}

export function be_ev_saga_choreo() {
  const d = fig('be_ev_saga_choreo', 'A CHOREOGRAPHED SAGA: EACH SERVICE REACTS TO THE LAST ONE\'S EVENT', 320);
  const svc = [['orders', 320, 70], ['payments', 520, 150], ['kitchen', 420, 270], ['couriers', 220, 270], ['notify', 120, 150]];
  svc.forEach(([s, x, y]) => { d.circle(x, y, 70, { fill: C.card, stroke: C.ink2 }); d.text(x, y, s, { cls: 'sm' }); });
  const ev = ['OrderPlaced', 'PaymentCaptured', 'KitchenAccepted', 'CourierAssigned'];
  for (let i = 0; i < 4; i++) { const [, x1, y1] = svc[i], [, x2, y2] = svc[i + 1]; d.carrow([[x1 + (x2 - x1) * 0.2, y1 + (y2 - y1) * 0.2], [(x1 + x2) / 2 + (i % 2 ? -20 : 20), (y1 + y2) / 2], [x1 + (x2 - x1) * 0.8, y1 + (y2 - y1) * 0.8]], { stroke: C.acc, hl: 6 }); d.text((x1 + x2) / 2 + (i < 2 ? 40 : -40), (y1 + y2) / 2 - 12, ev[i], { cls: 'mono', size: 8.5, color: C.acc }); }
  d.text(320, 170, 'no conductor;\nthe flow lives in\nthe subscriptions', { cls: 'xs', vc: true });
  return d.svg();
}

export function be_ev_saga_orch() {
  const d = fig('be_ev_saga_orch', 'AN ORCHESTRATED SAGA: ONE COORDINATOR SENDS COMMANDS AND TRACKS STATE', 320);
  d.person(320, 60, 40, { stroke: C.acc }); d.text(320, 116, 'order saga orchestrator', { cls: 'sm', color: C.acc });
  [['payments', 100], ['kitchen', 250], ['couriers', 390], ['notify', 540]].forEach(([s, x], i) => { d.arrow(320, 128, x, 196, { stroke: C.ink2, hl: 5 }); d.server(x - 25, 200, 50, 60, { unit: 12 }); d.text(x, 276, s, { cls: 'xs' }); });
  d.text(320, 300, 'state persisted per order: PAYING → COOKING → DISPATCHING → DONE, or a compensation path', { cls: 'xs' });
  return d.svg();
}

export function be_ev_compensation() {
  const d = fig('be_ev_compensation', 'NO COURIER AVAILABLE: COMPENSATE THE COMPLETED STEPS IN REVERSE', 320);
  const st = [['charge card', 'refund'], ['kitchen ticket', 'cancel ticket'], ['assign courier', '']];
  st.forEach(([a, b], i) => { const x = 60 + i * 200; d.box(x, 80, 150, 40, a, { r: 6, fill: i === 2 ? C.accSoft : C.card, stroke: i === 2 ? C.acc : C.ink2 }); if (i < 2) d.arrow(x + 152, 100, x + 198, 100, { stroke: C.ink2, hl: 5 }); if (b) d.box(x, 200, 150, 40, b, { r: 6, fill: C.paper, stroke: C.acc, dash: [4, 3] }); });
  cross(d, 535, 100, 10);
  d.carrow([[535, 130], [520, 220], [412, 220]], { stroke: C.acc, dash: [4, 3] }); d.arrow(258, 220, 212, 220, { stroke: C.acc, dash: [4, 3] });
  d.text(320, 280, 'compensations are new actions, not undo: a refund is a second transaction the customer can see', { cls: 'xs' });
  return d.svg();
}

export function be_cron_duplicates() {
  const d = fig('be_cron_duplicates', 'TWENTY INSTANCES, ONE CRONTAB ENTRY EACH: THE DAILY REPORT GOES OUT TWENTY TIMES', 320);
  for (let i = 0; i < 20; i++) { const x = 50 + (i % 10) * 56, y = 70 + Math.floor(i / 10) * 100; d.clock(x, y, 38, { t: 2 / 12 }); d.during([0.3, 1], (g) => g.envelope(x - 12, y + 26, 24, 16, { stroke: C.acc, fill: C.accSoft })); }
  d.text(320, 270, '0 2 * * *  send_daily_report', { cls: 'mono', size: 11 });
  d.text(320, 298, 'every instance runs the same image, so every instance has the same schedule', { cls: 'xs' });
  return d.svg();
}

export function be_cron_solutions() {
  const d = fig('be_cron_solutions', 'THREE WAYS TO RUN A JOB ONCE ACROSS A FLEET', 320);
  [['one scheduler', 'a single CronJob or service'], ['leader election', 'a lease decides who runs'], ['claim the run', 'a unique row per run']].forEach(([t, s], i) => { const x = 20 + i * 207; panel(d, x, 40, 193, 250, t, i === 2); d.text(x + 96, 76, s, { cls: 'xs' }); });
  d.clock(116, 140, 60, { t: 2 / 12 }); d.server(91, 190, 50, 60, { unit: 12 });
  d.lock(300, 120, 36, { stroke: C.acc, fill: C.accSoft }); d.text(323, 186, 'lease 30 s,\nrenewed every 10 s', { cls: 'xs', vc: true }); crowd(d, 270, 220, 3, { s: 18, gap: 26, hot: (i) => i === 0 });
  card(d, 436, 100, 176, ['INSERT INTO job_runs', ' (job, run_date)', " VALUES ('report',", "  '2026-10-06')", 'ON CONFLICT DO NOTHING'], { size: 8.5, hot: [4] });
  d.text(530, 220, 'whoever inserts the row\nruns the job', { cls: 'xs', vc: true });
  return d.svg();
}

export function be_cron_catchup() {
  const d = fig('be_cron_catchup', 'MISSED RUNS: THE SCHEDULER WAS DOWN FROM 01:00 TO 05:30', 300);
  const X = (h) => 60 + h * 22;
  d.line(X(0), 120, X(24), 120, { stroke: C.line, sw: 2, single: true });
  d.rect(X(1), 104, X(5.5) - X(1), 32, { r: 4, fill: C.accFaint, stroke: C.acc, dash: [4, 3] }); d.text((X(1) + X(5.5)) / 2, 92, 'down', { cls: 'xs', color: C.acc });
  [2, 3, 4, 5].forEach((h) => { d.dot(X(h), 120, 5, C.acc); d.mono(X(h), 150, `0${h}:00`, { size: 8.5 }); });
  [0, 6, 12, 18, 24].forEach((h) => d.mono(X(h), 170, `${String(h).padStart(2, '0')}:00`, { size: 8.5, color: C.gray }));
  [['run all four', 'hourly sync that must not skip'], ['run once now', 'a report: latest data is enough'], ['skip', 'a reminder that is now pointless']].forEach(([a, b], i) => { d.text(80, 210 + i * 24, a, { cls: 'mono', size: 9.5, a: 'start' }); d.text(220, 210 + i * 24, b, { cls: 'xs', a: 'start' }); });
  return d.svg();
}

export function be_ev_e2e() {
  const d = fig('be_ev_e2e', 'ORDER 124 AFTER THE COMMIT: ONE EVENT, FOUR INDEPENDENT REACTIONS', 340);
  d.db(30, 120, 90, 80, { label: 'orders +\noutbox' });
  d.gear(160, 160, 16, { spin: 4 }); d.text(160, 188, 'relay', { cls: 'xs' });
  logTape(d, 200, 148, 6, { cw: 34, start: 7810, hot: (i) => i === 5, label: '' }); d.text(302, 134, 'order-events p11', { cls: 'mono', size: 9 });
  d.arrow(124, 160, 144, 160, { stroke: C.gray, hl: 4 }); d.arrow(176, 160, 196, 160, { stroke: C.gray, hl: 4 });
  [['kitchen screen', 'idempotent upsert', 60], ['receipt email', 'inbox table + provider key', 130], ['analytics', 'append to warehouse', 200], ['search index', 'update restaurant stats', 270]].forEach(([t, s, y], i) => { d.arrow(410, 161, 470, y, { stroke: i === 0 ? C.acc : C.ink2, hl: 5 }); d.gear(486, y, 12, { spin: 3 + i }); d.text(504, y - 6, t, { cls: 'sm', a: 'start' }); d.text(504, y + 9, s, { cls: 'xs', a: 'start' }); });
  d.travel([[124, 160], [410, 160]], { token: 'packet', at: [0, 0.4] });
  d.text(320, 320, 'each consumer group fails, retries and scales on its own; the API answered long ago', { cls: 'xs' });
  return d.svg();
}

export function be_ev_failures() {
  const d = fig('be_ev_failures', 'THREE BAD EVENINGS AND WHAT CONTAINS EACH ONE', 340);
  [['consumer 6 h behind', 'scale to partitions, alert on time lag, check retention'], ['queue fills faster than workers', 'autoscale on depth, shed low-priority work, DLQ poison'], ['broker leader dies', 'ISR follower takes over; acks=all loses nothing']].forEach(([t, s], i) => { const y = 60 + i * 90; d.rect(30, y, 580, 74, { r: 8, fill: i === 0 ? C.accFaint : C.paper, stroke: i === 0 ? C.acc : C.line }); d.text(50, y + 24, t, { cls: 'ttl', a: 'start', color: i === 0 ? C.acc : undefined }); d.text(50, y + 48, s, { cls: 'sm', a: 'start' }); });
  hourglass(d, 560, 72, 46, { level: 0.2 }); gauge(d, 560, 210, 26, 0.9, { hot: true }); d.db(540, 245, 40, 40, {});
  return d.svg();
}

export function be_ev_components() {
  const d = fig('be_ev_components', 'THE UNIT ON ONE PAGE', 340);
  rail(d, 40, 60, 260, ['job', 'job', 'job', 'job'], { gap: 58 }); d.text(170, 150, 'queues: acks, visibility,\nretries, DLQs, idempotency', { cls: 'xs', vc: true });
  logTape(d, 360, 70, 7, { cw: 34 }); bookmark(d, 360 + 4 * 34 + 17, 68, '', true); d.text(480, 130, 'Kafka: partitions, offsets,\ngroups, ISR, retention', { cls: 'xs', vc: true });
  d.rect(40, 190, 260, 90, { r: 8, fill: C.accFaint, stroke: C.acc }); d.text(170, 216, 'outbox and inbox', { cls: 'ttl', color: C.acc }); d.text(170, 246, 'one commit for state and event;\none row per handled message', { cls: 'xs', vc: true });
  d.rect(340, 190, 270, 90, { r: 8, fill: C.paper }); d.text(475, 216, 'events and sagas', { cls: 'ttl' }); d.text(475, 246, 'schemas, eventual consistency,\ncompensations, schedules', { cls: 'xs', vc: true });
  d.text(320, 316, 'every message may arrive late, twice or out of order; every consumer must be fine with that', { cls: 'xs' });
  return d.svg();
}
