import json, math, sys
from pathlib import Path
sys.path.remove(str(Path(__file__).resolve().parent))
from fractions import Fraction
weights=[1,2,1]
durations=[10,100,10,10,100,10]
rr=[i%3 for i in range(len(durations))]
work=[sum(t for t,owner in zip(durations,rr) if owner==j) for j in range(3)]
old=[(10,'A'),(30,'B'),(60,'C'),(90,'D')]
new=sorted(old+[(50,'E')])
keys=[5,20,45,70,95]
def owner(key,ring):
 return next((name for pos,name in ring if pos>=key),ring[0][1])
before=[owner(k,old) for k in keys]
after=[owner(k,new) for k in keys]
n={'peak_qps':1000,'apps':5,'app_capacity':300,'normal_capacity':1500,'one_failure_capacity':1200,'one_failure_margin':200,'normal_per_app':1000/5,'surviving_per_app':1000/4,'viewers':50000,'gateway_capacity':10000,'nominal_gateways':math.ceil(50000/10000),'five_one_failure_load':50000/4,'six_one_failure_load':50000/5,'seven_one_failure_load':50000/6,'rr_assignments':['ABC'[i] for i in rr],'rr_cost_ms':work,'weights':weights,'weighted_shares':[v/sum(weights) for v in weights],'weighted_qps':[1000*v/sum(weights) for v in weights],'canary_qps':1000*.05,'remaining_qps':1000*.95,'least_connection_A':100,'least_connection_B':10,'least_outstanding_A':5,'least_outstanding_B':200,'health_interval_s':5,'health_failure_threshold':3,'health_detection_s':5*3,'discovery_lifetime_s':30,'cached_at_s':0,'registry_update_s':10,'cache_remaining_at_update_s':30-10,'refresh_s':31,'ring_keys':keys,'ring_before':before,'ring_after':after,'ring_moved_keys':[k for k,a,b in zip(keys,before,after) if a!=b],'ring_moved_fraction':sum(a!=b for a,b in zip(before,after))/len(keys),'ideal_new_owner_fraction':1/5,'modulo_changed_keys':[i for i in range(12) if i%4!=i%5],'reconnect_connections':10000,'reconnect_window_s':20,'reconnect_per_s':10000/20,'gap_events_per_viewer':20*5,'replay_deliveries':10000*20*5,'replay_bytes':10000*20*5*200,'replay_bytes_s':10000*20*5*200/20,'live_bytes_s':20*50000*200,'api_bytes_s':1000*2000,'origin_cache_qps':1000*.1,'origin_cold_qps':1000,'cold_multiplier':10,'serial_route_ms':[40,20,30,10,60,40],'total_read_ms':sum([40,20,30,10,60,40]),'failover_s':15+10+5,'regional_lag_events':20*2,'inflight_at_peak':1000*.2,'retry_attempts':3**3}
n.update({
 'probe_timeout_s': 1, 'detection_min_s': 11, 'detection_max_s': 16,
 'two_failure_capacity': (n['apps'] - 2) * n['app_capacity'],
 'two_failure_per_app': round(n['peak_qps'] / (n['apps'] - 2), 6),
 'failure_utilization': round(n['peak_qps'] / n['one_failure_capacity'], 6),
 'weights_total': sum(weights), 'http2_connections': [100, 10],
 'http2_active': [5, 200], 'p2_loads': [8, 3, 6, 2, 9], 'p2_pair': [1, 4],
 'p2_selected': 1, 'slowstart_s': 20, 'slowstart_at_s': 5,
 'slowstart_weight': Fraction(5, 20).numerator / Fraction(5, 20).denominator,
 'deadline_ms': 250, 'route_remaining_ms': 250 - sum([40, 20, 30, 10]),
 'backend_budget_ms': 250 - sum([40, 20, 30, 10]) - 40,
 'availability_target': 0.999, 'budget_month_s': 30 * 86400 * (1 - .999),
 'dns_ttl_s': 60, 'dns_refresh_remaining_s': 60 - 10,
 'canary_weight': .05, 'readiness_interval_s': 5, 'failed_probes': 3,
 'hash_modulo_moves': sum(i % 4 != i % 5 for i in range(12)),
 'sticky_shares': [.7, .1, .1, .1], 'sticky_qps': [700, 100, 100, 100],
 'gateway_survivors': 5, 'gateway_margin': 0,
 'pool_sockets': 5 * 20, 'gateway_replay_total_bytes_s': 200000000 + 10000000,
})
n['actual_refresh_lag_s'] = n['refresh_s'] - n['registry_update_s']
n['route_slack_ms'] = n['deadline_ms'] - n['total_read_ms']
n['outage_budget_fraction'] = round(30 / 2592, 6)
n['outage_budget_percent'] = round(30 / 2592 * 100, 6)
assert n['actual_refresh_lag_s'] == 21 and n['route_slack_ms'] == 50
assert n['outage_budget_fraction'] == 0.011574 and n['outage_budget_percent'] == 1.157407
n['budget_month_s'] = round(n['budget_month_s'], 6)
assert n['two_failure_capacity'] == 900 and n['two_failure_per_app'] == 333.333333
assert n['detection_min_s'] == 2 * n['health_interval_s'] + n['probe_timeout_s']
assert n['detection_max_s'] == 3 * n['health_interval_s'] + n['probe_timeout_s']
assert n['budget_month_s'] == 2592 and n['backend_budget_ms'] == 110
assert n['hash_modulo_moves'] == 8 and n['gateway_replay_total_bytes_s'] == 210000000
n['rr_total_ms'] = sum(work)
n['modulo_moved_fraction'] = round(n['hash_modulo_moves'] / 12, 6)
n['modulo_moved_percent'] = round(n['hash_modulo_moves'] / 12 * 100, 6)
n['failure_utilization_percent'] = round(n['peak_qps'] / n['one_failure_capacity'] * 100, 6)
n['two_failure_shortfall'] = n['peak_qps'] - n['two_failure_capacity']
n['gateway_survivor_margin'] = round(n['gateway_capacity'] - n['viewers'] / 6, 6)
n['gateway_fleet_capacities'] = [count * n['gateway_capacity'] for count in [4, 5, 6, 7]]
n['serial_elapsed_ms'] = [sum(n['serial_route_ms'][:i+1]) for i in range(len(n['serial_route_ms']))]
n['serial_remaining_ms'] = [n['deadline_ms'] - elapsed for elapsed in n['serial_elapsed_ms']]
assert n['rr_total_ms'] == 240 and n['modulo_moved_fraction'] == .666667
assert n['modulo_moved_percent'] == 66.666667 and n['failure_utilization_percent'] == 83.333333
assert n['two_failure_shortfall'] == 100 and n['gateway_survivor_margin'] == 1666.666667
assert n['gateway_fleet_capacities'] == [40000, 50000, 60000, 70000]
assert n['serial_elapsed_ms'] == [40, 60, 90, 100, 160, 200]
assert n['serial_remaining_ms'] == [210, 190, 160, 150, 90, 50]
assert work==[20,200,20]
assert n['normal_capacity']-300==n['one_failure_capacity']
assert n['ring_moved_keys']==[45]
assert n['nominal_gateways']==5 and n['five_one_failure_load']>10000
assert n['total_read_ms']==200
assert n['normal_per_app'] == 200 and n['surviving_per_app'] == 250
assert n['weighted_shares'] == [.25, .5, .25] and n['weighted_qps'] == [250, 500, 250]
assert n['canary_qps'] == 50 and n['remaining_qps'] == 950
assert n['five_one_failure_load'] == 12500 and n['six_one_failure_load'] == 10000
assert round(n['seven_one_failure_load'], 6) == 8333.333333
assert n['reconnect_per_s'] == 500 and n['gap_events_per_viewer'] == 100
assert n['replay_deliveries'] == 1000000 and n['replay_bytes'] == 200000000
assert n['replay_bytes_s'] == 10000000 and n['live_bytes_s'] == 200000000
assert n['api_bytes_s'] == 2000000 and n['origin_cache_qps'] == 100
assert n['cache_remaining_at_update_s'] == 20 and n['dns_refresh_remaining_s'] == 50
assert n['regional_lag_events'] == 40 and n['inflight_at_peak'] == 200
assert n['retry_attempts'] == 27 and n['pool_sockets'] == 100
assert n['slowstart_weight'] == .25 and n['ring_moved_fraction'] == .2
Path('src/data/system-design/traffic-routing-numbers.json').write_text(json.dumps(n,indent=2)+'\n')
print(json.dumps(n,indent=2))
