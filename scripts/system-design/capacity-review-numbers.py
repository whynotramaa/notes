"""Reproduce illustrative examples used by the independent capacity/model review.
No product benchmark is implied. Decimal byte units except explicit KiB/MiB.
"""
from math import ceil
import json

p = {}
p['daily_qps'] = 8_640_000 / (24 * 60 * 60)
p['peak_qps'] = p['daily_qps'] * 10
p['concurrency'] = p['peak_qps'] * .2
p['trace_ms'] = sum([30, 20, 10, 40, 100])
p['cpu_cores'] = p['peak_qps'] * .002
p['pool_capacity'] = 20 / .01
p['window_qps'] = [3000 / 10, 7000 / 10]
p['failed_per_sec'] = 1000 - 900
p['combined_window_qps'] = (3000+7000)/(10+10)
p['invalid_average_p99_ms'] = (5+200)/2
p['latency_sum_ms'] = sum([5]*50+[40]*45+[100]*4+[200])
p['fanout_probabilities_percent'] = [(.99**count)*100 for count in [1,10,100]]
p['index_one_copy_bytes'] = 129_600_000_000*1.2
p['quorum_ranks'] = [ceil(q*100) for q in [.5,.95,.99]]
sample = [5] * 50 + [40] * 45 + [100] * 4 + [200]
p['quantiles_ms'] = {str(q): sample[ceil(q * len(sample)) - 1] for q in [.5,.95,.99]}
p['mean_ms'] = sum(sample)/len(sample)
p['fleet_p99_ms'] = ([5] * 1000 + [200] * 10)[ceil(.99 * 1010)-1]
p['fanout_10_success'] = .99 ** 10
p['fanout_10_slow_percent'] = (1 - p['fanout_10_success']) * 100
p['fanout_100_success'] = .99 ** 100
p['ten_call_mean_ms'] = 10 * 5
p['io_bytes_s'] = 2000 * 4096
p['coalesced_ops'] = 64 * 1024 / 4096
p['payload_bytes_s'] = 1000 * 2000
p['live_deliveries_s'] = 20 * 50_000
p['live_bytes_s'] = p['live_deliveries_s'] * 200
p['live_origin_bytes_s'] = 20 * 5 * 200
p['link_payload_utilization'] = p['live_bytes_s'] * 8 / 1_000_000_000
p['stored_day'] = 8_640_000 * 500
p['stored_month'] = p['stored_day'] * 30
p['stored_replicated'] = p['stored_month'] * 3
p['storage_with_index'] = p['stored_month'] * 1.2 * 3
p['io_misses_s'] = 1000 * 4 * .1
p['miss_bytes_s'] = p['io_misses_s'] * 4096
p['cache_payload_bytes'] = 100_000 * 2000
p['cache_total_bytes'] = 100_000 * (2000+100)
p['cache_replicated_bytes'] = p['cache_total_bytes'] * 2
p['mm1_ms'] = [1000/(1000-rate) for rate in [500,900,990]]
p['cpu_limited_qps'] = 4/.002
p['shared_pool_calls'] = 5 * 20
p['serial_job_ms'] = 100 * .2
p['parallel_job_ms'] = [100*.8/n for n in [1,4,8]]
p['amdahl'] = [1/(.2+.8/n) for n in [1,4,8]]
p['amdahl_limit'] = 1/.2
p['reduced_serial_speedup'] = 1/(.1+.9/8)
p['backlog_jobs'] = (1200-1000)*60
p['drain_s'] = p['backlog_jobs']/(1000-600)
p['queue_trace'] = [max(0, (1200-1000)*t) for t in [0,15,30,60]]
p['deadline_queue'] = 1000*.1
p['oldest_wait_s'] = 12_000/1000
p['expiry_discard'] = 12_000 - 1000*5
p['retry_attempts'] = 1000*(1+.1+.01)
p['memory_waiting'] = 12_000*16*1024
p['normal_capacity'] = 5*300
p['failure_capacity'] = 4*300
p['normal_utilization'] = 1000/1500
p['failure_utilization'] = 1000/1200
p['headroom'] = 1200-1000
p['needed_servers'] = ceil(1000/300)+1
p['bin_kib_bytes'] = 4*1024
p['decimal_kb_bytes'] = 4*1000
p['binary_gib'] = p['stored_replicated']/(1024**3)

n = {}
n['history_rows'] = 20 * 3600
n['history_bytes'] = n['history_rows']*200
n['bucket_rows'] = 20*15*60
n['bucket_bytes'] = n['bucket_rows']*200
n['hour_buckets'] = 60/15
n['fifteen_min_query_buckets'] = 2
n['name_copies_bytes'] = 1000*24
n['copied_write_ops'] = 1+1000
n['secondary_bytes'] = 100_000*40
n['secondary_two_bytes'] = n['secondary_bytes']*2
n['update_ops_two_indexes'] = 1 + 2*2
n['document_variant_bytes'] = 800+3*200
n['embedded_comments_bytes'] = 800 + 100_000*200
n['graph_first_hop'] = 3
n['graph_second_hop'] = 3*3
n['graph_third_hop'] = 3**3
n['graph_candidates'] = sum([3**i for i in [1,2,3]])
n['graph_unique_second'] = len({'x','y','z','y','z','w','z','w','v'})
n['hot_split_qps'] = 10_000/4
n['scan_to_page'] = 100_000/20
n['quorum_overlap'] = 2+2-3
n['quorum_failure_tolerance'] = 3-2
n['five_quorum_overlap'] = 3+3-5
n['five_quorum_tolerance'] = 5-3
n['event_lag'] = 20*5
n['event_catchup_s'] = n['event_lag']/(40-20)
n['read_view_ops'] = 20*3
n['read_view_physical_ops'] = n['read_view_ops']*3
n['event_log_bytes_s'] = 20*200
n['event_log_day'] = n['event_log_bytes_s']*86400
n['event_log_replicated_day'] = n['event_log_day']*3
n['backfill_s'] = 100_000/1000
n['backfill_new_events'] = 20*n['backfill_s']
n['backfill_catchup_s'] = n['backfill_new_events']/(1000-20)
n['page_counts'] = [ceil(x/20) for x in [40,100,1000]]
n['repair_bytes'] = 72_000*200
n['repair_min_seconds'] = n['repair_bytes']/1_000_000
n['key_order'] = sorted(['m7:1','m7:2','m7:10'])
n['padded_key_order'] = sorted(['m7:001','m7:002','m7:010'])
assert p['mean_ms'] == 26.5
assert p['invalid_average_p99_ms'] == 102.5
assert p['combined_window_qps'] == 500

def burst_and_drain(arrival, service, duration, recovery_arrival):
    backlog = max(0, (arrival-service)*duration)
    spare = service-recovery_arrival
    if spare <= 0:
        raise ValueError('recovery cannot drain this queue')
    return backlog, backlog/spare

assert burst_and_drain(1200,1000,60,600) == (12000,30)

def apply_replacement(stored, incoming):
    if stored is None or incoming['version'] > stored['version']:
        return dict(incoming)
    return stored

state = apply_replacement(None, {'version':8, 'score':42})
state = apply_replacement(state, {'version':9, 'deleted':True})
assert apply_replacement(state, {'version':7, 'score':40}) == state
assert state == {'version':9, 'deleted':True}
assert p['fleet_p99_ms'] == 5
assert p['storage_with_index'] == 466_560_000_000
assert n['graph_candidates'] == 39 and n['graph_unique_second'] == 5
assert n['embedded_comments_bytes'] == 20_000_800
assert n['event_catchup_s'] == 5
assert n['event_log_day'] == 345_600_000
assert n['read_view_physical_ops'] == 180
print(json.dumps({'performance':p, 'nosql':n}, indent=2))
