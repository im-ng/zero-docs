<template>
  <section class="bench" id="benchmarks" ref="root">
    <div class="container">
      <div class="bench-head">
        <span class="eyebrow">observability & benchmarks</span>
        <h2>Numbers you can reproduce.</h2>
        <p class="bench-sub">
          The bundled benchmark harness drives a concurrency ramp and reports
          throughput, latency percentiles and per-level RSS. CI runs it for
          regression.
        </p>
      </div>

      <div class="bench-grid">
        <ul class="bench-stats">
          <li
            v-for="(s, i) in stats"
            :key="s.label"
            class="bench-stat card"
            :style="{ '--d': i * 60 + 'ms' }"
          >
            <span
              class="bnum mono"
              data-count
              :data-value="s.value"
              :data-prefix="s.prefix || ''"
              :data-suffix="s.suffix || ''"
              >0</span
            >
            <span class="blabel">{{ s.label }}</span>
            <span class="bsub">{{ s.sub }}</span>
          </li>
        </ul>

        <div class="bench-bars card">
          <span class="bars-title mono">RSS under load</span>
          <div class="bar-row">
            <span class="bar-name">Zero</span>
            <div class="bar-track">
              <span class="bar zero" style="--w: 16%"></span>
            </div>
            <span class="bar-val mono">~50 MiB</span>
          </div>
          <div class="bar-row">
            <span class="bar-name">Typical Go</span>
            <div class="bar-track">
              <span class="bar typ" style="--w: 78%"></span>
            </div>
            <span class="bar-val mono">~300 MiB</span>
          </div>
          <div class="bar-row">
            <span class="bar-name">Typical Node</span>
            <div class="bar-track">
              <span class="bar typ" style="--w: 100%"></span>
            </div>
            <span class="bar-val mono">~400 MiB</span>
          </div>
          <a
            class="bars-link"
            href="https://zerofmk.in/benchmark.html"
            target="_blank"
            rel="noopener"
            >See the methodology →</a
          >
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";

const stats = [
  { value: 10, suffix: "K+", label: "requests / sec", sub: "single binary" },
  {
    value: 5,
    prefix: "<",
    suffix: "ms",
    label: "p99 latency",
    sub: "under load",
  },
  { value: 50, suffix: " MiB", label: "RSS at speed", sub: "16–50 MiB range" },
  { value: 130, suffix: "+", label: "framework tests", sub: "with coverage" },
];

const root = ref<HTMLElement | null>(null);

function initCounters(scope: HTMLElement) {
  const els = Array.from(scope.querySelectorAll<HTMLElement>("[data-count]"));
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const run = (el: HTMLElement) => {
    const target = parseFloat(el.dataset.value || "0");
    const suffix = el.dataset.suffix || "",
      prefix = el.dataset.prefix || "";
    if (reduce) {
      el.textContent = prefix + Math.round(target) + suffix;
      return;
    }
    const dur = 1500,
      t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / dur);
      const val = target * (1 - Math.pow(1 - p, 3));
      el.textContent =
        prefix + (val % 1 === 0 ? Math.round(val) : val.toFixed(1)) + suffix;
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = prefix + Math.round(target) + suffix;
    };
    requestAnimationFrame(tick);
  };
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries)
        if (e.isIntersecting) {
          run(e.target as HTMLElement);
          io.unobserve(e.target);
        }
    },
    { threshold: 0.5 },
  );
  els.forEach((el) => io.observe(el));
}

onMounted(() => {
  if (!root.value) return;
  initCounters(root.value);
  const bars = root.value.querySelector<HTMLElement>(".bench-bars");
  if (bars)
    new IntersectionObserver(
      (entries) => {
        for (const e of entries)
          if (e.isIntersecting) {
            bars.classList.add("in");
          }
      },
      { threshold: 0.3 },
    ).observe(bars);
});
</script>
