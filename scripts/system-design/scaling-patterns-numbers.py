"""Exact illustrative arithmetic for Heron's scaling-pattern mechanisms."""
import json
from pathlib import Path
n=dict(events_s=20,event_bytes=200,read_qps=1000,shards=4,followers=10000,publishers_s=100,active_reads_s=50,candidates=200,rows=1000000,replay_s=20000,snapshot_events=1000,projection_s=100,outbox_poll_s=2,lease_s=10,work_s=15,ring_old=[0,25,50,75],ring_new=[0,20,40,60,80],modulus=100)
n.update(events_day=20*86400,raw_event_bytes_day=20*200*86400,mean_shard_qps=1000/4,hot_shard_qps=1000*.6,cold_shard_qps=1000*.4/3,fanout_write_entries_s=100*10000,fanout_read_candidates_s=50*200,replay_seconds=1000000/20000,snapshot_replay_seconds=1000/20000,projection_lag_after_pause_s=10,projection_backlog=20*10,projection_drain_s=20*10/(100-20),poll_mean_delay_s=2/2,lease_overlap_s=15-10,moved_fraction=1/5)
n['modulo_moved']=sum(k%4!=k%5 for k in range(100))
n['ledger']={'before_cents':10000,'reserved_cents':2500,'available_cents':10000-2500,'charge_cents':2500,'refund_cents':2500}
n['versions']={'before':7,'next':7+1,'stale_expected':7,'actual_after_other_write':7+1}
assert n['fanout_write_entries_s']==1000000 and n['modulo_moved']==80
path=Path(__file__).resolve().parents[2]/'src/data/system-design/scaling-patterns-numbers.json';path.write_text(json.dumps(n,indent=2)+'\n');print(json.dumps(n,indent=2))
