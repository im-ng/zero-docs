# Configuration

The app configrations are managed through `.env` file and allows your to inject
and overrride them as necessary through the `zero` framework

The configurations are expected to be available in the `app-folder/configs` directory

::: code-group
```bash [app directory structure]
❯ tree -a
.
├── build.zig
├── build.zig.zon
├── configs
│   └── .dev.env
│   └── .prod.env
│   └── .env
├── src
│   ├── main.zig
│   └── root.zig
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

`zero` will start override the environment specific configurations based on `APP_ENV` value. 

::: code-group
```bash
APP_ENV=dev
```
:::

In above example, if `.dev.env` file available in `configs` directory, the framework will automatically override defaults and start based on your environment.


## Configuration Per Service

This list highlights the supported configuration available in the `zero`

The framework will automatically hook them, and make the service available through out its life time.

## App 

::: code-group
```bash [App Specific]
APP_NAME=zero
APP_VERSION=1.0.0
APP_ENV=dev
LOG_LEVEL=info

HTTP_PORT=8080
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
```
```bash [myql]
Not supported
```
:::

## Cache

::: code-group
```bash [redis]
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_USER=redis # unused
REDIS_PASSWORD=password #unused
REDIS_DB=0
```
:::

## Message Queue

::: code-group
```bash [MQTT]
PUBSUB_BACKEND=MQTT
MQTT_PROTOCOL=tcp
MQTT_HOST=127.0.0.1 #prefer ip address
MQTT_PORT=1883
MQTT_CLIENT_ID_SUFFIX=zero-subscriber
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

## HTTP Service

Access external services using `custom` service url name and change only configurations if service url changes.

::: code-group
```bash [External]
SERVICE_URL="http://localhost:8080" #custom key
```
:::
