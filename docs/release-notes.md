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

- **Automated migration creation** — a new `zero` CLI (`zig build zero`) scaffolds
  migrations with `zero migrator add --name <name>`, generating
  `src/migrations/<name>.zig` and auto-regenerating `src/migrations/all.zig`. See
  [Migrations](/migrations).
- **Experimental OpenTelemetry** — opt-in traces and logs over OTLP HTTP/protobuf,
  default-targeting the **rootPrint** OSS collector (any OTLP HTTP collector works).
  Automatic server spans, `traceparent` propagation, and a `std.log` → OTel logs
  bridge. See [OpenTelemetry](/experimental).
- **RBAC** limited via JSON config; remote log-level retrieval format revisited.

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
