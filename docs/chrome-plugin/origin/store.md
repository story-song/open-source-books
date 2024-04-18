## 一、前言

chrome 插件之所以如此受欢迎，是因为它为开发者提供了完备的 API，本篇文章就来介绍一下 chrome 插件的存储系统，也就是说 chrome 为我们提供了类似我们在 web 环境下使用**localStorage**和**sessionStorage**的 API。

这个 API 位于 chrome 环境下的**chrome.storage**，以下我们将 chrome 插件提供的存储能力统称为 StorageAPI。

## 二、概览

### 1.是什么？

StorageAPI 为我们提供了在 chrome 插件环境下持久化存储数据和状态的能力，就像 web 端的 API [IndexedDB](https://developer.mozilla.org/docs/Web/API/Window/indexeddb), 和  [Storage](https://developer.mozilla.org/docs/Web/API/Storage)一样，但是相比他们，StorageAPI 更加符合 chrome 插件的需要，并且具备以下特性：

- 所有的 chrome 插件环境中都可以访问 StroageAPI，因此可以很方便的管理全局的状态。
- 使用 webStorage 时，我们需要将想要存储的对象序列化，否则无法实现我们希望的存储，但是 StorageAPI 可以直接存储一个对象，便于开发者维护和管理。
- StorageAPI 是异步的，采用批量读写的操作。
- 即使用户清除浏览器缓存或历史，StorageAPI 依然为我们持久化存储数据状态。

### 2.为什么需要？

> **qs**:为什么不直接使用 webStorage?
>
> 众所周知，我们在 chrome 插件中也可以使用 webStorage，例如在 content.js 、pupop.html、**chrome.tabs.create({url:"path"})** 创建的新 tab 等中都可以使用 webStorage。那为什么还需要 StorageAPI 呢？主要是由于以下原因：
>
> - background.js 脚本无法访问 webStorage，因为它只是一个脚本运行环境，不承载任何 UI 界面。
> - content.js 和宿主站点是共享 webStorage 的，宿主环境的脚本也有可能修改 webStorage 的状态。
> - 当我们清除浏览器缓存后，webStorage 就一并消失了。

基于以上的原因，chrome 插件希望为自己提供一套统一的、干净的、更强大的全局存储状态的工具，才有了 StorageAPId 的出现。

### 3.有哪些类型？

StorageAPI 有四个不同的区域来实现不同特性的存储功能：

**storage.local**

这个区域属于本地存储，只有当插件被移除卸载后数据才会被清除，所以你关闭浏览器或者清除浏览器缓存都无法将所存储的状态清除。

它的存储大小限制在 10MB 以内，当然如果在**manifest.json**的**permission**配置中添加`"unlimitedStorage"`配置的话，它的存储限制会进一步被提高。

> 温馨提示：  
> 在 chrome114 之前的版本，它的默认限制是 5MB。

**storage.sync**

![Snipaste_2023-08-17_16-38-03.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/6fe8ebd05798450f9717ecec99976abb~tplv-k3u1fbpfcp-watermark.image?)

在 chrome 设置中，我们可以选择开启同步模式，它的好处就是对于同一个用户而言，所有登录谷歌账号的终端设备都可以共享部分数据。换句话说，如果我拥有一个谷歌账号，我在不同主机上的浏览器可以共享一些数据。

而 sync 就支持这样的功能，通过**storage.sync**可以获取同一用户的不同终端的全量的数据和状态。当然如果没有开启**同步模式**的时候，它的表现就和**storage.local**是一样的。

当浏览器离线时，Chrome 将数据存储在本地，并在重新上线时恢复同步，它的存储限制大约为 100 KB。我们可以考虑使用它来保存跨同步浏览器的用户设置。

> storage.local 和 storage.sync 不应该存储机密用户数据，因为它们没有加密。在处理敏感数据时，考虑使用会话存储区域在内存中保存值，直到浏览器关闭。

**storage.session**

如果说 storage.local 和 storage.sync 是存储在磁盘上的话，storage.session 在浏览器会话期间将数据保存在内存中。默认情况下，它不会暴露给内容脚本，但是可以通过设置 chrome.storage.session.setAccessLevel()来改变这种行为，存储限制大约是 10BM。考虑使用它来存储跨 service worker 运行的全局变量。

**storage.manage**

该存储区域是只读的，一般不会用到它，需要声明一个 schema.json 才可以使用该 API。

### 4.条件

要真正的在 chorme 插件环境中使用，需要我们在 manifest.json 中显示的声明 permission:

```js
{
  "name": "My extension",
  ...
  "permissions": [
    "storage"
  ],
  ...
}
```

## 三、使用

他们的使用方法如下：

```js
// local
chrome.storage.local.set({ key: value }).then(() => {
  console.log("Value is set");
});

chrome.storage.local.get(["key"]).then((result) => {
  console.log("Value currently is " + result.key);
});

//sync
chrome.storage.sync.set({ key: value }).then(() => {
  console.log("Value is set");
});

chrome.storage.sync.get(["key"]).then((result) => {
  console.log("Value currently is " + result.key);
});

//session
chrome.storage.session.set({ key: value }).then(() => {
  console.log("Value was set");
});

chrome.storage.session.get(["key"]).then((result) => {
  console.log("Value currently is " + result.key);
});
```

### 案例

接下来准备一个案例来具体的说明 local 和 session 的使用

**第一步：创建一个 chrome 插件项目**

结尾有 git 仓库代码，可以直接 down 下来测试

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Document</title>
  </head>
  <body>
    <h1>popup</h1>
    <select name="type" id="storage-type">
      <option value="local">local</option>
      <option value="session">session</option>
    </select>
    <input type="text" id="storage-value" />
    <button id="storage-btn">存储</button>
    <br />
    <button id="storage-show">数据</button>
    <div id="storage-view"></div>
    <script src="./popup.js"></script>
  </body>
</html>
```

```js
// popup.js
document.getElementById("storage-btn").addEventListener("click", () => {
  const value = document.getElementById("storage-value").value;
  const type = document.getElementById("storage-type").value;

  if (type === "session") {
    chrome.storage.session.set({ session: value }).then(() => {
      console.log("设置local值成功");
    });
  } else {
    chrome.storage.local.set({ local: value }).then(() => {
      console.log("设置session值成功");
    });
  }
});

document.getElementById("storage-show").addEventListener("click", () => {
  chrome.storage.local.get(["local"]).then(({ local }) => {
    chrome.storage.session.get(["session"]).then(({ session }) => {
      document.getElementById("storage-view").innerHTML = `
        <span>local value</span>: ${local} \n
        <span>session value</span>: ${session}
      `;
    });
  });
});
```

以下是演示视频：

![屏幕录制2023-08-17 下午6.44.17.gif](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/aab5ad3d45ee4d60987888db3b788320~tplv-k3u1fbpfcp-watermark.image?)

接下来我将浏览器关闭，然后我们看看数据状况如何：

![屏幕录制2023-08-17 下午6.46.58.gif](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/eacc96f03de64b6aa1c93af8d45c0ef0~tplv-k3u1fbpfcp-watermark.image?)

可以看到 session 的状态已经丢失了，但是 local 的状态依然存在。

### onChanged

有的时候我们希望监听全局状态的变化，我们可以使用 StorageAPI 提供的 onChanged 方法。

在上面的案例中我们增加一个 background.js，在后台监听。

```js
chrome.storage.onChanged.addListener((changes, namespace) => {
  for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
    console.log(
      ` "${namespace}" 区域 有一个属性"${key}" 发生了变化`,
      `旧值为 "${oldValue}",新值为"${newValue}".`
    );
  }
});
```

![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/e376830aa64d40ad82f27baec7f07f6d~tplv-k3u1fbpfcp-watermark.image?)

我们可以看到不同区域的任何一个状态发生变化都可以察觉到，然后在这个函数中我们可以写不同的处理逻辑就好了。

好啦，以上就是本篇 chrome 插件存储系统的所有知识了，大家可以自己也尝试一下！

## 四、资源

以上的案例位于 [chrome-extensions-learn.git 仓库](https://github.com/sonxiaopeng/chrome-extensions-learn/tree/master/storage)
