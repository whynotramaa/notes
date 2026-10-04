import { systemFigure, systemMap, systemCover } from '../lib/system-figures.js';
import { D, C } from '../lib/draw.js';
import { world, arc } from '../lib/world.js';

export function where_sd_cdn(stage=99) { return systemMap("sd_cdn", ["Edges, origins, hits and misses", "TTL and Cache-Control", "Invalidation and versioned URLs", "Pull vs push CDN and shielding", "Signed URLs and private delivery", "Geographic routing", "Video and image delivery", "Case study: private video delivery"], stage); }
export function cover_sd_cdn() { return systemCover("sd_cdn", 14, ["CDN and content", "delivery"], "CDN and content delivery", ["Edges, origins, hits and misses", "TTL and Cache-Control", "Invalidation and versioned URLs", "Pull vs push CDN and shielding", "Signed URLs and private delivery", "Geographic routing", "Video and image delivery", "Case study: private video delivery"]); }
export function sd_cdn_roles() {
  const d = new D(640, 366, 'sd_cdn_roles');
  d.cycle = 8;
  d.text(10, 16, 'A VIEWER PATH CAN END AT AN EDGE OR CONTINUE TO ORIGIN', { cls: 'cap', a: 'start' });
  const m = world(d, 20, 36, 600, 270);
  const edges = ['oregon', 'dallas', 'saopaulo', 'london', 'frankfurt', 'mumbai', 'singapore', 'tokyo', 'sydney'];
  const origin = m.at('virginia'), fra = m.at('frankfurt'), sin = m.at('singapore');
  const perth = m.P(115.9, -31.9), cairo = m.at('cairo');
  d.path(arc(fra, origin, 0.3), { stroke: C.acc, single: true, dash: [5, 4], sw: 1.3 });
  d.line(perth[0], perth[1], sin[0], sin[1], { stroke: C.ink2, single: true });
  d.line(cairo[0], cairo[1], fra[0], fra[1], { stroke: C.ink2, single: true });
  edges.forEach((e) => {
    const [x, y] = m.at(e);
    d.server(x - 7, y - 9, 14, 18, { unit: 8, fill: C.paper, led: () => e === 'singapore' });
    d.text(x, y + 17, e === 'saopaulo' ? 'São Paulo' : e[0].toUpperCase() + e.slice(1), { cls: 'xs' });
  });
  d.db(origin[0] - 12, origin[1] - 14, 24, 28, { fill: C.accSoft, stroke: C.acc, bands: [0.5] });
  d.text(origin[0] - 18, origin[1] + 2, 'origin', { cls: 'sm', a: 'end' });
  d.person(perth[0], perth[1] - 8, 16);
  d.person(cairo[0], cairo[1] - 8, 16);
  d.travel([perth, sin], { at: [0, 0.14], r: 3.5, color: C.ink2 });
  d.pulse(sin[0], sin[1], { at: [0.13, 0.3], r1: 18, color: C.ink2 });
  d.travel([sin, perth], { at: [0.16, 0.3], token: 'packet', fill: C.paper, color: C.ink2 });
  d.travel([cairo, fra], { at: [0.34, 0.44], r: 3.5, color: C.ink2 });
  d.travel(arc(fra, origin, 0.3), { at: [0.44, 0.6], r: 4.5 });
  d.pulse(origin[0], origin[1], { at: [0.58, 0.72], r1: 22 });
  d.travel(arc(origin, fra, -0.3), { at: [0.62, 0.78], token: 'packet' });
  d.travel([fra, cairo], { at: [0.8, 0.92], token: 'packet', fill: C.paper, color: C.ink2 });
  d.line(30, 326, 56, 326, { stroke: C.ink2, single: true });
  d.text(64, 326, 'hit: the selected edge answers', { cls: 'sm', a: 'start' });
  d.line(30, 346, 56, 346, { stroke: C.acc, single: true, dash: [5, 4] });
  d.text(64, 346, 'miss: the edge fetches from origin', { cls: 'sm', a: 'start' });
  d.hand(470, 336, 'origin owns the source,\nedge serves a permitted copy', { size: 15, vc: true });
  return d.svg();
}
export function sd_cdn_misshit() {
  const d = new D(640, 318, 'sd_cdn_misshit');
  d.cycle = 9;
  d.text(10, 16, 'A MISS POPULATES STATE THAT A LATER REQUEST CAN REUSE', { cls: 'cap', a: 'start' });
  d.phone(46, 96, 76, { label: 'viewer' });
  d.server(270, 74, 100, 116, { label: 'edge', led: (i) => i === 2 });
  d.db(520, 92, 80, 92, { under: 'origin' });
  d.arrow(92, 122, 264, 122, { stroke: C.ink2, hl: 6 });
  d.arrow(264, 160, 92, 160, { stroke: C.ink2, hl: 6 });
  d.arrow(376, 122, 514, 122, { stroke: C.acc, hl: 6, dash: [5, 4] });
  d.arrow(514, 160, 376, 160, { stroke: C.acc, hl: 6, dash: [5, 4] });
  d.text(178, 110, 'GET /clip-c7', { cls: 'mono', size: 9.5 });
  d.text(445, 110, 'miss: fetch', { cls: 'sm' });
  d.text(445, 176, 'bytes + policy', { cls: 'sm' });
  d.text(320, 220, 'edge cache', { cls: 'xs' });
  d.tape(270, 228, ['', '', ''], { cw: 33.3, h: 24 });
  d.during([0.33, 1], (g) => { g.rect(271, 229, 31, 22, { r: 0, fill: C.accSoft, stroke: C.acc, sw: 0.9 }); g.text(286.5, 240, 'c7', { cls: 'mono', size: 9.5 }); });
  d.travel([[92, 122], [266, 122]], { at: [0, 0.1], r: 4, color: C.ink2 });
  d.travel([[374, 122], [516, 122]], { at: [0.1, 0.2], r: 4 });
  d.pulse(560, 138, { at: [0.18, 0.3], r1: 24 });
  d.travel([[516, 160], [374, 160]], { at: [0.21, 0.33], token: 'packet' });
  d.travel([[266, 160], [92, 160]], { at: [0.34, 0.46], token: 'packet', fill: C.paper, color: C.ink2 });
  d.travel([[92, 122], [266, 122]], { at: [0.56, 0.66], r: 4, color: C.ink2 });
  d.pulse(286, 240, { at: [0.64, 0.8], r1: 20 });
  d.during([0.64, 0.98], (g) => g.hand(320, 274, 'hit, origin untouched', { size: 16 }));
  d.during([0, 0.5], (g) => g.text(178, 196, 'first request', { cls: 'sm' }));
  d.during([0.5, 1], (g) => g.text(178, 196, 'later request', { cls: 'sm' }));
  d.travel([[266, 160], [92, 160]], { at: [0.68, 0.8], token: 'packet', fill: C.paper, color: C.ink2 });
  d.hand(320, 302, 'the first response creates reusable state', { size: 15 });
  return d.svg();
}
export function sd_cdn_load() { return systemFigure("sd_cdn_load", "ILLUSTRATIVE EQUAL-SIZE API DELIVERY AT 95% HITS", "rows", [["viewers", "1,000 req/s", "2,000,000 B/s"], ["edge hits", "950 req/s", "reused response"], ["origin misses", "50 req/s", "100,000 B/s"], ["origin reduction", "20 x", "requests in this model"]], "a hit moves work, it does not erase delivery"); }
export function sd_cdn_key() { return systemFigure("sd_cdn_key", "REPRESENTATION DIMENSIONS MULTIPLY CACHE VARIANTS", "rows", [["source path", "immutable clip or image", "base identity"], ["encoding", "2 choices", "assumed"], ["language", "3 choices", "assumed"], ["combined", "6 variants", "2 x 3"]], "equivalent requests need equivalent bytes"); }
export function sd_cdn_ttl() { return systemFigure("sd_cdn_ttl", "STORED AND FRESH ARE DIFFERENT QUESTIONS", "split", [["retention", "does this cache still hold bytes?\neviction can remove them early"], ["freshness", "may this request reuse those bytes?\nage and policy decide"]], "existence alone does not permit reuse"); }
export function sd_cdn_age() { return systemFigure("sd_cdn_age", "ILLUSTRATIVE RESPONSE AGE DOES NOT RESET AT AN EDGE", "rows", [["initial corrected age", "120 s", "already elapsed"], ["freshness lifetime", "300 s", "180 fresh s remain"], ["local residence", "240 s", "added age"], ["current age", "360 s", "60 s stale"]], "cache layers inherit age"); }
export function sd_cdn_directives() { return systemFigure("sd_cdn_directives", "DIRECTIVES NAME DIFFERENT REUSE AND STORAGE RULES", "rows", [["max-age=60", "private freshness", "illustrative"], ["s-maxage=300", "shared freshness", "illustrative"], ["no-cache", "validate before reuse", "may retain"], ["no-store", "do not store", "different rule"]], "a similar name can mean a different operation"); }
export function sd_cdn_revalidate() { return systemFigure("sd_cdn_revalidate", "A RETAINED BODY CAN BE REUSED AFTER CONDITIONAL VALIDATION", "sequence", {"actors": ["viewer", "edge", "origin"], "steps": [[0, 1, "request expired representation"], [1, 2, "conditional validator"], [2, 1, "unchanged: 304 metadata"], [1, 0, "reuse retained body"], [0, 1, "later fresh lookup"]]}, "retained bytes can avoid another full transfer"); }
export function sd_cdn_stale() { return systemFigure("sd_cdn_stale", "ILLUSTRATIVE STALE-IF-ERROR BOUND", "rows", [["freshness", "300 seconds", "lifetime"], ["error allowance", "30 seconds", "extra bound"], ["age 320", "20 seconds stale", "fits"], ["age 340", "40 seconds stale", "exceeds"]], "a fallback has an end"); }
export function sd_cdn_invalidate() { return systemFigure("sd_cdn_invalidate", "ONE INVALIDATION REQUEST TARGETS MANY SERVING COPIES", "fan", {"source": "invalidate key", "targets": ["edge group A", "edge group B", "edge group C"]}, "accepted is earlier than fully applied"); }
export function sd_cdn_version() { return systemFigure("sd_cdn_version", "A NEW VERSION HAS A NEW CACHE IDENTITY", "rows", [["old key", "clip-c7-v1", "old readers"], ["new key", "clip-c7-v2", "new verified bytes"], ["pointer update", "v1 to v2", "application publication"], ["two full objects", "10,000,000,000 B", "illustrative retained payload"]], "change the reference after verifying the version"); }
export function sd_cdn_revoke() { return systemFigure("sd_cdn_revoke", "CONTENT REMOVAL AND ACCESS REVOCATION HAVE DIFFERENT BOUNDARIES", "split", [["content cleanup", "origin delete and cache purge\nretained-copy policy"], ["access control", "stop new authorization\nexpire or revoke usable capability"]], "absence and permission are different proofs"); }
export function sd_cdn_negative() { return systemFigure("sd_cdn_negative", "A PREMATURE REQUEST CAN RETAIN AN ABSENCE RESPONSE", "flow", ["reference announced early", "origin not ready", "cached absence", "later object needs refresh"], "make the object usable before publishing its pointer"); }
export function sd_cdn_pull() { return systemFigure("sd_cdn_pull", "ILLUSTRATIVE ON-DEMAND COPY POPULATION", "rows", [["object", "5,000,000 B", "assumed"], ["requested sites", "2", "of 4 candidate sites"], ["pull copies", "10,000,000 B", "2 x object"], ["all-site placement", "20,000,000 B", "4 x object"]], "demand decides which copies are useful"); }
export function sd_cdn_push() { return systemFigure("sd_cdn_push", "PREPOSITIONING TRADES EARLY TRANSFER FOR POSSIBLE FIRST-READ BENEFIT", "flow", ["verified content", "selected placement", "warm readiness", "viewer demand"], "warm what the event will actually request"); }
export function sd_cdn_collapse() { return systemFigure("sd_cdn_collapse", "ILLUSTRATIVE COLD EQUIVALENT-SEGMENT BURST", "rows", [["viewers", "50,000", "same segment"], ["edges", "100", "500 viewers each"], ["without collapse", "50,000 fetches", "naive model"], ["one fetch per edge", "100 fetches", "500 x reduction"]], "one in-flight fetch can serve many waiters"); }
export function sd_cdn_inflight() { return systemFigure("sd_cdn_inflight", "COLD STATE INCLUDES ONE FETCH AND MANY WAITERS", "flow", ["empty key", "first fetch owner", "equivalent waiters", "retain + distribute"], "collapse work without unbounded waiting"); }
export function sd_cdn_shield() { return systemFigure("sd_cdn_shield", "A SHARED FETCH LAYER CAN REDUCE MANY EDGE MISSES", "flow", ["many edges", "shared shield key", "one origin fetch", "fan out retained bytes"], "origin protection has its own failure path"); }
export function sd_cdn_shieldcount() { return systemFigure("sd_cdn_shieldcount", "ILLUSTRATIVE IDENTICAL SEGMENT REQUEST COUNTS", "rows", [["viewer requests", "50,000 / 6", "8,333.333... /s"], ["edge fetches", "100 / 6", "16.666... /s"], ["ideal shield fetches", "1 / 6", "0.166666... /s"]], "count each reuse boundary"); }
export function sd_cdn_capabilities() { return systemFigure("sd_cdn_capabilities", "UPLOAD AND PLAYBACK DELEGATE DIFFERENT OPERATIONS", "split", [["storage upload capability", "client -> object service\nreserved write operation"], ["CDN playback capability", "viewer -> edge\npermitted retrieval policy"]], "sign the operation at its actual boundary"); }
export function sd_cdn_privatehit() { return systemFigure("sd_cdn_privatehit", "A STORED PRIVATE RESPONSE STILL NEEDS A VIEWER CHECK", "flow", ["viewer capability", "validate policy", "lookup equivalent content", "return permitted bytes"], "shared bytes can remain private"); }
export function sd_cdn_twoidentities() { return systemFigure("sd_cdn_twoidentities", "CONTENT IDENTITY AND ACCESS IDENTITY DO DIFFERENT JOBS", "rows", [["content", "clip c7 version v1", "select exact bytes"], ["access", "viewer policy + expiry", "permit this request"], ["reuse", "same bytes across viewers", "only after validation"]], "do not make access a cache accident"); }
export function sd_cdn_bypass() { return systemFigure("sd_cdn_bypass", "A PROTECTED EDGE DOES NOT HELP WITH A PUBLIC BYPASS", "split", [["intended route", "viewer -> validated CDN\nrestricted origin fetch"], ["unsafe bypass", "viewer -> public origin\nno CDN policy check"]], "protect every path to the same bytes"); }
export function sd_cdn_expirypermission() { return systemFigure("sd_cdn_expirypermission", "ACCESS LIFETIME AND REPRESENTATION AGE ARE INDEPENDENT", "rows", [["capability", "300 seconds", "illustrative policy"], ["cached bytes", "their own age rule", "representation"], ["expired access", "deny retrieval", "even if fresh hit"], ["valid access", "check usable bytes", "may need refresh"]], "satisfy access and content policy together"); }
export function sd_cdn_dnsgeo() { return systemFigure("sd_cdn_dnsgeo", "DNS SELECTION IS AN EARLIER DECISION THAN THE REQUEST", "flow", ["viewer resolver", "routing policy", "cached address", "edge connection"], "the resolver is not always the viewer"); }
export function sd_cdn_anycast() { return systemFigure("sd_cdn_anycast", "ONE ADDRESS CAN REACH DIFFERENT ADVERTISED SITES", "tree", ["shared service address", "site A route", "site B route", "site C route"], "a shared address does not share connection state"); }
export function sd_cdn_coldroute() { return systemFigure("sd_cdn_coldroute", "ILLUSTRATIVE WARM AND COLD ORIGINAL ORIGIN DEMAND", "rows", [["warm path", "50 req/s", "95% hits"], ["cold replacement", "1,000 req/s", "all miss model"], ["ratio", "20 x", "same viewers"], ["protection", "collapse + shield + bounds", "measure behavior"]], "routing can change the cache workload"); }
export function sd_cdn_latency() { return systemFigure("sd_cdn_latency", "ILLUSTRATIVE MIXTURE MEAN IS NOT A TAIL PERCENTILE", "rows", [["hits", "0.9 x 20 ms", "18 ms weighted"], ["misses", "0.1 x 200 ms", "20 ms weighted"], ["mean", "38 ms", "sum"], ["tail", "needs distribution", "not inferred"]], "calculate the statistic you actually have"); }
export function sd_cdn_video() { return systemFigure("sd_cdn_video", "ILLUSTRATIVE SINGLE-RENDITION VIDEO DELIVERY", "rows", [["one viewer", "4,000,000 bit/s", "500,000 B/s"], ["50,000 viewers", "25,000,000,000 B/s", "200,000,000,000 bit/s"], ["6-second segment", "3,000,000 B", "payload"], ["segment requests", "50,000 / 6", "8,333.333... /s"]], "viewer bytes remain after source reuse"); }
export function sd_cdn_bytehit() { return systemFigure("sd_cdn_bytehit", "ILLUSTRATIVE HIGH REQUEST HITS CAN HIDE LOW BYTE HITS", "rows", [["small hits", "90 x 2,000 B", "180,000 B"], ["large misses", "10 x 1,000,000 B", "10,000,000 B"], ["request hits", "90 / 100", "90%"], ["byte hits", "180,000 / 10,180,000", "1.768172888...%"]], "choose the statistic that sizes the link"); }
export function sd_cdn_ranges() { return systemFigure("sd_cdn_ranges", "ILLUSTRATIVE REQUESTED RANGE AND ORIGIN TRANSFER CAN DIFFER", "rows", [["source", "5,000,000,000 B", "immutable identity"], ["requested range", "1,000,000 B", "0.02%"], ["edge behavior", "product-specific", "partial cache rules"], ["origin bytes", "measure actual fetch", "not assumed"]], "stable identity keeps ranges on the same version"); }
export function sd_cdn_transform() { return systemFigure("sd_cdn_transform", "NORMALIZATION BOUNDS DERIVED REPRESENTATIONS", "flow", ["requested dimensions", "validate supported set", "normalized content key", "reuse or bounded transform"], "key policy is a resource policy too"); }
export function sd_cdn_livecomparison() { return systemFigure("sd_cdn_livecomparison", "LIVE EVENTS AND VIDEO SEGMENTS ARE DIFFERENT WORKLOADS", "split", [["shared score event baseline", "20 events/s x 50,000 viewers\n200,000,000 payload B/s"], ["illustrative video rendition", "4,000,000 bit/s x 50,000\n25,000,000,000 payload B/s"]], "define what is copied to each viewer"); }
export function sd_cdn_playback() { return systemFigure("sd_cdn_playback", "PLAYBACK STARTS WITH A VERIFIED PUBLISHED IDENTITY", "flow", ["app permission + pointer", "edge access check", "cache or shield", "restricted origin"], "each boundary proves one requirement"); }
export function sd_cdn_playbacktrace() { return systemFigure("sd_cdn_playbacktrace", "PRIVATE PLAYBACK DOES NOT BYPASS THE EDGE CHECK ON A HIT", "sequence", {"actors": ["viewer", "edge", "origin"], "steps": [[0, 1, "signed request for c7-v1"], [1, 2, "if miss: authorized origin fetch"], [2, 1, "immutable bytes + policy"], [1, 0, "permitted response"], [0, 1, "next request validates again"]]}, "authorization belongs to the viewer request"); }
export function sd_cdn_failure() { return systemFigure("sd_cdn_failure", "AN ORIGIN OUTAGE STILL REQUIRES BOTH POLICY CHECKS", "rows", [["access valid?", "evaluate capability", "mandatory"], ["representation usable?", "fresh or permitted stale", "mandatory"], ["origin unavailable", "bounded fallback only", "no new authority"], ["window exceeded", "reject or alternate source", "document outcome"]], "degradation must keep its declared bound"); }
export function sd_cdn_reconcile() { return systemFigure("sd_cdn_reconcile", "ILLUSTRATIVE VIDEO REQUESTS SHRINK WHILE VIEWER BYTES REMAIN", "rows", [["viewer segment requests", "8,333.333... /s", "50,000 / 6"], ["edge fetches", "16.666... /s", "100 / 6"], ["ideal shield source fetches", "0.166666... /s", "1 / 6"], ["viewer bytes", "25,000,000,000 B/s", "bitrate x viewers"]], "label the workload at every arrow"); }
export function sd_cdn_jobs() { return systemFigure("sd_cdn_jobs", "ONE JOB PER DELIVERY COMPONENT", "rows", [["app + metadata", "permission and published identity", "control"], ["routing", "choose usable site", "reachability"], ["edge + shield", "reuse permitted representation", "delivery"], ["origin", "verified source bytes", "restricted access"]], "say why each box exists"); }
export function sd_cdn_boundaries() { return systemFigure("sd_cdn_boundaries", "THE SAME REQUEST MUST PASS SEPARATE BOUNDARIES", "matrix", {"rows": ["identity", "permission", "freshness", "capacity"], "cols": ["check", "common error"], "values": [["correct version + variant", "mixed representations"], ["valid viewer policy", "public cache bypass"], ["age + directives", "reset age per layer"], ["warm and cold path", "origin collapse"]]}, "correctness needs all applicable checks"); }
