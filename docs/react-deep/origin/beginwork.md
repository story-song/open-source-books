---
theme: smartblue
---


## 一、前面的话

在前面的文章中我们知道的`reder`阶段中最重要的两大过程就是`beginWork`和`completeWork`，本篇文章就来探索一下`beginWork`在初始化和更新阶段不同的表现，我会首先把他们的共性找出来，然后通过源码的方式慢慢分析，从而最终将这个流程吃透

无论是初始化流程还是更新流程，其实他们的本质都是需要基于3个最基本的元素

1. **current**：当前的fiber节点
2. **workInProgress**：正在构建的fiber节点
3. **renderLanes**：本次更新的**任务优先级**

`beginWork`面向的对象是具体的`fiber`节点，每次只处理当前的这一个`fiber`节点，处理完之后，不断的向下找自己的`child`节点，直到为`null`的时候，结束本轮的`beginWork`流程，通过本节的学习，你会对以下问题有更深的理解：

1. `beginWork`在`mount`和`update`场景中的异同点？
2. react是如何复用fiber节点的？
3. 为什么要有`IndeterminateComponent`这种中间状态
4. 多个优先级时状态的计算机制是什么？
5. 更多其他内容...



## 二、初始化场景

其实`beginWork`的流程并不难，麻烦的是它里面内容太多了，而且分支很多，因此我们只需要掌握`beginWork`经典的场景就好了，纵观整个`beginWork`它的源码是下面这样的：

```js
function beginWork(current, workInProgress, renderLanes) {
  if (current !== null) { // 说明是更新阶段
    //mount阶段可以先不管这里，因为不会进到这里来  
  } 
  // 调和了就需要把lanes置空
  workInProgress.lanes = NoLanes;
  //根据tag来判断
  switch (workInProgress.tag) {
     case IndeterminateComponent: { // 函数式组件的中间状态
        return mountIndeterminateComponent(
          current,
          workInProgress,
          workInProgress.type,
          renderLanes
        );
      }

     case LazyComponent: { // 异步组件
        var elementType = workInProgress.elementType;
        return mountLazyComponent(
          current,
          workInProgress,
          elementType,
          renderLanes
        );
      }

    
      case HostRoot:
        return updateHostRoot(current, workInProgress, renderLanes);

      case HostComponent:
        return updateHostComponent(current, workInProgress, renderLanes);

      case HostText:
        return updateHostText(current, workInProgress);

      case SuspenseComponent:
        return updateSuspenseComponent(current, workInProgress, renderLanes);

      case Fragment:
        return updateFragment(current, workInProgress, renderLanes);

      case Mode:
        return updateMode(current, workInProgress, renderLanes);

      case Profiler:
        return updateProfiler(current, workInProgress, renderLanes);

      case ContextProvider:
        return updateContextProvider(current, workInProgress, renderLanes);

      case ContextConsumer:
        return updateContextConsumer(current, workInProgress, renderLanes);

      ...
    }

    ...
  }
```
逻辑看起来一大堆，但实际上基本盘是下面这样的

```js

function beginWork(current , workInProgress , renderLanes){
  
  if(是更新阶段){
     
     if(能复用fiber){
       return 基于原fiber的新fiber
     }
     
     不能服用，打标记
  }
  
  // mount阶段直接走这里，因为全部都需要重新构建fiber
  
  const tag = workInProgress.tag
  
  根据tag是什么样的fiber节点做不同的分支
  
  if(fiber节点是RootFiber类型){
    return xxx
  }
  
  if(fiber节点是函数式组件){
    return xxx
  }
  
  if(fiber节点是原生dom节点){
    return xxx
  }
  
  ...
}
```

在mount阶段我们主要认识这么几种Fiber节点的初始化就可以了

1. **HostRoot** 因为初始化和更新都必会经历这个节点
2. **mountIndeterminateComponent** 初始化一个自定义组件时，必会经历这个
3. **HostComponent** 真正的DOM节点其实是由这个来的，这是构建UI的基石

其他的节点我们在原理篇再进行详细了解


### HostRoot

每一次的`render`流程都是从`RootFiber`节点开始的，而它对应的就是`HostRoot`，因为`RootFiber`的`tag`属性对应的是`3`


![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/92b0becc98b7417d8fc64d2beb2f65c8~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=424&h=227&s=39841&e=png&b=fcf6f5)

根据我们之前掌握的知识点，它就属于`HostRoot`类型的Fiber，如下所示：

```js
export const FunctionComponent = 0;
export const ClassComponent = 1;
export const IndeterminateComponent = 2; 
export const HostRoot = 3;
export const HostPortal = 4; 
export const HostComponent = 5;
export const HostText = 6;
export const Fragment = 7;
...
```

因此在`mount`阶段，会直接进入`updateHostRoot(current, workInProgress, renderLanes)`，而且这个节点是唯一在`mount`阶段拥有`current`的节点，因此此时此刻内存中的结构是`current`和`workInProgress`各有一个节点，接下来看看`HostRoot`发生了什么

```js
function updateHostRoot(current, workInProgress, renderLanes) {
    var nextProps = workInProgress.pendingProps;
    var prevState = workInProgress.memoizedState;
    var prevChildren = prevState.element;
    // 将updateQueue分开
    cloneUpdateQueue(current, workInProgress);
    // 计算状态 其实就是把 updateQueue中的 element 放到 memoizedState中
    processUpdateQueue(workInProgress, nextProps, null, renderLanes);
    // 其中memoizedState中就有了 <App/> 这个reactElement节点
    var nextState = workInProgress.memoizedState;
    var nextChildren = nextState.element; // <App/>
    ...
    // 根据当前的 <App/> 创建第一个组件节点
    reconcileChildren(current, workInProgress, nextChildren, renderLanes);

    return workInProgress.child;
  }
```

`updateHostRoot`的主要工作其实就是生产出`workInProgress`的子Fiber节点，当然中间需要做一些工作，例如

1. 在初始化流程创建的第一个更新任务，保存在RootFiber节点的`updateQueue`中，现在要把它提取出来，放在`memoizedState`中，然后取出这个**App**这个**ReactElememt**类型的节点，交给下一步生成自己的子节点
  
   ![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/87489e8239034edeb13e13d8557cd2b4~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=304&h=203&s=22154&e=png&b=fdfdfd)
   
2. 接下来是`reconcileChildren`去生成自己的子节点

```js
function reconcileChildren(
    current,
    workInProgress,
    nextChildren,
    renderLanes
  ) {
    if (current === null) {
      // 初始化
      workInProgress.child = mountChildFibers(
        workInProgress,
        null,
        nextChildren,
        renderLanes
      );
    } else {
      // 更新
      workInProgress.child = reconcileChildFibers(
        workInProgress,
        current.child,
        nextChildren,
        renderLanes
      );
    }
  }
```

对于HostRoot节点来说，他是唯一在初始化节点有`current`的节点，因为会走下面，其他节点在初始化时都会走第一个分支，在 `reconcileChildFibers`中有两种情况，**单节点**和**多节点**，如果`nextChildren`是一个对象的话，就会生成一个fiber，如果是个数组的话，就会生成一个Fiber链表，并按照**fiber树**的规则链接起来，返回的是第一个节点，一般我们在根节点只会传入一个节点，因此我们走的是生成一个fiber节点的逻辑`reconcileSingleElement`

```js
function reconcileSingleElement( // 初始化时
      returnFiber,
      currentFirstChild, // 初始化时为null，因为current只有一个RootFiber节点，子节点没有
      element,
      lanes
) {
      var key = element.key;
      var _created4 = createFiberFromElement( // 创建一个fiber节点 
       element,
       returnFiber.mode,
       lanes
      );

     _created4.ref = coerceRef(returnFiber, currentFirstChild, element);
     _created4.return = returnFiber;
     return _created4; 
    }
```

在创建fiber节点的时候，如果遇到的这个根组件是一个函数式组件，就会将`tag`标记为`IndeterminateComponent`，如果是类式组件，就会将其标记为`ClassComponent`，那么如何判断是类式组件还是函数式组件呢？

```js
function shouldConstruct$1(Component) {
   var prototype = Component.prototype;
   return !!(prototype && prototype.isReactComponent);
}
```

上面就是判断的依据，因为类式组件都是一个类，并且是继承自React.Component的，而函数式组件是一个纯函数，根据这个区别就可以判断出来。

以上就是HostRoot的调和流程，它的结果就是生产了一个自己的子节点，假如现在子节点是一个函数式组件类的Fiber，接下来就会将它返回，并赋值给新的`workInProgress`，进入下一个轮回的`beginWork`

### IndeterminateComponent

其实`IndeterminateComponent`类的Fiber就是一个react经过第一次认定的函数式Fiber，不知道大家好不好奇怪为什么要设计这样的一个中间状态呢？接下来我们就来探究一下这是为什么？

初始化时调和 `IndeterminateComponent` 的目的其实也是为了生成自己的子节点，因此在这个过程中就需要调用函数组件了，因为只要调用它才能得到最新的`ReactElement`，同时函数式组件内部的hooks也都会执行

```js
function mountIndeterminateComponent(
    _current, // mount时为null
    workInProgress,
    Component,
    renderLanes
  ) {
    var props = workInProgress.pendingProps;
    var value;
    // 这个地方是如果是类组件，但是没有继承React.Component的逻辑
    
    setIsRendering(true);
    // 调用函数式组件
    value = renderWithHooks(
       null,
       workInProgress,
       Component,
       props,
       context,
       renderLanes
    );
    setIsRendering(false);
    
    workInProgress.flags |= PerformedWork; // 打标签
    // 如果是返回了一个类组件实例的情况
    if (
      typeof value === "object" &&
      value !== null &&
      typeof value.render === "function" &&
      value.$$typeof === undefined
    ) {
      // 分支1
      workInProgress.tag = ClassComponent; // 将其标记为类组件
      workInProgress.memoizedState = null;
      workInProgress.updateQueue = null;
      workInProgress.memoizedState =
        value.state !== null && value.state !== undefined ? value.state : null;
      // 将其视为类组件
      initializeUpdateQueue(workInProgress);
      adoptClassInstance(workInProgress, value);
      mountClassInstance(workInProgress, Component, props, renderLanes);
      return finishClassComponent(
        null,
        workInProgress,
        Component,
        true,
        hasContext,
        renderLanes
      );
    } else {
      // 分支2
      // 说明是正常的函数式组件
      workInProgress.tag = FunctionComponent;
      return workInProgress.child;
    }
  }
```

为什么会存在 `mountIndeterminateComponent` 这样的一种情况呢？实际上是因为一些特殊情况的优化，函数组件由用户提供因此可能写出下面这样的代码

```js
// 类
class ClassComponent extends React.Component{
    constructor(props) {
      super(props);
      this.state = {
        num: 1
      }
    }
    render() {
      const { num } = this.state;
      const onClick = () => {
        this.setState({
          num: num + 1
        })
      }
      return (
        <div>
          <button onClick={onClick}>{ num }</button>
        </div>
      );
    }
} 
// 函数
const FunctionComponent = () => {
    const [count, setCount] = React.useState(1);
    const onClick = () => {
      setNum(num + 1);
    };

    const instance = new ClassComponent();

    return instance;
};

ReactDOM.createRoot(<FunctionComponent/>).redner(container)
```

在这种情况下会命中`mountIndeterminateComponent`的分支1，`beginWork`会将本次的这个函数式组件标记为类式组件，因为他们的状态可以视作一个节点的状态，这样做的目的是为了提升性能，否则当成两个节点处理的话需要多做一次`beginWork`的轮回

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/3fa0ab908e5449c89b72b214d5800045~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=339&h=290&s=36449&e=png&b=faf9f9)

在下一次轮回的时候，这个函数式组件会被直接当作类式组件处理，对于正常返回 ReactElement的函数式组件会进入`mountIndeterminateComponent`的分支2，继续生成自己的子节点，但在这之前需要经历一个非常重要的步骤，就是调用渲染函数`renderWithHooks`，它的执行意味着react用户写的组件就会执行，对应的hooks什么的都会执行

```js
 function renderWithHooks(
    current, // 初始化时为null
    workInProgress,
    Component, // 组件
    props,
    secondArg,
    nextRenderLanes
  ) {
    renderLanes = nextRenderLanes;
    currentlyRenderingFiber$1 = workInProgress;


    workInProgress.memoizedState = null;
    workInProgress.updateQueue = null;
    workInProgress.lanes = NoLanes; 
    {
      if (current !== null && current.memoizedState !== null) {
        // 初始化会命中这里，得到hooks的更新函数列表
        ReactCurrentDispatcher$1.current = HooksDispatcherOnUpdateInDEV;
      } else { // 初始化会命中这里，得到hooks的初始化函数列表
        ReactCurrentDispatcher$1.current = HooksDispatcherOnMountInDEV;
      }
    }
    var children = Component(props, secondArg); // 执行渲染函数
    ReactCurrentDispatcher$1.current = ContextOnlyDispatcher;
    return children;
}
```

`ReactCurrentDispatcher$1.current` 就是hooks调用时引用的对象，只有在调用函数前才会将其置为正确的位置，否则得到的都是报错的函数列表

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/00bed8a373b3432aae56a41a72bb139c~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=599&h=301&s=108340&e=png&b=fcf9f9)

在hook的调用过程中，就会得到最新的状态，这个我们到`hooks原理篇`在深入了解，在这里我们就理解为得到了最新的`ReactElement`对象，紧接着就会进入子节点的生成过程`reconcileChildren`，这个过程在上面已经分析了，主要的目的就是生成一个Fiber节点

### HostComponent

对于一个函数式组件生成子节点，它大概率会生成一个原生DOM元素的节点，因此属于`HostComponent`，我们来看一下它的调和流程，这个节点其实就是由上一步的时候函数式组件调和时生成的，它会进入`updateHostComponent`

```js
function updateHostComponent(current, workInProgress, renderLanes) {
    var type = workInProgress.type;
    var nextProps = workInProgress.pendingProps;
    var prevProps = current !== null ? current.memoizedProps : null; // 初始化时为null
    var nextChildren = nextProps.children;
    reconcileChildren(current, workInProgress, nextChildren, renderLanes);
    return workInProgress.child;
}
```

原生DOM类型的Fiber非常简单，其实就是生成子节点就好了，直接进入`reconcileChildren`，在这一步直接进入创建Fiber的过程，只不过原生DOM类型的节点直接是基于自己的`children`节点创建的

![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/36ecd5b863114674b470e45601338e9b~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=428&h=317&s=49644&e=png&b=fef7f7)

`mountChildFibers`的核心逻辑就是创建**单个子Fiber节点**，或者**一串子Fiber链表**，


> 小结：
> 以上就是在初始化流程中beginWork主要做的事情，主要就是创建Fiber节点、对于函数式组件的优化、执行render渲染函数、hook执行+状态计算、打标签等

## 三、更新场景


### fiber复用

当我们的应用初始化完成之后，接下来就是更新了，更新时当然会从根节点开始每一个节点都会进入`beginWork`流程，但是不一定每一个节点都需要进入重新创建fiber的节点，为了提升性能，react会尽可能的复用之前的fiber节点，它是如何做到的呢？
```js
function beginWork(current , workInProgress , renderLanes){
   if(current !== null){
      // 进入更新阶段
      
      判断是否应该复用该节点
      
      if(可以复用) {
        return 可以复用的节点 / 克隆，
      }
   }
   
   正常像mount一样
}
```

通过一个分支过滤掉可以复用的节点就好了，它判断的依据是什么呢，我们来看一下

```js
function checkScheduledUpdateOrContext(current, renderLanes) {
    var updateLanes = current.lanes;
    if (includesSomeLane(updateLanes, renderLanes)) {
      return true;
    } 
    return false;
}
```

我们在上一篇[《深入理解react》之render流程](https://juejin.cn/post/7353451512205492278)中介绍了在进入`beginWork`之前会给状态发生源打上lanes的标记，状态发生的源fiber的祖先节点都不会命中这个节点自然也就会复用了。


![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/9ab86e525ad3422190a06c216cd717d8~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=1060&h=1206&s=76943&e=png&b=fdfdfd)

### 单节点vs多节点

在更新的场景下会有两种情况，当前层级只有一个节点或者当前层级有多个节点，他们都发生在`reconcileChildFIbers`中

```js
function reconcileChildFibers(
      returnFiber,
      currentFirstChild,
      newChild,
      lanes
) {
      if (typeof newChild === "object" && newChild !== null) {
        switch (newChild.$$typeof) {
          case REACT_ELEMENT_TYPE:
            return placeSingleChild(
              reconcileSingleElement( // 单个节点的情况
                returnFiber,
                currentFirstChild,
                newChild,
                lanes
              )
            );
            ...
        }

        if (isArray(newChild)) {
          return reconcileChildrenArray( // 多个节点
            returnFiber,
            currentFirstChild,
            newChild,
            lanes
          );
        }
        ...
    }
}
```

其中判断的依据就是当前这一层的新的`ReactElement`是否是一个数组，而进入`reconcileChildrenArray`就是diff算法的过程，本篇文章不会详细探讨diff算法的细节，我们将会在后面的内容专门聊聊这个！

而我们在这里要讲讲单节点的复用过程，它是怎么复用的，是克隆原fiber还是直接获取它的引用

```js
function reconcileSingleElement(
      returnFiber,
      currentFirstChild,
      element,
      lanes
    ) {
      var key = element.key;
      var child = currentFirstChild;
      while (child !== null) {
        if (child.key === key) { // key相同
          var elementType = element.type; // tag标签
          if (
              child.elementType === elementType // tag标签相同
          ) {
              deleteRemainingChildren(returnFiber, child.sibling);
              // 复用现有的节点
              var _existing = useFiber(child, element.props);
              _existing.ref = coerceRef(returnFiber, child, element);
              _existing.return = returnFiber;
              return _existing;
          }
          
          break
        } 
        child = child.sibling;
      }

     ...
 }
```

如果复用现有的节点需要满足2个条件即可
1. key相同
2. tag相同

如何复用呢？看看useFiber的实现就好了

```js
function useFiber(fiber, pendingProps) {
   // fiber代表 旧fiber节点 pendingProps代表新的props
   var clone = createWorkInProgress(fiber, pendingProps);
   clone.index = 0;
   clone.sibling = null;
   return clone;
}
```

复用的逻辑就是根据当前的`current`复制一个节点，不是直接获取引用而是克隆一个


### 状态计算

在更新的时候需要根据当前的状态来计算最新的状态，这也是一个非常重要的逻辑，它在`processUpdateQueue`之中，他的逻辑比较长，我们使用图的方式来进行分析

第一步：`beginWork`会获得当前的`updateQueue`，我们之前分析过它是这样的一个环形链表结构


![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/390df2f426964cf59b52861b56da9fca~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=848&h=558&s=41800&e=png&b=fcfcfc)


假设本次render中系统产生了4个更新任务，分别是 **A1 、B2 、C1 、D2** ，其中1代表高优先级，2代表低优先级 ， 而本次render流程的代表高优先级1。

第二步：剪断链表


![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/e14f56da2c9f499b89b66a3c796bd59c~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=838&h=856&s=49206&e=png&b=fefefe)

第三步：依次遍历链表，计算状态


![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/85a056f0c94f458391e47a25dd0d7016~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=491&h=491&s=88726&e=png&b=fdfdfd)

在遍历链表的时候，会根据当前的优先级筛选出符合本次优先级的更新，只计算他们状态的集合，剩下的，会将其放在fiber上的`firstBaseUpdate`和`lastBaseUpdate`以供下一次更新，在遍历本次链表的时候C1的优先级会设置为0，方便下一次进行计算

所以本次计算的状态结果就是**AC**

等到下一次更新优先级是2的时候，就会遍历`firstBaseUpdate`，基于`baseState`进行计算。

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/def7d58dc6314e3d8cfe44f0dc2387f2~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=429&h=413&s=17744&e=png&b=fcfcfc)

最终结果会按照预期呈现在UI上

以上就是在react状态计算时的重点

> 小结：
> 在更新阶段，beginWork会尽可能复用节点，此外在进行状态计算的时候还会跳过低优先级的状态，在下一次调度时再计算



## 四、最后的话

本篇内容比较长，但我用多张图绘制了在内存中`beginWork`的执行状态，应该还算是通俗易懂，后面的文章我们就要进入`completeWork`的内容了。

后面的文章我们会依然会深入剖析react的源码，学习react的设计思想，如果你也对react相关技术感兴趣请关注我的[《深入理解react》](https://juejin.cn/column/7348420268175114290)专栏，我们一起进步，有帮助的话希望朋友点个赞支持下，多谢多谢！
