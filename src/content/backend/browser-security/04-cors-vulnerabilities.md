@part IV | CORS vulnerabilities | We study how CORS configurations go wrong and what an attacker gains from each mistake. A misconfigured credentialed CORS policy lets any website read a logged-in user's private data, silently and at scale. We will look at arbitrary reflection, weak origin matching, over-trusted subdomains and the null origin, and then at what CORS was never meant to protect. | where:4

## 11. Arbitrary origin reflection

The most common CORS hole takes three lines of code. A developer needs the app, a staging app and a partner to work. Each new origin produces a ticket, so to stop the tickets the server copies whatever Origin arrives into Access-Control-Allow-Origin and adds Allow-Credentials true. Every origin on the internet is now trusted with credentials, including `https://evil.example`. Security scanners find this pattern constantly, and bug bounty programmes pay for it regularly, because it is easy to exploit and the impact is a full read of every logged-in user's data.

The attack needs no exploit code beyond a few lines of JavaScript. User 42, logged in to Wren, visits the attacker's page. Its script runs `fetch("https://api.wren.example/me", {credentials: "include"})`. The browser attaches user 42's session cookie, since cookies go with requests to their own site. Wren's API returns user 42's email and saved address, with `ACAO: https://evil.example` and `ACAC: true` copied from the request. The browser compares the origins, finds a match, and hands the body to the attacker's script. The script posts it to the attacker's server. Every logged-in Wren user who visits that page leaks their profile, and a page that also calls `/orders` and `/payment-methods` leaks those too.

@fig be_cors_reflect_attack | The server mirrors Origin, so the browser's check always passes. The attacker reads exactly what the victim could.

Two conditions make it work. The response must carry credentials, and the browser must send the cookie on that request. SameSite=Lax cookies are not sent on cross-site fetches, so Lax limits this attack against browsers that enforce it, which is one reason Lax became the default. But cookies set with `SameSite=None`, older browsers, and attackers on a sibling subdomain all bring the hole back, so the server-side fix is still required.

:::story Picture this
A receptionist told to "let in anyone on the guest list", who saves time by adding each visitor's name to the list as they walk up. The check still happens on every visit. It just always passes.
:::

## 12. Weak origin matching

Developers who avoid full reflection often write a check that looks strict and is not. `origin.endswith("wren.example")` accepts `https://evilwren.example`, a domain anyone can register for a few dollars. `origin.startswith("https://app.wren.example")` accepts `https://app.wren.example.evil.com`, which is a subdomain of `evil.com`. The regular expression `https://app.wren.example` without escaped dots and anchors accepts `https://appXwren.example`, because an unescaped dot matches any character. And `"wren" in origin` accepts `https://wren-free-meals.example`. Each of these passes a code review and fails against an attacker who reads the code, or who simply tries the obvious variants with a script.

@fig be_cors_regex | Three plausible checks that accept attacker domains, and one that does not.

Parsing differences widen the gap. Origins with upper-case letters, trailing dots, unusual ports or internationalised domain names may normalise differently in your validator than in the browser. Some frameworks also offer CORS settings that accept wildcards like `https://*.wren.example` and implement them with exactly the suffix bug above. Read how your framework matches before trusting a pattern.

The safe rule is short. Compare the full, normalised origin string for equality against a fixed set of literals. If you genuinely need a pattern, for example per-customer subdomains, parse the origin with a URL parser, check that the scheme is https, then check the host against an exact list loaded from the database of real customers, never against a string suffix.

:::warn Watch out
Do not test a CORS fix only with the origins that should pass. Write down attacker inputs as well: a suffix match, a prefix match, an unescaped dot, `null`, http instead of https, and a different port. Confirm the server sends no ACAO for any of them, and keep those cases as tests.
:::

## 13. Trusting subdomains, compromised origins and null

A policy that allows any `*.wren.example` origin sounds safe because Wren owns the whole domain. In practice it trusts the weakest page on any subdomain. Suppose the old `blog.wren.example`, run by the marketing team on a hosted CMS, has a cross-site scripting bug in a plugin. An attacker who gets a script to run on that blog now runs on a trusted origin, and that script can read Wren's API responses as any logged-in user who visits the blog. Fixing the API's CORS settings alone does not remove the risk. The blog's security has become part of the API's security.

**Dangling DNS records** make this worse. Marketing creates `promo.wren.example` as a CNAME to a cloud storage bucket for a campaign. The campaign ends, the bucket is deleted, and nobody removes the CNAME. An attacker creates a bucket with the same name in their own cloud account, and now `promo.wren.example` serves whatever they upload. That takeover hands them a whole trusted origin with no bug in Wren's code at all. Subdomain takeovers like this are among the most commonly reported web vulnerabilities.

@fig be_cors_subdomain | Trusting the parent domain means trusting the weakest subdomain under it.

The same logic applies to partners. Allowing `https://partner.example` with credentials means any XSS on the partner's site becomes a read of Wren users' data, and Wren has no control over the partner's security. Allow credentials only for origins you control and audit. Give partners a separate API that is either public and uncredentialed or authenticated with their own tokens. And never trust `null`, which Section 10 showed any page can produce with a sandboxed iframe.

## 14. What CORS does not protect

Three things are outside CORS, and confusing them with what it does protect causes real incidents. First, CORS is not authentication. A request from curl, a server-side script or a mobile app ignores CORS headers completely, because there is no browser to enforce them. An endpoint that returns user data must check the session or token on every request, whatever the Origin says. Some teams lock an internal admin API down with a strict CORS policy and no authentication, on the theory that only their admin app can reach it. Any developer laptop with curl proves the theory wrong.

Second, CORS is not CSRF protection. A cross-site form POST is a simple request, so the browser sends it with cookies and the server executes it. CORS only hides the response from the attacking page, and the attacker did not need the response. They only wanted the email address changed. Third, CORS does not hide that a request happened, or how long it took. Timing and error side channels can still leak a bit or two of information to a cross-site page.

@fig be_cors_not_auth | CORS hides responses from scripts in browsers. It neither authenticates callers nor stops writes.

A useful mental model is that CORS is a lock on the reading room, not on the front door. The front door is authentication, which every request must pass. The post slot, where anyone can drop in a request that gets executed, is the CSRF problem, and Part VII deals with it.

:::interview Interview lens
**"Why isn't CORS a CSRF defence?"** CSRF needs the browser to send a state-changing request with the victim's cookies, and the attacker does not care about the response. Simple requests such as form POSTs are sent without any preflight, so the server executes them whatever its CORS policy says. CORS only decides whether a script may read the response afterwards. CSRF needs SameSite cookies, Origin checks or anti-forgery tokens.
:::

:::key In one breath
Reflecting any Origin with credentials lets every website read a logged-in user's data through the user's own browser. Suffix, prefix and unanchored regex checks accept attacker domains, so match full origins exactly against a fixed list. Trusting all subdomains or a partner with credentials inherits their XSS bugs and dangling DNS records, and null can be produced on purpose. CORS is neither authentication nor CSRF protection, since it only controls whether browser scripts can read responses.
:::
