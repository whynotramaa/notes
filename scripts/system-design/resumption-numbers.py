"""Computed traces for the resumed API, routing, queue and Kafka chapters.
All inputs are illustrative assumptions, never capacity measurements.
"""
import json, sys
# Avoid the existing authoring numbers.py shadowing the standard library.
sys.path.pop(0)
from fractions import Fraction
from math import ceil
from pathlib import Path
n={}
n['api']={'permissions':[[u,m,u=='scorer' and m=='m7'] for u in ['scorer','viewer'] for m in ['m7','m8']], 'batch_operations':20*5,'deadline_remaining_ms':500-40-60,'budget_dependency_ms':(500-40-60)//2,'services_availability':float(Fraction(999,1000)**5),'serial_ms':4*20,'parallel_ms':max(20,20,20,20),'saga_reserved':10-1,'saga_after_compensation':10-1+1,'ledger_remaining_cents':10000-2500,'commands_per_day':1000*86400,'command_record_bytes_day':1000*86400*300}
reservation_traces=[]
for order in [('finalize','release'),('release','finalize')]:
    state='held';free=10-1;steps=[]
    for action in order:
        accepted=state=='held'
        if accepted:
            state='finalized' if action=='finalize' else 'released'
            free+=int(action=='release')
        steps.append({'action':action,'accepted':accepted,'state':state,'free':free})
    gate=state=='finalized'
    assert sum(step['accepted'] for step in steps)==1
    assert free==(9 if gate else 10)
    reservation_traces.append({'order':order,'steps':steps,'execution_after_durable_confirmation':gate})
n['api']['reservation_traces']=reservation_traces
rr=[['A','B','C'][i%3] for i in range(9)]
weighted=['A','A','B','C']*3
ring_before={k:next((v for p,v in [(25,'A'),(50,'B'),(75,'C'),(100,'D')] if k<=p),'A') for k in [10,30,55,70,90]}
ring_after={k:next((v for p,v in [(25,'A'),(50,'B'),(65,'E'),(75,'C'),(100,'D')] if k<=p),'A') for k in [10,30,55,70,90]}
n['routing']={'round_robin':rr,'weighted':{v:weighted.count(v) for v in set(weighted)},'weighted_cpu_ms':{'A':6*5,'B':3*5,'C':3*100},'before':ring_before,'after':ring_after,'moved_keys':[k for k in ring_before if ring_before[k]!=ring_after[k]],'nominal_capacity':5*300,'surviving_capacity':4*300,'utilization_after_loss':float(Fraction(1000,1200)),'connections_normal':50000//5,'connections_after_loss':50000//4,'reconnect_smooth_per_s':10000//20,'health_failure_times':[0,5,10],'health_detect_range_s':[10,15],'discovery_refresh_until_s':12+30,'read_ms':12+8+4+26,'cache_miss_qps':1000*(1-.9),'cache_cold_qps':1000,'shared_pool_limit_qps':float(100/Fraction(5,100)),'local_pool_limit_qps':float(20/Fraction(5,100))}
n['queue']={'backlog':(1200-1000)*60,'drain_s':(1200-1000)*60/(1000-600),'jobs_bytes':(1200-1000)*60*2000,'prefetch_bytes':10*20*2000,'worker_limit_qps':10/.01,'retry_layers':1000*3**3,'attempt_waits_s':[1,2,4,8],'wait_total_s':sum([1,2,4,8]),'deadline_attempts_ms':3*100+50+100,'partition_work':min(8,12),'hot_partition_util':float(Fraction(800,500)),'dedup_bytes_day':20*86400*100,'lag_s':10000/20,'fanout_messages_s':20*50000,'negative_capacity_backlog':(1000-600)*60,'overload_drop_per_s':1200-1000}
n['kafka']={'daily_bytes':20*200*86400,'seven_days_three_copies':20*200*86400*7*3,'producer_batch_bytes':100*200,'batches_s':1000/100,'batch_wait_s':100/1000,'retention_after_outage_s':7*86400-2*86400,'rebuild_records':20*2*86400,'rebuild_net_qps':2000-20,'rebuild_s':20*2*86400/(2000-20),'group_max_workers':min(8,12),'replication_bytes_s':20*200*(3-1),'external_reader_bytes_s':20*200*3,'lag_records':120-100,'committed_next':7+1,'sizes_segment_count':ceil(345600000/100000000),'compression_assumed_bytes':100*200/4,'retained_offsets':[i for i in range(10) if i>=4]}
assert n['queue']['backlog']==12000 and n['queue']['drain_s']==30
assert n['routing']['moved_keys']==[55]
assert n['kafka']['seven_days_three_copies']==7257600000
path=Path(__file__).resolve().parents[2]/'src/data/system-design/resumption-numbers.json'
path.write_text(json.dumps(n,indent=2)+'\n')
print(json.dumps(n,indent=2))
