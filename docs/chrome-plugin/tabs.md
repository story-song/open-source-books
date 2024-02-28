## 一、前面的话

本文主要的内容是帮助读者朋友梳理 chrome 插件的 tabs 能力。

### 1.能力

一款浏览器插件具备非常强大的能力，它不仅可以向当前所有的站点里注入脚本，对网站的功能进行扩展。更重要的是它还可以和浏览器的**标签系统**进行交互，从而创建、修改、管理每一个 tab，而这一切都基于插件系统为我们提供的**tabs 相关的 API**，chrome 不仅提供了我们用于操作和管理 tabs 的 API，而且还提供了和**content**脚本之间的通信方法。

> 温馨提示：
>
> Tabs API 只能在 background 脚本中以及 option 脚本、popup 脚本、由 chrome 创建的 tab 中访问到，在 content 脚本中是无法访使用的。
>
> 换句话说，chrome 有选择性的给不同的脚本环境注入了不同的 chrome 对象，导致提供的 API 具备差异性。

![截屏2023-07-09 下午5.53.12.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/f339297dcaf3491aa11bdb1870b3568d~tplv-k3u1fbpfcp-watermark.image?)

该图是我们在特定环境下可以通过 chrome.tabs 访问的所有的 api，这些就是 chrome 为我们内置的提供给开发者的**能力**

### 2.权限

在之前的文章中我们提到过，如果要使用某些特别的 API，我们需要在插件配置文件**manifest.json**中配置相应的**权限声明**，但幸运的是对于 tabs 相关的部分 API 不需要在 manifest.json 中显式的配置“tabs”就可以直接使用。比如说:  创建一个新的 tab，重新加载某个 tab，或者导航到另外一个 URL 等等。

但是下面的这些 API 在使用的时候，则需要加上相关的配置才可以使用，比如说：

- `permission`

  如果你希望通过特定的条件找到某些 tabs，你需要使用 **chrome.tabs.query(queryInfo , callback)** 这个 API，这个时候就需要显示的在 manifest.json 中 permission 中添加“tabs”声明。

- `host permission`
  如果你希望能够对指定的 tab 动态的在其中注入并执行一段脚本，或者注入、移除某一段 css 样式，那么你可能需要用到这些 API：

  ````js
  chrome.tabs.executeScript() // 注入一段脚本并执行

        chrome.tabs.insertCss() // 注入一段css样式

        chrome.tabs.removeCss() // 移除一段css样式
       ```

      这个时候就需要在manifest.json中显式的声明需要命中的url。

       ```js
       {
         // manifest.json
         "host_permissions":[ "<all_urls>" ] // 支持正则匹配正则
       }
      ```
  ````

## 二、API

接下来我们一一通过案例来认识他们，从而感受每一个 API 的具体行为以及他们的使用条件、注意事项等等。

### 1. 创建

我们可以通过这个 API 来创建一个新的 tab，这个 tab 和普通的站点不一样，属于插件所属的页面，因此支持跨域请求、获取更多的 chrome 提供的方法。

```js
// background.js
chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === "install") {
    chrome.tabs.create({
      url: "newtab.html", // 相对于background脚本的路径下需要有一个newtab.html文件
    });
  }
});
```

上面的脚本意味着在插件第一次安装完成之后，就会立马创建一个新的标签页，所以如果我们想要在任何时候创建一个新的 tab，就可以使用这个 API，行业内很多插件的工作台都是创建一个新的 tab 页进行工作的，比如著名的代理插件**SwitchySharp**

![Snipaste_2023-07-10_19-33-24.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/6996f91ac62048aaaa28355e7fd6d31e~tplv-k3u1fbpfcp-watermark.image?)

**该 api 默认支持，不需要额外的 manifest 配置**

### 2. 查找

我们可能有这样的需要，获取当前浏览器窗口处于激活状态的 tab 页面，因为对于同一个窗口，有且只有会一个 tab 是展示在用户面前的，我们把这样的 tab 称为激活状态，这个时候我们就需要用到下面的 api。

```js
async function getCurrentTab() {
  let queryOptions = { active: true };
  let [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}
```

调用上面的方法，你就可以获得当前窗口激活的那个 tab 的实例对象了，从这个对象中，你可以获取到对应的 tab 唯一的 id、url、图标等信息。

![Snipaste_2023-07-10_19-50-08.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/48d67b60852544c483c7ce9038721c4b~tplv-k3u1fbpfcp-watermark.image?)

值得注意的是，如果 chrome 浏览器打开了多个窗口，就意味着可能每一个窗口都会存在一个激活的 tab，因此我们获取的 tab 就会是多个，这个时候如果只是解构出第一个可能是不够严谨的。

因此我们可以通过添加搜索条件来精确的查找：

```JS
async function getCurrentTab() {
  let queryOptions = { active: true , currentWindow:true };
  let [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}
```

通过添加一个参数**currentWindow**，意味着只搜索脚本运行所在窗口的激活的 tab，这个时候肯定只会查找出唯一的一个 tab，解构第一个就不会有问题。

搜索条件除了上述之外，还有下面可以选择：

| 参数          | 类型                            | 作用                                   |
| ------------- | ------------------------------- | -------------------------------------- |
| active        | boolean                         | 是否处于激活状态                       |
| audible       | boolean                         | 是否处于播放音频状态                   |
| currentWindow | boolean                         | 是否处于脚本所在窗口内                 |
| groupId       | number                          | 是否处于某个分组内                     |
| highlighted   | boolean                         | 是否处于高亮状态                       |
| index         | number                          | 窗口从左往右第 index 个 tab            |
| pinned        | boolean                         | 是否处于被固定的状态                   |
| status        | unloaded/loading/complete       | 匹配 tab 的 status 为该 status 的 tabs |
| title         | string                          | 匹配 tab 的 title 为该 title 的 tabs   |
| url           | string                          | 匹配 tab 的 url 为该 url 的 tabs       |
| windowId      | number                          | 特定窗口下的 tabs                      |
| windowType    | normal/popup/panel/app/devtools | 特定的窗口类型下所在的 tabs            |

> 被固定是指那些通过右键点击 tab 的时候，选择固定在最左侧的标签，并且可以固定多个。
> ![Snipaste_2023-07-10_20-10-45.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/3405e295530c44698b48b60848262f24~tplv-k3u1fbpfcp-watermark.image?)

**该 api 默认支持，需要额外的 manifest 配置，需要显式声明“tabs”的 permissions**

### 3.发送消息

我们可以很方便的给指定的 tab 发送消息，一般来说我们可以在 content 脚本中做消息的监听，接收到消息后使其执行不同的业务逻辑。

```js
chrome.tabs.sendMessage(
  tabId: number,  // 目标tab的id
  message: any,  // 发送信息
  options?: object, // 其他配置项
  callback?: function,  // 回调函数
)
```

上面这个是 V3 版本的插件使用的，在 V2 版本中我们使用 chrome.tabs.sendRquest()

```js
// 在v3版本中已废弃
chrome.tabs.sendRequest(
  tabId: number,  // 目标tab的id
  request: any,  // 发送信息
  callback?: function,  // 回调函数
)
```

### 4.修改

如果我们希望修改一个 tab 的一些参数信息，我们可以选择使用下面这个 API：

```js
chrome.tabs.update(
  tabId?: number,
  updateProperties: object,
  callback?: function,
)
```

其中 updateProperties 的值就是上面提到的 queryOptions 的属性保持一致，例如我们可以动态的更改指定 tab 的 title、url、pinned 等状态属性！

### 5.缩放比

当我们按住 ctrl 的同时再滑动鼠标滚轮的话就可以调整页面的缩放比例，这个可能大家平时都深有体会，但是实际上这个也可以通过插件给我们提供的 API 来动态的进行调整：

```js
chrome.tabs.setZoom(
  tabId?: number,
  zoomFactor: number,  // 缩放比例
  callback?: function,
)
```

### 6.移动/移除/刷新

我们介绍的第一个 API 就展示了如何创建一个新的 tab，他会默认创建在最末尾，也就是最右侧，如果这个放置位置我们不满意，我们也可以将其放置在我们想要的位置。

**移动**

```ts
chrome.tabs.move(
  tabIds: number | number[],
  moveProperties: object,
  callback?: function,
)

type moveProperties = {
  index?:number, // 想要移动至的index索引位置. `-1` 移动至窗口末尾.
  windowId?:number // 移动至的窗口id
}
```

**移除**

```js
chrome.tabs.remove(
  tabIds: number | number[],
  callback?: function,
)
```

**刷新**

```ts
chrome.tabs.reload(
  tabId?: number,
  reloadProperties?: object,
  callback?: function,
)

type reloadProperties = {
  bypassCache?:boolean // 是否绕过本地缓存 默认不绕过，也就是使用本地缓存。
}
```

### 7.导航

我们可以通过插件来控制一个 tab 的前进后退（如果他们都曾有过跳转的记录）

```ts
chrome.tabs.goBack(  // 回到最近的一次历史记录
  tabId?: number,
  callback?: function,
)

chrome.tabs.goForward( // 去到下一个历史记录，如果有的话
  tabId?: number,
  callback?: function,
)
```

### 8.丢弃/复制

当我们的 tab 开的特别多的时候，浏览器会有个小优化，对于某些长时间不用的 tab，浏览器会清空内存中对其的状态存贮，因此当我们再次将其激活时会重新加载！这个过程插件也提供了 API 可以帮助我们做到：

```ts
chrome.tabs.discard(
  tabId?: number,
  callback?: function,
)


chrome.tabs.duplicate(  // 这个API与discard相反，可以帮助我们复制一个一摸一样的tab标签
  tabId: number,
  callback?: function,
)
```

### 9.分组

如果我们希望将某些具备相似特征的网站分成一个组，使其能够在视图上更好的被察觉，那么我们就可以通过插件为我们提供的 API 来进行实现：

第一步：筛选出希望分到同一组的 tabs

```js
const tabs = await chrome.tabs.query({
  url: ["https://developer.chrome.com/*"],
});
```

根据前面的知识，我们很容易就可以知道 tabs 就是域名为 "https://developer.chrome.com" 开头的所有站点的 tab 集合;

第二步：将他们分为一组

```js
const tabIds = tabs.map(({ id }) => id);
const group = await chrome.tabs.group({ tabIds });
```

![Snipaste_2023-07-11_19-06-32.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/a0ffb6f24f51454aa9d41d71e9e88183~tplv-k3u1fbpfcp-watermark.image?)

上图中就可以看到所有符合条件的站点就被分为同一个组了，这个 API 的使用方式是：

```ts
chrome.tabs.group(
  options: GroupOptions,
  callback?: function,
)

type GroupOptions = {
  tabIds?:number[], // 希望被分组的tab的id的集合
  groupId?:number, // 已有的分组
  createProperties?:{
    windowId?:number // 希望分组被创建在那个窗口， 默认是脚本所在窗口
  }
}

```

> 额外的话:
>
> 如果我们希望在分组上再加上一个样式或者字样作为标记的话，也可以这样做：
>
> ```js
> // 第一步： 在manifest.json中添加“tabGrpups”的权限
> {
>   ...
>   "permissions":[ "tabGroups" ]
> }
> //第二步：
> chrome.tabGroups.update(group, { title: "这是分组1" , color:'red' });
> ```
>
> 就可以修改这个分组的一些特征，上面是增加了一个标题，效果如下：
> ![Snipaste_2023-07-11_19-16-27.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/e2a0ef8c064b421a8ec9582e7a967f7a~tplv-k3u1fbpfcp-watermark.image?)

## 三、实战

以上我们介绍了基本的 API，接下来我们通过一些案例来实际感受一下每个 API 的作用：

准备以下的项目：

**manifest.json**

```json
{
  "name": "tabs demo",
  "description": "tabs demo",
  "version": "1.0",
  "manifest_version": 3,
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "/images/get_started16.png",
      "32": "/images/get_started32.png",
      "48": "/images/get_started48.png",
      "128": "/images/get_started128.png"
    }
  },
  "content_scripts": [
    {
      "js": ["content.js"],
      "matches": ["<all_urls>"]
    }
  ],
  "background": {
    "service_worker": "background.js"
  },
  "icons": {
    "16": "/images/get_started16.png",
    "32": "/images/get_started32.png",
    "48": "/images/get_started48.png",
    "128": "/images/get_started128.png"
  },
  "permissions": ["tabs", "tabGroups"]
}
```

**content.js / background.js**

```js
// content.js
let color = "";
console.log("content.js");
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  color = document.body.style.color;
  document.body.style.background = message;
  sendResponse("changed");
});

// background.js
console.log(chrome);
```

**newtab.html**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>chrome插件</title>
  </head>
  <body>
    <h1>我是一个由chrome插件创建的页面</h1>
  </body>
</html>
```

**popup.html**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Document</title>
  </head>
  <body>
    <section>
      <h1>创建新的页面</h1>
      <button id="create-tab">创建</button>
    </section>

    <section>
      <h1>查找符合条件的tab</h1>
      <div>
        <span>是否激活</span>
        <span>是</span>
        <input type="radio" name="isActive" value="1" />
        <span>否</span>
        <input type="radio" name="isActive" value="0" />
      </div>
      <div>
        <span>是否属于当前窗口：</span>
        <span>是</span>
        <input type="radio" name="isCurrentWindow" value="1" />
        <span>否</span>
        <input type="radio" name="isCurrentWindow" value="0" />
      </div>
      <div>
        <span>url(支持正则)：</span>
        <input type="text" id="url" />
      </div>
      <div>
        <span>title</span>
        <input type="text" id="title" />
      </div>
      <div>
        <span>index</span>
        <input type="text" id="index" />
      </div>
      <div>
        <span>是否被固定</span>
        <span>是</span>
        <input type="radio" name="pinned" value="1" />
        <span>否</span>
        <input type="radio" name="pinned" value="0" />
      </div>
      <div>
        <span>status</span>
        <select name="status" id="status">
          <option value="unloaded">unloaded</option>
          <option value="loading">unloaded</option>
          <option value="complete">unloaded</option>
        </select>
      </div>
      <button id="query-tab">查找</button>

      <div>
        <div>查找结果：</div>
        <div id="search-result"></div>
      </div>
    </section>

    <section>
      <h1>发送消息</h1>
      <input type="color" id="send-value" />
      <button id="send-btn">变色吧</button>
    </section>

    <section>
      <h1>删/改/移/丢弃/复制</h1>
      <div>
        <input type="text" id="move-index" />
        <button id="move">移动当前的tab</button>
      </div>

      <div>
        <button id="remove">移除当前的tab</button>
      </div>

      <div>
        <button id="reload">刷新当前的tab</button>
      </div>

      <div>
        <input type="text" id="discard-value" />
        <button id="discard">丢弃</button>
      </div>

      <div>
        <button id="duplicate">复制</button>
      </div>

      <div>
        <input type="text" id="update-value" />
        <button id="update">更新</button>
      </div>
    </section>

    <section>
      <h1>缩放比</h1>
      <div>
        <input type="text" id="zoom" />
        <button id="zoom-btn">调整</button>
      </div>
    </section>

    <section>
      <h1>分组</h1>
      <div>
        <input type="text" id="group-title" />
        <button id="group">使用查询的结果进行分组</button>
      </div>
    </section>

    <section>
      <h1>导航</h1>
      <div>
        <button id="goForward">前进</button>
        <button id="goBack">前进</button>
      </div>
    </section>
    <script src="./popup.js"></script>
  </body>
</html>
```

**popup.js**

```js
document.getElementById("create-tab").addEventListener("click", () => {
  chrome.tabs.create({
    url: "newtab.html", // 相对于background脚本的路径下需要有一个newtab.html文件
  });
});

let Tabs = [];

const getSelect = (list) => {
  const yes = list[0];
  const no = list[1];
  if (yes.checked) {
    return yes.defaultValue === "1";
  }

  if (no.checked) {
    return no.defaultValue === "1";
  }

  return false;
};

document.getElementById("query-tab").addEventListener("click", async () => {
  const active = getSelect(document.getElementsByName("isActive"));
  const currentWindow = getSelect(
    document.getElementsByName("isCurrentWindow")
  );
  const pinned = getSelect(document.getElementsByName("pinned"));

  const url = document.getElementById("url").value;
  const title = document.getElementById("title").value;
  const index = document.getElementById("index").value;

  const queryOptions = {
    active,
    currentWindow,
    pinned,
  };

  if (url) {
    queryOptions.url = url;
  }

  if (title) {
    queryOptions.title = title;
  }

  if (index) {
    queryOptions.index = index - 0;
  }

  console.log(queryOptions);

  const tabs = await chrome.tabs.query(queryOptions);

  document.getElementById("search-result").innerHTML = JSON.stringify(
    tabs.map(({ id }) => ({ id }))
  );

  Tabs = tabs;
});

document.getElementById("send-btn").addEventListener("click", async () => {
  const color = document.getElementById("send-value").value;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  const response = await chrome.tabs.sendMessage(tab.id, color);

  console.log(color, response);
});

const getCurrentTab = async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab.id;
};

document.getElementById("move").addEventListener("click", async () => {
  const index = document.getElementById("move-index").value - 0;
  const tabIds = await getCurrentTab();
  chrome.tabs.move(tabIds, { index });
});

document.getElementById("remove").addEventListener("click", async () => {
  const tabIds = await getCurrentTab();
  chrome.tabs.remove(tabIds);
});

document.getElementById("reload").addEventListener("click", async () => {
  const tabId = await getCurrentTab();
  chrome.tabs.reload(tabId);
});

document.getElementById("discard").addEventListener("click", async () => {
  const tabId = document.getElementById("discard-value").value - 0;
  chrome.tabs.discard(tabId);
});

document.getElementById("duplicate").addEventListener("click", async () => {
  const tabId = await getCurrentTab();
  chrome.tabs.duplicate(tabId);
});

document.getElementById("zoom-btn").addEventListener("click", async () => {
  const tabId = await getCurrentTab();
  const zoomFactor = document.getElementById("zoom").value - 0;
  chrome.tabs.setZoom(tabId, zoomFactor);
});

document.getElementById("group").addEventListener("click", async () => {
  const tabIds = Tabs.map(({ id }) => id);
  const title = document.getElementById("group-title").value;
  const group = await chrome.tabs.group({ tabIds });
  chrome.tabGroups.update(group, { color: "red", title });
});

document.getElementById("goForward").addEventListener("click", async () => {
  const tabId = await getCurrentTab();
  chrome.tabs.goForward(tabId);
});

document.getElementById("goBack").addEventListener("click", async () => {
  const tabId = await getCurrentTab();
  chrome.tabs.goBack(tabId);
});
```

以上的资源我会放到[github](https://github.com/sonxiaopeng/chrome-extensions-learn/tree/master/tabs)上，大家可以 download 下来直接在自己的浏览器上运行，查看效果，也希望有收获后给不吝 star 哈！。

下面是我本地的测试效果：

**创建页面/发送消息**

![屏幕录制2023-07-12 下午11.12.01.gif](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/137e6ba863e14ccdb8a5956d9dd4b45c~tplv-k3u1fbpfcp-watermark.image?)

**查询**

![屏幕录制2023-07-12 下午11.13.45.gif](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/20749068af2f4d9a9639d3799524459b~tplv-k3u1fbpfcp-watermark.image?)

**删/改/更新**

![屏幕录制2023-07-12 下午11.14.27.gif](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/e6405985735d4c79819fc5ae2ae63e89~tplv-k3u1fbpfcp-watermark.image?)

**分组**

![屏幕录制2023-07-12 下午11.20.20.gif](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/08f252cc2f1d44539777bb527baa16af~tplv-k3u1fbpfcp-watermark.image?)

有了以上的武器，就可以玩转 tabs 啦！一起开始开发 chrome 插件吧！
