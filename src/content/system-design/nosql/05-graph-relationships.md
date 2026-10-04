@part V | Graph databases and SQL vs NoSQL | We ask questions about paths connecting records. Fast adjacency access does not make an unbounded traversal cheap. We will follow typed edges, count expansion, and compare data models using their required operations and invariants. | where:5

## 21. Nodes, edges, and properties

A viewer asks whether a followed scorer belongs to a group connected to a match organizer. The question is about a path, not a single record. A **graph database** represents entities as **nodes** and relationships as **edges**, with properties attached to the entities or relationships.

Heron can represent a viewer, scorer, group, and organizer as nodes. A `FOLLOWS` edge links viewer to scorer; a `MEMBER_OF` edge links scorer to group; an `ORGANIZES` relationship connects the relevant organization and match. Edge direction and type carry meaning, so the drawing must label both.

A relationship can have its own properties, such as when membership began or whether it is active. Those fields may determine whether the path answers the current question. A bare connection is insufficient if the product cares about temporal membership, deleted accounts, or access restrictions.

[Neo4j's graph-concept documentation](https://neo4j.com/docs/getting-started/appendix/graphdb-concepts/) defines its node, relationship, and property model. For Heron, first state the path pattern and result semantics. The model is attractive when repeated relationship traversal is the important operation; a latest-score lookup does not become more useful merely because it can be represented as a graph.

@fig sd_nosql_graph | Illustrative typed relationships explain the requested path; edge labels carry application meaning.

## 22. Traversal, step by step

Begin at the viewer node, follow only active `FOLLOWS` edges, then inspect group membership of the scorers found. A **traversal** walks selected relationships according to direction, type, depth, and predicates. Those constraints decide what work the query performs.

Keep the frontier of nodes still to inspect and the results already found. Apply restrictions as early as their meaning permits, such as ignoring inactive membership before expanding its group. A late filter may make the final page small while the traversal still explores a large hidden candidate set.

The visited-state rule depends on the query. Finding reachable nodes can avoid revisiting a node. Counting distinct paths cannot always do that, because different routes to the same node may be meaningful results. Some path patterns also depend on which edge sequence reached a node, so node identity alone is insufficient state.

For Heron recommendations, decide whether the result is a distinct scorer set, a group set, or evidence paths. Then cap expansion by deadline and work budget. A completed search and a deliberately truncated search are different answers. Return the truncation semantics when the consumer would otherwise mistake partial exploration for complete absence.

@fig sd_nosql_traversal | Illustrative frontier states show edge filtering before expansion and a separately bounded result set.

## 23. Degree, depth, and candidate growth

A viewer follows only a few scorers, but one group connects to many members. **Degree** counts relationships incident to a node under the chosen edge rules. High degree can dominate traversal cost even when the path depth is small.

For an illustrative tree with branching factor three, the first hop has three candidates, the second has nine, and the third has 27. The total candidates through three hops are $3+9+27=39$. These are path expansions without overlap. They are not a universal formula for distinct nodes in a real graph.

$$C=\sum_{i=1}^{d} b^i$$

Read this as: candidate expansions $C$ in the tree model sum branching factor $b$ raised to each hop from one through depth $d$. Heron's actual graph may converge or cycle, which changes distinct-node counts but can still require repeated edge inspection.

A result limit of 20 does not prove only 20 candidates were examined. Filters and ranking may require inspecting many relationships before choosing a page. Use degree distributions and worst plausible hubs when sizing the path. Bound edge types, depth, expansions, and execution time, then explain how incomplete exploration affects product behavior.

@fig sd_nosql_expansion | Computed illustrative tree frontiers are 3, 9, and 27 candidates; total expansion count is 39.

## 24. Cycles, duplicates, and permissions

A group relationship returns to a node already reached, so a naive walk repeats forever. A **cycle** is a path that returns to a prior node. Traversal needs a termination rule even when the product expects an acyclic relationship, because data errors or allowed reciprocal links can violate that expectation.

In a tiny illustrative second frontier, the neighbor lists are `x,y,z`, `y,z,w`, and `z,w,v`. They contain nine candidate entries but only five distinct nodes. Deduplicating before another reachability expansion can reduce work, while a path-count query must preserve the fact that several routes existed.

Permissions constrain exploration as well as display. If an unauthorized edge changes the result count or ranking, filtering only the final output can reveal hidden relationships. Decide which nodes and edges the query is permitted to use. Apply that policy consistently to traversal, derived recommendations, and caches.

Deletion also needs relationship cleanup. Removing a profile's visible fields while leaving identifying edges can preserve unwanted reachability. Heron should define whether deletion detaches relationships, retains anonymous historical evidence, or tombstones an entity. The correct choice follows the product's retention and visibility contract rather than the graph's convenient traversal interface.

@fig sd_nosql_dedup | Computed illustrative nine neighbor entries resolve to five distinct nodes; reachability and path counting need different state rules.

## 25. SQL versus NoSQL is a contract choice

Heron's payment-like invariants, clip metadata, event histories, and recommendations ask different questions. **NoSQL** is a broad family label for several non-relational models. It does not specify one durability, consistency, transaction, or scalability guarantee.

A relational model can enforce related updates through transactions and constraints. A key-value model favors known-key operations. Documents group bounded owned values. Wide-column models favor planned ranges and distribution. Graphs make paths and adjacency explicit. Each still needs a measured workload and a failure policy.

| Design pressure | Useful starting model | Obligation to inspect |
|---|---|---|
| Related invariant updates | Relational | Transactions and contention |
| Known-key score reads | Key-value | Freshness and recovery |
| Bounded clip metadata | Document | Growth and compatibility |
| Ordered event history | Wide-column | Skew and query-table repair |
| Relationship paths | Graph | Expansion and visibility |

Start with one store when its operations and guarantees fit. Add a derived model for a measured expensive query or a genuinely different role. Every new store adds propagation, deletion, backup, on-call knowledge, and rebuild work. A read optimization is not free simply because a specialized model expresses it neatly.

For Heron, a graph recommendation view may be derived from authoritative memberships while the score remains a direct record. Explain the boundary and how the graph catches up or rebuilds. The SQL-versus-NoSQL answer becomes specific when you defend which invariants each authoritative owner enforces and which views may lag.

@fig sd_nosql_choice | Illustrative authoritative invariant owner and derived query views have separate responsibilities.

:::story Picture this
A contact directory finds one person quickly. A chain of introductions answers who connects two people. They need different search work, and asking the directory to follow every possible introduction can grow far beyond the final answer.
:::

:::note Reachability is not path counting
Two routes may reach one node. A reachability query can report that node once; an evidence or path-count query may need both routes. Choose the result meaning before choosing a visited-set optimization.
:::

:::warn Watch out
A small requested output does not bound graph exploration. High-degree hubs, late filters, and ranking can expand many candidates first. Track inspected edges and frontier growth rather than only final result count.
:::

:::interview Interview lens
**"Why use a graph instead of joins?"** I show the recurring typed path query and the adjacency work it requires, then compare its measured cost with a relational alternative. I bound high-degree expansion and define permission handling. A direct key lookup or simple fixed join is not sufficient reason by itself to add another database.
:::

:::key In one breath
Graphs make nodes, typed edges, and paths explicit. Traversal cost depends on frontier growth, degree, filters, cycles, and result meaning. Distinct-node reachability needs different state from path counting. SQL and NoSQL labels cannot choose an architecture without the operations, invariants, failure contracts, and maintenance cost each store must support.
:::
