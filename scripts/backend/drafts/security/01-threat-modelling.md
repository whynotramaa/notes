@part I | Threat modelling and the OWASP lists | We set up one way of looking at every vulnerability in the unit, so that each new name is a variation on a pattern rather than a fact to memorise. Most backend security bugs come from the same few mistakes about where trust ends. We will cover the four questions to ask of any bug, the OWASP Top 10 and API Security Top 10, and Wren's trust boundaries. | where:1

## 1. Four questions for every vulnerability

Security vocabulary is large. A list of backend weaknesses runs to thirty names or more, from SQL injection to cache deception, and learning them one at a time produces an engineer who can recite definitions but cannot spot a new bug in a pull request. A better approach is to ask the same four questions of every weakness, and this unit does that for each one.

The first question is **how it works**, the mechanism in one sentence. SQL injection works because the database receives one string and cannot tell which characters the programmer wrote and which the user typed. The second is **why ordinary code permits it**, the shortcut or assumption that makes the bug easy to write. For SQL injection the shortcut is building a query with string concatenation, which every language makes convenient. The third is **what an attacker gains**, which sets the severity. For SQL injection it can be every row in the database. The fourth is **how the backend prevents it and detects it**, ideally by construction, so that the safe way is also the easy way, and then by tests, scanners and logs as a second line.

@fig be_sec_four_q | The same four questions turn thirty vulnerability names into one habit of review.

Asking these questions exposes a pattern. Nearly every bug in Parts II to VII has the same root, data crossing from a place the backend does not control into a place where it is treated as instructions. A query string becomes SQL. A filename becomes a path. A URL becomes a network request to an internal address. A review becomes HTML that a browser runs. In each case the defence is the same idea in a different costume: keep data and instructions in separate channels, so that no value a user sends can change the structure of what runs.

The second pattern is that prevention beats filtering. Teams under pressure reach for a blocklist, refusing inputs that contain `'` or `<script>` or `169.254`. Blocklists fail because attackers have many spellings for the same thing and the blocklist has only the ones its author thought of. Every part of this unit ends with a structural defence, such as parameterized queries, context-aware encoding or an egress proxy, and treats filtering as a backup at most.

## 2. The OWASP Top 10 and API Security Top 10

The **Open Worldwide Application Security Project**, OWASP, is a nonprofit that publishes free guidance on web security. Its best-known document is the **OWASP Top 10**, a ranking of the most serious categories of web application risk, built from vulnerability data contributed by testing firms and a survey of practitioners. Interviewers use it as shared vocabulary, so a backend engineer should know its shape.

The 2021 edition, still the most cited, lists A01 Broken Access Control, A02 Cryptographic Failures, A03 Injection, A04 Insecure Design, A05 Security Misconfiguration, A06 Vulnerable and Outdated Components, A07 Identification and Authentication Failures, A08 Software and Data Integrity Failures, A09 Security Logging and Monitoring Failures, and A10 Server-Side Request Forgery. Access control is first because OWASP found some form of it in 94% of the applications tested. Injection, which topped every edition from 2010 to 2017, fell to third as frameworks made parameterized queries the default, and the category was widened to include cross-site scripting. The 2025 edition keeps access control first, adds software supply chain failures as its own category, and folds SSRF into access control.

@fig be_sec_owasp | The 2021 Top 10 with the unit that covers each category. Broken access control was found in 94% of tested applications.

APIs have their own list. The **OWASP API Security Top 10**, 2023 edition, starts with API1 Broken Object Level Authorization, the IDOR bug from Unit IV, then Broken Authentication, Broken Object Property Level Authorization (mass assignment and over-exposed fields), Unrestricted Resource Consumption, Broken Function Level Authorization, Unrestricted Access to Sensitive Business Flows (bots buying all the tickets), SSRF, Security Misconfiguration, Improper Inventory Management (forgotten old API versions), and Unsafe Consumption of APIs (trusting a third party's responses).

The lists are categories, not checklists. Wren uses them to make sure its reviews, tests and threat models cover each category somewhere, and the figure maps each 2021 category to where this series treats it. Several were covered in earlier units. This unit fills in injection, cross-site scripting, SSRF, the cryptographic failures and the parts of misconfiguration and integrity failures that sit in backend code.

## 3. Trust boundaries and Wren's attack surface

A **trust boundary** is any line in a system where data passes from something less trusted to something more trusted. The obvious one is the edge, where requests from the internet reach the gateway. Less obvious ones are everywhere. A restaurant's receipt template crosses a boundary when Wren renders it. A webhook from a payment provider crosses one when Wren parses it. A URL a restaurant pastes crosses one when Wren fetches it. A row written by one tenant crosses one when it is shown to another tenant's customers. Each crossing is a place where the receiving code must treat the data as hostile until checked.

The **attack surface** is the sum of these crossings. Wren's includes its 120 public routes, every field in every request body, every header it reads, the files it accepts, the URLs it fetches, the webhooks it receives, the messages it consumes from Kafka, and the admin tools its support staff use. A **threat model** is a structured walk over that surface asking what could go wrong at each crossing. A common method is **STRIDE**, from Microsoft, which names six kinds of threat: spoofing identity, tampering with data, repudiation (denying an action), information disclosure, denial of service and elevation of privilege. A team draws the data flow, marks each boundary, and asks the six questions at each one.

@fig be_sec_boundaries | Wren's trust boundaries. Each dashed line is a place where incoming data must be treated as hostile.

Two practical rules come out of threat modelling. The first is to check at the boundary, not somewhere downstream, because data that has passed one check tends to be trusted by everything after it. A validation layer at the API edge, Unit IV, is necessary but not sufficient, because the same value may later be used as SQL, a path or a URL, and each use needs its own safe handling at the point of use. The second rule is that internal is not trusted. A message from Kafka was produced by Wren's own code, but that code may have copied an attacker's string into it, and a service inside the network may itself be compromised. Treating internal callers as hostile by default is the idea behind zero-trust networking, Part X.

:::story Picture this
A hospital pharmacy. A written prescription crosses several hands before a patient gets medicine. A careful pharmacy checks the prescription at the counter, but the nurse at the bedside checks the label against the patient's wristband again, because a mistake or a forgery could have entered anywhere between. Every hand-off is a boundary, and each hand checks for the thing it is about to do.
:::

:::note Security reviews and scanners
Wren runs three kinds of automated check in CI. Static analysis (SAST) tools such as Semgrep and CodeQL flag string-built queries, shell calls with variables and unsafe deserializers in the source. Dependency scanners flag libraries with known vulnerabilities, OWASP's A06. Dynamic scanners (DAST) such as OWASP ZAP send known-bad inputs to a staging deployment. None replaces review by someone who asks the four questions.
:::

:::warn Watch out
Treating the edge as the only boundary is the most common mistake. A value validated as "a string under 200 characters" at the API is still dangerous when it reaches a shell command or an HTML page three services later. Safe handling happens where the value is used.
:::

:::interview Interview lens
**"How do you approach security for a new backend feature?"** Draw the data flow and mark every trust boundary, including internal ones such as queues and templates. At each one ask what the data could do if hostile, using STRIDE or the OWASP categories as prompts. Prefer defences that work by construction, such as parameterized queries, encoding by default and allowlisted egress, over filters. Back them with static analysis, dependency scanning and dynamic scanning in CI, and log security-relevant events so that failures are detected.
:::

:::key In one breath
Ask four questions of every vulnerability: how it works, why ordinary code permits it, what an attacker gains, and how to prevent and detect it. Most backend bugs are data crossing a trust boundary and being treated as instructions, so the structural fix is to keep data and instructions apart rather than to filter. The OWASP Top 10 puts broken access control first (found in 94% of tested apps) and the API Security Top 10 starts with BOLA. Threat-model every boundary, including internal ones, with STRIDE, and handle each value safely where it is used.
:::
