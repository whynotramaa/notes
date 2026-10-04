import json
import sys
from pathlib import Path
sys.path.remove(str(Path(__file__).resolve().parent))
from fractions import Fraction

source = json.loads(Path('src/data/fundamentals/numbers.json').read_text())['os']
n = dict(source)
n['tlb_hit_ns'] = n['tlb_ns'] + n['memory_ns']
n['tlb_miss_ns'] = n['tlb_ns'] + 2 * n['memory_ns']
n['quota_cpu_fraction'] = Fraction(n['quota_ms'], n['period_ms'])
n['quota_host_fraction'] = n['quota_cpu_fraction'] / n['cores']
n['quota_parallel_wall_ms'] = Fraction(n['quota_ms'], n['cores'])
n['throttled_wall_ms'] = n['period_ms'] - n['quota_parallel_wall_ms']
n['pending_worker_jobs'] = n['ready'] - n['cores']
n['fd_headroom'] = n['fd_limit'] - n['reserved_fd'] - n['connections']
n['permission_owner'] = 4 + 2 + 1
n['permission_group'] = 4 + 1
n['schedule_means'] = {name: round(sum(row['waiting'] for row in data['rows']) / len(data['rows']), 6) for name, data in n['schedules'].items()}
n['switch_fraction_rounded'] = round(n['switch_ms'] / (n['quantum_ms'] + n['switch_ms']), 6)
n['switch_percent_rounded'] = round(n['switch_ms'] / (n['quantum_ms'] + n['switch_ms']) * 100, 6)
n['fifo_hit_positions'] = {str(count): [i + 1 for i, row in enumerate(n['replacement'][f'fifo_{count}']['trace']) if not row['miss']] for count in [3, 4]}
n['exercises'] = {
 'E1': n['connections'] - n['ready'],
 'E2': n['frame'] * n['page_bytes'] + n['offset'],
 'E3': n['virtual_pages'] * n['pte_bytes'],
 'E4': Fraction(9, 10) * n['tlb_hit_ns'] + Fraction(1, 10) * n['tlb_miss_ns'],
 'E5': sum(row['miss'] for row in n['replacement']['fifo_3']['trace']),
 'E6': n['replacement']['fifo_4']['faults'] - n['replacement']['fifo_3']['faults'],
 'E7': (n['cow_pages'] + 1) * n['page_bytes'],
 'E8': n['allocated_pages'] * n['page_bytes'] - n['allocation_bytes'],
 'E9': n['fd_limit'] - n['reserved_fd'],
 'E10': [n['quota_cpu_fraction'], n['quota_host_fraction']],
 'E11': [row['waiting'] for row in n['schedules']['fcfs']['rows']],
 'E12': [row['name'] for row in sorted(n['schedules']['rr']['rows'], key=lambda row: row['completion'])],
 'E16': [n['replacement']['fifo_3']['faults'], n['replacement']['fifo_4']['faults']],
 'E18': n['counter_correct'],
 'E21': [n['cow_pages'] * n['page_bytes'], (n['cow_pages'] + 1) * n['page_bytes']],
 'E22': [row['completion'] - row['arrival'] for row in n['schedules']['fcfs']['rows']],
 'E23': [row['waiting'] for row in n['schedules']['srtf']['rows']],
 'E25': [n['connection_capacity'], n['fd_headroom'], n['pending_worker_jobs'], n['quota_cpu_fraction'], n['quota_host_fraction'], n['quota_parallel_wall_ms'], n['throttled_wall_ms']],
}
assert n['exercises'] == {
 'E1': 980, 'E2': 37972, 'E3': 4194304, 'E4': 120, 'E5': 9, 'E6': 1,
 'E7': 36864, 'E8': 2288, 'E9': 1000, 'E10': [Fraction(1, 2), Fraction(1, 4)],
 'E11': [0, 4, 6], 'E12': ['C', 'B', 'A'], 'E16': [9, 10], 'E18': 12,
 'E21': [32768, 36864], 'E22': [5, 7, 7], 'E23': [4, 1, 0],
 'E25': [1000, 0, 18, Fraction(1, 2), Fraction(1, 4), 25, 75],
}
assert n['tlb_hit_ns'] == 110 and n['tlb_miss_ns'] == 210
assert n['schedule_means'] == {'fcfs': 3.333333, 'sjf': 2.666667, 'srtf': 1.666667, 'rr': 3.333333}
assert n['fifo_hit_positions'] == {'3': [8, 9, 12], '4': [5, 6]}
assert n['permission_owner'] == 7 and n['permission_group'] == 5
assert n['switch_fraction_rounded'] == .047619 and n['switch_percent_rounded'] == 4.761905
assert n['virtual_address'] == n['vpn'] * n['page_bytes'] + n['offset']
assert n['counter_bytes'] * n['counters_per_line'] == n['cache_line_bytes'] == 64
assert n['allocated_pages'] * n['page_bytes'] == 12288
assert n['banker']['work'] == [1, 2, 3, 4]

def numeric(value):
    if isinstance(value, Fraction):
        return int(value) if value.denominator == 1 else float(value)
    if isinstance(value, dict):
        return {key: numeric(item) for key, item in value.items()}
    if isinstance(value, list):
        return [numeric(item) for item in value]
    return value

Path('src/data/fundamentals/os-numbers.json').write_text(json.dumps(numeric(n), indent=2) + '\n')
print('OS running example and numeric exercises computed and asserted.')
