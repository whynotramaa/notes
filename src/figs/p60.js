import { systemFigure, systemMap, systemCover } from '../lib/system-figures.js';

export function where_sd_networking(stage=99) { return systemMap("sd_networking", ["DNS, TCP and UDP", "HTTP versions and TLS", "REST, gRPC, WebSockets and SSE", "Proxies, L4/L7 and connection pools", "Timeouts, retries and backoff", "Idempotency, polling and push", "Case study: one request end to end"], stage); }
export function cover_sd_networking() { return systemCover("sd_networking", 1, ["Networking", "fundamentals"], "Networking fundamentals", ["DNS, TCP and UDP", "HTTP versions and TLS", "REST, gRPC, WebSockets and SSE", "Proxies, L4/L7 and connection pools", "Timeouts, retries and backoff", "Idempotency, polling and push", "Case study: one request end to end"]); }
export function sd_dns_path() { return systemFigure("sd_dns_path", "A NAME BECOMES A CACHED ANSWER", "flow", ["stub", "recursive", "authority", "address"], "the directory is not the request"); }
export function sd_transport_order() { return systemFigure("sd_transport_order", "PACKET LOSS CHANGES DELIVERY", "rows", [["sent", "A", "B", "C"], ["arrived", "A", "gap", "C"], ["TCP visible", "A", "wait", "wait"]], "ordering has a waiting cost"); }
export function sd_http_versions() { return systemFigure("sd_http_versions", "HTTP SEMANTICS, DIFFERENT TRANSPORTS", "rows", [["HTTP/1.1", "messages", "TCP"], ["HTTP/2", "frames", "TCP"], ["HTTP/3", "frames", "QUIC"]], "same resource, different connection mechanics"); }
export function sd_http_streams() { return systemFigure("sd_http_streams", "RESPONSES CAN SHARE A CONNECTION", "split", [["ordered responses", "slow response A\nthen response B"], ["multiplexed frames", "A frame, B frame\nindependent HTTP streams"]], "TCP can still hold the bytes behind a gap"); }
export function sd_tls_sequence() { return systemFigure("sd_tls_sequence", "ILLUSTRATIVE COLD REQUEST", "sequence", {"actors": ["viewer", "resolver", "server"], "steps": [[0, 1, "DNS answer: 40 ms"], [0, 2, "TCP setup: 40 ms"], [0, 2, "TLS setup: 40 ms"], [0, 2, "HTTP exchange: 40 ms"]]}, "160 ms with the stated assumptions"); }
export function sd_api_contracts() { return systemFigure("sd_api_contracts", "RESOURCE VERSUS REMOTE METHOD", "split", [["REST-style resource", "GET /matches/m7\nrepresentation of a match"], ["gRPC method", "ScoreService.GetMatch\ntyped request and result"]], "the contract comes before the encoding"); }
export function sd_live_protocols() { return systemFigure("sd_live_protocols", "WHO NEEDS TO SEND MESSAGES?", "split", [["SSE", "server -> viewer\nHTTP event stream"], ["WebSocket", "viewer <-> server\nmessage channel"]], "replay is an application responsibility"); }
export function sd_proxy_layers() { return systemFigure("sd_proxy_layers", "THE INFORMATION AVAILABLE TO ROUTING", "rows", [["L4", "address", "port"], ["L7", "HTTP path", "header"], ["route", "/scores", "score service"]], "seeing HTTP requires a plaintext boundary"); }
export function sd_connection_pool() { return systemFigure("sd_connection_pool", "BOUND REUSABLE DATABASE CONNECTIONS", "fan", {"source": "callers\nbounded wait", "targets": ["connection available", "connection in use", "pool full: wait or reject"]}, "more callers do not create more capacity"); }
export function sd_deadline_budget() { return systemFigure("sd_deadline_budget", "ILLUSTRATIVE 500 MS REQUEST BUDGET", "bars", [["network", 40, "ms"], ["response reserve", 60, "ms"], ["application", 400, "ms"]], "downstream calls inherit the remaining time"); }
export function sd_retry_amplification() { return systemFigure("sd_retry_amplification", "RETRY COUNTS MULTIPLY ACROSS LAYERS", "flow", ["1 original", "3 gateway", "9 service", "27 database"], "one owner for retries"); }
export function sd_idempotency_trace() { return systemFigure("sd_idempotency_trace", "COMMITTED DOES NOT MEAN THE REPLY ARRIVED", "sequence", {"actors": ["scorer", "service", "database"], "steps": [[0, 1, "command key K"], [1, 2, "commit score + key"], [1, 0, "reply lost"], [0, 1, "retry key K"], [1, 0, "return stored result"]]}, "the retry needs the same identity"); }
export function sd_idempotency_state() { return systemFigure("sd_idempotency_state", "DEDUPLICATION SHARES THE COMMIT BOUNDARY", "flow", ["key + hash", "unique check", "score + result", "one commit"], "separate commits leave a crash gap"); }
export function sd_poll_cost() { return systemFigure("sd_poll_cost", "ILLUSTRATIVE EMPTY CHECKING COST", "bars", [["API peak", 1000, "req/s"], ["5 s polling", 10000, "req/s"]], "50,000 viewers divided by 5 seconds"); }
export function sd_network_end_to_end() { return systemFigure("sd_network_end_to_end", "ONE SCORE READ", "flow", ["viewer", "TLS proxy", "application", "database"], "label the waits as well as the arrows"); }
export function sd_network_budget() { return systemFigure("sd_network_budget", "ILLUSTRATIVE API PAYLOAD BANDWIDTH", "rows", [["response", "2,000 B", "per response"], ["rate", "1,000/s", "at peak"], ["product", "2,000,000 B/s", "payload"]], "units must reconcile before sizing a link"); }

export function sd_networking_url_decisions() {
  return systemFigure('sd_networking_url_decisions','A URL CONTAINS DIFFERENT DECISIONS','rows',[
    ['scheme','https','protected HTTP'],['host','scores.heron.test','resolve name'],['path','/matches/m7','lookup resource']
  ],'an address is not the score');
}
export function sd_networking_dns_sequence() {
  return systemFigure('sd_networking_dns_sequence','ILLUSTRATIVE FRESH LOOKUP: FOUR LOGICAL EXCHANGES','sequence',{
    actors:['stub','recursive','authorities'],steps:[[0,1,'ask for address'],[1,2,'root: referral'],[1,2,'top-level domain: referral'],[1,2,'zone: address answer'],[1,0,'return cached answer']]
  },'referrals direct the resolver toward the answer');
}
export function sd_networking_dns_expiry() {
  return systemFigure('sd_networking_dns_expiry','ILLUSTRATIVE DNS CACHE LIFETIME IN SECONDS','timeline',{
    end:70,events:[[0,'cache old address'],[20,'authority changes'],[30,'old cache valid'],[61,'refresh needed']]
  },'the authority change does not erase cached answers');
}
export function sd_networking_lookup_budget() {
  return systemFigure('sd_networking_lookup_budget','ILLUSTRATIVE SERIAL LOOKUP CALCULATION','rows',[
    ['assumption','4 exchanges','10 ms each'],['sum','4 x 10 ms','40 ms']
  ],'each dependency adds its own wait');
}
export function sd_networking_datagram_effect() {
  return systemFigure('sd_networking_datagram_effect','THE PAYLOAD CONTRACT DECIDES WHETHER A GAP MATTERS','split',[
    ['snapshot','A: state, B: state, C: state\nC can replace an older state'],['delta','A: add, B: add, C: add\nmissing B changes the total']
  ],'a newer message cannot always replace a missing one');
}
export function sd_networking_http_message() { return systemFigure('sd_networking_http_message','THE REQUEST ASKS FOR A RESOURCE REPRESENTATION','rows',[
  ['request','GET','/matches/m7'],['response','status + fields','score JSON'],['contract','permission','freshness rule']
],'protocol meaning and application policy meet here'); }
export function sd_networking_http1_wait() { return systemFigure('sd_networking_http1_wait','ILLUSTRATIVE PIPELINED RESPONSE ORDER','rows',[
  ['request order','score A','thumbnail B'],['ready','A still waiting','B finished'],['wire order','A first','B must wait']
],'readiness does not change response order'); }
export function sd_networking_http2_frames() { return systemFigure('sd_networking_http2_frames','ILLUSTRATIVE FRAME INTERLEAVING','rows',[
  ['score pieces','A1','A2','A3','A4'],['wire','A1','B1','A2','B2'],['identity','stream A','stream B','stream A','stream B']
],'frames carry an exchange identity'); }
export function sd_networking_quic_gap() { return systemFigure('sd_networking_quic_gap','ILLUSTRATIVE LOSS BELONGS TO ONE STREAM','rows',[
  ['stream A','A1','missing A2','A3 waits'],['stream B','B1','B2 arrives','B2 delivered'],['shared limits','congestion','connection','server work']
],'independent delivery is not independent capacity'); }
export function sd_networking_tls_checks() { return systemFigure('sd_networking_tls_checks','TRUST CHECKS PRECEDE PROTECTED APPLICATION USE','flow',[
  'certificate chain','requested name','key proof','protected records'
],'an encrypted connection still needs permission checks'); }
export function sd_networking_rest_boundary() { return systemFigure('sd_networking_rest_boundary','THE RESOURCE CONTRACT OUTLIVES THE INTERNAL QUERY','flow',[
  '/matches/m7','resource contract','internal lookup','representation'
],'stateless requests can still read persistent state'); }
export function sd_networking_grpc_modes() { return systemFigure('sd_networking_grpc_modes','REMOTE METHODS HAVE DIFFERENT MESSAGE DIRECTIONS','rows',[
  ['unary','one request','one response'],['server stream','one request','many responses'],['client stream','many requests','one response'],['bidirectional','many requests','many responses']
],'types describe messages, not effect recovery'); }
export function sd_networking_websocket_lifecycle() { return systemFigure('sd_networking_websocket_lifecycle','A SOCKET OWNER HOLDS A LIVE CONVERSATION','flow',[
  'handshake','authenticate','subscribe + send','disconnect + recover'
],'the event history must survive this owner'); }
export function sd_networking_sse_replay() { return systemFigure('sd_networking_sse_replay','ILLUSTRATIVE LAST-EVENT-ID RECOVERY','sequence',{
  actors:['viewer','gateway','history'],steps:[[1,0,'deliver event 7'],[0,1,'disconnect before 8'],[0,1,'reconnect: last ID 7'],[1,2,'find events after 7'],[1,0,'replay 8 and 9']]
},'a remembered identifier needs retained data'); }
export function sd_networking_proxy_connections() { return systemFigure('sd_networking_proxy_connections','THE PROXY IS A SERVER AND A CLIENT','rows',[
  ['viewer hop','viewer client','proxy server'],['backend hop','proxy client','application server'],['separate policy','TLS + timeout','TLS + timeout']
],'a timeout on one hop cannot undo another hop'); }
export function sd_networking_connection_lifetimes() { return systemFigure('sd_networking_connection_lifetimes','SIMILAR NAMES, DIFFERENT CONNECTION QUESTIONS','rows',[
  ['reuse','keep-alive','save setup'],['idle probe','TCP keepalive','is the peer reachable?'],['conversation','heartbeat','is the protocol progressing?'],['rotation','max lifetime','refresh endpoint ownership']
],'configure the timer for the question it answers'); }
export function sd_networking_pool_trace() { return systemFigure('sd_networking_pool_trace','ILLUSTRATIVE TWO-SLOT LOAN HISTORY','matrix',{
  rows:['arrival','A finishes','C runs'],cols:['slot X','slot Y','waiter'],values:[['A','B','C'],['free','B','C'],['C','B','none']]
},'release returns a resource to the next borrower'); }
export function sd_networking_timeout_scopes() { return systemFigure('sd_networking_timeout_scopes','ONE OPERATION CONTAINS SEVERAL WAIT SCOPES','rows',[
  ['connect','establish path','connect timeout'],['pool','acquire a loan','acquisition timeout'],['read','receive bytes','read timeout'],['total','complete operation','deadline']
],'individual waits need a shared outer bound'); }
export function sd_networking_deadline_trace() { return systemFigure('sd_networking_deadline_trace','ILLUSTRATIVE REMAINING USEFUL BUDGET','rows',[
  ['start','500 ms','overall'],['reserves','40 + 60 ms','400 ms useful'],['spent','120 ms','280 ms remaining']
],'a downstream call does not restart the clock'); }
export function sd_networking_retry_classes() { return systemFigure('sd_networking_retry_classes','FAILURE CLASSIFICATION CHOOSES THE NEXT ACTION','rows',[
  ['invalid input','permanent','correct request'],['unavailable peer','possibly transient','bounded retry'],['reply lost','outcome uncertain','recover same key']
],'retrying a new command cannot resolve the old one'); }
export function sd_networking_backoff_steps() { return systemFigure('sd_networking_backoff_steps','ILLUSTRATIVE CAPPED FULL-JITTER CEILINGS','rows',[
  ['attempt index','0','1','2','3'],['ceiling ms','100','200','400','800'],['mean ms','50','100','200','400']
],'a cap limits one delay, not the whole operation'); }
export function sd_networking_set_add() { return systemFigure('sd_networking_set_add','ILLUSTRATIVE REPEATED ARITHMETIC EFFECTS','rows',[
  ['initial','0','0'],['operation','set to 10','add 10'],['first result','10','10'],['repeat result','10','20']
],'one operation key can distinguish retry from a new addition'); }
export function sd_networking_commit_gap() { return systemFigure('sd_networking_commit_gap','SEPARATE COMMITS LEAVE OPPOSITE FAILURE GAPS','split',[
  ['effect first','commit effect, crash\nno key: duplicate risk'],['key first','record success, crash\nno effect: false success']
],'put the key and effect in one commit'); }
export function sd_networking_key_retention() { return systemFigure('sd_networking_key_retention','ILLUSTRATIVE SUPPORTED RETRY AND EVIDENCE WINDOWS','rows',[
  ['retry contract','24 hours','client support'],['evidence','48 hours','identity retained'],['attempt at 12 h','within window','recover result'],['attempt at 36 h','outside support','evidence may remain']
],'retention is part of the guarantee'); }
export function sd_networking_delivery_resources() { return systemFigure('sd_networking_delivery_resources','ILLUSTRATIVE DELIVERY RESOURCE COUNTS','rows',[
  ['poll every 5 s','50,000 viewers','10,000 requests/s'],['long poll','one per viewer','50,000 held waits'],['push','50,000 viewers','persistent subscriptions']
],'compare the actual resource, not incompatible units'); }
export function sd_networking_read_time() { return systemFigure('sd_networking_read_time','ILLUSTRATIVE SERIAL READ: 200 MS TOTAL','rows',[
  ['network + proxy','40 + 20 ms','60 ms'],['identity + pool','30 + 10 ms','100 ms cumulative'],['query + return','60 + 40 ms','200 ms cumulative']
],'sum the critical path, not unrelated parallel spans'); }
export function sd_networking_live_counts() { return systemFigure('sd_networking_live_counts','ILLUSTRATIVE PRODUCER VERSUS VIEWER PAYLOAD','rows',[
  ['producer','20 x 200 B','4,000 B/s'],['recipients','20 x 50,000','1,000,000 deliveries/s'],['viewer payload','1,000,000 x 200 B','200,000,000 B/s']
],'the same event is copied to many recipients'); }
export function sd_networking_component_jobs() { return systemFigure('sd_networking_component_jobs','ONE JOB PER BOUNDARY','rows',[
  ['naming','find endpoint','refresh stale answer'],['transport + TLS','ordered protected path','reconnect safely'],['application','permission + contract','recover command key'],['state','read or commit','suitable durable history']
],'recover the same operation after an uncertain reply'); }
