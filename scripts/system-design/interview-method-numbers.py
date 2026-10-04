"""Illustrative interview arithmetic, with units and explicit assumptions."""
import json
from math import ceil
from pathlib import Path
n=dict(seconds_day=24*60*60,daily=8640000,peak_factor=10,latency_s=.2,response_bytes=2000,row_bytes=500,retention_days=30,replicas=3,server_capacity=300,servers=5,viewers=50000,events_s=20,event_bytes=200,gateway_connections=10000,cache_hit_fraction=.9,upload_bytes=5000000000,part_bytes=100000000,client_bytes_s=10000000,api_bytes_s=2000000,overload_in=1200,overload_out=1000,overload_s=60,recovery_in=600)
n.update(average_qps=n['daily']/n['seconds_day']);n.update(peak_qps=n['average_qps']*10)
n.update(in_flight=n['peak_qps']*n['latency_s'],response_bytes_s=n['peak_qps']*n['response_bytes'],rows_day_bytes=n['daily']*n['row_bytes'],logical_storage=n['daily']*n['row_bytes']*n['retention_days'],fanout_deliveries_s=50000*20,fanout_bytes_s=50000*20*200,gateways=ceil(50000/10000),parts=ceil(5000000000/100000000),direct_upload_s=5000000000/10000000,api_upload_s=5000000000/2000000,normal_capacity=5*300,failure_capacity=4*300,db_miss_qps=1000/10,cache_failure_factor=10,backlog=(1200-1000)*60)
n.update(replicated_storage=n['logical_storage']*3,failure_headroom=n['failure_capacity']-1000,recovery_s=n['backlog']/(1000-600),slots_needed=ceil(1000/300))
n['state_trace']={'initial_version':7,'committed_version':8,'pending_upload_parts':50,'completed_upload_parts':50}
assert n['logical_storage']==129600000000 and n['fanout_deliveries_s']==1000000 and n['failure_headroom']==200
path=Path(__file__).resolve().parents[2]/'src/data/system-design/interview-method-numbers.json';path.write_text(json.dumps(n,indent=2)+'\n');print(json.dumps(n,indent=2))
