@part II | Chat, WhatsApp, feed, Dropbox | We move from one result to many recipients and devices. Delivery, ordering, and versions are different promises. We will build chat, mobile messaging, feeds, and file synchronization. | where:2

## 5. Chat: durable order and reconnect

Two devices send into one conversation at once. A **conversation sequence** is an order assigned by that conversation’s authority. It is not a claim that wall clocks provide a global order across every conversation.

Accept each message under sender and client-message identity, authorize membership, append durably, and return its conversation position. A lost reply repeats the same identity without appending another message. Delivery gateways push the append to online devices; offline devices later fetch after their last acknowledged position. A client that notices a gap asks for retained messages or a snapshot boundary. Presence and delivery receipts are separate from message durability. Bound socket buffers so a slow client cannot retain unbounded history in gateway memory.

At an illustrative 20 messages per second and 200 stored payload bytes per message, conversation history adds 345,600,000 bytes per day. Recipient copies, indexes, attachments, and receipts are separate costs. The storage rate is different from gateway egress because one persisted message can reach several devices.

The sender chooses a message identity before attempting append, and the conversation authority returns the accepted order position after its protected commit. If that reply disappears, retry resolves the same message instead of appending another. A recipient socket can fail after bytes are sent but before application acknowledgement; reconnect therefore uses the recipient's stored applied position. Fetch the later retained conversation entries and suppress repeated identities. This ordering scope belongs to the conversation, not every chat in the service. Delivery receipts remain separate state so an accepted append cannot pretend an offline recipient already read the message.

@fig sd_practice_designs_05 | Illustrative chat: durable order and reconnect. A durable conversation position lets reconnect fetch the gap after socket loss. Orange marks reconnect fetching the tail after the recipient's stored position.

A timestamp assigned by a phone can be wrong or repeated. It cannot safely establish authoritative conversation order by itself.

:::story Picture this
A post office keeps numbered letters in a dispatch book while copies travel to each recipient. A recipient who loses the connection asks for letters after the last number received, not for a fresh guess at the whole conversation. The book preserves order, while the delivery copies can catch up.
:::

## 6. WhatsApp-style messaging: device fan-out

A person has several devices and is offline on one of them. This practice design needs a **device delivery state**, progress tracked separately for each recipient device rather than only for the user account.

Persist the message and authorized recipient relation, then fan out device envelopes. Each device acknowledges the boundary specified by the contract: receipt, durable local storage, or display. Retries reuse envelope identity and are deduplicated locally. End-to-end encryption adds device keys and ciphertext handling; the server should not invent plaintext access it does not have. Group membership and key changes need a versioned policy so a later device does not receive data outside its intended membership. Offline retention and deletion limits belong to the contract, not a claim of unlimited guaranteed delivery.

For the same illustrative 20-message-per-second stream, two destination devices per message create 40 envelopes per second. At 200 bytes per envelope, payload delivery is 8,000 bytes per second before encryption and protocol overhead. Offline devices move some of that work into retained pending state rather than removing it.

A recipient's active device can store a message while another device remains disconnected. Updating a single recipient-delivered flag would hide which device still needs synchronization. Keep the durable message and per-device progress relation separate, then replay the missing tail when that device reconnects. A repeated receipt advances only the corresponding device state under its monotonic rule. Encryption and device membership changes affect which keys or ciphertext each device can use, so access is part of that relation too. This hypothetical device fan-out contract does not assume one successful socket send establishes visibility on every recipient device.

@fig sd_practice_designs_06 | Illustrative whatsApp-style messaging: device fan-out. Device receipts keep an offline device's progress separate from another's success. Orange marks device-specific progress that makes offline retry safe.

An acknowledgement from one device does not prove all recipient devices have stored or displayed the message. This is a hypothetical exercise, not a description of WhatsApp internals.

:::note Device copies and authoritative order
Separate message acceptance, per-device delivery, and reading. Durable ciphertext can be delivered under stable envelope identity, with explicit membership and key-version rules. Offline retention bounds the recoverable history.
:::

## 7. News feed: work placement and ranking

A post has many followers but only some are active. A **news feed** is a derived ordered set of candidate references, filtered and ranked for a reader. Its authority for content and permissions remains elsewhere.

For write fan-out, 100 posts per second with 10,000 followers each create 1,000,000 feed entries per second. For read fan-out, the illustrative 50 reads with 200 candidates each require 10,000 candidate evaluations per second. Compare both under one readership and post workload. Use recipient-post identity for deduplication, a merge policy for large publishers, and a deterministic order with a tie breaker. New ranking or visibility rules require a migration and continuation policy; copied references must not bypass deleted or private content.

Lose a fan-out worker after it creates some recipient references. Resume from durable progress or rescan with unique recipient-post identities so already written entries do not repeat. A read-time source can provide candidates absent from precomputed feeds under a hybrid policy, but the merge must deduplicate them. Apply current permissions before returning the content and define the ranking continuation context. The illustrated write and read work have different units and triggering rates, so compare complete workload models rather than choosing the smaller-looking count. A celebrity changes recipient creation sharply even when the publication rate is unchanged.

@fig sd_practice_designs_07 | Illustrative news feed: work placement and ranking. Work placement changes feed cost while serving still checks ranking and permission. Orange marks ranking and permission checks over derived feed references.

The two arithmetic scenarios do not prove read fan-out always wins; they differ in the work measured and must be tied to a shared workload.

:::warn Watch out
The feed moves work between publish and read paths. Count recipient writes and candidate reads, handle skew, and make entry identity, ranking, pagination, deletion, and permissions explicit. A hybrid needs a safe class-change boundary.
:::

## 8. Dropbox-style sync: blocks and versions

A large file changes in only a few places. A **block manifest** lists the stored chunks that make up one file version. Reusing unchanged blocks can avoid uploading the whole file again.

The illustrative file has 50 blocks of 100,000,000 bytes. Changing two uploads 200,000,000 bytes, while 48 unchanged blocks represent 4,800,000,000 reusable bytes. Upload changed blocks under content identities, verify them, then conditionally publish a new manifest against the expected file version. A second client based on the old version conflicts and follows an explicit merge or conflict-copy policy. The client consumes a durable namespace change cursor to discover new versions. A cursor gap beyond retained history requires a full metadata rescan, not silent continuation.

Keep version seven as the base while preparing the illustrated changed blocks. The client uploads and verifies missing content under stable block identities, then commits a new manifest only if the base revision is still current. A concurrent device change can reject that manifest without discarding the reusable uploaded blocks. Reconcile the conflict under the file policy rather than overwrite the other device's revision. A lost publication reply is resolved by the intended revision identity. Content reuse saves transfer bytes, while the manifest authority still protects namespace and version transitions from stale writers.

@fig sd_practice_designs_08 | Illustrative 50-block file. Two changed blocks of 100,000,000 bytes each require 200,000,000 uploaded bytes; the new manifest references all blocks and is published against the expected revision.

Content hashes must be verified and scoped safely; a guessed hash should not grant permission to another user’s file. The exercise does not claim Dropbox uses this exact block size.

:::interview Interview lens
**"How does sync avoid publishing a partial file?"** Sync separates reusable bytes from authoritative namespace and version metadata. Commit a complete verified manifest conditionally, detect concurrent edits, and recover changes through a cursor or rescan. Transfer savings do not remove metadata races.
:::

:::key In one breath
Persist messages before delivery promises, scope ordering, and recover gaps. Place feed work according to readership and publisher skew. File sync commits versions over reusable bytes and reconciles concurrent edits.
:::
