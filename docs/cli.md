# Command-line apps

`zero` can run as a **command-line application** instead of an HTTP server. A CLI app
wires up the same config, logging, container, datasources, and migrations — but it starts
**no HTTP server and no metrics server**.

This makes it ideal for:

- **one-time jobs** (seed data, backfills, exports),
- **long-running migrations** driven by `app.onStartup` hooks,
- any operational task you'd otherwise reach for a small standalone script.

## Create a CLI app

Use `App.newCmd` instead of `App.new` — the only difference is that no network listeners
are started.

```zig [src/main.zig]
const std = @import("std");
const zero = @import("zero");

const App = zero.App;
const Context = zero.Context;
const utils = zero.utils;

pub const std_options: std.Options = .{ .logFn = zero.logger.custom };

pub fn main(init: std.process.Init) !void {

    var gpa: std.heap.DebugAllocator(.{}) = .init;
    const allocator = gpa.allocator();

    // CLI mode: wires config/logging/container/datasources/migrations,
    // but starts NO HTTP or metrics server.
    const app = try App.newCmd(allocator, init.io, init.environ_map);

    try app.SubCommand("seed", seed, .{ .description = "populate the demo table" });
    try app.SubCommand("list", list, .{ .description = "list rows from the demo table" });
    try app.SubCommand("greet", greet, .{ .description = "print a greeting (--name <who>)" });

    // Dispatch on argv (typically init.minimal.args from main).
    try app.runCmd(init.minimal.args);
}
```

## Register subcommands

`app.SubCommand` maps a token the user passes after the program name to a handler.

The handler signature is `fn (*Context) anyerror!void`, the same `Context` you use in HTTP
handlers, so `ctx.SQL`, `ctx.NoSQL`, `ctx.Timeseries`, `ctx.Search`, and are all available
(configured via env as usual).

```zig
pub fn seed(ctx: *Context) !void {
    _ = try ctx.SQL.exec(ctx, "CREATE TABLE IF NOT EXISTS cli_users (id INTEGER, name VARCHAR)", .{});
    _ = try ctx.SQL.exec(ctx, "INSERT INTO cli_users VALUES (1, 'alice'), (2, 'bob')", .{});
    ctx.println("seeded cli_users with 2 rows", .{});
}

pub fn list(ctx: *Context) !void {
    const User = struct { id: i64, name: []const u8 };
    const users = try ctx.SQL.queryRows(ctx, User, "SELECT id, name FROM cli_users ORDER BY id", .{});
    defer {
        for (users) |u| ctx.allocator.free(u.name);
        ctx.allocator.free(users);
    }
    ctx.println("{s:<4} {s}", .{ "ID", "NAME" });
    for (users) |u| ctx.println("{d:<4} {s}", .{ u.id, u.name });
}
```

## Flags

Anything after the subcommand is parsed into `ctx.params`. Both styles work:

| Invocation                  | Read in handler                  |
| --------------------------- | -------------------------------- |
| `myapp greet --name Sashti` | `ctx.Param("name")` → `"Sashti"` |
| `myapp greet --name=Sashti` | `ctx.Param("name")` → `"Sashti"` |
| `myapp greet -n Sashti`     | `ctx.Param("n")` → `"Sashti"`    |

```zig
pub fn greet(ctx: *Context) !void {
    const name = ctx.Param("name") orelse "world";
    ctx.println("hello, {s}!", .{name});
}
```

`ctx.Param("name")` returns `?[]const u8` — handle the missing case with `orelse`.

## Migrations before the command

The same `app.onStartup` hook used by HTTP apps runs **before** the subcommand body, so
long-running migrations execute automatically on every CLI invocation:

```zig
try app.onStartup(migrateUp); // runs before seed/list/greet
```

## Help

Pass `help`, `--help`, or `-h` (or run with no subcommand) to print the usage banner and
the list of registered subcommands:

```text
Usage:
  myapp <command> [flags]

Commands:
  seed              populate the demo table
  list              list rows from the demo table
  greet             print a greeting (--name <who>)
```

## Recommendation

🚩 Use the `ctx` allocator wherever possible; it is tied to the request lifecycle, so its
memory is released automatically and you avoid leaks.

See the runnable
[`zero-cli`](https://github.com/im-ng/zero/tree/experimental/examples/zero-cli) example
and the implementation in
[`src/app.zig`](https://github.com/im-ng/zero/tree/experimental/src/app.zig).
