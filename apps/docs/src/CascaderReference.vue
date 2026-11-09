<template>
  <section class="notes">
    <h2>值与数据路径</h2>
    <p>
      options 保留原始节点，组件不修改 children。默认
      emitPath=true，单选输出完整编号路径，多选输出路径数组；不同分支可以使用相同编号。emitPath=false
      仅输出末级编号，此时各节点编号应全局唯一。字符串与数值分别处理，数字 0
      和空字符串都可以作为正常编号。modelValue 未提供时使用 defaultValue
      和内部状态。
    </p>
    <p>
      fieldNames 映射
      value、label、children、disabled、leaf、hasChildren，字段可以使用点号路径；valueKey
      也可使用函数。disabledMethod 与 leafMethod
      接收原始节点及其路径。禁用状态由父级向下继承；isLeaf / leaf 为 true
      时不再展开，false 或 hasChildren=true 可标记待加载分支。
    </p>
  </section>
  <section class="notes">
    <h2>选择、回填与标签</h2>
    <p>
      单选默认选择末级。changeOnSelect
      保留逐级点击立即回填的使用方式；checkStrictly
      提供任意层级、父子独立的单选或多选。多选默认关联可用后代并显示半选；showCheckedStrategy
      支持
      child、parent、all，影响标签和后续选择事件返回的值。已有受控值不会因切换显示策略而被静默改写。
    </p>
    <p>
      showPrefix 控制前缀控件；checkOnClickNode
      开启父级文字选择，checkOnClickLeaf
      默认允许末级文字选择。展开图标与悬停始终只浏览。maxTagCount
      默认显示三个标签，支持折叠提示与
      maxTagTextLength；tag、max-tag-placeholder 和 remove-icon
      可以定制展示。multipleLimit 限制回填值的数量，拒绝新增时发出
      limit。清空与移除保护禁用选择。
    </p>
    <p>
      showAllLevels、separator、displayRender 和 display
      插槽只改变展示。clearValue
      可定义空值哨兵，该值会被识别为空，不能同时用作可选分类值。name
      为每个回填项生成隐藏表单值；完整路径使用 JSON 字符串，form
      可指定所属表单。
    </p>
  </section>
  <section class="notes">
    <h2>搜索与异步数据</h2>
    <p>
      filterable
      对已加载的完整路径进行不区分大小写的搜索，禁用路径不会成为结果。filterMethod
      接收 query 和原始路径节点数组，searchSort 控制排序，searchLimit
      默认最多展示五十项。debounce 和 beforeFilter 支持异步搜索前校验，接收
      AbortSignal；较旧的结果不会覆盖新查询。retainSearch
      保留搜索，clearSearchAfterSelect 控制有效选择后的清理。
    </p>
    <p>
      loadChildren 返回子节点数组，接收原始节点与
      signal、path、nodes、level。点击或悬停浏览会按需加载，失败可在原节点重试。非严格多选勾选未加载的父级时，会以有限并发补齐其后代后再提交，失败或取消时保留原选择。loadRoot
      提供根选项，cacheData
      可以提前给缺失值提供标签；已接受的加载结果会保留，数据源替换或显式重载后更新。
    </p>
    <p>
      关闭、禁用与页面离开会取消未完成的搜索和加载，晚到结果不写入当前数据。选项和加载函数建议保存在稳定的响应式变量中。只读状态保留焦点与值，暂停修改。
    </p>
  </section>
  <section class="notes">
    <h2>浏览、布局与定制</h2>
    <p>
      expandedPath 是独立于选择的浏览路径，可通过 v-model 控制。expandTrigger 为
      click 或 hover，hoverDelay
      控制经过节点时的展开延迟。默认弹层与触发器等宽；popupMatchWidth=false
      可按内容扩展，popupWidth
      显式指定宽度。列宽不足时在面板内部横向滚动，columnWidth、listHeight
      控制每列尺寸。浮层跟随当前主题和表单尺寸，并限制在视口内。
    </p>
    <p>
      inline 直接嵌入同一套面板。option、suggestion 和 expand-icon
      接收原始节点、路径、层级与选中、展开、加载状态；header、footer
      可添加工具区。footer 接收
      items、clear、close。虚拟模式按列渲染固定行高的视口片段；默认行高随 sm /
      md / lg 使用 30 / 36 / 42px，自定义 itemHeight 应与模板内容匹配。
    </p>
  </section>
  <section class="notes">
    <h2>键盘、表单与实例方法</h2>
    <p>
      上下键在同列浏览，Home / End
      到首尾，右键展开并进入子列，左键返回父列；禁用项会跳过。Enter
      选择末级，严格模式或多选可用 Space
      切换。搜索输入框保留文本编辑键，方向键可进入结果。Esc
      关闭浮层并恢复触发器焦点。内嵌面板保留相同的逐级导航。
    </p>
    <p>
      组件继承 HysForm
      的尺寸与禁用状态，字段标签关联整个选择器，校验描述和错误状态绑定到实际控件；内部搜索和前缀控件不会代替字段触发校验。change
      是选择请求，value-change 和表单 change
      校验只在宿主接受后发生。validateEvent=false 可以关闭主动校验。
    </p>
    <p>
      getSelectedItems 读取完整回填信息，getCheckedNodes
      获取当前已加载的选中原始节点。setValue、clear、removeTag
      返回宿主是否接受；setExpandedPath
      打开面板、逐级加载并浏览而不改变选择，scrollTo
      同时打开和定位，支持虚拟列。reloadNode 与 reloadRoot
      显式刷新异步数据。页面缓存保留选择与已加载数据；重新打开时定位已有选择，受控
      expandedPath
      可保留指定浏览路径，清理浮层、悬停定时器、观察器和未完成的请求。
    </p>
  </section>
</template>
