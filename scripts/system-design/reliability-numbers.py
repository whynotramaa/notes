"""Illustrative Heron reliability arithmetic and executable recovery invariants."""
import json
from pathlib import Path
import sys
sys.path.remove(str(Path(__file__).resolve().parent))
from fractions import Fraction
seconds=30*24*60*60
n={
 'breaker_window_calls':20,'breaker_failure_calls':12,'breaker_failure_threshold':10,'breaker_failure_fraction':12/20,'breaker_cooldown_s':30,'breaker_opened_s':5,'breaker_probe_s':5+30,'breaker_probe_limit':2,'month_seconds':seconds,'availability_999_downtime':seconds*Fraction(1,1000),
 'availability_9999_downtime':seconds*Fraction(1,10000),
 'series_availability':Fraction(999,1000)**3,
 'parallel_availability':1-Fraction(1,1000)**2,
 'common_cause_availability':Fraction(999,1000)*(1-Fraction(1,1000)**2),
 'peak_qps':8640000//86400*10,'normal_per_replica':1000//4,
 'survivor_load':Fraction(1000,3),'survivor_capacity':3*350,
 'retry_amplification':3**3,'retry_budget':1000*Fraction(1,10),
 'backoff_ceilings_ms':[100*2**i for i in range(4)],
 'backoff_means_ms':[50*2**i for i in range(4)],
 'remaining_deadline_ms':500-40-60-120,'bulkhead_remainder':100-20,
 'inflight_normal':1000*Fraction(1,5),'inflight_slow':1000*2,
 'shed_qps':1000-600,'cached_db_qps':1000*(1-Fraction(9,10)),
 'cache_loss_amplification':Fraction(1000,100),'health_detection_s':3*5,
 'failover_s':15+10+5,'backup_loss_s':300,'backup_lost_records':300*20,
 'restore_s':60+180+120,'rto_margin_s':600-(60+180+120),
 'replication_loss_records':20*2,'queue_recovery_s':Fraction(12000,800-600),
 'canary_requests':1000*Fraction(1,20),'remaining_canary_requests':950,
 'full_service_capacity':4*350,'capacity_margin':4*350-1000,
 'hedged_qps':1000*(1+Fraction(1,20)),'request_budget_errors':8640000*Fraction(1,1000)
}
def serial(v):
 return float(v) if isinstance(v,Fraction) and v.denominator!=1 else int(v) if isinstance(v,Fraction) else v
out={k:serial(v) for k,v in n.items()}
assert out['survivor_capacity']>=out['peak_qps']
assert out['retry_amplification']==27 and out['queue_recovery_s']==60
Path('src/data/system-design/reliability-numbers.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
