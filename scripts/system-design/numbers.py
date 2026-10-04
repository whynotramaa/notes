"""Heron's illustrative workloads. Decimal bytes unless KiB or MiB is written."""
import json
from math import ceil, log, log2
from pathlib import Path

n = dict(seconds_day=24*60*60, requests_day=8_640_000, peak_factor=10,
         mean_latency_s=0.2, response_bytes=2_000, row_bytes=500,
         retention_days=30, events_s=20, event_bytes=200, viewers=50_000,
         gateway_connections=10_000, cache_items=100_000, cache_item_bytes=2_000,
         cache_overhead_bytes=100, replicas=3, servers=5, server_qps=300,
         upload_bytes=5_000_000_000, upload_part_bytes=100_000_000,
         limiter_capacity=100, limiter_window_s=60)
n.update(avg_qps=n['requests_day']/n['seconds_day'])
n.update(peak_qps=n['avg_qps']*n['peak_factor'])
n.update(concurrency=n['peak_qps']*n['mean_latency_s'],
         response_bytes_s=n['peak_qps']*n['response_bytes'],
         rows_bytes_day=n['requests_day']*n['row_bytes'],
         cache_bytes=n['cache_items']*(n['cache_item_bytes']+n['cache_overhead_bytes']),
         fanout_messages_s=n['events_s']*n['viewers'],
         gateways=ceil(n['viewers']/n['gateway_connections']),
         upload_parts=ceil(n['upload_bytes']/n['upload_part_bytes']),
         limiter_refill_s=n['limiter_capacity']/n['limiter_window_s'])
n.update(response_bits_s=n['response_bytes_s']*8,
         storage_bytes=n['rows_bytes_day']*n['retention_days'],
         fanout_bytes_s=n['fanout_messages_s']*n['event_bytes'],
         surviving_qps=(n['servers']-1)*n['server_qps'])
n.update(replicated_storage_bytes=n['storage_bytes']*n['replicas'])
n['extra'] = {
 'cold_handshake_ms':40+40+40+40, 'warm_request_ms':40,
 'pool_capacity':20/.01, 'db_miss_qps':1000*(1-.9),
 'queue_backlog':(1200-1000)*60, 'queue_drain_s':12000/(1000-600),
 'serial_speedup':1/(.2+.8/4), 'eight_core_speedup':1/(.2+.8/8),
 'cache_fail_multiplier':1000/100, 'series_availability':.999*.999,
 'downtime_999_s':30*86400*(1-.999), 'downtime_9999_s':30*86400*(1-.9999),
 'parallel_independent':1-(1-.99)**2, 'retry_requests':1000*3**3,
 'quorum_intersection':2+2-3, 'replica_loss_bytes':20*200*5,
 'rate_per_ten_s':100/60*10, 'storage_MB_s':200*20/1_000_000,
 'event_log_day_bytes':20*200*86400, 'event_log_7d_replicated_bytes':20*200*86400*7*3,
 'poll_qps':50000/5, 'poll_wait_s':5/2,
 'heartbeat_bytes_s':50000*40/30, 'gateway_memory_bytes':10000*16*1024,
 'search_idf':log(1+(1000-10+.5)/(10+.5)),
 'search_bm25':log(1+(1000-10+.5)/(10+.5))*(3*(1.2+1))/(3+1.2*(1-.75+.75*200/100)),
 'batch_day_rows':20*86400, 'cdf_99':ceil(.99*100),
 'timeout_usable_ms':500-40-60, 'cursor_pages':ceil(1000/20),
 'hash_moved_fraction':1/5, 'upload_seconds':5_000_000_000/10_000_000,
 'api_upload_seconds':5_000_000_000/2_000_000,
 'cache_occupancy':210_000_000/256_000_000,
 'feed_write_entries':100*10000, 'feed_read_entries':50*200,
 'sampling_traces_s':1000*.01, 'log_bytes_day':1000*500*86400,
 'burn_rate':.01/.001, 'page_offset':50*20,
 'index_fanout_levels':ceil(log(1_000_000,100)),
 'index_binary_comparisons':ceil(log2(1_000_000)),
 'fixed_boundary_burst':100+100, 'slide_count':80*.25+30,
 'token_remaining':min(100,20+100/60*12)-25,
 'leaky_drain_s':100/(100/60),
 'multi_shard_messages':8*2, 'prefix_candidates':3**2,
 'url_62_7':62**7, 'image_daily_bytes':1000*2_000_000,
 'fanout_gateways':20*5, 'read_amp':50000*20,
 'payment_cents':10000-2500, 'rpo_event_loss':20*5,
 'metrics_samples_day':1000*86400/15,
}
n['nearest_rank'] = {'p50':5,'p95':40,'p99':100}
n['latency_sample_ms'] = [5]*50 + [40]*45 + [100]*4 + [200]
assert [n['latency_sample_ms'][ceil(q*100)-1] for q in [.5,.95,.99]] == [5,40,100]
n['extra'].update(normal_capacity=5*300, failure_headroom=4*300-1000, amdahl_limit=1/.2)
assert n['avg_qps']==100 and n['concurrency']==200
assert n['storage_bytes']==129_600_000_000
assert n['extra']['token_remaining']==15
root = Path(__file__).resolve().parents[2]
(root/'src/data/system-design/numbers.json').write_text(json.dumps(n,indent=2)+'\n')
print(json.dumps(n,indent=2))
