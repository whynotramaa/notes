import { D, C } from '../lib/draw.js';
import { systemFigure, systemMap, systemCover } from '../lib/system-figures.js';
const stages=['Resources and actions','Pages and query bounds','Versions and retries','Trust and admission','Service boundaries','Distributed workflows','The complete contract'];
export function where_sd_apis_and_services(stage=99) { return systemMap("sd_apis_and_services", ["Resource modeling and HTTP methods", "Pagination, filtering and sorting", "Versioning and idempotency keys", "Auth, validation and API gateway", "Monoliths and microservices", "Sagas and distributed transactions", "Case study: one API end to end"], stage); }
export function cover_sd_apis_and_services() { return systemCover("sd_apis_and_services", 10, ["API design and", "microservices"], "API design and microservices", ["Resource modeling and HTTP methods", "Pagination, filtering and sorting", "Versioning and idempotency keys", "Auth, validation and API gateway", "Monoliths and microservices", "Sagas and distributed transactions", "Case study: one API end to end"]); }
export function sd_api_resource() { return systemFigure('sd_api_resource','ONE RESOURCE, DIFFERENT REPRESENTATIONS','rows',[
  ['resource','match m7','stable identity'],['viewer read','score representation','read permission'],['scorer command','correction intent','write permission']
],'a URI names the concept, not the table'); }
export function sd_api_relations() { return systemFigure('sd_api_relations','RELATIONSHIPS SHOULD HAVE EXPLICIT OWNERS','tree',[
  'match m7','event e9','clip c4','scorer assignment'
],'choose which changes need one invariant'); }
export function sd_api_method_effects() { return systemFigure('sd_api_method_effects','METHOD SEMANTICS GUIDE CLIENT BEHAVIOR','rows',[
  ['GET','read representation','safe intended action'],['PUT','replace named state','idempotent intent'],['POST','submit command','identity needed for retry'],['DELETE','remove named state','repeated absence can differ']
],'idempotent effect does not require identical replies'); }
export function sd_api_validation() { return systemFigure('sd_api_validation','CHECK SHAPE BEFORE SPENDING EXPENSIVE WORK','flow',[
  'bounded parse','field validation','permission + invariant','state change'
],'syntactically valid is not authorized'); }
export function sd_api_page_work() { return systemFigure('sd_api_page_work','ILLUSTRATIVE SMALL RESULT, LARGE CANDIDATE WORK','rows',[
  ['candidate scan','10,000 rows','work inspected'],['returned page','20 rows','response bound'],['ratio','10,000 / 20','500 candidates/result']
],'limit the access path as well as the page'); }
export function sd_api_offset_shift() { return systemFigure('sd_api_offset_shift','ILLUSTRATIVE OFFSET AFTER A NEW INSERT','rows',[
  ['first page','9','8','7'],['new prefix','10','9','8'],['skip three','7','6','5']
],'event 7 repeats because the list shifted'); }
export function sd_api_cursor_next() { return systemFigure('sd_api_cursor_next','ILLUSTRATIVE CONTINUE BELOW THE LAST KEY','rows',[
  ['last seen','sequence 7','boundary'],['new event','sequence 10','above boundary'],['next page','6, 5, 4','below boundary']
],'the query seeks a key rather than recounting positions'); }
export function sd_api_cursor_ties() { return systemFigure('sd_api_cursor_ties','ILLUSTRATIVE COMPLETE TUPLE ORDER','rows',[
  ['first page','100, 12','100, 11'],['cursor','100, 11','last observed tuple'],['next page','99, 10','99, 9']
],'time alone cannot distinguish tied rows'); }
export function sd_api_filter_order() { return systemFigure('sd_api_filter_order','ONE BOUNDED ACCESS PATTERN HAS SEVERAL DECISIONS','flow',[
  'scope by match','supported filter','stable key order','continue + limit'
],'different combinations can require different plans'); }
export function sd_api_snapshot() { return systemFigure('sd_api_snapshot','PAGING NEEDS AN OBSERVATION CONTRACT','split',[
  ['live walk','each page sees change\nkey boundary stays useful'],['snapshot walk','one observation boundary\nversion retention or export']
],'a cursor is not automatically a frozen dataset'); }
export function sd_api_observed_version() { return systemFigure('sd_api_observed_version','ILLUSTRATIVE TWO READERS, ONE STATE CHANGE','rows',[
  ['A observed','version 7','before correction'],['B observed','version 7','still remembered'],['A commits','version 8','current authority']
],'a reader observation does not update itself'); }
export function sd_api_command_identity() { return systemFigure('sd_api_command_identity','THE KEY NAMES THE OPERATION, NOT THE CONNECTION','sequence',{
  actors:['scorer','instance A','instance B'],steps:[[0,1,'command key K'],[1,0,'commit result: reply lost'],[0,2,'retry key K'],[2,0,'recover recorded K result']]
},'different instances share the durable operation record'); }
export function sd_api_conditional_write() { return systemFigure('sd_api_conditional_write','ILLUSTRATIVE COMPARE-AND-UPDATE RESULT','rows',[
  ['condition','expected version 7','same transaction'],['A wins','one row updated','new version 8'],['B later','zero rows updated','report conflict']
],'zero matching rows is a contract decision'); }
export function sd_api_contract_versions() { return systemFigure('sd_api_contract_versions','EVOLUTION CAN CHANGE SHAPE OR MEANING','split',[
  ['compatible when supported','add optional information\nold meaning remains'],['breaking contract','change required type or units\nold interpretation fails']
],'test semantics, not only whether JSON parses'); }

export function sd_api_permissions() { return systemFigure("sd_api_permissions", "CORRECTION PERMISSION IS PER CALLER AND MATCH", "matrix", {"rows": ["scorer", "viewer"], "cols": ["m7", "m8"], "values": [["yes", "no"], ["no", "no"]]}, "identity alone does not grant a match"); }

export function sd_api_validation_layers() { return systemFigure("sd_api_validation_layers", "SHAPE AND STATE HAVE DIFFERENT AUTHORITIES", "flow", ["body bound", "types + ranges", "resource rule", "atomic effect"], "a parse is only the first check"); }

export function sd_api_admission() { return systemFigure("sd_api_admission", "USER POLICY AND CAPACITY BOTH APPLY", "split", [["caller quota", "account use\nshared counter"], ["server capacity", "outstanding work\nlocal resource bound"]], "one allowed user can still find a full server"); }

export function sd_api_gateway_trust() { return systemFigure("sd_api_gateway_trust", "TRUSTED CONTEXT IS NOT RESOURCE PERMISSION", "sequence", {"actors": ["client", "gateway", "score service"], "steps": [[0, 1, "credential + correction"], [1, 2, "verified caller context"], [2, 1, "authorized effect result"], [1, 0, "correction result"]]}, "internal entry paths need their own checks"); }

export function sd_api_monolith() { return systemFigure("sd_api_monolith", "MODULE OWNERSHIP WITH ONE DEPLOYMENT", "rows", [["score module", "match + event", "local commit"], ["media module", "upload + job", "own interface"], ["deployment", "one application", "shared process"]], "deployment and ownership are different boundaries"); }

export function sd_api_boundaries() { return systemFigure("sd_api_boundaries", "SPLIT WHERE INVARIANTS CAN RECOVER", "split", [["score authority", "match state + event intent\none local transaction"], ["media authority", "clip bytes + job status\nindependent resource load"]], "a service per table can split one invariant"); }

export function sd_api_sync_budget() { return systemFigure("sd_api_sync_budget", "ILLUSTRATIVE FOUR CALLS OF 20 MS EACH", "bars", [["serial", 80, "ms"], ["parallel ideal", 20, "ms"]], "same operations, different critical path"); }

export function sd_api_async_boundary() { return systemFigure("sd_api_async_boundary", "COMMIT AND DERIVED VIEW ADVANCE SEPARATELY", "rows", [["authority", "revision 8", "committed"], ["publication", "event E", "pending"], ["media view", "revision 7", "not yet applied"]], "name which observation the reply proves"); }

export function sd_api_partial_commit() { return systemFigure("sd_api_partial_commit", "ILLUSTRATIVE DEBIT WITHOUT JOB COMPLETION", "rows", [["before", "10,000 cents", "no job"], ["debit commit", "7,500 cents", "job uncertain"], ["next action", "recover job J", "do not debit again"]], "a caller exception cannot erase remote state"); }

export function sd_api_saga_states() { return systemFigure("sd_api_saga_states", "ILLUSTRATIVE TEN CREDITS AND A NAMED RESERVATION", "rows", [["requested", "10 available", "workflow W"], ["reserved", "9 available", "reservation R"], ["failed job", "release R", "10 available"], ["accepted job", "finalize R", "complete W"]], "unknown job state needs recovery before release"); }

export function sd_api_compensation() { return systemFigure("sd_api_compensation", "COMPENSATE THE NAMED EFFECT ONCE", "rows", [["first release", "R held", "R released"], ["retry release", "R released", "same result"], ["unrelated work", "other purchases", "remain intact"]], "do not restore an old account snapshot"); }

export function sd_api_orchestration() { return systemFigure("sd_api_orchestration", "THE COORDINATOR STORES THE NEXT STEP", "sequence", {"actors": ["coordinator", "credit", "media"], "steps": [[0, 1, "reserve using W + step"], [1, 0, "reservation R confirmed"], [0, 2, "create job using W + step"], [2, 0, "reply lost after job exists"], [0, 2, "recover same job command"]]}, "durable progress and receiver identity cooperate"); }

export function sd_api_choreography() { return systemFigure("sd_api_choreography", "FACTS CONNECT LOCAL AUTHORITIES", "flow", ["CreditReserved", "create gated J", "JobCreated", "finalize debit"], "confirm entitlement before execution"); }

export function sd_api_entitlement() { return systemFigure("sd_api_entitlement", "JOB CREATION DOES NOT AUTHORIZE EXECUTION", "rows", [["reserve R", "10 becomes 9 free", "R held"], ["create J", "durable pending job", "execution gated"], ["finalize wins", "R finalized for J", "release rejects"], ["release wins", "10 free again", "finalize rejects"], ["confirm", "finalized J recorded", "worker may start"]], "one terminal reservation decision"); }

export function sd_api_outbox_windows() { return systemFigure("sd_api_outbox_windows", "ONE LOCAL COMMIT, THEN DUPLICATE-CAPABLE SEND", "rows", [["transaction", "match revision 8", "outbox event E"], ["publisher", "send E", "broker accepts"], ["crash window", "sent mark missing", "send E again"], ["consumer", "record E + effect", "duplicate safe"]], "atomic intent does not make transport exactly once"); }

export function sd_api_full_command() { return systemFigure("sd_api_full_command", "FOUR IDENTITIES HAVE FOUR JOBS", "rows", [["caller", "scorer", "permission"], ["resource", "match m7", "authority"], ["command", "K", "retry identity"], ["observation", "revision 7", "write precondition"]], "event E names the committed correction"); }

export function sd_api_failure_matrix() { return systemFigure("sd_api_failure_matrix", "RECOVERY ACTION DEPENDS ON THE BOUNDARY", "rows", [["bad shape", "no effect", "correct input"], ["conflict", "old observation", "read + reconcile"], ["reply lost", "effect possible", "recover K"], ["view behind", "effect committed", "observe progress"]], "retry is not one universal operation"); }

export function sd_api_retained_work() { return systemFigure("sd_api_retained_work", "ILLUSTRATIVE FULL-DAY PEAK COMMAND STORAGE", "rows", [["command count", "1,000 x 86,400", "86,400,000"], ["payload size", "count x 300 B", "25,920,000,000 B"], ["excluded", "indexes + replicas", "cleanup overhead"]], "retention is part of the recovery promise"); }

export function sd_api_contract_card() { return systemFigure("sd_api_contract_card", "A REQUEST MUST KEEP ITS MEANING", "flow", ["intention", "authority", "atomic effect", "recoverable result"], "observation can lag behind committed intention"); }

export function sd_api_resource_states() { return systemFigure("sd_api_resource_states", "A CLIP IS NOT PLAYABLE MERELY BECAUSE BYTES EXIST", "rows", [["upload", "bytes present", "not published"], ["processing", "job accepted", "variants pending"], ["ready", "checked variants", "playable reference"]], "represent lifecycle state explicitly"); }

export function sd_api_cursor_predicate() { return systemFigure("sd_api_cursor_predicate", "ILLUSTRATIVE DESCENDING TUPLE CONTINUATION", "rows", [["last seen", "time 100, id 11", "cursor boundary"], ["include lower", "time less than 100", "or same, id less"], ["next result", "99, 10", "99, 9"]], "the comparison must match the exact sort"); }

export function sd_api_deadline() { return systemFigure("sd_api_deadline", "ILLUSTRATIVE WHOLE-REQUEST BUDGET", "rows", [["whole", "500 ms", "parent deadline"], ["entry + reply", "40 + 60 ms", "100 ms"], ["dependencies", "500 - 100 ms", "400 ms"]], "two serial stages cannot each spend all 400 ms"); }
