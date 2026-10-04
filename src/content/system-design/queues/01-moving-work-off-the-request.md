@part I | Why message queues | A queue lets a service promise work now and finish it later. That promise is only useful if the accepted work survives crashes and the caller can find out what happened. We will measure the waiting a queue removes, name the boxes it adds, and define the status contract that replaces an immediate answer. | where:1

## 1. Synchronous transcoding latency

A fan uploads a 40-second clip of a goal to Heron. The upload itself is quick: the API checks the user, writes the object and a database row, and could answer in 0.15 seconds. The slow part comes after. Heron has to transcode the clip into three renditions, and a worker needs 30 seconds of compute for that.

If the API does the transcode inside the request, the phone waits 30 seconds with a spinner. That is a bad screen, but the server-side cost is worse. Little's law says the average number of requests in flight equals the arrival rate times the time each one spends inside, $L=\lambda W$. At Heron's assumed peak of 6 uploads per second, a 30-second request keeps $6\times30=180$ requests open at once. Each one holds a connection, a thread or coroutine, request memory and a client that may give up and retry.

Answer after the upload commits and the same arrival rate keeps only $6\times0.15=0.9$ requests open on average. The transcoding work has not disappeared. It still needs $6\times30=180$ worker-seconds every second, which is why Heron runs 200 transcoding workers. What changed is *where* the waiting happens: inside a pool built for slow work, rather than inside the API's request path, its load balancer timeouts and the user's phone.

@fig sd_q_sync_wait | The same 6 uploads per second, measured as concurrent open requests. Moving the 30-second transcode out of the request drops the API's in-flight count from 180 to 0.9.

Two consequences are worth noticing early. A queue does not add capacity: 200 workers process at most $200/30\approx6.67$ jobs per second whether the jobs arrive through a queue or not. And the user now needs another way to learn that the clip is ready, which Section 4 builds.

:::story Picture this
A dry cleaner takes your coat, hands you a numbered ticket and says "Thursday". You do not stand at the counter while the coat is cleaned. The ticket is the promise, the rack in the back is the queue, and the cleaner's capacity is unchanged by the ticket system. If the shop loses the ticket book in a fire, the promise is worthless.
:::

## 2. Asynchronous processing architecture

Most request paths start as the simple shape: a request reaches a service, the service reads or writes a database, and the response reports the result. Everything happens on one timeline, so success means the work is done. The asynchronous shape inserts two boxes. The service writes a **message** describing work into a **message queue**, a durable buffer that holds messages until a worker takes them. A pool of workers reads messages and performs the slow work, writing results to the database.

Each box now owns a different promise. The service owns validation and the decision to accept. The queue owns retention: once it confirms a message, that message survives a broker restart under its configured durability. The worker owns the effect: transcoding, writing renditions and marking the job complete. The database owns the job's state, which both the API and the worker read.

@fig sd_q_shape | The two shapes. Orange marks the new boundary: acceptance and completion now happen at different times in different processes.

The trade is easy to state. The asynchronous shape gives shorter requests, smoothing of bursts, independent scaling of the slow tier and isolation from worker crashes. It costs a second system to operate, a delay between acceptance and completion, duplicate deliveries that the worker must tolerate, and a status protocol for the client. Reach for it when the work is slow, bursty, retryable or not needed for the immediate answer. Keep the simple shape when the caller truly needs the result now, for example a seat reservation whose answer decides the next screen.

:::note Where Kafka fits
This unit treats queues as a general mechanism and uses product names only as examples. The next unit opens up one retained log, Apache Kafka, in detail: brokers, replication, retention and its transaction protocol.
:::

## 3. Commands, events and jobs

Not every message means the same thing, and mixing the meanings causes design bugs. A **command** asks one owner to do something: "transcode clip 812 into 1080p, 720p and 360p". It has exactly one intended handler, it can fail, and the sender usually cares about the outcome. An **event** records that something already happened: "clip 812 was uploaded at 18:04:11". It has zero or more interested readers, it cannot fail because it is a fact, and the publisher should not depend on who reads it.

A **job** is a command plus its lifecycle state: accepted, running, succeeded, failed, cancelled. Heron's transcode job lives as a row in the database with an id, an owner, the clip key, attempt count and status. The queue message carries the job id, not the whole truth. A worker that receives job 812 reads the row, checks it is still wanted, and updates it as it progresses.

Names reveal the meaning. Commands are imperative (`TranscodeClip`), events are past tense (`ClipUploaded`). The distinction decides the topology in Part II: commands usually go to a queue with competing workers, events usually go to pub/sub or a stream with independent subscribers. It also decides error handling. A failed command needs a retry or an error report to its requester. A subscriber that cannot process an event has its own problem; the publisher's fact remains true.

@fig sd_q_kinds | Three message meanings. The job row, not the message, is the source of truth for progress.

A useful message carries a stable id, a type and schema version, the creation time, a correlation id that links it to the originating request, and the smallest payload that lets the handler find authoritative state. Put a 2,000-byte reference in a message, not a 40 MB video.

:::warn Watch out
Do not send a command dressed as an event, such as `ClipUploaded` that secretly expects exactly one transcoder to act and the uploader to wait for it. When a second subscriber appears, it will transcode the clip again. Name the intent and choose the topology from it.
:::

## 4. Durable acceptance and the job status contract

The phone sends the upload, and Heron replies quickly. What exactly may that reply claim? If it says "processing" but the job was only in the API server's memory, a deploy one second later loses the clip forever while the user believes it is being transcoded. Acceptance must mean the job exists durably.

The usual HTTP contract is `202 Accepted` with a job resource. The API writes the job row in the same transaction as the upload metadata, gets the message onto the queue (Part VII covers doing both safely), and returns `{"job": "812", "status": "queued"}` with a `Location: /jobs/812` header. The client then polls `GET /jobs/812`, receives a push notification, or both. The response promises "we have durably accepted this and will report the outcome", nothing more.

@fig sd_q_status | The status contract as a message sequence. The client never sees the queue; it sees a stable job resource.

The job resource needs a small state machine: `queued`, `running`, `succeeded` with result links, `failed` with a reason, and optionally `cancelled`. Transitions only move forward, so a late duplicate worker cannot flip `succeeded` back to `running`. Add an idempotency key to the upload request too. If the 202 response is lost and the phone retries, the API should return job 812 again rather than create job 813 and transcode twice.

How often should clients poll? With 1,000 phones waiting and a 2-second poll, the status endpoint receives 500 requests per second of mostly "still running". A suggested `Retry-After`, a backoff between polls and a push channel for completion keep that cost bounded.

@fig sd_q_submit_retry | Illustrative lost-response trace. Orange marks the repeated request returning the existing job under the same submit key.

:::interview Interview lens
**"You return 202 Accepted. What does the client know at that moment?"** Only that the job is durably recorded and has an id it can query. It does not know the job will succeed, when it will finish, or that a worker has even seen it. I back the promise with a committed job row and reliable enqueue, expose a forward-only status resource, and make the submit request idempotent so a lost response does not create a second job.
:::

:::key In one breath
A queue moves slow work out of the request path, shrinking in-flight requests by $L=\lambda W$ without adding any processing capacity. Commands ask one owner to act, events record facts for any number of readers, and a job row tracks a command's lifecycle. Acceptance must be durable before the API answers `202`, and the client learns the outcome through an idempotent, forward-only job status contract.
:::
