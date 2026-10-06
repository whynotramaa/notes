@part III | Password storage | We learn how to store passwords so that a stolen database does not hand over the accounts. Databases leak through backups, SQL injection and insiders, and many users reuse passwords elsewhere. We will see why fast hashes fail, what salts and peppers add, and how bcrypt, scrypt and Argon2 make each guess expensive. | where:3

## 8. Why SHA-256 isn't a password hash

Assume Wren's users table leaks. That is the right assumption to design for, since breaches of exactly this kind happen to large companies every year, through backups, injection bugs and insiders. LinkedIn lost 6.5 million unsalted SHA-1 password hashes in 2012, and most were cracked within days. So the question is what the attacker can do with the table.

Suppose Wren stored `sha256(password)` for each user. The attacker cannot reverse SHA-256, but they do not need to. They guess. Take every password of eight lowercase letters and digits, which is $36^8 = 2{,}821{,}109{,}907{,}456$ candidates. Hash each one and compare. A single modern GPU computes on the order of $10^{10}$ SHA-256 hashes per second (an illustrative figure), so it covers the whole space in about 282 seconds. Every user with such a password is exposed in under five minutes, and real attackers do better by trying likely passwords first, from leaked lists and common patterns.

@fig be_pw_fast_hash | The same search at fast-hash and slow-hash speeds. The rates are illustrative, and the ratio is the point.

General-purpose hashes are designed to be fast, which is exactly wrong for this job. A **password hash**, also called a password-based key derivation function, is deliberately slow and has a tunable cost. At an illustrative $10^4$ bcrypt hashes per second, the same search takes $2.82 \times 10^{8}$ seconds, about 8.9 years. The user pays 250 ms once at login and never notices. The attacker pays it on every one of the trillions of guesses.

Unsalted fast hashes have a second flaw. An attacker can hash common passwords once in advance and store the results in a lookup table, or a compressed version called a **rainbow table**. A leaked table is then matched instantly, without any new hashing. Identical passwords also produce identical hashes, so cracking one cracks every user who shares it, and the most common hash in the table tells the attacker which password to crack first.

@fig be_pw_rainbow | One precomputed table cracks every unsalted hash of a common password at once.

:::story Picture this
A combination lock whose dial is stiff, so each try takes a full second to turn. You open it once a day and never notice the second. A thief trying every combination needs years. A fast hash is the same lock with a free-spinning dial, and the thief tries a billion combinations before lunch.
:::

## 9. Salt and pepper

A **salt** is a random value generated for each user, typically 16 bytes, and stored next to the hash in plain sight. The stored hash becomes $H(\text{salt} \,\|\, \text{password})$. Two users who both chose `hunter2` now have unrelated hashes, because their salts differ. A precomputed table is useless, since the attacker would need a separate table for every possible salt. Salts are not secret, and they do not need to be. Their job is uniqueness. They force the attacker to attack each user separately, which multiplies the work by the number of users, a factor of 1,000,000 for Wren.

@fig be_pw_salt | Same password, different salts, unrelated hashes. Precomputation stops working.

A **pepper** is a secret key applied to every password and kept outside the database, in a key management service or a hardware security module. A common construction is $\text{HMAC}(\text{pepper}, \text{argon2}(\text{password}, \text{salt}))$. An attacker who steals only a database dump, through SQL injection or a stolen backup, cannot test a single guess without the pepper, so the dump is useless on its own. It does nothing against an attacker who has fully compromised the application server, since the server must use the pepper to check logins.

The pepper's costs are operational. Rotating it requires re-hashing each password at the user's next login, since nobody knows the passwords to re-hash them in bulk, so the system must support two peppers during the change and record which one each hash used. Losing it locks every user out permanently. Many teams skip the pepper and rely on a strong password hash plus tight database access control, and that is a reasonable choice, but if you add one, keep it in a KMS, never in the same database or the same config file as the hashes.

@fig be_pw_pepper | The pepper lives where a SQL injection cannot reach. A dump alone cannot be cracked.

:::note Modern libraries generate the salt
bcrypt, scrypt and Argon2 libraries create a fresh random salt on every call and embed it in their output string. Do not add your own salt on top. And never use one salt for all users, which is just a pepper stored in the wrong place.
:::

## 10. bcrypt, scrypt and Argon2

Three algorithms dominate. **bcrypt** (Provos and Mazières, 1999) makes each guess cost CPU time. Its cost parameter sets the number of rounds of its expensive key setup to $2^{\text{cost}}$, so cost 12 means 4,096 rounds. It is battle-tested and available in every language. It has one sharp edge. It silently ignores input beyond 72 bytes, so two long passphrases that share their first 72 bytes hash identically, and systems that pre-hash to work around this must do it carefully.

**scrypt** (Percival, 2009) adds a large memory requirement. Attackers crack passwords on GPUs and custom chips that run thousands of small cores in parallel, each with little memory. A hash that needs many megabytes of fast memory per guess limits how many guesses run at once, which cuts the attacker's advantage far more than CPU cost alone. **Argon2** won the Password Hashing Competition in 2015. Its Argon2id variant has separate settings for memory, time (passes over memory) and parallelism (lanes), and it resists both GPU attacks and side-channel attacks. OWASP's current minimum recommendation is Argon2id with 19 MiB of memory, 2 passes and 1 lane, and it is Wren's choice.

@fig be_pw_kdfs | Each algorithm raises a different cost. Argon2id is the current default recommendation.

The **work factor** is the setting that makes hashing slow. For bcrypt, each step up in cost doubles the time, for the server and for the attacker alike. With illustrative timings, cost 10 takes 62.5 ms, cost 11 takes 125 ms, cost 12 takes 250 ms and cost 13 takes 500 ms. At Wren's peak of 20 logins per second and 250 ms per hash, hashing alone needs 20 × 0.25 = 5 CPU cores. During a promotion that triples logins, it needs 15. The right setting is the most expensive one your login traffic can afford. Too low helps attackers, too high lets a burst of login attempts exhaust your CPU, which an attacker can do on purpose.

@fig be_pw_work_factor | The cost doubles with each step. The right setting is a capacity decision, not a constant.

The stored string records everything needed to verify it: algorithm, version, parameters, salt and hash, as in `$argon2id$v=19$m=19456,t=2,p=1$<salt>$<hash>`. When Wren raises its parameters, it cannot re-hash stored values, because it never knew the passwords. Instead, after each successful login, it compares the stored parameters with the current target and, if they are weaker, re-hashes the password it just verified. Active users are upgraded within weeks. Accounts that never log in keep old hashes, and some teams force a reset on accounts still using a weak scheme after a deadline.

@fig be_pw_record | The hash string describes itself, which makes parameter upgrades possible one login at a time.

:::interview Interview lens
**"How would you store passwords, and why not SHA-256?"** Use Argon2id, or bcrypt where Argon2 is unavailable, with a per-user salt the library generates and parameters tuned so that a hash takes a few hundred milliseconds on our hardware. SHA-256 is built for speed, so a GPU can test billions of guesses per second against a leaked table. A slow, memory-hard function cuts that to thousands. Optionally add an HMAC pepper held in a KMS, and re-hash at login when the parameters change.
:::

:::key In one breath
Fast hashes such as SHA-256 let an attacker test billions of guesses per second against a leaked table, so passwords need a deliberately slow, tunable password hash. A per-user random salt defeats precomputed tables and hides shared passwords, and a pepper kept in a KMS makes a database dump useless on its own. bcrypt costs CPU, scrypt and Argon2id also cost memory, and Argon2id is the current default. The work factor is a capacity decision, recorded in the hash string so it can be raised one login at a time.
:::
