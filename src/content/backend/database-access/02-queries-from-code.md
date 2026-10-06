@part II | Queries from code | We look at the query itself, how long it may run, how its values reach the database, and which tool writes it. A query without a timeout can hold a connection for an hour, and a query built by gluing strings together can hand an attacker the database. We will cover the family of timeouts, parameterized and prepared statements, and the choice between raw SQL, query builders and ORMs. | where:2

## 6. Timeouts that protect the pool

A query that never finishes is worse than one that fails. It holds a connection, perhaps locks, and a worker thread, and it gives the user nothing. Wren therefore puts a time limit on every layer of database access, and the limits nest inside one another like Russian dolls.

The outermost limit belongs to the request. The gateway gives each request 300 ms, and the handler works within 280 ms. Inside that, borrowing a connection may take at most 50 ms on the hot path, a tighter version of the 250 ms default. PostgreSQL then enforces its own limits on the server side. **`statement_timeout`** cancels any statement that runs longer than the setting, 200 ms for Wren's API role. **`lock_timeout`** cancels a statement that waits longer than its setting to acquire a lock, 100 ms here, which matters most for migrations in Part VI. The client driver adds a **socket timeout** as a last line of defence in case the network itself goes silent.

@fig be_db_timeouts | Each limit fits inside the one above. The statement limit is what actually stops a runaway query.

Server-side timeouts are set per role or per session, so the API can have 200 ms while a nightly reporting job has 10 minutes on a separate role and pool. That separation matters. A single long analytics query running on the API's pool, or worse, on the primary without limits, is a classic way to cause the pool exhaustion of Part I.

The quietest timeout is the most important for correctness. **`idle_in_transaction_session_timeout`**, added in PostgreSQL 9.6 in 2016, ends a session that has opened a transaction and then sat idle. That happens when code runs `BEGIN`, updates a row and then calls a payment provider or waits for user input before committing. The row lock is held throughout, and every other transaction that touches the row waits.

@fig be_db_idle_txn | Session A went off to call an API with a row locked. Session B waits the whole 800 ms.

Wren sets it to 5 s. A timeout that fires in production is a bug report, and its log line names the guilty code path.

## 7. Parameterized and prepared statements

There are two ways to get the value 123 into a query. The first builds a string, `"SELECT * FROM orders WHERE id = " + input`. If `input` is `1; DROP TABLE orders`, the database receives two statements and runs both. This is **SQL injection**, and Unit XIII treats it in depth. Escaping input by hand is error-prone, because each database has different quoting rules and every developer must remember to do it every time.

The second way is a **parameterized query**, `SELECT * FROM orders WHERE id = $1`, with the value passed separately. As Part I showed, PostgreSQL's protocol sends the SQL text in a Parse message and the values in a Bind message. The database parses the SQL before it ever sees the value, so the value can only ever be data. If an attacker passes `1; DROP TABLE orders`, PostgreSQL looks for an order whose id equals that text, fails to convert it to an integer, and returns an error. Nothing is dropped.

@fig be_db_params | String building lets data become code. Parameters send them in separate envelopes.

Parameters cover values only. Table names, column names and sort directions cannot be parameters, which is why the API in Unit V maps `sort=-created_at` through an allowlist to fixed SQL fragments rather than pasting the field name in.

A **prepared statement** goes one step further. The database parses and plans the SQL once, stores the plan under a name on that connection, and each later execution only binds new values. For short queries that run thousands of times, skipping the parse and plan saves a noticeable fraction of the work. PostgreSQL plans the first five executions with the actual values, then may switch to a **generic plan** that ignores them if it looks no worse. That is usually good and occasionally bad, when one value is far more common than another and deserves a different plan. The setting `plan_cache_mode` can force either behaviour.

@fig be_db_prepared | Parse and plan once per connection. Every later run only binds a value.

Prepared statements live on one connection. That detail becomes important with PgBouncer in Part VIII.

## 8. Raw SQL, query builders and ORMs

Wren's code can talk to PostgreSQL at three levels of abstraction. With **raw SQL**, developers write the exact statement and map rows to values themselves. Nothing is hidden, every query can use every PostgreSQL feature, and performance problems are visible in the code. The cost is boilerplate, mapping columns to fields by hand, and SQL scattered through the codebase. Libraries such as sqlc for Go and jOOQ for Java ease the pain by generating typed code from SQL.

A **query builder**, such as Knex for JavaScript or SQLAlchemy Core, lets code compose SQL from functions, `select("*").from("orders").where("id", 123)`. It shines when queries are assembled dynamically, for example adding a filter clause only when the client supplied that filter, without the bugs of string concatenation. Developers still think in tables and rows.

An **ORM**, short for object-relational mapper, maps tables to classes and rows to objects. Code says `order = session.get(Order, 123)`, sets `order.tip = 30`, and the ORM generates the `UPDATE` at commit time. Hibernate (2001), Django's ORM, Rails' Active Record, SQLAlchemy and Entity Framework are the best known. ORMs remove most boilerplate for create, read, update and delete work and give a consistent place for relationships and validation.

@fig be_db_ladder | Three rungs. Climbing up buys convenience and costs visibility.

The choice is not exclusive, and most mature codebases use two rungs. Wren uses an ORM for ordinary entity work, where it saves the most typing, and drops to raw SQL for the queries that matter most, such as the keyset-paginated order list, reporting queries and the atomic stock update in Part V. The rule that keeps this healthy is visibility. Whatever writes the SQL, a developer should be able to see the SQL that runs, through logs in development and `pg_stat_statements` in production, and should read the query plan for anything on a hot path.

:::story Picture this
Ordering at a restaurant three ways. You can walk into the kitchen and cook it yourself, which gives full control and a lot of work. You can fill in a detailed order form, which is safer and still precise. Or you can tell a waiter "the usual", and a good waiter gets it right almost every time, while an unwatched one may bring you twenty separate plates.
:::

:::note Where the timeout fires
When `statement_timeout` fires, PostgreSQL cancels the statement with SQLSTATE 57014 and the transaction is aborted. The connection itself stays healthy and goes back to the pool after rollback. A client-side socket timeout is different. The driver gives up on the connection, which may still be running the query on the server, so the pool must discard that connection rather than reuse it.
:::

:::warn Watch out
Never build SQL by formatting values into strings, even values you believe are safe, such as ids from your own database. Code moves, inputs change, and the habit spreads. Use parameters for every value and allowlists for every identifier.
:::

:::interview Interview lens
**"What timeouts would you configure for database access?"** A request deadline from the gateway, a short wait to borrow a pooled connection so requests fail fast, a server-side `statement_timeout` per role so a runaway query is cancelled, a `lock_timeout` especially for migrations, `idle_in_transaction_session_timeout` to kill sessions that hold locks while idle, and a client socket timeout as a backstop. Inner limits must be shorter than outer ones, and long-running jobs get their own role and pool with longer limits.
:::

:::key In one breath
Every database call needs a time limit, and the limits nest, from the gateway's 300 ms through a 50 ms pool wait to a 200 ms `statement_timeout`, with `lock_timeout` and `idle_in_transaction_session_timeout` for locks and forgotten transactions. Parameterized queries send SQL and values in separate protocol messages, which makes injection through values impossible, and prepared statements reuse a plan per connection. Raw SQL gives control, query builders give safe composition, and ORMs give convenience, and most teams use an ORM for routine work and raw SQL for hot paths while keeping the generated SQL visible.
:::
