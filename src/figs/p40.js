import { D, C, fmtN } from '../lib/draw.js';

// Stations stay on a shared baseline; their annotations occupy a separate row.
function stations(id, kicker, rows, foot) {
  const d = new D(640, rows.length * 110 + 75, id);
  d.text(10, 16, kicker, { cls: 'cap', a: 'start' });
  rows.forEach((row, r) => row.forEach(([label, sub], i) => {
    const w = 176, x = 20 + i * 212, y = 48 + r * 110;
    const active = i === row.length - 1;
    d.box(x, y, w, 44, label, { fill: active ? C.accSoft : C.card, stroke: active ? C.acc : C.ink2, size: 12 });
    d.text(x + w / 2, y + 66, sub, { cls: 'sm', size: 10.5 });
    if (i) d.arrow(x - 32, y + 22, x - 4, y + 22, { stroke: C.gray });
  }));
  for(let r=0;r<rows.length-1;r++){
    const y=48+r*110;
    d.carrow([[620,y+22],[632,y+22],[632,y+84],[8,y+84],[8,y+132],[16,y+132]],{stroke:C.line});
  }
  if (foot) d.hand(320, d.h - 20, foot, { size: 18 });
  return d.svg();
}

export function where_agents(stage = 99) {
  const d = new D(640, 355, `where_agents_${stage}`);
  d.text(10, 16, 'THE AGENT AND ITS TRAINING PATH', { cls: 'cap', a: 'start' });
  const labels = ['Define tools', 'Run the loop', 'Measure tasks', 'Choose training', 'Build LoRA', 'Count adapters', 'Serialize traces', 'Train and validate', 'Generate tasks', 'Check traces', 'Compare models', 'Prepare inference'];
  labels.forEach((label, i) => {
    const x = 14 + (i % 3) * 212, y = 45 + Math.floor(i / 3) * 77;
    const active = stage === 99 || stage === i + 1;
    d.box(x, y, 188, 47, label, { fill: active ? C.accSoft : C.card, stroke: active ? C.acc : C.line, size: 12 });
    d.mono(x + 10, y - 10, String(i + 1).padStart(2, '0'), { a: 'start', size: 9, color: active ? C.acc : C.gray });
    if (i % 3 !== 2) d.arrow(x + 191, y + 24, x + 207, y + 24, { stroke: C.line });
  });
  return d.svg();
}

export function cover_agents() {
  const d = new D(640, 830, 'cover_agents');
  for (let x = 14; x < 640; x += 22) for (let y = 28; y < 800; y += 22) d.dot(x, y, .7, C.faint);
  d.text(10, 16, 'OCTLM / UNIT V / POST-TRAINING AND TOOL USE', { cls: 'cap', a: 'start' });
  d.text(48, 104, 'Teaching a', { size: 55, w: 600, a: 'start' });
  d.hl(49, 184, 514, 184, { th: 18 });
  d.text(48, 170, 'Model to Act', { size: 55, w: 600, a: 'start' });
  d.text(50, 238, 'Tools, state, demonstrations, and the test', { a: 'start', size: 17 });
  d.text(50, 264, 'that tells you whether the task was done.', { a: 'start', size: 17 });
  const levels = [['Task and tool definitions', 'what the model can ask for'], ['Finch-24 + LoRA', 'produce a call or an answer'], ['Validate and execute', 'the program owns the action'], ['Environment and result', 'evidence for the next turn']];
  levels.forEach(([label, sub], i) => {
    const y = 350 + i * 94;
    d.box(188, y, 380, 53, label, { fill: i === 2 ? C.accSoft : C.card, stroke: i === 2 ? C.acc : C.ink2, size: 16 });
    d.text(378, y + 69, sub, { cls: 'sm', size: 12 });
    if (i < levels.length - 1) d.arrow(378, y + 76, 378, y + 88, { stroke: C.gray });
  });
  d.carrow([[570,660],[606,660],[606,370],[572,370]], { stroke: C.acc });
  d.hand(82, 442, 'a call needs\na real result', { vc: true, size: 24 });
  d.arrow(112, 478, 183, 566, { stroke: C.acc });
  d.text(48, 786, 'A HAND-DRAWN FIELD GUIDE', { cls: 'cap', a: 'start', size: 11 });
  return d.svg();
}

export function agent_ownership() {
  return stations('agent_ownership', 'WORDS, DECISIONS, AND ACTIONS HAVE DIFFERENT OWNERS', [[['User request', 'reserve 3 bolts'], ['Model', 'propose reserve(...)'], ['Runtime', 'validate, then dispatch']], [['Tool service', 'commit once'], ['Environment', 'available: 12 to 9'], ['Model', 'report the receipt']]], 'the sentence follows the action');
}

export function agent_loop_trace() {
  const d = new D(640, 355, 'agent_loop_trace');
  d.text(10, 16, 'THE STOCKROOM REQUEST: OBSERVE, ACT, ANSWER', { cls: 'cap', a: 'start' });
  const rows = [['request', 'reserve 3 if available', 'user'], ['call c1', 'get_stock(bolt)', 'assistant'], ['result c1', 'available = 12', 'tool'], ['call c2', 'reserve(bolt, 3, key)', 'assistant'], ['result c2', 'committed; available = 9', 'tool'], ['answer', '3 reserved; 9 remain', 'assistant']];
  rows.forEach(([name, value, role], i) => {
    const y = 48 + i * 47;
    d.text(18, y + 15, name, { cls: 'mono', a: 'start', size: 10.5 });
    d.box(135, y, 330, 32, value, { fill: i === 3 ? C.accSoft : C.card, stroke: i === 3 ? C.acc : C.ink2, cls: 'mono', size: 11 });
    d.text(490, y + 16, role, { cls: 'sm', a: 'start' });
    if (i < rows.length - 1) d.arrow(603, y + 21, 603, y + 44, { stroke: C.gray });
  });
  return d.svg();
}

export function tool_contract_card() {
  const d = new D(640, 285, 'tool_contract_card');
  d.text(10, 16, 'RESERVE IS A CONTRACT, NOT AN ARBITRARY FUNCTION NAME', { cls: 'cap', a: 'start' });
  const fields = [['name', 'reserve'], ['description', 'reserve stock after authorization'], ['arguments', 'sku, quantity, request_key'], ['success', 'receipt, remaining, committed'], ['errors', 'insufficient_stock, conflict, timeout']];
  fields.forEach(([field, value], i) => {
    const y = 55 + i * 40;
    d.text(20, y, field, { cls: 'mono', a: 'start', size: 11 });
    d.text(178, y, value, { cls: 'mono', a: 'start', size: 11, color: i === 2 ? C.acc : C.ink });
    d.line(18, y + 19, 620, y + 19, { stroke: C.line, single: true, sw: .6 });
  });
  return d.svg();
}

export function schema_gate() {
  return stations('schema_gate', 'VALID TEXT IS ONLY THE FIRST GATE', [[['JSON parser', 'is there an object?'], ['Schema validator', 'fields, types, constraints'], ['Authorization', 'may this user reserve?']], [['Availability check', 'read current stock'], ['Commit', 'atomic reservation'], ['Receipt', 'evidence of the write']]], 'valid syntax does not grant permission');
}

export function call_result_identity() {
  const d = new D(640, 260, 'call_result_identity');
  d.text(10, 16, 'CALL IDS ASSOCIATE RESULTS WITH REQUESTS', { cls: 'cap', a: 'start' });
  [['c1','get_stock(bolt)','available = 12'],['c2','get_stock(nut)','available = 7']].forEach(([id, call, result],i)=>{
    const y=65+i*91;
    d.box(20,y,250,42,`${id}: ${call}`,{cls:'mono',size:11,fill:C.card});
    d.arrow(275,y+21,356,y+21,{stroke:i?C.gray:C.acc});
    d.box(360,y,258,42,`${id}: ${result}`,{cls:'mono',size:11,fill:i?C.card:C.accSoft,stroke:i?C.ink2:C.acc});
  });
  d.hand(320,235,'the id survives even if results arrive out of order',{size:18});
  return d.svg();
}

export function partial_call_buffer() {
  const d = new D(640, 260, 'partial_call_buffer');
  d.text(10, 16, 'A STREAMED ARGUMENT OBJECT IS NOT AN ACTION YET', { cls: 'cap', a: 'start' });
  const rows=[['chunk A','{"sku":"bolt",','buffer'],['chunk B','"quantity":3,','buffer'],['chunk C','"request_key":"r1"}','parse + validate']];
  rows.forEach(([name,part,job],i)=>{
    const y=58+i*57;
    d.text(20,y+16,name,{cls:'mono',a:'start',size:11});
    d.box(130,y,310,34,part,{cls:'mono',size:12,fill:i===2?C.accSoft:C.card,stroke:i===2?C.acc:C.ink2});
    d.text(464,y+17,job,{cls:'sm',a:'start'});
  });
  d.hand(320,238,'dispatch only after the complete call passes every check',{size:17});
  return d.svg();
}

export function retry_commit_boundary() {
  return stations('retry_commit_boundary', 'A LOST RESPONSE DOES NOT MEAN A LOST WRITE', [[['reserve(key = r1)', 'request reaches server'], ['Commit succeeds', '12 - 3 = 9'], ['Response lost', 'client sees a timeout']], [['Retry same key', 'ask for r1 again'], ['Stored receipt', 'no second reservation'], ['Return result', 'available stays 9']]], 'retry the operation identity, not a new action');
}

export function context_growth_agents() {
  const d = new D(640, 275, 'context_growth_agents');
  d.text(10, 16, 'APPENDED CALLS AND RESULTS CONSUME THE SAME CONTEXT', { cls: 'cap', a: 'start' });
  [320,560,800,1040].forEach((n,i)=>{
    const y=59+i*45;
    d.text(18,y+12,i?`turn ${i}`:'start',{cls:'mono',a:'start',size:11});
    d.rect(100,y,n/1040*445,25,{fill:i===3?C.accSoft:C.card,stroke:i===3?C.acc:C.ink2});
    d.mono(572,y+13,`${fmtN(n)}`,{a:'start',size:11});
  });
  d.text(100,248,'each turn adds 48 call tokens + 192 result tokens = 240',{cls:'mono',a:'start',size:11});
  return d.svg();
}

export function prefix_reuse_agents() {
  const d = new D(640, 250, 'prefix_reuse_agents');
  d.text(10, 16, 'REUSE REQUIRES AN IDENTICAL TOKEN PREFIX', { cls: 'cap', a: 'start' });
  [['cached prefix',560],['new suffix',240]].forEach(([s,n],i)=>{
    const x=i?18+560/800*586:18,w=n/800*586;
    d.box(x,78,w,66,`${s}\n${n} tokens`,{cls:'mono',size:12,fill:i?C.accSoft:C.card,stroke:i?C.acc:C.ink2});
  });
  d.brace(18,604,171,{label:'800 tokens total; 560 / 800 = 70% reusable',cls:'mono'});
  d.hand(320,221,'editing a past message invalidates its dependent suffix',{size:18});
  return d.svg();
}

export function stopping_budget_agents() {
  return stations('stopping_budget_agents', 'COMPLETION AND BUDGET EXHAUSTION ARE DIFFERENT OUTCOMES', [[['Model returns', 'call, final, or incomplete'], ['Runtime checks', 'steps, calls, time, repeats'], ['Terminal record', 'success or explicit failure']]], 'a step limit stops the process, not the unfinished task');
}

export function failure_reach_agents() {
  const d = new D(640, 300, 'failure_reach_agents');
  d.text(10, 16, 'WHERE EACH FAILURE STOPS DECIDES HOW TO RECOVER', { cls: 'cap', a: 'start' });
  const st = [['model', 20], ['parser', 140], ['validator', 260], ['service', 380], ['response', 500]];
  st.forEach(([s, x]) => { d.box(x, 46, 100, 34, s, { fill: x === 380 ? C.accSoft : C.card, stroke: x === 380 ? C.acc : C.ink2, size: 11 }); });
  for (let i = 0; i < 4; i++) d.arrow(120 + i * 120, 63, 138 + i * 120, 63, { stroke: C.gray });
  const rows = [
    ['invalid JSON', 190, 'never reached the service: regenerate'],
    ['quantity="3"', 310, 'rejected by schema: report the field, retry'],
    ['timeout on reserve', 550, 'may have committed: reconcile with key r1'],
  ];
  rows.forEach(([lab, x, note], i) => {
    const y = 120 + i * 52, red = i === 2;
    d.line(70, y, x, y, { stroke: red ? C.acc : C.ink2, sw: 1.6, single: true });
    d.dot(x, y, 4.5, red ? C.acc : C.red);
    d.mono(70, y - 12, lab, { a: 'start', size: 10.5 });
    d.text(red ? x - 10 : x + 12, y + (red ? 18 : 0), note, { cls: 'sm', a: red ? 'end' : 'start' });
  });
  d.hand(320, 282, 'a lost receipt is not a failed write', { size: 18 });
  return d.svg();
}

export function context_summary_agents() {
  const d = new D(640, 230, 'context_summary_agents');
  d.text(10, 16, 'SUMMARIZING OLD TURNS: 1,040 TOKENS BECOME 640', { cls: 'cap', a: 'start' });
  const s = 480 / 1040, x0 = 100;
  const bar = (y, parts) => { let x = x0; parts.forEach(([n, fill, stroke, lab]) => { d.rect(x, y, n * s, 34, { fill, stroke, r: 0 }); if (n * s > 30) d.text(x + n * s / 2, y + 17, lab, { cls: 'xs' }); x += n * s; }); return x; };
  d.text(20, 69, 'before', { cls: 'ttl', a: 'start' });
  const e1 = bar(52, [[320, C.card, C.ink2, 'prompt 320'], [240, C.slateSoft, C.slate, 'turn 240'], [240, C.slateSoft, C.slate, 'turn 240'], [240, C.slateSoft, C.slate, 'turn 240']]);
  d.mono(e1 + 6, 69, '1,040', { a: 'start', size: 10.5 });
  d.text(20, 139, 'after', { cls: 'ttl', a: 'start' });
  const e2 = bar(122, [[320, C.card, C.ink2, 'prompt 320'], [80, C.accSoft, C.acc, 'sum 80'], [240, C.slateSoft, C.slate, 'latest 240']]);
  d.mono(e2 + 6, 139, '640', { a: 'start', size: 10.5 });
  d.text(320, 188, 'the 80-token summary must still say "reservation r1 committed"', { cls: 'sm' });
  d.text(320, 210, 'illustrative token counts from the fixture, not tokenizer output', { cls: 'xs' });
  return d.svg();
}
