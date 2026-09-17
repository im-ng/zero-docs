# Experimental

This section documents **experimental** features of `zero`. They are opt-in, may
change between releases, and are gated behind a config flag so they cost nothing
when disabled.

::: tip
Every experimental feature here is **inert by default**. When its flag is off, no
objects are created and no background threads run — your existing
runtime behavior are completely unchanged.
:::

## OpenTelemetry

`zero` can emit **traces** and **logs** to an OpenTelemetry (OTel) collector over the
OTLP protocol. This is useful for distributed tracing, request correlation, and
centralized log aggregation.

The default target is **rootPrint** (an open-source observability backend), but any
OTLP **HTTP/protobuf** collector works — just point `OTEL_EXPORTER_OTLP_ENDPOINT` at
it. (The underlying opentelemetry SDK has no gRPC transport,
so only HTTP/protobuf is supported.)

### Enable

Set `OTEL_EXPERIMENTAL=true` in your `configs/.env` then configure the OTLP exporter:

| Config key                       | Purpose                                                                    | Example                 |
| -------------------------------- | -------------------------------------------------------------------------- | ----------------------- |
| `OTEL_EXPERIMENTAL`              | Master switch                                                              | `true`                  |
| `OTEL_EXPORTER_OTLP_ENDPOINT`    | Collector URL (HTTP/protobuf)                                              | `http://localhost:4318` |
| `OTEL_EXPORTER_OTLP_PROTOCOL`    | Must be `http/protobuf`                                                    | `http/protobuf`         |
| `OTEL_SERVICE_NAME`              | Service name in telemetry (defaults to `APP_NAME`, else `zero`)            | `otel-demo`             |
| `OTEL_EXPORTER_OTLP_AUTH_HEADER` | Bare credential → `Authorization` header (e.g. rootPrint `Bearer <token>`) | `"Bearer rp_..."`       |
| `OTEL_EXPORTER_OTLP_HEADERS`     | Extra non-auth headers (`Key=Value,...`) — env var only                    | `""`                    |
| `OTEL_EXPORTER_OTLP_COMPRESSION` | Payload compression                                                        | `gzip`                  |
| `LOG_FORMAT`                     | Console log shape (`json` for JSON lines)                                  | `json`                  |
| `OTEL_LOG_JSON`                  | OTel log body shape: `true` → JSON line, unset → clean `LEVEL message`     | `true`                  |

::: tip
The auth credential is kept **bare** (`Bearer <token>`, with no `Authorization=`
prefix). Keep it quoted because the value contains a space. rootPrint,
for example, expects a `Bearer` token here.
:::

A ready-to-paste `configs/.env` snippet:

::: code-group

```bash [configs/.env]
# --- OpenTelemetry (experimental) ---
OTEL_EXPERIMENTAL=true
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:8282
OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf
OTEL_SERVICE_NAME=otel-demo
# Bare Bearer credential for rootPrint (quoted: dotenv rejects spaces unquoted).
OTEL_EXPORTER_OTLP_AUTH_HEADER="Bearer rp_73185556e91269bc6bdc864c2e6af82b9ae7956c580d38f7"
# OTEL_EXPORTER_OTLP_HEADERS="Key=Value,..."
OTEL_EXPORTER_OTLP_COMPRESSION=gzip
LOG_FORMAT=json
# OTEL_LOG_JSON=true
```

:::

### Automatic instrumentation

With `OTEL_EXPERIMENTAL=true`, `zero` instruments your app without code changes:

- **Server spans** — the `tracz` middleware wraps every HTTP request in a span. It
  injects a `traceparent` response header and, when an upstream `traceparent` is
  present, continues that trace. With no upstream context, the request's
  `X-Correlation-ID` is reused as the OTel `trace_id`, so the two stay in lockstep.
- **Outbound propagation** — calls made through an HTTP service client
  (`app.addHttpService`) automatically inject the active W3C `traceparent`, so
  server → client spans link across services.
- **Logs bridge** — every `std.log` record (routed through `zero.logger.custom`) is
  mirrored into OTel logs, correlated with the active span. Console output is
  unchanged.

### Manual spans

Inside a handler you can start child spans parented to the active request span:

::: code-group

```zig [handler]
fn slowWork(ctx: *Context) !void {
    // Child span of the current request span (null when OTel is off).
    var span = (try ctx.startChildSpan("slowWork")) orelse {
        try doWork(ctx); // OTel disabled — just do the work.
        return;
    };
    defer span.deinit();
    defer ctx.endSpan(&span);

    try doWork(ctx);
}
```

Access the active span handle (or `null`) with `ctx.span()`.
:::

### Example

The `examples/zero-otel` app demonstrates traces, outbound propagation, and the log
bridge. It self-calls an endpoint to prove the `traceparent` propagates from the
client back to the server:

::: code-group

```zig [examples/zero-otel/src/main.zig]
const std = @import("std");
const zero = @import("zero");

const App = zero.App;
const Context = zero.Context;

pub const std_options: std.Options = .{
    .logFn = zero.logger.custom,
};

// Response shape for the self-call echo endpoint. The outbound client injects a
// W3C `traceparent` header; /echo reads it back so we can prove propagation.
const EchoResp = struct { data: struct { traceparent: []const u8 } };

fn sendText(ctx: *Context, body: []const u8) !void {
    ctx.response.setStatus(.ok);
    ctx.response.content_type = .TEXT;
    ctx.response.body = body;
}

pub fn main(init: std.process.Init) !void {
    var gpa: std.heap.DebugAllocator(.{}) = .init;
    const allocator = gpa.allocator();
    _ = gpa.detectLeaks();

    const app = try App.new(allocator, init.io, init.environ_map);

    // Outbound self-call target: proves client->server traceparent propagation
    // with no external network. "self" points at this very server.
    try app.addHttpService("self", "http://localhost:8080", .{});

    try app.get("/", index);
    try app.get("/echo", echo);
    try app.get("/outbound", outbound);
    try app.get("/log", logDemo);

    try app.run();
}

// Server span + response traceparent + a log line.
fn index(ctx: *Context) !void {
    ctx.info("handling GET /");
    try sendText(ctx, "ok");
}

// Returns the incoming traceparent so a caller can confirm it propagated.
fn echo(ctx: *Context) !void {
    const tp = ctx.request.header("traceparent") orelse "(none)";
    try ctx.json(.{ .traceparent = tp });
}

// Outbound call: the client injects the active traceparent; /echo reflects it.
fn outbound(ctx: *Context) !void {
    const svc = ctx.getService("self") orelse return ctx.err("self service not registered");
    const resp = try svc.get(ctx, EchoResp, "/echo", null, null);
    const tp = resp.?.data.traceparent;
    ctx.info("outbound call propagated traceparent");
    try sendText(ctx, tp);
}

// Exercises the logs bridge across levels.
fn logDemo(ctx: *Context) !void {
    ctx.debug("debug message");
    ctx.info("info message");
    ctx.warn("warn message");
    ctx.err("error message");
    try sendText(ctx, "logged");
}
```

:::

Run it with `zig build otel-demo` from `examples/zero-otel`, with a collector
listening on the configured `OTEL_EXPORTER_OTLP_ENDPOINT` receiving the telemetry.

### Caveats

- **Experimental / alpha.** The API and config keys may change between releases.
- **HTTP/protobuf only** — the SDK has no gRPC transport.
- **Memory** is bounded by a per-span reclaiming arena inside the SDK,
  so runtime RSS plateaus under load.
