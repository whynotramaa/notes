@part V | Cookies | We learn how a cookie is set, where the browser sends it, how long it lives and which flags protect it. A session cookie is the key to a logged-in account, so its scope and flags decide who can steal it, plant it or use it. We will cover Set-Cookie and Cookie, Domain and Path scope, lifetimes, and the Secure, HttpOnly and prefix rules. | where:5

## 15. Set-Cookie and the Cookie header

HTTP has no memory between requests, yet user 42 stays logged in to Wren for half an hour without retyping a password. Something has to carry "this is user 42" on every request, and in browsers that something is usually a cookie. A **cookie** is a small name and value that the server asks the browser to store and send back. Lou Montulli invented them at Netscape in 1994 to remember the contents of shopping baskets.

The server stores a cookie with a **Set-Cookie** response header, such as `Set-Cookie: __Host-sid=8f2c...; Secure; HttpOnly; SameSite=Lax; Path=/; Max-Age=1800`. Everything after the first semicolon is an attribute that tells the browser how to treat the cookie. From then on the browser adds a **Cookie** request header to every request that matches the cookie's scope, as in `Cookie: __Host-sid=8f2c...`. Only the name and value travel back. The attributes stay in the browser, so the server cannot tell from an incoming cookie whether it was Secure or when it expires. It has to track that itself.

@fig be_cookie_flow | Set once, sent automatically on every matching request. The attributes govern the browser, not the server.

The automatic sending is both the reason cookies are convenient and the reason they are dangerous. It keeps the user logged in without a line of front-end code. It also means a request started by another site, a form on `evil.example`, carries the user's identity too, which is the root of CSRF. Every protection in the rest of this part and the next limits when that automatic sending happens.

Browsers limit each cookie to about 4,096 bytes and each domain to a few hundred cookies. Every cookie in scope goes on every request, including image and script requests, so large cookies cost bandwidth on every call. Store an opaque random session id in the cookie and keep the user's data on the server.

:::story Picture this
A cloakroom ticket. The attendant hands you a numbered stub and keeps your coat. You show the stub each time, and it carries no description of the coat, just a number the attendant looks up. Anyone who picks up your stub gets your coat, which is why the rest of this part is about who can see, copy or swap that stub.
:::

## 16. Domain and Path scope

Two attributes decide which requests carry a cookie. Without a **Domain** attribute, the cookie is **host-only**. It goes back only to the exact host that set it, so a cookie set by `api.wren.example` goes only to `api.wren.example`. With `Domain=wren.example` the cookie goes to `wren.example` and to every subdomain under it: `app`, `api`, `admin`, the old `blog`, and any subdomain created in the future. A server can only set Domain to its own domain or a parent of it, and browsers refuse public suffixes such as `.com` or `github.io`, using the same Public Suffix List as for sites.

@fig be_cookie_scope | Host-only cookies stay on one host. A Domain attribute spreads them to every sibling.

The counter-intuitive rule is that adding a Domain attribute widens scope. Many developers think `Domain=api.wren.example` restricts the cookie to the API. It actually means the API plus any subdomain of the API, so the restrictive choice is to leave Domain out.

**Path** limits a cookie to URLs under a prefix, such as `Path=/orders`. It is a way to keep unrelated cookies off unrelated requests, not a security boundary. A page at `/blog` on the same origin can open `/orders` in a hidden iframe and read that frame's cookies through script, because both pages share an origin and the SOP allows it. Scope a session cookie as narrowly as the hosts allow, which in practice means host-only with `Path=/`.

:::warn Watch out
Setting `Domain=wren.example` on the session cookie so that `app` and `api` can share it also sends it to `blog.wren.example`, `promo.wren.example` and every future subdomain. One compromised marketing page then sees every user's session. Prefer a host-only cookie on the API, or serve the app and API from one host.
:::

## 17. Expires, Max-Age and lifetime

A cookie with neither **Expires** nor **Max-Age** is a **session cookie**. It is supposed to last until the browser session ends. In practice many browsers restore sessions on restart, and a "session" cookie on a laptop that is never fully closed can live for weeks. A **persistent cookie** has an explicit lifetime. `Expires` gives an absolute date such as `Wed, 07 Oct 2026 10:30:00 GMT`. `Max-Age` gives a number of seconds from now. If both are present, Max-Age wins. Max-Age is the safer choice because it does not depend on the user's clock being correct.

Wren's session cookie uses `Max-Age=1800`, 30 minutes. Logging out sends the same cookie name with `Max-Age=0`, which tells the browser to delete it now. The deletion only works if the name, Domain and Path match the original, so a cookie set with `Path=/` and deleted with `Path=/account` survives, which is a common logout bug.

@fig be_cookie_lifetime | A session cookie ends with the browser session; a persistent one ends at its Max-Age.

The browser's idea of a cookie's lifetime is not the server's idea of a session's lifetime. A cookie copied by an attacker carries no expiry at all, because attributes never travel with it. It keeps working until the server says otherwise. So the server must store and enforce its own expiry for every session, and Unit III builds sliding and absolute expiry on top of that.

## 18. Secure, HttpOnly and cookie prefixes

The **Secure** attribute tells the browser to send the cookie only over HTTPS. Without it, a single plain `http://` request to the domain leaks the session id in clear text, and an attacker on the network can trigger such a request just by injecting `<img src="http://api.wren.example/x">` into any plain HTTP page the victim loads. HSTS from Unit I makes that harder, and Secure makes it impossible.

The **HttpOnly** attribute hides the cookie from JavaScript, so `document.cookie` does not show it. Suppose an attacker finds a cross-site scripting bug and runs script on `app.wren.example`. Without HttpOnly, the script reads the session id and sends it to the attacker, who can then use it from their own machine for as long as the session lives. With HttpOnly the script can still make requests that carry the cookie while the victim's tab is open, which is bad, but it cannot take the session away with it. That shrinks the damage from "account stolen for hours" to "actions taken while the page was open".

@fig be_cookie_flags | Secure guards the network path. HttpOnly guards against reading by injected scripts.

**Cookie prefixes** turn good practice into rules the browser enforces. A cookie whose name starts with `__Secure-` is accepted only if it has the Secure attribute and was set over HTTPS. A cookie whose name starts with `__Host-` must also have `Path=/` and no Domain attribute, which makes it host-only. The point is protection against **cookie tossing**, where a compromised sibling such as `blog.wren.example` sets a cookie for `wren.example` with the same name as the API's session cookie, overwriting or shadowing it. The browser refuses to let any other host set a `__Host-` cookie for the API, so Wren names its session cookie `__Host-sid`.

@fig be_cookie_prefix | The prefix is part of the name, and the browser checks the attributes before storing it.

:::interview Interview lens
**"What attributes would you put on a session cookie and why?"** Secure, so it never travels over plain HTTP. HttpOnly, so injected scripts cannot read the id. SameSite=Lax or Strict, so most cross-site requests do not carry it. No Domain attribute and the `__Host-` prefix, so only the API host receives it and siblings cannot overwrite it. Path=/, a server-enforced expiry, and a value that is an opaque random id of at least 128 bits.
:::

:::key In one breath
A server sets a cookie with Set-Cookie, and the browser sends only name=value back in the Cookie header on every request in scope, which is both the convenience and the risk. Host-only cookies go to one host, while a Domain attribute spreads them to every subdomain, and Path is not a security boundary. Max-Age or Expires make a cookie persistent, but the server must enforce its own session expiry. Secure keeps the cookie off plain HTTP, HttpOnly hides it from scripts, and the `__Host-` prefix forces Secure, Path=/ and no Domain.
:::
