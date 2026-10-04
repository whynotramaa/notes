"""Small authoring helper; writes native Astro markdown and figure functions."""
import json, re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
ROMAN=['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII']

def write_unit(order, slug, title, lines, description, promise, parts, figures, back, sources):
    folder=ROOT/'src/content/system-design'/slug
    folder.mkdir(parents=True,exist_ok=True)
    prefix='sd_'+slug.replace('-','_')
    meta=dict(order=order,day=f'unit {ROMAN[order-1] if order<=13 else order}',chapterNumber=order,title=title,description=description,mapIntro=promise,where='where_'+prefix,cover='cover_'+prefix)
    (folder/'_note.js').write_text('export const site = '+json.dumps(meta,indent=2)+';\n')
    front=f'''<section class="front">

<div class="part-kicker">Before we start</div>

# How to read this chapter

<p class="lede">{description} {promise}</p>

Read each small topic as a separate whiteboard explanation. Start with the concrete failure, follow the mechanism, and check the worked example before looking at the picture. A paragraph introduces one idea; the next picture shows the state or message that changes. You should be able to redraw it and say where it can fail.

The orange map marks the part you are reading. Picture this boxes give a physical analogy, notes explain a useful variant, warnings name a mistake, and interview boxes give an answer you can say aloud. Each part closes with In one breath. The interview page has questions, graded exercises, and worked answers; use it after reading, with the diagrams hidden.

These are design lessons, not measured capacity claims. All Heron workloads, durations, limits, and record sizes are illustrative assumptions. The arithmetic lives in `scripts/system-design/numbers.py`; real product behavior is linked to its primary documentation. A decimal MB is a million bytes; a GiB is a power-of-two unit. Capacity still needs a load test on your workload.

</section>

<section class="front">

<div class="part-kicker">The running system</div>

# Meet Heron

**Heron** is an illustrative live-score and media service. A scorer changes a match, viewers read its score, subscribers receive updates, and users upload clips. We keep the workload fixed across the series so a faster path, a replica, or a cache changes the same calculation instead of quietly changing the question.

| Assumed setting | Symbol | Value | What it controls |
|---|---|---|---|
| Daily API requests | $D$ | 8,640,000 | Baseline request demand |
| Peak multiplier | $p$ | 10 | Peak relative to daily average |
| Mean response time at peak | $W$ | 0.2 s | Mean in-flight work |
| API response size | $b$ | 2,000 bytes | Payload bandwidth |
| Stored record size | $r$ | 500 bytes | An illustrative write workload |
| Record retention | $t$ | 30 days | Storage calculation |
| Live events | $e$ | 20 per second | Fan-out input |
| Live viewers | $v$ | 50,000 | Fan-out recipients |
| Event payload | $m$ | 200 bytes | Live payload bandwidth |
| Gateway capacity assumption | $g$ | 10,000 connections | A sizing exercise, not a benchmark |
| Replication factor | $N$ | 3 | Copies of a logical record |
| Rate policy | $L$ | 100 requests per user per minute | Admission rule |

The computed baseline is 100 requests per second on average and 1,000 at peak. At the assumed mean latency, 200 requests are in flight. Live fan-out is 1,000,000 deliveries per second, carrying 200,000,000 payload bytes per second before protocol overhead. These are different workloads; never size the live path using the API request rate.

</section>
'''
    (folder/'_front.md').write_text(front)
    section=0
    for i,(name,blurb,text) in enumerate(parts):
        def numbered(m):
            nonlocal section
            section+=1
            return f'## {section}. {m[1]}'
        text=re.sub(r'^## (.+)$',numbered,text.strip(),flags=re.M)
        filename=f'{i+1:02d}-'+re.sub(r'[^a-z0-9]+','-',name.lower()).strip('-')+'.md'
        (folder/filename).write_text(f'@part {ROMAN[i]} | {name} | {blurb} | where:{i+1}\n\n'+text+'\n')
    source_text='\n\n### Primary sources\n\n'+ '\n\n'.join(f'[{name}]({url}). {what}' for name,url,what in sources)
    (folder/'99-interview.md').write_text(back.strip()+source_text+'\n')
    js="import { systemFigure, systemMap, systemCover } from '../lib/system-figures.js';\n\n"
    js+=f'export function where_{prefix}(stage=99) {{ return systemMap({json.dumps(prefix)}, {json.dumps([p[0] for p in parts])}, stage); }}\n'
    js+=f'export function cover_{prefix}() {{ return systemCover({json.dumps(prefix)}, {order}, {json.dumps(lines)}, {json.dumps(title)}, {json.dumps([p[0] for p in parts])}); }}\n'
    for fid,kicker,kind,data,note in figures:
        js+=f'export function {fid}() {{ return systemFigure({json.dumps(fid)}, {json.dumps(kicker)}, {json.dumps(kind)}, {json.dumps(data)}, {json.dumps(note)}); }}\n'
    target=ROOT/f'src/figs/p{59+order}.js'
    if target.exists() and ('where_'+prefix) not in target.read_text():
        raise ValueError(f'Figure file already belongs to other work: {target}')
    target.write_text(js)
    print(f'{slug}: {len(parts)} parts, {section} sections, {len(figures)} diagrams')


def compact_back(qa, exercises, closing):
    """Question and exercise bodies are authored, not generated explanations."""
    out='@chapter faq | Interview question bank | Say the mechanism, the guarantee, and the failure boundary aloud.\n\n'
    for i,(q,a) in enumerate(qa,1): out+=f'**Q{i}. {q}**\n\n{a}\n\n'
    out+='@chapter exercises | Exercises | One dot is arithmetic, two dots require a trace, and three dots require a design or derivation.\n\n'
    for i,(dots,q,a) in enumerate(exercises,1): out+=f'**E{i}** {dots} {q}\n\n'
    out+='@chapter solutions | Worked solutions | The assumptions are illustrative; the calculations are reproducible.\n\n'
    for i,(dots,q,a) in enumerate(exercises,1): out+=f'**E{i}.** {a}\n\n'
    return out+closing


def publish(order,slug,title,lines,description,promise,raw,qa,exercises,sources):
    figures=[]
    def figure(m):
        id,kind,kicker,data,caption,note=[s.strip() for s in m[1].split(' | ')]
        fid='sd_'+slug.replace('-','_')+'_'+id
        figures.append((fid,kicker,kind,json.loads(data),note))
        return '@fig '+fid+' | '+caption
    raw=re.sub(r'^@draw (.+)$',figure,raw,flags=re.M)
    parts=[]
    for block in raw.split('@part ')[1:]:
        head,text=block.split('\n',1)
        name,blurb=head.split(' | ',1)
        parts.append((name,blurb,text))
    write_unit(order,slug,title,lines,description,promise,parts,figures,compact_back(qa,exercises,'Read the next unit when you can explain these mechanisms without the pictures.'),sources)
