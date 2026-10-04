@part IV | Connections, heartbeats, presence | We manage a connection for longer than one request. Quiet peers, process restarts, and stale registries make alive-or-dead less obvious than it sounds. We will follow connection ownership, heartbeats, draining, and presence leases. | where:4

## 13. A gateway owns live connection state

Heron assumes a gateway can hold 10,000 connections. Fifty thousand viewers therefore require five gateways at that assumed limit. This is a sizing exercise, not a measured capacity claim. CPU, memory, file descriptors, outbound bandwidth, and per-connection work can impose different limits first.

A **realtime gateway** terminates client channels and maps internal events to their connected subscribers. It owns ephemeral socket state, outbound queues, subscription membership, and delivery progress. Durable match state remains elsewhere so a gateway restart does not erase the score or its history.

@fig sd_realtime_gateways | Computed illustrative allocation. D and E are combined visually; the sizing requires five separate gateways.

Connection memory and egress limits can fail independently. A gateway may hold the assumed number of idle connections while saturating outbound CPU or network at the event rate. Include both in admission, and expose overload as a recoverable connection response. Repeatedly accepting beyond a sustainable budget turns the gateway into a growing queue.

Under an illustrative sixteen-KiB connection-state assumption, one gateway holds 163,840,000 bytes and all viewers hold 819,200,000 bytes. This excludes application queues and many runtime costs. A gateway test must include subscriptions, events, heartbeats, and disconnect churn, not just idle sockets. The assumption is useful for counting, not for selecting hardware.

:::story Picture this
A telephone switchboard knows which listeners are on each active line. The score archive does not live in the switchboard. If the switchboard restarts, callers dial again and ask for the current score. Keeping authoritative state elsewhere makes that recovery possible.
:::

## 14. Heartbeats detect silence with a deadline

A viewer disappears behind a failed network link without sending a clean close. The gateway may continue believing the connection exists. A **heartbeat** is a periodic liveness message used to detect missing communication within a chosen policy. WebSocket Ping and Pong are protocol control messages; an application heartbeat can also carry its own identity and progress information.

The sender records when a response is due. Receiving a valid response updates observed liveness. Missing the deadline closes or marks the connection suspect according to the policy. The conclusion is suspicion under the network conditions, not mathematical proof that the remote process died. An overloaded event loop can also delay a healthy peer's response.

@fig sd_realtime_heartbeat | Illustrative heartbeat trace. The last step is a local deadline decision, not a received death certificate.

A response must correspond to the expected connection instance and outstanding liveness policy. A delayed heartbeat from an old connection should not renew a newer session record by accident. Distinguish protocol communication from user activity too. A browser can answer transport heartbeats while the person is no longer watching the match.

At an assumed 30-second interval, fifty thousand clients produce 1,666.666667 heartbeat messages per second on average for one counted direction. With an assumed forty-byte heartbeat cost, that is 66,666.666667 bytes per second, before other directions and overhead. Round only for display; the script retains exact arithmetic.

## 15. Drain without making everyone reconnect at once

A gateway needs a software update. Abruptly killing it drops every connection and creates a correlated reconnect burst. **Connection draining** stops new admissions, keeps existing channels briefly, and then closes them with a planned handoff or reconnect behavior.

The load balancer removes the instance from new connection routing. The gateway may inform clients that reconnect is expected, apply jitter to a suggested delay, and close within a bounded maintenance window. Durable cursors let clients resume regardless of which healthy gateway accepts them. A drain procedure must also stop assigning new subscriptions to an instance that is leaving.

@fig sd_realtime_drain | Illustrative bounded gateway drain. Delivery progress lives in a recoverable cursor, not only on the old instance.

Five gateways at the assumed connection limit have no connection-capacity spare. Adding a sixth leaves five after one failure, enough for fifty thousand viewers at ten thousand each. That arithmetic covers only connections. Surviving outbound bandwidth and processing capacity must also meet demand, and reconnection temporarily adds handshake work.

:::note Sticky routing is not recovery
A load balancer can keep one connection on its existing backend because a socket is already bound there. A cookie that prefers the same backend on reconnect may improve locality. Neither protects against that backend dying. A reconnect must recover state without requiring the failed machine.
:::

## 16. Presence expires by observation

A user is shown as online. Does that mean a socket exists, a heartbeat arrived recently, or the user is actively viewing this match? **Presence** is an application status derived from recent observations, often with an expiration policy. State its meaning before designing a registry.

A gateway can store a presence lease keyed by user and connection instance. Each valid heartbeat renews its expiration. With a 90-second illustrative lease and 30-second heartbeat, the expiry spans three heartbeat intervals. A crash leaves stale presence until expiration instead of requiring a guaranteed clean disconnect notification.

@fig sd_realtime_presence | Illustrative lease timeline. The last renewal at 30 plus a 90-second lease expires at 120.

A user can have multiple devices. Deleting a single user presence record when one device disconnects can incorrectly mark the other device offline. Keep per-connection instances, aggregate them by the stated online rule, and protect cleanup against old disconnects deleting a newer connection's lease. Presence is usually eventually updated because strict instantaneous failure detection is unavailable.

:::warn Watch out
A stale close handler from connection A must not delete the renewed lease for connection B. Include a connection generation or instance ID and compare it during removal. This is the same old-owner problem that appears in distributed leases.
:::

:::interview Interview lens
**"How do you know a viewer is offline?"** I can observe a clean close or expire a recent-communication lease after heartbeat deadlines. That gives a bounded stale presence policy under chosen timing assumptions. Multiple devices need separate connection records, and stale cleanup must not remove newer ownership. Network silence is suspicion, so the product should not promise instantaneous certainty.
:::

:::key In one breath
A gateway owns sockets and ephemeral delivery state while durable state remains recoverable elsewhere. Heartbeats turn silence into a timed suspicion policy. Draining controls reconnection bursts and requires spare surviving capacity. Presence is a declared observation with per-connection leases and generation-safe cleanup.
:::
