"""Illustrative API page, version, and workflow traces."""
from math import ceil
ids=[9,8,7,6,5,4]
page_size=3
first=ids[:page_size]
after_insert=[10]+ids
offset_next=after_insert[page_size:page_size*2]
cursor_next=[v for v in after_insert if v<first[-1]][:page_size]
assert first==[9,8,7] and offset_next==[7,6,5] and cursor_next==[6,5,4]
rows=[(100,12),(100,11),(99,10),(99,9)]
first_tied=rows[:2]
cursor=first_tied[-1]
second_tied=[r for r in rows if r<cursor][:2]
assert second_tied==[(99,10),(99,9)]
page_offset=50*20
pages=ceil(1000/20)
query_scanned=10000
query_returned=20
read_amplification=query_scanned/query_returned
start_version=7
first_version=start_version+1
assert first_version==8
limit=100
refill_per_s=limit/60
assert page_offset==1000 and pages==50 and read_amplification==500
print('first page:',first,'offset after insert:',offset_next,'cursor after insert:',cursor_next)
print('tie cursor:',cursor,'next page:',second_tied)
print('offset/pages:',page_offset,pages,'query amplification:',read_amplification)
print('first committed version:',first_version,'limit refill/s:',refill_per_s)
version=7
expected_a=7
expected_b=7
rows_changed_a=int(version==expected_a)
version+=rows_changed_a
rows_changed_b=int(version==expected_b)
assert rows_changed_a==1 and rows_changed_b==0 and version==8
later_version=version+1
assert later_version==9
print('conditional rows A/B:',rows_changed_a,rows_changed_b,'versions:',version,later_version)
