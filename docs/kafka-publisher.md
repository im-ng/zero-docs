<script setup>
import { ImgComparisonSlider } from '@img-comparison-slider/vue';
</script>

# Kafka Publisher

This page shows how to publish a message to a Kafka topic using the `zero` built-in `KF` client.


```zig [kafka]
// publishes message to a topic on the subscribed client
ctx.KF.publish(ctx, "topic", "message-key", "payload"); 
```

## Interim solution

`zero` ships Kafka support by linking the `librdkafka` C library. We don't have a pure-Zig Kafka client yet, so we reuse this C implementation to get message-queue capability.

Unlike the other drivers, you must install `librdkafka` yourself on your Linux container or dev machine. The `zig` C interop lets us publish to Kafka without any major limitations.

## Recommendation

Install the `librdkafka` library on your dev machine or container.

::: code-group
```bash [debian]
apt install librdkafka-dev
```

```bash [macOS]
brew install librdkafka
```
:::

On macOS (Intel or Apple Silicon), adjust the header and library paths in your build so the `kafka` dependencies compile.

::: code-group
```zig [build.zig]
//intel chips dependencies location
if (builtin.os.tag == .macos) {
    module.addIncludePath(.{ .cwd_relative = "/usr/local/Cellar/librdkafka/2.13.0/include" });
    module.addLibraryPath(.{ .cwd_relative = "/usr/local/Cellar/librdkafka/2.13.0/lib" });
}
```
:::

## Example

1. See the `zero-kafka-publisher` example to get started.

2. Start a local Kafka container to publish messages.

```bash
podman pull docker.io/apache/kafka:4.1.1
```

_We support all Kafka security mechanisms, but we have only tested `SASL` and `PLAIN` so far._

::: code-group
```bash [SASL_PLAINTEXT]
podman run -d -it --name kafkaserver \
-p 9092-9093:9092-9093  \
-e KAFKA_NODE_ID=1 \
-e KAFKA_PROCESS_ROLES=broker,controller \
-e KAFKA_LISTENERS=SASL_PLAINTEXT://:9092,CONTROLLER://localhost:9093 \
-e KAFKA_SECURITY_INTER_BROKER_PROTOCOL=SASL_PLAINTEXT \
-e KAFKA_ADVERTISED_LISTENERS=SASL_PLAINTEXT://localhost:9092 \
-e KAFKA_LISTENER_SECURITY_PROTOCOL_MAP=CONTROLLER:PLAINTEXT,SASL_PLAINTEXT:SASL_PLAINTEXT \
-e KAFKA_CONTROLLER_QUORUM_VOTERS=1@localhost:9093 \
-e KAFKA_SASL_MECHANISM_INTER_BROKER_PROTOCOL=PLAIN \
-e KAFKA_SASL_ENABLED_MECHANISMS=PLAIN \
-e KAFKA_CONTROLLER_LISTENER_NAMES=CONTROLLER \
-e KAFKA_OPTS="-Djava.security.auth.login.config=/etc/kafka/kafka_server_jaas.conf" \
-v "./configs/kafka_server_jaas.conf:/etc/kafka/kafka_server_jaas.conf"   \
docker.io/apache/kafka:4.1.1
```

```bash [PLAIN]
podman run -d -it --name kafkaserver \
-p 9092-9093:9092-9093  \
-e KAFKA_NODE_ID=1 \
-e KAFKA_PROCESS_ROLES=broker,controller \
-e KAFKA_LISTENERS=PLAINTEXT://:9092,CONTROLLER://:9093 \
-e KAFKA_ADVERTISED_LISTENERS=PLAINTEXT://127.0.0.1:9092 \
-e KAFKA_LISTENER_SECURITY_PROTOCOL_MAP=CONTROLLER:PLAINTEXT,PLAINTEXT:PLAINTEXT \
-e KAFKA_CONTROLLER_QUORUM_VOTERS=1@127.0.0.1:9093 \
-e KAFKA_CONTROLLER_LISTENER_NAMES=CONTROLLER \
-e KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR=1   \
-e KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR=1 \
-e KAFKA_TRANSACTION_STATE_LOG_MIN_ISR=1 \
-e ALLOW_PLAINTEXT_LISTENER=yes \
-v kafka_server:/kafkaserver   \
docker.io/apache/kafka:4.1.1
```
:::

Check the `jaas` config in the `configs` folder for the `SASL` mechanism.

::: code-group
```bash
KafkaServer {
   org.apache.kafka.common.security.plain.PlainLoginModule required
   username="admin"
   password="secret"
   user_admin="secret";
};
```
:::

3. Add the configs needed to connect to your `kafkaserver` cluster.

::: code-group
```bash [config/.env]
#PLAIN mechanism
APP_NAME=zero-kafka-publisher
APP_VERSION=1.0.0
APP_ENV=dev
LOG_LEVEL=debug
HTTP_PORT=8080

PUBSUB_BACKEND=KAFKA
PUBSUB_BROKER="localhost:9092"
KAFKA_BATCH_SIZE=1000
KAFKA_BATCH_BYTES=1048576
KAFKA_BATCH_TIMEOUT=300
KAFKA_SASL_MECHANISM=PLAINTEXT
```

```bash [config/.env]
#SASL mechanism
APP_NAME=zero-kafka-publisher
APP_VERSION=1.0.0
APP_ENV=dev
LOG_LEVEL=debug
HTTP_PORT=8080

PUBSUB_BACKEND=KAFKA
PUBSUB_BROKER="localhost:9092"
KAFKA_BATCH_SIZE=1000
KAFKA_BATCH_BYTES=1048576
KAFKA_BATCH_TIMEOUT=300
KAFKA_SECURITY_PROTOCOL=SASL_PLAINTEXT
KAFKA_SASL_MECHANISM=PLAIN
KAFKA_SASL_USERNAME=admin
KAFKA_SASL_PASSWORD=secret
```
:::

4. Add a basic publisher that sends a message to `zero-topic`

::: code-group

```zig [main.zig]
const std = @import("std");
const zero = @import("zero");

const Allocator = std.mem.Allocator;
const App = zero.App;
const Context = zero.Context;
const utils = zero.utils;

pub const std_options: std.Options = .{
    .logFn = zero.logger.custom,
};

const topicName = "zero-topic";

const Payload = struct {
    timestamp: []const u8,
    message: []const u8,
};

pub fn main(init: std.process.Init) !void {
    var gpa: std.heap.GeneralPurposeAllocator(.{}) = .init;
    const allocator = gpa.allocator();
    _ = gpa.detectLeaks();

    const app: *App = try App.new(allocator, init.io, init.environ_map);

    try app.addCronJob("* * * * * *", "publisher-1", publishTask1);

    try app.run();
}

fn publishTask1(ctx: *Context) !void {
    const timestamp = try utils.sqlTimestampz(ctx.allocator);

    const messageKey = "publisher-1";

    const pl: Payload = .{
        .timestamp = timestamp,
        .message = "publisher message!",
    };

    const jp = try transform(ctx, &pl);
    ctx.info(jp);

    const topic = try ctx.KF.getTopicHandler(ctx, topicName);

    ctx.KF.publish(ctx, topic, messageKey, jp) catch |err| {
        var buffer: []u8 = undefined;
        buffer = try ctx.allocator.alloc(u8, 100);
        buffer = try std.fmt.bufPrint(buffer, "Message published failed {}", .{err});
        return;
    };
}

fn transform(ctx: *Context, p: *const Payload) ![]const u8 {
    var out = std.Io.Writer.Allocating.init(ctx.allocator);
    try std.json.Stringify.value(p, .{}, &out.writer);
    return out.written();
}
```
:::

5. Build and run the app.

::: code-group
```bash
❯ zig build pubsub
 INFO [04:09:27] Loaded config from file: ./configs/.env
 INFO [04:09:27] config overriden ./configs/.dev.env file not found.
DEBUG [04:09:27] database is disabled, as dialect is not provided.
DEBUG [04:09:27] redis is disabled, as redis host is not provided.
 INFO [04:09:27] connecting to kafka at 'localhost:9092'
 INFO [04:09:27] kafka pubsub connected
 INFO [04:09:27] connected to kafka at 'localhost:9092'
 INFO [04:09:27] kafka publisher mode enabled
 INFO [04:09:27] container is created
 INFO [04:09:27] no authentication mode found and disabled.
 INFO [04:09:27] zero-kafka-publisher app pid 33770
 INFO [04:09:27] publisher-1 * * * * * * cron job added for execution
 INFO [04:09:27] registered static files from directory ./static
 INFO [04:09:27] Starting server on port: 8080
 INFO [04:09:28] {"timestamp":"2025-12-16T04:09:28","message":"publisher message!"}
 INFO [04:09:28] Message produced successfully!
```
:::

3. Preview the publisher status of your application.

<ImgComparisonSlider>
<img
    slot="first"
    style="width: 100%;"
    src="./public/zero-kafka-publisher.webp"
/>
<img
    slot="second"
    style="width: 100%"
    src="./public/zero-kafka-publisher-0.webp"
/>
</ImgComparisonSlider>

4. `zero` exposes publisher metrics so you can see success and failure counts.

![metrics](./public/zero-kafka-publisher-3.webp)

## Issues

If the dependency above is not installed, the Zig build will fail.

```bash
❯ zig build pubsub
pubsub
└─ run exe pubsub
   └─ compile exe pubsub Debug native failure
error: error: unable to find dynamic system library 'rdkafka' using strategy 'paths_first'. searched paths:
  /usr/local/lib/librdkafka.so
  /usr/local/lib/librdkafka.a
```
