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

# Logging

`zero` handles logging in well strucutred manner to provide ongoing state of the application and services that it attached to.

The logs are tidy and visualque to understand the app status.

The framework allows to customize and know only the needed information on any given time.

Through `LOG_LEVEL` config one can adjust the app logging and know more of underlying state. The least level is `debug` and that let start see logs all above.

Levels in order (highest to lowest) - `fatal`, `error`, `warn`, `info` and `debug`.

When `zero` app runs, it starts reading log level, allow us to know more 
* log level of statement
* database/kv/mq connection status
* authentication setup
* static directory attachments, 
* request trace id, response status, response handling time 
* possibly errors that occured.

## Visual cue

![image](./public/hello-zero.webp)

![image](./public/preview-visual-cue-2.webp)


## Method signature

```zig [With in ctx handler]
ctx.info("message");

ctx.debug([]const u8);

ctx.err([]const u8);

ctx.warn([]const u8);

ctx.fatal([]const u8);

ctx.any(struct);
```