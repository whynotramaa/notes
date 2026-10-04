@part VIII | Client state and acknowledgements | We define what receiving an event actually means. Bytes can arrive without a successful application effect. We will trace duplicate suppression, gaps, acknowledgements, and separate command handling from spectator delivery. | where:8

## 29. Apply events with a deterministic reducer

The arrival sequence is 101, 102, 102, 104, 103. A delta client first applies 101 and 102, ignores the repeated 102, and notices that 104 skips the expected 103. It can hold 104 briefly while asking for 103, then apply 103 and 104. The final applied sequence is 101, 102, 103, 104.

A **deduplication rule** prevents repeated event identity from producing repeated effects. An **ordering rule** prevents a later effect from using a missing predecessor. These are separate rules. A state-replacement client could accept version 104 directly and ignore later 103, while a delta client cannot safely do that without another recovery mechanism.

@fig sd_realtime_reducer | Computed illustrative deduplicated order. The hold policy assumes retained recovery for the missing delta.

Make reducer behavior testable with tiny traces. Include repeated IDs, out-of-order positions, expired snapshots, and corrections. A reducer must handle a message's schema version too; a new payload shape cannot become a valid delta merely because its event sequence is next. Reject or recover incompatible data rather than corrupting state.

:::story Picture this
A clerk updates a running total from numbered slips. Receiving slip 104 before 103 does not tell the clerk whether 104 already includes the missing change. A full balance sheet is a different kind of document. The clerk needs the document type and its predecessor rule before applying either.
:::

## 30. Acknowledgements need a stated meaning

The client sends `ack=102`. Does it mean the bytes arrived, the message parsed, the reducer applied, or durable local storage committed? An **application acknowledgement** reports completion at a chosen application boundary. Its meaning must be part of the protocol.

If the server uses acknowledgements only to release a bounded delivery buffer, acknowledging successful reducer application may be sufficient. If an offline audit requires durable client processing, the effect and progress need a durable relationship. The network cannot force that transaction automatically. On retry, duplicate identity must still protect repeated effects.

@fig sd_realtime_ack | Illustrative application acknowledgement. The self-transitions are local state changes at each endpoint.

Acknowledgements can be repeated or delayed too. A cumulative applied cursor should move forward monotonically within its scope and never release data beyond a gap. If the server loses its ephemeral acknowledgement record, replay may repeat already applied events. The client reducer still protects the effect, so acknowledgement storage and effect uniqueness remain separate responsibilities.

Per-event acknowledgements add reverse traffic. A cumulative acknowledgement can name the highest contiguous applied position and cover an ordered prefix. It cannot safely cover a gap. The server may still rely on a retained shared log rather than keeping a per-client durable copy. Choose that design according to retention and delivery requirements.

## 31. Commands belong to an authoritative write path

The scorer clicks *add run*. A WebSocket command can carry a stable operation ID, target match, expected version, and validated action. The gateway authenticates the scorer and forwards the command to the authoritative score service. The service checks authorization and state, then commits the operation and emits its resulting event.

A **command** asks the system to perform an action. An **event** records a decision or change that has already happened. Repeating a command can duplicate an effect unless the authoritative service stores its operation identity and result. Repeating a resulting event is handled by subscriber identity and version rules.

@fig sd_realtime_command | Illustrative scorer write path. Idempotency belongs at the authoritative command effect, not only at the gateway.

A gateway restart can lose a command response even after the score committed. The client retries the same operation ID and receives the stored result rather than scoring again. Optimistic concurrency can reject a command whose expected match version is stale. This protects conflicting scorer actions; it is a different guarantee from spectator event order.

:::note Optimistic display is a product choice
The client may show a tentative update before confirmation. It must label or otherwise reconcile that state with the authoritative result. Rejected commands require rollback or correction. A predicted display value is not a committed score version.
:::

## 32. Corrections require explicit semantics

A scorer reverses an earlier decision. The current state changes at a new version, even though the correction references an older event. Subscribers should not infer that a lower referenced event ID means the correction is stale. The event envelope distinguishes its current stream version from the historical action it concerns.

A **correction event** describes an accepted revision to earlier information. It can supply a new complete score or a defined inverse-and-replacement action. The authoritative log preserves what happened, while the current-state projection reflects the latest decision. A spectator UI may show the corrected state without replaying the original display animation.

@fig sd_realtime_correction | Illustrative correction envelope. The new event advances the stream even when it refers to older history.

Separate delivery channels when requirements differ. A public current-score channel can coalesce state. An audit channel retains every command and correction. A player action channel may require stricter latency and admission controls. Sharing a protocol implementation does not mean these products have identical loss and replay semantics.

:::warn Watch out
Deduplicating only in the gateway fails if a retry reaches another gateway. Command idempotency belongs in a durable authoritative operation record. Subscriber event suppression belongs at the applied-state boundary. Both use identities, but they protect different effects.
:::

:::interview Interview lens
**"Can WebSockets give exactly-once scoring?"** They carry messages but cannot decide whether a lost response followed a committed score update. The command needs a durable operation ID and stored result at the authoritative service. Subscriber events need their own duplicate and version rules. I would describe idempotent effects rather than claim that a transport delivers exactly once.
:::

:::key In one breath
A reducer distinguishes duplicate identity from missing predecessors. An acknowledgement proves only its declared completion boundary. Commands request authoritative effects and require durable idempotency, while events publish those effects. Corrections advance current order even when they reference older history, and product channels can have different loss contracts.
:::
