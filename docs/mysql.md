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
```

There is no `DB_SSL_MODE` — the MySQL client has no TLS support yet.

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

## Caveats

- **One shared connection.** MySQL uses a single connection for the whole process. Concurrent requests share it, so `begin` / `commit` / `rollback` run on that shared connection and are not isolated per request. Avoid long transactions under concurrency.
- **`mysql_native_password` only.** `caching_sha2_password` is not supported — set your user to the native password plugin.
- **No shipped example or migration yet.** The `ctx.SQL` usage is identical to Postgres; follow the [Using Postgres](/rest-handler) guide and swap the dialect.

See the implementation in [src/datasource/sql/mysql.zig](https://github.com/im-ng/zero/tree/experimental/src/datasource/sql/mysql.zig).
