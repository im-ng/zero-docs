import { defineConfig } from "vitepress";
import { withMermaid } from "vitepress-plugin-mermaid";

export default withMermaid(
  defineConfig({
    vite: {
      ssr: {
        noExternal: ["zeroTheme"],
      },
    },
    title: " ",
    description:
      "A simple and opinionated microservice web framework written in Zig",
    head: [["link", { rel: "icon", href: "/zero-docs/favicon.ico" }]],
    ignoreDeadLinks: true,
    base: "/zero-docs/",
    themeConfig: {
      appearance: "force-light",
      logo: {
        light: "/zero-fmk-light.webp",
        dark: "/zero-fmk-dark.webp",
      },
      nav: [
        { text: "Home", link: "/" },
        { text: "Getting Started", link: "/started" },
      ],

      sidebar: [
        { text: "Home", link: "/" },
        { text: "Getting Started", link: "/started" },
        { text: "Attribution", link: "/attribution" },
        { text: "Feature Parity", link: "/parity" },
        {
          text: "Begin from zero",
          items: [
            { text: "Hello world", link: "/hello-zero" },
            { text: "Configs", link: "/configuration" },
            { text: "Logging", link: "/logging" },
            { text: "Observability", link: "/observability" },
            { text: "PubSub", link: "/pubsub" },
          ],
        },
        {
          text: "Built-in solutions",
          items: [
            { text: "Using Postgres", link: "/rest-handler" },
            { text: "Using Redis", link: "/caching" },
            { text: "Migrations", link: "/migrations" },
            { text: "Schedule Tasks", link: "/cronz" },
            { text: "Kafka Publisher", link: "/kafka-publisher" },
            { text: "Kafka Suscriber", link: "/kafka-subscriber" },
            { text: "MQ Publisher", link: "/message-queue-publisher" },
            { text: "MQ Suscriber", link: "/message-queue-subscriber" },
            { text: "Websockets", link: "/websocket" },
            { text: "Http Services", link: "/http-service" },
            { text: "Authentication", link: "/authentication" },
            { text: "HTMX CRUD", link: "/htmx-crud" },
            { text: "Warmup hooks", link: "/warmup" },
            { text: "Swagger Rendering", link: "/swagger" },
          ],
        },
        {
          text: "In-depth",
          items: [
            { text: "Architecture", link: "/architecture" },
            { text: "Container", link: "/container" },
            { text: "Context", link: "/context" },
            { text: "Roadmap", link: "/timeline" },
            { text: "X-Ray", link: "/x-ray" },
          ],
        },
      ],
      socialLinks: [{ icon: "github", link: "https://github.com/im-ng/zero" }],
    },
  })
);
