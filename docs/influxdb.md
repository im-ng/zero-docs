# InfluxDB

`zero` gives you a single, type-erased `ctx.Timeseries` handle for **InfluxDB** and other time-series stores.

You write points and run queries through the same calls, whatever the backend. See `src/datasource/specialized/timeseriesInterface.zig`.

`ctx.Timeseries` is **optional**.

It's `null` until you set `INFLUXDB_URL` (with `INFLUXDB_BUCKET` and `INFLUXDB_TOKEN`). So always guard with `if (ctx.Timeseries) |ts| { ... } else { notConfigured }`.

## Configuration

`zero` targets the **InfluxDB v3** HTTP API. There is no `INFLUXDB_ORG` — v3 uses a flat database plus token model.

::: code-group

```bash [configs/.env]
# App configs
APP_ENV=dev
APP_NAME=basic
APP_VERSION=1.0.0
LOG_LEVEL=info
HTTP_PORT=8080

# InfluxDB (time-series, v3 HTTP API)
INFLUXDB_URL=http://localhost:8181
INFLUXDB_BUCKET=metrics
INFLUXDB_TOKEN=my-super-secret-token
```

:::

| Env               | Required | Description                                       |
| ----------------- | -------- | ------------------------------------------------- |
| `INFLUXDB_URL`    | yes      | Base URL of the InfluxDB v3 instance.             |
| `INFLUXDB_BUCKET` | yes      | Default database for writes/queries.              |
| `INFLUXDB_TOKEN`  | yes      | API token, sent as `Authorization: Bearer <token>`.|

## API

`zero` maps the handle onto the v3 endpoints under the hood:

- `write` → `POST {url}/api/v3/write_lp` (line-protocol body, `?db={bucket}`).
- `query` → `POST {url}/api/v3/query_sql` (`{"db": bucket, "q": q}`).
- `createDatabase` → `POST {url}/api/v3/configure/database` (`{"db": name}`).

```zig
// Write a point as a single line-protocol statement.
try ctx.Timeseries.write(ctx, "cpu,host=server1 usage=42.1");

// Run a SQL (or InfluxQL) query. Returns raw CSV/JSON from InfluxDB.
const body = try ctx.Timeseries.query(ctx, "SELECT * FROM cpu WHERE time > now() - interval '1 hour'");
defer ctx.allocator.free(body);

// Create a bucket on demand.
try ctx.Timeseries.createDatabase(ctx, "metrics");
```

The `write` method takes one **line-protocol** statement (measurement, comma-separated tags, space, space-separated fields, optional trailing timestamp). Pass a complete point, not separate measurement/tags/fields arguments.

The `query` method runs a SQL or InfluxQL string and returns the raw response body as text. Free it with `defer ctx.allocator.free(...)`.

`createDatabase` takes the database name and provisions it on the server.

## Example handler

```zig [src/main.zig]
pub fn writePoint(ctx: *Context) !void {
    if (ctx.Timeseries) |ts| {
        const body = ctx.request.body() orelse "";
        // Expect a single line-protocol statement in the request body.
        try ts.write(ctx, body);
        try ctx.response.json(.{ .status = "written" }, .{});
    } else {
        ctx.response.setStatus(.not_implemented);
        try ctx.response.json(.{ .message = "INFLUXDB_* not configured" }, .{});
    }
}

pub fn querySql(ctx: *Context) !void {
    if (ctx.Timeseries) |ts| {
        const q = if (ctx.request.method == .POST)
            (ctx.request.body() orelse "")
        else
            (try ctx.request.query()).get("q") orelse "";
        const raw = try ts.query(ctx, q);
        defer ctx.allocator.free(raw);
        ctx.response.content_type = .TEXT;
        try ctx.response.writer().writeAll(raw);
    }
}
```

## Recommendation

Use the `ctx` allocator wherever you can. It's tied to the request lifecycle, so its memory is freed automatically and you avoid leaks.

See the runnable
[`zero-timeseries`](https://github.com/im-ng/zero/tree/experimental/examples/zero-timeseries)
example and the implementation in
[`src/datasource/specialized/influxdb.zig`](https://github.com/im-ng/zero/tree/experimental/src/datasource/specialized/influxdb.zig).
