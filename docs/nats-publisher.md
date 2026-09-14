# NATS Publisher

This document demonstrates publishing to a NATS subject using `zero`'s built-in
`pubsub` client.

```zig [nats]
// publishes a message to a subject on the connected NATS server
try ctx.pubsub.Publish("subject", "payload");
```

## Broker selection

NATS is selected through the unified PubSub backend. Unlike Kafka (which links the
`librdkafka` C library), the NATS client is a pure-Zig dependency — no extra system
package is required.

```bash [configs/.env]
PUBSUB_BACKEND=NATS
PUBSUB_BROKER=nats://localhost:4222
```

## Example

1. Spin up a NATS server locally.

```bash
podman pull docker.io/nats:latest
podman run -d --name nats-main -p 4222:4222 -p 6222:6222 -p 8222:8222 nats -js
```

2. Publish from a cron job (see [`examples/zero-nats-publisher`](https://github.com/im-ng/zero/tree/experimental/examples/zero-nats-publisher)).

::: code-group
```zig [src/main.zig]
const std = @import("std");
const zero = @import("zero");

const App = zero.App;
const Context = zero.Context;
const utils = zero.utils;

pub fn main(init: std.process.Init) !void {
    var gpa: std.heap.DebugAllocator(.{}) = .init;
    const allocator = gpa.allocator();
    const app = try App.new(allocator, init.io, init.environ_map);

    try app.addCronJob("* * * * * *", "publisher-1", publishTask1);
    try app.run();
}

fn publishTask1(ctx: *Context) !void {
    try ctx.pubsub.Publish("zero", "publisher 1 says hello! via NATS");
}
```
:::

You can also publish from any request handler via `ctx.pubsub.Publish(...)`. The
[Subscriber](./nats-subscriber) page shows the other side of the flow.
