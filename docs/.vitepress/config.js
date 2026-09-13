import { defineConfig } from "vitepress";
import { withMermaid } from "vitepress-plugin-mermaid";

const shared = {
  vite: {
    ssr: {
      noExternal: ["zeroTheme"],
    },
  },
  title: "zero framework",
  description:
    "A simple and opinionated microservice web framework written in Zig",
  head: [
    ["link", { rel: "icon", href: "/favicon.ico" }],
    ["link", { rel: "preconnect", href: "https://fonts.googleapis.com" }],
    ["link", { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" }],
    [
      "link",
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fira+Code:wght@300..700&display=swap",
      },
    ],
  ],
  ignoreDeadLinks: true,
  base: "/",
  themeConfig: {
    appearance: "force-light",
    title: "   ",
    logo: {
      light: "/zero-fmk-light.webp",
      dark: "/zero-fmk-dark.webp",
    },
    socialLinks: [{ icon: "github", link: "https://github.com/im-ng/zero" }],
  },
};

// zig 0.16 (latest) — root locale, served at site root.
const zig016Sidebar = [
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
        { text: "CLI Apps", link: "/cli" },
        { text: "Kubernetes", link: "/kubernetes" },
      ],
    },
  {
    text: "Built-in solutions",
    items: [
      {
        text: "Using SQL",
        items: [
          { text: "Using Postgres", link: "/rest-handler" },
          { text: "SQLite", link: "/sqlite" },
          { text: "DuckDB", link: "/duckdb" },
        ],
      },
      {
        text: "NoSQL & Analytics",
        items: [
          { text: "Cassandra", link: "/cassandra" },
          { text: "InfluxDB", link: "/influxdb" },
          { text: "Solr", link: "/solr" },
        ],
      },
      { text: "Using Redis", link: "/caching" },
      { text: "Migrations", link: "/migrations" },
      { text: "Schedule Tasks", link: "/cronz" },
      {
        text: "Using Pubsub",
        items: [
          { text: "PubSub", link: "/pubsub" },
          { text: "Kafka Publisher", link: "/kafka-publisher" },
          { text: "Kafka Subscriber", link: "/kafka-subscriber" },
          { text: "MQ Publisher", link: "/message-queue-publisher" },
          { text: "MQ Subscriber", link: "/message-queue-subscriber" },
          { text: "NATS Publisher", link: "/nats-publisher" },
          { text: "NATS Subscriber", link: "/nats-subscriber" },
        ],
      },
      { text: "Websockets", link: "/websocket" },
      { text: "Http Services", link: "/http-service" },
      { text: "Authentication", link: "/authentication" },
      { text: "HTMX CRUD", link: "/htmx-crud" },
      { text: "Warmup hooks", link: "/warmup" },
      { text: "Swagger Rendering", link: "/swagger" },
      { text: "GraphQL", link: "/graphql" },
      { text: "Protobuf", link: "/protobuf" },
      { text: "KV Store", link: "/kv-store" },
      { text: "File Store", link: "/file-store" },
      { text: "Auto CRUD", link: "/auto-crud" },
      { text: "Rate Limiter", link: "/rate-limiter" },
    ],
  },
      {
        text: "In-depth",
        items: [
          { text: "Architecture", link: "/architecture" },
          { text: "Container", link: "/container" },
          { text: "Context", link: "/context" },
          { text: "Interface", link: "/interface" },
          { text: "Testing", link: "/testing" },
          { text: "Benchmark", link: "/benchmark" },
          { text: "Resilience", link: "/resilience" },
          { text: "Roadmap", link: "/timeline" },
          { text: "X-Ray", link: "/x-ray" },
          { text: "Migrating to 0.16", link: "/migrating-0-16" },
        ],
      },
];

// zig 0.15.2 — frozen snapshot, served under /0.15.2/.
const zig0152Sidebar = [
  { text: "Home", link: "/0.15.2/" },
  { text: "Getting Started", link: "/0.15.2/started" },
  { text: "Attribution", link: "/0.15.2/attribution" },
  { text: "Feature Parity", link: "/0.15.2/parity" },
  {
    text: "Begin from zero",
    items: [
      { text: "Hello world", link: "/0.15.2/hello-zero" },
      { text: "Configs", link: "/0.15.2/configuration" },
      { text: "Logging", link: "/0.15.2/logging" },
      { text: "Observability", link: "/0.15.2/observability" },
      { text: "PubSub", link: "/0.15.2/pubsub" },
    ],
  },
  {
    text: "Built-in solutions",
    items: [
      { text: "Using Postgres", link: "/0.15.2/rest-handler" },
      { text: "Using Redis", link: "/0.15.2/caching" },
      { text: "Migrations", link: "/0.15.2/migrations" },
      { text: "Schedule Tasks", link: "/0.15.2/cronz" },
      { text: "Kafka Publisher", link: "/0.15.2/kafka-publisher" },
      { text: "Kafka Subscriber", link: "/0.15.2/kafka-subscriber" },
      { text: "MQ Publisher", link: "/0.15.2/message-queue-publisher" },
      { text: "MQ Subscriber", link: "/0.15.2/message-queue-subscriber" },
      { text: "Websockets", link: "/0.15.2/websocket" },
      { text: "Http Services", link: "/0.15.2/http-service" },
      { text: "Authentication", link: "/0.15.2/authentication" },
      { text: "HTMX CRUD", link: "/0.15.2/htmx-crud" },
      { text: "Warmup hooks", link: "/0.15.2/warmup" },
      { text: "Swagger Rendering", link: "/0.15.2/swagger" },
    ],
  },
  {
    text: "In-depth",
    items: [
      { text: "Architecture", link: "/0.15.2/architecture" },
      { text: "Container", link: "/0.15.2/container" },
      { text: "Context", link: "/0.15.2/context" },
      { text: "Roadmap", link: "/0.15.2/timeline" },
      { text: "X-Ray", link: "/0.15.2/x-ray" },
    ],
  },
];

const SITE = "https://zerofmk.in";

function deriveFromHtml(html) {
  if (!html) return "";
  const pMatch = html.match(/<main[^>]*>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/);
  const src = pMatch ? pMatch[1] : html;
  const noScripts = src.replace(/<script[\s\S]*?<\/script>/gi, " ");
  const noStyle = noScripts.replace(/<style[\s\S]*?<\/style>/gi, " ");
  const text = noStyle.replace(/<[^>]+>/g, " ");
  const decoded = text.replace(/&[a-zA-Z]+;/g, " ").replace(/&#\d+;/g, " ");
  const clean = decoded.replace(/\s+/g, " ").trim();
  if (clean.startsWith("Skip to content") || clean.includes("Main Navigation"))
    return "";
  if (clean.length > 155) return clean.slice(0, 152).trimEnd() + "...";
  return clean;
}

export default withMermaid(
  defineConfig({
    ...shared,
    transformHead: async ({ pageData, head, content }) => {
      const relRaw = (pageData.filePath || pageData.relativePath || "")
        .replace(/\.md$/, ".html");
      let rel = "/" + relRaw;
      if (rel.endsWith("/index.html")) rel = rel.slice(0, -"index.html".length);

      const canonical =
        SITE + (rel.startsWith("/0.15.2/") ? rel.slice("/0.15.2".length) : rel);

      const setMeta = (name, content) => {
        const i = head.findIndex(
          (h) => h[0] === "meta" && h[1] && h[1].name === name
        );
        if (i >= 0) head[i][1].content = content;
        else head.push(["meta", { name, content }]);
      };
      const setProp = (property, content) => {
        const i = head.findIndex(
          (h) => h[0] === "meta" && h[1] && h[1].property === property
        );
        if (i >= 0) head[i][1].content = content;
        else head.push(["meta", { property, content }]);
      };

      const fmDesc = pageData.frontmatter?.description || pageData.description;
      const desc =
        fmDesc ||
        deriveFromHtml(content) ||
        "A simple and opinionated microservice web framework written in Zig";
      const title = pageData.title || "zero framework";

      setMeta("description", desc);
      setProp("og:title", title);
      setProp("og:description", desc);
      setProp("og:type", "website");
      setProp("og:site_name", "zero framework");
      setProp("og:url", canonical);
      setProp("og:image", SITE + "/og-image.jpg");
      setProp("twitter:card", "summary_large_image");
      setProp("twitter:title", title);
      setProp("twitter:description", desc);
      setProp("twitter:image", SITE + "/og-image.jpg");

      const ci = head.findIndex(
        (h) => h[0] === "link" && h[1] && h[1].rel === "canonical"
      );
      if (ci >= 0) head[ci][1].href = canonical;
      else head.push(["link", { rel: "canonical", href: canonical }]);

      const jsonLd = {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "WebSite",
            name: "zero framework",
            url: SITE,
            potentialAction: {
              "@type": "SearchAction",
              target: SITE + "/?q={search_term_string}",
              "query-input": "required name=search_term_string",
            },
          },
          {
            "@type": "SoftwareApplication",
            name: "zero",
            url: SITE,
            applicationCategory: "DeveloperApplication",
            operatingSystem: "Linux, macOS, Windows",
            sameAs: "https://github.com/im-ng/zero",
          },
        ],
      };
      head.push([
        "script",
        { type: "application/ld+json" },
        JSON.stringify(jsonLd),
      ]);
    },
    locales: {
      root: {
        label: "zig 0.16.0",
        lang: "en-US",
        themeConfig: {
          nav: [
            { text: "Home", link: "/" },
            { text: "Getting Started", link: "/started" },
          ],
          sidebar: zig016Sidebar,
        },
      },
      "0.15.2": {
        label: "zig 0.15.2",
        lang: "en-US",
        themeConfig: {
          nav: [
            { text: "Home", link: "/0.15.2/" },
            { text: "Getting Started", link: "/0.15.2/started" },
          ],
          sidebar: zig0152Sidebar,
        },
      },
    },
  })
);
