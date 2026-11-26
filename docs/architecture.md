# Architecture

`zero` uses the dependency injection pattern. It centers its abstractions around three main components.

- `App` 
- `Container`
- `Context`



```mermaid
stateDiagram-v2
    direction TB
    state zero-fmk {
        state App {
            Container
            Context
        }

    }
```


## App - Orchestrator

`App` orchestrates the application life cycle. It manages the framework's functionality.

`App` references all major sub-systems. It gives you methods to access and run the configuration, routing, logging, registered migrations, and the overall life-cycle.

`App` is the main entry point for the `zero` app.

## `App` key accessible methods

```mermaid
stateDiagram-v2
    direction TB
    app.new() --> appLifeCycle
    appLifeCycle --> app.run()
    state  appLifeCycle {
      direction LR
      app.addMigration()
      app.runMigrations()
      app.get()
      app.post()
      app.onStartup()
      app.addCronjob()
      app.addHttpService()
      app.addSubscription()
      app.graphql()
      app.addRestHandlers()
      app.addKVStore()
      app.addFileStore()
      app.addPubSubSubscription()
    }
    appLifeCycle --> app.shutdown()
```

## App Lifecyle

```mermaid
stateDiagram-v2
    direction TB
    Initialize: App Initialization app.new() 
    Config: Load configurations from environment
    Migrations: Register data model migrations
    Warmup: Add any warmup steps for app
    Routes: Add Http routes to be handled
    Run: Start the app to serve requests
    Process: Process incoming requests
    Shutdown: Gracefully shutdown system

    Initialize --> Config
    Config --> Migrations
    Migrations --> Warmup
    Warmup --> Routes
    Routes --> Run
    Run --> Process
    Process --> Shutdown
```

## Methods explanation


```zig
// `init.environ_map` is the `*std.process.EnvMap` from `pub fn main(init: std.process.Init)`
const app = try App.new(allocator, init.io, init.environ_map);
```

`new()` launches the `zero` app instance. It sets up and creates all the underlying sub-systems when valid configuration is available.

```zig
try app.get("path", custom-handler);
```

`get()`, `post()`, `patch()`, `delete()` wire your custom handlers into the HTTP router. They let a resource endpoint respond when a request matches its path.

```zig
try app.addMigration(key, migrateHanlder);
```

`addMigration()` attaches a data model migration to run when the app starts. Your migrateHandler must follow the `migrate` struct signature to run correctly.

```zig
try app.runMigrations();
```

`runMigrations()` runs the migrations you attached in the steps above. It skips any migration it finds already ran in its flow.

```zig
try app.addCronJob("schedule-notation", "task-name", taskHandler);
```

`addCronJob()` is how you run repeatable jobs the app needs to perform on a schedule.

```zig
try app.addSubscription(pubSubTopic, subscribeHandler);
```

`addSubscription()` lets the app subscribe to a `pubsub` topic and act when messages arrive.

```zig
try app.onStatup(prepareCache);
```

`onStartup` runs any setup the app needs before serving requests. Examples are warming up the cache or taking backups.

```zig
try app.addHttpService("external-service", "service-url");
```

`addHttpService()` lets you register an external HTTP/HTTPS service for the app's lifetime. It makes service-to-service calls possible with minimal code.

```zig
try app.addWebsocket(socketHandler);
```

`addWebsocket` lets the app upgrade the connection and stream bi-directional communication to the client over websockets.

```zig
try app.graphql("/graphql", Query, Mutation, &query_root, &mutation_root);
```

`graphql()` mounts a schema-less GraphQL-over-HTTP endpoint. `Query`/`Mutation` are resolver structs; pass `null` for either root if unused.

```zig
try app.addRestHandlers(User, .{ .resource = "users" });
```

`addRestHandlers()` scaffolds list/get/create/update/delete REST handlers for a struct in one line (see [Auto CRUD](/auto-crud)).

```zig
try app.addKVStore("cache", .memory, .{});
```

`addKVStore()` registers a named [KV store](/kv-store) backend (`.redis` / `.nats_kv` / `.memory` / `.sqlite`). The first store registered (or the Redis client auto-registered on connect) becomes the default `ctx.KV`.

```zig
try app.addFileStore("uploads", .local, .{ .root = "./data/uploads" });
```

`addFileStore()` registers a named [File store](/file-store) backend (`.local` / `.ftp` / `.sftp`). The `local` backend auto-registers as the default `ctx.FileStore` when `FILE_STORE_ROOT` is set.

```zig
try app.addPubSubSubscription("subject", handler);
```

`addPubSubSubscription()` (and the broker-specific `addKafkaSubscription()` / `addNatsSubscription()`) subscribe a handler to a pub/sub topic across Kafka, MQTT and NATS (see [Using Pubsub](/pubsub)).

## Named SQL and pub/sub handles

From 0.5.4 you can register more than one SQL or pub/sub backend. The name you
pass is yours; `zero` keeps the auto-wired backend under `"default"`.

```zig
try app.addSQL("analytics", analytics_ds);
try app.addPubSub("events", events_backend);

const ds = ctx.GetSQL("analytics");
const ps = ctx.GetPubSub("events");
```

`ctx.SQL` and `ctx.pubsub` still point at the default backend. Your existing
handlers don't change. Named handles are only there when you ask for them, and
each call returns `null` for an unknown name.

Startup is fail-fast. If a configured SQL or pub/sub backend can't be created,
`app.run()` returns the error instead of dropping the backend and continuing.
`REQUIRED_CONFIG_KEYS` can also stop startup when a named key is missing or
empty.

## Transactional outbox (preview)

`app.addOutbox(.{ ... })` registers a poll job that publishes rows from an
outbox table. It needs a SQL datasource and a pub/sub backend. Call
`zero.outbox.enqueue(ctx, table, topic, payload)` inside your transaction, and
the poll job publishes pending rows in batches.

The API is new on the `experimental-0.17` branch. Check the
[Release Notes](/release-notes#_0-5-4-unreleased) before you use it in production.
