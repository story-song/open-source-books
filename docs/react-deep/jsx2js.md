---
theme: smartblue
---


## 一、前面的话

从2013年react第一次发布以来已经过去10年多了，10年前[JordWalke](https://twitter.com/jordwalke?lang=en) 出于一个疯狂的想法（只要任何一个状态发生改变，就重新渲染整个页面）创造了react，从此命运的齿轮开始转动，或许当时的他怎么也不会想到react不仅成为了 facebook 最成功的开源作品之一，而且它正在驱动着这个世界上成千上万的web站点，并且迄今为止已经成为全世界范围内**数据驱动视图领域**最流行的前端框架。 

![image.png]("./assets/jsx2js_01.jpg")
上图是JordWalke在JSConf第一次发布react时的场景



![image.png]("./assets/jsx2js_02.jpg")
上图是[npmtrends](https://npmtrends.com/angular-vs-preact-vs-react-vs-svelte-vs-vue)上的主流框架的npm下载量的数据

然而熟悉react语法的同学肯定知道，react使用的并非真实的DOM来描述UI，而是使用了一种叫做 `JSX` 的语法来描述UI，他可以完全和逻辑结合起来，非常方便我们构建交互复杂、UI变化频繁的场景。

本文就尝试通过讲故事的方式跟各位读者分享JSX是怎么一步步变成JS的，耐心读完本篇文章你会知道以下问题的答案：

1. 为什么会出现JSX?
2. react语法源码到抽象语法树的过程？
3. babel的作用？
4. 其他的一些知识...


> 本文相对来说内容并不复杂，如果对以上问题已经比较熟悉的伙伴，可以移读专栏的其他文章。


## 二、JSX到JS

故事要从web1.0时代讲起，那个时候web的主要作用就是呈现内容，几乎不会有什么复杂的交互，人们仅仅只是在web站点上浏览信息。因此浏览器的设定是把UI和逻辑分开，HTML用来描述UI，javascript负责一些简单的逻辑、事件等。这样的设计满足了当时业务场景，并且也让web站点也可以很好的维护，各司其职，其乐融融。


但是，web2.0时代web端承载了越来越多复杂的场景，例如各种各样的门户网站、电子商务、即时通讯、网页游戏等。人们可以在web端做很多的事情，人机交互变得越来越复杂、多样，开发者们越来越意识到UI的变化和逻辑应该是耦合在一起的，对于下一代的开发框架的期待是一种声明式、组件式的框架。

于是react团队开始尝试这方面的探索，并发明了一种叫做**JSX**的东西，它使用了和HTML语言几乎同样的语法，前端开发者可以无缝学习并使用它，而且可以在逻辑中像创建一个对象一样创建UI，改变UI，这非常符合开发者在编写复杂应用场景时的自然智慧。

```jsx
const App = <div>i am jsx</div>
```


> 小结  
> 综上所述，JSX的出现是为了满足现代Web开发对高效、直观、可维护的UI描述的需求，特别是在React等组件化框架的上下文中。它通过将HTML-like语法与JavaScript紧密结合，简化了界面逻辑的编写与管理，促进了组件的复用与模块化，并通过编译过程确保了跨浏览器兼容性与性能优化。这些优势使得JSX成为了构建复杂单页应用（SPA）、富互联网应用（RIA）以及其他类型的前端项目的有力工具


### babel

但是浏览器的**JS引擎**（下面我们以v8举例）并不能识别这种语法


![image.png]("./assets/jsx2js_03.jpg")

v8只认符合ECMAScript标准的语法，因此[babel](https://www.babeljs.cn/)就起作用了。

在它的官网上是这样描述babel的作用的

Babel 是一个工具链，主要用于将采用 ECMAScript 2015+ 语法编写的代码转换为向后兼容的 JavaScript 语法，以便能够运行在当前和旧版本的浏览器或其他环境中。下面列出的是 Babel 能为你做的事情：

-   语法转换
-   通过 Polyfill 方式在目标环境中添加缺失的功能（通过引入第三方 polyfill 模块，例如 [core-js](https://github.com/zloirock/core-js)）
-   源码转换（codemods）

我们可以看到babel最重要的作用就是语法转换，聪明的react工程师正是利用了这一点，让用户先在IDE里编写 JSX 以达到开发的极致爽感，然后再通过babel将其转换为v8可以识别的语法就好了，其实这个过程就是编译过程。

> 小插话：曾几何时，远古时期的程序员们觉得汇编语言难以编写，甚至是恶心，因此发明了c、c++等高级语言，进而出现了gcc编译器，babel做的事情和gcc如出一辙


### 原理

那么babel是如何转换语法的呢？

分为以下几个步骤

1.  **解析** :

    **词法分析** : 首先，Babel使用一个词法分析器（Lexer）将源代码字符串分割成一系列有意义的符号，称为“词法单元”（Tokens）。这些tokens包括标识符、关键字、操作符、字符串、数字、注释等。例如，`const x = 5;`会被解析为`const`、`x`、`=`、`5`和`;`等tokens。  
    **语法分析** : 接着，Babel的解析器（Parser）将这些tokens按照语法规则组织成抽象语法树（AST）。AST是一种树状的数据结构，它以编程语言的结构化方式精确地表示源代码的逻辑结构。AST中的每个节点代表源代码中的一个语法元素，如变量声明、函数调用、条件语句等。

2.  **转换** :

    **插件应用** : Babel的核心并不直接包含具体的转换规则，而是通过插件系统来实现对不同特性的支持。当Babel遇到需要转换的语法特性时（如JSX、箭头函数、装饰器等），对应的插件会被激活。这些插件通常会定义一组访问者（Visitor）函数，它们会遍历AST，根据节点类型执行相应的转换操作。对于JSX，`@babel/plugin-transform-react-jsx`插件会负责将JSX元素转换为`React.createElement()`调用，将属性和嵌入表达式适当地转化为函数参数。  

    **转换逻辑**：在转换过程中，插件可能进行多种操作，比如将新的或实验性的语法结构替换为等价的传统或更广泛支持的语法形式。例如，箭头函数可能被转换为常规函数声明

3.  **生成** :

    **AST遍历与代码生成**：最后一个阶段，Babel使用一个生成器（Code Generator）对经过转换的AST进行遍历，将每个节点重新还原为符合目标语法的JavaScript代码字符串。生成器会遵循语法规则，确保生成的代码既保留了原代码的语义，又能被目标环境正确解析和执行。
   
    **输出**：经过上述步骤，Babel最终输出转换后的JavaScript代码，这段代码不再包含原源码中的新特性和实验性语法，而是可以被广泛支持的JavaScript引擎理解和执行。

过程如图所示：


![image.png]("./assets/jsx2js_04.jpg")


那么babel是天然就可以编译jsx吗？答案是否定的

要想让babel可以成功解析jsx，自然需要提供相应的插件，只有指定了相应的识别规则和转换规则，babel在语法分析的时候才能认为这是一个合法的语法。这个提供jsx识别规则的插件主要是 `@babel/plugin-transform-react-jsx`。

> 因此JSX的本质就是一个语法糖，如果你愿意你也可以定一下一些特殊的语法，让他具备你想要的功能，但是不要忘了给babel提供相应的插件。

## 三、实战

接下来演示一下在node环境和在web环境下，我们如何通过babel解析jsx

### nodejs

准备一个工程

```sh
// 只需要下面两个依赖就好
npm i @babel/core @babel/plugin-transform-react-jsx -S
```

```js
// code.js

function App(){ 
  return (
    <div onClick={ ()=> null}>
      <h1>Hello World</h1>
      <p>This is a paragraph</p>
    </div>
  )
}

// index.js

const fs = require("fs");
const babel = require("@babel/core")
const parser = require("@babel/parser")

fs.readFile("./code.js", (e, data) => { 
  const code = data.toString();
  // 这一步就包括 解析 -> 转换 -> 生成的 
  // 在内存中就完成了
  const result = babel.transform(code, {
    plugins:["@babel/plugin-transform-react-jsx"]
  });
  fs.writeFile("./jsx.js" , result.code , function(){})
})
```

跑一下这个程序，然后看看结果

```js
function App() {
  return /*#__PURE__*/React.createElement("div", {
    onClick: () => null
  }, /*#__PURE__*/React.createElement("h1", null, "Hello World"), /*#__PURE__*/React.createElement("p", null, "This is a paragraph"));
}
```

会发现已经全部转为浏览器可以识别的语法，只要执行环境中提供了`React.createElement` 这个方法就可以了


### web环境

在web环境中就很简单了，一个html搞定

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>babel in html</title>
    <script src="https://unpkg.com/babel-standalone@6/babel.min.js"></script>
  </head>
  <body>
    <div id="root"></div>
    <script type="text/babel">
    
      const React = {
        createElement: (type , props , ...children)=>{
          return {
            type,
            props,
            children
          }
        }
      }
    
      function App(){ 
        return (
          <div onClick={ ()=> null}>
            <h1>Hello World</h1>
            <p>This is a paragraph</p>
          </div>
        )
      }
      
      console.log(App())

    </script>
  </body>
</html>

```

看下结果

![image.png]("./assets/jsx2js_05.jpg")


> 小结  
> 通过上面的内容，我们已经能够把jsx语法转换为js了，接下来我们来看下react是如何实现React.createElement这个方法的


## 四、ReactElement

其实react只需要定义一个函数来实现ReactElement就可以了，可以拿到三种参数`type`、`props`、`children`，看一下react的实现

```js
function createElement(type, config, children) {
    var propName; 

    var props = {}; // ReactElement的属性
    var key = null; // ReactElement的唯一key
    var ref = null; // ReactElement的引用
    var self = null; // 特殊属性
    var source = null; // 特殊属性

    if (config != null) {
      if (hasValidRef(config)) {
        ref = config.ref;
        ...
      }

      if (hasValidKey(config)) {
        {
          checkKeyStringCoercion(config.key);
        }

        key = "" + config.key;
      }

      self = config.__self === undefined ? null : config.__self;
      source = config.__source === undefined ? null : config.__source; //
      for (propName in config) {
        if (
          hasOwnProperty.call(config, propName) &&
          !RESERVED_PROPS.hasOwnProperty(propName)
        ) {
          // 非特殊属性的保存在props中
          props[propName] = config[propName];
        }
      }
    } 
    
    // 如果只有一个children就不用数组来保存
    var childrenLength = arguments.length - 2;

    if (childrenLength === 1) {
      props.children = children;
    } else if (childrenLength > 1) {
      var childArray = Array(childrenLength);

      for (var i = 0; i < childrenLength; i++) {
        childArray[i] = arguments[i + 2];
      }

      {
        if (Object.freeze) {
          Object.freeze(childArray);
        }
      }

      props.children = childArray;
    }
    ...

    return ReactElement(
      type,
      key,
      ref,
      self,
      source,
      ReactCurrentOwner.current,
      props
    );
  }
  
  
// ReactElement 的实现
  var ReactElement = function (type, key, ref, self, source, owner, props) {
    var element = {
      $$typeof: REACT_ELEMENT_TYPE,
      type: type,
      key: key,
      ref: ref,
      props: props,
      _owner: owner,
    };
   ...
   if (Object.freeze) {
     Object.freeze(element.props); // 冻结props
     Object.freeze(element); // 冻结element
   }
   return element;
  };
```

我把非核心代码过滤后，其实整体逻辑还是比较简单的，核心就是把babel解析后的 config 中的特殊属性提取出来比如：`key` 、`ref`、`__store`、`__self`等等。

最后从JSX 到 JS 我们得到的就是一个描述UI的javascript对象了


![image.png]("./assets/jsx2js_06.jpg")


## 五、最后的话

本篇文章我们知道了jsx的起因、然后了解了jsx到js的过程，最后我想说，jsx真的是一个伟大的发明，重新定义了前端开发范式，让UI和逻辑可以写在一起，虽然是借助了编译的手段，但是这无疑极大的改善了用户开发体验，许多其他框架也借鉴了jsx的思想进行改善。


今天的内容万里长征的第一步，后面的文章我们会深入剖析react的源码，学习react的设计思想，如果你也对react相关技术感兴趣请关注我的[《深入理解react》](https://juejin.cn/column/7348420268175114290)专栏，我们一起进步。

















