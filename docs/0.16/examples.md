# Examples

`zero` ships complete, runnable apps in its
[`examples/`](https://github.com/im-ng/zero/tree/v0.5.0/examples) directory on
GitHub (pinned to the `v0.5.0` release). They're the fastest way to see `zero`
wired up for real. Copy one to use as your starting point.

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
[`Dockerfile.multi-stage`](https://github.com/im-ng/zero/tree/v0.5.0/examples/zero-basic/Dockerfile.multi-stage)
and is the reference app for the [Kubernetes](/0.16/kubernetes)) deployment guide.

```bash
cd zero/examples/zero-basic
zig build run
# or containerize it
podman build -f examples/zero-basic/Dockerfile.multi-stage -t zero-basic .
```

### zero-cli

A command-line app built on `App.newCmd` / `app.runCmd`. It has sub-commands, flag
parsing via `ctx.Param`, and `app.onStartup` hooks. See [CLI Apps](/0.16/cli)) for the API.

```bash
cd zero/examples/zero-cli
zig build run -- help
```

### zero-bench

The benchmark harness lives at `src/bench/main.zig` (built with `zig build bench`). It
boots a real `zero.App` and drives it with a concurrency ramp to measure throughput,
latency, and memory. Details and the regression gate are in [Benchmark](/0.16/benchmark)).

## Relational & analytical data

| Example | Showcases | Docs |
| --- | --- | --- |
| [`zero-sqlite`](https://github.com/im-ng/zero/tree/v0.5.0/examples/zero-sqlite) | SQLite handler | [SQLite](/0.16/sqlite)) |
| [`zero-duckdb`](https://github.com/im-ng/zero/tree/v0.5.0/examples/zero-duckdb) | DuckDB analytics | [DuckDB](/0.16/duckdb)) |
| [`zero-nosql`](https://github.com/im-ng/zero/tree/v0.5.0/examples/zero-nosql) | NoSQL via Cassandra | [Cassandra](/0.16/cassandra)) |
| [`zero-timeseries`](https://github.com/im-ng/zero/tree/v0.5.0/examples/zero-timeseries) | Time Series via InfluxDB | [InfluxDB](/0.16/influxdb)) |
| [`zero-search`](https://github.com/im-ng/zero/tree/v0.5.0/examples/zero-search) | Search via Solr | [Solr](/0.16/solr)) |

## Caching, storage & files

| Example | Showcases | Docs |
| --- | --- | --- |
| [`zero-redis`](https://github.com/im-ng/zero/tree/v0.5.0/examples/zero-redis) | Redis caching | [Using Redis](/0.16/caching)) |
| [`zero-filestore`](https://github.com/im-ng/zero/tree/v0.5.0/examples/zero-filestore) | File Store (Local backend) | [File Store](/0.16/file-store)) |
| [`zero-s3`](https://github.com/im-ng/zero/tree/v0.5.0/examples/zero-s3) | File Store (S3 backend) | [File Store](/0.16/file-store)) |

## Messaging & pub/sub

| Example | Showcases | Docs |
| --- | --- | --- |
| [`zero-kafka-publisher`](https://github.com/im-ng/zero/tree/v0.5.0/examples/zero-kafka-publisher) | Kafka producer | [Kafka Publisher](/0.16/kafka-publisher)) |
| [`zero-kafka-subscriber`](https://github.com/im-ng/zero/tree/v0.5.0/examples/zero-kafka-subscriber) | Kafka consumer | [Kafka Subscriber](/0.16/kafka-subscriber)) |
| [`zero-mqtt-publisher`](https://github.com/im-ng/zero/tree/v0.5.0/examples/zero-mqtt-publisher) | MQTT producer | [MQ Publisher](/0.16/message-queue-publisher)) |
| [`zero-mqtt-subscriber`](https://github.com/im-ng/zero/tree/v0.5.0/examples/zero-mqtt-subscriber) | MQTT consumer | [MQ Subscriber](/0.16/message-queue-subscriber)) |
| [`zero-nats-publisher`](https://github.com/im-ng/zero/tree/v0.5.0/examples/zero-nats-publisher) | NATS producer | [NATS Publisher](/0.16/nats-publisher)) |
| [`zero-nats-subscriber`](https://github.com/im-ng/zero/tree/v0.5.0/examples/zero-nats-subscriber) | NATS consumer | [NATS Subscriber](/0.16/nats-subscriber)) |

## HTTP, APIs & services

| Example | Showcases | Docs |
| --- | --- | --- |
| [`zero-service-client`](https://github.com/im-ng/zero/tree/v0.5.0/examples/zero-service-client) | Outbound HTTP service-to-service calls | [Http Services](/0.16/http-service)) |
| [`zero-graphql`](https://github.com/im-ng/zero/tree/v0.5.0/examples/zero-graphql) | GraphQL-over-HTTP | [GraphQL](/0.16/graphql)) |
| [`zero-proto`](https://github.com/im-ng/zero/tree/v0.5.0/examples/zero-proto) | Protobuf-over-HTTP | [Protobuf](/0.16/protobuf)) |
| [`zero-autocrud`](https://github.com/im-ng/zero/tree/v0.5.0/examples/zero-autocrud) | Auto CRUD resource handlers | [Auto CRUD](/0.16/auto-crud)) |
| [`zero-auth`](https://github.com/im-ng/zero/tree/v0.5.0/examples/zero-auth) | Authentication (OAuth, API Key, Basic, RBAC) | [Authentication](/0.16/authentication)) |
| [`zero-websocket`](https://github.com/im-ng/zero/tree/v0.5.0/examples/zero-websocket) | Websockets | [Websockets](/0.16/websocket)) |
| [`zero-stream`](https://github.com/im-ng/zero/tree/v0.5.0/examples/zero-stream) | WebSocket streaming / push updates to clients | [Websockets](/0.16/websocket)) |

## Scheduling, migrations & observability

| Example | Showcases | Docs |
| --- | --- | --- |
| [`zero-cronz`](https://github.com/im-ng/zero/tree/v0.5.0/examples/zero-cronz) | Scheduled tasks (cron) | [Schedule Tasks](/0.16/cronz)) |
| [`zero-migration`](https://github.com/im-ng/zero/tree/v0.5.0/examples/zero-migration) | Manual migrations flow | [Migrations](/0.16/migrations)) |
| [`zero-otel`](https://github.com/im-ng/zero/tree/v0.5.0/examples/zero-otel) | Experimental OpenTelemetry (traces + logs) | [OpenTelemetry](/0.16/experimental)) |

## UI

| Example | Showcases | Docs |
| --- | --- | --- |
| [`zero-todo-htmx`](https://github.com/im-ng/zero/tree/v0.5.0/examples/zero-todo-htmx) | HTMX CRUD (uses automated migrations) | [HTMX CRUD](/0.16/htmx-crud)) |
