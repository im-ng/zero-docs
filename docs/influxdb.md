# InfluxDB

`zero` exposes **InfluxDB** (and other time-series stores) through a unified, type-erased
`ctx.Timeseries` handle. Write points and run Flux queries with the same calls regardless of
backend — add more backends (Prometheus, VictoriaMetrics, …) in
`src/datasource/specialized/timeseriesInterface.zig`.

`ctx.Timeseries` is **optional**: it is `null` until `INFLUXDB_URL` (plus `INFLUXDB_ORG` and
`INFLUXDB_BUCKET`) is configured, so always guard with
`if (ctx.Timeseries) |ts| { ... } else { notConfigured }`.

## Configuration

::: code-group
```bash [configs/.env]
# App configs
APP_ENV=dev
APP_NAME=basic
APP_VERSION=1.0.0
LOG_LEVEL=info
HTTP_PORT=8080

# InfluxDB (time-series)
INFLUXDB_URL=http://localhost:8086
INFLUXDB_ORG=zero
INFLUXDB_BUCKET=metrics
# Optional (required if the bucket is token-protected)
INFLUXDB_TOKEN=my-super-secret-token
```
:::

| Env | Required | Description |
| --- | --- | --- |
| `INFLUXDB_URL` | yes | Base URL of the InfluxDB instance. |
| `INFLUXDB_ORG` | yes | Organisation. |
| `INFLUXDB_BUCKET` | yes | Default bucket for writes/queries. |
| `INFLUXDB_TOKEN` | no | API token (required for secured buckets). |

## API

```zig
// Write a point. tags/fields use InfluxDB line-protocol syntax.
try ctx.Timeseries.write(ctx, "cpu", "host=server1", "usage=42.1", null);

// Run a Flux query — returns raw CSV from InfluxDB.
const csv = try ctx.Timeseries.query(ctx, "from(bucket:\"metrics\") |> range(start: -1h)");
defer ctx.allocator.free(csv);
```

`write` takes `measurement`, `tags`, `fields` (both line-protocol strings), and an optional
timestamp (`?i64`; pass `null` to use server time). `query` runs a Flux string and returns
the result as CSV text — free it with `defer ctx.allocator.free(...)`.

## Example handler

```zig [src/main.zig]
pub fn writePoint(ctx: *Context) !void {
    if (ctx.Timeseries) |ts| {
        const body = ctx.request.body() orelse "";
        const parsed = try std.json.parseFromSlice(struct {
            measurement: []const u8,
            tags: []const u8 = "",
            fields: []const u8,
            ts: ?i64 = null,
        }, ctx.allocator, body, .{});
        defer parsed.deinit();
        try ts.write(ctx, parsed.value.measurement, parsed.value.tags, parsed.value.fields, parsed.value.ts);
        try ctx.response.json(.{ .status = "written" }, .{});
    } else {
        ctx.response.setStatus(.not_implemented);
        try ctx.response.json(.{ .message = "INFLUXDB_* not configured" }, .{});
    }
}

pub fn queryFlux(ctx: *Context) !void {
    if (ctx.Timeseries) |ts| {
        const q = if (ctx.request.method == .POST)
            (ctx.request.body() orelse "")
        else
            (try ctx.request.query()).get("q") orelse "";
        const csv = try ts.query(ctx, q);
        defer ctx.allocator.free(csv);
        ctx.response.content_type = .TEXT;
        try ctx.response.writer().writeAll(csv);
    }
}
```

## Recommendation

🚩 Use the `ctx` allocator wherever possible; it is tied to the request lifecycle, so its
memory is released automatically and you avoid leaks.

See the runnable
[`zero-timeseries`](https://github.com/im-ng/zero/tree/experimental/examples/zero-timeseries)
example and the implementation in
[`src/datasource/specialized/influxdb.zig`](https://github.com/im-ng/zero/tree/experimental/src/datasource/specialized/influxdb.zig).
