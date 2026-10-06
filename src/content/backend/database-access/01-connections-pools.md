@part I | Connections and pools | We start where every query starts, with a socket between the application and the database. Connections are expensive to open and limited in number, so services keep a small pool of them and share it. We will cover drivers and connection strings, what a connection costs, how pools work, how to size them with Little's law, and what happens when they run dry. | where:1

## 1. Drivers, connection strings and the wire protocol

When Wren's order service runs `db.query("SELECT * FROM orders WHERE id = $1", [123])`, nothing magical happens. A library called a **driver**, such as psycopg for Python, pgx for Go or the JDBC driver for Java, turns that call into bytes and writes them to a network socket. On the other end, PostgreSQL reads them, runs the query and writes rows back. The rules for those bytes are the **wire protocol**, and every database has its own. PostgreSQL's protocol has been at version 3 since 2003.

The conversation for one parameterized query is short. The driver sends a Parse message carrying the SQL text with a `$1` placeholder, a Bind message carrying the value 123, an Execute message and a Sync. PostgreSQL answers with a description of the columns, one DataRow per row, a CommandComplete and a ReadyForQuery that says the connection is free for the next statement. The SQL and the value travel in separate messages, which matters a great deal in Part II.

@fig be_db_wire | The driver speaks PostgreSQL's protocol over a socket. The query text and the value 123 never share a message.

The driver needs to know where to connect and how. That information usually arrives as a **connection string**, sometimes called a DSN, which packs the user, password, host, port, database name and options into one URL. Two options deserve attention. `sslmode=verify-full` encrypts the connection and checks the server's certificate against the host name, which is the only mode that stops a man in the middle, as Unit I explained. `application_name` labels the connection, so when someone looks at `pg_stat_activity` during an incident they can see which service owns each session.

@fig be_db_dsn | Each piece of the string has a job. The password comes from a secret store at start-up, never from the repository.

The password is the one part that never belongs in code or configuration files. Wren injects it from a secret manager when the process starts, as Unit XIII describes, so it can be rotated without a deploy.

## 2. What a connection costs

Opening a PostgreSQL connection is a small project. The client opens a TCP connection, which costs one round trip. It negotiates TLS, which costs at least one more. It sends a startup message and authenticates, and SCRAM-SHA-256, PostgreSQL's default password method since version 14, takes two more exchanges. Then the server does something unusual. It **forks**, which means the operating system copies a process, so every connection gets its own PostgreSQL backend process. That process loads catalog information about tables and types into its private memory before it is ready.

For Wren, take an illustrative 5 ms for all of that, against 4 ms for a typical query. If every cache miss opened a fresh connection, the setup would cost more than the work. With 200 misses per second across the fleet, the database would fork 200 processes a second and spend 200 × 5 ms = 1 s of setup time every second, simply saying hello.

@fig be_db_conn_cost | Illustrative timings. A pooled connection skips straight to the query.

The process-per-connection design also sets a ceiling. Each backend uses several megabytes of memory before it does any work, plus whatever its queries need for sorting and hashing. More importantly, the server has a fixed number of CPU cores. Eight cores can run eight processes at once. With 1,000 connections all busy, the operating system switches between them constantly, each switch costing time and polluting CPU caches, and shared structures such as the lock manager become contended. Throughput goes down, not up.

@fig be_db_process_per_conn | Every connection is a process. A thousand of them compete for the same eight cores.

This is why PostgreSQL ships with `max_connections` set to 100, and why raising it to 5,000 is almost never the answer. MySQL uses a thread per connection rather than a process, which is cheaper to create, but the same contention appears at high counts. The fix in both is to keep a small number of connections open and share them.

## 3. Connection pools

A **connection pool** is a set of open connections that a process keeps and lends out. A request borrows a connection, runs its queries, and returns it. The next request borrows the same connection, already authenticated and warm, in microseconds. Each of Wren's four instances keeps a pool of 10, so the database sees 40 connections no matter how many requests arrive.

The pool sits inside the application process, provided by the driver or a library such as HikariCP for Java, SQLAlchemy's pool for Python or the built-in pool in Go's `database/sql`. Its settings are few and each one matters. The **maximum size** caps how many connections it opens. The **minimum idle** count keeps some open during quiet periods so the first request after a lull does not pay the 5 ms. The **connection timeout**, often confusingly named, is how long a request will wait to borrow a connection before giving up, and Wren sets it to 250 ms. The **max lifetime**, 30 minutes for Wren, retires connections periodically so that load balancers, failovers and credential rotations take effect and slow memory growth on the server side is reset.

@fig be_db_pool | Ten open connections, three lent out. Waiting requests take the next free one.

A connection's life is a loop. It is opened once, sits idle, is borrowed by one request, is returned, has its session state reset, is optionally checked for liveness, and eventually is retired when it reaches its maximum lifetime or fails a check. Returning connections reliably is the application's job. A code path that borrows and forgets to return, perhaps on an exception, slowly drains the pool until every request times out. Language constructs such as `with`, `try`-with-resources and `defer` exist precisely to prevent that.

@fig be_db_pool_lifecycle | Opened once, borrowed thousands of times, retired on schedule.

Pools also reset state between borrowers. If one request ran `SET search_path` or left a transaction open, the next borrower must not inherit it. Most pools roll back any open transaction on return, and some run a reset query such as `DISCARD ALL`.

## 4. Sizing a pool with Little's law

How many connections does each Wren instance need? **Little's law**, proved by John Little in 1961, answers this kind of question for any stable system. The average number of items inside a system equals the rate at which they arrive times the average time each spends inside.

$$L = \lambda W$$

Read it as "in flight equals arrivals per second times seconds each". For one Wren instance at peak, λ is 50 cache misses per second, and each miss holds a connection for two queries of 4 ms, so W is 0.008 s. That gives L = 50 × 0.008 = 0.4. On average fewer than half a connection is busy. Across all four instances, 1.6 connections are busy out of 40. The pool of 10 is generous, which is exactly what you want, because averages hide bursts and the same law punishes slowness.

@fig be_db_little | The same law, two days. When queries slow down, the number of connections needed explodes.

Suppose a bad query plan makes each query take 2 s instead of 4 ms. W becomes 4 s and L becomes 50 × 4 = 200 connections per instance. The pool has 10. The arithmetic shows the trap. Pool size is not a capacity knob you can turn up to survive a slow database, because the database is already the bottleneck and more connections only add contention.

The total across all instances is the number that matters to the database. A widely quoted starting point from the PostgreSQL wiki, popularized by HikariCP's documentation, is cores × 2 + effective spindle count. For Wren's 8-core server on SSDs, that is 8 × 2 + 1 = 17 active connections. The idea is that a core can serve about two connections, one running while the other waits on disk or network.

@fig be_db_pool_curve | Illustrative shape. Throughput rises until the cores are busy, then falls as contention grows.

Wren's 40 is above 17, and that is acceptable because most of those connections sit idle at any moment. What would not be acceptable is 20 instances with pools of 50. Measure with a load test, watch the pool's wait time and the database's CPU, and size for the smallest pool that keeps wait time near zero.

## 5. Pool exhaustion

**Pool exhaustion** is the state where every connection is lent out and new requests must wait. It is one of the most common ways a backend fails, and the cause is almost never the pool itself. Something made connections stay borrowed for longer, a slow query, a lock wait, a leak or a transaction that includes a network call.

Return to the 2 s query. Each of Wren's 10 connections is held for 4 s per request, so one instance can complete 10 ÷ 4 = 2.5 cache misses per second while 50 arrive. The other 47.5 per second pile up. Each waits up to the 250 ms connection timeout and then fails, and Wren turns that failure into a 503 with a Retry-After header. The alternative, waiting forever, is worse. Every waiting request ties up a web worker thread or a slot in an event loop, so the cached requests that need no database at all also stop being served.

@fig be_db_exhaustion | Ten connections held by slow queries. Newcomers wait 250 ms, then fail fast.

Failing fast is the start of a good response, not the whole of it. Clients that retry immediately add load to a database that is already struggling, which Unit X calls a retry storm. Statement timeouts, from Part II, stop one slow query from holding a connection for minutes. Circuit breakers stop calling the database for a moment so it can recover. And the pool's own metrics, active connections, idle connections, waiting requests and wait time, should be on the dashboard so that exhaustion is visible before customers report it.

Leaks are the other classic cause. A code path that borrows a connection and never returns it, perhaps because an exception skipped the cleanup, shrinks the pool by one each time it runs. HikariCP's leak detection setting logs a stack trace for any connection held longer than a threshold, which points straight at the guilty line.

:::story Picture this
A taxi rank outside a station. Ten cabs wait, warm and ready, and each passenger takes the next one. On a normal evening cabs come back within minutes and the queue never grows. Then a bridge closes, every ride takes an hour, and the rank empties. Ordering more taxis would not help, because the bridge is the problem. A sensible dispatcher tells new arrivals "no cab for at least an hour" instead of letting them stand in the rain.
:::

:::note Where the 0.8 ms goes
The 0.8 ms round trip in Wren's spec covers a network hop inside one data centre, roughly 0.1 to 0.5 ms, plus parsing, planning and executing a lookup by primary key. Across regions the network alone can be 60 ms, which makes every chatty access pattern in Part III far more expensive.
:::

:::warn Watch out
Raising the pool size during an incident usually makes things worse. If the database is slow because it is overloaded, more connections mean more concurrent work for the same cores. Find what is holding connections, using `pg_stat_activity` and the pool's leak detection, before touching the size.
:::

:::interview Interview lens
**"How would you size a database connection pool?"** Start from Little's law. Connections in use equal the rate of database work times how long each unit holds a connection, so 50 requests per second at 8 ms each need 0.4 on average. Add headroom for bursts, then check the total across all instances against what the database can run in parallel, roughly cores × 2 plus disks, and against `max_connections`. Keep pools small, set a short wait timeout so requests fail fast, monitor wait time, and fix slow queries rather than growing the pool.
:::

:::key In one breath
A driver speaks the database's wire protocol over a socket, configured by a connection string whose password comes from a secret store and whose TLS mode is verify-full. Opening a PostgreSQL connection costs round trips and a process fork, so services keep a small pool of open connections and lend them out. Little's law, L = λW, sizes the pool, and Wren needs 50 × 0.008 = 0.4 busy connections per instance. When queries slow to 2 s the need jumps to 200, the pool of 10 is exhausted, and requests should wait 250 ms and fail fast while someone fixes the slow query.
:::
