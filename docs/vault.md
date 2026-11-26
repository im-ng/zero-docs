# Vault

`zero` can pull its secrets from **HashiCorp Vault** at startup, so credentials never sit in a `.env` file or a container image. When `VAULT_ADDR` is set, `zero` authenticates, fetches the secret paths you name, and merges the returned key/value pairs into the process environment. Every other built-in then reads from that environment. So `DB_PASSWORD`, `REDIS_PASSWORD`, `SUPABASE_DB_PASSWORD`, and friends can come straight from Vault without any code changes.

## Quickstart

Spin up a local Vault in dev mode for testing:

```bash
podman pull docker.io/library/vault:latest

podman run -d \
  --name vault \
  -p 8200:8200 \
  -v vault-data:/vault/data \
  -e VAULT_DEV_ROOT_TOKEN_ID=root-token \
  docker.io/library/vault:latest \
  server -dev -dev-root-token-id=root-token
```

## Configuration

| Env                    | Required | Description                                                                 |
| ---------------------- | -------- | --------------------------------------------------------------------------- |
| `VAULT_ADDR`           | yes*     | Base URL of the Vault server (e.g. `https://vault.example.com`).            |
| `VAULT_TOKEN`          | no†      | A Vault token. Use this or AppRole (`VAULT_ROLE_ID` + `VAULT_SECRET_ID`).   |
| `VAULT_ROLE_ID`        | no†      | AppRole Role ID. Paired with `VAULT_SECRET_ID`.                            |
| `VAULT_SECRET_ID`      | no†      | AppRole Secret ID. Paired with `VAULT_ROLE_ID`.                             |
| `VAULT_SECRETS_PATH`   | yes*     | Comma-separated KV paths to fetch (e.g. `secret/data/zero,secret/data/db`).|

\* Required when `VAULT_ADDR` is set.
† Provide either `VAULT_TOKEN` or the AppRole pair.

```bash [configs/.env]
VAULT_ADDR=https://vault.example.com
VAULT_ROLE_ID=...
VAULT_SECRET_ID=...
VAULT_SECRETS_PATH=secret/data/zero,secret/data/zero-db
```

## How it works

1. At startup, before any datasource wires up, `zero` runs the Vault loader.
2. It authenticates: either with `VAULT_TOKEN` directly, or by logging into the AppRole endpoint (`/v1/auth/approle/login`) using `VAULT_ROLE_ID` + `VAULT_SECRET_ID` to mint a token.
3. For each path in `VAULT_SECRETS_PATH`, it reads the secret (`GET /v1/<path>`) and merges the key/value pairs into an owned config map.
4. Datasources and services read those values through `config.get*()`. Vault wins over the values in `.env`.

Both **KV v1** and **KV v2** are supported. `zero` reads the nested `data.data` object for v2 and `data` directly for v1. From 0.5.4, a path that returns `404` is retried once with `data/` inserted after the first path segment. So `secret/zero/db` also works for a v2 mount.

::: warning Secrets are never logged
Secret values are never written to logs. Only the fact that secrets were loaded, and any path fetch failures, are logged.

Vault values live in the config map, not in the raw process environment. If your own code reads `std.process.environ` or `getEnvVarOwned` directly, it won't see them. Use `config.get*()` instead.
:::

See the implementation in [`src/vault.zig`](https://github.com/im-ng/zero/tree/main/src/vault.zig).
