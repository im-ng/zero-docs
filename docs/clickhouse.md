# ClickHouse

`zero` lets you query **ClickHouse** through the same `ctx.SQL` handle you already
use for Postgres, SQLite, and DuckDB. ClickHouse is a columnar OLAP store, so it
shines for analytics and large scans rather than transactional writes.

`zero` reaches ClickHouse over its **HTTP API** (port `8123`). You don't link any
extra library. The SQL surface is the one you already know.

`ctx.SQL` is **optional**. It stays `null` until you set `CLICKHOUSE_URL`. Always
guard with `if (ctx.SQL) |sql| { ... } else { notConfigured }`.

## Configuration

::: code-group

```bash [configs/.env]
# App configs
APP_ENV=dev
APP_NAME=basic
APP_VERSION=1.0.0
LOG_LEVEL=info
HTTP_PORT=8080

# ClickHouse (columnar OLAP over HTTP)
CLICKHOUSE_URL=http://localhost:8123
CLICKHOUSE_DB=default
# Optional auth
CLICKHOUSE_USER=default
CLICKHOUSE_PASSWORD=
```

:::

| Env                  | Required | Description                              |
| -------------------- | -------- | ---------------------------------------- |
| `CLICKHOUSE_URL`     | yes      | Base URL, e.g. `http://host:8123`.       |
| `CLICKHOUSE_DB`      | no       | Default database for queries.            |
| `CLICKHOUSE_USER`    | no       | Sent as `X-ClickHouse-User` when set.    |
| `CLICKHOUSE_PASSWORD`| no       | Sent as `X-ClickHouse-Key` when set.     |

## API

ClickHouse rides the relational `ctx.SQL` surface. The methods are the ones you
use elsewhere:

```zig
const Row = struct { region: []const u8, revenue: f64 };

// A single row, mapped onto a struct.
const top = (try ctx.SQL.queryRow(
    ctx, Row,
    "select region, sum(amount) from sales group by region order by 2 desc limit 1",
    .{},
)) orelse return ctx.err("no rows");

// Many rows, returned as a slice owned by the request allocator.
const rows = try ctx.SQL.queryRows(ctx, Row, "select * from sales limit 100", .{});
defer ctx.allocator.free(rows);
```

A few behaviors are worth knowing:

- `?` placeholders are interpolated into SQL **literals** (ClickHouse has no native
  prepared statements over HTTP). Single quotes are escaped, so `'o''brien'`
  round-trips safely.
- `queryRow` / `queryRows` append `FORMAT JSON` and parse `{"data": [...]}` into
  your struct.
- `execWithContext` runs DDL/DML. `begin` / `commit` / `rollback` are **no-ops**
  (ClickHouse has no transactions in this path), and `lastInsertRowID` /
  `rowsAffected` return `0`.
- Use `ctx.SQL.lastError()` to read the last failure as text.

## Example handler

```zig [src/main.zig]
pub fn topRegion(ctx: *Context) !void {
    if (ctx.SQL) |sql| {
        const Row = struct { region: []const u8, revenue: f64 };
        const row = (try sql.queryRow(
            ctx, Row,
            "select region, sum(amount) as revenue from sales group by region order by 2 desc limit 1",
            .{},
        )) orelse {
            ctx.response.setStatus(.not_found);
            try ctx.response.json(.{ .message = "no sales yet" }, .{});
            return;
        };
        try ctx.json(.{ .region = row.region, .revenue = row.revenue });
    } else {
        ctx.response.setStatus(.not_implemented);
        try ctx.response.json(.{ .message = "CLICKHOUSE_URL not configured" }, .{});
    }
}
```

## Recommendation

Use the `ctx` allocator whenever you can. It is tied to the request lifecycle, so
`zero` frees it for you and you avoid leaks.

See the implementation in
[`src/datasource/ClickHouse.zig`](https://github.com/im-ng/zero/tree/experimental/src/datasource/ClickHouse.zig).
