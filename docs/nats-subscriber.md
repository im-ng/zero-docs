# NATS Subscriber

This document demonstrates subscribing to a NATS subject using `zero`'s built-in
`pubsub` client.

It is the continuation of the [Publisher](./nats-publisher) demo — prefer to read
that first.

```zig [nats]
// listens for upcoming event and injects into the subscriber handler
// for further actions.
app.addPubSubSubscription("subject", subscriberHandler);
```

## Broker selection

Same as the publisher — set `PUBSUB_BACKEND=NATS` and `PUBSUB_BROKER`.

```bash [configs/.env]
PUBSUB_BACKEND=NATS
PUBSUB_BROKER=nats://localhost:4222
```

## Example

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

    try app.addPubSubSubscription("zero", onMessage);
    try app.run();
}

fn onMessage(ctx: *Context) !void {
    if (ctx.message) |message| {
        const m = message.nats;
        var buf: [256]u8 = undefined;
        const line = std.fmt.bufPrint(&buf, "received on [{s}] {s}", .{ m.subject, m.payload }) catch "decode error";
        ctx.info(line);
    }
}
```
:::

The inbound message is available on `ctx.message.?.nats`, which exposes `.subject`
and `.payload` (both `[]const u8`). See
[`examples/zero-nats-subscriber`](https://github.com/im-ng/zero/tree/experimental/examples/zero-nats-subscriber)
for a runnable example.
