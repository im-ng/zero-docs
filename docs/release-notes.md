# Release Notes

A running log of what shipped in each `zero` release, newest first. The planned
work lives on the [Roadmap](/timeline) page.

::: tip
Docs always track `main`. Pin to a tagged release in your own project — the
[Getting Started](/started) guide shows how to fetch a specific version (e.g.
`v0.5.0`).
:::

## 0.5.1-dev (`main`, unreleased)

Work currently on `main` ahead of the `v0.5.0` tag:

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
