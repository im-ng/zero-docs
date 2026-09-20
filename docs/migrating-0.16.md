# Migrating to Zig 0.16

The `experimental` branch of `zero` adds support for **Zig 0.16.0**. The `main`
branch stays on **0.15.2**, which is the production baseline. This page lists what
changes when you move an app to 0.16.

## Which branch?

| Branch           | Zig version | Status      |
| ---------------- | ----------- | ----------- |
| `experimental`   | 0.16.0      | Experimental |
| `main`           | 0.15.2      | Production  |

To install the 0.16 line, fetch the `experimental` branch:

```bash
zig fetch --save https://github.com/im-ng/zero/archive/refs/heads/experimental.zip
```

## `main` signature

Zig 0.16 passes the process init to `main`. You must pass the I/O handle and the
environment map into `zero`:

```zig [src/main.zig]
const std = @import("std");
const zero = @import("zero");

const App = zero.App;
const Context = zero.Context;
const utils = zero.utils;

pub fn main(init: std.process.Init) !void {
    var gpa: std.heap.DebugAllocator(.{}) = .init;
    const allocator = gpa.allocator();

    // I/O reactor is injected directly into App.new (no global setIo call).
    const app = try App.new(allocator, init.io, init.environ_map); // pass I/O + env map
    try app.get("/json", jsonResponse);
    try app.run();
}
```

Here are the mechanical changes from 0.15.2:

1. Change `pub fn main() !void` to `pub fn main(init: std.process.Init) !void`. Then
    inject the process I/O reactor by passing `init.io` as the second argument to `App.new`.
2. Change `App.new(allocator)` to `App.new(allocator, init.io, init.environ_map)`. `zero`
    no longer installs the `std.Io` reactor through the global `utils.setIo(init.io)` call.
    Instead, it stores the reactor on the `container` and `Context` (`container.io` /
    `ctx.io`). It also seeds a thin `utils.io` global during `App` bootstrap, which
    stateless helpers use: utils, logger, zsutil, metricz, kvstore.

`build.zig.zon` must target the new compiler:

```zig [build.zig.zon]
.minimum_zig_version = "0.16.0",
```

## Switching Zig versions

Clear your caches before you switch Zig versions. A stale cache causes build
failures and runtime corruption:

```bash
rm -rf .zig-cache zig-out zig-pkg/
```

## Known gotchas

- **`librdkafka`** is linked as a weak system library. Builds fail unless you
  install `librdkafka-dev` (`apt install librdkafka-dev` / `brew install librdkafka`).
- On macOS, `build.zig` hardcodes include and lib paths at
  `/usr/local/Cellar/librdkafka/2.13.0`.
- `src/cronz/scheduler.zig` and `src/mw/authProvider.zig` import with
  `@import("../zero.zig")` (a relative path), not `@import("zero")`.
- `0.15.2` has a **runtime breakage**: in `src/logger.zig`, a `std.fs.File.stdout()`
  I/O pattern silently fails on 0.15.2. There is no log output and the HTTP server
  never binds. The `experimental` branch (0.16.0) fixes it.
