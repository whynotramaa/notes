import { D, C } from '../lib/draw.js';

export function inf_checkpoint_folder() {
  const d = new D(640, 270, 'inf_checkpoint_folder');
  d.text(10, 16, 'QWEN/QWEN3-0.6B: FIVE FILES, FIVE JOBS', { cls: 'cap', a: 'start' });
  d.poly([[20, 50], [110, 50], [124, 64], [300, 64], [300, 250], [20, 250]], { fill: C.card, stroke: C.ink2 });
  d.text(30, 58, 'Qwen3-0.6B/', { cls: 'mono', size: 10, a: 'start' });
  const files = [['config.json', '726 B', 'architecture', 'Part V'], ['model.safetensors', '1.50 GB', 'weights', 'Part VI'], ['tokenizer.json', '11.4 MB', 'text → IDs', 'Part VIII'], ['tokenizer_config.json', '', 'specials + chat template', 'Parts VIII, IX'], ['generation_config.json', '', 'stop tokens, sampling', 'Part X']];
  files.forEach(([f, sz, job, part], i) => {
    const y = 78 + i * 34, hot = i === 1;
    d.rect(34, y, 252, 26, { fill: hot ? C.slateSoft : C.paper, stroke: hot ? C.slate : C.ink2, r: 4, sw: 0.9 });
    d.mono(44, y + 13, f, { size: 9.5, a: 'start' });
    if (sz) d.mono(278, y + 13, sz, { size: 9, a: 'end', color: C.gray });
    d.arrow(290, y + 13, 380, y + 13, { stroke: C.gray, hl: 5 });
    d.box(384, y, 160, 26, job, { size: 10, fill: i === 4 ? C.accSoft : C.card, stroke: i === 4 ? C.acc : C.ink2, r: 4 });
    d.text(552, y + 13, part, { cls: 'xs', a: 'start' });
  });
  return d.svg();
}

export function inf_prefill_trace() {
  const d = new D(640, 340, 'inf_prefill_trace');
  d.text(10, 16, 'PREFILL OF THE RUNNING PROMPT IN QWEN3-0.6B', { cls: 'cap', a: 'start' });
  for (let i = 0; i < 26; i++) d.rect(40 + i * 11, 300, 9, 18, { fill: i === 25 ? C.accSoft : C.card, stroke: i === 25 ? C.acc : C.ink2, r: 1, sw: 0.6 });
  d.text(40, 290, '26 token IDs', { cls: 'xs', a: 'start' });
  d.arrow(180, 298, 180, 280, { stroke: C.ink2, hl: 5 });
  d.box(40, 248, 286, 30, 'embed_tokens → (1, 26, 1024)', { size: 10, fill: C.slateSoft, stroke: C.slate });
  for (let i = 2; i >= 0; i--) d.rect(40 + i * 6, 110 - i * 6, 286, 120, { fill: i ? C.paper : C.card, stroke: i ? C.line : C.ink2, r: 8, sw: 0.9 });
  d.text(183, 150, '28 layers\nRMSNorm → GQA + QK-norm + RoPE\n→ + → RMSNorm → SwiGLU → +', { cls: 'lbl', size: 10, vc: true });
  d.text(183, 210, 'positions 0 … 25, causal mask', { cls: 'xs' });
  d.arrow(180, 246, 180, 232, { stroke: C.ink2, hl: 5 });
  d.arrow(330, 170, 398, 170, { stroke: C.slate, dash: [4, 3], hl: 5 });
  d.rect(400, 110, 210, 120, { fill: C.slateSoft, stroke: C.slate, r: 8 });
  d.text(505, 140, 'KV cache', { cls: 'ttl' });
  d.text(505, 170, '56 tensors of (1, 8, 26, 128)', { cls: 'mono', size: 9.5 });
  d.text(505, 192, '2,981,888 bytes', { cls: 'mono', size: 10, color: C.slate });
  d.arrow(312, 96, 312, 76, { stroke: C.acc, sw: 1.4 });
  d.text(320, 88, 'last row only', { cls: 'xs', a: 'start', color: C.acc });
  d.box(200, 44, 230, 30, 'final norm → lm_head → (1, 151936)', { size: 10, fill: C.accSoft, stroke: C.acc });
  d.arrow(432, 59, 470, 59, { stroke: C.acc, hl: 5 });
  d.box(472, 44, 120, 30, '<think> 151667', { cls: 'mono', size: 10, fill: C.paper, stroke: C.acc });
  d.text(532, 88, 'first sampled token', { cls: 'xs', color: C.acc });
  d.hand(500, 290, '2.33 × 10¹⁰ operations', { size: 15 });
  return d.svg();
}

export function inf_full_pipeline() {
  const d = new D(640, 560, 'inf_full_pipeline');
  d.text(10, 16, 'ONE CHAT TURN THROUGH QWEN3-0.6B, EVERY STAGE WITH ITS NUMBERS', { cls: 'cap', a: 'start' });
  const st = [
    ['messages', '2 messages: system, user', 'IX', 0],
    ['chat template', '138 characters, generation prompt added', 'IX', 0],
    ['tokenizer', '26 IDs, (1, 26)', 'VIII', 0],
    ['prefill', 'one pass, 28 layers, 2.33 × 10¹⁰ operations', 'I', 1],
    ['KV cache', '56 tensors (1, 8, S, 128), 114,688 bytes per token', 'II', 2],
    ['first-token logits', '(1, 151936), last position only', 'I', 1],
    ['sampling', 'temperature 0.6, top-k 20, top-p 0.95', 'X', 0],
    ['new token', 'position 26, then 27, 28, …', 'II', 0],
    ['decode with cache', '1.19 GB read per step: ≥ 0.36 ms on an H100', 'I-III', 1],
    ['EOS / stop condition', '151645 or 151643, or max length', 'IX', 0],
    ['decoded text', 'buffered UTF-8, reasoning split at 151668', 'VIII', 0],
  ];
  st.forEach(([t, n, part, kind], i) => {
    const y = 40 + i * 46;
    const [f, s] = kind === 1 ? [C.accSoft, C.acc] : kind === 2 ? [C.slateSoft, C.slate] : [C.card, C.ink2];
    d.box(70, y, 170, 32, t, { fill: f, stroke: s, size: 11 });
    d.circle(44, y + 16, 26, { fill: C.paper, stroke: C.line, sw: 0.8 });
    d.text(44, y + 16, part, { cls: 'mono', size: 8, color: C.gray });
    d.text(256, y + 16, n, { cls: 'sm', a: 'start' });
    if (i < st.length - 1) d.arrow(155, y + 34, 155, y + 44, { stroke: C.ink2, hl: 5 });
  });
  const yS = 40 + 6 * 46 + 16, yD = 40 + 8 * 46 + 16;
  d.carrow([[522, yD], [600, yD - 8], [612, (yS + yD) / 2], [600, yS + 8], [522, yS]], { stroke: C.acc, sw: 1.4, hl: 7 });
  d.text(566, (yS + yD) / 2, 'once per\ntoken', { cls: 'xs', vc: true, color: C.acc });
  d.text(320, 548, 'circles: the part of this chapter that covers each stage', { cls: 'xs' });
  return d.svg();
}

export function inf_metrics_timeline() {
  const d = new D(640, 290, 'inf_metrics_timeline');
  d.text(10, 16, 'THE METRICS ON ONE TIMELINE  (NOT TO SCALE)', { cls: 'cap', a: 'start' });
  const y = 90;
  d.arrow(20, y, 626, y, { stroke: C.ink2, sw: 0.9, hl: 6 });
  d.box(24, y - 24, 120, 22, 'load model', { size: 10, fill: C.paper, stroke: C.line, r: 3 });
  d.rect(160, y - 24, 22, 22, { fill: C.card, stroke: C.ink2, r: 3 });
  d.text(171, y - 34, 'template,\ntokenize', { cls: 'xs', vc: true });
  d.box(184, y - 24, 110, 22, 'prefill', { size: 10, fill: C.accSoft, stroke: C.acc, r: 3 });
  for (let i = 0; i < 10; i++) d.rect(298 + i * 30, y - 20, 24, 18, { fill: C.slateSoft, stroke: C.slate, r: 3, sw: 0.8 });
  d.brace(24, 144, y + 18, { label: 'model-loading time' });
  d.brace(160, 298, y + 18, { label: 'TTFT' });
  d.brace(328, 352, y + 18, {});
  d.text(340, y + 42, 'ITL', { cls: 'sm' });
  d.brace(298, 592, y - 40, { dir: -1, label: 'tokens/s = tokens ÷ decode time' });
  d.text(240, y - 52, 'prefill throughput =\nprompt tokens ÷ prefill time', { cls: 'xs', vc: true, color: C.acc });
  const by = 250, s = 0.05;
  d.line(20, by, 626, by, { stroke: C.ink2, sw: 0.9, single: true });
  d.text(20, by + 14, 'memory', { cls: 'xs', a: 'start' });
  d.fillRect(80, by - 40, 546, 40, C.card, 1);
  d.text(110, by - 20, 'weights', { cls: 'xs', a: 'start', color: C.ink });
  d.poly([[184, by - 40], [294, by - 52], [598, by - 70], [598, by - 40]], { fill: C.slateSoft, stroke: C.slate, sw: 0.8 });
  d.text(440, by - 52, 'KV cache grows', { cls: 'xs', color: C.ink });
  d.line(20, by - 74, 626, by - 74, { stroke: C.red, sw: 0.9, dash: [4, 3], single: true });
  d.text(20, by - 82, 'peak memory', { cls: 'xs', a: 'start', color: C.red });
  return d.svg();
}

export function inf_checklist_card() {
  const d = new D(640, 350, 'inf_checklist_card');
  d.text(10, 16, 'THE FINAL CHECKLIST: NINE CLAIMS, NINE TESTS', { cls: 'cap', a: 'start' });
  const items = [['architecture = config', 'params = 596,049,920'], ['shapes = checkpoint', 'every header shape'], ['mapping correct', 'each param loaded once'], ['logit parity', 'fp32 and bf16 tolerances'], ['tokenizer = checkpoint', 'IDs and round trips'], ['template = training', 'prompts equal, token for token'], ['cached = uncached', '100 greedy steps'], ['quantized re-measured', 'size, speed, KL, tasks'], ['terminates correctly', 'stops on 151645, 151643']];
  items.forEach(([t, n], i) => {
    const r = Math.floor(i / 3), c = i % 3, x = 20 + c * 204, y = 34 + r * 104;
    d.rect(x, y, 192, 92, { fill: i === 3 ? C.accSoft : C.card, stroke: i === 3 ? C.acc : C.ink2, r: 10 });
    d.rect(x + 14, y + 16, 16, 16, { fill: C.paper, stroke: C.ink, r: 3, sw: 1 });
    d.lines([[x + 17, y + 24], [x + 21, y + 29], [x + 28, y + 18]], { stroke: C.acc, sw: 1.8, single: true });
    d.text(x + 40, y + 24, t, { cls: 'ttl', a: 'start', size: 11 });
    d.text(x + 14, y + 56, n, { cls: 'xs', a: 'start' });
    d.mono(x + 178, y + 80, String(i + 1), { size: 9, a: 'end', color: C.gray });
  });
  return d.svg();
}
