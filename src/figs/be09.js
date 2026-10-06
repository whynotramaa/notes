import { C, fig, beMap, beCover, card, steps, panel, cross, tick, hourglass, hose, lanes, seg, crowd, sheet, signpost, gauge, bubble } from '../lib/be-kit.js';
import { pipe, bolt } from '../lib/sd-kit.js';

const PARTS = ['Processes, threads and event loops', 'Async code and pools', 'Race conditions in memory', 'Concurrency across instances', 'Distributed locks', 'Backpressure and overload', 'Memory and resource leaks', 'The Node.js runtime', 'Go and other runtimes', 'One instance end to end'];
export const where_be_conc = (stage = 99) => beMap('where_be_conc', PARTS, stage);

function pan(d, x, y, o = {}) {
  d.ellipse(x, y, 54, 18, { fill: o.hot ? C.accSoft : C.card, stroke: o.hot ? C.acc : C.ink2 });
  d.line(x + 26, y, x + 52, y - 6, { stroke: C.ink2, sw: 2.2, single: true });
  if (o.steam) [0, 1, 2].forEach((i) => d.curve([[x - 10 + i * 10, y - 10], [x - 14 + i * 10, y - 20], [x - 8 + i * 10, y - 30]], { stroke: C.gray, single: true, sw: 0.8 }));
}

export const cover_be_conc = () => beCover('cover_be_conc', 'IX', ['Concurrency and', 'distributed locks'], 'Threads, event loops, races, leases and leaks', (d, y) => {
  d.person(150, y + 90, 60, { stroke: C.acc });
  [[80, y + 60], [150, y + 40], [220, y + 60]].forEach(([x, yy], i) => pan(d, x, yy, { hot: i === 1, steam: true }));
  d.text(150, y + 190, 'one cook, many pans', { cls: 'sm' });
  d.lock(420, y + 60, 70, { stroke: C.acc, fill: C.accSoft });
  d.box(400, y + 170, 110, 34, 'token 34', { r: 6, cls: 'mono', size: 12, fill: C.paper, stroke: C.acc });
  d.hand(455, y + 240, 'the lock is only as good\nas its fencing token', { size: 16, vc: true });
}, [['Runtimes', 'threads, loops, goroutines'], ['Races', 'mutexes, atomics, CAS'], ['Locks', 'leases, fencing, Redlock'], ['Overload', 'backpressure and leaks']]);

export function be_cc_inflight() {
  const d = fig('be_cc_inflight', 'ONE INSTANCE AT PEAK: 500 REQUESTS/S × 50 MS = 25 IN FLIGHT AT ONCE', 280);
  d.rect(140, 70, 360, 120, { r: 14, fill: C.paper, stroke: C.ink2 }); d.text(320, 60, 'app instance', { cls: 'xs' });
  for (let i = 0; i < 25; i++) d.travel([[60, 130], [140, 130], [500, 90 + (i % 5) * 20], [580, 130]], { r: 3.5, dur: 3, at: [i / 25, Math.min(1, i / 25 + 0.6)] });
  d.text(320, 220, 'concurrency is how many requests are in progress, not how many run on a CPU at this instant', { cls: 'sm' });
  d.text(320, 250, 'L = λW again: the same law that sized pools in Unit VI', { cls: 'xs' });
  return d.svg();
}

export function be_cc_conc_par() {
  const d = fig('be_cc_conc_par', 'CONCURRENCY IS ONE COOK JUGGLING PANS; PARALLELISM IS TWO COOKS', 300);
  panel(d, 20, 40, 290, 230, 'concurrency'); panel(d, 330, 40, 290, 230, 'parallelism', true);
  d.person(165, 150, 46); [[90, 110], [165, 92], [240, 110]].forEach(([x, y], i) => pan(d, x, y, { hot: i === 1, steam: i !== 1 }));
  d.travel('M90,135 L165,120 L240,135 L165,120 L90,135', { r: 4, dur: 3 });
  d.text(165, 240, 'progress on three dishes,\none pair of hands', { cls: 'xs', vc: true });
  d.person(430, 150, 46, { stroke: C.acc }); d.person(530, 150, 46, { stroke: C.acc }); pan(d, 430, 110, { hot: true, steam: true }); pan(d, 530, 110, { hot: true, steam: true });
  d.text(475, 240, 'two dishes cooking at the\nsame instant on two cores', { cls: 'xs', vc: true });
  return d.svg();
}

export function be_cc_proc_thread() {
  const d = fig('be_cc_proc_thread', 'PROCESSES ARE SEPARATE HOUSES; THREADS ARE ROOMMATES SHARING ONE KITCHEN', 300);
  [0, 1].forEach((i) => { const x = 40 + i * 130; d.poly([[x, 120], [x + 50, 80], [x + 100, 120]], { fill: C.card, stroke: C.ink2 }); d.rect(x + 8, 120, 84, 90, { r: 2, fill: C.paper }); d.ram(x + 18, 160, 64, 26, { chips: 2 }); d.text(x + 50, 228, `process ${i + 1}`, { cls: 'xs' }); });
  d.text(150, 260, 'own memory; a crash stays inside', { cls: 'xs' });
  d.poly([[350, 120], [470, 60], [590, 120]], { fill: C.card, stroke: C.acc }); d.rect(360, 120, 220, 110, { r: 2, fill: C.accFaint, stroke: C.acc });
  d.ram(420, 180, 100, 30, { chips: 3 }); d.text(470, 224, 'shared heap', { cls: 'xs', color: C.acc });
  crowd(d, 400, 128, 4, { s: 24, gap: 42 });
  d.text(470, 260, 'cheap to talk; one bad write hurts all', { cls: 'xs' });
  return d.svg();
}

export function be_cc_thread_cost() {
  const d = fig('be_cc_thread_cost', '10,000 CONCURRENT CONNECTIONS: STACK MEMORY RESERVED PER MODEL', 280);
  [['OS threads, 1 MB stack', 9766, '≈ 9.8 GB reserved', true], ['goroutines, 2 KB start', 19.5, '≈ 19.5 MB', false], ['event loop, 1 thread', 1, 'one stack + per-connection state', false]].forEach(([s, v, t, hot], i) => { const y = 70 + i * 56; d.text(190, y + 14, s, { cls: 'sm', a: 'end' }); d.rect(200, y, Math.max(4, Math.log10(v + 1) / 4 * 360), 28, { r: 3, fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2 }); d.mono(210 + Math.max(4, Math.log10(v + 1) / 4 * 360), y + 14, t, { size: 9.5, a: 'start', color: hot ? C.acc : undefined }); });
  d.text(320, 250, 'log scale; reserved virtual memory, not all of it touched, but threads also cost scheduling', { cls: 'xs' });
  return d.svg();
}

export function be_cc_blocking() {
  const d = fig('be_cc_blocking', 'A BLOCKED THREAD WAITS; AN EVENT LOOP USES THE WAIT FOR SOMEONE ELSE', 300);
  const y = lanes(d, ['thread A', 'thread B', 'event loop'], { y: 70, gap: 60, x0: 110, x1: 610, tl: 'ms' });
  seg(d, 120, y(0), 30, 'cpu'); seg(d, 152, y(0), 200, 'waiting on DB 40 ms', { fill: C.paper, dash: [4, 3] }); seg(d, 354, y(0), 30, 'cpu');
  seg(d, 120, y(1), 30, 'cpu'); seg(d, 152, y(1), 200, 'waiting on Redis', { fill: C.paper, dash: [4, 3] }); seg(d, 354, y(1), 30, 'cpu');
  ['r1', 'r2', 'r3', 'r4', 'r5', 'r1', 'r2', 'r3'].forEach((s, i) => seg(d, 120 + i * 34, y(2), 30, s, { hot: i % 2 === 0, size: 8.5 }));
  d.text(500, y(2) - 22, 'the CPU never idles\nwhile anyone has work', { cls: 'xs', vc: true });
  return d.svg();
}

export function be_cc_event_loop() {
  const d = fig('be_cc_event_loop', 'AN EVENT LOOP: ASK THE KERNEL WHAT IS READY, RUN ITS CALLBACK, REPEAT', 320);
  d.circle(320, 170, 200, { stroke: C.ink2, sw: 1.4 });
  d.travel('M320,70 A100,100 0 1 1 319.9,70', { r: 6, dur: 3 });
  d.text(320, 160, 'epoll_wait()', { cls: 'mono', size: 11 }); d.text(320, 180, 'sleep until a socket is ready', { cls: 'xs' });
  for (let i = 0; i < 8; i++) { const a = i / 8 * 2 * Math.PI, x = 320 + Math.cos(a) * 150, y = 170 + Math.sin(a) * 120; d.circle(x, y, 18, { fill: i % 3 === 0 ? C.accSoft : C.card, stroke: i % 3 === 0 ? C.acc : C.ink2 }); }
  d.text(560, 60, 'ready sockets\n(orange)', { cls: 'xs', vc: true }); d.text(320, 312, 'one thread serves thousands of connections because most of them are idle at any moment', { cls: 'xs' });
  return d.svg();
}

export function be_cc_async_styles() {
  const d = fig('be_cc_async_styles', 'THREE WAYS TO WRITE "LOAD THE ORDER, THEN THE USER, THEN RESPOND"', 320);
  card(d, 20, 50, 190, ['getOrder(id, (e, o) => {', '  getUser(o.uid, (e, u) => {', '    send(o, u)', '  })', '})'], { size: 9, title: 'callbacks' });
  card(d, 225, 50, 190, ['getOrder(id)', '  .then(o => getUser(o.uid)', '    .then(u => send(o, u)))', '  .catch(fail)'], { size: 9, title: 'promises' });
  card(d, 430, 50, 190, ['const o = await getOrder(id)', 'const u = await getUser(o.uid)', 'send(o, u)'], { size: 9, title: 'async / await', hot: [0, 1] });
  d.text(320, 200, 'same execution: each await hands the thread back to the loop until the result arrives', { cls: 'sm' });
  d.text(320, 230, 'await in a loop runs one at a time; Promise.all or a task group runs them together', { cls: 'xs' });
  return d.svg();
}

export function be_cc_coroutine() {
  const d = fig('be_cc_coroutine', 'A COROUTINE PAUSES AT EACH AWAIT AND RESUMES WHERE IT LEFT OFF', 280);
  const y = lanes(d, ['coroutine A', 'coroutine B', 'loop thread'], { y: 70, gap: 60, x0: 110, x1: 610 });
  seg(d, 120, y(0), 60, 'run'); seg(d, 182, y(0), 140, 'suspended at await', { fill: C.paper, dash: [3, 3], size: 8.5 }); seg(d, 324, y(0), 60, 'resume');
  seg(d, 184, y(1), 60, 'run'); seg(d, 246, y(1), 150, 'suspended', { fill: C.paper, dash: [3, 3], size: 8.5 }); seg(d, 400, y(1), 60, 'resume');
  [[120, 'A'], [184, 'B'], [324, 'A'], [400, 'B']].forEach(([x, s]) => seg(d, x, y(2), 58, s, { hot: true, size: 9 }));
  d.text(320, 250, 'state is saved in the coroutine\'s frame, a few hundred bytes, not a whole thread stack', { cls: 'xs' });
  return d.svg();
}

export function be_cc_pool_sizing() {
  const d = fig('be_cc_pool_sizing', 'SIZING A THREAD POOL: CORES × (1 + WAIT ÷ COMPUTE)', 300);
  const y = lanes(d, ['one thread'], { y: 90, gap: 60, x0: 110, x1: 610, time: false });
  seg(d, 120, y(0), 50, '10 ms cpu', { hot: true, size: 8.5 }); seg(d, 172, y(0), 200, 'waiting 40 ms', { fill: C.paper, dash: [3, 3] }); seg(d, 374, y(0), 50, '10 ms', { hot: true, size: 8.5 });
  d.text(320, 150, '8 × (1 + 40 ÷ 10) = 40 threads keep 8 cores busy', { cls: 'mono', size: 11, color: C.acc });
  [0, 1, 2, 3, 4, 5, 6, 7].forEach((i) => d.cpu(80 + i * 64, 186, 34, { fill: C.card }));
  d.text(320, 266, 'pure CPU work wants about one thread per core; more only adds switching', { cls: 'xs' });
  return d.svg();
}

export function be_cc_blocked_loop() {
  const d = fig('be_cc_blocked_loop', 'A 200 MS CPU TASK ON THE EVENT LOOP: EVERY OTHER REQUEST WAITS BEHIND IT', 320);
  d.circle(200, 170, 200, { stroke: C.ink2, sw: 1.4 });
  d.ellipse(200, 70, 90, 54, { fill: C.accSoft, stroke: C.acc }); d.text(200, 70, 'PDF render\n200 ms', { cls: 'xs', vc: true, color: C.acc });
  crowd(d, 380, 150, 6, { s: 20, gap: 30, hot: () => true });
  d.text(470, 200, 'at 500 requests/s, 100 arrive\nduring the 200 ms and all wait', { cls: 'xs', vc: true });
  d.text(200, 170, 'loop stuck', { cls: 'hand', size: 16 });
  d.text(320, 300, 'health checks time out too, so the orchestrator may kill a process that is merely busy', { cls: 'xs' });
  return d.svg();
}

export function be_cc_offload() {
  const d = fig('be_cc_offload', 'KEEP THE LOOP FOR I/O; SEND CPU WORK TO WORKERS', 300);
  d.circle(150, 150, 140, { stroke: C.ink2, sw: 1.4 }); d.travel('M150,80 A70,70 0 1 1 149.9,80', { r: 5, dur: 2 }); d.text(150, 150, 'event loop', { cls: 'sm' });
  [0, 1, 2, 3].forEach((i) => { d.gear(420 + (i % 2) * 90, 100 + Math.floor(i / 2) * 90, 22, { spin: 3 + i, stroke: i === 0 ? C.acc : C.ink2 }); });
  d.text(465, 240, 'worker threads or a job queue', { cls: 'xs' });
  d.arrow(224, 130, 390, 100, { stroke: C.acc }); d.text(300, 100, 'render(order 124)', { cls: 'mono', size: 9, color: C.acc });
  d.arrow(390, 200, 224, 170, { stroke: C.ink2, dash: [4, 3] }); d.text(300, 206, 'result, later', { cls: 'xs' });
  return d.svg();
}

export function be_cc_balance_race() {
  const d = fig('be_cc_balance_race', 'TWO WITHDRAWALS OF 80 FROM A BALANCE OF 100', 300);
  const y = lanes(d, ['request A', 'request B'], { y: 90, gap: 90, x0: 110, x1: 500 });
  seg(d, 120, y(0), 90, 'read 100'); seg(d, 230, y(0), 90, '100 ≥ 80 ok'); seg(d, 340, y(0), 90, 'write 20');
  seg(d, 150, y(1), 90, 'read 100'); seg(d, 260, y(1), 90, '100 ≥ 80 ok'); seg(d, 370, y(1), 90, 'write 20', { hot: true });
  gauge(d, 570, 160, 46, 0.2, { value: '20', label: 'balance' });
  d.text(320, 270, '160 paid out of an account holding 100; the check and the write were not one step', { cls: 'xs' });
  return d.svg();
}

export function be_cc_counter_race() {
  const d = fig('be_cc_counter_race', 'count++ IS THREE STEPS, AND TWO THREADS CAN INTERLEAVE THEM', 300);
  const y = lanes(d, ['thread 1', 'thread 2', 'memory'], { y: 70, gap: 60, x0: 110, x1: 610, time: false });
  seg(d, 120, y(0), 90, 'load 41'); seg(d, 320, y(0), 90, 'add → 42'); seg(d, 420, y(0), 90, 'store 42');
  seg(d, 220, y(1), 90, 'load 41'); seg(d, 420, y(1) , 0.1, ''); seg(d, 520, y(1), 80, 'store 42', { hot: true });
  seg(d, 120, y(2), 290, 'count = 41', { fill: C.paper }); seg(d, 420, y(2), 180, 'count = 42 (should be 43)', { hot: true });
  d.text(320, 270, 'two threads × 1,000,000 increments often end well short of 2,000,000', { cls: 'xs' });
  return d.svg();
}

export function be_cc_mutex() {
  const d = fig('be_cc_mutex', 'A MUTEX IS THE ONE KEY TO THE ONE ROOM', 300);
  d.rect(400, 60, 200, 180, { r: 4, fill: C.paper }); d.text(500, 80, 'critical section', { cls: 'xs' });
  d.rect(390, 120, 12, 70, { r: 1, fill: C.ink2, stroke: C.ink2 });
  d.person(500, 130, 40, { stroke: C.acc }); d.key(470, 200, 34, { stroke: C.acc });
  crowd(d, 340, 140, 5, { s: 26, gap: 52, dir: -1 }); d.text(220, 200, 'waiting for the key', { cls: 'xs' });
  d.text(320, 270, 'lock, do the read-check-write, unlock; keep it short and never wait on I/O while holding it', { cls: 'xs' });
  return d.svg();
}

export function be_cc_semaphore() {
  const d = fig('be_cc_semaphore', 'A SEMAPHORE IS A CAR PARK: N SPACES, AND THE BARRIER COUNTS', 300);
  for (let i = 0; i < 5; i++) { d.rect(260 + i * 66, 80, 56, 90, { r: 2, fill: C.paper, stroke: C.line }); if (i < 5) d.rect(268 + i * 66, 100, 40, 54, { r: 8, fill: C.accSoft, stroke: C.acc }); }
  d.line(200, 150, 250, 150, { stroke: C.ink2, sw: 3, single: true }); d.circle(200, 150, 10, { fill: C.acc, stroke: C.acc });
  for (let i = 0; i < 3; i++) d.rect(40 + i * 52, 128, 44, 44, { r: 8, fill: C.card, stroke: C.ink2 });
  d.mono(430, 200, 'permits: 0 of 5 free', { size: 10, color: C.acc });
  d.text(320, 240, 'kitchen API allows 100 concurrent calls; 20 instances × a semaphore of 5 stays inside it', { cls: 'sm' });
  return d.svg();
}

export function be_cc_philosophers() {
  const d = fig('be_cc_philosophers', 'DINING PHILOSOPHERS: EVERYONE HOLDS ONE FORK AND WAITS FOR THE NEXT', 340);
  d.circle(320, 180, 200, { fill: C.card, stroke: C.ink2 });
  for (let i = 0; i < 5; i++) {
    const a = i / 5 * 2 * Math.PI - Math.PI / 2, x = 320 + Math.cos(a) * 140, y = 180 + Math.sin(a) * 130;
    d.person(x, y - 20, 34, { stroke: C.acc, fill: C.accSoft });
    d.circle(320 + Math.cos(a) * 70, 180 + Math.sin(a) * 65, 34, { fill: C.paper, stroke: C.ink2 });
    const b = a + Math.PI / 5, fx = 320 + Math.cos(b) * 80, fy = 180 + Math.sin(b) * 75;
    d.line(fx - Math.cos(b) * 18, fy - Math.sin(b) * 18, fx + Math.cos(b) * 18, fy + Math.sin(b) * 18, { stroke: C.acc, sw: 2, single: true });
  }
  d.text(320, 180, 'deadlock', { cls: 'hand', size: 16 });
  d.text(320, 328, 'break any one Coffman condition: here, number the forks and always pick up the lower first', { cls: 'xs' });
  return d.svg();
}

export function be_cc_cas() {
  const d = fig('be_cc_cas', 'COMPARE-AND-SWAP: "SET 8, BUT ONLY IF IT IS STILL 7"', 300);
  const st = [['read 7', ''], ['compute 8', ''], ['CAS(7 → 8)', 'fails: now 9'], ['read 9', ''], ['CAS(9 → 10)', 'ok']];
  st.forEach(([a, b], i) => { const x = 30 + i * 120; d.box(x, 90, 104, 40, a, { r: 6, cls: 'mono', size: 10, fill: i === 2 ? C.accSoft : (i === 4 ? C.slateSoft : C.card), stroke: i === 2 ? C.acc : C.ink2 }); if (b) d.text(x + 52, 146, b, { cls: 'xs', color: i === 2 ? C.acc : undefined }); if (i < 4) d.arrow(x + 106, 110, x + 118, 110, { stroke: C.gray, hl: 4 }); });
  d.carrow([[322, 160], [250, 200], [150, 200], [92, 136]], { stroke: C.acc, dash: [4, 3] }); d.text(200, 216, 'retry loop', { cls: 'hand', size: 14 });
  d.text(320, 268, 'one CPU instruction (LOCK CMPXCHG on x86); the same idea as a version column in SQL', { cls: 'xs' });
  return d.svg();
}

export function be_cc_aba() {
  const d = fig('be_cc_aba', 'THE ABA PROBLEM: THE VALUE IS BACK, BUT IT IS NOT THE SAME THING', 280);
  const y = lanes(d, ['thread 1', 'thread 2', 'top of stack'], { y: 70, gap: 56, x0: 110, x1: 610, time: false });
  seg(d, 120, y(0), 100, 'sees top = A'); seg(d, 470, y(0), 120, 'CAS(A → B) ok?!', { hot: true });
  seg(d, 230, y(1), 70, 'pop A'); seg(d, 305, y(1), 70, 'pop B'); seg(d, 380, y(1), 80, 'push A');
  seg(d, 120, y(2), 110, 'A → B → C'); seg(d, 305, y(2), 70, 'C'); seg(d, 380, y(2), 80, 'A → C'); seg(d, 470, y(2), 120, 'B (freed!)', { hot: true });
  d.text(320, 250, 'fix with a version counter beside the pointer, or let a garbage collector keep A alive', { cls: 'xs' });
  return d.svg();
}

export function be_cc_multi_instance() {
  const d = fig('be_cc_multi_instance', 'A MUTEX GUARDS ONE PROCESS; FOUR INSTANCES MEANS FOUR UNRELATED MUTEXES', 300);
  [0, 1, 2, 3].forEach((i) => { const x = 40 + i * 120; d.server(x, 60, 80, 90, { label: `app ${i + 1}` }); d.lock(x + 52, 70, 20, { stroke: i < 2 ? C.acc : C.ink2, fill: i < 2 ? C.accSoft : C.card }); d.arrow(x + 40, 170, 300, 214, { stroke: i < 2 ? C.acc : C.line, hl: 5 }); });
  d.db(250, 210, 120, 70, { label: 'balance 100' });
  d.text(520, 240, 'app 1 and app 2 each hold\ntheir own lock and both\nwithdraw 80', { cls: 'xs', vc: true, color: C.acc });
  return d.svg();
}

export function be_cc_conditional_write() {
  const d = fig('be_cc_conditional_write', 'COMPARE-AND-SWAP ON SHARED STORAGE: A CONDITIONAL WRITE', 300);
  d.server(30, 100, 70, 80, { label: 'app 1' }); d.server(30, 200, 70, 80, { label: 'app 2' });
  d.db(450, 120, 140, 110, { label: 'settings.json\nETag "v7"' });
  d.arrow(104, 130, 444, 150, { stroke: C.ink2 }); d.text(270, 124, 'PUT If-Match: "v7" → 200, now "v8"', { cls: 'mono', size: 9.5 });
  d.arrow(104, 230, 444, 200, { stroke: C.acc }); d.text(270, 236, 'PUT If-Match: "v7" → 412', { cls: 'mono', size: 9.5, color: C.acc });
  d.text(320, 286, 'SQL WHERE version = 7, DynamoDB condition expressions, S3 If-Match, etcd transactions', { cls: 'xs' });
  return d.svg();
}

export function be_lock_setnx() {
  const d = fig('be_lock_setnx', 'A REDIS LOCK: SET IF ABSENT, WITH A TOKEN AND AN EXPIRY', 320);
  card(d, 30, 60, 300, ['SET lock:report:9 a7f3 NX PX 30000', '→ OK          (A holds it)', 'SET lock:report:9 c2e1 NX PX 30000', '→ nil         (B must wait)'], { size: 10, hot: [1] });
  card(d, 30, 180, 300, ['-- release only your own lock', 'if redis.call("GET", KEYS[1]) == ARGV[1]', 'then return redis.call("DEL", KEYS[1])', 'else return 0 end'], { size: 9.5 });
  d.lock(440, 80, 60, { stroke: C.acc, fill: C.accSoft }); d.mono(470, 170, 'a7f3', { size: 12, color: C.acc }); d.clock(560, 110, 50, { spin: 30 });
  d.text(500, 230, 'NX: only if absent\nPX: auto-expire, so a crash\ncannot hold it forever', { cls: 'xs', vc: true });
  return d.svg();
}

export function be_lock_wrong_release() {
  const d = fig('be_lock_wrong_release', 'WITHOUT A TOKEN CHECK, A LATE CLIENT DELETES SOMEONE ELSE\'S LOCK', 280);
  const y = lanes(d, ['client A', 'client B', 'client C'], { y: 70, gap: 56, x0: 110, x1: 610, tl: 's' });
  const X = (s) => 120 + s * 10;
  seg(d, X(0), y(0), X(35) - X(0), 'holds lock, slow job'); seg(d, X(35), y(0), 40, 'DEL', { hot: true, size: 8.5 });
  seg(d, X(30), y(1), X(48) - X(30), 'acquires after expiry at 30 s');
  seg(d, X(36), y(2), X(48) - X(36), 'acquires too: B and C overlap', { hot: true, size: 8.5 });
  return d.svg();
}

export function be_lock_gc_pause() {
  const d = fig('be_lock_gc_pause', 'THE PAUSED HOLDER: A 40 S GC PAUSE OUTLIVES A 30 S LEASE', 300);
  const y = lanes(d, ['client A', 'client B', 'storage'], { y: 70, gap: 60, x0: 110, x1: 610, tl: 's' });
  const X = (s) => 120 + s * 8;
  seg(d, X(0), y(0), 30, 'lock', { size: 8.5 }); seg(d, X(4), y(0), X(44) - X(4), 'stop-the-world pause 40 s', { fill: C.paper, dash: [4, 3] }); seg(d, X(44), y(0), 60, 'write', { hot: true, size: 8.5 });
  d.line(X(0), y(0) - 18, X(30), y(0) - 18, { stroke: C.acc, sw: 2, single: true }); d.text(X(15), y(0) - 28, 'lease 30 s', { cls: 'xs', color: C.acc });
  seg(d, X(31), y(1), 30, 'lock', { size: 8.5 }); seg(d, X(36), y(1), 60, 'write', { size: 8.5 });
  seg(d, X(36), y(2), 60, 'B\'s data', { size: 8.5 }); seg(d, X(44), y(2), 120, 'overwritten by A', { hot: true, size: 8.5 });
  d.text(320, 270, 'A cannot know it was paused; from its point of view it still holds the lock', { cls: 'xs' });
  return d.svg();
}

export function be_lock_fencing() {
  const d = fig('be_lock_fencing', 'FENCING TOKENS: STORAGE REJECTS A WRITE CARRYING AN OLDER TOKEN', 300);
  d.lock(60, 70, 40); d.text(80, 140, 'lock service', { cls: 'xs' });
  d.person(220, 70, 32); d.text(220, 120, 'A: token 33', { cls: 'mono', size: 9.5 });
  d.person(220, 170, 32, { stroke: C.acc }); d.text(220, 220, 'B: token 34', { cls: 'mono', size: 9.5, color: C.acc });
  d.db(460, 90, 140, 110, { label: 'storage\nhighest seen: 34' });
  d.arrow(250, 200, 454, 160, { stroke: C.acc }); tick(d, 600, 150, 8);
  d.arrow(250, 90, 454, 120, { stroke: C.ink2, dash: [4, 3] }); d.text(350, 92, 'write(token 33)', { cls: 'mono', size: 9 }); cross(d, 600, 115, 8);
  d.text(320, 270, 'tokens only rise; the storage, not the client, enforces "never older than the last"', { cls: 'xs' });
  return d.svg();
}

export function be_lock_heartbeat() {
  const d = fig('be_lock_heartbeat', 'A WATCHDOG RENEWS A 30 S LEASE EVERY 10 S WHILE THE WORK IS ALIVE', 260);
  const X = (s) => 60 + s * 8;
  d.line(X(0), 120, X(65), 120, { stroke: C.line, sw: 2, single: true });
  [0, 10, 20, 30, 40].forEach((s) => { d.line(X(s), 108, X(s), 132, { stroke: C.acc, sw: 1.6, single: true }); d.mono(X(s), 146, `${s} s`, { size: 8.5 }); d.line(X(s), 100, X(s + 30), 100 - (s / 10) * 0, { stroke: C.accSoft, sw: 6, single: true }); });
  d.text(X(40), 80, 'renewals stop when the process dies', { cls: 'xs' }); d.text(X(70), 120, 'expires at 70 s', { cls: 'xs', a: 'end', color: C.acc });
  d.text(320, 200, 'renewal limits how long a dead holder blocks others; it does not fix a holder that is paused', { cls: 'sm' });
  return d.svg();
}

export function be_lock_redlock() {
  const d = fig('be_lock_redlock', 'REDLOCK: TAKE THE LOCK ON A MAJORITY OF 5 INDEPENDENT REDIS NODES', 320);
  for (let i = 0; i < 5; i++) { const x = 70 + i * 120; d.db(x - 40, 70, 80, 70, { label: `r${i + 1}`, stroke: i < 3 ? C.acc : C.ink2, fill: i < 3 ? C.accFaint : C.card }); if (i < 3) tick(d, x, 160, 7); else cross(d, x, 160, 7, C.gray); }
  d.text(320, 200, '3 of 5 acquired in 50 ms', { cls: 'sm', color: C.acc });
  d.text(320, 236, 'validity = TTL − elapsed − drift = 10,000 − 50 − (10,000 × 0.01 + 2) = 9,848 ms', { cls: 'mono', size: 10 });
  d.text(320, 280, 'safe only if processes do not pause and clocks do not jump; no fencing token is produced', { cls: 'xs' });
  return d.svg();
}

export function be_lock_clock_jump() {
  const d = fig('be_lock_clock_jump', 'ONE CLOCK JUMPS FORWARD, ONE LOCK EXPIRES EARLY, TWO CLIENTS HOLD A "MAJORITY"', 300);
  for (let i = 0; i < 5; i++) { const x = 70 + i * 120; d.db(x - 35, 70, 70, 60, { label: `r${i + 1}`, stroke: i === 2 ? C.acc : C.ink2 }); d.clock(x, 170, 36, { t: i === 2 ? 0.6 : 0.1, hand: i === 2 ? C.acc : C.ink2 }); }
  d.text(320, 220, 'A holds r1, r2, r3. r3\'s clock jumps and its key expires. B takes r3, r4, r5.', { cls: 'sm' });
  d.text(320, 250, 'two clients each believe they hold a majority', { cls: 'sm', color: C.acc });
  d.text(320, 282, 'the Kleppmann and antirez exchange of 2016 is about exactly these timing assumptions', { cls: 'xs' });
  return d.svg();
}

export function be_lock_zk() {
  const d = fig('be_lock_zk', 'ZOOKEEPER-STYLE LOCK: EPHEMERAL SEQUENTIAL NODES, EACH WATCHING THE ONE BEFORE', 300);
  d.text(80, 60, '/locks/report-9', { cls: 'mono', size: 10, a: 'start' });
  ['lock-0000000041', 'lock-0000000042', 'lock-0000000043'].forEach((s, i) => { d.box(100, 80 + i * 56, 170, 34, s, { r: 4, cls: 'mono', size: 9.5, fill: i === 0 ? C.accSoft : C.card, stroke: i === 0 ? C.acc : C.ink2 }); if (i) d.carrow([[275, 97 + i * 56], [310, 97 + (i - 0.5) * 56], [275, 97 + (i - 1) * 56]], { stroke: C.gray, dash: [3, 3] }); });
  d.text(330, 110, 'smallest number holds the lock', { cls: 'xs', a: 'start', color: C.acc }); d.text(330, 165, 'each waiter watches only its predecessor', { cls: 'xs', a: 'start' });
  d.text(330, 220, 'session dies → node vanishes → next one wakes', { cls: 'xs', a: 'start' });
  d.text(320, 274, 'consensus-backed (ZAB, Raft in etcd), and the zxid or revision doubles as a fencing token', { cls: 'xs' });
  return d.svg();
}

export function be_lock_decide() {
  const d = fig('be_lock_decide', 'BEFORE REACHING FOR A DISTRIBUTED LOCK', 340);
  const q = [['Can the operation be idempotent?', 'use idempotency keys'], ['Can a constraint enforce it?', 'unique index, CHECK'], ['Can one writer own the key?', 'partition by key (Kafka)'], ['Is the data in one database?', 'row lock or advisory lock'], ['Only efficiency at stake?', 'Redis lock is fine'], ['Correctness at stake?', 'consensus lease + fencing']];
  q.forEach(([a, b], i) => { const y = 50 + i * 46; d.box(40, y, 280, 32, a, { r: 16, fill: C.card, size: 10.5 }); d.arrow(324, y + 16, 380, y + 16, { stroke: i === 5 ? C.acc : C.gray, hl: 5 }); d.text(390, y + 16, b, { cls: 'sm', a: 'start', color: i === 5 ? C.acc : undefined }); if (i < 5) d.text(180, y + 40, 'no ↓', { cls: 'xs' }); });
  return d.svg();
}

export function be_bp_where() {
  const d = fig('be_bp_where', '50,000 REQUESTS/S IN, 10,000/S PROCESSED: WHERE DO THE OTHER 40,000 GO?', 320);
  d.poly([[60, 60], [300, 60], [210, 170], [150, 170]], { fill: C.accFaint, stroke: C.acc });
  for (let i = 0; i < 14; i++) d.travel([[70 + i * 16, 30], [180, 160]], { r: 3, at: [i / 14, Math.min(1, i / 14 + 0.3)] });
  d.arrow(180, 172, 180, 220, { stroke: C.ink2 }); d.gear(180, 245, 20, { spin: 4 }); d.text(180, 282, '10,000/s', { cls: 'mono', size: 10 });
  d.ram(380, 110, 220, 50, { chips: 6, chip: (i) => (i < 5 ? C.accSoft : C.paper) });
  d.during([0, 1], (g) => g.text(490, 190, '40,000/s × 2 KB = 80 MB/s', { cls: 'mono', size: 10, color: C.acc }));
  d.text(490, 220, 'a 4 GB heap is full in 50 s', { cls: 'sm' });
  d.text(490, 260, 'then latency climbs, GC thrashes,\nthe process dies, and all\nbuffered work is lost', { cls: 'xs', vc: true });
  return d.svg();
}

export function be_bp_bounded() {
  const d = fig('be_bp_bounded', 'AN UNBOUNDED QUEUE HIDES OVERLOAD; A BOUNDED ONE REPORTS IT', 300);
  panel(d, 20, 40, 290, 230, 'unbounded', true); panel(d, 330, 40, 290, 230, 'bounded at 1,000');
  for (let i = 0; i < 18; i++) d.during([i / 22, 1], (g) => g.envelope(40 + (i % 6) * 42, 210 - Math.floor(i / 6) * 30, 34, 22, { stroke: C.acc, fill: C.accSoft }));
  d.text(165, 100, 'grows until the process dies', { cls: 'xs', color: C.acc });
  for (let i = 0; i < 12; i++) d.envelope(350 + (i % 6) * 42, 210 - Math.floor(i / 6) * 30, 34, 22);
  d.line(340, 140, 610, 140, { stroke: C.ink2, dash: [6, 4], single: true }); d.text(475, 128, 'limit', { cls: 'xs' });
  d.arrow(475, 110, 475, 70, { stroke: C.acc }); d.text(540, 82, '503 / block / drop', { cls: 'mono', size: 9, color: C.acc });
  return d.svg();
}

export function be_bp_tcp() {
  const d = fig('be_bp_tcp', 'TCP BACKPRESSURE: A FULL RECEIVE BUFFER SHRINKS THE WINDOW TO ZERO', 300);
  d.laptop(30, 100, 90); d.text(75, 190, 'fast sender', { cls: 'xs' });
  d.server(520, 90, 80, 100, { label: 'slow reader' });
  d.rect(380, 110, 120, 60, { r: 4, fill: C.paper }); for (let i = 0; i < 6; i++) d.rect(386 + i * 19, 116, 16, 48, { r: 1, fill: C.accSoft, stroke: C.acc }); d.text(440, 186, 'receive buffer full', { cls: 'xs', color: C.acc });
  d.arrow(130, 130, 374, 130, { stroke: C.gray, dash: [4, 3] }); d.arrow(374, 156, 130, 156, { stroke: C.acc }); d.text(250, 172, 'ACK, window = 0', { cls: 'mono', size: 9.5, color: C.acc });
  d.text(320, 250, 'the sender stops; its own send buffer fills; its write() blocks or returns EAGAIN', { cls: 'sm' });
  d.text(320, 278, 'pressure travels upstream hop by hop, which is backpressure working as designed', { cls: 'xs' });
  return d.svg();
}

export function be_bp_reactive() {
  const d = fig('be_bp_reactive', 'PULL-BASED FLOW CONTROL: THE CONSUMER GRANTS CREDITS', 280);
  d.server(40, 90, 80, 90, { label: 'producer' }); d.gear(540, 135, 26, { spin: 6 }); d.text(540, 180, 'consumer', { cls: 'xs' });
  d.arrow(510, 110, 124, 110, { stroke: C.acc, dash: [4, 3] }); d.text(320, 98, 'request(16)', { cls: 'mono', size: 10, color: C.acc });
  for (let i = 0; i < 4; i++) d.travel([[124, 160], [510, 160]], { token: 'packet', at: [i * 0.2, i * 0.2 + 0.4] });
  d.text(320, 186, 'at most 16 items, then wait for more credit', { cls: 'xs' });
  d.text(320, 240, 'Reactive Streams, gRPC and HTTP/2 flow-control windows, Kafka fetch sizes all work this way', { cls: 'xs' });
  return d.svg();
}

export function be_bp_shedding() {
  const d = fig('be_bp_shedding', 'ADMISSION CONTROL: TURN WORK AWAY AT THE DOOR WHILE THERE IS TIME TO SAY SO', 320);
  d.rect(360, 70, 250, 170, { r: 6, fill: C.paper }); d.text(485, 86, 'in progress (limit 200)', { cls: 'xs' });
  for (let i = 0; i < 16; i++) d.dot(380 + (i % 8) * 28, 120 + Math.floor(i / 8) * 40, 6, C.ink2);
  d.person(320, 140, 40, { stroke: C.acc }); d.text(320, 200, 'admission', { cls: 'xs', color: C.acc });
  crowd(d, 240, 150, 5, { s: 22, gap: 40, dir: -1 });
  d.arrow(300, 210, 240, 260, { stroke: C.acc }); d.box(150, 256, 110, 28, '503 Retry-After', { r: 5, cls: 'mono', size: 9, fill: C.accSoft, stroke: C.acc });
  d.text(485, 270, 'shed the cheapest-to-lose first:\nanalytics, then browsing, never checkout', { cls: 'xs', vc: true });
  return d.svg();
}

export function be_bp_goodput() {
  const d = fig('be_bp_goodput', 'GOODPUT AGAINST OFFERED LOAD, WITH AND WITHOUT SHEDDING (ILLUSTRATIVE)', 300);
  const M = d.axes(80, 50, 460, 190, { xmin: 0, xmax: 3, ymin: 0, ymax: 1.1, xl: 'offered load ÷ capacity', yl: 'useful work done' });
  d.fn((x) => (x <= 1 ? x : Math.max(0.05, 1 - (x - 1) * 0.8)), 0, 3, M);
  d.fn((x) => Math.min(x, 0.95), 0, 3, M, { stroke: C.slate, dash: [5, 4] });
  d.text(M.X(2.2), M.Y(0.18), 'no shedding: timeouts waste the work', { cls: 'xs', color: C.acc });
  d.text(M.X(2.2), M.Y(1.02), 'shedding: capacity stays useful', { cls: 'xs' });
  return d.svg();
}

export function be_leak_sources() {
  const d = fig('be_leak_sources', 'WHERE BACKEND MEMORY QUIETLY GOES', 340);
  const it = [['unbounded cache', 'a Map that only grows'], ['global registry', 'per-user entries never removed'], ['event listeners', 'added per request, never removed'], ['closures', 'capture a large request object'], ['timers', 'setInterval never cleared'], ['buffers and streams', 'opened, never consumed or closed']];
  it.forEach(([t, s], i) => { const x = 30 + (i % 3) * 200, y = 50 + Math.floor(i / 3) * 140; d.rect(x, y, 180, 120, { r: 8, fill: i === 0 ? C.accFaint : C.paper, stroke: i === 0 ? C.acc : C.line }); d.text(x + 90, y + 20, t, { cls: 'ttl', size: 11 }); d.text(x + 90, y + 100, s, { cls: 'xs' }); });
  for (let k = 0; k < 6; k++) d.rect(50 + k * 22, 82 - k * 0, 18, 10 + k * 4, { r: 1, fill: C.accSoft, stroke: C.acc });
  crowd(d, 270, 76, 4, { s: 14, gap: 18 }); d.text(320, 116, '+1 per user', { cls: 'mono', size: 8.5 });
  for (let k = 0; k < 4; k++) { d.circle(460 + k * 22, 90, 12, { fill: C.card, stroke: C.ink2 }); d.line(460 + k * 22, 84, 460 + k * 22, 70, { stroke: C.ink2, single: true }); }
  d.doc(80, 216, 40, 50); d.circle(150, 240, 24, { stroke: C.acc });
  d.clock(320, 240, 44, { spin: 3 });
  pipe(d, 450, 590, 240, 18, true);
  return d.svg();
}

export function be_leak_sawtooth() {
  const d = fig('be_leak_sawtooth', 'HEALTHY HEAP VERSUS LEAKING HEAP (ILLUSTRATIVE)', 300);
  const M = d.axes(70, 50, 500, 190, { xmin: 0, xmax: 60, ymin: 0, ymax: 4, xl: 'minutes', yl: 'heap GB' });
  d.fn((t) => 0.8 + 0.6 * ((t % 5) / 5), 0, 60, M, { stroke: C.slate, n: 300 });
  d.fn((t) => 0.8 + t * 0.045 + 0.6 * ((t % (5 - t / 15)) / (5 - t / 15)), 0, 60, M, { n: 400 });
  d.text(M.X(45), M.Y(3.5), 'floor rises; GC runs more often\nand frees less each time', { cls: 'xs', vc: true, color: C.acc });
  d.text(M.X(45), M.Y(0.4), 'healthy sawtooth', { cls: 'xs' });
  return d.svg();
}

export function be_leak_fd() {
  const d = fig('be_leak_fd', 'ONE LEAKED SOCKET PER FAILED REQUEST: 5 PER SECOND REACHES 65,536 IN 3.6 HOURS', 300);
  const M = d.axes(80, 50, 460, 180, { xmin: 0, xmax: 4, ymin: 0, ymax: 70000, xl: 'hours', yl: 'open fds' });
  d.fn((h) => Math.min(65536, 300 + 18000 * h), 0, 4, M);
  d.line(M.X(0), M.Y(65536), M.X(4), M.Y(65536), { stroke: C.gray, dash: [3, 3], single: true }); d.text(M.X(0.1), M.Y(65536) - 10, 'ulimit -n 65536', { cls: 'mono', size: 9, a: 'start' });
  d.text(M.X(3.7), M.Y(50000), 'EMFILE: too many\nopen files', { cls: 'mono', size: 9, vc: true, color: C.acc });
  d.text(320, 286, 'ls /proc/<pid>/fd | wc -l, or lsof -p <pid>, shows the count climbing', { cls: 'xs' });
  return d.svg();
}

export function be_leak_heap_diff() {
  const d = fig('be_leak_heap_diff', 'FIND A LEAK BY COMPARING TWO HEAP SNAPSHOTS', 300);
  d.doc(40, 70, 90, 120); d.text(85, 206, 'snapshot at 10:00', { cls: 'xs' });
  d.doc(170, 60, 100, 140, { stroke: C.acc }); d.text(220, 216, 'snapshot at 10:30', { cls: 'xs', color: C.acc });
  sheet(d, 320, 60, [['retained by', 170], ['growth', 110]], [['sessionCache (Map)', '+412 MB'], ['EventEmitter listeners', '+18 MB'], ['Buffer pool', '+2 MB']], { hot: [0], size: 9.5, rh: 28 });
  d.text(320, 250, 'Chrome DevTools or heapdump for Node, pprof for Go, jcmd and Eclipse MAT for the JVM', { cls: 'xs' });
  return d.svg();
}

export function be_node_phases() {
  const d = fig('be_node_phases', 'THE NODE.JS EVENT LOOP: SIX PHASES, WITH MICROTASKS DRAINED BETWEEN CALLBACKS', 340);
  const ph = ['timers', 'pending callbacks', 'idle, prepare', 'poll (I/O)', 'check (setImmediate)', 'close callbacks'];
  ph.forEach((s, i) => { const a = i / 6 * 2 * Math.PI - Math.PI / 2, x = 320 + Math.cos(a) * 160, y = 180 + Math.sin(a) * 120; d.box(x - 70, y - 16, 140, 32, s, { r: 16, fill: i === 3 ? C.accSoft : C.card, stroke: i === 3 ? C.acc : C.ink2, size: 10 }); });
  d.travel('M320,60 A160,120 0 1 1 319.9,60', { r: 5, dur: 6 });
  d.rect(250, 150, 140, 60, { r: 8, fill: C.accFaint, stroke: C.acc }); d.text(320, 166, 'microtasks', { cls: 'ttl', size: 11, color: C.acc }); d.text(320, 190, 'nextTick, then promises', { cls: 'xs' });
  return d.svg();
}

export function be_node_order() {
  const d = fig('be_node_order', 'WHAT PRINTS FIRST?', 300);
  card(d, 30, 50, 280, ["setTimeout(() => log('timeout'), 0)", "setImmediate(() => log('immediate'))", "Promise.resolve().then(() => log('promise'))", "process.nextTick(() => log('tick'))", "log('sync')"], { size: 9.5 });
  ['sync', 'tick', 'promise', 'timeout or immediate', 'the other one'].forEach((s, i) => { d.circle(380, 70 + i * 34, 22, { fill: i < 3 ? C.accSoft : C.card, stroke: i < 3 ? C.acc : C.ink2 }); d.mono(380, 70 + i * 34, i + 1, { size: 9 }); d.text(400, 70 + i * 34, s, { cls: 'mono', size: 10, a: 'start' }); });
  d.text(320, 266, 'from the main module, timeout versus immediate depends on timing; inside an I/O callback, immediate wins', { cls: 'xs' });
  return d.svg();
}

export function be_node_threadpool() {
  const d = fig('be_node_threadpool', 'LIBUV\'S THREAD POOL HAS 4 THREADS BY DEFAULT; THE FIFTH HASH WAITS', 300);
  d.circle(120, 150, 130, { stroke: C.ink2 }); d.text(120, 150, 'JS thread', { cls: 'sm' });
  [0, 1, 2, 3].forEach((i) => { d.gear(330 + (i % 2) * 70, 100 + Math.floor(i / 2) * 70, 20, { spin: 2, stroke: C.acc }); });
  d.text(365, 230, 'pbkdf2, fs, dns.lookup, zlib', { cls: 'xs' });
  crowd(d, 500, 120, 3, { s: 22, gap: 30, hot: () => true }); d.text(530, 170, 'queued', { cls: 'xs', color: C.acc });
  d.text(320, 280, '4 threads × (1 ÷ 0.1 s per hash) = 40 hashes/s; raise UV_THREADPOOL_SIZE or move hashing out', { cls: 'xs' });
  return d.svg();
}

export function be_node_streams() {
  const d = fig('be_node_streams', 'STREAM BACKPRESSURE: write() RETURNS false, SO PAUSE UNTIL "drain"', 300);
  d.db(30, 100, 80, 80, { label: 'file\n2 GB' });
  pipe(d, 120, 300, 140, 22); d.text(210, 120, 'readable', { cls: 'xs' });
  d.rect(310, 110, 100, 60, { r: 4, fill: C.paper }); d.fillRect(312, 112, 96, 56, C.accSoft); d.text(360, 186, 'highWaterMark 64 KB', { cls: 'mono', size: 8.5 });
  pipe(d, 420, 520, 140, 22); d.cloud(525, 105, 90, 60, { label: 'slow client' });
  d.text(320, 236, 'pipeline(readable, writable) handles pause and resume for you', { cls: 'sm' });
  d.text(320, 264, 'ignoring the return value buffers the whole 2 GB in memory', { cls: 'xs', color: C.acc });
  return d.svg();
}

export function be_node_scaling() {
  const d = fig('be_node_scaling', 'USING ALL CORES IN NODE: PROCESSES FOR REQUESTS, WORKER THREADS FOR CPU WORK', 300);
  panel(d, 20, 40, 290, 230, 'cluster or one process per core'); panel(d, 330, 40, 290, 230, 'worker_threads', true);
  [0, 1, 2, 3].forEach((i) => { d.circle(60 + i * 66, 140, 46, { stroke: C.ink2 }); d.cpu(48 + i * 66, 190, 24); });
  d.text(165, 250, 'separate heaps; share a port', { cls: 'xs' });
  d.circle(410, 140, 60, { stroke: C.ink2 }); d.text(410, 140, 'loop', { cls: 'xs' });
  [0, 1, 2].forEach((i) => d.gear(500 + (i % 2) * 50, 100 + i * 40, 16, { spin: 3, stroke: C.acc }));
  d.text(475, 250, 'message passing, SharedArrayBuffer', { cls: 'xs' });
  return d.svg();
}

export function be_go_gmp() {
  const d = fig('be_go_gmp', 'GO\'S SCHEDULER: G GOROUTINES RUN ON M THREADS THROUGH P PROCESSORS', 340);
  [0, 1, 2, 3].forEach((p) => { const x = 60 + p * 140; d.box(x, 150, 90, 36, `P${p}`, { r: 6, fill: C.accSoft, stroke: C.acc, cls: 'ttl' }); d.box(x, 210, 90, 34, `M${p} (thread)`, { r: 6, fill: C.card, size: 9.5 }); d.cpu(x + 30, 270, 30); for (let g = 0; g < (p === 3 ? 0 : 3 - (p % 2)); g++) d.circle(x + 20 + g * 26, 110, 20, { fill: C.card, stroke: C.ink2 }); });
  d.text(130, 76, 'local run queues of goroutines', { cls: 'xs' });
  d.carrow([[200, 110], [400, 70], [480, 110]], { stroke: C.acc, dash: [4, 3] }); d.text(400, 60, 'P3 steals half of P1\'s queue', { cls: 'xs', color: C.acc });
  d.text(320, 330, 'P = GOMAXPROCS (cores); a goroutine blocked in a syscall releases its P to another M', { cls: 'xs' });
  return d.svg();
}

export function be_go_channels() {
  const d = fig('be_go_channels', 'CHANNELS, SELECT AND CONTEXT: A WORKER THAT STOPS WHEN TOLD', 300);
  card(d, 30, 50, 300, ['for {', '  select {', '  case job := <-jobs:', '    handle(ctx, job)', '  case <-ctx.Done():', '    return  // deadline or cancel', '  }', '}'], { size: 9.5, hot: [4, 5] });
  pipe(d, 370, 600, 90, 20); for (let i = 0; i < 3; i++) d.travel([[370, 90], [600, 90]], { token: 'packet', at: [i * 0.3, i * 0.3 + 0.4] }); d.text(485, 70, 'jobs channel', { cls: 'xs' });
  d.clock(485, 170, 50, { spin: 4 }); d.text(485, 214, 'ctx deadline 300 ms', { cls: 'mono', size: 9 });
  d.text(320, 280, 'every goroutine needs a way to end: a closed channel, a cancelled context, or a finished job', { cls: 'xs' });
  return d.svg();
}

export function be_go_leak() {
  const d = fig('be_go_leak', 'A GOROUTINE LEAK: BLOCKED FOREVER ON A SEND NOBODY RECEIVES', 300);
  card(d, 30, 50, 280, ['func fetch(ctx) error {', '  ch := make(chan result)', '  go func() { ch <- slowCall() }()', '  select {', '  case r := <-ch: return r.err', '  case <-ctx.Done(): return ctx.Err()', '  }', '}'], { size: 9, hot: [1, 2] });
  const M = d.axes(360, 60, 230, 150, { xmin: 0, xmax: 60, ymin: 0, ymax: 30000, xl: 'min', yl: 'goroutines' });
  d.fn((t) => 200 + t * 480, 0, 60, M);
  d.text(475, 250, 'fix: make(chan result, 1)\nso the late send never blocks', { cls: 'mono', size: 9, vc: true, color: C.acc });
  return d.svg();
}

export function be_go_gc() {
  const d = fig('be_go_gc', 'GO\'S GC TARGET: WITH GOGC=100, COLLECT WHEN THE HEAP DOUBLES THE LIVE SET', 300);
  const M = d.axes(70, 50, 480, 180, { xmin: 0, xmax: 10, ymin: 0, ymax: 1000, xl: 'seconds', yl: 'heap MB' });
  d.fn((t) => 400 + 400 * ((t % 2.5) / 2.5), 0, 10, M, { n: 300 });
  d.line(M.X(0), M.Y(800), M.X(10), M.Y(800), { stroke: C.gray, dash: [3, 3], single: true }); d.text(M.X(10), M.Y(800) - 10, 'target 800 MB', { cls: 'xs', a: 'end' });
  d.line(M.X(0), M.Y(400), M.X(10), M.Y(400), { stroke: C.slate, dash: [3, 3], single: true }); d.text(M.X(10), M.Y(400) + 12, 'live 400 MB', { cls: 'xs', a: 'end' });
  d.text(320, 284, 'GOMEMLIMIT adds a soft ceiling so the GC works harder near a container\'s memory limit', { cls: 'xs' });
  return d.svg();
}

export function be_rt_compare() {
  const d = fig('be_rt_compare', 'FOUR RUNTIMES, FOUR ANSWERS TO "HOW DO 1,000 REQUESTS SHARE 8 CORES?"', 340);
  const r = [['Node.js', 'one JS thread + event loop; libuv pool for blocking work; processes for cores'], ['Go', 'goroutines multiplexed onto GOMAXPROCS threads; blocking looks synchronous'], ['JVM', 'platform threads in pools; virtual threads (Java 21) park cheaply on I/O'], ['Python', 'GIL: one thread runs bytecode at a time; asyncio or processes for scale']];
  r.forEach(([t, s], i) => { const y = 50 + i * 70; d.rect(30, y, 580, 56, { r: 8, fill: C.paper, stroke: C.line }); d.text(50, y + 20, t, { cls: 'ttl', a: 'start' }); d.text(50, y + 40, s, { cls: 'xs', a: 'start' }); });
  d.circle(560, 78, 30, { stroke: C.ink2 }); for (let i = 0; i < 4; i++) d.dot(540 + i * 13, 148, 4, C.acc); d.cpu(546, 196, 26); d.lock(548, 254, 22, { stroke: C.acc });
  return d.svg();
}

export function be_cc_e2e() {
  const d = fig('be_cc_e2e', 'INSIDE ONE INSTANCE DURING POST /orders', 340);
  const st = [['accept', 'event loop / goroutine', 0], ['validate', 'CPU, 0.3 ms', 1], ['pool borrow', 'semaphore of 10', 2], ['DB txn', 'awaits 18.55 ms', 3], ['enqueue', 'bounded queue', 4], ['respond', '201', 5]];
  st.forEach(([t, s], i) => { const x = 60 + i * 104; d.circle(x, 140, 50, { fill: i === 3 ? C.accSoft : C.card, stroke: i === 3 ? C.acc : C.ink2 }); d.text(x, 140, t, { cls: 'xs' }); d.text(x, 182, s, { cls: 'xs' }); if (i < 5) d.arrow(x + 27, 140, x + 77, 140, { stroke: C.gray, hl: 5 }); });
  d.travel([[60, 140], [580, 140]], { r: 5, dur: 5 });
  d.text(320, 240, 'while this request awaits the database, the same thread serves dozens of others', { cls: 'sm' });
  d.text(320, 270, 'the only lock is the row lock inside PostgreSQL; the pool and queue are the bounded resources', { cls: 'xs' });
  return d.svg();
}

export function be_cc_failures() {
  const d = fig('be_cc_failures', 'THREE INCIDENTS FROM THIS UNIT', 340);
  [['CPU 100%, latency 10×', 'a regex or JSON.parse on a 5 MB body blocking the loop', 'profile; move to workers; cap body size'], ['memory grows, CPU normal', 'per-user Map never evicted; GC runs more and frees less', 'heap diff; bound it with LRU'], ['report sent twice', 'lock lease expired during a pause', 'fencing token or idempotent sends']].forEach(([t, s, f], i) => { const y = 50 + i * 94; d.rect(30, y, 580, 80, { r: 8, fill: i === 0 ? C.accFaint : C.paper, stroke: i === 0 ? C.acc : C.line }); d.text(50, y + 20, t, { cls: 'ttl', a: 'start', color: i === 0 ? C.acc : undefined }); d.text(50, y + 42, s, { cls: 'sm', a: 'start' }); d.text(50, y + 62, f, { cls: 'xs', a: 'start' }); });
  return d.svg();
}

export function be_cc_components() {
  const d = fig('be_cc_components', 'THE UNIT ON ONE PAGE', 340);
  d.circle(130, 120, 120, { stroke: C.ink2 }); d.travel('M130,60 A60,60 0 1 1 129.9,60', { r: 4, dur: 3 }); d.text(130, 200, 'runtimes: threads,\nloops, goroutines', { cls: 'xs', vc: true });
  d.key(260, 110, 50, { stroke: C.acc }); d.text(285, 200, 'races: mutexes,\natomics, CAS', { cls: 'xs', vc: true });
  d.lock(420, 80, 50, { stroke: C.acc, fill: C.accSoft }); d.mono(445, 160, 'token 34', { size: 9.5, color: C.acc }); d.text(445, 200, 'distributed locks:\nleases, fencing', { cls: 'xs', vc: true });
  d.poly([[530, 70], [610, 70], [585, 140], [555, 140]], { fill: C.accFaint, stroke: C.acc }); d.text(570, 200, 'backpressure:\nbound and shed', { cls: 'xs', vc: true });
  d.text(320, 270, 'every shared thing needs one owner at a time, and every buffer needs a limit', { cls: 'sm' });
  d.text(320, 300, 'memory and descriptors leak where nothing takes ownership of letting go', { cls: 'xs' });
  return d.svg();
}
