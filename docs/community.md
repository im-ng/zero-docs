# Community & Help

`zero` is open source and developed in the open. Here is where to go when you need help,
want to report a bug, or want to shape the roadmap.

## Get help

- **GitHub Discussions** — ask questions and share how you're using zero:
  [github.com/im-ng/zero/discussions](https://github.com/im-ng/zero/discussions)
- **GitHub Issues** — report bugs or request features:
  [github.com/im-ng/zero/issues](https://github.com/im-ng/zero/issues)
- **Source** — the framework lives at
  [github.com/im-ng/zero](https://github.com/im-ng/zero); the docs site you're reading
  is in the same repo under `docs/`.

## Before you ask

1. Check the [Getting Started](/started) quickstart and the relevant
   [Built-in solutions](/) page.
2. Search [Discussions](https://github.com/im-ng/zero/discussions) — your question may
   already be answered.
3. When reporting a bug, include your `zig version`, the `zero` revision, and the
   relevant `configs/.env` (redact secrets) plus the failing route/handler.

## Contributing

Docs and framework changes are both welcome via pull request against the `experimental`
branch. The docs build with `bun run docs:build`; see `AGENTS.md` in the repo root for
conventions (new pages must be registered in the sidebar/nav, and `docs/0.15.2/` is a
frozen snapshot that must not be edited).
