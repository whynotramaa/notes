"""Small runnable checks for the guide's mathematical contracts; no ML dependency."""
import math
import ctypes


def combine_clip(grads, counts, threshold):
    assert grads and len(grads) == len(counts)
    width = len(grads[0])
    assert width > 0 and all(len(g) == width for g in grads)
    assert all(type(n) is int and n > 0 for n in counts)
    assert math.isfinite(threshold) and threshold > 0
    assert all(math.isfinite(v) for g in grads for v in g)
    total = sum(counts)
    combined = [sum(g[j] * n for g, n in zip(grads, counts)) / total
                for j in range(width)]
    norm = math.hypot(*combined)
    assert math.isfinite(norm)
    scale = min(1, threshold / norm) if norm else 1
    return [v * scale for v in combined]


def probabilities(logits, temperature=1, k=None):
    assert logits and all(math.isfinite(ctypes.c_float(z).value) for z in logits)
    assert math.isfinite(temperature) and temperature >= 0
    if temperature == 0:
        return [int(z == max(logits) and i == logits.index(max(logits)))
                for i, z in enumerate(logits)]
    assert 2**-126 <= temperature <= (2-2**-23)*2**127
    order = sorted(range(len(logits)), key=lambda i: (-logits[i], i))
    if k is not None:
        assert type(k) is int and 1 <= k <= len(logits)
        order = order[:k]
    maximum = max(logits[i] for i in order)
    weights = [math.exp((logits[i]-maximum)/temperature) for i in order]
    total = sum(weights)
    result = [0.0]*len(logits)
    for i, w in zip(order, weights):
        result[i] = w/total
    return result


def nll(logits, target):
    maximum = max(logits)
    return math.log(sum(math.exp(z-maximum) for z in logits)) + maximum - logits[target]


def self_check():
    assert combine_clip([[2], [4]], [2, 6], 100) == [3.5]
    assert combine_clip([[2], [4]], [2, 6], 1) == [1]
    for inputs in [([], [], 1), ([[1], [2, 3]], [1, 1], 1), ([[1]], [0], 1),
                   ([[math.nan]], [1], 1), ([[1]], [True], 1), ([[1]], [1], -1)]:
        try:
            combine_clip(*inputs)
        except AssertionError:
            pass
        else:
            raise AssertionError(f'Invalid gradient input accepted: {inputs}')
    p = probabilities([2, 1, 0])
    assert abs(sum(p)-1) < 1e-12
    assert probabilities([10002, 10001, 10000]) == p
    extreme = probabilities([3e38, -3e38], 3e38)
    assert abs(extreme[0]-0.8807970779778823) < 1e-12
    # Emulate the guide's FP64 gap calculation followed by an FP32 cast.
    gaps = [ctypes.c_float((z-3e38)/3e38).value for z in [3e38,-3e38]]
    assert gaps == [0, -2]
    assert abs(probabilities(gaps)[0]-extreme[0]) < 1e-12
    top = probabilities([2, 1, 0], k=2)
    assert top[2] == 0 and abs(top[0]-0.73105857863) < 1e-11
    assert sum(v > 0 for v in probabilities([1, 1, 1], k=2)) == 2
    assert probabilities([2, 1, 0], 0) == [1, 0, 0]
    for t in [-1, 1e-300, math.inf, math.nan]:
        try:
            probabilities([2, 1, 0], t)
        except AssertionError:
            pass
        else:
            raise AssertionError(f'Invalid temperature accepted: {t}')
    # Check the loss derivative against finite differences, not its own implementation.
    z, target, step = [2, 1, 0], 0, 1e-5
    for i in range(len(z)):
        plus, minus = z.copy(), z.copy()
        plus[i] += step
        minus[i] -= step
        numeric = (nll(plus, target)-nll(minus, target))/(2*step)
        assert abs(numeric-(p[i]-int(i == target))) < 1e-9
    assert abs(sum(p[i]-int(i == target) for i in range(len(z)))) < 1e-12
    # Clip after accumulation. Clipping each contribution produces a different result.
    assert combine_clip([[3], [-2]], [1, 1], 100) == [.5]
    each = combine_clip([[3]], [1], 1)[0]+combine_clip([[-2]], [1], 1)[0]
    assert each == 0
    print('Passed weighted accumulation, clipping, stable candidate selection and finite-difference gradient checks.')


if __name__ == '__main__':
    self_check()
