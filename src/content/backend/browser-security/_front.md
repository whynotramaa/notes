<section class="front">

<div class="part-kicker">Before we start</div>

# How to read this chapter

<p class="lede">A browser runs code from many sites at once, all sharing one user's cookies. This chapter explains the rules that stop those sites from reading or acting on each other, and the server headers that relax or tighten those rules.</p>

The order matters. We start with what an origin is, because every later rule compares origins or sites. CORS comes next, since it is the one controlled exception to the same-origin policy. Cookies follow, since they are what makes cross-site requests dangerous, and CSRF closes the unit as the attack that combines all of it.

Each section climbs the same ladder: a concrete case, the mechanism, a worked example on Wren's domains, then a figure. Read the paragraph, then check the figure against it. *Picture this* boxes give analogies, notes add detail, *Watch out* names real mistakes, and *Interview lens* gives a question with an answer you can say aloud. *In one breath* closes each part.

The goal is to be able to look at any CORS or cookie configuration and say, out loud and correctly, which sites can read what, which requests carry credentials, and which attack is still open.

</section>

<section class="front">

<div class="part-kicker">The running system</div>

# Meet Wren

**Wren** is the illustrative food-ordering service from Unit I. This unit adds its browser-facing domains. The numbers are assumptions for the arithmetic, not measurements.

| Setting | Value | What it controls |
|---|---|---|
| Web app | `https://app.wren.example` | Where users' pages run |
| API | `https://api.wren.example` | The origin the app calls |
| Admin console | `https://admin.wren.example` | A sibling subdomain |
| Old blog | `https://blog.wren.example` | A weak sibling, used in attacks |
| Partner widget | `https://partner.example` | A legitimate cross-site caller |
| Attacker | `https://evil.example` | The page trying to abuse a logged-in user |
| Session cookie | `__Host-sid`, 128 random bits | Identifies a logged-in browser |
| Idle session lifetime | 30 min (`Max-Age=1800`) | How long a cookie stays valid |
| Preflight cache | `Access-Control-Max-Age: 600` | Seconds a preflight answer is reused |

The victim throughout is user 42, logged in to `app.wren.example`, who opens a link to `evil.example` in another tab.

</section>
