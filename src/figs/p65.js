import { D, C } from '../lib/draw.js';
import { systemFigure, systemMap, systemCover } from '../lib/system-figures.js';

export function where_sd_caching(stage=99) { return systemMap("sd_caching", ["Cache layers: local, shared, HTTP", "Cache-aside and read-through", "Write-through and write-behind", "TTL and cache invalidation", "Eviction: LRU and LFU", "Stampede, penetration, avalanche", "Cache failure and fallback", "Case study: caching a hot read"], stage); }
export function cover_sd_caching() { return systemCover("sd_caching", 6, ["Caching", "strategies"], "Caching", ["Cache layers: local, shared, HTTP", "Cache-aside and read-through", "Write-through and write-behind", "TTL and cache invalidation", "Eviction: LRU and LFU", "Stampede, penetration, avalanche", "Cache failure and fallback", "Case study: caching a hot read"]); }
export function sd_caching_placement() { return systemFigure("sd_caching_placement", "WHERE THE REUSABLE COPY LIVES", "split", [["in process", "no cache network hop\nper-process copies"], ["distributed", "shared warm entries\nnetwork and service cost"]], "a missing copy is not missing truth"); }
export function sd_caching_levels() { return systemFigure("sd_caching_levels", "EACH CACHE SHORTENS A DIFFERENT PATH", "flow", ["browser response", "edge response", "app value", "DB page"], "cached pages still participate in queries"); }
export function sd_caching_aside() { return systemFigure("sd_caching_aside", "THE APPLICATION OWNS THE MISS PATH", "sequence", {"actors": ["application", "cache", "database"], "steps": [[0, 1, "get: miss"], [0, 2, "read truth"], [2, 0, "score + version"], [0, 1, "fill with expiry"]]}, "fill failure need not fail the read"); }
export function sd_caching_through() { return systemFigure("sd_caching_through", "THE LOADER IS INSIDE THE CACHE CONTRACT", "flow", ["caller", "cache lookup", "bounded loader", "source result"], "a timeout must not become a cached absence"); }
export function sd_caching_throughwrite() { return systemFigure("sd_caching_throughwrite", "ACKNOWLEDGEMENT FOLLOWS THE SOURCE CONTRACT", "flow", ["write", "authoritative commit", "copy update", "return result"], "define every partial failure"); }
export function sd_caching_behind() { return systemFigure("sd_caching_behind", "THE ACKNOWLEDGEMENT POINT CHANGES RISK", "split", [["write-through", "source finishes\nthen acknowledge"], ["write-behind", "buffer accepts\nsource finishes later"]], "fast acknowledgement needs a survival story"); }
export function sd_caching_race() { return systemFigure("sd_caching_race", "A STALE FILL CAN FOLLOW INVALIDATION", "sequence", {"actors": ["reader", "database", "cache"], "steps": [[0, 1, "read old version"], [1, 2, "writer invalidates"], [0, 2, "fill old version"], [2, 0, "later hit is stale"]]}, "compare versions at the fill boundary"); }
export function sd_caching_eviction() { return systemFigure("sd_caching_eviction", "CAPACITY AND FRESHNESS ARE DIFFERENT LIMITS", "rows", [["TTL", "too old", "expire"], ["LRU", "least recent", "evict"], ["LFU", "least frequent", "evict"]], "eviction does not mean the source was deleted"); }
export function sd_caching_stampede() { return systemFigure("sd_caching_stampede", "ONE MISS SHOULD NOT CREATE MANY SOURCE READS", "fan", {"source": "expired hot key", "targets": ["caller waits", "one bounded loader", "stale copy if allowed"]}, "absence and source failure are different"); }
export function sd_caching_correlated() { return systemFigure("sd_caching_correlated", "TWO DIFFERENT SOURCES OF CONCENTRATION", "split", [["many keys miss", "expiry or outage\nsource refill surge"], ["one key hits", "popular owner\ncache service surge"]], "a hit can still overload its owner"); }
export function sd_caching_outage() { return systemFigure("sd_caching_outage", "ILLUSTRATIVE SOURCE DEMAND AFTER CACHE LOSS", "bars", [["normal misses", 100, "reads/s"], ["unbounded fallback", 1000, "reads/s"]], "fallback capacity must be designed"); }
export function sd_caching_complete() { return systemFigure("sd_caching_complete", "THE CACHE IS A SHORTER PERMITTED READ PATH", "flow", ["fresh hit?", "bounded miss", "truth + version", "safe fill"], "truth must remain recoverable without the copy"); }

// Four explicit states place the change beside its consequence. Long labels
// wrap inside their own column instead of shrinking the entire diagram.
function reviewStates(id, title, rows) {
  const d = new D(640, 340, id);
  d.text(10, 16, title, {cls:'cap', a:'start', size:8.8});
  const wrap = (s, limit=28) => {
    const words=String(s).split(' '), lines=[''];
    for (const word of words) {
      const last=lines.length-1;
      if ((lines[last]+' '+word).trim().length>limit && lines[last]) lines.push(word);
      else lines[last]=(lines[last]+' '+word).trim();
    }
    return lines.join('\n');
  };
  d.text(42, 48, 'STEP / ACTOR', {cls:'xs', a:'start'});
  d.text(194, 48, 'OPERATION / STATE', {cls:'xs', a:'start'});
  d.text(432, 48, 'OBSERVABLE CONSEQUENCE', {cls:'xs', a:'start'});
  rows.forEach(([actor,state,result],i)=>{
    const y=68+i*62, active=i===rows.length-1;
    d.circle(20,y+23,15,{stroke:active?C.acc:C.gray,fill:active?C.accSoft:C.card});
    d.mono(20,y+23,String(i+1),{size:8});
    if(i<rows.length-1)d.arrow(20,y+34,20,y+53,{stroke:C.line,hl:4});
    d.text(42,y+23,wrap(actor,20),{cls:'sm',a:'start',size:10.5,vc:true});
    d.box(185,y,216,46,wrap(state,29),{fill:active?C.accSoft:C.card,stroke:active?C.acc:C.line,size:11});
    d.arrow(405,y+23,423,y+23,{stroke:active?C.acc:C.gray,hl:5});
    d.text(432,y+23,wrap(result,27),{cls:'sm',a:'start',size:10.5,vc:true});
  });
  d.hand(321,324,'follow the state, then the effect',{size:16});
  return d.svg();
}
function reviewLog(id,title,rows) {
  const d=new D(640,350,id);
  d.text(10,16,title,{cls:'cap',a:'start',size:8.8});
  rows.forEach(([actor,state,result],i)=>{
    const y=59+i*64;
    d.text(18,y+14,actor,{cls:'sm',a:'start',size:10.5});
    d.rect(166,y-9,251,45,{fill:i===3?C.accSoft:C.card,stroke:i===3?C.acc:C.line});
    d.mono(291,y+13,state,{size:10.2});
    d.arrow(422,y+13,445,y+13,{stroke:i===3?C.acc:C.gray,hl:5});
    const words=result.split(' '); const middle=Math.ceil(words.length/2);
    d.text(457,y+13,words.length>5?words.slice(0,middle).join(' ')+'\n'+words.slice(middle).join(' '):result,{cls:'sm',a:'start',size:10,vc:true});
    if(i<3)d.arrow(291,y+40,291,y+52,{stroke:C.line,hl:5});
  });
  d.hand(320,330,'a suffix needs a matching prefix',{size:16});
  return d.svg();
}

export function sd_cache_trace_1() { return reviewStates("sd_cache_trace_1", "A COPY SAVES A PARTICULAR KIND OF WORK", [["request", "score representation", "repeated unchanged work"], ["source", "database truth", "authoritative record remains"], ["cached copy", "v7, score 10", "reusable for permitted reader"], ["fenced reader", "requires v8", "present copy can be ineligible"]]); }

export function sd_cache_trace_2() { return reviewStates("sd_cache_trace_2", "LOCAL CACHES TRADE NETWORK WAITS FOR DUPLICATE STATE", [["process A", "first score read", "load 2,100 accounted bytes"], ["process B", "same key, first read", "another independent copy"], ["10 processes", "same cached object", "21,000 accounted bytes"], ["restart A", "local copy disappears", "bounded source reload"]]); }

export function sd_cache_trace_3() { return reviewStates("sd_cache_trace_3", "SHARED CACHES ADD A SERVICE BOUNDARY", [["caller A", "shared key warm", "eligible hit"], ["caller B", "same shared key", "reuse one service copy"], ["normal peak", "1,000 reads/s, h=0.9", "100 source loads/s"], ["cache unavailable", "all requests still arrive", "fallback requires admission"]]); }

export function sd_cache_trace_4() { return reviewStates("sd_cache_trace_4", "RESPONSE LAYERS AND KEYS DEFINE WHAT CAN BE REUSED", [["public en", "match + format + locale", "reusable public representation"], ["public hi", "different locale", "separate representation key"], ["private scorer", "permission-sensitive result", "separate rule or bypass"], ["DB buffer page", "engine storage unit", "query and visibility still run"]]); }

export function sd_cache_trace_5() { return reviewStates("sd_cache_trace_5", "CACHE-ASIDE EXPOSES EACH MISS STEP", [["lookup", "cache get", "miss or ineligible copy"], ["admit", "source budget", "one allowed load"], ["source read", "20 ms assumed", "score + version"], ["safe fill", "derived copy only", "return source result even if fill fails"]]); }

export function sd_cache_trace_6() { return reviewStates("sd_cache_trace_6", "READ-THROUGH MOVES OWNERSHIP BEHIND THE INTERFACE", [["caller", "get score:m7", "one read interface"], ["cache", "eligible copy absent", "invoke bounded loader"], ["loader", "source returns v7", "preserve value vs error"], ["cache result", "install derived value", "same freshness rule remains"]]); }

export function sd_cache_trace_7() { return reviewStates("sd_cache_trace_7", "COMPUTE SAVED WORK AT THE NAMED BOUNDARY", [["peak reads", "1,000/s", "named score workload"], ["eligible hits", "0.9 x 1,000", "900/s"], ["miss loads", "0.1 x 1,000", "100/s before duplicates"], ["mean assumed wait", "0.9x2 + 0.1x22", "4 ms, not tail latency"]]); }

export function sd_cache_trace_8() { return reviewStates("sd_cache_trace_8", "LOADER ERRORS MUST NOT BECOME FALSE ABSENCE", [["time 0", "verified m8 absence", "negative expiry 5"], ["time 2", "m8 created", "source now has value"], ["time 3", "old negative entry", "absence may remain until invalidation"], ["time 5", "expiry reached", "reload current source state"]]); }

export function sd_cache_trace_9() { return reviewStates("sd_cache_trace_9", "WRITE-THROUGH NAMES ITS ACKNOWLEDGEMENT POINT", [["source commit", "c9, score 11, v8", "authoritative success boundary"], ["copy update", "cache v7 to v8", "may fail independently"], ["retry c9", "same command ID", "retrieve committed result"], ["read eligibility", "copy freshness uncertain", "follow declared coherence rule"]]); }

export function sd_cache_trace_10() { return reviewStates("sd_cache_trace_10", "WRITE-BEHIND MOVES UNSENT WORK INTO THE PROMISE", [["accept", "20 updates/s", "ack before source write"], ["pause", "5 s without drain", "100 unsent updates"], ["memory buffer", "100 x 200", "20,000 payload bytes"], ["crash", "buffer not durable", "acknowledged work may disappear"]]); }

export function sd_cache_trace_11() { return reviewStates("sd_cache_trace_11", "A DURABLE BUFFER NEEDS REPLAY AND ORDER", [["durable acceptance", "u7 then u8", "buffer survives crash"], ["first apply", "u7 effect succeeds", "progress reply lost"], ["replay", "same u7 identity", "no duplicate effect"], ["continue", "u8 applied", "advance safe progress"]]); }

export function sd_cache_trace_12() { return reviewStates("sd_cache_trace_12", "DELAYED COPY UPDATES NEED VERSION ORDERING", [["source order", "v8 then v9", "score 11 then 12"], ["arrival order", "v9 first", "install [9,12]"], ["late update", "v8 compares with v9", "reject backward overwrite"], ["after eviction", "version floor forgotten", "needs tombstone or generation rule"]]); }

export function sd_cache_trace_13() { return reviewStates("sd_cache_trace_13", "TTL BOUNDS COPY AGE UNDER AN EXPIRY RULE", [["insert", "time 0, TTL 30", "expiry at 30"], ["source change", "time 1", "copy now old"], ["viewer read", "time 2", "age 2, but stale version"], ["remaining reuse", "30 - 1", "29 seconds without invalidation"]]); }

export function sd_cache_trace_14() { return reviewStates("sd_cache_trace_14", "INVALIDATION CAN BE FOLLOWED BY AN OLD FILL", [["R source read", "obtains v7", "fill not yet sent"], ["W commit", "source becomes v8", "new authoritative score"], ["W invalidation", "cache key deleted", "v8 knowledge absent in empty key"], ["R delayed fill", "sets v7 after delete", "stale copy reappears"]]); }

export function sd_cache_trace_15() { return reviewStates("sd_cache_trace_15", "GENERATION KEYS ISOLATE OLD IN-FLIGHT FILLS", [["R starts", "key score:m7:v7", "old generation selected"], ["W commits", "source generation 8", "publish authoritative selection"], ["R delayed fill", "writes only v7 key", "cannot overwrite v8 key"], ["S current read", "key score:m7:v8", "load or reuse current generation"]]); }

export function sd_cache_trace_16() { return reviewStates("sd_cache_trace_16", "PERMITTED STALE SERVING AND HTTP VALIDATION", [["age 0 to 5", "fresh interval", "reuse permitted"], ["age 7", "within stale window", "serve and coalesce refresh"], ["age 11", "beyond allowed window", "reload or declared failure"], ["HTTP validator", "representation unchanged", "304 still contacts origin"]]); }

export function sd_cache_trace_17() { return reviewStates("sd_cache_trace_17", "COUNT PAYLOAD AND METADATA SEPARATELY", [["payload", "100,000 x 2,000", "200,000,000 bytes"], ["metadata assumption", "100,000 x 100", "10,000,000 bytes"], ["accounted total", "payload + metadata", "210,000,000 bytes"], ["256 MB budget", "210 / 256", "82.03125% accounted occupancy"]]); }

export function sd_cache_trace_18() { return reviewStates("sd_cache_trace_18", "LRU MOVES A TOUCHED KEY TO THE RECENT END", [["after A B A", "LRU to MRU [B,A]", "A hit changes order"], ["after C A", "[B,C,A]", "A newest"], ["request D", "evict B", "[C,A,D]"], ["request B", "evict C", "[A,D,B], 2 hits of 7"]]); }

export function sd_cache_trace_19() { return reviewStates("sd_cache_trace_19", "LFU KEEPS COUNTS AND NEEDS A TIE-BREAKER", [["after A B A C A", "A:3 B:1 C:1", "resident access counts"], ["request D", "B oldest minimum", "A:3 C:1 D:1"], ["request B", "C oldest minimum", "A:3 D:1 B:1"], ["separate A A A B C", "LRU evicts A, LFU B", "same hits, different contents"]]); }

export function sd_cache_trace_20() { return reviewStates("sd_cache_trace_20", "POLICY CHOICE DEPENDS ON SCANS AND OBJECT SIZE", [["ordinary object", "2,000 + 100", "2,100 accounted bytes"], ["large object", "20,000 + 100", "20,100 accounted bytes"], ["size comparison", "9 x 2,100 = 18,900", "10 x 2,100 = 21,000"], ["policy decision", "admit and replace", "measure saved work per byte"]]); }

export function sd_cache_trace_21() { return reviewStates("sd_cache_trace_21", "A STAMPEDE DUPLICATES THE SAME SOURCE LOAD", [["burst", "100 callers miss same key", "100 loads if independent"], ["single-flight", "1 loader owns refill", "99 duplicate loads avoided"], ["waiters", "join compatible result", "bounded wait or permitted stale"], ["loader fails", "clear ownership safely", "retry or defined failure"]]); }

export function sd_cache_trace_22() { return reviewStates("sd_cache_trace_22", "PENETRATION IS REPEATED WORK FOR ABSENT KEYS", [["repeated absent key", "100 requests, one interval", "one verified load can suffice"], ["negative reuse", "remaining 99 requests", "same visibility contract"], ["100 distinct keys", "no shared absent entry", "100 possible source reads"], ["source timeout", "existence unknown", "never cache as absence"]]); }

export function sd_cache_trace_23() { return reviewStates("sd_cache_trace_23", "AN AVALANCHE ALIGNS MISSES ACROSS MANY KEYS", [["aligned cohort", "1,000 keys in 1 s", "1,000 loads/s interval"], ["ideal spread", "10 equal second buckets", "100 scheduled loads/s"], ["real jitter", "random bucket occupancy", "peak is not guaranteed equal"], ["cache-wide loss", "many keys missing", "source admission still required"]]); }

export function sd_cache_trace_24() { return reviewStates("sd_cache_trace_24", "A HOT KEY CAN OVERLOAD A CACHE HIT PATH", [["total reads", "1,000/s", "public score workload"], ["popular key", "80% of requests", "800 reads/s"], ["payload", "800 x 2,000", "1,600,000 bytes/s"], ["10 equal copies", "800 / 10", "80 reads/s each under ideal routing"]]); }

export function sd_cache_trace_25() { return reviewStates("sd_cache_trace_25", "CACHE LOSS CAN MULTIPLY SOURCE DEMAND", [["normal", "1,000 reads/s, h=0.9", "100 source reads/s"], ["cache loss", "all copies inaccessible", "1,000 offered fallback reads/s"], ["multiplier", "1,000 / 100", "10 times normal demand"], ["degradation", "admit chosen subset", "protect authoritative writes"]]); }

export function sd_cache_trace_26() { return reviewStates("sd_cache_trace_26", "BOUND FALLBACK WITH A SOURCE ADMISSION BUDGET", [["fallback slots", "4 concurrent reads", "separate from scorer budget"], ["20 ms assumption", "4 / 0.02", "200 reads/s ideal bound"], ["1,000 arrival rate", "1,000 - 200", "800 need another outcome"], ["100 ms slowdown", "4 / 0.1", "40 reads/s ideal bound"]]); }

export function sd_cache_trace_27() { return reviewStates("sd_cache_trace_27", "TIMEOUT AND RECONNECT BEHAVIOR CAN CAUSE A SECOND STORM", [["budget", "50 ms total", "one caller deadline"], ["cache timeout", "5 ms consumed", "45 ms remain"], ["source assumption", "20 ms consumed", "25 ms for other work"], ["3 cache attempts", "15 + 20 consumed", "15 ms remain, before overhead"]]); }

export function sd_cache_trace_28() { return reviewStates("sd_cache_trace_28", "CACHE REPLICA FAILOVER CAN RESURRECT AN OLDER VALUE", [["before delete", "P v7, Q v7", "copies match"], ["invalidation", "P absent, Q v7", "replica update delayed"], ["P fails", "promote Q", "v7 visible again"], ["required read", "minimum v8", "reject copy or route to source"]]); }

export function sd_cache_trace_29() { return reviewStates("sd_cache_trace_29", "TRACE THE PERMITTED HIT AND THE BOUNDED MISS", [["key construction", "representation + visibility", "correct reusable object"], ["eligibility", "age + source version", "return only permitted copy"], ["miss path", "coalesce and admit", "bounded suitable source fetch"], ["safe fill", "generation or version floor", "source result survives fill failure"]]); }

export function sd_cache_trace_30() { return reviewStates("sd_cache_trace_30", "A SCORE WRITE KEEPS CACHE MAINTENANCE OUTSIDE TRUTH", [["source commit", "c9 -> score 11, v8", "record official result atomically"], ["copy maintenance", "generation 8 or floor 8", "failure remains a separate boundary"], ["late v7 load", "old generation or below floor", "cannot become current allowed copy"], ["scorer refresh", "requires v8", "do not silently serve v7"]]); }

export function sd_cache_trace_31() { return reviewStates("sd_cache_trace_31", "COUNT NORMAL, COLD, AND DEGRADED OPERATION", [["warm", "h=0.9, 1,000 reads/s", "100 source reads/s"], ["cold", "h=0, same arrivals", "1,000 offered loads/s"], ["bounded failure", "4 slots, 20 ms assumed", "200 ideal admitted reads/s"], ["memory", "100,000 x 2,100", "210,000,000 bytes per full copy"]]); }

export function sd_cache_trace_32() { return reviewStates("sd_cache_trace_32", "TEST THE HISTORIES A WARM BENCHMARK MISSES", [["race test", "pause v7 loader, commit v8", "verify safe fill after eviction too"], ["failover test", "old replica promoted", "strict reader rejects resurrected v7"], ["burst test", "100 callers, one key", "count coalesced source loads"], ["outage test", "many missing keys", "global fallback budget remains bounded"]]); }
