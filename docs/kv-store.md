# KV Store

`zero` exposes a unified, type-erased **KV store** so handlers don't depend on a
specific backend. The Redis client (when configured) is auto-registered as the
default store; additional stores are registered at startup.

See [`examples/zero-redis`](https://github.com/im-ng/zero/tree/experimental/examples/zero-redis)
and [`examples/zero-nats-publisher`](https://github.com/im-ng/zero/tree/experimental/examples/zero-nats-publisher)
for runnable examples.

## Backends

| Backend    | Notes                                                                 |
| ---------- | --------------------------------------------------------------------- |
| `.redis`   | okredis — the default store when Redis is configured                   |
| `.nats_kv` | NATS JetStream KV (reuses the `nats` dependency; needs a JetStream connection) |
| `.memory`  | in-memory, zero dependencies — handy for tests                         |
| `.sqlite`  | reuses the SQLite datasource (`kv(k,v,exp)` table)                     |

## Register stores

```zig [src/main.zig]
const std = @import("std");
const zero = @import("zero");

const App = zero.App;
const Context = zero.Context;
const utils = zero.utils;

pub fn main(init: std.process.Init) !void {
    utils.setIo(init.io);
    var gpa: std.heap.DebugAllocator(.{}) = .init;
    const allocator = gpa.allocator();
    const app = try App.new(allocator, init.environ_map);

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

The cache store (including the default `cache` store) can be wrapped in a circuit
breaker. Enable it with `CACHE_CIRCUIT_BREAKER_ENABLE=true`. The breaker opens after
`5` consecutive failures and stays open for `30s` (cooldown); while open, cache calls
return `error.CircuitOpen` instead of piling up against an unhealthy backend. See
[Resilience → Circuit breakers](/resilience#circuit-breakers) for the shared behavior
and the `app_circuit_open_total` metric.
