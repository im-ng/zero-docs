# Zero CLI

The `zero` framework ships a small CLI for project tasks like scaffolding
migrations. Build it from your app (or a framework checkout) with:

```bash
zig build zero --prefix=/usr/local/bin

or

zig build zero
sudo cp zig-out/bin/zero /usr/local/bin
```

This puts a `zero` binary in `zig-out/bin`. Run it with no arguments or
`--help` to print usage and exit.

## Commands

### `migrator add`

Scaffolds a new migration in `src/migrations/` and (re)generates the registry
in `src/migrations/all.zig`:

```bash
zero migrator add --name create-users
# also accepts the = form:
zero migrator add --name=create-users
```

- `zero` sanitizes `--name` (hyphens → `_`). It sets the generated file name and the migration number (Unix epoch seconds).
- Re-adding an existing name is a safe no-op. `zero` ignores `MigrationAlreadyExists`.
- See [Migrations](./migrations.md) for the full workflow: editing the generated `<name>_run` function, calling `migrations.all(app)`, then `app.runMigrations()`.

### `--help` / `-h`

Print the CLI usage and exit.

## Errors

| Condition                       | Result                                                                   |
| ------------------------------- | ------------------------------------------------------------------------ |
| `--name` with no value          | `error: --name requires a value` (`MissingNameValue`)                    |
| `migrator` without `add`        | prints help and exits                                                    |
| unknown subcommand / flag       | `error: unknown command ...` / `error: unknown flag ...` (`UnknownFlag`) |
| `migrator add` without `--name` | `error: migrator add requires --name <name>` (`MissingName`)             |

## Building CLI applications (not the zero tool)

To run your own app as a command instead of an HTTP server, use the app-level
CLI API in [CLI Apps](./cli.md):

- `App.newCmd(allocator, io, em)` — like `App.new` but does not start the HTTP or metrics servers.
- `app.SubCommand(name, handler, opts)` — register a subcommand (`handler: fn(*Context) anyerror!void`).
- `app.runCmd(args)` — parse argv, dispatch to a subcommand, and build a CLI `Context`.
- `ctx.Param("name")` — read a `--flag value` / `--flag=value` / `-f value` argument.

## Related

- [Migrations](./migrations.md) — the `migrator add` workflow end to end.
- [CLI Apps](./cli.md) — running your app as a CLI / one-shot job.
- [Benchmark](./benchmark.md) — the `zig build bench` harness (a separate binary).
