"""Computed illustrative Heron telemetry examples, not production measurements."""
import json
from pathlib import Path
from math import ceil
n=dict(day_s=24*60*60,month_days=30,qps=1000,log_bytes=500,slo=.999,failures=600,window_s=60,labels=[12,6,5],buckets=12,services=20,requests=[900,100],bad=[9,10],spans=[200,120,80,20],sample_rate=.01,span_bytes=300,spans_per_trace=8,tail_wait_s=10,pool_size=40,pool_busy=32,cache_hits=900,cache_misses=100,ingest=1200,drain=1000,burst_s=60,recovery_ingest=600)
n.update(log_bytes_s=n['qps']*n['log_bytes'],log_bytes_day=n['qps']*n['log_bytes']*n['day_s'],requests_window=n['qps']*n['window_s'],monthly_requests=n['qps']*n['day_s']*n['month_days'],series=12*6*5, histogram_series=12*6*5*(12+2), series_with_users=12*6*5*50000)
n.update(error_rate=n['failures']/n['requests_window'],error_budget=n['monthly_requests']/1000,weighted_error=sum(n['bad'])/sum(n['requests']),wrong_mean_error=sum(b/r for b,r in zip(n['bad'],n['requests']))/len(n['bad']),sampled_traces_s=n['qps']*n['sample_rate'],trace_bytes_s=n['qps']*n['sample_rate']*n['spans_per_trace']*n['span_bytes'],tail_buffer_traces=n['qps']*n['tail_wait_s'],tail_buffer_bytes=n['qps']*n['tail_wait_s']*n['spans_per_trace']*n['span_bytes'],pool_fraction=n['pool_busy']/n['pool_size'],cache_hit_fraction=n['cache_hits']/(n['cache_hits']+n['cache_misses']),backlog=(n['ingest']-n['drain'])*n['burst_s'])
n.update(burn_rate=n['error_rate']*1000,budget_used_fraction=n['failures']/n['error_budget'],budget_exhaust_s=n['error_budget']/(n['qps']*n['error_rate']),drain_s=n['backlog']/(n['drain']-n['recovery_ingest']),trace_self_ms=200-120,max_parallel_ms=max(120,80)+20,buckets_counts=[50,95,99,100],bucket_deltas=[50,45,4,1],scrape_samples_day=1000*n['day_s']/15,retained_log_bytes=1000*500*n['day_s']*7)
assert n['histogram_series']==5040 and n['backlog']==12000 and n['drain_s']==30
assert abs(n['burn_rate']-10)<1e-9 and n['trace_self_ms']==80
path=Path(__file__).resolve().parents[2]/'src/data/system-design/observability-numbers.json'
path.write_text(json.dumps(n,indent=2)+'\n')
print(json.dumps(n,indent=2))
