# Resilience

`zero` bakes in several resilience features so a service degrades gracefully under
load and when its dependencies misbehave.

This page consolidates them; individual feature pages (Configuration, Observability,
PubSub, KV Store) carry the full key and API references.

## Inbound HTTP protections

These are read from `configs/.env` and apply to every request before it reaches your
handlers.

| Key                            | Default         | Effect                                                                                                       |
| ------------------------------ | --------------- | ------------------------------------------------------------------------------------------------------------ |
| `ZERO_REQUEST_TIMEOUT_MS`      | `30000`         | Per-request timeout. A stalled client cannot pin a worker past this.                                         |
| `INBOUND_MAX_CONCURRENT`       | `0` (unlimited) | Bulkhead: in-flight requests are capped; excess returns `503` with `{"error":"concurrency limit exceeded"}`. |
| `ZERO_HTTP_LARGE_BUFFER_SIZE`  | `1048576`       | Size (bytes) of each pooled HTTP body buffer.                                                                |
| `ZERO_HTTP_LARGE_BUFFER_COUNT` | `16`            | Number of pooled body buffers (≈ resident pool size).                                                        |
| `RATE_LIMIT_ENABLE`            | `true`          | Fixed-window rate limiter (see [Rate Limiter](/rate-limiter)). Set `false` to disable (e.g. for load tests). |
| `RATE_LIMIT_MAX`               | `100`           | Max requests per window when `0`.                                                                            |
| `RATE_LIMIT_WINDOW`            | `60`            | Window length (seconds) when `0`.                                                                            |

The body-buffer pool keeps steady-state RSS small: larger bodies still grow on the
per-request arena (capped by `request.max_body_size`) and are freed at the end of the
request. `/.well-known/*` is exempt from the rate limiter so health checks are never
throttled.

```bash [configs/.env]
ZERO_REQUEST_TIMEOUT_MS=30000
INBOUND_MAX_CONCURRENT=0
ZERO_HTTP_LARGE_BUFFER_SIZE=1048576
ZERO_HTTP_LARGE_BUFFER_COUNT=16
RATE_LIMIT_ENABLE=true
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=60
```

## Circuit breakers

Circuit breakers fail fast when a downstream is unhealthy instead of piling up
timed-out calls.

A breaker opens after `failure_threshold` consecutive failures, stays
open for `cooldown_ms`, then allows `half_open_trials` probe requests before closing
again.

While open, calls return `error.CircuitOpen`.

| Scope                 | Key                            | Default | Notes                                                                                  |
| --------------------- | ------------------------------ | ------- | -------------------------------------------------------------------------------------- |
| SQL datasource        | `SQL_CIRCUIT_BREAKER_ENABLE`   | off     | Trips on 5 failures; `error.CircuitOpen` surfaced to handlers.                         |
| Cache / KV            | `CACHE_CIRCUIT_BREAKER_ENABLE` | off     | Same threshold/cooldown as above. See [KV Store](/kv-store).                           |
| Outbound HTTP service | `SERVICE_<NAME>_CB_*`          | off     | Per-service breaker + OAuth token-endpoint breaker. See [Http Service](/http-service). |

When a breaker opens, `zero` increments the `app_circuit_open_total` counter
(label `name`) — see [Observability](/observability).

## PubSub resilience

All brokers (Kafka, MQTT, NATS, Redis) now reconnect and re-subscribe transparently
after a broker drop.

Handler failures are retried up to 3× with a 500 ms backoff.

Poison messages that keep failing are dead-lettered:

- Kafka: `<topic>__dlq`
- MQTT / NATS / Redis: `<topic>/dlq`

Each dead-lettered message increments `app_pubsub_dlq_total` (labels `topic`,
`consumer`). See [PubSub](/pubsub) for details.

## Outbound resilience (HTTP services)

Registered services get per-request timeouts, retries, and an OAuth token-endpoint
breaker.

See [Http Service → Resilience](/http-service#resilience-timeouts--retries).

## Structured logging & fail-fast config

- `LOG_FORMAT=json` emits one JSON object per log line (`{"ts":...,"level":...,"msg":...}`).
  See [Logging](/logging#json-structured-logging).

- `ZERO_LOG_TIMEZONE` controls the timezone of log timestamps (`local` / `utc` / IANA
  name). See [Logging](/logging#log-timezone).

- `REQUIRED_CONFIG_KEYS` makes startup fail fast when a listed key is missing or empty:

```bash [configs/.env]
REQUIRED_CONFIG_KEYS=DB_HOST,DB_NAME
```

If any listed key is unset or empty the app exits at startup with
`error.MissingRequiredConfig` (opt-in; empty by default).
