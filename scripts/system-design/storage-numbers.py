"""Heron illustrative byte, multipart, checksum, and lifecycle arithmetic."""
import json, math, hashlib, zlib
from pathlib import Path
size=5_000_000_000
part=100_000_000
parts=math.ceil(size/part)
data=b'Heron:7:120'
changed=b'Heron:7:121'
n={'upload_bytes':size,'part_bytes':part,'parts':parts,'last_part_start':(parts-1)*part,'last_part_end':size-1,'last_part_bytes':size-(parts-1)*part,'direct_upload_s':size/10_000_000,'application_upload_s':size/2_000_000,'proxy_payload_bytes':size*2,'retry_part_bytes':part,'retry_whole_bytes':size,'retry_reduction_factor':size/part,'application_metadata_bytes':2000,'proxy_metadata_ratio':size*2/2000,'block_bytes':4096,'blocks':math.ceil(size/4096),'allocated_bytes':math.ceil(size/4096)*4096,'padding_bytes':math.ceil(size/4096)*4096-size,'event_storage_day':20*200*86400,'event_storage_30d':20*200*86400*30,'row_storage_day':8640000*500,'row_storage_30d':8640000*500*30,'row_storage_replicated':8640000*500*30*3,'replicated_upload_bytes':size*3,'erasure_data_shards':4,'erasure_parity_shards':2,'erasure_shard_bytes':size/4,'erasure_physical_bytes':size/4*6,'erasure_overhead_ratio':6/4,'incomplete_parts_bytes':part*2,'ten_incomplete_bytes':part*2*10,'version_bytes':size*3,'clips_per_day':100,'retained_clip_count':100*30,'retained_clip_bytes':100*30*size,'hot_clip_bytes':100*7*size,'cold_clip_bytes':100*23*size,'metadata_bytes':100*30*500,'presign_requested_s':3600,'credential_remaining_s':1200,'presign_effective_s':min(3600,1200),'upload_budget_s':600,'upload_budget_margin_s':600-size/10_000_000,'replication_gap_events':5*20,'payload_ascii_bytes':len(data),'sha256_original':hashlib.sha256(data).hexdigest(),'sha256_changed':hashlib.sha256(changed).hexdigest(),'crc32_original':zlib.crc32(data),'crc32_changed':zlib.crc32(changed),'first_range':[0,part-1],'second_range':[part,2*part-1],'range_read_bytes':1000000,'range_fraction':1000000/size,'download_time_s':1000000/10000000,'multipart_manifest_entries':parts,'concurrent_parts':5,'part_transfer_s':part/2000000,'parallel_group_s':(part*5)/10000000,'parallel_groups':parts/5}
assert n['parts']==50 and n['last_part_bytes']==part
assert n['sha256_original']!=n['sha256_changed']
assert n['allocated_bytes']>=size and n['padding_bytes']<4096
assert n['hot_clip_bytes']+n['cold_clip_bytes']==n['retained_clip_bytes']
assert n['first_range'][1]+1==n['second_range'][0]
Path('src/data/system-design/storage-numbers.json').write_text(json.dumps(n,indent=2)+'\n')
print(json.dumps(n,indent=2))
