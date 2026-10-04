"""Worked networking traces; all timings and IDs are illustrative inputs."""
from math import ceil

lookup_exchanges=1+3
lookup_ms=lookup_exchanges*10
cache_ttl_s=60
changed_at_s=20
remaining_at_change_s=cache_ttl_s-changed_at_s
queries_at_s=[30,61]
cache_valid=[t<cache_ttl_s for t in queries_at_s]
stream_chunks=[2,3,1,4]
stream_bytes=sum(stream_chunks)
message_lengths=[5,5]
assert stream_bytes==sum(message_lengths)
body_bytes=2000
frame_payload_bytes=500
body_frames=ceil(body_bytes/frame_payload_bytes)
cold_ms=40+40+40+40
warm_ms=40
pool_slots=20
occupancy_s=.01
ideal_pool_qps=pool_slots/occupancy_s
peak_qps=1000
pool_utilization=peak_qps/ideal_pool_qps
backoff_base_ms=100
backoff_cap_ms=800
backoff_ceilings=[min(backoff_cap_ms,backoff_base_ms*2**k) for k in range(5)]
expected_jitter_ms=[v/2 for v in backoff_ceilings]
attempts_by_layer=[3**k for k in range(4)]
poll_s=5
viewer_count=50000
poll_qps=viewer_count/poll_s
poll_delay_s=poll_s/2
inflight_longpoll=viewer_count
assert lookup_ms==40 and remaining_at_change_s==40
assert cache_valid==[True,False]
assert body_frames==4 and cold_ms==160
assert ideal_pool_qps==2000 and pool_utilization==.5
assert backoff_ceilings==[100,200,400,800,800]
print('lookup exchanges:',lookup_exchanges,'lookup ms:',lookup_ms)
print('TTL remaining:',remaining_at_change_s,'cache valid:',cache_valid)
print('byte chunks:',stream_chunks,'bytes:',stream_bytes,'framed messages:',message_lengths)
print('body frames:',body_frames,'cold/warm ms:',cold_ms,warm_ms)
print('pool qps:',ideal_pool_qps,'ideal utilization:',pool_utilization)
print('backoff ceilings ms:',backoff_ceilings,'expected full jitter ms:',expected_jitter_ms)
print('nested attempts:',attempts_by_layer)
print('poll qps:',poll_qps,'mean poll wait:',poll_delay_s,'held long polls:',inflight_longpoll)
received_id=7
retained_ids=[7,8,9]
replayed_ids=[v for v in retained_ids if v>received_id]
assert replayed_ids==[8,9]
print('SSE replay after',received_id,':',replayed_ids)
toy_pool_slots=2
toy_arrivals=3
toy_waiters=max(0,toy_arrivals-toy_pool_slots)
assert toy_waiters==1
print('toy pool slots/arrivals/waiters:',toy_pool_slots,toy_arrivals,toy_waiters)
overall_ms=500
network_ms=40
reserve_ms=60
useful_ms=overall_ms-network_ms-reserve_ms
spent_ms=120
child_ms=useful_ms-spent_ms
assert useful_ms==400 and child_ms==280
print('useful/child budget ms:',useful_ms,child_ms)
initial_total=0
set_once=10
set_twice=10
add_once=initial_total+10
add_twice=add_once+10
retry_window_h=24
identity_retention_h=48
assert (set_once,set_twice,add_once,add_twice)==(10,10,10,20)
assert 12<retry_window_h and retry_window_h<36<identity_retention_h
print('set/add repeat:',set_once,set_twice,add_once,add_twice)
read_stages_ms=[40,20,30,10,60,40]
read_cumulative_ms=[]
for v in read_stages_ms:
    read_cumulative_ms.append(sum(read_stages_ms[:len(read_cumulative_ms)+1]))
assert read_cumulative_ms==[40,60,90,100,160,200]
producer_bytes_s=20*200
viewer_deliveries_s=20*50000
viewer_bytes_s=viewer_deliveries_s*200
assert producer_bytes_s==4000 and viewer_bytes_s==200000000
print('read cumulative ms:',read_cumulative_ms)
print('producer/delivery bytes per second:',producer_bytes_s,viewer_bytes_s)
