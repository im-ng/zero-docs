<script setup>
import { ImgComparisonSlider } from '@img-comparison-slider/vue';
</script>

# Postgres

`zero` has built-in support for the accessing the postgres database.

```bash
ctx.SQL.queryRow(ctx, comptime T: type, query, args);        # retrieves one row, returns ?T
ctx.SQL.queryRows(ctx, comptime T: type, query, args);       # retrieve multiple rows, returns []T
ctx.SQL.exec(ctx, query, args);                              # execute any statements that persist the data
ctx.SQL.select(ctx, comptime T: type, query, args);          # retrieve and transform one row to comptime T
ctx.SQL.selectSlice(ctx, comptime T: type, list, query, args); # retrieve and transform rows into a slice of T
```

With above mentioned method, the databse calls are abstracted, and leveraged through handler `Context` and achieves the desired results without any boiler-plate.

Typically we use the underlying database to perform the actions based on the app REST handlers, that can be attached and get the CRUD operation done.

## REST Handlers

This example demonstrates the first step to spin up the `zero-basic` web app using the `zero` framework.

As we are going to connect to database and retrieve needed database container as follows:

1. Pull and run podman or docker container.

::: code-group

```bash [postgres container]
❯ podman pull docker.io/library/postgres:17-alpine3.21
❯ podman run -d --name pg17 -e POSTGRES_USER=user1 -e POSTGRES_PASSWORD=password1 -v podman:/var/lib/postgresql/data -p 5432:5432 postgres:17-alpine3.21
```

:::

2. Create new database and tables.

::: code-group

```sql [SQL Schema]
CREATE DATABASE demo;

CREATE TABLE users(
 id SERIAL PRIMARY KEY,
 name VARCHAR(100)
);

INSERT INTO users(name) values ('anu');
```

:::

_Please bear with this step to try out things manually in database this one time._

_But `zero` framework provides option to automate and add migrations/data systematically. More on [Migrations](./migrations.md)_

3. Let us update our basic app configurations `configs/.env` with this.

::: code-group

```bash [configs/.env]
# App configs
APP_ENV=dev #zero framework tries to override .dev.env if it availables
APP_NAME=basic
APP_VERSION=1.0.0
LOG_LEVEL=info #default level of zero framwork
HTTP_PORT=8080 #default port of zero framwork

# Database configs
DB_HOST=localhost
DB_USER=user1
DB_PASSWORD=password1
DB_NAME=demo
DB_PORT=5432
DB_DIALECT=postgres
```

:::

4. Refer following simple `GET` rest handler to retrieve our data from database.

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
    var arean = std.heap.ArenaAllocator.init(std.heap.page_allocator);
    defer arean.deinit();

    const allocator = arean.allocator();

    const app = try App.new(allocator, init.io, init.environ_map);

    try app.get("/db", dbResponse);

    try app.run();
}

pub fn dbResponse(ctx: *Context) !void {
    const User = struct {
        id: i32,
        name: []const u8,
    };

    const user = try ctx.SQL.queryRow(ctx, User, "select id, name from users limit 1", .{}) orelse unreachable;

    try ctx.json(user);
}
```

:::

4. Boom! Lets build and run our app.

```bash
zero/examples/zero-basic on main via ↯ v0.15.1
❯
❯ zig build basic
 INFO [03:27:08] Loaded config from file: ./configs/.env
 INFO [03:27:09] generating database connection string for postgres
 INFO [03:27:09] connected to user1 user to demo database at 'localhost:5432'
DEBUG [03:27:09] redis is disabled, as redis host is not provided.
DEBUG [03:27:09] pubsub is disabled, as pubsub mode is not provided.
 INFO [03:27:09] container is being created
 INFO [03:27:09] no authentication mode found and disabled.
 INFO [03:27:09] basic-overriden app pid 21205
 INFO [03:27:09] registered static files from directory ./static
 INFO [03:27:09] Starting server on port: 8081
 INFO [03:27:11] 019a429a-ca35-7000-8334-d2df6ff40559	 200 2ms GET /db

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

In this demo, we successully created database, added basic information, connected from zero framework app and retrieved the data as intented. This is just a beginning, we can do more and explained in [HTMX](./htmx-crud.md) example.

## Transactions

`ctx.SQL` exposes `begin()` / `commit()` / `rollback()` so you can group statements on a
single pinned connection. Begin a transaction, run your statements, then commit — and
roll back on error:

```zig [src/main.zig]
pub fn transfer(ctx: *Context) !void {
    try ctx.SQL.begin();
    errdefer ctx.SQL.rollback() catch {};

    try ctx.SQL.exec(ctx, "update accounts set balance = balance - 100 where id = 1", .{});
    try ctx.SQL.exec(ctx, "update accounts set balance = balance + 100 where id = 2", .{});

    try ctx.SQL.commit();
}
```

Each statement also carries a default **30s per-statement timeout**. The SQL datasource
can be wrapped in a circuit breaker with `SQL_CIRCUIT_BREAKER_ENABLE=true` (trips open
after 5 consecutive failures, returning `error.CircuitOpen`) — see
[Resilience → Circuit breakers](/resilience#circuit-breakers).

## Recommendation

🚩 It is highly recommended to use the `ctx` allocator whenever possible, since it is tied up with request life-cycle, the de-allocation will be managed automatically and making sure the memory leak is not happening.
