import { D, C } from '../lib/draw.js';
import { canvas, flow, cards, ledger, lanes, map, cover } from '../lib/fundamentals-figures.js';
import values from '../data/fundamentals/numbers.json' with { type: 'json' };
const N = values.dbms;
const stages = ['Database model','Keys and ER','Algebra and SQL','Dependencies','Storage and indexes','Query execution','Transactions','Concurrency control','Recovery and engines','Distributed databases','Application design','The complete query'];
export function where_fund_dbms(stage=99){ return map('where_fund_dbms',stages,stage); }
export function cover_fund_dbms(){ return cover('cover_fund_dbms',['Inside the','Database'],['Relational theory, SQL and the storage engine.','Follow a booking all the way to durable pages.'],[['Model the facts','tables, keys, dependencies'],['Execute the query','plans, indexes, pages'],['Commit safely','versions, locks, write-ahead log'],['Operate the system','replicas, partitions, recovery']],1); }
export function dbms_file_race(){return ledger('dbms_file_race','ILLUSTRATIVE READ-DECIDE-WRITE RACE AGAINST ONE FILE',['event','Buyer A','Buyer B'],[['read state','free','free'],['decide','claim A7','claim A7'],['write result','success','success'],['shared invariant','one seat','two accepted buyers']],3);}
export function dbms_abstraction(){return cards('dbms_abstraction','ONE FACT, DIFFERENT LEVELS',[['View level','available seats for a customer'],['Logical level','show_seats(show_id, seat_id, state)'],['Physical level','heap pages and index entries'],['Data independence','change storage without changing the query']],1);}
export function dbms_relation(){return ledger('dbms_relation','A RELATION HAS ROWS, COLUMNS AND RULES',['seat_id','show_id','state'],[['A7','evening','free'],['A8','evening','held'],['A9','evening','sold']],0);}
export function dbms_key_lattice(){return cards('dbms_key_lattice','MINIMAL UNIQUENESS IS THE DISTINCTION',[['Super key','{id, email} still identifies a user'],['Candidate keys','{id} and {email} are minimal'],['Primary and alternate','choose id; email remains a candidate'],['Composite candidate key','(show_id, seat_id) names one show seat']],1);}
export function dbms_constraints(){return flow('dbms_constraints','THE DATABASE CHECKS THE WRITE',['new booking item','foreign key check','unique seat claim','commit or reject'],['references a real booking','references a real show seat','no competing active claim','all checks must hold'],2);}
export function dbms_er(){
 const d=canvas('dbms_er','ENTITIES BECOME TABLES; MANY-TO-MANY BECOMES A LINK',330);
 const nodes=[[22,65,'users','id, email'],[232,65,'bookings','id, user_id'],[442,65,'shows','id, venue_id'],[232,210,'booking_items','booking_id, show_id, seat_id'],[442,210,'show_seats','show_id, seat_id']];
 nodes.forEach(([x,y,t,s],i)=>{d.box(x,y,176,60,t,{fill:i===3?C.accSoft:C.card,stroke:i===3?C.acc:C.ink2});d.text(x+88,y+83,s,{cls:'mono',size:9.5});});
 d.arrow(200,95,230,95,{stroke:C.gray});d.text(214,75,'1:N',{cls:'xs'});
 d.arrow(320,128,320,206,{stroke:C.acc});d.text(336,169,'1:N',{cls:'xs',a:'start'});
 d.arrow(530,128,530,206,{stroke:C.gray});d.text(547,169,'1:N',{cls:'xs',a:'start'});
 d.arrow(440,240,410,240,{stroke:C.acc});d.text(426,221,'1:N',{cls:'xs'});
 return d.svg();
}
export function dbms_algebra(){return cards('dbms_algebra','RELATIONAL OPERATORS TRANSFORM SETS',[['Selection σ','keep rows satisfying a predicate'],['Projection π','keep attributes; remove duplicates'],['Join ⋈','combine compatible facts'],['Division ÷','find who matches every required item']],2);}
export function dbms_sql_order(){return flow('dbms_sql_order','LOGICAL QUERY ORDER, NOT A PHYSICAL PLAN',['FROM / JOIN','WHERE','GROUP BY / HAVING','SELECT / DISTINCT','ORDER BY','LIMIT / OFFSET'],['form rows','filter individual rows','form and filter groups','compute output','choose order','choose a slice'],2);}
export function dbms_aggregate(){return ledger('dbms_aggregate','ILLUSTRATIVE FIXTURE: GROUPS CHANGE THE ROW COUNT',['user','prices','SUM / COUNT'],[['Ada','120, 120','240 / 2'],['Bo','80','80 / 1'],['Cy','no booking','not a group']],0);}
export function dbms_join_rows(){return ledger('dbms_join_rows','LEFT JOIN PRESERVES THE LEFT SIDE',['user','matched booking','price'],[['Ada','first','120'],['Ada','second','120'],['Bo','third','80'],['Cy','NULL','NULL']],3);}
export function dbms_null_logic(){return ledger('dbms_null_logic','UNKNOWN IS NOT FALSE, BUT WHERE KEEPS ONLY TRUE',['expression','result'],[['3 = 1','FALSE'],['3 = NULL','UNKNOWN'],['3 NOT IN (1, NULL)','UNKNOWN'],['NOT EXISTS matching row','TRUE']],2);}
export function dbms_recursive(){
 const d=canvas('dbms_recursive','RECURSION EXPANDS A FRONTIER AND RETAINS EARLIER ROWS',340);
 d.box(20,60,170,44,'anchor rows',{fill:C.card});
 d.box(230,60,170,44,'working frontier',{fill:C.card});
 d.box(440,60,170,44,'expand children',{fill:C.accSoft,stroke:C.acc});
 d.arrow(194,82,226,82,{stroke:C.gray}); d.arrow(404,82,436,82,{stroke:C.acc});
 d.text(420,47,'nonempty',{cls:'xs'});
 d.box(440,170,170,44,'new frontier',{fill:C.card});d.arrow(525,108,525,166,{stroke:C.acc});
 d.carrow([[436,192],[362,181],[315,108]],{stroke:C.acc});d.text(348,149,'next round',{cls:'sm'});
 d.box(230,264,170,44,'accumulated rows',{fill:C.card});
 d.arrow(260,108,260,260,{stroke:C.gray});d.text(244,220,'append',{cls:'xs',a:'end'});
 d.box(20,264,170,44,'return result',{fill:C.accFaint,stroke:C.acc});
 d.carrow([[226,93],[130,161],[105,260]],{stroke:C.line});d.text(124,202,'empty',{cls:'sm'});
 return d.svg();
}
export function dbms_window_ranks(){return ledger('dbms_window_ranks','ILLUSTRATIVE SALARIES, ORDERED DESCENDING',['salary','ROW_NUMBER','RANK','DENSE_RANK'],N.salary.map((v,i)=>[v,N.ranks.row_number[i],N.ranks.rank[i],N.ranks.dense_rank[i]]),2);}
export function dbms_fd(){return cards('dbms_fd','DEPENDENCIES ARE RULES OVER EVERY LEGAL INSTANCE',[['A → B','equal A means equal B'],['Trivial','AB → A follows from inclusion'],['Non-trivial','A → B, with B outside A'],['Completely non-trivial','left and right sets are disjoint']],0);}
export function dbms_closure(){return flow('dbms_closure','ILLUSTRATIVE ATTRIBUTE CLOSURE',['start {A}','A → B','B → C','AC → D','finish {A,B,C,D}'],['assume A known','add B','add C','A and C are known','A identifies the full relation'],3);}
export function dbms_cover(){return ledger('dbms_cover','ILLUSTRATIVE CANONICAL-COVER REDUCTION',['step','dependencies'],[['split right sides','A → B; A → C; B → C; AB → D'],['remove extraneous B','A → B; A → C; B → C; A → D'],['remove redundant A → C','A → B; B → C; A → D']],2);}
export function dbms_anomalies(){return cards('dbms_anomalies','ONE REPEATED FACT CREATES SEVERAL FAILURE MODES',[['Update anomaly','change a venue in many booking rows'],['Insertion anomaly','cannot store a venue before a booking'],['Deletion anomaly','last booking removes the venue fact'],['Repair','store the venue independently']],3);}
export function dbms_partial(){return flow('dbms_partial','A PARTIAL DEPENDENCY REPEATS A FACT',['Enrollment(S,C,name)','S → name','Student(S,name)','Enrollment(S,C)'],['key is the pair S,C','only part of the key decides name','one name per student','one row per enrolment'],2);}
export function dbms_bcnf(){return cards('dbms_bcnf','ILLUSTRATIVE RELATION: STUDENT, COURSE, INSTRUCTOR',[['Dependencies','(student,course) → instructor\ninstructor → course'],['Candidate keys','(student,course)\n(student,instructor)'],['3NF holds','course is a prime attribute'],['BCNF fails','instructor is not a super key']],3);}
export function dbms_fourth(){return ledger('dbms_fourth','ILLUSTRATIVE INDEPENDENT MULTIVALUED FACTS',['student','language','hobby'],[['Ada','English','chess'],['Ada','English','cycling'],['Ada','Hindi','chess'],['Ada','Hindi','cycling']],0);}
export function dbms_lossless(){return flow('dbms_lossless','THE SHARED ATTRIBUTES MUST CONTROL A SIDE',['R(A,B,C)','R₁(A,B)','R₂(A,C)','join on A'],['given A → B','A identifies this side','keep the other fact','reconstruct without invented pairs'],1);}
export function dbms_denorm(){return flow('dbms_denorm','DUPLICATION CREATES AN UPDATE OBLIGATION',['booking_items','derived total','bookings.total','repair / reconcile'],['authoritative line prices','sum of item prices','cached duplicate','detect disagreement'],2);}
export function dbms_storage_path(){return flow('dbms_storage_path','SQL FINALLY BECOMES PAGE REQUESTS',['SQL statement','parser / planner','execution operators','storage engine','page in RAM','persistent file'],['logical request','choose an access path','produce tuples','locate records','buffered working copy','durable backing storage'],4);}
export function dbms_slotted_page(){
 const d=canvas('dbms_slotted_page','ILLUSTRATIVE SLOTTED PAGE: 4,096 BYTES',350);
 d.rect(160,48,300,270,{fill:C.paper,stroke:C.ink2});
 const bands=[[48,38,'header: 64 bytes',C.card],[86,52,'31 slots × 4 bytes',C.card],[138,94,'free: 64 bytes',C.accFaint],[232,86,'31 records × 124 bytes',C.card]];
 bands.forEach(([y,h,t,f])=>{d.rect(160,y,300,h,{fill:f,stroke:C.line,r:0});d.text(310,y+h/2,t,{cls:'mono',size:11});});
 d.arrow(100,100,100,150,{stroke:C.gray});d.text(88,122,'slots grow',{cls:'xs',a:'end'});
 d.arrow(520,282,520,224,{stroke:C.gray});d.text(535,258,'records grow',{cls:'xs',a:'start'});
 d.carrow([[450,112],[487,159],[449,270]],{stroke:C.acc,hl:7});
 d.text(310,338,'schematic heights; byte sizes are exact',{cls:'sm'});
 return d.svg();
}
export function dbms_bplus_tree(){
 const d=canvas('dbms_bplus_tree','ILLUSTRATIVE PACKED INDEX: ROOT AND FOUR LEAVES',305);
 d.box(233,50,174,40,'root: separators',{fill:C.card});
 const labels=['252 entries','252 entries','252 entries','44 entries'];
 labels.forEach((s,i)=>{const x=18+i*157;d.arrow(250+i*45,92,x+65,167,{stroke:i===2?C.acc:C.line});d.box(x,170,132,50,s,{fill:i===2?C.accSoft:C.card,stroke:i===2?C.acc:C.ink2});if(i<3)d.arrow(x+135,195,x+153,195,{stroke:C.gray,hl:5});});
 d.arrow(397,222,397,257,{stroke:C.acc});d.box(320,260,154,28,'matching heap page',{fill:C.accFaint,stroke:C.acc,size:11});
 d.text(96,265,'linked leaves\nserve ranges',{cls:'sm',vc:true});
 return d.svg();
}
export function dbms_leaf_split(){
 const d=canvas('dbms_leaf_split','ILLUSTRATIVE LEAF CAPACITY: FOUR KEYS',285);
 d.chips(122,55,['10','20','30','40'],{width:92,h:36});
 d.text(320,115,'insert 25; the leaf overflows',{cls:'ttl'});
 d.arrow(320,130,320,163,{stroke:C.acc});
 d.chips(36,184,['10','20'],{width:80,h:36});d.chips(306,184,['25','30','40'],{width:80,h:36,fill:C.accSoft,stroke:C.acc});
 d.arrow(210,202,302,202,{stroke:C.acc});d.text(250,238,'leaf link',{cls:'xs'});
 d.text(116,251,'left leaf',{cls:'sm'});d.text(434,251,'right leaf; parent gains separator 25',{cls:'sm'});
 return d.svg();
}
export function dbms_index_layout(){return cards('dbms_index_layout','THE ACCESS PATH AND THE TABLE ARE DIFFERENT OBJECTS',[['Hash index','bucket lookup for equality'],['B+ tree','ordered navigation and leaf ranges'],['Clustered organization','leaf order organizes the data rows'],['Secondary index','entry locates a row stored elsewhere']],3);}
export function dbms_composite(){return ledger('dbms_composite','ILLUSTRATIVE LEXICOGRAPHIC ORDER: (a,b,c)',['a','b','c'],[['east','1','A7'],['east','1','A8'],['east','2','A7'],['west','1','A7'],['west','2','A7']],1);}
export function dbms_index_only(){
 const d=canvas('dbms_index_only','COVERAGE SUPPLIES DATA; VISIBILITY CHOOSES THE ROUTE',350);
 d.box(22,62,170,44,'index entry + payload',{fill:C.card});
 d.box(238,62,180,44,'page all-visible?',{fill:C.accSoft,stroke:C.acc});
 d.arrow(196,84,234,84,{stroke:C.gray});
 d.box(454,62,166,44,'return from index',{fill:C.accFaint,stroke:C.acc});d.arrow(422,84,450,84,{stroke:C.acc});d.text(436,48,'yes',{cls:'xs'});
 d.box(238,182,180,44,'fetch heap version',{fill:C.card});d.arrow(328,110,328,178,{stroke:C.gray});d.text(346,145,'no',{cls:'sm',a:'start'});
 d.box(454,182,166,44,'check visibility',{fill:C.card});d.arrow(422,204,450,204,{stroke:C.gray});
 d.box(454,280,166,44,'return or discard',{fill:C.card});d.arrow(537,230,537,276,{stroke:C.gray});
 return d.svg();
}
export function dbms_executor(){return flow('dbms_executor','A QUERY BECOMES AN OPERATOR TREE',['parse','bind names / types','rewrite','choose a plan','run operators','return rows'],['syntax tree','semantic validity','equivalent expressions','estimated costs','scans, joins, sorts','requested projection'],3);}
export function dbms_join_algorithms(){return cards('dbms_join_algorithms','JOIN ALGORITHMS HAVE DIFFERENT WORKING SETS',[['Nested loop','outer row -> inner lookup, repeatedly'],['Hash join','build smaller side -> probe other side'],['Sort-merge join','ordered inputs -> advance matching groups'],['Heron equality fixture','16,000 pair tests vs 260 input visits']],1);}
export function dbms_estimation(){return ledger('dbms_estimation','ILLUSTRATIVE ESTIMATE, NOT AN ACTUAL ENGINE PLAN',['quantity','calculation'],[['input rows','800'],['estimated selectivity','0.02'],['estimated output','800 × 0.02 = 16'],['actual observed output','80'],['error factor','80 / 16 = 5']],4);}
export function dbms_plan_diagnosis(){return flow('dbms_plan_diagnosis','EXPLAIN THE WORK BEFORE CHANGING THE SCHEMA',['reproduce query','inspect plan','compare estimates','inspect waits / I/O','change one cause','measure again'],['same parameters','operators and access paths','actual rows and loops','resource evidence','not a guessed index','same representative workload'],2);}
export function dbms_acid(){return cards('dbms_acid','ONE TRANSFER NEEDS SEVERAL INDEPENDENT GUARANTEES',[['Atomicity','both balance changes, or neither'],['Consistency','application invariants remain true'],['Isolation','concurrent work respects its contract'],['Durability','acknowledged commit survives failures']],0);}
export function dbms_lost_update(){return ledger('dbms_lost_update','ILLUSTRATIVE APPLICATION READ-MODIFY-WRITE',['step','transaction A','transaction B'],[['read','100','100'],['compute','100 + 20 = 120','100 - 50 = 50'],['write','120','50 overwrites 120'],['serial answer','70','the +20 was lost']],2);}
export function dbms_write_skew(){return ledger('dbms_write_skew','ILLUSTRATIVE WRITE SKEW: DISJOINT WRITES, ONE RULE',['event','Doctor A transaction','Doctor B transaction'],[['snapshot read','A=on, B=on','A=on, B=on'],['own write','A=off','B=off'],['commit','succeeds','succeeds'],['final invariant','A=off, B=off','nobody remains']],3);}
export function dbms_isolation(){return cards('dbms_isolation','ISOLATION IS A GUARANTEE, NOT A SPEED RANKING',[['Read Uncommitted','standard permits uncommitted reads'],['Read Committed','each statement reads committed state'],['Repeatable Read','stable row reads; details vary'],['Serializable','equivalent to a serial execution']],3);}
export function dbms_serial_graph(){
 const d=canvas('dbms_serial_graph','PRECEDENCE EDGES COME FROM CONFLICTING OPERATIONS',260);
 d.circle(170,135,85,{fill:C.card});d.text(170,135,'T₁',{cls:'ttl',size:17});
 d.circle(470,135,85,{fill:C.card});d.text(470,135,'T₂',{cls:'ttl',size:17});
 d.carrow([[210,111],[320,69],[430,111]],{stroke:C.acc});d.text(320,54,'W₁(X) before R₂(X)',{cls:'mono',size:11});
 d.carrow([[430,159],[320,201],[210,159]],{stroke:C.acc});d.text(320,222,'W₂(Y) before R₁(Y)',{cls:'mono',size:11});
 d.text(320,137,'cycle: not\nconflict serializable',{cls:'sm',vc:true});
 return d.svg();
}
export function dbms_recovery_order(){return ledger('dbms_recovery_order','READ-FROM AND COMMIT ORDER ARE DIFFERENT RULES',['schedule kind','necessary condition'],[['recoverable','reader commits after source writer'],['cascadeless','read only committed versions'],['strict','do not read or overwrite uncommitted writes']],2);}
export function dbms_lock_compatibility(){return ledger('dbms_lock_compatibility','SIMPLIFIED LOCK MODES ON THE SAME ITEM',['held / requested','S','X'],[['S','compatible','wait'],['X','wait','wait']],1);}
export function dbms_intention(){return flow('dbms_intention','MULTIGRANULARITY LOCKING ANNOUNCES DESCENDANT LOCKS',['table: IX','page: IX','row: X'],['intend to update below','intend to update below','exclusive lock on the item'],2);}
export function dbms_two_phase(){return flow('dbms_two_phase','TWO-PHASE LOCKING IS NOT TWO-PHASE COMMIT',['acquire locks','lock point','release locks','commit / abort'],['growing phase','last lock acquisition','no new locks after release','variant controls release timing'],1);}
export function dbms_deadlock(){
 const d=canvas('dbms_deadlock','WAIT-FOR EDGES POINT AT THE BLOCKING TRANSACTION',280);
 d.box(40,90,185,68,'T₁ holds A\nwants B',{fill:C.card});d.box(415,90,185,68,'T₂ holds B\nwants A',{fill:C.card});
 d.carrow([[227,106],[320,55],[413,106]],{stroke:C.acc});d.text(320,39,'T₁ waits for T₂',{cls:'mono',size:11});
 d.carrow([[413,146],[320,210],[227,146]],{stroke:C.acc});d.text(320,235,'T₂ waits for T₁',{cls:'mono',size:11});
 return d.svg();
}
export function dbms_mvcc(){return ledger('dbms_mvcc','ILLUSTRATIVE VERSION VISIBILITY',['reader','visible version','reason'],[['older snapshot','balance 100','new write is after snapshot'],['newer snapshot','balance 120','update committed before snapshot'],['writer','own new balance','own writes remain visible']],0);}
export function dbms_optimistic(){return flow('dbms_optimistic','ILLUSTRATIVE VERSION-CHECKED UPDATE',['read version 7','compute change','UPDATE if version=7','write version 8','or retry fresh'],['no long-held row lock','application decision','atomic validation','exactly one winner','zero rows means conflict'],2);}
export function dbms_join_comparison(){return ledger('dbms_join_comparison','ILLUSTRATIVE UNMATCHED INPUTS, SEPARATE FROM HERON',['join','output pairs'],[['INNER','(L_a,R_a)'],['LEFT','(L_a,R_a); (L_b,NULL)'],['RIGHT','(L_a,R_a); (NULL,R_c)'],['FULL','(L_a,R_a); (L_b,NULL); (NULL,R_c)'],['CROSS','(L_a,R_a); (L_a,R_c); (L_b,R_a); (L_b,R_c)'],['SEMI','L_a'],['ANTI','L_b']],3);}
export function dbms_lossy_rows(){return ledger('dbms_lossy_rows','ILLUSTRATIVE LOSSY JOIN INVENTS THE CROSSED PAIRS',['A','B','C','origin'],[['a','b_1','c_1','original'],['a','b_1','c_2','invented'],['a','b_2','c_1','invented'],['a','b_2','c_2','original']],1);}
export function dbms_leaf_delete(){return ledger('dbms_leaf_delete','ILLUSTRATIVE MINIMUM TWO, MAXIMUM FOUR KEYS PER LEAF',['step','left leaf','right leaf'],[['underfull','10','25,30,40'],['borrow right minimum','10,25','30,40'],['parent boundary','was 25','now 30'],['later delete 25,40','10','30'],['merge','10,30','remove right child']],4);}
export function dbms_window_frames(){return ledger('dbms_window_frames','ILLUSTRATIVE RUNNING SUM: ROWS VERSUS PRICE PEERS',['price','ROWS prefix','RANGE prefix'],N.sql_window_rows,0);}
export function dbms_wal(){return flow('dbms_wal','THE LOG MUST REACH DURABLE STORAGE BEFORE ITS DATA PAGE',['change in RAM','append log record','persist WAL','persist commit','acknowledge','flush data later'],['dirty buffer page','enough recovery information','before matching page flush','under durable-commit policy','client may rely on commit','not required at each commit'],2);}
export function dbms_crash_cases(){return ledger('dbms_crash_cases','CRASH TIMING CHANGES WHICH EFFECTS ARE ADMITTED',['durable state','recovery obligation'],[['no update log','RAM-only work can vanish'],['update log, no commit','do not expose as committed'],['commit, data page old','reconstruct committed update'],['commit and data page new','avoid double-applying the update']],2);}
export function dbms_aries(){return ledger('dbms_aries','ILLUSTRATIVE ARIES-STYLE REDO THEN UNDO',['stage','X','Y'],[['old durable pages','100','100'],['repeat logged history','120','50'],['undo uncommitted T₂','120','100'],['admitted final state','T₁ committed','T₂ did not commit']],2);}
export function dbms_buffer(){
 const d=canvas('dbms_buffer','CACHE HIT AND MISS HAVE DIFFERENT LOWER-LAYER WORK',310);
 d.box(28,62,160,44,'page request',{fill:C.card});d.box(236,62,168,44,'buffer lookup',{fill:C.accSoft,stroke:C.acc});
 d.arrow(192,84,232,84,{stroke:C.gray});d.box(452,62,160,44,'pin + use page',{fill:C.accFaint,stroke:C.acc});d.arrow(408,84,448,84,{stroke:C.acc});d.text(428,48,'hit',{cls:'xs'});
 d.box(236,184,168,44,'choose free frame',{fill:C.card});d.arrow(320,110,320,180,{stroke:C.gray});d.text(341,148,'miss',{cls:'sm',a:'start'});
 d.box(452,184,160,44,'load page',{fill:C.card});d.arrow(408,206,448,206,{stroke:C.gray});d.arrow(532,180,532,110,{stroke:C.gray});
 d.text(320,277,'dirty victim: WAL rule, flush, then reuse',{cls:'mono',size:11});return d.svg();
}
export function dbms_lsm(){return flow('dbms_lsm','APPEND WRITES, FREEZE A RUN, THEN MERGE SORTED RUNS',['WAL','mutable MemTable','immutable MemTable','SSTable','compaction','new SSTables'],['recovery record','ordered RAM updates','freeze for flushing','immutable sorted file','merge versions and tombstones','retire obsolete input safely'],4);}
export function dbms_amplification(){return ledger('dbms_amplification','ILLUSTRATIVE ACCOUNTED WRITE WORK',['stage','bytes'],[['logical changed data','4,096'],['WAL writes','4,096'],['flush writes','8,192'],['compaction writes','16,384'],['physical total','28,672'],['write amplification','28,672 / 4,096 = 7']],5);}
export function dbms_bloom(){
 const d=canvas('dbms_bloom','ILLUSTRATIVE BLOOM BITS: NEGATIVES ARE DECISIVE',300);
 N.bloom_bits.forEach((v,i)=>{const x=30+i*73;d.box(x,65,64,46,String(v),{fill:v?C.accSoft:C.card,stroke:v?C.acc:C.line,cls:'mono'});d.mono(x+32,130,i,{size:11});});
 d.text(320,178,'query hashes to 1 and 6: both set -> possibly present',{cls:'mono',size:11});
 d.text(320,219,'query hashes to 0 and 6: zero bit -> definitely absent',{cls:'mono',size:11});
 d.hand(320,270,'a set bit remembers collisions too',{size:17});return d.svg();
}
export function dbms_replicas(){
 const d=canvas('dbms_replicas','A PRIMARY ORDERS WRITES; REPLICAS FOLLOW ITS HISTORY',300);
 d.box(42,115,180,56,'primary',{fill:C.accSoft,stroke:C.acc});
 [[420,55,'replica A'],[420,195,'replica B']].forEach(([x,y,s])=>{d.box(x,y,180,56,s,{fill:C.card});d.arrow(228,143,x-4,y+28,{stroke:C.gray});});
 d.text(320,267,'commit acknowledgement depends on the chosen wait policy',{cls:'sm'});return d.svg();
}
export function dbms_shards(){return ledger('dbms_shards','ILLUSTRATIVE FOUR-WAY ROW DISTRIBUTION',['partition','modulo fixture','skewed workload'],N.partition_counts.map((n,i)=>[String(i),n,N.hot_shard_counts[i]]),0);}
export function dbms_two_phase_commit(){
 const d=canvas('dbms_two_phase_commit','TWO-PHASE COMMIT: VOTES THEN ONE DURABLE DECISION',350);
 d.text(92,50,'coordinator',{cls:'ttl'});d.text(350,50,'DB A',{cls:'ttl'});d.text(560,50,'DB B',{cls:'ttl'});
 [92,350,560].forEach(x=>d.line(x,70,x,300,{stroke:C.line,single:true}));
 d.arrow(96,90,346,110,{stroke:C.acc});d.text(221,86,'prepare',{cls:'mono',size:11});
 d.arrow(96,126,556,146,{stroke:C.acc});d.text(390,125,'prepare',{cls:'mono',size:11});
 d.arrow(346,172,96,192,{stroke:C.gray});d.text(220,167,'durable YES',{cls:'mono',size:11});
 d.arrow(556,202,96,222,{stroke:C.gray});d.text(425,197,'durable YES',{cls:'mono',size:11});
 d.box(20,235,144,34,'log COMMIT',{fill:C.accSoft,stroke:C.acc,size:11});
 d.arrow(166,252,346,279,{stroke:C.acc});d.arrow(166,259,556,300,{stroke:C.acc});
 d.text(320,332,'after YES, a participant cannot guess an outcome alone',{cls:'sm'});return d.svg();
}
export function dbms_outbox(){return flow('dbms_outbox','THE EVENT AND BUSINESS CHANGE SHARE ONE LOCAL COMMIT',['reserve seat','insert outbox event','local COMMIT','publisher reads event','publish message','consumer deduplicates'],['business state','same transaction','both durable or neither','may retry after failure','delivery may repeat','event id controls admission'],2);}
export function dbms_quorum(){return ledger('dbms_quorum','ILLUSTRATIVE THREE-REPLICA QUORUM OVERLAP',['operation','replicas','set size'],[['write','A, B','W = 2'],['read','B, C','R = 2'],['intersection','B','R + W - N = 1']],2);}
