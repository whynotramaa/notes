"""Reproduce every illustrative quantity in the Fundamentals guides."""
import json
import math
import sqlite3
from itertools import combinations
from ipaddress import IPv4Network
from pathlib import Path


def closure(seed, dependencies):
    result = set(seed)
    while True:
        before = result.copy()
        for left, right in dependencies:
            if set(left) <= result:
                result.update(right)
        if result == before:
            return ''.join(sorted(result))


def replacement(refs, capacity, policy):
    frames, faults, trace = [], 0, []
    for i, page in enumerate(refs):
        miss = page not in frames
        if miss:
            faults += 1
            if len(frames) == capacity:
                if policy == 'fifo':
                    frames.pop(0)
                elif policy == 'lru':
                    frames.remove(min(frames, key=lambda p: max(j for j in range(i) if refs[j] == p)))
                else:
                    future = refs[i + 1:]
                    frames.remove(max(frames, key=lambda p: future.index(p) if p in future else math.inf))
            frames.append(page)
        trace.append({'page': page, 'frames': frames.copy(), 'miss': miss})
    return {'faults': faults, 'trace': trace}


def schedule(jobs, policy, quantum=2):
    remaining = {j[0]: j[2] for j in jobs}
    arrival = {j[0]: j[1] for j in jobs}
    burst = remaining.copy()
    time, first, done, timeline = 0, {}, {}, []
    queue, admitted = [], set()
    while remaining:
        ready = [j[0] for j in jobs if j[0] in remaining and j[1] <= time]
        if not ready:
            time += 1
            continue
        if policy == 'rr':
            for j in jobs:
                if j[0] in remaining and j[1] <= time and j[0] not in admitted:
                    queue.append(j[0]); admitted.add(j[0])
            name = queue.pop(0)
            length = min(quantum, remaining[name])
        else:
            name = min(ready, key=lambda n: arrival[n] if policy == 'fcfs' else remaining[n])
            length = 1 if policy == 'srtf' else remaining[name]
        first.setdefault(name, time)
        timeline.append([name, time, time + length])
        time += length
        remaining[name] -= length
        if not remaining[name]:
            done[name] = time
            del remaining[name]
        if policy == 'rr':
            for j in jobs:
                if j[0] in remaining and j[1] <= time and j[0] not in admitted:
                    queue.append(j[0]); admitted.add(j[0])
            if name in remaining:
                queue.append(name)
    rows = [{'name': n, 'arrival': a, 'burst': b, 'completion': done[n], 'turnaround': done[n]-a,
             'waiting': done[n]-a-b, 'response': first[n]-a} for n, a, b in jobs]
    return {'timeline': timeline, 'rows': rows, 'mean_waiting': sum(r['waiting'] for r in rows) / len(rows)}


def crc(bits, divisor):
    work = list(map(int, bits + '0' * (len(divisor)-1)))
    polynomial = list(map(int, divisor))
    for i in range(len(bits)):
        if work[i]:
            for j, bit in enumerate(polynomial):
                work[i+j] ^= bit
    return ''.join(map(str, work[-(len(divisor)-1):]))


def subsets(attributes):
    return [''.join(c) for n in range(len(attributes)+1) for c in combinations(attributes,n)]


def candidate_keys(attributes, rules):
    keys = []
    for seed in subsets(attributes):
        if closure(seed,rules) == ''.join(sorted(attributes)) and not any(set(k) <= set(seed) for k in keys):
            keys.append(seed)
    return keys


original_cover = [('A','BC'),('B','C'),('AB','D')]
minimal_cover = [('A','B'),('B','C'),('A','D')]
cover_checks = {seed: closure(seed,original_cover) for seed in subsets('ABCD')}
assert all(result == closure(seed,minimal_cover) for seed,result in cover_checks.items())
instructor_rules = [('SC','I'),('I','C')]
instructor_closures = {seed:closure(seed,instructor_rules) for seed in subsets('CIS')}
assert candidate_keys('CIS',instructor_rules) == ['CS','IS']

sql = sqlite3.connect(':memory:')
sql.executescript("""
CREATE TABLE users(id text PRIMARY KEY, name text, email text UNIQUE NOT NULL);
CREATE TABLE bookings(id text PRIMARY KEY, user_id text REFERENCES users(id), price integer, status text);
INSERT INTO users VALUES ('ada','Ada','ada@example.test'),('bo','Bo','bo@example.test'),('cy','Cy','cy@example.test');
INSERT INTO bookings VALUES ('b_a','ada',120,'paid'),('b_b','ada',120,'paid'),('b_c','bo',80,'paid');
CREATE TABLE employees(department text, employee text, salary integer);
INSERT INTO employees VALUES ('backend','Ada',90),('backend','Bo',90),('backend','Cy',70),('backend','Di',50);
""")
query = lambda statement: [list(row) for row in sql.execute(statement)]
left_output = query('SELECT u.name,b.id,b.price FROM users u LEFT JOIN bookings b ON b.user_id=u.id ORDER BY u.id,b.id')
assert left_output == [['Ada','b_a',120],['Ada','b_b',120],['Bo','b_c',80],['Cy',None,None]]
rank_rows = query('SELECT salary,ROW_NUMBER() OVER(ORDER BY salary DESC,employee),RANK() OVER(ORDER BY salary DESC),DENSE_RANK() OVER(ORDER BY salary DESC) FROM employees ORDER BY salary DESC,employee')
window_rows = query('SELECT price,SUM(price) OVER(ORDER BY price DESC,id ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW),SUM(price) OVER(ORDER BY price DESC RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) FROM bookings ORDER BY price DESC,id')
assert window_rows == [[120,120,240],[120,240,240],[80,320,320]]
assert query('SELECT u.name FROM users u WHERE NOT EXISTS(SELECT 1 FROM bookings b WHERE b.user_id=u.id)') == [['Cy']]
assert query('SELECT 3 NOT IN (1,NULL),NULL=NULL,NULL IS NULL') == [[None,None,1]]

left = [('a','b_a'),('b','b_b')]
right = [('a','r_a'),('c','r_c')]
inner = [[l[0],l[1],r[1]] for l in left for r in right if l[0]==r[0]]
left_join = [[l[0],l[1],r[1] if r else None] for l in left for r in ([r for r in right if r[0]==l[0]] or [None])]
right_join = [[r[0],l[1] if l else None,r[1]] for r in right for l in ([l for l in left if l[0]==r[0]] or [None])]
full_join = left_join + [row for row in right_join if row[1] is None]
original_lossy = [('a','b_1','c_1'),('a','b_2','c_2')]
lossy_ab = sorted({r[:2] for r in original_lossy})
lossy_ac = sorted({(r[0],r[2]) for r in original_lossy})
lossy_join = [(a,b,c) for a,b in lossy_ab for other_a,c in lossy_ac if a==other_a]
assert len(lossy_join)==4 and len(original_lossy)==2

page, header, slot, row = 4096, 64, 4, 124
capacity = (page-header)//(slot+row)
users, shows, seats = 100, 8, 100
bookings = 160
salary = [90, 90, 70, 50]
subnets = {str(p): {'addresses': 2**(32-p), 'ordinary_hosts': max(0, 2**(32-p)-2)} for p in [8,16,24,25,26,27,28,30,31,32]}
net = IPv4Network('192.168.10.64/26')
refs = [1,2,3,4,1,2,5,1,2,3,4,5]
jobs = [('A',0,5),('B',1,3),('C',2,1)]
values = {
 'dbms': {'users':users,'shows':shows,'seats_per_show':seats,'show_seats':shows*seats,'bookings':bookings,
  'total_core_rows':users+shows+shows*seats+bookings,'page_bytes':page,'header_bytes':header,'slot_bytes':slot,
  'row_bytes':row,'rows_per_page':capacity,'unused_bytes':page-header-capacity*(row+slot),
  'heap_pages':math.ceil(shows*seats/capacity),'heap_bytes':math.ceil(shows*seats/capacity)*page,
  'index_entries':(page-header)//16,'leaf_pages':math.ceil(shows*seats/((page-header)//16)),
  'index_pages':1+math.ceil(shows*seats/((page-header)//16)), 'index_bytes':(1+math.ceil(shows*seats/((page-header)//16)))*page, 'heap_last_rows':800%31, 'leaf_last_entries':800%252, 'inventory_with_index_bytes':(math.ceil(800/31)+1+math.ceil(800/252))*page, 'binary_height':math.ceil(math.log2(801)), 'point_read_pages':1+1+1, 'split_before':[10,20,30,40], 'split_after':[10,20,25,30,40],
  'join_comparisons':users*bookings,'hash_visits':users+bookings,'estimated_rows':shows*seats*0.02, 'actual_rows':80, 'estimate_error':80/(shows*seats*0.02), 'record_slot_bytes':row+slot, 'full_page_payload_bytes':capacity*(row+slot), 'full_heap_rows':25*31,
  'balances':[100,100+20,100-50,100+20-50], 'bloom_false_positive':(1-math.exp(-3*100/1024))**3,
  'cache_hit_ratio':90/100,'wa':(4096+8192+16384)/4096,'closure_A':closure('A',[('A','B'),('B','C'),('AC','D')]),
  'ranks':{'row_number':[r[1] for r in rank_rows],'rank':[r[2] for r in rank_rows],'dense_rank':[r[3] for r in rank_rows]},'salary':salary,
  'old_version':7, 'new_version':7+1, 'replicas':3,'R':2,'W':2,'quorum_overlap':2+2-3,'prices':[120,120,80], 'ada_total':120+120, 'bo_total':80, 'norm_cross_product':2*2, 'relation_degree':len(['seat_id','show_id','state']), 'relation_cardinality':len(['A7','A8','A9']),'revenue':sum([120,120,80]),
  'partition_counts':[sum(i%4==s for i in range(800)) for s in range(4)],
  'sql_left_join':left_output,'sql_rank_rows':rank_rows,'sql_window_rows':window_rows,
  'sql_aggregates':query('SELECT SUM(price),COUNT(price),AVG(price) FROM bookings')[0],
  'cover_checks':cover_checks,'instructor_closures':instructor_closures,'instructor_keys':candidate_keys('CIS',instructor_rules),
  'join_outputs':{'inner':inner,'left':left_join,'right':right_join,'full':full_join,'cross':[[l[1],r[1]] for l in left for r in right],'semi':[l[1] for l in left if any(l[0]==r[0] for r in right)],'anti':[l[1] for l in left if not any(l[0]==r[0] for r in right)]},
  'lossy_original':original_lossy,'lossy_ab':lossy_ab,'lossy_ac':lossy_ac,'lossy_join':lossy_join,
  'borrow_before':[[10],[25,30,40]],'borrow_after':[[10,25],[30,40]],'merge_after':[10,30],
  'bloom_bits':[0,1,0,1,1,0,1,0], 'bloom_exact_pair_fp':(4/8)**2, 'bloom_filter_bytes':1024//8, 'recovery_start':[100,100], 'recovery_redo':[100+20,100-50], 'recovery_final':[100+20,100], 'replica_lag_ms':120-100, 'sync_ack_ms':max(5,8,12), 'async_ack_ms':5, 'hot_shard_counts':[650,50,50,50], 'hot_fraction':650/800, 'global_pool_connections':8*20, 'bounded_pool_connections':8*8, 'server_connection_limit':80, 'operational_reserve':16,
  'wa_wal_bytes':4096,'wa_flush_bytes':8192,'wa_compaction_bytes':16384,'wa_total_bytes':4096+8192+16384},
 'cn': {'rate_bps':100_000_000,'packet_bytes':1500,'distance_m':1_000_000,'speed_mps':200_000_000,
  'transmission_ms':1500*8/100_000_000*1000,'propagation_ms':1_000_000/200_000_000*1000,
  'processing_ms':0.05,'queue_ms':0.5,'one_link_delay_ms':0.05+0.5+0.12+5,
  'two_link_no_queue_ms':2*(0.12+5),'rtt_ms':40,'bdp_bytes':100_000_000*0.04/8,
  'stop_wait_mbps':1500*8/(0.04+1500*8/100_000_000)/1e6,'window_bytes':64000,
  'window_mbps':64000*8/0.04/1e6,'tcp_payload_bytes':1460,'udp_payload_bytes':1472,
  'ethernet_frame_bytes':14+1500+4,'tagged_frame_bytes':14+4+1500+4,'mac_bits':6*8,'ipv4_bits':4*8,'ipv6_bits':16*8,
  'subnets':subnets,'network':str(net.network_address),'broadcast':str(net.broadcast_address),
  'first_host':str(net.network_address+1),'last_host':str(net.broadcast_address-1),'hosts':net.num_addresses-2,
  'crc':crc('1101','1011'),'tcp_isn':1000,'syn_next':1001,'after_data':1001+1460,
  'cwnd':[1460*2**i for i in range(4)],'burst':20+10*3,'shannon_bps':1_000_000*math.log2(1+15),
  'nyquist_bps':2*1_000_000*math.log2(4),'cold_handshake_ms':3*40,'token_seconds':20/10,
  'rr_counts':[sum(i%3==s for i in range(9)) for s in range(3)],'dns_ttl_remaining':300-120,
  'client_ip':'192.168.10.70','gateway':'192.168.10.65','server_ip':'203.0.113.20','public_ip':'198.51.100.7'},
 'os': {'cores':2,'page_bytes':4096,'virtual_bits':32,'offset_bits':int(math.log2(4096)),'vpn_bits':32-12,
  'virtual_pages':2**32//4096,'pte_bytes':4,'linear_table_bytes':(2**32//4096)*4,
  'virtual_address':13396,'vpn':13396//4096,'offset':13396%4096,'frame':9,'physical_address':9*4096+13396%4096,
  'tlb_hit_rate':0.9,'memory_ns':100,'tlb_ns':10,'effective_ns':0.9*(10+100)+0.1*(10+2*100),
  'cow_pages':8,'cow_before_bytes':8*4096,'cow_after_bytes':9*4096,'allocation_bytes':10000,
  'allocated_pages':math.ceil(10000/4096),'internal_waste':math.ceil(10000/4096)*4096-10000,
  'jobs':jobs,'schedules':{p:schedule(jobs,p) for p in ['fcfs','sjf','srtf','rr']},
  'refs':refs,'replacement':{f'{p}_{n}':replacement(refs,n,p) for p,n in [('fifo',3),('fifo',4),('lru',3),('opt',3)]},
  'banker':{'available':1,'allocation':[1,1,1],'maximum':[3,2,3],'need':[2,1,2],'safe_sequence':['B','A','C'],'work':[1,2,3,4]},
  'counter_initial':10,'counter_lost':10+1,'counter_correct':10+1+1,'permissions':['7 = 4 + 2 + 1','5 = 4 + 1','5 = 4 + 1'],
  'cache_line_bytes':64,'counter_bytes':8,'counters_per_line':64//8,'connections':1000,'idle':980,'ready':1000-980,
  'fd_limit':1024,'reserved_fd':24,'connection_capacity':1024-24,'quantum_ms':2,'switch_ms':0.1,
  'switch_fraction':0.1/(2+0.1),'quota_ms':50,'period_ms':100,'cpu_fraction':50/100},
}
assert values['dbms']['rows_per_page'] == 31
assert values['cn']['hosts'] == 62
assert values['os']['replacement']['fifo_3']['faults'] == 9
assert values['os']['replacement']['fifo_4']['faults'] == 10
assert values['os']['physical_address'] == 37972
assert values['dbms']['closure_A'] == 'ABCD'
values['dbms']['reservation_after_rows'] = values['dbms']['total_core_rows'] + 1
values['dbms']['replicated_inventory_bytes'] = values['dbms']['inventory_with_index_bytes'] * values['dbms']['replicas']
values['dbms']['sync_penalty_ms'] = values['dbms']['sync_ack_ms'] - values['dbms']['async_ack_ms']
values['dbms']['hot_shard_mean_ratio'] = values['dbms']['hot_shard_counts'][0] / values['dbms']['partition_counts'][0]
values['dbms']['plan_selectivity_actual'] = values['dbms']['actual_rows'] / values['dbms']['show_seats']
values['dbms']['pool_available'] = values['dbms']['server_connection_limit'] - values['dbms']['operational_reserve']
assert values['dbms']['reservation_after_rows'] == 1069
assert values['dbms']['replicated_inventory_bytes'] == 380928
assert values['dbms']['sync_penalty_ms'] == 7
assert values['dbms']['hot_shard_mean_ratio'] == 3.25
assert values['dbms']['plan_selectivity_actual'] == .1
assert values['dbms']['pool_available'] == values['dbms']['bounded_pool_connections'] == 64
d = values['dbms']
d['bookings_after'] = d['bookings'] + 1
d['replicated_inventory_pages'] = (d['heap_pages'] + d['index_pages']) * d['replicas']
d['revenue_average_rounded'] = round(d['revenue'] / 3, 6)
d['exercises'] = {
 'E1': d['users'] + d['shows'] + d['show_seats'] + d['bookings'],
 'E2': [d['ada_total'], d['bo_total'], d['revenue']],
 'E3': [d['ranks']['rank'], d['ranks']['dense_rank']],
 'E4': [d['rows_per_page'], d['unused_bytes']],
 'E5': [d['heap_pages'], d['heap_bytes'], d['full_heap_rows'], d['heap_last_rows']],
 'E6': [d['index_entries'], d['leaf_pages'], d['leaf_last_entries'], d['index_bytes']],
 'E7': [d['join_comparisons'], d['hash_visits']],
 'E8': d['actual_rows'] / d['estimated_rows'],
 'E9': d['wa_total_bytes'] / d['page_bytes'],
 'E10': d['R'] + d['W'] - d['replicas'],
 'E11': [d['replica_lag_ms'], d['async_ack_ms'], d['sync_ack_ms'], d['sync_penalty_ms']],
 'E12': [d['hot_fraction'], d['hot_shard_mean_ratio']],
 'E13': [d['global_pool_connections'], d['pool_available'], d['pool_available'] // 8],
 'E17': [d['recovery_start'], d['recovery_redo'], d['recovery_final']],
 'E18': d['bloom_exact_pair_fp'],
 'E20': [d['old_version'], d['new_version']],
 'E25': [d['heap_bytes'], d['index_bytes'], d['inventory_with_index_bytes'], d['replicated_inventory_bytes'], d['replicated_inventory_pages']],
}
assert d['bookings_after'] == 161 and d['replicated_inventory_pages'] == 93
assert d['revenue_average_rounded'] == 106.666667
assert d['exercises'] == {
 'E1': 1068, 'E2': [240, 80, 320], 'E3': [[1, 1, 3, 4], [1, 1, 2, 3]],
 'E4': [31, 64], 'E5': [26, 106496, 775, 25], 'E6': [252, 4, 44, 20480],
 'E7': [16000, 260], 'E8': 5, 'E9': 7, 'E10': 1,
 'E11': [20, 5, 12, 7], 'E12': [.8125, 3.25], 'E13': [160, 64, 8],
 'E17': [[100, 100], [120, 50], [120, 100]], 'E18': .25,
 'E20': [7, 8], 'E25': [106496, 20480, 126976, 380928, 93],
}
path = Path('src/data/fundamentals/numbers.json')
path.write_text(json.dumps(values,indent=2)+'\n')
print(json.dumps(values,indent=2))
