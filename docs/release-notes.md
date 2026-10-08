# Release Notes

A running log of what shipped in each `zero` release, newest first. The planned
work lives on the [Roadmap](/timeline) page.

::: tip
Docs always track `main`. Pin to a tagged release in your own project — the
[Getting Started](/started) guide shows how to fetch a specific version (e.g.
`v0.5.0`).
:::

## 0.5.3-dev (`main`, unreleased)

Work currently on `main` ahead of the `v0.5.2` tag:

### Data sources
- **MySQL** — `ctx.SQL` over the native MySQL wire protocol (`DB_DIALECT=mysql`); pure-Zig client, `mysql_native_password` auth. See [MySQL](/mysql).
- **ArangoDB** — `ctx.NoSQL` over AQL (`ARANGO_HOST`); full AQL statements, HTTP Basic. See [ArangoDB](/arangodb).
- **Dgraph** — new `ctx.Graph` handle (`DGRAPH_URL`); `query` / `mutate` over GraphQL±. See [Graph](/dgraph).
- **Meilisearch** — `ctx.Search` over HTTP (`MEILI_HOST`); index / query / get / delete. See [Meilisearch](/meilisearch).
- **OpenTSDB** — `ctx.Timeseries` (`OPENTSDB_URL`); JSON `/api/put` write, `/api/query`. See [OpenTSDB](/opentsdb).

### Cloud & infra
- **GCS file store** — `FILE_STORE_BACKEND=gcs`; Google Cloud Storage over REST with OAuth2. See [File Store](/file-store).
- **Supabase** — managed Postgres via `DB_DIALECT=supabase` and S3-compatible storage via `FILE_STORE_BACKEND=supabase`. See [Supabase](/supabase).
- **AWS SQS** — `PUBSUB_BACKEND=SQS`; publish/subscribe over SigV4. See [AWS SQS](/sqs).
- **GCP Pub/Sub** — `PUBSUB_BACKEND=GCP`; publish/subscribe over OAuth2 bearer. See [GCP Pub/Sub](/gcp-pubsub).
- **Distributed rate limiting** — `RATE_LIMIT_STORE=redis` shares the counter across replicas (fails open if Redis is down). See [Rate Limiter](/rate-limiter).

### Auth & runtime
- **Service OAuth via Keycloak** — inbound tokens validate against `AUTH_JWKS_URL` (eager key load at startup), and Keycloak tokens (no `nbf`/`jti`) now validate; outbound service OAuth uses client-credentials (`SERVICE_<NAME>_OAUTH_*`). See [Authentication](/authentication) and [Http Services](/http-service#outbound-auth).
- **Metrics count fix** — `app_http_response_hits` now counts every request (was sampled 1-in-32); the latency histogram stays sampled.
- **Socket-close retry** — transient keep-alive resets from upstream services auto-retry once instead of tripping the circuit breaker.
- **CLI app leak** — `App.destroy()` now tears down all subsystems, so the CLI no longer leaks on exit.
- **Migration leak fix** — explicit `DB_DIALECT=duckdb` skips the Postgres path, and per-migration keys are freed on run.

## 0.5.2 (2026-09-27)

Work currently on `main` ahead of the `v0.5.2` tag:

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
