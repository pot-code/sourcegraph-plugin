# SourceGraph Plugin

SourceGraph 是个搜索源码，查看源码的网站，使用起来十分趁手。但是字体太小感觉眼睛都要看瞎，于是有了做一个调整字体大小的插件的想法。

经过几天的耕耘，终于实现了调整字体大小的功能。但是！！！既然放了一个 settings 按钮，怎么能满足于只做一个字体调整功能，于是又大刀阔斧进行了重构，加入了插件系统，可以接入更多的功能。

## 注册组件

注册组件请在文件末尾进行：

```javascript
logger.setLevel(LogLevels.debug)
plugin.registerComponent('font-controller', createFontController)
// 在这注册你的组件:
// plugin.registerComponent('组件名', 组件定义方法);
```

组件定义方法的编写格式为：

```javascript
/**
 * codeArea {HTMLElement} 代码显示区 DOM 元素
 * dropdown {{dom:HTMLElement, toggle:Function}} 菜单组件
 * 	- dom 是菜单的根元素，在组件内部调用 dom.appendChild() 将组件 DOM 插入到菜单栏
 *	- toggle 控制菜单的显示/隐藏
 */
function createXxxxx({ codeArea, dropdown } /* 插件自动注入的依赖 */) {
  // 组件创建逻辑
  return {
    // 以下属性均选填，不强制要求
    root: HTMLElement, // 组件根元素
    reload: Function, // 依赖发生变化时，若组件需要进行一些重新绑定的操作，可以导出此方法
    uninstall: Function, // 插件卸载时会调用此方法
    // 插件定义的 css 样式。样式会注册到页面全局
    // 这样组件内部元素可以直接使用 className 赋予样式，也可以覆盖页面自身定义的样式
    style: string
  }
}
```

# API

> 带 \* 的方法需要谨慎调用，可能会破坏插件的正常使用

## logger

打印日志工具

```javascript
logger.trace(msg:string);
logger.debug(msg:string);
logger.info(msg:string);
logger.warn(msg:string);
logger.error(msg:string);
```

`*logger.setLevel(LogLevels.trace|debug|info|warn|error)`，设置全局日志等级

## plugin

`plugin.registerComponent(name:string, definition:Function)`，注册组件

- name，组件名称，需要唯一
- definition，组件定义方法

`*plugin.init()`，初始化组件方法

`*plugin.addReloadListener(target, event, shouldReload, capture)`，注册可能导致插件更新的监听器

- `target:HTMLElement`，导致更新的事件来源元素
- `event:string`，事件名称
- `shouldReload:(event:Event)=>boolean`，事件触发时，是否会导致插件更新
- `capture:boolean`，是否监听事件的 capture 流程

# TODO

- [ ] 切换 repo 时失效
- [ ] 更好的类型提示
