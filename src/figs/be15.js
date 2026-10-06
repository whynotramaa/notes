import { C, fig, beMap, beCover, card, steps, panel, cross, tick, lanes, seg, sheet, gauge, hbars, signpost, shield, hose } from '../lib/be-kit.js';
import { pipe, bolt } from '../lib/sd-kit.js';

const PARTS = ['Containers', 'Kubernetes objects', 'Scheduling, probes and autoscaling', 'Graceful shutdown', 'Deployment strategies', 'Compatibility and zero-downtime migrations', 'Feature flags', 'Monoliths and microservices', 'Cost-aware backend engineering', 'The full request'];
export const where_be_dep = (stage = 99) => beMap('where_be_dep', PARTS, stage);

function box3(d, x, y, w, h, o = {}) {
  const k = o.k ?? 10;
  d.poly([[x, y], [x + w, y], [x + w + k, y - k], [x + k, y - k]], { fill: o.top ?? C.paper, stroke: o.stroke ?? C.ink2 });
  d.poly([[x + w, y], [x + w + k, y - k], [x + w + k, y + h - k], [x + w, y + h]], { fill: o.side ?? C.card, stroke: o.stroke ?? C.ink2 });
  d.rect(x, y, w, h, { r: 0, fill: o.fill ?? C.card, stroke: o.stroke ?? C.ink2 });
  if (o.label) d.text(x + w / 2, y + h / 2, o.label, { cls: o.cls ?? 'mono', size: o.size ?? 9.5, color: o.color, vc: true });
}

function pod(d, x, y, o = {}) {
  const w = o.w ?? 44, h = o.h ?? 34, hot = o.hot;
  d.rect(x, y, w, h, { r: 8, fill: hot ? C.accSoft : (o.fill ?? C.card), stroke: hot ? C.acc : (o.stroke ?? C.ink2), dash: o.dash });
  if (o.label) d.mono(x + w / 2, y + h / 2, o.label, { size: o.size ?? 8.5, color: hot ? C.acc : undefined });
}

function hop(d, x, y, label, o = {}) {
  d.circle(x, y, o.r ?? 34, { fill: o.hot ? C.accSoft : C.card, stroke: o.hot ? C.acc : C.ink2 });
  d.text(x, y, label, { cls: 'xs', vc: true, color: o.hot ? C.acc : undefined });
}

export const cover_be_dep = () => beCover('cover_be_dep', 'XV', ['Deployment and', 'the full request'], 'Containers, Kubernetes, safe releases and one request end to end', (d, y) => {
  [0, 1, 2].forEach((i) => box3(d, 60 + i * 70, y + 140 - i * 0, 60, 46, { label: i === 2 ? 'v813' : 'v812', fill: i === 2 ? C.accSoft : C.card, stroke: i === 2 ? C.acc : C.ink2 }));
  d.line(40, y + 200, 290, y + 200, { stroke: C.ink2, sw: 1.6, single: true });
  d.phone(330, y + 60, 110);
  const pts = [[388, y + 115], [440, y + 80], [500, y + 110], [540, y + 60], [590, y + 120]];
  d.curve(pts, { stroke: C.acc, sw: 1.6, single: true });
  pts.forEach(([a, b], i) => d.dot(a, b, i === 4 ? 5 : 3.5, i === 4 ? C.acc : C.ink2));
  d.travel(pts, { token: 'packet' });
  d.db(560, y + 150, 50, 50, {});
  d.hand(180, y + 250, 'ship it, then follow it', { size: 18 });
}, [['Containers', 'images, namespaces, PID 1'], ['Kubernetes', 'pods, Services, HPA'], ['Releases', 'canary, migrations, flags'], ['The request', 'DNS to database and back']]);

export function be_dep_layers() {
  const d = fig('be_dep_layers', 'AN IMAGE IS A STACK OF READ-ONLY LAYERS', 340);
  const L = [['FROM python:3.12-slim', 'base, shared', 50], ['COPY requirements.txt', '1 KB', 4], ['RUN pip install', 'dependencies, cached', 30], ['COPY . .', 'source, changes daily', 8], ['writable layer', 'per container', 0]];
  L.forEach(([s, t, mb], i) => { const y = 250 - i * 42, hot = i === 3, top = i === 4; box3(d, 60, y, 260, 32, { label: s, fill: top ? C.paper : hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2, color: hot ? C.acc : undefined }); d.text(350, y + 16, t, { cls: 'xs', a: 'start', color: hot ? C.acc : undefined }); if (top) d.rect(60, y, 260, 32, { r: 0, stroke: C.gray, dash: [4, 3] }); });
  d.mono(520, 120, 'registry.wren.example/', { size: 9 }); d.mono(520, 136, 'orders@sha256:9f2c…', { size: 9, color: C.acc });
  d.text(520, 166, 'deploy by digest;', { cls: 'xs' }); d.text(520, 182, 'tags can move', { cls: 'xs' });
  d.hand(470, 260, 'code change → one layer', { size: 15 });
  return d.svg();
}

export function be_dep_namespaces() {
  const d = fig('be_dep_namespaces', 'CONTAINERS ARE HOST PROCESSES WITH PRIVATE VIEWS AND LIMITS', 340);
  d.rect(20, 270, 600, 40, { r: 6, fill: C.slateSoft, stroke: C.ink2 }); d.text(320, 290, 'one shared Linux kernel', { cls: 'ttl' });
  [['orders', 40], ['payments', 240], ['search', 440]].forEach(([s, x], i) => {
    d.rect(x, 60, 180, 190, { r: 8, fill: i === 0 ? C.accFaint : C.paper, stroke: i === 0 ? C.acc : C.ink2, dash: [5, 3] });
    d.text(x + 90, 78, s, { cls: 'ttl', color: i === 0 ? C.acc : undefined });
    ['pid: sees itself as 1', 'net: own IP, port 8080', 'mnt: own / tree', 'uts: own hostname'].forEach((t, k) => d.mono(x + 12, 104 + k * 20, t, { a: 'start', size: 8.5 }));
    d.rect(x + 12, 196, 156, 40, { r: 4, fill: C.card, stroke: C.ink2 }); d.text(x + 90, 208, 'cgroup', { cls: 'xs' }); d.mono(x + 90, 226, 'memory.max 1Gi', { size: 8.5 });
    d.line(x + 90, 250, x + 90, 270, { stroke: C.gray, single: true });
  });
  return d.svg();
}

export function be_dep_pid1() {
  const d = fig('be_dep_pid1', 'WHO RECEIVES SIGTERM?', 330);
  panel(d, 20, 50, 290, 220, 'CMD gunicorn wren.app');
  panel(d, 330, 50, 290, 220, 'CMD ["gunicorn", "wren.app"]', true);
  d.box(110, 110, 110, 34, 'PID 1: /bin/sh', { r: 5, fill: C.card }); d.box(110, 190, 110, 34, 'PID 7: gunicorn', { r: 5, fill: C.card });
  d.line(165, 144, 165, 190, { stroke: C.ink2, single: true });
  d.arrow(40, 127, 106, 127, { stroke: C.acc, hl: 5 }); d.text(60, 112, 'SIGTERM', { cls: 'mono', size: 8.5, color: C.acc });
  cross(d, 185, 167, 7); d.text(165, 246, 'not forwarded: SIGKILL at 30 s', { cls: 'xs' });
  d.box(420, 140, 120, 34, 'PID 1: gunicorn', { r: 5, fill: C.accSoft, stroke: C.acc });
  d.arrow(350, 157, 416, 157, { stroke: C.acc, hl: 5 }); d.text(372, 142, 'SIGTERM', { cls: 'mono', size: 8.5, color: C.acc });
  tick(d, 560, 157, 8); d.text(475, 246, 'handled: drain, then exit 0', { cls: 'xs' });
  d.text(320, 300, 'multi-stage: 1.2 GB build image → ~20 MB runtime image', { cls: 'xs' });
  return d.svg();
}

export function be_dep_hardening() {
  const d = fig('be_dep_hardening', 'LEAST PRIVILEGE, LAYER BY LAYER', 330);
  shield(d, 320, 60, 150, { fill: C.accFaint, stroke: C.acc });
  box3(d, 290, 130, 60, 40, { label: 'app', fill: C.card });
  const L = [['USER 10001', 'runAsNonRoot', 80, 80], ['drop: ["ALL"]', 'no privilege escalation', 80, 160], ['readOnlyRootFilesystem', 'emptyDir for /tmp', 80, 240], ['distroless base', 'no shell, no package manager', 560, 80], ['scanned weekly', 'Trivy, rebuilt from fresh base', 560, 160], ['signed, SBOM', 'admission checks signature', 560, 240]];
  L.forEach(([a, b, x, y]) => { d.mono(x, y, a, { size: 9.5 }); d.text(x, y + 16, b, { cls: 'xs' }); d.line(x < 300 ? x + 80 : x - 80, y + 4, x < 300 ? 250 : 390, 150, { stroke: C.line, single: true, dash: [3, 3] }); });
  d.text(320, 300, 'no secrets in layers: BuildKit secret mounts at build, the platform at run time', { cls: 'xs' });
  return d.svg();
}

export function be_dep_deployment() {
  const d = fig('be_dep_deployment', 'DEPLOYMENT → REPLICASETS → PODS', 330);
  d.box(240, 50, 160, 40, 'Deployment orders', { r: 6, fill: C.card, size: 11 });
  d.box(80, 140, 180, 36, 'ReplicaSet v812', { r: 6, fill: C.card, size: 10 });
  d.box(380, 140, 180, 36, 'ReplicaSet v813', { r: 6, fill: C.accSoft, stroke: C.acc, size: 10 });
  d.line(320, 90, 170, 140, { stroke: C.ink2, single: true }); d.line(320, 90, 470, 140, { stroke: C.acc, single: true });
  [0, 1].forEach((i) => pod(d, 100 + i * 70, 220, { label: 'v812' }));
  pod(d, 240, 220, { label: 'v812', dash: [3, 3], fill: C.paper });
  [0, 1].forEach((i) => pod(d, 400 + i * 70, 220, { label: 'v813', hot: true }));
  d.text(170, 280, 'scaling down: 3 → 2', { cls: 'xs' }); d.text(470, 280, 'scaling up: 1 → 2', { cls: 'xs', color: C.acc });
  d.text(320, 310, 'rollback = scale the old ReplicaSet back up', { cls: 'xs' });
  return d.svg();
}

export function be_dep_service_ingress() {
  const d = fig('be_dep_service_ingress', 'INGRESS ROUTES BY HOST AND PATH, SERVICES SPREAD ACROSS READY PODS', 340);
  d.cloud(20, 120, 90, 60, { label: 'internet', size: 10 });
  d.box(140, 120, 110, 60, 'ingress\ncontroller', { r: 6, fill: C.card, size: 10 });
  d.arrow(112, 150, 136, 150, { stroke: C.ink2, hl: 5 });
  [['/orders → orders', 80, true], ['/menus → menus', 210, false]].forEach(([s, y, hot]) => { d.arrow(252, 150, 330, y + 20, { stroke: hot ? C.acc : C.ink2, hl: 5 }); d.text(290, y - 2 + (hot ? 0 : 30), s, { cls: 'mono', size: 8.5, color: hot ? C.acc : undefined }); d.box(335, y, 100, 40, hot ? 'Service orders' : 'Service menus', { r: 20, fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2, size: 9.5 }); });
  [0, 1, 2, 3].forEach((i) => { const ready = i !== 2; pod(d, 480 + (i % 2) * 70, 50 + Math.floor(i / 2) * 50, { label: ready ? 'ready' : 'not ready', fill: ready ? C.card : C.paper, dash: ready ? undefined : [3, 3] }); if (ready) d.line(437, 100, 480 + (i % 2) * 70, 67 + Math.floor(i / 2) * 50, { stroke: C.acc, single: true, sw: 0.8 }); });
  d.text(320, 300, 'namespace orders-prod: quota, RBAC, default-deny network policy', { cls: 'xs' });
  return d.svg();
}

export function be_dep_config() {
  const d = fig('be_dep_config', 'ONE IMAGE, CONFIGURATION FROM OUTSIDE', 320);
  box3(d, 260, 120, 120, 60, { label: 'orders@sha256', fill: C.card });
  [['staging', 90], ['production', 550]].forEach(([s, x], i) => { panel(d, x - 75, 60, 150, 170, s, i === 1); d.mono(x, 110, i ? 'LOG_LEVEL=info' : 'LOG_LEVEL=debug', { size: 8.5 }); d.mono(x, 130, i ? 'PAY_URL=pay.example' : 'PAY_URL=sandbox', { size: 8.5 }); d.lock(x - 9, 160, 18, { stroke: i ? C.acc : C.ink2 }); d.mono(x, 200, '/secrets/db', { size: 8.5 }); });
  d.arrow(258, 150, 168, 150, { stroke: C.ink2, hl: 5 }); d.arrow(392, 150, 472, 150, { stroke: C.ink2, hl: 5 });
  d.text(320, 260, 'Secrets are base64, not encrypted: encrypt etcd, prefer an external manager, mount as files', { cls: 'xs' });
  d.text(320, 284, 'config hash on the pod template → a normal rollout on change', { cls: 'xs', color: C.acc });
  return d.svg();
}

export function be_dep_workloads() {
  const d = fig('be_dep_workloads', 'FOUR WORKLOAD SHAPES BEYOND DEPLOYMENTS', 330);
  panel(d, 20, 50, 140, 220, 'StatefulSet', true);
  [0, 1, 2].forEach((i) => { pod(d, 40, 80 + i * 60, { label: `kafka-${i}`, hot: i === 0 }); d.db(100, 82 + i * 60, 34, 30, {}); });
  panel(d, 175, 50, 140, 220, 'DaemonSet');
  [0, 1, 2].forEach((i) => { d.rect(190, 80 + i * 60, 110, 46, { r: 4, fill: C.paper, stroke: C.line }); d.text(210, 103 + i * 60, `node ${i + 1}`, { cls: 'xs', a: 'start' }); pod(d, 250, 87 + i * 60, { w: 40, h: 30, label: 'agent' }); });
  panel(d, 330, 50, 140, 220, 'Job');
  [0, 1, 2].forEach((i) => { pod(d, 350, 80 + i * 60, { label: 'run' }); tick(d, 430, 97 + i * 60, 7, C.ink2); });
  panel(d, 485, 50, 140, 220, 'CronJob');
  d.clock(555, 120, 70, { t: 0.125 }); d.mono(555, 180, '0 3 * * *', { size: 9.5 }); d.text(555, 210, 'Forbid overlap', { cls: 'xs' }); d.text(555, 228, 'idempotent runs', { cls: 'xs' });
  d.text(320, 300, 'stable identity and disks · one per node · run to completion · on a schedule', { cls: 'xs' });
  return d.svg();
}

export function be_dep_scheduling() {
  const d = fig('be_dep_scheduling', 'PACKED BY REQUESTS: 15 PODS FILL THE CPU, MEMORY HALF EMPTY', 330);
  d.text(160, 52, 'CPU: 7.6 allocatable', { cls: 'sm' }); d.text(480, 52, 'memory: 29 GiB allocatable', { cls: 'sm' });
  d.rect(30, 70, 260, 200, { r: 6, fill: C.paper, stroke: C.ink2 });
  for (let i = 0; i < 15; i++) d.rect(36 + (i % 5) * 50, 76 + Math.floor(i / 5) * 62, 46, 56, { r: 4, fill: C.accSoft, stroke: C.acc });
  d.text(160, 286, '15 × 500m = 7.5 of 7.6', { cls: 'mono', size: 9.5, color: C.acc });
  d.rect(350, 70, 260, 200, { r: 6, fill: C.paper, stroke: C.ink2 });
  d.fillRect(352, 72, 256 * 15 / 29, 196, C.card); d.line(352 + 256 * 15 / 29, 72, 352 + 256 * 15 / 29, 268, { stroke: C.ink2, single: true });
  d.text(352 + 128 * 15 / 29, 170, '15 GiB', { cls: 'mono', size: 10 }); d.text(352 + 256 * 15 / 29 + 60, 170, '14 GiB idle', { cls: 'xs' });
  d.text(480, 286, 'unrequested: no pod can claim it', { cls: 'xs' });
  return d.svg();
}

export function be_dep_qos() {
  const d = fig('be_dep_qos', 'QOS CLASSES AND EVICTION ORDER', 300);
  [['Guaranteed', 'requests = limits', 'evicted last'], ['Burstable', 'requests < limits', 'evicted by overuse'], ['BestEffort', 'neither set', 'evicted first']].forEach(([a, b, c], i) => { const x = 50 + i * 190; d.rect(x, 70, 160, 130, { r: 8, fill: i === 2 ? C.accSoft : C.card, stroke: i === 2 ? C.acc : C.ink2 }); d.text(x + 80, 96, a, { cls: 'ttl', color: i === 2 ? C.acc : undefined }); d.mono(x + 80, 130, b, { size: 9 }); d.text(x + 80, 170, c, { cls: 'xs' }); });
  d.arrow(560, 230, 80, 230, { stroke: C.acc, hl: 6 }); d.text(320, 248, 'memory pressure on the node evicts in this order', { cls: 'xs', color: C.acc });
  d.text(320, 278, 'Wren: memory limit = request; CPU request, no limit, for latency-sensitive pods', { cls: 'xs' });
  return d.svg();
}

export function be_dep_crashloop() {
  const d = fig('be_dep_crashloop', 'CRASHLOOPBACKOFF: DOUBLING DELAYS TO A 5-MINUTE CAP', 300);
  const del = [10, 20, 40, 80, 160, 300, 300];
  let x = 40; const S = 0.5;
  del.forEach((v, i) => { cross(d, x, 110, 6); seg(d, x + 8, 110, v * S, `${v} s`, { hot: v === 300, h: 20, size: 8.5 }); x += v * S + 16; });
  d.text(40, 80, 'start → crash', { cls: 'xs', a: 'start' });
  d.text(320, 170, 'kubectl logs --previous · exit code · kubectl describe pod events', { cls: 'mono', size: 9.5 });
  d.text(320, 200, '137 = 128 + 9 (OOMKilled or SIGKILL) · 143 = 128 + 15 (SIGTERM)', { cls: 'xs' });
  d.text(320, 226, 'back-off resets after 10 minutes of running', { cls: 'xs' });
  return d.svg();
}

export function be_dep_hpa() {
  const d = fig('be_dep_hpa', 'THE HPA: ⌈4 × 90 ÷ 60⌉ = 6', 320);
  [0, 1, 2, 3].forEach((i) => gauge(d, 70 + i * 80, 140, 30, 0.9, { hot: true, value: '90%' }));
  d.arrow(370, 120, 420, 120, { stroke: C.ink2, hl: 6 });
  [0, 1, 2, 3, 4, 5].forEach((i) => gauge(d, 460 + (i % 3) * 60, 100 + Math.floor(i / 3) * 70, 22, 0.6, { value: '60%' }));
  d.text(190, 190, '4 pods at 90% of request', { cls: 'sm' }); d.text(520, 230, '6 pods at 60%', { cls: 'sm', color: C.acc });
  d.text(320, 270, 'checks every 15 s · scales down only after a 300 s window · utilisation is against requests', { cls: 'xs' });
  return d.svg();
}

export function be_dep_termination() {
  const d = fig('be_dep_termination', 'TWO PATHS START AT ONCE WHEN A POD IS DELETED', 320);
  const y = lanes(d, ['kubelet', 'endpoints', 'proxies', 'pod serving'], { y: 70, gap: 52, x0: 110, x1: 610, tl: 's' });
  const X = (s) => 120 + s * 15;
  seg(d, X(0), y(0), X(5) - X(0), 'preStop sleep 5', { fill: C.card }); d.arrow(X(5), y(0) - 14, X(5), y(0) - 2, { stroke: C.acc, hl: 4 }); seg(d, X(5), y(0), X(25) - X(5), 'SIGTERM → drain', { hot: true });
  seg(d, X(0), y(1), X(1) - X(0), '', { fill: C.card }); d.text(X(1) + 8, y(1), 'removed from EndpointSlice', { cls: 'xs', a: 'start' });
  seg(d, X(0), y(2), X(3) - X(0), 'still routing', { fill: C.paper, dash: [3, 3] }); d.text(X(3) + 8, y(2), 'updated', { cls: 'xs', a: 'start' });
  seg(d, X(0), y(3), X(25) - X(0), 'serves until drained', { fill: C.card }); marker(d, X(30), 50, y(3) + 20, 'SIGKILL at 30 s');
  return d.svg();
}

function marker(d, x, y1, y2, s) { d.line(x, y1, x, y2, { stroke: C.ink2, dash: [3, 3], single: true }); d.text(x - 4, y1 + 4, s, { cls: 'xs', a: 'end' }); }

export function be_dep_drain() {
  const d = fig('be_dep_drain', 'A 30-SECOND SHUTDOWN BUDGET', 280);
  const S = 19, x0 = 30;
  [['pause', 0, 5], ['close listener', 5, 5.6], ['finish ≤ 20 s', 5.6, 25], ['GOAWAY, commit offsets, close pools', 25, 28]].forEach(([s, a, b], i) => seg(d, x0 + a * S, 110, (b - a) * S, s, { hot: i === 2, h: 30, size: 8.5 }));
  d.line(x0 + 30 * S, 80, x0 + 30 * S, 150, { stroke: C.acc, sw: 1.6, single: true }); d.text(x0 + 30 * S, 166, 'SIGKILL', { cls: 'xs', color: C.acc });
  [0, 5, 10, 20, 30].forEach((t) => d.mono(x0 + t * S, 140, `${t}`, { size: 8.5 }));
  d.text(320, 206, '~25 requests in flight finish; keep-alives get Connection: close or HTTP/2 GOAWAY', { cls: 'xs' });
  d.text(320, 230, 'consumers commit and leave the group; WebSockets close with 1001', { cls: 'xs' });
  return d.svg();
}

export function be_dep_pipeline() {
  const d = fig('be_dep_pipeline', 'BUILD ONCE, PROMOTE THE SAME DIGEST', 280);
  steps(d, [['merge', 'pull request'], ['CI', 'test, scan'], ['image', 'sign, push'], ['staging', 'smoke, load'], ['production', 'canary']], 80, 2, { h: 60, size: 11, gap: 14 });
  d.mono(320, 175, 'orders@sha256:9f2c… is the only thing that moves', { size: 10, color: C.acc });
  d.text(320, 205, 'manifests in Git, applied by Argo CD; merge to production in about 30 minutes', { cls: 'xs' });
  return d.svg();
}

export function be_dep_rolling() {
  const d = fig('be_dep_rolling', 'A ROLLING UPDATE: 4 REPLICAS, SURGE 1, UNAVAILABLE 1', 360);
  const st = [[0, 4, 0], [1, 4, 1], [2, 3, 1], [3, 3, 2], [4, 2, 2], [5, 1, 3], [6, 0, 4]];
  st.forEach(([t, o, n], r) => { const y = 50 + r * 40; d.text(40, y + 14, `t${t}`, { cls: 'mono', size: 9 }); for (let k = 0; k < o; k++) pod(d, 70 + k * 50, y, { w: 42, h: 28, label: 'old' }); for (let k = 0; k < n; k++) pod(d, 70 + (o + k) * 50, y, { w: 42, h: 28, label: 'new', hot: true }); d.mono(340, y + 14, `${o + n} pods`, { size: 8.5, a: 'start' }); });
  d.text(500, 120, 'between 3 and 5 pods', { cls: 'sm' }); d.text(500, 145, 'new pods count only', { cls: 'xs' }); d.text(500, 161, 'after readiness', { cls: 'xs' });
  return d.svg();
}

export function be_dep_blue_green() {
  const d = fig('be_dep_blue_green', 'BLUE-GREEN: FLIP THE ROUTER, KEEP BLUE WARM', 310);
  d.box(250, 60, 140, 40, 'router', { r: 20, fill: C.card });
  panel(d, 40, 150, 230, 110, 'blue v812, idle');
  panel(d, 370, 150, 230, 110, 'green v813, live', true);
  [0, 1, 2, 3].forEach((i) => { pod(d, 55 + i * 52, 190, { w: 44, label: 'v812' }); pod(d, 385 + i * 52, 190, { w: 44, label: 'v813', hot: true }); });
  d.arrow(320, 102, 480, 148, { stroke: C.acc, hl: 6 }); d.arrow(320, 102, 160, 148, { stroke: C.gray, dash: [4, 4], hl: 6 });
  d.text(320, 290, '8 pods during the release; rollback is flipping back, in seconds', { cls: 'xs' });
  return d.svg();
}

export function be_dep_canary() {
  const d = fig('be_dep_canary', 'A 5% CANARY FOR 10 MINUTES, COMPARED WITH THE BASELINE', 340);
  d.box(40, 140, 100, 50, 'traffic\n2,000/s', { r: 6, fill: C.card, size: 10 });
  hose(d, 140, 165, 300, 120); hose(d, 140, 165, 300, 220, { hot: true, th: 2 });
  d.box(300, 95, 140, 50, 'stable 95%', { r: 6, fill: C.card, size: 10 });
  d.box(300, 195, 140, 50, 'canary 5%: 100/s', { r: 6, fill: C.accSoft, stroke: C.acc, size: 10 });
  card(d, 470, 110, 150, ['compare per endpoint', 'errors: 0.05% vs 0.05%', 'p99: 248 vs 251 ms', '→ promote to 25%'], { size: 8.5, bold: false, hot: [3] });
  d.text(320, 290, '100/s × 600 s = 60,000 requests before the first step up', { cls: 'mono', size: 9.5 });
  return d.svg();
}

export function be_dep_shadow() {
  const d = fig('be_dep_shadow', 'SHADOW TRAFFIC: ANSWER FROM STABLE, COMPARE THE COPY', 320);
  d.phone(30, 110, 90);
  d.box(140, 130, 90, 50, 'mirror', { r: 6, fill: C.card, size: 10 });
  d.server(300, 70, 80, 70, { label: 'stable pricing' }); d.server(300, 200, 80, 70, { label: 'shadow pricing', stroke: C.acc });
  d.arrow(232, 150, 296, 110, { stroke: C.ink2, hl: 5 }); d.arrow(232, 160, 296, 230, { stroke: C.acc, dash: [4, 3], hl: 5 });
  d.arrow(296, 95, 84, 115, { stroke: C.ink2, hl: 5 });
  d.arrow(384, 235, 470, 200, { stroke: C.acc, hl: 5 }); d.arrow(384, 105, 470, 160, { stroke: C.ink2, hl: 5 });
  d.rect(470, 150, 140, 60, { r: 6, fill: C.paper, stroke: C.ink2 }); d.text(540, 170, 'diff job', { cls: 'ttl' }); d.text(540, 192, '0.3% totals differ', { cls: 'xs', color: C.acc });
  d.text(320, 300, 'reads only: a mirrored POST would charge twice', { cls: 'xs' });
  return d.svg();
}

export function be_dep_compat() {
  const d = fig('be_dep_compat', 'DURING A ROLLOUT, EACH VERSION READS THE OTHER\'S DATA', 320);
  d.server(60, 90, 90, 110, { label: 'version N' }); d.server(490, 90, 90, 110, { label: 'version N+1', stroke: C.acc });
  d.db(270, 100, 100, 80, { label: 'shared', size: 10 });
  d.arrow(154, 120, 266, 125, { stroke: C.ink2, hl: 5 }); d.arrow(266, 150, 154, 160, { stroke: C.acc, hl: 5 });
  d.arrow(486, 120, 374, 125, { stroke: C.acc, hl: 5 }); d.arrow(374, 150, 486, 160, { stroke: C.ink2, hl: 5 });
  d.text(210, 185, 'forward: old reads new', { cls: 'xs', color: C.acc }); d.text(430, 185, 'backward: new reads old', { cls: 'xs' });
  d.mono(320, 240, 'status: "scheduled" → old pods must tolerate it first', { size: 9.5 });
  d.text(320, 270, 'add, never rename; ignore unknown fields; readers before writers; version cache keys', { cls: 'xs' });
  return d.svg();
}

export function be_dep_expand_contract() {
  const d = fig('be_dep_expand_contract', 'RENAMING A COLUMN IN SIX COMPATIBLE STEPS', 320);
  const S = [['expand', 'add new col'], ['dual write', 'read old'], ['backfill', 'in batches'], ['read new', 'write both'], ['write new', 'only'], ['contract', 'drop old']];
  steps(d, S, 80, [0, 5], { h: 60, size: 10, gap: 10 });
  const cols = [[1, 0], [1, 1], [1, 1], [1, 1], [0, 1], [0, 1]];
  cols.forEach(([a, b], i) => { const x = 24 + i * 100.7 + 6; d.rect(x, 160, 40, 18, { r: 2, fill: a ? C.card : C.paper, stroke: a ? C.ink2 : C.line, dash: a ? undefined : [2, 2] }); d.mono(x + 20, 169, 'addr', { size: 7.5 }); d.rect(x + 44, 160, 40, 18, { r: 2, fill: i ? C.accSoft : C.paper, stroke: C.acc, dash: i ? undefined : [2, 2] }); d.mono(x + 64, 169, 'deliv', { size: 7.5 }); });
  d.text(320, 220, 'every step works with the version before it, so every deploy can roll back', { cls: 'sm' });
  d.text(320, 246, 'lock_timeout 2 s · CREATE INDEX CONCURRENTLY · NOT VALID then VALIDATE', { cls: 'mono', size: 9 });
  return d.svg();
}

export function be_dep_backfill() {
  const d = fig('be_dep_backfill', 'A BATCHED BACKFILL WITH A BRAKE', 300);
  for (let i = 0; i < 40; i++) d.rect(30 + i * 14.5, 90, 12, 40, { r: 1, fill: i < 23 ? C.accSoft : C.card, stroke: i < 23 ? C.acc : C.line, sw: 0.7 });
  d.mono(30, 75, 'id 1', { size: 8.5, a: 'start' }); d.mono(610, 75, 'id 50,000,000', { size: 8.5, a: 'end' });
  d.mono(30 + 23 * 14.5, 148, 'last_id saved', { size: 8.5, color: C.acc });
  gauge(d, 520, 230, 40, 0.3, { label: 'replica lag', red: 0.7 });
  d.text(240, 200, '10,000 batches × 5,000 rows', { cls: 'sm' }); d.text(240, 222, '100 ms each ≈ 17 minutes', { cls: 'mono', size: 9.5 }); d.text(240, 244, 'sleep when lag rises; resumable', { cls: 'xs' });
  return d.svg();
}

export function be_dep_flag_rollout() {
  const d = fig('be_dep_flag_rollout', 'STICKY PERCENTAGE ROLLOUT BY HASHED BUCKET', 320);
  d.mono(320, 60, 'bucket = hash("checkout_v2:" + user_id) mod 100', { size: 10 });
  for (let i = 0; i < 100; i++) { const x = 20 + (i % 50) * 12, y = 90 + Math.floor(i / 50) * 40; d.rect(x, y, 10, 30, { r: 1, fill: i < 40 ? C.accSoft : C.card, stroke: i < 40 ? C.acc : C.line, sw: 0.6 }); }
  const ux = 20 + 37 * 12 + 5; d.person(ux, 170, 22, { stroke: C.acc }); d.text(ux, 208, 'user 42: bucket 37', { cls: 'xs', color: C.acc });
  d.line(20 + 10 * 12 - 1, 84, 20 + 10 * 12 - 1, 165, { stroke: C.ink2, dash: [3, 3], single: true }); d.text(20 + 10 * 12, 240, '10%: off', { cls: 'xs' });
  d.line(20 + 40 * 12 - 1, 84, 20 + 40 * 12 - 1, 165, { stroke: C.acc, single: true }); d.text(20 + 40 * 12, 240, '40%: on', { cls: 'xs', color: C.acc });
  d.text(320, 280, 'raising the percentage only adds users; the flag name keeps flags independent', { cls: 'xs' });
  return d.svg();
}

export function be_dep_flag_eval() {
  const d = fig('be_dep_flag_eval', 'FLAGS EVALUATED FROM A LOCAL CACHE', 320);
  d.db(40, 110, 100, 70, { label: 'flag service', size: 9.5 });
  [0, 1, 2].forEach((i) => { const y = 60 + i * 80; d.server(330, y, 70, 60, { label: `pod ${i + 1}` }); d.rect(410, y + 10, 80, 40, { r: 4, fill: C.accSoft, stroke: C.acc }); d.text(450, y + 30, 'rules in RAM', { cls: 'xs', vc: true }); d.arrow(144, 145, 326, y + 30, { stroke: C.gray, dash: [4, 3], hl: 5 }); });
  d.text(230, 120, 'stream / poll', { cls: 'xs' });
  cross(d, 90, 210, 10, C.ink2); d.text(90, 236, 'down: pods keep last rules', { cls: 'xs' });
  d.text(560, 150, 'μs lookup', { cls: 'mono', size: 10, color: C.acc }); d.text(560, 172, 'safe defaults', { cls: 'xs' });
  d.text(320, 300, 'kill switches: recommendations, address autocomplete, spelling, loyalty', { cls: 'xs' });
  return d.svg();
}

export function be_dep_architectures() {
  const d = fig('be_dep_architectures', 'MONOLITH, MODULAR MONOLITH, MICROSERVICES', 330);
  const M = ['orders', 'pay', 'menus', 'couriers'];
  d.rect(30, 70, 170, 150, { r: 8, fill: C.card, stroke: C.ink2 });
  M.forEach((s, i) => d.text(70 + (i % 2) * 90, 110 + Math.floor(i / 2) * 50, s, { cls: 'xs' }));
  for (let i = 0; i < 6; i++) d.line(50 + i * 22, 95 + (i % 3) * 30, 170 - i * 15, 180 - (i % 2) * 40, { stroke: C.line, single: true });
  d.text(115, 245, 'monolith', { cls: 'ttl' });
  d.rect(235, 70, 170, 150, { r: 8, fill: C.card, stroke: C.ink2 });
  M.forEach((s, i) => d.box(245 + (i % 2) * 80, 85 + Math.floor(i / 2) * 65, 70, 55, s, { r: 5, fill: C.paper, cls: 'xs' }));
  d.text(320, 245, 'modular monolith', { cls: 'ttl' });
  M.forEach((s, i) => { const x = 445 + (i % 2) * 90, y = 78 + Math.floor(i / 2) * 75; d.box(x, y, 70, 40, s, { r: 5, fill: i === 1 ? C.accSoft : C.card, stroke: i === 1 ? C.acc : C.ink2, cls: 'xs' }); d.db(x + 22, y + 44, 26, 20, {}); });
  d.text(530, 245, 'services, own data', { cls: 'ttl' });
  d.text(320, 290, 'boundaries first; network boundaries only where independence pays', { cls: 'xs' });
  return d.svg();
}

export function be_dep_distributed_monolith() {
  const d = fig('be_dep_distributed_monolith', 'A DISTRIBUTED MONOLITH', 320);
  const S = [[80, 90], [220, 70], [360, 90], [500, 70]];
  S.forEach(([x, y], i) => { d.server(x, y, 70, 60, { label: ['orders', 'pricing', 'stock', 'pay'][i] }); if (i < 3) d.arrow(x + 74, y + 30, S[i + 1][0] - 4, S[i + 1][1] + 30, { stroke: C.acc, hl: 5 }); });
  d.text(320, 55, 'synchronous chain: one slow link stalls all', { cls: 'xs', color: C.acc });
  d.db(270, 200, 100, 60, { label: 'one shared DB', size: 9.5 });
  S.forEach(([x, y]) => d.line(x + 35, y + 75, 320, 200, { stroke: C.ink2, single: true, dash: [3, 3] }));
  d.text(520, 230, 'deploy together', { cls: 'xs' }); d.text(520, 248, 'shared model library', { cls: 'xs' });
  return d.svg();
}

export function be_dep_scale_independently() {
  const d = fig('be_dep_scale_independently', '16 MORE CORES FOR SEARCH', 300);
  hbars(d, [['16 monolith copies', 32, '32 GiB'], ['16 search pods', 8, '8 GiB', true]], { x: 200, w: 320, y: 80, gap: 60 });
  d.text(320, 220, 'saving 24 GiB: real, but a resource efficiency, not the ability to scale', { cls: 'xs' });
  d.text(320, 246, 'also independent: deploys, failures, node types, data, ownership', { cls: 'xs', color: C.acc });
  return d.svg();
}

export function be_dep_strangler() {
  const d = fig('be_dep_strangler', 'THE STRANGLER FIG: ONE ROUTE AT A TIME', 300);
  d.box(250, 60, 140, 40, 'proxy', { r: 20, fill: C.card });
  d.rect(60, 160, 220, 90, { r: 8, fill: C.card, stroke: C.ink2 }); d.text(170, 180, 'monolith', { cls: 'ttl' });
  ['/menus', '/orders', '/couriers'].forEach((s, i) => d.mono(100 + i * 60, 220, s, { size: 8.5, color: i === 0 ? C.gray : undefined }));
  d.rect(380, 160, 200, 90, { r: 8, fill: C.accSoft, stroke: C.acc }); d.text(480, 180, 'search service', { cls: 'ttl', color: C.acc }); d.mono(480, 220, '/search', { size: 8.5 });
  d.arrow(300, 102, 180, 156, { stroke: C.ink2, hl: 5 }); d.arrow(340, 102, 470, 156, { stroke: C.acc, hl: 5 });
  d.text(320, 280, 'when the last route moves, the old code is unused and deleted', { cls: 'xs' });
  return d.svg();
}

export function be_dep_bill() {
  const d = fig('be_dep_bill', 'AN ILLUSTRATIVE MONTH: ABOUT $6,400', 330);
  hbars(d, [['compute nodes', 3364, '$3,364'], ['logs ingested', 1296, '$1,296', true], ['database', 1168, '$1,168'], ['cross-zone', 346, '$346'], ['egress', 233, '$233']], { x: 160, w: 320, y: 60, gap: 40 });
  d.text(320, 280, '1.296 billion requests → about $4.94 per million', { cls: 'mono', size: 10 });
  d.text(320, 304, 'illustrative list prices; logs are a fifth of the bill', { cls: 'xs' });
  return d.svg();
}

export function be_dep_rightsizing() {
  const d = fig('be_dep_rightsizing', 'RIGHTSIZING: REQUEST WHAT YOU USE', 300);
  const M = d.axes(60, 60, 300, 160, { xmax: 24, ymax: 600, xl: 'h', yl: 'millicores' });
  d.fn((t) => 90 + 60 * Math.sin((t - 8) / 24 * Math.PI * 2) + 10 * Math.sin(t * 2), 0, 24, M, { stroke: C.slate, sw: 1.3 });
  d.line(M.X(0), M.Y(500), M.X(24), M.Y(500), { stroke: C.ink2, dash: [4, 3], single: true }); d.text(M.X(24), M.Y(500) - 10, 'request 500m', { cls: 'xs', a: 'end' });
  d.line(M.X(0), M.Y(200), M.X(24), M.Y(200), { stroke: C.acc, single: true }); d.text(M.X(24), M.Y(200) - 10, 'request 200m', { cls: 'xs', a: 'end', color: C.acc });
  d.text(500, 110, 'pods per node', { cls: 'sm' }); d.text(500, 140, 'CPU: 15 → 38', { cls: 'mono', size: 10 }); d.text(500, 162, 'memory caps at 29', { cls: 'mono', size: 10, color: C.acc });
  return d.svg();
}

export function be_dep_cost_levers() {
  const d = fig('be_dep_cost_levers', 'WHERE THE MONEY GOES AND WHAT CUTS IT', 320);
  sheet(d, 40, 50, [['line', 150], ['driver', 190], ['lever', 220]], [['compute', 'requests vs use', 'rightsize, autoscale, spot'], ['egress', 'bytes to internet', 'CDN, compression'], ['cross-zone', 'chatty services', 'zone-aware routing'], ['logs', '86.4 GB/day', 'sample, cap retention'], ['metrics', 'cardinality', 'bounded labels'], ['storage', 'kept forever', 'lifecycle, retention']], { rh: 32, size: 9, hot: [3] });
  return d.svg();
}

export function be_dep_journey_edge() {
  const d = fig('be_dep_journey_edge', 'FROM THE PHONE TO THE EDGE', 330);
  d.phone(30, 100, 100, { label: 'user 42' });
  hop(d, 180, 90, 'DNS\n25 ms cold');
  hop(d, 300, 150, 'TCP + TLS\n2 RTT cold');
  hop(d, 440, 110, 'edge\nWAF, cache', { hot: true });
  d.cloud(520, 180, 100, 60, { label: 'origin', size: 10 });
  d.arrow(90, 140, 146, 100, { stroke: C.gray, dash: [3, 3], hl: 5 }); d.arrow(214, 100, 266, 140, { stroke: C.gray, dash: [3, 3], hl: 5 });
  d.arrow(90, 160, 404, 118, { stroke: C.acc, hl: 6 }); d.text(250, 190, 'warm connection: 5 ms', { cls: 'xs', color: C.acc });
  d.arrow(474, 125, 540, 182, { stroke: C.ink2, hl: 5 }); d.text(520, 140, '15 ms', { cls: 'mono', size: 9 });
  d.text(320, 280, '5 + 15 + 30 + 15 + 5 = 70 ms warm; 40 ms of it is distance', { cls: 'mono', size: 10 });
  return d.svg();
}

export function be_dep_journey_cluster() {
  const d = fig('be_dep_journey_cluster', 'THROUGH THE BALANCERS INTO THE POD', 300);
  const H = [['L4 NLB', 'PROXY protocol'], ['Nginx ingress', 'TLS, real IP, route'], ['Service', 'ready pods only'], ['sidecar', 'mTLS policy'], ['app socket', 'parse, limits']];
  H.forEach(([a, b], i) => { const x = 70 + i * 125; hop(d, x, 120, a, { hot: i === 4, r: 80 }); d.text(x, 175, b, { cls: 'xs' }); if (i < 4) d.arrow(x + 42, 120, x + 83, 120, { stroke: C.ink2, hl: 5 }); });
  d.travel([[70, 120], [570, 120]], { token: 'packet' });
  d.text(320, 230, 'each proxy adds well under a millisecond; concurrency limit sheds with 503 + Retry-After', { cls: 'xs' });
  return d.svg();
}

export function be_dep_journey_service() {
  const d = fig('be_dep_journey_service', 'INSIDE THE SERVICE ON A CACHE MISS: ABOUT 30 MS', 340);
  const S = [['proxies, sidecars', 2], ['middleware + JWT', 1], ['Redis GET miss', 1], ['2 queries via pool', 8], ['payments call', 12], ['serialise, log', 2], ['scheduling, queueing', 4]];
  let t = 0;
  S.forEach(([s, ms], i) => { const y = 54 + i * 34, hot = i === 4; d.text(170, y + 10, s, { cls: 'sm', a: 'end' }); d.rect(180 + t * 13, y, ms * 13, 20, { r: 2, fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2 }); d.mono(186 + (t + ms) * 13, y + 10, `${ms} ms`, { size: 8.5, a: 'start' }); t += ms; });
  d.text(320, 312, 'cache hit (90%): queries and the payments call vanish, a few ms in all', { cls: 'xs' });
  return d.svg();
}

export function be_dep_interruptions() {
  const d = fig('be_dep_interruptions', 'EVERY HOP HAS A "WHAT IF?"', 340);
  const H = [['DNS', 'fails → serve stale'], ['edge', 'city down → anycast'], ['ingress', 'no ready pods → canary aborts'], ['auth', 'JWT expired → 401, refresh'], ['Redis', 'down → fast fail, coalesce'], ['database', 'failover → retryable errors'], ['payments', 'slow → 200 ms timeout, breaker'], ['pod', 'SIGTERM → drain']];
  H.forEach(([a, b], i) => { const x = 40 + (i % 4) * 150, y = 70 + Math.floor(i / 4) * 130; d.circle(x + 50, y + 30, 50, { fill: i === 6 ? C.accSoft : C.card, stroke: i === 6 ? C.acc : C.ink2 }); d.text(x + 50, y + 30, a, { cls: 'xs', vc: true }); bolt(d, x + 84, y + 2, 0.6, i === 6 ? C.acc : C.gray); d.text(x + 50, y + 76, b, { cls: 'xs', size: 9.5 }); });
  return d.svg();
}

export function be_dep_series() {
  const d = fig('be_dep_series', 'THE WHOLE SERIES ON ONE REQUEST', 380);
  const H = [['I', 'HTTP, TLS, DNS'], ['II', 'browser rules'], ['XI', 'proxies, LBs'], ['III', 'authentication'], ['IV', 'authorization'], ['V', 'API, layers'], ['VII', 'cache'], ['VI', 'database'], ['VIII', 'queues'], ['IX', 'concurrency'], ['X', 'resilience'], ['XII', 'realtime, files, search']];
  const pts = H.map((_, i) => [70 + (i % 6) * 100, 90 + Math.floor(i / 6) * 120]);
  d.lines(pts.slice(0, 6), { stroke: C.line, sw: 2, single: true }); d.lines(pts.slice(6), { stroke: C.line, sw: 2, single: true }); d.curve([pts[5], [610, 150], pts[6]], { stroke: C.line, sw: 2, single: true });
  H.forEach(([n, s], i) => { const [x, y] = pts[i]; d.circle(x, y, 40, { fill: C.card, stroke: C.ink2 }); d.mono(x, y, n, { size: 10 }); d.text(x, y + 32, s, { cls: 'xs' }); });
  d.rect(40, 300, 260, 50, { r: 6, fill: C.accFaint, stroke: C.acc }); d.text(170, 316, 'XIV: logs, metrics, traces, SLOs', { cls: 'xs', color: C.acc }); d.text(170, 334, 'watching every hop', { cls: 'xs' });
  d.rect(340, 300, 260, 50, { r: 6, fill: C.paper, stroke: C.ink2 }); d.text(470, 316, 'XV: containers, Kubernetes, releases', { cls: 'xs' }); d.text(470, 334, 'running every hop', { cls: 'xs' });
  return d.svg();
}
