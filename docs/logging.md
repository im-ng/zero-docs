# Logging

`zero` logs in a structured way. It shows the ongoing state of your app and the services it runs. The logs stay tidy and give a clear visual cue about the app's status.

You can customize what you see. Pick the information you need at any given time.

Set `LOG_LEVEL` to control your app's logging. It reveals more about the underlying state. The lowest level is `debug`, which shows every log above it.

Levels from highest to lowest: `fatal`, `error`, `warn`, `info`, and `debug`.

## Remote log level

`LOG_LEVEL` can also be driven at runtime from a remote endpoint.

When `REMOTE_LOG_URL` is configured, `zero` registers an outbound HTTP client
and a cron job that fetches the level and every `REMOTE_LOG_REFRESH_INTERVAL` seconds
(default 30) and applies it in-process.

```mermaid
json
{
  "id": "service-uuid",
  "level": "debug"
}
```

The feature is opt-in — leave `REMOTE_LOG_URL` empty to disable it.

See [Configuration → Remote Log](./configuration.md#remote-log) for the keys.

## JSON structured logging

Set `LOG_FORMAT=json` (env or `.env`) to emit one JSON object per log line instead of
the colorized text format:

```json
{ "ts": "14:22:05", "level": "info", "msg": "connected to database" }
```

Fields:

- `ts` (timestamp, see [Log timezone](#log-timezone)),
- `level`
  (`debug`|`info`|`warn`|`error`|`fatal`)
- `msg`. Non-string arguments are still serialized (via `{any}`).

You can also flip the format in code through the logger:

```zig [src/main.zig]
zero.logger.setJsonFormat(true);   // or false for text
```

## Log timezone

Log timestamps use the system local zone by default. Override with `ZERO_LOG_TIMEZONE`:

| Value                               | Behavior                                                    |
| ----------------------------------- | ----------------------------------------------------------- |
| `local` (default) / empty           | System zone from `/etc/localtime`                           |
| `utc`                               | Force UTC                                                   |
| IANA name (e.g. `America/New_York`) | Pin a specific zone, resolved from the embedded tz database |

Resolution failure on an IANA name falls back to the system local zone, and ultimately
to UTC. The timezone is resolved before the first log line (e.g. _"Loaded config from
file"_), so it applies to startup logs too.

When your `zero` app runs, it reads the log level. This tells you:

- log level of statement
- database/kv/mq connection status
- authentication setup
- static directory attachments,
- request trace id, response status, response handling time
- possibly errors that occurred.

## Visual cue

![image](./public/hello-zero.webp)

![image](./public/preview-visual-cue-2.webp)

## Method signature

```zig [With in ctx handler]
ctx.info("message");

ctx.debug([]const u8);

ctx.err([]const u8);

ctx.warn([]const u8);

ctx.fatal([]const u8);

ctx.any(struct);
```
