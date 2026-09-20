# Cassandra

`zero` gives you access to **Cassandra** and other wide-column or document stores through a single, type-erased `ctx.NoSQL` handle.

These calls are the same no matter which NoSQL backend you configure. Swapping backends later means changing a config value, not your code. More backends like MongoDB are planned; you add them in `src/datasource/nosqlInterface.zig`.

`ctx.NoSQL` is **optional**. It is `null` until you set `CASSANDRA_CONTACT_POINTS`, so always guard with `if (ctx.NoSQL) |n| { ... } else { notConfigured }`.

## Configuration

::: code-group

```bash [configs/.env]
# App configs
APP_ENV=dev
APP_NAME=basic
APP_VERSION=1.0.0
LOG_LEVEL=info
HTTP_PORT=8080

# Cassandra (wide-column / NoSQL)
CASSANDRA_CONTACT_POINTS=127.0.0.1:9042
CASSANDRA_KEYSPACE=zero_demo
# Optional auth
CASSANDRA_USER=cassandra
CASSANDRA_PASSWORD=cassandra
```

:::

| Env                        | Required | Description                             |
| -------------------------- | -------- | --------------------------------------- |
| `CASSANDRA_CONTACT_POINTS` | yes      | Comma-separated `host:port` seed nodes. |
| `CASSANDRA_KEYSPACE`       | yes      | Keyspace to connect to.                 |
| `CASSANDRA_USER`           | no       | Auth username.                          |
| `CASSANDRA_PASSWORD`       | no       | Auth password.                          |

## API

The `NoSQL` handle works like `ctx.SQL`. It gives you a small, uniform set of verbs over a collection or key model:

```zig
try ctx.NoSQL.put(ctx, "users", "alice", "{ \"name\": \"alice\" }");   // upsert
const doc = try ctx.NoSQL.get(ctx, "users", "alice");                 // ?[]const u8
try ctx.NoSQL.delete(ctx, "users", "alice");                         // remove
const raw = try ctx.NoSQL.query(ctx, "users", "SELECT data FROM zero_demo.users LIMIT 50"); // raw CQL
```

Returned `[]const u8` slices are allocated on the request allocator. Free them with `defer ctx.allocator.free(slice)` if you keep the reference past the call. Otherwise the request-scoped allocator frees them when the handler ends.

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
        try n.put(ctx, "users", key, value);
        try ctx.response.json(.{ .status = "stored", .key = key }, .{});
    } else {
        ctx.response.setStatus(.not_implemented);
        try ctx.response.json(.{ .message = "CASSANDRA_CONTACT_POINTS not configured" }, .{});
    }
}

pub fn getUser(ctx: *Context) !void {
    if (ctx.NoSQL) |n| {
        const key = ctx.request.params.get("key") orelse return;
        if (try n.get(ctx, "users", key)) |doc| {
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

Use the `ctx` allocator whenever you can. It is tied to the request lifecycle, so `zero` releases its memory automatically and you avoid leaks.

See the runnable
[`zero-nosql`](https://github.com/im-ng/zero/tree/experimental/examples/zero-nosql)
example and the implementation in
[`src/datasource/cassandra.zig`](https://github.com/im-ng/zero/tree/experimental/src/datasource/cassandra.zig).
