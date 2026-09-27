# Cassandra

`zero` reaches **Cassandra** through the type-erased `ctx.NoSQL` handle. Cassandra
is a wide-column store built for high write throughput and horizontal scale.

This page focuses on the **wire protocol**: how `zero` actually talks to
Cassandra, and what that means for the API you write against.

::: warning
Cassandra access via `zero` is **experimental**. The API and config keys may
change between releases. It auto-wires whenever `CASSANDRA_CONTACT_POINTS` is
set — there's no separate feature flag.
:::

## The wire protocol

`zero` ships a **pure-Zig Cassandra client** — no C driver, no Java, no extra
dependency. It speaks the **Apache Cassandra native binary CQL protocol, version
4** directly over `std.Io.net`:

- **STARTUP / AUTH handshake** — `zero` announces `CQL_VERSION=3.0.0`, and when
  credentials are set it runs the SASL-style `AUTH_RESPONSE` handshake
  (`user\0pass`).
- **QUERY** — every `get` / `put` / `delete` / `query` becomes a binary CQL
  `QUERY` frame at consistency `ONE`, with no bound values.
- **Rows parsing** — `zero` reads the binary result set and hands you the data
  as text.
- **Keyspace selection** — right after the handshake, `zero` issues `USE
  {keyspace}`, so your statements don't have to qualify it every time.

So `zero` is a real CQL client on the wire. You write CQL; `zero` frames it.

## Configuration

::: code-group

```bash [configs/.env]
# App configs
APP_ENV=dev
APP_NAME=basic
APP_VERSION=1.0.0
LOG_LEVEL=info
HTTP_PORT=8080

# Cassandra (wide-column / NoSQL, CQL native protocol v4)
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
| `CASSANDRA_KEYSPACE`       | yes      | Keyspace to connect to (issued as `USE`).|
| `CASSANDRA_USER`           | no       | Auth username.                          |
| `CASSANDRA_PASSWORD`       | no       | Auth password.                          |

`ctx.NoSQL` is **optional**. It stays `null` until you set
`CASSANDRA_CONTACT_POINTS`. Always guard with
`if (ctx.NoSQL) |n| { ... } else { notConfigured }`.

## API

The `NoSQL` handle works like `ctx.SQL`, but every verb now takes a **full CQL
statement** — you build the query, and `zero` sends it verbatim.

```zig
// Insert or update a row (result discarded).
try ctx.NoSQL.put(ctx, "INSERT INTO users (id, data) VALUES ('alice', '{ \"name\": \"alice\" }')");

// Fetch one row; returns the first column of the first row, or null.
const doc = try ctx.NoSQL.get(ctx, "SELECT data FROM users WHERE id = 'alice'");

// Delete a row (result discarded).
try ctx.NoSQL.delete(ctx, "DELETE FROM users WHERE id = 'alice'");

// Run any CQL; returns the rows as a JSON array.
const raw = try ctx.NoSQL.query(ctx, "SELECT id, data FROM users LIMIT 50");
```

Returned `[]const u8` slices are allocated on the request allocator. Free them
with `defer ctx.allocator.free(slice)` if you keep the reference past the call.
Otherwise `zero` frees them when the handler ends. Use
`ctx.NoSQL.lastError()` to read the last failure as text (available for
Cassandra, Couchbase, and MongoDB backends).

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
            "INSERT INTO users (id, data) VALUES ('{s}', '{s}')",
            .{ key, value },
        );
        defer ctx.allocator.free(stmt);
        try n.put(ctx, stmt);
        try ctx.response.json(.{ .status = "stored", .key = key }, .{});
    } else {
        ctx.response.setStatus(.not_implemented);
        try ctx.response.json(.{ .message = "CASSANDRA_CONTACT_POINTS not configured" }, .{});
    }
}

pub fn getUser(ctx: *Context) !void {
    if (ctx.NoSQL) |n| {
        const key = ctx.request.params.get("key") orelse return;
        const stmt = try std.fmt.allocPrint(
            ctx.allocator,
            "SELECT data FROM users WHERE id = '{s}'",
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

## Caveats

- **Experimental / alpha.** The statement shape may change between releases.
- **Full CQL, your responsibility.** `zero` sends exactly what you write. Bad
  CQL fails at the server and surfaces through `lastError()`.
- **No feature flag.** Set `CASSANDRA_CONTACT_POINTS` and it's live; leave it
  unset and `zero` creates nothing.

See the runnable
[`zero-nosql`](https://github.com/im-ng/zero/tree/experimental/examples/zero-nosql)
example and the client implementation in
[`src/datasource/cassandra_client.zig`](https://github.com/im-ng/zero/tree/experimental/src/datasource/cassandra_client.zig).
