# Kubernetes

This guide shows how to run a **zero** application on Kubernetes.

The framework ships a production-oriented Helm chart — **Bee** (chart `version: 0.2.0` targets Zero
`appVersion: 0.16.0`) — in its [`helm/`](https://github.com/im-ng/zero/tree/experimental/helm)
directory.

You containerize your app once, push the image, then drive the whole deployment
(config, secrets, probes, ingress, autoscaling, observability) from `values.yaml`.

Object names are derived from `app.name` / `nameOverride` — there is **no Helm release
prefix**, so a release named `zero` produces objects literally named `zero`
(Deployment, Service, Ingress, ServiceMonitor, …).

## Prerequisites

- A Kubernetes cluster and `kubectl` configured against it.
- Helm 3 (`helm version --short`).
- A built container image of your zero app in a registry you can pull from (see
  [Containerize the app](#containerize-the-app-podman) below).
- (Optional) Prometheus — either the Prometheus Operator (for `ServiceMonitor`) or a
  standalone Prometheus (for the alerts ConfigMap).

## Containerize the app (Podman)

The framework provides a multi-stage
[`Dockerfile.multi-stage`](https://github.com/im-ng/zero/tree/experimental/examples/zero-basic/Dockerfile.multi-stage)
under `examples/zero-basic/`.

It builds natively for **musl** on Alpine (zig 0.16.0), bundles the Alpine-specific `libduckdb.so`,
and ships a minimal container image.

> Build from the **framework repo root**
> the Dockerfile `COPY`s `build.zig`, `src`, `examples/zero-basic`, and
> `examples/zero-basic/libs/`,
> so the build context must be `.`.

```bash
# 1. Build the image (run from the zero repo root)
podman build -f examples/zero-basic/Dockerfile.multi-stage -t gitea.pi/ng/zero-basic:v1.0 .

# 2. Push to your registry
podman push gitea.pi/ng/zero-basic:v1.0

# 3. Run it locally to sanity-check
podman run --rm -it --name zero-basic --security-opt seccomp=unconfined \
  -v "${PWD}/configs:/app/configs:rw" "gitea.pi/ng/zero-basic:v1.0"
```

Replace `gitea.pi/ng/zero-basic:v1.0` with your own registry/repo/tag.

Pull `Dockerfile.multi-stage` to your own app repo and start building the container image.

### Runtime layout

The runtime image expects:

| Path           | Purpose                                                             |
| -------------- | ------------------------------------------------------------------- |
| `/app/basic`   | The compiled zero binary (entrypoint).                              |
| `/app/configs` | Loaded as `./configs/.env` at startup — mount your config dir here. |
| `/app/static`  | Static files served by the app.                                     |
| `/app/data`    | Local data (e.g. SQLite files, file-store).                         |

Because the app uses an **io-threaded HTTP server**, it issues syscalls the default Docker
seccomp profile blocks — hence `--security-opt seccomp=unconfined` on `podman run`.

In Kubernetes this is covered by the chart's `securityContext` / `podSecurityContext` values
(you normally do **not** need a custom seccomp profile).

### Port note

The `zero-basic` example listens on **`8080`**. The Helm chart defaults `app.port` to
`8080`, so when you deploy via the chart, set `app.port` (and the container's `HTTP_PORT`)
to match the port your image actually listens on.

## Quickstart (Helm)

```bash
# Render manifests (dry-run) into a file
helm template my-release . -f values-override.yaml > manifest.yaml

# Deploy directly
helm upgrade --install my-release . -f values-override.yaml

# Or render + apply
helm template my-release . -f values-override.yaml | kubectl apply -f -
```

Point the chart at the image you pushed above:

```yaml
# values-override.yaml
app:
  name: zero-basic
image:
  registry: gitea.pi/ng
  repository: zero-basic
  tag: v1.0
```

## Values reference

| Key                       | Type   | Default               | Description                                           |
| ------------------------- | ------ | --------------------- | ----------------------------------------------------- |
| `namespace`               | string | `default`             | Namespace for all generated objects                   |
| `app.name`                | string | `zero-app`            | App name (object names, labels, image repo fallback)  |
| `app.version`             | string | `0.16.0`              | App version (also chart `appVersion`)                 |
| `app.logLevel`            | string | `INFO`                | Zero log level (DEBUG/INFO/WARN/ERROR)                |
| `app.logFormat`           | string | `json`                | Log format: `text` or `json` (0.16 structured)        |
| `app.logTimezone`         | string | `UTC`                 | Log tz: `local` or IANA tz (e.g. `Asia/Kolkata`)      |
| `app.authMode`            | string | `""`                  | Inbound auth: `""` / `Basic` / `APIKey` / `OAuth`     |
| `app.healthPath`          | string | `/.well-known/health` | Liveness/readiness/startup probe path                 |
| `app.metricsPath`         | string | `/metrics`            | Prometheus metrics scrape path                        |
| `app.port`                | int    | `8000`                | HTTP container port                                   |
| `app.metricsPort`         | int    | `2121`                | Metrics container port                                |
| `image.registry`          | string | `registry.pi`         | Image registry                                        |
| `image.repository`        | string | `""`                  | Image repo (falls back to `app.name`)                 |
| `image.tag`               | string | `""`                  | Image tag (falls back to `app.version`)               |
| `image.pullPolicy`        | string | `IfNotPresent`        | Image pull policy                                     |
| `replicaCount`            | int    | `1`                   | Number of replicas                                    |
| `strategy.type`           | string | `RollingUpdate`       | Deployment strategy                                   |
| `env`                     | map    | `{}`                  | Plain env vars (key: value)                           |
| `secretEnv`               | list   | `[]`                  | Individual env vars from Secret keys                  |
| `configMapEnv`            | list   | `[]`                  | Individual env vars from ConfigMap keys               |
| `envFromSecrets`          | list   | `[]`                  | Bulk-load all keys from Secrets                       |
| `envFromConfigMaps`       | list   | `[]`                  | Bulk-load all keys from ConfigMaps                    |
| `configMap`               | map    | `{}`                  | Create and embed a ConfigMap (`<name>-cm`)            |
| `secret`                  | map    | `{}`                  | Create and embed a Secret (`<name>-secret`)           |
| `volumeMounts`            | list   | `[]`                  | Container volume mounts                               |
| `volumes`                 | list   | `[]`                  | Pod-level volumes                                     |
| `resources`               | map    | (see `values.yaml`)   | Resource requests/limits                              |
| `service.type`            | string | `ClusterIP`           | Service type                                          |
| `service.annotations`     | map    | `{}`                  | Service annotations                                   |
| `service.labels`          | map    | `{}`                  | Additional service labels                             |
| `ingress.enabled`         | bool   | `false`               | Enable ingress                                        |
| `ingress.host`            | string | `gofr-app.local`      | Ingress hostname                                      |
| `ingress.tls.enabled`     | bool   | `false`               | Enable TLS                                            |
| `ingress.tls.secretName`  | string | `""`                  | TLS secret name                                       |
| `podLabels`               | map    | `{}`                  | Additional pod labels                                 |
| `podAnnotations`          | map    | `{}`                  | Pod annotations                                       |
| `securityContext`         | map    | `{}`                  | Container security context                            |
| `podSecurityContext`      | map    | `{}`                  | Pod security context                                  |
| `serviceAccount.create`   | bool   | `true`                | Create service account                                |
| `nodeAffinity.required`   | string | `""`                  | Required worker node label                            |
| `nodeAffinity.preferred`  | string | `""`                  | Preferred worker node label                           |
| `serviceMonitor.enabled`  | bool   | `false`               | Enable Prometheus ServiceMonitor                      |
| `serviceMonitor.interval` | string | `15s`                 | Scrape interval                                       |
| `alerts.enabled`          | bool   | `false`               | Render alert rule ConfigMap for standalone Prometheus |
| `alerts.namespace`        | string | `monitoring`          | Namespace for the rule ConfigMap                      |
| `alerts.groups`           | list   | `[]`                  | Alert rule groups                                     |
| `autoscaling.enabled`     | bool   | `false`               | Enable HPA                                            |

## Environment variable injection

Three mechanisms, applied in order (`env` overrides `envFrom`):

### 1. Bulk-load (`envFrom`)

Embedded `configMap` / `secret` are named from `nameOverride` and auto-loaded,
so no manual names to repeat:

```yaml
nameOverride: zero

configMap:
  enabled: true
  data:
    HTTP_PORT: "8000"
    LOG_LEVEL: "INFO"

secret:
  enabled: true
  stringData:
    client_id: "..."
```

This renders

`envFrom:`

`- configMapRef: {name: zero-cm}`

`- secretRef: {name: zero-secret}`

External ConfigMaps/Secrets can still be bulk-loaded by name:

```yaml
envFromSecrets:
  - name: db-credentials
envFromConfigMaps:
  - name: shared-config
```

### 2. Individual key-value (`env`)

```yaml
env:
  APP_NAME: zero
  LOG_LEVEL: DEBUG
```

### 3. Individual secret/configmap key references

```yaml
secretEnv:
  - name: DHAN_CLIENT_ID
    secretName: zero-secret
    key: client_id
```

## Embed ConfigMaps and Secrets

Names are derived from `nameOverride` (`<nameOverride>-cm`, `<nameOverride>-secret`), so
there is a single source of truth:

```yaml
nameOverride: zero

configMap:
  enabled: true
  data:
    HTTP_PORT: "8000"
    LOG_LEVEL: "INFO"

secret:
  enabled: true
  type: Opaque
  stringData:
    client_id: your-dhan-client-id
    access_token: your-dhan-access-token
```

Each becomes a `ConfigMap` / `Secret` manifest and its keys are automatically loaded into
the container via `envFrom`.

## Attach an existing PVC

```yaml
volumeMounts:
  - name: zero-storage
    mountPath: /app/data

volumes:
  - name: zero-storage
    persistentVolumeClaim:
      claimName: zero-local-pvc
```

## Ingress

```yaml
ingress:
  enabled: true
  host: zero.pi
  tls:
    enabled: true
    secretName: zero.crt
```

## Observability

### ServiceMonitor (Prometheus Operator)

```yaml
serviceMonitor:
  enabled: true
  interval: 15s
  labels:
    app: zero
    team: zero
```

The scrape path falls back to `app.metricsPath` (default `/metrics`) when
`serviceMonitor.path` is empty.

### Alerts (standalone Prometheus)

Renders a `v1 ConfigMap` named `prometheus-rules-<app>` in `monitoring` (not a
`PrometheusRule` CR — this cluster runs standalone Prometheus, not the operator).

Mount it as a volume in your Prometheus deployment:

```yaml
alerts:
  enabled: true
  namespace: monitoring
  labels:
    app: zero
  groups:
    - name: zero
      rules:
        - alert: zeroDown
          expr: up{job="zero"} == 0
          for: 5m
          labels:
            severity: critical
          annotations:
            summary: "zero service is down"
```

## Autoscaling (HPA)

```yaml
autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

## Node affinity

For k3s clusters with labeled workers:

```yaml
nodeAffinity:
  required: south # required node label worker=south
  preferred: north # preferred node label worker=north
```

## Health, metrics & probes (zero 0.16)

Zero 0.16 serves its liveness endpoint at **`/.well-known/health`** (not `/health`).

The chart hardcodes that default in `app.healthPath` and wires it into the `livenessProbe`,
`readinessProbe`, and a `startupProbe` (the latter tolerates slow boots such as DB
migrations).

Metrics are scraped from `app.metricsPort` at `app.metricsPath` (default
`/metrics`).

## Resource sizing (zero 0.16)

The chart default requests are `cpu: 100m / memory: 64Mi` (limits `200m / 128Mi`).
Scale requests up if you enable large SQLite/S3 workloads.

```yaml
# -- Resource sizing for zero 0.16 steady-state RSS (~16-65MiB)
resources:
  requests:
    cpu: 100m
    memory: 64Mi
  limits:
    cpu: 200m
    memory: 128Mi
```

## Zero 0.16 config reference

All keys exposed through the chart's `env`/`configMap` mirror the framework
[`config.md`](https://github.com/im-ng/zero/tree/experimental/docs/configuration.md):

- Logging:
  - `LOG_FORMAT` (`text`/`json`)
  - `ZERO_LOG_TIMEZONE`
- HTTP/runtime:
  - `ZERO_REQUEST_TIMEOUT_MS`
  - `INBOUND_MAX_CONCURRENT`
  - `ZERO_HTTP_LARGE_BUFFER_*`.
- Inbound rate limiting:
  - `RATE_LIMIT_*`.
- Datasources:
  - `DB_*`,
  - `REDIS_*`,
  - `CASSANDRA_*`,
  - `S3_*`
  - `FILE_STORE_*`.
- Outbound service clients:
  - `SERVICE_<NAME>_*`.

## Full example

See [`values-override.yaml`](https://github.com/im-ng/zero/tree/experimental/helm/values-override.yaml)
for the `zero` example, and
[`values-zero-0.16.yaml`](https://github.com/im-ng/zero/tree/experimental/helm/values-zero-0.16.yaml)
for a complete **zero 0.16** example that exercises the new configuration surface
(`RATE_LIMIT_*`, `ZERO_HTTP_LARGE_BUFFER_*`, `S3_*`, `SQLITE_*`, `SERVICE_<NAME>_*`, JSON
logging, inbound auth, circuit breaker, etc.).
