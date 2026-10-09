# ArangoDB

`zero` reaches ArangoDB over its HTTP API and exposes it through the `ctx.NoSQL` handle. You write full **AQL** statements — there is no document-level convenience wrapper.

## Configuration

```bash [configs/.env]
ARANGO_HOST=http://localhost:8529
ARANGO_DB=_system
ARANGO_USER=root
ARANGO_PASSWORD=
```

`ARANGO_HOST` is the base URL; `ARANGO_DB` is the target database. Auth is HTTP Basic.

## API

Every verb takes a verbatim AQL statement:

```zig [src/main.zig]
pub fn addMovie(ctx: *Context) !void {
    try ctx.NoSQL.put(ctx,
        "INSERT { title: 'Inception', year: 2010 } INTO movies");
}

pub fn topMovies(ctx: *Context) !void {
    const res = try ctx.NoSQL.query(ctx,
        "FOR m IN movies SORT m.year DESC LIMIT 10 RETURN m");
    defer ctx.allocator.free(res);
    try ctx.json(res);
}
```

- `put(ctx, aql)` — write (INSERT / REMOVE) via `/_api/cursor`.
- `get(ctx, aql)` — read; returns the first cursor result, `null` on empty.
- `delete(ctx, aql)` — REMOVE.
- `query(ctx, aql)` — arbitrary AQL; returns the `result` array as JSON.
- `lastError()` — surfaces the upstream status.

The result is raw JSON; `zero` does not type-decode AQL responses, so parse it yourself. Free the returned slice with `ctx.allocator`.

## Caveats

- Each operation runs a full AQL statement through `/_api/cursor`.
- No circuit breaker is wired for `ctx.NoSQL` backends yet.

See the implementation in [src/datasource/nosql/arangodb.zig](https://github.com/im-ng/zero/tree/experimental/src/datasource/nosql/arangodb.zig) and the [zero-nosql](https://github.com/im-ng/zero/tree/experimental/examples/zero-nosql) example.
