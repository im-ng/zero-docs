<template>
  <section class="cta" id="start">
    <div class="container cta-inner">
      <span class="mascot cta-mascot" aria-hidden="true">
        <img src="/zero-logo.svg" alt="" width="96" height="96" />
      </span>
      <span class="eyebrow">ready when you are</span>
      <h2>Start building in Zig.</h2>
      <p class="cta-sub">
        One dependency-free binary. No GC. Everything else is configuration.
      </p>

      <div class="cta-install">
        <code class="mono" id="cta-cmd">{{ cmd }}</code>
        <button class="copy" type="button" data-copy="#cta-cmd" aria-label="Copy install command">
          <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2" fill="none" stroke="currentColor" stroke-width="1.8" /><path d="M5 15V5a2 2 0 0 1 2-2h10" fill="none" stroke="currentColor" stroke-width="1.8" /></svg>
        </button>
      </div>

      <div class="cta-links">
        <a class="btn btn-accent" href="https://zerofmk.in/started.html" target="_blank" rel="noopener">Read the docs</a>
        <a class="btn" href="https://github.com/im-ng/zero" target="_blank" rel="noopener">GitHub</a>
        <a class="btn" href="https://zerofmk.in/examples.html" target="_blank" rel="noopener">Examples</a>
      </div>
    </div>

    <footer class="site-foot">
      <div class="container foot-grid">
        <span class="foot-brand">zero<span class="dot">.</span></span>
        <span class="foot-meta mono">Apache-2.0 · zig 0.16.0 · built with VitePress</span>
        <span class="foot-links">
          <a href="https://zerofmk.in" target="_blank" rel="noopener">docs</a>
          <a href="https://github.com/im-ng/zero" target="_blank" rel="noopener">github</a>
          <a href="https://zerofmk.in/community.html" target="_blank" rel="noopener">community</a>
        </span>
      </div>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { onMounted } from "vue";

const cmd = "zig fetch --save https://github.com/im-ng/zero/archive/refs/heads/main.zip";

function initCopy() {
  document.querySelectorAll<HTMLButtonElement>("[data-copy]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const sel = btn.dataset.copy; if (!sel) return;
      const target = document.querySelector<HTMLElement>(sel);
      const text = target?.textContent?.trim() || "";
      try {
        await navigator.clipboard.writeText(text);
        btn.classList.add("copied");
        const prev = btn.innerHTML;
        btn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 13l4 4L19 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        window.setTimeout(() => { btn.classList.remove("copied"); btn.innerHTML = prev; }, 1400);
      } catch {}
    });
  });
}

onMounted(initCopy);
</script>
