# PubSub

In the world of microservice architecture, the event driven approach is indistinguishable and `zero` framework has built-in support for the accessing the message queue systems.

At times the app we develop has to rely on external service signal through API call and through events and let us decide the state of the data/action.

Alike, other built-in solutions, the `PubSub` clients will be automatically added to `container` once the needed service configurations available.

`zero` app tries to connect, captures the `ping` status and attaches to the app life-time, otherwise app explicitly calls the `PubSub` is disabled.

::: code-group

```zig [pubsub]
try ctx.pubsub.Publish("zero", "publisher 1 says hello! via NATS");

try app.addPubSubSubscription("zero", onMessage);
```

```zig [kafka]
ctx.KF.publish(ctx, "topic", "message-key", "payload"); #publishes message to a topic on the subscribed client

app.addKafkaSubscription("topic", subscriberHandler); #listens for upcoming event and injects into subscriber handler for further actions.
```

```zig [MQTT]
ctx.MQ.publish("topic"); #publishes message to a topic on the subscribed client

app.addSubscription("topic", subscriber-handler); #listens for upcoming event and injects into subscriber handler.
```

```zig [NATS]
ctx.pubsub.Publish("subject", "payload"); #publishes message to a NATS subject

app.addPubSubSubscription("subject", subscriber-handler); #listens for upcoming event and injects into subscriber handler.
```

:::

### Support

`zero` framework supports following brokers to publish and subscriber to.

| Message Broker | Support |
| -------------- | ------- |
| Kafka          | ✅      |
| MQTT           | ✅      |
| NATS           | ✅      |
| Redis          | ✅      |

### Configurations

This list of configurations help the developer to prefer either Kafka or MQTT pubsub per instance.

| kafka config                   | Remarks                                                              | Default\* / Others                            | Required |
| ------------------------------ | -------------------------------------------------------------------- | --------------------------------------------- | -------- |
| PUBSUB_BACKEND                 | Choose kafka, mqtt or nats as pubsub mq                              | None (KAFKA / MQTT / NATS)                    | Yes      |
| PUBSUB_BROKER                  | Set the addresses of the Kafka cluster                               | localhost:9092 [one or multiple host address] | Yes      |
| PUBSUB_OFFSET                  | Allow the subscription to begin from                                 | None                                          | No       |
| CONSUMER_ID                    | Unique identifier of the subscribing group                           | None                                          | No       |
| KAFKA_BATCH_SIZE               | Number of messages added in one messageSet                           | 100\*                                         | No       |
| KAFKA_BATCH_BYTES              | The overall size of the messageSet that includes one or more message | 1048576\*                                     | No       |
| KAFKA_BATCH_TIMEOUT            | MessageSet flush timeout                                             | 1000\*                                        | No       |
| KAFKA_SECURITY_PROTOCOL        | Protocol used to communicate with kafka cluster                      | plaintext\*,ssl,sasl_plaintext, sasl_ssl      | No       |
| KAFKA_SASL_MECHANISM           | SASL Authentication mechanism                                        | plain\*                                       | No       |
| KAFKA_SASL_USERNAME            | SASL Authentication username                                         | Applicable only with sasl plain mode          | No       |
| KAFKA_SASL_PASSWORD            | SASL Authentication password                                         | Applicable only with sasl plain mode          | No       |
| KAFKA_TLS_CERT_FILE            | Path to client's public key (PEM) used for authentication.           | None                                          | No       |
| KAFKA_TLS_KEY_FILE             | Path to client's private key (PEM) used for authentication.          | None                                          | No       |
| KAFKA_TLS_CA_CERT_FILE         | Path to client's CA cert (PEM) used for authentication.              | None                                          | No       |
| KAFKA_TLS_INSECURE_SKIP_VERIFY | Skip client certificate verifications                                | true\*, false                                 | No       |

| MQTT config           | Remarks                                       | Default\* / Others | Required |
| --------------------- | --------------------------------------------- | ------------------ | -------- |
| MQTT_PROTOCOL         | Protocol used to communicate with MQTT server | tcp\*              | Yes      |
| MQTT_HOST             | IP Address of the MQTT Server                 | None               | Yes      |
| MQTT_PORT             | Port of the MQTT Server                       | None               | Yes      |
| MQTT_CLIENT_ID_SUFFIX | Client ID name for the debug messages         | None               | No       |

| NATS config          | Remarks                                       | Default\* / Others      | Required |
| -------------------- | --------------------------------------------- | ----------------------- | -------- |
| PUBSUB_BACKEND       | Set to `NATS` to use the NATS broker          | NATS                    | Yes      |
| PUBSUB_BROKER        | NATS server URL                               | nats://localhost:4222   | Yes      |
| NATS_STREAM          | JetStream stream name                         | None                    | No       |
| NATS_SUBJECTS        | Comma-separated subjects to subscribe to      | None                    | No       |
| NATS_CONSUMER        | Durable consumer name                         | None                    | No       |
| NATS_MAX_WAIT        | Max wait (ms) for a pull subscription         | None                    | No       |
| NATS_MAX_PULL_WAIT   | Max pull wait (ms)                            | 5000\*                  | No       |
| NATS_CREDS_FILE      | Path to a NATS credentials file               | None                    | No       |

| Redis config         | Remarks                                       | Default\* / Others      | Required |
| -------------------- | --------------------------------------------- | ----------------------- | -------- |
| PUBSUB_BACKEND       | Set to `REDIS` to use the Redis broker        | REDIS                   | Yes      |
| REDIS_HOST           | Redis server host                             | 127.0.0.1               | Yes      |
| REDIS_PORT           | Redis server port                             | 6379                    | Yes      |
| REDIS_USER           | Redis username                                | None                    | No       |
| REDIS_PASSWORD       | Redis password                                | None                    | No       |
| REDIS_DB             | Redis logical database                        | 0                       | No       |

### Redis

Select Redis with `PUBSUB_BACKEND=REDIS`. Redis Pub/Sub uses the same `REDIS_*` connection
settings as the cache/KV store.

Publish through the unified `ctx.pubsub` interface (works across Kafka, MQTT, NATS and
Redis); subscribe with `app.addPubSubSubscription(...)`.

In the handler the message is available on `ctx.message.?.redis`, which exposes `.subject`
and `.payload` (`[]const u8`).

```zig [publish]
// from a handler or cron job
try ctx.pubsub.Publish("zero", "publisher 1 says hello! via Redis");
```

```zig [subscribe]
fn onMessage(ctx: *Context) !void {
    if (ctx.message) |message| {
        const m = message.redis;
        ctx.info(m.payload); // m.subject and m.payload are []const u8
    }
}

// register at startup
try app.addPubSubSubscription("zero", onMessage);
```

### NATS

Select NATS with `PUBSUB_BACKEND=NATS`. 

Publish through the unified `ctx.pubsub` interface (works across Kafka, MQTT, NATS and Redis); subscribe with `app.addPubSubSubscription(...)`. 

In the handler the message is available on `ctx.message.?.nats`, which exposes `.subject` and `.payload` (`[]const u8`).

```zig [publish]
// from a handler or cron job
try ctx.pubsub.Publish("zero", "publisher 1 says hello! via NATS");
```

```zig [subscribe]
fn onMessage(ctx: *Context) !void {
    if (ctx.message) |message| {
        const m = message.nats;
        ctx.info(m.payload); // m.subject and m.payload are []const u8
    }
}

// register at startup
try app.addPubSubSubscription("zero", onMessage);
```
