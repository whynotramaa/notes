@part IV | Multipart uploads | We split a large transfer into independently recoverable parts without exposing a partial object as finished. Parallelism helps only within the actual shared bandwidth budget. We will compute part ranges, track completion evidence, retry a failed part, and clean up unfinished sessions. | where:4

## 13. Part boundaries and byte ranges
A connection interruption near the end of a large upload should not require retransmitting every byte. **Multipart upload** creates one upload session whose numbered parts can be transferred separately and combined through an explicit completion operation. The exact supported sizes and limits come from the chosen service.

For Heron's illustrative 5,000,000,000-byte object and 100,000,000-byte parts, the division is exact: 50 parts. Using inclusive byte ranges, the first is zero through 99,999,999 and the next is 100,000,000 through 199,999,999. The final range begins at 4,900,000,000 and ends at 4,999,999,999.

$$P=\left\lceil S/p\right\rceil.$$
Read this as number of parts $P$ equals total size $S$ divided by part size $p$, rounded upward. The final part can be smaller when the division is not exact. Keep client ranges and service part numbering distinct so zero-based offsets do not become wrong API part identifiers.

@fig sd_storage_parts | Illustrative decimal-byte partition. Range endpoints are inclusive and do not encode a service's part-number convention.

:::story Picture this
A mover labels boxes for one shipment and checks the final box list before declaring the shipment complete. An individual box arriving does not mean the shipment is ready. A missing box can be resent without moving every box again.
:::
## 14. Initiation and the completion manifest
The storage service returns an upload-session identifier after initiation. The client uploads numbered parts under that identifier and retains the service's part evidence. Completion submits the ordered manifest the service requires so it can assemble the intended final object.

For the illustrative object, the manifest has 50 entries. A lost local response for one part does not prove the part is absent. Query or retry through the session's documented part semantics. Do not complete with an accidental subset or stale evidence merely because the application saw some success replies.

@fig sd_storage_manifest | Multipart lifecycle. Complete-part evidence is a storage protocol detail; application publication is a later step.

[S3's multipart overview](https://docs.aws.amazon.com/AmazonS3/latest/userguide/mpuoverview.html) documents initiation, part upload, and completion as distinct operations. Track session ownership in the application. A caller who knows someone else's upload identifier must not gain completion or overwrite permission through the app's recovery endpoint.

:::note Completion uncertainty
If the completion reply is lost, recover the reserved object's exact state and expected attributes rather than create a new session blindly. Product APIs can have detailed response-body and retry semantics, so inspect their documentation and SDK behavior.
:::
## 15. Retry and parallelism costs
One illustrative part fails. Retrying 100,000,000 bytes instead of the complete 5,000,000,000 is a factor of 50 less retransmitted payload in this case. This improvement is about the failed portion, not a guarantee that every upload becomes fifty times faster.

@fig sd_storage_retry | Illustrative single-part failure. Protocol setup, repeated failures, and completion work are excluded.

Assume five parts upload concurrently through a shared 10,000,000-byte-per-second link, evenly receiving 2,000,000 each. A part takes 50 seconds. The five-part group transfers 500,000,000 bytes in the same 50 seconds. Ten such groups still require 500 seconds total under the ideal shared-bandwidth model.

@fig sd_storage_parallel | Ideal bandwidth-sharing exercise. Parallelism can hide per-request waits but cannot multiply a fixed link's payload capacity.

Bound concurrency so parts do not exhaust browser memory, sockets, gateway state, or storage request quotas. Stream each part rather than duplicating the full object in memory. Preserve enough evidence to resume without retaining all payload bytes in the application service.

:::warn Watch out
Increasing parallel part count does not increase a saturated shared link's bandwidth. It can instead increase retries and resource pressure. Tune it with the actual network and per-request overhead.
:::
## 16. Incomplete sessions and cleanup
A browser abandons the session after uploading two parts. Those parts may remain stored even though there is no completed public object. Under the illustrative size, two parts hold 200,000,000 bytes; ten such unfinished sessions hold 2,000,000,000 bytes.

A cleanup policy aborts stale unfinished sessions after the supported resume horizon. The application and storage lifecycle policy should agree about that horizon. Aborting while a valid client is still uploading can destroy recoverable progress; never completing or aborting wastes retained storage and session state.

@fig sd_storage_abandoned | Illustrative abandonment. Billing and lifecycle timing depend on the storage product.

Reconciliation compares pending application reservations with storage sessions and completed objects. Some objects may have completed while the app failed to publish; some reservations may never have transferred bytes. Give each state a distinct cleanup rule so a background sweep does not delete an actively published object based on an old pending record.

:::interview Interview lens
**"What happens when multipart upload is interrupted?"** The client retains session identity and completed-part evidence, then retries missing or uncertain parts through the documented API. Completion uses the intended ordered manifest and application verification. Stale sessions are aborted only after the resume contract expires, and cleanup distinguishes them from completed unpublished objects.
:::
:::key In one breath
Multipart upload splits transfer recovery, not application publication. Compute exact byte ranges and retain session and part evidence. Parallel transfers share the actual bottleneck, while a failed part can avoid whole-object retransmission. Unfinished parts and completed unpublished objects need separate safe cleanup rules.
:::
