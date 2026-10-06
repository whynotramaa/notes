@part II | SQL and NoSQL injection | We look at the oldest and best-understood backend bug, a query built by gluing user input into a string. Its fix has been known for decades and still fails at the edges where frameworks stop helping. We will cover how SQL injection arises, parameterized queries and their limits, NoSQL operator injection, and second-order injection with least-privilege database accounts. | where:2

## 4. How SQL injection arises

Wren's order history lets a customer search their own orders by restaurant name. A developer in a hurry writes the query by joining strings: `"SELECT * FROM orders WHERE user_id = 42 AND restaurant_name = '" + name + "'"`. With `name` set to `Biryani House`, the database receives a perfectly ordinary query. The problem is that the database receives one string. It parses that string into a structure of keywords, operators and literal values, and it has no way to know which characters the developer wrote and which came from the request.

If `name` contains a quote, the user's text leaves the string literal and becomes part of the query's structure. The textbook test input `' OR '1'='1` turns the condition into `restaurant_name = '' OR '1'='1'`, which is true for every row, and the query returns every order in the table, not just user 42's. That is **SQL injection**, user input changing the structure of a SQL statement. Other inputs can add a `UNION SELECT` that appends rows from another table, or, in databases that allow several statements in one call, run an `UPDATE` or `DROP`. Blind variants infer data one bit at a time from whether a page changes or how long a query takes, so a vulnerable endpoint that shows no query results is still vulnerable.

@fig be_sec_sqli_parse | The same template with a normal name and with a quote-bearing one. The second input changes the shape of the parse tree.

The impact is usually total. SQL injection gives an attacker the database account's full permissions, which in many applications means reading every table, including password hashes and personal data, and often writing to them. The 2008 Heartland Payment Systems breach, which exposed about 130 million card numbers, began with SQL injection in a web form, and injection remained the top OWASP category until 2017.

Why does ordinary code permit it? Because string building is the most natural way to make a dynamic query in every language, and because the bug is invisible in testing with normal data. Escaping, which replaces `'` with `''`, was the historical fix and is fragile, since the escaping rules differ between databases, character sets and contexts. Multi-byte character sets once let attackers craft bytes whose escaped form still ended a string, a well-known weakness of escaping under MySQL's `GBK` character set. The real fix, in the next section, does not escape anything.

## 5. Parameterized queries and their limits

A **parameterized query**, also called a prepared statement with bound parameters, sends the query's structure and its values to the database separately. Wren writes `SELECT * FROM orders WHERE user_id = $1 AND restaurant_name = $2` and passes `42` and the name as parameters. The database parses the template once, with placeholders where values go, and then binds the values as data. A name containing quotes, semicolons or SQL keywords is compared as a string and matches nothing, because it never passes through the SQL parser at all. This is not better escaping. It is a different channel, and it removes the bug class rather than reducing it.

@fig be_sec_param | Structure and data travel separately. The database parses the template before it ever sees the value.

ORMs and query builders, Unit VI, use parameters by default, which is the main reason injection fell in the OWASP rankings. The remaining injection bugs live where parameters cannot reach. Placeholders stand for values only. A table name, a column name, a sort direction or the `ORDER BY` column cannot be a parameter, because they are part of the query's structure. Wren's order list accepts `?sort=created_at`, and a developer who writes `"ORDER BY " + sort` has reintroduced injection through the one door the ORM did not guard. The fix is an **allowlist** that maps request values to fixed strings in code: `{"created_at": "created_at", "total": "total_cents"}`, and anything else is a 400. The client chooses among options. It never supplies SQL.

Other edges need the same care. ORMs have raw-query escape hatches, such as Django's `raw()` and `extra()`, Rails' `where("name = '#{name}'")` and SQLAlchemy's `text()`, which are safe only when used with their own parameter syntax. `LIKE` patterns take parameters, but the `%` and `_` wildcards inside the value still act as wildcards, so a search for `%` matches everything and a pattern of many wildcards can be slow. Wren escapes them in the value and caps the length. Stored procedures that build dynamic SQL inside the database are vulnerable in exactly the same way as application code. And `IN` lists need one placeholder per element or an array parameter, not a joined string.

Detection backs this up. Static analysis flags any query built with string formatting. Code review treats raw SQL as a red flag that needs a comment explaining why parameters are not enough. Database logs and a web application firewall catch common probes, and a spike in SQL syntax errors from one client is a reliable signal that someone is testing for injection.

## 6. NoSQL and operator injection

Document databases do not parse SQL, so it is tempting to think injection does not apply to them. It does, in a different shape. MongoDB queries are objects, such as `{ email: "a@wren.example", password: "…" }`, and many Node.js applications build them straight from the request body. If the body is JSON, the client controls types as well as values. A login handler that runs `users.findOne({ email: body.email, password: body.password })` will receive, from a hostile client, `{"email": "a@wren.example", "password": {"$ne": null}}`. The password field is now a query operator meaning "not equal to null", which every stored password satisfies, and the query finds the user without knowing the password. This is **operator injection**.

@fig be_sec_nosql | A string where a string belongs, and an object where a string belongs. The second turns a comparison into an operator.

The cause is type confusion, Unit IV, rather than parsing. The code expected a string and got an object, and the database treats objects in that position as operators. Query-string parsers make it easy to arrive by accident. Express 4's default parser, the qs library, turns `?password[$ne]=x` into `{ password: { $ne: "x" } }`, so even a GET request can carry an object. Other operators widen the damage. `$regex` allows probing a field one character at a time, and `$where` in older MongoDB versions ran JavaScript on the server, a full code-execution path that modern versions restrict.

The defence is to check types at the boundary and build queries from known shapes. Wren validates every request body against a schema, Unit IV, which rejects an object where a string is expected. Libraries such as `express-mongo-sanitize` strip keys starting with `$` or containing `.` as a second layer, and Mongoose's `sanitizeFilter` option does the same at the ODM. Server-side JavaScript evaluation is disabled. Login compares a password hash in application code, Unit III, never by putting the password into a query, which removes this exact bug and the timing problems that come with it.

The same idea applies to every query language that accepts structured input. Elasticsearch's query DSL, Unit XII, lets a client that controls a whole query object run expensive aggregations or scripts, so Wren builds search queries from a small set of parameters and never forwards client JSON to the engine. GraphQL, Unit V, has its own version, where depth and complexity limits stop a structurally valid query from being abusive.

## 7. Second-order injection and least privilege

A restaurant registers with the name `Biryani' House`. The signup handler uses parameters, so the name is stored correctly, quote and all. Weeks later, a nightly reporting job reads restaurant names from the database and builds a query by concatenation, on the assumption that data already in the database is safe. The stored quote breaks out of the job's string literal. This is **second-order injection**, where the hostile value is stored by one piece of code and triggered by another. It is hard to find in testing because the request that plants the value and the code that runs it are far apart in time and in the codebase.

@fig be_sec_second_order | The payload is stored safely by signup and detonates in a nightly job that trusted its own database.

The defence is the rule from Part I, that safety comes from how a value is used, not where it came from. Every query uses parameters regardless of whether its inputs came from a request, a database row, a message or a config file. "It came from our database" is not a type of trust.

The second defence limits what a successful injection can do. Each Wren service connects with its own database role holding only the privileges it needs, the principle of **least privilege**, Unit IV. The order service can `SELECT`, `INSERT` and `UPDATE` the orders tables and nothing else. It cannot read `users.password_hash`, cannot `DROP` anything, and cannot run `COPY ... TO PROGRAM`, the PostgreSQL feature that runs a shell command and is available only to superusers or members of `pg_execute_server_program`. The reporting job connects to a read replica with a read-only role. Row-level security, Unit IV, adds a tenant filter that the database enforces even on injected queries.

With these roles, an injection in the order service exposes orders, which is bad, but not password hashes, payment tokens or the ability to destroy data, which would be far worse. Wren also keeps the database off the public internet, so stolen credentials alone are not enough to connect, and alerts on queries touching tables a role has never touched before. Monitoring helps detection in a way prevention cannot. If a vulnerable query does slip through review, a sudden run of syntax errors or a `UNION` from an unusual role is often the first sign.

:::story Picture this
A bank teller who reads instructions from a form. A careful bank has separate boxes, "amount" and "account", and the teller only ever treats what is in the amount box as a number. A careless bank has one free-text line, "please pay ___", and a customer writes "£10 to account 5, and also empty the vault". Parameters are the separate boxes.
:::

:::note Why escaping lost
Escaping tries to make data safe for one parser by rewriting it. It depends on the exact parser, character set and context, and one mistake anywhere reopens the bug. Parameters avoid the parser entirely. The same lesson repeats in Part IV, where context-aware encoding is the right answer only because HTML has no parameter channel.
:::

:::warn Watch out
`ORDER BY`, table names, column names and `LIMIT` clauses in some drivers cannot be parameters. They are where injection survives in modern ORM code. Map client choices to fixed strings through an allowlist and reject everything else.
:::

:::interview Interview lens
**"How do you prevent SQL injection?"** Use parameterized queries everywhere, including for values read from your own database, because they send structure and data separately so input never reaches the SQL parser. For identifiers and sort columns, which cannot be parameters, map client choices through an allowlist. Validate types at the boundary to stop NoSQL operator injection. Give each service a least-privilege database role so a missed bug exposes little. Detect with static analysis, review of every raw query, and alerts on SQL errors and unusual queries.
:::

:::key In one breath
SQL injection happens because the database parses one string and cannot tell the developer's characters from the user's, so `' OR '1'='1` rewrites a condition. Parameterized queries send structure and values separately and remove the bug class, while identifiers and `ORDER BY` columns still need allowlists. NoSQL databases suffer operator injection when an object like `{"$ne": null}` arrives where a string was expected, fixed by schema validation. Second-order injection runs stored values later, so parameterize every query, and least-privilege roles limit what any missed bug can reach.
:::
