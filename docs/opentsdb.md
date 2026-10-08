# OpenTSDB

`zero` exposes **OpenTSDB** through the `ctx.Timeseries` handle (the same handle used for InfluxDB). OpenTSDB is a time-series database that stores metrics as JSON over HTTP.

InfluxDB takes priority when `INFLUXDB_URL` is set; set `OPENTSDB_URL` on its own to use OpenTSDB.

## Configuration

```bash [configs/.env]
OPENTSDB_URL=http://localhost:4242
OPENTSDB_TOKEN=             # optional; sent as Authorization: Bearer
```

## API

`ctx.Timeseries` is unchanged:

```zig [src/main.zig]
pub fn writeMetric(ctx: *Context) !void {
    try ctx.Timeseries.?.write(ctx,
        "[{\"metric\":\"cpu\",\"timestamp\":1700000000,\"value\":42.0,\"tags\":{\"host\":\"web\"}}]");
}

pub fn readMetric(ctx: *Context) !void {
    const res = try ctx.Timeseries.?.query(ctx,
        "{\"start\":1700000000,\"queries\":[{\"metric\":\"cpu\"}]}");
    defer ctx.allocator.free(res);
    try ctx.json(res);
}
```

- `write(ctx, json)` — POSTs the body to `/api/put`. Pass a single point object or an array of points.
- `query(ctx, json)` — POSTs the body to `/api/query`; returns the response.
- `createDatabase(ctx, name)` — a no-op. OpenTSDB is schema-less; metrics are created on first write.
- `lastError()` — surfaces the upstream status.

`ctx.Timeseries` is optional — guard with `if (ctx.Timeseries) |ts| { ... }`. Free returned slices with `ctx.allocator`.

## Caveats

- `write` expects the exact OpenTSDB `/api/put` JSON payload — it is not line protocol like InfluxDB.
- There is no database provisioning; `createDatabase` is a documented no-op.
- No circuit breaker is wired yet.

See the runnable [zero-timeseries](https://github.com/im-ng/zero/tree/experimental/examples/zero-timeseries) example and the implementation in [src/datasource/timeseries/opentsdb.zig](https://github.com/im-ng/zero/tree/experimental/src/datasource/timeseries/opentsdb.zig).
