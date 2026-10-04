import { D, C } from '../lib/draw.js';
import { scene as illustration, page as figPage, shelf as figShelf, label as figLabel, mapSite } from '../lib/figure-details.js';
import { systemFigure, systemMap, systemCover } from '../lib/system-figures.js';

import { chip, panel, pipe, cross, tick, bolt, ruler } from '../lib/sd-kit.js';
const obj = (d, x, y, w, h, s = '', hot = false) => { d.rect(x, y, w, h, { r: 4, fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2 }); d.line(x + 6, y + 10, x + w - 6, y + 10, { stroke: C.line, single: true, sw: 0.7 }); if (s) d.mono(x + w / 2, y + h / 2 + 4, s, { size: 9 }); };
export function where_sd_storage(stage=99) { return systemMap("sd_storage", ["Local, block, file, object storage", "Buckets, objects and metadata", "Presigned URLs and direct upload", "Multipart uploads", "Checksums and integrity", "Replication and distributed file systems", "Lifecycle and retention", "Case study: the media upload path"], stage); }
export function cover_sd_storage() { return systemCover("sd_storage", 13, ["Storage", "systems"], "Storage systems", ["Local, block, file, object storage", "Buckets, objects and metadata", "Presigned URLs and direct upload", "Multipart uploads", "Checksums and integrity", "Replication and distributed file systems", "Lifecycle and retention", "Case study: the media upload path"]); }
export function sd_storage_local() {
  const d = illustration('sd_storage_local', 'A FILE ON A WORKER\'S DISK DIES WITH THE WORKER', 300);
  d.server(40, 70, 90, 100, { label: 'worker 1' }); d.disk(85, 200, 40);
  d.doc(150, 90, 50, 64, { fill: C.accSoft, stroke: C.acc }); d.mono(175, 170, '/tmp/c7.mp4', { size: 9 });
  d.during([0.35, 1], (g) => { cross(g, 85, 120, 26, C.ink2); cross(g, 175, 122, 20, C.ink2); });
  d.server(330, 70, 90, 100, { label: 'worker 2 (new)' });
  d.arrow(426, 120, 486, 120, { stroke: C.acc }); d.db(496, 80, 90, 80, { label: 'object store' });
  d.text(320, 246, 'local disk is fine for scratch work; the published clip lives elsewhere', { cls: 'xs' });
  return d.svg();
}
export function sd_storage_block() {
  const d = illustration('sd_storage_block', '5,000,000,000 B IN 4,096 B BLOCKS: 1,220,704 BLOCKS, THE LAST ONE PADDED BY 3,584 B', 300);
  for (let i = 0; i < 14; i++) d.rect(40 + i * 40, 90, 36, 36, { r: 1, fill: i === 13 ? C.paper : C.card, stroke: i === 13 ? C.acc : C.ink2 });
  d.fillRect(40 + 13 * 40 + 1, 91, 36 * (512 / 4096), 34, C.card);
  d.text(270, 74, 'blocks (14 of 1,220,704 shown)', { cls: 'xs' });
  d.text(560, 146, '512 B data,\n3,584 B padding', { cls: 'xs', vc: true, color: C.acc });
  d.mono(320, 200, '⌈5,000,000,000 ÷ 4,096⌉ = 1,220,704 → 5,000,003,584 B allocated', { size: 10.5 });
  d.text(320, 236, 'excludes metadata, sparse allocation and compression', { cls: 'xs' });
  return d.svg();
}
export function sd_storage_file() {
  const d = illustration('sd_storage_file', 'A SHARED FILESYSTEM ADDS NAMES, BYTE RANGES, LOCKS AND RENAME ON TOP OF BLOCKS', 320);
  d.server(270, 46, 100, 70, { label: 'shared filesystem' });
  const k = [['directory lookup', 90], ['byte ranges', 320], ['locks + rename', 550]];
  k.forEach(([s, x], i) => {
    d.arrow(320, 136, x, 186, { stroke: C.ink2, hl: 6 });
    if (i === 0) { d.doc(x - 30, 196, 26, 34, { lines: false }); d.doc(x + 4, 196, 26, 34, { lines: false }); }
    if (i === 1) d.tape(x - 60, 200, ['0', '4K', '8K'], { cw: 40, h: 26, hot: (j) => j === 1 });
    if (i === 2) d.lock(x - 14, 192, 28, { stroke: C.acc, fill: C.accSoft });
    d.text(x, 256, s, { cls: 'sm', color: i === 2 ? C.acc : undefined });
  });
  d.text(320, 296, 'each operation has visibility rules across clients; check them', { cls: 'xs' });
  return d.svg();
}
export function sd_storage_interfaces() {
const d=illustration('sd_storage_interfaces','BLOCKS, FILES AND OBJECTS EXPOSE DIFFERENT ADDRESSING CONTRACTS',350);
  d.disk(109,115,99);figShelf(d,42,208,['0','1','2'],{width:138,height:31});d.text(110,264,'block addresses',{cls:'ttl'});
  d.doc(270,89,102,94,{lines:false});d.doc(296,125,102,94,{lines:false});d.mono(325,250,'/path/file',{size:12});d.text(325,276,'hierarchy + file operations',{cls:'sm',size:10});
  d.db(460,88,131,125);d.key(463,237,35);d.mono(549,238,'key',{size:12});d.text(527,276,'bytes + object metadata',{cls:'sm',size:10});
  d.text(320,328,'choose the required interface before choosing the implementation',{cls:'sm'});return d.svg();
}
export function sd_storage_address() {
  const d = illustration('sd_storage_address', 'THE BUCKET AND KEY LOCATE BYTES; THE DATABASE ROW SAYS WHO MAY SEE THEM', 300);
  d.text(40, 60, 'object store', { cls: 'ttl', a: 'start' });
  chip(d, 40, 76, 120, 'heron-media', false, 28); d.mono(170, 90, '/', { size: 12 });
  chip(d, 184, 76, 260, 'tenant-a/clips/c7/source-v1', true, 28);
  obj(d, 470, 66, 90, 50, '5 GB');
  d.text(40, 160, 'database', { cls: 'ttl', a: 'start' });
  d.rect(40, 176, 400, 60, { r: 4, fill: C.card, stroke: C.ink2 });
  d.mono(56, 196, 'clip c7 · owner ana · match m7', { size: 10, a: 'start' }); d.mono(56, 218, 'active_source = source-v1 · published', { size: 10, a: 'start' });
  d.carrow([[440, 206], [500, 190], [515, 122]], { stroke: C.acc, hl: 6 });
  d.text(320, 268, 'knowing the key is not permission', { cls: 'xs' });
  return d.svg();
}
export function sd_storage_immutable() {
  const d = illustration('sd_storage_immutable', 'UPLOAD v2 BESIDE v1, VERIFY IT, THEN FLIP ONE DATABASE POINTER', 300);
  obj(d, 60, 70, 140, 80, 'source-v1');
  obj(d, 400, 70, 140, 80, 'source-v2', true);
  d.rect(250, 190, 140, 50, { r: 6, fill: C.card, stroke: C.ink2 }); d.text(320, 215, 'active pointer', { cls: 'sm' });
  d.during([0, 0.5], (g) => g.arrow(300, 186, 160, 154, { stroke: C.ink2 }));
  d.during([0.5, 1], (g) => g.arrow(340, 186, 460, 154, { stroke: C.acc }));
  d.text(130, 176, 'old readers keep v1', { cls: 'xs' });
  d.text(320, 274, 'bytes never change in place; retention decides how long v1 stays', { cls: 'xs' });
  return d.svg();
}
export function sd_storage_metabytes() {
  const d = illustration('sd_storage_metabytes', '3,000 CLIPS: 1,500,000 B OF METADATA STEERS 15,000,000,000,000 B OF MEDIA', 300);
  d.doc(60, 120, 40, 50, { fill: C.accSoft, stroke: C.acc }); d.mono(80, 190, '1.5 MB', { size: 10, color: C.acc }); d.text(80, 210, '3,000 × 500 B', { cls: 'xs' });
  d.arrow(110, 140, 170, 140, { stroke: C.acc });
  for (let r = 0; r < 5; r++) for (let c = 0; c < 10; c++) obj(d, 190 + c * 40, 60 + r * 36, 34, 30);
  d.mono(390, 260, '15 TB = 3,000 × 5 GB', { size: 10 });
  d.text(320, 284, 'the small record owns the large object (not to scale)', { cls: 'xs' });
  return d.svg();
}
export function sd_storage_consistency() {
  const d = illustration('sd_storage_consistency', 'A STRONG OBJECT READ SAYS NOTHING ABOUT WHETHER THE DATABASE POINTER WAS COMMITTED', 300);
  panel(d, 20, 44, 292, 210, 'object operation');
  obj(d, 100, 90, 130, 80, 'c7/source-v2'); tick(d, 166, 200, 8, C.ink2);
  d.text(166, 230, 'visible by exact key', { cls: 'xs' });
  panel(d, 328, 44, 292, 210, 'application publication', true);
  d.db(420, 90, 100, 90); d.text(470, 200, 'pointer still at v1?', { cls: 'xs', color: C.acc });
  d.text(320, 280, 'two systems, two commits: coordinate them explicitly', { cls: 'xs' });
  return d.svg();
}
export function sd_storage_paths() {
  const d = illustration('sd_storage_paths', 'METADATA GOES THROUGH THE APP; THE 5 GB GOES STRAIGHT TO STORAGE', 320);
  d.laptop(30, 120, 90, { label: 'client' });
  d.server(260, 50, 80, 80, { label: 'application' }); d.db(400, 56, 70, 64, { label: 'DB' });
  obj(d, 420, 200, 160, 70, 'object store');
  d.arrow(120, 130, 254, 96, { stroke: C.ink2 }); d.mono(186, 100, 'small JSON', { size: 9 });
  d.arrow(346, 90, 394, 90, { stroke: C.ink2, hl: 6 });
  pipe(d, 126, 414, 230, 26, true);
  d.flowline([[130, 230], [410, 230]], { sw: 2.4 });
  d.mono(270, 262, 'presigned PUT: 5 GB', { size: 10, color: C.acc });
  d.text(320, 304, 'at 10,000,000 B/s direct: 500 s; through a 2,000,000 B/s app: 2,500 s', { cls: 'xs' });
  return d.svg();
}
export function sd_storage_signed() {
const d=illustration('sd_storage_signed','A PRESIGNED REQUEST GRANTS ONE NARROW OPERATION ON A RESERVED OBJECT',345);
  d.laptop(38,113,107,{label:'uploader'});d.doc(237,56,188,191,{lines:false,fill:C.accFaint,stroke:C.acc});
  d.text(332,82,'signed request',{cls:'ttl'});['reserved key','write method','expiry / conditions'].forEach((s,i)=>d.mono(332,120+i*39,s,{size:11}));
  d.key(181,169,41,{stroke:C.acc});d.arrow(155,143,227,143,{stroke:C.acc});
  d.db(491,124,105,108,{under:'storage service'});d.arrow(433,160,483,160,{stroke:C.acc});
  d.text(320,309,'storage validates the delegated request at its own boundary',{cls:'sm'});return d.svg();
}
export function sd_storage_expiry() {
  const d = illustration('sd_storage_expiry', 'ASKED FOR 3,600 S, THE URL LIVES 1,200 S; THE UPLOAD NEEDS 500 + 100 MARGIN', 300);
  const X = 60, W = 520, s = W / 3600;
  d.rect(X, 70, 3600 * s, 26, { r: 2, fill: C.paper, stroke: C.gray, dash: [4, 3] }); d.text(X + W / 2, 83, 'requested 3,600 s', { cls: 'xs' });
  d.rect(X, 110, 1200 * s, 26, { r: 2, fill: C.card, stroke: C.ink2 }); d.text(X + 600 * s, 123, 'effective 1,200 s', { cls: 'xs' });
  d.rect(X, 150, 500 * s, 26, { r: 2, fill: C.accSoft, stroke: C.acc }); d.rect(X + 500 * s, 150, 100 * s, 26, { r: 2, fill: C.accFaint, stroke: C.acc, dash: [3, 3] });
  d.text(X + 300 * s, 192, 'transfer 500 + margin 100', { cls: 'xs', color: C.acc });
  ruler(d, X, 214, W, 3600, 600, ' s');
  d.text(320, 272, 'the shorter of the URL and the signing credential wins', { cls: 'xs' });
  return d.svg();
}
export function sd_storage_states() {
  const d = illustration('sd_storage_states', 'PENDING → UPLOADED → VERIFIED → PUBLISHED: ONLY THE LAST IS PLAYABLE', 280);
  const st = ['pending', 'uploaded', 'verified', 'published'];
  st.forEach((s, i) => {
    const x = 40 + i * 145, hot = i === 3;
    obj(d, x, 80, 110, 70, '', hot);
    if (i === 0) d.rect(x + 10, 96, 90, 44, { r: 3, stroke: C.gray, dash: [3, 3] });
    if (i >= 2) tick(d, x + 55, 116, 9, hot ? C.acc : C.ink2);
    if (i === 3) d.poly([[x + 80, 102], [x + 80, 130], [x + 100, 116]], { fill: C.acc, stroke: C.acc });
    d.text(x + 55, 172, s, { cls: 'ttl', size: 12, color: hot ? C.acc : undefined });
    if (i < 3) d.arrow(x + 114, 115, x + 141, 115, { stroke: C.gray, hl: 5 });
  });
  d.travel([[95, 115], [530, 115]], { dur: 5, r: 4 });
  d.text(320, 230, 'processing into renditions can sit between verified and published', { cls: 'xs' });
  return d.svg();
}
export function sd_storage_completion() {
  const d = illustration('sd_storage_completion', 'THE CLIENT CLAIMS "DONE"; THE APP CHECKS THE OBJECT ITSELF', 330);
  d.laptop(30, 70, 80, { label: 'client' }); d.server(280, 56, 80, 90, { label: 'application' }); obj(d, 500, 70, 100, 70, 'c7/source-v1');
  const st = [[110, 274, 'initiate', 170, C.ink2], [274, 110, 'reserved key + signed URL', 194, C.ink2], [110, 494, 'upload bytes', 218, C.ink2], [110, 274, 'complete?', 242, C.ink2], [366, 494, 'HEAD: length, checksum', 266, C.acc]];
  st.forEach(([a, b, s, y, col], i) => { d.arrow(a, y, b, y, { stroke: col, hl: 6 }); d.mono((a + b) / 2, y - 9, s, { size: 9, color: col === C.acc ? C.acc : undefined }); d.travel([[a, y], [b, y]], { dur: 8, at: [i / 5, (i + 0.8) / 5], r: 3, color: col }); });
  d.text(320, 304, 'publish only from verified storage evidence', { cls: 'xs' });
  return d.svg();
}
export function sd_storage_parts() {
const d=illustration('sd_storage_parts','NUMBERED PARTS TILE THE OBJECT WITHOUT GAPS OR OVERLAP',337);
  d.rect(39,74,561,100,{r:0,fill:C.paper,stroke:C.ink2});
  for(let i=0;i<50;i++)d.rect(40+i*11.18,75,11.18,98,{r:0,fill:i===49?C.accSoft:C.card,stroke:i===49?C.acc:C.line,sw:.5});
  d.brace(39,600,195,{label:'50 × 100,000,000 B = 5,000,000,000 B'});
  d.text(38,47,'part 1',{cls:'ttl',a:'start'});d.text(600,47,'part 50',{cls:'ttl',a:'end',color:C.acc});
  d.mono(52,254,'first: 0 to 99,999,999',{a:'start',size:11});d.mono(52,281,'last: 4,900,000,000 to 4,999,999,999',{a:'start',size:11});
  d.text(320,318,'inclusive endpoints; each part carries exactly 100,000,000 bytes',{cls:'sm'});return d.svg();
}
export function sd_storage_manifest() {
const d=illustration('sd_storage_manifest','A COMPLETION MANIFEST NAMES THE ORDERED PARTS OF ONE UPLOAD',350);
  const parts=[['part A','checksum'],['part B','checksum'],['part C','checksum']];
  parts.forEach(([s,c],i)=>{figPage(d,46+i*126,68,98,111,s,i===1);d.text(95+i*126,201,c,{cls:'sm'});});
  d.doc(470,61,127,205,{lines:false,fill:C.accFaint,stroke:C.acc});d.text(533,84,'manifest',{cls:'ttl'});
  ['upload ID','A + check','B + check','C + check'].forEach((s,i)=>d.mono(533,116+i*31,s,{size:10}));
  d.arrow(403,138,462,138,{stroke:C.acc});
  d.text(320,303,'ordered assembly → verified object → application publication',{cls:'mono',size:11});d.text(320,328,'illustrative three-part cutaway of the upload mechanism',{cls:'sm'});return d.svg();
}
export function sd_storage_retry() {
  const d = illustration('sd_storage_retry', 'ONE 100 MB PART FAILS: RESEND 100,000,000 B, NOT 5,000,000,000 B (50× LESS)', 280);
  for (let i = 0; i < 50; i++) d.rect(40 + (i % 25) * 22, 70 + Math.floor(i / 25) * 30, 18, 24, { r: 1, fill: i === 17 ? C.accSoft : C.card, stroke: i === 17 ? C.acc : C.line });
  cross(d, 40 + 17 * 22 + 9, 82, 6);
  d.travel([[20, 82], [40 + 17 * 22 + 9, 82]], { dur: 3, at: [0.5, 0.9], label: 'part 18', w: 46 });
  d.text(320, 160, '50 parts of 100,000,000 B; only part 18 goes again', { cls: 'sm' });
  d.text(320, 186, 'repeated failures, setup and completion work are excluded', { cls: 'xs' });
  return d.svg();
}
export function sd_storage_parallel() {
  const d = illustration('sd_storage_parallel', 'FIVE PARTS SHARE ONE 10 MB/S LINK: 2 MB/S EACH, 50 S PER GROUP, 500 S FOR ALL 50', 300);
  d.laptop(30, 100, 80);
  pipe(d, 120, 480, 130, 60, false);
  [0, 1, 2, 3, 4].forEach((k) => d.travel([[124, 108 + k * 11], [476, 108 + k * 11]], { dur: 4, at: [0, 1], token: (g) => g.rect(-14, -4, 28, 8, { r: 1, fill: C.accSoft, stroke: C.acc }) }));
  obj(d, 500, 95, 100, 70, 'object');
  d.text(300, 186, '10,000,000 B/s ÷ 5 = 2,000,000 B/s per part', { cls: 'xs' });
  d.text(320, 230, 'parallelism hides per-request waits; it cannot widen the link', { cls: 'sm' });
  return d.svg();
}
export function sd_storage_abandoned() {
  const d = illustration('sd_storage_abandoned', 'TEN ABANDONED UPLOADS WITH 2 PARTS EACH STILL HOLD 2,000,000,000 B', 300);
  for (let s = 0; s < 10; s++) { const x = 40 + (s % 5) * 112, y = 60 + Math.floor(s / 5) * 80; d.rect(x, y, 96, 60, { r: 4, stroke: C.gray, dash: [4, 3] }); obj(d, x + 8, y + 14, 36, 32); obj(d, x + 52, y + 14, 36, 32); }
  d.text(320, 240, 'each session: 2 × 100,000,000 B. A lifecycle rule aborts them after the resume horizon', { cls: 'xs' });
  return d.svg();
}
export function sd_storage_digest() {
  const d = illustration('sd_storage_digest', 'TWO 11-BYTE PAYLOADS ONE CHARACTER APART HAVE COMPLETELY DIFFERENT DIGESTS', 300);
  [['Heron:7:120', '5eae8f64…', '4,221,786,988'], ['Heron:7:121', '09a87f96…', '2,359,585,786']].forEach(([p, sha, crc], i) => {
    const y = 70 + i * 90;
    d.doc(40, y, 120, 54, { lines: false, fill: i ? C.accSoft : C.card, stroke: i ? C.acc : C.ink2 }); d.mono(100, y + 27, p, { size: 11 });
    d.arrow(166, y + 27, 216, y + 27, { stroke: C.gray, hl: 5 });
    d.mono(230, y + 18, `SHA-256 ${sha}`, { size: 10, a: 'start' }); d.mono(230, y + 38, `CRC32 ${crc}`, { size: 10, a: 'start' });
  });
  d.text(320, 268, 'prefixes are for display; compare the full intended checksum', { cls: 'xs' });
  return d.svg();
}
export function sd_storage_binding() {
  const d = illustration('sd_storage_binding', 'THE EXPECTED CHECKSUM IS FIXED AT RESERVATION; THE CLIENT CANNOT CHANGE IT LATER', 300);
  const st = [['reserve', 'expect sha …e41'], ['upload', 'exact key'], ['storage validates', 'computes sha'], ['compare', 'with reservation']];
  st.forEach(([s, t], i) => {
    const x = 30 + i * 150, hot = i === 3;
    d.rect(x, 80, 120, 70, { r: 8, fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2 });
    d.text(x + 60, 104, s, { cls: 'ttl', size: 12, color: hot ? C.acc : undefined }); d.mono(x + 60, 128, t, { size: 9 });
    if (i < 3) d.arrow(x + 124, 115, x + 146, 115, { stroke: C.gray, hl: 5 });
  });
  d.lock(70, 50, 22, { stroke: C.acc });
  d.travel([[90, 115], [540, 115]], { dur: 5, r: 4 });
  d.text(320, 210, 'a composite multipart checksum has its own meaning: compare like with like', { cls: 'xs' });
  return d.svg();
}
export function sd_storage_etag() {
  const d = illustration('sd_storage_etag', 'AN ETAG IS A VERSION LABEL; A CHECKSUM IS A STATEMENT ABOUT EXACT BYTES', 300);
  panel(d, 20, 44, 292, 200, 'entity validator (ETag)');
  chip(d, 80, 96, 170, 'ETag: "a1b2…-50"', false, 28);
  d.text(166, 150, 'product-defined; multipart\nETags are not a plain hash', { cls: 'xs', vc: true });
  panel(d, 328, 44, 292, 200, 'integrity checksum', true);
  chip(d, 380, 96, 190, 'SHA-256 full object', true, 28);
  d.text(474, 150, 'named algorithm, named byte\nscope, compared in full', { cls: 'xs', vc: true });
  return d.svg();
}
export function sd_storage_range() {
  const d = illustration('sd_storage_range', 'A 1 MB RANGE IS 0.02% OF A 5 GB OBJECT: 0.1 S AT 10 MB/S', 280);
  const X = 40, W = 560;
  d.rect(X, 90, W, 40, { r: 2, fill: C.card, stroke: C.ink2 }); d.text(X + W / 2, 76, '5,000,000,000 B object', { cls: 'xs' });
  d.rect(X + 200, 90, 3, 40, { r: 0, fill: C.acc, stroke: C.acc });
  d.arrow(X + 201, 136, X + 201, 170, { stroke: C.acc }); d.mono(X + 201, 184, 'Range: bytes=…, 1,000,000 B', { size: 10, color: C.acc });
  d.text(320, 236, 'a whole-object checksum cannot verify a range by itself', { cls: 'xs' });
  return d.svg();
}
export function sd_storage_replication() {
  const d = illustration('sd_storage_replication', 'THREE FULL COPIES OF 5 GB = 15 GB, AND ONLY USEFUL IN SEPARATE FAILURE DOMAINS', 300);
  obj(d, 270, 46, 100, 60, '5 GB logical', true);
  ['zone A', 'zone B', 'zone C'].forEach((z, i) => {
    const x = 60 + i * 190;
    d.rect(x, 150, 140, 100, { r: 8, stroke: C.line, dash: [4, 4] }); d.text(x + 70, 166, z, { cls: 'xs' });
    obj(d, x + 30, 180, 80, 50, '5 GB');
    d.arrow(320, 110, x + 70, 176, { stroke: C.ink2, hl: 6 });
  });
  d.text(320, 284, '15,000,000,000 B before metadata, snapshots and transfer copies', { cls: 'xs' });
  return d.svg();
}
export function sd_storage_erasure() {
const d=illustration('sd_storage_erasure','FOUR DATA SHARDS AND TWO PARITY SHARDS CHANGE THE STORAGE BUDGET',330);
  ['D1','D2','D3','D4','P1','P2'].forEach((s,i)=>{figPage(d,38+i*100,76,78,140,s,i>=4);d.text(78+i*100,241,i<4?'data':'parity',{cls:'sm',color:i>=4?C.acc:C.ink2});});
  d.mono(320,278,'5,000,000,000 B ÷ 4 = 1,250,000,000 B per shard',{size:11});
  d.mono(320,307,'6 × 1,250,000,000 B = 7,500,000,000 B stored',{size:11});return d.svg();
}
export function sd_storage_dfs() {
  const d = illustration('sd_storage_dfs', 'THE COORDINATOR KNOWS WHERE PIECES LIVE; DATA SERVERS MOVE THE BYTES', 320);
  d.server(250, 50, 140, 80, { label: 'metadata coordinator' });
  chip(d, 260, 150, 120, 'c7 → s2, s4, s5', true);
  [0, 1, 2, 3, 4].forEach((i) => { d.server(40 + i * 120, 210, 60, 60, { unit: 14, fill: [1, 3, 4].includes(i) ? C.accSoft : C.card, stroke: [1, 3, 4].includes(i) ? C.acc : C.ink2 }); d.mono(70 + i * 120, 286, `s${i + 1}`, { size: 9 }); });
  d.laptop(520, 60, 80, { label: 'client' });
  d.arrow(516, 90, 396, 90, { stroke: C.gray, hl: 6 }); d.text(456, 78, 'where?', { cls: 'xs' });
  d.arrow(540, 130, 190, 210, { stroke: C.acc }); d.text(380, 190, 'bytes direct', { cls: 'xs', color: C.acc });
  return d.svg();
}
export function sd_storage_region() {
  const d = illustration('sd_storage_region', 'TO RECOVER IN REGION B YOU NEED THE OBJECT COPY AND ITS VERIFIED POINTER', 300);
  panel(d, 20, 44, 260, 200, 'region A');
  obj(d, 50, 90, 90, 60, 'c7 v2'); d.db(170, 90, 80, 60);
  panel(d, 360, 44, 260, 200, 'region B', true);
  obj(d, 390, 90, 90, 60, 'c7 v2', true); d.db(510, 90, 80, 60, { fill: C.accSoft, stroke: C.acc });
  d.arrow(144, 120, 386, 120, { stroke: C.ink2, dash: [4, 4] }); d.arrow(254, 150, 506, 150, { stroke: C.ink2, dash: [4, 4] });
  d.text(490, 200, 'publish only when both\nare present and match', { cls: 'xs', vc: true, color: C.acc });
  return d.svg();
}
export function sd_storage_remote() {
  const d = illustration('sd_storage_remote', 'A 5 S GAP IS 100 SCORE EVENTS, BUT A 5 GB CLIP REPLICATES ON ITS OWN CLOCK', 300);
  d.tape(60, 80, Array(10).fill(''), { cw: 30, h: 24 }); d.mono(210, 124, '20 events/s × 5 s = 100', { size: 10 });
  obj(d, 400, 70, 180, 60, 'one 5 GB clip', true);
  d.rect(400, 140, 180, 14, { r: 2, stroke: C.ink2 }); d.fillRect(402, 142, 70, 10, C.accSoft);
  d.text(490, 172, 'copy progress, measured per object', { cls: 'xs' });
  d.text(320, 240, 'do not reuse a lag number across different workloads', { cls: 'xs' });
  return d.svg();
}
export function sd_storage_lifecycle() {
  const d = illustration('sd_storage_lifecycle', '100 CLIPS/DAY × 5 GB × 30 DAYS = 15 TB: 3.5 TB HOT (7 DAYS), 11.5 TB COLDER', 300);
  const X = 40, W = 560, s = W / 30;
  for (let day = 0; day < 30; day++) { const hot = day >= 23; d.rect(X + day * s, 100, s - 2, 60, { r: 1, fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.line }); }
  d.brace(X, X + 23 * s, 172, { label: 'other 23 days: 2,300 clips, 11,500,000,000,000 B' });
  d.brace(X + 23 * s, X + W, 88, { dir: -1, label: 'hot 7: 700 clips, 3.5 TB' });
  d.text(320, 250, 'replicas, metadata, versions and incomplete parts come on top', { cls: 'xs' });
  return d.svg();
}
export function sd_storage_archive() {
  const d = illustration('sd_storage_archive', 'AN ARCHIVED CLIP EXISTS BUT IS NOT PLAYABLE UNTIL A RESTORE FINISHES', 300);
  const st = [['archived', 'retained'], ['request restore', 'permitted'], ['wait + verify', 'tier-dependent'], ['playback access', 'now playable']];
  st.forEach(([s, t], i) => {
    const x = 30 + i * 150, hot = i === 3;
    obj(d, x + 20, 70, 80, 60, '', hot);
    if (i === 0) d.lock(x + 50, 84, 20);
    if (i === 2) d.clock(x + 60, 100, 34, { spin: 4 });
    if (i === 3) d.poly([[x + 52, 88], [x + 52, 116], [x + 74, 102]], { fill: C.acc, stroke: C.acc });
    d.text(x + 60, 150, s, { cls: 'ttl', size: 12, color: hot ? C.acc : undefined }); d.text(x + 60, 170, t, { cls: 'xs' });
    if (i < 3) d.arrow(x + 104, 100, x + 166, 100, { stroke: C.gray, hl: 5 });
  });
  return d.svg();
}
export function sd_storage_deletion() {
  const d = illustration('sd_storage_deletion', 'COMMIT THE DELETE AND THE EXACT IDS FIRST; CLEAN THE BYTES IN A RETRYABLE JOB', 320);
  const st = [['commit tombstone\n+ object ids', true], ['stop new\nplayback URLs', false], ['delete recorded\nobjects', false], ['mark cleanup\ncomplete', false]];
  st.forEach(([s, hot], i) => {
    const x = 30 + i * 150;
    d.circle(x + 60, 100, 70, { fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2 });
    d.mono(x + 60, 100, String(i + 1), { size: 13, color: hot ? C.acc : undefined });
    d.text(x + 60, 166, s, { cls: 'xs', vc: true });
    if (i < 3) d.arrow(x + 98, 100, x + 172, 100, { stroke: C.gray, hl: 5 });
  });
  d.text(320, 236, 'already-issued URLs and CDN copies expire on their own clocks', { cls: 'xs' });
  return d.svg();
}
export function sd_storage_reconcile() {
  const d = illustration('sd_storage_reconcile', 'THREE STRANDED STATES, THREE DIFFERENT REPAIRS', 300);
  const r = [['pending + parts exist', 'within resume horizon?', 'resume or abort'], ['object done, row pending', 'object verified?', 'publish or reclaim'], ['row deleted, bytes remain', 'tombstone lists ids', 'idempotent delete']];
  r.forEach(([a, b, c], i) => {
    const y = 60 + i * 66, hot = i === 2;
    chip(d, 30, y, 190, a, hot, 30);
    d.arrow(226, y + 15, 252, y + 15, { stroke: C.gray, hl: 5 });
    d.text(262, y + 15, b, { cls: 'sm', a: 'start' });
    d.arrow(430, y + 15, 456, y + 15, { stroke: C.gray, hl: 5 });
    d.text(466, y + 15, c, { cls: 'sm', a: 'start', color: hot ? C.acc : undefined });
  });
  d.text(320, 270, 'recover by identity and state, never by age alone', { cls: 'xs' });
  return d.svg();
}
export function sd_storage_fullupload() {
  const d = illustration('sd_storage_fullupload', 'THE APP RESERVES AND PUBLISHES; STORAGE HOLDS THE BYTES IN BETWEEN', 300);
  const st = [['reserve + authorize', 'app'], ['direct multipart transfer', 'client → storage'], ['verify + process', 'app + workers'], ['publish metadata', 'one DB commit']];
  st.forEach(([s, t], i) => {
    const x = 30 + i * 150, hot = i === 3;
    if (i === 1) for (let k = 0; k < 5; k++) d.rect(x + 14 + k * 20, 70, 16, 44, { r: 1, fill: C.card, stroke: C.ink2 }); else if (i === 3) d.db(x + 30, 66, 60, 54, { fill: C.accSoft, stroke: C.acc }); else d.server(x + 30, 64, 60, 56, { unit: 14 });
    d.text(x + 60, 140, s, { cls: 'ttl', size: 11, color: hot ? C.acc : undefined }); d.text(x + 60, 160, t, { cls: 'xs' });
    if (i < 3) d.arrow(x + 122, 92, x + 146, 92, { stroke: C.gray, hl: 5 });
  });
  d.travel([[90, 92], [540, 92]], { dur: 5, r: 4 });
  d.text(320, 220, 'each arrow crosses a separate failure and ownership boundary', { cls: 'xs' });
  return d.svg();
}
export function sd_storage_ownership() {
  const d = illustration('sd_storage_ownership', 'FOUR COMPONENTS, FOUR JOBS IN THE MEDIA PATH', 300);
  const r = [['application', 'permission + upload state'], ['database', 'relationships + publication'], ['object service', 'immutable bytes + attributes'], ['worker', 'verify and derive outputs']];
  r.forEach(([s, t], i) => {
    const x = 30 + i * 150, hot = i === 2;
    if (i === 0) d.server(x + 30, 60, 60, 60, { unit: 14 }); if (i === 1) d.db(x + 30, 60, 60, 60); if (i === 2) obj(d, x + 20, 64, 80, 52, '', true); if (i === 3) d.gear(x + 60, 90, 30, { spin: 5 });
    d.text(x + 60, 144, s, { cls: 'ttl', size: 12, color: hot ? C.acc : undefined }); d.text(x + 60, 164, t, { cls: 'xs' });
  });
  d.text(320, 230, 'a CDN delivers after publication, under its own cache and access rules', { cls: 'xs' });
  return d.svg();
}
export function sd_storage_retrycomplete() {
  const d = illustration('sd_storage_retrycomplete', 'THE COMPLETION REPLY WAS LOST; RETRYING "COMPLETE c7" RETURNS THE SAME VERIFIED STATE', 300);
  d.laptop(30, 80, 80, { label: 'client' }); d.server(280, 66, 80, 90, { label: 'application' }); obj(d, 500, 80, 100, 70, 'c7/source-v1');
  d.arrow(116, 96, 274, 96, { stroke: C.ink2 }); d.mono(196, 84, 'complete c7', { size: 9 });
  d.arrow(366, 110, 494, 110, { stroke: C.ink2, hl: 6 });
  d.arrow(274, 130, 120, 130, { stroke: C.gray }); bolt(d, 196, 114, 0.6);
  d.arrow(116, 200, 274, 200, { stroke: C.acc }); d.arrow(274, 228, 116, 228, { stroke: C.acc }); d.mono(196, 242, 'already verified', { size: 9, color: C.acc });
  d.travel([[116, 200], [274, 200], [274, 228], [116, 228]], { dur: 4, label: 'c7', w: 24 });
  return d.svg();
}
export function sd_storage_baseline() {
  const d = illustration('sd_storage_baseline', 'RECORDS AND EVENTS ARE DIFFERENT MODELS: 388.8 GB OF RECORDS VS 10.368 GB OF EVENTS', 300);
  const X = 60, W = 520, s = W / 388.8e9;
  [['records/day', 4.32e9, '8,640,000 × 500 B'], ['records, 30 days', 129.6e9, 'before copies'], ['× 3 copies', 388.8e9, '388,800,000,000 B'], ['events, 30 days', 10.368e9, '20 × 200 × 2,592,000']].forEach(([a, v, how], i) => {
    const y = 60 + i * 48, hot = i === 3;
    d.text(X, y - 4, a, { cls: 'xs', a: 'start' });
    d.rect(X, y + 4, Math.max(3, v * s), 22, { r: 2, fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2 });
    d.mono(X + Math.max(3, v * s) + 8, y + 15, how, { size: 9, a: 'start', color: hot ? C.acc : undefined });
  });
  d.text(320, 268, 'retain originals; fan-out deliveries are transmitted, not stored', { cls: 'xs' });
  return d.svg();
}
export function sd_storage_mediabudget() {
  const d = illustration('sd_storage_mediabudget', 'ONE 5 GB UPLOAD: 15 GB AS 3 COPIES, OR 7.5 GB AS 4 + 2 CODING; NEVER BOTH', 300);
  const r = [['logical', 5, '50 parts'], ['3 full copies', 15, 'replication model'], ['4 + 2 erasure coding', 7.5, 'coding model'], ['app-proxied traffic', 10, 'in + out']];
  r.forEach(([a, v, how], i) => {
    const y = 56 + i * 50, hot = i === 2;
    d.text(40, y + 12, a, { cls: 'ttl', a: 'start', size: 12, color: hot ? C.acc : undefined });
    d.rect(250, y, v * 22, 24, { r: 2, fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2 });
    d.mono(250 + v * 22 + 8, y + 12, `${v} GB · ${how}`, { size: 9.5, a: 'start' });
  });
  d.text(320, 270, 'compare alternatives; do not add mutually exclusive designs together', { cls: 'xs' });
  return d.svg();
}
export function sd_storage_final() {
  const d = illustration('sd_storage_final', 'FOUR BOUNDARIES, FOUR QUESTIONS, FOUR KINDS OF EVIDENCE', 320);
  const r = [['permission', 'who may upload?', 'trusted reservation'], ['transfer', 'same intended bytes?', 'length + checksum'], ['publication', 'playable now?', 'verified state'], ['recovery', 'survives a fault?', 'copies + restore test']];
  r.forEach(([s, q, e], i) => {
    const x = 20 + i * 152, hot = i === 1;
    panel(d, x, 48, 140, 220, s, hot);
    if (i === 0) d.key(x + 50, 110, 40); if (i === 1) d.doc(x + 50, 80, 40, 56, { fill: C.accSoft, stroke: C.acc }); if (i === 2) d.poly([[x + 58, 88], [x + 58, 128], [x + 90, 108]], { fill: C.acc, stroke: C.acc }); if (i === 3) { d.db(x + 30, 84, 34, 44); d.db(x + 76, 84, 34, 44); }
    d.text(x + 70, 170, q, { cls: 'xs' }); d.text(x + 70, 196, e, { cls: 'xs', color: hot ? C.acc : undefined });
  });
  return d.svg();
}
