---
layout: home
title: Home
description: "zero is a batteries-included microservice web framework written in Zig — single static binary, no GC, config-driven, with REST, SQL, pub/sub, auth and observability out of the box."

hero:
  name: "Zero Framework"
  text: 'Build microservices<br>in <span style="color:#f7a41d;">Zig</span><br><span class="hero-tagline">One binary, no GC, config-driven, batteries included</span>'
  actions:
    - theme: brand
      text: Getting Started
      link: /started
    - theme: alt
      text: View on GitHub
      link: https://github.com/im-ng/zero
  image:
    light: /g4.svg
    dark: /g5.svg
    alt: zero framework
features:
  - title: Zero boilerplate
    details: Configure everything through .env, databases, queues, auth and observability plug in<br> with no glue code.
  - title: Single static binary
    details: Compile to one dependency-free binary. Tiny RSS (~16–65 MiB),<br> no runtime, ships anywhere including Kubernetes.
  - title: Batteries included
    details: REST, SQL, NoSQL, Cache, PubSub, GraphQL, Protobuf, Search, auth, metrics and tracing <br> out of the box.
  - title: Observable by default
    details: Structured JSON logs, Prometheus metrics, distributed tracing and health endpoints are wired in from the first request.
---

## Hello Json in ~15 lines

```zig:line-numbers
const std = @import("std");
const zero = @import("zero");
const utils = zero.utils;

pub const std_options: std.Options = .{ .logFn = zero.logger.custom };

pub fn main(init: std.process.Init) !void {
    var arena = std.heap.ArenaAllocator.init(std.heap.page_allocator);
    defer arena.deinit();

    const app = try zero.App.new(arena.allocator(), init.io, init.environ_map);
    try app.get("/json", jsonResponse);
    try app.run();
}

fn jsonResponse(ctx: *zero.Context) !void {
    try ctx.json(.{ .msg = "hello zero!" });
}
```

Drop that in `src/main.zig`, add a `configs/.env`, and `zig build run` serves a JSON endpoint
with structured logs and `/metrics` already live.

The full walkthrough is in [Hello world](/hello-zero).

## Fast, and small

A single binary serves **tens of thousands of requests/sec** while holding **~50 MiB RSS**

No GC pauses, no JIT warm-up.

See the numbers and how to reproduce them in [Benchmark](/benchmark).

## Why zero?

If you want Go's ergonomics without its runtime, or Node's speed without its footprint, zero gives you a strongly-opinionated

Zig framework: explicit memory, a single binary, and microservice building blocks you'd otherwise wire together by hand.

Start with [Getting Started](/started) or browse the [Examples](/examples).
