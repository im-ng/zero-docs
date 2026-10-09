<template>
  <section class="code" id="code">
    <div class="container code-grid">
      <div class="code-copy">
        <span class="eyebrow">hello, json</span>
        <h2>That's the whole app.</h2>
        <ul class="steps">
          <li>Drop it in <code>src/main.zig</code></li>
          <li>Add a <code>configs/.env</code></li>
          <li><code>zig build run</code> gives you a JSON API with structured logs</li>
          <li><code>/metrics</code> already live.</li>
        </ul>
        <p class="code-aside">
          Everything else (Postgres, Redis, Kafka, auth, GraphQL and metrics) is
          opt-in through configuration. Nothing to wire by hand.
        </p>
        <a class="btn btn-accent" href="https://zerofmk.in/hello-zero.html" target="_blank" rel="noopener">
          Full walkthrough
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>
        </a>
        <span class="note">~15 lines → running API</span>
      </div>

      <div class="code-window card" id="code-window">
        <div class="term-bar">
          <span class="dot r"></span><span class="dot y"></span><span class="dot g"></span>
          <span class="term-title mono">src/main.zig</span>
          <button ref="btn" class="copy code-copy-btn" type="button" @click="copy" aria-label="Copy code">
            <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2" fill="none" stroke="currentColor" stroke-width="1.8" /><path d="M5 15V5a2 2 0 0 1 2-2h10" fill="none" stroke="currentColor" stroke-width="1.8" /></svg>
          </button>
        </div>
        <div class="code-body" v-html="rendered"></div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";

const code = `const std = @import("std");
const zero = @import("zero");
const App = zero.App;

pub const std_options: std.Options = .{ .logFn = zero.logger.custom };

pub fn main(init: std.process.Init) !void {
    var arena = std.heap.ArenaAllocator.init(std.heap.page_allocator);
    defer arena.deinit();

    const app = try App.new(arena.allocator(), init.io, init.environ_map);
    try app.get("/json", jsonResponse);
    try app.run();
}

fn jsonResponse(ctx: *zero.Context) !void {
    try ctx.json(.{ .msg = "hello zero!" });
}`;

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const rendered = ref(`<pre class="code-pre"><code>${escapeHtml(code)}</code></pre>`);

let hlPromise: Promise<import("shiki").Highlighter> | null = null;
function getHl(): Promise<import("shiki").Highlighter> {
  if (!hlPromise) {
    hlPromise = import("shiki").then(({ createHighlighter }) =>
      createHighlighter({ themes: ["github-dark"], langs: ["zig"] })
    );
  }
  return hlPromise;
}

onMounted(async () => {
  try {
    const hl = await getHl();
    rendered.value = hl.codeToHtml(code, { lang: "zig", theme: "github-dark" });
  } catch {
    /* keep plain-text fallback */
  }
});

const btn = ref<HTMLButtonElement | null>(null);

async function copy() {
  try {
    await navigator.clipboard.writeText(code);
    const b = btn.value; if (!b) return;
    b.classList.add("copied");
    const prev = b.innerHTML;
    b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 13l4 4L19 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    window.setTimeout(() => { b.classList.remove("copied"); b.innerHTML = prev; }, 1400);
  } catch {}
}
</script>
