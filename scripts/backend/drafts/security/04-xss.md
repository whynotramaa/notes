@part IV | Cross-site scripting and output encoding | We look at the injection bug whose interpreter is the user's browser. A backend that puts untrusted text into a page without encoding it lets that text run as the site, with the user's session. We will cover the three kinds of XSS, context-aware output encoding and sanitization, and Content Security Policy with Trusted Types. | where:4

## 12. Stored, reflected and DOM-based XSS

Wren shows reviews on every restaurant page. A review is free text, and the first version of the page template inserted it into the HTML as it was written. A review containing `<script>` tags is then part of the page, and every customer who opens the restaurant's page runs that script, in their browser, on Wren's origin. This is **cross-site scripting**, XSS. The name is historical and misleading. The script does not cross sites. It runs inside the vulnerable site, which is what makes it dangerous.

A script running on Wren's origin is, to the browser, Wren's own code. The same-origin policy, Unit II, protects Wren from other sites, but it cannot protect Wren from itself. The script can read anything on the page, call Wren's API with the user's cookies attached, read tokens from `localStorage`, change the delivery address, and show a fake login form on a real Wren URL. `HttpOnly` cookies, Unit II, stop it from reading the session cookie, but not from using the session while the page is open. In 2005, the Samy worm used stored XSS on MySpace to add its author as a friend of every profile that viewed an infected one, and copied itself onto each, reaching over a million profiles in under a day.

@fig be_sec_xss_kinds | Stored XSS waits in the database, reflected XSS bounces off a request, DOM XSS never touches the server.

There are three kinds. **Stored XSS**, like the review, saves the payload on the server and serves it to everyone who views it. **Reflected XSS** takes it from the current request and echoes it back, such as a search page that prints "No results for …" with the query unencoded, and needs a victim to follow a crafted link. **DOM-based XSS** happens entirely in the browser, when front-end JavaScript reads something attacker-influenced, such as `location.hash`, and writes it into the page with `innerHTML`. The server never sees the payload, so server-side encoding cannot help with it.

Backend engineers sometimes treat XSS as a front-end problem, but backends create most stored and reflected XSS. They decide what a JSON API returns and with which `Content-Type`, render error pages that echo input, generate emails and PDFs from HTML templates, and serve uploaded files, Unit XII. A JSON response served as `text/html` can be rendered as a page if someone links to it directly, so Wren's APIs always send `Content-Type: application/json` with `X-Content-Type-Options: nosniff`.

## 13. Context-aware output encoding and sanitization

HTML, unlike SQL, has no parameter channel. A page is one string, and the browser parses it. So the defence is **output encoding**, converting untrusted text into a form that the browser's parser will treat as text in the exact place it appears. In ordinary HTML content, five characters matter: `&` becomes `&amp;`, `<` becomes `&lt;`, `>` becomes `&gt;`, `"` becomes `&quot;` and `'` becomes `&#x27;`. The review `<script>` then displays as the literal characters on screen and runs nothing.

The catch is the word *context*. A page contains several languages nested in each other, and each needs different encoding. Inside an HTML element, HTML entity encoding works. Inside a quoted attribute value, the same encoding works if the attribute is always quoted. Inside a `<script>` block or an event handler such as `onclick`, the text is JavaScript and needs JavaScript string escaping, `\x3c` for `<` and so on, and HTML encoding is useless because the browser decodes entities before running the handler. Inside a URL in `href` or `src`, the value needs URL encoding and a check of the scheme, because `javascript:` URLs run code when clicked and no amount of encoding changes that. Inside CSS, the safest rule is never to put untrusted values there at all.

@fig be_sec_contexts | The same review text needs different treatment in HTML, an attribute, a script and a URL.

Doing this by hand is how XSS happens, so Wren never does. Modern template engines and front-end frameworks **autoescape** by default. Jinja2 with autoescaping, Rails ERB, Go's `html/template`, which even detects the context, and React's JSX all encode values inserted into HTML. The bugs live in the escape hatches: `|safe` and `Markup()` in Jinja2, `html_safe` and `raw` in Rails, `dangerouslySetInnerHTML` in React, `v-html` in Vue, and `innerHTML` in plain JavaScript. Wren's static analysis flags every use, and each needs a reviewer to confirm the value is safe.

Some features need users to write real HTML, such as a restaurant's formatted description with bold text and lists. Encoding would show the tags as text. Here the tool is **sanitization**, parsing the HTML and keeping only an allowlist of harmless elements and attributes, `<b>`, `<i>`, `<ul>`, `<li>`, `<a href>` with `https:` only, and dropping everything else. Wren uses a maintained library, DOMPurify in the browser and an equivalent such as `nh3` on the server, because writing an HTML sanitizer correctly means matching every quirk of browser parsing, which regular expressions cannot do. Wren sanitizes on output, at render time, so that a library fix applies to old content too. Markdown is not a sanitizer, since most Markdown renderers pass raw HTML through unless told not to.

## 14. Content Security Policy and Trusted Types

Encoding is the fix. **Content Security Policy**, CSP, is the seatbelt for when encoding fails somewhere. It is a response header that tells the browser which scripts the page is allowed to run, so that an injected script is refused even though it reached the page. The policy most teams should use is a **strict CSP** based on nonces: `Content-Security-Policy: script-src 'nonce-R4nd0mV4lu3' 'strict-dynamic'; object-src 'none'; base-uri 'none'`. The server generates a fresh random nonce for every response, 128 bits from a cryptographic random generator, Part IX, and puts it on each `<script nonce="…">` tag it writes itself. The browser runs only scripts carrying that nonce. An attacker who injects `<script>` into a review cannot know the nonce for this response, so the injected script does not run.

@fig be_sec_csp | Scripts carrying this response's nonce run. An injected script without it is blocked and reported.

The other parts of the policy close side doors. `'strict-dynamic'` lets a trusted script load further scripts, which keeps bundlers and tag managers working without listing every host. `object-src 'none'` blocks plugins. `base-uri 'none'` stops an injected `<base>` tag from redirecting relative script URLs. Inline event handlers like `onclick="…"` and `javascript:` URLs are blocked because they cannot carry a nonce, which is a reason to keep them out of the codebase. Older policies that allowlist domains, `script-src 'self' cdn.example.com`, are weaker than they look, since any allowlisted domain hosting a JSONP endpoint or an old library can be used to run code, and Google's research found most such policies bypassable.

Rolling out CSP safely uses **report-only mode**. Wren first sends `Content-Security-Policy-Report-Only` with a `report-to` endpoint, which makes the browser report violations without blocking anything. A week of reports shows which legitimate scripts lack nonces. Once the reports contain only real attacks and noise from browser extensions, the header switches to enforcing. The reports stay on afterwards as a detection system, since a sudden burst of violations on one page usually means someone found an injection point.

**Trusted Types** go further against DOM XSS. With the CSP directive `require-trusted-types-for 'script'`, the browser refuses to pass plain strings to dangerous sinks such as `innerHTML` and `eval`. Code must pass a typed object created by a named policy, which is where sanitization happens, so every place HTML enters the DOM goes through a small, reviewable set of functions. Google reports that Trusted Types nearly eliminated DOM XSS in the applications that adopted them. Neither CSP nor Trusted Types replaces encoding, and Wren treats a CSP report as a bug to fix, not as proof that the defence worked.

:::story Picture this
A theatre where actors read lines from cards that audience members pass up. A careful stage manager reads each card first and, whatever it says, has the actor read it aloud in quotation marks as "a member of the audience wrote …", never as a stage direction. That is encoding. CSP is the rule that only actors wearing tonight's badge may walk on stage at all, so even a card that slips through unread cannot bring a stranger on.
:::

:::note XSS in API-only backends
An API that only returns JSON can still cause XSS. Its data is rendered by a front end, its error messages may echo input into HTML error pages, its admin tools render stored values, and its emails are HTML. Encoding is the job of whatever turns data into HTML, so Wren's API stores reviews as written and every renderer encodes them.
:::

:::warn Watch out
Do not "clean" input on the way in by stripping `<` and `>`, and then trust it everywhere. The same value may later go into an attribute, a script or a URL where those characters do not matter and others do. Encode on output for the context, and sanitize rich HTML with a maintained library at render time.
:::

:::interview Interview lens
**"How do you prevent XSS?"** Encode untrusted data on output for the exact context it lands in, which in practice means using a template engine or framework that autoescapes and treating every escape hatch such as `dangerouslySetInnerHTML` as a reviewed exception. Sanitize user HTML with an allowlist library like DOMPurify. Serve APIs with correct content types and nosniff. Add a strict nonce-based CSP, rolled out in report-only mode, and Trusted Types for DOM XSS, and keep session cookies HttpOnly so a successful script cannot steal them.
:::

:::key In one breath
XSS lets untrusted text run as script on your own origin, stored in the database, reflected from a request, or written into the DOM by front-end code. HTML has no parameter channel, so encode on output for the context, HTML entities in content and attributes, JavaScript escaping in scripts, scheme checks in URLs, using autoescaping templates and reviewing every escape hatch. Rich HTML needs an allowlist sanitizer at render time. A strict CSP with a fresh 128-bit nonce per response blocks injected scripts, rolled out in report-only mode first, and Trusted Types lock down DOM sinks.
:::
