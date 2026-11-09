<template>
  <section class="notes">
    <h2>数据、编号与状态</h2>
    <p>
      nodes 默认使用 value、label、children，fieldNames 支持点号路径；nodeKey
      也可使用字段路径或函数。编号支持字符串及有限数值，0
      是有效值，空字符串表示未选择。保留原有 HysTreeSelectNode
      字符串节点类型，也提供可指定编号类型的 HysTreeSelectDataNode。
    </p>
    <p>
      modelValue、searchValue、expandedKeys 和 open
      可以分别受控。未绑定时使用组件内部状态及相应 default
      初值，宿主可拒绝更新请求。change
      的第一个参数保持原有值，第二个参数包含原因、原始节点、编号、标签与半选信息；value-change
      仅在有效更新被接受后触发。
    </p>
    <p>
      默认展开已有分支以保留原有显示方式；defaultExpandAll=false
      可从折叠状态开始。选中项的祖先可在展开弹层时自动打开。simpleMode 可把 id /
      parentId 扁平列表派生为树形结构，支持根标记和字段替换，不修改原始数组。
    </p>
  </section>
  <section class="notes">
    <h2>选择、复选框与标签</h2>
    <p>
      multiple 或数组模型启用多选，checkable 自动启用多选。leafOnly
      限制普通点击只选择叶子；复选模式下分支仍可批量选择子级，回填仅包含叶子。showCheckedStrategy
      支持
      child、parent、all，分别回填子级、优先父级或全部；独立勾选时保留每个节点自己的值。
    </p>
    <p>
      禁用状态向子级继承，disableCheckbox 与 checkable=false
      阻断勾选联动。移除标签和清空保留受保护的已有值。multipleLimit
      限制新增选择，超过限制触发
      limit，仍可移除已有选项。maxTagCount、maxTagTextLength 控制标签展示，tag
      与 max-tag-placeholder 可自定义内容。
    </p>
    <p>
      labelInValue 以 {value,label} 回填，并尊重提供的标签；普通编号模式可用
      cacheData
      为未加载节点回显名称。组件会保留当前已选项的已知名称，避免搜索或远程结果更换后只剩编号。普通单选默认清空为
      ''，标签对象模式默认 null，可用 clearValue 修改。
    </p>
  </section>
  <section class="notes">
    <h2>搜索与异步数据</h2>
    <p>
      本地搜索默认忽略大小写，保留匹配节点及其祖先；filterNode
      可接收原始查询和业务对象。showMatchedChildren
      展示匹配分支的子级，filterMode=highlight
      保留当前结构并标记匹配。retainSearch
      保留关闭和选择后的搜索条件；否则正常重新打开时清空，clearSearchAfterSelect
      控制接受选择后的清空行为。
    </p>
    <p>
      remoteMethod(query,{signal}) 可返回节点数组，也可由宿主更新
      nodes。debounce
      合并连续输入，搜索切换、关闭弹层或离开页面时取消旧请求，过期返回不会覆盖当前结果。远程模式不重复执行本地过滤，失败可使用默认重试入口或
      error 插槽。
    </p>
    <p>
      hasChildren=true 表示待加载分支，loadChildren(node,{key,signal})
      返回其子节点；失败可以重试，reloadNode
      可主动刷新。关闭弹层取消未完成请求，已接受的子节点可在再次打开时复用。loadedKeys
      可管理加载标记，更换数据源时应同步移除失效标记。
    </p>
  </section>
  <section class="notes">
    <h2>弹层、虚拟列表与键盘</h2>
    <p>
      默认弹层与触发器等宽。popupMatchWidth=false 允许内容更宽，popupWidth
      可指定宽度，最终仍限制在视口内；listHeight
      限制选项区域，搜索和头尾内容保持可见。appendTo 可指定挂载位置，false
      表示在本地渲染；主题和尺寸同步到浮层。
    </p>
    <p>
      virtual 使用固定 itemHeight，仅渲染视口及 overscan
      缓冲行。自定义内容应与行高相符。scrollTo
      支持编号定位并展开祖先，不能替代当前搜索条件。↑ / ↓ 移动焦点，← / →
      展开或返回父级，Home / End 到首尾，Enter /
      空格选择。搜索框保留文本编辑键，输入法组合期间不触发选择。
    </p>
    <p>
      Esc 关闭并恢复触发器焦点，Tab
      可进入浮层中的可用操作。组件离开缓存页面后移除弹层、位置监听及异步请求，保留已接受的选择与展开状态。
    </p>
  </section>
  <section class="notes">
    <h2>表单与实例方法</h2>
    <p>
      继承 Form
      的尺寸、禁用状态、标签和校验提示；内部搜索与复选框不单独注册为表单项。接受值变化后执行
      change 校验，整体失焦执行 blur 校验；validateEvent=false
      可关闭主动校验。name
      使用隐藏字段提交当前编号，标签对象不会被序列化为表单文本。
    </p>
    <p>
      show、hide、focus、blur 管理弹层及焦点；setValue、clear、removeTag
      请求改变值，Promise&lt;boolean&gt;
      表示宿主是否接受有效变化，依赖操作应使用
      await。getSelectedKeys、getSelectedItems、getCheckedKeys 和
      getHalfCheckedKeys 分别读取回填值、展示项、完整勾选与半选状态。
    </p>
  </section>
</template>
