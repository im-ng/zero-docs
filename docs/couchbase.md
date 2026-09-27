# Couchbase

`zero` lets you reach **Couchbase** through the same type-erased `ctx.NoSQL`
handle you use for Cassandra. Couchbase is a distributed document store. With
`zero`, you talk to it in **N1QL** (its SQL-like query language) over HTTP.

`ctx.NoSQL` is **optional**. It stays `null` until you set
`COUCHBASE_CONTACT_POINTS`. Always guard with
`if (ctx.NoSQL) |n| { ... } else { notConfigured }`.

## Configuration

::: code-group

```bash [configs/.env]
# App configs
APP_ENV=dev
APP_NAME=basic
APP_VERSION=1.0.0
LOG_LEVEL=info
HTTP_PORT=8080

# Couchbase (document store, N1QL over HTTP)
COUCHBASE_CONTACT_POINTS=127.0.0.1:8091
COUCHBASE_BUCKET=zero_demo
# Optional auth
COUCHBASE_USER=Administrator
COUCHBASE_PASSWORD=password
```

:::

| Env                       | Required | Description                                  |
| ------------------------- | -------- | -------------------------------------------- |
| `COUCHBASE_CONTACT_POINTS`| yes      | Comma-separated `host:port` seed nodes.      |
| `COUCHBASE_BUCKET`        | yes      | Bucket; maps to the NoSQL `keyspace`.        |
| `COUCHBASE_USER`          | no       | Auth username (HTTP Basic).                  |
| `COUCHBASE_PASSWORD`      | no       | Auth password (HTTP Basic).                  |

## API

`ctx.NoSQL` speaks the same verbs for every backend. The `statement` you pass is
a **full N1QL string** — you build the query, and `zero` sends it.

```zig
// Insert or replace a document via N1QL UPSERT.
try ctx.NoSQL.put(ctx, "UPSERT INTO users (KEY, VALUE) VALUES ('alice', { \"name\": \"alice\" })");

// Fetch one document; returns the first result row or null.
const doc = try ctx.NoSQL.get(ctx, "SELECT RAW u FROM users u WHERE META(u).id = 'alice'");

// Run an arbitrary N1QL query; returns the results array as JSON.
const raw = try ctx.NoSQL.query(ctx, "SELECT u.* FROM users u LIMIT 50");
```

Returned `[]const u8` slices are allocated on the request allocator. Free them
with `defer ctx.allocator.free(slice)` if you keep the reference past the call.
Otherwise `zero` frees them when the handler ends.

## Example handler

```zig [src/main.zig]
pub fn putUser(ctx: *Context) !void {
    if (ctx.NoSQL) |n| {
        const key = ctx.request.params.get("key") orelse {
            ctx.response.setStatus(.bad_request);
            try ctx.response.json(.{ .message = "missing :key" }, .{});
            return;
        };
        const value = ctx.request.body() orelse "";
        const stmt = try std.fmt.allocPrint(
            ctx.allocator,
            "UPSERT INTO users (KEY, VALUE) VALUES ('{s}', {s})",
            .{ key, value },
        );
        defer ctx.allocator.free(stmt);
        try n.put(ctx, stmt);
        try ctx.response.json(.{ .status = "stored", .key = key }, .{});
    } else {
        ctx.response.setStatus(.not_implemented);
        try ctx.response.json(.{ .message = "COUCHBASE_CONTACT_POINTS not configured" }, .{});
    }
}

pub fn getUser(ctx: *Context) !void {
    if (ctx.NoSQL) |n| {
        const key = ctx.request.params.get("key") orelse return;
        const stmt = try std.fmt.allocPrint(
            ctx.allocator,
            "SELECT RAW u FROM users u WHERE META(u).id = '{s}'",
            .{key},
        );
        defer ctx.allocator.free(stmt);
        if (try n.get(ctx, stmt)) |doc| {
            defer ctx.allocator.free(doc);
            try ctx.response.json(.{ .key = key, .doc = doc }, .{});
        } else {
            ctx.response.setStatus(.not_found);
            try ctx.response.json(.{ .message = "not found" }, .{});
        }
    }
}
```

## Recommendation

Use the `ctx` allocator whenever you can. It is tied to the request lifecycle, so
`zero` releases its memory automatically and you avoid leaks.

See the implementation in
[`src/datasource/couchbase.zig`](https://github.com/im-ng/zero/tree/experimental/src/datasource/couchbase.zig).
