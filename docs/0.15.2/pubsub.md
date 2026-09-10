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

# PubSub

In the world of microservice architecture, the event driven approach is indistinguishable and `zero` framework has built-in support for the accessing the message queue systems.

At times the app we develop has to rely on external service signal through API call and through events and let us decide the state of the data/action.

Alike, other built-in solutions, the `PubSub` clients will be automatically added to `container` once the needed service configurations available.

`zero` app tries to connect, captures the `ping` status and attaches to the app life-time, otherwise app explicitly calls the `PubSub` is disabled.

::: code-group

```zig [kafka]
ctx.KF.publish(ctx, "topic", "message-key", "payload"); #publishes message to a topic on the subscribed client

app.addKafkaSubscription("topic", subscriberHandler); #listens for upcoming event and injects into subscriber handler for further actions.
```

```zig [MQTT]
ctx.MQ.publish("topic"); #publishes message to a topic on the subscribed client

app.addSubscription("topic", subscriber-handler); #listens for upcoming event and injects into subscriber handler for further actions.
```

:::

### Support

`zero` framework supports following brokers to publish and subscriber to.

| Message Broker | Support |
| -------------- | ------- |
| Kafka          | ✅      |
| MQTT           | ✅      |

### Configurations

This list of configurations help the developer to prefer either Kafka or MQTT pubsub per instance.

| kafka config                   | Remarks                                                              | Default\* / Others                            | Required |
| ------------------------------ | -------------------------------------------------------------------- | --------------------------------------------- | -------- |
| PUBSUB_BACKEND                 | Choose kafka or mqtt as pubsub mq                                    | None (KAFKA / MQTT)                           | Yes      |
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
