<template>
  <section class="cmp" id="compare">
    <div class="container">
      <div class="cmp-head">
        <span class="eyebrow">the difference</span>
        <h2>One binary. Nothing else to ship.</h2>
        <p class="cmp-sub">Drag the divider to compare a Zero service with a typical Go / Node setup.</p>
      </div>

      <div class="cmp-stage">
        <div class="cmp-slider" data-slider style="--pos: 52%">
          <div class="cmp-panel cmp-typ">
            <div class="cmp-banner">Typical <span>Go / Node</span></div>
            <ul class="cmp-rows">
              <li v-for="m in metrics" :key="'t' + m.k"><span class="cmp-k">{{ m.k }}</span><span class="cmp-v">{{ m.typ }}</span></li>
            </ul>
          </div>
          <div class="cmp-panel cmp-zero">
            <div class="cmp-banner">Zero <span>zig 0.16</span></div>
            <ul class="cmp-rows">
              <li v-for="m in metrics" :key="'z' + m.k"><span class="cmp-k">{{ m.k }}</span><span class="cmp-v">{{ m.zero }}</span></li>
            </ul>
          </div>
          <button class="cmp-handle" type="button" role="slider" aria-label="Comparison position" aria-valuemin="0" aria-valuemax="100" aria-valuenow="52" data-handle>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6 4 12l5 6M15 6l5 6-5 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>
          </button>
        </div>
        <p class="cmp-hint mono">← drag →</p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted } from "vue";

const metrics = [
  { k: "Output", zero: "1 static binary", typ: "runtime + deps" },
  { k: "Memory (RSS)", zero: "~50 MiB", typ: "200–500+ MiB" },
  { k: "Boilerplate", zero: "~15 lines", typ: "scaffolding + DI" },
  { k: "GC / JIT", zero: "none", typ: "yes" },
  { k: "Deploy", zero: "copy & run", typ: "runtime + PM" },
];

function initComparison() {
  const slider = document.querySelector<HTMLElement>("[data-slider]");
  const handle = document.querySelector<HTMLElement>("[data-handle]");
  if (!slider || !handle) return;
  let dragging = false;
  const setPos = (p: number) => {
    const clamped = Math.max(0, Math.min(100, p));
    slider!.style.setProperty("--pos", clamped + "%");
    handle!.setAttribute("aria-valuenow", String(Math.round(clamped)));
  };
  const fromEvent = (clientX: number) => {
    const rect = slider!.getBoundingClientRect();
    setPos(((clientX - rect.left) / rect.width) * 100);
  };
  slider.addEventListener("pointerdown", (e) => { dragging = true; slider.setPointerCapture?.(e.pointerId); fromEvent(e.clientX); });
  slider.addEventListener("pointermove", (e) => { if (dragging) fromEvent(e.clientX); });
  const stop = () => (dragging = false);
  slider.addEventListener("pointerup", stop);
  slider.addEventListener("pointercancel", stop);
  slider.addEventListener("pointerleave", stop);
  handle.addEventListener("keydown", (e) => {
    const cur = parseFloat(handle.getAttribute("aria-valuenow") || "52");
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") { e.preventDefault(); setPos(cur - 4); }
    else if (e.key === "ArrowRight" || e.key === "ArrowUp") { e.preventDefault(); setPos(cur + 4); }
    else if (e.key === "Home") { e.preventDefault(); setPos(0); }
    else if (e.key === "End") { e.preventDefault(); setPos(100); }
  });
}

onMounted(initComparison);
</script>
