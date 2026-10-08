# GCP Pub/Sub

`zero` can publish to and subscribe from **Google Cloud Pub/Sub** through the unified PubSub client. Requests use OAuth2 bearer tokens (fetched via client-credentials), so there is no GCP SDK to link.

## Configuration

```bash [configs/.env]
PUBSUB_BACKEND=GCP          # or GOOGLE
GCP_PROJECT=my-gcp-project
GCP_SUBSCRIPTION=zero-sub
GCP_ENDPOINT=https://pubsub.googleapis.com
GCP_CLIENT_ID=
GCP_CLIENT_SECRET=
GCP_SCOPE=https://www.googleapis.com/auth/pubsub
# GCP_ACCESS_TOKEN=          # optional; bypasses the token fetch (workload identity / sidecar)
```

The subscription must already exist in your project.

## Publish

```zig [src/main.zig]
try ctx.getPublisher().Publish("orders", "{\"id\":1}");
```

The `subject` is the Pub/Sub topic name.

## Subscribe

```zig [src/main.zig]
pub fn onOrder(ctx: *Context, subject: []const u8, payload: []const u8) !void {
    // handle the message
}

try app.addPubSubSubscription("orders", onOrder);
```

`zero` polls the subscription, base64-decodes the payload, dispatches it to your hook, then acknowledges it.

## Caveats

- The subscription must be created out-of-band; `zero` does not provision it.
- OAuth2 tokens are fetched with the client-credentials grant; set `GCP_ACCESS_TOKEN` to skip the fetch when a sidecar handles auth.

See the [zero-redis](https://github.com/im-ng/zero/tree/experimental/examples/zero-redis) example and the implementation in [src/pubsub/gcp/gcppubsub.zig](https://github.com/im-ng/zero/tree/experimental/src/pubsub/gcp/gcppubsub.zig).
