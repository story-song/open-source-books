---
theme: smartblue
---

## 一、前面的话

我们终于可以进入render阶段了，在这个阶段我们可以学习到很多东西，它是为什么react能够呈现出UI，以及计算react状态变化的核心，那么怎么定义当前阶段是不是出于render阶段呢？其实网上的说法可能各不相同，这里我们需要把这个定义明晰一下

在源码中其实有关于状态的说明，使用了`executionContext`这个全局变量来表示当前的状态

```js
export const NoContext = /*             */ 0b000; 0
const BatchedContext = /*               */ 0b001; 1
const RenderContext = /*                */ 0b010; 2
const CommitContext = /*                */ 0b100; 4
```

在本专栏中我们使用主流的概念，我们将`executionContext`中含有`RenderContext`的过程视为`render`阶段

在前面的内容中我们学习了优先级的概念，并知道`react`是通过`Scheduler`来调度的异步任务，而这个任务本质上就是一个函数，它的名字叫做`performConcurrentWorkOnRoot` 或者 `performSyncWorkOnRoot` 他们都是用来执行任务的，而本篇文章要讲的`render`阶段就蕴含其中，接下来就让我们一起来学习吧！



## 二、render之前

在上一篇文章[《深入理解react》之优先级（下）](https://juejin.cn/post/7352079402057056268)中，我们讲到了真正调度的具体任务是 `performConcurrentWorkOnRoot` 这个函数，但是它并没有立马进入`render`流程，让我们来看看在这之前发生了什么呢？

```js
function performConcurrentWorkOnRoot(root, didTimeout) {
    // didTimeout 是Scheduler 提供的，如果当前任务还有时间片就返回 false，否则返回true 
    ...
    var lanes = getNextLanes( // 获取任务优先级
      root,
      root === workInProgressRoot ? workInProgressRootRenderLanes : NoLanes
    );

    if (lanes === NoLanes) { // 防止空调用
      return null;
    } 
    var shouldTimeSlice = // 它的条件就是 不属于includesBlocking的优先级，且没有过期的优先级
      !includesBlockingLane(root, lanes) &&
      !includesExpiredLane(root, lanes) &&
      !didTimeout;
    var exitStatus = shouldTimeSlice
      ? renderRootConcurrent(root, lanes)
      : renderRootSync(root, lanes);
    
    // 后面是commit 的内容，我们后面看
    ...

    return null;
  }
```

首先他会获取一下当前的任务优先级，根据这个优先级来进行后面的`状态计算`

我们可以看到当逻辑即便来到了`performConcurrentWorkOnRoot` 之后也并不一定是并发渲染的，需要经过一个逻辑的判断，判断的主要依据就是根据当前的**任务优先级**，如果想要进入并发渲染模式需要满足三个条件

1. includesBlockingLane 当前任务优先级必须不包含`includesBlocking`类的，一共有这么几种
    
   ```js
   function includesBlockingLane(root, lanes) {
    // lanes 属于下面的几个中的一个就返回 false ,不属于返回true
    var SyncDefaultLanes =
      InputContinuousHydrationLane |
      InputContinuousLane |
      DefaultHydrationLane |
      DefaultLane;
    return (lanes & SyncDefaultLanes) !== NoLanes;
   }
   ```

   也就是说当前的任务优先级必须不属于 `SyncDefaultLanes` 

2. 其次当前的任务优先级不能过期

   ```js
   function includesExpiredLane(root, lanes) {
    // 当前的优先级属于过期的优先级就会返回false ，不过期就会返回true
    return (lanes & root.expiredLanes) !== NoLanes;
   }
   ```

   只要当前的任务优先级不属于`root.expiredLanes`中的就可以了
   
3. Scheduler必须还拥有时间片

假设当前是第一次渲染页面就会被判定为同步渲染，因为第一次默认渲染的任务优先级是`DefaultLane`，条件一未通过，如下图所示


![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/ac7b697d39f544759eb6905eeaeb2e00~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=374&h=207&s=40022&e=png&b=fdf6f5)
    
因此我们就来到了`renderRootSync`，它的含义就是从root开始进行 `render`阶段


## 二、render阶段

接下来执行流来到`renderRootSync`

```js
function renderRootSync(root, lanes) {
    var prevExecutionContext = executionContext;
    executionContext |= RenderContext; // 标记render阶段
    var prevDispatcher = pushDispatcher();  // 
    if (
      workInProgressRoot !== root ||
      workInProgressRootRenderLanes !== lanes
    ) {
      // 获得transition优先级
      workInProgressTransitions = getTransitionsForLanes();
      // 在这里进行 workInProgress的准备，将Update放在shared.pending上
      prepareFreshStack(root, lanes);
    }
    // 开始同步render
    do {
      try {
        workLoopSync();
        break;
      } catch (thrownValue) {
        handleError(root, thrownValue);
      }
    } while (true);
    // 归还 context Dispatcher 等全局变量
    resetContextDependencies();
    executionContext = prevExecutionContext;
    popDispatcher(prevDispatcher);
    workInProgressRoot = null;
    workInProgressRootRenderLanes = NoLanes;
    return workInProgressRootExitStatus;
  }
```

第一步：  
`executionContext |= RenderContext` 将流程正式标记为`render阶段`

第二步：  
准备Dispacher，其实就是我们调用`useState`等API时的引用，它是通过`ReactCurrentDispatcher$2.current`这样的一个全局变量来调用的，通过给他赋予不同的对象，我们就会调用不同的API，这就是为什么我们在组件之外的地方使用`hooks`的时候会报错了，因为此时赋予的Dispatcher是这个：


![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/d891c440bd8041cc99822bfcc1c4e9a8~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=596&h=448&s=129783&e=png&b=fdfbfb)


在第一次挂载的时候，`workInProgressRoot`一定是没有值的，因此要准备一个空的`workInProgress`，因为render过程的本质就是**根据最新的状态，得到最新的ReactElements，然后diff这个ReactElement和current树，从而计算出不同，打上这个不同的标签**

我们来看一下`prepareFreshStack`的过程

```js
 function prepareFreshStack(root, lanes) {
    // 将finishedWork置空
    root.finishedWork = null;
    root.finishedLanes = NoLanes;

    if (workInProgress !== null) { // 初始化时为空
      ...
    }
    // 对一些关于workInProgress相关的全局变量的赋值
    workInProgressRoot = root;
    // 创建一棵空的workInProgress树
    var rootWorkInProgress = createWorkInProgress(root.current, null); // 创建一个Fiber，基本就是对RootFiber的复制。
    // 对一些关于workInProgress相关的全局变量的赋值
    workInProgress = rootWorkInProgress; //赋值给全局的workInProgress
    workInProgressRootRenderLanes = subtreeRenderLanes = workInProgressRootIncludedLanes = lanes;
    workInProgressRootExitStatus = RootInProgress;
    ...
    // 把updateQueue 中的 interleaved指向的更新队列指向 shared.pending
    finishQueueingConcurrentUpdates();

    return rootWorkInProgress; // 将这棵空树返回
  }
```

这一步的主要作用就是对`workInProgress`做相关的准备，`createWorkInProgress`基本上就是基于current克隆出来了一个新的**Fiber节点**，下面可以看一下如何创建的 `workInProgress`

```js
function createWorkInProgress(current, pendingProps) {
    var workInProgress = current.alternate;
    if (workInProgress === null) { // 初始化时就是空的
      workInProgress = createFiber( // 创建一个fiber，和current一摸一样。
        current.tag,
        pendingProps,
        current.key,
        current.mode
      );
      workInProgress.elementType = current.elementType;
      workInProgress.type = current.type;
      workInProgress.stateNode = current.stateNode;
      workInProgress.alternate = current;
      current.alternate = workInProgress;
    } else { // 更新时
      workInProgress.pendingProps = pendingProps; // Needed because Blocks store data on type.
      workInProgress.type = current.type; 
      // 初始化所有的副作用
      workInProgress.flags = NoFlags; // The effects are no longer valid.
      workInProgress.subtreeFlags = NoFlags;
      workInProgress.deletions = null;
    } 
    workInProgress.flags = current.flags & StaticMask;
    workInProgress.childLanes = current.childLanes;
    workInProgress.lanes = current.lanes;
    workInProgress.child = current.child;
    workInProgress.memoizedProps = current.memoizedProps;
    workInProgress.memoizedState = current.memoizedState;
    workInProgress.updateQueue = current.updateQueue; // 把updateQueue的引用拿过来。
    ...
    return workInProgress;
  } 
```

现在内存中就有这样的一个结构


![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/7e9ec992577f4e148adb32f12e213626~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=364&h=566&s=38705&e=png&b=fdfdfd)

接下来正式进入构建`workInProgress`树的阶段，初始化时是同步执行的因此走的是`workLoopSync`

```js
function workLoopSync() {
    while (workInProgress !== null) {
      performUnitOfWork(workInProgress);
    }
}
```

由于提前已经准备好了第一个 `workInProgress`的节点，因此这个循环会不断执行，直到整棵树调和完毕

```js
function performUnitOfWork(unitOfWork) { // 参数就是workInProgress的第一个节点
    var current = unitOfWork.alternate;
    var next;
    // 向下调和
    next = beginWork(current, unitOfWork, subtreeRenderLanes); // subtreeRenderLanes就是本次更新的任务优先级，在准备wormInProgress时赋值的。
    
    unitOfWork.memoizedProps = unitOfWork.pendingProps;

    if (next === null) {
      // 向上归并
      completeUnitOfWork(unitOfWork);
    } else {
      workInProgress = next;
    }
    ReactCurrentOwner$2.current = null;
  }
```

`render`阶段的两大流程在这里就一览无余了，每一个fiber节点都会经历一次 `beginWork` 和 `completeWork`这两个流程，假设我们现在有这样的一个dom结构

```js
const App = ()=>{
   return (
     <div>
       <p>
         <span>hello</span>
       </p>
       <span>深入理解react</span>
     </div>
   )
}
```

那么整体的调和流程就是：

1. beginWork: RootFiber
2. beginWork: App
3. beginWork: div
4. beginWork: p
5. beginWork: span-hello
6. completeWork: span-hello
7. completeWork: p
8. beginWork: span-深入理解react
9. completeWork: span-深入理解react
10. completeWork: div
11. completeWork: App
12. complleteWork: RootFiber
13. 调和结束

一图胜千言，我们用一个流程图来表示一下：

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/bdcf39a38c1b42889fcc94679bdaff9b~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=1026&h=1298&s=90108&e=png&b=fdfdfd)

## 三、两棵树

在整个react运行时，总会有两棵fiber树存在在内存中，`render`阶段的任务就是不断基于当前的`current`树，构建接下来要渲染的`workInProgress`树

### 初始化

在mount阶段，也就是页面从0到1的过程中，会通过初始化流程建立这样的一棵树



![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/f1763b4bd48d4e71b027b3b4039ce5f2~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=840&h=512&s=35398&e=png&b=fdfdfd)


紧接着，经过render流程之后


![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/e23dd39f4ae5490d8ca8780b4967e350~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=958&h=1312&s=78019&e=png&b=fdfdfd)

内存中有这样的一个结构，react根据`workInProgress`渲染真正的DOM界面之后，再把`current` 指针指向这个`workInProgress`


### 更新

在更新流程中，内存中基于现在的current，重新构建一棵新的workInProgress树，当然这个过程会尽可能复用之前的fiber节点，经过render流程之后


![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/20105274c3ad4d92845af2a1c6768cef~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=1282&h=1338&s=110642&e=png&b=fcfcfc)


## 四、最后的话

好了，本篇文章比较简单，没什么特别深入的内容，主要是给接下来的文章铺路，下面的内容我会将`beginWork`和`completeWork`做一个梳理，看看他们具体做了什么，在初始化阶段和更新阶段有什么不同！

后面的文章我们会依然会深入剖析react的源码，学习react的设计思想，如果你也对react相关技术感兴趣请关注我的[《深入理解react》](https://juejin.cn/column/7348420268175114290)专栏，我们一起进步，有帮助的话希望朋友点个赞支持下，多谢多谢！


