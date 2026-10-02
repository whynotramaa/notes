import { D, C } from '../lib/draw.js';

export function inf_tokenizer_swap() {
  const d = new D(640, 250, 'inf_tokenizer_swap');
  d.text(10, 16, '"HELLO WORLD" THROUGH TWO TOKENIZERS INTO QWEN3\'S EMBEDDING TABLE', { cls: 'cap', a: 'start' });
  d.mono(60, 130, '"Hello world"', { size: 11 });
  d.box(130, 56, 110, 30, 'GPT-2 tokenizer', { size: 10, fill: C.paper, stroke: C.red });
  d.box(130, 176, 110, 30, 'Qwen3 tokenizer', { size: 10, fill: C.accSoft, stroke: C.acc });
  d.arrow(100, 118, 128, 76, { stroke: C.gray, hl: 5 }); d.arrow(100, 142, 128, 186, { stroke: C.gray, hl: 5 });
  d.mono(290, 62, '15496, 995', { size: 10.5, color: C.red });
  d.mono(290, 190, '9707, 1879', { size: 10.5, color: C.acc });
  d.arrow(242, 71, 260, 71, { stroke: C.red, hl: 5 }); d.arrow(242, 191, 260, 191, { stroke: C.acc, hl: 5 });
  const tx = 380, rows = [[995, 'ception', C.red], [1879, 'Ġworld', C.acc], [9707, 'Hello', C.acc], [15496, 'Ġpresentation', C.red]];
  d.rect(tx, 40, 70, 190, { fill: C.card, stroke: C.ink2, r: 3 });
  d.text(tx + 35, 32, 'Qwen3 rows', { cls: 'xs' });
  rows.forEach(([id, tok, col], i) => {
    const y = 60 + i * 42;
    d.rect(tx + 2, y, 66, 14, { fill: col === C.red ? C.paper : C.accSoft, stroke: col, r: 2, sw: 0.9 });
    d.mono(tx - 6, y + 7, String(id), { size: 9, a: 'end', color: col });
    d.mono(tx + 76, y + 7, tok, { size: 9.5, a: 'start', color: col });
  });
  d.carrow([[330, 64], [356, 60], [378, 67]], { stroke: C.red, sw: 0.8, hl: 5 });
  d.carrow([[330, 190], [356, 160], [378, 151]], { stroke: C.acc, sw: 0.8, hl: 5 });
  d.text(560, 110, 'model reads\n" presentationception"', { cls: 'xs', vc: true, color: C.red });
  d.text(560, 196, 'model reads\n"Hello world"', { cls: 'xs', vc: true, color: C.acc });
  return d.svg();
}

export function inf_tokenizer_pipeline() {
  const d = new D(640, 310, 'inf_tokenizer_pipeline');
  d.text(10, 16, 'QWEN3 TOKENIZER, STAGE BY STAGE, ON "Hello world 12"', { cls: 'cap', a: 'start' });
  const st = [['normalize (NFC)', '"Hello world 12"'], ['match added tokens', 'none here'], ['regex split', null], ['bytes → printable', null], ['BPE merges + lookup', null]];
  st.forEach(([t, note], i) => {
    const y = 40 + i * 52;
    d.box(20, y, 150, 32, t, { size: 10.5, fill: i === 2 ? C.accSoft : C.card, stroke: i === 2 ? C.acc : C.ink2 });
    if (i < 4) d.arrow(95, y + 34, 95, y + 50, { stroke: C.ink2, hl: 5 });
    if (note) d.mono(190, y + 16, note, { size: 10, a: 'start', color: C.gray });
  });
  const o = { h: 24, cw: 6.6, pad: 8, size: 10, gap: 6, minw: 28 };
  d.chips(190, 144, ['Hello', ' world', ' ', '1', '2'], { ...o, fill: (i) => i >= 3 ? C.accFaint : C.card, stroke: (i) => i >= 3 ? C.acc : C.ink2 });
  d.text(470, 156, 'each digit its own chunk', { cls: 'xs', a: 'start', color: C.acc });
  d.chips(190, 196, ['Hello', 'Ġworld', 'Ġ', '1', '2'], o);
  d.text(470, 208, 'space byte 0x20 shown as Ġ', { cls: 'xs', a: 'start' });
  const ids = d.chips(190, 248, ['9707', '1879', '220', '16', '17'], { ...o, fill: C.slateSoft, stroke: C.slate });
  d.text(470, 260, '5 token IDs', { cls: 'xs', a: 'start', color: C.slate });
  d.hand(320, 296, 'decode runs it backwards: IDs → bytes → UTF-8', { size: 14 });
  return d.svg();
}

export function inf_special_map() {
  const d = new D(640, 250, 'inf_special_map');
  d.text(10, 16, 'THE TOP OF QWEN3\'S ID SPACE: 151,643 LEARNED TOKENS, 26 ADDED, 267 UNUSED ROWS', { cls: 'cap', a: 'start' });
  const x0 = 30, cw = 16;
  d.rect(x0, 60, 70, 40, { fill: C.card, stroke: C.ink2, r: 3 });
  d.text(x0 + 35, 80, '0 … 151,642\nBPE tokens', { cls: 'xs', vc: true, color: C.ink });
  const grp = (i) => i === 0 ? 0 : i <= 2 ? 1 : i <= 13 ? 2 : i <= 15 ? 3 : i <= 21 ? 4 : i <= 23 ? 5 : 6;
  const col = [[C.accSoft, C.acc], [C.accSoft, C.acc], [C.faint, C.line], [C.slateSoft, C.slate], [C.faint, C.line], [C.slateSoft, C.slate], [C.accFaint, C.acc]];
  for (let i = 0; i < 26; i++) { const g = grp(i); d.rect(x0 + 76 + i * cw, 60, cw - 2, 40, { fill: col[g][0], stroke: col[g][1], r: 2, sw: 0.8 }); }
  const lab = [[0, 0, '<|endoftext|>\n151643'], [1, 2, 'im_start, im_end\n151644, 151645'], [3, 13, 'vision + grounding\n151646 to 151656'], [14, 15, 'tool_call\n151657, 151658'], [16, 21, 'FIM + repo\n151659 to 151664'], [22, 23, 'tool_response\n151665, 151666'], [24, 25, 'think\n151667, 151668']];
  lab.forEach(([a, b, t], k) => {
    const xa = x0 + 76 + a * cw, xb = x0 + 76 + (b + 1) * cw - 2, up = k % 2 === 0;
    d.brace(xa, xb, up ? 52 : 108, { dir: up ? -1 : 1 });
    d.text((xa + xb) / 2, up ? 30 : 136, t, { cls: 'xs', vc: true, color: C.ink });
  });
  d.rect(x0 + 76 + 26 * cw + 6, 60, 60, 40, { fill: C.paper, stroke: C.line, r: 3, fs: 'hachure', gap: 5 });
  d.text(x0 + 76 + 26 * cw + 36, 116, '267 rows,\nnever produced', { cls: 'xs', vc: true });
  d.text(x0 + 76 + 26 * cw + 36, 150, 'vocab_size 151,936', { cls: 'xs', color: C.gray });
  d.rect(30, 186, 580, 44, { fill: C.paper, stroke: C.line, r: 6 });
  d.text(40, 200, 'skip_special_tokens=True removes:  endoftext, im_start, im_end, vision + grounding', { cls: 'xs', a: 'start' });
  d.text(40, 218, 'it keeps:  tool_call, tool_response, think, FIM + repo  (added tokens without the special flag)', { cls: 'xs', a: 'start', color: C.red });
  return d.svg();
}

export function inf_literal_vs_control() {
  const d = new D(640, 230, 'inf_literal_vs_control');
  d.text(10, 16, 'USER TEXT "I said <|im_end|> literally", TOKENIZED TWO WAYS', { cls: 'cap', a: 'start' });
  const o = { h: 26, cw: 6.4, pad: 7, size: 10, gap: 5, minw: 26 };
  d.text(20, 48, 'special strings matched (the default)', { cls: 'ttl', a: 'start', size: 11 });
  const a = d.chips(30, 60, ['I', 'Ġsaid', 'Ġ', '<|im_end|> = 151645', 'Ġliterally'], { ...o, fill: (i) => i === 3 ? C.paper : C.card, stroke: (i) => i === 3 ? C.red : C.ink2, tc: (i) => i === 3 ? C.red : undefined });
  d.text(a.end + 12, 73, '5 tokens: the turn ends here', { cls: 'xs', a: 'start', color: C.red });
  d.text(20, 126, 'special strings split (encode_special_tokens)', { cls: 'ttl', a: 'start', size: 11 });
  const b = d.chips(30, 138, ['I', 'Ġsaid', 'Ġ<|', 'im', '_end', '|', '>', 'Ġliterally'], { ...o, fill: (i) => i >= 2 && i <= 6 ? C.accSoft : C.card, stroke: (i) => i >= 2 && i <= 6 ? C.acc : C.ink2 });
  d.text(b.end + 12, 151, '8 tokens: just text', { cls: 'xs', a: 'start', color: C.acc });
  d.hand(320, 210, 'but "<think>" is one token either way', { size: 15, color: C.red });
  return d.svg();
}

export function inf_stream_bytes() {
  const d = new D(640, 240, 'inf_stream_bytes');
  d.text(10, 16, '🫠 IS 4 UTF-8 BYTES IN 3 TOKENS: STREAM WITHOUT AND WITH A BYTE BUFFER', { cls: 'cap', a: 'start' });
  const toks = [['9284', 2], ['104', 1], ['254', 1]];
  let bx = 120;
  d.text(20, 64, 'bytes', { cls: 'sm', a: 'start' });
  ['F0', '9F', 'AB', 'A0'].forEach((b, i) => d.box(120 + i * 50, 50, 44, 26, b, { cls: 'mono', size: 10, fill: C.slateSoft, stroke: C.slate, r: 3 }));
  d.text(20, 108, 'tokens', { cls: 'sm', a: 'start' });
  toks.forEach(([id, n]) => { d.box(bx, 94, n * 50 - 6, 26, id, { cls: 'mono', size: 10, fill: C.card, r: 3 }); bx += n * 50; });
  d.text(20, 160, 'decode each', { cls: 'sm', a: 'start' });
  bx = 120;
  toks.forEach(([, n]) => { d.box(bx, 146, n * 50 - 6, 26, '�', { size: 13, fill: C.paper, stroke: C.red, r: 3, tc: C.red }); bx += n * 50; });
  d.text(330, 159, 'three replacement characters', { cls: 'xs', a: 'start', color: C.red });
  d.text(20, 212, 'buffer, then decode', { cls: 'sm', a: 'start' });
  d.box(120, 198, 194, 26, '🫠', { size: 14, fill: C.accSoft, stroke: C.acc, r: 3 });
  d.text(330, 211, 'hold bytes until a character completes', { cls: 'xs', a: 'start', color: C.acc });
  return d.svg();
}

export function inf_prompt_tokens() {
  const d = new D(640, 262, 'inf_prompt_tokens');
  d.text(10, 16, 'THE RUNNING PROMPT: 26 TOKENS, COLOURED BY ROLE', { cls: 'cap', a: 'start' });
  const T = ['<|im_start|>', 'system', '\\n', 'You', ' are', ' a', ' helpful', ' assistant', '.', '<|im_end|>', '\\n', '<|im_start|>', 'user', '\\n', 'What', ' is', ' the', ' capital', ' of', ' France', '?', '<|im_end|>', '\\n', '<|im_start|>', 'assistant', '\\n'];
  const ctrl = (t) => t.startsWith('<|');
  const role = (i) => i <= 10 ? 0 : i <= 22 ? 1 : 2;
  const fills = [C.slateSoft, C.card, C.accSoft], strokes = [C.slate, C.ink2, C.acc];
  const o = { h: 24, cw: 6.2, pad: 5, size: 9, gap: 3, minw: 20 };
  const rows = [[0, 11], [11, 23], [23, 26]];
  rows.forEach(([a, b], r) => {
    const y = 40 + r * 70;
    const c = d.chips(20, y, T.slice(a, b), { ...o, fill: (i) => ctrl(T[a + i]) ? C.ink : fills[role(a + i)], stroke: (i) => ctrl(T[a + i]) ? C.ink : strokes[role(a + i)], tc: (i) => ctrl(T[a + i]) ? C.paper : undefined });
    c.forEach(([cx], i) => d.text(cx, y + 34, String(a + i), { cls: 'xs' }));
    d.text(20, y + 50, ['system message: 11 tokens', 'user message: 12 tokens', 'assistant turn opened, left empty'][r], { cls: 'xs', a: 'start', color: strokes[r] });
  });
  d.hand(470, 246, 'the model writes from position 26', { size: 15 });
  return d.svg();
}
