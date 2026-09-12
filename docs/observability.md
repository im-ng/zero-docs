# Metrics

Though `LOG_LEVEL` gives visual
cue to understand the current status of the system, one can not keep scrolling through them all the time. There comes the `metrics` as handy.

`zero` exposes some default metrics to monitor the current state of the system in the `prometheus` format, which allows anyone can attach it to `prometheus` scrapper and preview the state in `Grafana` dashboards.

As this becomes industry standard, `zero` framework follows the same path to exhibit some basic and needed metris.

The metrics are exposed on a **separate listener** (`METRICS_PORT`, default `2121`) — not
on the app's `HTTP_PORT` — and are kept outside of the authentication route. Scrape
`http://<host>:2121/metrics` with Prometheus.

Following list of metrics value available

| metric_name               |  Export   |                                               Description |
| :------------------------ | :-------: | --------------------------------------------------------: |
| app_info                  |   gauge   |                             The app and framework version |
| app_http_response         | histogram |                         The response status and latencies |
| app_sql_response          | histogram |                    The query type and execution latencies |
| app_http_service_response | histogram | The request status and latencies of the external services |
| app_circuit_open_total    |  counter  |            Circuit-breaker open events (label `name`)      |
| app_pubsub_dlq_total      |  counter  |  Dead-lettered messages (labels `topic`, `consumer`)      |

![metrics](./public/preview_metrics.webp)

## Tracing

`zero` app by default injects a trace id for all your incoming requests and allows to propogate to execute your own logic.

The trace id is injected as `x-correlation-id`, with that we can gain more insights on how the requests are carry forwarded across multiple services and address if there is any bottleneck encountered.


**NOTE**

The tracing capability is limited and basic in `zero` app `0.0.1` version. The target to integrate OpenTelemetry depends on other factors.

![tracing](./public/preview_tracing.webp)

## Custom metrics

Beyond the built-in metrics, register your own counters, gauges, and histograms from
any handler via the container's `metricz`. Registered metrics are exported on
`/metrics` automatically.

```zig [src/main.zig]
// a counter keyed by a label enum
const CounterLabels = enum { orders, signups };

pub fn handler(ctx: *Context) !void {
    const orders = try ctx.container.metricz.Counter(CounterLabels, ctx.allocator, "app_events_total", "business events");
    try orders.incr(.orders);                 // +1
    try orders.incrBy(.signups, 2);           // +n

    const in_flight = try ctx.container.metricz.Gauge(CounterLabels, ctx.allocator, "app_in_flight", null);
    try in_flight.incr(.orders);
    try in_flight.set(.signups, 10);

    const buckets = [_]f64{ 1, 5, 10, 50, 100 };
    const lat = try ctx.container.metricz.Histogram(CounterLabels, ctx.allocator, "app_latency_ms", &buckets, "request latency");
    try lat.observe(.orders, 12.3);
}
```

- `Counter(L, allocator, name, help)` → `incr(label)` / `incrBy(label, n)`.
- `Gauge(L, allocator, name, help)` → `incr` / `decr` / `set(label, value)`.
- `Histogram(L, allocator, name, buckets, help)` → `observe(label, value)`.

`L` is an `enum` whose variants become the metric's labels. Labels and `help` show up
in the Prometheus output alongside the built-in metrics.