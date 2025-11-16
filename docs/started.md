![logo](./zero-fmk-light.webp){.light-only}
![logo](./zero-fmk-dark.webp){.dark-only}

`zero` is a strongly opinionated Zig web framework built on top of `http.zig` that aims for zero allocations and created to make development easier while keeping performance and observability in mind.

 `zero` framework is completely configurable, you may isolate and attach best-in-class built-in solutions as you see fit using the 12 Factor App methodology.

`zero` framework has useful features like drop-in support for numerous databases, queuing systems, and external services, as well as REST, authentication, logging, metrics, observability, and scheduling.


### Key Features

- `.env` based configurations for app to start
- Drop-in support for some well known technologies
    - `Postgres`
        - Seed data on startup
        - Manage migrations with ease
    - `Redis`
        - In-memory lookup
        - Cache warmup
    - `MQTT`
        - Publish to multiple topics
        - Subscribe to multiple topics
    - `Authentication`
        - Yes, All!.
        - OAuth, API Key and Basic credentials mode
- Build REST Standard out-of-box
- Well defined logging for better readability
- Schedule tasks for one or more repetition
- Track and expose application metrics for observability
- Trace application performance with ease
- More on [Feature Parity](../parity)

### Motivation

- <span style='color:#f7a41d;'>Zig</span> - Inspired
- Well-defined structure to build web applications in <span style='color:#f7a41d;'>Zig</span>
- Plug and Play configurations for easy use
- Built-in solution to achieve results without boilerplate codes
- Best opinions in class for quick development and deployment

