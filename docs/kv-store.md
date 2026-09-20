# KV Store

`zero` gives you a single, type-erased **KV store**, so your handlers don't tie to one backend. When Redis is configured, the Redis client auto-registers as the default store. You register any extra stores at startup.

See [`examples/zero-redis`](https://github.com/im-ng/zero/tree/experimental/examples/zero-redis)
and [`examples/zero-nats-publisher`](https://github.com/im-ng/zero/tree/experimental/examples/zero-nats-publisher)
for runnable examples.

## Backends

| Backend    | Notes                                                                          |
| ---------- | ------------------------------------------------------------------------------ |
| `.redis`   | okredis — the default store when Redis is configured                           |
| `.nats_kv` | NATS JetStream KV (reuses the `nats` dependency; needs a JetStream connection) |
| `.memory`  | in-memory, zero dependencies — handy for tests                                 |
| `.sqlite`  | reuses the SQLite datasource (`kv(k,v,exp)` table)                             |

## Register stores

```zig [src/main.zig]
const std = @import("std");
const zero = @import("zero");

const App = zero.App;
const Context = zero.Context;
const utils = zero.utils;

pub fn main(init: std.process.Init) !void {
    var gpa: std.heap.DebugAllocator(.{}) = .init;
    const allocator = gpa.allocator();
    const app = try App.new(allocator, init.io, init.environ_map);

    // backend: .redis | .nats_kv | .memory | .sqlite
    try app.addKVStore("feature-flags", .memory, .{});
    try app.addKVStore("sessions", .nats_kv, .{ .bucket = "sessions" });

    try app.run();
}
```

## Use a store in a handler

```zig [src/main.zig]
pub fn handler(ctx: *Context) !void {
    // default store (Redis when configured), or a named store
    const kv = ctx.KV orelse ctx.GetKVStore("sessions") orelse return error.NoKV;
    try kv.set(ctx, "user:1", "active");

    const v = try kv.get(ctx, "user:1");      // ?[]const u8, caller-owned (free with ctx.allocator)
    defer if (v) |s| ctx.allocator.free(s);

    const has = try kv.exists(ctx, "user:1");

    try kv.delete(ctx, "user:1");

    try kv.expire(ctx, "user:1", 60_000);     // ms; unsupported on nats_kv
}
```

## Circuit breaker

The cache store (including the default `cache` store) can sit behind a circuit breaker. Turn it on with `CACHE_CIRCUIT_BREAKER_ENABLE=true`.

The breaker trips after `5` consecutive failures and stays open for `30s`. While it's open, cache calls return `error.CircuitOpen` instead of stacking up against a backend that's already unhealthy.

See [Resilience → Circuit breakers](/resilience#circuit-breakers) for
the shared behavior and the `app_circuit_open_total` metric.
