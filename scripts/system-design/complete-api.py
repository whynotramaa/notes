"""Serialize explicitly authored additional API diagrams and interview material.
Never rewrites the already expanded chapter parts.
"""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
figs=[
('permissions','CORRECTION PERMISSION IS PER CALLER AND MATCH','matrix',{'rows':['scorer','viewer'],'cols':['m7','m8'],'values':[['yes','no'],['no','no']]},'identity alone does not grant a match'),
('validation_layers','SHAPE AND STATE HAVE DIFFERENT AUTHORITIES','flow',['body bound','types + ranges','resource rule','atomic effect'],'a parse is only the first check'),
('admission','USER POLICY AND CAPACITY BOTH APPLY','split',[['caller quota','account use\nshared counter'],['server capacity','outstanding work\nlocal resource bound']],'one allowed user can still find a full server'),
('gateway_trust','TRUSTED CONTEXT IS NOT RESOURCE PERMISSION','sequence',{'actors':['client','gateway','score service'],'steps':[[0,1,'credential + correction'],[1,2,'verified caller context'],[2,1,'check match permission'],[1,0,'authorized effect result']]},'internal entry paths need their own checks'),
('monolith','MODULE OWNERSHIP WITH ONE DEPLOYMENT','rows',[['score module','match + event','local commit'],['media module','upload + job','own interface'],['deployment','one application','shared process']],'deployment and ownership are different boundaries'),
('boundaries','SPLIT WHERE INVARIANTS CAN RECOVER','split',[['score authority','match state + event intent\none local transaction'],['media authority','clip bytes + job status\nindependent resource load']],'a service per table can split one invariant'),
('sync_budget','ILLUSTRATIVE FOUR CALLS OF 20 MS EACH','bars',[['serial',80,'ms'],['parallel ideal',20,'ms']],'same operations, different critical path'),
('async_boundary','COMMIT AND DERIVED VIEW ADVANCE SEPARATELY','rows',[['authority','revision 8','committed'],['publication','event E','pending'],['media view','revision 7','not yet applied']],'name which observation the reply proves'),
('partial_commit','ILLUSTRATIVE DEBIT WITHOUT JOB COMPLETION','rows',[['before','10,000 cents','no job'],['debit commit','7,500 cents','job uncertain'],['next action','recover job J','do not debit again']],'a caller exception cannot erase remote state'),
('saga_states','ILLUSTRATIVE TEN CREDITS AND A NAMED RESERVATION','rows',[['requested','10 available','workflow W'],['reserved','9 available','reservation R'],['failed job','release R','10 available'],['accepted job','finalize R','complete W']],'unknown job state needs recovery before release'),
('compensation','COMPENSATE THE NAMED EFFECT ONCE','rows',[['first release','R held','R released'],['retry release','R released','same result'],['unrelated work','other purchases','remain intact']],'do not restore an old account snapshot'),
('orchestration','THE COORDINATOR STORES THE NEXT STEP','sequence',{'actors':['coordinator','credit','media'],'steps':[[0,1,'reserve using W + step'],[1,0,'reservation R confirmed'],[0,2,'create job using W + step'],[2,0,'reply lost after job exists'],[0,2,'recover same job command']]},'durable progress and receiver identity cooperate'),
('choreography','FACTS CONNECT LOCAL AUTHORITIES','flow',['CreditReserved','create job J','JobCreated','finalize debit'],'someone still owns stalled workflow recovery'),
('outbox_windows','ONE LOCAL COMMIT, THEN DUPLICATE-CAPABLE SEND','rows',[['transaction','match revision 8','outbox event E'],['publisher','send E','broker accepts'],['crash window','sent mark missing','send E again'],['consumer','record E + effect','duplicate safe']],'atomic intent does not make transport exactly once'),
('full_command','FOUR IDENTITIES HAVE FOUR JOBS','rows',[['caller','scorer','permission'],['resource','match m7','authority'],['command','K','retry identity'],['observation','revision 7','write precondition']],'event E names the committed correction'),
('failure_matrix','RECOVERY ACTION DEPENDS ON THE BOUNDARY','rows',[['bad shape','no effect','correct input'],['conflict','old observation','read + reconcile'],['reply lost','effect possible','recover K'],['view behind','effect committed','observe progress']],'retry is not one universal operation'),
('retained_work','ILLUSTRATIVE FULL-DAY PEAK COMMAND STORAGE','rows',[['command count','1,000 x 86,400','86,400,000'],['payload size','count x 300 B','25,920,000,000 B'],['excluded','indexes + replicas','cleanup overhead']],'retention is part of the recovery promise'),
('contract_card','A REQUEST MUST KEEP ITS MEANING','flow',['intention','authority','atomic effect','recoverable result'],'observation can lag behind committed intention'),
('resource_states','A CLIP IS NOT PLAYABLE MERELY BECAUSE BYTES EXIST','rows',[['upload','bytes present','not published'],['processing','job accepted','variants pending'],['ready','checked variants','playable reference']],'represent lifecycle state explicitly'),
('cursor_predicate','ILLUSTRATIVE DESCENDING TUPLE CONTINUATION','rows',[['last seen','time 100, id 11','cursor boundary'],['include lower','time less than 100','or same, id less'],['next result','99, 10','99, 9']],'the comparison must match the exact sort'),
('deadline','ILLUSTRATIVE WHOLE-REQUEST BUDGET','rows',[['whole','500 ms','parent deadline'],['entry + reply','40 + 60 ms','100 ms'],['dependencies','500 - 100 ms','400 ms']],'two serial stages cannot each spend all 400 ms')]
p=ROOT/'src/figs/p69.js';s=p.read_text()
for id,title,kind,data,note in figs:
    name='sd_api_'+id
    if f'export function {name}(' not in s:s+=f'\nexport function {name}() {{ return systemFigure({json.dumps(name)}, {json.dumps(title)}, {json.dumps(kind)}, {json.dumps(data)}, {json.dumps(note)}); }}\n'
p.write_text(s)
folder=ROOT/'src/content/system-design/apis-and-services'
p=folder/'01-resources-and-actions.md';s=p.read_text().replace("The API exposes state transitions that clients can interpret, not just records that happen to be present.","The API exposes state transitions that clients can interpret, not just records that happen to be present.\n\n@fig sd_api_resource_states | Illustrative clip lifecycle. Uploaded bytes, accepted processing, and a published representation prove different states.");p.write_text(s)
p=folder/'02-pages-and-query-bounds.md';s=p.read_text().replace("The comparison uses the complete ordered tuple.","The comparison uses the complete ordered tuple.\n\n@fig sd_api_cursor_predicate | Illustrative tuple predicate. The equality branch handles tied times without omitting the secondary key.");p.write_text(s)
p=folder/'05-service-boundaries.md';s=p.read_text().replace('Divide or propagate remaining time, cancel abandoned work where supported, and report the stage that exhausted the budget.','Divide or propagate remaining time, cancel abandoned work where supported, and report the stage that exhausted the budget.\n\n@fig sd_api_deadline | Illustrative parent deadline. Entry and response work leave 400 ms for all serial dependencies together.');p.write_text(s)
p=folder/'04-trust-and-admission.md';s=p.read_text().replace('**Request validation** checks','Validation checks');p.write_text(s)
