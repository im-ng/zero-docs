# Protobuf

`zero` supports **Protocol Buffers over HTTP**. Define your schema in `proto/*.proto`,
generate Zig structs with `zig build gen-proto` (runs `protoc` via the `protobuf`
dependency), then bind the request body and write the response.

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

`ctx.bindProto(T)` decodes an `application/x-protobuf` request body into `T` (any
message exposing `decode`); `ctx.protobuf(data)` serializes `data` (exposing
`encode`) into the response with `Content-Type: application/x-protobuf`.

```zig [src/main.zig]
const std = @import("std");
const zero = @import("zero");

const App = zero.App;
const Context = zero.Context;
const utils = zero.utils;

const pb = @import("proto/echo.pb.zig"); // generated from proto/echo.proto

pub fn main(init: std.process.Init) !void {
    utils.setIo(init.io);
    var gpa: std.heap.DebugAllocator(.{}) = .init;
    const allocator = gpa.allocator();
    const app = try App.new(allocator, init.environ_map);

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

Messages may also be described by hand using the `protobuf` `encode`/`decode`
primitives plus a `_desc_table`.

The runtime primitives are re-exported from the framework root, so generated and
hand-written messages can reach them via `@import("zero").protobuf` (the benchmark and
other built-in tools rely on this).
