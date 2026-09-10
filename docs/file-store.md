# File Store

`zero` exposes a unified `FileStore` interface for blob storage, plus helpers for
handling `multipart/form-data` uploads and serving downloads. The `local` backend
(rooted at `FILE_STORE_ROOT`, with `..` traversal protection) is implemented;
`FTP`/`SFTP` backends are **deferred** (no vendored Zig libs; SFTP needs libssh).
The `local` store auto-registers as the default when `FILE_STORE_ROOT` is set.

See [`examples/zero-filestore`](https://github.com/im-ng/zero/tree/experimental/examples/zero-filestore)
for a runnable example.

## Register a store

```zig [src/main.zig]
const std = @import("std");
const zero = @import("zero");

const App = zero.App;
const Context = zero.Context;
const utils = zero.utils;

pub fn main(init: std.process.Init) !void {
    utils.setIo(init.io);
    var gpa: std.heap.DebugAllocator(.{}) = .init;
    const allocator = gpa.allocator();
    const app = try App.new(allocator, init.environ_map);

    // backend: .local | .ftp | .sftp  (ftp/sftp deferred)
    try app.addFileStore("uploads", .local, .{ .root = "./data/uploads" });

    try app.post("/upload", uploadHandler);
    try app.get("/download/:name", downloadHandler);
    try app.run();
}
```

## Upload (multipart)

The HTTP server enables `multipart/form-data` parsing by default (32 MB body /
32 fields), so `ctx.GetFile` works without extra configuration. `f.data` is
arena-owned and valid only for the duration of the request — copy it into a store
to persist it.

```zig [src/main.zig]
pub fn uploadHandler(ctx: *Context) !void {
    const f = (try ctx.GetFile("file")) orelse {
        ctx.response.setStatus(.bad_request);
        try ctx.json(.{ .@"error" = "no 'file' field in multipart form" });
        return;
    };
    try ctx.SaveFileToStore("uploads", f.filename, f.data);
    try ctx.json(.{ .stored = f.filename, .bytes = f.size });
}
```

## Download

`GetFileFromStore` returns a request-arena slice (freed when the request ends) —
stream it to the client with `ctx.response.writer().writeAll(...)` rather than
assigning it to `ctx.response.body` (the arena is reset before `response.body`
is flushed).

```zig [src/main.zig]
pub fn downloadHandler(ctx: *Context) !void {
    const name = ctx.param("name");
    const data = (try ctx.GetFileFromStore("uploads", name)) orelse {
        ctx.response.setStatus(.not_found);
        return;
    };
    ctx.response.header("content-type", "application/octet-stream");
    const disp = try std.fmt.allocPrint(ctx.allocator, "attachment; filename=\"{s}\"", .{name});
    ctx.response.header("content-disposition", disp);
    ctx.response.setStatus(.ok);
    try ctx.response.writer().writeAll(data);
}
```

You can also serve a file straight from local disk as a download:

```zig [src/main.zig]
try ctx.File("./public/report.pdf");
```
