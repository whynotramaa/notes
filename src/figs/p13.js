import { D, C } from '../lib/draw.js';

export function train_loop() {
  const d = new D(640, 340, 'train_loop');
  d.text(10, 16, 'ONE TRAINING STEP, SIX MOVES, REPEATED TENS OF THOUSANDS OF TIMES', { cls: 'cap', a: 'start' });
  const cx = 320, cy = 178, R = 118;
  const st = [['1. batch', 'x, y = next_batch()'], ['2. forward', 'logits = model(x)'], ['3. loss', 'cross_entropy(logits, y)'], ['4. backward', 'loss.backward()'], ['5. step', 'optimizer.step()'], ['6. zero', 'optimizer.zero_grad()']];
  const P = st.map((_, i) => { const a = -Math.PI / 2 + i * Math.PI / 3; return [cx + R * Math.cos(a), cy + R * Math.sin(a), a]; });
  st.forEach(([t, code], i) => {
    const [x, y, a] = P[i];
    d.box(x - 56, y - 18, 112, 36, t, { fill: i === 2 ? C.accSoft : C.card, stroke: i === 2 ? C.acc : C.ink2, size: 11.5 });
    const side = Math.abs(Math.cos(a)) > 0.1;
    d.mono(side ? x + (Math.cos(a) > 0 ? 64 : -64) : x, side ? y : y + (Math.sin(a) < 0 ? -28 : 30), code, { size: 9, a: side ? (Math.cos(a) > 0 ? 'start' : 'end') : 'middle', color: C.gray });
    const [nx, ny] = P[(i + 1) % 6];
    d.arrow(x + (nx - x) * 0.36, y + (ny - y) * 0.36, x + (nx - x) * 0.64, y + (ny - y) * 0.64, { stroke: C.acc, sw: 1.1 });
  });
  d.hand(cx, cy, 'predict, measure,\nblame, nudge', { size: 17, vc: true });
  return d.svg();
}

export function neglog() {
  const d = new D(640, 270, 'neglog');
  const M = d.axes(70, 30, 360, 200, { xmin: 0, xmax: 1, ymin: 0, ymax: 7, xl: 'p(correct token)', yl: 'loss = −ln p' });
  d.fn((t) => -Math.log(t), 0.0012, 1, M, { n: 160 });
  [[0.9, '0.11'], [0.5, '0.69'], [0.1, '2.30'], [0.01, '4.61']].forEach(([p, s]) => {
    d.dot(M.X(p), M.Y(-Math.log(p)), 3, C.ink);
    d.mono(M.X(p) + 8, M.Y(-Math.log(p)) - 9, `p = ${p} → ${s}`, { size: 9.5, a: 'start' });
  });
  [0, 0.5, 1].forEach((t) => d.text(M.X(t), 244, String(t), { cls: 'xs' }));
  d.hand(520, 70, 'confident and wrong:\nthe loss explodes', { size: 17, vc: true });
  d.carrow([[478, 86], [300, 130], [92, 70]], { stroke: C.acc, sw: 1 });
  d.hand(530, 200, 'confident and right:\nloss near zero', { size: 17, vc: true, color: C.ink2 });
  return d.svg();
}

export function gradient_slope() {
  const d = new D(640, 250, 'gradient_slope');
  d.text(10, 16, 'A GRADIENT IS A SLOPE: WHICH WAY IS DOWNHILL, AND HOW STEEP  (TOY LOSS (w − 3)²)', { cls: 'cap', a: 'start' });
  const M = d.axes(60, 40, 420, 170, { xmin: 0, xmax: 6, ymin: 0, ymax: 9, xl: 'weight w', yl: 'loss' });
  d.fn((w) => (w - 3) ** 2, 0, 6, M, { stroke: C.ink, sw: 1.4 });
  const w = 1, L = 4, g = -4;
  d.line(M.X(0.2), M.Y(L + g * (0.2 - w)), M.X(1.9), M.Y(L + g * (1.9 - w)), { stroke: C.acc, sw: 1.4, single: true });
  d.dot(M.X(w), M.Y(L), 4, C.acc);
  d.mono(M.X(w) + 10, M.Y(L) + 4, 'w = 1, loss = 4, slope = −4', { size: 9.5, a: 'start' });
  d.arrow(M.X(w), M.Y(L) + 22, M.X(1.4), M.Y(L) + 22, { stroke: C.acc, sw: 1.4 });
  d.mono(M.X(1.2), M.Y(L) + 36, 'step: w − 0.1 × (−4) = 1.4', { size: 9.5, color: C.acc });
  d.dot(M.X(3), M.Y(0), 3.4, C.ink);
  d.text(M.X(3), M.Y(0) - 14, 'minimum', { cls: 'xs' });
  [0, 1, 2, 3, 4, 5, 6].forEach((t) => d.text(M.X(t), 224, String(t), { cls: 'xs' }));
  d.hand(560, 90, 'negative slope:\nincrease w', { size: 16, vc: true });
  return d.svg();
}

export function lr_bowl() {
  const d = new D(640, 250, 'lr_bowl');
  d.text(10, 16, 'SIX STEPS ON (w − 3)² FROM w = 1 AT FOUR LEARNING RATES', { cls: 'cap', a: 'start' });
  [[0.01, 'too small: crawls'], [0.1, 'reasonable'], [0.45, 'fast: lands in 3 steps'], [1.1, 'too big: diverges']].forEach(([lr, lab], k) => {
    const x0 = 14 + k * 158, W = 140, H = 140, y0 = 50;
    const X = (w) => x0 + (w + 4) / 14 * W, Y = (l) => y0 + H - Math.min(l, 50) / 50 * H;
    const pts = []; for (let i = 0; i <= 60; i++) { const w = -4 + i / 60 * 14; pts.push([X(w), Y((w - 3) ** 2)]); }
    d.lines(pts, { stroke: C.ink2, sw: 1, rough: 0.3, single: true });
    let w = 1; const path = [[X(w), Y((w - 3) ** 2)]];
    for (let i = 0; i < 6; i++) { w = w - lr * 2 * (w - 3); path.push([X(w), Y((w - 3) ** 2)]); }
    d.lines(path, { stroke: lr > 1 ? C.red : C.acc, sw: 1.2, rough: 0.3, single: true });
    path.forEach(([x, y]) => d.dot(x, y, 2.6, lr > 1 ? C.red : C.acc));
    d.text(x0 + W / 2, 40, `lr = ${lr}`, { cls: 'ttl', size: 11 });
    d.text(x0 + W / 2, 210, lab, { cls: 'xs', color: lr > 1 ? C.red : C.ink2 });
    d.mono(x0 + W / 2, 226, `w₆ = ${w.toFixed(2)}`, { size: 9.5 });
  });
  return d.svg();
}

export function sgd_adam() {
  const d = new D(640, 260, 'sgd_adam');
  d.text(10, 16, 'A NARROW VALLEY: PLAIN GRADIENT DESCENT ZIG-ZAGS, ADAM HEADS DOWN THE VALLEY  (ILLUSTRATIVE)', { cls: 'cap', a: 'start' });
  const cx = 330, cy = 140;
  [1, 2, 3, 4].forEach((k) => d.ellipse(cx, cy, 120 * k, 26 * k, { stroke: C.faint, sw: 0.9 }));
  d.dot(cx, cy, 4, C.ink);
  const sgd = []; let x = -230, y = 60;
  for (let i = 0; i < 14; i++) { sgd.push([cx + x, cy - y]); x -= 0.015 * 2 * x * 2; y -= 1.9 * y; }
  d.lines(sgd, { stroke: C.ink2, sw: 1.1, rough: 0.3, single: true });
  sgd.forEach(([a, b]) => d.dot(a, b, 2.2, C.ink2));
  const adam = [[cx - 230, cy - 60], [cx - 175, cy - 30], [cx - 120, cy - 12], [cx - 70, cy - 4], [cx - 30, cy - 1], [cx - 6, cy]];
  d.lines(adam, { stroke: C.acc, sw: 1.5, rough: 0.3, single: true });
  adam.forEach(([a, b]) => d.dot(a, b, 2.6, C.acc));
  d.text(cx - 240, cy - 72, 'start', { cls: 'xs' });
  d.hand(160, 232, 'SGD: bounces wall to wall', { size: 15, color: C.ink2 });
  d.hand(470, 232, 'Adam: per-weight step sizes', { size: 15 });
  return d.svg();
}

export function lr_schedule() {
  const d = new D(640, 240, 'lr_schedule');
  d.text(10, 16, 'FINCH-19’S SCHEDULE: 200 WARMUP STEPS TO 6e-4, COSINE DECAY TO 6e-5 AT STEP 10,000', { cls: 'cap', a: 'start' });
  const peak = 6e-4, mn = 6e-5, S = 10000, W = 200;
  const lr = (s) => (s < W ? peak * s / W : mn + 0.5 * (peak - mn) * (1 + Math.cos(Math.PI * (s - W) / (S - W))));
  const M = d.axes(70, 40, 500, 150, { xmin: 0, xmax: S, ymin: 0, ymax: 7e-4, xl: 'step', yl: 'learning rate' });
  d.fn(lr, 0, S, M, { n: 300 });
  d.fillRect(M.X(0), 40, M.X(W) - M.X(0), 150, C.acc, 0.1);
  d.text(M.X(W) + 4, 54, 'warmup', { cls: 'xs', a: 'start', color: C.acc });
  [[5000, lr(5000)], [10000, mn]].forEach(([s, v]) => { d.dot(M.X(s), M.Y(v), 3); d.mono(M.X(s) - 6, M.Y(v) - 12, v.toExponential(1), { size: 9, a: 'end' }); });
  [0, 2500, 5000, 7500, 10000].forEach((s) => d.text(M.X(s), 206, s.toLocaleString('en-US'), { cls: 'xs' }));
  d.hand(470, 80, 'big steps early,\nsmall steps to settle', { size: 15, vc: true });
  return d.svg();
}

export function grad_clip() {
  const d = new D(640, 230, 'grad_clip');
  d.text(10, 16, 'GRADIENT CLIPPING: SAME DIRECTION, LENGTH CAPPED AT c = 1', { cls: 'cap', a: 'start' });
  const cx = 160, cy = 130, s = 30;
  d.circle(cx, cy, 2 * s, { stroke: C.acc, sw: 1, dash: [4, 3] });
  d.text(cx, cy + s + 14, 'cap c = 1', { cls: 'xs', color: C.acc });
  const g = [4, 3];
  d.arrow(cx, cy, cx + g[0] * s * 0.9, cy - g[1] * s * 0.9, { stroke: C.line, sw: 1.2, dash: [4, 3] });
  d.mono(cx + g[0] * s * 0.9 + 6, cy - g[1] * s * 0.9, 'g, length 5', { size: 9.5, a: 'start', color: C.gray });
  d.arrow(cx, cy, cx + 0.8 * s, cy - 0.6 * s, { stroke: C.acc, sw: 1.8 });
  d.text(380, 70, 'g = [4, 3],  ‖g‖ = 5', { cls: 'mono', size: 10.5, a: 'start' });
  d.text(380, 96, 'scale = min(1, c / ‖g‖) = 0.2', { cls: 'mono', size: 10.5, a: 'start' });
  d.text(380, 122, 'clipped g = [0.8, 0.6],  length 1', { cls: 'mono', size: 10.5, a: 'start', color: C.acc });
  d.hand(470, 180, 'one odd batch cannot\nfling the weights away', { size: 15, vc: true });
  return d.svg();
}

export function loss_curves() {
  const d = new D(640, 250, 'loss_curves');
  d.text(10, 16, 'TRAINING LOSS FALLS; VALIDATION LOSS TURNS UP ONCE THE MODEL MEMORIZES (ILLUSTRATIVE)', { cls: 'cap', a: 'start' });
  const M = d.axes(70, 40, 500, 160, { xmin: 0, xmax: 100, ymin: 1.5, ymax: 10.5, xl: 'training step (×100)', yl: 'loss' });
  const tr = (t) => 2.0 + 8.37 * Math.exp(-t / 9) - 0.004 * t;
  const va = (t) => 2.35 + 8.0 * Math.exp(-t / 9) + 0.00012 * Math.max(0, t - 45) ** 2;
  d.fn(tr, 0, 100, M, { stroke: C.slate, sw: 1.5 });
  d.fn(va, 0, 100, M, { stroke: C.acc, sw: 1.5 });
  let best = 0; for (let t = 1; t <= 100; t++) if (va(t) < va(best)) best = t;
  d.dot(M.X(best), M.Y(va(best)), 4, C.acc);
  d.text(M.X(best), M.Y(va(best)) - 14, 'best checkpoint', { cls: 'xs', color: C.acc });
  d.text(M.X(96), M.Y(tr(96)) + 14, 'training', { cls: 'xs', color: C.slate, a: 'end' });
  d.text(M.X(96), M.Y(va(96)) - 12, 'validation', { cls: 'xs', color: C.acc, a: 'end' });
  d.mono(M.X(0) + 8, M.Y(10.37), 'start ≈ ln 32,000 = 10.37', { size: 9, a: 'start' });
  return d.svg();
}

export function repro_runs() {
  const d = new D(640, 230, 'repro_runs');
  d.text(10, 16, 'TWO RUNS, THREE SITUATIONS  (ILLUSTRATIVE LOSS CURVES)', { cls: 'cap', a: 'start' });
  const base = (t, s) => 2.4 + 5 * Math.exp(-t / 8) + 0.05 * Math.sin(t * 1.3 + s);
  [['same seed', () => 0], ['different seed', (t) => 0.12 * Math.sin(t * 0.7 + 2) * Math.exp(-t / 40)], ['same seed, nondeterministic kernels', (t) => (t < 12 ? 0 : 0.002 * (t - 12) ** 1.6 * Math.sin(t * 0.9))]].forEach(([lab, diff], k) => {
    const x0 = 14 + k * 210, W = 190, H = 120, y0 = 50;
    const X = (t) => x0 + t / 60 * W, Y = (v) => y0 + H - (v - 2) / 6 * H;
    const a = [], b = [];
    for (let t = 0; t <= 60; t++) { a.push([X(t), Y(base(t, 0))]); b.push([X(t), Y(base(t, 0) + diff(t))]); }
    d.lines(a, { stroke: C.slate, sw: 1.3, rough: 0.2, single: true });
    d.lines(b, { stroke: C.acc, sw: 1.1, rough: 0.2, single: true, dash: [4, 3] });
    d.rect(x0, y0, W, H, { r: 4, stroke: C.line, sw: 0.8 });
    d.text(x0 + W / 2, 40, lab, { cls: 'ttl', size: 11 });
  });
  d.text(110, 196, 'curves identical', { cls: 'xs' });
  d.text(320, 196, 'different paths, similar end', { cls: 'xs' });
  d.text(530, 196, 'identical, then drifting apart', { cls: 'xs' });
  return d.svg();
}

export function repro_checklist() {
  const d = new D(640, 300, 'repro_checklist');
  d.text(10, 16, 'THE REPRODUCIBILITY CHECKLIST', { cls: 'cap', a: 'start' });
  const items = [['Seed every RNG', 'Python, NumPy, PyTorch CPU and GPU'], ['Deterministic kernels', 'use_deterministic_algorithms(True)'], ['Seed data workers', 'base seed + worker id'], ['Fixed data order', 'record shard order and shuffle seed'], ['Save the full config', 'every hyperparameter, in the run folder'], ['Pin library versions', 'lock file or container image'], ['Checkpoint everything', 'weights, optimizer, scheduler, RNG, data position'], ['Record the hardware', 'GPU model, driver, CUDA version']];
  items.forEach(([n, j], i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 20 + col * 310, y = 34 + row * 64;
    d.rect(x, y, 290, 54, { r: 8, fill: C.card, stroke: C.ink2, sw: 1 });
    d.rect(x + 12, y + 14, 16, 16, { r: 3, stroke: C.acc, sw: 1.2 });
    d.lines([[x + 15, y + 22], [x + 19, y + 27], [x + 26, y + 16]], { stroke: C.acc, sw: 1.6, single: true, rough: 0.4 });
    d.text(x + 38, y + 22, n, { cls: 'ttl', a: 'start' });
    d.text(x + 38, y + 40, j, { cls: 'xs', a: 'start' });
  });
  return d.svg();
}
