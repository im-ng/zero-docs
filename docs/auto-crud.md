# Auto CRUD

`zero` can scaffold REST handlers for a struct in one line, using the `addRestHandlers` fn.

See [`examples/zero-autocrud`](https://github.com/im-ng/zero/tree/experimental/examples/zero-autocrud) for a runnable example.

## Generate the handlers

```zig [src/main.zig]
const std = @import("std");
const zero = @import("zero");

const App = zero.App;
const Context = zero.Context;
const utils = zero.utils;

const User = struct { id: i64, name: []const u8, email: []const u8 };

pub fn main(init: std.process.Init) !void {
    var gpa: std.heap.DebugAllocator(.{}) = .init;
    const allocator = gpa.allocator();

    const app = try App.new(allocator, init.io, init.environ_map);

    // One line wires up list / get / create / update / delete for `User`.
    try app.addRestHandlers(User, .{ .resource = "users" });

    try app.run();
}
```

This registers:

```bash
GET    /users        # list   (LIMIT 100)
GET    /users/:id    # get one
POST   /users        # create (body -> struct, 201)
PUT    /users/:id    # update (re-selects and returns the row)
DELETE /users/:id    # delete (204-style {deleted: n})
```

The generated SQL is emitted for **Postgres** (`$N` placeholders), **SQLite** (`?`), and **DuckDB**. It's dispatched at runtime based on `ctx.SQL.dialect`, so the same struct works against any of those backends. You pick the backend with `DB_DIALECT` or `DUCKDB_PATH`.

## Rules

- `resource` is the URL segment. `table` defaults to `resource` (override via `opts.table`).

- `id` is auto-detected as the primary key field; override it with `opts.id_field`. The struct must have that field, or it won't compile.

- Struct **field names map to column names exactly** (the `pgz` mapper is reused), so name your columns to match. `POST`/`PUT` bind the request JSON into the struct.

- On create, the primary key comes from the request body (you supply it). On get, update, and delete, it comes from the `:id` path param.

Auto CRUD does not create the table. Run your migration (or `ctx.SQL.exec`) first. The `examples/zero-autocrud` demo shows this with a `/init` handler.
