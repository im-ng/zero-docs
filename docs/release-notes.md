# Release Notes

A running log of what shipped in each `zero` release, newest first. The planned
work lives on the [Roadmap](/timeline) page.

::: tip
These pages track `main` and Zig 0.17. Use the version menu at the top to read
the frozen Zig 0.16 docs. Pin a tagged release in your own project. The
[Getting Started](/started) guide shows how.
:::

## Release & Zig support

| Release | Zig toolchain |
| --- | --- |
| up to `0.0.3` | Zig 0.15.2 |
| up to `0.5.3` | Zig 0.16.0 |
| `0.5.4` (unreleased) and newer | Zig 0.17.0 |

## 0.5.4 (unreleased)

Zero 0.5.4 is the **Zig 0.17** line. It starts from 0.5.3 and moves the framework
and every example onto Zig 0.17.0. It also hardens security, makes startup fail
fast, and promotes OpenTelemetry out of experimental.

This section tracks the [`experimental-0.17`](https://github.com/im-ng/zero/tree/experimental-0.17)
branch. It covers every change from the `v0.5.3` tag up to the 0.5.4 release tag.

### Before you upgrade

Read these first. They can change how your app builds or behaves.

- **Zig 0.17.0 is required.** `build.zig.zon` sets `minimum_zig_version = "0.17.0"`. Zig 0.16 will not build this line.
- **Rewrite the run step in `build.zig`.** Replace `if (b.args) |args| run_cmd.addArgs(args);` with `run_cmd.addPassthruArgs();`. A protobuf step becomes `gen_proto.dependOn(protoc_step.step);`. See [Hello world](/hello-zero).
- **Dependencies moved to 0.17-ready forks.** httpz, dotenv, zul, okredis, mqttz, nats, protobuf (5 → 7), and regexp changed. The `jwt` dependency is now `zig_jwt`.
- **API keys stored in KV must contain the token.** A key under `auth:apikey:<token>` whose stored value is anything else is now rejected. Metadata-only values break.
- **Five-field cron schedules changed.** They now mean minute, hour, day, month, weekday and run at second 0. Use six fields when you meant every second.
- **Message slices are short-lived.** The per-message arena is freed when the hook returns. Copy `m.payload` if you need it later.
- **Custom pub/sub backends need a new argument.** The `publish` vtable method takes `key: ?[]const u8`. `Publish(subject, payload)` still works from app code.
- **`HEALTH_CHECK_TIMEOUT_MS` is gone.** The key is no longer read. Health checks use the snapshot interval instead.
- **Vault values live in the config map.** Code that reads `std.process.environ` directly won't see them. Use `config.get*()`.

### Zig 0.17 migration

- The framework and all examples were ported to Zig 0.17. CI images followed.
- SQLite and the `zbench` harness were updated for 0.17.
- Zig 0.17 changed struct reflection. The code now uses `field_names` / `field_types` / `field_attrs` instead of `@typeInfo(T).@"struct".fields`.
- Kafka and DuckDB are weak-linked and on by default. Build a smaller binary with `zig build -Dkafka=false -Dduckdb=false`. Examples forward the flags.
- The `experimental-0.17` branch also reverts a vault overrides removal, so `vault_overrides` stays as an owned config map.

### Observability

- **OpenTelemetry is stable.** It starts when you set `OTEL_EXPORTER_OTLP_ENDPOINT`, `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, or `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`. `OTEL_EXPERIMENTAL` is no longer read. See [OpenTelemetry](/experimental).
- **A cardinality cap is on by default.** Each metric keeps at most 4096 label sets. Extra sets are dropped and counted in `otel_metric_overflow`. Set `METRICS_CARDINALITY_LIMIT=0` to turn it off. The earlier code read the cap from the raw environment and left it off.
- **Label hashing no longer collides.** `{"ab","c"}` and `{"a","bc"}` now hash differently. Error-path HTTP metrics use fixed labels such as `/_error`, so a URL scanner can't create unbounded series.
- `app_sql_response` now uses the real query type for its `operation` label.
- **Health checks run in the background.** A refresher thread publishes a snapshot, and the probe reads it. `HEALTH_SNAPSHOT_REFRESH_MS` sets the interval, default `5000` ms. Set it to `0` to probe inline. A hung check stays down without blocking the others, and the thread is joined at shutdown. See [Container](/container#health-checks).
- **A service timeout is now enforced.** `SERVICE_<NAME>_TIMEOUT_MS` covers connect, headers, and body. It returns `error.RequestTimeout` on a late response. It used to be a warning only.

### Reliability and resilience

- **SQLite uses a connection pool and WAL.** `SQLITE_POOL_SIZE` defaults to 4 and caps at 64. Writable connections enable WAL and a 5-second busy timeout. A request waits for a free connection rather than failing. See [SQLite](/sqlite).
- **Outbound calls retry `429` as well as `5xx`.** They honor an integer `Retry-After` header, capped at 60 seconds, and fall back to `base × attempt`. See [Http Service](/http-service#resilience-timeouts--retries).
- **Redis heals its shared connection.** A failed health `PING` calls `reconnect()` once. The KV store and the Redis rate limiter use that same connection, so they recover with it.
- **Shutdown is signal-safe.** The signal handler only sets a flag. The main thread stops accepting requests and cron jobs, then drains in-flight requests for up to `SHUTDOWN_DRAIN_TIMEOUT_MS`, default 10000 ms.
- **Startup fails fast.** A failed SQL or pub/sub backend registration returns an error instead of dropping the backend. Postgres and DuckGres connect errors no longer call `std.process.exit(1)`.
- **The per-message arena leak is fixed.** Hook functions now free their arena on success. Payloads kept past the hook are no longer valid.
- SQS and GCP consumer threads are joined before their state is freed. Context cleanup runs per request, though the SQL rollback in it is currently commented out.

### Security and audit fixes

- **Basic auth parses safely.** Credentials split on the first colon, so passwords can contain colons. A colon-less credential returns `InvalidCredentials`. `AUTH_KEYS` entries are trimmed and allocated at their exact length.
- **API keys in KV are compared in constant time**, and only an exact value match authenticates.
- **JWT claims are copied into the request allocator**, and an error path no longer destroys the wrong object.
- **MySQL sets `NO_BACKSLASH_ESCAPES` on every connection** before the first query. The client escapes single quotes only, so a backslash stays ordinary data.
- **SigV4 signs without silent fallbacks.** Signing-key allocation errors propagate, the payload hash is copied instead of pointing at a stack buffer, and SQS builds JSON bodies with `std.json`.
- **`Retry-After` math is fixed.** It reports the time left in the window, with a minimum of one second. The old calculation always reported one.
- **`RATE_LIMIT_TRUSTED_PROXIES` is wired up.** List the proxy IPs or CIDRs allowed to set `X-Forwarded-For`. An empty list means never trust it. See [Rate Limiter](/rate-limiter).
- **Cron schedules are validated.** Schedules need exactly five or six fields. A zero step and inverted ranges are rejected.

### Architecture additions

- **Named SQL and pub/sub handles.** `app.addSQL(name, ds)`, `app.addPubSub(name, ps)`, `ctx.GetSQL(name)`, and `ctx.GetPubSub(name)` are additive. `ctx.SQL` and `ctx.pubsub` still point at the default, registered under `"default"`. See [Architecture](/architecture#named-sql-and-pubsub-handles).
- **`addOutbox` is available as a preview.** `app.addOutbox(.{ ... })` registers a poll job that publishes pending rows from an outbox table. It needs a SQL datasource and a pub/sub backend. Check the branch before using it; see the caveat below.
- **Health checks can be registered with `app.addHealthCheck`** and now run against a published snapshot.

### Configuration and tooling

- **`configs/.env.example` is new.** It lists every supported key in one place, including the new health, metrics, rate-limit, and TLS keys.
- **SBOMs are generated for tagged releases.** `scripts/gen-sbom.sh` writes CycloneDX JSON, and a workflow runs it on pushes, PRs, and manual triggers.
- **Dockerize steps were added** for a quick local look, and a minimal `zero-starter` example ships a multi-stage Dockerfile.
- **New examples:** `zero-starter`, `zero-rate-limit`, `zero-gcs`, `zero-supabase`, and `zero-vault-pg`. The Vault loader now trims inputs and retries a missing path with `data/` inserted for KV v2.
- **A broken migration example was fixed** in `zero-otel`, and CI now runs `zig fmt --check`, `test-validation`, and a tighter release gate.

### Known discrepancies on the branch

These are places where the changelog disagrees with the code. Check the branch before you rely on them.

- **Kafka TLS is not on by default.** `KAFKA_SECURITY_PROTOCOL` still defaults to `PLAINTEXT`. `KAFKA_TLS_INSECURE_SKIP_VERIFY` changed from `true` to `false`, and the code passes it to `enable.ssl.certificate.verification`. So verification is now off by default, even though the changelog says otherwise. Set the keys explicitly.
- **The 0.5.4 release file is missing.** `CHANGELOG.md` links `RELEASE_NOTES_0.5.4.md`, but that file is not in the branch.
- **`addOutbox` won't build when an app registers it.** The poll path in `src/outbox.zig` has three problems:
  - `ctx.SQL.queryRows(OutboxRow, sel, args)` leaves out the `ctx` argument. The method needs `queryRows(self, ctx, Type, stmt, args)`.
  - `pubsub.PublishRetrying(topic, payload, opts)` leaves out the `io` argument. The method needs `PublishRetrying(self, io, subject, payload, opts)` because backoff sleeps need an I/O handle.
  - `queryRows` and `exec` both take `comptime stmt`, but the outbox builds `sel`, `ddl`, and `upd` at runtime with `std.fmt.allocPrint`. Zig won't accept a runtime slice in a comptime parameter.

  The framework still builds, because Zig analyzes those function bodies only when the outbox cron hook is used. Treat `addOutbox` as preview until the poll path is rewritten.
- **The v0.5.4 Dockerfile still pins Zig 0.16.0** in `examples/zero-basic/Dockerfile.multi-stage`, and the Helm chart now reports `appVersion: 1.0.0`.

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
