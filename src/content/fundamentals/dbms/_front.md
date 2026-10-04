<section class="front">

<div class="part-kicker">Fundamentals · DBMS</div>

# How to read this chapter

<p class="lede">Two people reserve the same seat, a report returns the wrong total, or the machine loses power after saying "committed". This guide explains the database mechanisms that make each outcome correct, and gives you enough detail to defend them at a whiteboard.</p>

The supplied DBMS syllabus is the contract. Its order stays intact: fundamentals, keys, ER modelling, relational algebra and SQL, dependencies and normalization, storage and indexes, query execution, transactions, concurrency, recovery, distributed databases, and practical PostgreSQL. Larger topics have several sections. Shorter topics still explain their mechanism and failure cases; a definition alone is not revision.

Read a section, cover its diagram, and redraw the mechanism. Then change an assumption: the index is missing, the reader has an older snapshot, the coordinator crashes, or both buyers act together. The interview boxes give a spoken answer; the final page gives a question bank, graded exercises and worked solutions. Picture-this boxes explain analogies, notes record variants, warnings catch mistakes, and each part closes with an In one breath recap.

The orange map tells you which part of the database you are examining. The final part follows a seat reservation through the entire system and reconciles the storage arithmetic. This is a single subject in depth. Computer Networks and Operating Systems have their own guides; their mechanisms are introduced here only when the database depends on them.

</section>

<section class="front">

<div class="part-kicker">The running example</div>

# Meet Heron

**Heron** is an illustrative ticket-booking database. We keep the same people, shows and seat inventory throughout, so SQL results and page counts can be checked instead of guessed. Its tiny query fixture is a separate extract, not a claim that the complete database contains only the rows printed on the page.

| Setting | Symbol or table | Value | What it controls |
|---|---|---|---|
| Customers | `users` | 100 rows | Owners of bookings |
| Performances | `shows` | 8 rows | Distinct seat inventories |
| Seats per performance | $S$ | 100 | Capacity per show |
| Inventory | `show_seats` | 800 rows | One row per show and seat |
| Existing bookings | `bookings` | 160 rows | Query and join examples |
| Core row total | $N$ | 1,068 | Sum of these four tables |
| Toy storage page | $P$ | 4,096 bytes | Page-count arithmetic |
| Toy page header | $H$ | 64 bytes | Fixed overhead |
| Toy inventory record | $R$ | 124 bytes | Fixed-size worked model |
| Slot entry | $s$ | 4 bytes | Stable slot location |
| Toy index entry | $e$ | 16 bytes | Leaf capacity model |
| Replicas | $n$ | 3 | Quorum examples |

These storage settings are teaching assumptions, not PostgreSQL's tuple layout. In the toy model, each inventory record occupies 128 bytes including its slot; 31 fit on a page. Heron's inventory occupies 26 heap pages. PostgreSQL-specific sections explicitly separate the real engine's behaviour from this arithmetic.

The fixture has users Ada, Bo and Cy, and bookings priced at 120, 120 and 80 units: Ada owns the first two, Bo owns the third, and Cy owns none. Amounts are exact integer currency units. Every worked quantity and numerical solution is reproduced by `python scripts/fundamentals/numbers.py`.

</section>
