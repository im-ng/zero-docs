# Feature Parity

`zero` ships the features below. You wire them through config instead of writing
the boilerplate yourself.

::: tip
This page tracks the Zig 0.17 / 0.5.4 line. Use the version menu for older
releases.
:::

---

#### Features

- ✅ 12 factor app methodology
  - ✅ Load default `.env` for app startup
  - ✅ Override them per environment
- ✅ REST Standard
  - ✅ Build CRUD endpoints
- ✅ Health and Service check
  - ✅ Live (`/.well-known/live`)
  - ✅ Health (`/.well-known/health`)
  - ✅ Startup (`/.well-known/startup`)
  - ✅ Downstream services pinged as part of health (`addHttpService`)
  - ✅ Background health snapshots (`HEALTH_SNAPSHOT_REFRESH_MS`)
- ✅ Serve static files
  - ✅ Serve static files from registered directory
  - ✅ Serve swagger and openapi spec
- ✅ Metrics tracking
  - ✅ Default metrics
    - ✅ App / HTTP / SQL / KV / Pub/Sub (publish / subscribe / DLQ)
    - ✅ Circuit breaker and retry
  - ✅ Register custom metrics (Counter / Gauge / Histogram)
  - ✅ Process stats
  - ✅ Memory stats
  - ✅ Label cardinality cap (`METRICS_CARDINALITY_LIMIT`, default 4096; `0` disables)
  - ✅ Overflow counter (`otel_metric_overflow`)
- ✅ Traceability
  - ✅ Basic (X-Correlation-ID)
  - ✅ Downstream propagation (outbound HTTP + Kafka/NATS headers)
  - ✅ W3C Baggage propagation
  - ✅ OpenTelemetry traces and logs over OTLP (stable since 0.5.4; enabled by an OTLP endpoint)
- ✅ Well structured logging mechanism
  - ✅ UTC Timezone
  - ✅ Custom Timezone (`ZERO_LOG_TIMEZONE`: local / utc / IANA)
  - ✅ JSON structured logging (`LOG_FORMAT=json`)
  - ✅ Remote log-level pull (`REMOTE_LOG_URL`)
- ✅ Middleware
  - ✅ CORS
  - ✅ TraceID
  - ✅ Logging
  - ✅ Auth
    - ✅ Basic credentials
      - ✅ Config mode
      - ✅ KV mode (`auth:basic:*`)
    - ✅ API Key
      - ✅ Config mode
      - ✅ KV mode (`auth:apikey:*`; stored value must equal the token)
    - ✅ OAuth Key
      - ✅ Register OAuth Provider
      - ✅ Refresh Public Keys (`AUTH_REFRESH_INTERVAL`)
        - ⬜ Client became unresponsive if the external service down
        - ⬜ Health check
        - ⬜ Surge and Circuit breaker
      - ✅ Validate claims
      - ✅ Claims copied into the request allocator (0.5.4)
  - ✅ RBAC (config-driven roles/permissions from JWT claims)
- ✅ Rate Limiter
  - ✅ IP / header / custom key modes
  - ✅ Fixed-window (`RATE_LIMIT_*`) (GoFr uses token-bucket)
  - ✅ Distributed (Redis-backed) rate limiting (`RATE_LIMIT_STORE=redis`)
  - ✅ Trusted proxies for `X-Forwarded-For` (`RATE_LIMIT_TRUSTED_PROXIES`)
  - ✅ `Retry-After` on `429` (real time left in the window)
- ✅ Graceful shutdown (signal-safe, bounded drain via `SHUTDOWN_DRAIN_TIMEOUT_MS`)
- ✅ Panic recovery
- ✅ Handle Error response
  - ✅ Custom Errors
- ✅ Database support
  - ✅ `postgres`
    - ✅ TLS Support (`DB_SSL_MODE`)
  - ✅ `sqlite` (WAL, connection pool via `SQLITE_POOL_SIZE`)
  - ✅ `duckdb` (in-process OLAP, unified `ctx.SQL`)
  - ✅ `clickhouse` (`ctx.SQL`, HTTP)
  - ✅ `mysql` (`ctx.SQL`, native wire protocol, pooled + TLS, `NO_BACKSLASH_ESCAPES`)
  - ✅ `supabase` (managed Postgres; `DB_DIALECT=supabase`)
  - ✅ `redis`
    - ✅ Authentication enabled
  - ✅ `mqtt`
  - ✅ `kafka`
    - ✅ `rdkafka` driver integrated
    - ✅ Support for metrics (publish / subscribe / DLQ)
    - ✅ Reconnect + resubscribe, retry, dead-letter (DLQ)
    - ⬜ Support for multiple topics subscription
  - ✅ `redis` (Pub/Sub)
- ✅ NoSQL (wide-column / document)
  - ✅ `cassandra` (`ctx.NoSQL`)
  - ✅ `couchbase` (`ctx.NoSQL`, N1QL over HTTP)
  - ✅ `mongodb` (`ctx.NoSQL`, OP_MSG wire protocol)
  - ✅ `arangodb` (`ctx.NoSQL`, AQL over HTTP)
- ✅ Time-series
  - ✅ `influxdb` (`ctx.Timeseries`, v3 HTTP API)
  - ✅ `opentsdb` (`ctx.Timeseries`, JSON `/api/put`)
- ✅ Search
  - ✅ `solr` (`ctx.Search`, index / query / get / delete)
  - ✅ `meilisearch` (`ctx.Search`)
- ✅ Graph
  - ✅ `dgraph` (`ctx.Graph`, query / mutate)
- ✅ Pub/Sub
  - ✅ `kafka`
  - ✅ `nats`
  - ✅ `mqtt`
  - ✅ `redis` (Pub/Sub)
  - ✅ `sqs` (AWS SQS, SigV4)
  - ✅ `gcppubsub` (Google Pub/Sub, OAuth2 bearer)
  - ✅ Named backends (`addPubSub` / `GetPubSub`), default stays `ctx.pubsub`
  - ✅ Publish with key (`PublishWithKey`)
  - ✅ Per-message arena freed after the hook returns
- ✅ KV Store
  - ✅ `redis` (shared connection heals on health probe)
  - ✅ `nats_kv`
  - ✅ `memory`
  - ✅ `sqlite`
- ✅ File Store
  - ✅ `local`
  - ✅ `s3` (S3-compatible: MinIO / R2 / Spaces / B2)
  - ✅ `gcs` (Google Cloud Storage, native OAuth2)
  - ✅ `supabase` (S3-compatible storage)
  - ⬜ `ftp` (deferred)
  - ⬜ `sftp` (deferred)
- ✅ Database Migrations
- ✅ Seed data on App startup
- ✅ Auto CRUD
  - ✅ Register resource handlers (`addRestHandlers`)
  - ✅ ID / UUID / custom key modes
- ✅ HTTP Client
  - ✅ Register one or more external http/https client
  - ✅ Handle redirection
  - ✅ Handle CRUD operations
  - ✅ Handle on-fly response transformation
  - ✅ Outbound authentication (Basic, API Key, OAuth 2.0 bearer)
  - ✅ Circuit Breaker (closed → open → half-open)
  - ✅ Per-service Rate Limiting
  - ✅ Whole-request deadline (`SERVICE_<NAME>_TIMEOUT_MS`)
  - ✅ Retry (transport, `429`, `5xx`; honors `Retry-After` up to 60s; OAuth 401 token-refresh replay)
- ✅ Cron Jobs
  - ✅ Five-field schedules (minute, hour, day, month, weekday) at second 0
  - ✅ Six-field schedules with leading seconds (`* * * * * *`)
  - ✅ `*/2` split support
  - ✅ `1-31` ranges support (day/hour/minute)
  - ✅ Support for multiple task executions
  - ✅ Step 0 and inverted ranges rejected
- ✅ Websocket
- ✅ GraphQL-over-HTTP
  - ✅ POST with JSON body (`query`, `variables`, `operationName`)
  - ✅ GET with URL query params (`?query=...&variables=...&operationName=...`)
  - ✅ Schema-less resolver graph execution
  - ✅ Mutations / CRUD operations
  - ✅ Constant field values
  - ✅ Function resolvers (`fn (*Context, Args) anyerror!T`)
  - ✅ Argument coercion (Int, Float, String, Boolean, Enum, Object)
  - ✅ Nested objects & lists
  - ✅ Fragments & inline fragments
  - ✅ Per-field error collection (`data` + `errors`)
  - ✅ Operation metrics (`app_graphql_operation_*`)
  - ⬜ SDL schema definition & validation
  - ⬜ Introspection (`__schema` / `__type`)
  - ⬜ Subscriptions (WebSocket)
- ✅ NATS
  - ✅ Publisher
  - ✅ Subscriber
- ✅ Protobuf support
  - ✅ Decode request bodies (`ctx.bindProto(T)` for `application/x-protobuf`)
  - ✅ Encode responses (`ctx.protobuf(data)`)
  - ✅ Codegen from `.proto` via `zig build gen-proto` (protoc)
- ✅ Protocol Buffers over HTTP
- ✅ CLI Application
- ✅ Memory-leak hardening
  - ✅ Cronz
  - ✅ Context
  - ✅ Container
  - ✅ Pub/sub message arena (freed after each hook)
- ✅ Interface (type-erased)
  - ✅ Pubsub (named backends via `addPubSub` / `GetPubSub`)
  - ✅ SQL (named handles via `addSQL` / `GetSQL`)
  - ✅ Cache (redis / nats-kv / memory / sqlite)
- ✅ Release tooling
  - ✅ CycloneDX SBOM for tagged releases
- ⬜ HTTPS / TLS termination (run behind a proxy)

::: warning Outbox is still a preview
`addOutbox` is on the `experimental-0.17` branch, but its poll path has missing
arguments and passes runtime SQL to `comptime` parameters. Don't count
transactional outbox as shipped until it compiles cleanly in the 0.5.4 tag. See
[Release Notes](/release-notes#_0-5-4-unreleased).
:::
