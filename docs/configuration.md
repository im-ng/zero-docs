# Configuration

The app configurations are managed through `.env` file and allow you to inject
and override them as necessary through the `zero` framework.

The configurations are expected to be available in the `app-folder/configs` directory.

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

The framework goes with following defaults to get started.

::: code-group
```bash [defaults]
APP_NAME=zero
HTTP_PORT=8080
LOG_LEVEL=info
```
:::

## Overrides

`zero` will override the environment specific configurations based on `APP_ENV` value.

::: code-group
```bash
APP_ENV=dev
```
:::

In above example, if `.dev.env` file available in `configs` directory, the framework will automatically override defaults and start based on your environment.

## Configuration Per Service

This list highlights the supported configuration available in the `zero`
framework. The framework will automatically hook them, and make the service
available through out its life time.

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

Inbound request protections, read from `configs/.env` and applied before handlers run.
See [Resilience](./resilience.md) for behavior.

::: code-group
```bash [HTTP server]
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
```bash [myql]
Not supported
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

The framework registers a default store named `cache` (Redis-backed) which the
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
:::

## Message Queue / PubSub

`PUBSUB_BACKEND` selects the transport. When unset, pub/sub is disabled.

::: code-group
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
:::

## Auth

`zero` supports basic and api_key based authentication on the registered routes.

_One can register more than one `keys` using the comma notation._

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
`main`). Routes with a rule are protected; routes without one stay public. The
caller's role is taken from the JWT `role` claim, so RBAC pairs with
`AUTH_MODE=OAuth`.

::: code-group
```bash [per-role env keys]
RBAC_ROLE_ADMIN=GET:/api/admin/*,POST:/api/admin/*
RBAC_ROLE_USER=GET:/api/resource
```

```bash [RBAC_CONFIG JSON document]
RBAC_CONFIG=[{"role":"ADMIN","method":"*","path":"/api/admin/*"},{"role":"USER","method":"GET","path":"/api/resource"}]
```
:::

`RBAC_CONFIG` may also be an object mapping role → `["METHOD:/path", ...]`.

## HTTP Service

Access external services using `custom` service url name and change only configurations if service url changes.

::: code-group
```bash [External]
SERVICE_URL="http://localhost:8080" #custom key
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
endpoint and hot-reloads the in-process `LOG_LEVEL` — no restart required. The
endpoint must return JSON of the shape `{ "level": "info" }`, where `level` is
one of `debug`, `info`, `warn`, `error`, `fatal` or `none`. The feature is
opt-in and never exposes an endpoint on this service.

::: code-group
```bash [remote log]
REMOTE_LOG_URL=            # e.g. http://log-level-svc/level (empty disables the feature)
REMOTE_LOG_FETCH_INTERVAL=15   # seconds between fetches (default 15)
```
:::
