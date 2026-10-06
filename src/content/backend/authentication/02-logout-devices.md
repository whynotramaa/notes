@part II | Logout, devices and revocation | We learn how to end sessions on purpose, one at a time or all at once. A user who changes a password after a breach expects every other login to die immediately, and that only works if the design planned for it. We will cover logout, revoking all sessions, device lists and limits on concurrent sessions. | where:2

## 6. Logout and revoke all sessions

Logout has two halves, and people often implement only the visible one. The client half clears the cookie, by sending the same cookie name with `Max-Age=0` and matching Path and Domain. The server half deletes the session record from the store. If only the cookie is cleared, anyone who copied the id earlier keeps using it until it expires, because the server still considers it valid. Security testers check this routinely. They copy a cookie, press logout in the browser, and replay the old cookie with curl. On a surprising number of sites it still works.

"Log out of all devices" needs a way to find or invalidate every session belonging to a user. There are two common designs. The first keeps a per-user index, such as a Redis set `user:42:sessions` holding the hash of each of the user's sessions. Logging out everywhere deletes every key listed in the set and then the set itself. It is precise and makes the device list in Section 7 easy, but every login and logout must keep the index in step.

The second keeps a `session_version` counter on the user row. Each session records the version that was current when it was created. To log out everywhere, the server increments the counter from 7 to 8 in one write. Every older session fails its next lookup, because its stored 7 no longer matches the user's 8. It needs no index, but each lookup must read the user's current version, which is usually cached alongside the user record anyway.

@fig be_auth_logout | Delete one record to log out one device. Bump a version to invalidate all of them at once.

Wren triggers revoke-all on password change, on password reset, when a user reports a lost phone, and when its fraud system flags an account. The session making the change is usually kept, rotated to a fresh id, so the user is not thrown out of the page they are using.

:::story Picture this
A building that issues key cards. When one card is lost, the guard deactivates that card's number. When someone leaves the company, the guard changes the "valid generation" setting on every door from 7 to 8, and every card printed under generation 7 stops working at once, without the guard having to find any of them.
:::

## 7. Device sessions and concurrent sessions

If each session records a device label, a coarse location and a last-seen time, then a **device list** is just the user's sessions shown in a settings page. Wren fills the label from the user agent at login, as in "iPhone, Wren 5.2" or "Chrome on Windows", and the location from an IP geolocation lookup at city level. Each row has a "revoke" button that deletes that one session. The current session is marked "this device" so the user does not log themselves out by accident. The page also helps users notice intrusions, because a login from a city they have never been to stands out.

@fig be_auth_devices | The device list is the user's sessions with human-readable labels.

Some products limit **concurrent sessions**. A streaming service may allow three screens, and a licensed enterprise tool may allow one login per seat. Wren could keep a per-user Redis sorted set of session ids, scored by creation time. When a fourth login arrives, the server removes the oldest entry with one range command, `ZPOPMIN`, and deletes that session's record. The device holding it is logged out on its next request.

The alternative, rejecting the new login while three sessions exist, sounds stricter but locks out a user whose old sessions sit on a lost phone or a borrowed computer. They cannot log in to revoke those sessions, because logging in is what is being refused. Evicting the oldest is the friendlier default, combined with a notification so the user knows something was logged out.

@fig be_auth_concurrent | A sorted set per user makes "evict the oldest" a single range delete.

:::warn Watch out
JWT-only designs make every feature in this part hard. A stateless access token cannot be logged out, listed as a device or evicted, because the server keeps no record of it. Teams discover this after launch and add a deny list, which turns the design back into a stateful one with extra parsing. Decide early whether you need these features.
:::

:::interview Interview lens
**"A user changes their password after a phishing attack. What should happen to their other sessions?"** All of them, except usually the one making the change, must be invalidated immediately, because the attacker may hold one. With server sessions that is a version bump or a per-user delete. With JWTs it means revoking all refresh tokens and either waiting out the short access tokens or checking a per-user "tokens issued before" time on every request. Also notify the user by email and revoke any API keys or OAuth grants created since the compromise.
:::

:::key In one breath
Logout must delete the server-side session, not just the cookie, or a copied id keeps working. Revoke-all uses either a per-user index of sessions or a session version counter that invalidates every older session with one write. A device list is the user's sessions with labels, each revocable on its own. Concurrent-session limits usually evict the oldest session, and stateless JWTs make every one of these features harder.
:::
