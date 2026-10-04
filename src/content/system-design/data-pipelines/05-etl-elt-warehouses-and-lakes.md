@part V | ETL, ELT, warehouses, and lakes | We choose where transformation happens and where data waits. Storage names do not establish schema quality or governance. We will trace ETL and ELT, warehouse tables, lake files, and the metadata needed to interpret them. | where:5

## 17. ETL transforms before the target

A source event contains a team identifier and a scoring value. The pipeline extracts it, validates and transforms it, then loads a cleaned target row. **ETL** means extract, transform, and load in that order. The target receives the prepared representation instead of every raw source field.

This can enforce a target contract early and avoid carrying unnecessary sensitive data downstream. It also makes the transformation pipeline a dependency for loading. A bug in the transform may require replay from retained raw inputs or the authoritative source. Keep a source identity and transformation version so a target row can be explained.

@fig sd_data_pipelines_etl | Illustrative ETL order. Input identity and transformation version travel into lineage or operational metadata.

Transformation can include type conversion, normalization, reference-data joins, and derived fields. It is not necessarily a large distributed job. A small deterministic process can be enough for a small workload. Match the processing tool to the actual data size, latency, and recovery requirement rather than choosing a framework before the query is known.

:::story Picture this
One archive desk cleans and labels each slip before filing it. Another files the original slips and lets researchers create cleaned tables afterward. The first resembles ETL and the second ELT. Both still need to know where a slip came from and how corrections reach the archive.
:::

## 18. ELT loads a raw representation first

The source sends accepted records into a durable target, and transformations later produce query-oriented tables there. **ELT** means extract, load, and transform. It preserves an earlier target copy of the source representation, which can support multiple derived views and repaired transformations.

Raw does not mean unvalidated or permanently retained. Check format, size, source authenticity, and sensitive-field policy before loading. A malformed or hostile payload can damage downstream availability, while personal data still has retention and access rules. The raw layer also needs a schema or metadata contract sufficient to interpret its bytes later.

@fig sd_data_pipelines_elt | Illustrative ELT order. Controlled raw storage still validates boundaries and applies access and retention rules.

A loaded raw dataset should identify which schema version produced each record and how readers resolve it. Adding an optional field can be compatible under a stated rule; changing a field meaning is a semantic migration. Keep transformation code aware of supported versions. Otherwise delayed old records can be parsed using a newer meaning and create plausible wrong answers.

ETL and ELT can coexist. A minimal extraction transform can remove secrets, while analytical transformations occur in the destination. The useful design question is which stage owns each validation, semantic change, and replayable boundary. The acronym alone does not explain correctness or data quality.

## 19. A warehouse serves structured analytical questions

An analyst wants a consistent table of match totals and team dimensions. A **data warehouse** is a managed analytical store organized to support such queries over integrated data. It often uses structured tables and query-oriented execution, but its exact architecture depends on the system.

A **fact table** stores measurable events or observations, while a **dimension table** stores descriptive context such as team or venue. Joining a score fact to a team name seems simple until the name changes. If the report needs the historical name, store a versioned dimension or effective-time relationship. If it needs the current name, state that interpretation.

@fig sd_data_pipelines_warehouse | Illustrative analytical schema. Dimension history determines what past facts mean when descriptive attributes change.

Define grain before summing. **Grain** is what one row represents, such as one accepted scoring event or one match-day total. Joining a one-event table to multiple tags can multiply rows and inflate sums. A correctly stored warehouse can still produce wrong totals through an incorrect query relationship.

:::note Grain is part of the schema contract
A column called total does not reveal whether a row is per match, per team, per hour, or already cumulative. Put the row meaning in the table contract. Query authors need it to decide which values can be added and which are replacements.
:::

## 20. A lake stores files with another interpretation layer

Heron retains raw event files for repair and additional analyses. A **data lake** stores data, often in object storage, for later processing and interpretation. It can contain structured column files, raw messages, media, and other formats. Its value is storage flexibility, not an automatic absence of schema.

A **catalogue** records datasets, schemas, locations, ownership, and other interpretation metadata. A **table format** can coordinate file membership, snapshots, and updates for a logical table. Without a reliable metadata boundary, a directory of files can expose partial writes or inconsistent file sets to different readers.

@fig sd_data_pipelines_lake | Illustrative controlled lake path. Storage bytes and logical table visibility are separate responsibilities.

Small files create listing, open, and metadata overhead. Under an illustrative file-per-minute policy, Heron creates 1,440 daily files of 240,000 payload bytes each. Combining a day's 345,600,000 bytes into target chunks of 128,000,000 requires three files by ceiling division. These are teaching sizes, not recommended universal file settings.

:::warn Watch out
Do not infer complete batch visibility by listing whatever files happen to exist. A task can have written only some outputs or left failed attempts. A committed manifest or table snapshot should name the successful file set.
:::

:::interview Interview lens
**"Data lake or warehouse?"** I would first name the data types, query patterns, governance, and freshness requirements. A lake can retain flexible file representations, but still needs schema and snapshot metadata. A warehouse organizes integrated analytical tables and their query execution. They can form stages of one pipeline rather than mutually exclusive choices.
:::

:::key In one breath
ETL and ELT name whether transformation precedes or follows loading. Both need validation, lineage, replay, and sensitive-data controls. Warehouses organize analytical tables whose grain and dimension history matter. Lakes store flexible files whose catalogue and committed file-set boundary make them interpretable and safely queryable.
:::
