@part IX | Backend testing | We build a test suite that catches real bugs, runs fast enough to use on every change, and fails only when something is actually wrong. A slow or flaky suite gets ignored, and an ignored suite is worse than none because it gives false confidence. We will cover the kinds of tests, test doubles and databases, flaky tests and determinism, and the tests that go beyond correctness. | where:9

## 32. Unit, integration, API and end-to-end tests

Wren's tests sort into levels by how much of the system each one runs. A **unit test** runs one function or class in isolation, such as the pricing function given a basket and a coupon, with no network or database, in about 2 ms. An **integration test** runs a piece of code together with a real dependency, such as the order repository against a real PostgreSQL database, to check the SQL actually works. An **API test** sends HTTP requests to the running service, with its real middleware and database, and checks responses, status codes and side effects. An **end-to-end test** drives the whole system as a user would, app to API to workers to database, often through a browser or a device simulator.

The **test pyramid**, a shape Mike Cohn described in 2009, says to have many fast low-level tests and few slow high-level ones. Wren's suite has 1,000 unit tests at about 2 ms each, 2 seconds in total. It has 200 integration and API tests at about 200 ms each, 40 seconds. It has 20 end-to-end tests at about 10 seconds each, 200 seconds, mostly for the critical journeys of sign up, order and pay. The base catches logic errors quickly and precisely. The top catches wiring errors that no unit test can see, such as a misconfigured route or a missing migration.

@fig be_test_pyramid | Many fast tests at the base, few slow ones at the top. The run times explain the shape.

The pyramid is advice, not law. Backend services whose logic is mostly "receive a request, query a database, return JSON" get more value from API and integration tests against a real database than from unit tests full of mocks, a shape sometimes drawn as a trophy or honeycomb. What matters is that each important behaviour is tested at the cheapest level that can actually catch its bugs.

## 33. Test doubles, fixtures and test databases

A **test double** replaces a real collaborator in a test, a term Gerard Meszaros coined in 2007. A **stub** returns canned answers, such as a payment gateway that always returns "approved". A **mock** also checks that it was called in a particular way, "charge was called once with 450". A **fake** is a working lightweight implementation, such as an in-memory order repository or a local fake of the payment provider's API. A **spy** records calls so the test can inspect them afterwards. Dependency injection from Part VII is what makes swapping them in easy.

@fig be_test_doubles | Four kinds of double. Fakes give the most realistic behaviour for the least coupling.

Doubles have a cost. A mock-heavy test checks that the code calls its collaborators in a certain order, which breaks whenever the implementation changes even if the behaviour is still correct, and passes when the mocked collaborator would actually behave differently. Mock what you do not own and cannot run, such as a third-party payment API, ideally with a fake that follows its documented behaviour. For your own database, use the real thing. Mocking SQL tests nothing about whether the SQL works.

Real databases in tests used to be slow and painful. Today, tools such as Testcontainers start a real PostgreSQL in a container in a few seconds. **Fixtures** load the data each test needs, user 42 and restaurant 9's menu, ideally through factory functions that create only what the test uses rather than a giant shared dataset. A popular trick wraps each test in a transaction that is rolled back at the end, so every test starts clean and no cleanup code is needed. It has limits. Code under test that commits its own transactions, uses a second connection, or relies on triggers that fire on commit cannot be tested this way, and those tests truncate tables instead.

@fig be_test_rollback | Begin, load, act, assert, roll back. Fast isolation for most database tests.

## 34. Deterministic and flaky tests

A **flaky test** sometimes passes and sometimes fails without any code change. Flakiness compounds. If each of Wren's 300 integration tests fails spuriously 1% of the time, the chance that a whole run passes is $0.99^{300} \approx 4.9\%$. Nineteen runs out of twenty are red for no reason. Engineers learn to click "retry" without reading failures, and real bugs slip through. At a 0.1% flake rate the suite is green $0.999^{300} \approx 74.1\%$ of the time, still not good enough.

$$P(\text{green run}) = (1 - p)^n$$

Read it as the chance that each of n independent tests escapes its flake probability p. The formula explains why large suites need flake rates far below 1%.

@fig be_test_flaky | The same suite at two flake rates. Small per-test rates compound into an unusable signal.

Flakiness has a short list of causes. Tests depend on real time, such as "the order expires in 30 minutes", and fail near midnight or across daylight saving changes, so inject a clock. They depend on randomness, so seed it or inject it. They depend on order, sharing state through a database row or a global variable that another test changed, so isolate data per test. They wait for asynchronous work with a fixed `sleep(1)`, which is sometimes too short on a busy CI machine, so wait for the actual condition with a timeout. And they depend on the network or third-party services, so use fakes.

Treat a flaky test as a bug. Quarantine it so it stops blocking others, track it, and fix the cause within days. Google's testing teams have published data showing that a meaningful fraction of their test failures are flaky, which is why they invested in detecting and quarantining them automatically.

## 35. Contract, load and chaos tests

Some tests check properties other than "does this function return the right answer". **Contract tests**, from Part VI, check that a provider still satisfies what its consumers rely on. **Load tests** check performance. Tools such as k6, Locust, Gatling or wrk generate traffic at Wren's 2,000 requests per second and at twice that, and the test passes if p99 latency and error rate stay within targets. Variants include stress tests, which push beyond capacity to see how the system fails, and soak tests, which run for hours to find memory leaks and slow resource exhaustion. Unit XIV covers them in detail.

**Chaos tests** check resilience by injecting real failures, killing a Redis node, adding 500 ms of latency to the payment provider, or cutting off one availability zone, and observing whether the system degrades as designed. Netflix popularised the practice with Chaos Monkey in 2011, which randomly terminated production instances during working hours so engineers had to build services that survived it. Most teams start with chaos experiments in staging, with a clear hypothesis such as "if Redis disappears, orders still succeed with p99 below 800 ms".

@fig be_test_beyond | Three kinds of test that check things a unit test cannot see.

:::story Picture this
A smoke detector that goes off whenever someone makes toast. After a week, everyone ignores it, and on the day of a real fire nobody moves. A flaky test suite is that smoke detector, and fixing the false alarms is what makes the real ones count.
:::

:::warn Watch out
A test suite that only checks the happy path tests half the system. The most valuable backend tests check failures: invalid input, missing permissions, a dependency timing out, a duplicate request, a concurrent update. Write at least one failure test for every success test on code that handles money, permissions or data integrity.
:::

:::interview Interview lens
**"How would you structure tests for a backend service?"** Many fast unit tests for pure logic such as pricing, and a solid layer of integration and API tests against a real database in a container, with each test isolated by a rolled-back transaction or its own data. Use fakes for third parties I do not own and real implementations for my own database. A few end-to-end tests cover the critical journeys. Add contract tests for consumers, load tests against latency targets, and keep the suite deterministic by injecting clocks and randomness and quarantining flaky tests as bugs.
:::

:::key In one breath
Unit tests check logic in milliseconds, integration and API tests check real wiring against real databases, and a few end-to-end tests check critical journeys, which for Wren is 2 s, 40 s and 200 s of run time. Stubs, mocks, fakes and spies replace collaborators, and fakes for third parties plus real databases in containers test the most for the least coupling. Flakiness compounds as $(1 - p)^n$, so 300 tests at 1% each pass together only 4.9% of the time, and clocks, randomness, shared state and sleeps must be controlled. Contract, load and chaos tests check compatibility, performance and resilience.
:::
