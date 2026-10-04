import { scene as illustration, page as figPage, shelf as figShelf, label as figLabel, mapSite } from '../lib/figure-details.js';
import { D, C } from '../lib/draw.js';
import { canvas, cards, ledger, flow, lanes, map, cover } from '../lib/fundamentals-figures.js';
import numbers from '../data/fundamentals/numbers.json' with { type: 'json' };
const n = numbers.os;
const scene = (id, kicker, rows, focus = 0) => ledger(id, kicker, ['State', 'Mechanism', 'Result'], rows, focus);
const chip = (d, x, y, w, s, hot = false, h = 22) => d.box(x, y, w, h, s, { r: 4, fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2, cls: 'mono', size: 9.5 });
const band = (d, x, y, w, h, s, fill = C.card) => { d.fillRect(x, y, w, h, fill, 1, 4); d.text(x + 8, y + 11, s, { cls: 'xs', a: 'start' }); };
const squiggle = (x, y1, y2, amp = 4) => { let p = `M${x},${y1}`; for (let y = y1; y < y2; y += 12) p += ` Q${x + amp},${y + 3} ${x},${Math.min(y2, y + 6)} T${x},${Math.min(y2, y + 12)}`; return p; };
const sleeper = (d, x, y) => { d.person(x, y, 26, {}); d.hand(x + 18, y - 4, 'z z', { size: 14, a: 'start' }); };
export function where_fund_os(stage = 99) { return map('where_fund_os', ['OS fundamentals', 'Processes', 'Fork, exec and threads', 'Synchronization', 'Deadlocks', 'CPU scheduling', 'Paging and memory', 'Copy-on-write', 'Filesystems', 'I/O and IPC', 'Protection and Linux', 'Complete server trace'], stage); }
export function cover_fund_os() { return cover('cover_fund_os', ['Operating', 'systems'], ['A hand-drawn field guide to processes, memory, files and I/O'], [['application', 'program and server'], ['system calls', 'the controlled boundary'], ['kernel', 'resource decisions'], ['hardware', 'cores, memory and devices']], 3); }
export function os_boundary() {
const d = illustration('os_boundary', 'A SYSTEM CALL CROSSES A CONTROLLED PRIVILEGE BOUNDARY', 380);
  d.fillRect(26, 48, 588, 103, C.card);
  d.fillRect(26, 174, 588, 120, C.accFaint);
  figLabel(d, 43, 67, 'user space', 'application intent', 'start');
  d.laptop(83, 91, 88); d.mono(256, 113, 'read(fd, buffer, size)');
  d.line(28, 161, 612, 161, { stroke: C.acc, sw: 1.5, single: true });
  d.text(610, 149, 'privilege boundary', { cls: 'sm', a: 'end', color: C.acc });
  d.arrow(327, 132, 327, 198, { stroke: C.acc });
  d.text(342, 180, 'checked entry', { cls: 'sm', a: 'start' });
  figLabel(d, 43, 197, 'kernel space', 'permissions and resource state', 'start');
  d.lock(306, 214, 42, { stroke: C.acc, fill: C.accSoft });
  d.mono(426, 239, 'validate → perform → return', { size: 10 });
  d.cpu(104, 318, 38, { label: 'CPU' }); d.ram(266, 318, 118, 32); d.disk(522, 335, 43);
  d.text(201, 335, 'cores', { cls: 'sm' }); d.text(397, 335, 'memory', { cls: 'sm', a: 'start' });
  d.arrow(327, 281, 327, 313, { stroke: C.ink2 });
  return d.svg();
}
export function os_kernel_types() {
  const d = illustration('os_kernel_types', 'WHERE THE SERVICES LIVE DECIDES HOW MANY TIMES A READ CROSSES', 330);
  const kinds = [['monolithic', [1, 1, 1, 1], 2], ['modular', [1, 1, 1, 2], 2], ['microkernel', [0, 0, 0, 1], 4], ['hybrid', [1, 0, 1, 1], 4]];
  const svc = ['fs', 'net', 'drv', 'sched'];
  kinds.forEach(([name, place, cross], i) => {
    const x = 18 + i * 153, w = 140, hot = i === 0;
    band(d, x, 42, w, 92, 'user space');
    band(d, x, 140, w, 106, 'kernel space', hot ? C.accFaint : C.card);
    d.line(x, 137, x + w, 137, { stroke: hot ? C.acc : C.line, sw: hot ? 1.6 : 1, single: true });
    d.laptop(x + 10, 64, 36);
    let u = 0, k = 0;
    place.forEach((p, j) => {
      const inK = p > 0, cx = inK ? x + 10 + (k % 2) * 64 : x + 62 + (u % 2) * 38, cy = inK ? 160 + Math.floor(k / 2) * 34 : 62 + Math.floor(u / 2) * 30;
      if (inK) k++; else u++;
      d.box(cx, cy, inK ? 56 : 34, 22, svc[j], { r: 4, fill: hot ? C.accSoft : C.paper, stroke: p === 2 ? C.gray : hot ? C.acc : C.ink2, cls: 'mono', size: 9.5, dash: p === 2 ? [3, 3] : undefined });
    });
    d.fillRect(x + 4, 252, w - 8, 14, C.faint, 1, 3); d.text(x + w / 2, 259, 'hardware', { cls: 'xs' });
    d.text(x + w / 2, 288, name, { cls: 'ttl', color: hot ? C.acc : undefined });
    d.mono(x + w / 2, 307, `${cross} crossings per read`, { size: 9.5, color: hot ? C.acc : C.gray });
    const path = cross === 2 ? [[x + 28, 96], [x + 38, 171], [x + 28, 96]] : [[x + 28, 96], [x + 30, 205], [x + 78, 82], [x + 30, 205], [x + 28, 96]];
    d.travel(path, { dur: cross === 2 ? 3 : 5, r: 3.5, color: hot ? C.acc : C.ink2 });
  });
  d.text(18 + 153 + 70, 238, 'dashed: loadable module', { cls: 'xs' });
  return d.svg();
}
export function os_syscall_entry() {
  const d = illustration('os_syscall_entry', 'READ() LOADS REGISTERS, TRAPS THROUGH ONE GATE, AND RETURNS A COUNT', 360);
  band(d, 20, 40, 600, 118, 'user mode: the application');
  band(d, 20, 196, 600, 140, 'kernel mode', C.accFaint);
  d.mono(48, 74, 'n = read(fd, buf, 4096);', { a: 'start', size: 12 });
  const regs = [['rax', '0'], ['rdi', '3'], ['rsi', 'buf'], ['rdx', '4096']];
  regs.forEach(([r, v], i) => { d.text(64 + i * 74, 104, r, { cls: 'xs' }); chip(d, 38 + i * 74, 112, 54, v, i === 0); });
  d.text(345, 123, 'arguments travel in registers;\nrax names the call', { cls: 'sm', a: 'start', vc: true });
  d.line(20, 177, 288, 177, { stroke: C.ink2, sw: 2, single: true }); d.line(352, 177, 620, 177, { stroke: C.ink2, sw: 2, single: true });
  d.glow((g) => g.rect(290, 167, 60, 20, { r: 3, fill: C.accSoft, stroke: C.acc }));
  d.mono(320, 177, 'syscall', { size: 9.5 });
  d.text(368, 177, 'the only door: CPU switches mode here', { cls: 'sm', a: 'start' });
  d.text(64, 222, 'syscall table', { cls: 'ttl', a: 'start' });
  ['read', 'write', 'open', 'close'].forEach((s, i) => { d.text(48, 243 + i * 22, String(i), { cls: 'xs' }); chip(d, 60, 233 + i * 22, 86, s, i === 0, 19); });
  d.arrow(152, 243, 232, 262, { stroke: C.acc });
  d.lock(244, 248, 26, { stroke: C.acc, fill: C.accSoft });
  d.text(286, 256, 'check fd 3 is open and readable,\ncheck buf is user memory', { cls: 'sm', a: 'start', vc: true });
  d.disk(560, 266, 50, { label: 'device or page cache' });
  d.arrow(478, 262, 528, 262, { stroke: C.ink2 });
  d.carrow([[560, 232], [520, 190], [470, 112]], { stroke: C.ink2, hl: 6 });
  d.text(522, 132, 'rax = bytes read', { cls: 'sm', a: 'start' });
  d.travel([[66, 123], [320, 177], [104, 243], [256, 262], [470, 262], [560, 232], [470, 112]], { dur: 7, label: 'rax=0', w: 44 });
  return d.svg();
}
export function os_event_kinds() {
  const d = illustration('os_event_kinds', 'THREE WAYS INTO THE KERNEL: A DEVICE INTERRUPTS, AN INSTRUCTION FAULTS, A PROGRAM ASKS', 350);
  const ins = ['mov', 'add', 'div r0', 'load', 'syscall', 'cmp'];
  d.text(36, 52, 'instruction stream on one core', { cls: 'sm', a: 'start' });
  ins.forEach((s, i) => chip(d, 36 + i * 78, 64, 70, s, i === 4, 26));
  d.travel([[71, 104], [500, 104]], { dur: 6, r: 3, color: C.ink2 });
  band(d, 20, 214, 600, 82, 'kernel: one handler table, three reasons', C.card);
  d.router(40, 158, 64); d.text(72, 192, 'NIC', { cls: 'xs' });
  d.path('M112,150 L124,170 L116,172 L130,200', { stroke: C.ink2, sw: 1.6, single: true });
  d.text(80, 132, 'interrupt', { cls: 'ttl' }); d.text(80, 312, 'asynchronous: arrives\nbetween any two instructions', { cls: 'sm', vc: true });
  d.pulse(125, 205, { r1: 18, dur: 3.2, at: [0.2, 0.6], color: C.ink2 });
  d.arrow(267, 94, 267, 228, { stroke: C.ink2, dash: [4, 4] });
  d.text(280, 160, 'exception', { cls: 'ttl', a: 'start' }); d.text(280, 178, 'divide by zero, page fault', { cls: 'sm', a: 'start' });
  d.glow((g) => g.arrow(501, 94, 501, 228, { stroke: C.acc, sw: 1.8 }));
  d.text(514, 160, 'trap', { cls: 'ttl', a: 'start', color: C.acc }); d.text(514, 178, 'deliberate request', { cls: 'sm', a: 'start' });
  [['IRQ handler', 70], ['fault handler', 267], ['syscall entry', 501]].forEach(([s, x], i) => chip(d, x - 52, 244, 104, s, i === 2, 26));
  d.carrow([[560, 257], [610, 200], [585, 82]], { stroke: C.gray, hl: 6 }); d.text(604, 140, 'return', { cls: 'xs', a: 'end' });
  d.text(267, 312, 'synchronous: caused by\nthe current instruction', { cls: 'sm', vc: true });
  return d.svg();
}
export function os_process_image() {
const d = illustration('os_process_image', 'AN ADDRESS SPACE IS A VERTICAL MAP, NOT A PIPELINE', 390);
  const x=251,w=190;
  d.text(x+w/2,43,'high addresses',{cls:'sm'});
  const regions=[[60,60,'stack',C.card],[120,122,'unmapped space',C.paper],[242,58,'heap',C.accSoft],[300,32,'data + BSS',C.card],[332,32,'text / code',C.card]];
  regions.forEach(([y,h,s,f])=>{d.rect(x,y,w,h,{r:0,fill:f,stroke:s==='heap'?C.acc:C.line});d.text(x+w/2,y+h/2,s,{cls:'mono',size:12});});
  d.text(x+w/2,379,'low addresses',{cls:'sm'});
  d.arrow(462,79,462,154,{stroke:C.ink2}); d.text(480,121,'stack grows down',{cls:'sm',a:'start'});
  d.arrow(225,279,225,203,{stroke:C.acc}); d.text(209,230,'heap grows up',{cls:'sm',a:'end',color:C.acc});
  d.text(462,317,'globals and zero-fill',{cls:'sm',a:'start'});
  d.text(462,348,'instructions',{cls:'sm',a:'start'});
  d.doc(63,84,92,123,{lines:false}); d.mono(109,117,'call');d.mono(109,143,'locals');d.mono(109,169,'return');
  d.line(158,102,245,90,{stroke:C.line,single:true});
  d.hand(109,281,'one process,\none private view',{size:18,vc:true});
  return d.svg();
}
export function os_pcb() {
  const d = illustration('os_pcb', 'THE PCB IS THE CARD THE KERNEL KEEPS SO A STOPPED PROCESS CAN RESUME', 360);
  d.cpu(48, 120, 70, { label: 'core 0' });
  d.text(83, 216, 'interrupted\nmid-instruction', { cls: 'sm', vc: true });
  d.rect(200, 40, 410, 296, { r: 6, fill: C.paper, stroke: C.ink2 });
  d.rect(214, 30, 120, 22, { r: 4, fill: C.card, stroke: C.ink2 }); d.mono(274, 41, 'task_struct', { size: 10 });
  const rows = [['identity', 'PID 4182   UID 1000', 0], ['execution', 'PC 0x401a3c  SP 0x7ffd..f0', 1], ['', 'rax rbx rcx rdx rsi rdi r8..r15', 1], ['scheduling', 'state READY  prio 120', 0], ['memory', 'page table root → 0x1f3000', 0], ['resources', 'fd 0 1 2 3 4', 0]];
  rows.forEach(([k, v, hot], i) => {
    const y = 66 + i * 42;
    if (hot) d.fillRect(212, y - 4, 386, 36, C.accFaint, 1, 3);
    if (k) d.text(226, y + 14, k, { cls: 'ttl', a: 'start', size: 11.5, color: hot ? C.acc : undefined });
    d.mono(330, y + 14, v, { a: 'start', size: 10.5 });
    if (i < rows.length - 1 && i !== 1) d.line(212, y + 36, 598, y + 36, { stroke: C.faint, single: true, sw: 0.7 });
  });
  d.arrow(124, 140, 206, 112, { stroke: C.acc });
  d.travel([[124, 150], [206, 120]], { dur: 3, label: 'regs', w: 38 });
  d.hand(420, 322, 'enough to restart at the exact instruction', { size: 15 });
  return d.svg();
}
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
export function os_context_switch() {
  const d = illustration('os_context_switch', 'A CONTEXT SWITCH: SAVE A, PICK B, LOAD B, RESUME', 360);
  d.cpu(276, 124, 88, { label: 'core' });
  const card = (x, s, hot) => { d.rect(x, 96, 150, 150, { r: 5, fill: hot ? C.accFaint : C.paper, stroke: hot ? C.acc : C.ink2 }); d.text(x + 75, 116, s, { cls: 'ttl' }); ['PC', 'SP', 'regs', 'page table'].forEach((r, i) => chip(d, x + 14, 132 + i * 26, 122, r, false, 20)); };
  card(30, 'PCB of A (saved)', true); card(460, 'PCB of B (to load)', false);
  d.glow((g) => g.arrow(272, 150, 186, 150, { stroke: C.acc, sw: 1.8 }));
  d.text(228, 136, '1 save', { cls: 'sm', color: C.acc });
  d.arrow(458, 200, 368, 200, { stroke: C.ink2 }); d.text(412, 186, '3 load', { cls: 'sm' });
  d.text(320, 70, '2 scheduler picks B from the ready queue', { cls: 'sm' });
  ['B', 'C', 'D'].forEach((s, i) => chip(d, 248 + i * 50, 34, 40, s, false, 20));
  d.arrow(260, 58, 300, 116, { stroke: C.gray, hl: 6 });
  d.text(320, 268, '4 resume B where it stopped', { cls: 'sm' });
  d.travel([[300, 160], [186, 150]], { at: [0, 0.3], dur: 6, label: 'A', w: 24 });
  d.travel([[458, 200], [340, 190]], { at: [0.5, 0.8], dur: 6, label: 'B', w: 24, fill: C.card, color: C.ink2 });
  d.during([0, 0.5], (g) => g.mono(320, 168, 'A', { size: 16 }));
  d.during([0.8, 1], (g) => g.mono(320, 168, 'B', { size: 16 }));
  d.hand(320, 316, 'pure overhead: no user work runs during the switch', { size: 15 });
  return d.svg();
}
export function os_fork_cow() {
const d=illustration('os_fork_cow','FORK SHARES PHYSICAL PAGES; A WRITE CREATES ONE PRIVATE COPY',400);
  d.text(118,50,'parent map',{cls:'ttl'});d.text(523,50,'child map',{cls:'ttl'});d.text(320,50,'physical frames',{cls:'ttl'});
  for(let i=0;i<8;i++){
    const y=74+i*32,hot=i===7;
    d.rect(76,y,85,23,{r:0,fill:C.card,stroke:C.line});d.mono(118,y+12,`page ${i}`,{size:10});
    d.rect(479,y,85,23,{r:0,fill:hot?C.accSoft:C.card,stroke:hot?C.acc:C.line});d.mono(522,y+12,`page ${i}`,{size:10});
    figPage(d,278,y-2,83,27,`frame ${i}`,false);
    d.arrow(167,y+12,271,y+12,{stroke:C.line,hl:5});
    if(!hot)d.arrow(473,y+12,368,y+12,{stroke:C.line,hl:5});
    else {figPage(d,383,y-2,67,27,'copy',true);d.arrow(473,y+12,456,y+12,{stroke:C.acc,hl:5});d.arrow(366,y+12,379,y+12,{stroke:C.acc,hl:4,dash:[3,3]});}
  }
  d.mono(320,351,`before write: ${n.cow_before_bytes.toLocaleString('en-US')} B; after: ${n.cow_after_bytes.toLocaleString('en-US')} B`,{size:12});
  d.hand(320,379,'seven shared pages, one extra physical page',{size:17});
  return d.svg();
}
export function os_exec_image() {
const d=illustration('os_exec_image','EXEC REPLACES MAPPINGS WHILE KEEPING PROCESS IDENTITY',330);
  [60,407].forEach((x,i)=>{d.rect(x,60,174,216,{r:1,fill:C.paper,stroke:C.ink2});d.text(x+87,80,i?'new image':'old image',{cls:'ttl'});['stack','heap','data','code'].forEach((s,j)=>{d.rect(x+14,110+j*36,146,32,{r:0,fill:i?C.accSoft:C.card,stroke:i?C.acc:C.line});d.mono(x+87,126+j*36,i?`${s}: new`:`${s}: shell`,{size:11});});});
  d.arrow(244,164,396,164,{stroke:C.acc});d.text(320,144,'loader',{cls:'ttl',color:C.acc});
  d.doc(287,204,66,67,{lines:false});d.mono(320,235,'PID');
  d.text(320,303,'same process identity; new entry point and address space',{cls:'sm'});
  return d.svg();
}
export function os_wait_reap() {
  const d = illustration('os_wait_reap', 'A DEAD CHILD KEEPS ITS EXIT STATUS UNTIL SOMEONE CALLS WAIT', 340);
  d.line(320, 44, 320, 300, { stroke: C.faint, single: true });
  d.text(170, 50, 'zombie, then reaped', { cls: 'ttl' }); d.text(475, 50, 'orphan, then adopted', { cls: 'ttl' });
  d.person(90, 90, 34, { label: 'parent 100' });
  d.path('M220,190 L220,140 Q220,112 248,112 Q276,112 276,140 L276,190 Z', { stroke: C.ink2, fill: C.card, single: true });
  d.mono(248, 150, 'child', { size: 10 }); d.mono(248, 166, '101', { size: 10 }); d.text(248, 206, 'zombie: only the record', { cls: 'xs' });
  d.doc(160, 222, 70, 40, { lines: false, fill: C.accSoft, stroke: C.acc }); d.mono(195, 242, 'status 0', { size: 10 });
  d.carrow([[214, 160], [176, 190], [190, 220]], { stroke: C.gray, hl: 6 });
  d.glow((g) => g.carrow([[160, 240], [96, 220], [90, 146]], { stroke: C.acc, sw: 1.7 }));
  d.mono(60, 270, 'wait(&status)', { size: 11, color: C.acc, a: 'start' });
  d.travel([[195, 242], [96, 220], [90, 150]], { at: [0.3, 0.7], dur: 5, r: 4 });
  d.during([0.75, 1], (g) => g.line(214, 112, 282, 192, { stroke: C.acc, sw: 1.5, single: true }), { dur: 5 });
  d.person(400, 90, 34, { stroke: C.gray, label: 'parent exits' }); d.line(380, 86, 420, 128, { stroke: C.gray, single: true });
  d.person(470, 200, 34, { label: 'child 202' });
  d.person(580, 90, 34, { label: 'init, PID 1' });
  d.line(410, 132, 460, 196, { stroke: C.line, dash: [4, 4], single: true });
  d.carrow([[490, 196], [550, 170], [576, 138]], { stroke: C.ink2 });
  d.text(530, 222, 'reparented: init will\ncall wait for it', { cls: 'sm', vc: true, a: 'start' });
  d.hand(320, 312, 'SIGCHLD only tells the parent; wait still has to run', { size: 15 });
  return d.svg();
}
export function os_threads() {
const d=illustration('os_threads','PRIVATE STACKS ABOVE ONE SHARED PROCESS MAP',350);
  d.rect(28,44,584,279,{fill:C.paper,stroke:C.line,dash:[5,4]});
  d.text(43,61,'one process',{cls:'sm',a:'start'});
  [104,320,536].forEach((x,i)=>{
    d.cpu(x-21,91,42,{label:String.fromCharCode(65+i)});
    [0,1,2].forEach(r=>{d.rect(x-42,158+r*22,84,22,{r:0,fill:C.card,stroke:C.ink2});d.text(x,169+r*22,['call','locals','return'][r],{cls:'mono',size:9});});
    d.text(x,225,'private stack + registers',{cls:'sm',size:10});
    d.line(x,239,x,255,{stroke:C.line,single:true});
  });
  figShelf(d,55,257,['code','heap','globals','open files'],{width:530,hot:1,height:38});
  d.text(320,310,'shared address space and resources',{cls:'sm'});
  return d.svg();
}
export function os_thread_models() {
  const d = illustration('os_thread_models', 'HOW MANY KERNEL ENTITIES THE THREADS MAP TO DECIDES HOW MANY CORES THEY CAN USE', 340);
  const models = [['many to one', 3, [[0, 0], [1, 0], [2, 0]], 1], ['one to one', 3, [[0, 0], [1, 1], [2, 2]], 3], ['many to many', 4, [[0, 0], [1, 0], [2, 1], [3, 1]], 2]];
  models.forEach(([name, ut, map, kt], m) => {
    const x0 = 20 + m * 205, hot = m === 1, w = 190;
    d.rect(x0, 40, w, 230, { r: 6, fill: hot ? C.accFaint : C.paper, stroke: hot ? C.acc : C.line });
    d.text(x0 + w / 2, 58, name, { cls: 'ttl', color: hot ? C.acc : undefined });
    d.text(x0 + 10, 80, 'user threads', { cls: 'xs', a: 'start' });
    const ux = (i) => x0 + 30 + i * (w - 60) / Math.max(1, ut - 1), kx = (i) => x0 + w / 2 + (kt === 1 ? 0 : (i - (kt - 1) / 2) * 52);
    for (let i = 0; i < ut; i++) d.path(squiggle(ux(i), 88, 130), { stroke: hot ? C.acc : C.ink2, single: true, sw: 1.2 });
    d.text(x0 + 10, 160, 'kernel entities', { cls: 'xs', a: 'start' });
    for (let k = 0; k < kt; k++) chip(d, kx(k) - 18, 170, 36, 'K' + k, hot, 20);
    map.forEach(([u, k]) => d.line(ux(u), 132, kx(k), 168, { stroke: C.line, single: true, sw: 0.9 }));
    d.cpu(x0 + 42, 222, 30); d.cpu(x0 + 118, 222, 30);
    for (let k = 0; k < Math.min(kt, 2); k++) d.line(kx(k), 192, x0 + 57 + k * 76, 220, { stroke: hot ? C.acc : C.gray, single: true, dash: [3, 3] });
    d.mono(x0 + w / 2, 290, `${Math.min(kt, 2)} of 2 cores busy`, { size: 10, color: hot ? C.acc : C.gray });
    for (let k = 0; k < Math.min(kt, 2); k++) d.travel([[kx(k), 192], [x0 + 57 + k * 76, 220]], { dur: 1.6, r: 2.6, color: hot ? C.acc : C.ink2 });
  });
  d.hand(320, 320, 'a blocking call in many-to-one stalls every thread', { size: 15 });
  return d.svg();
}
export function os_concurrency_parallel() {
const d=illustration('os_concurrency_parallel','TAKING TURNS AND RUNNING TOGETHER HAVE DIFFERENT SHAPES',300);
  d.cpu(36,82,48,{label:'core'});d.text(112,56,'concurrency on one core',{cls:'ttl',a:'start'});
  figShelf(d,114,89,['A','B','A','B','A','B'],{width:468,hot:2,height:35});
  d.cpu(36,177,48,{label:'core'});d.cpu(36,239,48,{label:'core'});
  d.text(112,154,'parallelism on separate cores',{cls:'ttl',a:'start'});
  figShelf(d,114,181,['A','A','A'],{width:468,hot:1,height:29});
  figShelf(d,114,243,['B','B','B'],{width:468,height:29});
  return d.svg();
}
export function os_race_counter() {
  const d = illustration('os_race_counter', `TWO THREADS READ ${n.counter_initial}, BOTH WRITE ${n.counter_lost}, AND ONE INCREMENT VANISHES`, 340);
  d.ram(250, 52, 140, 34); d.text(320, 104, 'shared counter in RAM', { cls: 'sm' });
  d.during([0, 0.62], (g) => g.box(286, 118, 68, 40, String(n.counter_initial), { fill: C.card, cls: 'mono', size: 18 }), { dur: 8 });
  d.during([0.62, 1], (g) => g.glow((h) => h.box(286, 118, 68, 40, String(n.counter_lost), { fill: C.accSoft, stroke: C.acc, cls: 'mono', size: 18 })), { dur: 8 });
  [['thread A', 70, 0.08, 0.5], ['thread B', 570, 0.2, 0.62]].forEach(([s, x, a, b]) => {
    d.person(x, 120, 32, { label: s });
    d.rect(x - 50, 190, 100, 54, { r: 4, fill: C.paper, stroke: C.ink2 }); d.text(x, 202, 'register', { cls: 'xs' });
    d.during([a, b - 0.12], (g) => g.mono(x, 225, String(n.counter_initial), { size: 15 }), { dur: 8 });
    d.during([b - 0.12, 1], (g) => g.mono(x, 225, String(n.counter_lost), { size: 15 }), { dur: 8 });
    const dir = x < 320 ? 1 : -1;
    d.travel([[320, 160], [x + dir * 52, 205]], { at: [a - 0.06, a], dur: 8, label: 'read', w: 36, fill: C.card, color: C.ink2 });
    d.travel([[x + dir * 52, 225], [320 - dir * 36, 152]], { at: [b - 0.08, b], dur: 8, label: 'write', w: 40 });
  });
  d.mono(320, 270, `expected ${n.counter_correct}`, { size: 12 }); d.line(270, 270, 370, 270, { stroke: C.acc, single: true, sw: 1.3 });
  d.mono(320, 292, `got ${n.counter_lost}`, { size: 14, color: C.acc });
  d.hand(320, 320, 'read, add, write is three steps, not one', { size: 15 });
  return d.svg();
}
export function os_critical_section() {
  const d = illustration('os_critical_section', 'A CRITICAL SECTION IS A ONE-PERSON ROOM WITH A FAIR QUEUE OUTSIDE', 330);
  d.rect(330, 60, 250, 190, { r: 6, fill: C.accFaint, stroke: C.acc, sw: 1.6 });
  d.text(455, 80, 'critical section', { cls: 'ttl', color: C.acc });
  d.fillRect(326, 140, 8, 48, C.paper); d.line(330, 140, 360, 128, { stroke: C.ink2, single: true, sw: 1.4 });
  d.glow((g) => g.person(455, 120, 40, { stroke: C.acc, fill: C.accSoft }));
  d.mono(455, 190, 'counter = counter + 1', { size: 10.5 });
  d.text(455, 216, 'mutual exclusion: at most one inside', { cls: 'sm' });
  [1, 2, 3].forEach((t, i) => { const x = 260 - i * 70; d.person(x, 138, 34); chip(d, x - 12, 188, 24, String(t), false, 18); });
  d.text(190, 232, 'bounded waiting: tickets are served in order', { cls: 'sm' });
  d.text(190, 104, 'progress: if the room is empty,\nsomeone gets in', { cls: 'sm', vc: true });
  d.shift(-70, 0, (g) => g.dot(260, 128, 3.2, C.acc), { at: [0.2, 0.6], dur: 4 });
  d.hand(320, 290, 'the work inside must look indivisible to everyone outside', { size: 15 });
  return d.svg();
}
export function os_atomic_ops() {
  const d = illustration('os_atomic_ops', 'COMPARE-AND-SWAP: WRITE 11 ONLY IF THE WORD STILL HOLDS 10', 350);
  d.person(70, 150, 36, { label: 'thread A' });
  d.rect(120, 110, 150, 84, { r: 5, fill: C.paper, stroke: C.ink2 });
  d.mono(140, 132, 'expected = 10', { a: 'start', size: 11 }); d.mono(140, 156, 'desired  = 11', { a: 'start', size: 11 }); d.mono(140, 180, 'CAS(&x, 10, 11)', { a: 'start', size: 11, color: C.acc });
  d.glow((g) => g.circle(330, 152, 54, { stroke: C.acc, fill: C.accSoft }));
  d.mono(330, 153, 'x == 10 ?', { size: 10.5 });
  d.arrow(272, 152, 302, 152, { stroke: C.ink2 });
  d.arrow(358, 132, 452, 82, { stroke: C.ink2 }); d.text(400, 92, 'yes', { cls: 'sm' });
  d.box(460, 58, 70, 42, '11', { fill: C.accSoft, stroke: C.acc, cls: 'mono', size: 16 }); d.text(495, 116, 'stored, returns true', { cls: 'sm' });
  d.arrow(358, 172, 452, 230, { stroke: C.ink2 }); d.text(392, 222, 'no', { cls: 'sm' });
  d.box(460, 208, 70, 42, '11', { fill: C.card, cls: 'mono', size: 16 }); d.text(495, 266, 'B already wrote 11', { cls: 'sm' });
  d.carrow([[460, 250], [330, 300], [150, 290], [140, 200]], { stroke: C.acc, dash: [4, 4] });
  d.text(300, 316, 'reload 11, retry with expected 11, desired 12', { cls: 'sm', color: C.acc });
  d.person(590, 210, 30, { label: 'thread B' });
  d.travel([[272, 152], [330, 152], [452, 82]], { at: [0, 0.4], dur: 6, r: 4 });
  d.travel([[330, 152], [452, 230], [330, 300], [150, 290], [140, 200]], { at: [0.5, 1], dur: 6, r: 4 });
  return d.svg();
}
export function os_mutex() {
  const d = illustration('os_mutex', 'A MUTEX HAS ONE OWNER; WAITERS SLEEP INSTEAD OF SPINNING', 330);
  d.rect(250, 60, 200, 170, { r: 6, fill: C.accFaint, stroke: C.acc });
  d.text(350, 80, 'protected data', { cls: 'ttl' });
  d.db(310, 96, 80, 60);
  d.glow((g) => g.lock(330, 172, 40, { stroke: C.acc, fill: C.accSoft }));
  d.box(380, 186, 54, 22, 'owner T1', { r: 4, fill: C.paper, stroke: C.acc, cls: 'mono', size: 9 });
  d.person(160, 130, 40, { label: 'T1 holds it', stroke: C.acc, fill: C.accSoft });
  d.arrow(186, 160, 244, 180, { stroke: C.acc }); d.text(210, 196, 'lock()', { cls: 'mono', size: 10 });
  d.text(560, 52, 'wait queue', { cls: 'ttl' });
  [0, 1].forEach((i) => sleeper(d, 530 + i * 50 - 25, 80 + i * 70));
  d.text(555, 236, 'asleep, using no CPU', { cls: 'sm' });
  d.carrow([[452, 210], [500, 250], [530, 176]], { stroke: C.ink2, dash: [4, 4] }); d.text(470, 262, 'unlock() wakes T2', { cls: 'mono', size: 10 });
  d.travel([[186, 160], [330, 192], [500, 250], [530, 176]], { dur: 6, label: 'own', w: 30 });
  d.hand(320, 300, 'only the owner may unlock', { size: 15 });
  return d.svg();
}
export function os_semaphore() {
const d=illustration('os_semaphore','TWO PERMITS ADMIT TWO USERS; THE NEXT USER WAITS',300);
  d.rect(228,54,194,183,{fill:C.paper,stroke:C.line});d.text(325,75,'resource slots',{cls:'ttl'});
  [117,325,533].forEach((x,i)=>{d.person(x,112,44,{stroke:i===2?C.ink2:C.acc});d.text(x,179,i===2?'waiter':'permit held',{cls:'sm'});});
  d.circle(286,211,31,{fill:C.accSoft,stroke:C.acc});d.circle(365,211,31,{fill:C.accSoft,stroke:C.acc});
  d.mono(286,211,'A');d.mono(365,211,'B');
  d.text(325,267,'2 permits − 1 − 1 = 0 available',{cls:'mono'});
  return d.svg();
}
export function os_condition() {
  const d = illustration('os_condition', 'WAIT ON A CONDITION IN A LOOP: WAKING UP IS NOT PROOF THE QUEUE HAS WORK', 360);
  d.rect(36, 60, 230, 120, { r: 5, fill: C.paper, stroke: C.ink2 });
  ['lock(m);', 'while (queue.empty())', '    wait(cv, m);', 'item = queue.pop();', 'unlock(m);'].forEach((s, i) => d.mono(50, 80 + i * 21, s, { a: 'start', size: 10.5, color: i === 1 ? C.acc : undefined }));
  d.glow((g) => g.carrow([[262, 103], [290, 115], [262, 124]], { stroke: C.acc, sw: 1.6 }));
  d.text(296, 113, 'recheck', { cls: 'sm', a: 'start', color: C.acc });
  d.text(452, 50, 'shared queue', { cls: 'ttl' });
  for (let i = 0; i < 5; i++) d.rect(372 + i * 34, 64, 30, 30, { r: 3, fill: C.card, stroke: C.ink2 });
  d.during([0.45, 0.8], (g) => g.envelope(377, 72, 20, 14, { fill: C.accSoft, stroke: C.acc }), { dur: 7 });
  d.person(400, 180, 34, { label: 'consumer' });
  d.during([0, 0.45], (g) => g.hand(424, 176, 'z z', { size: 14, a: 'start' }), { dur: 7 });
  d.person(560, 180, 34, { label: 'producer' });
  d.travel([[560, 176], [388, 80]], { at: [0.3, 0.45], dur: 7, token: 'packet' });
  d.travel([[540, 200], [430, 200]], { at: [0.45, 0.55], dur: 7, label: 'signal', w: 44 });
  d.text(320, 262, 'wait() releases the lock and sleeps in one atomic step,', { cls: 'sm' });
  d.text(320, 282, 'then takes the lock again before returning', { cls: 'sm' });
  d.hand(320, 326, 'another consumer may grab the item first', { size: 15 });
  return d.svg();
}
export function os_monitor() {
  const d = illustration('os_monitor', 'A MONITOR IS A ROOM: ONE THREAD INSIDE, A LINE AT THE DOOR, A BENCH FOR WAITERS', 340);
  d.rect(200, 50, 300, 210, { r: 8, fill: C.paper, stroke: C.ink2, sw: 1.4 });
  d.text(350, 70, 'monitor BoundedQueue', { cls: 'ttl' });
  d.glow((g) => g.rect(194, 130, 12, 50, { r: 2, fill: C.accSoft, stroke: C.acc }));
  d.text(180, 120, 'mutex door', { cls: 'sm', a: 'end', color: C.acc });
  [0, 1, 2].forEach((i) => d.person(150 - i * 46, 140, 30));
  d.text(100, 200, 'entry queue', { cls: 'sm' });
  d.person(300, 110, 36, { stroke: C.acc, fill: C.accSoft }); d.text(300, 164, 'active', { cls: 'xs' });
  d.rect(380, 96, 100, 64, { r: 4, fill: C.card, stroke: C.line }); d.text(430, 112, 'state', { cls: 'xs' });
  d.mono(430, 132, 'items[4]', { size: 10 }); d.mono(430, 148, 'count = 0', { size: 10 });
  d.mono(300, 200, 'put()   take()', { size: 10.5 });
  d.rect(520, 120, 100, 120, { r: 6, fill: C.card, stroke: C.line, dash: [4, 4] });
  d.text(570, 136, 'condition', { cls: 'xs' }); d.text(570, 150, 'not_empty', { cls: 'mono', size: 9.5 });
  sleeper(d, 560, 168);
  d.carrow([[502, 220], [530, 260], [600, 246]], { stroke: C.gray, hl: 6 });
  d.travel([[150, 155], [204, 155], [290, 130]], { dur: 4, r: 3.5 });
  d.hand(350, 300, 'callers just call put(); the exclusion is built in', { size: 15 });
  return d.svg();
}
export function os_sync_classics() {
  const d = illustration('os_sync_classics', 'THREE CLASSIC PUZZLES, THREE DIFFERENT WAYS TO GO WRONG', 340);
  const panel = (x, s, sub, hot) => { d.rect(x, 40, 192, 240, { r: 6, fill: hot ? C.accFaint : C.paper, stroke: hot ? C.acc : C.line }); d.text(x + 96, 58, s, { cls: 'ttl', color: hot ? C.acc : undefined }); d.text(x + 96, 262, sub, { cls: 'sm' }); };
  panel(18, 'producer-consumer', 'bounded slots: full and empty', false);
  d.person(44, 100, 26); d.person(184, 100, 26);
  for (let i = 0; i < 4; i++) d.rect(64 + i * 24, 160, 22, 22, { r: 2, fill: i < 2 ? C.card : C.paper, stroke: C.ink2 });
  d.line(60, 186, 164, 186, { stroke: C.ink2, single: true });
  d.travel([[44, 150], [76, 171], [184, 150]], { dur: 4, token: 'packet' });
  d.text(114, 210, '4 slots, 2 used', { cls: 'xs' });
  panel(224, 'readers-writers', 'many readers or one writer', false);
  d.doc(296, 120, 48, 60);
  [0, 1, 2].forEach((i) => d.person(258 + i * 22, 196, 20));
  d.person(390, 110, 26); d.hand(410, 100, '?', { size: 18 });
  d.text(320, 236, 'writer may starve', { cls: 'xs' });
  panel(430, 'dining philosophers', 'each holds one fork, waits for the next', true);
  const cx = 526, cy = 160;
  d.circle(cx, cy, 120, { fill: C.card, stroke: C.ink2 });
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + i * 2 * Math.PI / 5, b = a + Math.PI / 5;
    d.circle(cx + Math.cos(a) * 40, cy + Math.sin(a) * 40, 22, { fill: C.paper, stroke: C.line });
    d.circle(cx + Math.cos(a) * 76, cy + Math.sin(a) * 76, 16, { fill: C.accSoft, stroke: C.acc });
    d.line(cx + Math.cos(b) * 26, cy + Math.sin(b) * 26, cx + Math.cos(b) * 50, cy + Math.sin(b) * 50, { stroke: C.acc, sw: 1.8, single: true });
  }
  d.spin(cx, cy, (g) => g.glow((h) => h.dot(cx + 56, cy, 3, C.acc)), { dur: 6 });
  return d.svg();
}
export function os_deadlock() {
const d=illustration('os_deadlock','THE RESOURCE ALLOCATION GRAPH CONTAINS A CYCLE',330);
  d.circle(106,156,72,{fill:C.card});d.text(106,156,'P1',{cls:'ttl',size:17});
  d.circle(534,156,72,{fill:C.card});d.text(534,156,'P2',{cls:'ttl',size:17});
  d.lock(297,56,46);d.mono(320,124,'resource A');d.lock(297,230,46);d.mono(320,299,'resource B');
  d.arrow(290,85,147,138,{stroke:C.ink2});d.text(184,91,'A assigned to P1',{cls:'sm'});
  d.arrow(493,139,349,85,{stroke:C.acc});d.text(462,91,'P2 requests A',{cls:'sm',color:C.acc});
  d.arrow(148,175,290,254,{stroke:C.acc});d.text(180,247,'P1 requests B',{cls:'sm',color:C.acc});
  d.arrow(349,254,493,175,{stroke:C.ink2});d.text(467,247,'B assigned to P2',{cls:'sm'});
  d.hand(320,169,'neither owner can finish',{size:19});return d.svg();
}
export function os_deadlock_handling() {
  const d = illustration('os_deadlock_handling', 'FOUR STRATEGIES, PLACED BY WHEN THEY PAY: BEFORE, AT, OR AFTER ALLOCATION', 330);
  d.arrow(40, 200, 610, 200, { stroke: C.ink2 });
  [['design time', 110], ['each request', 320], ['after a hang', 530]].forEach(([s, x]) => { d.line(x, 192, x, 208, { stroke: C.ink2, single: true }); d.text(x, 222, s, { cls: 'xs' }); });
  d.doc(80, 70, 60, 76, { fill: C.card }); d.mono(110, 160, 'lock A < B', { size: 9.5 });
  d.text(110, 56, 'prevention', { cls: 'ttl' }); d.text(110, 252, 'break one condition,\ne.g. a global lock order', { cls: 'sm', vc: true });
  d.line(282, 80, 282, 170, { stroke: C.ink2, sw: 2, single: true }); d.line(358, 80, 358, 170, { stroke: C.ink2, sw: 2, single: true });
  d.glow((g) => g.line(282, 112, 358, 112, { stroke: C.acc, sw: 3, single: true }));
  d.mono(320, 140, 'safe?', { size: 11, color: C.acc });
  d.text(320, 56, 'avoidance', { cls: 'ttl', color: C.acc }); d.text(320, 252, 'grant only if a safe order\nstill exists; needs max claims', { cls: 'sm', vc: true });
  d.travel([[230, 150], [276, 150]], { dur: 3, r: 4 });
  d.circle(518, 110, 46, { stroke: C.ink2, fill: C.paper }); d.line(534, 126, 562, 156, { stroke: C.ink2, sw: 2.4, single: true });
  d.carrow([[504, 102], [518, 94], [530, 108]], { stroke: C.gray, hl: 5 }); d.carrow([[530, 118], [516, 126], [505, 114]], { stroke: C.gray, hl: 5 });
  d.text(530, 56, 'detect + recover', { cls: 'ttl' }); d.text(530, 252, 'find the cycle,\nkill or roll back a victim', { cls: 'sm', vc: true });
  d.text(320, 300, 'ignore it (most desktop OSes for app locks): accept a rare hang and restart', { cls: 'sm' });
  return d.svg();
}
export function os_banker() {
  const b = n.banker, names = ['A', 'B', 'C'];
  const d = illustration('os_banker', `BANKER: WITH ${b.available} FREE UNIT, ONLY B CAN FINISH FIRST, AND EACH FINISH REFILLS THE VAULT`, 350);
  const coin = (x, y, hot) => d.circle(x, y, 14, { fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2 });
  const hole = (x, y) => d.circle(x, y, 14, { stroke: C.gray, dash: [2, 2] });
  d.text(40, 50, 'process', { cls: 'xs', a: 'start' }); d.text(120, 50, 'holds', { cls: 'xs', a: 'start' }); d.text(200, 50, 'still needs', { cls: 'xs', a: 'start' });
  names.forEach((s, i) => {
    const y = 80 + i * 46, hot = s === 'B';
    d.text(52, y, s, { cls: 'ttl', color: hot ? C.acc : undefined });
    for (let k = 0; k < b.allocation[i]; k++) coin(126 + k * 18, y, false);
    for (let k = 0; k < b.need[i]; k++) hole(206 + k * 18, y);
    d.mono(260, y, `need ${b.need[i]}`, { size: 10, a: 'start' });
  });
  d.rect(30, 228, 240, 70, { r: 6, fill: C.paper, stroke: C.ink2 }); d.text(150, 244, 'vault: available', { cls: 'xs' });
  coin(150, 272, true);
  d.text(470, 46, 'safe order, work after each finish', { cls: 'ttl' });
  b.safe_sequence.forEach((s, i) => {
    const x = 360 + i * 92, y = 260;
    for (let k = 0; k < b.work[i + 1]; k++) coin(x + 30, y - k * 16, i === 0);
    d.mono(x + 30, y + 26, `work ${b.work[i + 1]}`, { size: 10.5, color: i === 0 ? C.acc : undefined });
    d.box(x + 10, 80, 40, 30, s, { fill: i === 0 ? C.accSoft : C.card, stroke: i === 0 ? C.acc : C.ink2, cls: 'ttl' });
    d.mono(x + 30, 124, `needs ${b.need[names.indexOf(s)]} ≤ ${b.work[i]}`, { size: 9.5 });
    if (i < 2) d.arrow(x + 56, 95, x + 98, 95, { stroke: C.gray, hl: 6 });
  });
  d.travel([[150, 272], [206, 126]], { at: [0, 0.3], dur: 6, r: 6 });
  d.hand(470, 160, 'finishing returns everything it held', { size: 14 });
  return d.svg();
}
export function os_starvation_livelock() {
  const d = illustration('os_starvation_livelock', 'NO PROGRESS COMES IN THREE SHAPES, AND AGING FIXES ONE OF THEM', 320);
  const panel = (x, s, sub, hot) => { d.rect(x, 40, 142, 224, { r: 6, fill: hot ? C.accFaint : C.paper, stroke: hot ? C.acc : C.line }); d.text(x + 71, 58, s, { cls: 'ttl', color: hot ? C.acc : undefined }); d.text(x + 71, 244, sub, { cls: 'sm', vc: true }); };
  panel(16, 'deadlock', 'everyone waits\non a held resource', false);
  d.person(50, 110, 30); d.person(124, 110, 30); d.key(40, 160, 22); d.key(116, 160, 22);
  d.carrow([[66, 118], [87, 96], [108, 118]], { stroke: C.gray, hl: 5 }); d.carrow([[108, 140], [87, 166], [66, 140]], { stroke: C.gray, hl: 5 });
  panel(174, 'starvation', 'one task is always\npassed over', true);
  d.glow((g) => g.person(200, 120, 30, { stroke: C.acc, fill: C.accSoft }));
  d.hand(200, 170, 'still waiting', { size: 13 });
  [0, 1, 2].forEach((i) => d.travel([[290, 90 + i * 30], [232, 90 + i * 30], [232, 70]], { at: [i / 3, i / 3 + 0.3], dur: 6, r: 4, color: C.ink2 }));
  panel(332, 'livelock', 'both keep moving,\nneither gets past', false);
  d.line(345, 90, 460, 90, { stroke: C.line, single: true }); d.line(345, 170, 460, 170, { stroke: C.line, single: true });
  d.shift(0, 40, (g) => g.person(370, 100, 28), { at: [0.2, 0.4], back: true, dur: 2 });
  d.shift(0, 40, (g) => g.person(436, 100, 28), { at: [0.2, 0.4], back: true, dur: 2 });
  panel(490, 'aging', 'priority rises\nwith waiting time', false);
  d.axes(520, 90, 90, 100, { xl: 'wait', yl: 'priority' });
  d.lines([[522, 186], [610, 98]], { stroke: C.acc, sw: 1.5 });
  return d.svg();
}
export function os_schedule_metrics() {
  const r = n.schedules.fcfs.rows[1], tl = n.schedules.fcfs.timeline;
  const d = illustration('os_schedule_metrics', `FCFS: B ARRIVES AT ${r.arrival}, STARTS AT ${r.response + r.arrival}, FINISHES AT ${r.completion}`, 330);
  const X = (t) => 60 + t * 58;
  tl.forEach(([s, a, b]) => d.box(X(a), 140, X(b) - X(a), 44, s, { r: 3, fill: s === 'B' ? C.accSoft : C.card, stroke: s === 'B' ? C.acc : C.ink2, cls: 'ttl' }));
  for (let t = 0; t <= 9; t++) { d.line(X(t), 188, X(t), 194, { stroke: C.gray, single: true }); d.mono(X(t), 206, String(t), { size: 10 }); }
  d.text(X(9) + 20, 206, 'ms', { cls: 'xs', a: 'start' });
  n.jobs.forEach(([s, a]) => { d.arrow(X(a), 96, X(a), 134, { stroke: s === 'B' ? C.acc : C.gray, hl: 6 }); d.text(X(a), 86, `${s} arrives`, { cls: 'xs' }); });
  d.glow((g) => g.brace(X(r.arrival), X(r.arrival + r.response), 230, { stroke: C.acc }));
  d.text((X(1) + X(5)) / 2, 252, `waiting = ${r.turnaround} - ${r.burst} = ${r.waiting}`, { cls: 'mono', size: 10.5, color: C.acc });
  d.brace(X(r.arrival), X(r.completion), 274, {});
  d.text((X(1) + X(8)) / 2, 296, `turnaround = ${r.completion} - ${r.arrival} = ${r.turnaround}`, { cls: 'mono', size: 10.5 });
  d.text(X(5), 62, 'response = first run - arrival = 4', { cls: 'sm', a: 'start' });
  d.travel([[X(0), 120], [X(9), 120]], { dur: 6, r: 3, color: C.ink2 });
  return d.svg();
}
export function os_schedule_fcfs() {
const spans=[[0, 5, "A"], [5, 8, "B"], [8, 9, "C"]],d=illustration('os_schedule_fcfs','FCFS: THE FIRST LONG BURST MAKES LATER JOBS WAIT',290),X=t=>68+t*58;
  d.text(36,89,'CPU',{cls:'ttl'});
  spans.forEach(([a,b,s],i)=>{d.rect(X(a),68,(b-a)*58,45,{r:0,fill:i===0?C.accSoft:C.card,stroke:i===0?C.acc:C.ink2});d.mono((X(a)+X(b))/2,90,s,{size:13});});
  for(let t=0;t<=9;t++){d.line(X(t),119,X(t),126,{stroke:C.gray,single:true});d.mono(X(t),143,t,{size:10});}
  const arrivals={A:0,B:1,C:2},bursts={A:5,B:3,C:1};
  Object.keys(arrivals).forEach((s,i)=>{const row=180+i*30,finish=Math.max(...spans.filter(v=>v[2]===s).map(v=>v[1])),wait=finish-arrivals[s]-bursts[s];d.mono(43,row,s);d.line(X(arrivals[s]),row,X(finish),row,{stroke:C.line,single:true,sw:2});spans.filter(v=>v[2]===s).forEach(([a,b])=>d.line(X(a),row,X(b),row,{stroke:s==='C'?C.acc:C.ink2,single:true,sw:8}));d.text(614,row,`wait ${wait} ms`,{cls:'sm',a:'end',size:10});});
  d.text(320,276,'thin span: lifetime; thick span: time actually on the core',{cls:'sm'});return d.svg();
}
export function os_schedule_sjf() {
const spans=[[0, 5, "A"], [5, 6, "C"], [6, 9, "B"]],d=illustration('os_schedule_sjf','SJF: PICK THE SHORTEST AVAILABLE JOB AFTER A FINISHES',290),X=t=>68+t*58;
  d.text(36,89,'CPU',{cls:'ttl'});
  spans.forEach(([a,b,s],i)=>{d.rect(X(a),68,(b-a)*58,45,{r:0,fill:i===1?C.accSoft:C.card,stroke:i===1?C.acc:C.ink2});d.mono((X(a)+X(b))/2,90,s,{size:13});});
  for(let t=0;t<=9;t++){d.line(X(t),119,X(t),126,{stroke:C.gray,single:true});d.mono(X(t),143,t,{size:10});}
  const arrivals={A:0,B:1,C:2},bursts={A:5,B:3,C:1};
  Object.keys(arrivals).forEach((s,i)=>{const row=180+i*30,finish=Math.max(...spans.filter(v=>v[2]===s).map(v=>v[1])),wait=finish-arrivals[s]-bursts[s];d.mono(43,row,s);d.line(X(arrivals[s]),row,X(finish),row,{stroke:C.line,single:true,sw:2});spans.filter(v=>v[2]===s).forEach(([a,b])=>d.line(X(a),row,X(b),row,{stroke:s==='C'?C.acc:C.ink2,single:true,sw:8}));d.text(614,row,`wait ${wait} ms`,{cls:'sm',a:'end',size:10});});
  d.text(320,276,'thin span: lifetime; thick span: time actually on the core',{cls:'sm'});return d.svg();
}
export function os_schedule_srtf() {
const spans=[[0, 1, "A"], [1, 2, "B"], [2, 3, "C"], [3, 5, "B"], [5, 9, "A"]],d=illustration('os_schedule_srtf','SRTF: SHORTER REMAINING WORK PREEMPTS THE CURRENT JOB',290),X=t=>68+t*58;
  d.text(36,89,'CPU',{cls:'ttl'});
  spans.forEach(([a,b,s],i)=>{d.rect(X(a),68,(b-a)*58,45,{r:0,fill:i===2?C.accSoft:C.card,stroke:i===2?C.acc:C.ink2});d.mono((X(a)+X(b))/2,90,s,{size:13});});
  for(let t=0;t<=9;t++){d.line(X(t),119,X(t),126,{stroke:C.gray,single:true});d.mono(X(t),143,t,{size:10});}
  const arrivals={A:0,B:1,C:2},bursts={A:5,B:3,C:1};
  Object.keys(arrivals).forEach((s,i)=>{const row=180+i*30,finish=Math.max(...spans.filter(v=>v[2]===s).map(v=>v[1])),wait=finish-arrivals[s]-bursts[s];d.mono(43,row,s);d.line(X(arrivals[s]),row,X(finish),row,{stroke:C.line,single:true,sw:2});spans.filter(v=>v[2]===s).forEach(([a,b])=>d.line(X(a),row,X(b),row,{stroke:s==='C'?C.acc:C.ink2,single:true,sw:8}));d.text(614,row,`wait ${wait} ms`,{cls:'sm',a:'end',size:10});});
  d.text(320,276,'thin span: lifetime; thick span: time actually on the core',{cls:'sm'});return d.svg();
}
export function os_schedule_rr() {
const spans=[[0, 2, "A"], [2, 4, "B"], [4, 5, "C"], [5, 7, "A"], [7, 8, "B"], [8, 9, "A"]],d=illustration('os_schedule_rr','ROUND ROBIN: THE TWO MILLISECOND QUANTUM ROTATES THE CORE',290),X=t=>68+t*58;
  d.text(36,89,'CPU',{cls:'ttl'});
  spans.forEach(([a,b,s],i)=>{d.rect(X(a),68,(b-a)*58,45,{r:0,fill:i===0?C.accSoft:C.card,stroke:i===0?C.acc:C.ink2});d.mono((X(a)+X(b))/2,90,s,{size:13});});
  for(let t=0;t<=9;t++){d.line(X(t),119,X(t),126,{stroke:C.gray,single:true});d.mono(X(t),143,t,{size:10});}
  const arrivals={A:0,B:1,C:2},bursts={A:5,B:3,C:1};
  Object.keys(arrivals).forEach((s,i)=>{const row=180+i*30,finish=Math.max(...spans.filter(v=>v[2]===s).map(v=>v[1])),wait=finish-arrivals[s]-bursts[s];d.mono(43,row,s);d.line(X(arrivals[s]),row,X(finish),row,{stroke:C.line,single:true,sw:2});spans.filter(v=>v[2]===s).forEach(([a,b])=>d.line(X(a),row,X(b),row,{stroke:s==='C'?C.acc:C.ink2,single:true,sw:8}));d.text(614,row,`wait ${wait} ms`,{cls:'sm',a:'end',size:10});});
  d.text(320,276,'thin span: lifetime; thick span: time actually on the core',{cls:'sm'});return d.svg();
}
export function os_preemption_multicore() {
  const d = illustration('os_preemption_multicore', 'A TIMER ENDS EACH SLICE; MIGRATION BALANCES CORES BUT LEAVES A WARM CACHE BEHIND', 340);
  d.clock(70, 90, 54, { spin: 2 }); d.text(70, 132, 'timer tick', { cls: 'xs' });
  d.path('M100,90 L118,104 L110,108 L128,126', { stroke: C.ink2, sw: 1.6, single: true });
  [0, 1].forEach((c) => {
    const y = 60 + c * 130;
    d.cpu(160, y + 10, 50, { label: `core ${c}` });
    d.text(250, y, 'run queue', { cls: 'xs', a: 'start' });
    const tasks = c === 0 ? ['A', 'B', 'C', 'D'] : ['E'];
    tasks.forEach((s, i) => chip(d, 250 + i * 40, y + 10, 34, s, c === 0 && i === 3, 22));
    d.rect(250, y + 44, 120, 36, { r: 4, fill: C.paper, stroke: C.line }); d.text(310, y + 54, 'L1/L2 cache', { cls: 'xs' });
    for (let k = 0; k < 6; k++) d.fillRect(256 + k * 18, y + 64, 14, 10, c === 0 ? C.acc : C.faint, c === 0 ? 0.55 : 1, 1);
  });
  d.glow((g) => g.carrow([[392, 82], [440, 140], [392, 200]], { stroke: C.acc, sw: 1.8 }));
  d.text(450, 132, 'migrate D', { cls: 'ttl', a: 'start', color: C.acc });
  d.text(450, 152, 'core 1 was idle, but D\'s\ncache lines stay on core 0', { cls: 'sm', a: 'start', vc: true });
  d.travel([[384, 82], [440, 140], [370, 200]], { dur: 4, label: 'D', w: 22 });
  d.text(320, 312, 'affinity keeps a task on its warm core unless the imbalance is worth the cold start', { cls: 'sm' });
  return d.svg();
}
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
  const table = [5, 'absent', 14, n.frame, 'absent', 2];
  table.forEach((f, i) => {
    const y = 128 + i * 24, hot = i === n.vpn;
    d.rect(150, y, 50, 24, { r: 0, fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2, sw: 0.9 });
    d.rect(200, y, 70, 24, { r: 0, fill: hot ? C.accSoft : C.paper, stroke: hot ? C.acc : C.ink2, sw: 0.9 });
    d.mono(175, y + 12, String(i), { size: 10 });
    d.mono(235, y + 12, String(f), { size: 10, color: f === 'absent' ? C.gray : undefined });
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
export function os_contiguous_alloc() {
const d=illustration('os_contiguous_alloc','UNUSED SPACE INSIDE A BLOCK DIFFERS FROM HOLES BETWEEN BLOCKS',300);
  d.text(35,55,'internal fragmentation',{cls:'ttl',a:'start'});
  d.rect(35,83,570,49,{r:0,fill:C.card,stroke:C.ink2});d.fillRect(36,84,380,47,C.faint);d.fillRect(416,84,188,47,C.accSoft);
  d.text(226,108,'used bytes',{cls:'mono'});d.text(510,108,'allocated, unused',{cls:'sm',color:C.acc});
  d.text(35,176,'external fragmentation',{cls:'ttl',a:'start'});
  const chunks=[['used',145],['free',65],['used',95],['free',55],['used',140],['free',70]];let x=35;
  chunks.forEach(([s,w])=>{d.rect(x,202,w,49,{r:0,fill:s==='free'?C.accSoft:C.card,stroke:s==='free'?C.acc:C.ink2});d.text(x+w/2,226,s,{cls:'sm'});x+=w;});
  d.hand(320,278,'free bytes can exist without one large enough hole',{size:17});return d.svg();
}
export function os_paging() {
  const d = illustration('os_paging', 'CONSECUTIVE VIRTUAL PAGES CAN LIVE IN SCATTERED PHYSICAL FRAMES', 370);
  d.text(101, 48, 'virtual pages', { cls: 'ttl' }); d.text(462, 48, 'physical frames', { cls: 'ttl' });
  const targets = [4, 1, 5, 0];
  targets.forEach((f, i) => figPage(d, 63, 80 + i * 64, 76, 45, `page ${i}`, i === 2));
  for (let i = 0; i < 6; i++) figPage(d, 365 + i % 2 * 129, 80 + Math.floor(i / 2) * 82, 90, 60, `frame ${i}`, i === 5);
  d.rect(214, 120, 70, 120, { r: 4, fill: C.paper, stroke: C.ink2 }); d.text(249, 136, 'page table', { cls: 'xs' });
  targets.forEach((f, i) => { d.mono(249, 160 + i * 20, `${i} → ${f}`, { size: 10, color: i === 2 ? C.acc : undefined }); });
  targets.forEach((f, i) => {
    const x = 365 + f % 2 * 129, y = 110 + Math.floor(f / 2) * 82, hot = i === 2;
    const p = [[145, 102 + i * 64], [214, 160 + i * 20], [284, 160 + i * 20], [x - 7, y]];
    d.carrow(p, { stroke: hot ? C.acc : C.line, hl: 5 });
    d.travel(p, { at: [i / 4, i / 4 + 0.22], dur: 8, token: (g) => g.doc(-9, -11, 18, 22, { lines: false, fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2 }) });
  });
  d.glow((g) => g.rect(363, 241, 94, 64, { r: 4, stroke: C.acc, sw: 1.3 }));
  d.hand(320, 337, 'the page table joins the two views', { size: 18 });
  return d.svg();
}
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
const hit=n.tlb_ns+n.memory_ns,miss=n.tlb_ns+2*n.memory_ns;
  const d=illustration('os_tlb','THE TLB CACHES A TRANSLATION; A MISS READS THE PAGE TABLE FIRST',425);
  d.cpu(37,103,63,{label:'CPU'});d.mono(68,194,`VPN ${n.vpn}`,{size:11});
  d.rect(193,63,169,132,{fill:C.card,stroke:C.ink2,r:3});d.text(277,86,'TLB',{cls:'ttl'});
  figShelf(d,207,108,['VPN','frame'],{width:141,height:25});figShelf(d,207,140,[n.vpn,n.frame],{width:141,hot:1,height:33});d.glow(g=>g.rect(277,140,71,33,{r:2,stroke:C.acc,sw:1.4}));
  d.text(277,213,`${n.tlb_ns} ns lookup`,{cls:'sm'});
  d.text(522,49,'physical RAM',{cls:'ttl'});
  for(let i=0;i<5;i++){
    const frame=7+i,y=74+i*43,hot=frame===n.frame;
    figPage(d,460,y,122,34,`frame ${frame}`,hot);
  }
  d.arrow(107,134,185,134,{stroke:C.ink2});d.carrow([[369,149],[409,149],[451,177]],{stroke:C.ink2,hl:6});
  d.text(410,113,'hit',{cls:'ttl'});
  d.doc(200,279,159,87,{lines:false,fill:C.accFaint,stroke:C.acc});d.text(279,300,'page table in RAM',{cls:'ttl',size:11});d.mono(279,334,`VPN ${n.vpn} → frame ${n.frame}`,{size:11});
  d.arrow(279,225,279,271,{stroke:C.acc,dash:[4,4]});d.text(298,246,'miss',{cls:'ttl',color:C.acc,a:'start'});
  d.carrow([[366,329],[411,329],[449,198]],{stroke:C.acc,hl:6,dash:[4,4]});
  d.text(489,304,`${n.memory_ns} ns per memory access`,{cls:'sm'});
  d.mono(110,338,`hit: ${hit} ns`,{size:12});d.mono(110,363,`miss: ${miss} ns`,{size:12,color:C.acc});
  d.mono(320,400,`${n.tlb_hit_rate} × ${hit} + ${+(1-n.tlb_hit_rate).toFixed(1)} × ${miss} = ${n.effective_ns} ns`,{size:13});
  d.travel([[279,225],[279,271]],{at:[.18,.4],dur:8,r:4});d.travel('M366,329 Q411,329 449,198',{at:[.42,.72],dur:8,r:4});return d.svg();
}
export function os_virtual_memory() {
const d=illustration('os_virtual_memory','PRIVATE ADDRESS SPACES CAN SHARE A FRAME OR LEAVE A PAGE ABSENT',358);
  ['process A','physical RAM','process B'].forEach((s,i)=>d.text([110,320,530][i],51,s,{cls:'ttl'}));
  for(let i=0;i<4;i++){
    figPage(d,74,80+i*57,72,43,`VA ${i}`,i===1);
    figPage(d,494,80+i*57,72,43,`VA ${i}`,i===1);
    if(i<3)figPage(d,278,86+i*64,84,43,i===1?'shared':'private',i===1);
  }
  [[146,101,278,108],[146,158,278,172],[494,158,362,172],[494,101,362,236]].forEach(p=>d.arrow(...p,{stroke:p[1]===158?C.acc:C.line,hl:6}));
  d.text(322,294,'not every virtual page is resident',{cls:'sm'});d.text(530,324,'absent page → fault',{cls:'sm',color:C.acc});return d.svg();
}
export function os_demand_paging() {
const d=illustration('os_demand_paging','A VALID MISSING PAGE IS LOADED BEFORE THE INSTRUCTION RETRIES',365);
  d.cpu(36,94,65,{label:'CPU'});d.text(68,179,'faulting instruction',{cls:'sm'});
  figPage(d,225,78,97,113,'not present',true);d.mono(273,211,'page-table entry');
  d.disk(513,112,100,{label:'backing file'});
  d.ram(405,268,195,46,{chips:4,chip:i=>i===2?C.accSoft:C.paper});d.text(503,330,'resident frame',{cls:'ttl'});
  d.arrow(107,122,218,122,{stroke:C.acc});d.text(162,104,'page fault',{cls:'sm'});
  d.carrow([[326,132],[370,132],[405,290]],{stroke:C.acc});d.text(353,231,'validate + allocate',{cls:'sm',size:10});
  d.arrow(513,178,513,258,{stroke:C.ink2});d.text(533,220,'load bytes',{cls:'sm',a:'start'});
  d.carrow([[403,300],[176,303],[68,172]],{stroke:C.ink2,hl:7});d.text(201,322,'map frame, retry same instruction',{cls:'sm'});
  d.travel([[513,178],[513,258]],{at:[.25,.5],token:'packet',dur:8});return d.svg();
}
export function os_replacement_fifo() {
const trace=n.replacement.fifo_3.trace,d=illustration('os_replacement_fifo','FIFO REPLACEMENT, ONE COLUMN PER PAGE REFERENCE',370);
  const cw=44,x=71,y=95;
  d.text(24,63,'page',{cls:'sm',a:'start'});d.text(23,242,'fault?',{cls:'sm',a:'start'});
  trace.forEach((s,i)=>{d.mono(x+i*cw+cw/2,63,s.page,{size:11});s.frames.forEach((p,r)=>{d.rect(x+i*cw,y+r*40,cw,40,{r:0,fill:s.miss?C.accFaint:C.card,stroke:C.line});d.mono(x+i*cw+cw/2,y+r*40+20,p??'',{size:11});});if(s.miss)d.dot(x+i*cw+cw/2,242,4,C.acc);});
  d.text(320,288,`${trace.filter(s=>s.miss).length} faults in ${trace.length} references`,{cls:'ttl'});
  d.hand(320,326,'a hit leaves the arrival order unchanged',{size:17});return d.svg();
}
export function os_replacement_compare() {
  const R = n.replacement, refs = n.refs;
  const rows = [['FIFO, 3 frames', R.fifo_3], ['FIFO, 4 frames', R.fifo_4], ['LRU, 3 frames', R.lru_3], ['OPT, 3 frames', R.opt_3]];
  const d = illustration('os_replacement_compare', `BELADY'S ANOMALY: FIFO FAULTS ${R.fifo_3.faults} TIMES WITH 3 FRAMES, ${R.fifo_4.faults} WITH 4`, 300);
  refs.forEach((p, i) => d.mono(176 + i * 34, 52, String(p), { size: 12 }));
  d.text(160, 52, 'reference', { cls: 'xs', a: 'end' });
  rows.forEach(([s, r], k) => {
    const y = 86 + k * 46, hot = k === 1;
    if (hot) d.fillRect(20, y - 18, 600, 38, C.accFaint, 1, 4);
    d.text(160, y, s, { cls: 'sm', a: 'end', color: hot ? C.acc : undefined });
    r.trace.forEach((t, i) => {
      const x = 176 + i * 34;
      if (t.miss) d.circle(x, y, 18, { fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2 });
      else d.dot(x, y, 2, C.gray);
    });
    d.mono(600, y, String(r.faults), { size: 13, color: hot ? C.acc : undefined, a: 'end' });
  });
  d.text(600, 64, 'faults', { cls: 'xs', a: 'end' });
  d.glow((g) => g.mono(600, 132, String(R.fifo_4.faults), { size: 13, color: C.acc, a: 'end' }));
  d.travel([[176, 70], [176 + 11 * 34, 70]], { dur: 6, r: 3, color: C.ink2 });
  d.hand(320, 278, 'circle = page fault; dot = hit', { size: 15 });
  return d.svg();
}
export function os_thrashing() {
const d=illustration('os_thrashing','WHEN THE WORKING SET DOES NOT FIT, USEFUL PAGES KEEP TRADING PLACES',335);
  d.text(141,48,'working set',{cls:'ttl'});['A','B','C','D'].forEach((s,i)=>figPage(d,34+i*72,76,58,77,s,i===3));
  d.text(478,48,'available frames',{cls:'ttl'});figShelf(d,367,87,['A','B','C'],{width:239,height:59});
  d.disk(478,249,92,{label:'backing storage'});
  d.carrow([[553,160],[589,200],[536,230]],{stroke:C.acc});d.text(604,192,'evict',{cls:'sm',a:'end',color:C.acc});
  d.carrow([[423,231],[377,194],[414,162]],{stroke:C.acc});d.text(371,191,'load',{cls:'sm',a:'end',color:C.acc});
  d.arrow(289,115,357,115,{stroke:C.acc});d.text(323,94,'fault',{cls:'sm'});
  d.hand(145,248,'more page traffic,\nless useful execution',{size:18,vc:true});return d.svg();
}
export function os_segmentation() {
  const d = illustration('os_segmentation', 'SEGMENTS ARE THE NAMES PROGRAMMERS SEE; PAGES BENEATH THEM DECIDE WHERE BYTES LAND', 340);
  d.text(110, 46, 'logical segments', { cls: 'ttl' });
  const segs = [['code', 2, 'r-x'], ['heap', 3, 'rw-'], ['stack', 2, 'rw-']];
  let y = 62; const pagesAt = [];
  segs.forEach(([s, p, perm]) => {
    d.rect(50, y, 120, p * 26, { r: 4, fill: C.card, stroke: C.ink2 });
    d.text(110, y + p * 13 - 6, s, { cls: 'ttl' }); d.mono(110, y + p * 13 + 10, perm, { size: 9.5 });
    for (let k = 0; k < p; k++) { d.line(170, y + 13 + k * 26, 176, y + 13 + k * 26, { stroke: C.gray, single: true }); pagesAt.push([176, y + 13 + k * 26]); }
    y += p * 26 + 16;
  });
  d.text(500, 46, 'physical frames', { cls: 'ttl' });
  const frames = [6, 1, 9, 3, 11, 4, 8];
  for (let f = 0; f < 12; f++) { const x = 400 + (f % 4) * 52, yy = 62 + Math.floor(f / 4) * 62; d.rect(x, yy, 44, 50, { r: 2, fill: frames.includes(f) ? C.accSoft : C.paper, stroke: frames.includes(f) ? C.acc : C.line }); d.mono(x + 22, yy + 25, String(f), { size: 9.5 }); }
  pagesAt.forEach(([x, yy], i) => { const f = frames[i], fx = 400 + (f % 4) * 52, fy = 62 + Math.floor(f / 4) * 62; d.carrow([[x, yy], [290, yy], [fx - 4, fy + 25]], { stroke: C.line, hl: 5 }); });
  d.glow((g) => g.rect(386, 52, 222, 196, { r: 6, stroke: C.acc, sw: 1.2 }));
  d.travel([[176, 75], [290, 75], [396, 211]], { dur: 4, r: 3.5 });
  d.text(497, 270, 'paging beneath: any free frame fits,\nso no external holes', { cls: 'sm', vc: true, color: C.acc });
  d.text(110, 300, 'segments carry the permissions', { cls: 'sm' });
  return d.svg();
}
export function os_cow() {
const d=illustration('os_cow','FORK SHARES PHYSICAL PAGES; A WRITE CREATES ONE PRIVATE COPY',400);
  d.text(118,50,'parent map',{cls:'ttl'});d.text(523,50,'child map',{cls:'ttl'});d.text(320,50,'physical frames',{cls:'ttl'});
  for(let i=0;i<8;i++){
    const y=74+i*32,hot=i===7;
    d.rect(76,y,85,23,{r:0,fill:C.card,stroke:C.line});d.mono(118,y+12,`page ${i}`,{size:10});
    d.rect(479,y,85,23,{r:0,fill:hot?C.accSoft:C.card,stroke:hot?C.acc:C.line});d.mono(522,y+12,`page ${i}`,{size:10});
    figPage(d,278,y-2,83,27,`frame ${i}`,false);
    d.arrow(167,y+12,271,y+12,{stroke:C.line,hl:5});
    if(!hot)d.arrow(473,y+12,368,y+12,{stroke:C.line,hl:5});
    else {figPage(d,383,y-2,67,27,'copy',true);d.arrow(473,y+12,456,y+12,{stroke:C.acc,hl:5});d.arrow(366,y+12,379,y+12,{stroke:C.acc,hl:4,dash:[3,3]});}
  }
  d.mono(320,351,`before write: ${n.cow_before_bytes.toLocaleString('en-US')} B; after: ${n.cow_after_bytes.toLocaleString('en-US')} B`,{size:12});
  d.hand(320,379,'seven shared pages, one extra physical page',{size:17});
  return d.svg();
}
export function os_mmap() {
  const d = illustration('os_mmap', 'MMAP: A FILE RANGE BECOMES ADDRESSES, AND PAGES ARRIVE ONLY WHEN TOUCHED', 350);
  d.text(90, 44, 'file on disk', { cls: 'ttl' });
  for (let i = 0; i < 4; i++) { d.doc(50, 58 + i * 58, 80, 48, { lines: false, fill: i === 2 ? C.accSoft : C.card, stroke: i === 2 ? C.acc : C.ink2 }); d.mono(90, 84 + i * 58, `off ${i * 4096}`, { size: 9 }); }
  d.text(320, 44, 'virtual address space', { cls: 'ttl' });
  d.rect(260, 58, 120, 230, { r: 3, fill: C.paper, stroke: C.ink2 });
  d.glow((g) => g.rect(266, 112, 108, 120, { r: 2, fill: C.accFaint, stroke: C.acc }));
  for (let i = 1; i < 4; i++) d.line(266, 112 + i * 30, 374, 112 + i * 30, { stroke: C.acc, single: true, sw: 0.6 });
  d.text(320, 104, 'mapped region', { cls: 'xs' });
  d.mono(320, 186, 'p[8192]', { size: 10 });
  [0, 1, 2, 3].forEach((i) => d.line(132, 82 + i * 58, 264, 127 + i * 30, { stroke: C.line, single: true, sw: 0.8, dash: [3, 3] }));
  d.text(530, 44, 'RAM', { cls: 'ttl' }); d.ram(470, 58, 120, 40);
  for (let i = 0; i < 3; i++) d.rect(480 + i * 36, 130, 30, 40, { r: 2, fill: C.card, stroke: C.line });
  d.during([0.45, 1], (g) => g.rect(552, 130, 30, 40, { r: 2, fill: C.accSoft, stroke: C.acc }), { dur: 7 });
  d.path('M380,186 L420,176 L412,194 L452,184', { stroke: C.acc, sw: 1.8, single: true });
  d.text(416, 214, 'page fault', { cls: 'sm', color: C.acc });
  d.travel([[130, 198], [230, 300], [567, 300], [567, 174]], { at: [0.15, 0.45], dur: 7, token: 'packet' });
  d.carrow([[540, 176], [500, 240], [140, 230]], { stroke: C.gray, dash: [4, 4], hl: 6 }); d.text(470, 256, 'dirty page written back later', { cls: 'xs' });
  d.hand(320, 330, 'loads and stores, no read() calls', { size: 15 });
  return d.svg();
}
export function os_heap_stack() {
  const d = illustration('os_heap_stack', 'THE STACK IS A PILE OF CALL FRAMES; THE HEAP IS BLOCKS YOU MUST HAND BACK', 340);
  d.text(150, 44, 'stack (call-scoped)', { cls: 'ttl', color: C.acc });
  d.fillRect(70, 58, 160, 20, C.faint, 1, 2); d.text(150, 68, 'guard page: overflow faults here', { cls: 'xs' });
  ['main()', 'handle()', 'parse()'].forEach((s, i) => d.box(80, 224 - i * 44, 140, 38, s, { fill: i === 2 ? C.accSoft : C.card, stroke: i === 2 ? C.acc : C.ink2, cls: 'mono', size: 11 }));
  d.during([0, 0.5], (g) => g.glow((h) => h.box(80, 92, 140, 38, 'log()', { fill: C.accSoft, stroke: C.acc, cls: 'mono', size: 11 })), { dur: 4 });
  d.text(150, 290, 'return pops the frame: free in O(1)', { cls: 'sm' });
  d.text(470, 44, 'heap (explicit lifetime)', { cls: 'ttl' });
  const blocks = [[340, 70, 90, 'used', 1], [436, 70, 50, 'free', 0], [492, 70, 110, 'used', 1], [340, 140, 60, 'free', 0], [406, 140, 120, 'used', 1], [532, 140, 70, 'free', 0], [340, 210, 150, 'used', 1], [496, 210, 106, 'leaked?', 2]];
  blocks.forEach(([x, y, w, s, used]) => {
    d.rect(x, y, w, 46, { r: 3, fill: used === 1 ? C.card : C.paper, stroke: used === 2 ? C.gray : C.ink2, dash: used ? undefined : [3, 3] });
    d.fillRect(x + 2, y + 2, 10, 42, C.faint, 1, 1);
    d.text(x + w / 2 + 5, y + 23, s, { cls: 'xs' });
  });
  d.text(470, 284, 'grey strip: allocator header with size', { cls: 'sm' });
  d.text(470, 302, 'malloc() searches free blocks; free() returns one', { cls: 'sm' });
  return d.svg();
}
export function os_filesystem() {
const d=illustration('os_filesystem','A DIRECTORY NAME LEADS TO AN INODE, THEN TO DATA BLOCKS',345);
  d.doc(37,85,159,169,{lines:false});d.text(116,107,'directory',{cls:'ttl'});
  [['notes', 'inode A'],['server.log','inode B'],['config','inode C']].forEach(([s,n],i)=>{d.text(50,137+i*34,s,{cls:'mono',a:'start',size:10,color:i===1?C.acc:C.ink2});d.text(183,151+i*34,n,{cls:'xs',a:'end'});});
  d.doc(265,80,138,181,{lines:false,fill:C.accSoft,stroke:C.acc});d.text(334,101,'inode B',{cls:'ttl'});
  ['owner / mode','size / times','block pointers'].forEach((s,i)=>d.text(334,134+i*36,s,{cls:'mono',size:10}));
  d.arrow(202,172,258,172,{stroke:C.acc});
  ['bytes','bytes','bytes'].forEach((s,i)=>{figPage(d,490,64+i*77,90,54,s);d.arrow(410,210,483,91+i*77,{stroke:C.line,hl:5});});
  d.hand(320,309,'the name and the file contents live in different structures',{size:17});return d.svg();
}
export function os_fd_table() {
const d=illustration('os_fd_table','LOCAL DESCRIPTORS CAN REFER TO ONE SHARED OPEN FILE DESCRIPTION',325);
  d.text(97,50,'process A',{cls:'ttl'});d.text(97,218,'process B',{cls:'ttl'});
  figShelf(d,37,78,['0','1','2','3'],{width:160,hot:3});figShelf(d,37,240,['0','1','2','3'],{width:160,hot:3});
  d.doc(282,118,146,115,{lines:false,fill:C.accSoft,stroke:C.acc});d.text(355,140,'open file',{cls:'ttl'});d.mono(355,168,'offset');d.mono(355,192,'flags');
  d.arrow(184,118,275,156,{stroke:C.acc});d.arrow(184,236,275,195,{stroke:C.acc});
  d.doc(510,139,86,75,{lines:false});d.text(553,179,'inode',{cls:'mono'});d.arrow(435,177,503,177,{stroke:C.ink2});
  d.text(355,276,'fork / dup can share the offset',{cls:'sm'});return d.svg();
}
export function os_inode_links() {
  const d = illustration('os_inode_links', 'A NAME POINTS AT AN INODE; A HARD LINK IS A SECOND NAME, A SYMLINK IS A NOTE WITH A PATH', 330);
  d.text(110, 46, 'directory /data', { cls: 'ttl' });
  d.rect(30, 60, 160, 150, { r: 5, fill: C.paper, stroke: C.ink2 });
  [['report.txt', '1207'], ['copy.txt', '1207'], ['latest', '1330']].forEach(([s, ino], i) => { d.mono(44, 86 + i * 44, s, { a: 'start', size: 10.5 }); d.mono(176, 86 + i * 44, ino, { a: 'end', size: 10.5, color: i < 2 ? C.acc : undefined }); });
  d.glow((g) => { g.arrow(192, 86, 330, 112, { stroke: C.acc }); g.arrow(192, 130, 330, 124, { stroke: C.acc }); });
  d.rect(336, 70, 150, 120, { r: 6, fill: C.accFaint, stroke: C.acc });
  d.text(411, 88, 'inode 1207', { cls: 'ttl' });
  ['links = 2', 'size, owner, mode', 'block pointers'].forEach((s, i) => d.mono(350, 112 + i * 20, s, { a: 'start', size: 10 }));
  d.arrow(192, 174, 300, 250, { stroke: C.ink2 });
  d.doc(300, 230, 120, 50, { lines: false }); d.text(360, 246, 'inode 1330', { cls: 'xs' }); d.mono(360, 264, '"report.txt"', { size: 10 });
  d.carrow([[420, 256], [500, 250], [520, 196], [470, 194]], { stroke: C.gray, dash: [4, 4], hl: 6 });
  d.text(560, 236, 'resolved by name;\nbreaks if renamed', { cls: 'sm', vc: true });
  d.text(110, 236, 'rm copy.txt drops\nlinks to 1; data stays', { cls: 'sm', vc: true });
  d.line(40, 122, 182, 138, { stroke: C.acc, single: true });
  d.hand(411, 306, 'data is freed when links reach 0 and nobody has it open', { size: 14 });
  return d.svg();
}
export function os_alloc_cache() {
  const d = illustration('os_alloc_cache', 'A FILE READ: INODE POINTERS FIND BLOCKS, THE PAGE CACHE KEEPS A RAM COPY, DIRTY PAGES FLUSH LATER', 340);
  d.rect(30, 60, 130, 120, { r: 5, fill: C.paper, stroke: C.ink2 }); d.text(95, 78, 'inode', { cls: 'ttl' });
  [0, 1, 2].forEach((i) => d.mono(46, 104 + i * 22, `ptr ${i} → ${[17, 42, 43][i]}`, { a: 'start', size: 10 }));
  d.text(400, 46, 'disk blocks (bitmap marks free)', { cls: 'ttl' });
  for (let b = 0; b < 48; b++) { const x = 220 + (b % 16) * 24, y = 60 + Math.floor(b / 16) * 24, used = [17, 42, 43, 5, 6, 30].includes(b); d.rect(x, y, 20, 20, { r: 1, fill: used ? C.card : C.paper, stroke: [17, 42, 43].includes(b) ? C.ink : C.line, sw: 0.8 }); }
  [17, 42, 43].forEach((b, i) => d.line(162, 104 + i * 22, 230 + (b % 16) * 24, 70 + Math.floor(b / 16) * 24, { stroke: C.line, single: true, sw: 0.8 }));
  d.text(400, 168, 'page cache in RAM', { cls: 'ttl', color: C.acc });
  d.glow((g) => g.rect(260, 180, 280, 70, { r: 6, fill: C.accFaint, stroke: C.acc }));
  [0, 1, 2].forEach((i) => { d.doc(280 + i * 86, 192, 66, 46, { lines: false, fill: C.accSoft, stroke: C.acc }); d.mono(313 + i * 86, 215, `page ${i}`, { size: 10 }); });
  d.dot(437, 198, 3.4, C.acc); d.text(470, 266, 'page 1 dirty', { cls: 'xs' });
  d.travel([[437, 198], [470, 140], [254, 120]], { dur: 5, at: [0.4, 0.8], r: 3.5 });
  d.person(100, 240, 34, { label: 'read()' }); d.arrow(130, 260, 256, 220, { stroke: C.ink2 });
  d.text(400, 300, 'repeat reads come from RAM; fsync() forces the flush', { cls: 'sm' });
  return d.svg();
}
export function os_journal() {
  const d = illustration('os_journal', 'THE JOURNAL WRITES THE PLAN FIRST, SO A CRASH CAN REPLAY OR DISCARD IT', 340);
  d.text(170, 46, 'journal (append-only)', { cls: 'ttl' });
  const recs = [['begin', 1], ['inode 1207', 0], ['bitmap', 0], ['dir entry', 0], ['commit', 1]];
  recs.forEach(([s, m], i) => d.box(30 + i * 70, 60, 64, 40, s, { r: 3, fill: i === 0 ? C.accSoft : C.card, stroke: i === 0 ? C.acc : C.ink2, cls: 'mono', size: 9 }));
  d.glow((g) => g.rect(26, 56, 72, 48, { r: 5, stroke: C.acc, sw: 1.2 }));
  d.text(500, 46, 'home locations', { cls: 'ttl' });
  ['inode table', 'free bitmap', 'directory'].forEach((s, i) => d.box(440, 60 + i * 50, 120, 38, s, { r: 3, fill: C.paper, cls: 'mono', size: 10 }));
  [['1', 'write intent to journal', 64], ['2', 'flush journal, then commit record', 210], ['3', 'update metadata in place', 380], ['4', 'checkpoint: journal space freed', 520]].forEach(([k, s, x], i) => {
    d.circle(x, 186, 24, { fill: i === 0 ? C.accSoft : C.card, stroke: i === 0 ? C.acc : C.ink2 }); d.mono(x, 187, k, { size: 11 });
    d.text(x, 222, s, { cls: 'sm' });
    if (i < 3) d.arrow(x + 16, 186, [210, 380, 520][i] - 16, 186, { stroke: C.gray, hl: 6 });
  });
  d.carrow([[360, 100], [400, 120], [436, 100]], { stroke: C.ink2, hl: 6 });
  d.path('M110,250 L130,268 L118,270 L140,296', { stroke: C.ink2, sw: 1.8, single: true });
  d.text(160, 274, 'crash before commit: discard the partial entry', { cls: 'sm', a: 'start' });
  d.text(160, 294, 'crash after commit: replay it into the home locations', { cls: 'sm', a: 'start' });
  d.travel([[30, 120], [380, 120]], { dur: 5, r: 3.5 });
  return d.svg();
}
export function os_dma() {
const d=illustration('os_dma','THE CPU SETS UP THE TRANSFER; THE DEVICE MOVES THE BYTES',300);
  d.cpu(45,91,72,{label:'CPU'});d.server(268,85,92,96,{label:'device / DMA'});d.ram(453,111,151,51,{chips:4,chip:i=>i===1?C.accSoft:C.paper});
  d.arrow(123,103,260,103,{stroke:C.ink2});d.text(191,86,'address + length',{cls:'sm'});
  d.arrow(368,135,445,135,{stroke:C.acc});d.text(405,115,'bytes',{cls:'sm',color:C.acc});
  d.carrow([[311,188],[310,241],[81,241],[81,181]],{stroke:C.ink2});d.text(220,264,'completion interrupt',{cls:'sm'});
  d.text(81,210,'other work',{cls:'sm'});d.travel([[368,135],[445,135]],{dur:7,at:[.2,.65],token:'packet'});return d.svg();
}
export function os_block_nonblock() {
  const d = illustration('os_block_nonblock', 'BLOCKING IS ABOUT THE CALLER WAITING; ASYNC IS ABOUT HOW COMPLETION IS REPORTED', 340);
  const cell = (x, y, s, sub, hot) => { d.rect(x, y, 270, 120, { r: 6, fill: hot ? C.accFaint : C.paper, stroke: hot ? C.acc : C.line }); d.text(x + 14, y + 18, s, { cls: 'ttl', a: 'start', color: hot ? C.acc : undefined }); d.text(x + 14, y + 104, sub, { cls: 'sm', a: 'start' }); };
  d.text(186, 46, 'caller sleeps', { cls: 'xs' }); d.text(462, 46, 'caller returns at once', { cls: 'xs' });
  cell(50, 56, 'blocking', 'read() sleeps until bytes arrive', false);
  sleeper(d, 110, 76); d.clock(220, 100, 34, { spin: 3 });
  cell(330, 56, 'non-blocking', 'read() → EAGAIN, try later', true);
  d.person(380, 80, 28, { stroke: C.acc, fill: C.accSoft });
  d.glow((g) => g.carrow([[410, 96], [470, 80], [520, 96]], { stroke: C.acc }));
  d.mono(520, 116, 'EAGAIN', { size: 10.5, color: C.acc });
  cell(50, 190, 'synchronous', 'the call itself carries the result', false);
  d.person(110, 212, 28); d.arrow(140, 230, 220, 230, { stroke: C.ink2 }); d.envelope(226, 222, 20, 14);
  cell(330, 190, 'asynchronous', 'submit now, completion event later', false);
  d.person(380, 212, 28); d.envelope(500, 214, 22, 15, { fill: C.accSoft, stroke: C.acc });
  d.travel([[560, 222], [420, 222]], { dur: 3, r: 3 });
  d.text(30, 116, 'wait', { cls: 'xs', rot: -90 }); d.text(30, 250, 'result', { cls: 'xs', rot: -90 });
  return d.svg();
}
export function os_epoll() {
const d=illustration('os_epoll','READINESS SELECTS TWENTY SOCKETS FROM ONE THOUSAND OPEN DESCRIPTORS',335);
  d.text(177,46,`${n.connections.toLocaleString('en-US')} registered sockets`,{cls:'ttl'});
  for(let i=0;i<n.connections;i++)d.dot(31+i%50*6,74+Math.floor(i/50)*9,1.7,i<n.ready?C.acc:C.line);
  d.text(177,276,`${n.idle} idle, ${n.ready} ready`,{cls:'sm'});d.arrow(341,169,383,169,{stroke:C.acc});
  d.doc(395,91,90,146,{lines:false});d.text(440,71,'ready list',{cls:'ttl'});
  for(let i=0;i<n.ready;i++)d.dot(411+i%4*18,115+Math.floor(i/4)*22,3,C.acc);
  for(let i=0;i<n.cores;i++)d.cpu(551,95+i*100,47,{label:`core ${i}`});
  d.arrow(493,133,543,117,{stroke:C.acc,hl:5});d.arrow(493,193,543,219,{stroke:C.acc,hl:5});
  d.text(320,310,'idle connections stay registered; ready work still competes for cores',{cls:'sm'});return d.svg();
}
export function os_event_loop() {
  const d = illustration('os_event_loop', `ONE THREAD, ${n.connections} SOCKETS: EPOLL HANDS BACK THE ${n.ready} THAT ARE READY`, 350);
  const cx = 230, cy = 186, R = 110;
  d.circle(cx, cy, R * 2, { stroke: C.line, sw: 1.2 });
  const st = [['epoll_wait()', -90], ['ready fds', 0], ['callback', 90], ['loop', 180]];
  st.forEach(([s, a], i) => { const x = cx + Math.cos(a * Math.PI / 180) * R, y = cy + Math.sin(a * Math.PI / 180) * R; if (i === 2) d.glow((g) => g.box(x - 50, y - 16, 100, 32, s, { fill: C.accSoft, stroke: C.acc, cls: 'mono', size: 10.5 })); else d.box(x - 50, y - 16, 100, 32, s, { fill: C.card, cls: 'mono', size: 10.5 }); });
  d.spin(cx, cy, (g) => g.dot(cx, cy - R, 5, C.acc), { dur: 5 });
  d.text(cx, cy - 8, 'short callbacks keep', { cls: 'sm' }); d.text(cx, cy + 10, 'every peer responsive', { cls: 'sm' });
  d.text(510, 46, 'sockets', { cls: 'ttl' });
  for (let i = 0; i < 50; i++) { const x = 420 + (i % 10) * 19, y = 60 + Math.floor(i / 10) * 19, hot = i % 50 === 7; d.circle(x, y, 12, { fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.line, sw: 0.7 }); }
  d.text(515, 170, `each dot ≈ ${n.connections / 50} sockets`, { cls: 'xs' });
  d.mono(515, 198, `${n.idle} idle`, { size: 11 }); d.mono(515, 218, `${n.ready} ready`, { size: 11, color: C.acc });
  d.carrow([[420, 236], [380, 250], [344, 196]], { stroke: C.ink2, hl: 6 });
  d.hand(470, 300, 'a slow callback stalls all of them', { size: 15 });
  return d.svg();
}
export function os_ipc() {
  const d = illustration('os_ipc', 'FOUR WAYS FOR TWO ISOLATED PROCESSES TO TALK', 340);
  const panel = (x, y, s, sub, hot) => { d.rect(x, y, 290, 130, { r: 6, fill: hot ? C.accFaint : C.paper, stroke: hot ? C.acc : C.line }); d.text(x + 14, y + 18, s, { cls: 'ttl', a: 'start', color: hot ? C.acc : undefined }); d.text(x + 145, y + 116, sub, { cls: 'sm' }); };
  const proc = (x, y, s) => d.box(x, y, 60, 44, s, { r: 5, fill: C.card, cls: 'mono', size: 10 });
  panel(20, 40, 'pipe', 'one-way ordered byte stream', false);
  proc(40, 66, 'P1'); proc(230, 66, 'P2');
  d.rect(104, 78, 122, 20, { r: 10, fill: C.paper, stroke: C.ink2 }); d.flowline([[110, 88], [220, 88]], { color: C.ink2 });
  panel(330, 40, 'shared memory', 'same bytes mapped into both', false);
  proc(350, 66, 'P1'); proc(540, 66, 'P2');
  d.rect(430, 64, 90, 48, { r: 3, fill: C.card, stroke: C.ink2, fs: 'hachure', gap: 6 }); d.line(412, 88, 428, 88, { stroke: C.ink2, single: true }); d.line(522, 88, 538, 88, { stroke: C.ink2, single: true });
  panel(20, 190, 'message queue', 'kernel keeps message boundaries', false);
  proc(40, 216, 'P1'); proc(230, 216, 'P2');
  d.rect(126, 216, 80, 44, { r: 3, fill: C.paper, stroke: C.ink2 }); [0, 1, 2].forEach((i) => d.envelope(132 + i * 24, 230, 18, 13));
  d.travel([[104, 238], [128, 238]], { dur: 2, token: 'packet' });
  panel(330, 190, 'socket', 'local or across the network', true);
  proc(350, 216, 'P1'); proc(540, 216, 'P2');
  d.glow((g) => g.curve([[412, 238], [450, 218], [490, 258], [538, 238]], { stroke: C.acc, sw: 2 }));
  d.travel('M412,238 C450,218 490,258 538,238', { dur: 2.5, r: 3.5 });
  d.hand(320, 330, 'the kernel copies for pipes, queues and sockets; not for shared memory', { size: 14 });
  return d.svg();
}
export function os_pipe_signal() {
  const d = illustration('os_pipe_signal', 'CAT LOG | GREP ERROR: THE SHELL WIRES ONE PROCESS\'S STDOUT INTO THE NEXT ONE\'S STDIN', 320);
  d.rect(30, 40, 580, 36, { r: 5, fill: C.paper, stroke: C.ink2 }); d.mono(46, 58, '$ cat app.log | grep ERROR', { a: 'start', size: 12 });
  d.box(40, 130, 120, 70, 'cat', { fill: C.card, cls: 'ttl' }); d.mono(100, 216, 'fd 1 → write end', { size: 9.5 });
  d.box(480, 130, 120, 70, 'grep', { fill: C.card, cls: 'ttl' }); d.mono(540, 216, 'fd 0 ← read end', { size: 9.5 });
  d.glow((g) => g.rect(176, 146, 288, 38, { r: 19, fill: C.accFaint, stroke: C.acc, sw: 1.6 }));
  d.text(320, 132, 'kernel pipe buffer, 64 KiB on Linux', { cls: 'sm', color: C.acc });
  'INFO ok\\nERROR db\\n'.split('').forEach((ch, i, a) => d.travel([[186, 165], [454, 165]], { at: [i / a.length, i / a.length + 0.5], dur: 6, token: (g) => g.text(0, 0, ch, { cls: 'mono', size: 10 }) }));
  d.text(320, 236, 'full buffer: cat blocks in write(); empty buffer: grep blocks in read()', { cls: 'sm' });
  d.hand(320, 284, 'bytes, not lines: grep reassembles lines itself', { size: 15 });
  return d.svg();
}
export function os_permissions() {
const d=illustration('os_permissions','755 GRANTS READ, WRITE AND EXECUTE TO DIFFERENT SUBJECT CLASSES',325);
  const groups=[['owner',[4,2,1]],['group',[4,0,1]],['other',[4,0,1]]];
  groups.forEach(([s,bits],i)=>{const x=40+i*204;d.person(x+80,48,32);d.text(x+80,95,s,{cls:'ttl'});figShelf(d,x,122,bits.map((v,j)=>v?['r','w','x'][j]:'none'),{width:162,hot:i===0?1:-1,height:43});d.mono(x+81,193,`${bits.join(' + ')} = ${bits.reduce((a,b)=>a+b,0)}`,{size:11});});
  d.doc(269,235,101,43,{lines:false});d.mono(320,256,'file');d.text(320,308,'the kernel checks the caller against the file policy',{cls:'sm'});return d.svg();
}
export function os_privilege() {
  const d = illustration('os_privilege', 'THE KERNEL CHECKS THE EFFECTIVE UID, NOT THE NAME ON THE TERMINAL', 320);
  d.rect(40, 70, 200, 140, { r: 8, fill: C.paper, stroke: C.ink2 }); d.circle(86, 118, 40, { fill: C.card, stroke: C.ink2 });
  d.text(140, 92, 'process 4182', { cls: 'ttl' });
  [['uid', '1000'], ['gid', '1000'], ['euid', '0']].forEach(([k, v], i) => { d.mono(120, 120 + i * 22, `${k}`, { a: 'start', size: 10.5, color: i === 2 ? C.acc : undefined }); d.mono(220, 120 + i * 22, v, { a: 'end', size: 10.5, color: i === 2 ? C.acc : undefined }); });
  d.glow((g) => g.rect(114, 154, 112, 20, { r: 4, stroke: C.acc }));
  d.text(140, 230, 'setuid binary: real 1000, effective 0', { cls: 'sm' });
  d.rect(420, 60, 150, 170, { r: 4, fill: C.card, stroke: C.ink2 }); d.lock(478, 120, 34, { stroke: C.acc, fill: C.accSoft });
  d.mono(495, 184, 'bind(port 80)', { size: 10.5 }); d.text(495, 204, 'needs euid 0 or', { cls: 'xs' }); d.text(495, 216, 'CAP_NET_BIND_SERVICE', { cls: 'xs' });
  d.arrow(244, 140, 414, 140, { stroke: C.acc });
  d.travel([[244, 140], [414, 140]], { dur: 3, label: 'euid 0', w: 46 });
  d.hand(320, 282, 'a compromised root process can do almost anything', { size: 15 });
  return d.svg();
}
export function os_virtualization() {
  const d = illustration('os_virtualization', 'A VIRTUAL MACHINE RUNS A WHOLE GUEST KERNEL ON TOP OF A HYPERVISOR', 340);
  d.fillRect(40, 262, 560, 42, C.card, 1, 5); d.cpu(80, 268, 28); d.ram(150, 270, 90, 24); d.disk(290, 283, 30);
  d.text(470, 283, 'hardware: real CPU, RAM, disk', { cls: 'sm' });
  d.glow((g) => g.rect(40, 214, 560, 38, { r: 5, fill: C.accSoft, stroke: C.acc, sw: 1.6 }));
  d.text(320, 233, 'hypervisor: traps privileged instructions, gives each guest virtual devices', { cls: 'sm' });
  [0, 1].forEach((v) => {
    const x = 60 + v * 280;
    d.rect(x, 50, 240, 154, { r: 8, fill: C.paper, stroke: C.ink2, dash: [5, 4] });
    d.text(x + 120, 66, `VM ${v + 1}`, { cls: 'ttl' });
    d.box(x + 16, 150, 208, 40, v ? 'guest kernel (Windows)' : 'guest kernel (Linux)', { fill: C.card, cls: 'mono', size: 10.5 });
    d.box(x + 16, 84, 96, 52, 'app', { fill: C.card }); d.box(x + 128, 84, 96, 52, 'app', { fill: C.card });
  });
  d.travel([[124, 136], [124, 170], [200, 233], [200, 270]], { dur: 4, r: 3.5 });
  return d.svg();
}
export function os_container_layers() {
  const d = illustration('os_container_layers', 'A CONTAINER IS A PROCESS WITH A NARROWED VIEW, A BUDGET AND ITS OWN FILES, ON THE HOST KERNEL', 340);
  d.fillRect(30, 266, 580, 40, C.card, 1, 6); d.text(320, 286, 'one shared host kernel', { cls: 'ttl' });
  [0, 1, 2].forEach((k) => {
    const x = 40 + k * 196, hot = k === 0;
    d.rect(x, 44, 170, 210, { r: 8, fill: C.paper, stroke: hot ? C.acc : C.ink2, sw: hot ? 1.6 : 1 });
    for (let l = 0; l < 3; l++) d.rect(x + 14, 200 - l * 14, 142, 14, { r: 2, fill: C.card, stroke: C.line, sw: 0.7 });
    d.text(x + 85, 236, 'image layers', { cls: 'xs' });
    d.circle(x + 50, 110, 56, { stroke: hot ? C.acc : C.gray, sw: 1.4 }); d.line(x + 70, 130, x + 86, 148, { stroke: hot ? C.acc : C.gray, sw: 2, single: true });
    d.mono(x + 50, 110, 'PID 1', { size: 10, color: hot ? C.acc : undefined }); d.text(x + 50, 64, 'namespace view', { cls: 'xs' });
    d.rect(x + 118, 70, 22, 90, { r: 3, stroke: C.ink2 }); d.fillRect(x + 120, 70 + 88 * (1 - [0.5, 0.3, 0.7][k]), 18, 88 * [0.5, 0.3, 0.7][k], C.gray, 0.5, 2);
    d.text(x + 129, 172, 'cgroup', { cls: 'xs' });
  });
  d.glow((g) => g.circle(90, 110, 56, { stroke: C.acc, sw: 1.4 }));
  return d.svg();
}
export function os_namespaces() {
  const d = illustration('os_namespaces', 'THE SAME PROCESS IS PID 1 INSIDE AND PID 4182 ON THE HOST', 330);
  const win = (x, s, rows, hot) => { d.rect(x, 44, 270, 200, { r: 6, fill: C.paper, stroke: hot ? C.acc : C.ink2 }); d.fillRect(x + 2, 46, 266, 20, C.card, 1, 4); d.text(x + 12, 56, s, { cls: 'xs', a: 'start' }); rows.forEach((r, i) => d.mono(x + 14, 86 + i * 20, r, { a: 'start', size: 10.5, color: r.includes('nginx') ? C.acc : undefined })); };
  win(30, 'inside the container: ps', ['PID  CMD', '1    nginx', '7    nginx worker', '', 'eth0  10.0.0.2', '/     image root'], true);
  win(340, 'on the host: ps', ['PID   CMD', '1     systemd', '812   containerd', '4182  nginx', '4189  nginx worker', 'eth0  192.168.1.20'], false);
  d.glow((g) => g.carrow([[96, 106], [320, 70], [400, 146]], { stroke: C.acc, sw: 1.6 }));
  d.travel('M96,106 Q320,70 400,146', { dur: 4, r: 3.5 });
  [['PID', 'process numbers'], ['net', 'interfaces, routes'], ['mount', 'filesystem tree'], ['user', 'UID 0 inside maps to 100000']].forEach(([k, v], i) => { const x = 30 + i * 150; chip(d, x, 262, 46, k, i === 0, 22); d.text(x + 52, 273, v, { cls: 'xs', a: 'start' }); });
  return d.svg();
}
export function os_cgroup() {
  const d = illustration('os_cgroup', `QUOTA ${n.quota_ms} MS PER ${n.period_ms} MS PERIOD: THE GROUP RUNS, THEN WAITS FOR THE NEXT PERIOD`, 300);
  const X = (t) => 60 + t * 1.75;
  for (let p = 0; p < 3; p++) {
    const x0 = X(p * n.period_ms);
    d.box(x0, 110, X(n.quota_ms) - X(0), 50, 'runs', { r: 2, fill: C.card, cls: 'xs' });
    d.rect(X(p * n.period_ms + n.quota_ms), 110, X(n.period_ms) - X(n.quota_ms), 50, { r: 2, fill: C.accFaint, stroke: C.acc, fs: 'hachure', gap: 6 });
    d.text(X(p * n.period_ms + 75), 172, 'throttled', { cls: 'xs', color: C.acc });
    d.line(x0, 92, x0, 186, { stroke: C.ink2, single: true, dash: [3, 3] });
    d.mono(x0, 200, `${p * n.period_ms} ms`, { size: 9.5 });
  }
  d.mono(X(300), 200, '300 ms', { size: 9.5 });
  d.glow((g) => g.line(X(n.quota_ms), 98, X(n.quota_ms), 172, { stroke: C.acc, sw: 2, single: true }));
  d.text(X(n.quota_ms), 84, `quota hit at ${n.quota_ms} ms`, { cls: 'sm', color: C.acc });
  d.travel([[X(0), 104], [X(300), 104]], { dur: 6, r: 3, color: C.ink2 });
  d.text(320, 236, `${n.quota_ms} / ${n.period_ms} = ${n.cpu_fraction} of one core, on a ${n.cores}-core host`, { cls: 'mono', size: 11 });
  d.hand(320, 272, 'tail latency jumps when a request lands in the hatched part', { size: 14 });
  return d.svg();
}
export function os_boot() {
  const d = illustration('os_boot', 'BOOT IS A RELAY: EACH STAGE LOADS THE NEXT AND HANDS OVER CONTROL', 320);
  const st = [['firmware', 'power-on, find disk'], ['bootloader', 'load kernel image'], ['kernel', 'drivers, memory, CPUs'], ['initramfs', 'mount real root'], ['init', 'PID 1'], ['service', 'server ready']];
  st.forEach(([s, sub], i) => {
    const x = 30 + i * 100, y = 230 - i * 30, hot = i === 2;
    d.rect(x, y, 90, 300 - y - 30, { r: 3, fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2 });
    d.text(x + 45, y + 18, s, { cls: 'ttl', size: 11.5, color: hot ? C.acc : undefined });
    d.text(x + 45, y - 14, sub, { cls: 'xs' });
  });
  d.cpu(60, 245, 30);
  d.glow((g) => g.rect(230, 170, 90, 100, { r: 3, stroke: C.acc, sw: 1.4 }));
  d.travel([[75, 222], [175, 192], [275, 162], [375, 132], [475, 102], [575, 72]], { dur: 6, r: 4.5 });
  d.hand(160, 76, 'each stage trusts the one before it', { size: 15 });
  return d.svg();
}
export function os_proc_limits() {
  const d = illustration('os_proc_limits', `/PROC SHOWS THE DESCRIPTORS; ULIMIT CAPS THEM AT ${n.fd_limit}`, 330);
  d.rect(30, 44, 330, 230, { r: 6, fill: C.paper, stroke: C.ink2 }); d.fillRect(32, 46, 326, 18, C.card, 1, 4);
  ['$ ls -l /proc/4182/fd', '0 -> /dev/null', '1 -> /var/log/app.log', '2 -> /var/log/app.log', '3 -> socket:[88213]', '4 -> socket:[88219]', '...', '$ ls /proc/4182/fd | wc -l', String(n.fd_limit), '$ strace -e accept4 -p 4182'].forEach((s, i) => d.mono(44, 80 + i * 19, s, { a: 'start', size: 10, color: i === 8 ? C.acc : undefined }));
  const x = 430, top = 60, h = 200;
  d.rect(x, top, 70, h, { r: 4, stroke: C.ink2 });
  d.fillRect(x + 2, top + 2, 66, h - 4, C.accSoft, 1, 3);
  d.fillRect(x + 2, top + h - 2 - h * n.reserved_fd / n.fd_limit, 66, h * n.reserved_fd / n.fd_limit, C.card, 1, 2);
  d.glow((g) => g.line(x - 10, top, x + 80, top, { stroke: C.acc, sw: 2, single: true }));
  d.mono(x + 90, top, `ulimit -n ${n.fd_limit}`, { a: 'start', size: 10.5, color: C.acc });
  d.text(x + 90, top + 100, `${n.connection_capacity} for sockets`, { cls: 'sm', a: 'start' });
  d.text(x + 90, top + 190, `${n.reserved_fd} for files,\nlogs, stdio`, { cls: 'sm', a: 'start', vc: true });
  d.hand(320, 306, `connection ${n.connection_capacity + 1} gets EMFILE`, { size: 15 });
  return d.svg();
}
export function os_leaks() {
  const d = illustration('os_leaks', 'A LEAK CLIMBS UNTIL IT HITS A LIMIT; THE DESCRIPTOR LIMIT FAILS FIRST HERE', 320);
  const M = d.axes(70, 60, 480, 190, { xmin: 0, xmax: 10, ymin: 0, ymax: n.fd_limit * 1.15, xl: 'hours', yl: 'held' });
  d.line(M.X(0), M.Y(n.fd_limit), M.X(10), M.Y(n.fd_limit), { stroke: C.acc, dash: [5, 4], single: true });
  d.text(M.X(10), M.Y(n.fd_limit) - 10, `fd limit ${n.fd_limit}`, { cls: 'xs', a: 'end', color: C.acc });
  d.fn((t) => Math.min(n.fd_limit, 60 + t * 140), 0, 10, M, { stroke: C.acc, sw: 2 });
  d.fn((t) => 250 + t * 35, 0, 10, M, { stroke: C.gray, sw: 1.2 }); d.text(M.X(10) + 6, M.Y(600), 'memory', { cls: 'xs', a: 'start' });
  d.fn((t) => 120 + t * 12, 0, 10, M, { stroke: C.slate, sw: 1.2 }); d.text(M.X(10) + 6, M.Y(240), 'threads', { cls: 'xs', a: 'start' });
  const hit = (n.fd_limit - 60) / 140;
  d.beacon(M.X(hit), M.Y(n.fd_limit));
  d.text(M.X(hit), M.Y(n.fd_limit) - 26, 'accept() fails', { cls: 'sm', color: C.acc });
  d.text(M.X(3), M.Y(260), 'unclosed sockets', { cls: 'sm', color: C.acc });
  d.text(320, 300, 'illustrative rates; CPU can be idle while the server refuses connections', { cls: 'xs' });
  return d.svg();
}
export function os_cache_hierarchy() {
const d=illustration('os_cache_hierarchy','THE SAME REQUEST TRIES SUCCESSIVELY LARGER STORAGE REGIONS',340);
  d.cpu(40,121,73,{label:'core'});
  const layers=[[164,110,63,88,'L1'],[243,82,88,144,'L2'],[347,53,111,202,'L3'],[480,37,126,234,'RAM']];
  layers.forEach(([x,y,w,h,s],i)=>{d.rect(x,y,w,h,{r:2,fill:i===0?C.accSoft:C.card,stroke:i===0?C.acc:C.ink2});d.text(x+w/2,y+23,s,{cls:'ttl'});for(let j=0;j<Math.floor((h-40)/20);j++)d.line(x+8,y+43+j*20,x+w-8,y+43+j*20,{stroke:C.line,single:true});});
  [121,235,337,464].forEach((x,i)=>d.arrow(x,171,x+35,171,{stroke:i?C.line:C.acc,hl:5}));
  d.text(320,303,'capacity increases; access and miss costs depend on the machine',{cls:'sm'});return d.svg();
}
export function os_false_sharing() {
  const d = illustration('os_false_sharing', `TWO COUNTERS, ONE ${n.cache_line_bytes}-BYTE LINE: EVERY WRITE STEALS THE LINE FROM THE OTHER CORE`, 330);
  [0, 1].forEach((c) => {
    const x = 60 + c * 340;
    d.cpu(x + 50, 50, 46, { label: `core ${c}` }); d.text(x + 140, 74, c ? 'thread B: b++' : 'thread A: a++', { cls: 'mono', size: 10.5 });
    d.text(x + 80, 132, 'private cache copy', { cls: 'xs' });
    d.tape(x, 142, Array.from({ length: n.counters_per_line }, (_, i) => i === 0 ? 'a' : i === 1 ? 'b' : ''), { cw: 22, h: 26, hot: (i) => i === c });
  });
  d.text(320, 220, `one line = ${n.counters_per_line} × ${n.counter_bytes}-byte counters`, { cls: 'sm' });
  d.glow((g) => { g.carrow([[240, 160], [320, 130], [396, 160]], { stroke: C.acc, sw: 1.6 }); g.carrow([[396, 172], [320, 200], [240, 172]], { stroke: C.acc, sw: 1.6 }); });
  d.travel('M240,160 Q320,130 396,160', { at: [0, 0.5], dur: 2, label: 'invalidate', w: 66 });
  d.travel('M396,172 Q320,200 240,172', { at: [0.5, 1], dur: 2, label: 'invalidate', w: 66 });
  d.hand(320, 266, 'pad a and b onto separate lines and the traffic stops', { size: 15 });
  return d.svg();
}
export function os_network_path() {
const d=illustration('os_network_path','A SERVER REQUEST TOUCHES A SOCKET, A SCHEDULED THREAD AND MEMORY',345);
  d.server(35,77,92,108,{label:'network device',unit:25});d.envelope(152,115,42,29);
  d.rect(224,64,160,212,{fill:C.paper,stroke:C.acc,dash:[4,4]});d.text(304,87,'kernel',{cls:'ttl',color:C.acc});figShelf(d,242,110,['socket','ready'],{width:125,height:30,hot:1});
  d.cpu(275,183,58,{label:'core'});d.text(304,261,'dispatch thread',{cls:'sm'});
  d.ram(443,85,150,42,{chips:4,chip:i=>i===1?C.accSoft:C.paper});figPage(d,484,163,70,88,'page',true);
  d.arrow(134,131,215,131,{stroke:C.acc});d.arrow(393,204,476,204,{stroke:C.acc});
  d.text(516,283,'private process mapping',{cls:'sm'});d.text(320,325,'I/O readiness, scheduling and translation are different decisions',{cls:'sm'});return d.svg();
}
export function os_zero_copy() {
  const d = illustration('os_zero_copy', 'READ + WRITE COPIES THROUGH USER SPACE; SENDFILE KEEPS THE BYTES IN THE KERNEL', 340);
  band(d, 20, 40, 600, 70, 'user space'); band(d, 20, 118, 600, 120, 'kernel', C.accFaint);
  d.disk(70, 290, 46, { label: 'disk' });
  d.box(140, 150, 110, 40, 'page cache', { fill: C.card, cls: 'mono', size: 10.5 });
  d.box(250, 58, 110, 36, 'user buffer', { fill: C.paper, cls: 'mono', size: 10.5, stroke: C.gray });
  d.box(370, 150, 110, 40, 'socket buffer', { fill: C.card, cls: 'mono', size: 10.5 });
  d.router(540, 270, 60); d.text(570, 304, 'NIC', { cls: 'xs' });
  d.arrow(80, 264, 150, 196, { stroke: C.ink2 });
  d.carrow([[200, 146], [240, 110], [264, 98]], { stroke: C.gray, dash: [4, 4], hl: 6 }); d.carrow([[340, 98], [380, 112], [410, 146]], { stroke: C.gray, dash: [4, 4], hl: 6 });
  d.text(310, 112, 'read() then write(): two extra copies', { cls: 'xs' });
  d.glow((g) => g.carrow([[252, 182], [310, 210], [366, 182]], { stroke: C.acc, sw: 1.8 }));
  d.text(310, 226, 'sendfile()', { cls: 'mono', size: 10.5, color: C.acc });
  d.arrow(482, 180, 548, 262, { stroke: C.ink2 });
  d.travel('M80,264 L195,190 Q310,210 425,190 L548,262', { dur: 4, r: 4 });
  d.travel('M80,264 L195,150 Q240,110 305,94 Q380,112 425,150 L548,262', { dur: 6, r: 3, color: C.gray });
  return d.svg();
}
export function os_io_uring() {
  const d = illustration('os_io_uring', 'IO_URING: TWO SHARED RINGS, ONE FOR REQUESTS IN AND ONE FOR RESULTS OUT', 340);
  const ring = (cx, cy, s, hot, filled) => {
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, x = cx + Math.cos(a) * 62, y = cy + Math.sin(a) * 62; d.circle(x, y, 28, { fill: filled.includes(i) ? (hot ? C.accSoft : C.card) : C.paper, stroke: hot ? C.acc : C.ink2 }); }
    d.text(cx, cy, s, { cls: 'ttl', color: hot ? C.acc : undefined });
  };
  ring(200, 170, 'submission', false, [0, 1, 2]);
  ring(440, 170, 'completion', true, [4, 5]);
  d.spin(440, 170, (g) => g.glow((h) => h.dot(502, 170, 4, C.acc)), { dur: 5 });
  d.spin(200, 170, (g) => g.dot(262, 170, 3.5, C.ink2), { dur: 5 });
  d.person(60, 80, 30, { label: 'app writes SQEs' }); d.arrow(84, 110, 150, 134, { stroke: C.ink2 });
  d.cpu(300, 268, 40, { label: 'kernel' }); d.arrow(250, 220, 296, 270, { stroke: C.ink2 }); d.arrow(344, 270, 390, 220, { stroke: C.ink2 });
  d.person(580, 80, 30, { label: 'app reads CQEs' }); d.arrow(492, 134, 556, 110, { stroke: C.acc });
  d.text(320, 60, 'shared memory: no syscall per request', { cls: 'sm' });
  d.hand(560, 300, 'res < 0 is still an error', { size: 14 });
  return d.svg();
}
export function os_complete_trace() {
  const d = illustration('os_complete_trace', 'ONE REQUEST TO THE SERVER, FROM PROCESS CREATION TO CGROUP BUDGET', 380);
  const pts = [[80, 90], [250, 70], [430, 110], [540, 210], [330, 270], [120, 300]];
  d.curve([[50, 100], ...pts, [100, 340]], { stroke: C.line, sw: 6, single: true, op: 0.5 });
  const st = [['fork + exec', 'new image', (x, y) => d.person(x, y - 34, 26)], ['schedule', 'ready queue', (x, y) => d.cpu(x - 15, y - 44, 30)], ['VA → PA', 'page table + TLB', (x, y) => figPage(d, x - 16, y - 46, 32, 34, '')], ['epoll + fd', 'ready socket', (x, y) => d.router(x - 24, y - 26, 48)], ['file + cache', 'inode, blocks', (x, y) => d.disk(x, y - 30, 34)], ['cgroup', 'quota', (x, y) => d.clock(x, y - 30, 30)]];
  st.forEach(([s, sub, icon], i) => {
    const [x, y] = pts[i], hot = i === 4;
    icon(x, y);
    if (hot) d.glow((g) => g.circle(x, y - 30, 54, { stroke: C.acc, sw: 1.4 }));
    d.circle(x, y, 12, { fill: hot ? C.acc : C.card, stroke: hot ? C.acc : C.ink2 });
    d.text(x, y + 22, s, { cls: 'ttl', size: 11.5, color: hot ? C.acc : undefined }); d.text(x, y + 38, sub, { cls: 'xs' });
  });
  d.travel('M' + pts.map((p) => p.join(',')).join(' L'), { dur: 9, token: 'packet' });
  d.hand(330, 350, 'step 5 is where the request leaves pure CPU work', { size: 15 });
  return d.svg();
}
