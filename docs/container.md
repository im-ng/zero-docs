# Container

`container` are the centralized dependency injection that the app creates and holds references to all resources including configurations, authentication keys, data sources, logging, metrics and external http services.

## Overview

```mermaid
stateDiagram-v2
    direction LR
    state container {
        direction TB
        state externalService {
            direction LR
            httpClient
            webSocketClient
        }

        state dataSource {
            direction LR
            SQL
            Redis
            PubSub
            KVStore
            FileStore
            AuthKeys
            Config
        }

        state internal {
            metrics
            logger
        }
    }
```

## Access Workflow

The `context` internally has reference to `container` through which it will access all resources and performs the needed operations as part of the incoming requests.

```mermaid
sequenceDiagram
    Request->>Context: need to perform an action
    Context-->>Container: Does resource exist?
    Container-->>Context: Yep!
    Context-->>Container: Access SQL/Redis/PubSub
    Container-->>Data Source: Executes operations
    Data Source-->>Container: Results
    Container-->>Context: Return results/error
    Context-->Request: Success/Failed

`PubSub` covers Kafka, MQTT and NATS. `KVStore` (Redis / NATS KV / memory / SQLite)
and `FileStore` (local / ftp / sftp) are the unified key-value and blob backends
registered via `app.addKVStore(...)` / `app.addFileStore(...)` (see
[KV Store](/kv-store) and [File Store](/file-store)).
```
