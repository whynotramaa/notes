import json
import math
from ipaddress import IPv4Address, IPv4Network
from pathlib import Path

n = json.loads(Path('src/data/fundamentals/numbers.json').read_text())['cn']
net = IPv4Network('192.168.10.64/26')
work = list(map(int, '1101' + '000'))
generator = list(map(int, '1011'))
steps = []
for i in range(4):
    if work[i]:
        for j, bit in enumerate(generator):
            work[i+j] ^= bit
        steps.append(''.join(map(str, work)))
remainder = ''.join(map(str, work[-3:]))
codeword = '1101' + remainder
check = list(map(int, codeword))
for i in range(4):
    if check[i]:
        for j, bit in enumerate(generator):
            check[i+j] ^= bit
values = {
    'crc_data': '1101', 'crc_generator': '1011', 'crc_steps': steps,
    'crc_remainder': remainder, 'crc_codeword': codeword,
    'crc_received_remainder': ''.join(map(str, check[-3:])),
    'ipv4_header_bytes': 20, 'tcp_header_bytes': 20,
    'ethernet_header_bytes': 14, 'fcs_bytes': 4, 'vlan_tag_bytes': 4,
    'frame_bytes': 14 + n['packet_bytes'] + 4,
    'tcp_payload_bytes': n['packet_bytes'] - 20 - 20,
    'tagged_bytes': 14 + n['packet_bytes'] + 4 + 4,
    'network_mask': str(net.netmask), 'client_last_octet_binary': format(70, '08b'),
    'mask_last_octet_binary': format(192, '08b'), 'network_last_octet_binary': format(70 & 192, '08b'),
    'remaining_24_addresses': 256 - 64,
    'aggregate': str(IPv4Network('192.168.10.0/26').supernet(prefixlen_diff=1)),
    'snr_linear': 15, 'signal_bandwidth_hz': 1000000, 'symbol_levels': 4,
    'shannon_bps': 1000000 * math.log2(1 + 15),
    'nyquist_bps': 2 * 1000000 * math.log2(4),
    'mac_octets': 48 // 8, 'nat_private_port': 51000, 'nat_public_port': 40001,
    'https_port': 443, 'illustrative_start_ttl': 64, 'ttl_after_gateway': 64 - 1,
    'route_prefixes': ['10.0.0.0/8', '10.1.0.0/16', '10.1.2.0/24'],
    'route_destination': '10.1.2.50', 'switch_ports': [1, 2, 3], 'vlan_ids': [10, 20],
}
assert remainder == n['crc'] == '001' and codeword == '1101001'
assert steps == ['0110000', '0011100', '0001010', '0000001']
assert values['crc_received_remainder'] == '000'
assert values['frame_bytes'] == n['ethernet_frame_bytes'] == 1518
assert values['tagged_bytes'] == n['tagged_frame_bytes'] == 1522
assert values['tcp_payload_bytes'] == n['tcp_payload_bytes'] == 1460
assert values['network_mask'] == '255.255.255.192'
assert values['client_last_octet_binary'] == '01000110'
assert values['network_last_octet_binary'] == '01000000'
assert values['remaining_24_addresses'] == 192 and values['aggregate'] == '192.168.10.0/25'
assert values['shannon_bps'] == values['nyquist_bps'] == 4000000
assert values['mac_octets'] == 6 and values['ttl_after_gateway'] == 63
assert all(IPv4Address(values['route_destination']) in IPv4Network(p) for p in values['route_prefixes'])
Path('src/data/fundamentals/cn-early-numbers.json').write_text(json.dumps(values, indent=2) + '\n')
print(json.dumps(values, indent=2))
