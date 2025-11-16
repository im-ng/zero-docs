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
```
