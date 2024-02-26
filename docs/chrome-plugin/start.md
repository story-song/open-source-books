## 一、前言

`chrome extension`（chorme 浏览器插件）的应用一直都很广泛，它原本的作用就是扩展浏览器的功能而被设计出来的。插件市场也特别繁荣，例如常见的`油猴`、`划词翻译`等等插件都非常好用。

接下来话不多说，我们就来看一下，如何一步一步从 0 到 1 开发一款浏览器插件。

## 二、基础概念

### 1.安装

在浏览器地址栏上输入`chrome://extensions/`按下回车，就可以看到自己浏览器有多少插件被安装了。

然后再点击`加载已解压的扩展程序`，选择要安装的插件就可以体验插件的使用了。

![截屏2023-02-26 下午1.36.40.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/fa58da6fb7854985b7f3aeba182adb93~tplv-k3u1fbpfcp-watermark.image?)

### 2.使用

一般好的插件都会在加载的那一刻弹出如何使用的页面，但是如果没有弹出，我们就要在`action`区域去看看如何使用。

![截屏2023-02-26 下午1.41.50.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/c9079322b04a40d5a3a6f020ac46c9e0~tplv-k3u1fbpfcp-watermark.image?)

点击扩展可以看到所有的扩展，可以通过铆钉将其定位在右上角的插件栏上，再点击图标就可以使用插件了。

### 3.popup

点击插件的图标，一般会弹出来一个内容，我们以`划词翻译`为例。

![截屏2023-02-26 下午1.52.15.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/80b4df7330e241ac9c88b4a882e8245b~tplv-k3u1fbpfcp-watermark.image?)

会弹出来这样一个类似工作台的东西，这个内容是一个独立的 DOM 环境。什么叫做独立的 DOM 呢？就是这个弹出来的内容是由一个单独的 html 组成的，他有自己的 css、js、html，与其他环境隔离。在我们把它叫做 popup 区域，`这个区域的代码在popup每次打开的时候都会重新执行`。

### 4.background

在插件刚安装的时候，也会执行一个脚本叫做 background 脚本，这个脚本也是一个独立的环境，今后没有特殊情况下不会重新执行，是整个插件当中执行频率最低的一个脚本。在 chromeV2 以及之前的版本中 background 有自己的视图页面，但是在 v3 版本中，废弃了这一设计，只有一个脚本来代替，跑在插件的后台。

### 5.content

插件之所以起作用，就是因为能够改变当前页面的行为。因此需要有一个脚本（包括 css）来运行在当前页面上，且自插件安装之后，每新开的 tab 页，就会从插件中加载这段脚本运行，我们举个划词翻译的例子：

![屏幕录制2023-02-26 下午2.08.43.gif](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/e1bff77651034013ab54cdd451707be0~tplv-k3u1fbpfcp-watermark.image?)

我在当前站点划一个词，就会弹出一个小图标，我点击小图标就会为我提供翻译的服务。

从这个过程，我们知道，就在当前的 github 页面中，一定有一段监听划词的代码在运行着。而承载这段代码的载体就是 content。并且不管我移到 github 之外的任何站点，这段脚本都会存在且执行。

### 6.chrome

以上的三个环境既然都是相互独立的，那么如何进行通信呢？因此在真实的业务场景中，他们其实是需要经常通信的。那就需要一个共同信任的人，这个人就是 chrome 对象。这个对象是浏览器在运行插件的过程中，向三个环境注入的一个对象，它身上有很多方法可以实现互相之间的通信。

如果要了解如何进行通信的细节，可以看我的[这一篇文章](https://juejin.cn/post/7188738032248291385)

### 7.manifest.json

这是 chorme 开发的过程中非常重要的一个配置，比如配什么样子的图标、应该向环境中注入哪些变量、各个脚本的路径指向。

我们可以看一下这个文件的样子感受一下：

```json
{
  "name": "Getting Started Example", // 插件名称
  "description": "Build an Extension!", // 插件描述
  "version": "1.0", // 版本
  "manifest_version": 3, // 指定插件版本，这个很重要，指定什么版本就用什么样的api，不能用错了
  "background": {
    "service_worker": "background.js" // 指定background脚本的路径
  },
  "action": {
    "default_popup": "popup.html", // 指定popup的路径
    "default_icon": {
      // 指定popup的图标，不同尺寸
      "16": "/images/get_started16.png",
      "32": "/images/get_started32.png",
      "48": "/images/get_started48.png",
      "128": "/images/get_started128.png"
    }
  },
  "icons": {
    // 指定插件的图标，不同尺寸
    "16": "/images/get_started16.png",
    "32": "/images/get_started32.png",
    "48": "/images/get_started48.png",
    "128": "/images/get_started128.png"
  },
  "permissions": [], // 指定应该在脚本中注入那些变量方法，后文再详细说
  "content_scripts": [
    // 指定content脚本配置
    {
      "js": ["content.js"], // content脚本路径
      "css": ["content.css"], // content的css
      "matches": ["<all_urls>"] // 对匹配到的tab起作用。all_urls就是全部都起作用
    }
  ]
}
```

### 6.总结

介绍完了基本的概念，那么我们开发插件的任务本质就是设计 background、popup、content 的代码！已完成业务的需求，了解完基本概念我们就来试试水吧！

## 三、小试牛刀

### 1. hello extensions

我们定一个需求，写一个浏览器插件，要求点击 action，弹出来一个 popup 上面写上`hello world`
。

```js
// 新建manifest.json
{
  "name": "Hello Extensions",
  "description": "Base Level Extension",
  "version": "1.0",
  "manifest_version": 3,
  "action": {
    "default_popup": "hello.html",
    "default_icon": "hello_extensions.png"
  }
}



// 新建popup.js
console.log("This is a popup!");

```

新建 hello.html

```html
<html>
  <body>
    <h1>Hello Extensions</h1>
    <script src="popup.js"></script>
  </body>
</html>
```

找一张图片放在同级目录命名为：hello_extensions.png

按照之前讲到了安装该插件。然后一起来看一看效果！

![屏幕录制2023-02-26 下午2.56.36.gif](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/c09f7f1aa38e401e9612e7d20f47da7c~tplv-k3u1fbpfcp-watermark.image?)

### 2. Getting Started Example

为了方便练习，再一个需求，该插件可以使得切到任何一个页面的背景颜色发生变化。

话不多说，直接准备一个 manifest.json

```json
{
  "name": "Getting Started Example",
  "description": "Build an Extension!",
  "version": "1.0",
  "manifest_version": 3,
  "background": {
    "service_worker": "background.js"
  },
  "permissions": ["storage", "activeTab", "scripting"],
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
  }
}
```

其中其他的比较好理解，但是这个`permissions`是什么东西呀？这个可以翻译作权限，换句话说，这个数组配置的内容代表分配给环境什么样的权限，因为我们要在插件中存储一个颜色信息所以用`storage`，因为要搜索当前激活的 tab 所以增加`activeTab`权限，因为要在 content 中采用注入的方式执行脚本所以用`scripting`，每一种权限都决定是否在环境中注入一些方法和变量，所以这个至关重要！

新建一个 popup.html

改变颜色的触发时机，我们可以选择放在 popup 中，点击一个按钮，然后当前激活的 tab 背景颜色改变。因为要存一个颜色，因此我们用 storage 维护起来，这个相当于浏览器的 localStorage 一样，持久存储一个状态用的。

```js
// background
const color = "#3aa757";

// 在安装完成之后，执行这样一个代码。相当于插件内部就存储了一个颜色。
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ color });
});
```

创建一个 popup.html

```html
<!DOCTYPE html>
<html>
  <head>
    <link rel="stylesheet" href="button.css" />
  </head>
  <body>
    <button id="changeColor"></button>
    <script src="popup.js"></script>
  </body>
</html>
```

紧接着创建一个 popup.js

```js
const changeColor = document.getElementById("changeColor");

chrome.storage.sync.get("color", ({ color }) => {
  changeColor.style.backgroundColor = color; // 从内部获取颜色，填充到按钮上，体验更好
});

changeColor.addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  // 监听点击事件，如果点击就执行下面的代码，并获取当前激活的tab的id。
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: setPageBackgroundColor,
  });
  // 在当前激活的tab页面中执行setPageBackgroundColor这样一个函数
});

function setPageBackgroundColor() {
  chrome.storage.sync.get("color", ({ color }) => {
    // 值得注意的是该document其实是tab页面的document对象，因为这个函数是在tab页面中执行的。
    document.body.style.backgroundColor = color;
  });
}
```

接下来把图片什么的补充好，就可以开始看看效果了！

![屏幕录制2023-02-26 下午3.30.01.gif](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/c66e06304f8a40cc9b7be1cce607de81~tplv-k3u1fbpfcp-watermark.image?)

## 四、总结

以上就是一个简单插件的开发流程，当然这两个例子很简单，但是其实对于入门和了解一个插件开发已完全足够，至少可以让我们了解到，插件开发并没有想象中的那么神秘。本质上就是把 html,css,js 换个方式再玩一遍而已。后期我会更新插件开发中的更多进阶内容，如果有收获希望帮忙点赞，关注一下！万分感激。

## 五、资源

上面的案例如果不想自己找图片等琐事，也可直接用官网的案例，效果一致：

### 源码

[官方案例代码资源](https://github.com/GoogleChrome/chrome-extensions-samples)
