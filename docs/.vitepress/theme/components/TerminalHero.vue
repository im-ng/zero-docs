<template>
  <section class="hero">
    <div class="container hero-grid">
      <div class="hero-copy">
        <span class="eyebrow">zig 0.16 · v0.5.3</span>
        <h1 class="hero-title">
          Build microservices<br />in <span class="hl">Zig</span>.<br />
          <span class="sub">One binary. No GC.</span>
        </h1>
        <p class="hero-lead">
          Zero is a batteries-included web framework for Zig. Wire REST, SQL,
          NoSQL, cache, pub/sub, auth, GraphQL and observability into a single
          static binary, configured almost entirely through <code>.env</code>.
        </p>
        <div class="hero-cta">
          <a class="btn btn-accent" href="/started">
            Getting Started
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M5 12h14M13 6l6 6-6 6"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </a>
          <a
            class="btn"
            href="https://github.com/im-ng/zero"
            target="_blank"
            rel="noopener"
            >View on GitHub</a
          >
        </div>
      </div>

      <div class="hero-term" ref="termEl">
        <span class="note mono">runs in ~15 lines ↗</span>
        <div class="term" data-terminal>
          <div class="term-bar">
            <span class="dot r"></span><span class="dot y"></span
            ><span class="dot g"></span>
            <span class="term-title mono">~/my-app — zero</span>
          </div>
          <pre
            class="term-body mono"
            ref="bodyEl"
            aria-label="Animated terminal showing the Zero quick start"
          ></pre>
        </div>
        <span class="mascot hero-mascot"
          ><img
            src="/zero-logo.svg"
            alt=""
            width="124"
            height="157"
            decoding="async"
        /></span>
      </div>
    </div>

    <div class="container">
      <div class="hero-install">
        <span class="hi-label mono">install</span>
        <code class="mono hi-cmd" id="doc-install-cmd"
          >zig fetch --save
          https://github.com/im-ng/zero/archive/refs/heads/main.zip</code
        >
        <button
          class="hi-copy"
          type="button"
          data-copy="#doc-install-cmd"
          aria-label="Copy install command"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect
              x="9"
              y="9"
              width="11"
              height="11"
              rx="2"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
            />
            <path
              d="M5 15V5a2 2 0 0 1 2-2h10"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
            />
          </svg>
        </button>
      </div>

      <ul class="stats">
        <li class="stat">
          <span
            class="stat-num mono"
            data-count
            data-value="10"
            data-suffix="K+"
            >0</span
          ><span class="stat-label">requests / sec</span>
        </li>
        <li class="stat">
          <span
            class="stat-num mono"
            data-count
            data-value="50"
            data-suffix=" MiB"
            >0</span
          ><span class="stat-label">typical RSS <em>(16–50)</em></span>
        </li>
        <li class="stat">
          <span class="stat-num mono" data-count data-value="15" data-suffix=""
            >0</span
          ><span class="stat-label">lines to first API</span>
        </li>
        <li class="stat">
          <span class="stat-num mono" data-count data-value="30" data-suffix="+"
            >0</span
          ><span class="stat-label">integrations built-in</span>
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";

interface Seg {
  t: string;
  c?: string;
  pause?: number;
}

const segments: Seg[] = [
  { t: "$ ", c: "p" },
  { t: "mkdir my-app && cd my-app\n", c: "c" },
  { t: "$ ", c: "p" },
  {
    t: "zig fetch --save https://github.com/im-ng/zero/archive/refs/heads/main.zip\n",
    c: "c",
  },
  { t: "$ ", c: "p" },
  { t: "printf 'APP_NAME=hello\\nHTTP_PORT=8080\\n' > configs/.env\n", c: "c" },
  { t: "$ ", c: "p" },
  { t: "zig build run\n", c: "c", pause: 380 },
  { t: "INFO ", c: "live" },
  { t: "[07:46:47] ", c: "dim" },
  { t: "Loaded config from file: ./configs/.env\n", c: "c" },
  { t: "INFO ", c: "live" },
  { t: "[07:46:47] ", c: "dim" },
  { t: "Starting server on port: 8080\n", c: "c", pause: 1600 },
  { t: "$ ", c: "p" },
  { t: "curl localhost:8080/json\n", c: "c" },
  { t: '  {"msg":"hello zero!"}\n', c: "json", pause: 2600 },
];

const termEl = ref<HTMLElement | null>(null);
const bodyEl = ref<HTMLElement | null>(null);

function initTerminal(root: HTMLElement, body: HTMLElement, segs: Seg[]) {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) {
    body.textContent = segs.map((s) => s.t).join("");
    return;
  }
  const SPEED = 16,
    LINE_PAUSE = 230,
    HOLD = 4200,
    GAP = 700;
  let seg = 0,
    ch = 0,
    current: HTMLSpanElement | null = null,
    timer: number | undefined,
    running = false;
  const reset = () => {
    body.textContent = "";
    seg = 0;
    ch = 0;
    current = null;
  };
  function step() {
    running = true;
    if (seg >= segs.length) {
      timer = window.setTimeout(() => {
        reset();
        timer = window.setTimeout(step, GAP);
      }, HOLD);
      return;
    }
    const s = segs[seg];
    if (ch === 0) {
      current = document.createElement("span");
      if (s.c) current.className = s.c;
      body.appendChild(current);
    }
    current!.textContent += s.t[ch];
    ch++;
    if (ch >= s.t.length) {
      seg++;
      ch = 0;
      const extra = (s.pause || 0) + (s.t.includes("\n") ? LINE_PAUSE : 0);
      timer = window.setTimeout(step, extra || SPEED);
    } else {
      timer = window.setTimeout(step, SPEED);
    }
  }
  const stop = () => {
    if (timer) window.clearTimeout(timer);
    timer = undefined;
    running = false;
  };
  const start = () => {
    if (!running) step();
  };
  new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) start();
        else stop();
      }
    },
    { threshold: 0.25 },
  ).observe(root);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else start();
  });
}

function initCounters() {
  const els = Array.from(
    document.querySelectorAll<HTMLElement>("[data-count]"),
  );
  if (!els.length) return;
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
      for (const e of entries) {
        if (e.isIntersecting) {
          run(e.target as HTMLElement);
          io.unobserve(e.target);
        }
      }
    },
    { threshold: 0.5 },
  );
  els.forEach((el) => io.observe(el));
}

function initCopy() {
  document.querySelectorAll<HTMLButtonElement>("[data-copy]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const sel = btn.dataset.copy;
      if (!sel) return;
      const target = document.querySelector<HTMLElement>(sel);
      const text = target?.textContent?.trim() || "";
      try {
        await navigator.clipboard.writeText(text);
        btn.classList.add("copied");
        const prev = btn.innerHTML;
        btn.innerHTML =
          '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 13l4 4L19 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        window.setTimeout(() => {
          btn.classList.remove("copied");
          btn.innerHTML = prev;
        }, 1400);
      } catch {}
    });
  });
}

onMounted(() => {
  const boot = () => {
    if (termEl.value && bodyEl.value)
      initTerminal(termEl.value, bodyEl.value, segments);
    initCounters();
    initCopy();
  };
  if (typeof window.requestIdleCallback === "function")
    window.requestIdleCallback(boot, { timeout: 600 });
  else window.setTimeout(boot, 200);
});
</script>
