# Migrating to Zig 0.16

The `experimental` branch of `zero` adds support for **Zig 0.16.0**. The `main`
branch remains on **0.15.2** (the production baseline). This page summarizes what
changed for applications moving to 0.16.

## Which branch?

| Branch           | Zig version | Status      |
| ---------------- | ----------- | ----------- |
| `experimental`   | 0.16.0      | Experimental |
| `main`           | 0.15.2      | Production  |

Install the 0.16 line from the `experimental` branch:

```bash
zig fetch --save https://github.com/im-ng/zero/archive/refs/heads/experimental.zip
```

## `main` signature

Zig 0.16 passes process init to `main`. You must thread the I/O handle and the
environment map into `zero`:

```zig [src/main.zig]
const std = @import("std");
const zero = @import("zero");

const App = zero.App;
const Context = zero.Context;
const utils = zero.utils;

pub fn main(init: std.process.Init) !void {
    utils.setIo(init.io);                       // 1. wire up I/O
    var gpa: std.heap.DebugAllocator(.{}) = .init;
    const allocator = gpa.allocator();

    const app = try App.new(allocator, init.environ_map); // 2. pass env map
    try app.get("/json", jsonResponse);
    try app.run();
}
```

The two mechanical changes from 0.15.2:

1. `pub fn main() !void` → `pub fn main(init: std.process.Init) !void` and call
   `utils.setIo(init.io);` as the first line.
2. `App.new(allocator)` → `App.new(allocator, init.environ_map)`.

`build.zig.zon` should target the new compiler:

```zig [build.zig.zon]
.minimum_zig_version = "0.16.0",
```

## Switching Zig versions

Always clear caches before switching Zig versions — stale cache causes build
failures and runtime corruption:

```bash
rm -rf .zig-cache zig-out zig-pkg/
```

## Known gotchas

- **`librdkafka`** is linked as a weak system library — builds fail without
  `librdkafka-dev` (`apt install librdkafka-dev` / `brew install librdkafka`).
- On macOS, `build.zig` hardcodes `/usr/local/Cellar/librdkafka/2.13.0` include/lib
  paths.
- `src/cronz/scheduler.zig` and `src/mw/authProvider.zig` use
  `@import("../zero.zig")` (relative path), not `@import("zero")`.
- `0.15.2` has a **runtime breakage**: `src/logger.zig` uses a `std.fs.File.stdout()`
  I/O pattern that silently fails under 0.15.2 (no log output, HTTP server never
  binds). This is fixed on `experimental` (0.16.0).
