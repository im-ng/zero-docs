import { h, defineComponent } from "vue";
import DefaultTheme from "vitepress/theme";
import "./custom.css";
import "./landing.css";
import HomeLanding from "./components/HomeLanding.vue";

export default {
  extends: DefaultTheme,
  enhanceApp({ app }: { app: any }) {
    app.component("HomeLanding", HomeLanding);
  },
  Layout: defineComponent({
    setup() {
      return () =>
        h(DefaultTheme.Layout, {}, {
          "home-hero": () => h(HomeLanding),
          "home-features": () => null,
        });
    },
  }),
};
