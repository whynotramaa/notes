"""Illustrative traffic-routing assignments, ownership movement, and failure capacity."""
import json, math
from pathlib import Path
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
assert work==[20,200,20]
assert n['normal_capacity']-300==n['one_failure_capacity']
assert n['ring_moved_keys']==[45]
assert n['nominal_gateways']==5 and n['five_one_failure_load']>10000
assert n['total_read_ms']==200
Path('src/data/system-design/routing-review-numbers.json').write_text(json.dumps(n,indent=2)+'\n')
print(json.dumps(n,indent=2))
