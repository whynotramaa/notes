"""Illustrative Heron analytics windows, recovery and storage arithmetic."""
import json,math
from pathlib import Path
records=[dict(id='a',key='red',time=1,value=2),dict(id='b',key='blue',time=3,value=3),dict(id='c',key='red',time=2,value=4),dict(id='d',key='red',time=7,value=1)]
v=dict(records=records,red_sum=2+4+1,blue_sum=3,total=2+3+4+1,
 events_s=20,event_bytes=200,day_events=20*86400,day_bytes=20*200*86400,
 retention_days=30,retained_bytes=20*200*86400*30,replicated_bytes=20*200*86400*30*3,
 batch_interval_s=3600,batch_records=20*3600,batch_bytes=20*3600*200,
 mean_batch_wait_s=3600/2,batch_runtime_s=72000/2000,batch_worst_delay_s=3600+72000/2000,
 window_width_s=5,windows=[[0,5],[5,10]],window_red=[6,1],window_blue=[3,0],
 timestamps=[1,3,2,7],max_time=7,lateness_s=2,watermark=7-2,
 partitions=4,partition_events_s=20/4,consumer_capacity_s=10,total_capacity_s=4*10,
 checkpoint_interval_s=30,replay_events=20*30,replay_bytes=20*30*200,
 keys=1000,state_bytes_key=64,state_bytes=1000*64,checkpoint_MB_s=64000/30/1_000_000,
 dedup_days=1,dedup_id_bytes=32,dedup_bytes=20*86400*32,
 backfill_days=7,backfill_records=20*86400*7,backfill_capacity_s=2000,backfill_s=20*86400*7/2000,
 lag_records=12000,live_ingest_s=20,recovery_capacity_s=120,catchup_s=12000/(120-20),
 row_bytes=500,column_bytes=8,scan_rows=1000000,row_scan_bytes=1000000*500,
 column_scan_bytes=1000000*8,scan_reduction=500/8,
 map_outputs=[('red',2),('blue',3),('red',4),('red',1)],shuffle_red=[2,4,1],shuffle_blue=[3],
 duplicate_total=2+3+4+4+1,correct_total=2+3+4+1,
 update_before=4,update_after=6,retraction=-4+6,
 source_offsets=[0,1,2,3],checkpoint_offset=1,checkpoint_sum=2+3,recovered_tail_sum=4+1,
 joined_orders=3,joined_payments=2,inner_join_rows=2,
 file_bytes=200*20*60,files_day=86400/60,compacted_files_day=math.ceil(20*200*86400/128000000))
assert v['total']==10 and v['day_events']==1_728_000
assert v['catchup_s']==120 and v['watermark']==5
root=Path(__file__).resolve().parents[2]
(root/'src/data/system-design/data-pipelines-numbers.json').write_text(json.dumps(v,indent=2)+'\n')
print(json.dumps(v,indent=2))
