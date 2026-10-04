"""Reproduce every illustrative search trace, score, and capacity calculation."""
import json, math
from collections import defaultdict, Counter
from pathlib import Path
texts=['red bird scores','blue bird scores','red match live','bird bird match']
post=defaultdict(list)
for doc,text in enumerate(texts,1):
 for pos,token in enumerate(text.split(),1): post[token].append([doc,pos])
N=len(texts); lengths=[len(t.split()) for t in texts]; avg=sum(lengths)/N
idf=lambda df: math.log(1+(N-df+.5)/(df+.5))
def bm(tf,length,df,k=1.2,b=.75): return idf(df)*tf*(k+1)/(tf+k*(1-b+b*length/avg))
def edit(a,b):
 d=list(range(len(b)+1))
 for i,x in enumerate(a,1):
  q=[i]
  for j,y in enumerate(b,1): q.append(min(q[-1]+1,d[j]+1,d[j-1]+(x!=y)))
  d=q
 return d[-1]
v=dict(texts=texts,postings=dict(post),lengths=lengths,average_length=avg,
 red_docs=[1,3],bird_docs=[1,2,4],intersection=[1],union=[1,2,3,4],
 tfidf_red=math.log(4/2),idf_red=idf(2),idf_bird=idf(3),
 bm25_bird_once=bm(1,3,3),bm25_bird_twice=bm(2,3,3),
 bm25_red_bird=bm(1,3,2)+bm(1,3,3),edit_bird_bird=edit('bird','bird'),edit_bird_brd=edit('bird','brd'),
 edit_bird_brad=edit('bird','brad'),prefixes=['b','bi','bir','bird'],
 million_scan_bytes=1_000_000*500,candidate_bytes=100*500,
 scan_ratio=(1_000_000*500)/(100*500),posting_bytes=12*4,positions_bytes=12*4,total_occurrence_bytes=12*4*2,length_double_adjustment=1-.75+.75*2,bird_twice_factor=2*2.2/(2+1.2),delta_bird=[1,1,2],
 raw_docs_bytes=1_000_000*500,index_bytes=1_000_000*500*1.5,
 copies=3,total_index_bytes=1_000_000*500*1.5*3,
 primary_shards=4,shard_bytes=1_000_000*500*1.5/4,
 shard_copies=4*3,query_rate=1000,shard_queries_s=1000*4,
 local_top_k=10,returned_candidates=4*10,fetch_documents=10,
 deep_offset=1000,deep_candidates=4*(1000+10),cursor_candidates=4*10,
 write_rate=20,refresh_interval_s=1,buffered_writes=20*1,
 bulk_size=1000,bulk_payload_bytes=1000*500,
 rebuild_s=1_000_000/5000,updates_during_rebuild=20*(1_000_000/5000),
 precision=3/5,recall=3/4,ndcg_discount=[1/math.log2(r+1) for r in range(1,5)],
 cache_hits=1000*.8,cache_misses=1000*.2,
 failed_shard_fraction=1/4,delete_versions=[7,8,6],routing=[x%4 for x in range(1,5)])
assert v['intersection']==[1] and v['edit_bird_brad']==2
assert v['shard_copies']==12 and v['total_index_bytes']==2_250_000_000
root=Path(__file__).resolve().parents[2]
(root/'src/data/system-design/search-numbers.json').write_text(json.dumps(v,indent=2)+'\n')
print(json.dumps(v,indent=2))
