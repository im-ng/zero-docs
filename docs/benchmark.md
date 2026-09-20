# Benchmark

`zero` ships a self-contained HTTP load-test harness. You measure throughput, latency,
and memory of a real running app with it — no third-party load generator needed.

It boots the real `zero.App` in a background thread (via `App.run()`). It drives the app
with a fixed concurrency ramp using the `zul` HTTP client, then reports throughput and
latency percentiles.

For higher-fidelity distributed load, point `wrk` or `k6` at the running app instead
(see [External recipes](#external-recipes-optional)).

## Build & run

```bash
zig build bench                              # builds ./zig-out/bin/bench
./zig-out/bin/bench                          # single --path run: /.well-known/health, 3s/level, ramp 1..1000
./zig-out/bin/bench --duration=3 --levels=1,50,200,500,1000
./zig-out/bin/bench --path=/your/route --duration=5 --levels=10,100,500
./zig-out/bin/bench --target=all --duration=2 --levels=1,25,100   # full category suite
./zig-out/bin/bench --target=sql,graphql     # only the sql + graphql categories
./zig-out/bin/bench --host=127.0.0.1 --port=8080 --target=all    # drive an external server
./zig-out/bin/bench --vusers=500             # ramp 1,125,250,500
./zig-out/bin/bench --log                     # leave framework logging on
```

The bench step isn't part of the default `zig build`, so run `zig build bench`
explicitly. The harness writes `report.json` on every run (see
[JSON report](#json-report--leak-heuristic)); `--json` is still accepted for CI parity.

::: tip
Run the binary directly (`./zig-out/bin/bench`). Do **not** use `zig build run bench`
— the harness uses `pub fn main(init: std.process.Init)` and
the `--listen=-` stdout protocol would interfere.
:::

## Flags

| flag            | default                    | meaning                                                                                                                                                                                                                                       |
| --------------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--duration=N`  | `3`                        | seconds to hammer each concurrency level                                                                                                                                                                                                      |
| `--levels=csv`  | `1,10,50,100,200,500,1000` | concurrency levels (worker counts)                                                                                                                                                                                                            |
| `--path=`       | `/.well-known/health`      | target path; used for the default single-scenario run                                                                                                                                                                                         |
| `--target=csv`  | single `--path` run        | select scenario **categories**: `health`, `http`, `sql`, `nosql`, `timeseries`, `search`, `proto`, `graphql`, `filestore`. `all` runs every category (alias for `--suite`). Datasource categories are skipped unless their backend env is set |
| `--host=host`   | —                          | external-server mode: drive an already-running zero server at `http://<host>:<port>` instead of booting the embedded app                                                                                                                      |
| `--port=port`   | `8080`                     | port used together with `--host`                                                                                                                                                                                                              |
| `--vusers=N`    | —                          | expand the ramp to `1, N/4, N/2, N` (rounded, unique) so the RSS plateau/leak heuristic stays meaningful                                                                                                                                      |
| `--log`         | off                        | keep framework logs on (off silences them via `logLevel=99`)                                                                                                                                                                                  |
| `--suite`       | off                        | alias for `--target=all`; runs every category                                                                                                                                                                                                 |
| `--json`        | always on                  | `report.json` is always written; this flag is accepted for CI parity                                                                                                                                                                          |
| `--debug-alloc` | off                        | run under `DebugAllocator` and flag a leak when RSS growth exceeds 8 MiB                                                                                                                                                                      |
| `--server`      | off                        | keep the app up after the ramp so an external generator (e.g. k6) can drive it                                                                                                                                                                |

### Scenario categories (`--target`)

`--target` picks which scenario **categories** to run. With no flag, the harness runs a
single `--path` scenario; `--target=all` (or `--suite`) runs the full set:

| category     | scenarios                                                        |
| ------------ | ---------------------------------------------------------------- |
| `health`     | `health`, `health-json`, `health-html`                           |
| `http`       | `index`, `text`, `json`, `keys`, `db`                            |
| `sql`        | `duckdb-query` _(gated on `DUCKDB_PATH`)_                        |
| `proto`      | `proto-get`, `proto`                                             |
| `graphql`    | `graphql-get`, `graphql`                                         |
| `filestore`  | `filestore-get`, `filestore`                                     |
| `timeseries` | `ts-write`, `ts-query` _(gated on `INFLUXDB_URL`)_               |
| `search`     | `solr-index`, `solr-query` _(gated on `SOLR_URL`)_               |
| `nosql`      | `nosql-put`, `nosql-get` _(gated on `CASSANDRA_CONTACT_POINTS`)_ |

`gated` scenarios are skipped unless you set the named backend env var. The datasource
routes only count toward the report when you actually wire up the backend:

```bash
DUCKDB_PATH=./data/bench.db INFLUXDB_URL=http://localhost:8086 \
  ./zig-out/bin/bench --target=all --json --duration=2 --levels=1,25,100
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
  size at the end of the level (`rss(MiB)`), and RSS growth within the level
  (`dRss(KiB)` = level end − start).
- **Memory** is sampled from `/proc/self/status` `VmRSS` (Linux) at the start and end
  of each level. The run-wide high-water mark prints as `peak RSS`. This captures the
  _whole process_ — framework server plus all benchmark clients — without instrumenting
  allocators. A `dRss` that climbs steadily across levels, or a `peak RSS` that never
  plateaus, signals a leak. On non-Linux platforms `readRss()` returns 0 and the
  columns read `0.0`.

Latencies are measured end-to-end on the client (request issue → response received).

::: warning
The framework's liveness endpoint is `/.well-known/health` (and `/.well-known/live`),
**not** `/health`. Hitting `/health` returns 404 — that is expected, not a bug.
:::

## JSON report & leak heuristic

The harness writes `zig-out/bench/report.json` on **every** run (one entry per scenario):

```json
{ "name": "health", "peak_rss_mib": 38.1, "drss_kib": 0.0, "leak": false }
```

`--debug-alloc` also runs under `DebugAllocator`. It treats run-wide RSS growth above
**8 MiB** as a leak (`"leak": true`). CI uses this gate.

A baseline snapshot lives at `bench/baseline.json` (peak RSS per scenario). The
regression gate compares fresh runs against it.

## Local regression check (`check_regression.sh`)

`bench/check_regression.sh` runs the CI gate locally. It builds the harness, runs the
suite, and diffs the report against `bench/baseline.json`.

```bash
DURATION=2 LEVELS=1,25,100 TARGET=all bench/check_regression.sh
```

| env override | default         | meaning                                               |
| ------------ | --------------- | ----------------------------------------------------- |
| `DURATION`   | `2`             | per-level seconds                                     |
| `LEVELS`     | `1,25,100`      | comma list of concurrency levels                      |
| `TARGET`     | `all`           | `--target` value (`all` or a category csv)            |
| `ZIG`        | `zig` on `PATH` | zig binary (also accepts a zig install **directory**) |

It exits `0` when there is no leak and no regression, and `1` on regression/leak or
failure. A scenario is flagged as a **regression** when its `peak_rss_mib` grew by **both**

> 15% (relative) **and** >8 MiB (absolute) versus the baseline; a `"leak": true` entry
> fails outright. If no baseline file exists yet, the script initializes `bench/baseline.json`
> from the current run and exits `0` (skipping the comparison).

## CI regression job

The `bench_regression` job in `.github/workflows/ci.yml` runs the same gate (via
`check_regression.sh`) against the committed baseline (`bench/baseline.json`). It fails
on any `"leak": true` **or** on RSS growth exceeding both 15% and 8 MiB.

The baseline refreshes on merge. So a legitimate performance or footprint change must
update `bench/baseline.json` alongside the code.

## External recipes (optional)

The in-repo harness covers most capacity checks. For higher-fidelity distributed load,
start the app separately (e.g. `zig build && ./zig-out/bin/zero`) and point an external
generator at it.

The repo ships k6 helpers under `bench/k6/` — `baseline.js`, plus `report.html` and
`report.json` from a sample run.

### wrk

```bash
wrk -t12 -c400 -d30s --latency http://127.0.0.1:8080/.well-known/health
```

### k6

```javascript
import http from "k6/http";
export const options = { vus: 200, duration: "30s" };
export default function () {
  http.get("http://127.0.0.1:8080/.well-known/health");
}
```

```bash
k6 run script.js
```

## Implementation notes

- `src/bench/main.zig` — the harness (standalone exe, `pub fn main(init: std.process.Init)`).

- `build.zig` — `bench_module` + `bench_exe` + `bench_step` ("bench").

- Timing uses `clock_gettime(CLOCK_MONOTONIC)`. The latency histogram uses fixed
  upper-bound buckets, so memory is `O(buckets)` regardless of request count.

- The `zul` client reuses one `Client` and one connection per worker. Requests set
  `Connection: close` to avoid keep-alive pipelining skew.
