# Examples

The framework ships complete, runnable apps in its
[`examples/`](https://github.com/im-ng/zero/tree/v0.5.0/examples) directory on
GitHub (pinned to the `v0.5.0` release). They are the fastest way to see `zero`
wired up for real — copy one as your starting point.

Every example below is a self-contained app. Clone the repo and run any of them:

```bash
git clone https://github.com/im-ng/zero
cd zero/examples/<example-name>
zig build run            # boots the demo (port varies per example)
```

## Reference apps

### zero-basic

A full HTTP microservice that exercises the framework's hot paths: REST handlers,
Postgres/SQLite, Redis caching, GraphQL, structured logging, metrics and health
endpoints. It also ships a multi-stage
[`Dockerfile.multi-stage`](https://github.com/im-ng/zero/tree/v0.5.0/examples/zero-basic/Dockerfile.multi-stage)
and is the reference app for the [Kubernetes](/kubernetes) deployment guide.

```bash
cd zero/examples/zero-basic
zig build run
# or containerize it
podman build -f examples/zero-basic/Dockerfile.multi-stage -t zero-basic .
```

### zero-cli

A command-line application built on `App.newCmd` / `app.runCmd` — sub-commands, flag
parsing via `ctx.Param`, and `app.onStartup` hooks. See [CLI Apps](/cli) for the API.

```bash
cd zero/examples/zero-cli
zig build run -- help
```

### zero-bench

The benchmark harness lives at `src/bench/main.zig` (built with `zig build bench`). It
boots a real `zero.App` and drives it with a concurrency ramp to measure throughput,
latency and memory. Details and the regression gate are in [Benchmark](/benchmark).

## Relational & analytical data

| Example | Showcases | Docs |
| --- | --- | --- |
| [`zero-sqlite`](https://github.com/im-ng/zero/tree/v0.5.0/examples/zero-sqlite) | SQLite handler | [SQLite](/sqlite) |
| [`zero-duckdb`](https://github.com/im-ng/zero/tree/v0.5.0/examples/zero-duckdb) | DuckDB analytics | [DuckDB](/duckdb) |
| [`zero-nosql`](https://github.com/im-ng/zero/tree/v0.5.0/examples/zero-nosql) | NoSQL via Cassandra | [Cassandra](/cassandra) |
| [`zero-timeseries`](https://github.com/im-ng/zero/tree/v0.5.0/examples/zero-timeseries) | Time Series via InfluxDB | [InfluxDB](/influxdb) |
| [`zero-search`](https://github.com/im-ng/zero/tree/v0.5.0/examples/zero-search) | Search via Solr | [Solr](/solr) |

## Caching, storage & files

| Example | Showcases | Docs |
| --- | --- | --- |
| [`zero-redis`](https://github.com/im-ng/zero/tree/v0.5.0/examples/zero-redis) | Redis caching | [Using Redis](/caching) |
| [`zero-filestore`](https://github.com/im-ng/zero/tree/v0.5.0/examples/zero-filestore) | File Store (Local backend) | [File Store](/file-store) |
| [`zero-s3`](https://github.com/im-ng/zero/tree/v0.5.0/examples/zero-s3) | File Store (S3 backend) | [File Store](/file-store) |

## Messaging & pub/sub

| Example | Showcases | Docs |
| --- | --- | --- |
| [`zero-kafka-publisher`](https://github.com/im-ng/zero/tree/v0.5.0/examples/zero-kafka-publisher) | Kafka producer | [Kafka Publisher](/kafka-publisher) |
| [`zero-kafka-subscriber`](https://github.com/im-ng/zero/tree/v0.5.0/examples/zero-kafka-subscriber) | Kafka consumer | [Kafka Subscriber](/kafka-subscriber) |
| [`zero-mqtt-publisher`](https://github.com/im-ng/zero/tree/v0.5.0/examples/zero-mqtt-publisher) | MQTT producer | [MQ Publisher](/message-queue-publisher) |
| [`zero-mqtt-subscriber`](https://github.com/im-ng/zero/tree/v0.5.0/examples/zero-mqtt-subscriber) | MQTT consumer | [MQ Subscriber](/message-queue-subscriber) |
| [`zero-nats-publisher`](https://github.com/im-ng/zero/tree/v0.5.0/examples/zero-nats-publisher) | NATS producer | [NATS Publisher](/nats-publisher) |
| [`zero-nats-subscriber`](https://github.com/im-ng/zero/tree/v0.5.0/examples/zero-nats-subscriber) | NATS consumer | [NATS Subscriber](/nats-subscriber) |

## HTTP, APIs & services

| Example | Showcases | Docs |
| --- | --- | --- |
| [`zero-service-client`](https://github.com/im-ng/zero/tree/v0.5.0/examples/zero-service-client) | Outbound HTTP service-to-service calls | [Http Services](/http-service) |
| [`zero-graphql`](https://github.com/im-ng/zero/tree/v0.5.0/examples/zero-graphql) | GraphQL-over-HTTP | [GraphQL](/graphql) |
| [`zero-proto`](https://github.com/im-ng/zero/tree/v0.5.0/examples/zero-proto) | Protobuf-over-HTTP | [Protobuf](/protobuf) |
| [`zero-autocrud`](https://github.com/im-ng/zero/tree/v0.5.0/examples/zero-autocrud) | Auto CRUD resource handlers | [Auto CRUD](/auto-crud) |
| [`zero-auth`](https://github.com/im-ng/zero/tree/v0.5.0/examples/zero-auth) | Authentication (OAuth, API Key, Basic, RBAC) | [Authentication](/authentication) |
| [`zero-websocket`](https://github.com/im-ng/zero/tree/v0.5.0/examples/zero-websocket) | Websockets | [Websockets](/websocket) |
| [`zero-stream`](https://github.com/im-ng/zero/tree/v0.5.0/examples/zero-stream) | WebSocket streaming / push updates to clients | [Websockets](/websocket) |

## Scheduling, migrations & observability

| Example | Showcases | Docs |
| --- | --- | --- |
| [`zero-cronz`](https://github.com/im-ng/zero/tree/v0.5.0/examples/zero-cronz) | Scheduled tasks (cron) | [Schedule Tasks](/cronz) |
| [`zero-migration`](https://github.com/im-ng/zero/tree/v0.5.0/examples/zero-migration) | Manual migrations flow | [Migrations](/migrations) |
| [`zero-otel`](https://github.com/im-ng/zero/tree/v0.5.0/examples/zero-otel) | Experimental OpenTelemetry (traces + logs) | [OpenTelemetry](/experimental) |

## UI

| Example | Showcases | Docs |
| --- | --- | --- |
| [`zero-todo-htmx`](https://github.com/im-ng/zero/tree/v0.5.0/examples/zero-todo-htmx) | HTMX CRUD (uses automated migrations) | [HTMX CRUD](/htmx-crud) |
