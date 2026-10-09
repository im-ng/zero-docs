# Dgraph

`zero` exposes **Dgraph** through a new `ctx.Graph` handle. Dgraph is a distributed graph database that speaks GraphQL± over HTTP, and `zero` reaches it with a small pure-Zig client.

## Configuration

```bash [configs/.env]
DGRAPH_URL=http://localhost:8080
DGRAPH_API_KEY=            # optional; sent as X-Dgraph-AccessToken
```

## API

`ctx.Graph` has two calls — `query` and `mutate`:

```zig [src/main.zig]
pub fn queryGraph(ctx: *Context) !void {
    const q =
        \\query {
        \\  all(func: has(name)) {
        \\    name
        \\  }
        \\};
    const res = try ctx.Graph.?.query(ctx, q);
    defer ctx.allocator.free(res);
    try ctx.json(res);
}

pub fn mutateGraph(ctx: *Context) !void {
    const m =
        \\{ "set": [ { "name": "Zero", "type": "Framework" } ] };
    _ = try ctx.Graph.?.mutate(ctx, m);
}
```

- `query(ctx, q)` — POSTs the body to `{url}/query` (content-type `application/graphql`).
- `mutate(ctx, m)` — POSTs the body to `{url}/mutate` (content-type `application/json`).
- `lastError()` — surfaces the upstream status.

`ctx.Graph` is optional — guard with `if (ctx.Graph) |g| { ... }`. Free the returned slice with `ctx.allocator`.

## Caveats

- Only query and mutate are exposed; there is no schema/alter or upsert helper.
- The auth header is `X-Dgraph-AccessToken` (not `Bearer`).
- No circuit breaker is wired yet.

See the runnable [zero-graph](https://github.com/im-ng/zero/tree/experimental/examples/zero-graph) example and the implementation in [src/datasource/graph/dgraph.zig](https://github.com/im-ng/zero/tree/experimental/src/datasource/graph/dgraph.zig).
