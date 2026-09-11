![logo](./zero-fmk-light.webp){.light-only}
![logo](./zero-fmk-dark.webp){.dark-only}

`zero` is a strongly opinionated Zig web framework built on top of `http.zig` that aims for zero allocations and created to make development easier while keeping performance and observability in mind.

 `zero` framework is completely configurable, you may isolate and attach best-in-class built-in solutions as you see fit using the 12 Factor App methodology.

`zero` framework has useful features like drop-in support for numerous databases, queuing systems, and external services, as well as REST, authentication, logging, metrics, observability, and scheduling.


### Key Features

- `.env` based configurations for app to start
- Drop-in support for well known technologies
    - `Postgres` / `SQLite`
        - Seed data on startup
        - Manage migrations with ease
    - KV Store — `Redis`, `NATS KV`, `Memory`, `SQLite`
    - Cache — `Redis` (with `nats_kv` / `sqlite` / `memory` backends)
    - Pub/Sub — `MQTT`, `NATS`, `Kafka`
    - File Store — `Local`, `FTP`, `SFTP`
    - `Authentication`
        - OAuth, API Key and Basic credentials mode
        - Role-Based Access Control (RBAC) on protected routes
- Build REST Standard out-of-box, including Auto CRUD resource handlers
- GraphQL-over-HTTP and Protobuf over HTTP
- Well defined logging, with remote log-level hot reload
- Schedule tasks (cron) for one or more repetition
- Rate limiter middleware (IP / header / custom key modes)
- Websockets & HTMX CRUD
- Swagger / OpenAPI rendering
- Track and expose application metrics for observability
- Trace application performance with ease
- More on [Feature Parity](../parity)

### Motivation

- <span style='color:#f7a41d;'>Zig</span> - Inspired
- Well-defined structure to build web applications in <span style='color:#f7a41d;'>Zig</span>
- Plug and Play configurations for easy use
- Built-in solution to achieve results without boilerplate codes
- Best opinions in class for quick development and deployment

