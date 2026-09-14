# Examples

The framework ships complete, runnable apps in its
[`examples/`](https://github.com/im-ng/zero/tree/experimental/examples) directory on
GitHub. They are the fastest way to see `zero` wired up for real — copy one as your
starting point.

## zero-basic

A full HTTP microservice that exercises the framework's hot paths: REST handlers,
Postgres/SQLite, Redis caching, GraphQL, structured logging, metrics and health
endpoints. It also includes a multi-stage
[`Dockerfile.multi-stage`](https://github.com/im-ng/zero/tree/experimental/examples/zero-basic/Dockerfile.multi-stage)
and is the reference app for the [Kubernetes](/kubernetes) deployment guide.

```bash
git clone https://github.com/im-ng/zero
cd zero/examples/zero-basic
zig build run            # boots the demo service on :8080

# or containerize it
podman build -f examples/zero-basic/Dockerfile.multi-stage -t zero-basic .
```

## zero-cli

A command-line application built on `App.newCmd` / `app.runCmd` — sub-commands, flag
parsing via `ctx.Param`, and `app.onStartup` hooks for migrations. See
[CLI Apps](/cli) for the API.

```bash
cd zero/examples/zero-cli
zig build run -- help
```

## zero-bench

The benchmark harness lives at `src/bench/main.zig` (built with `zig build bench`). It
boots a real `zero.App` and drives it with a concurrency ramp to measure throughput,
latency and memory. Details and the regression gate are in [Benchmark](/benchmark).

## Other examples

The `examples/` tree also contains per-feature demos referenced throughout the docs —
`zero-kafka-publisher` / `zero-kafka-subscriber`, `zero-nats-publisher` /
`zero-nats-subscriber`, `zero-mq-publisher` / `zero-mq-subscriber`, and more. Each maps
to a page under [Built-in solutions](/).
