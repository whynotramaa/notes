"""Recompute the worked examples in the Unit IV and Unit V guides.

All timing, probability and evaluation fixtures below are illustrative.
OCTLM inputs are transcribed from its Day 3 config and decision record.
"""
import json
import math
import sys
from pathlib import Path
sys.path.remove(str(Path(__file__).resolve().parent))
import statistics


def params(v, d, layers, kv, head, ff, tied=True):
    attention = 2*d*d + 2*d*kv*head
    mlp = 3*d*ff
    block = attention + mlp + 2*d
    return dict(embedding=v*d, attention=attention, mlp=mlp,
                norms=2*d, block=block, blocks=layers*block,
                final_norm=d, head=0 if tied else v*d,
                total=v*d+layers*block+d+(0 if tied else v*d))


def lora(d, ff, kv_width, layers, rank):
    shapes = {'q':(d,d), 'k':(kv_width,d), 'v':(kv_width,d),
              'o':(d,d), 'gate':(ff,d), 'up':(ff,d), 'down':(d,ff)}
    per = {name:rank*(a+b) for name,(a,b) in shapes.items()}
    return dict(per=per, layer=sum(per.values()), all=layers*sum(per.values()),
                qv=layers*(per['q']+per['v']))


def causal_pairs(length, window=None):
    return sum(min(t, window) if window else t for t in range(1,length+1))


finch = params(32000,512,8,2,64,1536)
llama = params(128256,4096,32,8,128,14336,False)
adapter = lora(512,1536,128,8,8)
llama_adapter = lora(4096,14336,1024,32,8)
base_seeds = [2.10,2.14,2.08,2.12,2.16]
variant_seeds = [2.09,2.11,2.07,2.10,2.13]
deltas = [b-v for b,v in zip(base_seeds,variant_seeds)]
q,p = [.6,.4],[.3,.7]
accept = [min(1,pp/qq) for pp,qq in zip(p,q)]
residual = [max(0,pp-qq) for pp,qq in zip(p,q)]
# The df=4 t CDF has a closed form; solve its 97.5th percentile.
def t4_critical():
    lo, hi = 0., 10.
    for _ in range(80):
        mid = (lo+hi)/2
        u = mid/math.sqrt(4+mid*mid)
        cdf = .5 + .75*u - .25*u**3
        if cdf < .975:
            lo = mid
        else:
            hi = mid
    return (lo+hi)/2


t95 = t4_critical()
N = {
 'additional_examples':{
     'wrong_quantity_remaining':12-4,'duplicate_remaining':12-3-3,
     'other_item_available':10-3,'alternate_quantity_remaining':12-5,
     'all_stock_remaining':12-12,'eval_families':[10,5,5],
     'unconditional_argument_rate':19/24,'independent_three_step':.9**3,
     'full_result_tokens':2*192,'compressed_saved':1040-640,
     'toy_dense_params':4*4,'toy_rank1_params':1*(4+4),
     'toy_merge':[[7,12],[8,17]],'square_lora_saving':512*512/(8*(512+512)),
     'shift_ids':[11,22,33,44],
     'train_loss_curve':[1.8,1.4,1.,.7,.5],
     'validation_loss_curve':[1.9,1.5,1.2,1.3,1.5],
     'paired_outcomes':{'both':10,'gain':6,'loss':2,'neither':2},
     'fine_tune_total':finch['total']+adapter['all'],
 },
 'finch':finch, 'llama':llama,
 'spec':{'V':32000,'d':512,'layers':8,'H':8,'Hkv':2,'head':64,
         'ff':1536,'context':4096,'rope_base':10000,'B':2,'T':8},
 'inventory':{'stock':17,'reserved':5,'request':3,'available':17-5,'after':17-5-3},
 'messages':{'initial':2,'calls':2,'final':1,'total':2+2*2+1},
 'context':{'initial':320,'call':48,'result':192,'turns':3,
            'after':320+3*(48+192),'compressed':320+80+48+192},
 'prefix':{'old':560,'appended':240,'full':800,'reuse_fraction':560/800},
 'eval':{'tasks':20,'calls':24,'valid':22,'selection_cases':20,
         'selected':18,'arguments':19,'success':16,'errors':5,'recovered':3,
         'success_rate':16/20,'valid_rate':22/24,'selection_rate':18/20,
         'argument_rate':19/22,'mean_calls':24/20,'recovery_rate':3/5,
         'mean_latency_ms':sum([100,200,300,400])/4,'token_total':20*(800+120)},
 'before_after':{'tasks':20,'before':12,'after':16,'percentage_points':100*(16-12)/20,
                 'relative_gain':(16-12)/12,'paired_gain':6,'paired_loss':2},
 'lora':adapter, 'llama_lora':llama_adapter,
 'lora_fraction':adapter['all']/finch['total'],
 'lora_combined_fraction':adapter['all']/(finch['total']+adapter['all']),
 'ranks':{str(r):lora(512,1536,128,8,r)['all'] for r in [4,8,16,32]},
 'memory':{'full_fp32_adam':finch['total']*16,
           'frozen_bf16':finch['total']*2,'adapter_fp32_adam':adapter['all']*16,
           'lora_total':finch['total']*2+adapter['all']*16,
           'adapter_bf16':adapter['all']*2,'ideal_int8':finch['total'],
           'ideal_bf16':finch['total']*2},
 'toy_lora':{'A':[[1,2]],'B':[[3],[4]],'x':[2,1],
             'Ax':[4],'BA':[[3,6],[4,8]],'BAx':[12,16],
             'base_y':[2,1],'scale':2,'adapted_y':[26,33]},
 'sft':{'probabilities':[.5,.25,.125],'losses':[-math.log(p) for p in [.5,.25,.125]],
        'mean_loss':sum(-math.log(p) for p in [.5,.25,.125])/3,
        'batch':2,'length':8,'positions':2*8,'supervised':6,
        'mask_fraction':6/16,'dataset':96,'microbatch':2,'accumulation':4,
        'effective_batch':2*4,'updates_per_epoch':96//(2*4),'epochs':3,
        'updates':96//(2*4)*3,'warmup_steps':4,
        'first_warmup_lr':.0002/4},
 'synthetic':{'skus':4,'quantities':3,'phrasings':5,'tasks':4*3*5,
              'raw':60,'duplicate':8,'corrupt':4,'kept':60-8-4,
              'family_train':3*3*5,'family_validation':1*3*5},
 'kv':{name:2*8*4096*2*heads*64*2 for name,heads in [('mha',8),('gqa',2),('mqa',1)]},
 'kv_one_token':2*8*2*64*2,
 'llama_kv_one':2*32*8*128*2,
 'llama_kv_8192':8192*2*32*8*128*2,
 'attention':{str(t):{'dense':causal_pairs(t),'window4':causal_pairs(t,4),
                     'full_grid':t*t} for t in [8,16,1024,4096]},
 'window':{'pairs8w4':causal_pairs(8,4),'pairs4096w256':causal_pairs(4096,256),
           'receptive8w4':1+8*(4-1),'receptive8w256':1+8*(256-1)},
 'compression':{'length':1024,'window':256,'block':8,
                'old':1024-256,'blocks':(1024-256)//8,
                'entries':256+(1024-256)//8,'ratio':1024/(256+96),
                'bytes':2*8*352*2*64*2,'full_bytes':2*8*1024*2*64*2,
                'pool_keys':[(1+3)/2,(0+2)/2],
                'pool_values':[(4+8)/2,(2+6)/2]},
 'mla':{'latent':64,'rope':16,'cache_dims':64+16,
        'bytes':2*8*4096*(64+16)*2,'gqa_ratio':256/80,
        'mha_ratio':1024/80,'mqa_ratio':128/80,
        'crossover_rank':256-16,
        'ranks':{str(r):r+16 for r in [32,64,128,256]},
        'down':64*512,'up_k':512*64,'up_v':512*64,'rope_key':16*512},
 'mtp':{'trunk_params':finch['total'],'extra_linear':512*512,
        'two_extra':2*512*512,'total':finch['total']+2*512*512,
        'losses':[1.,2.,3.],'weights':[1.,.5,.25],
        'weighted_sum':1+.5*2+.25*3,'weight_normalized':(1+.5*2+.25*3)/1.75},
 'speculation':{'p':p,'q':q,'accept':accept,
                'accept_rate':sum(qq*a for qq,a in zip(q,accept)),
                'residual':[x/sum(residual) for x in residual],
                'alpha':.8,'drafts':4,'expected':sum(.8**i for i in range(5)),
                'draft_ms':1,'target_ms':10,'verify_ms':12,
                'speedup':10*sum(.8**i for i in range(5))/(4*1+12),
                'slow_expected':sum(.2**i for i in range(5)),
                'slow_speedup':10*sum(.2**i for i in range(5))/16},
 'seeds':{'base':base_seeds,'variant':variant_seeds,
          'base_mean':statistics.mean(base_seeds),'variant_mean':statistics.mean(variant_seeds),
          'deltas':deltas,'mean_delta':statistics.mean(deltas),
          'sd_delta':statistics.stdev(deltas),
          'se_delta':statistics.stdev(deltas)/math.sqrt(len(deltas)),
          'base_range':max(base_seeds)-min(base_seeds),
          't95_halfwidth':t95*statistics.stdev(deltas)/math.sqrt(len(deltas))},
 'bpb':{'nll_nats':12*math.log(2),'bytes':8,'tokens':4,
        'bpb':(12*math.log(2))/(8*math.log(2)),'token_loss':3*math.log(2)},
 'octlm':{'config_parameters':3740160,'day2_steps':400,'planned_steps':2000,
          'batch':8,'context':256,'day2_tokens':400*8*256,
          'planned_tokens':2000*8*256,'long_tokens':2000*8*512,
          'day2_ratio_using_config':400*8*256/3740160,
          'planned_ratio':2000*8*256/3740160,
          'heuristic20_tokens':20*3740160,
          'budget_multiplier':20*3740160/(2000*8*256),
          'baseline_bpb':2.9339,'baseline_spread':.0434,
          'swiglu_bpb':2.8521,'swiglu_gap':2.9339-2.8521,
          'modern_bpb':2.8045,'modern_spread':.1194,
          'modern_vs_swiglu':2.8521-2.8045},
 'rank_count_exercise':{'qv_rank4':lora(512,1536,128,8,4)['qv'],
                       'new_model':params(4096,256,4,2,32,768)},
 'quantization':{'values':[-1.,-.5,0.,.5,1.], 'scale':1/127,
                 'q':[-127,-64,0,64,127],
                 'reconstructed':[-1,-64/127,0,64/127,1],
                 'max_abs_error':abs(64/127-.5)},
}
N['research_extra'] = {
 'window3_pairs':causal_pairs(8,3),
 'global_pairs':sum(c<=r and (r-c<3 or c in [0,4]) for r in range(8) for c in range(8)),
 'rolling_bytes':2*8*256*2*2*64*2,
 'hybrid_bytes':2*4096*2*2*64*2*2+6*256*2*2*64*2*2,
 'hybrid_pairs':2*causal_pairs(4096)+6*causal_pairs(4096,256),
 'all_full_pairs':8*causal_pairs(4096),
 'pool_attention_original':(math.exp(1)*4+math.exp(3)*8)/(math.exp(1)+math.exp(3)),
 'pool_attention_reconstructed':6,
 'bpb_trial_nll':8*math.log(2), 'bpb_trial_bytes':4, 'bpb_trial':2,
 'unpaired_sd_base':statistics.stdev(base_seeds),
 'ci_low':statistics.mean(deltas)-t95*statistics.stdev(deltas)/math.sqrt(5),
 'ci_high':statistics.mean(deltas)+t95*statistics.stdev(deltas)/math.sqrt(5),
 'compression_halfblock':256+768//4,
 'mla_exercise_bytes':1*8*1024*(32+16)*2,
 'two_layer_window_reach':1+2*(4-1),
 'rank256_mla_bytes':2*8*4096*(256+16)*2,
 'dense_T32':32*33//2, 'window_T32w4':causal_pairs(32,4),
 'spec_alpha05':sum(.5**i for i in range(5)),
 'spec_break_even_tokens':16/10,
 'budget_example_tokens':2000*2*1024,
 'max_decode_memory_b2tokens':(64*1024**2)//4096//2,
 'copy_fixture_hits':[8,6,4], 'copy_fixture_cases':8,
 'latent_toy':{'h':[2,1], 'W_down':[[1,2]], 'c':[4],
    'W_up_k':[[1],[2]],'W_up_v':[[3],[1]],'k':[4,8], 'v':[12,4],
    'q':[1,2],'q_latent':[5],'score':20},
 'tradeoff_fixture':{'base_loss':2.12,'base_ms':10,'base_mib':32,
    'A_loss':2.10,'A_ms':12,'A_mib':32,
    'B_loss':2.12,'B_ms':8,'B_mib':16,
    'C_loss':2.18,'C_ms':6,'C_mib':10},
}
# Recompute the tiny latent trace rather than merely recording its answer.
toy = N['research_extra']['latent_toy']
def matvec(matrix, vector):
    return [sum(a*b for a,b in zip(row,vector)) for row in matrix]
toy['c'] = matvec(toy['W_down'],toy['h'])
toy['k'] = matvec(toy['W_up_k'],toy['c'])
toy['v'] = matvec(toy['W_up_v'],toy['c'])
toy['q_latent'] = [sum(row[0]*q for row,q in zip(toy['W_up_k'],toy['q']))]
toy['score'] = sum(a*b for a,b in zip(toy['q'],toy['k']))
assert toy['score'] == toy['q_latent'][0]*toy['c'][0] == 20
N['exercise_checks'] = {
 'reserved_after':5+3,'context_added':3*(48+192),
 'rank4q':4*(512+512),'rank4v':4*(128+512),
 'all_full_8_layers_pairs':8*causal_pairs(4096),
 'triangular_ratio':causal_pairs(16)/causal_pairs(8),
 'copy_average':sum([8,6,4])/(3*8),
 'tradeoff_A_loss_gain':2.12-2.10,'tradeoff_A_time_cost':12-10,
 'tradeoff_B_time_saved':10-8,'tradeoff_B_memory_saved':32-16,
 'tradeoff_C_loss_cost':2.18-2.12,'tradeoff_C_time_saved':10-6,
 'sample_variance_deltas':statistics.variance(deltas),
 't95_df4':t95,
}
assert N['research_extra']['global_pairs'] == 27
assert finch['total'] == 40509952
assert llama['total'] == 8030261248
assert adapter['all'] == 606208
assert N['window']['pairs8w4'] == 26
assert math.isclose(N['speculation']['accept_rate'],.7)
assert N['messages']['total'] == 7
if __name__ == '__main__':
    path = Path(__file__).resolve().parents[2]/'src/data/unit4-unit5-numbers.json'
    path.write_text(json.dumps(N,indent=2)+'\n')
    print(json.dumps(N,indent=2))
