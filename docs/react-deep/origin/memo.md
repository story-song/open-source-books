---
theme: smartblue
---

## 一、前面的话

我们在使用 react 的过程中，会经常使用一些 API 用于把我们的组件包裹起来，从而达到一些特定的效果，例如：

1. 我们可以通过使用`memo`来包裹一个组件，`memo` 允许我们的组件在 `props` 没有改变的情况下跳过重新渲染，换句话说它可以让组件跳过执行`render`阶段，从而提高性能，我们也可以自定义是否渲染的函数，非常灵活

2. 再比如我们可以通过`forwardRef`来包裹一个组件，从而给这个组件注入一个`ref`的引用，组件就可以使用 [ref](https://zh-hans.react.dev/learn/manipulating-the-dom-with-refs) 将 DOM 节点或者一些自定义信息暴露给父组件

3. 我们也可以使用 `createPortal` 将 JSX 作为 children 渲染至 DOM 的不同部分

之所以把这些内容串在一起是因为它们的原理其实是相似的，而文本尝试从源码的角度剖析一下它是如何实现的，但是大家不用担心，文中所有的内容都会通俗易懂，我会过滤掉不重要的部分，排除干扰只讲核心的实现，废话不多说我们开始吧！

## 二、memo

当我们用`memo`包裹一个组件时，实际上会创建一个特殊`Memo`类型的`ReactElement`节点，我们可以来看一下它的创建过程：

```js
function memo(type, compare) {
    ...
    var elementType = {
      $$typeof: REACT_MEMO_TYPE,
      type: type,
      compare: compare === undefined ? null : compare,
    };
    ...
    return elementType;
 }
```

它会将被包裹的组件的引用保存在`type`这个属性上面，以供后面调和过程使用，并且会有一个自定义控制渲染的函数保存在`compare`这个属性上，`ReactElement`会在`render`过程中转化为`fiber`类型的节点，而`REACT_MEMO_TYPE`的`ReactElement`会转化为`MemoComponent`类型的`fiber`类型，在调和`MemoComponent`类型节点的时候是下面这个样子：

```js
function updateMemoComponent(
  current,
  workInProgress,
  Component,
  nextProps,
  renderLanes
) {
  // 更新时
  var prevProps = currentChild.memoizedProps; // 之前的props
  var compare = Component.compare;
  compare = compare !== null ? compare : shallowEqual; // 如果没有自定义策略就采取默认策略

  if (compare(prevProps, nextProps) && current.ref === workInProgress.ref) {
    // 如果返回true就直接返回已有的fiber节点，而不用重新执行子树的render过程
    return bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes);
  }
  //
  var newChild = createWorkInProgress(currentChild, nextProps);
  workInProgress.child = newChild;
}
```

我只贴上了更新部分的`render`代码，因为初始化的时候它一定会进行`render`，在初始化之前没有任何`fiber`树可以复用的，在更新部分如果没有指定自定义的策略的话就会使用默认的`shallowEqual`策略，它会对 props 的每一个属性进行浅比较，判断如下：

```js
function shallowEqual(objA, objB) {
  if (objectIs(objA, objB)) {
    // objectIs 实际上就可以理解为 === ，判断的是两个值的内存地址是否一样
    return true;
  }

  if (
    typeof objA !== "object" ||
    objA === null ||
    typeof objB !== "object" ||
    objB === null
  ) {
    // 两个值必须是对象
    return false;
  }

  var keysA = Object.keys(objA);
  var keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) {
    return false; // 长度不一致，直接否决掉
  }

  for (var i = 0; i < keysA.length; i++) {
    var currentKey = keysA[i];

    if (
      // 只对比每个属性的引用是否一样即可
      !hasOwnProperty.call(objB, currentKey) ||
      !objectIs(objA[currentKey], objB[currentKey])
    ) {
      return false;
    }
  }

  return true;
}
```

整体的逻辑还是比较简单的，如果前后两次的 props 的任何一个属性发生了引用地址的变化都会导致`shallowEqual`的判定为`false`，从而导致子树进行重新的`render`

> 小结：
> 以上就是`memo`这个 API 的核心逻辑，主要就是创建了一个特殊的`Memo`节点，根据用户的指定来决定子组件是否会重新渲染

## 三、forwardRef

之所以把这几个 API 放在一起分析，主要是因为它们的原理是类似的，都是通过创建一个特殊的`ReactElement`节点，然后在`render`阶段配合着做一些不同的操作即可，`forwardRef`也是如此，不信我们来看一下：

```js
function forwardRef(render) {

   // render 必须是一个函数组件，且不能是memo类型的节点
   ...
    var elementType = {
      $$typeof: REACT_FORWARD_REF_TYPE,
      render: render, // 这个就是那个传入的组件
    };

    ...
    return elementType;
}
```

此时创建的节点，最终是要交给`render`才有意义，我们直接看看`render`的处理流程，`REACT_FORWARD_REF_TYPE`类型的`ReactElement`会被转化为`ForwardRef`类型的`fiber`节点

`forwardRef`的核心作用就是转发`ref`，因此在使用的过程中我们需要给它指定一个`ref`的引用，他会保存在`fiber`节点的`ref`属性身上，因此在它调和子组件的时候会取出这个`ref`交给下一层来使用：

```js
function updateForwardRef(
  current,
  workInProgress,
  Component,
  nextProps,
  renderLanes
) {
  var render = Component.render; // 这就是被用户包裹的那个函数组件
  var ref = workInProgress.ref; // 用户指定给forwardRef的引用对象 { current: null }

  var nextChildren;
  {
    ReactCurrentOwner$1.current = workInProgress;
    nextChildren = renderWithHooks(
      current,
      workInProgress,
      render,
      nextProps,
      ref, // 此时它是有值的
      renderLanes
    );
  }

  reconcileChildren(current, workInProgress, nextChildren, renderLanes); // 调和子树
  return workInProgress.child;
}
```

可以看到这一步我们前面文章中已经分析过了，`ref`就是在`renderWithHook`的时候被当作第二个参数交给这个函数组件去使用的

```js
// renderWithHooks
var children = Component(props, secondArg); // 这个secondArg就是那个ref
```

所以其实任何一个函数式组件都可以接收到第二个参数的，只不过在不使用`forwardRef`的时候，收到的是`null`而已，`forwardRef`的作用其实完全可以使用一个`ref`的`props`去替代，例如下面这个样子：

```js
// 使用
function MyForwardComponent(props){
   const { ref } = props;
   return UI with ref;
}
//
const ForwardComponent = forwardRef(function (props , ref){
   // 消费ref
   return UI with ref;
})

function App(){
   const ref1 = useRef()
   const ref2 = useRef()
   return (
     <>
       <MyForwardComponent ref={ref1}/>
       <ForwardComponent ref={ref2}/>
     </>
   )
}
```

当我们对各种 API 的实现足够了解的时候，会解锁更多效果其实完全一致的用户，他们都是往下注入`ref`

## 四、createPortal

`createPortal`的作用我再次强调一下，其实就是可以往一个用户指定的容器中，而非渲染在父节点所在的容器中，非常有趣，而且这个 API 并未和上面提到的其他 API 一样暴露在`react`这个包下，`createPortal`是暴露在`react-dom`这个包里面的，这里大家用的时候注意下就好，[这里](https://react.dev/reference/react-dom/createPortal)可以看到它的介绍，我们来看一下它是如何实现的

首先第一步是创建一个特殊的`ReactElement`节点

```js
function createPortal(
  children, // jsx
  containerInfo, // 必须是一个真实的DOM节点；
  implementation // key
) {
  var key =
    arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;

  return {
    $$typeof: REACT_PORTAL_TYPE,
    key: key == null ? null : "" + key,
    children: children,
    containerInfo: containerInfo,
    implementation: implementation,
  };
}
```

这个过程很简单，关键是要看在`render`阶段他是如何处理的，`REACT_PORTAL_TYPE`类型的`ReactElement`节点会转换为`HostPortal`类型的`fiber`节点

```js
function createFiberFromPortal(portal, mode, lanes) {
  var pendingProps = portal.children !== null ? portal.children : []; // 传进来的jsx
  var fiber = createFiber(HostPortal, pendingProps, portal.key, mode); // HostPortal 类型
  fiber.lanes = lanes;
  fiber.stateNode = {
    containerInfo: portal.containerInfo,
    pendingChildren: null,
    implementation: portal.implementation,
  };
  return fiber;
}
```

并且会将`containerInfo`、`key`等信息做一个封装保存在`fiber.stateNode`身上，在之前的文章中我们有详细分析过初始化的流程，在初始化过程中每一个**原生 DOM**节点会在`completeWork`的时候向上构建真实的一棵离屏的 DOM 树，它的过程就是每一个原生 DOM 节点在向上归并的时候都将自己的子`fiber节点`的真实 DOM 节点挂载到自己身上，如下所示：

```js
// completeWork 处理HostComponente时
var instance = createInstance(
  // 创建DOM节点
  type, // div..
  newProps,
  rootContainerInstance, // #root
  currentHostContext,
  workInProgress
);
// 把自己的children节点的真实DOM节点通过appendChild()加载自己身上
appendAllChildren(instance, workInProgress, false, false);
```

而当遇到我们使用了`createPortal`创建的节点的时候，情况会变的不一样，假设我们有这样的例子：

```jsx
const FunctionComponent = () => {
  const [count, setCount] = React.useState(1);

  const onClick = () => {
    setCount(count + 1);
  };
  return (
    <div>
      <button onClick={onClick}>{count}</button>
    </div>
  );
};

const Modal = ReactDOM.createPortal(<FunctionComponent />, document.body);

const App = () => <div id="app">{Modal}</div>;

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
```

当`complateWork`来到我们的`#app-div`这个原生节点的时候，也会执行`appendAllChildren`，在往下找自己的子节点的时候，会跳过`Portal`类型的节点，因此这棵离屏的 DOM 树不会包含`FunctionComponent`这个组件，而此时`FunctionComponent`实际上会有一棵单独的真实 DOM 树已经形成只是没有挂载`#app-dev`之下，等到`commit`阶段再挂载到`document.body`上，我们来看一下：

```js
// commitMutationEeffect

case HostPortal: {
    commitReconciliationEffects(finishedWork);
    return;
}
```

在`commit`的`mutation`阶段会找到`HostPortal`类型的节点将它的子真实 DOM 树挂载到`containerInfo`身上，也就是用户自定义的那个真实 DOM 树上，自此便实现了`createPortal`对应的功能。

## 五、最后的话

本篇文章比较简单，主要是分析了`react`中`memo`、`forwardRef`、`createPortal`这三个 API 的原理，纵观整个`react`，确实为我们提供了非常多的有趣的 API，你还对那些 API 感兴趣呢？欢迎在评论区留言，我们一起学习

后面的文章我们会依然会深入剖析 react 的源码，学习 react 的设计思想，如果你也对 react 相关技术感兴趣请订阅我的[《深入理解 react》](https://juejin.cn/column/7348420268175114290 "https://juejin.cn/column/7348420268175114290")专栏，笔者争取至少月更一篇，我们一起进步，有帮助的话希望朋友点个赞支持下，多谢多谢！
