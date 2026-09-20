# Getting Started

This page walks you through standing up a running HTTP service in about five minutes. The full step-by-step tutorial lives in [Hello world](/hello-zero).

::: danger Requires Zig 0.16.0
`zero` main targets **Zig 0.16.0**. Install it first (see [ziglang.org](https://ziglang.org/learn/getting-started/))
, an older toolchain will fail to build.
:::

## 5-minute quickstart

### 1. Scaffold a project

```bash
mkdir hello-zero && cd hello-zero
zig init
zig fetch --save https://github.com/im-ng/zero/archive/refs/tags/v0.5.0.zip
```

::: tip
`v0.5.0.zip` is the pinned `v0.5.0` release archive. Swap the tag for a newer
release (or use `refs/heads/main.zip`) to track `main`.
:::

### 2. Wire up the dependency

In `build.zig.zon`, declare the `zero` dependency. Note the `minimum_zig_version` field:

```zig
.{
    .name = .hello_zero,
    .version = "0.0.1",
    .minimum_zig_version = "0.16.0",
    .dependencies = .{
        .zero = .{
            .url = "https://github.com/im-ng/zero/archive/refs/tags/v0.5.0.zip",
            .hash = "zero-0.0.2-y0Q7wJorLADrWl4pwN9WqETmTqMm1YC_3Dkq2zWHodIR",
        },
    },
    .paths = .{ "build.zig", "build.zig.zon", "src" },
}
```

In `build.zig`, expose `zero` as a module to your executable:

```zig
const zero = b.dependency("zero", .{});

const exe = b.addExecutable(.{
    .name = "hello",
    .root_module = b.createModule(.{
        .root_source_file = b.path("src/main.zig"),
        .target = target,
        .optimize = optimize,
    }),
});
exe.root_module.addImport("zero", zero.module("zero"));
b.installArtifact(exe);
```

### 3. Write the app

Here's `src/main.zig`:

```zig
const std = @import("std");
const zero = @import("zero");
const utils = zero.utils;

pub const std_options: std.Options = .{ .logFn = zero.logger.custom };

pub fn main(init: std.process.Init) !void {
    var arena = std.heap.ArenaAllocator.init(std.heap.page_allocator);
    defer arena.deinit();

    const app = try zero.App.new(arena.allocator(), init.io, init.environ_map);
    try app.get("/json", jsonResponse);
    try app.run();
}

fn jsonResponse(ctx: *zero.Context) !void {
    try ctx.json(.{ .msg = "hello zero!" });
}
```

### 4. Configure via `.env`

`zero` reads all its config from environment variables, following the 12-factor model.

Create `configs/.env`:

```bash
APP_ENV=dev
APP_NAME=hello-zero
APP_VERSION=1.0.0
LOG_LEVEL=debug
```

### 5. Run it

```bash
zig build run
# INFO  Loaded config from file: ./configs/.env
# INFO  Starting server on port: 8080
```

### 6. Hit it

```bash
curl localhost:8080/json
# {"msg":"hello zero!"}

curl localhost:2121/metrics      # Prometheus metrics, already live
curl localhost:2121/.well-known/health   # liveness probe
```

That's the full loop: configure, register routes, then call `app.run()`.

Everything else — databases, queues, auth, tracing — is opt-in through `.env`.

## Run the official examples

The framework ships complete, runnable example apps in its
[`examples/`](https://github.com/im-ng/zero/tree/v0.5.0/examples) directory:

- **`zero-basic`** — a full HTTP microservice with REST, Postgres/SQLite, Redis, GraphQL and observability. It ships a multi-stage `Dockerfile.multi-stage` ready for Kubernetes.

- **`zero-cli`** — a command-line app built on `App.newCmd` / `app.runCmd` (see
  [CLI Apps](/cli)).

```bash
git clone https://github.com/im-ng/zero
cd zero/examples/zero-basic
zig build run          # boots the demo service on :8080
```

## Why zero?

`zero` is a strongly-opinionated Zig web framework built on `http.zig`.

It targets zero-allocation hot paths while keeping development ergonomic.

- **Zig, not a managed runtime.** There's no garbage collector, no JIT, and no VM. You manage memory yourself and ship a single static binary. The developer experience feels closer to Go than to a heavyweight runtime.

- **Config over code.** Following the 12-factor model, you attach built-ins through `.env` instead of hand-wiring clients and middleware. These built-ins cover databases, queues, caches, auth and observability.

- **Ready for microservices out of the box.** REST, auto-CRUD, GraphQL, protobuf, pub/sub, scheduling, rate limiting, structured logging, metrics and tracing are all first-class.

## What's included

- `.env` based configuration to boot the app
- Drop-in support for well-known technologies
  - `Postgres` / `SQLite` / `DuckDB` — seed data on startup, manage migrations with ease
  - NoSQL through `Cassandra`
  - Timeseries `InfluxDB`
  - Search through `Solr`
  - KV Store — `Redis`, `NATS KV`, `Memory`, `SQLite`
  - Cache — `Redis` (with `nats_kv` / `sqlite` / `memory` backends)
  - Pub/Sub — `MQTT`, `NATS`, `Kafka`
  - File Store — `Local`, `S3`, `FTP`, `SFTP`
  - `Authentication` — OAuth, API Key, Basic, Role-Based Access Control (RBAC)
- REST standard out of the box, including Auto CRUD resource handlers
- GraphQL-over-HTTP and Protobuf-over-HTTP
- Structured logging with remote log-level hot reload
- Scheduled tasks (cron), one-off or repeating
- Rate limiter middleware (IP / header / custom-key modes)
- Websockets & HTMX CRUD
- Swagger / OpenAPI rendering
- Application metrics and distributed tracing for observability

The full capability matrix is on [Feature Parity](/parity).
