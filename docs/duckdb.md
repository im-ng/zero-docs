# DuckDB

`zero` ships an in-process **DuckDB** OLAP engine as a first-class SQL dialect. It runs
embedded in your process, so there is no server and no container to manage. It is ideal for
analytics, reporting, and local data munging. It reuses the same `ctx.SQL` interface you
already use for Postgres and SQLite.

`zero` links DuckDB through `libs/libduckdb.so` at build time. There is no runtime service
to operate.

## Configuration

`zero` wires DuckDB in automatically when you set `DUCKDB_PATH`. The shared `DB_DIALECT`-based
`ctx.SQL` handle is then backed by DuckDB, so every `ctx.SQL.*` call routes to it
transparently.

::: code-group
```bash [configs/.env]
# App configs
APP_ENV=dev
APP_NAME=basic
APP_VERSION=1.0.0
LOG_LEVEL=info
HTTP_PORT=8080

# DuckDB (in-process OLAP). Use :memory: for an in-memory database,
# or a file path (e.g. ./data/analytics.duckdb) for persistence.
DUCKDB_PATH=./data/analytics.duckdb

# Optional: wrap SQL calls in a circuit breaker
SQL_CIRCUIT_BREAKER_ENABLE=true
```
:::

> You do **not** set `DB_DIALECT` for DuckDB — the dialect is chosen automatically when
> `DUCKDB_PATH` is present. If you also set `DB_DIALECT=postgres`/`sqlite`, start only one
> SQL backend per process.

## Usage

DuckDB rides on `ctx.SQL`, so its API is identical to the other SQL dialects:

```zig [src/main.zig]
pub fn analytics(ctx: *Context) !void {
    const Row = struct { region: []const u8, revenue: f64 };

    // DuckDB speaks full ANSI SQL — including analytics functions.
    const top = try ctx.SQL.queryRow(
        ctx,
        Row,
        "select region, sum(amount) from sales group by region order by 2 desc limit 1",
        .{},
    ) orelse unreachable;

    try ctx.json(top);
}
```

`ctx.SQL` exposes the same surface as Postgres and SQLite. That includes `queryRow`,
`queryRows`, `exec`, `select`, `selectSlice`, `lastInsertRowID`, `rowsAffected`, and
`begin` / `commit` / `rollback` transactions. So the [SQLite](./sqlite.md) and [Using
Postgres](./rest-handler.md) guides apply directly.

## Recommendation

Use the `ctx` allocator wherever possible. It is tied to the request lifecycle, so its memory
is released automatically and you avoid leaks.

The full CRUD and transaction lifecycle is shown in the
[`zero-sqlite`](https://github.com/im-ng/zero/tree/experimental/examples/zero-sqlite)
example, using the same `ctx.SQL` calls. The OLAP dialect is wired in
[`src/datasource/DuckDB.zig`](https://github.com/im-ng/zero/tree/experimental/src/datasource/DuckDB.zig).
