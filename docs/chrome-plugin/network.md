## 一、前面的话

在互联网的世界里，`网络`永远是绕不过去的一个话题，在插件开发的过程中，我们同样也需要对网络进行一定的了解，通过本篇文章我们将学习的以下知识，便于你更好的掌握插件开发的技术，从而轻松应对各种需求，它们是：

- 1. chrome 插件如何监听请求？
- 2. 一个请求在插件中的生命周期？
- 3. chrome 插件如何拦截、修改、取消请求？
- 4. chrome 插件的代理机制？

从我们的浏览器中可以发出各不相同的请求，有的允许跨域，有的不允许，在日常开发当中我们时常利用他们的特性来达到我们的目的，实现我们的需求。

比如我们会通过 xhr、fetch 来发送 Ajax 请求用于获取各种数据资源；通过 script 标签来获取脚本，然后在本地执行；通过 img 标签来获取图片资源；iframe 则更为疯狂，直接获取整个 domcument 文档。

毫不夸张额说，浏览器似乎就是在各个地方获取一些资源，然后通过一种方式将他们组织起来和用户交互。

**插件面向的从来都不是一个站点或者某几个站点，它面向的是整个浏览器，它站在一个更高的维度去俯视所有的 tab 标签，一人之下万人之上；浏览器之下，所有 tab 之上。**

## 二、webRequest

既然是所有 tab 之上，chrome 插件就可以站在所有 tab 的背后去做一些事情，于是 chrome 插件为我们提供了**webRequest**去做这些事情。

在请求发送的过程中我们可以通过 webRequest 来监听、观测、拦截、修改、补充这些请求，从而来实现一些特定的需求。

我们还是遵循以前的风格，从一个需求开始说起，从需求慢慢引出我们要说的知识，这样你会记忆更加深刻，因为生硬的知识总是易忘的，但是结合起生活场景就会生动起来。

> **需求**：大家都知道现在青少年上网成瘾，很多家长有个烦恼，不给自己孩子买电脑吧，耽搁他们学习，给他们买吧又怕他们毫无节制的上网，于是你想了个办法，开发一款插件，这个插件安装后，浏览器只能在某个特定的时候，比如早上的 9:00 到 12:00 能够上网，其他时间都上不了网。

需求确定好之后就可以想办法了，我们只需要拦截每一个由浏览器发出的请求，然后获取当前的时间，如果处于 9:00 到 12:00 之间就允许发送，否则就拦截掉。

而插件其实恰恰就可以很好的做这件事情，接下来我们一一来介绍。

### 生命周期

webRequest 定义了一系列的事件来描述每一个请求的经历的心路历程，它们来到插件后，会有类似下面的生命周期：

![Screen Shot 2023-09-21 at 10.22.43 PM.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/a9f4d6a6b3e24a92b019273d250bb973~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=862&h=1062&s=520476&e=png&b=fbfbfb)

每一个事件都代表一个生命周期的钩子，他们的含义如下：

`onBeforeRequest`：当一个请求将要发出的时候触发。这个事件会在 TCP 连接建立之前，因此我们可以用它来取消或者重定向一个请求。

`onBeforeSendHeaders`：当一个请求将要发出，并且请求头已经初始化完成的时候触发。这个事件允许我们增加、修改、删除请求头的某些字段。由于还没有发出，它也可以用来取消这个请求。

`onSendHeaders`：当请求头被 onBeforeSendHeaders 处理过之后，请求头就已经成形了。这个事件就会在请求头被发送至网络前触发，并且异步的执行。它将不再允许我们修改请求头，或者取消请求。

`onHeadersReceived`：当收到 http 或者 https 响应头的时候触发。需要注意的是，由于可能存在重定向和身份验证请求，一个请求可能会来到这里多次。这个事件允许我们去增加、修改、删除响应头的字段，比如**Content-Type**；并且该事件允许你取消或者重定向该请求。

`onAuthRequired`：这个事件是当响应回来的时候，需要用户权限时触发，比如状态码为 401、407 的时候。这个事件允许你提供用户名、密码等去申请权限。需要注意的是，权限可能会错误，不要掉入死循环了，因为如果你提供的也错了，会继续返回 401，然后又被这个事件拦截，又错了，一直进行下去，所以一般都要事情计数器来控制一下。同时它也允许取消请求。

`onBeforeRedirect`：要重定向将要发出时触发。一个重定向的发生可能来自于一个 HTTP 级别的状态码，比如 301、302 等。它不允许你修改或者取消这个重定向的请求。

`onResponseStarted`：当响应体的第一个字节接收到的时候触发。它同时也意味着这个响应头是合法的。这个事件不允许取消或者修改请求了。

`onCompleted`：当一个请求完全成功结束后触发。

`onErrorOccurred`：上述过程中，任意一个出现错误后触发。

以上事件中，onCompleted、onErrorOccurred、onBeforeRedirect 都有可能成为生命周期的末尾。

给每一个事件做监听之后，打印得到的顺序如下：

![Screen Shot 2023-09-21 at 11.04.52 PM.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/434401bf127d4888bca271c7d8ca9405~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=1644&h=656&s=142965&e=png&b=242528)

和预期的顺序一致，说明没有问题。

### 使用方法

要想使用 webRequest，我们需要在 manifest 文件中进行配置，并且配置相应的 host_permissions：

---

**MV2 版本用法**

```json
{
  ...
  "manifest_version": 2,
  "permissions": [
    "webRequest",
    "<all_urls>"
  ],
  ...
}
```

如果我们需要监听一个请求，语法是下面这样的：

```typescript
chrome.webRequest.onBeforeSendHeaders.addListener(
  callback: function,
  filter: RequestFilter,
  extraInfoSpec?: OnBeforeSendHeadersOptions[],
)

type ResourceType = 可参考 （https://developer.chrome.com/docs/extensions/reference/webRequest/#type-ResourceType）

type RequestFilter = {
  tabId?:number,  // 需要监听的tab的id
  types?:ResourceType[],
  urls:string[],// 必填，需要监听的url
  windowId?:number // 需要监听的窗口id
}

type OnBeforeSendHeadersOptions = "requestHeaders" | "blocking" | "extraHeaders"

callback: (details: object) => BlockingResponse | undefined

type BlockingResponse = {
  authCredentials?: { username:string , password:string },
  cancel?:boolean,
  redirectUrl?:string,
  requestHeaders?:HttpHeaders,
  responseHeaders?:HttpHeaders
}
```

根据上面的类型只是一个简单的说明，更多类型可以看[这里](https://developer.chrome.com/docs/extensions/reference/webRequest/#type-BlockingResponse)，根据上面的类型，我们可以这样使用：

```js
chrome.webRequest.onBeforeSendHeaders.addListener(
  (detail) => {
    console.log("onBeforeSendHeaders", detail);
  },
  {
    urls: ["https://juejin.cn/*", "http://localhost:3000/*"],
  },
  ["extraHeaders", "requestHeaders"]
);
```

上面的例子就可以监听掘金的请求，以及本地的一个请求了，我们在本地启动一个 node 服务然后再发送一个请求就可以得到下面的请求信息：

![Screen Shot 2023-09-23 at 10.36.12 AM.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/3eb9403d724444c989e5a802f6e5ee3b~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=1464&h=1190&s=332468&e=png&b=ffffff)

同样可以利用它来增加一个请求头，可以这样操作：

```js
chrome.webRequest.onBeforeSendHeaders.addListener(
  (detail) => {
    const headers = detail.requestHeaders;

    headers.push({ name: "X-My-Header", value: "hello" });

    console.log("onBeforeSendHeaders", detail);

    return {
      requestHeaders: headers,
    };
  },
  {
    urls: ["https://juejin.cn/*", "http://localhost:3000/*"],
  },
  ["extraHeaders", "blocking", "requestHeaders"]
);
```

如果我们需要对请求头做修改，那么就需要在第三个参数中声明一个"blocking"，这将意味着监听函数会同步执行，直到函数返回值之前，这个请求是会被阻塞的。如果不指定这个"blocking"，将忽略返回值，也无法对请求头做任何修改。

上面的例子中我们添加了一个请求头的字段，服务端中可以拿到：

![Screen Shot 2023-09-23 at 10.49.53 AM.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/c05a3acac2c14d71bfd311695c4e7c4c~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=1168&h=536&s=269368&e=png&b=000000)

说明修改成功！其他的 API 也都是类似这样的用法，在这里就不一一举例了，我们主要是体验一下通过插件来拦截请求的感觉，以小见大。

## 二、proxy

通过上面的内容我们知道我们可以通过插件来实现请求的监听，并且举出了具体的例子，我们有能力从请求的**起点**到请求的**终点**之间做一些我们想做的事情，但是有的时候，我们不满足于这中间的过程，我们甚至想要修改终点，通过上面就有点力不从心了。

我们还是来举个场景，大家应该平常都会使用魔（fan）法（qiang）对吧！如果你对魔法有一定了解就应该知道，它的原理大抵是通过一台代理服务来做转发，我们本地的请求不会直接到终点，而是请求通过中间服务器，这台中间服务器必须具备访问外网的能力，然后利用它来访问外网，然后再转发给本地，这样就实现了一个魔法。

实不相瞒，chrome 插件正好为我们友好的提供了代理的能力，它可以为我们拦截浏览器的所有请求，然后发给目标代理服务器，然后通过目标代理服务器来最终和外网交互。大名鼎鼎的 **Proxy SwitchySharp**就是利用 chrome 的这一特性去实现代理的。

接下来话不多说我们一起来学习一下这个 chromeAPI 吧！

我们同样在 manifest.json 做如下的配置：

```
{
  "name": "My extension",
  ...
  "permissions": [
    "proxy"
  ],
  ...
}
```

代理有下面几种模式供我们进行选择：

- `direct`：这样方式就是直接连接模式，不会有代理的参与，你的请求直接打到终点的。

- `auto_detect`：这种模式下就可以实现代理，不需要你配置其他参数，他会根据这个地址的内容 http://wpad/wpad.dat 来决定如何代理。

- `pac_script`：这种模式下，你可以配置一个脚本来决定让浏览器转发请求到哪个地方，相对比较自由。

- `fixed_servers`：这种模式下，可以通过配置一组规则来决定如何转发请求，这个规则由`ProxyRules`这种类型来进行约束。

- `system`：这种方式下，浏览器会根据系统代理去决定如何转发请求。

默认情况下，浏览器就是走的系统代理。

如果想要配置代理，就需要一个 ProxyConfig，它的类型是这样的。

```ts
type ProxyConfig = {
  mode:Mode // 模式
  pacScript?:string // pac脚本
  rules?:ProxyRules
}


type ProxyRules = {
  bypassList?:string[], // 需要跳过的，不进行代理的url
  fallbackProxy?:ProxyServer,
  proxyForHttp?:ProxyServer,
  proxyForHttps?:ProxyServer,
  ...
}


type ProxyServer = {
   host:string, // ip
   port:number, // 端口
   scheme:string // 协议
}

```

以下就是一个合法的配置和使用方式：

```js
var config = {
  mode: "fixed_servers",
  rules: {
    proxyForHttp: {
      scheme: "socks5",
      host: "1.2.3.4",
    },
    bypassList: ["foobar.com"],
  },
};
chrome.proxy.settings.set({ value: config, scope: "regular" }, function () {});
```

或者可以使用 pac_script 方式

```js
var config = {
  mode: "pac_script",
  pacScript: {
    data:
      "function FindProxyForURL(url, host) {\n" +
      "  if (host == 'foobar.com')\n" +
      "    return 'PROXY localhost:8080';\n" +
      "  return 'DIRECT';\n" +
      "}",
  },
};
chrome.proxy.settings.set({ value: config, scope: "regular" }, function () {});
```

以上就是 proxy 相关的核心知识了，代理其实一般也不会用到，即便用到也有很成熟的解决方案了，因此我们了解一下即可。

## 四、维护

## 五、最后的话

插件系列文章：

- [chrome 插件之从 0 到 1](https://juejin.cn/post/7204316982887137337)
- [chrome 插件之通信（V3 版）](https://juejin.cn/post/7188738032248291385)
- [chrome 插件之 manifest 配置](https://juejin.cn/post/7188738032248291385)
- [chrome 插件之玩转 action](https://juejin.cn/post/7248035662073987133)
- [chrome 插件之存储系统](https://juejin.cn/post/7268127651168534588)
- [chrome 插件之脚本注入](https://juejin.cn/post/7278982293707014155)
- [chrome 插件之内容安全策略 🚫](https://juejin.cn/post/7280050832949887034)

另外我有一个自己的网站，欢迎来看看  [new-story.cn](https://new-story.cn)

创作不易，如果您觉得文章有任何帮助到您的地方，或者触碰到了自己的知识盲区，请帮我点赞收藏一下，或者关注我，我会产出更多高质量文章，最后感谢您的阅读，祝愿大家越来越好。
