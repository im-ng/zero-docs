# Auto CRUD

`zero` can scaffold REST handlers for a struct in one line, using the `AddRESTHandlers` fn.

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

    utils.setIo(init.io);
  
    var gpa: std.heap.DebugAllocator(.{}) = .init;
    const allocator = gpa.allocator();
    const app = try App.new(allocator, init.environ_map);

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

The generated SQL is emitted for **both** Postgres (`$N` placeholders) and SQLite (`?`) and dispatched at runtime on `ctx.SQL.dialect`, so the same struct works against either backend.

## Rules

- `resource` is the URL segment. `table` defaults to `resource` (override via `opts.table`).
- The primary key is auto-detected as the field named `id`; override with `opts.id_field`. The struct must have that field or it fails to compile.
- Struct **field names map to column names exactly** (the `pgz` mapper is reused), so name your columns to match. `POST`/`PUT` bind the request JSON into the struct.
- The primary key is taken from the request body on create (supply it) and from the `:id` path param on get/update/delete.

Auto CRUD does not create the table — run your migration (or `ctx.SQL.exec`) first, as the `examples/zero-autocrud` demo does with a `/init` handler.
