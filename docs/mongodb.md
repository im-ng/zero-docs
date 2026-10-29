# MongoDB

`zero` reaches **MongoDB** through the same `ctx.NoSQL` handle you use for
Cassandra and Couchbase. You talk to it in **MongoDB command documents** (JSON),
not N1QL or CQL.

This page focuses on the **wire protocol**: how `zero` actually speaks to
MongoDB on the wire, and what that means for you.

::: tip Experimental
This backend passes burst and benchmark loads, but has not been soak-tested at large production scale. Use it with caution. If we find leaks or other stability issues, the API or config keys may change.

It auto-wires whenever `MONGODB_CONTACT_POINTS` is set. There's no separate feature flag.
:::

## Quickstart

Spin up a local MongoDB with auth and TLS:

```bash
podman run -d \
  --name mongodb-tls \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password \
  -v mongo_data:/data/db \
  -v ./mongod.conf:/etc/mongod.conf:Z \
  -v ./certs:/etc/ssl/mongodb:Z,ro \
  docker.io/mongo:latest \
  mongod --config /etc/mongod.conf
```

## The wire protocol

`zero` ships a **pure-Zig MongoDB client** — no C driver, no extra dependency. It
speaks the **MongoDB wire protocol** directly over `std.Io.net`:

- **OP_MSG (opcode `2013`)** — the modern MongoDB message format, used for every
  command. `zero` builds the 16-byte header, serializes your JSON command to
  BSON, sends it, and parses the BSON reply back into JSON.
- **SCRAM-SHA-256** — when you set a username and password, `zero` runs the
  SCRAM handshake (`saslStart` → `saslContinue`) to authenticate.
- **Optional TLS** — turn it on with `MONGODB_TLS=true`; `zero` layers
  `std.crypto.tls.Client` over the connection and can verify the server
  certificate.
- **MongoDB 5.0+** — `zero` only uses OP_MSG, so older servers that lack it are
  not supported.

So `zero` is a real MongoDB client on the wire, not a wrapper around `mongosh`
or a sidecar.

## Configuration

::: code-group

```bash [configs/.env]
# App configs
APP_ENV=dev
APP_NAME=basic
APP_VERSION=1.0.0
LOG_LEVEL=info
HTTP_PORT=8080

# MongoDB (experimental, OP_MSG wire protocol)
MONGODB_CONTACT_POINTS=127.0.0.1:27017
MONGODB_DB=zero_demo
# Optional auth
MONGODB_USER=
MONGODB_PASSWORD=
# Optional TLS
MONGODB_TLS=false
MONGODB_TLS_VERIFY=false
MONGODB_TLS_CA=
# Optional mTLS
MONGODB_TLS_SERVER_NAME=
MONGODB_TLS_CERT_FILE=
MONGODB_TLS_KEY_FILE=
# Auth source (defaults to admin)
MONGODB_AUTH_SOURCE=admin
```

:::

| Env                     | Required | Description                                      |
| ----------------------- | -------- | ------------------------------------------------ |
| `MONGODB_CONTACT_POINTS`| yes      | Comma-separated `host:port` seed nodes.          |
| `MONGODB_DB`            | yes      | Default database for commands.                   |
| `MONGODB_USER`          | no       | Auth username (SCRAM-SHA-256).                   |
| `MONGODB_PASSWORD`      | no       | Auth password (SCRAM-SHA-256).                   |
| `MONGODB_TLS`           | no       | `true` to enable TLS.                            |
| `MONGODB_TLS_VERIFY`    | no       | `true` to verify the server certificate.         |
| `MONGODB_TLS_CA`        | no       | CA cert path for verification.                   |
| `MONGODB_TLS_SERVER_NAME`| no      | SNI / expected certificate name.                 |
| `MONGODB_TLS_CERT_FILE` | no       | Client cert for mTLS.                            |
| `MONGODB_TLS_KEY_FILE`  | no       | Client key for mTLS.                             |
| `MONGODB_AUTH_SOURCE`   | no       | Auth source DB (defaults to `admin`).            |
| `MONGODB_TLS_SERVER_NAME`| no      | SNI / expected certificate name.                 |
| `MONGODB_TLS_CERT_FILE` | no       | Client cert for mTLS.                            |
| `MONGODB_TLS_KEY_FILE`  | no       | Client key for mTLS.                             |

::: info TLS out of the box
MongoDB supports TLS. Set `MONGODB_TLS=true`, and with `MONGODB_TLS_VERIFY=true` the server certificate is verified against `MONGODB_TLS_CA`. For mutual TLS, also set `MONGODB_TLS_CERT_FILE` / `MONGODB_TLS_KEY_FILE`. On macOS, the TLS client links OpenSSL. `brew install openssl` if the linker can't find it.
:::

## API

MongoDB is wired into `ctx.NoSQL` as backend `.mongodb`. The verbs are the same
`get` / `put` / `delete` / `query`, but the `statement` is a **JSON MongoDB
command**.

```zig
// Insert a document (the command is sent verbatim over OP_MSG).
try ctx.NoSQL.put(ctx, "{\"insert\": \"users\", \"documents\": [{\"_id\": \"alice\", \"name\": \"alice\"}]}");

// Find one document; returns the raw reply or null.
const reply = try ctx.NoSQL.get(ctx, "{\"find\": \"users\", \"filter\": {\"_id\": \"alice\"}}");

// Run any command; returns the JSON reply.
const raw = try ctx.NoSQL.query(ctx, "{\"aggregate\": \"users\", \"pipeline\": [...], \"cursor\": {}}");
```

`put` and `delete` run the command and discard the reply. `get` returns the reply
(or `null`). `query` returns the full JSON reply. Use `ctx.NoSQL.lastError()` to
read the last failure as text.

## Example handler

```zig [src/main.zig]
pub fn putUser(ctx: *Context) !void {
    if (ctx.NoSQL) |n| {
        const key = ctx.request.params.get("key") orelse {
            ctx.response.setStatus(.bad_request);
            try ctx.response.json(.{ .message = "missing :key" }, .{});
            return;
        };
        const value = ctx.request.body() orelse "{}";
        const cmd = try std.fmt.allocPrint(
            ctx.allocator,
            "{{\"insert\": \"users\", \"documents\": [{{\"_id\": \"{s}\", \"doc\": {s}}}]}}",
            .{ key, value },
        );
        defer ctx.allocator.free(cmd);
        try n.put(ctx, cmd);
        try ctx.response.json(.{ .status = "stored", .key = key }, .{});
    } else {
        ctx.response.setStatus(.not_implemented);
        try ctx.response.json(.{ .message = "MONGODB_CONTACT_POINTS not configured" }, .{});
    }
}
```

## Caveats

- **Experimental / alpha.** The command shape may change between releases.
- **JSON, not a typed API.** You build the MongoDB command document yourself,
  the same way you would against the wire protocol directly.
- **No feature flag.** Set `MONGODB_CONTACT_POINTS` and it's live; leave it unset
  and `zero` creates nothing.
- **`dropCollection(name)`.** Drops a collection. Implemented for MongoDB; other
  NoSQL backends return `NoSQLBackendNotImplemented`.

See the runnable
[`zero-mongodb`](https://github.com/im-ng/zero/tree/experimental/examples/zero-mongodb)
example and the implementation in
[`src/datasource/mongodb.zig`](https://github.com/im-ng/zero/tree/experimental/src/datasource/mongodb.zig).
