@part V | Input validation | We learn how to decide whether data sent by a client is acceptable before the code acts on it. Syntactically valid JSON can still carry negative quantities, impossible dates, extra fields and megabytes of nesting. We will cover the layers of validation, allowlists versus blocklists, normalization and sanitization, nested objects and unknown fields, and size limits. | where:5

## 15. Syntactically valid is not valid

Wren's signup endpoint receives this body: `{"email": "asha@", "age": -500, "role": "admin", "qty": "3"}`. It parses perfectly. Every brace matches and every string is quoted. And every field is wrong in a different way. The email has no domain, the age is impossible, the role is something the client should never set, and the quantity is a string where a number belongs. **Input validation** is the work of deciding whether data is acceptable before using it, and it happens in layers, each catching a different kind of wrong.

**Schema validation** checks structure: which fields exist, which are required, which are forbidden. **Type validation** checks that each value has the right type, so `qty` must be an integer and `"3"` is rejected rather than quietly converted. **Semantic validation** checks that a value makes sense on its own, such as an email with a domain, an age between 13 and 120, a delivery date in the future, or a phone number that parses. **Business-rule validation** checks the value against the system's state, such as whether restaurant 9 is open, whether the item is in stock, and whether the coupon is valid for this user. Schema, type and semantic checks need no database and run first. Business rules run in the service, often inside the same transaction as the write, because the state can change between check and use.

@fig be_valid_layers | Four layers, four kinds of wrong. The JSON parsed fine and fails three of them.

Each layer maps to a status code from Unit I. A body that will not parse is 400. Schema, type and semantic failures are 422, or 400 for APIs that use one validation code, with a body listing every field that failed so the client can fix them all at once. Business-rule failures are usually 409 or 422, depending on whether retrying later could succeed.

Validation belongs at the boundary, where untrusted data enters, and nowhere else. That includes HTTP bodies, query strings and headers, but also messages read from a queue, rows imported from a partner's CSV, webhook payloads and responses from third-party APIs. A field that passed validation on the way in should travel inside the system as a typed value, not as a raw string that every later function revalidates or, worse, trusts.

## 16. Allowlists, blocklists, normalization and sanitization

There are two ways to define acceptable input. A **blocklist** names what is bad and accepts everything else, as in "reject any input containing `<script>`". An **allowlist** names what is good and rejects everything else, as in "the sort field must be one of `price`, `rating` or `name`". Blocklists lose, because attackers have endless variants. `<SCRIPT>`, `<scr<script>ipt>`, `<img onerror=...>`, and entity-encoded forms all pass a `<script>` filter. An allowlist never needs to know the attacks, because anything it did not explicitly name is out. Wren validates enums, sort fields, column names, file types and redirect targets with allowlists, and uses ranges and patterns for free-form values.

@fig be_valid_allowlist | The blocklist misses every variant. The allowlist rejects anything it did not name.

Two related operations are often confused with validation. **Normalization** converts equivalent inputs to one canonical form: trimming whitespace, lowercasing an email domain, converting Unicode to NFC (Part VI explains why), decoding percent-encoding once, and resolving `a/./b/../c` to `a/c`. **Sanitization** changes input to remove dangerous parts, such as stripping HTML tags from a comment. Order matters. Decode and normalize first, then validate the normalized value, then use exactly that value. Validating before normalizing lets `%2e%2e%2f`, which decodes to `../`, pass a check for `../` and then become `../` later.

@fig be_valid_normalize | Normalize, then validate, then use. Output encoding happens later, per destination.

Sanitization at input time is usually the wrong tool for injection. Whether `O'Brien` or `<b>` is dangerous depends on where it goes, into SQL, HTML, a shell command or a log line, and each destination has its own escaping rules. The robust approach validates input for business meaning, stores it as given, and encodes it at output for the destination: parameterized queries for SQL, HTML escaping in templates, argument arrays for subprocesses. Unit XIII covers each of those.

:::warn Watch out
Client-side validation in the app or the browser is a convenience for users, never a control. Anyone can send requests directly to the API. Every rule enforced in the front end must be enforced again on the server, and it is easier to keep the two in step when both are generated from one shared schema.
:::

## 17. Nested objects, unknown fields and request-size limits

Real request bodies nest. An order contains items, each item contains options, each option may contain a price adjustment. Validation must recurse through every level with the same rigor as the top. A schema language such as JSON Schema, Pydantic in Python, Zod in TypeScript, or Bean Validation in Java describes the whole tree, so validation of nested objects comes from the same declaration as the top level and cannot be forgotten for one branch.

**Unknown fields** need a policy. Some APIs ignore them, which is lenient and lets old clients keep working when new fields are added to responses. For request bodies that map onto database models, ignoring is not enough, because many frameworks quietly copy every field onto the model, which is the mass assignment attack in Part VI. Wren rejects unknown fields on write endpoints with 422 and a message naming them, which also catches client typos like `"qantity"` that would otherwise silently do nothing.

Limits come before parsing, because parsing is where many denial-of-service attacks happen. Wren caps the body at 1 MB at the proxy, so a 2 GB upload never reaches the app. It caps JSON nesting depth at 32 levels, since some recursive parsers overflow their stack on deeply nested arrays like `[[[[...]]]]`. It caps arrays at 100 items, because an order with 1,000,000 items would make every loop in the code run a million times. It caps strings at 2,000 characters. A small request should never be able to cause a large amount of work.

@fig be_valid_limits | Five bounds, applied before or during parsing. Each blocks a cheap way to make the server do expensive work.

:::note Validate responses from other services too
Data from your own other services and from partners is input as well. A partner API that starts returning `"price": null` or a nested object where a number used to be will crash code that assumed the old shape. Validating at that boundary turns a confusing crash deep in the code into a clear error at the edge.
:::

:::interview Interview lens
**"Syntactically valid JSON does not mean valid input. What do you check, and in what order?"** First limits, body size, depth and array length, before or during parsing. Then the schema, with required fields and unknown fields rejected, then strict types without silent coercion, then semantic rules such as formats and ranges, using allowlists wherever the set of good values is known. Normalize before validating so the checked value is the used value. Finally business rules against current state, inside the transaction that writes, and return field-level errors with 422 or 409.
:::

:::key In one breath
Input validation runs in layers, schema, type, semantic and business rule, and parses-fine JSON can fail all of them. Allowlists define what is good and beat blocklists, which chase endless attack variants. Normalize before validating, validate for meaning, and encode at output for each destination rather than sanitizing at input. Validate nested objects with the same schema, reject unknown fields on writes, and bound body size, depth, array length and string length before parsing can be abused.
:::
