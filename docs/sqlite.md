<script setup>
import { ImgComparisonSlider } from '@img-comparison-slider/vue';
</script>

# SQLite

`zero` has built-in support for accessing the **SQLite** database. Unlike Postgres,
SQLite is a local file — no server or container to run — so it is the fastest way to
get a real datasource wired into your app.

The same `ctx.SQL` interface used for Postgres drives SQLite; `zero` routes your calls
to the right backend based on `DB_DIALECT`.

```bash
ctx.SQL.queryRow(); #retrieves one row at a time

ctx.SQL.queryRows(); #retrieve multiple rows at a time

ctx.SQL.exec(); #execute any statements that persist the data

ctx.SQL.select(comptime T: type) #retrieve and transform data to any known comptime T

ctx.SQL.selectSlice(comptime T: type) #retrieve and transform one or more data to any known comptime T
```

With the methods above, database calls are abstracted through the handler `Context` and
achieve the desired results without boilerplate.

## REST Handlers

This example spins up a small app backed by SQLite. There is no container to pull —
just point `DB_DIALECT=sqlite` at a local file.

1. Create the database file and a table.

::: code-group
```sql [SQL Schema]
CREATE TABLE IF NOT EXISTS users(
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 name TEXT NOT NULL
);

INSERT INTO users(name) values ('anu');
```
:::

_You can also automate schema + seed data with [Migrations](./migrations.md) instead of
running this by hand._

2. Update `configs/.env` for SQLite.

::: code-group
```bash [configs/.env]
# App configs
APP_ENV=dev
APP_NAME=basic
APP_VERSION=1.0.0
LOG_LEVEL=info
HTTP_PORT=8080

# Database configs (SQLite — a local file, no server)
DB_DIALECT=sqlite
SQLITE_PATH=./data/app.db
SQLITE_CREATE=true
SQLITE_WRITE=true
SQLITE_THREADING=multi-thread
```
:::

3. A simple `GET` handler that reads from SQLite.

::: code-group
```zig [main.zig]
const std = @import("std");
const zero = @import("zero");

const App = zero.App;
const Context = zero.Context;
const utils = zero.utils;

pub const std_options: std.Options = .{
    .logFn = zero.logger.custom,
};

pub fn main(init: std.process.Init) !void {
    utils.setIo(init.io);
    var arean = std.heap.ArenaAllocator.init(std.heap.page_allocator);
    defer arean.deinit();

    const allocator = arean.allocator();

    const app = try App.new(allocator, init.environ_map);

    try app.get("/db", dbResponse);

    try app.run();
}

pub fn dbResponse(ctx: *Context) !void {
    const User = struct {
        id: i64,
        name: []const u8,
    };

    var row = try ctx.SQL.queryRow("select id, name from users limit 1", .{}) orelse unreachable;
    defer row.deinit() catch {};

    const user = try row.to(User, .{});

    try ctx.json(user);
}
```
:::

4. Boom! Build and run.

```bash
zero/examples/zero-sqlite on experimental via ↯ v0.16.0
❯
❯ zig build sqlite
 INFO Loaded config from file: ./configs/.env
 INFO generating database connection string for sqlite
 INFO connected to sqlite database at './data/app.db'
 DEBUG redis is disabled, as redis host is not provided.
 DEBUG pubsub is disabled, as pubsub mode is not provided.
 INFO container is being created
 INFO no authentication mode found and disabled.
 INFO sqlite app pid 21205
 INFO registered static files from directory ./static
 INFO Starting server on port: 8080
 INFO 019a429a-ca35-7000-8334-d2df6ff40559  200 1ms GET /db
```

5. Preview server status and handler response.

<ImgComparisonSlider>
<!-- eslint-disable -->
<img
    slot="first"
    style="width: 100%"
    src="./public/preview-db-connection.webp"
/>
<img
    slot="second"
    style="width: 100%"
    src="./public/preview-db-data.webp"
/>
<!-- eslint-enable -->
</ImgComparisonSlider>

_Make use of this image slider to glide between status and response_

This is just a beginning — the full CRUD lifecycle (insert with `?` placeholders,
`ctx.SQL.lastInsertRowID()`, `ctx.SQL.rowsAffected()`) is shown in the
[`zero-sqlite`](https://github.com/im-ng/zero/tree/experimental/examples/zero-sqlite)
example. More on [HTMX](./htmx-crud.md).

## Transactions

`ctx.SQL` exposes `begin()` / `commit()` / `rollback()` so you can group statements on
a single pinned connection. Begin a transaction, run your statements, then commit — and
roll back on error:

```zig [src/main.zig]
pub fn transfer(ctx: *Context) !void {
    try ctx.SQL.begin();
    errdefer ctx.SQL.rollback() catch {};

    try ctx.SQL.exec("update accounts set balance = balance - 100 where id = 1", .{});
    try ctx.SQL.exec("update accounts set balance = balance + 100 where id = 2", .{});

    try ctx.SQL.commit();
}
```

Each statement also carries a default **30s per-statement timeout**. The SQLite
datasource can be wrapped in a circuit breaker with `SQL_CIRCUIT_BREAKER_ENABLE=true`
(trips open after 5 consecutive failures, returning `error.CircuitOpen`) — see
[Resilience → Circuit breakers](/resilience#circuit-breakers).

## Recommendation

🚩 It is highly recommended to use the `ctx` allocator whenever possible, since it is tied up with request life-cycle, the de-allocation will be managed automatically and making sure the memory leak is not happening.
