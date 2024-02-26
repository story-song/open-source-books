## 一、前言

chrome 浏览器一直跑在所有浏览器前面，是所有现代浏览器当之无愧的霸主，今天我们来聊聊 chrome 的插件`（也可以叫做扩展）`。

![u=2591235827,3710801686&fm=253&fmt=auto&app=138&f=PNG.webp](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/ecc0190ea09d44b99b8aafac2f3c9b55~tplv-k3u1fbpfcp-watermark.image?)

插件的目的是为了更好的个性化的服务用户，当我们在某个 web 页面浏览信息的时候，如果原 web 站点没能给用户提供想要的功能，那么这个时候就可以借助插件去扩充这个 web 页面的功能。

我们不妨举个例子，如果我在浏览一个页面的时候，我觉得这个站点的主题太暗了，伤眼睛。但是 web 站点并未提供这个调主题的功能。那么这个时候，我就想要切换主题颜色怎么办，我们就可以选择开发一款插件，专门用来切换站点的颜色。

甚至我们还可以将插件打造成一单独的服务，比如在浏览很多英文网页的时候，我想单独翻译成某个单词，这个时候就可以开发一个插件，于是就有了[`划词翻译`](https://hcfy.app/)。

由于插件是扩展 web 的功能的，因此使用的技术也是 web 技术，因此对于前端开发者而言，我们可能又多了一个更好的上手的技术！`我谢谢你啊，谷歌`

综上所述：插件的本质是更好的扩展和丰富个性化的功能，为用户提供更好服务的一种手段。

## 二、插件结构

插件的结构如下图所示：

![截屏2023-01-14 下午4.57.32.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/194e7561ebd7413eb0115e6395e7f735~tplv-k3u1fbpfcp-watermark.image?)

一个插件有多个独立的脚本运行环境，以下是最为主要的几种。

- background

  这个环境在 manifest_version3(`以下简称v3`)中废弃了 background.html，只有一个 service worker 环境，换句话说在之前的版本中，有一个 background.html 里面引入一个 xx.js 塑造一个独立的 dom 环境；而现在变成一个 javascript 运行环境。因为发现原来的 dom 环境是没有意义的，因为 background 主要用来运行脚本，而非展示内容。

- content

  这个环境其实就是当前激活的浏览器 tab 的运行环境，是一个标准的 dom 环境，content 中可以注入一些 css、javascript 脚本，并且可以访问和改变当前 web 的 DOM 属性，属于一个核心的特性。

  既然是注入的样式和脚本，就可能会存在冲突，那冲突之后谁的优先级更高呢？

  建立这样一个 web 站点！

  ```html
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta http-equiv="X-UA-Compatible" content="IE=edge" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Document</title>
      <style>
        div {
          background: green;
          width: 100px;
          height: 100px;
        }
      </style>
    </head>
    <body>
      <div></div>
      <script>
        console.log("主web页面");
        window.web = "我是window上的一个变量";
        const a = "a";
      </script>
    </body>
  </html>
  ```

  然后通过插件注入以下 content.js

  ```javascript
  const div = document.createElement("div");
  div.innerText = `我是content.js创建的内容`;
  div.style.width = "100px";
  div.style.height = "100px";
  div.style.border = "1px solid black";

  document.body.appendChild(div);

  console.log(window.web, "content.js");
  console.log(a);
  ```

  当然需要配置好下面的 v3 版的 manifest.json

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

  可以看到如下的结果：
  ![截屏2023-01-14 下午10.28.38.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/9df0d962e66d4c7ebaeb5b1a0ca97a86~tplv-k3u1fbpfcp-watermark.image?)

  可以得出以下结论：

  1. 主 web 站点的脚本会比插件先执行，这是正常的，这也是插件可以起作用的原因
  2. 插件注入的脚本不能共享主 web 站点的全局变量，即便挂载在 window 上也是不可以的

  看完了 js 的优先级，那么 css 呢！

  往上可以回顾一下 manifest.json 会发现，我们已经注入了如下的 content.css：

  ```css
  body div {
    background: red;
  }
  ```

  这个我们主 web 站点的 css 是冲突的，且这个的 css 优先级更高，因此呈现出红色。但是假如主站点的 css 优先级和注入的 css 优先级一样高呢？我们试一下，将 content.css 改为：

  ```css
  div {
    background: red;
  }
  ```

  呈现出如下模样：

![截屏2023-01-14 下午10.38.55.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/762b352e2092407b965776a1aa1c3d98~tplv-k3u1fbpfcp-watermark.image?)
可以看到注入的 css 明显被主 web 站点的 css 覆盖了。可以得出以下结论：

1. 主 web 站点的 css 与插件 css 优先级一致时，以主 web 站点优先，否则就是谁的优先级更高，谁优先。
2. 插件的 css 在 chrome 控制台上有`注入的样式`，这样的字样作为提示。

- popop

  popop 也是一个独立的 dom 环境，也就是我们点击插件图标时，会弹出来的那个悬浮框，当然前提是我们在 manifest.json 中进行了配置才可以。

## 三、通信

无论我们什么新的技术，我们或许都会了解通信这个内容，例如`vue`和`react`当中我们需要学习组件与组件之间的通信，在`操作系统`中，我们需要学习不同进程之间如何进行通信。同样的，在`插件开发`当中我们也需要了解不同环境之间是如何进行通信的。

通信的本质其实就是不同模块之间如何传递消息，从而更好的进行协作和沟通。所以只有知道 popop、content、background 之间如何传递消息，我们才能更自信的开发插件。以下内容针对 v3 版本：

他们的运行次数有什么区别呢？

content 脚本会运行多份，每新开一个 tab 都会运行一份 content 脚本，生命周期也和当前的 web 站点一致，也就是说，如果刷新当前站点，那么 content 也会重新执行一次。

background 脚本是全局唯一的，每次安装时或者重新加载时都会执行一次。

popop 脚本，会在每次点击 tab 时弹出悬浮框时执行一次。

- popop/background to content

  浏览器一次性可以运行着多个 tab，每一个 tab 都有自己的唯一的标识符，所以如果 popop 想要给 tab 通信时，先要确定想要发给那一个 tab，一般情况下我们都选择给当前激活的也就是当前正在浏览的 tab 发送呢消息。如下的 popop 脚本：

  popop.html

  ```html
  <!DOCTYPE html>
  <html>
    <head>
      <link rel="stylesheet" href="button.css" />
    </head>
    <body>
      <button id="btn1">way 1</button>
      <button id="btn2">way 2</button>
      <script src="popup.js"></script>
    </body>
  </html>
  ```

  popop.js

  ```js
  btn1.addEventListener("click", async (event) => {
    let [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    chrome.tabs.sendMessage(tab.id, {
      action: "click",
      payload: "i come form popop",
    });
  });
  ```

  content.js

  ```js
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    const { action, payload } = request;
    console.log(request);
    sendResponse("content got!");
  });
  ```

  就会有如下的效果：

  ![屏幕录制2023-01-15 下午12.00.05.gif](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/197a69a653d947eeb99b0191dda928fc~tplv-k3u1fbpfcp-watermark.image?)
  content 成功收到消息，根据不同消息可做不同的业务操作

- content to popop/background

  那 conetent 如何给 popop 以及 background 发送消息呢？

  content.js

  ```js
  const btn = document.createElement("button");

  btn.innerText = `send`;

  btn.addEventListener("click", () => {
    chrome.runtime.sendMessage({
      action: "toPopop",
      payload: "i come form  popop",
    });
  });

  document.body.appendChild(btn);
  ```

  popop 与 background 都做以下的监听：

  ```js
  // popop.js
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    const { action, payload } = request;
    console.log(action, payload, "popop got!");
    sendResponse("popop got!");
  });
  ```

  ```js
  // background.js
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    const { action, payload } = request;
    console.log(action, payload, "background got!");
    sendResponse("background got!");
  });
  ```

  效果如下：

![屏幕录制2023-01-15 下午12.31.35.gif](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/266a91c6e5c3483fb7193468473b69e2~tplv-k3u1fbpfcp-watermark.image?)

可以看到 background 和 popop 都会收到消息，而只需要通过逻辑去判断谁该执行具体的业务就好了！

## 四、总结

通信核心 API：

```js
// 监听
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // to do ...
});

//发送消息
// content background popop
chrome.runtime.sendMessage(/** 消息 **/);

// background popop
const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
chrome.tabs.sendMessage(tab.id /**消息**/);
```

以上的例子如果希望亲手实践一下，可以克隆我准备代码看一下！（保熟）

[gittee 项目地址](https://gitee.com/songxiaopenggitee/chrome-getting-start)

更多插件相关的问题，欢迎评论区一起探讨！
