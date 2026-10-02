import { D, C } from '../lib/draw.js';

const roleCol = { system: [C.slateSoft, C.slate], user: [C.card, C.ink2], assistant: [C.accSoft, C.acc] };

function card(d, x, y, w, role, text) {
  const [f, s] = roleCol[role];
  d.rect(x, y, w, 44, { fill: f, stroke: s, r: 8 });
  d.text(x + 10, y + 13, role, { cls: 'xs', a: 'start', color: s });
  d.text(x + 10, y + 30, text, { cls: 'mono', size: 9.5, a: 'start' });
}

export function inf_messages_to_sequence() {
  const d = new D(640, 260, 'inf_messages_to_sequence');
  d.text(10, 16, 'MESSAGES IN, ONE TOKEN SEQUENCE OUT', { cls: 'cap', a: 'start' });
  card(d, 20, 36, 200, 'system', 'You are a helpful assistant.');
  card(d, 20, 88, 200, 'user', 'What is the capital of France?');
  card(d, 20, 140, 200, 'assistant', 'Paris.');
  d.box(250, 92, 90, 32, 'template', { fill: C.paper, stroke: C.ink2, size: 10.5 });
  d.arrow(222, 108, 248, 108, { stroke: C.ink2, hl: 5 });
  d.arrow(342, 108, 370, 108, { stroke: C.ink2, hl: 5 });
  const seq = [['<|im_start|>', 'c'], ['system', 'system'], ['…', 'system'], ['<|im_end|>', 'c'], ['<|im_start|>', 'c'], ['user', 'user'], ['…', 'user'], ['<|im_end|>', 'c'], ['<|im_start|>', 'c'], ['assistant', 'assistant'], ['Paris.', 'assistant'], ['<|im_end|>', 'c']];
  seq.forEach(([t, r], i) => {
    const y = 34 + i * 17, ctl = r === 'c';
    const [f, s] = ctl ? [C.ink, C.ink] : roleCol[r];
    d.rect(380, y, 120, 15, { fill: f, stroke: s, r: 3, sw: 0.7 });
    d.text(440, y + 7.5, t, { cls: 'mono', size: 8.5, color: ctl ? C.paper : C.ink });
  });
  d.text(520, 80, 'dark: control tokens', { cls: 'xs', a: 'start' });
  d.text(520, 96, 'colour: content', { cls: 'xs', a: 'start' });
  d.hand(160, 230, 'the model only ever sees the strip on the right', { size: 15 });
  return d.svg();
}

export function inf_script_scene() {
  const d = new D(640, 240, 'inf_script_scene');
  d.text(10, 16, 'PICTURE THIS: THE SAME LINES, WITH AND WITHOUT THE SCRIPT FORMAT', { cls: 'cap', a: 'start' });
  const page = (x, title, lines, ok) => {
    d.text(x + 120, 40, title, { cls: 'ttl', size: 11, color: ok ? C.acc : C.red });
    d.rect(x, 52, 240, 150, { fill: C.paper, stroke: C.ink2, r: 4 });
    lines.forEach(([who, l], i) => {
      const y = 72 + i * 30;
      if (who) d.text(x + 14, y, who, { cls: 'mono', size: 9.5, a: 'start', color: C.acc, w: 600 });
      d.text(x + (who ? 90 : 14), y, l, { cls: 'mono', size: 9.5, a: 'start' });
    });
  };
  page(30, 'formatted: the actor knows when to speak', [['HAMLET', 'Who is there?'], ['GUARD', 'Nay, answer me.'], ['HAMLET', 'Long live the king!'], ['GUARD', '…']], true);
  page(370, 'names stripped: whose line is next?', [[null, 'Who is there?'], [null, 'Nay, answer me.'], [null, 'Long live the king!'], [null, '…']], false);
  d.hand(320, 226, 'role markers are the names in capitals', { size: 15 });
  return d.svg();
}

export function inf_template_anatomy() {
  const d = new D(640, 230, 'inf_template_anatomy');
  d.text(10, 16, 'ONE TURN, THEN THE GENERATION PROMPT', { cls: 'cap', a: 'start' });
  const o = { h: 28, cw: 6.4, pad: 7, size: 9.5, gap: 4, minw: 24 };
  const toks = ['<|im_start|>', 'user', '\\n', 'What is the capital of France?', '<|im_end|>', '\\n'];
  const c = d.chips(20, 60, toks, { ...o, fill: (i) => i === 0 || i === 4 ? C.ink : i === 3 ? C.card : C.paper, tc: (i) => i === 0 || i === 4 ? C.paper : undefined });
  const lab = [[0, 1, 'role marker'], [3, 3, 'content: 7 tokens'], [4, 4, 'end of turn'], [5, 5, 'boundary']];
  lab.forEach(([a, b, t]) => { d.brace(c[a][1], c[b][1] + c[b][2], 96, { label: t }); });
  const g = d.chips(20, 150, ['<|im_start|>', 'assistant', '\\n'], { ...o, fill: (i) => i === 0 ? C.ink : C.accSoft, stroke: (i) => i === 0 ? C.ink : C.acc, tc: (i) => i === 0 ? C.paper : undefined });
  d.rect(g.end + 6, 150, 160, 28, { stroke: C.acc, r: 5, dash: [4, 3] });
  d.text(g.end + 86, 164, 'the model writes here', { cls: 'xs', color: C.acc });
  d.text(20, 140, 'generation prompt (add_generation_prompt=True)', { cls: 'xs', a: 'start', color: C.acc });
  d.text(g.end + 180, 164, '… ends with <|im_end|> = EOS 151645', { cls: 'xs', a: 'start' });
  return d.svg();
}

export function inf_render_pipeline() {
  const d = new D(640, 300, 'inf_render_pipeline');
  d.text(10, 16, 'MESSAGES → TEXT → IDS, MASK, POSITIONS; AND A LEFT-PADDED BATCH', { cls: 'cap', a: 'start' });
  const st = [['messages', 'list of dicts'], ['render', 'Jinja template'], ['tokenize', 'specials matched'], ['tensors', 'ids, mask, positions']];
  st.forEach(([t, n], i) => {
    const x = 20 + i * 156;
    d.box(x, 36, 130, 30, t, { fill: i === 3 ? C.accSoft : C.card, stroke: i === 3 ? C.acc : C.ink2, size: 10.5 });
    d.text(x + 65, 78, n, { cls: 'xs' });
    if (i < 3) d.arrow(x + 132, 51, x + 154, 51, { stroke: C.ink2, hl: 5 });
  });
  const cw = 19, x0 = 104;
  const row = (y, lab, vals, fillf, txt) => {
    d.text(x0 - 8, y + 9, lab, { cls: 'mono', size: 9, a: 'end' });
    vals.forEach((v, i) => { const f = fillf(i); d.rect(x0 + i * cw, y, cw - 2, 18, { fill: f, stroke: C.line, r: 2, sw: 0.5 }); d.text(x0 + i * cw + (cw - 2) / 2, y + 9, txt(v, i), { cls: 'mono', size: 7.5 }); });
  };
  const pad = 11, n = 26;
  d.text(20, 112, 'batch row 2: the 15-token prompt, padded on the left to 26', { cls: 'sm', a: 'start' });
  row(124, 'ids', Array(n).fill(0), (i) => i < pad ? C.faint : C.card, (v, i) => i < pad ? 'P' : '');
  row(150, 'mask', Array(n).fill(0), (i) => i < pad ? C.faint : C.slateSoft, (v, i) => i < pad ? '0' : '1');
  row(176, 'pos', Array(n).fill(0), (i) => i < pad ? C.faint : C.accSoft, (v, i) => i < pad ? '1' : String(i - pad));
  d.brace(x0, x0 + pad * cw - 2, 202, { label: '11 pad tokens (151643), masked' });
  d.brace(x0 + pad * cw, x0 + n * cw - 2, 202, { label: 'real tokens: positions 0 to 14' });
  d.text(320, 246, 'positions = running count of mask − 1, so RoPE sees the real token order', { cls: 'xs' });
  d.hand(470, 282, 'pad left, so every row ends together', { size: 15 });
  return d.svg();
}

export function inf_prefix_cache() {
  const d = new D(640, 240, 'inf_prefix_cache');
  d.text(10, 16, 'PREFIX CACHING: SAME SYSTEM PROMPT, COMPUTED ONCE', { cls: 'cap', a: 'start' });
  d.rect(30, 90, 190, 60, { fill: C.slateSoft, stroke: C.slate, r: 6 });
  d.text(125, 112, 'system + tools: 138 tokens', { cls: 'sm', color: C.ink });
  d.text(125, 132, 'KV: 15,826,944 bytes, once', { cls: 'mono', size: 9.5 });
  ['request A: "Weather in Paris?"', 'request B: "Is it raining in Oslo?"', 'request C: "Forecast for Lima"'].forEach((t, i) => {
    const y = 40 + i * 64;
    d.rect(330, y, 280, 40, { fill: C.accSoft, stroke: C.acc, r: 6 });
    d.text(470, y + 20, t, { cls: 'mono', size: 9.5 });
    d.carrow([[222, 120], [270, 120 + (i - 1) * 30], [328, y + 20]], { stroke: C.slate, sw: 1, hl: 6 });
  });
  d.text(470, 230, 'only the orange part is prefilled per request', { cls: 'xs', color: C.acc });
  d.hand(125, 190, 'shared rows,\nread by all', { size: 15, vc: true });
  return d.svg();
}

export function inf_thinking_modes() {
  const d = new D(640, 220, 'inf_thinking_modes');
  d.text(10, 16, 'THE END OF THE PROMPT IN EACH MODE  (REAL QWEN3 TOKENS)', { cls: 'cap', a: 'start' });
  const o = { h: 26, cw: 6.4, pad: 7, size: 9.5, gap: 4, minw: 24 };
  d.text(20, 48, 'enable_thinking = True: 26 tokens', { cls: 'ttl', a: 'start', size: 11 });
  const a = d.chips(20, 60, ['…', '<|im_start|>', 'assistant', '\\n'], { ...o, fill: (i) => i === 1 ? C.ink : C.card, tc: (i) => i === 1 ? C.paper : undefined });
  d.rect(a.end + 6, 60, 250, 26, { stroke: C.acc, r: 5, dash: [4, 3] });
  d.text(a.end + 131, 73, 'model writes <think> reasoning </think> answer', { cls: 'xs', color: C.acc });
  d.text(20, 128, 'enable_thinking = False: 30 tokens', { cls: 'ttl', a: 'start', size: 11 });
  const b = d.chips(20, 140, ['…', '<|im_start|>', 'assistant', '\\n', '<think>', '\\n\\n', '</think>', '\\n\\n'], { ...o, fill: (i) => i === 1 ? C.ink : i >= 4 ? C.accSoft : C.card, stroke: (i) => i >= 4 ? C.acc : C.ink2, tc: (i) => i === 1 ? C.paper : undefined });
  d.brace(b[4][1], b[7][1] + b[7][2], 172, { label: '4 tokens pre-filled: 151667, 271, 151668, 271' });
  d.rect(b.end + 6, 140, 130, 26, { stroke: C.acc, r: 5, dash: [4, 3] });
  d.text(b.end + 71, 153, 'answer directly', { cls: 'xs', color: C.acc });
  return d.svg();
}

export function inf_tool_loop() {
  const d = new D(640, 290, 'inf_tool_loop');
  d.text(10, 16, 'ONE TOOL CALL, ROUND TRIP', { cls: 'cap', a: 'start' });
  d.box(240, 40, 160, 44, 'model', { fill: C.accSoft, stroke: C.acc, size: 12 });
  d.box(450, 120, 170, 60, '<tool_call>\n{"name": "get_weather",\n "arguments": {"city": "Paris"}}\n</tool_call>', { cls: 'mono', size: 8.5, fill: C.card });
  d.box(240, 220, 160, 44, 'your code: parse,\nvalidate, run', { fill: C.slateSoft, stroke: C.slate, size: 10.5 });
  d.box(20, 120, 170, 60, '<|im_start|>user\n<tool_response>\n{"temp_c": 18}\n</tool_response>', { cls: 'mono', size: 8.5, fill: C.card });
  d.carrow([[402, 62], [500, 76], [535, 118]], { stroke: C.acc, hl: 6 });
  d.text(500, 64, '1  generates', { cls: 'xs', a: 'start', color: C.acc });
  d.carrow([[535, 182], [500, 228], [402, 242]], { stroke: C.ink2, hl: 6 });
  d.text(510, 230, '2  ends turn', { cls: 'xs', a: 'start' });
  d.carrow([[238, 242], [140, 228], [105, 182]], { stroke: C.slate, hl: 6 });
  d.text(130, 248, '3  role "tool"', { cls: 'xs', a: 'end', color: C.slate });
  d.carrow([[105, 118], [140, 76], [238, 62]], { stroke: C.ink2, hl: 6 });
  d.text(140, 64, '4  + <|im_start|>assistant', { cls: 'xs', a: 'end' });
  d.hand(320, 150, 'the model\nreads the result\nand answers', { size: 15, vc: true });
  return d.svg();
}

export function inf_template_bugs() {
  const d = new D(640, 300, 'inf_template_bugs');
  d.text(10, 16, 'FOUR TEMPLATE MISTAKES AS THE MODEL SEES THEM', { cls: 'cap', a: 'start' });
  const o = { h: 22, cw: 6, pad: 6, size: 8.5, gap: 3, minw: 20 };
  const ctl = (t) => t.startsWith('<|');
  const rows = [
    ['no role markers', ['What', ' is', ' the', ' capital', ' of', ' France', '?'], -1, 'model may continue the text'],
    ['no generation prompt', ['…', '?', '<|im_end|>', '\\n'], 3, 'who speaks next?'],
    ['another family\'s marker', ['…', '?', '<', '|', 'eot', '_id', '|', '>'], 2, '<|eot_id|> is just text here'],
    ['endoftext as BOS', ['<|endoftext|>', '<|im_start|>', 'system', '…'], 0, 'a document break at the start'],
  ];
  rows.forEach(([title, toks, bad, note], r) => {
    const y = 40 + r * 64;
    d.text(20, y, title, { cls: 'ttl', a: 'start', size: 11 });
    const c = d.chips(20, y + 12, toks, { ...o, fill: (i) => ctl(toks[i]) ? C.ink : C.card, stroke: (i) => (bad >= 0 && i >= bad && (r !== 3 || i === 0) && (r !== 1 || i === 3)) ? C.red : ctl(toks[i]) ? C.ink : C.ink2, tc: (i) => ctl(toks[i]) ? C.paper : undefined });
    d.text(c.end + 14, y + 23, note, { cls: 'xs', a: 'start', color: C.red });
  });
  return d.svg();
}
