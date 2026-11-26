# Examples

`zero` ships complete, runnable apps in its
[`examples/`](https://github.com/im-ng/zero/tree/main/examples) directory on
GitHub. They track the 0.5.4 line on Zig 0.17. They're the fastest way to see
`zero` wired up for real. Copy one to use as your starting point.

Every example below is a self-contained app. Clone the repo and run any of them:

```bash
git clone https://github.com/im-ng/zero
cd zero/examples/<example-name>
zig build run            # boots the demo (port varies per example)
```

## Reference apps

### zero-basic

A full HTTP microservice that runs `zero`'s main paths: REST handlers,
Postgres/SQLite, Redis caching, GraphQL, structured logging, metrics, and health
endpoints. It also ships a multi-stage
[`Dockerfile.multi-stage`](https://github.com/im-ng/zero/tree/main/examples/zero-basic/Dockerfile.multi-stage)
and is the reference app for the [Kubernetes](/kubernetes) deployment guide.

```bash
cd zero/examples/zero-basic
zig build run
# or containerize it
podman build -f examples/zero-basic/Dockerfile.multi-stage -t zero-basic .
```

### zero-cli

A command-line app built on `App.newCmd` / `app.runCmd`. It has sub-commands, flag
parsing via `ctx.Param`, and `app.onStartup` hooks. See [CLI Apps](/cli) for the API.

```bash
cd zero/examples/zero-cli
zig build run -- help
```

### zero-bench

The benchmark harness lives at `src/bench/main.zig` (built with `zig build bench`). It
boots a real `zero.App` and drives it with a concurrency ramp to measure throughput,
latency, and memory. Details and the regression gate are in [Benchmark](/benchmark).

## Relational & analytical data

| Example | Showcases | Docs |
| --- | --- | --- |
| [`zero-sqlite`](https://github.com/im-ng/zero/tree/main/examples/zero-sqlite) | SQLite handler | [SQLite](/sqlite) |
| [`zero-duckdb`](https://github.com/im-ng/zero/tree/main/examples/zero-duckdb) | DuckDB analytics | [DuckDB](/duckdb) |
| [`zero-nosql`](https://github.com/im-ng/zero/tree/main/examples/zero-nosql) | NoSQL via Cassandra | [Cassandra](/cassandra) |
| [`zero-timeseries`](https://github.com/im-ng/zero/tree/main/examples/zero-timeseries) | Time Series via InfluxDB | [InfluxDB](/influxdb) |
| [`zero-search`](https://github.com/im-ng/zero/tree/main/examples/zero-search) | Search via Solr | [Solr](/solr) |

## Caching, storage & files

| Example | Showcases | Docs |
| --- | --- | --- |
| [`zero-redis`](https://github.com/im-ng/zero/tree/main/examples/zero-redis) | Redis caching | [Using Redis](/caching) |
| [`zero-filestore`](https://github.com/im-ng/zero/tree/main/examples/zero-filestore) | File Store (Local backend) | [File Store](/file-store) |
| [`zero-s3`](https://github.com/im-ng/zero/tree/main/examples/zero-s3) | File Store (S3 backend) | [File Store](/file-store) |
| [`zero-gcs`](https://github.com/im-ng/zero/tree/main/examples/zero-gcs) | File Store (GCS backend) | [File Store](/file-store) |
| [`zero-supabase`](https://github.com/im-ng/zero/tree/main/examples/zero-supabase) | Supabase SQL and Storage | [Supabase](/supabase) |
| [`zero-starter`](https://github.com/im-ng/zero/tree/main/examples/zero-starter) | Minimal app with a production-style Dockerfile | [Getting Started](/started) |

## Messaging & pub/sub

| Example | Showcases | Docs |
| --- | --- | --- |
| [`zero-kafka-publisher`](https://github.com/im-ng/zero/tree/main/examples/zero-kafka-publisher) | Kafka producer | [Kafka Publisher](/kafka-publisher) |
| [`zero-kafka-subscriber`](https://github.com/im-ng/zero/tree/main/examples/zero-kafka-subscriber) | Kafka consumer | [Kafka Subscriber](/kafka-subscriber) |
| [`zero-mqtt-publisher`](https://github.com/im-ng/zero/tree/main/examples/zero-mqtt-publisher) | MQTT producer | [MQ Publisher](/message-queue-publisher) |
| [`zero-mqtt-subscriber`](https://github.com/im-ng/zero/tree/main/examples/zero-mqtt-subscriber) | MQTT consumer | [MQ Subscriber](/message-queue-subscriber) |
| [`zero-nats-publisher`](https://github.com/im-ng/zero/tree/main/examples/zero-nats-publisher) | NATS producer | [NATS Publisher](/nats-publisher) |
| [`zero-nats-subscriber`](https://github.com/im-ng/zero/tree/main/examples/zero-nats-subscriber) | NATS consumer | [NATS Subscriber](/nats-subscriber) |

## HTTP, APIs & services

| Example | Showcases | Docs |
| --- | --- | --- |
| [`zero-service-client`](https://github.com/im-ng/zero/tree/main/examples/zero-service-client) | Outbound HTTP service-to-service calls | [Http Services](/http-service) |
| [`zero-graphql`](https://github.com/im-ng/zero/tree/main/examples/zero-graphql) | GraphQL-over-HTTP | [GraphQL](/graphql) |
| [`zero-proto`](https://github.com/im-ng/zero/tree/main/examples/zero-proto) | Protobuf-over-HTTP | [Protobuf](/protobuf) |
| [`zero-autocrud`](https://github.com/im-ng/zero/tree/main/examples/zero-autocrud) | Auto CRUD resource handlers | [Auto CRUD](/auto-crud) |
| [`zero-auth`](https://github.com/im-ng/zero/tree/main/examples/zero-auth) | Authentication (OAuth, API Key, Basic, RBAC) | [Authentication](/authentication) |
| [`zero-websocket`](https://github.com/im-ng/zero/tree/main/examples/zero-websocket) | Websockets | [Websockets](/websocket) |
| [`zero-stream`](https://github.com/im-ng/zero/tree/main/examples/zero-stream) | WebSocket streaming / push updates to clients | [Websockets](/websocket) |

## Scheduling, migrations & observability

| Example | Showcases | Docs |
| --- | --- | --- |
| [`zero-cronz`](https://github.com/im-ng/zero/tree/main/examples/zero-cronz) | Scheduled tasks (cron) | [Schedule Tasks](/cronz) |
| [`zero-migration`](https://github.com/im-ng/zero/tree/main/examples/zero-migration) | Manual migrations flow | [Migrations](/migrations) |
| [`zero-otel`](https://github.com/im-ng/zero/tree/main/examples/zero-otel) | OpenTelemetry traces and logs over OTLP | [OpenTelemetry](/experimental) |
| [`zero-rate-limit`](https://github.com/im-ng/zero/tree/main/examples/zero-rate-limit) | Rate limiting with a Redis-backed store | [Rate Limiter](/rate-limiter) |
| [`zero-vault-pg`](https://github.com/im-ng/zero/tree/main/examples/zero-vault-pg) | Vault secret injection with Postgres | [Vault](/vault) |

## UI

| Example | Showcases | Docs |
| --- | --- | --- |
| [`zero-todo-htmx`](https://github.com/im-ng/zero/tree/main/examples/zero-todo-htmx) | HTMX CRUD (uses automated migrations) | [HTMX CRUD](/htmx-crud) |
