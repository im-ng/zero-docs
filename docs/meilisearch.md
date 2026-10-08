# Meilisearch

`zero` exposes **Meilisearch** through the unified `ctx.Search` handle (the same handle used for Solr). Meilisearch is a fast, HTTP-based search engine; `zero` talks to it with a small pure-Zig client.

## Configuration

```bash [configs/.env]
MEILI_HOST=http://localhost:7700
MEILI_INDEX=movies
MEILI_API_KEY=             # optional; sent as Authorization: Bearer
```

## API

`ctx.Search` is unchanged — index, fetch, delete, and query documents regardless of backend:

```zig [src/main.zig]
pub fn addDoc(ctx: *Context) !void {
    try ctx.Search.?.index(ctx, "movies",
        "[{\"id\":1,\"title\":\"Inception\"}]");
}

pub fn search(ctx: *Context) !void {
    const res = try ctx.Search.?.query(ctx, "movies", "inception");
    defer ctx.allocator.free(res);
    try ctx.json(res);
}
```

- `index(ctx, collection, doc_json)` — upsert a JSON doc.
- `query(ctx, collection, q)` — search.
- `get(ctx, collection, id)` — fetch a doc by id (`null` on 404).
- `delete(ctx, collection, id)` — delete a doc by id.
- `lastError()` — surfaces the upstream status.

`ctx.Search` is optional — guard with `if (ctx.Search) |s| { ... }`. Free returned slices with `ctx.allocator`.

## Caveats

- The search call sends only `{"q":"<term>"}`. Filters, facets, pagination, and `attributesToRetrieve` are not supported yet.
- No circuit breaker is wired yet.

See the runnable [zero-search](https://github.com/im-ng/zero/tree/experimental/examples/zero-search) example and the implementation in [src/datasource/search/meili.zig](https://github.com/im-ng/zero/tree/experimental/src/datasource/search/meili.zig).
