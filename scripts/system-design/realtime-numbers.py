"""Illustrative Heron realtime transport and recovery traces."""
import json,math
from pathlib import Path
v=dict(viewers=50000,events_s=20,event_bytes=200,gateway_connections=10000,
 gateways=math.ceil(50000/10000),gateway_deliveries_s=20*10000,deliveries_s=20*50000,
 payload_bytes_s=20*50000*200,payload_bits_s=20*50000*200*8,
 gateway_payload_bytes_s=20*10000*200,gateway_memory_bytes=10000*16*1024,
 total_memory_bytes=50000*16*1024,poll_interval_s=5,poll_qps=50000/5,
 mean_poll_delay_s=5/2,poll_payload_bytes_s=50000/5*2000,
 heartbeat_s=30,heartbeat_bytes=40,heartbeat_messages_s=50000/30,
 heartbeat_bytes_s=50000*40/30,
 event_log_day_bytes=20*200*86400,event_log_hour_bytes=20*200*3600,
 replay_gap_s=5,replay_events=20*5,replay_bytes=20*5*200,
 slow_produced_bytes_s=20*200,slow_drain_bytes_s=1000,
 slow_growth_bytes_s=20*200-1000,slow_queue_bytes=60000,slow_queue_fill_s=60000/(20*200-1000),
 outage_reconnect_s=10,reconnects_s=50000/10,uniform_bins=10,reconnect_bin_expected=50000/10,
 extra_gateway_count=math.ceil(50000/10000)+1,surviving_gateways=6-1,
 broker_deliveries_s=20*5,broker_bytes_s=20*5*200,
 snapshot_bytes=2000,snapshot_plus_replay_bytes=2000+20*5*200,
 batched_events=5,batch_wait_max_s=(5-1)/20,batch_payload_bytes=5*200,
 websocket_payload_bytes=200,server_frame_header_bytes=4,client_mask_bytes=4,
 server_frame_bytes=200+4,client_frame_bytes=200+4+4,
 topic_viewers=[30000,15000,5000],topic_fanout=[30000*20,15000*20,5000*20],
 sequences=[101,102,102,104,103],deduplicated=[101,102,103,104],
 lease_s=90,last_renewal_s=30,presence_expiry_s=30+90,poll_sample_wait_s=5-1,heartbeat_misses=90/30,deadline_phases_ms=[5,10,5,15,5],end_to_end_ms=sum([5,10,5,15,5]))
assert v['gateways']==5 and v['payload_bytes_s']==200_000_000
assert v['slow_queue_fill_s']==20 and v['replay_events']==100
root=Path(__file__).resolve().parents[2]
(root/'src/data/system-design/realtime-numbers.json').write_text(json.dumps(v,indent=2)+'\n')
print(json.dumps(v,indent=2))
