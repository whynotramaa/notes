@part VII | Webhooks | We receive events that other companies push to us over HTTP, and we send our own to restaurants. A webhook endpoint is a public door that anyone on the internet can knock on, so every request must prove where it came from. We will cover the receiving flow, signatures, timestamps, replays and secret rotation, and duplicates, ordering and sending webhooks reliably. | where:7

## 19. Receiving a webhook

When a payment succeeds, Wren's payment provider does not wait to be asked. It sends an HTTP `POST` to `https://api.wren.example/webhooks/stripe` with a JSON body describing the event, `payment_intent.succeeded` for payment intent `pi_3N…`. This is a **webhook**, an HTTP callback from one system to another when something happens. Payment providers, version control hosts, messaging platforms and shipping companies all use them, and receiving them correctly is a standard backend skill.

The design that survives production has five steps, and the order matters. First, **verify** that the request really came from the provider, by checking its signature, section 20. Second, **persist** the raw event, keyed by the provider's event id with a unique constraint, in an inbox table, Unit VIII. Third, **acknowledge** quickly, returning 200 within a second or two. Fourth, **process asynchronously**, with a worker reading the inbox and doing the actual work, marking the order paid, notifying the kitchen, sending the receipt. Fifth, handle failures in that processing with the retries and dead-letter queues of Unit VIII.

@fig be_wh_flow | Verify, persist, answer within a couple of seconds, and let a worker do the real work.

Acknowledging before processing is the counterintuitive part. Providers wait only a short time for a response, a few seconds to tens of seconds depending on the provider, and treat anything other than a 2xx within that time as a failure to retry. If Wren processed the event inside the request, a slow database or a slow kitchen call would make the response late, the provider would retry, and Wren would receive the same event again while still processing the first. Under load, retries pile on retries. Persisting and acknowledging takes milliseconds and removes the problem, and the inbox makes the eventual processing idempotent.

The endpoint itself needs the usual defences. It accepts only `POST` with the expected content type, limits the body size, is excluded from CSRF protection and session middleware that do not apply to it, and has its own rate limit and bulkhead, so a flood of webhooks, genuine or not, cannot starve the rest of the API. It also returns 2xx for events it does not care about, after verifying them, since a provider that keeps getting errors for an event type will keep retrying it and may eventually disable the endpoint.

Providers retry failed deliveries over long periods. Stripe retries for up to three days with exponential backoff, and GitHub and others have their own schedules. A short outage at Wren therefore means a burst of delayed webhooks when it recovers, which the inbox and asynchronous processing absorb.

## 20. Signatures, timestamps, replays and rotation

Anyone can send a `POST` to Wren's webhook URL. An attacker who sends a fake `payment_intent.succeeded` event for order 124 would get food without paying, unless Wren checks that the event is genuine. Providers sign each webhook with a shared secret, and the receiver must verify the signature before trusting anything in the body.

The common scheme uses an **HMAC**, a hash-based message authentication code, usually HMAC-SHA256. The provider and Wren share a secret, `whsec_…`, set up when the endpoint was registered. For each delivery, the provider computes the HMAC of the timestamp, a dot and the raw request body, and sends it in a header, as in Stripe's `Stripe-Signature: t=1791200000,v1=5257a869…`. Wren recomputes the HMAC over the same bytes with its copy of the secret and compares the two. Only someone who knows the secret could have produced a matching signature, and any change to the body or timestamp changes it.

@fig be_wh_hmac | Recompute the HMAC over the timestamp and the exact raw body, and compare in constant time.

Three implementation details are where receivers go wrong. Use the **raw bytes** of the body, exactly as received, not JSON that has been parsed and re-serialized, which changes spacing and key order and breaks the signature. Compare in **constant time**, with a function such as `hmac.compare_digest` or `crypto.timingSafeEqual`, because an ordinary string comparison that stops at the first differing byte leaks how many leading bytes matched, which can let an attacker forge a signature byte by byte. And reject requests with no signature or an unknown scheme rather than skipping the check.

The timestamp prevents **replay attacks**. An attacker who captures one genuine webhook, from a log or a misconfigured proxy, could send it again later. The signature would still verify, since the body and timestamp are unchanged. Including the timestamp in the signed payload and rejecting deliveries whose timestamp is more than 300 s from Wren's clock makes old captures useless. Within the 5-minute window, the inbox's unique event id rejects a replay as a duplicate.

@fig be_wh_replay | A captured webhook replayed ten minutes later. The signature is valid and the timestamp is too old.

Secrets must be rotated, after a leak, when an engineer with access leaves, or on a schedule. Rotation without dropping events needs an overlap. Wren generates a new secret, configures its receiver to accept signatures from either the old or the new one, tells the provider to start signing with the new one, and some time later removes the old one. Stripe supports exactly this by sending signatures from both secrets during a rotation window.

@fig be_wh_rotation | For a while both secrets are valid. The receiver accepts either until the old one is retired.

## 21. Duplicates, ordering and sending webhooks

Webhooks are delivered at least once, so duplicates are normal. A provider that does not receive Wren's 200, because of a network blip or a slow response, sends the event again with the same event id. The inbox's unique constraint on the event id turns the second delivery into a no-op that still returns 200.

Webhooks are also not delivered in order. The provider may send `charge.refunded` before `payment_intent.succeeded` arrives, if the first delivery failed and was retried. A receiver that applies events as state changes in arrival order can end up wrong. The robust approach treats each webhook as a **hint** that something changed. The worker uses the event to look up the current state of the object from the provider's API, "what is the status of payment intent pi_3N… now?", and acts on that. Order no longer matters, and a missed webhook is caught by the next one or by a periodic reconciliation job that compares Wren's records with the provider's.

@fig be_wh_dupes | Event 1 arrives twice and after event 2. Deduplicate by id, and fetch the current state.

Wren also **sends** webhooks, notifying restaurants' point-of-sale systems about new orders. Sending well mirrors receiving well. Each delivery carries an event id, a timestamp and an HMAC signature over both and the body, with a per-restaurant secret. Deliveries go out from a queue, not from the request path, with a 10 s timeout. Failures are retried with jittered exponential backoff, after 1 minute, 5, 30, 2 hours, 8 and 24, continuing for up to three days.

@fig be_wh_sending | Wren's retry schedule for a restaurant's endpoint, stretching from minutes to a day.

An endpoint that keeps failing must not consume capacity forever. After three days of failures, Wren disables the endpoint, emails the restaurant, and keeps the undelivered events so they can be replayed when the restaurant fixes their system. A dashboard shows each restaurant their recent deliveries, responses and retries, which saves countless support tickets. And because receivers may be slow, Wren's sending workers have their own bulkhead, so one restaurant's slow endpoint cannot delay everyone else's notifications.

Webhook URLs are supplied by customers, which makes them a server-side request forgery risk. A restaurant could register `http://169.254.169.254/` or an internal address and make Wren's servers call it. Unit XIII covers the defences, resolving the address, refusing private ranges and sending from an isolated egress proxy.

:::story Picture this
A courier delivering parcels to a busy office. A sensible receptionist checks the sender's seal, signs for the parcel and puts it on a shelf within seconds, so the courier can leave, and someone opens it later. If the same parcel turns up twice, the receptionist sees the tracking number on the shelf and signs again without opening it. A parcel with a seal that does not match, or a postmark from last month, is refused at the door.
:::

:::note Reconciliation
Webhooks can be lost, delayed for days, or silently disabled by a provider after too many failures. Wren runs a reconciliation job every hour that lists recent payments from the provider's API and compares them with its own records. Any payment the provider shows as succeeded and Wren shows as pending is fixed and alerted. Webhooks make things fast, and reconciliation makes them correct.
:::

:::warn Watch out
Verifying the signature after parsing the JSON, or with a library that re-serializes the body, makes valid webhooks fail verification, and the usual "fix" is to turn verification off. Capture the raw body before any parsing middleware runs, and never ship a webhook endpoint with verification disabled.
:::

:::interview Interview lens
**"Design an endpoint that receives payment webhooks."** Verify the HMAC signature over the timestamp and raw body with the shared secret, in constant time, and reject timestamps outside a 5-minute window. Store the event in an inbox table with a unique constraint on the event id and return 200 within a second or two. A worker processes events asynchronously and idempotently, treating each as a hint and fetching the object's current state from the provider, with retries and a dead-letter queue. Support secret rotation with two valid secrets, rate-limit the endpoint, and run a periodic reconciliation against the provider's API.
:::

:::key In one breath
A webhook receiver verifies, persists by event id, returns 200 within a couple of seconds and processes asynchronously, because slow processing makes providers retry and duplicates multiply. HMAC-SHA256 over the timestamp and the raw body, compared in constant time, proves the sender, the 300 s timestamp window defeats replays, and two secrets overlap during rotation. Deliveries arrive twice and out of order, so the inbox deduplicates and workers fetch current state, with hourly reconciliation as the safety net. Sending webhooks means signing, queuing, retrying over days with backoff, and disabling endpoints that keep failing.
:::
