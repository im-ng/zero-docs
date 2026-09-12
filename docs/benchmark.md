# Benchmark

`zero` ships a self-contained HTTP load-test harness so you can measure throughput,
latency, and memory of a real running app — no third-party load generator required.
It boots the real `zero.App` (via `App.run()` in a background thread), drives it with
a fixed concurrency ramp using the `zul` HTTP client, and reports throughput plus
latency percentiles.

For higher-fidelity distributed load you can instead point `wrk`/`k6` at the running
app (see [External recipes](#external-recipes-optional)).

## Build & run

```bash
zig build bench                              # builds ./zig-out/bin/bench
./zig-out/bin/bench                          # default: /.well-known/health, 3s/level, ramp 1..1000
./zig-out/bin/bench --duration=3 --levels=1,50,200,500,1000
./zig-out/bin/bench --path=/your/route --duration=5 --levels=10,100,500
./zig-out/bin/bench --log                     # leave framework logging on
```

The bench step is **not** part of the default `zig build` — run `zig build bench`
explicitly.

::: tip
Run the binary directly (`./zig-out/bin/bench`). Do **not** use `zig build run bench`
— the harness uses `pub fn main(init: std.process.Init)` and the `--listen=-` stdout
protocol would interfere.
:::

## Flags

| flag | default | meaning |
| --- | --- | --- |
| `--duration=N` | `3` | seconds to hammer each concurrency level |
| `--levels=csv` | `1,10,50,100,200,500,1000` | concurrency levels (worker counts) |
| `--path=` | `/.well-known/health` | target path on `http://127.0.0.1:<HTTP_PORT>` |
| `--log` | off | keep framework logs on (off silences them via `logLevel=99`) |
| `--suite` | off | run a built-in 14-scenario suite instead of a single path |
| `--json` | off | write `zig-out/bench/report.json` with per-scenario `peak_rss_mib`, `drss_kib`, `leak` |
| `--debug-alloc` | off | run under `DebugAllocator` and flag a leak when RSS growth exceeds 8 MiB |
| `--server` | off | keep the app up after the ramp so an external generator (e.g. k6) can drive it |

### Built-in suite

`--suite` runs a fixed set of scenarios covering the framework's hot paths:
`health`, `health-json`, `health-html`, `index`, `text`, `json`, `keys`, `db`,
`proto-get`, `proto`, `graphql-get`, `graphql`, `filestore-get`, `filestore`.
Use it together with `--json` to produce a comparable report:

```bash
./zig-out/bin/bench --suite --json --duration=2 --levels=1,25,100
```

## Output

```
zero framework HTTP benchmark
target=http://127.0.0.1:8080/.well-known/health  duration=3s/level  logging=off

concurrency   req/s        p50(us)   p95(us)   p99(us)   max(us)   errors   rss(MiB)   dRss(KiB)
        1         5411         180         317         472       1704        0       34.3       748.0
       50         9725        4447       19117       23823      23199        0       36.1      1840.0
      200         9050       19569       47494       69628     126479        0       37.5      1436.0
      500        13942       25778       88284       98705     138251        0       38.1       612.0
     1000        31992       26568       80355       97065     151468        0       38.1         0.0

peak RSS over run: 38.1 MiB
```

- Columns: throughput (`req/s`), latency percentiles in µs, error count, resident set
  size at end of level (`rss(MiB)`), and RSS growth within the level
  (`dRss(KiB)` = end − start of that level).
- **Memory** is sampled from `/proc/self/status` `VmRSS` (Linux) at the start and end
  of each level, and the run-wide high-water mark is printed as `peak RSS`. This
  captures the *whole process* — framework server plus all benchmark clients — without
  instrumenting allocators. A steadily climbing `dRss` across levels, or a `peak RSS`
  that never plateaus, is the leak signal. On non-Linux platforms `readRss()` returns
  0 and the columns read `0.0`.

Latencies are end-to-end client-measured (request issue → response received).

::: warning
The framework's liveness endpoint is `/.well-known/health` (and `/.well-known/live`),
**not** `/health`. Hitting `/health` returns 404 — that is expected, not a bug.
:::

## JSON report & leak heuristic

With `--json`, the harness writes `zig-out/bench/report.json` containing one entry per
scenario:

```json
{ "name": "health", "peak_rss_mib": 38.1, "drss_kib": 0.0, "leak": false }
```

`--debug-alloc` additionally runs under `DebugAllocator` and treats a run-wide RSS
growth above **8 MiB** as a leak (`"leak": true`). This is the gate used by CI.

## CI regression job

The `.github/workflows/ci.yml` `bench_regression` job runs the suite against a committed
baseline (`bench/baseline.json`) and fails when any scenario reports
`"leak": true` **or** RSS growth exceeds both 15% and 8 MiB. The baseline is refreshed
on merge, so a legitimate performance/footprint change must update `bench/baseline.json`
alongside the code.

## External recipes (optional)

The in-repo harness is sufficient for most capacity checks. For higher-fidelity
distributed load, start the app separately (e.g. `zig build && ./zig-out/bin/zero`) and
point an external generator at it. The repo also ships `bench/k6/baseline.js` for k6.

### wrk

```bash
wrk -t12 -c400 -d30s --latency http://127.0.0.1:8080/.well-known/health
```

### k6

```javascript
import http from 'k6/http';
export const options = { vus: 200, duration: '30s' };
export default function () {
  http.get('http://127.0.0.1:8080/.well-known/health');
}
```

```bash
k6 run script.js
```

## Implementation notes

- `src/bench/main.zig` — the harness (standalone exe, `pub fn main(init: std.process.Init)`).
- `build.zig` — `bench_module` + `bench_exe` + `bench_step` ("bench").
- Timing uses `clock_gettime(CLOCK_MONOTONIC)`; the latency histogram uses fixed
  upper-bound buckets, so memory is `O(buckets)` regardless of request count.
- The `zul` client reuses one `Client` + one connection per worker; requests set
  `Connection: close` to avoid keep-alive pipelining skew.
