# Protobuf

`zero` supports **Protocol Buffers over HTTP**. You define your schema in
`proto/*.proto`, then generate Zig structs with `zig build gen-proto`. That
command runs `protoc` through the `protobuf` dependency. You then bind the
request body and write the response.

See [`examples/zero-proto`](https://github.com/im-ng/zero/tree/experimental/examples/zero-proto)
for a runnable example.

## Define a schema

```protobuf [proto/echo.proto]
syntax = "proto3";

message Echo {
  string msg = 1;
  int64 timestamp = 2;
}
```

## Generate the Zig structs

```bash [codegen]
zig build gen-proto
# emits proto/echo.pb.zig (importable as @import("proto/echo.pb.zig"))
```

## Bind and encode in a handler

`ctx.bindProto(T)` decodes an `application/x-protobuf` request body into `T`.
`T` is any message that exposes `decode`. `ctx.protobuf(data)` serializes
`data` (which exposes `encode`) into the response. It sets
`Content-Type: application/x-protobuf`.

```zig [src/main.zig]
const std = @import("std");
const zero = @import("zero");

const App = zero.App;
const Context = zero.Context;
const utils = zero.utils;

const pb = @import("proto/echo.pb.zig"); // generated from proto/echo.proto

pub fn main(init: std.process.Init) !void {
    var gpa: std.heap.DebugAllocator(.{}) = .init;
    const allocator = gpa.allocator();
    const app = try App.new(allocator, init.io, init.environ_map);

    try app.post("/echo", echo);
    try app.run();
}

pub fn echo(ctx: *Context) !void {
    const req = (try ctx.bindProto(pb.Echo)) orelse {
        ctx.response.setStatus(.bad_request);
        return;
    };

    var out = req;
    out.timestamp = @intCast(std.Io.Timestamp.now(utils.io, .real).nanoseconds);
    try ctx.protobuf(out);
}
```

You can also describe messages by hand. Use the `protobuf` `encode`/`decode`
primitives plus a `_desc_table`.

The runtime primitives are re-exported from the framework root. Generated and
hand-written messages reach them via `@import("zero").protobuf`. The benchmark
and other built-in tools rely on this.
