@part II | Polling and long polling | We start with ordinary HTTP requests. Repeated checks are simple but spend capacity even when nothing changes. We will trace polling delay, long-poll waiting, response races, and the choice to push. | where:2

## 5. Polling asks again on a clock

A viewer asks for the score every five seconds. **Polling** repeatedly fetches a resource on a client schedule. It uses ordinary request-response behavior and works through many intermediaries, but an update occurring just after a check remains unseen until the next check.

With 50,000 viewers and an illustrative five-second interval, the service receives 10,000 requests per second. If updates occur uniformly relative to the polling clock, the mean extra waiting time is half the interval, or 2.5 seconds. That uniform-arrival assumption must be stated; synchronized scoring events and aligned client timers can have a different distribution.

@fig sd_realtime_poll | Illustrative polling timeline. The selected change waits four seconds; the computed mean over uniform arrivals is 2.5 seconds.

At the baseline response size of 2,000 bytes, 10,000 full responses per second carry 20,000,000 payload bytes per second before protocol overhead. Conditional requests can reduce returned body bytes when unchanged but still require request handling and validation. Polling may remain the best choice for infrequent changes and modest audience size.

:::story Picture this
You walk to a noticeboard every few minutes to see whether the score changed. Most walks may find the same notice. A bell could tell you when to walk, but someone must keep the bell connected and make sure you can catch up after missing it. Simplicity and timeliness have different costs.
:::

## 6. Long polling keeps the question open

A viewer requests changes after version 101. The server has none yet and holds the request instead of answering immediately. **Long polling** keeps an ordinary request waiting until a change or waiting deadline permits a response. When the client receives the response, it promptly asks again using its latest version.

The server must register the waiter without losing a concurrent event. One safe logical pattern checks current progress, registers interest, then rechecks progress under a race-safe coordination rule. A change between the first check and registration must either appear in the response or remain replayable from the client's cursor. A notification alone is insufficient if it can occur before the waiter exists.

@fig sd_realtime_longpoll | Illustrative race-aware waiting path. Progress is durable independently of the notification.

A canceled client request needs to remove its waiter even if an event and cancellation happen together. Exactly one path should finalize the response, while the durable cursor still covers an event the client did not accept. The implementation therefore owns a small waiter state machine rather than merely storing callbacks in a list indefinitely.

A waiting request still occupies connection and application resources. Use asynchronous I/O or another bounded waiting implementation, set a deadline, and remove waiters on cancellation. A timeout response is not an error if it means no new data was available. Its purpose is to refresh the waiting request and keep intermediaries from ending it unpredictably.

## 7. Polling responses can arrive out of order

The client launches one score request and then another before the first completes. The second receives version 102 quickly, while the first later returns version 101. A page that always applies the last response received moves backward. This can happen without a message broker, duplicate delivery, or a persistent connection.

A **client reducer** is the rule that combines received data with local state. For state replacements, it can compare source versions and accept only newer values. For deltas, it needs predecessor checks or a gap buffer. Request IDs describe the client's request order, but a source version describes the data's order and is often the stronger state rule.

@fig sd_realtime_pollrace | Illustrative response race. Version checking protects state even with ordinary polling.

Abort old requests to reduce unnecessary work where possible, but do not make correctness depend on cancellation succeeding. The request may have crossed the network or completed on the server already. A version-aware reducer protects the display even when every cancellation arrives too late.

:::note Conditional polling is still polling
An ETag or last-modified validator can make an unchanged response smaller. It does not tell the client that a change happened between checks. The freshness interval and request rate remain part of the design.
:::

## 8. Push moves waiting toward the server

The client stays subscribed while the service sends changes as they occur. **Push delivery** uses an established channel so the service initiates an update without a new application request for each event. SSE and WebSockets support different forms of this behavior.

Push replaces repeated empty queries with connection management and fan-out work. Heron's twenty events per second still require one million viewer deliveries per second under complete broadcast. That is 200,000,000 payload bytes per second for 200-byte events, which exceeds the illustrative polling payload rate because push sends every event promptly. A current-state polling product and an every-event product are different requirements.

@fig sd_realtime_push | Computed illustrative workloads. Polling returns a current state, while the push exercise delivers every event to every viewer.

The right transport follows directionality, latency, client environment, payload type, and recovery needs. Do not choose a socket merely because the system is called live. A simple scoreboard can use SSE; an interactive game may need bidirectional low-latency messages. The event model remains necessary under either transport.

:::warn Watch out
A five-second polling interval is not a five-second maximum freshness guarantee if requests themselves queue or fail. Add request duration, retries, and failure behavior to the interval. Name the healthy-path and degraded-path guarantees separately.
:::

:::interview Interview lens
**"When is long polling enough?"** It can provide timely server changes using ordinary HTTP while holding requests until updates or deadlines. It needs a race-safe waiter and cursor to avoid missed changes. Connection resources and repeated response-request cycles still cost capacity. I would use it where transport compatibility and a moderate workload make that trade useful.
:::

:::key In one breath
Polling spends requests on a clock and adds interval-dependent delay. Long polling waits on the server and needs race-safe registration plus a replayable cursor. Version-aware client application prevents late responses moving state backward. Push removes repeated empty checks but introduces persistent connections and event fan-out costs.
:::
