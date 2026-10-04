@part IX | Case study: live score updates | We assemble a live-score architecture and test it under failure. A normal-path arrow does not explain a reconnecting or slow viewer. We will reconcile event and byte counts, trace gateway loss, and state the complete delivery contract. | where:9

## 33. The authoritative event walkthrough

The scorer submits an authorized command with a stable operation ID. The score service checks its expected version, commits the new score and publication intent, and assigns the next match version. A relay publishes that event to the retained stream. Topic routing sends it to gateway instances with interested viewers. Each gateway encodes the public payload and schedules it on bounded local queues.

The viewer applies the event using identity and version checks. If the product needs acknowledgement, it names the highest contiguous applied position. The durable event store remains the recovery source. The gateway's local queue is only a short delivery buffer, so its restart changes connection ownership without destroying the accepted score.

@fig sd_realtime_full | Illustrative normal path. Authoritative state, durable history, live ownership, and client effects have separate responsibilities.

This architecture allows the score service to continue accepting changes while some viewers are disconnected, within publication and retention limits. It does not mean every viewer sees every change promptly. Monitor stream age, gateway queue age, and client-reported applied progress to identify where the product's latency requirement fails.

:::story Picture this
The score archive, numbered announcement recording, speaker operators, and listeners are separate. Losing one speaker disconnects its listeners but does not erase the archive or recordings. On reconnect, listeners ask for the current page or the announcements after their last known number.
:::

## 34. Reconcile the complete fan-out count

The producer creates twenty events per second. Five gateways receive one hundred broker deliveries per second under the complete-interest assumption. Each gateway holding ten thousand viewers performs two hundred thousand local deliveries per second. All viewers together receive one million deliveries per second.

The broker leg carries 20,000 payload bytes per second. One gateway sends 40,000,000 payload bytes per second, and all gateways send 200,000,000. The latter equals 1,600,000,000 payload bits per second. Frame, encryption, transport, retransmission, and acknowledgement overhead are separate; none should be silently claimed as included.

@fig sd_realtime_totals | Computed illustrative fan-out reconciliation. Each row names a distinct delivery boundary.

Every multiplier names a recipient set. If only some viewers follow a match, use that match membership instead of all service viewers. If the producer emits different match streams, sum their individual event-rate times viewer-count products. Multiplying all events by all viewers incorrectly assumes every user subscribes to every topic.

The memory exercise assumes sixteen KiB of connection state, giving 819,200,000 bytes across fifty thousand viewers. Per-client queues and runtime overhead are additional. A real capacity decision needs a test with the actual message mix, TLS, churn, and slow-client policy. This chapter's values teach counting and bottleneck identification.

## 35. Gateway failure has a recovery trace

Gateway A fails. Its ten thousand viewers lose connections. Healthy gateways continue their local deliveries, while disconnected clients back off and retry. A sixth provisioned gateway leaves five surviving instances, matching the connection-count assumption. Admission also checks handshake, replay, and final egress capacity.

A reconnecting viewer sends its last applied version. If the gap remains retained, the gateway replays the missing suffix and transitions to live delivery without a subscription gap. If the cursor is too old or local state is lost, it supplies a versioned snapshot and tail. Repeated events across the transition remain harmless under the reducer's rule.

@fig sd_realtime_failure | Illustrative gateway-loss recovery. The accepted score and retained history do not depend on the failed gateway.

The failure exercise must include repeated and missing versions, expired cursors, stale presence, and a simultaneous slow-client backlog. Restarting a gateway and seeing a socket open proves only part of recovery. The visible score must converge to the authoritative version under every declared branch.

:::note Observe freshness at the viewer
Gateway writes and broker offsets are intermediate progress. A small sampled client acknowledgement or state-version report can reveal lag after those boundaries. Keep telemetry volume bounded and avoid turning every displayed frame into another central bottleneck.
:::

## 36. The complete interview contract

For Heron, choose server-to-viewer SSE or bidirectional WebSockets according to the product interaction. Give match-local authoritative versions, stable event IDs, retained history, and a versioned snapshot API. Route each public event only to gateways with interested viewers. Each gateway owns bounded socket queues and explicit slow-client behavior.

The design must state connection admission, heartbeat deadlines, presence meaning, drain behavior, reconnection backoff, replay limits, credential renewal, authorization revocation, and user-visible stale-state behavior. These are operational parts of the protocol. They are not optional details after drawing the stream and gateway boxes.

@fig sd_realtime_contract | Illustrative delivery contract. Coalescing is allowed only for replaceable state, while required deltas need recoverable history.

:::warn Watch out
A system that broadcasts successfully on a local test but loses versions across reconnect has not fulfilled its delivery contract. Verify the recovery state machine, permission changes, and overload branches through the deployed proxy path. A successful handshake is only the beginning of a session.
:::

:::interview Interview lens
**"Design a score feed for fifty thousand viewers."** I would keep authoritative scoring and retained versioned events independent of socket gateways. Five assumed ten-thousand-connection gateways explain normal ownership, and an extra instance covers one connection-capacity failure under that assumption. Complete broadcast creates one million deliveries and 200,000,000 payload bytes each second. Bounded per-client queues, jittered reconnect admission, and snapshot-or-replay recovery make the normal architecture survive its ordinary failures.
:::

:::key In one breath
The authoritative score, retained event sequence, gateway connection state, and viewer reducer have different owners. Twenty events multiplied across fifty thousand viewers create one million deliveries each second. Connection and egress capacity must survive failures and recovery traffic. The complete protocol explains duplicates, gaps, expired history, slow clients, permissions, presence, and reconnect behavior.
:::
