from pathlib import Path
import json

root = Path(__file__).resolve().parents[2]
n = json.loads((root / 'src/data/fundamentals/numbers.json').read_text())['cn']
v = {
    'ipv4_header_bytes': 20,
    'tcp_header_bytes': 20,
    'udp_header_bytes': 8,
    'port_bits': 16,
    'port_values': 2 ** 16,
    'client_port': 51000,
    'public_port': 40001,
    'https_port': 443,
    'dns_ttl_seconds': 300,
    'dns_age_seconds': 120,
    'bucket_capacity_packets': 50,
    'bucket_rate_packets_s': 25,
    'rr_requests': 9,
    'rr_targets': 3,
    'point_to_point_31_hosts': 2 ** (32 - 31),
    'host_route_32_addresses': 2 ** (32 - 32),
    'transfer_payload_bytes': 146000,
    'selective_repeat_sequence_bits': 3,
    'trace_hops': 2,
    'initial_hop_limit': 64,
    'inflight_segments': 4,
    'crc_data': '1101',
    'crc_generator': '1011'
}
v['dns_remaining_seconds'] = v['dns_ttl_seconds'] - v['dns_age_seconds']
v['bucket_fill_seconds'] = v['bucket_capacity_packets'] / v['bucket_rate_packets_s']
v['queue_free_link_ms'] = round(n['one_link_delay_ms'] - n['queue_ms'], 2)
v['rr_counts'] = [v['rr_requests'] // v['rr_targets']] * v['rr_targets']
v['ipv4_overhead_bytes'] = v['ipv4_header_bytes'] + v['tcp_header_bytes']
v['frame_overhead_bytes'] = n['ethernet_frame_bytes'] - n['packet_bytes']
v['tag_bytes'] = n['tagged_frame_bytes'] - n['ethernet_frame_bytes']
v['cwnd_gain'] = n['cwnd'][-1] // n['cwnd'][0]
v['window_missing_bytes'] = int(n['bdp_bytes']) - n['window_bytes']
v['window_required_segments'] = (int(n['bdp_bytes']) + n['tcp_payload_bytes'] - 1) // n['tcp_payload_bytes']
v['window_too_few_segments'] = v['window_required_segments'] - 1
v['window_too_few_bytes'] = v['window_too_few_segments'] * n['tcp_payload_bytes']
v['window_rounded_bytes'] = v['window_required_segments'] * n['tcp_payload_bytes']
v['packet_bits'] = n['packet_bytes'] * 8
v['tcp_payload_bits'] = n['tcp_payload_bytes'] * 8
v['window_payload_bits'] = n['window_bytes'] * 8
v['window_percent'] = n['window_bytes'] / int(n['bdp_bytes']) * 100
v['host_bits'] = n['ipv4_bits'] - 26
v['crc_division_trace'] = []
crc_work = int(v['crc_codeword'], 2) if 'crc_codeword' in v else int(v['crc_data'] + n['crc'], 2)
crc_divisor = int(v['crc_generator'], 2)
while crc_work.bit_length() >= crc_divisor.bit_length():
    aligned = crc_divisor << (crc_work.bit_length() - crc_divisor.bit_length())
    crc_work ^= aligned
    v['crc_division_trace'].append([format(aligned, 'b'), format(crc_work, 'b')])
v['window_fraction'] = n['window_bytes'] / int(n['bdp_bytes'])
v['payload_segments'] = v['transfer_payload_bytes'] // n['tcp_payload_bytes']
v['transfer_ip_bytes'] = v['payload_segments'] * n['packet_bytes']
v['transfer_frame_bytes'] = v['payload_segments'] * n['ethernet_frame_bytes']
v['transfer_tagged_bytes'] = v['payload_segments'] * n['tagged_frame_bytes']
v['after_four_segments'] = n['syn_next'] + v['inflight_segments'] * n['tcp_payload_bytes']
v['after_fin'] = n['after_data'] + 1
v['hop_limit_after'] = v['initial_hop_limit'] - v['trace_hops']
v['selective_repeat_sequence_values'] = 2 ** v['selective_repeat_sequence_bits']
v['selective_repeat_max_window'] = v['selective_repeat_sequence_values'] // 2
v['cold_rtts'] = n['cold_handshake_ms'] // n['rtt_ms']
v['warm_first_response_ms'] = n['rtt_ms']
v['cold_saved_ms'] = n['cold_handshake_ms'] - v['warm_first_response_ms']
v['subnet_offset'] = int(n['client_ip'].split('.')[-1]) - int(n['network'].split('.')[-1])
v['gateway_offset'] = int(n['gateway'].split('.')[-1]) - int(n['network'].split('.')[-1])
v['crc_codeword'] = v['crc_data'] + n['crc']
v['crc_check_width'] = len(v['crc_generator']) - 1
v['crc_codeword_bits'] = len(v['crc_codeword'])
remainder = int(v['crc_codeword'], 2)
divisor = int(v['crc_generator'], 2)
while remainder.bit_length() >= divisor.bit_length():
    remainder ^= divisor << (remainder.bit_length() - divisor.bit_length())
v['crc_receiver_remainder'] = remainder
assert v['port_values'] == 65536
assert n['packet_bytes'] - v['ipv4_overhead_bytes'] == n['tcp_payload_bytes'] == 1460
assert n['packet_bytes'] - v['ipv4_header_bytes'] - v['udp_header_bytes'] == n['udp_payload_bytes'] == 1472
assert v['dns_remaining_seconds'] == n['dns_ttl_remaining'] == 180
assert v['bucket_fill_seconds'] == n['token_seconds'] == 2
assert v['queue_free_link_ms'] == 5.17
assert v['rr_counts'] == n['rr_counts'] == [3, 3, 3]
assert v['frame_overhead_bytes'] == 18 and v['tag_bytes'] == 4
assert v['window_missing_bytes'] == 436000
assert v['window_required_segments'] == 343 and v['window_rounded_bytes'] == 500780
assert v['host_bits'] == 6 and v['window_percent'] == 12.8
assert v['window_too_few_segments'] == 342 and v['window_too_few_bytes'] == 499320
assert v['crc_division_trace'] == [['1011000', '110001'], ['101100', '11101'], ['10110', '1011'], ['1011', '0']]
assert v['window_fraction'] == 0.128 and v['cwnd_gain'] == 8
assert v['payload_segments'] == 100
assert (v['transfer_ip_bytes'], v['transfer_frame_bytes'], v['transfer_tagged_bytes']) == (150000, 151800, 152200)
assert v['after_four_segments'] == 6841 and v['after_fin'] == 2462
assert v['hop_limit_after'] == 62
assert v['selective_repeat_max_window'] == 4
assert v['cold_rtts'] == 3 and v['cold_saved_ms'] == 80
assert v['subnet_offset'] == 6 and v['gateway_offset'] == 1
assert v['crc_codeword'] == '1101001' and v['crc_receiver_remainder'] == 0
(root / 'src/data/fundamentals/cn-extra-numbers.json').write_text(json.dumps(v, indent=2) + '\n')
print(json.dumps(v, indent=2))
