@part II | Structured logs and request IDs | We reconstruct the changes inside one request. Without stable fields, separate records cannot tell a shared story. We will follow events, request identifiers, asynchronous work, and sensitive data. | where:2

## 5. Structured logging

An engineer searches a line saying read failed and finds no match ID, version, dependency, or outcome. A **log** is a record of a discrete event. **Structured logging** stores named fields with stable meanings instead of requiring a human to parse an arbitrary sentence.

Emit a score_read_finished event with operation, result, dependency, request identifier, duration, and returned version. Put the variable details in fields, not in the event name. An index can then filter all failed reads without treating every match as a different event type. At the illustrative peak, a 500-byte event for each of 1,000 requests per second produces 500,000 bytes per second and 43,200,000,000 bytes per day. Retaining that stream for seven days requires 302,400,000,000 uncompressed bytes before replicas and indexes.

Compare an event field with a sentence assembled for a human. A query over result equal to stale survives a change in the message wording, while a text search for yesterday's error phrase may stop matching after deployment. Keep match identity, returned version, and request identity as fields with declared types. If an upstream component cannot supply a value, record its absence explicitly instead of inventing a default version. Index only fields needed for the intended query workload, because ingestion and storage pay for those indexes. The record should answer which boundary finished and what it actually observed.

@fig sd_observability_05 | Illustrative structured logging. Stable event fields let a query find stale responses without parsing prose. Orange marks the field-based stale-result query that survives changes in message wording.

Free text can remain useful for a message, but depending on its exact wording for alerts makes editorial changes operational changes. Avoid logging full response bodies when a version and outcome answer the question.

:::story Picture this
A warehouse clerk writes each parcel's tracking number, destination, and handling event on one card instead of scattering facts across loose notes. A later clerk can follow that card through loading and delivery without guessing which parcel a sentence described. The card is useful because its fields keep the same meaning at every handoff.
:::

## 6. Request IDs and correlation

A gateway records a failed request and the API records a successful database read. Without a shared identifier, neither record proves they describe the same operation. A **correlation ID** is a value carried across related records to let a query join their evidence.

The trusted ingress creates or validates an identifier, passes it to downstream calls, and places it in their logs. Each retry should preserve the logical relation while recording an attempt identifier, because the attempts have different timing and outcomes. Do not use a request ID as a database deduplication rule: a client retry can receive a new ingress ID while still requesting the same business effect. The business idempotency key belongs to its own field. A correlation ID supplies grouping; it does not prove causal order or authenticate a caller.

A retry through a new gateway illustrates why correlation and deduplication need separate fields. The new ingress may create another diagnostic identifier while the caller preserves the command key. Within each attempt, propagate the diagnostic identifier through the API and database client; across attempts, retain the business key in approved records. Investigation can now distinguish a dependency result from a repeated user intention. If propagation breaks, a similar timestamp is only a candidate match, especially under concurrent traffic. Do not merge records by time proximity and then present the inferred association as a proven execution history.

@fig sd_observability_06 | Illustrative request IDs and correlation. Carried request identity connects dependency evidence back to the gateway operation. Orange marks the dependency result joining the same request's evidence.

An untrusted caller can forge a correlation ID. Restrict length and characters, never let it inject log syntax, and do not grant access based on it.

:::note Request identity across boundaries
Carry a validated correlation ID across synchronous calls and log an attempt ID for retries. Keep it separate from an idempotency key and from the authorization decision.
:::

## 7. Logging asynchronous work

The API returns before a notification worker runs. Thread-local request context disappears when the request handler ends, so the worker’s error cannot be connected to the accepted command. An asynchronous boundary needs explicit context in the message envelope.

Store the business event ID, the causation identifier, and trace context with the durable event. When a worker receives it, create a processing record containing delivery attempt and outcome. The worker can then show that receipt happened, the side effect completed, and acknowledgement followed. A broker retry preserves the event ID but creates another processing attempt. This distinction lets us count duplicate deliveries without falsely counting duplicate successful effects. Log acknowledgement after the broker accepts it, not when the worker merely intends to send it.

Stop the worker after its effect commits but before acknowledgement reaches the broker. The first processing log should describe the committed effect and the uncertain acknowledgement separately. On redelivery, a new attempt record finds the existing effect identity and records duplicate suppression rather than another successful change. An API request identifier alone cannot reconstruct this sequence if the queued work outlives the request. Carry causation in the durable envelope, including through retry queues, and preserve the original event identity. That makes an absent acknowledgement distinguishable from an absent effect without treating logs as the authority for either.

@fig sd_observability_07 | Illustrative logging asynchronous work. Redelivery creates a fresh attempt under the same durable event identity. Orange marks the retry whose new attempt retains the original event identity.

A log line saying sent is ambiguous unless it names the boundary crossed. Stored locally, accepted by the broker, and applied by a receiver are different states.

:::warn Watch out
Put correlation and causation into the durable envelope, then create fresh processing spans and attempt records at the worker. A queued message can outlive the request that created it.
:::

## 8. Redaction, access, and retention

A scorer’s access token appears in a debug log. The log system now holds a credential in more places than the authentication service intended. **Redaction** removes sensitive fields before they leave the application or collection boundary.

Prefer an allowlist of diagnostic fields to removing a growing list of dangerous names. A nested payload can hide the same secret under another name, and hashing a low-entropy value does not necessarily protect it from guessing. Give operational roles access to the records they need, and separate a security audit stream when its retention and integrity requirements differ. Store identifiers that support investigation without retaining message bodies by default. Apply deletion and retention to exports, replicas, and archived files as well as the primary search index.

Trace a sensitive field through the whole export route. Removing it only in the search interface leaves it in application buffers, collector queues, and archived exports. Instead, emit an allowed diagnostic representation before enqueueing and make the raw payload unavailable to the ordinary logging path. A failed request must follow the same rule as a successful one, because exception formatting often includes arguments. Retention applies to the stored records and their copies, not only the live index. When a missing field limits diagnosis, improve the approved event schema rather than temporarily exporting credentials with debug logging.

@fig sd_observability_08 | Illustrative redaction, access, and retention. Redaction precedes storage, and query permission still limits access to the retained evidence. Orange marks scoped retrieval after redaction and retention have already protected the record.

Redaction after export leaves the raw copy in collectors and buffers. Debug logging must use the same field rules as normal logging.

:::interview Interview lens
**"How do you protect telemetry without losing its diagnostic value?"** Keep secrets out of telemetry at the source, restrict access, and choose retention per purpose. Sampling is a cost policy, not a privacy policy; a sampled secret is still a secret.
:::

:::key In one breath
Structured events preserve facts. Correlation connects records but does not supply ordering. Keep operational identifiers separate from secrets and business deduplication keys.
:::
