<template>
  <section class="why" id="why">
    <div class="container">
      <div class="why-head">
        <span class="eyebrow">why zero</span>
        <h2>The microservice building blocks,<br />wired for you.</h2>
      </div>

      <div class="why-grid">
        <article v-for="(p, i) in items" :key="p.title" class="why-card card" :style="{ '--d': i * 70 + 'ms' }">
          <span class="why-icon" aria-hidden="true">
            <svg v-if="p.icon === 'bolt'" viewBox="0 0 24 24"><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" fill="currentColor" /></svg>
            <svg v-else-if="p.icon === 'box'" viewBox="0 0 24 24"><path d="M12 2 3 7v10l9 5 9-5V7l-9-5Zm0 2.3 6.5 3.6L12 11.5 5.5 7.9 12 4.3Z" fill="currentColor" /></svg>
            <svg v-else-if="p.icon === 'eye'" viewBox="0 0 24 24"><path d="M12 5C6 5 2 12 2 12s4 7 10 7 10-7 10-7-4-7-10-7Zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8Z" fill="currentColor" /></svg>
            <svg v-else-if="p.icon === 'gauge'" viewBox="0 0 24 24"><path d="M12 4a8 8 0 0 0-8 8H2a10 10 0 1 1 20 0h-2a8 8 0 0 0-8-8Zm0 3 5 5-1.4 1.4L12 9.8V7Z" fill="currentColor" /></svg>
          </span>
          <h3>{{ p.title }}</h3>
          <p v-html="p.body"></p>
          <span class="why-note">{{ p.note }}</span>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const items = [
  { icon: "bolt", title: "Zero boilerplate", body: "Databases, queues, auth and observability plug in with no glue code. Everything is wired through <code>.env</code>.", note: "no glue code, really" },
  { icon: "box", title: "Single static binary", body: "Compile to one dependency-free binary. Tiny RSS (~16–65 MiB), no managed runtime, ships anywhere, including Kubernetes.", note: "ships anywhere ↘" },
  { icon: "eye", title: "Observable by default", body: "Structured JSON logs, Prometheus metrics, distributed tracing and health endpoints are wired in from the first request.", note: "from req #1" },
  { icon: "gauge", title: "Fast and small", body: "Tens of thousands of requests/sec at ~50 MiB RSS. No GC pauses, no JIT warm-up, explicit memory control.", note: "no GC pauses!" },
];
</script>
