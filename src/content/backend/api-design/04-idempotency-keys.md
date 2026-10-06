@part IV | Idempotency keys | We build the server side of the idempotency key that Unit I introduced, so that any POST can be retried safely. Payments, orders and messages are all POSTs, and networks lose responses every day. We will design the storage with request fingerprints, then handle concurrent duplicates, expiry and the storage cost. | where:4

## 12. Idempotency key storage and request fingerprinting

Unit I showed the problem. The Wren app sends `POST /payments`, the server charges the card, the response is lost, and a blind retry charges again. The client's half of the fix is to generate an idempotency key once per user action and send it on every attempt. The server's half is a table that remembers what happened to each key, and the details of that table decide whether the scheme actually works.

Each row holds the key, the user who sent it, a fingerprint of the request, a status and the stored response. The primary key is `(user_id, key)`, not the key alone, so that two users who happen to generate the same key cannot collide, and so that one user cannot read another user's stored response by guessing their key. The **request fingerprint** is a hash, such as SHA-256, of the method, path and a canonical form of the body. It answers a question the key alone cannot. If the same key arrives with a different body, say an amount of 4,500 instead of 450 because of a client bug, the server must not return the stored response for the 450 payment as though it applied to the new request. It returns 422, "key reused with a different request".

@fig be_idem_store | One row per client operation. Keyed by user and key, checked against a fingerprint.

The essential rule is that the key row and the business effect commit together. When the payment record and the `done` status with its response are written in the same database transaction, there are only two possible states after a crash, neither written or both written. If they were written separately, a crash between the charge and the key update would leave a charged card with no record of the key, and the next retry would charge again. When the effect lives in another system, such as a payment provider, pass the same key to that system as well. Stripe, Adyen and most payment providers accept their own idempotency keys for exactly this reason, so the whole chain is retry-safe.

What should be stored as the response? Store the status code and body of successful and deterministic failures, such as 201 or 422, so a retry gets exactly the same answer. Do not store transient failures such as a 503 from a dependency. The client should be able to retry those and get a real attempt, so on a transient failure the server deletes the row or marks it retryable.

## 13. Concurrent duplicates, expiry and cost

Retries are not always sequential. A client with an aggressive timeout may send its second attempt while the first is still running, and a user may double-tap the pay button on a slow network. If both requests check the table, see no key and proceed, the customer pays twice, and the idempotency table did nothing.

The fix uses the database's uniqueness guarantee as the referee. The first step of handling a request is to insert the key row with status `running`. Two concurrent inserts of the same `(user_id, key)` cannot both succeed. One gets the row, and the other gets a unique-constraint violation. The winner performs the payment and updates the row to `done` with the response. The loser returns `409 Conflict` with a body that says a request with this key is in progress, and the client retries a moment later and receives the stored result. Some implementations make the loser wait for the winner instead, which is friendlier but ties up a connection.

@fig be_idem_concurrent | Both copies try to insert. The unique constraint lets exactly one proceed.

A running row needs a lease. If the winner crashes after inserting `running` and before finishing, the row would block that key forever. Store a `locked_until` time, such as 60 seconds ahead. After it passes, a retry may take over the row, after first checking with the payment provider, using the same key, whether the charge happened.

Keys expire. Wren keeps them for 24 hours, longer than any client's retry window, after which the same key may be reused or simply no longer matters. At 50 payments per second, 24 hours means 50 × 86,400 = 4,320,000 rows. At about 300 bytes per row including the stored response, that is 1,296,000,000 bytes, about 1.3 GB. That is manageable in PostgreSQL if old rows are removed efficiently, ideally by partitioning the table by day and dropping yesterday's partition rather than running large DELETE statements, or in Redis with a TTL per key if the effect and the key do not need to commit in the same transaction.

@fig be_idem_size | 4.32 million keys and about 1.3 GB for a day of payments. Expiry must be cheap.

:::story Picture this
A cloakroom with numbered tickets that customers bring from home. The first person with ticket 7f3a gets a hook, and the attendant writes "in progress" on the board. Someone who shows up with the same number while the coat is being hung is told to wait. Anyone who comes later with 7f3a is handed the same claim slip as before. After a day, the board is wiped.
:::

:::warn Watch out
An idempotency key generated per HTTP attempt instead of per user action does nothing, because every retry looks new. So does a key generated on the server. The key must be created by the client before the first attempt, stored with the pending operation, and reused for every retry of it, including after an app restart.
:::

:::interview Interview lens
**"Design idempotency for POST /payments."** The client sends an Idempotency-Key generated once per user action. The server inserts (user, key, request fingerprint, status running, lease expiry) under a unique constraint, so concurrent duplicates lose and get 409. The winner performs the charge, passing the same key to the payment provider, and stores the status and response in the same transaction as the payment record. Later requests with the key get the stored response, a different fingerprint gets 422, transient failures are not stored, and keys expire after 24 hours, dropped by daily partition.
:::

:::key In one breath
The server stores one row per (user, idempotency key) with a request fingerprint, a status and the response, and commits it in the same transaction as the business effect, passing the key on to downstream providers too. A reused key with a different fingerprint gets 422, and transient failures are not stored. Inserting a `running` row first lets the unique constraint pick one winner among concurrent duplicates, with a lease so crashed attempts do not block forever. Keys expire after a window longer than any retry, 4,320,000 rows and about 1.3 GB per day at 50 payments per second for Wren, removed cheaply by partition.
:::
