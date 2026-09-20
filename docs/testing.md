# Testing

`zero` ships a layered test and benchmark suite so the framework can be verified and load-tested.

These commands run against the `zero` repository, not your application.

Use them when you contribute to or validate a build of the framework.

| Layer             | Command                      | Tests | Source                                |
| ----------------- | ---------------------------- | ----- | ------------------------------------- |
| Unit              | `zig build test`             | 139   | inline `test` blocks across `src/`    |
| Integration       | `zig build test-integration` | 2     | `src/datasource/integration_test.zig` |
| Memory validation | `zig build test-validation`  | 3     | `src/validation/memory_test.zig`      |
| Cover coverage    | `zig build -Dcoverage test`  | --    | kcov report                           |
| Benchmark         | `zig build bench`            | --    | Benchmark results                     |

## Test layers

### Unit tests

`zig build test` builds `src/tests.zig` (the test root) and runs every inline `test` block across the source tree.

On the `main` (0.16) branch the suite compiles and runs. The framework has **139** unit tests, **2** integration tests, and **3** memory-validation tests — **144** test blocks in total.

```bash
zig build test
```

### Integration tests

`zig build test-integration` exercises the real datasource path against `SQLite :memory:` and, when configured, Postgres.

It runs 2 tests rooted at `src/tests_integration.zig`.

These tests need a native driver, so they run as a separate step and are excluded from the kcov coverage run.

```bash
zig build test-integration
```

### Memory-validation tests

`zig build test-validation` proves that allocations made under `zero.Context` are released per request, per cron tick, and per pub/sub message.

It uses a counting allocator and covers the `timestampz` invalid-free fix. There are 3 tests in `src/tests_validation.zig` and `src/validation/memory_test.zig`.

```bash
zig build test-validation
```

### Coverage

`zig build -Dcoverage test` runs the unit tests under **kcov** and writes an HTML report to `zig-out/kcov/`. Coverage is measured at **87.91%**.

```bash
zig build -Dcoverage test
```

## How the tests are organized

- Each source file carries its own inline `test` blocks (the Zig convention).

- `src/tests.zig` is the **test root**. It imports every module and references them in a `comptime { _ = module; }` block, so `zig build test` picks up all inline tests automatically.

- `build.zig` constructs a dedicated test module (`test_module`) whose root is `src/tests.zig`. It uses the same dependency imports as the library module (pgz, httpz, zul, okredis, sqlite, nats, protobuf, graphql, …).

## Known leak caveat

The unit run uses `std.testing.allocator` (DebugAllocator). Some paths leak memory (7 known leaks), so the build **exits non-zero** even though every assertion passes.

This is a known issue, not a logic bug, so the assertions are still trustworthy. When writing tests, allocate via `std.testing.allocator` and accept the leak warnings for known cases.

## Benchmark harness

`zig build bench` builds a standalone HTTP load generator at `./zig-out/bin/bench`. It boots the real `zero.App`, drives it with the `zul` HTTP client across a concurrency ramp, and reports throughput plus latency percentiles. No third-party load tool is required.

The full reference (flags, JSON report, leak heuristic, CI regression job, and external `wrk`/`k6` recipes) is on the [Benchmark](./benchmark.md) page.

```bash
zig build bench                                  # builds ./zig-out/bin/bench
./zig-out/bin/bench                              # default: /.well-known/health, 3s/level, ramp 1..1000
./zig-out/bin/bench --duration=3 --levels=1,50,200,500,1000
./zig-out/bin/bench --path=/your/route --duration=5 --levels=10,100,500
./zig-out/bin/bench --log                         # leave framework logging on
```

Run the binary directly (`./zig-out/bin/bench`), **not** `zig build run bench`. The bench harness uses `pub fn main(init: std.process.Init)`, and the `--listen=-` stdout protocol would interfere.

The output columns are throughput (req/s), latency percentiles (µs), error count, resident set size per level (`rss`), and RSS growth (`dRss`), which is the leak signal.

The liveness endpoint is `/.well-known/health`. The bare `/health` returns 404 by design.

## Prerequisites & housekeeping

- **`librdkafka`** is linked as a weak system library. Kafka tests fail to build without `apt install librdkafka-dev` / `brew install librdkafka`.

- For integration tests, point the `DB_*` config at a reachable Postgres. SQLite uses `:memory:` and needs no service.

- Always clear caches before switching Zig versions: `make clean` removes `.zig-cache`, `zig-out`, `zig-pkg/`, and every example's build artifacts.

- Release build: `zig build --release=fast`.
