# Solr

`zero` exposes **Solr** (and other search engines) through a unified, type-erased
`ctx.Search` handle.

Index, fetch, delete, and query documents with the same calls
regardless of backend — add more backends (Elasticsearch, Meilisearch, …) in
`src/datasource/specialized/searchInterface.zig`.

`ctx.Search` is **optional**: it is `null` until `SOLR_URL` (plus `SOLR_DEFAULT_COLLECTION`)
is configured, so always guard with `if (ctx.Search) |s| { ... } else { notConfigured }`.

## Configuration

::: code-group

```bash [configs/.env]
# App configs
APP_ENV=dev
APP_NAME=basic
APP_VERSION=1.0.0
LOG_LEVEL=info
HTTP_PORT=8080

# Solr (search / persistence)
SOLR_URL=http://localhost:8983/solr
SOLR_DEFAULT_COLLECTION=docs
# Optional HTTP basic auth, as "user:pass"
SOLR_BASIC_AUTH=admin:secret
```

:::

| Env                       | Required | Description                                          |
| ------------------------- | -------- | ---------------------------------------------------- |
| `SOLR_URL`                | yes      | Base URL of the Solr node (include `/solr`).         |
| `SOLR_DEFAULT_COLLECTION` | yes      | Collection/core used when a call omits `collection`. |
| `SOLR_BASIC_AUTH`         | no       | `user:pass` sent as HTTP Basic auth.                 |

## API

```zig
try ctx.Search.index(ctx, "docs", "{\"id\":\"1\",\"title\":\"zero framework\"}"); // index a doc
const hits = try ctx.Search.query(ctx, "docs", "title:zero");                  // search -> JSON hits
const doc  = try ctx.Search.get(ctx, "docs", "1");                             // fetch by id (?[]const u8)
try ctx.Search.delete(ctx, "docs", "1");                                      // delete by id
```

Returned `[]const u8` slices (`query`/`get`) are allocated on the request allocator — free
them with `defer ctx.allocator.free(slice)` when you hold a reference, or let the
request-scoped allocator release them at the end of the handler.

## Example handler

```zig [src/main.zig]
pub fn indexDoc(ctx: *Context) !void {
    if (ctx.Search) |s| {
        const doc = ctx.request.body() orelse "";
        try s.index(ctx, "docs", doc);
        try ctx.response.json(.{ .status = "indexed" }, .{});
    } else {
        ctx.response.setStatus(.not_implemented);
        try ctx.response.json(.{ .message = "SOLR_URL not configured" }, .{});
    }
}

pub fn search(ctx: *Context) !void {
    if (ctx.Search) |s| {
        const q = if (ctx.request.method == .POST)
            (ctx.request.body() orelse "")
        else
            (try ctx.request.query()).get("q") orelse "";
        const hits = try s.query(ctx, "docs", q);
        defer ctx.allocator.free(hits);
        ctx.response.content_type = .JSON;
        try ctx.response.writer().writeAll(hits);
    }
}
```

## Recommendation

🚩 Use the `ctx` allocator wherever possible; it is tied to the request lifecycle, so its
memory is released automatically and you avoid leaks.

See the runnable
[`zero-search`](https://github.com/im-ng/zero/tree/experimental/examples/zero-search)
example and the implementation in
[`src/datasource/specialized/solr.zig`](https://github.com/im-ng/zero/tree/experimental/src/datasource/specialized/solr.zig).
