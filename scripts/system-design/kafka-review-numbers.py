"""Illustrative Kafka4.1 traces; offsets are next-position boundaries where stated."""
import json
from pathlib import Path
n=dict(events_s=20,event_bytes=200,retention_days=7,replicas=3,partitions=4,consumer_rate_s=100,paused_s=10,initial_offset=100,record_count=4,segment_records=1000,group_consumers=6,acks_min_isr=2)
n.update(events_day=20*86400,payload_day=20*200*86400,retained_three_copy_bytes=20*200*86400*7*3,per_partition_mean_events_s=20/4,minimum_segments=20*86400*7/1000,paused_backlog=20*10,spare_consumer_rate_s=100-20,drain_s=20*10/(100-20),active_consumers=min(4,6),idle_consumers=max(0,6-4))
n['offsets']=list(range(100,104));n.update(log_start=100,log_end=100+4,high_watermark=103,last_stable_offset=102)
n.update(uncommitted_visible=list(range(100,103)),committed_boundary_visible=list(range(100,102)),safe_commit_after_two=100+2,unsafe_commit_before_two=100+2)
n['replication']={'leader_next':104,'follower_a_next':104,'follower_b_next':103,'ISR':['leader','A','B'],'minimum_next':min(104,104,103),'after_b_catches_up':min(104,104,104)}
n['producer']={'epoch_before':8,'epoch_after_restart':8+1,'batch_records':1,'sequence_first':0,'sequence_retry':0,'sequence_next':0+1,'base_offset':100}
n['retention']={'first_offset':0,'segment_end_exclusive':1000,'next_segment_first':1000,'deleted_records':1000}
assert n['log_end']==104 and n['safe_commit_after_two']==102 and n['drain_s']==2.5 and n['idle_consumers']==2
path=Path(__file__).resolve().parents[2]/'src/data/system-design/kafka-review-numbers.json';path.write_text(json.dumps(n,indent=2)+'\n');print(json.dumps(n,indent=2))
