# Release Notes

A running log of what shipped in each `zero` release, newest first. The planned
work lives on the [Roadmap](/timeline) page.

::: tip
Docs always track `main`. Pin to a tagged release in your own project. The
[Getting Started](/started) guide shows how to fetch a specific version (e.g.
`v0.5.0`).
:::

## Release & Zig support

| Release | Zig toolchain |
| --- | --- |
| up to `0.0.3` | Zig 0.15.2 |
| up to `0.5.3` | Zig 0.16.0 |
| `0.5.4` (unreleased) and newer | Zig 0.17.0 |

## 0.5.4 (unreleased)

Zero 0.5.4 targets **Zig 0.17.0**. It continues from 0.5.3 and moves the whole framework, and all of its examples, onto the Zig 0.17 toolchain.

This line tracks the [`experimental-0.17`](https://github.com/im-ng/zero/tree/experimental-0.17) branch. Recent activities:

### Zig 0.17.0 support
- The framework and all examples are migrated to **Zig 0.17** (`112e5dc`).
- CI toolchain images are bumped to the Zig 0.17 build (`1c5b56d`).
- Dependencies updated for 0.17 compatibility: SQLite (`4d202f3`) and the `zbench` benchmark harness (`0a4c9e7`).

### Examples & tooling
- **`zero-vault-pg` example** — combines Vault secret injection with Postgres. The Vault loader gained KV v2 `data/` auto-insert on a `404`, input trimming, and an owned `vault_overrides` map so secrets never land in an empty env map (`dbbe1d7`).
- **Dockerize steps** added to the Dockerfiles for a quick local look (`117c89a`).

> Work is tracked on the `experimental-0.17` branch; this section is updated as the release firms up.

## 0.5.3 (2026-10-24)

Zero 0.5.3 is the cloud-backends release. It targets Zig 0.16.0.

This release adds AWS and Google managed services, rebuilds the MySQL client on a real connection pool with TLS, keeps outbound connections honest (websocket client, circuit breakers), and raises test coverage to 90% with a kcov pipeline that actually reports.

### Breaking changes

Read these before you upgrade.

- **Datasource `Interface.init` signature** — if you registered a custom datasource backend, `Interface.init` now also takes the circuit breaker and metricz handles. Apps that only reach datasources through `ctx.SQL` / `ctx.NoSQL` / … are unaffected.
- **WebSocket OAuth token field** — `wsclient.zig` read `oauth.token` instead of `token.access_token`; outbound OAuth on the websocket client failed at connect time. Fixed in this release (pick up the fix, no action needed).

### New data sources

- **DGraph** backs `ctx.Graph` over its HTTP query/mutate API. Auto-wired from config; a mock backend covers tests. See [Dgraph](/dgraph).
- **ArangoDB** backs `ctx.NoSQL` over HTTP.
- **Meilisearch** got a full HTTP client (`meiliClient.zig`): index documents, query, fetch and delete by id. This is the handle the `ctx.Search` interface rides on.
- **OpenTSDB** backs `ctx.Timeseries` over HTTP.
- **Supabase SQL** — set `DB_DIALECT=supabase` + `SUPABASE_DB_*`. Reuses the Postgres backend with SSL forced and project-scoped host/port. See [Supabase](/supabase).
- **GCS file store** — `FILE_STORE_BACKEND=gcs` + `GCS_*`. OAuth2 client-credentials, or a supplied `GCS_ACCESS_TOKEN` for workload-identity setups. Supabase Storage reuses the S3 backend. See [File Store](/file-store).

### MySQL rebuilt

The MySQL dialect is now a native client:

- Connection pool with per-request sessions. There is no shared transaction state between concurrent requests.
- `MYSQL_SSL_MODE=disabled|preferred|required`; with `MYSQL_SSL_CA` the handshake verifies the server cert and host.
- Configurable pool size (`MYSQL_POOL_SIZE`).
- TLS identity uses RSA-OAEP from a simplified pure-Zig RSA (`src/datasource/sql/rsa.zig`), unit-tested on a pinned key.

### TLS (experimental)

A shared OpenSSL TLS layer (`src/tls/openssl.zig`), already linked for Postgres, now serves the MySQL client and the NoSQL drivers, starting with Cassandra TLS (`CASSANDRA_TLS_ENABLED=true`; `CASSANDRA_TLS_VERIFY` checks the server cert against `CASSANDRA_TLS_CA`, system trust store when empty). Still experimental.

### Pub/Sub

- **AWS SQS** and **GCP Pub/Sub** join MQTT/Kafka/NATS/Redis behind `PUBSUB_BACKEND`. SQS signs requests with a pure-Zig SigV4 (`src/utils/sigv4.zig`, header + query variants, shared with S3); GCP authenticates via OAuth2 client-credentials. See [AWS SQS](/sqs) and [GCP Pub/Sub](/gcp-pubsub).
- **Dispatch semantics** — `pubsub/dispatch.zig` introduces a `DispatchStatus`. Backends acknowledge a message only when its hook succeeded, or when the message itself landed in the dead-letter queue. An unhandled failure is left for the native redelivery. (Fixes the silent socket close that surfaced as `WriteFailed` on reconnect.)

### Outbound WebSocket client

`zero-ws-client` is an example that connects out to a websocket server. It spins its own thread, auto-reconnects with backoff, and self-terminates on app shutdown. `zero.WebSocketClient` sends text/binary frames through the same service-oauth/breaker plumbing as the HTTP client. Includes an install script for the zero binary. See [WebSocket Client](/websocket-client) and [Getting Started](/started#install-the-zero-cli).

### Security & secrets

- **Vault injection** — set `VAULT_ADDR` + a token or AppRole login, and every `VAULT_SECRETS_PATH` mapping is merged into the process environment before datasources wire up. Credentials never live in a file or an image, and secret values are never logged. See [Vault](/vault).
- **Distributed rate limiting** (`RATE_LIMIT_STORE=memory|redis`) — the limiter now keeps shared buckets when Redis is configured. See [Rate Limiter](/rate-limiter).
- **W3C baggage propagation** (`mw/baggage.zig`) — the middleware parses the inbound header behind a hard member cap, handlers read/modify members via `ctx`, and the outbound service client re-emits them downstream.
- **Auth hardening** (security-audit remediation) — KV-stored credentials for basic/API-key auth, fixed OAuth validation, RBAC refinements, expanded authz branches behind feature flags. See [Authentication](/authentication).
- The **outbound service client** validates its OAuth flow end-to-end (Keycloak round-trip) and threads failures through the circuit breaker.

### Observability & bench

- The bench harness grew a **route probe** and an **allocation probe** that write JSON reports; plus a k6 script driving the same routes.
- Fixed metric counts over-counting hits and a mixed structured/plain log output issue, so the OTel view stays consistent.

### Fixes

- **MySQL connect timeout** — asking Zig 0.16's I/O backend for a connect timeout panicked (`netConnectIpPosix` implements no timeout); the dial no longer requests one, and a blocked connect surfaces as the usual connection error instead.
- **Cast fix** in SQL `lastInsertId` handling.
- **CLI app leak** — one-shot exit runs leaked the command context.
- **Migration leak** — re-running migrations leaked SQL buffers.
- **Gated config changes** — experimental switches no longer activate silently.
- **WebSocket timeout** — unavailable switch case handled.
- **Example configs** — `.env` updates across all examples; migration dialect list extended to MySQL.

### Quality

- **Coverage 88.92%** measured by kcov in CI (Docker image `imng/zero-kcov:0.3.4`), up from 0. Zig 0.16 Debug emits DWARFv5 that kcov cannot read; the test step now builds with `use_llvm` to emit a readable DWARFv4 CU.
- **Three test layers**: `zig build test` (191 tests through kcov), a `test-integration` layer (153, with a real Postgres / fakeserver-backed suites) and a `test-validation` layer (3, proofs that request memory is released per request/cron/pubsub).
- **FakeServers** for search, SQS, GCP Pub/Sub, and GCS. The cloud clients run their tests without cloud access.
- All 14 Zig deps are vendored in `zig-pkg/` at Zig 0.16-compatible versions.

### Soak and Gates tests

Soak & chaos testing (new): an independent pipeline runs against every commit, booting 12+ example services wired to real backends (Postgres, MySQL, SQLite, DuckDB, Cassandra, Redis, Solr, InfluxDB, RustFS/S3, some over TLS) under load, with three gates:

- **Leak gate** — VmRSS sampled every 10s; a leak is flagged only when growth passes both relative and absolute thresholds; passing services hold flat RSS after startup.
- **Chaos gate** — backend IP blackholed (iptables) for 2s under live traffic; server must survive and the data route recover.
- **Functional gate** — health, GraphQL query, and filestore upload→download→delete round-trips under load.
- Full per-service logs, RSS samples and thresholds published at [zero-extended](https://im-ng.github.io/zero-extended/).

### Upgrade checklist

1. Install Zig 0.16.0 (the deps are vendored; no fetch needed).
2. Opt into the new backends via config keys: `DB_DIALECT=supabase`, `FILE_STORE_BACKEND=gcs`, `PUBSUB_BACKEND=SQS|GCP`, `RATE_LIMIT_STORE=redis`, or leave defaults for local behavior.
3. If you keep a custom datasource backend, adapt to the new `Interface.init`.
4. MySQL users: go from `MYSQL_SSL_MODE=disabled` to `preferred`/`required` with `MYSQL_SSL_CA`.
5. Re-run `zig build test` and your example builds.

## 0.5.2 (2026-09-27)

Released as the `v0.5.2` tag:

### Data sources

- **Cassandra rewired into a generic `ctx.NoSQL` handle** — verbs now take a **full CQL statement** instead of collection+key args. The pure-Zig client speaks the **CQL native binary protocol v4**. Cassandra is now **experimental**; see [Cassandra](/cassandra).
- **ClickHouse** (experimental) — columnar OLAP over HTTP, on `ctx.SQL`. See [ClickHouse](/clickhouse).
- **Couchbase** (experimental) — document store over N1QL/HTTP, on `ctx.NoSQL`. See [Couchbase](/couchbase).
- **MongoDB** (experimental) — `ctx.NoSQL` over the **OP_MSG wire protocol** with SCRAM-SHA-256 auth and optional TLS. See [MongoDB](/mongodb).
- **InfluxDB v3** (experimental) — `ctx.Timeseries` now hits `/api/v3/write_lp`, `/api/v3/query_sql`, and `/api/v3/configure/database`. See [InfluxDB](/influxdb).

### Migrations & metrics

- **NoSQL migrations** — new `.nosql` target runs CQL through `ctx.NoSQL`; SQL dialects now cover duckdb (SQLite-shaped DDL) and clickhouse (MergeTree). See [Migrations](/migrations).
- **Unified datasource metrics** — `app_datasource_response` (histogram) and `app_datasource_error_total` (counter), labeled by `backend` / `operation` / `status`. See [Observability](/observability#metrics).

### Auth & runtime

- **Auth header fix** — API Key / Basic auth no longer crashes on a malformed or bare header; the request is rejected with `401` instead. See [Authentication](/authentication).
- **`zf` resource module** — cross-platform system-info gathering replaces direct `/proc` reads (works on macOS too).
- **Stability** — memory-leak fixes across the examples and a `metricz` shutdown segfault fix.

## v0.5.1 (2026-09-20)

Highlights of the 0.5.1 release:

- **Automated migration creation** - a new `zero` CLI (`zig build zero`) scaffolds
  migrations with `zero migrator add --name <name>`, generating
  `src/migrations/<name>.zig` and auto-regenerating `src/migrations/all.zig`. See
  [Migrations](/migrations).
- **Experimental OpenTelemetry** — opt-in traces and logs over OTLP HTTP/protobuf,
  default-targeting the **rootPrint** OSS collector (any OTLP HTTP collector works).
  Automatic server spans, `traceparent` propagation, and a `std.log` → OTel logs
  bridge. See [OpenTelemetry](/experimental).
- **RBAC** limited via JSON config, remote log-level retrieval format revisited.
- **HTTP server tuning** — new knobs: `ZERO_HTTP_WORKERS` (I/O workers),
  `ZERO_HTTP_THREAD_POOL_COUNT` (handler threads), `ZERO_HTTP_MAX_BODY_SIZE`
  (413 on overflow), and `ZERO_KEEPALIVE_TIMEOUT_MS` (idle keep-alive now defaults
  to 60s). Inbound concurrency is now bulkhead-capped at 1024 by
  default. See [Configuration](/configuration#http-server).
- **Postgres pool tuning** — `PG_POOL_SIZE` and `PG_POOL_ACQUIRE_TIMEOUT_MS`.
  See [Configuration](/configuration#database).
- **Bootstrap arena** — `ZERO_FRAMEWORK_MEM_SIZE` sizes a fixed bootstrap allocator
  for early / short-lived allocations. See [Configuration](/configuration#app).
- **OAuth hardening** — `OAUTH_AUDIENCE` / `OAUTH_ISSUER` enforce the JWT `aud` /
  `iss` claims when set. See [Configuration](/configuration#auth).
- **Health & startup probe** — new `GET /.well-known/startup` endpoint plus
  `app.addHealthCheck(...)`, per-check timeout via `HEALTH_CHECK_TIMEOUT_MS`.
  See [Container](/container#health-checks).

## v0.5.0 (2026-09-14)

The 0.16 baseline.

- **`std.Io` injection** threaded through `App → container → Context`, enabling the
  new pluggable I/O layer.
- **New data layers**: DuckDB, NoSQL via Cassandra, Time Series via InfluxDB, Search
  via Solr.
- **Per-service** circuit breaker, rate limiter, and outbound auth for HTTP clients.
- **SQL handler API refresh** for ergonomics.
- **Interface dispatch for datasource and pubsub** examples.
- **Expanded metrics** surface.
- **Zig 0.16 support**.
- **144 test blocks** (unit + integration + validation).

## v0.0.3 (2026-06-03)

- Stable **0.15.2** support.

## v0.0.2 (2026-05-23)

- Circuit breaker for the HTTP client.
- Custom metrics registration.

## v0.0.0 (2025-11-16)

Initial public surface.
