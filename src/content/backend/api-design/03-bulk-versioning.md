@part III | Bulk APIs, partial updates, versioning | We cover operations on many items at once, precise partial updates, and how an API changes without breaking the clients already using it. A public API cannot force every mobile app installed on every phone to update on the same day. We will cover bulk endpoints, partial updates, the versioning strategies, and compatible changes with a deprecation process. | where:3

## 9. Bulk APIs and partial updates

A restaurant manager changes the prices of 40 menu items before dinner. Forty separate PATCH requests cost forty round trips, forty authorization checks and forty audit log entries, and on a phone in a busy kitchen some will fail halfway. A **bulk API** accepts many operations in one request, as in `POST /menu-items/batch` with a list of updates. It saves round trips and lets the server apply the changes efficiently, for example in one database transaction.

The hard question is what happens when some items fail. There are two honest answers, and the API must choose one and document it. In the all-or-nothing design, the batch runs in one transaction, and if item 18 has a stale version, nothing is applied and the response is 409 with the failing item named. In the independent-items design, each item succeeds or fails on its own, and the response lists a result per item, such as 200 for item 17, 409 for item 18 and 204 for item 19. The overall status is then usually 200, with per-item statuses in the body. (WebDAV defined `207 Multi-Status` for this, and some APIs use it.) A batch also needs limits, such as 100 items per request, for the same reasons as array limits in Unit IV.

@fig be_api_bulk | One request, a result per item. The API must say whether partial success is possible.

Partial updates have their own precision problem. In JSON Merge Patch, from Unit I, a field present in the body is replaced, a field set to `null` is deleted, and an absent field is left alone. Applying `{"tip": 30, "gate": null}` to an order with a note, a tip and a gate keeps the note, changes the tip and removes the gate. That covers most needs. It cannot express "set this field to null" when null is a real value, and it cannot append to a list, which is when JSON Patch with explicit operations is worth its extra complexity.

@fig be_api_partial | Merge patch semantics. Absent keeps, null deletes, a value replaces.

## 10. API versioning

Wren wants to change how orders represent money, from a float `"total": 450.0` to integer paise `"total_paise": 45000` with a separate currency. Old app versions installed on hundreds of thousands of phones read `total`. If the response changes for everyone at once, those apps show nonsense until users update, and many never do. The API needs to serve both shapes for a while, which is what **API versioning** is for.

There are three common places to put the version. In the URL, `/v2/orders`, it is visible in logs and docs, easy to route at a gateway, and cacheable, since the version is part of the cache key. Most public APIs, including Twitter and Google's, used URL versions. In a header, such as `Api-Version: 2026-10-01`, URLs stay clean and a client pins a date. Stripe uses date-based versions this way, and each account is pinned to the version current when it signed up, while the server translates responses for older versions through a chain of small transformations. In the media type, `Accept: application/vnd.wren.v2+json`, versioning is precise per representation but awkward to test in a browser and easy to get wrong in caches.

@fig be_api_versioning | Three places for the version. URLs are the most common; dated headers scale best for many small changes.

Versions are expensive, because every version is code to maintain and test. Most of the craft is avoiding new versions by making changes compatible, which is the next section. A new major version is for changes that cannot be made compatible, and it should batch several of them.

## 11. Compatible changes, breaking changes and deprecation

A change is **backward compatible** when existing clients keep working without modification. Adding an endpoint is compatible. Adding an optional request field with a sensible default is compatible. Adding a field to a response is compatible, provided clients ignore fields they do not know, which the API's documentation should require from the start. Adding an enum value is compatible only if clients handle unknown values, for example by showing "other", which is worth requiring explicitly, because a client with a `switch` statement and no default case will crash on `"status": "refunded_partially"`.

A change is **breaking** when an existing client can fail. Removing or renaming a field, changing its type or format, making an optional field required, tightening validation so previously accepted input is rejected, changing the meaning of a status code, or changing default sorting all break someone. Some breaks are subtle. Changing an id from a number to a string breaks every client in a strongly typed language. Changing a field from always present to sometimes absent breaks clients that never checked.

@fig be_api_compat | Additions are usually safe. Removals, renames, type changes and stricter rules are not.

When a break is unavoidable, retire the old version with a process rather than a date on a wiki. Ship v2 and announce a timeline. Mark v1 responses with a `Deprecation` header (RFC 9745) and a `Sunset` header (RFC 8594) carrying the shutdown date, so clients can detect it in code. Measure who still calls v1, by API key and app version, and contact the largest callers directly. Some teams run brownouts, short scheduled periods where v1 returns errors, to flush out forgotten integrations before the final shutdown.

@fig be_api_deprecation | Six months from v2 to shutdown, with machine-readable signals along the way.

:::story Picture this
A city renaming a street. It does not take down the old signs overnight. It puts up both names for a year, tells the post office, writes to every business on the street, and only then removes the old signs. Letters addressed the old way still arrive during that year.
:::

:::warn Watch out
Mobile apps make deprecation slow. A version of the Wren app released two years ago may still run on thousands of phones whose owners never update. Plan for long tails, consider a minimum-supported-version check that asks users to update, and never break the endpoint that check uses.
:::

:::interview Interview lens
**"How do you evolve an API without breaking existing clients?"** Make changes additive whenever possible, new optional fields, new endpoints, new enum values that clients are required to tolerate, and never rename, remove or retype fields in place. When a break is unavoidable, introduce a new version in the URL or a dated header, run both, and translate old versions at the edge where possible. Announce deprecation with Deprecation and Sunset headers, measure remaining traffic per client, contact the biggest callers, and only then shut the old version down.
:::

:::key In one breath
Bulk endpoints save round trips but must state whether a batch is all-or-nothing or returns a result per item, and they need item limits. Merge patch replaces present fields, deletes null ones and keeps absent ones. Versions go in the URL, a dated header or the media type, and each version is code to maintain. Additive changes are compatible if clients ignore unknown fields and tolerate new enum values, while removals, renames, type changes and stricter validation break clients and need a new version with Deprecation and Sunset headers and measured traffic before shutdown.
:::
