# MySQL

`zero` speaks the native MySQL wire protocol, so you can use MySQL as a `ctx.SQL` backend without a C driver. The client is pure Zig and authenticates with `mysql_native_password`.

It rides the same `ctx.SQL` handle as Postgres, SQLite, DuckDB, and ClickHouse, so every query helper you already use works here.

## Configuration

```bash [configs/.env]
DB_DIALECT=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=zero
DB_PASSWORD=zero
DB_NAME=demo
MYSQL_POOL_SIZE=10            # connection pool size (default 10)
MYSQL_SSL_MODE=disabled       # disabled | preferred | required
MYSQL_SSL_CA=                # CA path; required when MYSQL_SSL_MODE=required
```

MySQL supports TLS. `MYSQL_SSL_MODE` is `disabled` (default), `preferred` (use TLS when the server offers it), or `required` (refuse to connect without TLS). When `required`, set `MYSQL_SSL_CA` to the CA certificate path.

## API

`ctx.SQL` is unchanged. Build structs and call the same methods:

```zig [src/main.zig]
pub fn listUsers(ctx: *Context) !void {
    const users = try ctx.SQL.queryRows(ctx, User, "SELECT id, name, email FROM users", .{});
    defer ctx.allocator.free(users);
    try ctx.json(users);
}
```

`?` is the placeholder and values are interpolated into the statement string (there are no bound parameters). `lastInsertRowID()` and `rowsAffected()` are populated.

MySQL runs as a **connection pool** (size `MYSQL_POOL_SIZE`, default 10). Each request borrows a session from the pool, so concurrent requests never share a socket — and `begin` / `commit` / `rollback` pin that one connection for the transaction, giving you per-request isolation.

## Caveats

- **`mysql_native_password` only.** `caching_sha2_password` is not supported — set your user to the native password plugin.
- **No shipped example or migration yet.** The `ctx.SQL` usage is identical to Postgres; follow the [Using Postgres](/rest-handler) guide and swap the dialect.
- **TLS handshake.** The auth handshake follows the reference Go driver: credentials are sent in the SSL-request packet, then the TLS handshake runs and all subsequent traffic is encrypted.

See the implementation in [src/datasource/sql/mysql.zig](https://github.com/im-ng/zero/tree/experimental/src/datasource/sql/mysql.zig).
