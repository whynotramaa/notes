@part IV | Retries, exponential backoff, and jitter | We recover transient failures without repeating irreversible effects or multiplying demand. An uncertain outcome and a permanent rejection need different responses. We will classify failures, calculate backoff, spread retries, and give one layer a bounded retry budget. | where:4

## 13. Which failures deserve a retry?
A malformed score correction will remain malformed after a delay. A connection interrupted before any command was sent may work on another attempt. A lost reply after commit is different again. A **retry** is another attempt to complete the same logical operation, and that identity is part of its safety.

Classify the outcome first. Validation or permission failures require a corrected request or changed permission. Transient transport failures may permit another attempt if the deadline and budget allow it. Uncertain writes require a stable command key and recovery of the original result, because blindly creating a new write can duplicate the effect.

@fig sd_reliability_classes | Three different failure classes. The application chooses whether an operation is safe to repeat.

For a command that adds a score delta, repeating the bytes is insufficient. The service must attach the same operation identity. A separate genuinely new correction uses a new identity even if its content is identical. [Amazon's idempotent API discussion](https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/) motivates this distinction.

:::story Picture this
A courier did not return a delivery receipt. Sending the same parcel again may duplicate delivery; asking for the result under the original parcel number can resolve what happened. The receipt problem and the delivery problem are separate.
:::
## 14. Exponential backoff
Every failed request retries immediately, so a brief interruption produces another burst before the server recovers. **Exponential backoff** increases the delay ceiling between repeated attempts. It reduces repeated pressure and gives transient causes time to change, while a cap bounds an individual delay.

$$b_k=\min(b_{\max},b_0 2^k).$$
Read this as attempt index $k$ gets a ceiling equal to the smaller of maximum delay $b_{\max}$ and initial delay $b_0$ doubled $k$ times. With illustrative initial delay 100 milliseconds and ceilings below the cap, the first values are 100, 200, 400, and 800 milliseconds.

@fig sd_reliability_backoff | Illustrative backoff ceilings. A retry is skipped when the request has no remaining useful budget.

The cap does not stop infinite attempts. Limit attempt count, overall time, and service-wide retry rate separately. A long-lived background task may have a different retry horizon from a viewer's interactive read. Store its progress so that a process restart does not reset all waiting work into an immediate burst.

:::note Count attempts precisely
An initial attempt plus retries is a different total from a limit described as attempts. Configuration and dashboards should use the same convention. Otherwise every layer can add an unnoticed extra attempt.
:::
## 15. Jitter spreads the same recovery work
A fleet with identical delays retries together. **Jitter** is randomness added to retry timing so failures do not synchronize another surge. Under full jitter, choose a delay uniformly between zero and the current backoff ceiling.

$$J_k\sim U(0,b_k),\qquad E[J_k]=b_k/2.$$
Read this as the delay $J_k$ is uniform over the interval ending at ceiling $b_k$, so its mean is half that ceiling. For ceilings 100, 200, 400, and 800 milliseconds, the means are 50, 100, 200, and 400 milliseconds. These are distribution means, not promised delays for individual callers.

@fig sd_reliability_jitter | Illustrative delay distribution. Randomizing time does not reduce the number of attempts by itself.

Use an actual random source and keep the chosen delay within the remaining deadline. Do not describe jitter as fairness: a random short wait can favor one caller by chance. Admission policy supplies fairness; jitter reduces synchronized load. [The Builders' Library](https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/) discusses these distinct controls.

:::warn Watch out
Backoff without jitter can preserve a synchronized wave. Jitter without an attempt limit can preserve an endless workload. Both still require idempotency for operations whose outcomes may be uncertain.
:::
## 16. One retry owner and a retry budget
A gateway, application, and database wrapper each allow three attempts. One logical request can then become 3 times 3 times 3, or 27 database attempts. This multiplication is why a locally reasonable policy can create a globally unreasonable workload.

Give the layer with enough semantic knowledge ownership of retries. Lower layers should report failures promptly and expose whether work might have committed. An illustrative service-wide budget permits retry traffic of at most 10% of 1,000 original requests per second, or 100 retries per second. The attempt policy still limits each request separately.

@fig sd_reliability_amplification | Each layer permits three total attempts. Independent retry ownership produces the product.

@fig sd_reliability_retrybudget | Illustrative budget. Retries still require a remaining deadline and a safe operation identity.

:::interview Interview lens
**"Why can retries reduce availability?"** They increase demand during a period when capacity may already be reduced. Multiple layers multiply attempts, and identical delays synchronize them. Retry only eligible failures, preserve the logical operation identity, and enforce one owner with backoff, jitter, and budgets.
:::
:::key In one breath
A retry repeats a logical operation, so failure classification and stable identity come first. Exponential backoff raises a delay ceiling, and jitter spreads attempt timing. Neither bounds the total operation alone. One retry owner, a deadline, an attempt limit, and a service-wide retry budget prevent recovery work from overwhelming useful work.
:::
