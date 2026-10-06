@part VII | Feature flags | We separate deploying code from releasing behaviour, so new features can be turned on gradually and off instantly. A flag is a runtime decision about which code path a request takes. We will cover flag types, percentage rollouts and targeting, and evaluation, kill switches, caching and the cleanup that keeps flags from becoming debt. | where:7

## 20. Flags, rollouts and targeting

Wren is rebuilding its checkout page. The new version touches pricing, payment and the order service, and the team wants to deploy pieces of it daily without customers seeing a half-built checkout. A **feature flag** is a named switch that code checks at runtime: `if flags.enabled("checkout_v2", user) { newCheckout() } else { oldCheckout() }`. The code for both paths is deployed. Which one runs is decided by the flag's configuration, which can change in seconds without a deploy.

The simplest flag is a **boolean**, on or off for everyone. Most useful flags are **targeted**, returning different values for different requests based on attributes in an evaluation context, such as the user id, tenant, country, app version or whether the user is staff. Wren's `checkout_v2` flag was on for Wren employees first, then for one restaurant group that volunteered, then for customers in one city, and finally a growing percentage of everyone. Each step exposed the code to more real use while keeping the blast radius small.

@fig be_dep_flag_rollout | A percentage rollout hashes the flag and user id into a bucket from 0 to 99. Raising the percentage only adds users.

**Percentage rollouts** must be **sticky**. If a user randomly got the new checkout on one request and the old on the next, the experience would flicker and the results would be meaningless. So the flag system hashes a stable key, such as `"checkout_v2:" + user_id`, into a bucket from 0 to 99, and the flag is on when the bucket is below the rollout percentage. User 42 always lands in the same bucket, say 37, so at 10% they see the old checkout, and from 38% onward they see the new one, on every request and every server. Including the flag's name in the hash makes different flags independent, so the same 10% of users are not the guinea pigs for every feature. Raising the percentage only adds users, so nobody switches back and forth.

**Cohort targeting** groups users by shared attributes, such as "customers who ordered more than 10 times" or "restaurants on the new menu system", defined once and reused across flags. **Experiments**, A/B tests, are flags whose variants are measured: half of eligible users get variant A, half get B, assignment is logged, and a metric such as orders completed is compared with a statistical test. The bucketing rules are the same, with the added requirement that assignment and exposure events reach the analytics pipeline exactly.

Flags differ in purpose and lifetime. **Release flags** hide unfinished work and live for weeks. **Experiment flags** live for the length of a test. **Operational flags**, including kill switches, live as long as the code they protect. **Permission flags** that gate paid features are really product configuration and may live for years. Knowing which kind a flag is decides how it is reviewed and when it must be removed.

## 21. Kill switches, evaluation, caching and cleanup

A **kill switch** is a flag whose job is to turn something off in an emergency. Wren has kill switches on its recommendations panel, its third-party address autocomplete, its search spelling correction and its loyalty points calculation, each of which depends on something that may fail or become slow. When the address provider had an outage, on-call turned off autocomplete in one click, and checkout continued with a plain text field. A kill switch is a pre-built degradation path, the graceful degradation of Unit X, and it is useless unless the off path is tested regularly.

Flags are evaluated either on the server or on the client. **Server-side evaluation** keeps the rules and targeting on Wren's servers, so the client never learns about unreleased features or about other users' attributes. Clients receive the results, or simply the behaviour. **Client-side evaluation** in a mobile app or browser receives a set of flag values for the current user, which is fine for presentation choices but must never be trusted for anything that matters, since a user can change values on their own device. A paid feature or a permission check is always enforced on the server, Unit IV.

@fig be_dep_flag_eval | Flag rules sync to a local cache in each service. Evaluation is a memory lookup, and the flag service being down changes nothing.

**Caching** makes flags fast and resilient. A flag check sits on hot paths, sometimes several per request, so it cannot be a network call each time. Flag SDKs, from LaunchDarkly, Unleash, Flagsmith, or the OpenFeature standard's providers, download the full rule set at startup, keep it in memory, and receive updates by streaming or polling every few seconds. Evaluation is then a local function call taking microseconds. If the flag service goes down, services keep evaluating with the last rules they received, and new pods start with defaults coded in the application or a cached snapshot. Wren chooses each flag's default to be the safe behaviour if nothing else is known, which for a kill switch means the feature stays on, and for a new feature means it stays off.

The cost of flags is complexity. Each flag doubles the paths through the code it guards, and combinations multiply: ten independent flags mean 1,024 possible configurations, and nobody tests them all. **Stale flags**, fully rolled out or abandoned but still in code, are where this turns into bugs, such as the 2012 Knight Capital incident, in which repurposing an old flag reactivated dead code on one server that had not been updated, and the firm lost about 440 million dollars in 45 minutes. Wren's rules: every release flag has an owner and an expiry date when it is created, the flag service reports flags that have served one value to 100% of traffic for 30 days, and removing a flag means deleting the losing code path and the flag together. Flag names are never reused.

:::story Picture this
The lighting desk in a theatre. Every light is wired in before opening night, but the desk decides which are on in each scene, and the operator can bring a new spotlight up slowly, on one side of the stage first. There is also a red switch that cuts the pyrotechnics instantly if anything goes wrong. And after the run ends, someone has to unwire the lights the show no longer uses, or the next production inherits a desk full of mystery switches.
:::

:::note Flags and incidents
Flag changes are production changes. Wren's flag service records who changed what and when, shows flag changes as markers on dashboards next to deploys, Unit XIV, and requires review for changes to flags on payment paths. "A flag was flipped at 20:03" is as common a cause of incidents as a deploy.
:::

:::warn Watch out
Flags that never get removed turn into a maze of untested paths, and reusing an old flag can wake dead code. Give every flag an owner and an expiry, alert on flags stuck at 100%, delete the losing path when removing a flag, and never reuse a name.
:::

:::interview Interview lens
**"How do feature flags work and what are their risks?"** Code for both paths is deployed and a runtime rule chooses one per request from attributes such as user, tenant and region, so release is separate from deploy. Percentage rollouts hash flag name plus user id into a sticky bucket. SDKs cache rules locally and stream updates, so evaluation is fast and survives the flag service being down, with safe defaults. Evaluate on the server for anything that matters. Use kill switches for risky dependencies. The risk is debt, so every flag needs an owner, an expiry and removal of the dead path.
:::

:::key In one breath
A feature flag is a runtime switch between deployed code paths, boolean or targeted by attributes, so deploy and release are separate. Percentage rollouts hash flag name and user id into a sticky bucket from 0 to 99, so raising the percentage only adds users and different flags pick independent users. Cohorts and experiments reuse the same bucketing. Kill switches are tested degradation paths. SDKs cache rules locally for microsecond evaluation that survives a flag service outage, with safe defaults, and anything that matters is evaluated on the server. Ten flags make 1,024 combinations, so every flag needs an owner, an expiry and deletion, as Knight Capital's reused flag showed.
:::
