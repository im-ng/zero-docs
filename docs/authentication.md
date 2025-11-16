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

# Authentication

Authentication (Auth) is a defacto standard to enforce and protect your web applications resources against unwanted service calls. With which we can make sure that valid user can operate on underlying resources,data and service once authenticated.

`zero` app comes with 3 mode of the authentication and follows the industry standards to protect your app resources.

- `Basic`
- `API Key`
- `OAuth`

Authentication can be managed using the `AUTH_MODE` and available in following options:

```bash
AUTH_MODE=Basic #ApiKey, OAuth
AUTH_KEYS=encoded-values
```

`zero` assumes all your authentication handled only through `Authorization` and `x-api-key` headers for now, `NO custom headers` considered.

## HTTP Basic Auth

HTTP Basic Authentication is a simple, built-in method in the HTTP protocol for a client to send a username and password to a server using the `Authorization` header and embed the Base64 encoded `username:password` value as `Basic encodedValue`.

`zero` comes with built-in solution to embed `basic` auth validation and protect against the resource endpoints.


::: code-group
```zig [main.zig]
pub fn main() !void {
    var arean = std.heap.ArenaAllocator.init(std.heap.page_allocator);
    defer arean.deinit();
    const allocator = arean.allocator();

    const app: *App = try App.new(allocator);

    try app.get("/basic", basicResponse);

    try app.run();
}

pub fn basicResponse(ctx: *Context) !void {
    // retrieve the basic claims
    const claims = try ctx.getUsername();

    try ctx.json(claims.?);
}
```

```bash [config/.env]
APP_ENV=dev
APP_NAME=start
APP_VERSION=1.0.0

LOG_LEVEL=debug
HTTP_PORT=8081

AUTH_MODE=Basic
AUTH_KEYS="bmFtZTpwYXNzd29yZA==,bmFtZTE6cGFzc3dvcmQx"
```
:::


## API Key Authentication

`zero` will start validate and authenticate if the incoming requests has the allowed list of `api-key` in the `x-api-key` header.

::: code-group

```zig [main.zig]
pub fn main() !void {
    var arean = std.heap.ArenaAllocator.init(std.heap.page_allocator);
    defer arean.deinit();
    const allocator = arean.allocator();

    const app: *App = try App.new(allocator);

    try app.get("/apikey", apiKeyResponse);

    try app.run();
}

pub fn apiKeyResponse(ctx: *Context) !void {
    // retrieve the claims
    const claims = try ctx.getAuthKey();
    try ctx.json(.{ .key = claims, .msg = "all good!" });
}
```

```bash [config/.env]
APP_ENV=dev
APP_NAME=start
APP_VERSION=1.0.0

LOG_LEVEL=debug
HTTP_PORT=8081

AUTH_MODE=APIKey
AUTH_API_KEYS="caf208fb-e407-497a-8f03-d636fb689b2e,b12eb288-e7b5-4919-8082-09586e4b6dd7"
```
:::


```bash
❯ zig build auth
 INFO [02:50:42] server shutting down
 INFO [02:50:45] Loaded config from file: /configs/.env
 INFO [02:50:45] config overriden ./configs/.dev.env file not found.
DEBUG [02:50:45] database is disabled, as dialect is not provided.
DEBUG [02:50:45] redis is disabled, as redis host is not provided.
DEBUG [02:50:45] pubsub is disabled, as pubsub mode is not provided.
 INFO [02:50:45] container is being created
 INFO [02:50:45] auth APIKey initialized
 INFO [02:50:45] start app pid 31325
 INFO [02:50:45] registered static files from directory ./static
 INFO [02:50:45] Starting server on port: 8081
 INFO [02:50:48] auth api key called
 INFO [02:50:48] 5a2d0f91-467b-4f9e-8a0d-6a338f822e2e	 200 0ms GET /apikey
 INFO [02:50:51] auth api key called
 INFO [02:50:51] api key header is not found.
 INFO [02:50:51] a7ba663e-c07a-49b9-893e-ed65c3e4f8e5	 401 0ms GET /apikey
```

<ImgComparisonSlider>
<!-- eslint-disable -->
<img
    slot="first"
    style="width: 100%"
    src="./public/preview-api-auth-1.webp"
/>
<img
    slot="second"
    style="width: 100%"
    src="./public/preview-api-auth-2.webp"
/>
<!-- eslint-enable -->
</ImgComparisonSlider>



<ImgComparisonSlider>
<!-- eslint-disable -->
<img
    slot="first"
    style="width: 100%"
    src="./public/preview-api-auth-4.webp"
/>
<img
    slot="second"
    style="width: 100%"
    src="./public/preview-api-auth-3.webp"
/>
<!-- eslint-enable -->
</ImgComparisonSlider>


## OAuth

OAuth 2.0 is the industry-standard protocol for authorization. OAuth 2.0 focuses on client developer simplicity while providing specific authorization flows for web applications, desktop applications, mobile phones, and living room devices. 

`zero` allows developer to opt for this industry standard using built-in functions and all underlying resource endpoints will be protected against the one or more signed `jwt` tokens.

The process involves registering the `jwks_endpoint` into the `zero` app and the app automatically captures available public keys and authenticates the incoming request authorization tokens.

If token signature or invalid format found, the app restricts and returns `401` unauthorized as response.

To get started on this, we may need to provide few needed details to app to start processing the `jwt` tokens.

::: code-group
```zig [main.zig]
pub fn main() !void {
    var arean = std.heap.ArenaAllocator.init(std.heap.page_allocator);
    defer arean.deinit();
    const allocator = arean.allocator();

    const app: *App = try App.new(allocator);

    try app.get("/oauth", oauthResponse);

    try app.run();
}

pub fn oauthResponse(ctx: *Context) !void {
    // retrieve the claims
    const claims = try ctx.getAuthClaims();
    try ctx.json(claims);
}
```
```bash [config/.env]
APP_ENV=dev
APP_NAME=start
APP_VERSION=1.0.0

LOG_LEVEL=debug
HTTP_PORT=8081

# enable oauth mode to validate jwt tokens
AUTH_MODE=OAuth

# assuming we have our own key server that provides publick keys to validate
AUTH_JWKS_URL=http://localhost:8080/keys

# zero app automatically recaptures the public keys 
AUTH_REFRESH_INTERVAL=10  #in seconds
```
:::


2. Boom! lets build and run our app.

```bash
zero/examples/zero-auth on  main [!] via ↯ v0.15.1
❯ zig build auth
 INFO [03:10:40] Loaded config from file: ./configs/.env
 INFO [03:10:40] config overriden ./configs/.dev.env file not found.
DEBUG [03:10:40] database is disabled, as dialect is not provided.
DEBUG [03:10:40] redis is disabled, as redis host is not provided.
DEBUG [03:10:40] pubsub is disabled, as pubsub mode is not provided.
 INFO [03:10:40] container is being created
 INFO [03:10:40] auth oauth initialized
 INFO [03:10:40] */10 * * * * *
 INFO [03:10:40] zero-jwks-refresher */10 * * * * * cron job added for execution
 INFO [03:10:40] start app pid 37234
 INFO [03:10:40] registered static files from directory ./static
 INFO [03:10:40] Starting server on port: 8081
 INFO [03:10:50] oatuh keys refreshed
 INFO [03:10:50] completed cron job: zero-jwks-refresher in 2ms
 INFO [03:10:51] auth oauth called
 INFO [03:10:51] 3611e407-e219-4a42-be92-a5bbc9ccfa0e	 200 0ms GET /oauth
 INFO [03:10:54] auth oauth called
 INFO [03:10:54] invalid token claims found
 INFO [03:10:54] ae66b8d2-7d9c-4677-8545-89c83107329a	 401 0ms GET /oauth
```

3. Preview server status and check jwt authorization for protected resources against valid/invalid tokens.

<ImgComparisonSlider>
<!-- eslint-disable -->
<img
    slot="first"
    style="width: 100%"
    src="./public/preview-jwt-auth-1.webp"
/>
<img
    slot="second"
    style="width: 100%"
    src="./public/preview-jwt-auth-2.webp"
/>
<!-- eslint-enable -->
</ImgComparisonSlider>



<ImgComparisonSlider>
<!-- eslint-disable -->
<img
    slot="first"
    style="width: 100%"
    src="./public/preview-jwt-auth-3.webp"
/>
<img
    slot="second"
    style="width: 100%"
    src="./public/preview-jwt-auth-4.webp"
/>
<!-- eslint-enable -->
</ImgComparisonSlider>

_Prefer to use these token to get this tested quickly_

Valid token

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Inplcm8tZnJhbWV3b3JrLWFwcCJ9.eyJpc3MiOiJpc3MiLCJpYXQiOjE3NjI1OTY4MDcsImV4cCI6MjA1MTI1OTEzNywiYXVkIjoiemVyby1hcHAiLCJzdWIiOiJ0ZXN0LWtleSIsImp0aSI6Imp0aSIsIm5iZiI6MTc2MjU5NjgwN30.ww0_A-vNXnl7_tsCChPrbh12vj5zGA3UAZPjyN6A0wI
```

Invalid token
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Inplcm8tZnJhbWV3b3JrLWFwcC0xIn0.eyJpc3MiOiJpc3MiLCJpYXQiOjE3NjI1OTY4MDcsImV4cCI6MjA1MTI1OTEzNywiYXVkIjoiemVyby1hcHAiLCJzdWIiOiJ0ZXN0LWtleSIsImp0aSI6Imp0aSIsIm5iZiI6MTc2MjU5NjgwN30.o5mmBhlLr6zu-OcLNesNNrNH58mBFceyyDeKYRArOhU
```

## Limitations 🚨 

- 🚩 The public key refresh can happen as low as 1 second interval
- 🚩 The `jwt` claim validation is limited to `kid` alone for now, but there is a work in progress to extend this to validate based on the custom preferences through app method signature.

```zig
# will be available in 0.0.2 onwards
app.addOAuthValidateOptions('expiry-check','issuer-check','subject-check');
```

## Recommendation

🚩 It is highly recommended to use the `ctx` allocator whenever possible, since it is tied up with request life-cycle, the de-allocation will be managed automatically and making sure the memory leak is not happening.