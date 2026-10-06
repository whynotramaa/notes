@part VIII | Event-driven design | We step back from brokers to the way events shape a system's design. Treating "an order was placed" as a published fact rather than a list of calls to make changes who depends on whom. We will cover events versus commands and the event bus, event schemas and their evolution, and eventual consistency, replay, event sourcing and CQRS. | where:8

## 23. Events, commands and the event bus

Messages come in two flavours that look alike and behave differently. A **command** asks one specific service to do something, such as `PlaceOrder` or `SendReceipt`. It is phrased in the imperative, has one intended handler, and can be refused. The sender cares about the outcome. An **event** reports that something happened, such as `OrderPlaced` or `PaymentCaptured`. It is phrased in the past tense, is a fact that cannot be refused, and has no addressee. Its producer neither knows nor cares who reads it.

@fig be_ev_command_event | A command is a letter to one service. An event is a notice pinned to a board for anyone to read.

The difference shapes dependencies. If the order service sends commands, "tell the kitchen", "tell the email service", "tell analytics", it must know every downstream service and change each time one is added. If it publishes `OrderPlaced` and lets services subscribe, adding a loyalty-points service next quarter needs no change to the order service at all. That direction of knowledge is the main reason teams adopt events.

An **event bus** is the shared channel where events are published, in Wren's case Kafka topics such as `order-events`. Services publish their own events and subscribe to others. This is **publish-subscribe**, pub/sub in the general sense, of which Redis pub/sub in Unit VII was a fire-and-forget special case. Kafka's durable version lets subscribers be down for a while and catch up.

@fig be_ev_bus | The order service publishes once. Four services subscribe, and a fifth could join tomorrow.

Events carry a cost in visibility. In a call chain, the code shows what happens next. With events, what happens after `OrderPlaced` depends on who subscribes, which lives in other repositories and in configuration. Teams counter this with an event catalogue that lists each event, its schema, its producer and its consumers, and with distributed tracing, Unit XIV, which follows a request across asynchronous hops by carrying a trace id in event headers.

A useful distinction is how much an event carries. A **thin event**, or notification, says "order 124 changed" and lets consumers call back for details, which keeps events small and couples consumers to the producer's API. A **fat event**, or event-carried state transfer, includes the order's relevant fields, so consumers need nothing else. Wren's events carry the fields consumers need, since a callback storm to the order service after every event would undo much of the decoupling.

## 24. Event schemas and evolution

Events outlive the code that produced them. A record written today will be read by consumers deployed next month and replayed by a service built next year. The **event schema**, the names and types of its fields, is therefore a contract, like the API contracts of Unit V, with a longer memory.

Formats with explicit schemas help. **Avro**, **Protobuf** and JSON Schema all describe fields and types, and Avro and Protobuf encode compactly in binary. A **schema registry**, such as Confluent Schema Registry or Apicurio, stores every version of each topic's schema. Producers register a schema before using it, records carry a small schema id, and consumers fetch the matching schema to decode. The registry also checks each new version against a **compatibility** rule and refuses incompatible ones before any producer can use them.

@fig be_ev_schema | Version 2 adds tip_paise with a default of 0. The registry accepts it under BACKWARD compatibility.

The compatibility modes say which readers must understand which writers. **Backward** compatibility means consumers using the new schema can read records written with the old one, so consumers upgrade first. Adding a field with a default and removing a field are backward compatible. **Forward** compatibility means consumers using the old schema can read records written with the new one, so producers can upgrade first. Adding a field is forward compatible, since old readers ignore it. **Full** compatibility is both, and the safe moves under it are adding or removing optional fields with defaults. Kafka's history makes transitive modes, which check against every earlier version rather than only the last, the safer default.

@fig be_ev_compat | Which side must be upgraded first under each mode.

Some changes are never compatible, renaming a field, changing its type from integer to string, or changing its meaning while keeping its name. For those, Wren follows expand and contract from Unit VI. It adds the new field alongside the old, has producers write both, migrates consumers, and stops writing the old field later. When an event's meaning changes fundamentally, it publishes a new event type or topic, `OrderPlaced.v2`, and runs both until consumers have moved.

Every event also carries an envelope with metadata, an event id for idempotency, the event type and version, the time it occurred, the producer, and trace and correlation ids. The CloudEvents specification, a CNCF standard since 2019, defines a common envelope that many teams adopt.

## 25. Eventual consistency, replay, event sourcing and CQRS

When services react to events, their views of the world update at different moments. Order 124 is committed in the order database at time 0. The relay publishes the event at 40 ms. The kitchen board shows it at 120 ms. For 120 ms the order exists and the kitchen does not know. This is **eventual consistency**. Every view converges to the same state if no new changes arrive, with a delay. Designing for it means deciding which delays users can see and making them acceptable, such as showing "sending to the restaurant" until the kitchen confirms.

@fig be_ev_eventual | Committed at 0, relayed at 40 ms, displayed at 120 ms. In between, the views disagree.

Because Kafka keeps history, consumers can **replay** it. A new search service starts from the earliest retained offset and builds its index from a week of events. A consumer with a bug is fixed, its offsets reset to before the bug, and it reprocesses. Replay works only if consumers are idempotent and deterministic, and if side effects such as emails are switched off during the replay.

**Event sourcing** takes this to its conclusion. Instead of storing an order's current state and updating it, the system stores every event that happened to the order, placed with total 450, tip added 30, item removed 80, paid 400, refunded 80, and computes the current state by folding over them. The events are the source of truth, and the current state is derived. Banking ledgers, accounting systems and version control have always worked this way.

@fig be_ev_sourcing | Five events folded into one state. Replaying them always gives the same answer.

Event sourcing gives a complete audit trail, the ability to answer "what did this order look like at 8:03 p.m.", and the freedom to build new views from old history. It costs complexity. Reading current state means replaying events or maintaining snapshots. Changing event schemas is harder, because old events can never be rewritten. And querying across entities, "all orders over 500 rupees today", needs a separate read model. Most teams use it for a few domains where history matters, such as payments and ledgers, not for everything.

**CQRS**, command query responsibility segregation, a term from Greg Young around 2010, separates the model that handles writes from the models that serve reads. Commands go to a write model, which enforces rules and emits events. Read models, **projections**, subscribe to those events and build whatever shape each query needs, a kitchen board keyed by restaurant, a user's order history, a search index. Each projection can use a different store and can be rebuilt by replay.

@fig be_ev_cqrs | One write model decides. Several read models, each shaped for its queries, follow the events.

CQRS pairs naturally with event sourcing but does not require it. Wren's order service writes to ordinary PostgreSQL tables and publishes events through an outbox, and its read models are projections of those events. The price is eventual consistency between the write and read sides, which the UI must handle, for example by showing the user's own new order from the write side until the projection catches up.

:::story Picture this
A town crier and a ledger clerk. The crier shouts "the ship has docked" in the square, and the merchant, the customs officer and the innkeeper each act on it in their own time, some hearing it a minute later than others. The clerk writes every arrival and departure in a book that is never erased, so anyone can work out which ships are in port today, or were in port last Tuesday.
:::

:::note Correlation and causation ids
Each event carries a correlation id, shared by every event in one business flow, such as all events for order 124's journey, and a causation id, the id of the event or command that caused it. Together they let tracing tools rebuild the chain "OrderPlaced caused ChargeRequested caused PaymentCaptured" across services.
:::

:::warn Watch out
Do not leak internal table structure into events. An event that mirrors a database row, with every column and internal flag, couples every consumer to the producer's schema, and a column rename becomes a breaking change across the company. Design events as public contracts, with the fields consumers need and stable names.
:::

:::interview Interview lens
**"What is the difference between an event and a command, and when would you use event sourcing?"** A command asks a specific service to do something and can be rejected. An event is a past-tense fact published for anyone, so the producer does not depend on its consumers. Event sourcing stores the sequence of events as the source of truth and derives state by folding them, which gives full history, time travel and new projections, at the cost of complexity, snapshotting and hard schema evolution. I would use it for ledgers, payments or anything audited, combined with CQRS read models, and keep ordinary state elsewhere.
:::

:::key In one breath
Commands ask one service to act and can be refused, while events are past-tense facts with no addressee, so publishing events on a bus lets new consumers join without changing the producer. Event schemas are long-lived contracts, managed in a registry that enforces backward, forward or full compatibility, with incompatible changes done by expand and contract or a new event type. Consumers converge with a delay, 120 ms for Wren's kitchen board, and Kafka's history enables replay. Event sourcing stores events as the truth and folds them into state, and CQRS separates the write model from projections built for reading.
:::
