<section class="front">

<div class="part-kicker">Before we start</div>

# How to read this chapter

<p class="lede">Every earlier unit added a feature, and every feature added a way in. This unit is about the bugs that let hostile input change what a backend does, and about protecting secrets and data so that a bug, when one gets through, costs as little as possible.</p>

The unit is written from the defender's side. For each class of bug it explains how ordinary code ends up vulnerable, what the vulnerable pattern looks like in review, how to prevent it by construction, and how to detect it in tests, scanners and logs. It does not teach exploitation, and the few example inputs it shows are the textbook ones that every scanner already sends.

Part I sets up a way of thinking about threats and the OWASP lists. Parts II and III cover the injection family, from SQL to XML. Part IV covers cross-site scripting and output encoding. Part V is server-side request forgery in depth. Part VI covers flaws in how HTTP is parsed, cached and redirected. Part VII covers deserialization, race conditions and resource bombs. Part VIII is about secrets and configuration. Parts IX and X are applied cryptography and data protection, ending with one request that passes through every defence in the unit.

Each section starts from a Wren situation, explains the mechanism, works the numbers and then shows a figure. *Picture this* boxes give analogies, notes add detail, *Watch out* names real mistakes, and *Interview lens* gives an answer to say aloud. *In one breath* closes each part.

By the end you should be able to review a pull request for injection and SSRF, explain why a parameterized query is safe and an escaped one is not, design secret storage and rotation for a fleet, and choose the right cryptographic tool for encoding, hashing, encryption or signing without guessing.

</section>

<section class="front">

<div class="part-kicker">The running system</div>

# Meet Wren

**Wren** is the illustrative food-ordering service from earlier units. These are the numbers and features this unit uses. All are assumptions chosen for readable arithmetic, not measurements.

| Setting | Value | What it controls |
|---|---|---|
| Public routes | 120, behind one gateway | Attack surface |
| Peak traffic | 2,000 requests/s across 4 instances | Cost of each check |
| Menu photo import | restaurants paste a URL, Wren fetches it | SSRF |
| Receipt templates | restaurant groups customise their receipt email | Template injection |
| Reviews | free text shown to every customer of a restaurant | Cross-site scripting |
| Order list sort | `?sort=created_at` chosen by the client | SQL identifiers |
| Accounts | 1,000,000, with phone numbers and addresses | Field-level encryption |
| Restaurant groups | 2,000 tenants, one data key each | Envelope encryption |
| Secrets | 38 across 6 services, database credentials valid for 1 hour | Rotation |
| Cloud metadata endpoint | `169.254.169.254` | The SSRF prize |

The main flows in this unit are a restaurant importing a menu photo from a URL, a customer reading reviews, and user 42 saving a new delivery address. Part X follows the last of these through every defence.

</section>
