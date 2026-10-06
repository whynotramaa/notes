@part IX | Outbox, inbox and sagas | We solve the problem every event-driven system meets on its first day, changing the database and publishing an event as one reliable step. Then we stretch a business process across several services that cannot share a transaction. We will cover the dual-write problem, the transactional outbox and its relays, and sagas with their compensations. | where:9

## 26. The dual-write problem

Wren's order service must do two things when an order is placed. It inserts the order into PostgreSQL, and it publishes `OrderPlaced` to Kafka. The naive code does one after the other.

```text
BEGIN; INSERT INTO orders ...; COMMIT;
kafka.send("order-events", OrderPlaced(124))
```

If the process crashes between the commit and the send, or Kafka is unreachable for a minute, the order exists and the event does not. The kitchen never hears of order 124, and the customer waits for food that nobody is cooking. Reversing the order does not help. Publish first and then commit, and a failed commit leaves the kitchen cooking an order that does not exist. Doing the send inside the transaction, before `COMMIT`, is no better, since the send succeeds immediately and the commit can still fail.

@fig be_ev_dual_write | Two writes to two systems with no shared commit. A crash between them leaves them disagreeing.

This is the **dual-write problem**. Any time code writes to two systems, a database and a broker, a database and a cache, a database and a search index, a failure between the writes leaves them inconsistent, and nothing will ever repair it. Retrying the send in application code narrows the window but cannot close it, because the process can die before it retries.

Distributed transactions would solve it in principle, by making PostgreSQL and Kafka commit together through two-phase commit, but Kafka does not participate in XA transactions, and the coordination costs latency and availability. The practical solutions all have the same shape. Write to one system atomically, and derive the second write from the first, reliably and repeatedly, until it succeeds.

The same problem hides in other places. Unit VII's cache invalidation after a database write is a dual write, which is why it has a TTL as a safety net and change events as a better option. Sending an email after committing is a dual write, which is why the email is a job. Recognising the shape is half the skill.

## 27. The transactional outbox

The **transactional outbox** puts the event in the database, in the same transaction as the state change. Wren's order service has an `outbox` table with an id, a topic, a key, a payload, a creation time and a published flag. Placing an order inserts the order rows and an outbox row for `OrderPlaced`, and commits once. Either both exist or neither does. There is no window.

@fig be_ev_outbox | The order and its event commit together. A relay publishes the event afterwards, retrying until Kafka confirms.

A separate **relay** process then moves outbox rows to Kafka. It reads unpublished rows, publishes each with the stored key, waits for Kafka's acknowledgement, and marks the rows published or deletes them. If Kafka is down, the rows wait. If the relay crashes after publishing and before marking, it publishes those rows again on restart. Delivery to Kafka is therefore at-least-once, which consumers handle with the event id and the inbox from Part III.

There are two ways to build the relay. A **polling relay** queries the table every 100 ms or so, `SELECT ... FROM outbox WHERE published_at IS NULL ORDER BY id LIMIT 500 FOR UPDATE SKIP LOCKED`, which lets several relay instances share the work as in Unit VI. It is simple and works on any database. It adds steady query load, its latency is the polling interval, and ordering by id can differ slightly from commit order under concurrency, since a transaction that got a lower id can commit later.

@fig be_ev_relay | Poll the outbox table, or let a CDC connector read the WAL and publish in commit order.

A **log-based relay** uses change data capture. Debezium, an open-source CDC platform, reads PostgreSQL's write-ahead log through logical replication, sees each committed outbox insert in commit order, and publishes it, with an outbox event router that turns the row into a proper event on the right topic with the right key. There is no polling, latency is milliseconds, and ordering follows commits exactly. The cost is another system to run and the operational care of replication slots, which hold WAL on the primary until the connector consumes it and can fill the disk if the connector stops.

Outbox rows must be cleaned up, by deleting them once published or by a periodic job. With CDC, the service can even delete the row in the same transaction it inserted it, since the WAL still records the insert for Debezium to read.

The outbox has a mirror image on the consuming side, the **inbox** from Part III. Together they give a reliable chain. The producer's state change and event commit together, delivery is at-least-once, and the consumer's effect and deduplication record commit together.

## 28. Sagas: choreography and orchestration

Placing an order at Wren is not one transaction. It is a business process across four services. The order service records the order, the payment service captures the payment, the kitchen accepts the ticket, and the courier service assigns a rider. Each has its own database. No single transaction spans them, and holding locks across services for minutes would be absurd anyway. A **saga**, a term from a 1987 paper by Hector Garcia-Molina and Kenneth Salem, is a sequence of local transactions, one per service, where each step publishes an event or message that triggers the next, and where failures are handled by **compensating transactions** that semantically undo the steps already completed.

There are two ways to coordinate a saga. In **choreography**, there is no coordinator. Each service listens for the previous step's event and publishes its own. The order service publishes `OrderPlaced`, the payment service reacts and publishes `PaymentCaptured`, the kitchen reacts and publishes `KitchenAccepted`, the courier service reacts and publishes `CourierAssigned`, and the notification service tells the customer at each step.

@fig be_ev_saga_choreo | No conductor. Each service reacts to the event before it and publishes the next.

Choreography is simple to start and keeps services decoupled. As the flow grows, it becomes hard to see. The process exists only as a set of subscriptions spread across repositories, cycles can appear, and answering "where is order 124 stuck?" means reading four services' logs.

In **orchestration**, one component, the **orchestrator**, owns the process. It sends a command to the payment service, waits for the reply, sends the next command to the kitchen, and so on, storing the saga's state for each order, `PAYING`, `COOKING`, `DISPATCHING`, `DONE`, in its own database. Workflow engines such as Temporal, Camunda and AWS Step Functions provide orchestrators with durable state, timers and retries built in.

@fig be_ev_saga_orch | One orchestrator sends commands, tracks each order's state, and runs compensations when a step fails.

Orchestration makes the process explicit, visible and testable in one place, at the cost of a central component that knows about every participant. Wren uses orchestration for order fulfilment, which has many steps, timeouts and failure paths, and choreography for loosely related reactions such as analytics, loyalty points and search updates, which no process depends on.

## 29. Compensations and failure paths

Sagas have no rollback. Once the payment service has committed a captured payment, nothing can make that transaction not have happened. What a saga can do is run a new transaction that undoes its business effect, a **compensating transaction**. Refunding a captured payment compensates for capturing it. Cancelling a kitchen ticket compensates for creating it.

Trace Wren's failure. The payment is captured, the kitchen accepts the ticket, and the courier service finds no rider within 10 minutes. The orchestrator moves the saga into its compensation path and runs the compensations in reverse order. It tells the kitchen to cancel the ticket and the payment service to refund the payment, then marks the order cancelled and notifies the customer.

@fig be_ev_compensation | The courier step fails, so the kitchen ticket is cancelled and the payment refunded, in reverse order.

Compensations bring their own rules. They are business operations visible to the outside world, a refund appears on the customer's statement, so they need product design, not only code. They must be idempotent and retryable, because they will be retried after failures like any other step. And some steps cannot be compensated. Once food is cooked, cancelling the ticket does not uncook it, so the restaurant is paid anyway, which is a business decision encoded in the compensation.

Ordering the steps well reduces the need for compensation. Steps that are hard to undo should come as late as possible. The saga literature calls the point after which the saga will run to completion the **pivot transaction**. Steps before it are compensatable, and steps after it are retried until they succeed. For Wren, assigning a courier before telling the kitchen to start cooking would have avoided cooking food nobody could deliver, a change the team made after this exact incident.

Sagas also lack isolation. While order 124's saga is half done, other services can see its intermediate states, payment captured and no courier yet. Designs handle this with semantic locks, such as a `PENDING` status that other processes respect, and by making intermediate states meaningful to users, "confirming your order".

:::story Picture this
Booking a holiday through three separate companies, a flight, a hotel and a car. There is no single checkout. You book the flight, then the hotel, and then the car company has nothing left. You do not get to unbook the past. You cancel the hotel and cancel the flight, perhaps paying a fee, which is the compensation. A sensible traveller checks the car first, because it was the step most likely to fail.
:::

:::note The listen-to-yourself variant
Another answer to dual writes publishes the event first and has the producer's own consumer update the database from it. The event log becomes the source of truth, close to event sourcing. It avoids the outbox, but the service cannot read its own write until it consumes the event, and validations that need the database must happen before publishing.
:::

:::warn Watch out
A CDC replication slot whose connector has stopped keeps WAL on the PostgreSQL primary forever, and the disk eventually fills, taking the database down. Monitor slot lag, alert when retained WAL passes a threshold, and set `max_slot_wal_keep_size` so PostgreSQL drops an abandoned slot before the disk fills.
:::

:::interview Interview lens
**"How do you update the database and publish an event reliably?"** Use the transactional outbox. Insert the event into an outbox table in the same transaction as the state change, so both commit or neither does, and have a relay publish outbox rows to the broker, either by polling with SKIP LOCKED or by reading the WAL with CDC such as Debezium, marking rows done after the broker confirms. Delivery is at-least-once, so events carry ids and consumers deduplicate with an inbox table. Two-phase commit across the database and broker is avoided because brokers rarely support it and it hurts availability.
:::

:::key In one breath
Writing to a database and a broker separately leaves them inconsistent after a crash between the writes, the dual-write problem, and the fix is to write once atomically and derive the second write. The transactional outbox commits the event row with the state change, and a polling relay or a CDC connector reading the WAL publishes it at-least-once, with an inbox on the consumer side. Multi-service processes run as sagas of local transactions, coordinated by choreography or an orchestrator, and failures run compensating transactions in reverse, with hard-to-undo steps placed after the pivot.
:::
