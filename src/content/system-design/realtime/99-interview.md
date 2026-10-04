@chapter faq | Interview question bank | Say the mechanism, the guarantee, and the failure boundary aloud.

**Q1. Does a persistent socket guarantee real-time behavior?**

No. It removes repeated connection setup but does not remove source commit, publication, queueing, scheduling, or client rendering delay. Name the source and visible endpoint for the latency requirement. A healthy connected-client budget and a reconnect recovery contract are separate promises.

**Q2. Why use match-local versions?**

They describe the authoritative order needed by that match. Unrelated matches need not share a global serial writer. The client compares versions to detect stale values and gaps. Source timestamps alone cannot safely replace this ordering rule across independent machines.

**Q3. How do event IDs differ from versions?**

An ID answers whether this is the same logical event. A version answers where it belongs in a declared sequence or current-state progression. Duplicate suppression and predecessor continuity are different checks. A correction can reference an old ID while carrying a new current version.

**Q4. When can a viewer skip intermediate states?**

When the product needs current replacement state and a newer snapshot fully represents it. Required deltas, audit logs, and command histories need another rule because skipped input may change the final effect. Declare coalescing eligibility by payload and product purpose.

**Q5. What does polling cost for Heron?**

Fifty thousand viewers divided by a five-second interval gives ten thousand checks each second. Full two-thousand-byte responses carry twenty million payload bytes per second. Uniform arrival relative to polling gives a 2.5-second mean extra wait. These are illustrative workload assumptions.

**Q6. Why is the polling interval not a complete delay bound?**

A change also waits for request service, network transit, retries, and client application. Queued or failed requests can add delay beyond the interval. State healthy-path and failure-path behavior separately. Conditional requests reduce body bytes but do not eliminate the check schedule.

**Q7. How does long polling work?**

The server holds a request until a change or waiting deadline, then the client asks again after its latest version. The registration protocol must avoid missing an event between checking progress and installing the waiter. A retained cursor supplies repair even if a notification race occurs.

**Q8. What resources do long polls use?**

They retain connections, waiter records, and application state. An asynchronous bounded implementation avoids a thread per idle wait, but does not make resources free. Set deadlines and remove canceled waiters. The next request still pays some per-response and request setup work.

**Q9. Why can polling move a screen backward?**

Two requests can return out of order. A slow earlier response may contain an older source version than a faster later response. Apply only appropriate versions at the client. Cancellation is an optimization, while the reducer rule establishes correctness.

**Q10. What is push delivery?**

The service sends updates over an established channel when changes occur, without a new application request per event. It removes repeated empty checks but requires connection management and fan-out. The recipient count remains a multiplicative cost. Compare equal product semantics when choosing between push and polling.

**Q11. When does SSE fit?**

It fits server-to-client text events while commands can remain separate HTTP requests. EventSource has specified event framing and reconnect identity behavior. The server must still retain replay or provide snapshots. It needs proxy buffering and idle-timeout testing like other long-lived responses.

**Q12. What completes an SSE event?**

The event-stream parser uses a blank-line boundary to dispatch the collected record. The id, event, and data fields have specified parsing behavior. Arbitrary newlines inside an application value need correct encoding. Framing errors can leave a seemingly emitted update undispatched.

**Q13. What does Last-Event-ID provide?**

It conveys the last event identity under the browser stream behavior so the server can interpret reconnect progress. It does not retain history or authorize replay by itself. The application defines cursor scope, expiry, and its relationship to source versions.

**Q14. When do WebSockets fit?**

They fit sustained bidirectional framed messages and can carry binary data. Their opening and frame rules differ from ordinary HTTP response bodies. The application still needs authentication, authorization, identity, order, and recovery. A connected channel is not durable history.

**Q15. Are masking and encryption the same?**

No. WebSocket client masking follows a protocol rule with a different purpose. TLS provides protected transport confidentiality and integrity under its security model. Frame-format overhead and TLS overhead belong to different counting boundaries.

**Q16. How do frames differ from messages?**

A frame is one protocol unit, while an application message may span multiple frames. Control frames have separate rules. Limit complete message size as well as individual frame size so fragmentation cannot create unbounded accumulation. Parse the complete application message before accepting its meaning.

**Q17. Why authorize subscriptions?**

Authentication establishes a peer identity but does not grant every topic. Validate the product resource and check the current permission before adding membership. Private suggestions, presence, and history require the same care. A raw broker wildcard must not become an unbounded client-controlled scope.

**Q18. What happens when credentials expire on an open connection?**

Use an explicit renewal or revalidation boundary and react to permission revocation. A successful initial handshake must not preserve access forever. Commands still require authorization at their authoritative effect. The exact flow depends on browser capabilities and credential policy.

**Q19. What does a gateway own?**

It owns live socket state, subscriptions, bounded outgoing queues, and ephemeral progress for its connected clients. Authoritative score and durable event history live elsewhere. A restart changes ownership and triggers reconnect, but need not destroy accepted state. Test capacity with events and churn, not idle sockets alone.

**Q20. How do heartbeats detect failure?**

They observe timely communication and expire a peer after a declared deadline or lease. Missing a response indicates suspicion, since a network problem or overloaded event loop can resemble process failure. The product should name its stale-online bound rather than claim instant certainty.

**Q21. What does a WebSocket Pong answer?**

The protocol reply to a Ping uses the required matching payload behavior. Application code can separately track deadlines and identity. A protocol response establishes communication at that boundary, not that a user looked at the screen. Presence activity can therefore require another observation.

**Q22. What is connection draining?**

Stop new admissions, notify or close existing sessions under a bounded policy, and let clients reconnect with recoverable progress. The load balancer and gateway must agree about leaving ownership. Jitter spreads correlated attempts, while capacity limits enforce admission. Abrupt termination is also a recovery traffic event.

**Q23. Why is sticky routing insufficient?**

It may improve locality while a backend is healthy, but a dead backend cannot restore socket state. A reconnect needs authoritative snapshot or retained history independent of the old gateway. Existing sockets already have backend ownership; preferred routing is not a durability mechanism.

**Q24. How should presence handle multiple devices?**

Track separate connection instances and derive user presence from the chosen aggregate rule. One device disconnecting must not delete another device lease. Instance or generation comparisons protect newer ownership from stale cleanup. Expiration handles crashes that do not send clean disconnect notices.

**Q25. Why is ephemeral pub/sub different from a retained stream?**

A transient notification can disappear while no subscriber is connected. A retained stream supports replay within a declared retention horizon. Both can route live events, but they have different recovery guarantees. Keep an authoritative snapshot when replay is unavailable or insufficient.

**Q26. Do consumer groups broadcast to every gateway?**

A group ordinarily divides partition processing among its members. It does not automatically duplicate each event to every gateway with interested viewers. Add routing from the processing owner or use an appropriate subscription shape. Draw that delivery path explicitly.

**Q27. Why partition by match?**

It can preserve the needed match-local event order while allowing unrelated matches to proceed independently. A popular match may still be a processing hotspot. Gateway fan-out can spread recipients while the authoritative match sequence remains ordered. Global order is a separate stronger requirement.

**Q28. What causes a subscribe-and-snapshot gap?**

An event can occur after the snapshot is read but before subscription becomes active. Without replay, the client misses it. Use a shared source version, durable cursor, and capture protocol ensuring every later change is delivered or recoverable. Timestamps alone do not establish that relationship.

**Q29. What is Heron fan-out bandwidth?**

Twenty events times fifty thousand viewers gives one million deliveries per second. Multiplying by two hundred payload bytes gives two hundred million bytes per second or 1.6 billion bits. These exclude framing, TLS, transport, retries, and other traffic.

**Q30. Does encoding once remove fan-out cost?**

It reduces repeated serialization work and can share immutable data. Each recipient still needs bytes transmitted and independently tracked delivery progress. Queue limits remain per connection. Network egress can dominate despite very cheap shared encoding.

**Q31. How does batching differ from coalescing?**

Batching preserves included logical events while grouping their transport operations. Coalescing keeps a newer replacement state and omits intermediate states. The former spends latency to save per-message work, while the latter changes delivered information. Only an explicit product contract permits coalescing.

**Q32. Why does a slow-client buffer fill?**

If payload production exceeds the connection drain rate, bytes accumulate at the difference. In the exercise four thousand produced minus one thousand drained gives three thousand bytes per second. A sixty-thousand-byte queue fills in twenty seconds. Increasing the buffer cannot fix sustained imbalance.

**Q33. What should happen at a client queue limit?**

Use the declared payload-specific policy. Replaceable state can coalesce; explicitly lossy streams can drop permitted data; required deltas can disconnect and recover from history or a snapshot. Bound bytes and age and isolate the slow client from healthy recipients.

**Q34. Why can a topic be hot despite balanced connections?**

Different topics have different update rates and recipient counts. An idle socket and a busy stream consume different CPU and egress. Route and admit using actual work measures. A connection limit is only one capacity dimension.

**Q35. What should a resume cursor represent?**

The last completed progress at the chosen application boundary, often the highest contiguous applied version. Advancing on receipt before application can skip an unapplied event after a crash. Its scope and retention validity must be checked. A new session can fetch a fresh base when state is lost.

**Q36. What happens to an expired cursor?**

Return an explicit outcome and obtain a compatible versioned snapshot plus tail. Starting from the earliest retained delta can apply it to an invalid base. Retention determines which recovery requests are satisfiable. It does not guarantee every offline duration can be replayed.

**Q37. How do you merge replay and live events?**

Use identity and ordered positions, or hold live delivery behind a bounded replay boundary. Duplicate events across the transition must have harmless effects. A versioned snapshot supplies a base, and only later events apply. Bound any temporary buffer and restart recovery when its contract cannot be preserved.

**Q38. Why is jitter not a hard rate limit?**

Randomly spreading attempts gives an expected arrival rate but permits local bursts. The server still needs a bounded admission rule based on handshake and replay capacity. Keep retry state across flapping connections under a stated reset policy. Recovery traffic must not starve current delivery.

**Q39. What does an application acknowledgement prove?**

Only the named boundary, such as successful parse, reducer application, or durable local effect. A cumulative acknowledgement covers a contiguous applied prefix, not gaps. Gateway buffer release can use that evidence while durable replay remains elsewhere. Do not equate socket writes with screen visibility.

**Q40. How do scoring commands survive retries?**

They carry a stable operation ID and commit a durable effect/result record at the authoritative service. A lost response after commit is repaired by retrying that identity and returning the prior result. A different gateway must still observe the same idempotency record. Subscriber event deduplication protects another boundary.

@chapter exercises | Exercises | One dot is arithmetic, two dots require a trace, and three dots require a design or derivation.

**E1** • Compute normal gateway count.

**E2** • Compute deliveries each second.

**E3** • Compute total payload bytes and bits each second.

**E4** • Compute one gateway delivery and payload rate.

**E5** • Compute broker-to-gateway deliveries for five interested gateways.

**E6** • Compute five-second polling request rate and mean interval delay.

**E7** • Compute full polling payload rate.

**E8** •• Trace a poll response race with versions 102 then 101.

**E9** •• Close the long-poll registration race.

**E10** • Compute the selected end-to-end stage budget.

**E11** •• Count WebSocket frame bytes for a 200-byte payload.

**E12** • Compute per-gateway illustrative connection-state memory.

**E13** • Compute heartbeat average rate and counted bytes.

**E14** •• Find presence expiry after last renewal at 30 with a 90-second lease.

**E15** • Compute spare connection ownership for one gateway loss.

**E16** •• Explain why one consumer group is insufficient for broadcast.

**E17** •• Trace snapshot 101 and event 102 during subscription.

**E18** • Calculate five-event batching payload and selected wait.

**E19** •• Compute slow-client queue growth and fill time.

**E20** • Compute the three illustrative topic delivery rates.

**E21** • Compute replay for a five-second gap.

**E22** • Compute hour and day event-log payload.

**E23** •• Apply arrival sequence 101,102,102,104,103 as required deltas.

**E24** •• Interpret fifty thousand reconnects spread across ten seconds.

**E25** ••• Design gateway-loss recovery including an expired cursor and slow viewer.

@chapter solutions | Worked solutions | The assumptions are illustrative; the calculations are reproducible.

**E1.** Divide fifty thousand viewers by ten thousand connections per gateway to get five. This assumes each gateway meets that connection limit under the real event workload. CPU and egress may require more.

**E2.** Multiply twenty events per second by fifty thousand recipients to get one million deliveries. The producer input count remains twenty. Fan-out is the repeated recipient work.

**E3.** One million deliveries times two hundred bytes gives two hundred million bytes. Multiply by eight to get 1.6 billion bits. Protocol, encryption, transport, and retransmission overhead are additional.

**E4.** Twenty events times ten thousand viewers gives two hundred thousand deliveries per second. Multiply by two hundred bytes to get forty million payload bytes per second. Count recovery and heartbeat traffic separately.

**E5.** Twenty events times five gateways gives one hundred broker deliveries per second. At two hundred payload bytes that is twenty thousand bytes per second. It is not the final client bandwidth.

**E6.** Fifty thousand divided by five gives ten thousand requests per second. Under uniform update arrival relative to the schedule, half the five-second interval gives a mean 2.5 seconds. Request duration is additional.

**E7.** Ten thousand requests per second times two thousand bytes per full response gives twenty million payload bytes per second. Conditional responses change the body cost but not the check schedule.

**E8.** Apply version 102 when it arrives. When version 101 arrives later, compare against current version 102 and reject the stale replacement. Correctness does not depend on the earlier request being canceled in time.

**E9.** Check source progress, install a waiter under a race-safe rule, and recheck progress or use a retained cursor. A change during registration must appear in the response or remain replayable. A notification without durable progress cannot prove the gap is closed.

**E10.** Add five, ten, five, fifteen, and five milliseconds to obtain forty milliseconds. These durations are illustrative assumptions. The measurement boundary includes client application rather than only socket writing.

**E11.** The unfragmented server frame uses a four-byte header for this payload-length category, giving 204 bytes. The client adds a four-byte mask and totals 208. Neither includes TLS, transport, or IP overhead.

**E12.** Ten thousand connections times sixteen KiB equals 163,840,000 bytes. Across fifty thousand viewers it is 819,200,000 bytes. Per-client event queues and runtime costs remain outside the assumption.

**E13.** Fifty thousand divided by thirty seconds is 1,666.666667 messages per second rounded. Multiplying by forty bytes gives 66,666.666667 bytes per second rounded for the counted direction. The script retains exact arithmetic.

**E14.** Add thirty and ninety to obtain 120 on the same illustrative time axis. A failure at sixty leaves stale presence until that expiry unless another observation removes it. Lease expiry is a policy about silence.

**E15.** Provision six gateways under the ten-thousand-connection assumption. Losing one leaves five, enough for fifty thousand viewers. The calculation does not prove surviving handshake, CPU, or outbound capacity.

**E16.** The group assigns an ordered partition to one processing member. Viewers can reside on other gateways. The processing owner must route events to all interested gateway instances, or the broker must supply a separate copy through the chosen subscription topology.

**E17.** Establish a recoverable stream position, obtain a snapshot marked 101, and apply events strictly after that version. Buffer concurrent delivery within a bound. If event 102 arrives before the snapshot response, retain it and apply after establishing the base.

**E18.** Five times two hundred gives one thousand payload bytes. At evenly spaced twenty-per-second arrivals, the first waits four inter-arrival intervals, or four divided by twenty equals 0.2 seconds. A flush timer is needed to enforce a quiet-period bound.

**E19.** Incoming payload is four thousand bytes per second and drain is one thousand. Growth is three thousand. Divide sixty thousand queue bytes by three thousand to get twenty seconds. Choose a safe overflow policy rather than making the queue unbounded.

**E20.** Thirty thousand, fifteen thousand, and five thousand viewers each multiplied by twenty give six hundred thousand, three hundred thousand, and one hundred thousand deliveries per second. Together they sum to one million.

**E21.** Twenty events per second times five seconds gives one hundred events. Multiplying by two hundred bytes gives twenty thousand payload bytes for one viewer. Widespread reconnect multiplies recovery work by requesting clients.

**E22.** Twenty times two hundred times 3,600 gives 14,400,000 bytes for an hour. Using 86,400 seconds gives 345,600,000 bytes for a day. Replicas, storage formats, and backups add physical costs.

**E23.** Apply 101 and 102, ignore the repeated 102, and hold 104 because 103 is missing. Recover or receive 103, then apply 103 followed by 104. The resulting contiguous applied sequence is 101,102,103,104. Bound the hold buffer and recover on expiry.

**E24.** The uniform-spreading expectation is five thousand attempts per second. It is not a strict per-second cap. Enforce admission using actual authentication, handshake, snapshot, and replay budgets; jitter alone leaves random bursts possible.

**E25.** Healthy gateways keep delivering while disconnected clients retry with jitter and admission limits. A retained cursor gets authorized replay; an expired one gets a compatible versioned snapshot and tail. Each viewer has a bounded queue and payload-specific overflow policy. Stale presence expires by instance lease, and old cleanup cannot erase a new connection. Verify final client version against authoritative state.

Read the next unit when you can explain these mechanisms without the pictures.

### Primary sources

[WebSocket RFC 6455](https://www.rfc-editor.org/rfc/rfc6455). Opening, framing, masking, Ping/Pong, and Close rules.

[HTML server-sent events](https://html.spec.whatwg.org/multipage/server-sent-events.html). Event-stream parsing and reconnect identity behavior.
