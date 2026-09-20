# Warmup

`zero` has built-in support for running synchronous tasks before it serves any requests.

You register them with the `onStartup` method of the `App`.

::: code-group
```zig [method signature]
try app.onStatup(custom-handler);
```
:::


## Example

1. See the `zero-redis` example to get started.

::: code-group
```zig [main.zig]
pub fn main(init: std.process.Init) !void {
    var arena_instance = std.heap.ArenaAllocator.init(std.heap.page_allocator);
    defer arena_instance.deinit();

    const allocator = arena_instance.allocator();

    const app = try App.new(allocator, init.io, init.environ_map);

    try app.onStatup(prepareCache);

    try app.get("/redis", cacheResponse);

    try app.run();
}

fn prepareCache(ctx: *Context) !void {
    ctx.info("warming up the cache entries");

    _ = ctx.Cache.send(void, .{ "SET", "msg", "zero redis message" }) catch |err| {
        ctx.any(err);
    };

    // intentional delay to mimic cache preparation
    std.Thread.sleep(std.time.ns_per_s);

    ctx.info("cache prepared");
}

const Data = struct {
    msg: []const u8,
};

fn cacheResponse(ctx: *Context) !void {
    const reply = try ctx.Cache.sendAlloc([]u8, ctx.allocator, .{ "GET", "msg" });
    defer ctx.allocator.free(reply);

    try ctx.json(reply);
}
```
_See the `zero-redis` example code to understand the usage better_
:::

## Recommendation

We recommend using the `ctx` allocator whenever possible. It's tied to the request life-cycle, so de-allocation is managed automatically and memory leaks won't happen.
