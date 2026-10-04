"""Reproduce the expanded caching and distributed-systems chapter traces.
Inputs are illustrative. The small state machines show the stated local rules,
not implementations of a distributed protocol or a production cache.
"""
import json
from collections import OrderedDict
from pathlib import Path
n={
 'quorum_three_overlap':2+2-3,'quorum_five_overlap':3+3-5,
 'three_copy_write_tolerance':3-2,'five_copy_write_tolerance':5-3,
 'exposed_events':20*5,'exposed_bytes':20*5*200,
 'one_event_replicated':3*200,'logical_bytes_s':20*200,
 'stored_bytes_s':20*200*3,'fanout_deliveries_s':20*50000,
 'fanout_bytes_s':20*50000*200,'day_s':24*60*60,
 'day_bytes':20*200*86400,'three_copy_day_bytes':20*200*86400*3,
 'resume_after_expiry_s':4-3,'reachable_partition_sides':[1,3-1],
 'election_majority':3//2+1,'freshness_pairs':[[4,8],[3,9],[4,7]],
 'cache_misses_s':{str(h):1000*(1-h) for h in [.9,.5,.99]},
 'fallback_multipliers':{str(h):1/(1-h) for h in [.9,.99]},
 'cache_payload':100000*2000,'cache_entry_bytes':2000+100,
 'cache_accounted':100000*(2000+100),
 'cache_occupancy_percent':100000*(2000+100)/256000000*100,
 'cache_accounted_free':256000000-100000*(2000+100),
 'cache_large_entry':20000+100,'cache_large_ratio':(20000+100)/(2000+100),
 'ten_local_entries':10*(2000+100),'two_service_copies':2*100000*2100,
 'ten_full_local_copies':10*100000*2100,'all_copies':(2+10)*100000*2100,
 'hit_ms':2,'miss_ms':2+20,'weighted_mean_ms':.9*2+.1*(2+20),
 'stale_after_write_s':30-1,'delayed_old_expiry_s':20+30,
 'coalesced_load_savings':100-1,'ten_local_coalesced_loads':10*1,
 'hot_reads_s':.8*1000,'hot_payload_bytes_s':.8*1000*2000,
 'ten_local_hot_reads_s':.8*1000/10,
 'simultaneous_expiries':1000,'even_expiries_s':1000/10,
 'fallback_limit_qps':4/.02,'slow_fallback_limit_qps':4/.1,
 'fallback_rejected_qps':1000-4/.02,
 'deadline_after_cache_source_ms':50-5-20,
 'deadline_after_three_cache_attempts_ms':50-3*5-20,
}
def lru(refs,capacity):
 cache=OrderedDict();hits=0;trace=[]
 for key in refs:
  hit=key in cache;hits+=hit
  if hit:cache.move_to_end(key)
  else:
   if len(cache)==capacity:cache.popitem(last=False)
   cache[key]=True
  trace.append({'key':key,'hit':hit,'residents':list(cache)})
 return hits,trace

def lfu(refs,capacity):
 # Exact resident-only counting, ties by oldest most recent access.
 cache={};hits=0;trace=[]
 for t,key in enumerate(refs):
  hit=key in cache;hits+=hit
  if not hit:
   if len(cache)==capacity:
    victim=min(cache,key=lambda k:(cache[k]['count'],cache[k]['last']))
    del cache[victim]
   cache[key]={'count':0,'last':t}
  cache[key]['count']+=1;cache[key]['last']=t
  trace.append({'key':key,'hit':hit,'counts':{k:v['count'] for k,v in cache.items()}})
 return hits,trace
refs=['A','B','A','C','A','D','B']
n['lru_hits'],n['lru_trace']=lru(refs,3)
n['lfu_hits'],n['lfu_trace']=lfu(refs,3)
n['reference_count']=len(refs);n['misses']=len(refs)-n['lru_hits']
n['hit_fraction']=n['lru_hits']/len(refs)
contrast=['A','A','A','B','C']
n['lru_contrast_hits'],n['lru_contrast']=lru(contrast,2)
n['lfu_contrast_hits'],n['lfu_contrast']=lfu(contrast,2)
assert n['lru_hits']==n['lfu_hits']==2 and n['misses']==5
assert n['lru_trace'][-1]['residents']==['A','D','B']
assert n['lfu_trace'][-1]['counts']=={'A':3,'D':1,'B':1}
assert n['lru_contrast'][-1]['residents']==['B','C']
assert n['lfu_contrast'][-1]['counts']=={'A':3,'C':1}
# The protected resource installs authority before rejecting the old owner.
state={'epoch':7,'score':10,'commands':{}}
def apply(epoch,key,delta):
 if epoch<state['epoch']:return 'stale'
 state['epoch']=epoch
 if key in state['commands']:
  old_delta,result=state['commands'][key]
  return result if old_delta==delta else 'payload conflict'
 state['score']+=delta
 state['commands'][key]=(delta,state['score'])
 return state['score']
state['epoch']=8
assert apply(7,'old',1)=='stale'
assert apply(8,'c9',1)==11 and apply(8,'c9',1)==11
assert apply(8,'c9',2)=='payload conflict'
assert apply(8,'c10',1)==12
n['fenced_command_state']=state
# Append repair establishes a matching predecessor before replacing conflict.
leader=[(1,'a'),(2,'b'),(4,'c9')]
follower=[(1,'a'),(2,'b'),(3,'x')]
assert follower[2][0]!=leader[2][0]
assert follower[1]==leader[1]
follower=follower[:2]+leader[2:]
assert follower==leader
n['repaired_log_terms']=[term for term,_ in follower]
assert (4,8)>(3,9) and (4,8)>(4,7)
assert n['cache_occupancy_percent']==82.03125
assert n['all_copies']==2520000000 and n['weighted_mean_ms']==4
p=Path(__file__).resolve().parents[2]/'src/data/system-design/copies-review-numbers.json'
p.write_text(json.dumps(n,indent=2)+'\n')
print(json.dumps(n,indent=2))
