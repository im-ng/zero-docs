# AWS SQS

`zero` can publish to and subscribe from **Amazon SQS** through the unified PubSub client. Messages are signed with AWS Signature V4, so there is no AWS SDK to link.

## Configuration

```bash [configs/.env]
PUBSUB_BACKEND=SQS
SQS_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/123456789012/zero-queue
AWS_REGION=us-east-1
AWS_ACCESS_KEY=
AWS_SECRET_KEY=
```

## Publish

```zig [src/main.zig]
try ctx.getPublisher().Publish("orders", "{\"id\":1}");
```

The `subject` is ignored for SQS — the queue URL is the channel.

## Subscribe

```zig [src/main.zig]
pub fn onOrder(ctx: *Context, subject: []const u8, payload: []const u8) !void {
    // handle the message
}

try app.addPubSubSubscription("orders", onOrder);
```

`zero` long-polls the queue (5-second wait), dispatches each message to your hook, then deletes it on success.

## Caveats

- SQS is a single queue channel; there is no topic fan-out. The queue URL is the destination for both publish and subscribe.
- SigV4 is signed per request; credentials are read from the env above.

See the [zero-kv](https://github.com/im-ng/zero/tree/experimental/examples/zero-kv) and [zero-redis](https://github.com/im-ng/zero/tree/experimental/examples/zero-redis) examples and the implementation in [src/pubsub/sqs/sqs.zig](https://github.com/im-ng/zero/tree/experimental/src/pubsub/sqs/sqs.zig).
