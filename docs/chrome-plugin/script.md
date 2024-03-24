## 一、前面的话

今天我们会介绍一个特别牛的特性，那就是**脚本注入**。

如果您阅读过我插件系列前面的文章，就能够知道我们主要通过`contentScript`来扩展站点的功能，因为在`contentScript`环境中我们可以获取到站点的 DOM 对象，进而扩展站点的行为，但是`contentScript`是静态的，也就是说我们在开发的时候写一份，每一个匹配到的站点就会执行它。但是如果我们的需求是对某几个特定的站点执行一些个性化的扩展的话就有些力不从心了。

我们举个简单的例子：

假设我们现在要统计一些数据，针对百度和 google 两种搜索引擎，测试一下他们对同一词条的搜索结果的差异。我们当然可以使用肉眼去看，比如像下面这样。

**google**

![Screen Shot 2023-09-16 at 3.22.30 PM.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/cebc77bb7e6d428784da333ba6dad770~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=2146&h=1298&s=1159244&e=png&b=ffffff)

**百度**

![Screen Shot 2023-09-16 at 3.22.37 PM.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/6da997c0cac1437c8e4edf8852d6d1af~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=1912&h=1066&s=418574&e=png&b=fefefe)

但我们不想用肉眼去看，这个时候我们就可以开发一款插件，这款插件会自动识别两种搜索引擎的搜索结果，然后统计他们的搜索词条的标题和数量。

任何需求都可以抽象成若干个简单的小问题，我们将这个需求抽象成下面这样：

**我们希望实现在特定的时机，在 a.com 中执行 a 逻辑，b.com 中执行 b 逻辑！**

### 为什么不使用 contentScript

可能大家首先会想要使用 contentScript 来做，我就在 contentScript 中写如下这样的代码就好了：

```js
// content.js

 if(当前的url是 a.com){
    // 执行a逻辑
 }

 if(当前的url是 a.com){
   // 执行b逻辑
 }

```

这样做看似是可以的，但是要知道`contentScript`是每次刷新页面的时候都会执行的，但是需求是在特定的时候，可能是在 popup 中点了某个按钮之后。可千万不能每次刷新页面都执行，因为每次都执行的话会产生一些脏数据，干扰统计的结果。

那这个时候怎么办呢？

这就需要在这个特定的时机，如果能够往某个站点注入一段脚本就好了。幸运的是，chrome 早就为我们提供了这样的能力 -- **chorome 脚本注入**。

## 二、MV2 版本

如果你是使用 MV2 版本来进行插件开发的话，那么就可以使用 tabs 来实现脚本注入，需求在 manifest.json 中追加这样的配置：

```json
{
   ...
   "manifest_version": 2,
   permissions:["tabs"]
   ...
}

```

然后这样使用它：

```js
chrome.tabs.executeScript(
  tabId?: number,
  details: [InjectDetails],
  callback?: function,
)
```

这个 InjectDetails 是这样的配置：

```ts
type InjectDetails {
  allFrames?:boolean,
  code?:string,
  file?:string, // 路径
  cssOrigin?:"author" | "user",
  frameId?:number
}
```

InjectDetails 这个类型的每个字段的含义会在下文中和 MV3 版本一起说明，因为使用 tabs 的方式注入脚本的方式已经被 MV3 版本给替换了，它变成了全新的一个方式 --**scripting**

## 二、MV3 版本

要是用 MV3 版本的脚本注入，首先需要做的就是在 manifest.json 中追加下面的配置

```json
{
  ...
  "manifest_version": 3,
  "permissions": ["scripting", "activeTab"],
  "host_permissions":["<all_urls>"]
  ...
}
```

为什么还需要加上 host_permissions 呢？其实是因为`scripting`只是给你提供了 scripting 相关的 API，但是要真的使用的话，还得让站点允许你去注入脚本，因为注入脚本是一个非常具有侵入性的动作，所以需要使用`host_permissions`来允许你做一些侵入性的事情，被`host_permissions`匹配的站点就会允许你去注入脚本，否则是不可以的，如果你不配置 host_permissions 就使用 scripting，会报这个错：

![Screen Shot 2023-09-16 at 4.06.11 PM.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/e20551f0fb3241babbfb02fafb041414~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=1350&h=416&s=311443&e=png&b=f0f2f3)

上面配置的 manifest.json 中就是所有站点都允许注入脚本。

**使用**

```js
function getTabId() { ... }

chrome.scripting
    .executeScript({
      target : {tabId : getTabId()},
      files : [ "script.js" ],
    })
    .then(() => console.log("script injected"));
```

你可以往一个特定的 tab 中注入一段脚本并运行。

我们都知道每个网页中可以嵌入 iframe，而一个站点中 iframe 的 javascript 运行时和主站点的 javascript 运行时是相互隔离的，他们的变量也不能够互相访问。

![Screen Shot 2023-09-16 at 4.15.40 PM.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/852832065fe84944b19a3324678c1356~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=950&h=1354&s=443665&e=png&b=ffffff)

如果我希望注入的脚本也能够在 main 站点下的所有 iframe 中都生效的话，我可以这样做：

```js
function getTabId() { ... }

chrome.scripting
    .executeScript({
      target : {tabId : getTabId(), allFrames : true}, // 指定allFrames为true，默认为false，只在main中注入并执行，不能穿透所有的iframe。
      files : [ "script.js" ],
    })
    .then(() => console.log("script injected in all frames"));
```

同样的，你也可以让脚本注入除 main 之外特定的几个 iframe，只需要知道他们的 iframeId 即可。

```
function getTabId() { ... }

chrome.scripting
    .executeScript({
      target : {tabId : getTabId(), frameIds : [ frameId1, frameId2 ]},
      files : [ "script.js" ],
    })
    .then(() => console.log("script injected on target frames"));
```

上面的例子是注入一个文件，我们如果只是希望注入一个简单的函数也是可以的，我们可以这样做。

```
// background.js
function getTabId() { ... }
function getTitle() { return document.title; } // 这个document是被注入的环境的DOM对象。

chrome.scripting
    .executeScript({
      target : {tabId : getTabId()},
      func : getTitle,
    })
    .then((title) => console.log("injected a function" , title)); // 可以在回调中拿到返回值
```

上面是注入脚本的例子，如果我们要注入 css 可以这样：

```
function getTabId() { ... }
const css = "body { background-color: red; }";

chrome.scripting
    .insertCSS({
      target : {tabId : getTabId()},
      css : css,
      origin:"author" | "user"
    })
    .then(() => console.log("CSS injected"));
```

这个`origin`有两种类型，一种是“author”，一种是“user”，我们可以通过[这里](https://developer.mozilla.org/en-US/docs/Glossary/Style_origin)来认识它。

"Style origin"（样式来源）是一个用于标识样式规则应用的来源的概念。在 Web 开发中，页面的样式可以来自多个不同的来源，这些来源可以相互覆盖或叠加，从而决定元素最终的外观。

下面是一些常见的样式来源：

1.  **User Agent Stylesheet（用户代理样式表）：** 这是浏览器内置的样式表，用于定义 HTML 元素的默认外观。例如，浏览器会为标题元素（`<h1>`, `<h2>`, 等）和段落元素（`<p>`）定义默认字体、颜色和间距等样式。
1.  **Author Stylesheet（作者样式表）：** 这是由网页开发人员或设计师编写的样式表，用于自定义页面的外观。作者样式表包括在 HTML 文档中的`<style>`标签或外部 CSS 文件中。
1.  **User Stylesheet（用户样式表）：** 这是由用户定义的自定义样式表，用于覆盖网页上的任何样式规则。用户样式表通常是通过浏览器插件或扩展来添加的。
1.  **Element Inline Styles（元素内联样式）：** 这是直接在 HTML 元素上使用`style`属性定义的样式规则。内联样式具有最高的优先级，因为它们直接应用于元素本身。

当页面上存在来自多个样式来源的规则时，样式来源的优先级通常按照以下顺序决定（从高到低）：

1.  元素内联样式（内联样式表）。
2.  用户样式表（用户定义的自定义样式）。
3.  作者样式表（网页开发人员定义的样式）。
4.  用户代理样式表（浏览器的默认样式）。

我们在注入 css 样式的时候，可以选择以何种方式来注入样式。

### 模块

上面的展示了如何注入一段脚本，但是其实他们都是一锤子买卖，注入之后立马就运行了，然后就结束了。我们也可以选择注入一个模块，可以实现脚本的多次执行。

```js
chrome.scripting.registerContentScripts(
  scripts: RegisteredContentScript[],
  callback?: function,
)
```

```ts
type RegisteredContentScript {
  allFrames?:boolean, // 是否注入子代frames中
  css?:string[], // 对匹配的站点注入的css文件路径的集合
  excludeMatches?:string[], // 排除那些站点
  id:string, // 唯一标示
  js?:string[], // 对匹配的站点注入的js文件路径的集合
  matches?:[], // 匹配哪些站点
  persistAcrossSessions?:boolean,
  runAt?:"document_start" | "document_idle" | "document_end",// 执行时机
}
```

通过上面的配置，我们可以注入一个脚本模块，来指定什么时候可以执行脚本；

```js
chrome.scripting.registerContentScripts(
  scripts: [
    {
       id:"test",
       js:['script.js'],
       matches:["https://example.com/*"],
       runAt:"document_start"
    }
  ]
)
```

上面的例子就代表所有匹配上 https://example.com 的站点每次在 DOM 开始加载的时候执行 script.js 脚本。

既然有注册，那就有取消，我们可以这样来取消我们注册的 javascritp 模块：

```ts
chrome.scripting.unregisterContentScripts(
  filter?: { ids:string[] },
  callback?: function,
)
```

## 三、小试牛刀

我们尝试做一个需求，插件安装之后，弹出一个页面，页面中有一个按钮，点击之后可以让 google 的页面变绿，让百度的页面变红。

```json
{
  "name": "scripting demo",
  "description": "scripting demo",
  "version": "1.0",
  "manifest_version": 3,
  "action": {
    "default_icon": {
      "16": "/images/get_started16.png",
      "32": "/images/get_started32.png",
      "48": "/images/get_started48.png",
      "128": "/images/get_started128.png"
    }
  },
  "background": {
    "service_worker": "background.js"
  },
  "icons": {
    "16": "/images/get_started16.png",
    "32": "/images/get_started32.png",
    "48": "/images/get_started48.png",
    "128": "/images/get_started128.png"
  },
  "permissions": ["tabs", "scripting", "activeTab"],
  "host_permissions": ["<all_urls>"]
}
```

```js
// background
chrome.runtime.onInstalled.addListener(async () => {
  chrome.tabs.create({
    url: "demo.html",
  });
});
```

```demo.js
function func() {
  document.body.style.background = "red";
}

function funcGoogle() {
  document.body.style.background = "green";
}

document.getElementById("start").addEventListener("click", async () => {
  const googleTabs = await chrome.tabs.query({
    url: "https://www.google.com/*",
  });

  const baiduTabs = await chrome.tabs.query({
    url: "https://www.baidu.com/*",
  });

  console.log(googleTabs, baiduTabs);
  baiduTabs.forEach((tab) => {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func,
    });
  });

  googleTabs.forEach((tab) => {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: funcGoogle,
    });
  });
});

```

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Document</title>
  </head>
  <body>
    <h1>scripting 演示效果</h1>

    <h1>点下面的按钮，可以让google变绿，百度变红</h1>
    <button id="start">start</button>
    <script src="./demo.js"></script>
  </body>
</html>
```

演示效果：

![Screen Recording 2023-09-16 at 5.29.39 PM.gif](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/9538b256a34145daad4def09b9e75390~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=2870&h=1774&s=1808636&e=gif&f=64&b=fefefe)

## 四、资源

上面的案例我放在 github 仓库啦：[地址在这里](https://github.com/sonxiaopeng/chrome-extensions-learn/tree/master/scripting)
