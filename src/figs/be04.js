import { C, fig, beMap, beCover, card, actors, say, steps, panel, hbars, cross, tick, shield, browser, hourglass, signpost, gauge, crowd, seg, lanes, bubble, sheet } from '../lib/be-kit.js';
import { pipe, bolt } from '../lib/sd-kit.js';

const PARTS = ['Authentication vs authorization', 'Access control models', 'Resource ownership and IDOR', 'Policy engines and testing', 'Input validation', 'Input attacks', 'Multi-tenancy models', 'Running a multi-tenant backend', 'Authorization end to end'];
function door(d, x, y, w, h, o = {}) {
  d.rect(x, y, w, h, { r: 2, fill: o.fill ?? C.card, stroke: o.stroke ?? C.ink2 });
  d.dot(x + w - 8, y + h / 2, 2.4, o.stroke ?? C.ink2);
  if (o.label) d.text(x + w / 2, y - 10, o.label, { cls: 'xs', color: o.lc });
}

function shop(d, x, y, w, label, o = {}) {
  const h = w * 0.8, st = o.stroke ?? C.ink2;
  d.rect(x, y + h * 0.3, w, h * 0.7, { r: 1, fill: o.fill ?? C.card, stroke: st });
  for (let i = 0; i < 4; i++) d.poly([[x + i * w / 4, y + h * 0.3], [x + (i + 1) * w / 4, y + h * 0.3], [x + (i + 1) * w / 4 - 2, y + h * 0.12], [x + i * w / 4 + 2, y + h * 0.12]], { fill: i % 2 ? C.paper : (o.awn ?? C.accSoft), stroke: st, sw: 0.8 });
  d.rect(x + w * 0.38, y + h * 0.6, w * 0.24, h * 0.4, { r: 1, fill: C.paper, stroke: st, sw: 0.8 });
  if (label) d.text(x + w / 2, y + h + 12, label, { cls: 'xs' });
}

function sieve(d, x, y, w, gap, o = {}) {
  d.path(`M${x},${y} Q${x + w / 2},${y + 18} ${x + w},${y}`, { stroke: o.stroke ?? C.ink2, single: true, sw: 1.4 });
  for (let i = 1; i < w / gap; i++) d.dot(x + i * gap, y + 4 + Math.sin(i / (w / gap) * Math.PI) * 9, 1.4, C.gray);
}

function ruler(d, x, y, w, label) {
  d.rect(x, y, w, 14, { r: 1, fill: C.paper, stroke: C.ink2, sw: 0.8 });
  for (let i = 0; i <= w; i += 8) d.line(x + i, y, x + i, y + (i % 40 ? 5 : 9), { stroke: C.gray, single: true, sw: 0.7 });
  if (label) d.text(x + w + 8, y + 7, label, { cls: 'xs', a: 'start' });
}

export const where_be_authz = (stage = 99) => beMap('where_be_authz', PARTS, stage);

export const cover_be_authz = () => beCover('cover_be_authz', 'IV', ['Authorization', 'and validation'], 'What this user may do, and whether this input makes sense', (d, y) => {
  d.person(90, y + 60, 64, { fill: C.card });
  d.mono(90, y + 150, 'user 42', { size: 11 });
  ['order 123', 'order 124', 'admin panel'].forEach((s, i) => {
    const yy = y + 30 + i * 70, ok = i === 0;
    d.doc(420, yy, 140, 52, { lines: false, fill: ok ? C.accSoft : C.card, stroke: ok ? C.acc : C.ink2 });
    d.mono(490, yy + 26, s, { size: 11 });
    d.arrow(150, y + 100, 410, yy + 26, { stroke: ok ? C.acc : C.line, hl: 6 });
    if (ok) tick(d, 590, yy + 26, 8, C.acc); else cross(d, 590, yy + 26, 8, C.ink2);
  });
  shield(d, 280, y + 70, 56, { fill: C.paper, label: 'policy' });
  d.text(320, y + 260, 'every request, every resource, checked on the server', { cls: 'sm' });
}, [['Models', 'RBAC, ACL, ABAC, ReBAC'], ['IDOR', 'ownership on every object'], ['Validation', 'schema, semantics, attacks'], ['Tenancy', 'isolation and fairness']]);

export function be_authz_vs_authn() {
  const d = fig('be_authz_vs_authn', 'AUTHENTICATION OPENS THE BUILDING; AUTHORIZATION DECIDES EACH ROOM', 300);
  d.person(60, 110, 50); d.text(60, 185, 'user 42', { cls: 'sm' });
  d.rect(140, 70, 90, 150, { r: 4, fill: C.card, stroke: C.ink2 }); d.text(185, 145, 'front\ndoor', { cls: 'sm', vc: true });
  d.text(185, 240, 'authentication:\nwho are you?', { cls: 'xs', vc: true });
  [['order 123 (yours)', 70, true], ['order 124 (user 43)', 140, false], ['refund all orders', 210, false]].forEach(([s, y, ok]) => { d.rect(340, y - 20, 170, 40, { r: 6, fill: ok ? C.accSoft : C.card, stroke: ok ? C.acc : C.ink2 }); d.text(425, y, s, { cls: 'sm' }); d.arrow(234, 145, 334, y, { stroke: ok ? C.acc : C.gray, hl: 5 }); if (ok) tick(d, 540, y, 8); else cross(d, 540, y, 8, C.ink2); });
  d.text(425, 270, 'authorization: what may you do here?', { cls: 'xs' });
  return d.svg();
}

export function be_authz_default_deny() {
  const d = fig('be_authz_default_deny', 'DEFAULT DENY: NO RULE THAT ALLOWS IT MEANS NO', 300);
  door(d, 300, 60, 70, 140, { fill: C.paper });
  d.person(250, 110, 40); d.doc(220, 150, 30, 40, { fill: C.card });
  d.text(235, 208, 'guest list', { cls: 'xs' });
  [['user 42 · read order 123', true, 90], ['user 42 · POST /admin/new', false, 160]].forEach(([s, ok, y]) => { d.person(80, y - 14, 26, { stroke: ok ? C.ink2 : C.acc, fill: ok ? C.card : C.accSoft }); d.mono(110, y + 24, s, { size: 8.5, a: 'start' }); (ok ? tick : cross)(d, 200, y, 7, ok ? C.ink2 : C.acc); });
  d.text(500, 110, 'no allow rule matches', { cls: 'sm', color: C.acc }); d.text(500, 130, '→ 403', { cls: 'mono', size: 11, color: C.acc });
  d.text(320, 250, 'a new endpoint with no rule is closed, not open; each role gets only what its job needs', { cls: 'xs' });
  return d.svg();
}

export function be_authz_server_side() {
  const d = fig('be_authz_server_side', 'HIDING THE BUTTON IS NOT AUTHORIZATION', 280);
  browser(d, 20, 50, 260, 180, 'https://app.wren.example/orders');
  d.text(150, 120, '"Refund" button hidden\nfor customers', { cls: 'sm', vc: true });
  d.mono(420, 80, 'curl -X POST', { size: 10 }); d.mono(420, 98, '/orders/123/refund', { size: 10, color: C.acc });
  d.arrow(420, 112, 420, 160, { stroke: C.acc });
  d.server(390, 165, 60, 60);
  d.text(420, 250, 'the API must check the role itself', { cls: 'sm', color: C.acc });
  return d.svg();
}

export function be_authz_layers() {
  const d = fig('be_authz_layers', 'WHERE EACH AUTHORIZATION CHECK BELONGS', 340);
  const L = [['gateway', 'token valid? scope present?'], ['route middleware', 'role may call this endpoint?'], ['service / handler', 'this user may act on THIS order?'], ['database', 'tenant row-level security']];
  L.forEach(([a, b], i) => { const y = 40 + i * 64, hot = i === 2; d.rect(170, y, 440, 56, { r: 0, fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2 }); d.text(186, y + 20, a, { cls: 'ttl', a: 'start', color: hot ? C.acc : undefined }); d.text(186, y + 40, b, { cls: 'xs', a: 'start' }); });
  shield(d, 560, 46, 38, {}); d.rect(545, 112, 30, 34, { r: 2, fill: C.paper, stroke: C.ink2 }); d.doc(548, 172, 26, 36, { fill: C.paper, stroke: C.acc }); d.db(540, 238, 40, 46, {});
  d.person(110, 40, 34); d.line(110, 80, 110, 290, { stroke: C.line, single: true, dash: [3, 4] });
  d.travel([[110, 76], [110, 290]], { token: (dd) => dd.dot(0, 0, 5, C.acc), dur: 5 });
  d.text(320, 326, 'the object-level check needs the loaded resource, so it cannot live only in a gateway', { cls: 'xs' });
  return d.svg();
}

export function be_rbac() {
  const d = fig('be_rbac', 'RBAC: USERS GET ROLES, ROLES GET PERMISSIONS', 320);
  const users = ['asha', 'ben', 'chen', 'dev'], roles = ['customer', 'restaurant_manager', 'support'], perms = ['orders:read:own', 'menu:write', 'orders:refund', 'users:read'];
  users.forEach((u, i) => { d.person(60, 50 + i * 62, 30); d.text(100, 72 + i * 62, u, { cls: 'sm', a: 'start' }); });
  roles.forEach((r, i) => d.box(220, 70 + i * 70, 160, 40, r, { r: 6, cls: 'mono', size: 10, fill: i === 1 ? C.accSoft : C.card, stroke: i === 1 ? C.acc : C.ink2 }));
  perms.forEach((p, i) => d.box(450, 50 + i * 60, 170, 36, p, { r: 6, cls: 'mono', size: 9.5 }));
  [[0, 0], [1, 1], [2, 1], [3, 2]].forEach(([u, r]) => d.line(140, 72 + u * 62, 216, 90 + r * 70, { stroke: r === 1 ? C.acc : C.gray, single: true }));
  [[0, 0], [1, 1], [1, 0], [2, 2], [2, 3]].forEach(([r, p]) => d.line(384, 90 + r * 70, 446, 68 + p * 60, { stroke: r === 1 ? C.acc : C.gray, single: true }));
  return d.svg();
}

export function be_rbac_explosion() {
  const d = fig('be_rbac_explosion', 'ASSIGNMENT ROWS FOR 1,000,000 USERS AND 40 PERMISSIONS', 320);
  for (let i = 0; i < 6; i++) d.person(40, 50 + i * 36, 22);
  for (let k = 0; k < 8; k++) d.rect(220, 52 + k * 26, 20, 18, { r: 2, fill: C.card, stroke: C.ink2 });
  for (let i = 0; i < 6; i++) for (let k = 0; k < 8; k++) d.line(54, 62 + i * 36, 218, 61 + k * 26, { stroke: C.acc, single: true, sw: 0.5, op: 0.6 });
  d.text(140, 280, 'direct: 40,000,000 rows', { cls: 'mono', size: 9.5, color: C.acc });
  for (let i = 0; i < 6; i++) d.person(360, 50 + i * 36, 22);
  ['customer', 'manager', 'support'].forEach((s, k) => { const y = 80 + k * 60; d.rect(440, y, 70, 30, { r: 15, fill: C.accSoft, stroke: C.acc }); d.text(475, y + 15, s, { cls: 'xs' }); for (let i = 0; i < 6; i++) if (i % 3 === k) d.line(374, 62 + i * 36, 438, y + 15, { stroke: C.ink2, single: true, sw: 0.8 }); for (let p = 0; p < 3; p++) d.line(512, y + 15, 570, 60 + (k * 3 + p) * 22, { stroke: C.ink2, single: true, sw: 0.6 }); });
  for (let k = 0; k < 9; k++) d.rect(570, 52 + k * 22, 20, 16, { r: 2, fill: C.card, stroke: C.ink2 });
  d.text(475, 280, 'through roles: 1,000,200 rows', { cls: 'mono', size: 9.5 });
  d.text(320, 306, 'at scale the risk flips: role explosion when every exception becomes a new role', { cls: 'xs' });
  return d.svg();
}

export function be_acl() {
  const d = fig('be_acl', 'AN ACL HANGS ON THE RESOURCE: WHO MAY DO WHAT TO THIS ONE THING', 280);
  d.doc(60, 70, 140, 170, { lines: false, fill: C.card }); d.text(130, 100, 'shared menu draft', { cls: 'ttl', size: 11 }); d.mono(130, 120, 'doc 77', { size: 10 });
  card(d, 260, 70, 330, ['ACL for doc 77', 'user 42      owner', 'user 43      edit', 'team:kitchen view', 'everyone     none'], { hot: [2] });
  d.text(320, 255, 'great for per-object sharing; painful to answer "what can user 43 see?"', { cls: 'xs' });
  return d.svg();
}

export function be_abac() {
  const d = fig('be_abac', 'ABAC: A RULE OVER ATTRIBUTES OF THE USER, THE RESOURCE AND THE CONTEXT', 320);
  d.person(80, 50, 40); card(d, 30, 110, 100, ['role: support', 'region: IN', 'mfa: true'], { size: 8.5, bold: false });
  d.doc(270, 50, 60, 60, { fill: C.card }); card(d, 250, 120, 100, ['type: refund', 'amount: 4,500', 'region: IN'], { size: 8.5, bold: false });
  d.clock(500, 75, 46, { t: 0.58 }); card(d, 450, 110, 100, ['time: 14:05', 'network: office'], { size: 8.5, bold: false });
  [[80, 180], [300, 190], [500, 168]].forEach(([x, y]) => d.arrow(x, y, 320, 222, { stroke: C.gray, hl: 5 }));
  d.rect(60, 228, 520, 60, { r: 8, fill: C.accSoft, stroke: C.acc });
  d.mono(320, 248, 'allow if user.role == support and user.region == resource.region', { size: 9 });
  d.mono(320, 268, 'and resource.amount <= 5000 and user.mfa', { size: 9 });
  return d.svg();
}

export function be_rebac_graph() {
  const d = fig('be_rebac_graph', 'ReBAC: PERMISSION FOLLOWS RELATIONSHIPS IN A GRAPH', 300);
  d.person(70, 110, 46); d.text(70, 180, 'user 42', { cls: 'xs' });
  crowd(d, 200, 116, 3, { s: 34, gap: 22 }); d.text(222, 180, 'team kitchen', { cls: 'xs' });
  shop(d, 360, 100, 80, 'restaurant 9');
  d.doc(530, 95, 60, 76, { fill: C.accSoft, stroke: C.acc }); d.text(560, 186, 'menu 3', { cls: 'xs', color: C.acc });
  [['member_of', 100, 190], ['owns', 262, 356], ['contains', 444, 526]].forEach(([s, a, b]) => { d.arrow(a, 135, b, 135, { stroke: C.acc, hl: 6 }); d.mono((a + b) / 2, 120, s, { size: 9 }); });
  d.travel([[100, 150], [190, 150], [262, 150], [356, 150], [444, 150], [526, 150]], { at: [0, 0.8] });
  d.text(320, 250, 'can user 42 edit menu 3? walk: user → team → restaurant → menu', { cls: 'xs' });
  return d.svg();
}

export function be_rebac_check() {
  const d = fig('be_rebac_check', 'RELATION TUPLES, ZANZIBAR STYLE, AND ONE CHECK', 320);
  d.line(30, 60, 370, 60, { stroke: C.ink2, single: true });
  ['team:kitchen#member@user:42', 'restaurant:9#owner@team:kitchen#member', 'menu:3#parent@restaurant:9'].forEach((s, i) => { const y = 74 + i * 52; d.line(60 + i * 60, 60, 60 + i * 60, y, { stroke: C.gray, single: true }); d.rect(30 + i * 20, y, 300, 30, { r: 4, fill: C.card, stroke: C.ink2 }); d.mono(180 + i * 20, y + 15, s, { size: 8.5 }); });
  d.mono(180, 250, 'menu editor = owner of parent', { size: 9.5 });
  d.rect(400, 70, 220, 110, { r: 8, fill: C.accSoft, stroke: C.acc }); d.mono(510, 100, 'check(menu:3, edit,', { size: 10 }); d.mono(510, 120, '      user:42)', { size: 10 }); tick(d, 450, 152, 8); d.text(520, 152, 'allowed, 3 hops', { cls: 'sm', color: C.acc });
  d.text(320, 296, 'Google described Zanzibar in 2019; SpiceDB and OpenFGA follow the model', { cls: 'xs' });
  return d.svg();
}

export function be_authz_inheritance() {
  const d = fig('be_authz_inheritance', 'PERMISSIONS INHERIT DOWN THE HIERARCHY UNLESS SOMETHING STOPS THEM', 330);
  d.rect(270, 40, 100, 60, { r: 2, fill: C.card, stroke: C.ink2 }); for (let i = 0; i < 6; i++) d.rect(280 + (i % 3) * 30, 48 + Math.floor(i / 3) * 24, 18, 16, { r: 1, fill: C.paper, stroke: C.line }); d.text(320, 116, 'org: Spice Group', { cls: 'xs' });
  shop(d, 110, 140, 80, 'restaurant 9', { stroke: C.acc }); shop(d, 450, 140, 80, 'restaurant 10', { awn: C.card });
  d.line(320, 100, 150, 150, { stroke: C.acc, single: true }); d.line(320, 100, 490, 150, { stroke: C.gray, single: true });
  [['menu', 70], ['orders', 210]].forEach(([s, x]) => { d.line(150, 220, x, 250, { stroke: C.acc, single: true }); d.doc(x - 22, 250, 44, 50, { fill: C.accFaint, stroke: C.acc }); d.text(x, 312, s, { cls: 'xs' }); });
  d.person(30, 150, 34, { stroke: C.acc, fill: C.accSoft }); d.text(40, 200, 'manager', { cls: 'xs', color: C.acc });
  cross(d, 490, 270, 10, C.ink2); d.text(490, 300, 'no rights here', { cls: 'xs' });
  return d.svg();
}

export function be_authz_ownership() {
  const d = fig('be_authz_ownership', 'PUT THE OWNERSHIP CHECK IN THE QUERY, NOT AFTER IT', 320);
  panel(d, 20, 40, 290, 260, 'vulnerable');
  d.mono(165, 74, 'order = db.get(order_id)', { size: 9.5 });
  for (let i = 0; i < 6; i++) d.doc(50 + i * 40, 110, 30, 40, { fill: C.card, lines: false });
  d.path('M200,200 Q190,160 205,150', { stroke: C.acc, sw: 2, single: true }); d.person(220, 190, 34, { stroke: C.acc });
  d.text(165, 270, 'any id, any user', { cls: 'xs', color: C.acc });
  panel(d, 330, 40, 290, 260, 'scoped', true);
  d.mono(475, 70, 'WHERE id = %s', { size: 9.5 }); d.mono(475, 88, 'AND user_id = %s', { size: 9.5, color: C.acc });
  d.rect(395, 110, 160, 110, { r: 3, fill: C.card, stroke: C.acc }); d.mono(475, 128, 'user 42 only', { size: 9, color: C.acc }); [0, 1, 2].forEach((i) => d.doc(415 + i * 44, 145, 30, 40, { fill: C.paper, lines: false }));
  d.text(475, 250, 'not yours → None → 404', { cls: 'xs' }); d.text(475, 270, '"forgot to check" cannot happen here', { cls: 'xs' });
  return d.svg();
}

export function be_idor_attack() {
  const d = fig('be_idor_attack', 'IDOR: CHANGE THE NUMBER IN THE URL, GET SOMEONE ELSE\'S ORDER', 320);
  browser(d, 30, 50, 360, 220, '');
  d.mono(90, 61, 'api.wren.example/users/42/orders/', { size: 9, a: 'start' });
  d.rect(300, 54, 40, 16, { r: 3, fill: C.accSoft, stroke: C.acc });
  d.phase(0, 2, (dd) => dd.mono(320, 62, '789', { size: 9.5 })); d.phase(1, 2, (dd) => dd.mono(320, 62, '790', { size: 9.5, color: C.acc }));
  d.phase(0, 2, (dd) => { dd.person(110, 120, 40); dd.text(210, 140, 'your order', { cls: 'sm', a: 'start' }); });
  d.phase(1, 2, (dd) => { dd.person(110, 120, 40, { stroke: C.acc, fill: C.accSoft }); dd.text(210, 140, 'user 43\'s order, address, phone', { cls: 'sm', a: 'start', color: C.acc }); });
  d.server(470, 90, 90, 120, { label: 'API' }); d.text(515, 240, 'token proves 42;', { cls: 'xs' }); d.text(515, 256, 'nobody checks 790', { cls: 'xs', color: C.acc });
  return d.svg();
}

export function be_idor_enum() {
  const d = fig('be_idor_enum', 'ENUMERATING 5,000,000 SEQUENTIAL ORDER IDS AT 50 REQUESTS PER SECOND', 300);
  d.tape(40, 70, ['4', '9', '9', '9', '9', '8', '7'], { cw: 28, h: 40, size: 16, hot: (i) => i === 6 });
  d.text(140, 130, 'odometer: next id is obvious', { cls: 'xs' }); d.mono(140, 150, '27.8 hours to try all', { size: 10 });
  [0, 1].forEach((i) => { const x = 380 + i * 70; d.rect(x, 64, 52, 52, { r: 8, fill: C.card, stroke: C.ink2 }); [[0.3, 0.3], [0.7, 0.7], [0.5, 0.5], [0.3, 0.7], [0.7, 0.3]].slice(0, 3 + i * 2).forEach(([a, b]) => d.dot(x + 52 * a, 64 + 52 * b, 3.5, C.ink)); });
  d.text(450, 130, 'UUIDv4: 122 random bits', { cls: 'xs' }); d.mono(450, 150, 'never, by guessing', { size: 10, color: C.acc });
  d.text(320, 230, 'random ids slow guessing; they never replace the ownership check, because ids leak', { cls: 'xs' });
  return d.svg();
}

export function be_bfla() {
  const d = fig('be_bfla', 'BROKEN FUNCTION-LEVEL AUTHORIZATION: THE ADMIN ROUTE TRUSTS ANY TOKEN', 310);
  door(d, 170, 80, 70, 130, { label: 'GET /orders/123' }); shield(d, 205, 220, 30, {}); d.text(205, 270, 'token + ownership', { cls: 'xs' });
  door(d, 430, 80, 70, 130, { label: 'POST /admin/refunds', stroke: C.acc, lc: C.acc }); d.text(465, 236, 'token only', { cls: 'xs', color: C.acc });
  d.person(320, 110, 46); d.mono(320, 172, 'customer token', { size: 9 });
  d.shift(100, 0, (dd) => dd.envelope(330, 190, 40, 26, { fill: C.accSoft, stroke: C.acc, label: '₹4,500' }), { at: [0.2, 0.6], back: true });
  d.text(320, 296, 'OWASP API Top 10: BOLA is API1, BFLA is API5', { cls: 'xs' });
  return d.svg();
}

export function be_policy_engine() {
  const d = fig('be_policy_engine', 'POLICY ENGINE: THE APP ASKS, THE ENGINE DECIDES, THE APP ENFORCES', 300);
  d.server(40, 90, 90, 110, { label: 'Wren app (PEP)' });
  d.rect(250, 80, 150, 120, { r: 8, fill: C.accSoft, stroke: C.acc }); d.text(325, 110, 'policy engine', { cls: 'ttl', color: C.acc }); d.text(325, 132, '(PDP: OPA, Cedar)', { cls: 'xs' });
  say(d, 136, 244, 120, '{user, action, resource}'); say(d, 244, 136, 170, 'allow / deny');
  d.doc(480, 60, 110, 70, { label: 'policies (git)' }); d.db(490, 160, 90, 60, { label: 'data' });
  d.arrow(474, 95, 404, 110, { stroke: C.gray, hl: 5 }); d.arrow(484, 190, 404, 170, { stroke: C.gray, hl: 5 });
  return d.svg();
}

export function be_policy_code() {
  const d = fig('be_policy_code', 'THE SAME RULE AS CODE IN A POLICY LANGUAGE', 300);
  [['Cedar', ['permit (', '  principal in Role::"support",', '  action == Action::"refund",', '  resource', ') when { resource.amount <= 5000 };'], 20], ['Rego (OPA)', ['allow if {', '  input.user.role == "support"', '  input.action == "refund"', '  input.resource.amount <= 5000', '}'], 330]].forEach(([t, L, x], i) => { d.doc(x, 50, 290, 170, { fill: i === 0 ? C.accFaint : C.paper, stroke: i === 0 ? C.acc : C.ink2, lines: false }); d.text(x + 145, 66, t, { cls: 'ttl' }); L.forEach((s, k) => d.mono(x + 16, 92 + k * 22, s, { a: 'start', size: 9 })); });
  d.text(320, 250, 'policies live in one versioned place, reviewed and tested like code', { cls: 'xs' });
  return d.svg();
}

export function be_authz_cache() {
  const d = fig('be_authz_cache', 'CACHING DECISIONS FOR 30 S MEANS A REVOKED PERMISSION LINGERS UP TO 30 S', 300);
  const X = (t) => 120 + t * 15;
  d.arrow(110, 190, 620, 190, { stroke: C.gray });
  d.rect(X(0), 140, X(30) - X(0), 34, { r: 3, fill: C.card, stroke: C.ink2 }); d.text((X(0) + X(12)) / 2, 157, 'cached: allow', { cls: 'xs' });
  d.fillRect(X(12), 142, X(30) - X(12), 30, C.accSoft, 0.9); d.text((X(12) + X(30)) / 2, 157, 'still allowed', { cls: 'xs', color: C.acc });
  d.line(X(12), 110, X(12), 190, { stroke: C.acc, sw: 1.6, single: true }); d.person(X(12), 60, 30, { stroke: C.acc }); cross(d, X(12) + 26, 80, 7); d.text(X(12) + 40, 100, 'role removed', { cls: 'xs', a: 'start', color: C.acc });
  [0, 12, 30].forEach((t) => d.mono(X(t), 206, `${t} s`, { size: 9 }));
  hourglass(d, 60, 120, 60, { level: 0.6 });
  d.text(320, 260, 'shorter TTLs or explicit invalidation for high-risk permissions', { cls: 'xs' });
  return d.svg();
}

export function be_authz_matrix() {
  const d = fig('be_authz_matrix', 'A PERMISSION MATRIX IS THE TEST PLAN: EVERY ROLE AGAINST EVERY ACTION', 330);
  const roles = ['anonymous', 'customer', 'manager', 'support', 'admin'], acts = ['read menu', 'read own order', 'read any order', 'edit menu', 'refund'];
  const v = [[1, 0, 0, 0, 0], [1, 1, 0, 0, 0], [1, 1, 0, 1, 0], [1, 1, 1, 0, 1], [1, 1, 1, 1, 1]];
  acts.forEach((a, j) => d.text(250 + j * 78, 56, a, { cls: 'xs' }));
  roles.forEach((r, i) => { const y = 72 + i * 44; d.person(40, y - 2, 26, { stroke: i === 0 ? C.gray : C.ink2 }); d.text(70, y + 14, r, { cls: 'sm', a: 'start' }); v[i].forEach((x, j) => { const cx = 250 + j * 78; d.rect(cx - 30, y, 60, 30, { r: 4, fill: x ? C.accSoft : C.paper, stroke: x ? C.acc : C.line }); (x ? tick : cross)(d, cx, y + 15, 6, x ? C.acc : C.gray); }); });
  d.text(320, 310, 'test the denies as carefully as the allows: most bugs are missing denies', { cls: 'xs' });
  return d.svg();
}

export function be_valid_layers() {
  const d = fig('be_valid_layers', 'VALID JSON, INVALID INPUT: FOUR LAYERS OF CHECKS', 340);
  card(d, 20, 50, 200, ['{', '  "email": "asha@",', '  "age": -500,', '  "role": "admin",', '  "qty": "3"', '}'], { bold: false, size: 9.5, hot: [1, 2, 3, 4] });
  [['schema', 'fields, required, unknown', '"role" rejected'], ['type', 'qty must be an integer', '"3" rejected'], ['semantic', 'email format, age 13 to 120', '-500 rejected'], ['business rule', 'restaurant open? stock left?', '']].forEach(([a, b, out], i) => { const y = 70 + i * 62, x = 300; sieve(d, x, y, 180, 18 - i * 4, { stroke: i === 2 ? C.acc : C.ink2 }); d.text(x + 190, y, a, { cls: 'ttl', a: 'start', size: 11, color: i === 2 ? C.acc : undefined }); d.text(x + 190, y + 16, b, { cls: 'xs', a: 'start' }); if (out) { d.arrow(x + 4, y + 8, x - 40, y + 28, { stroke: C.gray, hl: 4 }); d.mono(x - 44, y + 40, out, { size: 8, a: 'end' }); } });
  d.travel([[390, 50], [390, 300]], { token: (dd) => dd.rect(-8, -8, 16, 16, { r: 3, fill: C.accSoft, stroke: C.acc }) });
  return d.svg();
}

export function be_valid_allowlist() {
  const d = fig('be_valid_allowlist', 'ALLOWLISTS NAME WHAT IS GOOD; BLOCKLISTS CHASE WHAT IS BAD', 320);
  panel(d, 20, 40, 290, 250, 'blocklist');
  d.person(80, 80, 36); d.doc(110, 80, 50, 60, { fill: C.card, lines: false }); d.mono(135, 104, '<script>', { size: 8 }); d.text(135, 152, 'banned', { cls: 'xs' });
  ['<SCRIPT>', '<scr<script>ipt>', '<img onerror=…>'].forEach((s, i) => { d.person(200 + (i % 2) * 40, 160 + i * 20, 22, { stroke: C.acc }); d.mono(160, 210 + i * 20 - 30, s, { size: 8.5, color: C.acc, a: 'end' }); });
  d.text(165, 270, 'each disguise walks past', { cls: 'xs', color: C.acc });
  panel(d, 330, 40, 290, 250, 'allowlist', true);
  d.doc(380, 80, 190, 130, { fill: C.paper, lines: false });
  ['sort ∈ {price, rating, name}', 'status ∈ {open, closed}', 'qty: integer 1 to 50'].forEach((s, i) => { tick(d, 400, 108 + i * 32, 6); d.mono(414, 108 + i * 32, s, { size: 9, a: 'start' }); });
  d.text(475, 250, 'anything not on the list is rejected', { cls: 'xs' });
  return d.svg();
}

export function be_valid_normalize() {
  const d = fig('be_valid_normalize', 'NORMALIZE, THEN VALIDATE, THEN USE: AND ENCODE ON OUTPUT', 300);
  d.line(30, 170, 610, 170, { stroke: C.ink2, sw: 2, single: true }); [60, 180, 300, 420, 540].forEach((x) => d.circle(x, 178, 14, { fill: C.paper, stroke: C.ink2 }));
  [['decode', 'UTF-8, URL', 60], ['normalize', 'NFC, trim, lower', 180], ['validate', 'allowlist rules', 300], ['use', 'typed value', 420], ['encode', 'per output context', 540]].forEach(([a, b, x], i) => {
    if (i === 0) d.key(x - 18, 120, 36, {}); if (i === 1) { d.poly([[x - 26, 130], [x + 20, 130], [x + 26, 110], [x - 20, 110]], { fill: C.card, stroke: C.ink2 }); d.line(x - 6, 110, x - 6, 96, { stroke: C.ink2, sw: 2, single: true }); }
    if (i === 2) shield(d, x, 90, 50, { fill: C.accSoft, stroke: C.acc }); if (i === 3) d.gear(x, 120, 22, { spin: 5 }); if (i === 4) d.envelope(x - 22, 106, 44, 28, {});
    d.text(x, 210, a, { cls: 'ttl', size: 11, color: i === 2 ? C.acc : undefined }); d.text(x, 228, b, { cls: 'xs' }); });
  d.travel([[20, 156], [610, 156]], { token: (dd) => dd.rect(-9, -9, 18, 18, { r: 3, fill: C.accSoft, stroke: C.acc }) });
  d.text(320, 274, 'validating before normalizing lets "%2e%2e/" or a decomposed accent slip past', { cls: 'xs' });
  return d.svg();
}

export function be_valid_limits() {
  const d = fig('be_valid_limits', 'BOUND EVERY DIMENSION BEFORE PARSING CAN HURT YOU', 320);
  d.rect(40, 90, 120, 90, { r: 3, fill: C.card, stroke: C.ink2 }); d.line(40, 120, 160, 120, { stroke: C.ink2, single: true }); d.line(100, 90, 100, 180, { stroke: C.ink2, single: true });
  d.rect(30, 190, 140, 12, { r: 2, fill: C.paper, stroke: C.ink2 }); d.line(100, 202, 100, 220, { stroke: C.ink2, sw: 2, single: true }); d.line(70, 220, 130, 220, { stroke: C.ink2, sw: 2, single: true });
  [['body size', '1 MB', 'memory exhaustion'], ['JSON depth', '32 levels', 'recursive-parser blowups'], ['array length', '100 items', 'O(n) work per request'], ['string length', '2,000 chars', 'huge fields in logs and DB'], ['unknown fields', 'rejected', 'mass assignment']].forEach(([a, b, c], i) => { const y = 54 + i * 48; ruler(d, 220, y, 120 - i * 14); d.text(220, y - 6, `${a}: ${b}`, { cls: 'mono', size: 9, a: 'start', color: i === 4 ? C.acc : undefined }); d.text(380, y + 7, `stops ${c}`, { cls: 'xs', a: 'start' }); });
  return d.svg();
}

export function be_mass_assignment() {
  const d = fig('be_mass_assignment', 'MASS ASSIGNMENT: THE FRAMEWORK COPIES EVERY FIELD, INCLUDING ONES YOU NEVER MEANT TO ACCEPT', 300);
  card(d, 20, 50, 250, ['PATCH /users/42', '{"name": "Asha",', ' "role": "admin",', ' "credit": 100000}'], { hot: [2, 3] });
  d.arrow(280, 100, 340, 100, { stroke: C.acc }); d.mono(310, 88, 'user.update(**body)', { size: 9 });
  d.db(360, 50, 120, 100, { label: 'users row', fill: C.accSoft, stroke: C.acc });
  d.mono(420, 170, 'role = admin', { size: 10, color: C.acc });
  d.text(320, 230, 'fix: a request DTO that lists exactly {name, phone}; reject or drop the rest', { cls: 'xs' });
  d.text(320, 252, 'GitHub, 2012: a public key added to the Rails organisation this way', { cls: 'xs' });
  return d.svg();
}

export function be_param_pollution() {
  const d = fig('be_param_pollution', 'HTTP PARAMETER POLLUTION: TWO PARSERS PICK DIFFERENT COPIES', 300);
  d.envelope(250, 50, 140, 80, {}); d.rect(260, 60, 60, 22, { r: 2, fill: C.card, stroke: C.ink2 }); d.mono(290, 71, 'amt=10', { size: 8.5 }); d.rect(320, 96, 64, 22, { r: 2, fill: C.accSoft, stroke: C.acc }); d.mono(352, 107, 'amt=1000', { size: 8.5, color: C.acc });
  d.person(110, 150, 40); d.text(110, 216, 'WAF reads the first: 10', { cls: 'xs' });
  d.person(530, 150, 40, { stroke: C.acc, fill: C.accSoft }); d.text(530, 216, 'app reads the last: 1000', { cls: 'xs', color: C.acc });
  d.arrow(140, 160, 260, 90, { stroke: C.gray, hl: 5, dash: [3, 3] }); d.arrow(500, 160, 380, 116, { stroke: C.acc, hl: 5, dash: [3, 3] });
  d.text(320, 270, 'reject duplicated scalar parameters instead of guessing which one was meant', { cls: 'xs' });
  return d.svg();
}

export function be_proto_pollution() {
  const d = fig('be_proto_pollution', 'PROTOTYPE POLLUTION: A MERGE WRITES INTO Object.prototype', 320);
  d.mono(140, 60, '{"__proto__": {"isAdmin": true}}', { size: 9.5, color: C.acc });
  d.arrow(140, 70, 140, 100, { stroke: C.acc, hl: 5 }); d.mono(140, 112, 'deepMerge(settings, body)', { size: 9 });
  d.rect(300, 60, 200, 40, { r: 20, fill: C.accSoft, stroke: C.acc }); d.mono(400, 80, 'Object.prototype', { size: 10, color: C.acc });
  d.travel([[140, 120], [300, 80]], { token: (dd) => dd.circle(0, 0, 10, { fill: C.acc, stroke: C.acc }), at: [0, 0.3] });
  ['user', 'order', 'config', 'session', 'u = {}'].forEach((s, i) => { const x = 220 + i * 90; d.line(400, 100, x, 180, { stroke: C.acc, single: true, sw: 0.8 }); d.rect(x - 38, 180, 76, 30, { r: 15, fill: C.card, stroke: C.ink2 }); d.mono(x, 195, s, { size: 9 }); d.phase(1, 2, (dd) => dd.mono(x, 226, 'isAdmin', { size: 8, color: C.acc })); });
  d.text(320, 290, 'fix: reject __proto__, constructor and prototype keys; use Object.create(null) or Map', { cls: 'xs' });
  return d.svg();
}

export function be_int_overflow() {
  const d = fig('be_int_overflow', '50,000 x 45,000 PAISE IN A 32-BIT INTEGER WRAPS TO A NEGATIVE TOTAL', 320);
  d.circle(170, 160, 200, { fill: C.paper, stroke: C.ink2 });
  d.text(170, 66, '0', { cls: 'mono', size: 10 }); d.text(170, 262, '±2.1 bn', { cls: 'mono', size: 10, color: C.acc }); d.text(274, 160, '+', { size: 16 }); d.text(66, 160, '−', { size: 16 });
  d.path('M170,70 A90,90 0 0 1 170,250', { stroke: C.slate, sw: 3, single: true }); d.path('M170,250 A90,90 0 0 1 112,229', { stroke: C.acc, sw: 3, single: true });
  d.spin(170, 160, (dd) => dd.line(170, 160, 170, 80, { stroke: C.acc, sw: 2, single: true }), { dur: 6 });
  d.mono(460, 100, '50,000 × 45,000 = 2,250,000,000', { size: 10 }); d.mono(460, 126, 'int32 max = 2,147,483,647', { size: 10 }); d.mono(460, 160, 'stored: −2,044,967,296', { size: 11, color: C.acc });
  d.text(460, 220, 'bound quantities, use 64-bit or decimal', { cls: 'xs' }); d.text(460, 238, 'money types, check sums on the server', { cls: 'xs' });
  return d.svg();
}

export function be_type_confusion() {
  const d = fig('be_type_confusion', 'TYPE CONFUSION: THE SAME FIELD ARRIVES AS FOUR DIFFERENT TYPES', 320);
  d.rect(270, 230, 100, 30, { r: 4, fill: C.card, stroke: C.ink2 }); d.circle(320, 236, 22, { fill: C.paper, stroke: C.acc }); d.text(320, 278, 'qty slot: integer', { cls: 'xs' });
  [['"qty": 3', 'number', 90], ['"qty": "3"', '"3" + 1 = "31"', 230], ['"qty": [3, 3]', 'length checks pass', 390], ['"qty": {"$gt": 0}', 'NoSQL operator', 540]].forEach(([s, n, x], i) => {
    if (i === 0) d.circle(x, 110, 30, { fill: C.accSoft, stroke: C.acc }); if (i === 1) d.rect(x - 16, 94, 32, 32, { r: 2, fill: C.card, stroke: C.ink2 }); if (i === 2) { d.rect(x - 24, 98, 20, 24, { r: 2, fill: C.card, stroke: C.ink2 }); d.rect(x + 4, 98, 20, 24, { r: 2, fill: C.card, stroke: C.ink2 }); } if (i === 3) d.poly([[x, 90], [x + 22, 110], [x, 130], [x - 22, 110]], { fill: C.card, stroke: C.ink2 });
    d.mono(x, 60, s, { size: 9 }); d.text(x, 150, n, { cls: 'xs', color: i ? C.acc : undefined }); (i ? cross : tick)(d, x, 180, 7, i ? C.acc : C.ink2);
  });
  return d.svg();
}

export function be_unicode() {
  const d = fig('be_unicode', 'ONE LOOK, SEVERAL BYTE SEQUENCES: NORMALIZE BEFORE COMPARING', 320);
  d.text(90, 80, 'é', { size: 34 }); d.text(90, 116, 'NFC', { cls: 'xs' }); d.tape(140, 64, ['C3', 'A9'], { cw: 36, h: 26 });
  d.text(330, 80, 'é', { size: 34 }); d.text(330, 116, 'NFD', { cls: 'xs' }); d.tape(380, 64, ['65', 'CC', '81'], { cw: 36, h: 26, hot: (i) => i > 0 });
  d.text(110, 180, 'admin', { size: 24 }); d.tape(190, 166, ['61', '64', '6D', '69', '6E'], { cw: 30, h: 26 });
  d.text(110, 236, 'аdmin', { size: 24, color: C.acc }); d.tape(190, 222, ['D0 B0', '64', '6D', '69', '6E'], { cw: 30, h: 26, hot: (i) => i === 0, size: 8 });
  d.text(400, 236, 'first letter Cyrillic U+0430', { cls: 'xs', a: 'start', color: C.acc });
  d.text(320, 290, 'NFC for storage and comparison; NFKC plus confusable checks for usernames', { cls: 'xs' });
  return d.svg();
}

export function be_redos() {
  const d = fig('be_redos', 'REDOS: (a+)+$ AGAINST "aaa...a!" BACKTRACKS ~2^n STEPS', 320);
  const br = (x, y, len, depth) => { if (!depth) return; const a = [x - len, y + 30], b = [x + len, y + 30]; d.line(x, y, a[0], a[1], { stroke: depth < 3 ? C.acc : C.ink2, single: true, sw: 0.7 }); d.line(x, y, b[0], b[1], { stroke: depth < 3 ? C.acc : C.ink2, single: true, sw: 0.7 }); br(a[0], a[1], len / 2, depth - 1); br(b[0], b[1], len / 2, depth - 1); };
  br(170, 60, 80, 7);
  d.text(170, 290, 'every way to split "aaaa" between the two +', { cls: 'xs' });
  hbars(d, [['n = 10', 1024, '1,024'], ['n = 20', 1048576, '1,048,576'], ['n = 30', 1073741824, '1,073,741,824', true]], { y: 70, gap: 46, w: 140, x: 410 });
  d.text(480, 230, 'at 10⁸ steps/s, one 31-byte', { cls: 'xs' }); d.text(480, 246, 'request pins a core ~10.7 s', { cls: 'xs', color: C.acc }); d.text(480, 270, 'fix: RE2, timeouts, no nesting', { cls: 'xs' });
  return d.svg();
}

export function be_file_validation() {
  const d = fig('be_file_validation', 'THREE CLAIMS ABOUT A FILE; ONLY THE BYTES ARE EVIDENCE', 290);
  d.doc(40, 60, 120, 150, { lines: false, fill: C.card }); d.mono(100, 225, 'menu.jpg', { size: 10 });
  [['filename', 'menu.jpg', 'chosen by the user'], ['Content-Type', 'image/jpeg', 'chosen by the client'], ['magic bytes', '3C 3F 70 68 70 ("<?php")', 'the actual content']].forEach(([a, b, c], i) => { const y = 70 + i * 52; d.text(210, y, a, { cls: 'ttl', a: 'start', size: 11 }); d.mono(330, y, b, { a: 'start', size: 10, color: i === 2 ? C.acc : undefined }); d.text(330, y + 18, c, { cls: 'xs', a: 'start' }); });
  d.text(320, 262, 'decode and re-encode images, store with server-chosen names, serve from another domain', { cls: 'xs' });
  return d.svg();
}

export function be_tenancy_models() {
  const d = fig('be_tenancy_models', 'THREE WAYS TO SEPARATE 2,000 RESTAURANT TENANTS', 300);
  panel(d, 20, 40, 190, 230, 'shared schema', true);
  d.db(70, 80, 90, 80); d.mono(115, 180, 'orders.tenant_id', { size: 9.5 }); d.text(115, 220, 'cheapest; isolation\nis your WHERE clause', { cls: 'xs', vc: true });
  panel(d, 225, 40, 190, 230, 'schema per tenant');
  d.db(275, 80, 90, 80); d.mono(320, 180, 't9.orders, t10.orders', { size: 9 }); d.text(320, 220, '2,000 schemas;\nmigrations x 2,000', { cls: 'xs', vc: true });
  panel(d, 430, 40, 190, 230, 'database per tenant');
  [0, 1, 2].forEach((i) => d.db(450 + i * 52, 85, 44, 60));
  d.text(525, 190, 'strongest isolation;\n2,000 x 10 = 20,000\npool connections', { cls: 'xs', vc: true });
  return d.svg();
}

export function be_tenant_id() {
  const d = fig('be_tenant_id', 'RESOLVE THE TENANT ONCE, FROM A TRUSTED SOURCE, AND CARRY IT EVERYWHERE', 300);
  browser(d, 30, 50, 200, 50, 'spice.wren.example'); d.text(130, 116, 'subdomain', { cls: 'xs' });
  d.key(60, 160, 46, { fill: C.accSoft, stroke: C.acc }); d.mono(160, 160, '"tenant": "t9"', { size: 9.5, color: C.acc }); d.text(130, 186, 'token claim', { cls: 'xs', color: C.acc });
  d.envelope(60, 210, 50, 32, {}); d.mono(170, 226, 'X-Tenant: t9', { size: 9 }); d.text(130, 258, 'header, never alone', { cls: 'xs' });
  [[232, 75], [210, 160], [210, 226]].forEach(([x, y], i) => d.arrow(x, y, 350, 150, { stroke: i === 1 ? C.acc : C.gray, hl: 5 }));
  d.rect(360, 100, 240, 100, { r: 8, fill: C.accFaint, stroke: C.acc }); d.text(480, 122, 'request context', { cls: 'ttl' }); d.mono(480, 150, 'tenant = t9', { size: 10 }); d.mono(480, 172, 'user 42 ∈ t9: verified', { size: 9.5, color: C.acc });
  d.text(320, 286, 'the user must be a member of the tenant they name, checked on every request', { cls: 'xs' });
  return d.svg();
}

export function be_tenant_rls() {
  const d = fig('be_tenant_rls', 'POSTGRESQL ROW-LEVEL SECURITY: THE DATABASE ADDS THE TENANT FILTER ITSELF', 320);
  card(d, 20, 50, 300, ['CREATE POLICY tenant_iso ON orders', '  USING (tenant_id =', '    current_setting(\'app.tenant\')::int);', 'SET LOCAL app.tenant = 9;', 'SELECT * FROM orders;'], { size: 9, hot: [1, 2], bold: false });
  d.db(380, 50, 200, 230, {});
  for (let i = 0; i < 8; i++) { const t9 = i % 3 === 0; d.rect(400, 80 + i * 22, 160, 16, { r: 2, fill: t9 ? C.accSoft : C.paper, stroke: t9 ? C.acc : C.line }); d.mono(420, 88 + i * 22, t9 ? 't9' : ['t10', 't11'][i % 2], { size: 8, a: 'start', color: t9 ? C.acc : C.gray }); }
  d.text(170, 210, 'a forgotten WHERE returns', { cls: 'sm' }); d.text(170, 230, 'no other tenant\'s rows', { cls: 'sm', color: C.acc });
  d.text(170, 270, 'app role must not own the table or have BYPASSRLS', { cls: 'xs' });
  return d.svg();
}

export function be_noisy_neighbor() {
  const d = fig('be_noisy_neighbor', 'ONE TENANT SENDS 40% OF 2,000 REQ/S; PER-TENANT LIMITS PROTECT THE OTHERS', 310);
  const T = [['t9 (sale day)', 800, true], ['t10', 120], ['t11', 90], ['1,997 others', 990]];
  T.forEach(([s, v, hot], i) => { const y = 70 + i * 50; d.text(120, y, s, { cls: 'sm', a: 'end', color: hot ? C.acc : undefined }); pipe(d, 130, 330, y, Math.max(6, v / 30), hot); d.circle(350, y, 22, { fill: C.paper, stroke: hot ? C.acc : C.ink2 }); d.line(340, y, 360, y, { stroke: hot ? C.acc : C.ink2, sw: 2, single: true }); d.mono(380, y, `${v} req/s`, { size: 9, a: 'start' }); });
  d.server(500, 90, 90, 130, { label: 'shared API' });
  d.text(320, 286, 'quota per tenant plan; separate pools or queues for the largest tenants', { cls: 'xs' });
  return d.svg();
}

export function be_tenant_cache() {
  const d = fig('be_tenant_cache', 'A CACHE KEY WITHOUT THE TENANT SERVES ONE TENANT\'S DATA TO ANOTHER', 310);
  panel(d, 20, 40, 290, 240, 'leaky key');
  shop(d, 50, 80, 60, 't9 writes'); shop(d, 210, 80, 60, 't10 reads', { awn: C.card });
  d.rect(115, 180, 80, 40, { r: 4, fill: C.accSoft, stroke: C.acc }); d.mono(155, 200, 'menu:3', { size: 10, color: C.acc });
  d.arrow(80, 150, 125, 178, { stroke: C.ink2, hl: 5 }); d.arrow(185, 178, 240, 150, { stroke: C.acc, hl: 5 });
  d.text(165, 250, 'ids collide across tenants', { cls: 'xs' });
  panel(d, 330, 40, 290, 240, 'tenant-scoped key', true);
  shop(d, 360, 80, 60, 't9'); shop(d, 520, 80, 60, 't10', { awn: C.card });
  d.rect(355, 180, 90, 34, { r: 4, fill: C.card, stroke: C.ink2 }); d.mono(400, 197, 'menu:t9:3', { size: 9 }); d.rect(505, 180, 90, 34, { r: 4, fill: C.card, stroke: C.ink2 }); d.mono(550, 197, 'menu:t10:3', { size: 9 });
  d.text(475, 250, 'one key helper that requires the tenant', { cls: 'xs' });
  return d.svg();
}

export function be_tenant_jobs() {
  const d = fig('be_tenant_jobs', 'FAIR QUEUEING: ONE TENANT\'S 50,000 JOBS SHOULD NOT DELAY EVERYONE ELSE', 280);
  d.text(100, 60, 'one FIFO queue', { cls: 'ttl' });
  for (let i = 0; i < 12; i++) d.rect(30 + i * 13, 80, 11, 30, { r: 1, fill: i < 10 ? C.accSoft : C.card, stroke: i < 10 ? C.acc : C.ink2 });
  d.text(110, 130, 't9\'s export blocks t10', { cls: 'xs' });
  d.text(450, 60, 'queue per tenant, round robin', { cls: 'ttl' });
  ['t9', 't10', 't11'].forEach((t, r) => { d.mono(330, 90 + r * 34, t, { size: 10 }); for (let i = 0; i < (r ? 2 : 8); i++) d.rect(350 + i * 13, 78 + r * 34, 11, 24, { r: 1, fill: r ? C.card : C.accSoft, stroke: r ? C.ink2 : C.acc }); });
  d.arrow(480, 125, 540, 125, { stroke: C.gray }); d.server(550, 100, 50, 50);
  d.text(320, 240, 'every tenant gets a turn; tags on jobs keep tenant context for logs and limits', { cls: 'xs' });
  return d.svg();
}

export function be_tenant_leak() {
  const d = fig('be_tenant_leak', 'CROSS-TENANT LEAKS COME FROM SHARED PATHS THAT FORGET THE TENANT', 320);
  const P = [['query', 'missing AND tenant_id = ?'], ['cache', 'key without tenant'], ['search index', 'no tenant filter'], ['export job', 'context lost in worker'], ['logs, support tools', 'search across tenants'], ['object storage', 'shared bucket, guessable keys']];
  P.forEach(([a, b], i) => { const x = 20 + (i % 3) * 205, y = 50 + Math.floor(i / 3) * 130, cx = x + 30, cy = y + 40;
    d.rect(x, y, 190, 110, { r: 8, fill: i === 0 ? C.accFaint : C.card, stroke: i === 0 ? C.acc : C.line });
    if (i === 0) d.db(cx - 18, cy - 20, 36, 40, {}); if (i === 1) d.ram(cx - 22, cy - 12, 44, 24, {}); if (i === 2) { d.circle(cx, cy, 30, { fill: C.paper, stroke: C.ink2 }); d.line(cx + 10, cy + 10, cx + 18, cy + 18, { stroke: C.ink2, sw: 2.5, single: true }); } if (i === 3) d.gear(cx, cy, 16, {}); if (i === 4) d.doc(cx - 14, cy - 20, 28, 40, {}); if (i === 5) d.path(`M${cx - 18},${cy - 16} L${cx - 12},${cy + 18} L${cx + 12},${cy + 18} L${cx + 18},${cy - 16}`, { stroke: C.ink2, fill: C.paper, single: true });
    d.blink((dd) => dd.dot(cx + 22, cy + 22, 3, C.acc), { dur: 1.2 + i * 0.2 });
    d.text(x + 64, y + 30, a, { cls: 'ttl', a: 'start', size: 11 }); d.text(x + 64, y + 50, b, { cls: 'xs', a: 'start' }); });
  return d.svg();
}

export function be_authz_e2e() {
  const d = fig('be_authz_e2e', 'PATCH /restaurants/9/menu/3 BY MANAGER ASHA: EVERY CHECK, IN ORDER', 330);
  const s = [['size + JSON', '413 / 400'], ['authenticate', '401'], ['tenant', 'Asha in t9?'], ['schema + types', '422'], ['policy', 'manager of r9?'], ['load menu 3', 'scoped to t9'], ['business rule', 'locked? 409'], ['write', 'audit log']];
  d.line(20, 220, 620, 220, { stroke: C.ink2, single: true });
  s.forEach(([a, b], i) => { const x = 40 + i * 74, hot = i === 4; door(d, x, 110, 44, 110, { fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2 }); d.text(x + 22, 92, a, { cls: 'xs', color: hot ? C.acc : undefined }); d.mono(x + 22, 236, b, { size: 8.5 }); });
  d.travel([[20, 196], [620, 196]], { token: (dd) => dd.person(0, -24, 24, { stroke: C.acc, fill: C.accSoft }), dur: 8 });
  d.text(320, 290, 'cheap checks first, object checks after loading, every failure with its own status', { cls: 'xs' });
  return d.svg();
}

export function be_authz_components() {
  const d = fig('be_authz_components', 'EACH PIECE OF THIS UNIT AND ITS ONE JOB', 340);
  const c = [['default deny', 'unknown means no'], ['RBAC / ABAC / ReBAC', 'decide who may act'], ['ownership check', 'stop IDOR on every object'], ['policy engine', 'one place for the rules'], ['schema + allowlists', 'reject malformed input'], ['DTOs + limits', 'stop mass assignment and DoS'], ['tenant context + RLS', 'keep tenants apart'], ['quotas + fair queues', 'keep tenants fair']];
  const ic = [(x, y) => door(d, x + 6, y, 22, 32, {}), (x, y) => d.person(x + 16, y, 30), (x, y) => d.doc(x + 4, y, 26, 32, { fill: C.accSoft, stroke: C.acc }), (x, y) => d.doc(x + 4, y, 26, 32, {}), (x, y) => shield(d, x + 17, y, 30, {}), (x, y) => ruler(d, x, y + 10, 34), (x, y) => shop(d, x, y, 34, ''), (x, y) => gauge(d, x + 17, y + 26, 16, 0.5, {})];
  c.forEach(([t, s], i) => { const x = 20 + (i % 2) * 310, y = 44 + Math.floor(i / 2) * 72; d.rect(x, y, 290, 58, { r: 7, fill: i === 2 ? C.accFaint : C.card, stroke: i === 2 ? C.acc : C.line }); ic[i](x + 12, y + 13); d.text(x + 64, y + 20, t, { cls: 'ttl', a: 'start' }); d.text(x + 64, y + 40, s, { cls: 'sm', a: 'start' }); });
  return d.svg();
}
