# Build and Debug

This page covers how to build the `zero` framework and its examples for different
targets and CPU baselines, and how to debug effectively when something goes wrong.

All commands assume you are on the **Zig 0.16.0** toolchain (the framework sets
`minimum_zig_version = "0.16.0"`).

## Build modes

Zig picks the optimization level with `--release=`:

| Mode | Flag | Use |
| --- | --- | --- |
| Debug | _(none)_ | Default. Symbols kept, safety checks on, fast compile — use while developing. |
| Fast | `--release=fast` | Speed-optimized, some safety checks off. Good for day-to-day runs. |
| Safe | `--release=safe` | Optimized but keeps runtime safety checks — preferred for baselined/production-ish builds. |
| Small | `--release=small` | Size-optimized (best binary footprint). Used for the smallest deployable image. |

## Building the examples

Each example under `examples/zero-*` is its own Zig project that depends on `zero`
via `zig fetch`. Build one by stepping into its directory:

```bash
cd examples/zero-basic
zig build                 # compiles to examples/zero-basic/zig-out/bin/basic
./zig-out/bin/basic       # run it directly
```

`zig build <step>` also exposes a `run` step for most examples (e.g.
`zig build basic` runs the server). To start from a clean slate, the framework
`Makefile` ships a `clean` target that wipes every example's `.zig-cache`,
`zig-out`, and `zig-pkg`.

```bash
make clean                # remove .zig-cache / zig-out / zig-pkg across the repo + examples
```

## Building for multiple architectures

Because the build uses `b.standardTargetOptions(.{})`, you can cross-compile any
example (or the framework binary) with `-Dtarget=<triple>`:

```bash
# same OS, different arch
zig build -Dtarget=aarch64-linux-gnu      # build an arm64 Linux binary from x86_64
zig build -Dtarget=x86_64-linux-gnu       # explicit x86_64 Linux

# other OSes
zig build -Dtarget=aarch64-macos-none     # Apple Silicon
zig build -Dtarget=x86_64-macos-none      # macOS x86_64
```

| Target triple | Builds for |
| --- | --- |
| `x86_64-linux-gnu` | Linux on x86_64 (glibc) |
| `aarch64-linux-gnu` | Linux on arm64 (glibc) |
| `x86_64-linux-musl` | Linux on x86_64 (static, no glibc) |
| `aarch64-linux-musl` | Linux on arm64 (static, no glibc) |
| `x86_64-macos-none` | macOS on x86_64 |
| `aarch64-macos-none` | macOS on Apple Silicon |

For **portable Linux binaries** prefer the `musl` ABI (`x86_64-linux-musl` /
`aarch64-linux-musl`) — it links musl statically so the binary runs on any glibc or
musl host without a matching sysroot. Cross-compiling to a **different OS** (e.g.
building a Linux binary from macOS, or vice-versa) needs the target's libc
sysroot, which Zig provides for musl but not for glibc — use musl there too.

## Baseline CPU builds (older processors)

Some deployment hosts run on older processors (e.g. Intel **Xeon** families) that
lack the newer instruction sets (AVX-512, etc.) assumed by Zig's default `native`
CPU tuning. Building for `native` on a modern dev machine can therefore produce a
binary that crashes with illegal-instruction errors on the older host.

Target the common denominator with `-Dcpu=baseline`:

```bash
zig build -Dcpu=baseline --release=safe        # runs on the widest range of CPUs
```

The framework `Makefile` wraps this as a dedicated target:

```bash
make release-base        # zig build -Dcpu=baseline --release=safe --summary all
```

`baseline` emits code for the minimal feature set every target CPU supports, so the
same artifact boots on both new and old hardware. Use it whenever you build on a
recent machine but deploy to older ones.

## Makefile convenience targets

The framework `Makefile` (at the repo root) bundles the common builds:

| Target | Command | Purpose |
| --- | --- | --- |
| `make release` | `zig build --release=fast` | Fast-optimized framework binary. |
| `make release-prod` | `zig build --release=small --summary all` | Smallest binary for production. |
| `make release-base` | `zig build -Dcpu=baseline --release=safe --summary all` | Baseline-CPU build for older hosts. |
| `make ut` | `zig build test -Dcoverage --summary all` | Unit tests with kcov coverage. |
| `make clean` | `rm -rf .zig-cache zig-out zig-pkg …` | Wipe all build artifacts + example caches. |

It also ships a few runtime introspection helpers (handy when a running app misbehaves):

```bash
make trace       # strace -c zig build basic   — summarize syscalls for the build
make top         # top -pid <basic>            — watch CPU/mem of a running instance
make usage       # ps … -o %cpu,%mem           — quick CPU/mem snapshot
```

## Debugging with VS Code + LLDB

`zero` is plain Zig, so it debugs with the standard LLDB flow. Zig 0.16.0 ships a
Python pretty-printer (`lldb_pretty_printers.py`) inside its install directory that
renders Zig values (slices, strings, optionals, errors, structs) in a readable form
instead of raw bytes.

Add this launch configuration to `.vscode/launch.json` (adjust the `program` path
and the pretty-printer path to your Zig 0.16.0 install location):

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "type": "lldb",
            "request": "launch",
            "name": "Debug Zig Test",
            "program": "${workspaceFolder}/zig-out/bin/todo",
            "args": ["-Ddebug"],
            "cwd": "${workspaceFolder}",
            "initCommands": [
                "command script import /usr/local/zig-x86_64-linux-0.16.0/lldb_pretty_printers.py",
                "type category enable zig.lang zig.std zig"
            ]
        }
    ]
}
```

The two `initCommands` do the work:

- `command script import …/lldb_pretty_printers.py` loads Zig's LLDB formatters.
- `type category enable zig.lang zig.std zig` turns them on, so a `[]const u8`,
  `?T`, or error union prints as its actual value rather than an opaque pointer.

> The `-Ddebug` argument above is passed through to the launched binary as given;
> wire it to your own app's debug switch (or drop it) as needed.

With the debugger attached you can set breakpoints in `src/main.zig`, step through
handlers, and inspect `ctx` / `container` fields directly.

## Runtime debugging helpers

When the process runs but behaves oddly:

- **Structured logs** — set `LOG_LEVEL=debug` (or `LOG_FORMAT=json` for machine
  parsing) in `configs/.env` to surface framework internals. See
  [Logging](/logging).
- **Known-leak caveat** — the unit test run uses `std.testing.allocator`; a few paths
  leak and the build exits non-zero even when every assertion passes. That is a known
  issue, not a logic bug — see [Testing](/testing#known-leak-caveat).
- **Resource watch** — `make top` / `make usage` (or plain `top`/`ps`) track CPU and
  RSS while the app serves traffic; `make trace` summarizes syscalls during a build.

## Common build errors

| Symptom | Cause | Fix |
| --- | --- | --- |
| Link error: cannot find `librdkafka` / `libduckdb` | These are **weak-linked** native libs. | `apt install librdkafka-dev` / `brew install librdkafka` (Kafka) and provide `libduckdb.so` on the library path; or set `LD_LIBRARY_PATH` / rpath. macOS needs the Cellar include/lib paths (already wired in `build.zig`). |
| Stale / confusing compile errors after a Zig or dependency bump | Cached artifacts from a previous toolchain. | `make clean` (or `rm -rf .zig-cache zig-out zig-pkg`), then rebuild. |
| `illegal instruction` on the deploy host | Built for `native` CPU on a newer dev box, run on older hardware. | Rebuild with `make release-base` (`-Dcpu=baseline`). |
| `minimum_zig_version` / language mismatch | Wrong Zig version. | Install Zig **0.16.0**; the framework requires it. |
| Examples fail to fetch `zero` | Missing/incorrect `zig fetch` of the `experimental` branch. | Re-run the install from `refs/heads/experimental` (see [Migrating to 0.16](/migrating-0-16)). |
