<template>
  <section class="notes">
    <h2>数据与受控状态</h2>
    <p>
      options 接收业务对象数组，默认使用 value、label、disabled；fieldNames
      支持点号路径，rowKey
      可用函数生成编号。编号须是稳定、唯一的字符串或有限数值，字符串和数值分别处理。重复或无效编号不会渲染为额外条目，组件不会修改数据源。
    </p>
    <p>
      modelValue 表示已经移入右侧的条目，checkedKeys
      表示两侧当前勾选、准备移动的条目，两者互相独立。未绑定时由组件维护状态，可用
      defaultValue、defaultCheckedKeys、leftDefaultChecked、rightDefaultChecked
      指定初值。已经移入但暂不在 options 中的编号会保留，数据补齐后自动展示。
    </p>
    <p>
      change 保留原有的转移请求事件，用于兼容 v-model 或通过 change
      更新数据的用法；参数依次为目标编号、right /
      left、这次移动的编号。调用方可以拒绝受控更新，界面继续以实际绑定值为准。实例的
      move、remove、setCheckedKeys 等方法返回
      Promise&lt;boolean&gt;，表示调用方是否接受了有效变化；拒绝时不会清除原有勾选或触发表单变更校验。
    </p>
  </section>
  <section class="notes">
    <h2>搜索、分页与选择范围</h2>
    <p>
      搜索分别作用于左右两侧，默认忽略大小写；filterMethod
      接收原始查询、业务对象和面板方向。搜索不会清除已移入项或其他已勾选项。searchValues、pages、pageSizes
      可分别受控，连续更新两侧时会合并同一批次的请求。
    </p>
    <p>
      表头全选和反选只操作当前筛选结果中的当前页，并保留其他页和另一侧的勾选。checkAll
      与 invertSelection 的 scope 可选 page、filtered 或
      all。禁用项不参与勾选、全选、反选、移除和拖拽。分页的 pageSize
      是初始大小，后续可以通过分页控件或 pageSizes 调整。
    </p>
    <p>
      targetOrder=original 按源数据顺序展示右侧列表，不重排绑定值；push 与
      unshift 按绑定值顺序展示，并把新增条目放到末尾或开头。buttonTexts
      按从上到下的添加、移除按钮排列。
    </p>
  </section>
  <section class="notes">
    <h2>自定义面板与大列表</h2>
    <p>
      option 和默认插槽接收原始 option、label、side、checked 与
      disabled。renderContent 可返回 VNode；header、左右 footer /
      empty、operations、loading
      插槽可分别定制各区域，独立区域插槽优先于公共插槽。
    </p>
    <p>
      panel 插槽提供当前页 items、全部匹配结果 filteredItems、当前面板
      checkedKeys、query、disabled，以及
      check、setCheckedKeys、checkAll、remove。面板中的 setCheckedKeys
      只替换当前侧的勾选，并保留另一侧。自定义面板自己负责行渲染，内置虚拟滚动不作用于自定义内容。
    </p>
    <p>
      virtual 使用固定 itemHeight，仅渲染可见范围与
      overscan。自定义行内容需与行高一致；listHeight 控制内置视口，也可用
      listStyle
      调整样式。分页与虚拟滚动可以组合使用。虚拟模式或单页较大时不使用逐行移动动画，避免为大量节点测量动画位置。
    </p>
  </section>
  <section class="notes">
    <h2>拖拽、键盘与表单</h2>
    <p>
      默认可以拖动一个条目。dragChecked=true
      时，拖动已勾选条目会携带同侧的全部有效勾选；只能放到当前穿梭框的另一侧。单向模式通过右侧移除按钮撤销条目。按
      Esc、窗口失焦、变为禁用或加载状态、数据变化及页面离开都会清理拖拽状态。
    </p>
    <p>
      复选框使用空格切换；列表中的上下方向键、Home 和 End
      会跳过禁用项并移动焦点，虚拟模式会先渲染目标条目。表单尺寸和禁用状态自动继承。内部搜索和勾选不会提前校验字段；有效转移后触发
      change 校验，焦点离开整个控件后触发 blur 校验，validateEvent=false
      可关闭这些主动校验。
    </p>
    <p>
      KeepAlive
      保留目标选择、搜索、页码和勾选状态；页面离开会取消拖拽监听、动画帧和尺寸观察。locale
      可覆盖界面、辅助技术及操作提示文案。自定义面板和操作区应使用插槽提供的
      disabled 状态控制交互。
    </p>
  </section>
</template>
