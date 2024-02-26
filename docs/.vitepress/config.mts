import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "StoryBook",
  description: "this is a book for web developers writed by story!",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: "首页", link: "/" },
      { text: "chrome插件", link: "/chrome-plugin/prospectus" },
    ],

    sidebar: [
      {
        text: "chrome插件开发指南",
        items: [
          { text: "开篇词", link: "/chrome-plugin/prospectus" },
          { text: "从0到1", link: "/chrome-plugin/start" },
          { text: "通信", link: "/chrome-plugin/message" },
          { text: "manifest配置", link: "/chrome-plugin/manifest" },
          { text: "action配置", link: "/chrome-plugin/action" },
          { text: "tab配置", link: "/chrome-plugin/tabs" },
          { text: "存储系统", link: "/chrome-plugin/store" },
          { text: "脚本注入", link: "/chrome-plugin/script" },
          { text: "内容安全策略", link: "/chrome-plugin/csp" },
          { text: "网络篇", link: "/chrome-plugin/network" },
          { text: "devtools", link: "/chrome-plugin/devtools" },
        ],
      },
    ],

    socialLinks: [
      { icon: "github", link: "https://github.com/vuejs/vitepress" },
    ],
  },
});
