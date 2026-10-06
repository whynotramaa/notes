<section class="front">

<div class="part-kicker">Before we start</div>

# How to read this chapter

<p class="lede">Authentication answers one question, who is making this request, and then has to keep answering it on every request without asking for a password each time. This chapter covers both halves, proving identity once and carrying that proof safely afterwards.</p>

The parts follow a login's life. First comes the server-side session, the oldest and simplest design. Then the password behind it, the attacks on login forms, and the reset flow that is everyone's back door. Then tokens, JWT, refresh tokens and their failure modes, and finally OAuth and OpenID Connect, where a third party does the proving.

Each section works through one Wren example with numbers, then a figure. Read the text, then check the figure against it. *Picture this* gives an analogy, notes add detail, *Watch out* names a real mistake, and *Interview lens* gives an answer to say aloud. *In one breath* closes each part.

By the end you should be able to design Wren's login from scratch and defend each choice: how passwords are stored, how long a session lives, what is in a token, how it is revoked, and why the OAuth callback checks `state`.

</section>

<section class="front">

<div class="part-kicker">The running system</div>

# Meet Wren

**Wren** is the illustrative food-ordering service from earlier units. These are its authentication settings. All values are assumptions chosen for readable arithmetic.

| Setting | Value | What it controls |
|---|---|---|
| Accounts | 1,000,000 | Size of the user table |
| Active sessions | 200,000 | Session store size |
| Session record | about 200 bytes | 40,000,000 bytes in Redis |
| Idle and absolute session limits | 30 min, 12 h | How long a login lasts |
| Password hash | Argon2id, m = 19 MiB, t = 2, p = 1 | Cost of each guess |
| Peak logins | 20 per second | CPU spent on hashing |
| Login limit | 5 failures per account per minute | Brute-force defence |
| Access token | JWT, RS256, 15 min | Proof sent on each API call |
| Refresh token | opaque, 30 days, rotated | Renews access tokens |
| Reset token | 32 random bytes, 30 min, single use | Account recovery |
| Identity provider | Google, via OpenID Connect | "Sign in with Google" |

The user is still user 42. In this unit they log in with a password, then later with Google, and an attacker tries to get into their account every way the chapter describes.

</section>
