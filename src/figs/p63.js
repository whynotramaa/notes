import { systemFigure, systemMap, systemCover } from '../lib/system-figures.js';

export function where_sd_nosql(stage=99) { return systemMap("sd_nosql", ["Access-pattern-driven design", "Key-value stores: Redis, DynamoDB", "Document stores: MongoDB", "Wide-column: Cassandra, Bigtable", "Graph databases and SQL vs NoSQL", "Eventual consistency and quorums", "Case study: a complete data model"], stage); }
export function cover_sd_nosql() { return systemCover("sd_nosql", 4, ["NoSQL", "databases"], "NoSQL databases", ["Access-pattern-driven design", "Key-value stores: Redis, DynamoDB", "Document stores: MongoDB", "Wide-column: Cassandra, Bigtable", "Graph databases and SQL vs NoSQL", "Eventual consistency and quorums", "Case study: a complete data model"]); }
export function sd_nosql_access() { return systemFigure("sd_nosql_access", "THE REQUEST DETERMINES THE LOOKUP KEY", "rows", [["latest score", "match_id", "one record"], ["event history", "match_id", "sequence range"]], "bound the amount of work per request"); }
export function sd_nosql_copies() { return systemFigure("sd_nosql_copies", "ONE FACT CAN HAVE SEVERAL DERIVED COPIES", "fan", {"source": "user name", "targets": ["current profile", "historical event label", "search document"]}, "first decide whether history should change"); }
export function sd_nosql_kv() { return systemFigure("sd_nosql_kv", "A KNOWN KEY HAS A DIRECT ACCESS PATH", "flow", ["score:m7", "key lookup", "score value", "version check"], "interface does not specify durability"); }
export function sd_nosql_partition() { return systemFigure("sd_nosql_partition", "ONE PARTITION KEY ORGANIZES A RANGE", "tree", ["match = m7", "sequence 1", "sequence 2", "sequence 3"], "one popular match can dominate its owner"); }
export function sd_nosql_document() { return systemFigure("sd_nosql_document", "KEEP ONE OWNED AGGREGATE TOGETHER", "tree", ["clip c9", "title + owner", "thumbnail key", "encoding variants"], "a flexible schema is still a contract"); }
export function sd_nosql_secondary() { return systemFigure("sd_nosql_secondary", "AN ALTERNATE KEY STILL LEADS TO BASE RECORDS", "flow", ["owner + time", "index entries", "clip identifiers", "clip records"], "index freshness has its own contract"); }
export function sd_nosql_wide() { return systemFigure("sd_nosql_wide", "A ROW KEY CAN GROUP AND ORDER HISTORY", "rows", [["row key", "m7:001", "m7:002", "m8:001"], ["family", "score", "score", "score"]], "key order chooses locality"); }
export function sd_nosql_buckets() { return systemFigure("sd_nosql_buckets", "BOUND A GROWING HISTORY WITH BUCKETS", "tree", ["match history", "older bucket", "recent bucket", "current bucket"], "distribution changes how reads merge"); }
export function sd_nosql_graph() { return systemFigure("sd_nosql_graph", "RELATIONSHIPS EXPAND THE CANDIDATE SET", "fan", {"source": "viewer", "targets": ["follows scorer", "belongs to group", "supports organizer"]}, "bound the expansion, not just the final page"); }
export function sd_nosql_choice() { return systemFigure("sd_nosql_choice", "THE DATA CONTRACT CHOOSES THE MODEL", "split", [["authoritative ledger", "cross-record invariants\ntransaction boundary"], ["derived read view", "access-specific layout\nrebuild and freshness"]], "SQL versus NoSQL is more than scale"); }
export function sd_nosql_versions() { return systemFigure("sd_nosql_versions", "DELAYED UPDATES MUST NOT GO BACKWARDS", "rows", [["arrives", "version 8", "version 7"], ["stored", "accept 8", "reject 7"]], "deletions also need an ordering rule"); }
export function sd_nosql_quorum() { return systemFigure("sd_nosql_quorum", "FIXED READ AND WRITE SETS INTERSECT", "matrix", {"rows": ["write set", "read set"], "cols": ["A", "B", "C"], "values": [["yes", "yes", "no"], ["no", "yes", "yes"]]}, "overlap is necessary information, not a full protocol"); }

export function sd_nosql_key_order() { return systemFigure("sd_nosql_key_order", "STRING ORDER MUST MATCH THE INTENDED RANGE ORDER", "rows", [["unpadded", "1", "10", "2"], ["fixed-width", "001", "002", "010"]], "encoding decides lexical locality"); }

export function sd_nosql_scan() { return systemFigure("sd_nosql_scan", "A SMALL RESULT CAN HIDE A LARGE CANDIDATE SET", "flow", ["100,000 examined", "filter + sort", "20 returned", "5,000 per result"], "limit work, not only the page"); }

export function sd_nosql_snapshot() { return systemFigure("sd_nosql_snapshot", "THE SAME NAME CAN ANSWER TWO DIFFERENT QUESTIONS", "split", [["event snapshot", "name observed then\nrename leaves it fixed"], ["current profile", "name known now\nrename changes view"]], "define meaning before propagation"); }

export function sd_nosql_conditional() { return systemFigure("sd_nosql_conditional", "CHECK AND UPDATE SHARE ONE ATOMIC BOUNDARY", "sequence", {"actors": ["worker A", "record", "worker B"], "steps": [[0, 1, "expect 7, propose 8"], [1, 0, "condition passes"], [2, 1, "expect 7, propose 8"], [1, 2, "condition fails: now 8"]]}, "a separate read is insufficient"); }

export function sd_nosql_cache_role() { return systemFigure("sd_nosql_cache_role", "IDENTICAL KEYS CAN HAVE DIFFERENT RECOVERY DUTIES", "split", [["derived cache", "entry disappears\nrebuild from source\nbound miss demand"], ["authoritative store", "acknowledged fact\nmust survive promised failure\nreplay accepted changes"]], "the interface does not decide authority"); }

export function sd_nosql_persistence() { return systemFigure("sd_nosql_persistence", "ACKNOWLEDGEMENT MUST NAME ITS PERSISTENCE BOUNDARY", "flow", ["memory change", "append log", "flush boundary", "success response"], "state the required order"); }

export function sd_nosql_embedding() { return systemFigure("sd_nosql_embedding", "OWNERSHIP AND GROWTH DECIDE THE AGGREGATE BOUNDARY", "split", [["owned variants", "800 B base\n3 \u00d7 200 B descriptors\n1,400 B metadata"], ["growing comments", "100,000 \u00d7 200 B\nseparate paged records\nindependent lifecycle"]], "metadata is not the media payload"); }

export function sd_nosql_schema_migration() { return systemFigure("sd_nosql_schema_migration", "READERS MUST UNDERSTAND BOTH SHAPES DURING CHANGE", "flow", ["compatible reader", "new writer", "bounded backfill", "remove old shape"], "rollback must read new records too"); }

export function sd_nosql_index_updates() { return systemFigure("sd_nosql_index_updates", "AN INDEXED KEY CHANGE HAS REMOVALS AND ADDITIONS", "rows", [["base record", "1 update"], ["index A", "remove old", "add new"], ["index B", "remove old", "add new"], ["logical total", "5 mutations"]], "batching does not remove maintenance"); }

export function sd_nosql_backfill() { return systemFigure("sd_nosql_backfill", "SCAN COMPLETION IS NOT VIEW READINESS", "flow", ["100 s scan", "2,000 updates wait", "980/s spare replay", "2.0408 s catch-up"], "verify source coverage and progress"); }

export function sd_nosql_prefixes() { return systemFigure("sd_nosql_prefixes", "SPREAD WRITES, THEN MERGE ORDERED READS", "split", [["one hot owner", "10,000 writes/s\nlocal ordered range"], ["four prefixes", "2,500 writes/s each\nfour ordered streams\nreader merges"]], "distribution changes the query plan"); }

export function sd_nosql_clustering() { return systemFigure("sd_nosql_clustering", "PARTITION LOCATES THE GROUP, CLUSTERING ORDERS IT", "rows", [["partition", "match m7", "bucket identifier"], ["clustered rows", "sequence 001", "sequence 002"], ["query", "known group", "bounded sequence range"]], "another order needs another route"); }

export function sd_nosql_bucket_boundary() { return systemFigure("sd_nosql_bucket_boundary", "ONE WINDOW CAN CROSS TWO STORAGE BUCKETS", "rows", [["previous bucket", "read its tail"], ["current bucket", "read its beginning"], ["merged page", "ordered sequence"]], "window width is not bucket count"); }

export function sd_nosql_query_tables() { return systemFigure("sd_nosql_query_tables", "QUERY COPIES ADD WRITES BEFORE REPLICATION", "flow", ["20 events/s", "3 representations", "60 logical writes/s", "180 copy writes/s"], "repair and deletes reach every view"); }

export function sd_nosql_traversal() { return systemFigure("sd_nosql_traversal", "TRAVERSAL CARRIES FRONTIER AND VISITED STATE", "flow", ["viewer frontier", "typed-edge filter", "next frontier", "bounded results"], "result limits do not bound expansions"); }

export function sd_nosql_expansion() { return systemFigure("sd_nosql_expansion", "TREE FRONTIERS GROW WITH EACH HOP", "bars", [["first hop", 3, "candidates"], ["second hop", 9, "candidates"], ["third hop", 27, "candidates"]], "39 total expansions through three hops"); }

export function sd_nosql_dedup() { return systemFigure("sd_nosql_dedup", "DIFFERENT PATHS CAN REACH THE SAME NODE", "rows", [["neighbors A", "x", "y", "z"], ["neighbors B", "y", "z", "w"], ["neighbors C", "z", "w", "v"], ["distinct set", "x, y, z, w, v"]], "nine entries, five distinct nodes"); }

export function sd_nosql_lag() { return systemFigure("sd_nosql_lag", "SOURCE POSITION AND VIEW POSITION REVEAL BACKLOG", "flow", ["20 events/s", "5 s behind", "100 events wait"], "eventual alone does not bound delay"); }

export function sd_nosql_apply_boundary() { return systemFigure("sd_nosql_apply_boundary", "RECOVERABLE PROGRESS FOLLOWS APPLIED SOURCE STATE", "sequence", {"actors": ["source", "consumer", "view"], "steps": [[0, 1, "event + identity + version"], [1, 2, "conditional apply"], [2, 1, "applied or already present"], [1, 0, "advance recoverable progress"]]}, "replay must not duplicate the effect"); }

export function sd_nosql_tombstone() { return systemFigure("sd_nosql_tombstone", "A DELETION NEEDS AN ORDERING MARKER", "rows", [["current record", "version 8"], ["delete accepted", "tombstone 9"], ["delayed update", "version 7: reject"], ["cleanup", "only after safe boundary"]], "absence alone can allow resurrection"); }

export function sd_nosql_repair() { return systemFigure("sd_nosql_repair", "CATCH-UP USES CAPACITY LEFT AFTER NEW EVENTS", "flow", ["100 waiting", "40 applied/s", "20 new events/s", "5 s catch-up"], "reserve spare replay capacity"); }

export function sd_nosql_authority() { return systemFigure("sd_nosql_authority", "DERIVED MODELS DO NOT INDEPENDENTLY COMMIT TRUTH", "fan", {"source": "accepted event owner", "targets": ["latest score view", "ordered history view", "optional scorer view"]}, "every copy knows its source"); }

export function sd_nosql_event_trace() { return systemFigure("sd_nosql_event_trace", "ONE SOURCE ID CONNECTS ACCEPTANCE WITH SAFE REPLAY", "sequence", {"actors": ["scorer", "source owner", "views"], "steps": [[0, 1, "identity + expected sequence"], [1, 0, "accepted source position"], [1, 2, "replayable accepted event"], [2, 1, "recoverable view progress"]]}, "declare which readers may lag"); }

export function sd_nosql_full_budget() { return systemFigure("sd_nosql_full_budget", "COUNT SOURCE PAYLOAD AND MAINTAINED COPY WORK", "rows", [["source payload", "4,000 B/s"], ["source day", "345.6 MB"], ["three source copies", "1,036.8 MB"], ["view copy writes", "180/s"]], "logs and indexes remain extra"); }

export function sd_nosql_new_query() { return systemFigure("sd_nosql_new_query", "A NEW SCORER VIEW NEEDS A READINESS BOUNDARY", "flow", ["source checkpoint", "backfill records", "catch up changes", "verify + route reads"], "incomplete results need explicit meaning"); }

export function sd_nosql_defense() { return systemFigure("sd_nosql_defense", "DEFEND EACH STORE WITH ITS QUERY AND RECOVERY CONTRACT", "rows", [["known-key score", "versioned latest view"], ["match history", "bounded ordered buckets"], ["clip metadata", "bounded owned document"], ["relationship query", "bounded derived graph"]], "one fact owner, explicit derived copies"); }
