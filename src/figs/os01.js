import { C } from '../lib/draw.js';
import { canvas, cards, ledger, flow, lanes, map, cover } from '../lib/fundamentals-figures.js';
import numbers from '../data/fundamentals/numbers.json' with { type: 'json' };
const n = numbers.os;
const scene = (id, kicker, rows, focus = 0) => ledger(id, kicker, ['State', 'Mechanism', 'Result'], rows, focus);
export function where_fund_os(stage = 99) { return map('where_fund_os', ['OS fundamentals', 'Processes', 'Fork, exec and threads', 'Synchronization', 'Deadlocks', 'CPU scheduling', 'Paging and memory', 'Copy-on-write', 'Filesystems', 'I/O and IPC', 'Protection and Linux', 'Complete server trace'], stage); }
export function cover_fund_os() { return cover('cover_fund_os', ['Operating', 'systems'], ['A hand-drawn field guide to processes, memory, files and I/O'], [['application', 'program and server'], ['system calls', 'the controlled boundary'], ['kernel', 'resource decisions'], ['hardware', 'cores, memory and devices']], 3); }
export function os_boundary() { return flow('os_boundary', 'THE RUNNING SERVER CROSSES FOUR LAYERS', ['application', 'system call', 'kernel subsystem', 'hardware'], ['intent in user space', 'checked entry', 'policy and state', 'device or core'], 1); }
export function os_kernel_types() { return cards('os_kernel_types', 'ISOLATION COSTS A CROSSING', [['monolithic', 'many services share kernel space'], ['modular', 'loadable kernel components'], ['microkernel', 'more services outside the kernel'], ['hybrid', 'selected mixed boundaries']], 0); }
export function os_syscall_entry() { return lanes('os_syscall_entry', 'A FUNCTION CALL BECOMES A CONTROLLED ENTRY', 'application', 'kernel', [[1, 'arguments in registers'], [1, 'syscall number'], [-1, 'validate and perform'], [-1, 'return value']], 'mode changes at the boundary'); }
export function os_event_kinds() { return cards('os_event_kinds', 'SAME CPU, DIFFERENT REASONS TO ENTER', [['interrupt', 'external and asynchronous'], ['exception', 'instruction caused it'], ['trap', 'software requests entry'], ['return', 'restore user execution']], 2); }
export function os_process_image() { return flow('os_process_image', 'ONE PROCESS OWNS SEPARATE MEMORY REGIONS', ['text', 'data + BSS', 'heap grows up', 'stack grows down'], ['instructions', 'globals and zero-fill', 'dynamic allocation', 'calls and locals'], 2); }
export function os_pcb() { return cards('os_pcb', 'THE PCB IS THE RESUME RECORD', [['identity', 'PID and security context'], ['execution', 'PC, registers and stack pointer'], ['scheduling', 'state, priority and queue'], ['resources', 'memory map and open files']], 1); }
export function os_states() {
  const d = canvas('os_states', 'EVENTS MOVE A TASK BETWEEN QUEUES', 335);
  d.box(25, 92, 115, 42, 'new', { fill: C.card });
  d.box(238, 92, 130, 42, 'ready', { fill: C.card });
  d.box(493, 92, 120, 42, 'running', { fill: C.accSoft, stroke: C.acc });
  d.box(238, 248, 130, 42, 'blocked', { fill: C.card });
  d.box(493, 248, 120, 42, 'terminated', { fill: C.card });
  d.arrow(145, 113, 233, 113, { stroke: C.gray });
  d.text(188, 95, 'admit', { cls: 'sm' });
  d.arrow(373, 113, 488, 113, { stroke: C.acc });
  d.text(429, 95, 'dispatch', { cls: 'sm' });
  d.carrow([[550, 86], [550, 50], [303, 50], [303, 86]], { stroke: C.gray });
  d.text(420, 34, 'preempt', { cls: 'sm' });
  d.arrow(505, 139, 368, 241, { stroke: C.gray });
  d.text(467, 193, 'wait for event', { cls: 'sm' });
  d.arrow(287, 243, 287, 139, { stroke: C.gray });
  d.text(212, 191, 'event ready', { cls: 'sm' });
  d.arrow(553, 139, 553, 243, { stroke: C.gray });
  d.text(596, 192, 'exit', { cls: 'sm' });
  return d.svg();
}
export function os_context_switch() { return ledger('os_context_switch', 'SAVE ONE CONTEXT BEFORE RESUMING ANOTHER', ['Step', 'Kernel action', 'Context'], [['save', 'registers and PC', 'A can resume later'], ['select', 'choose ready B', 'scheduler policy'], ['install', 'mapping and registers', 'B address space'], ['resume', 'return to B execution', 'B runs on the core']], 0); }
export function os_fork_cow() { return flow('os_fork_cow', 'FORK SHARES PAGES UNTIL A WRITE', ['parent pages', 'read-only shared map', 'child writes', 'private copied page'], ['one address space', 'two page tables', 'page fault', 'one writer owns'], 3); }
export function os_exec_image() { return flow('os_exec_image', 'EXEC REPLACES THE PROCESS IMAGE', ['shell', 'forked child', 'exec loader', 'new program'], ['parent continues', 'same PID', 'map text and stack', 'new entry point'], 2); }
export function os_wait_reap() { return scene('os_wait_reap', 'EXIT STATUS NEEDS A COLLECTOR', [['child exits', 'status stored in process record', 'zombie'], ['parent calls wait', 'status copied and record freed', 'reaped'], ['parent exits first', 'child is reparented', 'orphan'], ['SIGCHLD arrives', 'parent can collect', 'collection still needed']], 1); }
export function os_threads() { return cards('os_threads', 'THREADS SHARE THE PROCESS MAP', [['private', 'stack, registers and PC'], ['shared', 'code, heap and globals'], ['cheap path', 'no separate address map'], ['risk', 'shared state needs ordering']], 1); }
export function os_thread_models() { return flow('os_thread_models', 'THREAD VISIBILITY DETERMINES PARALLELISM', ['many to one', 'one to one', 'many to many', 'two cores'], ['one kernel entity', 'kernel schedules each', 'runtime maps work', 'simultaneous progress'], 1); }
export function os_concurrency_parallel() { return cards('os_concurrency_parallel', 'OVERLAP IS NOT SIMULTANEOUS EXECUTION', [['concurrency', 'tasks take turns'], ['parallelism', 'cores execute together'], ['one core', 'concurrency without parallelism'], ['two cores', 'parallel work is possible']], 2); }
export function os_race_counter() { return scene('os_race_counter', 'TWO READS CAN LOSE ONE UPDATE', [['initial', 'counter = 10', 'shared'], ['thread A', 'read 10, add 1', 'private register'], ['thread B', 'read 10, add 1', 'private register'], ['writes', '11 then 11', `expected ${n.counter_correct}, got ${n.counter_lost}`]], 3); }
export function os_critical_section() { return cards('os_critical_section', 'A CORRECT CRITICAL SECTION HAS THREE TESTS', [['mutual exclusion', 'at most one enters'], ['progress', 'a choice is eventually made'], ['bounded waiting', 'a waiter is not bypassed forever'], ['atomicity', 'the protected action is indivisible']], 0); }
export function os_atomic_ops() { return flow('os_atomic_ops', 'CAS MAKES THE EXPECTATION EXPLICIT', ['load old', 'compare expected', 'store desired', 'retry on change'], ['read shared word', 'check still 10', 'publish 11', 'another writer won'], 1); }
export function os_mutex() { return lanes('os_mutex', 'A MUTEX HAS AN OWNER', 'thread', 'lock', [[1, 'lock'], [1, 'critical work'], [-1, 'unlock'], [-1, 'another waiter']], 'sleeping avoids wasting a core under contention'); }
export function os_semaphore() { return ledger('os_semaphore', 'PERMITS COUNT A RESOURCE', ['Operation', 'Permit count', 'Meaning'], [['initial', '2', 'two slots'], ['wait', '1', 'one slot remains'], ['wait', '0', 'next caller blocks'], ['signal', '1', 'one waiter may run']], 2); }
export function os_condition() { return flow('os_condition', 'A CONDITION VARIABLE WAITS ON A PREDICATE', ['lock', 'check queue empty', 'wait releases lock', 'signal and retry'], ['protect state', 'predicate false', 'sleep atomically', 'loop rechecks'], 3); }
export function os_monitor() { return cards('os_monitor', 'A MONITOR PACKAGES STATE AND ACCESS', [['state', 'queue and counters'], ['mutex', 'one active method'], ['condition', 'wait for predicate'], ['method', 'operation on protected state']], 1); }
export function os_sync_classics() { return flow('os_sync_classics', 'CLASSIC PROBLEMS EXPOSE DIFFERENT FAILURES', ['producer-consumer', 'readers-writers', 'dining philosophers', 'policy'], ['bounded slots', 'starvation choice', 'resource order', 'the guarantee'], 2); }
export function os_deadlock() {
  const d = canvas('os_deadlock', 'EACH OWNER WAITS FOR THE OTHER OWNER', 280);
  d.box(55, 92, 190, 65, 'P1 holds A', { fill: C.card });
  d.box(395, 92, 190, 65, 'P2 holds B', { fill: C.card });
  d.carrow([[250, 107], [320, 62], [390, 107]], { stroke: C.gray });
  d.text(320, 50, 'P1 waits for B', { cls: 'sm' });
  d.carrow([[390, 144], [320, 200], [250, 144]], { stroke: C.acc });
  d.text(320, 223, 'P2 waits for A', { cls: 'sm', color: C.acc });
  return d.svg();
}
export function os_deadlock_handling() { return cards('os_deadlock_handling', 'HANDLING CHANGES WHERE COST IS PAID', [['ignore', 'accept rare failure'], ['prevention', 'break a condition'], ['avoidance', 'reject unsafe allocation'], ['detect + recover', 'repair after discovery']], 2); }
export function os_banker() { return ledger('os_banker', 'BANKER FINDS A SAFE COMPLETION ORDER', ['Process', 'Need', 'Work after finish'], [['B', '1', '2'], ['A', '2', '3'], ['C', '2', '4']], 0); }
export function os_starvation_livelock() { return cards('os_starvation_livelock', 'NO PROGRESS HAS THREE DISTINCT SHAPES', [['deadlock', 'all wait on held resources'], ['starvation', 'one task is denied'], ['livelock', 'tasks act but cancel'], ['aging', 'raise a long-waiting task']], 1); }
export function os_schedule_metrics() { return ledger('os_schedule_metrics', 'SCHEDULER METRICS START WITH THE TIMELINE', ['Metric', 'Formula', 'Meaning'], [['turnaround', 'completion - arrival', 'time in system'], ['waiting', 'turnaround - burst', 'ready but not running'], ['response', 'first run - arrival', 'first visible service'], ['B in FCFS', '8 - 1; then 7 - 3', '7 total; 4 waiting']], 1); }
export function os_schedule_fcfs() { return ledger('os_schedule_fcfs', 'FCFS RUNS A THEN B THEN C', ['Job', 'Interval', 'Waiting'], [['A', '0 to 5', '0'], ['B', '5 to 8', '4'], ['C', '8 to 9', '6']], 0); }
export function os_schedule_sjf() { return ledger('os_schedule_sjf', 'SJF REDUCES THE SHORT JOBS WAIT', ['Job', 'Interval', 'Completion'], [['A', '0 to 5', '5'], ['C', '5 to 6', '6'], ['B', '6 to 9', '9']], 1); }
export function os_schedule_srtf() { return ledger('os_schedule_srtf', 'SRTF PREEMPTS WHEN A SHORTER JOB ARRIVES', ['Interval', 'Running', 'Reason'], [['0 to 1', 'A', 'only job'], ['1 to 2', 'B', '3 less than 4'], ['2 to 3', 'C', '1 is shortest'], ['3 to 5', 'B', 'remaining work'], ['5 to 9', 'A', 'last work']], 2); }
export function os_schedule_rr() { return ledger('os_schedule_rr', 'ROUND ROBIN USES A TWO MILLISECOND QUANTUM', ['Interval', 'Running', 'Event'], [['0 to 2', 'A', 'quantum'], ['2 to 4', 'B', 'quantum'], ['4 to 5', 'C', 'finishes'], ['5 to 7', 'A', 'quantum'], ['7 to 8', 'B', 'finishes'], ['8 to 9', 'A', 'finishes']], 0); }
export function os_preemption_multicore() { return cards('os_preemption_multicore', 'TIMER AND MIGRATION ADD SCHEDULING COST', [['timer', 'interrupt ends a slice'], ['SMP', 'two cores run work'], ['affinity', 'keep cache-hot work'], ['migration', 'balance at locality cost']], 3); }
export function os_addresses() {
  const d = canvas('os_addresses', 'THE PAGE NUMBER IS LOOKED UP, THE OFFSET RIDES ALONG', 340);
  d.cycle = 7;
  d.mono(320, 36, `${n.virtual_address.toLocaleString('en-US')} = ${n.vpn} × ${n.page_bytes.toLocaleString('en-US')} + ${n.offset.toLocaleString('en-US')}`, { size: 12 });
  d.box(40, 58, 330, 30, `VPN = ${n.vpn}`, { r: 0, fill: C.card, cls: 'mono', size: 11 });
  d.box(370, 58, 198, 30, `offset = ${n.offset.toLocaleString('en-US')}`, { r: 0, fill: C.card, cls: 'mono', size: 11 });
  d.text(42, 98, `${n.vpn_bits} bits`, { cls: 'xs', a: 'start' });
  d.text(566, 98, `${n.offset_bits} bits`, { cls: 'xs', a: 'end' });
  d.text(150, 118, 'VPN', { cls: 'xs', a: 'start' });
  d.text(205, 118, 'frame', { cls: 'xs', a: 'start' });
  const table = [5, '—', 14, n.frame, '—', 2];
  table.forEach((f, i) => {
    const y = 128 + i * 24, hot = i === n.vpn;
    d.rect(150, y, 50, 24, { r: 0, fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2, sw: 0.9 });
    d.rect(200, y, 70, 24, { r: 0, fill: hot ? C.accSoft : C.paper, stroke: hot ? C.acc : C.ink2, sw: 0.9 });
    d.mono(175, y + 12, String(i), { size: 10 });
    d.mono(235, y + 12, String(f), { size: 10, color: f === '—' ? C.gray : undefined });
  });
  d.text(210, 286, 'page table', { cls: 'sm' });
  for (let i = 0; i < 6; i++) {
    const f = 7 + i, y = 112 + i * 28, hot = f === n.frame;
    d.rect(430, y, 150, 28, { r: 0, fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2, sw: 0.9 });
    d.mono(440, y + 14, `frame ${f}`, { size: 9.5, a: 'start', color: hot ? undefined : C.gray });
    d.text(584, y + 3, (f * n.page_bytes).toLocaleString('en-US'), { cls: 'xs', a: 'start' });
  }
  const fy = 112 + (n.frame - 7) * 28, oy = fy + 28 * n.offset / n.page_bytes;
  d.line(492, oy, 576, oy, { stroke: C.acc, sw: 1.4, single: true, rough: 0.3 });
  d.text(505, 298, 'physical memory', { cls: 'sm' });
  d.arrow(205, 92, 178, 205, { stroke: C.gray, hl: 6 });
  d.carrow([[272, 212], [350, 206], [426, fy + 14]], { stroke: C.gray, hl: 6 });
  d.arrow(469, 92, 500, oy - 3, { stroke: C.gray, hl: 6, dash: [4, 4] });
  d.hand(330, 150, 'VPN is looked up', { size: 15 });
  d.hand(345, 258, 'offset copied unchanged', { size: 15 });
  d.travel([[205, 92], [178, 210]], { at: [0.04, 0.28], label: `VPN ${n.vpn}` });
  d.pulse(175, 212, { at: [0.26, 0.4], r1: 26 });
  d.travel('M272,212 Q350,206 426,' + (fy + 14), { at: [0.36, 0.6], label: `frame ${n.frame}` });
  d.travel([[469, 92], [500, oy]], { at: [0.36, 0.6], label: `+${n.offset.toLocaleString('en-US')}`, fill: C.paper, color: C.ink2 });
  d.pulse(505, oy, { at: [0.6, 0.78], r1: 24 });
  d.rect(150, 312, 340, 24, { r: 5, fill: C.accSoft, stroke: C.acc });
  d.mono(320, 324, `${n.frame} × ${n.page_bytes.toLocaleString('en-US')} + ${n.offset.toLocaleString('en-US')} = ${n.physical_address.toLocaleString('en-US')}`, { size: 11.5 });
  return d.svg();
}
export function os_contiguous_alloc() { return cards('os_contiguous_alloc', 'CONTIGUOUS ALLOCATION HAS TWO FRAGMENTATION SHAPES', [['fixed partition', 'space inside an assigned block'], ['variable partition', 'fit a request into a hole'], ['internal', 'allocated but unused bytes'], ['external', 'free bytes split into holes']], 3); }
export function os_paging() { return flow('os_paging', 'PAGES TURN PLACEMENT INTO A TABLE LOOKUP', ['virtual page', 'page table', 'physical frame', 'offset unchanged'], ['VPN selects entry', 'valid and protected', 'frame selected', 'byte within page'], 2); }
export function os_page_table() {
  const d = canvas('os_page_table', 'A FLAT TABLE PAYS FOR EVERY PAGE, A TREE PAYS FOR USED ONES', 330);
  d.cycle = 6;
  d.text(80, 44, 'flat table', { cls: 'ttl' });
  d.rect(60, 58, 40, 220, { r: 0, fill: C.faint, fs: 'hachure', gap: 6, stroke: C.ink2 });
  [64, 72, 262].forEach((y) => d.fillRect(62, y, 36, 5, C.acc));
  d.text(112, 74, `${n.virtual_pages.toLocaleString('en-US')} entries`, { cls: 'sm', a: 'start' });
  d.text(112, 92, `× ${n.pte_bytes} bytes each`, { cls: 'sm', a: 'start' });
  d.mono(112, 118, `= ${n.linear_table_bytes.toLocaleString('en-US')} B`, { a: 'start', size: 11 });
  d.text(112, 236, 'allocated even where', { cls: 'xs', a: 'start' });
  d.text(112, 250, 'nothing is mapped', { cls: 'xs', a: 'start' });
  d.line(280, 50, 280, 290, { stroke: C.faint, single: true, dash: [3, 5] });
  d.text(345, 44, 'two-level tree', { cls: 'ttl' });
  d.rect(325, 70, 40, 180, { r: 0, fill: C.card, stroke: C.ink2 });
  d.text(345, 262, 'directory', { cls: 'xs' });
  d.text(345, 274, '1,024 entries', { cls: 'xs' });
  const leaves = [[470, 58], [470, 138], [470, 218]], slots = [84, 108, 230];
  leaves.forEach(([x, y], i) => {
    d.fillRect(327, slots[i] - 3, 36, 6, C.acc);
    d.carrow([[366, slots[i]], [420, slots[i]], [466, y + 28]], { stroke: C.acc, hl: 6 });
    d.rect(x, y, 40, 56, { r: 0, fill: C.accSoft, stroke: C.acc });
    for (let k = 1; k < 5; k++) d.line(x + 3, y + k * 11, x + 37, y + k * 11, { stroke: C.line, sw: 0.6, single: true, rough: 0.3 });
    d.text(x + 50, y + 28, '4,096 B', { cls: 'xs', a: 'start' });
  });
  d.text(560, 190, 'empty entries', { cls: 'xs' });
  d.text(560, 202, 'point nowhere', { cls: 'xs' });
  d.travel('M366,108 L420,108 L466,166', { at: [0.1, 0.45], r: 4 });
  d.pulse(490, 166, { at: [0.42, 0.62], r1: 24 });
  d.hand(470, 300, 'illustrative: 3 populated branches', { size: 15 });
  d.mono(160, 312, `flat ${n.linear_table_bytes.toLocaleString('en-US')} B`, { size: 11, color: C.gray });
  d.mono(470, 318, `${(4 * n.page_bytes).toLocaleString('en-US')} B = 4 × 4,096`, { size: 11 });
  return d.svg();
}
export function os_tlb() {
  const d = canvas('os_tlb', 'NINE LOOKUPS HIT THE TLB, ONE WALKS THE TABLE', 316);
  d.cycle = 10;
  const tlb = n.tlb_ns, mem = n.memory_ns, hit = tlb + mem, miss = tlb + 2 * mem;
  d.cpu(40, 130, 60, { label: 'CPU' });
  d.rect(190, 66, 150, 92, { r: 5, fill: C.card, stroke: C.ink2 });
  d.text(200, 80, `TLB · ${tlb} ns`, { cls: 'ttl', a: 'start', size: 11.5 });
  [[n.vpn, n.frame], [0, 5], [2, 14], [5, 2]].forEach(([v, f], i) => {
    d.rect(200, 92 + i * 15, 130, 13, { r: 2, fill: i ? C.paper : C.slateSoft, stroke: C.line, sw: 0.7 });
    d.mono(265, 99 + i * 15, `VPN ${v} → frame ${f}`, { size: 9 });
  });
  d.ram(190, 232, 150, 44, { chip: (i) => i === 1 ? C.accSoft : C.paper });
  d.text(265, 290, `page table walk · ${mem} ns`, { cls: 'sm' });
  d.ram(450, 140, 160, 44);
  d.text(530, 198, `data access · ${mem} ns`, { cls: 'sm' });
  d.lines([[104, 160], [188, 116]], { stroke: C.gray, single: true });
  d.arrow(342, 116, 446, 156, { stroke: C.gray, hl: 6 });
  d.carrow([[265, 160], [265, 228]], { stroke: C.acc, hl: 6, dash: [4, 4] });
  d.carrow([[342, 254], [400, 240], [446, 176]], { stroke: C.acc, hl: 6, dash: [4, 4] });
  d.text(282, 196, 'miss', { cls: 'hand', size: 16, a: 'start' });
  const hitPath = [[104, 160], [190, 116], [340, 116], [450, 160]];
  const missPath = [[104, 160], [190, 116], [265, 158], [265, 232], [340, 254], [450, 172]];
  [0, 0.1, 0.2, 0.3, 0.4, 0.6, 0.7, 0.8, 0.9].forEach((s) => d.travel(hitPath, { at: [s, s + 0.1], r: 3.5, color: C.ink2 }));
  d.travel(missPath, { at: [0.44, 0.78], r: 5 });
  d.pulse(265, 254, { at: [0.55, 0.7], r1: 22 });
  d.text(400, 40, 'ten translations', { cls: 'xs', a: 'start' });
  for (let i = 0; i < 10; i++) d.rect(400 + i * 19, 50, 14, 14, { r: 2, fill: i < 9 ? C.ink2 : C.accSoft, stroke: i < 9 ? C.ink2 : C.acc, sw: 0.8 });
  d.mono(380, 232, `hit   ${tlb} + ${mem} = ${hit} ns`, { a: 'start', size: 10.5 });
  d.mono(380, 252, `miss  ${tlb} + ${mem} + ${mem} = ${miss} ns`, { a: 'start', size: 10.5 });
  d.rect(372, 266, 252, 24, { r: 5, fill: C.accSoft, stroke: C.acc });
  d.mono(380, 278, `${n.tlb_hit_rate} × ${hit} + ${+(1 - n.tlb_hit_rate).toFixed(1)} × ${miss} = ${n.effective_ns} ns`, { a: 'start', size: 10.5 });
  return d.svg();
}
export function os_virtual_memory() { return cards('os_virtual_memory', 'VIRTUAL MEMORY SEPARATES VIEW FROM RESIDENCY', [['private map', 'each process sees its own addresses'], ['protection', 'permissions travel with entries'], ['sharing', 'two maps can name one frame'], ['demand', 'not every page is resident']], 0); }
export function os_demand_paging() { return flow('os_demand_paging', 'A PAGE FAULT RESUMES THE FAULTING INSTRUCTION', ['access', 'fault', 'locate or zero', 'map frame', 'retry'], ['missing page', 'kernel entry', 'disk or zero page', 'PTE update', 'same instruction'], 1); }
export function os_replacement_fifo() { return ledger('os_replacement_fifo', 'FIFO HAS NINE FAULTS WITH THREE FRAMES', ['Reference', 'Frames', 'Result'], n.replacement.fifo_3.trace.slice(0, 8).map(x => [x.page, x.frames.join(' '), x.miss ? 'fault' : 'hit']).concat([['total', '3 frames', `${n.replacement.fifo_3.faults} faults`]]), 7); }
export function os_replacement_compare() { return ledger('os_replacement_compare', 'MORE FIFO FRAMES CAN MEAN MORE FAULTS', ['Policy', 'Frames', 'Faults'], [['FIFO', '3', n.replacement.fifo_3.faults], ['FIFO', '4', n.replacement.fifo_4.faults], ['LRU', '3', n.replacement.lru_3.faults], ['OPT', '3', n.replacement.opt_3.faults]], 1); }
export function os_thrashing() { return flow('os_thrashing', 'A SMALL WORKING SET PREVENTS A FAULT LOOP', ['working set', 'frames fill', 'fault', 'evict useful page', 'fault again'], ['local references', 'resident pages', 'new page', 'poor choice', 'low useful CPU'], 4); }
export function os_segmentation() { return cards('os_segmentation', 'SEGMENTS NAME LOGICAL REGIONS', [['code', 'read and execute'], ['heap', 'dynamic data'], ['stack', 'calls and locals'], ['paging beneath', 'physical placement without holes']], 3); }
export function os_cow() { return ledger('os_cow', 'COPY ON WRITE COPIES ONLY MODIFIED PAGES', ['Stage', 'Shared pages', 'Bytes'], [['before fork', '8 owned', n.cow_before_bytes], ['after fork', '8 shared', n.cow_before_bytes], ['one write', '7 shared + 1 copy', n.cow_after_bytes]], 2); }
export function os_mmap() { return flow('os_mmap', 'MMAP MAKES A FILE RANGE ADDRESSABLE', ['file offset', 'virtual mapping', 'page fault', 'memory access'], ['persistent bytes', 'file-backed region', 'load on demand', 'dirty writeback'], 1); }
export function os_heap_stack() { return cards('os_heap_stack', 'LIFETIME AND OWNERSHIP SEPARATE STACK FROM HEAP', [['stack', 'call-scoped frames'], ['heap', 'explicit allocation lifetime'], ['metadata', 'allocator tracks free blocks'], ['overflow', 'stack growth meets its limit']], 0); }
export function os_filesystem() { return flow('os_filesystem', 'A NAME RESOLVES BEFORE DATA BLOCKS ARE READ', ['filename', 'directory entry', 'inode', 'data blocks'], ['name lookup', 'name to inode', 'metadata and pointers', 'file bytes'], 2); }
export function os_fd_table() { return ledger('os_fd_table', 'A DESCRIPTOR IS A PROCESS-LOCAL HANDLE', ['FD', 'Target', 'Use'], [['0', 'stdin', 'read input'], ['1', 'stdout', 'write output'], ['2', 'stderr', 'write diagnostics'], ['3', 'socket or file', 'server resource']], 3); }
export function os_inode_links() { return cards('os_inode_links', 'DIRECTORY NAMES AND INODES ARE DIFFERENT', [['hard link', 'second name, same inode'], ['symbolic link', 'file containing a path'], ['unlink', 'remove one directory name'], ['link count', 'inode stays while names remain']], 0); }
export function os_alloc_cache() { return flow('os_alloc_cache', 'FILE BYTES PASS THROUGH ALLOCATION AND CACHE', ['free blocks', 'inode pointers', 'page cache', 'dirty flush'], ['space manager', 'logical mapping', 'RAM copy', 'persistent write'], 2); }
export function os_journal() { return lanes('os_journal', 'A JOURNAL RECORDS ORDER BEFORE METADATA', 'filesystem', 'storage', [[1, 'write intent'], [1, 'persist journal'], [1, 'update metadata'], [1, 'checkpoint journal']], 'replay restores a consistent metadata state'); }
export function os_dma() { return flow('os_dma', 'DMA MOVES DEVICE BYTES WITHOUT A CPU COPY LOOP', ['device', 'DMA controller', 'RAM buffer', 'interrupt'], ['packet arrives', 'transfer ownership', 'bytes land', 'completion notice'], 2); }
export function os_block_nonblock() { return cards('os_block_nonblock', 'BLOCKING DESCRIBES THE CALLER WAIT', [['blocking', 'thread sleeps until progress'], ['non-blocking', 'call returns now'], ['synchronous', 'operation completion is awaited'], ['asynchronous', 'completion is reported later']], 1); }
export function os_epoll() { return ledger('os_epoll', 'READINESS SHRINKS 1,000 SOCKETS TO 20', ['Set', 'Count', 'Next action'], [['open connections', n.connections, 'kernel tracks descriptors'], ['idle', n.idle, 'no user work'], ['ready', n.ready, 'event loop reads'], ['cores', n.cores, 'two workers run']], 2); }
export function os_event_loop() { return flow('os_event_loop', 'THE EVENT LOOP RUNS READY CALLBACKS', ['wait', 'ready fd', 'callback', 'return to wait'], ['epoll wait', 'kernel reports', 'short user work', 'no idle thread'], 2); }
export function os_ipc() { return cards('os_ipc', 'ISOLATION CHANGES THE COMMUNICATION COST', [['pipe', 'ordered byte stream'], ['shared memory', 'same mapped bytes'], ['message queue', 'kernel-delimited messages'], ['socket', 'local or network endpoint']], 3); }
export function os_pipe_signal() { return flow('os_pipe_signal', 'A SHELL PIPE WIRES TWO DESCRIPTORS', ['cat stdout', 'pipe buffer', 'grep stdin', 'grep parser'], ['writer descriptor', 'ordered byte stream', 'reader descriptor', 'frame complete lines'], 1); }
export function os_permissions() { return ledger('os_permissions', '755 IS THREE PERMISSION DIGITS', ['Class', 'Bits', 'Meaning'], [['owner', '7 = 4 + 2 + 1', 'read write execute'], ['group', '5 = 4 + 1', 'read execute'], ['others', '5 = 4 + 1', 'read execute']], 0); }
export function os_privilege() { return cards('os_privilege', 'IDENTITY CONTROLS PRIVILEGED OPERATIONS', [['UID', 'user identity'], ['GID', 'group identity'], ['effective UID', 'permission check identity'], ['root', 'broad authority if compromised']], 2); }
export function os_virtualization() { return flow('os_virtualization', 'A VM ADDS A GUEST KERNEL', ['hardware', 'hypervisor', 'guest OS', 'application'], ['real CPU and RAM', 'virtual devices', 'guest policy', 'guest process'], 1); }
export function os_container_layers() { return cards('os_container_layers', 'CONTAINERS SHARE A KERNEL BUT CHANGE THE VIEW', [['namespace', 'what the process can see'], ['cgroup', 'how much it may use'], ['image layer', 'filesystem starting point'], ['host kernel', 'shared privileged base']], 0); }
export function os_namespaces() { return ledger('os_namespaces', 'NAMESPACES SPLIT KERNEL VIEWS', ['Namespace', 'Hidden view', 'Example'], [['PID', 'process IDs', 'inside sees PID 1'], ['network', 'interfaces and routes', 'private network'], ['mount', 'filesystem tree', 'isolated root'], ['user', 'UID mapping', 'mapped identity']], 0); }
export function os_cgroup() { return ledger('os_cgroup', 'A 50 MS QUOTA RUNS IN A 100 MS PERIOD', ['Window', 'Quota', 'Interpretation'], [['period', n.period_ms, '100 ms'], ['quota', n.quota_ms, '50 ms CPU'], ['container', 'one group', 'throttled after quota'], ['host', n.cores, 'two total cores']], 1); }
export function os_boot() { return flow('os_boot', 'BOOT HANDS CONTROL THROUGH LAYERS', ['firmware', 'bootloader', 'kernel', 'initramfs', 'init', 'service'], ['hardware start', 'load image', 'drivers and memory', 'early root setup', 'PID 1', 'server ready'], 2); }
export function os_proc_limits() { return cards('os_proc_limits', 'LINUX EXPOSES STATE AS FILE-LIKE DATA', [['/proc', 'kernel and process view'], ['/proc/PID/fd', 'descriptor links'], ['ulimit', 'per-process ceiling'], ['strace', 'system-call trace']], 2); }
export function os_leaks() { return ledger('os_leaks', 'A LEAK EXHAUSTS A FINITE RESOURCE', ['Leak', 'Held over time', 'Failure'], [['memory', 'unreachable allocation', 'allocation fails'], ['descriptor', 'unclosed socket', 'accept fails at limit'], ['thread', 'unbounded accumulation', 'execution resources'], ['repair', 'close or reclaim', 'bounded lifetime']], 1); }
export function os_cache_hierarchy() { return flow('os_cache_hierarchy', 'LOWER LEVELS HOLD MORE WITH MORE LATENCY', ['register', 'L1/L2/L3', 'RAM', 'SSD'], ['smallest', 'cache lines', 'larger store', 'persistent store'], 1); }
export function os_false_sharing() { return cards('os_false_sharing', 'SEPARATE VARIABLES CAN SHARE A CACHE LINE', [['line', n.cache_line_bytes + ' bytes'], ['thread A', 'writes A'], ['thread B', 'writes B'], ['cost', 'coherence invalidations']], 3); }
export function os_network_path() { return flow('os_network_path', 'A SOCKET CONNECTS HARDWARE TO USER CODE', ['NIC', 'kernel stack', 'socket buffer', 'fd ready'], ['packet', 'interrupt and processing', 'queued bytes', 'epoll result'], 3); }
export function os_zero_copy() { return flow('os_zero_copy', 'SENDFILE CAN SKIP A USER BUFFER', ['disk', 'kernel page cache', 'socket', 'NIC'], ['read storage', 'keep kernel ownership', 'send bytes', 'transmit'], 2); }
export function os_io_uring() { return lanes('os_io_uring', 'SUBMISSION AND COMPLETION QUEUES SPLIT WORK', 'application', 'kernel', [[1, 'submit operation'], [-1, 'submission accepted'], [-1, 'operation completes'], [-1, 'application consumes result']], 'completion still carries errors'); }
export function os_complete_trace() { return flow('os_complete_trace', 'ONE SERVER REQUEST CROSSES EVERY OS LAYER', ['fork + exec', 'schedule', 'VA to PA', 'epoll + fd', 'file + cache', 'cgroup'], ['new image', 'ready queue', 'page table and TLB', 'ready socket', 'inode and blocks', 'quota'], 4); }
