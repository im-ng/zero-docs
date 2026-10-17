# WebSocket Client

`zero` can hold **outbound** websocket connections — long-lived clients that subscribe to an external stream (an exchange, a broker, another service) and feed frames back into your app. Each client runs on its own background thread, reconnects with backoff, and dispatches every frame to a callback with a datasource-wired `Context`.

This is the client side of `zero`'s websocket support. For the inbound (server) side — accepting websocket connections from browsers — see [Websocket](/websocket).

## Register a client

```zig [src/main.zig]
const WebSocketClient = zero.WebSocketClient;

pub fn main(init: std.process.Init) !void {
    var gpa: std.heap.DebugAllocator(.{}) = .init;
    const allocator = gpa.allocator();

    const app = try zero.App.new(allocator, init.io, init.environ_map);

    const client = try app.addWebsocketClient("price-feed", "wss://example.com/stream", .{
        .on_message = onMessage,
        .on_open = onOpen,
    });

    try app.run();
}

// Fires once after the handshake — send a subscribe/login frame here.
fn onOpen(client: *WebSocketClient, _: ?*anyopaque) !void {
    try client.sendText("{\"op\":\"subscribe\",\"channel\":\"prices\"}");
}

// Called for every inbound frame.
fn onMessage(ctx: *zero.Context, frame: []const u8, _: ?*anyopaque) !void {
    ctx.info(frame);
}
```

`app.addWebsocketClient(name, url, opts)` takes:

- `name` — a stable handle; also the prefix for `SERVICE_<NAME>_*` env resolution (see below).
- `url` — the server URL. A `wss://` URL enables TLS automatically.
- `opts` — `wsclient.Options`: `on_message` (required callback), `on_open` (optional, fired once after the handshake), `headers`, `auth`, `circuitBreaker`, and `userdata`.

Each client owns its own background thread, so the connection and reconnect logic never block request handling.

::: info TLS out of the box
Use a `wss://` URL and TLS is handled for you automatically — no extra config. A `ws://` URL is plain text.
:::

## Auth and connection tuning

Pass `opts.auth` to attach outbound auth to the handshake, or resolve it from `SERVICE_<NAME>_*` env keys (the client name uppercased and sanitized, so `price-feed` becomes `SERVICE_PRICE_FEED_`). The same `oauth` / `basic` / `apiKey` modes and circuit-breaker keys used by [HTTP Services](/http-service#outbound-auth) apply here. A circuit breaker gates reconnection: when it opens, the client pauses reconnecting instead of hammering a dead downstream.

See the runnable [`zero-ws-client`](https://github.com/im-ng/zero/tree/experimental/examples/zero-ws-client) example and the implementation in [`src/wsclient.zig`](https://github.com/im-ng/zero/tree/experimental/src/wsclient.zig).
