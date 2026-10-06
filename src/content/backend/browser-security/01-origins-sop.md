@part I | Origins and the same-origin policy | We define an origin and a site exactly, then learn what the browser's same-origin policy blocks and what it lets through. Every CORS rule and every cookie rule in this unit compares origins or sites, so a fuzzy definition here produces wrong answers later. We will cover the three parts of an origin, reads versus writes versus embeds, and the request headers that tell a server where a request came from. | where:1

## 1. What an origin is

User 42 has two tabs open. One shows their Wren orders at `https://app.wren.example`. The other shows a page at `https://evil.example` that they reached from a link promising a free meal. Both tabs run JavaScript in the same browser, and that browser holds Wren's session cookie. If the script in the second tab could read the first tab's page, or read Wren's API responses using that cookie, every website you visit could read your email, your bank balance and your orders. Browsers prevent this by tagging every document, script and request with an origin and comparing origins before they share anything.

An **origin** is the triple of scheme, host and port. The URL `https://app.wren.example/orders/123?tab=items` has origin `https://app.wren.example:443`. The port is implied, 443 for https and 80 for http, so browsers usually leave it out when they print an origin. The path and the query are not part of it, which means every page on that host shares one origin. Change any of the three parts and you get a different origin. `http://app.wren.example` differs in scheme, `https://api.wren.example` in host, and `https://app.wren.example:8443` in port.

The comparison is exact string matching on those three parts, with no notion of "close enough". `app.wren.example` and `api.wren.example` belong to the same company, run on the same servers and may even share code, and they are still different origins. That surprises people the first time their app cannot read their own API.

@fig be_origin_parts | Scheme, host and port. Two URLs are same-origin only if all three match exactly.

A coarser idea, the **site**, matters for cookies. A site is the scheme plus the registrable domain, the label just below a public suffix such as `.com`, `.co.uk` or `.example`. The browser learns which suffixes are public from the Public Suffix List, a file maintained by Mozilla that also lists services such as `github.io` where each subdomain belongs to a different person. `app.wren.example`, `api.wren.example`, `blog.wren.example` and `wren.example` are four different origins but one site. That difference is why SameSite cookies, in Part VI, treat a sibling subdomain as family, with consequences for security.

@fig be_origin_table | Six URLs compared with app.wren.example. Same site is a much weaker relationship than same origin.

## 2. The same-origin policy

The **same-origin policy** (SOP) is the browser rule that a script may read data only from its own origin. It is not one rule but a family of rules, added over 30 years, and it splits along three kinds of interaction.

**Cross-origin writes** are allowed. A page on `evil.example` can submit a form to `api.wren.example`, follow a link to it, or send it a POST with `fetch`, and the browser sends the request. **Cross-origin embeds** are allowed too. A page can show an image from another origin, run a script from a CDN, load a stylesheet or a font, or frame another site in an iframe unless that site forbids it. **Cross-origin reads** are blocked. A script can call `fetch("https://api.wren.example/me")`, but it cannot see the response body, most of the headers, or the contents of a cross-origin iframe. When the browser blocks a read, the request has often already reached the server and run there. The SOP only controls what comes back to the script.

@fig be_sop_rules | Requests leave freely. What the SOP withholds is the response.

This asymmetry has two consequences you need to carry into the rest of the unit. First, the SOP does not stop requests from reaching your server, so it is no defence against forged writes. Part VII deals with that, under the name CSRF. Second, embeds leak a little. A page cannot read an embedded image's pixels, but it can see whether the image loaded and how large it is, which is enough to learn "this user is logged in to Wren" if a logged-in-only image loads. A `<script>` tag from another origin runs with the embedding page's full privileges, which is why the old JSONP technique, serving data as executable script, exposed data to any site that embedded it.

The policy dates from Netscape Navigator 2.0 in 1995, when JavaScript first appeared. It has been patched and extended ever since rather than redesigned, which explains its odd corners.

:::story Picture this
An office building with a shared mailroom. Anyone may drop a letter in any company's tray, which is a write. Anyone may hang a poster borrowed from another company in their own office, which is an embed. But nobody may open another company's filing cabinet and read its letters, which is a read. The mailroom clerk, the browser, enforces this for every tenant, and the clerk never checks what the letters say.
:::

## 3. Origin, Referer and Sec-Fetch headers

Since requests cross origins freely, the server needs to know where each one came from. Browsers attach three kinds of label, and scripts on the page cannot change them. **Origin** carries the scheme, host and port of the context that started the request. Browsers send it on CORS requests and on every POST, PUT, PATCH and DELETE, and on cross-origin GETs made by `fetch`. Its value can be `null` in some odd contexts, which Part III explains.

**Referer** carries the URL of the page that led to the request. How much of it is sent depends on the page's Referrer-Policy. The default since 2020, `strict-origin-when-cross-origin`, sends the full URL to the same origin, only the origin to other sites, and nothing when moving from HTTPS to HTTP. Privacy extensions and some corporate proxies strip it, so a server cannot rely on it always being there.

The newer **Fetch Metadata** headers describe the request's context directly. `Sec-Fetch-Site` says how the requesting page relates to the target. Its value is `same-origin`, `same-site`, `cross-site`, or `none` when the user typed the URL or used a bookmark. `Sec-Fetch-Mode` says whether the request is a page navigation, a CORS fetch, or a no-cors fetch such as an image. `Sec-Fetch-Dest` says what will consume the response, such as a document, an image, a script or an empty destination for `fetch`. Every browser engine now sends them.

@fig be_fetch_headers | A forged POST arriving from evil.example. The browser labels it honestly in Origin and Sec-Fetch-Site.

Scripts cannot forge these labels because the Fetch standard lists them as forbidden headers. Any header beginning with `Sec-` is reserved for the browser, and `fetch` silently drops attempts to set Origin or Referer. That is what makes them useful for defending against other websites.

:::warn Watch out
These headers prove origin only for requests that come from browsers. curl, a Python script or an attacker's server can send any Origin or Sec-Fetch-Site value they like. Use them to protect logged-in browser users from other websites, never as authentication for API clients.
:::

:::interview Interview lens
**"Does the same-origin policy stop a malicious site from sending requests to my API?"** No. The SOP stops a script from reading cross-origin responses, but it lets cross-origin form posts, images and simple fetches go out. If the user's browser holds a cookie for your API, it attaches the cookie to those requests too. Stopping forged writes needs CSRF defences, such as SameSite cookies, Origin checks or tokens.
:::

:::key In one breath
An origin is scheme, host and port, and a site is scheme plus registrable domain, so `api.wren.example` and `app.wren.example` are different origins but the same site. The same-origin policy lets pages send writes and embed resources across origins, but blocks scripts from reading cross-origin responses. Browsers label every request with Origin, Referer and Sec-Fetch headers that page scripts cannot forge. Those labels protect browser users from other sites and prove nothing about non-browser clients.
:::
