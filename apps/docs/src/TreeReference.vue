<template>
  <section class="notes">
    <h2>节点与受控状态</h2>
    <p>
      nodes 接收原始业务对象。默认字段为 id、label、children，fieldNames
      可替换字段并使用点号路径，nodeKey
      可用字段路径或函数生成编号。编号必须稳定、唯一，支持字符串和有限数值，包括
      0；字符串与数值分别处理。无效、重复或循环引用不会生成额外节点。
    </p>
    <p>
      modelValue 管理行选择，checkedKeys 管理复选框，expandedKeys
      管理展开状态，searchValue
      管理搜索条件，各自可独立绑定。未绑定时由组件维护，并分别使用
      defaultValue、defaultCheckedKeys、defaultExpandedKeys 和
      defaultSearchValue 初始化。multiple 或数组模型启用多选，allowDeselect
      允许再次点击当前项或按 Esc 取消选择。
    </p>
    <p>
      保留 select(node) 与 check(keys)
      的第一个参数；第二个参数补充选择、半选和原始事件信息。update
      事件是更新请求，宿主可以拒绝。实例修改状态的方法返回
      Promise&lt;boolean&gt;，只有同步绑定接受了有效变化才返回
      true；连续的依赖操作应使用 await。
    </p>
  </section>
  <section class="notes">
    <h2>展开、筛选与勾选</h2>
    <p>
      autoExpandParent 为指定的展开节点补齐祖先；accordion
      交互时只保留同级的当前分支。expandOnClickNode 与 expandOnDoubleClick
      控制文字区域的展开方式。checkOnClickNode、checkOnClickLeaf 和
      selectOnClickNode
      分别控制点击文字时的勾选与选择行为，默认保持原有的文字选择、箭头展开方式。
    </p>
    <p>
      父子联动时，勾选父节点会作用于可编辑子孙，子级全选自动得到父级全选，部分选择显示半选。disabled、disableCheckbox
      与 checkable=false
      形成联动边界，保护原有状态；边界下面的节点仍可单独操作。checkStrictly
      关闭联动，halfCheckedKeys
      可在严格模式指定额外半选状态。getCheckedKeys(true) 与
      getCheckedNodes(true) 只读取叶子节点。
    </p>
    <p>
      隐藏筛选保留匹配节点及祖先，并临时显示匹配路径；清空后恢复原有展开状态。showMatchedChildren
      可同时显示匹配分支的子级。filterMode=highlight
      保留当前结构，只标记匹配项。filterNode 接收原始查询和原始业务对象。
    </p>
  </section>
  <section class="notes">
    <h2>异步数据与编辑</h2>
    <p>
      hasChildren=true 表示尚未加载的分支，isLeaf=true
      明确表示叶子。loadChildren(node, {key,signal})
      返回子节点数组；结果仅缓存于组件，不修改源数据。重复展开共用请求，失败显示重试入口，reloadNode
      可主动刷新。数据源或加载函数更换、禁用、离开缓存页面或卸载时会取消请求，过期结果不会写入新树。
    </p>
    <p>
      loadedKeys
      可绑定已接受的加载标记；拒绝标记更新时不会展示本次返回的子节点。更换数据源时应同步重置不再有效的
      loadedKeys。实例的
      append、insertBefore、insertAfter、remove、updateKeyChildren 通过
      update:nodes 请求不可变更新；使用 v-model:nodes
      接收，原始业务对象不会被原地改写。
    </p>
  </section>
  <section class="notes">
    <h2>拖拽与大数据</h2>
    <p>
      拖拽只在当前树中生效，放置位置为 before、inside、after。allowDrag 和
      allowDrop
      分别决定起点与目标是否允许。禁止放入自身或子孙，提供目标位置指示和可配置
      dragExpandDelay 悬停展开。node-drop
      保留原有编号与位置，并补充原始节点和事件；组件不会替宿主重排数据。
    </p>
    <p>
      virtual 使用固定 rowHeight，仅渲染视口与 overscan。viewportHeight
      控制可见高度，自定义行内容应符合行高。scrollTo
      可按编号定位并补齐展开路径，focus
      支持未渲染节点。滚动更新合并到动画帧，关闭逐行位移动画，缓存页面保留已接受状态和滚动位置；拖拽、菜单和临时监听在页面离开后清理。
    </p>
  </section>
  <section class="notes">
    <h2>键盘与表单</h2>
    <p>
      ↑ / ↓ 移动焦点并跳过禁用项；← / → 折叠、展开或进入父子节点；Home / End
      到首尾；Enter 选择，空格勾选，Esc
      关闭菜单、取消拖拽或取消允许清除的选择。搜索框保留文字编辑键，并阻止 Enter
      意外提交外层表单。
    </p>
    <p>
      继承 Form 的禁用与尺寸，在接受选择或勾选变化后触发 change
      校验，整体离开后触发 blur 校验；validateEvent=false
      关闭主动校验。内置搜索和复选框属于树的内部控件，不会分别注册为表单项。
    </p>
  </section>
</template>
