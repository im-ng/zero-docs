<script setup>
import { ImgComparisonSlider } from '@img-comparison-slider/vue';
</script>

# Http Service

As we are leveraging the microservice architecture, the web application meant to serve others requests and also request other services as well.

With that in mind, `zero` framework has built-in solution to register and communicate to external services as they do like database calls.

## What is supported?

- Inter service http calls (GET, POST, PATCH, PUT, DELETE)
- Log and trace all outgoing calls
- Health checks
- Outbound authentication (Basic / API Key / OAuth bearer) attached per service
- Circuit breaker (fail-fast when a downstream is unhealthy)
- Per-service rate limiting for outbound calls

## Usage

`zero` comes with handy `addHttpService` method to register a http client and registered
client will be available through `context`

Prefer to use the unique service names to distinguish clients in the `zero` app life-time.

```zig
app.addHttpService("service-name", "http://service-base-url");

// if you prefer to load the URL from configs
app.addHttpService("service-name", app.config.Get("SERVICE_URL"));
```

## Example

1. Refer following [`zero-service-client`](https://github.com/im-ng/zero/examples/zero-service-client) example further to know more on getting started of this. 

::: code-group

```zig [main.zig]
const std = @import("std");
const zero = @import("zero");

const App = zero.App;
const Context = zero.Context;
const utils = zero.utils;
const ClientError = zero.Error.ClientError;

pub const std_options: std.Options = .{
    .logFn = zero.logger.custom,
};

pub const publicKey = struct {
    kid: []const u8,
    kty: []const u8,
    use: []const u8,
    n: []const u8,
    e: []const u8,
    alg: []const u8,
};

pub const publicKeys = struct {
    keys: []publicKey,
};

pub fn main(init: std.process.Init) !void {
    utils.setIo(init.io);
    var arean = std.heap.ArenaAllocator.init(std.heap.page_allocator);
    defer arean.deinit();

    const allocator = arean.allocator();

    const app = try App.new(allocator, init.environ_map);

    try app.addHttpService("auth-service", app.config.Get("SERVICE_URL"));

    try app.get("/status", serviceStatus);

    try app.run();
}

fn serviceStatus(ctx: *Context) !void {
    const service = ctx.getService("auth-service");

    if (service) |authSvc| {
        const response = try authSvc.Get(ctx, publicKeys, "/keys", null, null);
        try ctx.json(response);
    }
}
```

```bash [config/.env]
APP_ENV=dev
APP_NAME=service-client
APP_VERSION=1.0.0
LOG_LEVEL=info

HTTP_PORT=9090
SERVICE_URL="http://localhost:8080"
```
:::

2. Boom! lets build and run our app.

```bash
❯ zig build external
 INFO [00:53:19] Loaded config from file: ./configs/.env
 INFO [00:53:19] config overriden ./configs/.dev.env file not found.
 INFO [00:53:19] container is being created
 INFO [00:53:19] no authentication mode found and disabled.
 INFO [00:53:19] service-client app pid 21721
 INFO [00:53:19] registered static files from directory ./static
 INFO [00:53:19] Starting server on port: 9090
 INFO [00:53:21]                                     	 200 1ms GET http://localhost:8080/keys
 INFO [00:53:21] ea265582-47c7-4363-94bb-caccfa18387a	 200 1ms GET /keys

```

3. Preview server status and capture `auth-service` public keys.

_Assuming you are already running `zero-basic` app on http port `8080` to serve us the request_

<ImgComparisonSlider>
<!-- eslint-disable -->
<img
    slot="first"
    style="width: 100%"
    src="./public/preview-external-service-1.webp"
/>
<img
    slot="second"
    style="width: 100%"
    src="./public/preview-external-service-2.webp"
/>
<!-- eslint-enable -->
</ImgComparisonSlider>

## Outbound Authentication

Attach credentials to every request a service sends by passing `opts.auth` to
`addHttpService`. Three modes are supported: `basic`, `apiKey` and `oauth`. For
OAuth, `zero` fetches and caches the bearer token (refreshing before expiry) so
you don't manage tokens manually.

```zig [main.zig]
const zeroClient = zero.service.client;

// Basic
try app.addHttpService("legacy", "http://legacy.internal", .{
    .auth = .{ .mode = .basic, .basic = .{ .username = "svc", .password = "secret" } },
});

// API Key (sent as the `x-api-key` header)
try app.addHttpService("partner", "http://partner.internal", .{
    .auth = .{ .mode = .apiKey, .apiKey = .{ .key = "caf208fb-..." } },
});

// OAuth (token auto-fetched and refreshed)
try app.addHttpService("auth-service", "http://localhost:8080", .{
    .auth = .{ .mode = .oauth, .oauth = .{
        .tokenUrl = "http://localhost:8080/oauth/token",
        .clientId = "svc",
        .clientSecret = "secret",
        .scope = "read",
        .audience = "zero-app",
    } },
});
```

## Circuit Breaker

A circuit breaker fails fast when a downstream is unhealthy, instead of piling up
timed-out calls. It opens after `failure_threshold` consecutive failures, stays
open for `cooldown_ms`, then allows `half_open_trials` probe requests before
closing again. While open, calls return `error.CircuitOpen`.

```zig [main.zig]
try app.addHttpService("flaky", "http://flaky.internal", .{
    .circuitBreaker = .{ .failure_threshold = 5, .cooldown_ms = 30_000, .half_open_trials = 1 },
});
```

Defaults: `failure_threshold = 5`, `cooldown_ms = 30000`, `half_open_trials = 1`.

## Rate Limiting (per service)

Each registered service can be guarded by a fixed-window limiter for its outbound
calls. When `limit` requests are made within `window_ms`, further calls return
`error.RateLimited` (surfaced as `ClientError.RateLimited`) without hitting the
network.

```zig [main.zig]
try app.addHttpService("downstream", "http://downstream.internal", .{
    .rateLimiter = .{ .allocator = allocator, .enabled = true, .limit = 100, .window_ms = 60_000 },
});
```

## Resilience: timeouts & retries

Outbound calls can be hardened with a per-request timeout and automatic retries. Pass
`opts.timeout_ms` / `opts.max_retries` / `opts.retry_base_ms`:

```zig [main.zig]
try app.addHttpService("downstream", "http://downstream.internal", .{
    .timeout_ms = 2000,     // connect/read timeout per request
    .max_retries = 3,       // retries on transport errors and 5xx
    .retry_base_ms = 100,   // linear backoff: delay = base * attempt
});
```

- Retries apply to **transport errors and `5xx` responses**; `404` is **not** retried
  (it returns `error.EntityNotFound`).
- Backoff is linear: the delay before attempt `n` is `retry_base_ms * n`.
- For OAuth services, a `401` triggers a single token-refresh + replay before the call
  is considered failed.

### OAuth token-endpoint circuit breaker

The OAuth token endpoint is guarded by its own circuit breaker. If it is open (or a
refresh fails), `zero` falls back to the last cached token — possibly stale — instead
of hard-failing every call. This keeps downstream calls working (degraded) while the
token provider is unhealthy. When a service breaker (or the token breaker) trips,
`zero` increments the `app_circuit_open_total` metric (label = service name).

## Configuration via environment

Instead of code, resolve a service's auth / circuit-breaker / rate-limit settings
from `SERVICE_<NAME>_*` env keys (service name uppercased, non-alphanumeric
characters become `_`). For `addHttpService("auth-service", ...)` the prefix is
`SERVICE_AUTH_SERVICE_`.

::: code-group
```bash [config/.env]
# outbound auth
SERVICE_AUTH_SERVICE_AUTH_MODE=oauth
SERVICE_AUTH_SERVICE_OAUTH_TOKEN_URL=http://localhost:8080/oauth/token
SERVICE_AUTH_SERVICE_OAUTH_CLIENT_ID=svc
SERVICE_AUTH_SERVICE_OAUTH_CLIENT_SECRET=secret
SERVICE_AUTH_SERVICE_OAUTH_SCOPE=read
SERVICE_AUTH_SERVICE_OAUTH_AUDIENCE=zero-app
# basic: SERVICE_AUTH_SERVICE_BASIC_USER / SERVICE_AUTH_SERVICE_BASIC_PASS
# apiKey: SERVICE_AUTH_SERVICE_API_KEY

# circuit breaker
SERVICE_AUTH_SERVICE_CB_FAILURE_THRESHOLD=5
SERVICE_AUTH_SERVICE_CB_COOLDOWN_MS=30000
SERVICE_AUTH_SERVICE_CB_HALF_OPEN_TRIALS=1

# outbound timeouts & retries
SERVICE_AUTH_SERVICE_TIMEOUT_MS=        # per-request connect/read timeout (ms); unset = framework default
SERVICE_AUTH_SERVICE_MAX_RETRIES=3      # retries on transport errors + 5xx (not 404)
SERVICE_AUTH_SERVICE_RETRY_BASE_MS=100  # linear backoff: delay = base * attempt

# rate limiting
SERVICE_AUTH_SERVICE_RATE_LIMIT=100
SERVICE_AUTH_SERVICE_RATE_LIMIT_WINDOW_MS=60000
```
:::

```zig [main.zig]
// env-driven: addHttpService resolves SERVICE_AUTH_SERVICE_* automatically.
// Explicit opts override the env defaults, so passing .{} keeps the env values.
try app.addHttpService("auth-service", "http://localhost:8080", .{});
```

## Limitations 🚨 

🚩 We encounter memory leaks when we try to access the external service URL with https and compression enabled. There is a work in progress to get this mitigated.