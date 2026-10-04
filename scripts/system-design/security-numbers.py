"""Security sizing examples are illustrative, never recommended cryptographic strengths."""
import json,math
from pathlib import Path
v=dict(session_bytes=32,session_bits=32*8,session_space=2**256,
 active_sessions=50000,record_bytes=200,session_store_bytes=50000*200,
 access_lifetime_s=300,revocation_exposure_s=300,refresh_days=30,refresh_s=30*86400,
 password_hash_ms=100,login_workers=4,hashes_worker_s=1000/100,hash_capacity_s=4*1000/100,
 hash_memory_MiB=64,concurrent_hash_memory_MiB=4*64,login_rate_s=10,
 api_keys=1000,api_key_bytes=32,api_key_raw_bytes=1000*32,
 presign_start_s=1000,presign_ttl_s=60,presign_expiry_s=1000+60,
 csrf_bytes=32,csrf_bits=32*8,
 requests_min=100,global_users=50000,total_admissions_min=100*50000,
 total_admissions_s=100*50000/60,login_limit=5,login_window_s=60,
 attempted_logins=20,accepted_logins=5,rejected_logins=20-5,
 acl_objects=1000,acl_entries_object=3,acl_entries=1000*3,
 roles=4,permissions=6,rbac_cells=4*6,
 auth_steps_ms=[5,2,1,10],auth_total_ms=sum([5,2,1,10]),
 jwt_header_bytes=36,jwt_payload_bytes=180,jwt_signature_bytes=32,
 jwt_raw_bytes=36+180+32,b64_header_bytes=math.ceil(36/3)*4,
 b64_payload_bytes=math.ceil(180/3)*4,b64_sig_chars=math.ceil(32*8/6),
 jwt_wire_chars=48+240+43+2,
 encryption_data_bytes=1000000,gcm_nonce_bytes=12,gcm_tag_bytes=16,
 ciphertext_bytes=1000000+12+16,
 rotation_overlap_s=300,clock_skew_s=30,old_key_retention_s=300+30,
 tenant_ids=[7,8],object_owner_tenant=7,request_tenant=8,
 password_example_guesses=1000000,fast_guess_rate_s=1000000000,slow_guess_rate_s=10,
 fast_example_s=1000000/1000000000,slow_example_s=1000000/10)
assert v['session_bits']==256 and v['jwt_wire_chars']==333
assert v['rejected_logins']==15 and v['hash_capacity_s']==40
root=Path(__file__).resolve().parents[2]
(root/'src/data/system-design/security-numbers.json').write_text(json.dumps(v,indent=2)+'\n')
print(json.dumps(v,indent=2))
