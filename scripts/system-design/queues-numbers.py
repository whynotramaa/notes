import json
import random
import sys
from pathlib import Path
sys.path.remove(str(Path(__file__).resolve().parent))
from fractions import Fraction as F


def f(v):
    if isinstance(v, F):
        return int(v) if v.denominator == 1 else round(float(v), 6)
    return v


arrival = 6
service_s = 30
workers = 200
capacity = F(workers, service_s)
upload_s = F(15, 100)
burst_rate, burst_s = 40, 120
burst_arrivals = burst_rate * burst_s
burst_served = capacity * burst_s
backlog = burst_arrivals - burst_served
drain_200 = backlog / (capacity - arrival)
cap_300 = F(300, service_s)
drain_300 = backlog / (cap_300 - arrival)
wait_at_peak = backlog / capacity

events_s, event_bytes, subscribers = 20, 200, 3
retention_days = 7
retained_events = events_s * 86400 * retention_days

partitions = 12
groups = {c: [partitions // c + (1 if i < partitions % c else 0) for i in range(min(c, partitions))] for c in [1, 4, 5, 6, 12, 16]}
hot_share = F(3, 10)
hot_rate = events_s * hot_share
cold_rate = (events_s - hot_rate) / (partitions - 1)
consumer_partition_rate = 5
hot_lag_hour = (hot_rate - consumer_partition_rate) * 3600


def safe_commit(done, start):
    pos = start
    while pos in done:
        pos += 1
    return pos


done = {7, 9}
commit = safe_commit(done, 7)
replayed_after_crash = sorted(x for x in done if x >= commit)

timeout_s, p99_s = 60, 75
attempt_delays = [1 * 2 ** i for i in range(5)]
retry_total = sum(attempt_delays)
random.seed(7)
jitter_sample = [round(random.uniform(0, d), 3) for d in attempt_delays]

poison_attempts = 5
poison_block_s = poison_attempts * service_s + retry_total
per_partition_rate = F(events_s, partitions)
poison_backlog = per_partition_rate * poison_block_s

peak_hour_jobs = arrival * 3600
ack_loss = F(1, 1000)
dup_per_hour = peak_hour_jobs * ack_loss
day_jobs = arrival * 86400
key_bytes = 64
dedupe_days = 7
dedupe_keys = day_jobs * dedupe_days
dedupe_bytes = dedupe_keys * key_bytes

prefetch = 10
transient_rate = F(2, 100)
outbox_poll_ms, outbox_batch = 500, 100
outbox_max_rate = outbox_batch * 1000 // outbox_poll_ms

message_bytes = 1000
backlog_bytes = backlog * message_bytes
credit = 50

n = {
    'arrival_s': arrival, 'service_s': service_s, 'workers': workers, 'capacity_s': capacity,
    'utilization': F(arrival) / capacity, 'sync_inflight': arrival * service_s,
    'upload_s': upload_s, 'async_inflight': arrival * upload_s,
    'burst_rate': burst_rate, 'burst_s': burst_s, 'burst_arrivals': burst_arrivals,
    'burst_served': burst_served, 'backlog': backlog, 'drain_200_s': drain_200,
    'drain_200_min': drain_200 / 60, 'cap_300_s': cap_300, 'drain_300_s': drain_300,
    'drain_300_min': drain_300 / 60, 'wait_at_peak_s': wait_at_peak,
    'backlog_bytes': backlog_bytes, 'message_bytes': message_bytes,
    'events_s': events_s, 'event_bytes': event_bytes, 'subscribers': subscribers,
    'fanout_deliveries_s': events_s * subscribers, 'retained_events': retained_events,
    'retained_bytes': retained_events * event_bytes, 'partitions': partitions,
    'group_assignments': groups, 'hot_share': hot_share, 'hot_rate': hot_rate,
    'cold_rate': cold_rate, 'consumer_partition_rate': consumer_partition_rate,
    'hot_lag_hour': hot_lag_hour, 'done_offsets': sorted(done), 'safe_commit': commit,
    'replayed_after_crash': replayed_after_crash, 'timeout_s': timeout_s, 'p99_s': p99_s,
    'attempt_delays': attempt_delays, 'retry_total_s': retry_total,
    'retry_mean_jitter_s': F(retry_total, 2), 'jitter_sample': jitter_sample,
    'poison_attempts': poison_attempts, 'poison_block_s': poison_block_s,
    'per_partition_rate': per_partition_rate, 'poison_backlog': poison_backlog,
    'peak_hour_jobs': peak_hour_jobs, 'dup_per_hour': dup_per_hour, 'day_jobs': day_jobs,
    'dedupe_keys': dedupe_keys, 'dedupe_bytes': dedupe_bytes, 'key_bytes': key_bytes,
    'prefetch': prefetch, 'transient_failures_hour': peak_hour_jobs * transient_rate,
    'outbox_poll_ms': outbox_poll_ms, 'outbox_batch': outbox_batch,
    'outbox_max_rate': outbox_max_rate, 'credit': credit,
    'credit_inflight_s': F(credit, 1) / capacity,
}
exercise_values = {
    'E1': arrival * service_s,
    'E2': arrival * upload_s,
    'E3': [capacity, F(arrival) / capacity],
    'E4': events_s * 4,
    'E5': events_s * 86400 * 14 * event_bytes,
    'E6': [partitions // 8 + (i < partitions % 8) for i in range(8)],
    'E7': [events_s * F(4, 10), (events_s * F(4, 10) - consumer_partition_rate) * 3600],
    'E8': [safe_commit({20, 21, 23, 24}, 20), 23, 24],
    'E9': [F(1, 2) * 3 ** i for i in range(4)],
    'E10': [(30 - capacity) * 300, (30 - capacity) * 300 / (capacity - arrival)],
    'E11': (F(4000, 600) + arrival) * service_s,
    'E12': F(7000) / capacity,
    'E13': day_jobs * 30 * key_bytes,
    'E14': day_jobs * ack_loss,
    'E15': [3 * service_s + sum([1, 2, 4]), per_partition_rate * (3 * service_s + 7)],
    'E16': [F(50 * 1000, 250), F(250, 1000)],
    'E22': F(4000) / (capacity - F(95, 100) * capacity),
    'E25': [F(12 * 20, 1) / F(8, 10), (60 - F(300, 20)) * 60, F(2700, 1) / (F(300, 20) - 12), 12 * 86400 * 7 * key_bytes],
}
expected_exercises = {
    'E1': 180, 'E2': F(9, 10), 'E3': [F(20, 3), F(9, 10)],
    'E4': 80, 'E5': 4838400000, 'E6': [2, 2, 2, 2, 1, 1, 1, 1],
    'E7': [8, 10800], 'E8': [22, 23, 24], 'E9': [F(1, 2), F(3, 2), F(9, 2), F(27, 2)],
    'E10': [7000, 10500], 'E11': 380, 'E12': 1050, 'E13': 995328000,
    'E14': F(2592, 5), 'E15': [97, F(485, 3)], 'E16': [200, F(1, 4)],
    'E22': 12000, 'E25': [300, 2700, 900, 464486400],
}
assert exercise_values == expected_exercises
assert sum(exercise_values['E9']) == 20
assert exercise_values['E10'][1] / 60 == 175
n['exercises'] = {key: [f(x) for x in value] if isinstance(value, list) else f(value) for key, value in exercise_values.items()}
n['score_service_s'] = F(5, 1000)
n['score_backlog_work_s'] = backlog * n['score_service_s']
assert n['score_backlog_work_s'] == 20

out = {k: ({c: v for c, v in x.items()} if isinstance(x, dict) else [f(y) for y in x] if isinstance(x, list) else f(x)) for k, x in n.items()}
assert out['backlog'] == 4000 and out['drain_200_s'] == 6000 and out['drain_300_s'] == 1000
assert out['wait_at_peak_s'] == 600 and out['safe_commit'] == 8 and out['retry_total_s'] == 31
Path('src/data/system-design/queues-numbers.json').write_text(json.dumps(out, indent=2) + '\n')
print(json.dumps(out, indent=2))
