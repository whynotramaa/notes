# Backend series plan

Source syllabus: `backend.md` (71 items). Series folder: `src/content/backend/`. Figures: `src/figs/beNN.js`, ids prefixed `be_`, shared helpers in `src/lib/be-kit.js`. Map ids `where_be_<slug>`, cover ids `cover_be_<slug>`.

Shape per unit: 7 to 10 parts, about 30 to 35 sections of 250 to 320 prose words each, not counting callouts (2 to 4 paragraphs; the user rejected thinner drafts on 2026-10-06), 35 to 50 figures, `99-interview.md` with 40+ questions, 25+ exercises, worked solutions. Apply unslop rules: no mid-sentence colons, active voice, plain words.

Progress: units 1 to 12, 14 and 15 written at full depth; figures in units 1 to 5 redrawn as pictorial scenes. Unit 13 (security) is parked as a defensive draft of Parts I to IV in `scripts/backend/drafts/security/`, outside the build; its SSRF part was not written.

## Units (order, slug, title, syllabus items)

1. `http-tls-dns`: HTTP, TLS and DNS (1, 2, 27)
2. `browser-security`: Same-origin policy, CORS, cookies and CSRF (3, 4 cookies, 36)
3. `authentication`: Sessions, passwords, JWT and OAuth (4 sessions, 5, 6)
4. `authorization`: Authorization, validation and multi-tenancy (7, 9, 52)
5. `api-design`: API design and service architecture (10, 11, 65, 8, 12, 64, 66)
6. `database-access`: Database access from services (13, plus optimistic and pessimistic locking)
7. `caching-redis`: Caching, Redis and CDNs (14, 15, 61)
8. `queues-events`: Queues, Kafka and event-driven design (16, 17, 18, 56)
9. `concurrency`: Concurrency, runtimes and distributed locks (19, 20, 50, 51, 67)
10. `resilience`: Rate limiting, resilience and integrations (21, 22, 53, 54, 55)
11. `proxies-networking`: Proxies, load balancing and networking (23 to 26, 28, 29, 59, 60, 68, 69)
12. `realtime-files-search`: Realtime, file uploads and search (30 to 33)
13. `security`: Injection, SSRF, secrets and encryption (34, 35, 37, 38)
14. `observability`: Observability and production debugging (39 to 44, 49, 62, 63)
15. `deployment`: Deployment, Kubernetes and the full request (45 to 48, 57, 58, 70, 71)

## Running example: Wren

Wren is an illustrative food-ordering API at `https://api.wren.example`. Every value is an assumption for arithmetic, not a benchmark.

| Setting | Value |
|---|---|
| Daily API requests | 43,200,000 (500/s average) |
| Peak multiplier | 4 (2,000/s peak) |
| Mean latency at peak | 50 ms (100 in flight) |
| p50 / p99 | 30 ms / 250 ms |
| App instances | 4 (500/s each at peak) |
| DB pool per instance | 10 (40 total), PostgreSQL max_connections 100 |
| Queries per cache miss | 2, 4 ms each |
| Cache hit ratio | 90% (400 queries/s at peak) |
| Response size | 2,000 bytes (4,000,000 B/s at peak) |
| Accounts | 1,000,000 |
| Orders created at peak | 50/s |
| Access token / refresh token / idle session | 15 min / 30 days / 30 min |
| Rate limit | 100 requests per user per minute; login 5 per account per minute |
| Kafka topic `order-events` | 12 partitions, RF 3, min ISR 2 |
| DNS TTL / certificate lifetime | 300 s / 90 days |
| Sample request | `GET /orders/123` by user 42 |

## Final steps requested by the user (2026-10-06)

Only after all 15 units are written: run one `npx astro build` to make sure the site builds, commit, push to `origin` (git@github.com:whynotramaa/notes.git, branch main), then shut the laptop down (`systemctl poweroff`). Do not push in between.
