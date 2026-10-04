"""Executable illustrative rate-policy traces, including atomic admission invariants."""
import json, math
from pathlib import Path
limit,window=100,60
rate=limit/window
n={'full_refill_horizon_s':100/rate,'partial_full_wait_s':(100-15)/rate,'limit':limit,'window_s':window,'refill_per_s':rate,'fixed_boundary_admitted':2*limit,'boundary_interval_s':0.2,'boundary_qps':2*limit/0.2,'counter_previous':80,'counter_current':30,'counter_t15':80*(1-15/60)+30,'counter_t30':80*(1-30/60)+30,'counter_error':110-(80*.75+30),'token_start':100,'token_after_burst':100-80,'token_after_6s':min(100,20+6*rate),'token_after_15':min(100,20+6*rate)-15,'token_wait_s':(20-15)/rate,'leaky_rate_per_s':rate,'leaky_drain_s':100/rate,'leaky_queue_delay_s':20/rate,'local_replicas':4,'local_total_limit':4*100,'partitioned_limit':100/4,'counter_memory_bytes':100000*32,'log_events':100000*100,'log_memory_bytes':100000*100*24,'redis_rtt_s':.003,'redis_inflight':1000*.003,'multi_dimension_ops_s':1000*3,'race_result':99+2,'reconnect_calls':50000,'ten_second_admission':rate*10,'burst_bound_60s':100+rate*60,'retry_delay_s':(1-.5)/rate,'debt_seconds':30/rate,'leased_unused':4*20,'small_log_at_60':[10,40,59,60],'rollover_window':math.floor(60/60),'upload_cost':5000000000/100000000,'weighted_admitted_cost':20+30+50,'weighted_reject_total':20+30+50+1}
# A reference token transition. The caller must serialize this function per key.
def admit(tokens,last,now,cost=1,capacity=100,refill=rate):
    elapsed=max(0,now-last)
    available=min(capacity,tokens+elapsed*refill)
    if available<cost: return False,available,max(last,now),(cost-available)/refill
    return True,available-cost,max(last,now),0
ok,t,last,_=admit(100,0,0,80)
assert ok and t==20
ok,t,last,_=admit(t,last,6,15)
assert ok and t==15
ok,t,last,wait=admit(t,last,6,20)
assert not ok and t==15 and wait==3
# Two serialized callers cannot both spend the final token.
ok,t,last,_=admit(1,0,0)
second,_,_,_=admit(t,last,0)
assert ok and not second
# Clock rollback adds no refill and never moves the retained time backwards.
_,rollback,timestamp,_=admit(0,10,9)
assert rollback==0 and timestamp==10
assert len([x for x in [0,10,40,59] if x>60-window]+[60])==4
assert n['counter_t15']==90 and n['counter_t30']==70
Path('src/data/system-design/rate-limiting-numbers.json').write_text(json.dumps(n,indent=2)+'\n')
print(json.dumps(n,indent=2))
