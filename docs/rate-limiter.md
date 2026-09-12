# Rate Limiter & Request Helpers

`zero` ships a few opt-in request-level helpers around traffic shaping, tracing
propagation, and redirects.

## Rate Limiter

A fixed-window rate limiter runs as the **first** middleware in the chain. It is
opt-in via config and exempts `/.well-known/*` (so the health endpoint is never
throttled).

```bash [configs/.env]
RATE_LIMIT_ENABLE=true          # enabled by default; set false to disable (e.g. for load tests)
RATE_LIMIT_MAX=100              # max requests per window (0 → default 100)
RATE_LIMIT_WINDOW=60            # window length in seconds (0 → default 60)
RATE_LIMIT_KEY=ip               # default: bucket by client Address
# RATE_LIMIT_KEY=header:X-Forwarded-For   # bucket by an inbound header instead (behind a proxy)
```

When a client exceeds the limit, the server replies `429 Too Many Requests`
(`rate limit exceeded`). Buckets are keyed by an `XxHash3` of the client address
(or the configured header) and reset at the start of each window; an internal cap
bounds the number of tracked clients.

Future options — token bucket, sliding window, per-route limits, Redis-backed
distributed limiting, and `X-RateLimit-*` / `Retry-After` headers — are tracked in
[Feature Parity](/parity).

## Correlation ID

The tracing middleware (`tracz`) reuses an inbound `X-Correlation-ID` header if
present (otherwise it mints a UUID) and stamps it on the response. That id is then
propagated automatically: the outbound HTTP client attaches it to every upstream
request, and Kafka `publish` writes it as a record header — so a single correlation
id flows across services and brokers without extra code.

## Remote log level

Instead of exposing an endpoint, a service can *pull* its log level from a remote
log-level service. Set `REMOTE_LOG_URL` (and optionally `REMOTE_LOG_FETCH_INTERVAL`)
in `configs/.env`; on startup `zero` registers an outbound HTTP client for that URL
and a cron job that fetches the level every `REMOTE_LOG_FETCH_INTERVAL` seconds
(default 15) and applies it in-process.

```bash [configs/.env]
REMOTE_LOG_URL=https://log-service.com/log-levels
REMOTE_LOG_FETCH_INTERVAL=15
```

The remote endpoint must return the level as JSON:

```json
{ "level": "debug" }
```

Valid levels: `debug`, `info`, `warn`, `error`, `fatal`, `none`. An unrecognized
value in the response is ignored (the current level is left unchanged). The fetch
rides the framework's outbound client, so auth and the circuit breaker apply
automatically.

## Redirect

Handlers can issue a 3xx redirect via the context — useful for OAuth callbacks and
canonical URLs:

```zig [src/main.zig]
// 302 Found by default
ctx.redirect("/login");

// explicit status (e.g. 301, 303, 307, 308)
ctx.redirectWith(std.http.Status.moved_permanently, "https://example.com/new");
```
