## 一、前面的话

今天我们来认识一个 chrome 插件中的核心概念，它就是 chrome 插件`安全系统`的重要组成部分 —— [Content Security Policy (CSP)](https://developer.chrome.com/docs/extensions/mv3/manifest/content_security_policy/#default-policy)。中文可以译作**内容安全策略**

换句话说，chrome 插件要保证自己的运行的内容是安全的，不会导致用户的利益和隐私受到恶意的读取。所以 chrome 插件的设计者为 chrome 制定的一些限制 🚫，这个就是内容安全策略的通俗理解。

为了更好的帮你全面的认识内容安全策略，接下来我们会从下面几个方面来介绍：

- 表现在哪些方面？
- 为什么要有这个？
- 什么是 sanbox？

### 可以使用 eval 么？

大家都知道 chrome 插件开发是完全拥抱 web 技术的，也就是说我们可以使用 js、css、html 来开发插件就完全足够了，那么在 js 中，有一个函数叫做[eval](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval)，它相当于一个 javascript 执行入口，可以将一段字符串的代码交给 js 引擎去执行。

```js
console.log(eval("2 + 2"));
// 输出: 4

console.log(eval(new String("2 + 2")));
// 输出: 2 + 2

console.log(eval("2 + 2") === eval("4"));
// 输出: true

console.log(eval("2 + 2") === eval(new String("2 + 2")));
// 输出: false
```

以上在 web 端运行时完全没问题的，但是如果在 chrome 插件中使用 eval 就会有问题，它会报下面这个错：

![Screen Shot 2023-09-17 at 12.49.44 PM.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/57fc18cea19f462584addd2156605eb7~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=1612&h=552&s=132705&e=png&b=fcf7f7)

根据这个报错，我们就回答了第一个问题，内容安全策略的第一个表现就是禁止在 chrome 上下文执行环境中使用`eval`。

如果您读过我的插件系列的文章，您就会知道，除了不能使用`eval`之外，在 pupup.html、option.html 中都不能够使用内联的`scirpt`脚本，像下面这样就是不允许的：

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>chrome page</title>
  </head>
  <body>
    <h1>我是popup.html</h1>
    <script>
      console.log("这是popup.html的内联脚本");
    </script>
  </body>
</html>
```

必须通过使用一个`pupop.js`文件引入的方式来注入脚本，这些其实都是内容安全策略的限制。

### 为什么禁止 eval?

其实禁止 eval 的理由很简单——因为它太强大了，eval 可以运行任何一段脚本，那就意味着用户可能会写下类似下面这样的代码：

```js
const script = `
  chrome.cookies.get({ 
    url: tabUrl, 
    name: "cookieName" 
  });
`;

eval(script);
```

如果是插件作者自己因为业务需求需要获取 cookie 不要紧，但是要知道这个 script 可能来自网络，如果网络中有恶意的脚本交给 chrome 运行了，就会可能导致 chromeAPI 的滥用，导致用户的隐私信息比如 cookie，书签等信息的泄露，这对于用户来说显然是一种损失。

所以禁止 eval 的原因之一就是因为害怕恶意的脚本借助强大的 chromeAPI 的能力在插件上下文运行了，从而非法获取用户的隐私信息。

除了禁用 eval，还有其他的一些特性，比如你也不能使用`new Function()`的方式来声明一个函数；

![Screen Shot 2023-09-17 at 1.03.27 PM.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/1922cd2e8f664614b72481766846d4bd~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=1092&h=254&s=68501&e=png&b=fdf3f3)

在 popup.html、options.html 等插件页面中不能有内联的脚本等等，他们都是`内容安全策略`的限制。

### 什么是 sandbox?

那么如果我们就是想要使用 eval 怎么办呢？其实也是有办法的，我们只需要找到根源就好：

`内容安全策略`之所以限制部分部分 Javascript 特性的使用，就是因为它们可能会导致 chromeAPI 的滥用，因此只需要让他们在一个没有办法调用 chromeAPI 的环境中执行就好了，这个环境就是 sandbox。

`sandbox`通常指的是沙箱环境，它是一种安全机制，用于隔离插件的代码和操作，以防止恶意行为或不当访问用户的敏感数据。它有以下几个作用：

1.  **代码隔离：** 沙箱环境将插件的代码与浏览器的核心代码和其他插件隔离开来。这意味着插件的 JavaScript 代码无法直接访问浏览器的敏感信息或其他插件的数据，从而增强了安全性。
2.  **限制执行环境：** 沙箱通常会限制插件的代码执行环境，防止插件滥用底层系统资源或执行危险操作。这包括限制文件系统访问、网络请求和系统级操作等。
3.  **权限控制：** Chrome 插件系统通过权限模型来控制插件的功能。插件需要在其`manifest.json`文件中声明所需的权限，用户在安装插件时需要授予这些权限。这有助于确保插件只能执行其明确定义的任务。
4.  **内容脚本沙箱：** 插件中的内容脚本（Content Scripts）通常在 Web 页面上运行，它们也受到沙箱机制的保护。这意味着内容脚本的代码只能访问所嵌入页面的内容，而无法直接访问插件的 API 或其他插件资源。
5.  **沙箱沙盒化：** 沙箱环境本身也可以进一步沙盒化，以确保插件中的不同组件之间相互隔离。这意味着插件的不同部分（如背景脚本、内容脚本和弹出窗口）之间通常不能直接共享变量或数据。

## 二、沙盒解决方案

接下来我们将采用在沙箱环境下运行一段脚本，首先需要在 manifest.json 中声明一下：

```json
{
  ...,
  "sandbox": {
     "pages": ["sandbox.html"] // 指定需要沙盒化的page
  },
  ...
}
```

我们在 sandbox.html 中测试一下一些特定的特性是否可以使用：

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
    <h1>sanbox demo</h1>

    <script>
      console.log("这是来自sandbox的chrome", chrome);
      eval('console.log("sandbox")');
    </script>
  </body>
</html>
```

然后在 background.js 中设置打开这个 sandbox.html

```js
chrome.runtime.onInstalled.addListener(() => {
  console.log("这是来自background的chrome", chrome);

  chrome.tabs.create({
    url: "sandbox.html",
  });
});
```

当我们加载插件的时候，就会打开 sandbox.html，结果如下：

![Screen Shot 2023-09-18 at 9.40.29 PM.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/ac4444c3b03f48d0a48f55d112bb274d~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=1580&h=1322&s=274549&e=png&b=232427)

- 1. `eval()`能够正常执行
- 2. 能够使用`内联脚本`
- 3. 不同于 background 环境中的 chrome 对象，`sandbox`环境中的 chrome 只有极少的属性，也就是说在`sandbox`环境中，无法调用 chromeAPI 中类似 storage、tabs 等高级特性。

所以结论是：我们其实可以在插件中使用 eval 等在 web 端常用的特性，只需要将它运行的环境在 manifest.json 中显示的指定为沙盒环境就好了。

可能有的同学就会问了，虽然解决了使用 eval 的问题，但是又产生了一个新的问题，那就是既然没办法使用 chrome 的高级特性，那通信咋办呀，由沙盒环境产出的结果怎么通知给外部呀！

这个其实就要用到我们之前的一个知识了 —— `postMessage`，它的使用文档在[这里](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage)，这个 API 允许你向同源的所有域发送消息，也可以监听来自同源的域发送的消息。在插件中，我们改动一下上面的案例，使用类似下面的方式：

**第一步：在 background.js 创建一个 demo.html，它属于插件的 page。**

```js
// background.js
chrome.runtime.onInstalled.addListener(() => {
  console.log("这是来自background的chrome", chrome);

  chrome.tabs.create({
    url: "demo.html",
  });
});
```

**第二步：在 demo 中嵌入 sandbox.html**

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
    <h1>我是parent</h1>
    <button id="sendMessage">向sandbox发送消息</button>

    <script src="./demo.js"></script>
    <iframe
      id="theFrame"
      src="sandbox.html"
      frameborder="0"
      width="500"
      height="300"
    ></iframe>
  </body>
</html>
```

```js
// demo.js 通过给iframe发送消息
document.getElementById("sendMessage").addEventListener("click", () => {
  document
    .getElementById("theFrame")
    .contentWindow.postMessage("hello sandbox", "*");
});
```

**第三步：在 sandbox.html 中做监听**

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
    <h1>我是sandbox</h1>
    <p>我是来自parent的data: <span id="show"></span></p>
    <script>
      eval('console.log("我可以执行eval")');

      window.addEventListener("message", (event) => {
        const receivedMessage = event.data;
        const show = document.getElementById("show");
        show.innerHTML = receivedMessage;
      });
    </script>
  </body>
</html>
```

效果如下：

![Screen Recording 2023-09-18 at 10.11.50 PM.gif](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/1dbabbfc9f4c4408a991fedaf44ab9d1~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=2870&h=1698&s=512336&e=gif&f=58&b=1f2425)

至此，我们成功实现了沙盒环境的创建和与插件 page 进行通信。

## 三、定制策略

通过上面的学习，我们知道在 chrome 插件的世界里，有两种 page：

- 插件 page，例如：**popup.html**、**option.html**、通过**chrome.tabs.create()** 创建出来的 page 等...
- 沙盒 page，通过在 manifest.json 中的 sandbox 指定的 page。

它们都不是完美的，正如这个世界上没有完美的人一样。

插件 Page 不是完美的，因为它无法调用"eval"，沙盒 page 不是完美的，因为它无法调用 chromeAPI。他们都不完美，但是他们合作起来（通信），可以做到很多事情。

为什么出现上述的现象，就是因为内容安全策略的限制 🚫，实际上在 chrome 插件的世界里，内容安全策略也有一种描述，默认情况下它在 manifest.json 中是这样的：

```json
{
  // ...
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self';",
    "sandbox": "sandbox allow-scripts allow-forms allow-popups allow-modals; script-src 'self' 'unsafe-inline' 'unsafe-eval'; child-src 'self';"
  }
  // ...
}
```

"extension_pages"的属性值，便是插件 page 的限制内容。同理，"sandbox"的属性值就是沙盒 page 的限制内容。

我们当然可以去修改这个策略，但是大部分情况下是不需要的，因为对于"extension_pages"来说，默认策略已经是最宽松的限制了，你不能比它更宽松，你只能更严格的限制它。如果你取消某些规则，例如：把“script-src 'self'”解除掉，就会报错：

![Screen Shot 2023-09-18 at 10.29.35 PM.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/050fbef0ae30494e9b7ba3c2b987391b~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=960&h=378&s=171828&e=png&b=292a2d)

所以我的建议是，不要去修改这个策略了，因为完全没有必要，因为它已经是最宽松的策略了，如果您不希望自己的人生更加坎坷，不要去轻易修改它。

## 四、资源

上面的案例我放在 github 仓库啦：[地址在这里](https://github.com/sonxiaopeng/chrome-extensions-learn/tree/master/sanbox)
