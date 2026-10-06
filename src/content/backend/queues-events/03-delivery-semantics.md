@part III | Delivery semantics | We pin down what a messaging system promises about how many times each message is handled. The honest answer is almost always "at least once", and good systems are built to make the extra deliveries harmless. We will cover at-most-once and at-least-once, why exactly-once is so hard, and idempotent consumers. | where:3

## 7. At-most-once and at-least-once

A **delivery guarantee** says how many times a consumer will process each message in the presence of crashes and network failures. The guarantee a system gives is decided mostly by one choice, when the consumer acknowledges.

If the consumer acknowledges first and then does the work, a crash during the work loses the message. The broker already forgot it. Each message is processed zero or one times, which is **at-most-once** delivery. It suits data where a gap is harmless and a duplicate is not, such as metrics samples or a "typing..." indicator in a chat.

If the consumer does the work first and then acknowledges, a crash after the work but before the ack makes the broker redeliver, and the work runs again. Each message is processed one or more times, which is **at-least-once** delivery. It is the default for almost every job system, SQS, RabbitMQ with manual acks, Kafka with commits after processing, because losing a receipt, a refund or a kitchen ticket is worse than repeating it, provided the repeat is harmless.

@fig be_q_semantics | Never twice but maybe never, never lost but maybe twice, or twice delivered and once applied.

The crash is not the only source of duplicates. A visibility timeout that expires too early redelivers, as Part II showed. A network failure can lose the ack itself, so the consumer believes it acknowledged and the broker never heard. A producer that times out waiting for the broker's confirmation retries the publish, and if the first publish actually succeeded, the message is now in the queue twice. Every one of these is routine. A system processing 50 jobs a second will see duplicates daily.

@fig be_q_ack_order | Acknowledge before the work and a crash loses it. Acknowledge after and a crash repeats it.

Order matters for the same reason. If a consumer acks message 1, then processes 2 and 3 in parallel and crashes after 3 but before 2, a broker that tracks a single position, like Kafka, may redeliver both. A broker that tracks individual acks, like SQS, redelivers only 2, after 3 has already been applied. Part IV looks at how retries reorder messages.

The practical stance follows. Choose at-least-once, accept that duplicates will arrive, and make the consumer handle them. That combination is what people mean, when they are being careful, by "effectively once".

## 8. Why exactly-once is hard

**Exactly-once delivery**, every message processed exactly one time, sounds like what everyone wants, and in the general case it cannot be guaranteed. The problem is not the broker. It is that processing a message usually changes something outside the broker, and the broker and that other system cannot commit together.

Take the receipt worker. It sends an email through the provider's API, then acknowledges the message. If the worker crashes between the two, the email was sent and the message was not acknowledged. The broker redelivers, and the email goes out twice. Swap the order, ack then send, and a crash between them loses the email. There is no order of two separate operations that survives a crash between them. The worker could ask the provider "did I already send this?", but only if the provider remembers, which is exactly the idempotency key from Unit V.

@fig be_q_exactly_once | Sending and acknowledging are two events in two systems. A crash between them must be survived.

This is a version of the **two generals problem**, described in 1975, in which two parties communicating over an unreliable channel can never both be certain they agree. Any protocol that confirms a message needs a confirmation of the confirmation, and so on. Distributed transactions with two-phase commit can make two resource managers commit together, but they block when the coordinator fails, need every participant to support them, and are rarely available for third-party APIs like an email provider.

What systems can offer is exactly-once **processing within a boundary**. Kafka transactions, Part VI, make a read-process-write cycle atomic when the input, the output and the offsets all live in Kafka. A database can make "apply the effect and record the message id" atomic when both live in the same database, the inbox pattern below. Inside the boundary, effects happen once. At the boundary, such as an email or a payment, idempotency keys pushed to the external system carry the guarantee across.

So when someone says a system is exactly-once, the right question is "exactly once for which effects?" The honest answer for most backends is at-least-once delivery, with idempotent effects that make the duplicates invisible.

## 9. Idempotent consumers

An operation is **idempotent** if doing it twice has the same effect as doing it once. Unit I defined the term for HTTP methods, and Unit V built idempotency keys for APIs. Consumers need the same property, and there are three ways to get it.

The first is natural idempotency. Some operations already have it. "Set order 124's status to paid" can run twice safely. "Add 1 to the order count" cannot. Rewriting effects as absolute states rather than increments, `SET status = 'paid'` rather than `count = count + 1`, removes the problem for many consumers, though it needs care when messages can arrive out of order.

The second is a conditional update. The consumer applies the effect only if the state is what it expects, `UPDATE orders SET status = 'paid' WHERE id = 124 AND status = 'placed'`. A duplicate finds the status already `paid` and updates nothing. Version numbers, as in Unit VI's optimistic locking, generalize this, and they also reject stale messages that arrive late.

The third, and the most general, is the **inbox pattern**, also called a processed-messages table. Every message carries a unique id, set by the producer. The consumer, in one database transaction, inserts the message id into an `inbox` table with a unique constraint and applies the effect. If the insert fails with a unique violation, the message was already handled, and the consumer acknowledges it and moves on. The effect and the record of it commit together, so there is no window in which one happened without the other.

@fig be_q_inbox | The message id and the effect commit together. A duplicate trips the unique constraint and is skipped.

The inbox grows forever unless trimmed. Wren keeps ids for 7 days, longer than any plausible redelivery delay and equal to Kafka's retention, and deletes older rows in batches. For effects outside the database, such as the email, the consumer passes the message id as the idempotency key to the provider, so the provider deduplicates. Where a provider offers no such key, the consumer records "sending" before the call and "sent" after it, and a duplicate that finds "sending" from a crashed attempt must decide, usually by checking the provider's logs or accepting a rare duplicate email.

:::story Picture this
A bank teller who receives the same paying-in slip twice, once by hand and once by post. A careless teller credits the account twice. A careful one checks the slip's serial number against the day's ledger, sees it was already processed, and files the second copy. The post office cannot promise to deliver each slip exactly once. The teller can make sure each slip counts exactly once.
:::

:::note Message ids
The producer should set the message id, not the broker, so a producer retry carries the same id and the consumer can deduplicate it. A good id is derived from the business event, such as `order-124-paid`, or is a UUID generated once when the event is created and stored with it in the outbox of Part IX.
:::

:::warn Watch out
"We use Kafka, so we have exactly-once" is a common and dangerous claim. Kafka's exactly-once covers records and offsets inside Kafka. A consumer that writes to PostgreSQL, calls an API or sends an email is outside that boundary and still needs idempotent effects.
:::

:::interview Interview lens
**"How do you get exactly-once processing from an at-least-once queue?"** You make the effects idempotent. Give every message a producer-assigned id, and in the same database transaction as the effect, insert that id into an inbox table with a unique constraint, so a redelivery trips the constraint and is acknowledged without repeating the effect. Prefer absolute or conditional updates where possible, and pass the message id as an idempotency key to external systems. True exactly-once delivery across separate systems is impossible because the effect and the acknowledgement cannot commit together.
:::

:::key In one breath
Acknowledging before the work gives at-most-once delivery and loses messages on a crash, acknowledging after gives at-least-once and repeats them, and duplicates also come from expired timeouts, lost acks and producer retries. Exactly-once delivery across systems is impossible, like the two generals problem, because the effect and the ack cannot commit together, so systems offer exactly-once processing inside a boundary. Consumers become idempotent through absolute states, conditional updates or an inbox table whose unique message id commits with the effect, plus idempotency keys for external calls.
:::
