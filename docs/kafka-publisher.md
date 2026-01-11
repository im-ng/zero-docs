<style type="text/css">
  img-comparison-slider {
    --divider-width: 5px;
    --divider-color: #131212ff;
    --default-handle-opacity: 0.9;
  }
</style>

<script setup>
import { ImgComparisonSlider } from '@img-comparison-slider/vue';
</script>

# Kafka Publisher

This document demonstrates the publishing to a topic using `zero` built-in solution 
`KF` client.


```zig [kafka]
// publishes message to a topic on the subscribed client
ctx.KF.publish(ctx, "topic", "message-key", "payload"); 
```

## Interim solution

🚩 Zero framework comes with Kafka support through `librdkafka` C Library linking. Since we don't have a pure Zig 
Kafka client, we are leveraging the use of this C implementations, achieving the message queue capability. 

🚩 Unlike other driver support, we need to `install` librdkafka separately in your Linux container or in developer machine
to make use of this. I am sorry for these limitations but pleased to make use of `zig` inter-operability to achieve Kafka 
publishing without any shortcomings.

## Recommendation

It is highly recommended to install the `librdkafka` library in developer / container machine.

::: code-group
```bash [debian]
apt install librdkafka-dev
```

```bash [macOS]
brew install librdkafka
```
:::

If you are using the macOS (intel or M chips), prefer to checkout these build lines to adjust the header and library relative path to build the `kafka` dependencies properly.

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

1. Refer following `zero-kafka-publisher` example further to know more on getting started of this.

2. Spin up kafka container locally to publish the messages

```bash
podman pull docker.io/apache/kafka:4.1.1
```

_We have enabled the kafka support for all security mechanism, and have been tested with `SASL` and `PLAIN` format alone_

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

Prefer to check out `jaas` config provided in the `configs` folder for `SASL` mechanism.

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

3. Let us attach needed configurations to connect with our `kafkaserver` cluster.

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

4. Add basic publisher to send message to `zero-topic`

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

pub fn main() !void {
    var gpa: std.heap.GeneralPurposeAllocator(.{}) = .init;
    const allocator = gpa.allocator();
    _ = gpa.detectLeaks();

    const app: *App = try App.new(allocator);

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

5. Boom! lets build and run our app.

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

3. Preview publisher status of the our application.

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

4. `zero` comes with publisher metrics handy to preview success/failed counts.

![metrics](./public/zero-kafka-publisher-3.webp)

## Issues

Zig build will fail if the above dependency is not installed properly.

```bash
❯ zig build pubsub
pubsub
└─ run exe pubsub
   └─ compile exe pubsub Debug native failure
error: error: unable to find dynamic system library 'rdkafka' using strategy 'paths_first'. searched paths:
  /usr/local/lib/librdkafka.so
  /usr/local/lib/librdkafka.a
```