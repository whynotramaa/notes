"""Computed illustrative examples for the database guide correction pass."""
from math import ceil, isclose
import json

events = [("e1", "m7", 1, "u4"), ("e2", "m7", 2, "u8"),
          ("e3", "m7", 3, "u4"), ("e4", "m8", 1, "u9")]
users = [("u4", "Asha"), ("u8", "Bo"), ("u9", "Chen")]
joined = [(event[0], user[1]) for event in events for user in users
          if event[3] == user[0]]
keys = [4, 8, 12, 14, 16, 18, 20, 24]
leaf_before = [12, 14, 16, 18]
leaf_after = sorted(leaf_before + [15])
left, right = leaf_after[:2], leaf_after[2:]
assert left == [12, 14] and right == [15, 16, 18]

outer = sorted(events, key=lambda event: event[3])
inner = sorted(users)
i = j = comparisons = 0
merge_results = []
while i < len(outer) and j < len(inner):
    comparisons += 1
    if outer[i][3] == inner[j][0]:
        merge_results.append((outer[i][0], inner[j][1]))
        i += 1
    elif outer[i][3] < inner[j][0]:
        i += 1
    else:
        j += 1
assert comparisons == 6 and sorted(merge_results) == sorted(joined)

n = {
    "events": events, "users": users, "joined": joined,
    "table_rows": len(events), "distinct_scorers": len({e[3] for e in events}),
    "index_entries": len(events), "base_plus_two_indexes": 1 + 2,
    "btree_height_example": 3, "fanout": 100,
    "ideal_decision_capacity": 100 ** 3,
    "leaf_split": [left, right], "promoted_separator": right[0],
    "range_results": [k for k in keys if 12 <= k <= 20],
    "composite_results": [(e[1], e[2]) for e in events if e[1] == "m7" and e[2] >= 2],
    "covering_payload_bytes": 100_000 * 16,
    "sequential_pages": 10_000 // 100,
    "index_selective_pages": 3 + 10,
    "index_broad_pages_upper": 3 + 8_000,
    "selectivity": 10 / 10_000,
    "plan_row_error": 1_000 / 10,
    "plan_inner_rows": 5 * 100,
    "nested_loop_comparisons": len(events) * len(users),
    "indexed_nested_probes": len(events),
    "hash_operations": len(users) + len(events),
    "join_results": len(joined),
    "merge_key_comparisons": comparisons,
    "merge_results": merge_results,
    "transfer_before": [10_000, 2_000],
    "transfer_after": [10_000 - 2_500, 2_000 + 2_500],
    "lost_update": {"base": 10, "increment": 1, "incorrect": 10 + 1, "correct": 10 + 1 + 1},
    "nonrepeatable": [10, 11], "phantom_counts": [2, 3],
    "write_skew": {"before": [True, True], "after": [False, False], "before_count": 2, "after_count": 0},
    "retained_versions_bytes": 5_000 * 500,
    "wal_record_bytes": 3 * 200,
    "pool_ideal_qps": 20 / 0.01,
    "pool_remote_wait_qps": 20 / (0.01 + 0.09),
    "all_process_connections": 5 * 20,
    "replica_ack_ms": max(4, 7), "replica_applied_ms": max(4, 7, 12),
    "replica_gap_events": 20 * 5, "replica_gap_bytes": 20 * 5 * 200,
    "shard_rates": [100, 100, 800], "shard_total": 100 + 100 + 800,
    "shard_mean": (100 + 100 + 800) / 3,
    "hash_ring_before": {0: "A", 25: "B", 50: "C", 75: "D"},
    "hash_ring_after": {0: "A", 25: "B", 50: "C", 60: "E", 75: "D"},
    "ring_moved_keys": [55, 58], "ring_sample_keys": [10, 30, 55, 58, 70, 90],
    "ring_moved_fraction": 2 / 6, "ideal_equal_owner_fraction": 1 / 5,
    "reshard_copy_seconds": 1_000_000 / 10_000,
    "reshard_backlog": (20 - 15) * 60,
    "reshard_drain_seconds": 300 / (40 - 20),
    "batch_events": 10, "daily_bytes": 8_640_000 * 500,
    "retained_bytes": 8_640_000 * 500 * 30,
    "three_copy_bytes": 8_640_000 * 500 * 30 * 3,
    "max_pool_waits": ceil(100 / 20) - 1,
}
assert sum(n["transfer_before"]) == sum(n["transfer_after"]) == 12_000
assert n["range_results"] == [12, 14, 16, 18, 20]
assert n["nested_loop_comparisons"] == 12 and n["hash_operations"] == 7
assert n["composite_results"] == [("m7", 2), ("m7", 3)]
assert isclose(n["pool_remote_wait_qps"], 200)

def owner(ring, key):
    return ring[next((position for position in sorted(ring) if position >= key), min(ring))]

moved = [k for k in n["ring_sample_keys"]
         if owner(n["hash_ring_before"], k) != owner(n["hash_ring_after"], k)]
assert moved == n["ring_moved_keys"]
print(json.dumps(n, indent=2))
