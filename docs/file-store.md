# File Store

`zero` exposes a unified `FileStore` interface for blob storage. It also gives you helpers for handling `multipart/form-data` uploads and serving downloads.

The `local` backend is rooted at `FILE_STORE_ROOT` and blocks `..` path traversal. The `s3` backend works with any S3-compatible store (AWS S3, MinIO, R2, Spaces, B2) and signs requests with AWS Signature V4. The `FTP` and `SFTP` backends are **deferred**.

The `local` store becomes the default when `FILE_STORE_ROOT` is set.

See [`examples/zero-filestore`](https://github.com/im-ng/zero/tree/experimental/examples/zero-filestore) for a runnable example.

## Register a store

```zig [src/main.zig]
const std = @import("std");
const zero = @import("zero");

const App = zero.App;
const Context = zero.Context;
const utils = zero.utils;

pub fn main(init: std.process.Init) !void {
    var gpa: std.heap.DebugAllocator(.{}) = .init;
    const allocator = gpa.allocator();
    const app = try App.new(allocator, init.io, init.environ_map);

    // backend: .local | .ftp | .sftp | .s3  (ftp/sftp deferred)
    try app.addFileStore("uploads", .local, .{ .root = "./data/uploads" });

    // S3-compatible store (configured via S3_* env keys)
    try app.addFileStore("assets", .s3, .{});

    try app.post("/upload", uploadHandler);
    try app.get("/download/:name", downloadHandler);
    try app.run();
}
```

## Upload (multipart)

The HTTP server parses `multipart/form-data` by default (32 MB body, 32 fields). That means `ctx.GetFile` works without extra configuration. `f.data` is arena-owned and stays valid only for the life of the request, so copy it into a store if you want to keep it.

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

`GetFileFromStore` returns a slice from the request arena, which is freed when the request ends. Stream it to the client with `ctx.response.writer().writeAll(...)` instead of assigning it to `ctx.response.body`. The arena resets before `response.body` is flushed, so that assignment would lose the data.

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

## S3 backend

The `s3` backend targets any S3-compatible object store: AWS S3, MinIO, Cloudflare R2, DigitalOcean Spaces, or Backblaze B2. Requests are signed with AWS Signature Version 4.

::: code-group

```bash [config/.env]
S3_BUCKET=my-bucket            # required
S3_REGION=us-east-1            # default us-east-1
S3_ACCESS_KEY=AKIA...          # required
S3_SECRET_KEY=...              # required
S3_ENDPOINT=                   # optional; defaults to https://s3.<region>.amazonaws.com
```

:::

Register it with `app.addFileStore("assets", .s3, .{})`. The bucket, region, and credentials come from the `S3_*` env keys above.

The same `get` / `create` / `delete` / `list` operations work across all backends through the unified `FileStore`.
