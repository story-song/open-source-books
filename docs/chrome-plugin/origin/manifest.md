---
theme: channing-cyan
---

## 一、前言

在我们开发浏览器插件的过程中，`manifest`无疑是我们的基石性文件，也是浏览器插件唯一要求的必要文件，里面的配置涵盖了我们所有想要实现的功能，因此在开发浏览器插件之前，对 manifest 的了解是非常有必要的，本文尝试对 manifest.json 的大部分常用的配置做一个整理和总结，帮助读者快速理解各个配置的作用和用法！

话不多说开始吧！

## 二、manifest.json

先看一下一个常见的 manifest.json 是什么样子的！

```json
{
  "name": "Getting Started Example",
  "description": "Build an Extension!",
  "version": "1.0",
  "manifest_version": 3,
  "background": {
    "service_worker": "background.js"
  },
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "/images/get_started16.png",
      "32": "/images/get_started32.png",
      "48": "/images/get_started48.png",
      "128": "/images/get_started128.png"
    }
  },
  "icons": {
    "16": "/images/get_started16.png",
    "32": "/images/get_started32.png",
    "48": "/images/get_started48.png",
    "128": "/images/get_started128.png"
  },
  "permissions": [
    "storage",
    "activeTab",
    "scripting",
    "contextMenus",
    "notifications",
    "tabs"
  ],
  "options_page": "options.html",
  "content_scripts": [
    {
      "js": ["content.js"],
      "css": ["content.css"],
      "matches": ["<all_urls>"]
    }
  ]
}
```

manifest 远不止以上的这些属性，实际上全部的配置是这样的：

```
{
  // Required 必须配置
  "manifest_version": 3,
  "name": "My Extension",
  "version": "1.0.1",

  // Recommended 建议配置
  "action": {...},
  "default_locale": "en",
  "description": "A plain text description",
  "icons": {...},

  // Optional 其他的配置
  "author": "developer@example.com",
  "automation": {...},
  "background": {...},
  "chrome_settings_overrides": {...},
  "chrome_url_overrides": {...},
  "commands": {...},
  "content_scripts": [{...}],
  "content_security_policy": {...},
  "cross_origin_embedder_policy": {...},
  "cross_origin_opener_policy": {...},
  "declarative_net_request": {...},
  "devtools_page": "devtools.html",
  "event_rules": [{...}],
  "export": {...},
  "externally_connectable": {...},
  "file_browser_handlers": [...],
  "file_system_provider_capabilities": {...},
  "homepage_url": "https://path/to/homepage",
  "host_permissions": [...],
  "import": [{...}],
  "incognito": "spanning, split, or not_allowed",
  "input_components": [{...}],
  "key": "publicKey",
  "minimum_chrome_version": "107",
  "oauth2": {...},
  "omnibox": {...},
  "optional_host_permissions": ["..."],
  "optional_permissions": ["..."],
  "options_page": "options.html",
  "options_ui": {...},
  "permissions": ["..."],
  "requirements": {...},
  "sandbox": {...},
  "short_name": "Short Name",
  "storage": {...},
  "tts_engine": {...},
  "update_url": "https://path/to/updateInfo.xml",
  "version_name": "1.0 beta",
  "web_accessible_resources": [...]
}
```

但实际上我们开发的过程中，能够用到的属性并不会太多，因此我们只需要了解大多数属性就可以了，以下是我整理的我们可能需要用到的配置，他们分别是：

1. name

   name 属性代表的是插件的名字，它展示在扩展程序管理界面，它的下面就是 description!

![截屏2023-05-07 下午10.15.20.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/eb60d968438c45d8866bf9dcd7bf4a78~tplv-k3u1fbpfcp-watermark.image?)

2. version

   version 字段代表插件代码的版本，由开发者定义，和 package.json 中的 version 相似！这个字段并不直接显式的某个界面上！

3. manifest_version

   manifest_version 是浏览器插件采用的版本，到目前一共有三种版本，分别是 1、2、和最新版 3。

   ![截屏2023-05-07 下午10.22.33.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/b4e2d00019af4158b0d82fdbcbaf19a5~tplv-k3u1fbpfcp-watermark.image?)

   从官网的描述来看，v3 是从 chrome 88 版本后就开始支持了，v3 版本会更加的安全、隐私、和高性能。因此 chrome 团队鼓励开发者开发 v3 版本的插件。

4. icons

   icons 是一个配置图标的配置，不需要多解释，但是我们需要配置多至 4 种规格的图片，用于在不同的位置显示。

5. description

   对于插件的描述

6. action

   该字段是控制浏览器插件在 tab 栏中的表现的。我们可以通过这个字段配置插件的图标、popup 的内容路径等。

   ![截屏2023-05-09 下午10.28.55.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/3c4cd44c8ccf411aab76914d222d77f0~tplv-k3u1fbpfcp-watermark.image?)

   它的配置如下：

   ```json
   {
      ...
      "action": {
        "default_popup": "popup.html", // popup的内容
        "default_icon":{
          "16":"/icon路径",
          "32":"/icon路径",
          "48":"/icon路径",
          "128":"/icon路径",
        }
      }
      ...
    }
   ```

7. content_scripts

   由于插件的内容是注入进 content 的，所以需要有一个 content_scripts 字段指定一个注入的脚本。它有三个核心的字段，css 可以注入一段 css，js 注入一段脚本，matches 被匹配到的网页才会被注入 css 或者 js。

   ```json
   {
     ...
     "content_scripts": [
       {
         "js": [ "content.js"],
         "css":[ "content.css" ],
         "matches": ["<all_urls>"] // 代表可以匹配所有的url，支持正则匹配。
       }
     ]
     ...
   }
   ```

8. background

   在浏览器插件的世界里，有一个在背后默默运行的脚本，这个脚本就像一个老父亲一样在后台，自第一次安装后，不会再次执行，因此特别适合做全局的状态管理和通信的中间站，并且这个环境中运行的脚本可以跨域，适合请求外部资源，它就是 background 脚本。

   它的配置很简单，如下：

   ```json
   {
     "background": {
       "service_worker": "background.js"
     }
   }
   ```

9. options_page

   在浏览器插件中，如果我们希望保存一些插件默认的配置，比如插件的主题、全局的状态、布局方式等等，就不太适合放在 content 或者 popup 中，因为他们的生命周期很短，经常刷新。如果保存在 background 中又不能给用户看到，让用户直观感受当前选择的状态，那么这个时候就可以使用 option 配置，它藏在这里：

   ![截屏2023-05-09 下午10.47.02.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/1d28eefd31d14804847184eff7fb677a~tplv-k3u1fbpfcp-watermark.image?)

   右键点击 action 图标就可以出现选项，点击选项就可以看到我们配置的 option 的页面，但是一定是要在 manifest 中配置了 option 才会出现选项这个菜单栏，否则是没有的！它的配置方式如下：

   ```json
   {
      ...
      "options_page": "options.html",
      ...
   }
   ```

10. permissions

    权限的概念是因为“安全”提出来的，它限制和控制了往浏览器插件注入的 api 的数量，默认情况下在插件执行的沙箱环境中能够使用的 chormeAPI 是比较少的。如果想要使用诸如`bookmarks`、`storage`等高级的 chromeAPI，就需要在 permissions 配置，这就是 permission 的核心作用。

    那么为什么需要这样设计呢？

    根据官网的解释，这是为了有助于限制损害，如果您的扩展受到恶意软件的损害。一些权限会在安装前或运行时根据需要显示给用户，以征求他们的同意，详情见权限警告。

    其实本质上就是更好的管理插件的能力，因为在插件有很强大的能力，比如访问书签、控制 tab、访问磁盘、跨域请求等等。如果是一个恶意的插件，用户很有可能在无感知的情况下安装并使用了这些插件，恶意插件使用了泄露用户隐私的插件能力就会造成对用户的威胁。但通过加这样的一个 permission 字段，当用户在安装插件时，chrome 浏览器会提醒用户该插件可能会导致哪些问题，使用了哪些比较危险的 api，用户确认与预期的符不符合，可以帮助用户更好的判断是否是一个恶意的插件。从而降低用户权益被侵犯的可能性。他的提示如下：

    ![VVyazEJTquUP7aa6OZn0.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/70a0e49ec827431c88ba0a1b241be1a0~tplv-k3u1fbpfcp-watermark.image?)

    用户在安装时就可以看看是否和自己预期的一样！

    他的用法如下：

    ```json
    {
        ...
        "permissions": [
            "activeTab",
            "scripting"
         ],
        ...
    }
    ```

    这样在自己的插件代码中就可以使用 scripting 相关的 api 了，当然这样的 api 有很多，以下是 permissions 可以添加的能力。

    | 权限                                    |
    | --------------------------------------- |
    | `"activeTab"`                           |
    | `"alarms"`                              |
    | `"background"`                          |
    | `"bookmarks"`                           |
    | `"browsingData"`                        |
    | `"activeTab"`                           |
    | `"certificateProvider"`                 |
    | `"clipboardRead"`                       |
    | `"clipboardWrite"`                      |
    | `"contentSettings"`                     |
    | `"contextMenus"`                        |
    | `"cookies"`                             |
    | `"debugger"`                            |
    | `"declarativeContent"`                  |
    | `"declarativeNetRequest"`               |
    | `"declarativeNetRequestWithHostAccess"` |
    | `"declarativeNetRequestFeedback"`       |
    | `"declarativeWebRequest"`               |
    | `"desktopCapture"`                      |
    | `"documentScan"`                        |
    | `"downloads"`                           |
    | `"enterprise.deviceAttributes"`         |
    | `"enterprise.hardwarePlatform"`         |
    | `"enterprise.networkingAttributes"`     |
    | `"enterprise.platformKeys"`             |
    | `"experimental"`                        |
    | `"fileBrowserHandler"`                  |
    | `"fileSystemProvider"`                  |
    | `"fontSettings"`                        |
    | `"gcm"`                                 |
    | `"geolocation"`                         |
    | `"history"`                             |
    | `"identity"`                            |
    | `"idle"`                                |
    | `"loginState"`                          |
    | `"management"`                          |
    | `"nativeMessaging"`                     |
    | `"notifications"`                       |
    | `"offscreen"`                           |
    | `"pageCapture"`                         |
    | `"platformKeys"`                        |
    | `"power"`                               |
    | `"printerProvider"`                     |
    | `"printing"`                            |
    | `"printingMetrics"`                     |
    | `"privacy"`                             |
    | `"processes"`                           |
    | `"proxy"`                               |
    | `"scripting"`                           |
    | `"search"`                              |
    | `"sessions"`                            |
    | `"storage"`                             |
    | `"system.cpu"`                          |
    | `"system.display"`                      |
    | `"system.memory"`                       |
    | `"system.storage"`                      |
    | `"tabCapture"`                          |
    | `"tabGroups"`                           |
    | `"tabs"`                                |
    | `"topSites"`                            |
    | `"tts"`                                 |
    | `"ttsEngine"`                           |
    | `"unlimitedStorage"`                    |
    | `"vpnProvider"`                         |
    | `"wallpaper"`                           |
    | `"webNavigation"`                       |
    | `"webRequest"`                          |

    详细的功能介绍可以看[这篇文档](https://developer.chrome.com/docs/extensions/mv3/declare_permissions/)

11. host_permissions

    之前我们提到过，如果是在 content 脚本中访问外部资源，不管这个外部资源允不允许跨域，都会报跨域错误，但在 background 和 popup 以及 options 这些环境中是可以跨域的，但是它只是允许非同源的请求的发送，如果请求的资源不允许跨域，那么依然会报跨域错误。因此这个时候我们可以将该资源添加到 host_permissions 中，就可以正常访问到该资源了。

12. commands

    为了用户方便点击，我们还可以在 manifest.json 中设置一个键盘快捷键的命令，通过快捷键来弹出 popup 页面。而 commands 就是用来配置这些快捷键的，例如：

    ```josn
    "commands": {
       "_execute_browser_action": {
         "suggested_key": {
           "default": "Ctrl+Shift+F",
           "mac": "MacCtrl+Shift+F"
         },
         "description": "Opens popup.html"
       }
    }
    ```

13. minimum_chrome_version

    插件运行的 chrome 版本最低要求

14. web_accessible_resources

    普通页面能够直接访问的插件资源列表，如果不设置是无法直接访问的

15. default_locale

    默认的语言

