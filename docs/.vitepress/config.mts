import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "OpenBook",
  description: "this is a book for web developers writed by story!",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: "首页", link: "/" },
      { text: "chrome插件", link: "/chrome-plugin/prospectus" },
      { text: "react", link: "/react-deep/index" },
    ],

    logo: "/public/logo.png",

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
      // {
      //   text: "React底层的秘密",
      //   items: [
      //     {text: "开篇词", link: "/react-deep/index" },
      //     { text: "React组件", link: "/react-deep/component" },
      //     { text: "React状态管理", link: "/react-deep/state" },
      //     { text: "React生命周期", link: "/react-deep/lifecycle" },
      //     { text: "React事件", link: "/react-deep/event" },
      //   ]
      // }
    ],

    outline: {
      label: "页面导航",
    },

    socialLinks: [{ icon: "github", link: "https://github.com/sonxiaopeng" }],

    editLink: {
      pattern:
        "https://github.com/sonxiaopeng/open-source-books/edit/main/docs/:path",
      text: "在github上编辑此页",
    },

    lastUpdated: {
      text: "更新于",
      formatOptions: {
        dateStyle: "short",
        timeStyle: "medium",
      },
    },

    docFooter: {
      prev: "上一篇",
      next: "下一篇",
    },

    footer: {
      message: "遵循MIT开源协议",
      copyright: `版权所有 © 2019-${new Date().getFullYear()} Story`,
    },

    langMenuLabel: "多语言",
    returnToTopLabel: "回到顶部",
    sidebarMenuLabel: "菜单",
    darkModeSwitchLabel: "主题",
    lightModeSwitchTitle: "切换到浅色模式",
    darkModeSwitchTitle: "切换到深色模式",
  },
});
