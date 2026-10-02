import math
import struct
from pathlib import Path

HERE = Path(__file__).parent
BW, PEAK, HBM = 3.35e12, 989.4e12, 80e9


def sec(t):
    print(f'\n== {t}')


def bf16_row(path):
    b = path.read_bytes()
    return [struct.unpack('<f', b'\x00\x00' + b[i:i + 2])[0] for i in range(0, len(b), 2)]


def llama_ledger(V, d, L, H, Hkv, dh, f, tied):
    layer = d * H * dh + 2 * d * Hkv * dh + H * dh * d + 3 * d * f + 2 * d
    return V * d, layer, V * d * (1 if tied else 2) + L * layer + d


sec('models')
F24 = dict(V=32000, d=512, L=8, H=8, Hkv=2, dh=64, f=1536)
Q3 = dict(V=151936, d=1024, L=28, H=16, Hkv=8, dh=128, f=3072)
L3 = dict(V=128256, d=4096, L=32, H=32, Hkv=8, dh=128, f=14336)
emb, layer, tot = llama_ledger(**F24, tied=True)
print('finch24', emb, layer, tot)
q_emb = Q3['V'] * Q3['d']
q_layer_parts = dict(q=1024 * 2048, k=1024 * 1024, v=1024 * 1024, o=2048 * 1024, q_norm=128, k_norm=128,
                     gate=1024 * 3072, up=1024 * 3072, down=3072 * 1024, in_norm=1024, post_norm=1024)
q_layer = sum(q_layer_parts.values())
q_tot = q_emb + 28 * q_layer + 1024
print('qwen3 parts', q_layer_parts)
print('qwen3 emb', q_emb, 'layer', q_layer, 'layers', 28 * q_layer, 'unique', q_tot, 'non-emb', q_tot - q_emb)
print('qwen3 attn/layer', sum(q_layer_parts[k] for k in 'q k v o q_norm k_norm'.split()), 'mlp/layer', 3 * 1024 * 3072)
print('qwen3 file params', q_tot + q_emb, 'bytes', 2 * (q_tot + q_emb))
print('qwen3 bytes bf16 unique', 2 * q_tot, 'fp32', 4 * q_tot)
l_emb, l_layer, l_tot = llama_ledger(**L3, tied=False)
print('llama3 8B', l_emb, l_layer, l_tot, 'matmul params', l_tot - l_emb - 4096 - 32 * 8192)
print('qwen3 head_dim from hidden/heads', 1024 // 16, 'actual 128; q out', 16 * 128, 'kv out', 8 * 128, 'group', 16 // 8)
print('vocab rows unused', 151936 - 151669)

sec('safetensors header')
hdr, data = 35552, 1503264768
print('file', 8 + hdr + data, 'tensors', 28 * 11 + 3, 'lm_head dup bytes', 2 * q_emb, 'share', 2 * q_emb / (8 + hdr + data))
print('per layer bytes', 2 * q_layer)

sec('kv cache per token')
kv = lambda m, b=2: 2 * m['L'] * m['Hkv'] * m['dh'] * b
for n, m in [('finch24', F24), ('qwen3', Q3), ('llama3', L3)]:
    print(n, kv(m), 'B/token')
print('qwen3 per layer per token', 2 * 8 * 128 * 2, 'per kv head per layer', 2 * 128 * 2)
for T in [26, 4096, 32768, 40960]:
    print('qwen3 T', T, kv(Q3) * T, kv(Q3) * T / 2**30, 'GiB')
print('qwen3 MHA 16 heads', 2 * 28 * 16 * 128 * 2, 'MQA', 2 * 28 * 1 * 128 * 2)
print('qwen3 32k MHA GiB', 2 * 28 * 16 * 128 * 2 * 32768 / 2**30, 'GQA', kv(Q3) * 32768 / 2**30, 'MQA', 2 * 28 * 128 * 2 * 32768 / 2**30)
print('qwen3 tokens of cache equal to weights', 2 * q_tot / kv(Q3))
print('llama3 8k, 32k, 128k GiB', [kv(L3) * t / 2**30 for t in (8192, 32768, 131072)])
print('qwen3 cache shapes K per layer (B,8,T,128); fp8 cache per token', kv(Q3, 1))

sec('naive vs cached work')
P, n = 1000, 500
naive = n * P + n * (n - 1) // 2
cached = P + n - 1
print('naive token-forwards', naive, 'cached', cached, 'ratio', naive / cached)
print('naive K/V rows recomputed per layer', naive - cached)

sec('llama3 8B prefill and decode lower bounds, H100 SXM')
Pm = l_tot - l_emb
print('matmul params', Pm, 'bytes', 2 * Pm)
def attn_flops(T, L=32, H=32, dh=128):
    return L * 4 * H * dh * T * (T + 1) // 2
for T in [128, 2048, 8192, 32768]:
    fl = 2 * Pm * T + attn_flops(T)
    print('prefill T', T, 'flops', fl, 'ms', fl / PEAK * 1e3, 'attn share', attn_flops(T) / fl, 'bytes', 2 * Pm + kv(L3) * T, 'mem ms', (2 * Pm + kv(L3) * T) / BW * 1e3)
dec = 2 * Pm / BW
print('decode weights only ms', dec * 1e3, 'tok/s', 1 / dec)
for ctx in [2048, 8192, 32768, 131072]:
    b = 2 * Pm + kv(L3) * ctx
    print('decode ctx', ctx, 'bytes', b, 'ms', b / BW * 1e3, 'tok/s', BW / b)
print('ridge FLOP/byte', PEAK / BW, 'decode intensity', 2 * Pm / (2 * Pm))
ctx = 2048
for B in [1, 8, 32, 64, 128, 238]:
    bytes_ = 2 * Pm + B * kv(L3) * ctx
    fl = B * (2 * Pm + 4 * 32 * 32 * 128 * ctx)
    t = max(bytes_ / BW, fl / PEAK)
    print('batch', B, 'mem GB', (2 * l_tot + B * kv(L3) * ctx) / 1e9, 'ms', t * 1e3, 'bound', 'mem' if bytes_ / BW > fl / PEAK else 'compute', 'agg tok/s', B / t, 'per-seq tok/s', 1 / t)
print('max batch at 2048 in 80 GB', (HBM - 2 * l_tot) / (kv(L3) * ctx))
print('qwen3 decode weights ms', 2 * q_tot / BW * 1e3, 'tok/s', BW / (2 * q_tot))

sec('latency vs throughput example')
ttft, itl, out = 0.040, 0.005, 200
print('total ms', (ttft + (out - 1) * itl) * 1e3)

sec('float formats')
for name, e, m in [('fp32', 8, 23), ('fp16', 5, 10), ('bf16', 8, 7)]:
    bias = 2**(e - 1) - 1
    mx = (2 - 2**-m) * 2**(2**e - 2 - bias)
    mn = 2**(1 - bias)
    print(name, 'max', mx, 'min normal', mn, 'eps', 2**-m, 'spacing at 12', 2**(3 - m))
print('bf16 of 0.1', struct.unpack('>f', struct.pack('>f', 0.1)[:2] + b'\x00\x00')[0])

sec('symmetric int8 worked example')
x = [0.817, -1.273, 0.046, 2.54, -0.309, 1.128]
s = max(abs(v) for v in x) / 127
q = [round(v / s) for v in x]
xh = [qi * s for qi in q]
print('scale', s, 'q', q, 'xhat', [round(v, 4) for v in xh], 'err', [round(a - b, 4) for a, b in zip(x, xh)])
print('max err bound', s / 2)
s4 = max(abs(v) for v in x) / 7
q4 = [round(v / s4) for v in x]
print('int4 scale', s4, 'q', q4, 'xhat', [round(v * s4, 4) for v in q4], 'err', [round(a - b * s4, 4) for a, b in zip(x, q4)])

sec('asymmetric uint8 worked example')
a = [-0.28, 0.0, 0.41, 1.93, 3.70]
lo, hi = min(a), max(a)
sa = (hi - lo) / 255
z = round(-lo / sa)
qa = [min(255, max(0, round(v / sa) + z)) for v in a]
print('scale', sa, 'zero', z, 'q', qa, 'xhat', [round((qi - z) * sa, 4) for qi in qa], 'err', [round(v - (qi - z) * sa, 5) for v, qi in zip(a, qa)])
ss = hi / 127
print('symmetric scale on same', ss, 'codes used', round(hi / ss) - round(lo / ss) + 1, 'of 256', 'q', [round(v / ss) for v in a])
print('asym step vs sym step', sa, ss)

sec('real qwen3 q_proj row, layer 0, row 0')
w = bf16_row(HERE / 'qwen3_q_proj_row0.bf16')
print('n', len(w), 'absmax', max(map(abs, w)), 'mean abs', sum(map(abs, w)) / len(w), 'rms', math.sqrt(sum(v * v for v in w) / len(w)))
srt = sorted(map(abs, w))
print('median abs', srt[len(srt) // 2], 'p99', srt[int(0.99 * len(srt))], 'top5', srt[-5:])
def quant(vals, bits, group):
    qmax = 2**(bits - 1) - 1
    out = []
    for i in range(0, len(vals), group):
        g = vals[i:i + group]
        sc = max(map(abs, g)) / qmax
        out += [max(-qmax - 1, min(qmax, round(v / sc))) * sc for v in g]
    err = [abs(a - b) for a, b in zip(vals, out)]
    rel = math.sqrt(sum((a - b)**2 for a, b in zip(vals, out)) / sum(a * a for a in vals))
    zeros = sum(1 for a, b in zip(vals, out) if b == 0 and a != 0)
    return max(err), sum(err) / len(err), rel, zeros
for bits, g in [(8, 1024), (4, 1024), (4, 128), (4, 32)]:
    print(f'int{bits} group {g}', quant(w, bits, g), 'bits/param', bits + 16 / g)
print('group absmax 128', [round(max(map(abs, w[i:i + 128])), 4) for i in range(0, 1024, 128)])
print('first 8', w[:8])

sec('model sizes')
for name, P in [('qwen3', q_tot), ('llama3', l_tot)]:
    print(name, 'fp32', 4 * P / 1e9, 'bf16', 2 * P / 1e9, 'int8', P / 1e9, 'int4 g128', P * (4 + 16 / 128) / 8 / 1e9)
print('llama3 int8 weight-only decode ms', Pm / BW * 1e3, 'naive dequant bytes/weight 5 ms', 5 * Pm / BW * 1e3)
print('llama3 int4 g128 decode ms', Pm * 4.125 / 8 / BW * 1e3)
print('llama3 int8 + bf16 embedding in GB', (Pm + 2 * l_emb) / 1e9)

sec('parity example')
ref = [14.8125, 13.9375, 9.25, -2.125, 7.6875]
mine = [14.8130, 13.9361, 9.2503, -2.1243, 7.6890]
d = [abs(a - b) for a, b in zip(ref, mine)]
print('max abs', max(d), 'mean abs', sum(d) / len(d), 'rel max', max(x / max(abs(r), 1e-6) for x, r in zip(d, ref)))
def softmax(v):
    m = max(v); e = [math.exp(t - m) for t in v]; s_ = sum(e); return [t / s_ for t in e]
pr, pm = softmax(ref), softmax(mine)
print('probs ref', [round(t, 5) for t in pr], 'mine', [round(t, 5) for t in pm])
print('KL', sum(p * math.log(p / q_) for p, q_ in zip(pr, pm)))
print('margin top1-top2', ref[0] - ref[1])

sec('rmsnorm eps sensitivity')
xv = [3e-3, -4e-3]
for eps in (1e-6, 1e-5):
    r = math.sqrt((xv[0]**2 + xv[1]**2) / 2 + eps)
    print('eps', eps, [v / r for v in xv])

sec('position ids')
print('prompt 26 -> positions 0..25, first new token position', 26, 'then', 27)

sec('cached attention toy, one head, d_h = 2')
Kc, Vc = [[1, 0], [0, 1], [1, 1]], [[1, 2], [3, 0], [0, 4]]
qn, kn, vn = [2, 1], [1, -1], [2, 2]
K, Vv = Kc + [kn], Vc + [vn]
sc = [sum(a * b for a, b in zip(qn, k)) / math.sqrt(2) for k in K]
w = softmax(sc)
o = [sum(wi * v[j] for wi, v in zip(w, Vv)) for j in range(2)]
print('raw', [sum(a * b for a, b in zip(qn, k)) for k in K], 'scaled', [round(t, 4) for t in sc], 'weights', [round(t, 4) for t in w], 'out', [round(t, 4) for t in o])

sec('split-KV merge (flash-decoding) on the same toy')
def partial(scs, vs):
    m = max(scs); e = [math.exp(t - m) for t in scs]; l_ = sum(e)
    return m, l_, [sum(ei * v[j] for ei, v in zip(e, vs)) / l_ for j in range(2)]
m1, l1, o1 = partial(sc[:2], Vv[:2])
m2, l2, o2 = partial(sc[2:], Vv[2:])
m = max(m1, m2); a1, a2 = l1 * math.exp(m1 - m), l2 * math.exp(m2 - m)
print('chunk1', round(m1, 4), round(l1, 4), [round(t, 4) for t in o1], 'chunk2', round(m2, 4), round(l2, 4), [round(t, 4) for t in o2])
print('weights', round(a1, 4), round(a2, 4), 'merged', [round((a1 * x + a2 * y) / (a1 + a2), 4) for x, y in zip(o1, o2)])
print('score matrix llama3 32k one layer GiB', 32 * 32768**2 * 2 / 2**30, 'decode row bytes', 32 * 32768 * 2)
print('prefill tokens/s lower bound 2048', 2048 / 0.03218134218233273)

sec('loading memory, qwen3-0.6B')
print('q_proj L0 bytes', 651694592 - 647500288, 'expected', 2048 * 1024 * 2)
print('fused qkv rows', 2048 + 1024 + 1024, 'fused params', 4096 * 1024)
fp32_model = 4 * q_tot
print('naive: fp32 random model', fp32_model, '+ full state dict', data, '=', fp32_model + data)
print('meta + bf16 + skip lm_head', 2 * q_tot, 'meta + bf16 full file in RAM', data)
print('fp32 model after load', fp32_model)

sec('fp32 non-associativity')
f32 = lambda v: struct.unpack('<f', struct.pack('<f', v))[0]
a_, b_, c_ = f32(1e8), f32(1.0), f32(-1e8)
print('(a+b)+c', f32(f32(a_ + b_) + c_), 'a+(b+c)', f32(a_ + f32(b_ + c_)), '(a+c)+b', f32(f32(a_ + c_) + b_), 'spacing at 1e8', 2.0**(26 - 23))
print('logits per prompt', 26 * 151936)

sec('chat template costs')
print('system 11 tokens cache bytes', 11 * kv(Q3), 'tool system block 138 tokens', 138 * kv(Q3))
mask = [0] * 11 + [1] * 15
print('left-padded row positions (cumsum - 1, pads filled with 1)', [sum(mask[:i + 1]) - 1 if m_ else 1 for i, m_ in enumerate(mask)])
print('thinking off extra tokens', 30 - 26, 'multi-turn', 42)

sec('qwen3 end to end, 26-token prompt')
body = 28 * (q_layer - 2048 - 256)
attn26 = 28 * 4 * 16 * 128 * 26 * 27 // 2
pre = 2 * body * 26 + attn26 + 2 * q_emb
print('matmul params per layer', q_layer - 2304, 'body', body, 'prefill flops', pre, 'GFLOP', pre / 1e9, 'H100 ms', pre / PEAK * 1e3)
print('cache after prefill', 26 * kv(Q3))
print('decode lower bound H100 ms', 2 * q_tot / BW * 1e3, 'laptop 100 GB/s ms', 2 * q_tot / 100e9 * 1e3, 'tok/s', 100e9 / (2 * q_tot))
print('load 1.5 GB at 3 GB/s s', 1503300328 / 3e9)
print('prompt characters', len('<|im_start|>system\nYou are a helpful assistant.<|im_end|>\n<|im_start|>user\nWhat is the capital of France?<|im_end|>\n<|im_start|>assistant\n'))
print('laptop int4 speedup', 2 * q_tot / (q_tot * 4.125 / 8))

sec('exercises')
print('E1', 2 * Pm / 1e12 * 1e3, 'ms', 1e12 / (2 * Pm), 'tok/s')
P2, n2 = 200, 100
print('E2', n2 * P2 + n2 * (n2 - 1) // 2, P2 + n2 - 1, (n2 * P2 + n2 * (n2 - 1) // 2) / (P2 + n2 - 1))
print('E3', 120 + 299 * 8)
print('E5', 2 * 32 * 8 * 128 * 2, 2 * 32 * 8 * 128 * 2 * 32768 / 2**30)
print('E6', 114688 * 8192, (24e9 - 2 * q_tot) / (114688 * 8192))
print('E9', end=' ')
a1, a2 = 1.5 * math.exp(-1), 2.0
print(round(a1, 4), [round(a1 / (a1 + a2), 4), round(a2 / (a1 + a2), 4)])
print('E10', 16 * 32768**2 * 2, 16 * 32768**2 * 2 / 2**30)
x11 = [0.91, -0.3, 0.15, -1.8]; s11 = 1.8 / 127
q11 = [round(v / s11) for v in x11]
print('E11', s11, [v / s11 for v in x11], q11, [round(q * s11, 4) for q in q11], [round(v - q * s11, 4) for v, q in zip(x11, q11)])
x12 = [-1.0, 0.5, 2.0, 6.0]; s12 = 7 / 255; z12 = round(1 / s12)
q12 = [min(255, max(0, round(v / s12) + z12)) for v in x12]
print('E12', s12, 1 / s12, z12, q12, [round((q - z12) * s12, 4) for q in q12], [round(v - (q - z12) * s12, 4) for v, q in zip(x12, q12)])
print('E14', (q_tot - q_emb) * 4.125 / 8, 2 * q_emb, (q_tot - q_emb) * 4.125 / 8 + 2 * q_emb)
p17, q17 = [0.7, 0.2, 0.1], [0.6, 0.3, 0.1]
print('E17', sum(a * math.log(a / b) for a, b in zip(p17, q17)))
l18 = 2048 * 2048 + 2 * 2048 * 1024 + 2048 * 2048 + 256 + 3 * 2048 * 6144 + 2 * 2048
print('E18 layer', l18, 'layers', 28 * l18, 'emb', 151936 * 2048, 'total', 28 * l18 + 151936 * 2048 + 2048, 'non-emb', 28 * l18 + 2048)
print('E21 rows', 4096 + 1024 + 1024)
print('E22', (4 * l_tot + 2 * l_tot) / 1e9, 2 * l_tot / 1e9)
print('E24 spacing at 20', 2.0**(4 - 7), 'at 3', 2.0**(1 - 7))
for eps in (1e-6, 1e-5):
    xv = [0.01, -0.02]; r = math.sqrt(sum(v * v for v in xv) / 2 + eps); print('E26', eps, [round(v / r, 4) for v in xv], 1 / r)
b32 = 2 * q_tot + kv(Q3) * 32768
print('E32', b32, b32 / BW * 1e3, BW / b32)
