# Configuration

You manage app configuration through an `.env` file. `zero` lets you inject and
override values as needed.

Your configs must live in the `app-folder/configs` directory.

::: code-group

```bash [app directory structure]
❯ tree -a
.
├── build.zig
├── build.zig.zon
├── configs
│   └── .dev.env
│   └── .prod.env
│   └── .env
├── src
│   ├── main.zig
│   └── root.zig
└── static
    └── favicon.ico

4 directories, 6 files
```

:::

## Defaults

These defaults get you started.

::: code-group

```bash [defaults]
APP_NAME=zero
HTTP_PORT=8080
LOG_LEVEL=info
```

:::

## Overrides

`zero` overrides environment-specific config based on the `APP_ENV` value.

::: code-group

```bash
APP_ENV=dev
```

:::

In the example above, if `.dev.env` exists in `configs`, `zero` overrides the
defaults and starts for that environment.

## Configuration Per Service

This list covers the config `zero` supports. `zero` wires each service
automatically and keeps it available for the app's lifetime.

## App

::: code-group

```bash [App Specific]
APP_NAME=zero
APP_VERSION=1.0.0
APP_ENV=dev
LOG_LEVEL=info

HTTP_PORT=8080
METRICS_PORT=2121               # separate listener for /metrics (not the app port)

LOG_FORMAT=text                 # text | json — emit one JSON object per log line
ZERO_LOG_TIMEZONE=local        # local | utc | IANA name (e.g. America/New_York)
REQUIRED_CONFIG_KEYS=          # comma-separated; app exits at startup if any are unset/empty
```

:::

::: tip
Metrics are exposed on a **separate** listener (`METRICS_PORT`, default `2121`), not on
the app's `HTTP_PORT`. See [Observability](./observability.md#metrics-endpoint).
:::

## HTTP Server

These protections apply to inbound requests. `zero` reads them from
`configs/.env` and applies them before your handlers run. See
[Resilience](./resilience.md) for details.

::: code-group

```bash [HTTP server]
HTTP_PORT=8080

ZERO_REQUEST_TIMEOUT_MS=30000     # per-request timeout (ms); stalled clients can't pin a worker
INBOUND_MAX_CONCURRENT=0          # bulkhead; 0 = unlimited. Excess returns 503
ZERO_HTTP_LARGE_BUFFER_SIZE=1048576   # pooled HTTP body-buffer size (bytes)
ZERO_HTTP_LARGE_BUFFER_COUNT=16       # pooled HTTP body-buffer count (≈ resident pool)
```

:::

## Database

::: code-group

```bash [postgres]
DB_HOST=localhost
DB_USER=user
DB_PASSWORD=password
DB_NAME=demo
DB_PORT=5432
DB_DIALECT=postgres
DB_SSL_MODE=disable
SQL_CIRCUIT_BREAKER_ENABLE=false  # trip open after 5 consecutive failures (error.CircuitOpen)
```

```bash [sqlite]
DB_DIALECT=sqlite
SQLITE_PATH=./data/app.db
SQLITE_CREATE=true
SQLITE_WRITE=true
SQLITE_THREADING=multi-thread
```

```bash [duckdb]
DUCKDB_PATH=./data/app.db         # enabled when set; empty path = :memory: (in-process OLAP)
SQL_CIRCUIT_BREAKER_ENABLE=false  # trip open after 5 consecutive failures (error.CircuitOpen)
```

:::

## Cache

The cache is a named KV store (default name `cache`, Redis-backed). The
supported backends mirror the [KV Store](#kv-store): `redis` (default),
`nats_kv`, `sqlite` and `memory`.

::: code-group

```bash [redis (default)]
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_USER=redis
REDIS_PASSWORD=password
REDIS_DB=0
# optional TLS
REDIS_TLS_ENABLED=false
REDIS_TLS_CA_CERT=
REDIS_TLS_KEY=
REDIS_TLS_CERT=

CACHE_CIRCUIT_BREAKER_ENABLE=false  # trip open after 5 consecutive failures (error.CircuitOpen)
```

:::

## KV Store

KV stores are registered in code via `App.addKVStore(name, backend, opts)`. Each
backend reads its connection settings from the same env groups used elsewhere:

- `redis` → `REDIS_*` (see [Cache](#cache))
- `nats_kv` → `NATS_*` (see [PubSub](#message-queue--pubsub))
- `sqlite` → `SQLITE_*` (see [Database](#database))
- `memory` → no configuration

By default `zero` registers a store named `cache` (Redis-backed) that the
caching middleware consumes.

::: code-group

```bash [redis backend]
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_USER=redis
REDIS_PASSWORD=password
REDIS_DB=0
```

```bash [sqlite backend]
SQLITE_PATH=./data/kv.db
SQLITE_CREATE=true
SQLITE_WRITE=true
```

:::

## File Store

File stores are registered in code via `App.addFileStore(name, backend, opts)`.
The `local` and `s3` backends are implemented; `ftp` and `sftp` are declared but
not yet implemented.

::: code-group

```bash [local backend]
FILE_STORE_ROOT=./data/files   # root directory for the local backend
```

```bash [s3 backend]
S3_BUCKET=my-bucket            # required
S3_REGION=us-east-1            # default us-east-1
S3_ACCESS_KEY=AKIA...          # required
S3_SECRET_KEY=...              # required
S3_ENDPOINT=                   # optional; defaults to https://s3.<region>.amazonaws.com
```

```bash [ftp]
TBD
```

```bash [sftp]
TBD
```

:::

## NoSQL

A type-erased document / wide-column store, auto-wired when `CASSANDRA_CONTACT_POINTS`
is set.

The `cassandra` backend is currently implemented; the handle is exposed as
`ctx.NoSQL`.

`CASSANDRA_KEYSPACE` is required once the datasource is enabled.

::: code-group

```bash [cassandra]
CASSANDRA_CONTACT_POINTS=127.0.0.1:9042   # required; enables the NoSQL datasource
CASSANDRA_KEYSPACE=my_keyspace            # required when enabled
CASSANDRA_USER=                           # optional
CASSANDRA_PASSWORD=                       # optional
```

:::

## Time Series

A type-erased time-series store, auto-wired when `INFLUXDB_URL` is set.

The `influxdb` backend is currently implemented; the handle is exposed as
`ctx.Timeseries`.

`INFLUXDB_ORG` and `INFLUXDB_BUCKET` are required once the
datasource is enabled; `INFLUXDB_TOKEN` is optional (auth disabled / 1.x auth).

::: code-group

```bash [influxdb]
INFLUXDB_URL=http://localhost:8086        # required; enables the time-series datasource
INFLUXDB_ORG=my-org                       # required when enabled
INFLUXDB_BUCKET=my-bucket                 # required when enabled
INFLUXDB_TOKEN=                           # optional
```

:::

## Search

A type-erased search store, auto-wired when `SOLR_URL` is set.

The `solr` backend is currently implemented; the handle is exposed as `ctx.Search`.

`SOLR_DEFAULT_COLLECTION` is required once the datasource is enabled;

`SOLR_BASIC_AUTH` is optional (`user:password` for HTTP Basic).

::: code-group

```bash [solr]
SOLR_URL=http://localhost:8983/solr       # required; enables the search datasource
SOLR_DEFAULT_COLLECTION=my_collection     # required when enabled
SOLR_BASIC_AUTH=                          # optional; "user:password" for HTTP Basic
```

:::

## Message Queue / PubSub

`PUBSUB_BACKEND` selects the transport. When unset, pub/sub is disabled.

::: code-group

```bash [Kafka]
PUBSUB_BACKEND=KAFKA
PUBSUB_BROKER=localhost:9092
CONSUMER_ID=zero-consumer
KAFKA_BATCH_SIZE=100
KAFKA_BATCH_BYTES=1048576
KAFKA_BATCH_TIMEOUT=1000
KAFKA_SECURITY_PROTOCOL=PLAINTEXT
KAFKA_SASL_MECHANISM=        # e.g. PLAIN / SCRAM-SHA-256
KAFKA_SASL_USERNAME=
KAFKA_SASL_PASSWORD=
KAFKA_TLS_CA_CERT_FILE=
KAFKA_TLS_CERT_FILE=
KAFKA_TLS_KEY_FILE=
KAFKA_TLS_INSECURE_SKIP_VERIFY=false
```

```bash [NATS]
PUBSUB_BACKEND=NATS
PUBSUB_BROKER=nats://localhost:4222
NATS_STREAM=zero
NATS_SUBJECTS=>
NATS_MAX_WAIT=5000
NATS_MAX_PULL_WAIT=5000
NATS_CONSUMER=zero-consumer
NATS_CREDS_FILE=          # optional, for authenticated NATS
```

```bash [MQTT]
PUBSUB_BACKEND=MQTT
PUBSUB_BROKER=tcp://127.0.0.1:1883
MQTT_PROTOCOL=tcp
MQTT_HOST=127.0.0.1   # prefer ip address
MQTT_PORT=1883
MQTT_USER=
MQTT_PASSWORD=
MQTT_CLIENT_ID_SUFFIX=zero-subscriber
MQTT_QOS=0
MQTT_KEEP_ALIVE=true
MQTT_RETRIEVE_RETAINED=false
```

:::

## Auth

`zero` supports basic and api_key authentication on the registered routes.

_You can register more than one key by separating values with commas._

::: code-group

```bash [Basic]
AUTH_MODE=Basic
AUTH_KEYS="bmFtZTpwYXNzd29yZA==,bmFtZTE6cGFzc3dvcmQx"
```

```bash [API Key]
AUTH_MODE=APIKey
AUTH_API_KEYS="caf208fb-e407-497a-8f03-d636fb689b2e,b12eb288-e7b5-4919-8082-09586e4b6dd7"
```

```bash [OAuth]
AUTH_MODE=OAuth
AUTH_JWKS_URL=http://localhost:8080/.well-known/jwks.json
AUTH_REFRESH_INTERVAL=10
```

:::

## RBAC

Role-based access control rules are loaded by `app.rbacFromEnv()` (call it in
`main`), which reads the `RBAC_CONFIG` env var. There is no code-based `app.rbac(...)`
API and no `RBAC_ROLE_*` env-var form — `RBAC_CONFIG` is the sole supported schema.

Routes with a rule are protected; routes without one stay public.

The caller's role is taken from the JWT `role` claim, so RBAC pairs with
`AUTH_MODE=OAuth`.

`RBAC_CONFIG` is a single endpoint-rule object or an array of them:

```json
{ "permissions": ["ROLE", ...], "endpoint": "/path", "methods": ["GET", ...], "exempt": false }
```

::: code-group

```bash [RBAC_CONFIG — endpoint-rule JSON]
RBAC_CONFIG=[{"permissions":["ADMIN"],"endpoint":"/api/admin/*","methods":["GET","POST"],"exempt":true},{"permissions":["USER"],"endpoint":"/api/resource","methods":["GET"]}]
```

:::

`exempt: true` bypasses RBAC for the listed methods only; other methods on that
endpoint stay protected (require a matching role rule).

## HTTP Service

Access external services under a custom service name. Change only the config
when the service URL changes.

::: code-group

```bash [External]
SERVICE_URL="http://localhost:8080" #custom key (read in your own main and passed to addHttpService)
```

:::

Per-service behavior is resolved from `SERVICE_<NAME>_*` env keys, where `<NAME>` is
the service name passed to `addHttpService`, uppercased, with non-alphanumeric
characters mapped to `_` (e.g. service `payments-api` → `SERVICE_PAYMENTS_API_*`).

Explicit options passed in code override the env defaults.

### Circuit Breaker

A circuit breaker can guard each downstream so a flapping dependency fails fast. It
is configured with `SERVICE_<NAME>_CB_*`.

When unset, the breaker defaults to `failure_threshold = 5` and `cooldown_ms = 30000` (and `half_open_trials = 1`).

::: code-group

```bash [circuit breaker]
SERVICE_PAYMENTS_API_CB_FAILURE_THRESHOLD=5     # consecutive failures before opening
SERVICE_PAYMENTS_API_CB_COOLDOWN_MS=30000       # ms to wait before half-open trial
```

:::

### Rate Limiter

Each outbound service can carry its own client-side rate limiter, configured with
`SERVICE_<NAME>_RATE_LIMIT*`.

When `SERVICE_<NAME>_RATE_LIMIT` is unset, no per-service limiter is applied
(this is independent of the global request limiter).

::: code-group

```bash [rate limiter]
SERVICE_PAYMENTS_API_RATE_LIMIT=100             # max outbound requests per window
SERVICE_PAYMENTS_API_RATE_LIMIT_WINDOW_MS=60000 # window length in ms (default 60000)
```

:::

### Timeouts & Retries

::: code-group

```bash [timeouts & retries]
SERVICE_PAYMENTS_API_TIMEOUT_MS=30000           # per-request timeout (ms)
SERVICE_PAYMENTS_API_MAX_RETRIES=3              # retry attempts on transient failure
SERVICE_PAYMENTS_API_RETRY_BASE_MS=100          # base backoff (ms) for exponential retry
```

:::

### Outbound Auth

::: code-group

```bash [api key]
SERVICE_PAYMENTS_API_AUTH_MODE=apiKey
SERVICE_PAYMENTS_API_API_KEY=secret
```

```bash [basic]
SERVICE_PAYMENTS_API_AUTH_MODE=basic
SERVICE_PAYMENTS_API_BASIC_USER=user
SERVICE_PAYMENTS_API_BASIC_PASS=pass
```

```bash [oauth]
SERVICE_PAYMENTS_API_AUTH_MODE=oauth
SERVICE_PAYMENTS_API_OAUTH_TOKEN_URL=http://idp/token
SERVICE_PAYMENTS_API_OAUTH_CLIENT_ID=client
SERVICE_PAYMENTS_API_OAUTH_CLIENT_SECRET=secret
SERVICE_PAYMENTS_API_OAUTH_SCOPE=            # optional
SERVICE_PAYMENTS_API_OAUTH_AUDIENCE=         # optional
```

:::

## Rate Limiter

The rate limiter is a middleware enabled globally via `RATE_LIMIT_ENABLE` and is
**on by default** (set `RATE_LIMIT_ENABLE=false` to disable it, e.g. for load tests).
The key used to bucket requests is selected with `RATE_LIMIT_KEY`. `/.well-known/*`
is exempt so health checks are never throttled. See [Rate Limiter](./rate-limiter.md).

::: code-group

```bash [rate limiter]
RATE_LIMIT_ENABLE=true     # enabled by default; set false to disable
RATE_LIMIT_KEY=ip          # ip | header | custom
RATE_LIMIT_MAX=100         # max requests per window (0 → default 100)
RATE_LIMIT_WINDOW=60       # window length in seconds (0 → default 60)
```

:::

Key modes:

- `ip` — bucket by client address.
- `header` — bucket by the `X-Forwarded-For` header (custom header name set in code).
- `custom` — application-defined key computed in code.

## Remote Log

When `REMOTE_LOG_URL` is set, `zero` registers an outbound HTTP client for it
and a cron job that periodically fetches the current log level from that
endpoint and hot-reloads the in-process `LOG_LEVEL`, no restart required.

The remote endpoint must return JSON containing a `level` field, where `level` is
one of `debug`, `info`, `warn`, `error`, `fatal` or `none`.

A `zero` service serves this at `GET /remote.log.service?id=<uuid>` (the `level` field is what gets read)

The feature is opt-in and never exposes an endpoint on this service.

::: code-group

```bash [remote log]
REMOTE_LOG_URL=                        # e.g. http://log-level-service/remote.log.service
REMOTE_LOG_REFRESH_INTERVAL=30         # seconds between fetches (default 30)
```

:::
