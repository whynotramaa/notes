"""Recompute every illustrative calculation used by the training guide."""
import json
import math
import sys
sys.path.remove(str(__import__("pathlib").Path(__file__).resolve().parent))
import statistics
from pathlib import Path


def softmax(xs, temperature=1):
    scaled = [x / temperature for x in xs]
    m = max(scaled)
    e = [math.exp(x - m) for x in scaled]
    return [x / sum(e) for x in e]


def params(v, d, layers, kv, head, f, tied=True):
    attention = 2 * d * d + 2 * d * kv * head
    mlp = 3 * d * f
    norms = 2 * d
    block = attention + mlp + norms
    return dict(embedding=v*d, attention=attention, mlp=mlp, norms=norms,
                block=block, blocks=layers*block, final_norm=d,
                head=0 if tied else v*d,
                total=v*d+layers*block+d+(0 if tied else v*d))


p = params(32000, 512, 8, 2, 64, 1536)
llama = params(128256, 4096, 32, 8, 128, 14336, False)
xs = [-2, -1, 0, 1, 2]
activations = {"x": xs, "relu": [max(0, x) for x in xs],
               "gelu": [x * (1 + math.erf(x / math.sqrt(2))) / 2 for x in xs],
               "silu": [x / (1 + math.exp(-x)) for x in xs]}
z = [2, 1, 0]
prob = softmax(z)
loss = -math.log(prob[0])
grad = [prob[0]-1, prob[1], prob[2]]
mean_losses = [-math.log(x) for x in [.5, .25, .125, .125]]
sgd = 1 - .1 * .2
m1, v1 = .1 * .2, .001 * .2**2
m2, v2 = .9*m1 + .1*.4, .999*v1 + .001*.4**2
mh2, vh2 = m2/(1-.9**2), v2/(1-.999**2)
adam1 = 1-.001*.2/(math.sqrt(.04)+1e-8)
adam2 = adam1-.001*mh2/(math.sqrt(vh2)+1e-8)
adamw1 = 1*(1-.001*.1)-.001*.2/(math.sqrt(.04)+1e-8)
base = [2.10, 2.14, 2.08, 2.12, 2.16]
variant = [2.09, 2.11, 2.07, 2.10, 2.13]
diffs = [b-a for a,b in zip(base,variant)]
N = {
    'finch': p, 'llama': llama,
    'spec': {'V':32000, 'd':512, 'layers':8, 'H':8, 'Hkv':2, 'head':64,
             'ff':1536, 'context':4096, 'rope_base':10000, 'eps':1e-5, 'B':2, 'T':8},
    'activations': activations,
    'standard_ffn': {'weights':2*512*2048, 'biases':2048+512,
                     'with_bias':2*512*2048+2048+512, 'budget_width':8*512/3,
                     'swiglu_increase':p['mlp']/(2*512*2048)-1},
    'ffn_example': {'expanded':[3,-1,4], 'relu':[3,0,4], 'out':[7,4],
                    'gate':[-2,0,2], 'up':[3,-1,4],
                    'silu':[-2/(1+math.exp(2)),0,2/(1+math.exp(-2))],
                    'product':[-6/(1+math.exp(2)),0,8/(1+math.exp(-2))]},
    'norm': {'rms':math.sqrt(12.5), 'normalized':[3/math.sqrt(12.5),4/math.sqrt(12.5)],
             'with_eps':[3/math.sqrt(12.5+1e-5),4/math.sqrt(12.5+1e-5)]},
    'head': {'z':z,'prob':prob,'loss':loss, 'grad':grad, 'toy_hidden':[1,2],
             'toy_rows':[[2,0],[1,0],[0,0]], 'output_elements':2*8*32000,
             'output_bf16_bytes':2*8*32000*2, 'output_fp32_bytes':2*8*32000*4,
             'full_output_bytes':2*4096*32000*2,
             'tiny_flops':2*2*8*512*32000,
             'share_embedding':p['embedding']/p['total']*100,
             'untied':p['total']+p['embedding']},
    'batch': {'tokens':16,'accum':4,'effective_sequences':8,'effective_tokens':64,
              'steps_1m':1000000//64,'split':[800,100,100], 'valid_windows':20-8,
              'input': [17,23,5,81,9,44,2,7], 'target':[23,5,81,9,44,2,7,3]},
    'loss': {'per_token':mean_losses,'mean':statistics.mean(mean_losses),
             'ppl':math.exp(statistics.mean(mean_losses)), 'uniform':math.log(32000),
             'gradient':grad, 'weighted_mean':(2*2+6*4)/8,
             'unweighted_mean':(2+4)/2},
    'backprop': {'w':.5,'x':2,'target':1,'logit':1,'prob':1/(1+math.exp(-1)),
                 'loss':math.log1p(math.exp(-1)), 'dz':1/(1+math.exp(-1))-1,
                 'dw':2*(1/(1+math.exp(-1))-1), 'new_w':.5-.1*2*(1/(1+math.exp(-1))-1),
                 'accum_mean':[.3,.4]},
    'optimizer': {'sgd':sgd,'m1':m1,'v1':v1,'mh1':.2,'vh1':.04,
                  'm2':m2,'v2':v2,'mh2':mh2,'vh2':vh2,
                  'adam1':adam1,'adam2':adam2,'adamw1':adamw1,
                  'decay_factor':1-.001*.1,'decay_1000':(1-.001*.1)**1000,
                  'l2_grad':.2+.1*1,'momentum1':.2,'momentum2':.9*.2+.4},
    'clipping': {'original':[3,4],'norm':5,'threshold':1,'scale':.2,'clipped':[.6,.8],
                 'accum_first':[3,0],'accum_second':[-2,0],
                 'clip_each':0,'clip_sum':1},
    'schedule': {'warmup':100,'total':1000,'peak':.001,'minimum':.0001,
                 'points':[[s, .001*s/100 if s<100 else
                             .0001+.5*(.001-.0001)*(1+math.cos(math.pi*(s-100)/900))]
                            for s in [0,50,100,550,1000]]},
    'init': {'xavier_std':math.sqrt(2/(512+1536)), 'kaiming_std':math.sqrt(2/512),
             'residual_scale':1/math.sqrt(2*8),'base_std':.02,'scaled_std':.02/math.sqrt(16),
             'variance_without':1+16,'variance_scaled':1+16/16},
    'precision': {'fp32':{'bytes':4,'exponent':8,'fraction':23,'max':(2-2**-23)*2**127,
                          'normal_min':2**-126,'subnormal_min':2**-149,'spacing':2**-23},
                  'fp16':{'bytes':2,'exponent':5,'fraction':10,'max':(2-2**-10)*2**15,
                          'normal_min':2**-14,'subnormal_min':2**-24,'spacing':2**-10},
                  'bf16':{'bytes':2,'exponent':8,'fraction':7,'max':(2-2**-7)*2**127,
                          'normal_min':2**-126,'subnormal_min':2**-133,'spacing':2**-7},
                  'scaled_small':1e-8*65536,'scale':65536,'small':1e-8,
                  'fp32_update':1-.0001,'bf16_small_update':1},
    'memory': {'fp32_weights':4*p['total'],'bf16_weights':2*p['total'],
               'fp32_adam':16*p['total'],'classic_mixed':18*p['total'],
               'lower_precision_grad':16*p['total'],
               'norm_no_decay':(2*8+1)*512,'decayed':p['total']-(2*8+1)*512,
               'residual_bf16':2*8*512*2,'ffn_bf16':2*8*1536*2,
               'score_bf16':2*8*8*8*2, 'full_score_bf16':2*8*4096**2*2,
               'llama_fp32_adam':16*llama['total']},
    'metrics': {'nats':8*math.log(2),'tokens':4,'bytes':8,'ppl':4,'bpb':1,
                'tokenizer_b_ppl':2,'tokenizer_b_tokens':8,
                'invalid_batch_average':3,'correct_token_average':3.5},
    'seeds': {'baseline':base,'variant':variant,'diffs':diffs,
              'mean_a':statistics.mean(base),'mean_b':statistics.mean(variant),
              'std_a':statistics.stdev(base),'std_b':statistics.stdev(variant),
              'mean_diff':statistics.mean(diffs),'std_diff':statistics.stdev(diffs),
              'se_diff':statistics.stdev(diffs)/math.sqrt(len(diffs)),
              'range_a':max(base)-min(base)},
    'undertraining': {'tokens':1000000,'parameters':p['total'],
                      'ratio':1000000/p['total'],'heuristic_tokens':20*p['total'],
                      'heuristic_steps':math.ceil(20*p['total']/64),
                      'training_flops':6*p['total']*1000000},
    'sampling': {'logits':z,'temperatures':{str(t):softmax(z,t) for t in [.5,1,2]},
                 'top2':[prob[0]/sum(prob[:2]),prob[1]/sum(prob[:2]),0],
                 'cdf':[prob[0],sum(prob[:2]),1], 'uniform_draws':[.2,.8,.95],
                 'selected':[0,1,2]},
    'cache': {'per_token':2*8*2*64*2,'eight_tokens':8*2*8*2*64*2,
              'llama_per_token':2*32*8*128*2},
    'count_exercise':params(10000,256,4,2,64,768),
}
N['activation_backward'] = {
 'inputs': [-2, 0, 2],
 'derivatives': [1/(1+math.exp(-x)) + x/(1+math.exp(-x))*(1-1/(1+math.exp(-x))) for x in [-2,0,2]],
 'gate_gradient': 3*(1/(1+math.exp(2)) - 2/(1+math.exp(2))*(1-1/(1+math.exp(2)))),
 'up_gradient': -2/(1+math.exp(2)),
 'shared_gradient': [1*.5+3*(-.25),2*.5+4*(-.25)],
 'branch_elements': 2*8*1536, 'two_branch_bytes': 2*2*8*1536*2,
}
N['evaluation_curves'] = {
 'updates':[0,100,200,400,600,800,1000],
 'training':[4.8,3.5,2.8,2.3,1.9,1.65,1.5],
 'validation':[4.9,3.6,2.95,2.6,2.55,2.7,2.9],
 'per_token_ppl':[1/x for x in [.5,.25,.125,.125]],
 'mean_token_ppl':statistics.mean([1/x for x in [.5,.25,.125,.125]]),
 'next_schedule':.0001+.00045*(1+math.cos(math.pi*(551-100)/900)),
 'one_nat_ppl':math.exp(1), 'half_nat_ppl_factor':math.exp(.5),
 'unicode_example':'café', 'unicode_bytes':len('café'.encode('utf-8')),
}
N['budget_curves'] = {'budgets':[0,1,2,3,4,5], 'small':[4.8,3.1,2.5,2.25,2.17,2.12], 'large':[5.0,3.6,2.8,2.22,1.95,1.8]}
N['sampling']['greedy_joint'] = .6*.5
N['sampling']['other_joint'] = .4*.99
N['exercise_details'] = {
 'ffn_difference':3*512*1536-2*512*2048,
 'untied_extra_bytes':16*32000*512, 'untied_extra_mib':16*32000*512/2**20,
 'norm_layernorm':2*512, 'clip_squares':[.6**2,.8**2],
 'adam_bias_denominators':[1-.9,1-.999,1-.9**2,1-.999**2],
 'first_update_lr':.001/100, 'fp32_parameter_mib':4*p['total']/2**20,
 'fp32_adam_mib':16*p['total']/2**20, 'precision_spacing_ratio':2**-7/2**-10,
 'seed_sum':sum(base), 'diff_sum':sum(diffs),
 'diff_deviations':[d-statistics.mean(diffs) for d in diffs],
 'diff_squared_sum':sum((d-statistics.mean(diffs))**2 for d in diffs),
 'diff_variance':statistics.variance(diffs), 'new_bf16_bytes':2*N['count_exercise']['total'],
 'sigmoid_minus2':1/(1+math.exp(2)), 'loss_sum':sum(mean_losses),
 'perplexity_product':math.prod([1/x for x in [.5,.25,.125,.125]]),
 'softmax_shifted_exp':[math.exp(x-max(z)) for x in z],
 'softmax_exp_sum':sum(math.exp(x-max(z)) for x in z),
 'top2_exp_sum':1+math.exp(-1), 'total_bits':N['metrics']['nats']/math.log(2),
 'four_token_nll':N['metrics']['nats']/4,'eight_token_nll':N['metrics']['nats']/8,
 'matrix_multiplicities':{'query_total':8*512*512,'key_total':8*512*128,
   'ffn_single_total':8*512*1536,'norms_total':16*512},
 'memory_full_residual':2*4096*512*2,'memory_full_ffn':2*4096*1536*2,
}
assert p['total'] == 40509952
assert llama['total'] == 8030261248
assert abs(sum(prob)-1) < 1e-12
assert abs(sum(grad)) < 1e-12
assert N['count_exercise']['total'] == 5708032
assert abs(math.sqrt(sum(x*x for x in N['clipping']['clipped']))-1) < 1e-12
assert abs(N['metrics']['nats']/(8*math.log(2))-1) < 1e-12
assert N['schedule']['points'][-1][1] == .0001
path = Path(__file__).resolve().parents[2] / 'src/data/training-numbers.json'
path.write_text(json.dumps(N, indent=2) + '\n')
print(json.dumps(N, indent=2))
