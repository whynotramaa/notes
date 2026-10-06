@part VI | SameSite and third-party cookies | We learn how the browser decides whether a cross-site request carries a cookie. SameSite is the setting that quietly blocks most CSRF and most cross-site tracking, but it has gaps that attackers know well. We will separate first-party from third-party cookies, compare Strict, Lax and None, and list the cases Lax does not cover. | where:6

## 19. First-party and third-party cookies

Whether a cookie counts as first-party or third-party depends on where it is being sent, not on who set it. A cookie is **first-party** when it goes to the site shown in the address bar. It is **third-party** when it goes to a different site, typically because the page embeds something from that site: an ad iframe, a social "like" button, an analytics script or a one-pixel tracking image. The same cookie can be first-party on one request and third-party on the next.

Tracking works through third-party cookies. Suppose `tracker.example` is embedded on both `news.example` and `shop.example`. When you read the news, the tracker's embed sets a cookie with a random id. When you later visit the shop, the shop's page loads the tracker's embed again, and the browser sends the same cookie along. The tracker now knows that the person who read that article also looked at those shoes, and with enough embeds it builds a profile of your browsing across thousands of sites.

@fig be_cookie_third_party | The same embedded cookie on two sites links one person's browsing.

Browsers responded. Safari has blocked third-party cookies by default since 2020, and Firefox partitions them so that the tracker gets a separate cookie jar for each top-level site. Chrome announced their removal in 2020, delayed it several times, and in 2024 and 2025 dropped the plan in favour of user controls. For a backend engineer the lesson is practical rather than political. Never design a login or checkout that depends on a third-party cookie, such as an identity iframe embedded in a partner's page, because a large share of users will not send it.

:::story Picture this
A shopping mall where every shop stamps your hand when you enter. A first-party stamp is that shop's own ink, checked when you come back to the same shop. A third-party stamp is one advertising company's invisible ink used by every shop, and anyone with a UV lamp can see you visited all of them.
:::

## 20. SameSite: Strict, Lax and None

The **SameSite** attribute tells the browser whether to send a cookie on cross-site requests. It has three values. With **Strict**, the cookie goes only on same-site requests. Even clicking a link to Wren from an email or a search result arrives without the cookie, so the user looks logged out on the first page and then logged in after the next click, which confuses people. With **Lax**, the cookie also goes on cross-site top-level navigations that use safe methods, meaning link clicks, typed URLs and GET redirects. It is not sent on cross-site POST forms, iframes, images, scripts or fetches. With **None**, the cookie goes on every request, cross-site or not, and browsers require the Secure attribute alongside it.

@fig be_samesite_matrix | Strict sends only same-site, Lax adds link clicks, None sends everything.

Since 2020 Chromium has treated a cookie with no SameSite attribute as Lax, and other browsers followed with their own versions of the default. That single change blocked the classic CSRF attack, a hidden form that POSTs to the target, across most of the web, without any site changing its code. It also broke a fair number of single sign-on and payment flows that relied on cookies arriving with cross-site POSTs, which had to be updated to `SameSite=None; Secure`.

Wren uses two values for two jobs. The session cookie is `SameSite=Lax`, so a user following a link from an email arrives logged in. The CSRF token cookie from Part VII is `SameSite=Strict`, because it never needs to travel with a cross-site request.

:::note Site, not origin
SameSite compares sites, meaning scheme plus registrable domain, not origins. A request from `blog.wren.example` to `api.wren.example` is same-site, so even a Strict cookie goes with it. SameSite offers no protection against an attacker who controls a sibling subdomain.
:::

## 21. Where Lax still leaks

Lax blocks forged cross-site POSTs, but four gaps remain, and each has caused real attacks. First, a GET that changes state still works. If Wren had `GET /orders/7/cancel`, the attacker's page could redirect the browser there with `window.location`, and since that is a top-level GET navigation, the Lax session cookie goes along and the order is cancelled. Section 5's rule about keeping GET safe is also a security rule.

Second, sibling subdomains are same-site, as the note above says. An attacker with script running on `blog.wren.example` can send any request to the API with cookies attached, and SameSite does not even notice. Third, browser support is not universal. Old browsers ignore SameSite entirely, and some embedded web views behave differently from the browser on the same device. Fourth, Chrome shipped a compatibility exception called "Lax plus POST", which let a cookie set within the last two minutes, and having no explicit SameSite, travel on a cross-site top-level POST. It existed to keep single sign-on flows working, and it gave attackers a two-minute window right after login.

@fig be_samesite_gaps | Three gaps that survive SameSite=Lax. Each needs a defence from Part VII.

The conclusion is that SameSite is a strong default layer, not a complete CSRF defence. Keep GET requests free of side effects, treat each subdomain as a separate trust zone with host-only cookies, and add an Origin check or a token on every state-changing request.

:::warn Watch out
Setting `SameSite=None` to make an embedded widget or a cross-site checkout work re-enables classic CSRF for that cookie. If you must use None, every state-changing endpoint that accepts the cookie needs an explicit CSRF token or Origin check, and the cookie should be scoped to a host that does nothing else.
:::

:::interview Interview lens
**"Does SameSite=Lax fully protect against CSRF?"** It blocks the most common form, a cross-site POST, but not all of them. A state-changing GET still runs through a top-level navigation, a compromised sibling subdomain counts as same-site and is not restricted at all, and older or non-conforming browsers ignore the attribute. Treat Lax as one layer, keep GET requests safe, and verify the Origin or a CSRF token on unsafe methods.
:::

:::key In one breath
First-party cookies go to the site in the address bar, and third-party cookies go to embeds, which Safari and Firefox block or partition by default. SameSite=Strict sends a cookie only on same-site requests, Lax adds cross-site top-level navigations with safe methods, and None sends it everywhere but requires Secure. Browsers default a missing value to Lax, which stopped most form-POST CSRF. Lax still leaks through state-changing GETs, same-site subdomains and old browsers, so it needs a second layer.
:::
