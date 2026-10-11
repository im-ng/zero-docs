import { h, defineComponent, onMounted } from "vue";
import DefaultTheme from "vitepress/theme";
import "./custom.css";
import "./landing.css";
import HomeLanding from "./components/HomeLanding.vue";
import BackToTop from "./components/BackToTop.vue";

export default {
  extends: DefaultTheme,
  enhanceApp({ app }: { app: any }) {
    app.component("HomeLanding", HomeLanding);
  },
  Layout: defineComponent({
    setup() {
      onMounted(() => {
        const el = document.querySelector(".VPNavBarTitle .title");
        const span = el && el.querySelector("span");
        if (span && span.textContent && span.textContent.endsWith(".") && !span.querySelector(".nav-dot")) {
          span.innerHTML = span.textContent.slice(0, -1) + '<span class="nav-dot">.</span>';
        }
      });
      return () =>
        h(DefaultTheme.Layout, {}, {
          "home-hero": () => h(HomeLanding),
          "home-features": () => null,
          "layout-bottom": () => h(BackToTop),
        });
    },
  }),
};
