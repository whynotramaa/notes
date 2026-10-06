import { C, fig, beMap, beCover, card, actors, say, steps, panel, hbars, cross, tick, shield, browser } from '../lib/be-kit.js';

const PARTS = ['Authentication vs authorization', 'Access control models', 'Resource ownership and IDOR', 'Policy engines and testing', 'Input validation', 'Input attacks', 'Multi-tenancy models', 'Running a multi-tenant backend', 'Authorization end to end'];
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
  const d = fig('be_authz_default_deny', 'DEFAULT DENY: NO RULE THAT ALLOWS IT MEANS NO', 260);
  steps(d, [['request', 'user, action, resource'], ['find allow rules', 'that match'], ['any match?', ''], ['allow', 'or 403']], 70, 3);
  d.text(320, 170, 'a new endpoint with no rule is closed, not open', { cls: 'sm', color: C.acc });
  d.text(320, 200, 'least privilege: each role gets only the permissions its job needs', { cls: 'xs' });
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
  const d = fig('be_authz_layers', 'WHERE EACH AUTHORIZATION CHECK BELONGS', 320);
  const L = [['gateway', 'token valid? scope present?', false], ['route middleware', 'role may call this endpoint?', false], ['service / handler', 'this user may act on THIS order?', true], ['database', 'tenant row-level security', false]];
  L.forEach(([a, b, hot], i) => { const y = 50 + i * 62; d.rect(60, y, 200, 44, { r: 7, fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2 }); d.text(160, y + 22, a, { cls: 'ttl', color: hot ? C.acc : undefined }); d.text(290, y + 22, b, { cls: 'sm', a: 'start' }); if (i < 3) d.arrow(160, y + 46, 160, y + 60, { stroke: C.gray, hl: 4 }); });
  d.text(320, 304, 'the object-level check needs the loaded resource, so it cannot live only in a gateway', { cls: 'xs' });
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
  const d = fig('be_rbac_explosion', 'ASSIGNMENT ROWS FOR 1,000,000 USERS AND 40 PERMISSIONS', 220);
  hbars(d, [['direct user-permission', 40000000, '40,000,000 rows'], ['users-roles + roles-permissions', 1000200, '1,000,200 rows', true]], { y: 70, gap: 56, w: 300, x: 230 });
  d.text(320, 190, 'the risk flips at scale: "role explosion" when every exception becomes a new role', { cls: 'xs' });
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
  const d = fig('be_abac', 'ABAC: A RULE OVER ATTRIBUTES OF THE USER, THE RESOURCE AND THE CONTEXT', 300);
  card(d, 20, 50, 180, ['user', 'role: support', 'region: IN', 'mfa: true'], {});
  card(d, 230, 50, 180, ['resource', 'type: refund', 'amount: 4,500', 'region: IN'], {});
  card(d, 440, 50, 180, ['context', 'time: 14:05', 'network: office', ''], {});
  d.rect(60, 180, 520, 70, { r: 8, fill: C.accSoft, stroke: C.acc });
  d.mono(320, 205, 'allow if user.role == support and user.region == resource.region', { size: 9.5 });
  d.mono(320, 228, 'and resource.amount <= 5000 and user.mfa', { size: 9.5 });
  return d.svg();
}

export function be_rebac_graph() {
  const d = fig('be_rebac_graph', 'ReBAC: PERMISSION FOLLOWS RELATIONSHIPS IN A GRAPH', 300);
  const n = [['user 42', 70, 150], ['team kitchen', 230, 150], ['restaurant 9', 400, 150], ['menu 3', 560, 150]];
  n.forEach(([s, x, y], i) => { d.circle(x, y, 84, { fill: i === 3 ? C.accSoft : C.card, stroke: i === 3 ? C.acc : C.ink2 }); d.text(x, y, s, { cls: 'sm' }); });
  [['member_of', 70, 230], ['owns', 230, 400], ['contains', 400, 560]].forEach(([s, a, b]) => { d.arrow(a + 44, 150, b - 44, 150, { stroke: C.acc }); d.mono((a + b) / 2, 134, s, { size: 9.5 }); });
  d.text(320, 240, 'can user 42 edit menu 3? walk: user -> team -> restaurant -> menu', { cls: 'xs' });
  return d.svg();
}

export function be_rebac_check() {
  const d = fig('be_rebac_check', 'RELATION TUPLES, ZANZIBAR STYLE, AND ONE CHECK', 300);
  card(d, 20, 50, 340, ['team:kitchen#member@user:42', 'restaurant:9#owner@team:kitchen#member', 'menu:3#parent@restaurant:9', 'menu editor = owner of parent'], { lh: 24, size: 9.5 });
  d.rect(390, 60, 230, 90, { r: 8, fill: C.accSoft, stroke: C.acc }); d.mono(505, 90, 'check(menu:3, edit,', { size: 10 }); d.mono(505, 110, '      user:42)', { size: 10 }); d.text(505, 136, '-> allowed (3 hops)', { cls: 'sm', color: C.acc });
  d.text(320, 230, 'Google described Zanzibar in 2019; SpiceDB and OpenFGA follow the model', { cls: 'xs' });
  return d.svg();
}

export function be_authz_inheritance() {
  const d = fig('be_authz_inheritance', 'PERMISSIONS INHERIT DOWN THE HIERARCHY UNLESS SOMETHING STOPS THEM', 320);
  d.box(250, 50, 140, 40, 'org: Spice Group', { r: 6, size: 11 });
  [['restaurant 9', 150], ['restaurant 10', 490]].forEach(([s, x]) => { d.line(320, 90, x, 130, { stroke: C.gray, single: true }); d.box(x - 70, 130, 140, 38, s, { r: 6, size: 11, fill: x === 150 ? C.accSoft : C.card, stroke: x === 150 ? C.acc : C.ink2 }); });
  [['menu', 80], ['orders', 220]].forEach(([s, x]) => { d.line(150, 168, x, 210, { stroke: C.acc, single: true }); d.box(x - 50, 210, 100, 34, s, { r: 6, size: 10, fill: C.accFaint, stroke: C.acc }); });
  d.text(470, 230, 'manager of restaurant 9\ncan edit its menu and orders,\nnot restaurant 10', { cls: 'xs', vc: true });
  return d.svg();
}

export function be_authz_ownership() {
  const d = fig('be_authz_ownership', 'PUT THE OWNERSHIP CHECK IN THE QUERY, NOT AFTER IT', 300);
  card(d, 20, 50, 290, ['order = db.get(order_id)', 'return order', '', '-- any id, any user'], { title: 'vulnerable', hot: [1] });
  card(d, 330, 50, 290, ['SELECT * FROM orders', 'WHERE id = %s', '  AND user_id = %s', '-- None -> 404'], { title: 'scoped', hot: [2] });
  d.text(320, 220, 'scoping the query makes "forgot to check" impossible for that code path', { cls: 'xs' });
  return d.svg();
}

export function be_idor_attack() {
  const d = fig('be_idor_attack', 'IDOR: CHANGE THE NUMBER IN THE URL, GET SOMEONE ELSE\'S ORDER', 280);
  d.mono(40, 80, 'GET /users/42/orders/789', { a: 'start', size: 12 }); d.text(400, 80, '200, your order', { cls: 'sm', a: 'start' });
  d.mono(40, 130, 'GET /users/42/orders/790', { a: 'start', size: 12, color: C.acc }); d.text(400, 130, '200, user 43\'s order', { cls: 'sm', a: 'start', color: C.acc });
  d.mono(40, 180, 'GET /users/43/orders/790', { a: 'start', size: 12, color: C.acc }); d.text(400, 180, '200, again', { cls: 'sm', a: 'start', color: C.acc });
  d.text(320, 240, 'the token proves user 42; nothing checked that order 790 belongs to 42', { cls: 'xs' });
  return d.svg();
}

export function be_idor_enum() {
  const d = fig('be_idor_enum', 'ENUMERATING 5,000,000 SEQUENTIAL ORDER IDS AT 50 REQUESTS PER SECOND', 240);
  hbars(d, [['sequential ids', 27.8, '27.8 hours'], ['UUIDv4 (122 random bits)', 100, 'never, by guessing', true]], { y: 70, gap: 56, w: 280, x: 210 });
  d.text(320, 200, 'random ids slow guessing; they do not replace the ownership check, ids leak', { cls: 'xs' });
  return d.svg();
}

export function be_bfla() {
  const d = fig('be_bfla', 'BROKEN FUNCTION-LEVEL AUTHORIZATION: THE ADMIN ROUTE TRUSTS ANY TOKEN', 280);
  [['GET /orders/123', 'customer route', false], ['POST /admin/refunds', 'admin route', true]].forEach(([r, s, hot], i) => { const y = 70 + i * 80; d.mono(40, y, r, { a: 'start', size: 11, color: hot ? C.acc : undefined }); d.text(40, y + 20, s, { cls: 'xs', a: 'start' }); d.arrow(260, y + 5, 380, y + 5, { stroke: hot ? C.acc : C.gray }); d.text(400, y + 5, hot ? 'checks token only: refund issued' : 'checks token + ownership', { cls: 'sm', a: 'start', color: hot ? C.acc : undefined }); });
  d.text(320, 240, 'OWASP API Top 10: BOLA is API1, BFLA is API5', { cls: 'xs' });
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
  const d = fig('be_policy_code', 'THE SAME RULE AS CODE IN A POLICY LANGUAGE', 260);
  card(d, 20, 50, 290, ['permit (', '  principal in Role::"support",', '  action == Action::"refund",', '  resource', ') when { resource.amount <= 5000 };'], { title: 'Cedar', size: 9, hot: [4] });
  card(d, 330, 50, 290, ['allow if {', '  input.user.role == "support"', '  input.action == "refund"', '  input.resource.amount <= 5000', '}'], { title: 'Rego (OPA)', size: 9 });
  return d.svg();
}

export function be_authz_cache() {
  const d = fig('be_authz_cache', 'CACHING DECISIONS FOR 30 S MEANS A REVOKED PERMISSION LINGERS UP TO 30 S', 260);
  const X = (t) => 80 + t * 14;
  d.arrow(70, 160, 620, 160, { stroke: C.gray });
  d.rect(X(0), 120, X(30) - X(0), 30, { r: 3, fill: C.card, stroke: C.ink2 }); d.text((X(0) + X(30)) / 2, 135, 'cached: allow', { cls: 'xs' });
  d.line(X(12), 100, X(12), 160, { stroke: C.acc, sw: 1.6, single: true }); d.text(X(12), 90, 'role removed', { cls: 'xs', color: C.acc });
  d.fillRect(X(12), 120, X(30) - X(12), 30, C.accSoft, 0.8);
  [0, 12, 30].forEach((t) => d.mono(X(t), 176, `${t} s`, { size: 9 }));
  d.text(320, 220, 'shorter TTLs or explicit invalidation for high-risk permissions', { cls: 'xs' });
  return d.svg();
}

export function be_authz_matrix() {
  const d = fig('be_authz_matrix', 'A PERMISSION MATRIX IS THE TEST PLAN: EVERY ROLE AGAINST EVERY ACTION', 320);
  const roles = ['anonymous', 'customer', 'manager', 'support', 'admin'], acts = ['read menu', 'read own order', 'read any order', 'edit menu', 'refund'];
  const v = [[1, 0, 0, 0, 0], [1, 1, 0, 0, 0], [1, 1, 0, 1, 0], [1, 1, 1, 0, 1], [1, 1, 1, 1, 1]];
  acts.forEach((a, j) => d.text(230 + j * 82, 56, a, { cls: 'xs' }));
  roles.forEach((r, i) => { const y = 72 + i * 42; d.text(170, y + 14, r, { cls: 'sm', a: 'end' }); v[i].forEach((x, j) => { const cx = 230 + j * 82; d.rect(cx - 34, y, 68, 28, { r: 4, fill: x ? C.accSoft : C.paper, stroke: x ? C.acc : C.line }); d.text(cx, y + 14, x ? 'allow' : 'deny', { cls: 'xs' }); }); });
  d.text(320, 300, 'test the denies as carefully as the allows: most bugs are missing denies', { cls: 'xs' });
  return d.svg();
}

export function be_valid_layers() {
  const d = fig('be_valid_layers', 'VALID JSON, INVALID INPUT: FOUR LAYERS OF CHECKS', 320);
  card(d, 20, 50, 230, ['{', '  "email": "asha@",', '  "age": -500,', '  "role": "admin",', '  "qty": "3"', '}'], { bold: false, hot: [1, 2, 3, 4] });
  [['schema', 'fields, required, unknown', false], ['type', 'qty must be integer', false], ['semantic', 'email format, age 13..120', true], ['business rule', 'restaurant open? stock left?', false]].forEach(([a, b, hot], i) => { const y = 50 + i * 60; d.rect(300, y, 300, 46, { r: 7, fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2 }); d.text(316, y + 16, a, { cls: 'ttl', a: 'start', size: 11 }); d.text(316, y + 33, b, { cls: 'xs', a: 'start' }); });
  return d.svg();
}

export function be_valid_allowlist() {
  const d = fig('be_valid_allowlist', 'ALLOWLISTS NAME WHAT IS GOOD; BLOCKLISTS CHASE WHAT IS BAD', 280);
  panel(d, 20, 40, 290, 210, 'blocklist');
  d.mono(165, 90, 'reject "<script>"', { size: 10 });
  ['<SCRIPT>', '<scr<script>ipt>', '<img onerror=...>'].forEach((s, i) => { d.mono(165, 130 + i * 24, s, { size: 9.5, color: C.acc }); });
  d.text(165, 225, 'each bypass passes', { cls: 'xs', color: C.acc });
  panel(d, 330, 40, 290, 210, 'allowlist', true);
  d.mono(475, 90, 'sort in {price, rating, name}', { size: 9.5 });
  d.mono(475, 130, 'status in {open, closed}', { size: 9.5 }); d.mono(475, 160, 'qty: integer 1..50', { size: 9.5 });
  d.text(475, 225, 'anything else is rejected', { cls: 'xs' });
  return d.svg();
}

export function be_valid_normalize() {
  const d = fig('be_valid_normalize', 'NORMALIZE, THEN VALIDATE, THEN USE: AND ENCODE ON OUTPUT', 260);
  steps(d, [['decode', 'UTF-8, URL'], ['normalize', 'NFC, trim, lower'], ['validate', 'allowlist rules'], ['use', 'typed value'], ['encode output', 'per context']], 80, 2);
  d.text(320, 190, 'validating before normalizing lets "%2e%2e/" or a decomposed accent slip past', { cls: 'xs' });
  return d.svg();
}

export function be_valid_limits() {
  const d = fig('be_valid_limits', 'BOUND EVERY DIMENSION BEFORE PARSING CAN HURT YOU', 290);
  [['body size', '1 MB', 'stops memory exhaustion'], ['JSON depth', '32 levels', 'stops recursive-parser stack blowups'], ['array length', '100 items', 'stops O(n) work per request'], ['string length', '2,000 chars', 'stops huge fields in logs and DB'], ['unknown fields', 'rejected', 'stops mass assignment']].forEach(([a, b, c], i) => { const y = 50 + i * 44; d.text(150, y + 12, a, { cls: 'ttl', a: 'end', size: 11 }); d.chips(170, y, [b], { h: 24, fill: i === 4 ? C.accSoft : C.card, stroke: i === 4 ? C.acc : C.ink2 }); d.text(300, y + 12, c, { cls: 'sm', a: 'start' }); });
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
  const d = fig('be_param_pollution', 'HTTP PARAMETER POLLUTION: TWO PARSERS PICK DIFFERENT COPIES', 270);
  d.mono(320, 70, 'POST /pay?amount=10&amount=1000', { size: 12, color: C.acc });
  d.rect(60, 120, 220, 70, { r: 8, fill: C.card, stroke: C.ink2 }); d.text(170, 145, 'WAF / proxy', { cls: 'ttl' }); d.mono(170, 168, 'takes first: 10', { size: 10 });
  d.rect(360, 120, 220, 70, { r: 8, fill: C.accSoft, stroke: C.acc }); d.text(470, 145, 'app framework', { cls: 'ttl', color: C.acc }); d.mono(470, 168, 'takes last: 1000', { size: 10, color: C.acc });
  d.text(320, 230, 'reject duplicated scalar parameters instead of guessing which one was meant', { cls: 'xs' });
  return d.svg();
}

export function be_proto_pollution() {
  const d = fig('be_proto_pollution', 'PROTOTYPE POLLUTION: A MERGE WRITES INTO Object.prototype', 300);
  card(d, 20, 50, 300, ['{"__proto__": {"isAdmin": true}}'], { hot: [0] });
  d.arrow(170, 90, 170, 130, { stroke: C.acc }); d.mono(170, 142, 'deepMerge(settings, body)', { size: 10 });
  d.rect(60, 165, 220, 50, { r: 7, fill: C.accSoft, stroke: C.acc }); d.mono(170, 190, 'Object.prototype.isAdmin = true', { size: 9.5, color: C.acc });
  card(d, 360, 80, 260, ['const u = {}', 'if (u.isAdmin) ...', '-> true for EVERY object'], { hot: [2] });
  d.text(320, 260, 'fix: reject __proto__, constructor, prototype keys; use Object.create(null) or Map', { cls: 'xs' });
  return d.svg();
}

export function be_int_overflow() {
  const d = fig('be_int_overflow', '50,000 x 45,000 PAISE IN A 32-BIT INTEGER WRAPS TO A NEGATIVE TOTAL', 260);
  d.mono(320, 70, '50,000 x 45,000 = 2,250,000,000', { size: 13 });
  d.mono(320, 100, 'int32 max      = 2,147,483,647', { size: 13 });
  d.arrow(320, 116, 320, 146, { stroke: C.acc });
  d.mono(320, 166, 'stored total   = -2,044,967,296 paise', { size: 13, color: C.acc });
  d.text(320, 220, 'bound quantities, use 64-bit or decimal money types, and check sums server-side', { cls: 'xs' });
  return d.svg();
}

export function be_type_confusion() {
  const d = fig('be_type_confusion', 'TYPE CONFUSION: THE SAME FIELD ARRIVES AS FOUR DIFFERENT TYPES', 280);
  [['"qty": 3', 'number', true], ['"qty": "3"', 'string: "3" + 1 = "31"', false], ['"qty": [3, 3]', 'array: qty.length checks pass', false], ['"qty": {"$gt": 0}', 'object: NoSQL operator', false]].forEach(([a, b, ok], i) => { const y = 60 + i * 46; d.mono(60, y, a, { a: 'start', size: 11 }); d.text(260, y, b, { cls: 'sm', a: 'start', color: ok ? undefined : C.acc }); if (ok) tick(d, 600, y, 7); else cross(d, 600, y, 7); });
  d.text(320, 256, 'validate the type strictly before any comparison or arithmetic', { cls: 'xs' });
  return d.svg();
}

export function be_unicode() {
  const d = fig('be_unicode', 'ONE LOOK, SEVERAL BYTE SEQUENCES: NORMALIZE BEFORE COMPARING', 290);
  d.text(120, 70, '"é"', { size: 26 }); d.mono(260, 60, 'U+00E9 (NFC, 1 code point)', { size: 10, a: 'start' }); d.mono(260, 82, 'U+0065 U+0301 (NFD, 2 code points)', { size: 10, a: 'start' });
  d.text(120, 160, '"admin"', { size: 22 }); d.mono(260, 150, 'a d m i n  (Latin)', { size: 10, a: 'start' }); d.mono(260, 172, 'а d m i n  (first letter Cyrillic U+0430)', { size: 10, a: 'start', color: C.acc });
  d.text(320, 240, 'NFC for storage and comparison; NFKC plus confusable checks for usernames', { cls: 'xs' });
  return d.svg();
}

export function be_redos() {
  const d = fig('be_redos', 'REDOS: (a+)+$ AGAINST "aaa...a!" BACKTRACKS ~2^n STEPS', 280);
  hbars(d, [['n = 10', 1024, '1,024 steps'], ['n = 20', 1048576, '1,048,576 steps'], ['n = 30', 1073741824, '1,073,741,824 steps', true]], { y: 60, gap: 50, w: 280, x: 120 });
  d.text(320, 230, 'at an illustrative 10^8 steps/s, one 31-byte request pins a core for ~10.7 s', { cls: 'xs' });
  d.text(320, 252, 'fix: linear-time engines (RE2), timeouts, and no nested quantifiers', { cls: 'xs' });
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
  [['subdomain', 'spice.wren.example', false], ['token claim', '"tenant": "t9"', true], ['header', 'X-Tenant: t9 (never alone)', false]].forEach(([a, b, hot], i) => { const y = 60 + i * 60; d.rect(30, y, 230, 44, { r: 7, fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2 }); d.text(46, y + 15, a, { cls: 'ttl', a: 'start', size: 11 }); d.mono(46, y + 32, b, { a: 'start', size: 9.5 }); d.arrow(264, y + 22, 340, 150, { stroke: hot ? C.acc : C.gray, hl: 5 }); });
  d.rect(350, 110, 250, 80, { r: 8, fill: C.accFaint, stroke: C.acc }); d.text(475, 135, 'request context', { cls: 'ttl' }); d.mono(475, 160, 'tenant = t9 (verified', { size: 9.5 }); d.mono(475, 176, 'user 42 belongs to t9)', { size: 9.5 });
  d.text(320, 270, 'the user must be a member of the tenant they name, checked on every request', { cls: 'xs' });
  return d.svg();
}

export function be_tenant_rls() {
  const d = fig('be_tenant_rls', 'POSTGRESQL ROW-LEVEL SECURITY: THE DATABASE ADDS THE TENANT FILTER ITSELF', 300);
  card(d, 20, 50, 340, ['ALTER TABLE orders ENABLE ROW LEVEL SECURITY;', 'CREATE POLICY tenant_iso ON orders', '  USING (tenant_id =', '    current_setting(\'app.tenant\')::int);'], { size: 9, hot: [2, 3] });
  card(d, 20, 170, 340, ['SET LOCAL app.tenant = 9;', 'SELECT * FROM orders;  -- only t9 rows'], { size: 9 });
  d.text(490, 110, 'a forgotten WHERE\nclause returns 0 rows\nof other tenants', { cls: 'sm', vc: true, color: C.acc });
  d.text(490, 220, 'app role must not own the table\nor have BYPASSRLS', { cls: 'xs', vc: true });
  return d.svg();
}

export function be_noisy_neighbor() {
  const d = fig('be_noisy_neighbor', 'ONE TENANT SENDS 40% OF 2,000 REQ/S; PER-TENANT LIMITS PROTECT THE OTHERS', 280);
  hbars(d, [['tenant t9 (sale day)', 800, '800 req/s', true], ['tenant t10', 120, '120 req/s'], ['tenant t11', 90, '90 req/s'], ['other 1,997 tenants', 990, '990 req/s total']], { y: 56, gap: 44, w: 260, x: 200 });
  d.text(320, 250, 'quota per tenant plan; separate pools or queues for the largest tenants', { cls: 'xs' });
  return d.svg();
}

export function be_tenant_cache() {
  const d = fig('be_tenant_cache', 'A CACHE KEY WITHOUT THE TENANT SERVES ONE TENANT\'S DATA TO ANOTHER', 280);
  panel(d, 20, 40, 290, 210, 'leaky key');
  d.mono(165, 90, 'menu:3', { size: 12, color: C.acc }); d.text(165, 130, 't9 writes menu 3,\nt10 reads menu 3', { cls: 'sm', vc: true }); d.text(165, 190, 'ids collide per tenant', { cls: 'xs' });
  panel(d, 330, 40, 290, 210, 'tenant-scoped key', true);
  d.mono(475, 90, 'menu:t9:3', { size: 12 }); d.mono(475, 112, 'menu:t10:3', { size: 12 }); d.text(475, 160, 'build keys in one helper that\nrequires the tenant', { cls: 'xs', vc: true });
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
  const d = fig('be_tenant_leak', 'CROSS-TENANT LEAKS COME FROM SHARED PATHS THAT FORGET THE TENANT', 300);
  [['query', 'missing AND tenant_id = ?'], ['cache', 'key without tenant'], ['search index', 'no tenant filter on query'], ['export job', 'tenant context lost in worker'], ['logs and support tools', 'search across all tenants'], ['object storage', 'shared bucket, guessable keys']].forEach(([a, b], i) => { const x = 20 + (i % 2) * 310, y = 44 + Math.floor(i / 2) * 80; d.rect(x, y, 290, 64, { r: 7, fill: i === 0 ? C.accFaint : C.card, stroke: i === 0 ? C.acc : C.line }); d.text(x + 14, y + 22, a, { cls: 'ttl', a: 'start' }); d.text(x + 14, y + 44, b, { cls: 'sm', a: 'start' }); });
  return d.svg();
}

export function be_authz_e2e() {
  const d = fig('be_authz_e2e', 'PATCH /restaurants/9/menu/3 BY MANAGER ASHA: EVERY CHECK, IN ORDER', 360);
  const s = [['size + JSON', '413 / 400'], ['authenticate', '401'], ['tenant', 'Asha in t9?'], ['schema + types', '422'], ['policy', 'manager of r9?'], ['load menu 3', 'scoped to t9'], ['business rule', 'not locked? 409'], ['write', 'audit log']];
  s.forEach(([a, b], i) => { const r = Math.floor(i / 4), c = r ? 3 - (i % 4) : i % 4, x = 24 + c * 152, y = 60 + r * 140; const hot = i === 4; d.rect(x, y, 132, 64, { r: 8, fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2 }); d.text(x + 66, y + 24, a, { cls: 'ttl', color: hot ? C.acc : undefined }); d.text(x + 66, y + 44, b, { cls: 'xs' }); if (i % 4 < 3) d.arrow(r ? x - 4 : x + 136, y + 32, r ? x - 16 : x + 148, y + 32, { stroke: C.gray, hl: 5 }); if (i === 3) d.arrow(x + 66, y + 68, x + 66, y + 136, { stroke: C.gray, hl: 5 }); });
  d.text(320, 320, 'cheap checks first, object checks after loading, every failure with its own status', { cls: 'xs' });
  return d.svg();
}

export function be_authz_components() {
  const d = fig('be_authz_components', 'EACH PIECE OF THIS UNIT AND ITS ONE JOB', 330);
  const c = [['default deny', 'unknown means no'], ['RBAC / ABAC / ReBAC', 'decide who may act'], ['ownership check', 'stop IDOR on every object'], ['policy engine', 'one place for the rules'], ['schema + allowlists', 'reject malformed input'], ['DTOs + limits', 'stop mass assignment and DoS'], ['tenant context + RLS', 'keep tenants apart'], ['quotas + fair queues', 'keep tenants fair']];
  c.forEach(([t, s], i) => { const x = 20 + (i % 2) * 310, y = 44 + Math.floor(i / 2) * 70; d.rect(x, y, 290, 56, { r: 7, fill: i === 2 ? C.accFaint : C.card, stroke: i === 2 ? C.acc : C.line }); d.text(x + 14, y + 19, t, { cls: 'ttl', a: 'start' }); d.text(x + 14, y + 39, s, { cls: 'sm', a: 'start' }); });
  return d.svg();
}
