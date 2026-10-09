<template>
  <section class="const" id="features">
    <div class="container">
      <div class="const-head">
        <span class="eyebrow">the constellation</span>
        <h2>30+ integrations, one <code>App.new</code>.</h2>
        <p class="const-sub">Every piece is opt-in through configuration. Hover or focus a node to see what it does.</p>
      </div>

      <div class="const-stage">
        <svg class="const-svg" viewBox="0 0 1180 680" role="group" aria-label="Zero framework integration map">
          <defs>
            <filter id="sketch" x="-5%" y="-5%" width="110%" height="110%">
              <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="2" seed="7" result="n" />
              <feDisplacementMap in="SourceGraphic" in2="n" scale="3.4" />
            </filter>
          </defs>

          <g class="links" filter="url(#sketch)">
            <line v-for="(l, i) in links" :key="'l' + i" :class="['link', { hub: l.hub }]" :data-item="l.item" :data-cat="l.cat" :x1="l.x1" :y1="l.y1" :x2="l.x2" :y2="l.y2" />
          </g>

          <g v-for="cat in categories" :key="cat.id" class="hub" :data-cat="cat.id">
            <circle :cx="cat.hub[0]" :cy="cat.hub[1]" r="9" />
            <text :x="cat.hub[0]" :y="cat.hub[1] - 16" class="hub-label" text-anchor="middle">{{ cat.name }}</text>
          </g>

          <g
            v-for="n in nodes" :key="n.id"
            class="node"
            :data-id="n.id" :data-cat="n.cat" :data-label="n.label" :data-desc="descs[n.label]"
            tabindex="0" role="button" :aria-label="`${n.label}: ${descs[n.label] || ''}`"
          >
            <circle :cx="n.x" :cy="n.y" r="5.5" />
            <text :x="n.side === 'right' ? n.x + 12 : n.x - 12" :y="n.y + 4" class="node-label" :text-anchor="n.side === 'right' ? 'start' : 'end'">{{ n.label }}</text>
          </g>

          <g class="core">
            <circle :cx="core[0]" :cy="core[1]" r="30" />
            <text :x="core[0]" :y="core[1] + 5" text-anchor="middle" class="core-label">zero.</text>
          </g>
        </svg>

        <div class="const-detail" id="const-detail" aria-live="polite">
          <span class="cd-kicker mono">integration</span>
          <strong class="cd-title">Pick a node</strong>
          <p class="cd-body">Hover or focus any node in the map to reveal what Zero wires in for you.</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted } from "vue";

const core: [number, number] = [590, 335];
const cellW = 112, cellH = 44;

interface Cat { id: string; name: string; hub: [number, number]; dir: "up" | "down"; items: string[]; cols?: number; }
const categories: Cat[] = [
  { id: "web", name: "Web & API", hub: [360, 270], dir: "up", cols: 3, items: ["REST / CRUD", "AutoCRUD", "GraphQL", "Protobuf", "WebSocket", "Swagger UI"] },
  { id: "data", name: "Data stores", hub: [820, 270], dir: "up", cols: 4, items: ["PostgreSQL", "SQLite", "DuckDB", "Redis", "Cassandra", "InfluxDB", "Solr", "S3 / File"] },
  { id: "msg", name: "Messaging", hub: [360, 400], dir: "down", cols: 3, items: ["Kafka", "NATS", "MQTT", "Pub/Sub"] },
  { id: "x", name: "Cross-cutting", hub: [820, 400], dir: "down", cols: 4, items: ["Auth", "CORS", "Metrics", "Tracing", "Health", "Logging", "Migrations", "Cron", "CLI", "Rate Limiter", "Resilience", "HTTP Client"] },
];

const descs: Record<string, string> = {
  "REST / CRUD": "Standard REST endpoints, batteries included.",
  AutoCRUD: "One line wires list/get/create/update/delete for a struct.",
  GraphQL: "Schema-less resolvers over HTTP.",
  Protobuf: "proto3 codegen + bind/decode over HTTP.",
  WebSocket: "Built-in real-time WebSocket support.",
  "Swagger UI": "Serves static assets + Swagger UI.",
  PostgreSQL: "Relational SQL backend.",
  SQLite: "Embedded file-based SQL.",
  DuckDB: "In-process OLAP SQL, no external service.",
  Redis: "Cache + key/value store.",
  Cassandra: "NoSQL wide-column store.",
  InfluxDB: "Time-series writes & queries.",
  Solr: "Index + full-text search.",
  "S3 / File": "S3-compatible object & file store.",
  Kafka: "Publish/subscribe over Kafka (librdkafka).",
  NATS: "Lightweight NATS pub/sub.",
  MQTT: "MQTT broker subscriptions.",
  "Pub/Sub": "Unified handler shape for all transports.",
  Auth: "Basic, API Key, OAuth 2.0 — config-driven.",
  CORS: "Configurable CORS middleware.",
  Metrics: "Prometheus metrics at /metrics.",
  Tracing: "Distributed tracing via TraceID.",
  Health: "Liveness + status endpoints.",
  Logging: "Structured JSON logs.",
  Migrations: "DB migrations + seed on startup.",
  Cron: "Scheduled jobs (* * * * * *).",
  CLI: "Build one-shot commands, no HTTP server.",
  "Rate Limiter": "Per-service outbound rate limits.",
  Resilience: "Circuit breakers, timeouts, bulkheads.",
  "HTTP Client": "Register external services with auth.",
};

interface NodeT { id: string; label: string; cat: string; x: number; y: number; side: "left" | "right"; }
interface LinkT { x1: number; y1: number; x2: number; y2: number; item?: string; cat: string; hub?: boolean; }

const nodes: NodeT[] = [];
const links: LinkT[] = [];

for (const cat of categories) {
  const [hx, hy] = cat.hub;
  const cols = cat.cols ?? Math.min(3, cat.items.length);
  const rows = Math.ceil(cat.items.length / cols);
  const startX = hx - ((cols - 1) * cellW) / 2;
  const startY = cat.dir === "down" ? hy + 54 : hy - 54 - (rows - 1) * cellH;
  cat.items.forEach((label, idx) => {
    const c = idx % cols, r = Math.floor(idx / cols);
    const x = startX + c * cellW, y = startY + r * cellH;
    const id = `${cat.id}-${idx}`;
    nodes.push({ id, label, cat: cat.id, x, y, side: hx < core[0] ? "left" : "right" });
    links.push({ x1: x, y1: y, x2: hx, y2: hy, item: id, cat: cat.id });
  });
  links.push({ x1: hx, y1: hy, x2: core[0], y2: core[1], cat: cat.id, hub: true });
}

function initConstellation() {
  const svg = document.querySelector<SVGSVGElement>(".const-svg");
  const detail = document.getElementById("const-detail");
  if (!svg || !detail) return;
  const cdTitle = detail.querySelector<HTMLElement>(".cd-title");
  const cdBody = detail.querySelector<HTMLElement>(".cd-body");
  const cdKicker = detail.querySelector<HTMLElement>(".cd-kicker");
  const nodeEls = Array.from(svg.querySelectorAll<SVGGElement>(".node"));
  const hubEls = Array.from(svg.querySelectorAll<SVGGElement>(".hub"));
  const linkEls = Array.from(svg.querySelectorAll<SVGLineElement>(".link"));
  const dT = cdTitle?.textContent, dB = cdBody?.textContent, dK = cdKicker?.textContent;

  const clear = () => {
    svg.classList.remove("focused");
    nodeEls.forEach((n) => n.classList.remove("active"));
    hubEls.forEach((h) => h.classList.remove("active"));
    linkEls.forEach((l) => l.classList.remove("active"));
    if (cdTitle) cdTitle.textContent = dT; if (cdBody) cdBody.textContent = dB; if (cdKicker) cdKicker.textContent = dK;
  };
  const activate = (node: SVGGElement) => {
    const cat = node.dataset.cat;
    svg.classList.add("focused");
    nodeEls.forEach((n) => n.classList.toggle("active", n === node));
    hubEls.forEach((h) => h.classList.toggle("active", h.dataset.cat === cat));
    linkEls.forEach((l) => l.classList.toggle("active", l.dataset.item === node.dataset.id || l.dataset.cat === cat));
    const hubLabel = svg.querySelector<SVGTextElement>(`.hub[data-cat="${cat}"] .hub-label`);
    if (cdKicker) cdKicker.textContent = hubLabel?.textContent ?? "integration";
    if (cdTitle) cdTitle.textContent = node.dataset.label ?? "";
    if (cdBody) cdBody.textContent = node.dataset.desc ?? "";
  };
  nodeEls.forEach((node) => {
    node.addEventListener("mouseenter", () => activate(node));
    node.addEventListener("focus", () => activate(node));
    node.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); activate(node); } });
    node.addEventListener("blur", () => { window.setTimeout(() => { if (!svg.contains(document.activeElement)) clear(); }, 0); });
  });
  svg.addEventListener("mouseleave", clear);
}

onMounted(initConstellation);
</script>
