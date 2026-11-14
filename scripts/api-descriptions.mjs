const controlledModels = {
  HysAccordion: '新的展开面板标识列表，手风琴模式最多包含一项',
  HysCheckbox: '切换后的勾选值，按配置返回布尔值、映射值或更新后的数组',
  HysCheckboxGroup: '新的勾选值数组，包含这次切换后的全部已勾选项',
  HysColorTokenEditor: '修改颜色后的令牌映射，键为颜色名称',
  HysCronEditor: '编辑后的 Cron 表达式字符串',
  HysDrawer: '抽屉请求显示或关闭后的布尔状态，与 open 属性绑定等价',
  HysFileManager: '文件清单的模型更新通道，上传、移除与下载由对应事件交给业务处理',
  HysGantt: '接受任务编辑、移动或依赖变更后的任务数组',
  HysInput: '发布解析后的原始文本。lazy 在确认或失焦时发布，trim 和 number 由 Vue 处理',
  HysJsonEditor: '文本编辑或格式化后的 JSON 文本，手动编辑期间可包含尚未有效的 JSON',
  HysMention: '提及插入、删除或普通编辑后的纯文本字符串，实体数据通过 update:entities 提供',
  HysModal: '对话框请求显示或关闭后的布尔状态，与 open 属性绑定等价',
  HysNumberInput: '接受输入或步进后的值，按配置返回数字、十进制字符串或空值',
  HysOrgTree: '激活的组织节点 id，勾选变化通过 update:checkedKeys 提供',
  HysPermissionMatrix: '权限修改后的完整映射副本，键格式为资源名:角色名',
  HysRadio: '当前选中的单选值，取该单选项的 value',
  HysRadioGroup: '本次选中的单选值，保留选项原有的字符串、数字或布尔类型',
  HysRating: '提交的评分值，精度由评分步长与半星配置决定',
  HysResizablePanel: '调整后的面板宽度，单位为像素',
  HysRichTextEditor: '编辑区更新后的 HTML 字符串',
  HysSearch: '输入或清空后的关键词字符串，搜索触发时机由 trigger 控制',
  HysSegmented: '本次选中的分段选项值',
  HysSelect: '选择、移除或清空后的值，多选返回数组，labelInValue 开启时选中项包含值和标签',
  HysSlider: '调整后的滑块值，范围模式返回两个端点组成的数组',
  HysSortableList: '排序后的完整列表，宿主可使用它同步项目顺序',
  HysSplitPane: '双面板模式下首个面板的新比例，范围为 0 至 100',
  HysSwitch: '切换后的开关值，分别取 activeValue 和 inactiveValue',
  HysTabs: '通过切换检查后的页签标识，保留字符串或数字类型',
  HysTextarea: '发布解析后的原始文本。lazy 在原生 change 或失焦时发布，trim 和 number 由 Vue 处理',
  HysTour: '引导请求打开或关闭后的布尔状态，适用于默认 v-model',
  HysTransfer: '移动完成后的目标面板值列表，按目标面板顺序排列',
  HysTree: '当前激活的节点标识，勾选变化通过 update:checkedKeys 提供',
  HysTreeSelect: '接受选择或清空后的值，按单选、多选和 labelInValue 配置输出',
};

const fieldEvents = {
  focus: '输入控件获得焦点时触发，参数为原生 FocusEvent',
  blur: '输入控件失去焦点时触发，参数为原生 FocusEvent',
};
const textInput = {
  props: {
    readonly: '允许聚焦、选择和复制文本，禁止输入与清空',
    error: '显示字段错误文字，同时设置错误状态并关联到输入控件',
    autocomplete: '传给原生输入控件的 autocomplete，可设为 off 或表单填充标识',
    size: 'sm、md、lg，也接受 small、middle、default、large。未设置时继承表单尺寸',
  },
  events: {
    ...fieldEvents,
    keydown: '原生控件上的 KeyboardEvent，包含输入法组合状态；preventDefault 可阻止 pressEnter',
    mouseenter: '指针进入组件外层时触发，参数为原生 MouseEvent',
    mouseleave: '指针离开组件外层时触发，参数为原生 MouseEvent',
  },
  exposed: {
    element: '实际接收输入的原生元素，与 input 一致，挂载前为 undefined',
    input: '实际接收输入的原生元素，挂载前为 undefined',
    textarea: '多行模式下的原生 textarea，其他模式及挂载前为 undefined',
    isComposing: '中文等输入法是否处于组合输入阶段',
    passwordVisible: '当前受控或内部的密码可见状态',
    textareaStyle: '自动高度计算出的 height 与 overflowY，未启用时为空对象',
    resize: '立即重新测量自动高度，Promise 在样式应用后结束',
    resizeTextarea: 'resize 的多行专用名称。开启 autosize 时可在外层布局变化后重新测量',
    focus: '聚焦原生输入控件，可传 FocusOptions 控制是否随焦点滚动',
    blur: '移除原生输入控件的焦点',
    select: '选中输入控件中的全部文本',
    clear: '清空可编辑的当前值，受控模式通过模型更新事件请求空字符串',
    setSelectionRange: '按 UTF-16 偏移设置选区起点、终点与可选方向',
    scrollTo: '使用原生 ScrollToOptions 滚动输入控件的内容区域',
  },
};

const annotations = {
  HysAccordion: {
    props: { headingLevel: '面板标题使用的原生标题级别，接受 2–6，默认 3。' },
    exposed: {
      getOpenKeys: '返回当前已展开面板键的副本。',
      expand: 'expand(key): Promise<boolean>。经 beforeToggle 请求展开，已展开、禁用或拦截时返回 false。',
      collapse: 'collapse(key): Promise<boolean>。经 beforeToggle 请求收起，已收起、禁用或拦截时返回 false。',
      focus: 'focus(key): boolean。聚焦可用面板的触发按钮，未知或禁用时返回 false。',
    },
    slots: {
    icon: '替换面板标题旁的展开图标，可根据展开状态改变方向',
    extra: '面板标题右侧的附加操作区域',
    content: '替换面板正文，按当前面板的数据渲染内容',
  } },
  HysAnimatedNumber: {
    props: {
      value: '目标值，缺省为 0。传十进制字符串可精确表示超大整数和极小小数。modelValue 优先',
    },
    events: {
      'update:modelValue': 'setValue(target) 请求写入 v-model，参数为新的业务目标值',
      'value-change': '业务目标实际变化，提供 previous、target、direction、delta、percent 与 significant。delta 与 percent 为十进制字符串，无法计算时为 null',
      threshold: '目标差值绝对值达到 changeThreshold 时触发，参数与 value-change 相同',
      start: '延迟结束后开始当前轮，参数为 HysNumberFrame',
      update: '动画采样或 seek 后触发，frame.value 是当前的原始数值',
      progress: '与 update 同一帧触发，progress 是 0–1 的线性时间比例，easedProgress 是缓动结果',
      pause: '调用 pause() 暂停时触发，参数为冻结的帧',
      resume: '调用 resume() 从手动暂停恢复时触发，参数为恢复时的帧',
      end: '最后一轮播放完成或 finishAnimation() 时触发，frame.value 精确等于当前轮终点',
      cancel: '活动播放被停止、重置、反转或替换时触发，参数为被保留的当前帧',
      loop: '进入下一轮时触发，frame.iteration 从 1 起算',
      change: '倒计时剩余时间更新时触发，参数为剩余毫秒数',
      finish: '当前倒计时到达截止时间时触发一次',
    },
    slots: {
      default: '自定义数值主体，接收 HysAnimatedNumberContext，优先于 formatter 属性',
      title: '替换统计标题，前后缀与数值主体仍使用各自插槽',
      prefix: '自定义数值前缀，替换 prefix 属性内容',
      formatter: '自定义数值主体，优先于默认插槽与 formatter 属性。接收当前帧、displayValue、unit、remaining 与 trend',
      suffix: '自定义数值后缀，替换 suffix 属性内容',
      unit: '替换自动缩写单位和 unit 文本，可读取当前格式化单位',
      digit: '替换单个数字位，接收 digit、从左到右的 index、位权 position、section、digitProgress 及完整数值上下文',
      trend: '在数值下方渲染业务趋势。percent 以旧值绝对值为基数，旧值为零时为 null',
    },
    exposed: {
      displayValue: '当前帧的格式化文本，含自动单位和 unit。倒计时返回剩余时间文本',
      remaining: '倒计时剩余毫秒数，最小为 0',
      frame: '当前帧快照，含 value、from、to、progress、easedProgress、direction、status 和 iteration',
      trend: '最近一次目标变化的差值、方向、相对变化百分比与阈值状态',
      setValue: '请求设置业务目标。v-model 接收更新。未提供 value 或 modelValue 时由组件保存目标',
      play: '恢复暂停的动画，继续停止后的当前值，或重播已完成的目标',
      pause: '冻结当前帧和延迟计时，保留排队目标',
      resume: '从手动暂停的位置继续播放',
      stop: '取消当前播放和等待项，保留当前帧',
      restart: '清空等待项并从 from 或当前播放序列的起点重播到最新目标',
      reset: '清空等待项并返回起点，进度归零',
      reverse: '从当前值向这一段的另一端播放，重新计时并清空等待项',
      seek: '跳转到 0–1 的原始进度。无活动播放时会创建一轮已暂停的播放',
      finishAnimation: '立即精确显示当前轮终点并结束其余循环，然后继续队列',
    },
  },
  HysBadge: {
    props: {
      round: '将徽章外形改为两端完全圆角',
      dot: '显示圆点标记，隐藏徽章计数文字',
      formatValue: '自定义计数文字，接收原值与 max 截断后的显示值，返回字符串。content 插槽优先。',
      announce: '计数或状态变化的 ARIA Live 优先级，默认 off。polite 等待空闲播报，assertive 立即播报。',
      announcement: '自定义播报文字。省略时使用原始计数或状态 text。仅在 announce 开启时生效。',
    },
    events: { 'update:checked': '点击可选徽章时请求切换按下状态，参数为新的布尔值' },
  },
  HysButton: {
    props: {
      variant: '设置主要、次要、危险、文字等语义外观，或选择 slate、blue、indigo、purple、cyan、teal、green、lime、amber、orange、red、pink 内置配色，优先于 type 和按钮组默认外观',
      size: '设置小号、中号或大号，支持 sm、md、lg 和 small、default、large，省略时继承按钮组或表单尺寸',
      loading: '进入忙碌状态并立即锁定操作，传 { delay } 可按毫秒延迟显示加载图标',
      loadingIcon: '显示加载时使用的图标组件或已注册的组件名，loading 插槽优先',
      loadingText: '加载图标出现时替换按钮正文，省略时沿用默认插槽',
      action: '点击后执行操作，可返回 Promise，收到点击事件、按下状态与 AbortSignal，执行期间锁定按钮并接管原生默认动作',
      beforeAction: '操作执行前调用，可返回 Promise，返回 false 时跳过 action',
      actionLoadingDelay: '异步 action 开始后显示加载图标的延迟，单位毫秒，等待期间仍禁止重复提交',
      toggle: '启用按下状态与 aria-pressed，配置 action 时在操作成功后请求切换',
      pressed: '当前受控按下状态，可配合 v-model:pressed 使用',
      defaultPressed: '非受控切换按钮的初始按下状态',
      plain: '用低饱和底色、边框和同色系文字绘制朴素按钮',
      round: '应用胶囊形圆角',
      circle: '应用圆形外观，只有图标时可通过 ariaLabel 提供可访问名称',
      shape: '用单个属性选择默认、胶囊形或圆形外观',
      block: '让按钮填满父容器的可用宽度',
      dashed: '将按钮边框改为虚线',
      color: '指定 CSS 色值覆盖内置配色，可用十六进制、rgb 或 CSS 变量',
      dark: '使用深色配色，未设置时从 HYS-UI 主题继承，适用于内置配色和自定义颜色',
      danger: '将当前外观的主色改为危险色，自定义 color 优先',
      ghost: '使用透明背景和当前主色的边框',
      text: '使用文字按钮外观，bg 可增加浅色底色',
      link: '使用链接样式，提供 href 时具备原生链接行为',
      bg: '为文字按钮增加背景色，填充和链接外观不使用此设置',
      icon: '图标组件或已注册的组件名，icon 插槽优先',
      iconPosition: '将常规图标放在正文左侧或右侧',
      type: '可指定语义外观或内置配色，也兼容 button、submit、reset 原生类型',
      nativeType: '控制原生按钮的 button、submit 或 reset 行为，优先于 type 中的原生类型',
      href: '导航目标地址，默认渲染为原生链接，禁用或忙碌时移除实际跳转地址',
      target: '设置链接打开的浏览上下文，例如 _blank 打开新标签页',
      rel: '设置链接关系，target 为 _blank 且省略此值时使用 noopener noreferrer',
      autofocus: '为根元素传递原生 autofocus 属性',
      focusable: '设为 false 时从 Tab 顺序移除，实例 focus 仍可调用',
    },
    events: {
      click: '可用按钮被指针或键盘激活时触发，参数为点击事件，可取消默认行为',
      'update:pressed': '启用切换时请求更新 pressed，参数为新的布尔值',
      pressedChange: '按下状态实际接受并改变后触发，参数为已生效的状态',
      actionSuccess: '未取消的 action 成功结束后触发，返回处理结果及操作上下文',
      actionError: '操作前检查或 action 抛错时触发，返回异常及操作上下文，取消信号导致的结果会被忽略',
    },
    slots: {
      default: '按钮正文，可放入文字或行内内容',
      icon: '替换常规图标，位置由 iconPosition 决定',
      loading: '替换忙碌图标，按配置的加载延迟显示',
      suffix: '在正文及右侧图标之后显示的内容',
    },
    exposed: {
      element: '当前渲染的原生根元素，挂载前为 undefined',
      ref: '当前渲染的原生根元素，与 element 指向同一节点',
      busy: '是否处于外部 loading 状态或内部异步操作中',
      disabled: '合并按钮、按钮组、表单禁用状态与加载状态后的锁定结果',
      size: '按钮实际使用的 sm、md 或 lg 尺寸',
      type: '继承与解析后实际使用的语义外观或内置配色',
      shouldAddSpace: '当前纯文本正文是否满足两字中文间距条件',
      cancelAction: '中止当前操作的 AbortSignal，并解除由该操作引起的忙碌状态',
      focus: '将焦点移到当前按钮或链接的根元素',
      blur: '移除当前按钮或链接根元素上的焦点',
    },
  },
  HysButtonGroup: {
    props: {
      variant: '向组内按钮提供默认语义外观或内置配色，按钮自身配置优先',
      type: '设置默认外观的兼容属性，组内 variant 优先',
      size: '向组内按钮提供默认尺寸，可在单个按钮上覆盖',
      direction: '按横向或纵向排列按钮，并在连接模式下调整相邻圆角',
      joined: '将相邻按钮的边框接合为一组，关闭后使用独立外观和间距',
      gap: '分隔模式下的按钮间距，数字使用像素，也可传 CSS 长度',
      wrap: '分隔模式下容器不足时允许按钮换行',
      block: '按钮组占满父容器，横向时各按钮平分可用宽度',
      disabled: '禁用组内按钮，同时继承所属表单的禁用状态',
    },
    slots: { default: '要排列的 HysButton 子项，可在各按钮上覆盖尺寸与外观' },
  },
  HysCalendarNavigation: {
    props: {
      month: '当前显示月份，读取 Date 的 UTC 年月。',
      min: '最早允许进入的月份，传入合法 YYYY-MM-DD，包含指定日期所在月。',
      max: '最晚允许进入的月份，传入合法 YYYY-MM-DD，包含指定日期所在月。',
      locale: '月份短名称的 BCP 47 语言标签，省略时显示 1月 至 12月。',
      disabled: '禁止导航和切换选择面板，默认 false。',
      showToday: '显示回到本月按钮，默认 false。本月超出 min/max 时禁用。',
      today: '回到本月的基准 Date，默认取操作时的当前时间，按 UTC 年月读取。',
    },
    events: {
      'update:month': '请求更新月份，载荷为目标月首日 00:00 UTC。仅在目标月变化且在范围内时触发。',
      navigate: '有效的月份变更请求触发，依次返回目标 Date 与来源 previous、next、month、year 或 today。',
      viewChange: '切换日期、月份或年份选择面板时触发，返回 days、months 或 years。',
    },
    slots: { default: '日期视图的正文，接收 { month: Date }。选择月份或年份时切换到对应面板。' },
  },
  HysCard: {
    props: {
      subtitle: '标题下方的补充文字',
      bordered: '是否绘制卡片外框',
      size: '调整卡片标题、正文和页脚的留白',
      collapsible: '在卡片标题区显示折叠按钮，默认 false。收起时隐藏页签、正文、底部操作和页脚，保留已挂载内容。',
      collapsed: '受控折叠状态，可配合 v-model:collapsed。',
      defaultCollapsed: '非受控的初始折叠状态，默认 false。',
      collapseLabel: '展开状态下的按钮文字，默认“收起卡片内容”。',
      expandLabel: '收起状态下的按钮文字，默认“展开卡片内容”。',
      fullscreenable: '在标题区显示进入全屏的按钮，默认 false。已全屏的卡片始终保留退出按钮。',
      fullscreen: '受控全屏状态，可配合 v-model:fullscreen。全屏时卡片覆盖网页视口。',
      defaultFullscreen: '非受控的初始全屏状态，默认 false。',
      fullscreenTransition: '全屏进入与退出的缩放过渡，默认 true。设为 false 时立即切换，系统减少动态效果和 HYS-UI 的 motion: off 也会关闭过渡。',
      fullscreenLabel: '进入全屏按钮的无障碍名称与悬停提示，默认“全屏查看卡片”。',
      exitFullscreenLabel: '退出全屏按钮的无障碍名称与悬停提示，默认“退出卡片全屏”。',
    },
    events: {
      'update:activeTab': '选择可用页签时请求更新 activeTab，参数为该页签的 value',
      'update:collapsed': '点击折叠按钮时请求更新 collapsed，载荷为目标布尔值。',
      collapseChange: '点击折叠按钮时触发，载荷为本次请求的折叠状态。',
      'update:fullscreen': '按钮、Esc 或实例方法请求切换时触发，载荷为目标全屏状态。',
      fullscreenChange: '本次切换请求生效后触发，载荷为当前全屏状态。事件在过渡完成前触发。',
    },
    slots: { 'collapse-toggle': '替换折叠按钮的内容，接收 { collapsed: boolean }。只渲染文字或图标。' },
    exposed: {
      element: '卡片的原生根元素，挂载前为 undefined。',
      fullscreen: '当前是否全屏。',
      setFullscreen: '请求进入或退出全屏。返回 Promise<boolean>，为 true 时表示本次请求已改变状态。',
      toggleFullscreen: '请求切换当前全屏状态。返回 Promise<boolean>，为 true 时表示本次请求已改变状态。',
    },
  },
  HysChart: { props: {
    data: '单系列数据，按绘图顺序提供 { label, value, color?, x? }。忽略非有限数值，散点横坐标省略时使用从 1 开始的原始点序号。',
    series: '多系列数据，提供 { id?, name, data, color?, type?, dashed? }。id 在图内唯一。优先于 data。分类图按标签对齐，重复标签按出现次序匹配。饼图和环形图取第一系列的正数。type 在组合图中可设 bar、line 或 area。',
    type: '默认 bar。可选 bar、horizontal-bar、line、area、pie、donut、scatter、combo。',
    height: '绘图区高度，单位为像素。默认 220，最小 48。',
    showValues: '在数据点旁显示数值，默认 false。',
    showTable: '显示同一组数据的语义表格，默认 false。',
    showLegend: '控制点击图例。默认多序列和饼图、环形图显示。切换时隐藏对应系列或扇区。',
    showGrid: '设置坐标网格线，默认 true。',
    showTooltip: '悬停、聚焦或选中图形时显示数据提示，默认 true。',
    stacked: '堆叠柱体，默认 false。支持柱状图、横向条形图和组合图中的柱体。正负值分别堆叠。',
    smooth: '绘制平滑折线和面积边界，默认 false。',
    barStyle: '可选 solid、gradient、outline，默认 solid。',
    innerRadius: '环形图内圈半径占外圈半径的比例，默认 0.64，限制在 0.2–0.85。',
    colors: '覆盖默认色板，按序循环。点的 color 优先于系列颜色和色板。',
    valueFormatter: '格式化数值，接收 (value, point)，用于图上标签、提示和数据表。',
    axisFormatter: '格式化数值坐标轴刻度，接收 (value, axis)，axis 为 x 或 y。',
    ariaLabel: '图形区域的无障碍名称，默认“图表数据”。',
    references: '多条数值参考线，叠加到 reference，适用于带坐标轴的图表。可提供 color。',
    emptyText: '无有效数据时显示的文案，默认“暂无图表数据”。',
  }, events: {
    'point-click': '点击数据图形或聚焦后按 Enter、空格触发。载荷包含 point、series、从 0 开始的 pointIndex 和 seriesIndex，饼图带 percentage（0–1），散点图带 x。',
    'legend-change': '点击图例后触发，载荷为 { key: string, visible: boolean }。',
  }, slots: { title: '绘图区上方标题。', empty: '替换无数据提示。', center: '环形图中心展示内容。' } },
  HysColorTokenEditor: {
    props: {
      labels: '颜色键到显示名的映射，省略时显示颜色键。',
      defaults: '颜色键到默认色值的映射，为对应的颜色提供重置按钮。',
      lockedKeys: '锁定调色和重置的颜色键数组。',
      disabled: '禁用所有颜色修改，默认 false。',
    },
    events: { change: '通过选色或重置改变颜色时触发，载荷为颜色键、新值和原值。' },
  },
  HysCommandPalette: {
    props: {
      actions: '命令数组。id 唯一，label 为显示名，description 与 keywords 参与搜索。disabled 为 true 时保留展示并跳过键盘选择。',
      hotkey: '打开和关闭浮层的按键，与 Ctrl 或 Command 组合，默认 k。false 关闭全局快捷键。',
      placeholder: '搜索框的占位文案，默认“搜索操作…”。',
      emptyText: '搜索无匹配项时的文案，默认“没有匹配的命令”。',
    },
    events: { select: '确认当前命令时触发，参数为被选中的命令 id' },
    slots: { action: '自定义选项内容，接收 { action, active }。' },
    exposed: { open: '打开浮层并聚焦搜索框。', close: '关闭浮层。' },
  },
  HysCommentEditor: {
    props: {
      comments: '评论数组，每条包含 id、author、text、time? 和 removable?。removable 为 false 时隐藏删除按钮。',
      draft: '评论草稿，可配合 v-model:draft。默认空字符串，发送时请求清空。',
      maxLength: '允许的最大 Unicode 码点数，省略时无上限。超限时保留草稿并阻止发送。',
      submitting: '发送中状态，禁用发送和删除按钮。默认 false。',
      disabled: '禁用输入和操作，默认 false。',
      placeholder: '草稿占位文字。默认提示 Ctrl 或 Command + Enter 发送。',
    },
    events: {
      send: '点击发送或使用 Ctrl / Command + Enter 时触发，返回去除首尾空格后的非空草稿。',
      'update:draft': '输入或发送清空时请求更新草稿，载荷为新文本。',
      remove: '点击删除时发出评论 id，由宿主更新评论列表',
    },
  },
  HysCronEditor: {
    props: {
      presets: '自定义预设，包含 { label, value }。省略时显示内置预设，传空数组隐藏预设按钮。',
      disabled: '禁用输入和预设按钮，默认 false。',
      readonly: '保留文本选择，禁止修改和选择预设，默认 false。',
    },
    exposed: { validate: 'validate(): boolean。验证五段数字格式、各段边界、范围与步长。' },
  },
  HysDataGrid: {
    props: {
      showToolbar: '显示搜索、分组与列设置工具栏，默认 true。',
      pagination: '显示分页栏，默认 true。设为 false 时，本地数据全部显示；服务端模式仍使用宿主提供的数据。',
      rowNumbers: '显示固定在左侧的行号列，默认 false。行号按数据源位置计算，行号列不参与选择或编辑数据单元格。',
      columns: '列定义。group 为 { key, label }，相邻同组且在同一固定区域的列合并表头。headerAlign 单独控制表头对齐，headerWrap 开启换行，pinnable: false 锁定 pinned 配置。',
      caption: '可见的原生表格标题。省略时不渲染 caption。',
      striped: '启用数据行斑马纹，默认 false。',
      highlightCurrentRow: '点击数据行正文时设置当前行并高亮，默认 false；当前行与勾选状态独立。',
      currentRowKey: '当前行的受控键，支持 v-model:currentRowKey，null 清除当前行。',
      defaultCurrentRowKey: '非受控模式的初始当前行键，省略时无当前行。',
      rowClassName: '行类名或 (context) => string | undefined。上下文包含 row、rowKey、index、pageIndex、depth、selected、current。',
      rowStyle: '行 CSSProperties 或接收行上下文的回调，适合设置行高和 CSS 变量。',
      cellClassName: '单元格类名或接收单元格上下文的回调；在行上下文基础上增加 column、columnIndex、value。',
      cellStyle: '单元格 CSSProperties 或接收单元格上下文的回调；固定位置与列对齐由组件设置。',
      cellSpan: '返回单元格的行跨度与列跨度，rows 为 0 时省略被覆盖的单元格。',
      cellTooltip: '默认显示原值的浏览器提示。设为 false 可由单元格插槽提供提示。',
      virtualRows: '启用行窗口，height 返回每行高度，overscan 为视口两侧保留的行数。',
      virtualColumns: '启用数据列窗口。固定列持续渲染。',
      headerClassName: '表头类名或接收 { column, columnIndex, sort, filter, pinned } 的回调。',
      headerStyle: '表头 CSSProperties 或接收表头上下文的回调；固定位置与表头对齐由组件设置。',
      commitColumnWidth: '可选回调 (key, width) => boolean，接收拖动松手、键盘调整和 resizeColumn 产生的列宽，单位为 px，已按列的 minWidth 和 maxWidth 限制。提供回调时，宿主通过 columns 更新宽度并返回是否接受；默认由网格保存。',
      fillRemainingWidth: '默认 false。开启后，用一列不可交互的空白填满数据列右侧的剩余宽度，数据列保留设定的宽度。',
      contextMenu: '默认保留浏览器菜单。true 启用表头、行和单元格内置菜单。回调 (context, items) 可增删菜单项，返回 false 或空数组时保留浏览器菜单。支持右键和 Shift+F10。',
      headerMenuButton: '默认 true，启用右键菜单时显示表头的更多按钮。设为 false 后可通过右键或 Shift + F10 打开表头菜单。',
      keyboardNavigation: '启用当前页键盘行导航，默认 false。方向键移动，Home/End 到首末可见行，Enter 触发行点击，空格切换可选行。',
      cellNavigation: '启用可见数据单元格的键盘导航，默认 false。开启后表体使用单元格焦点。方向键移动，Home / End 到行首 / 行尾，Ctrl 或 Command + Home / End 到当前可见数据的首 / 末单元格。F2 编辑允许编辑的单元格。内嵌控件保留自己的按键操作。',
      emptyCellText: '默认单元格内容遇到 null、undefined 或空字符串时显示的文字，省略时为空。列 emptyText 优先，0 和 false 按原值显示。',
      editable: '启用内置编辑，默认 false。列 editable 可为布尔值或 (context: HysDataGridCellContext) => boolean。回调用于单元格编辑、右键菜单及批量编辑校验。',
      groupBy: '受控分组列 key，配合 v-model:groupBy。空字符串清除分组；按当前页数据分组。',
      defaultGroupBy: '非受控的初始分组列 key，默认不分组。',
      groupSummary: '在各组标题中显示声明了 summary 的列小计，按当前页该组记录计算，折叠后仍显示。',
      summaryScope: '表尾汇总范围。filtered（默认）为全部本地筛选结果；page 为当前页；selected 为已选且当前已加载的记录。',
      selectable: '显示行选择列，支持受控选中键及单选或多选',
      density: '设置数据行的显示密度，影响表格单元格的垂直留白',
      stickyHeader: '滚动表格时将列标题保持在顶部',
      groupable: '启用列分组交互，按指定列组织显示记录',
      showSummary: '显示表格底部的汇总行',
      treeMode: '按层级显示数据，支持父子关系及行展开',
      parentKey: '扁平树数据中指向父行键的字段名',
    },
    events: {
      'update:groupBy': '请求切换分组列，载荷为列 key，空字符串表示清除。',
      groupChange: '实际分组列变化时触发，载荷为列 key。',
      columnLayoutChange: '列顺序、显隐、宽度或固定状态变化后返回快照 { order, hidden, widths, pins? }。',
      'update:currentRowKey': '请求更新当前行，载荷为行键或 null。',
      currentChange: '当前行键实际变化时触发，载荷为新键和旧键。',
      headerClick: '点击表头，载荷为表头上下文和 MouseEvent。',
      headerContextmenu: '右键点击数据列表头，载荷为表头上下文和 MouseEvent。可调用 preventDefault() 拦截内置菜单。',
      rowDblclick: '双击数据行，载荷为行上下文和 MouseEvent。',
      rowContextmenu: '右键点击数据行或单元格，载荷为行上下文和 MouseEvent。',
      cellClick: '点击单元格，载荷为单元格上下文和 MouseEvent。',
      cellDblclick: '双击单元格，载荷为单元格上下文和 MouseEvent。可调用 preventDefault() 拦截内置编辑。',
      cellKeydown: '数据单元格本身收到未处理的 Enter 或 F2 时发出，载荷为单元格上下文和 KeyboardEvent。可通过 preventDefault() 拦截后续内置编辑。',
      cellContextmenu: '右键点击单元格，载荷为单元格上下文和 MouseEvent。可调用 preventDefault() 拦截内置菜单。',
      cellMouseEnter: '鼠标进入数据单元格时触发，载荷依次为 HysDataGridCellContext 和原生 MouseEvent。',
      cellMouseLeave: '鼠标离开数据单元格时触发，载荷依次为 HysDataGridCellContext 和原生 MouseEvent。',
      contextMenuSelect: '选择菜单项后触发，返回操作键、包含 type 的表头/行/单元格上下文和 HysMenuSelectInfo。自定义操作由宿主处理。',
      rowClick: '点击数据行时返回该行原始记录',
      columnsChange: '列布局发生变化时返回按显示顺序排列的可见列键',
      sortChange: '有效排序变化时返回首个排序规则，清除时返回 null',
      pageChange: '有效页码变化后触发，参数为新的页码',
      pageSizeChange: '有效每页条数变化后触发，参数为新的页大小',
      cellEdit: '按 Enter 或离开编辑框时触发，载荷为 { row, rowKey, column, value }。value 为新文本，应用更新由调用方处理。Esc 放弃编辑。',
      batchEdit: '提交批量编辑时触发，载荷为 { keys, column, value }。keys 仅包含符合列编辑权限的选中行，value 为新文本。',
    },
    slots: {
      'header-group': '自定义组表头内容，接收 group、columns 和 pinned。',
      'header-cell': '自定义数据列表头标签，接收表头上下文。列专属 header-[column.key] 插槽优先。',
      'body-cell': '自定义数据单元格内容，接收单元格上下文。列专属插槽优先。',
      'toolbar-actions': '在工具栏末尾追加操作。接收当前查询 query 和已选行键 selectedKeys。',
      'row-number': '自定义行号内容，仅 rowNumbers 开启时渲染，接收行上下文。',
      'row-number-header': '自定义行号表头，仅 rowNumbers 开启时渲染。',
      empty: '无数据记录时替换表体空状态',
      error: '远程数据加载失败时替换表体错误提示',
    },
    exposed: {
      getColumnLayout: '返回列顺序、隐藏列、像素宽度覆盖与可选 pins 的独立快照。pins 中的 null 表示取消该列的默认固定状态。',
      applyColumnLayout: '应用列布局预设。省略字段恢复默认，忽略未知列，保留不可隐藏列和锁定的固定状态，列宽按约束限制。',
      getCurrentRowKey: '返回当前行键；没有当前行时返回 null。',
      setCurrentRow: '按已加载行的键设置当前行。传 null 清除，未知键会被忽略；受控时由宿主接收更新。',
      setColumnVisibility: '按列 key 显示或隐藏列。遵守 hideable 与至少保留一列的约束。实际变化时返回 true。',
      pinColumn: '按列 key 固定到 left / right，或传 null 取消固定。遵守 pinnable，实际变化时返回 true。',
      resizeColumn: '按列 key 设置像素宽度，按 minWidth/maxWidth 限制。遵守 resizable，实际变化时返回 true。',
      resetColumnWidth: '移除指定列的宽度覆盖并恢复声明宽度。存在覆盖时返回 true。',
      setGroupBy: '请求切换到指定列分组，空字符串清除分组，受控时由宿主接收更新。',
      setGroupsExpanded: '展开或折叠当前页所有分组，接受布尔值。',
      focusRow: '按行键聚焦当前可见数据行。cellNavigation 开启时定位到行首数据单元格，否则需要开启 keyboardNavigation。无法定位时返回 false。',
      focusCell: 'focusCell(rowKey: string | number, columnKey: string, focus = true): boolean。cellNavigation 开启时定位单元格。传入 false 只滚动到目标位置，保留当前焦点。',
      isCellVisible: '根据当前数据视图检查该行键和列键对应的单元格是否存在。受分页、折叠、列显隐和加载状态影响，无需开启键盘导航。',
      getCellView: '读取当前页可见数据行与列的键序列及 getCell(rowKey, columnKey) 查询方法。分组标题与汇总行不参与，加载或失败时返回 undefined。',
    },
  },
  HysScrollbar: {
    props: {
      height: '滚动区域的高度。有限数值以像素计，负数按 0 处理，也接受 CSS 长度。默认随内容和布局。',
      maxHeight: '滚动区域的最大高度。有限数值以像素计，负数按 0 处理，也接受 CSS 长度。默认无限制。',
      direction: 'both（默认）允许双向滚动，vertical 允许纵向滚动，horizontal 允许横向滚动。',
      tabindex: '滚动区域的键盘焦点顺序，接受数字或数字字符串，默认 0。传 null 省略该属性。',
      id: '内容视图的 ID。',
      role: '赋予内容视图的 ARIA 角色。',
      ariaLabel: '为内容视图的自定义角色命名。省略 role 时，为可聚焦的滚动区域命名并赋予 region 角色。',
      ariaOrientation: 'ARIA 方向，接受 horizontal、vertical 或 undefined。指定 role 时应用到内容视图。',
      native: '默认 false，显示 HYS-UI 自定义滑块和轨道。设为 true 时使用系统滚动条，边缘遮罩和事件仍然可用。',
      wrapClass: '应用到实际滚动容器的类名，支持 Vue 的字符串、对象及数组格式。',
      wrapStyle: '应用到实际滚动容器的样式，支持 Vue 的字符串、对象及数组格式。',
      viewClass: '应用到内容视图的类名，支持 Vue 的字符串、对象及数组格式。',
      viewStyle: '应用到内容视图的样式，支持 Vue 的字符串、对象及数组格式。',
      tag: '内容视图的 HTML 标签，默认 div。例如可用 ul 包裹列表项。',
      always: '默认 false，鼠标悬停或拖动滑块时显示。启用后，有内容溢出时始终显示自定义滚动条。',
      noresize: '默认 false。启用后暂停自动检测尺寸和内容变化，调用 update 可手动刷新。',
      minSize: '自定义滑块长度的下限，单位为 CSS 像素，默认 20。过大的值会按轨道长度限制。',
      distance: '触边事件的提前量，使用非负 CSS 像素数，默认 0。只影响事件。',
      mask: '默认 false。true 启用所有可继续滚动的边缘遮罩，也可用 top、bottom、left、right 仅启用一侧。左右为物理方向。',
    },
    events: {
      scroll: '浏览器滚动或调用 handleScroll 时发送 { scrollTop, scrollLeft }，单位为 CSS 像素，坐标沿用浏览器定义。',
      'end-reached': '朝某个边缘滚动并进入 distance 像素内时，发送 top、bottom、left 或 right。离开该范围后可以再次触发。',
    },
    slots: { default: '滚动区域内的内容。' },
    exposed: {
      viewport: '滚动区域的 HTML 元素，挂载前为 null。',
      wrapRef: '实际滚动容器的 HTML 元素，是 viewport 的别名。',
      handleScroll: '读取当前位置、同步滑块与遮罩，并发送 scroll 和满足条件的 end-reached 事件。',
      scrollTo: '调用 scrollTo(options) 或 scrollTo(left, top) 滚动到指定坐标。options 支持 top、left 和 behavior。',
      scrollBy: '按 ScrollToOptions 从当前位置滚动指定距离，支持 top、left 和 behavior。',
      setScrollTop: '设置纵向滚动坐标，单位为 CSS 像素。',
      setScrollLeft: '设置横向滚动坐标，单位为 CSS 像素，数值方向沿用浏览器定义。',
      update: '手动刷新滑块和遮罩，适用于禁用自动尺寸检测的滚动区域。',
    },
  },
  HysSpreadsheet: {
    props: {
      modelValue: '受控工作簿。通过 v-model 接收不可变更新，公式以等号开头的字符串保存。',
      defaultWorkbook: '非受控工作簿的初始值。默认创建 8 行 6 列的空表。',
      activeSheet: '受控工作表 ID。省略时内部管理，未知 ID 回退到首张工作表。',
      readonly: '默认 false。启用后仍可切换工作表、选择和复制。',
      showEditActions: '默认 false。文本和数字类编辑器支持 Enter 提交。日期和日期时间进入编辑时打开日历，日期点选后提交，日期时间在面板确认后提交。单选和布尔值在选定后提交，多选用「应用多选」提交。设为 true 时显示确认和取消按钮。多行文本用 Enter 换行，Ctrl / ⌘ + Enter 提交。',
      locale: '数字格式使用的语言区域，默认 zh-CN。',
      currency: '货币格式使用的 ISO 4217 代码，默认 CNY。',
      maxHeight: '普通视图中表格滚动区的最大高度，数字单位为 px，默认 360。全屏时随可用高度伸缩。',
      historyLimit: '最多保留的撤销记录数，默认 50，范围 0–100。0 关闭历史。',
      persistence: '工作簿读写适配器。load 和 save 接收 AbortSignal。配置时优先使用适配器。',
      storageKey: '浏览器本地存储键。省略时不使用本地存储。',
      autosave: '最后一次变更后的自动保存延迟，单位毫秒。默认关闭，须配置保存目标。',
      sheetTemplates: '按模板名称索引的工作表初始配置。通过工作表管理创建新表。',
      styleTemplates: '自定义单元格样式模板。通过 applyStyle 按名称应用。',
      formulaFunctions: '按名称索引的自定义公式函数。参数为单值或一维区域，数组结果向下溢出。',
      validators: '按名称索引的同步校验器。返回 false 或错误文案可拒绝提交。',
      cellTypes: '自定义单元格类型的草稿转换和解析规则，使用 cells[address].typeName 选择。',
      filters: '自定义筛选规则。由 filter.rule 指定名称，返回 true 保留当前行。',
      compare: '自定义排序比较函数。排序规则 by 为 custom 时使用。',
      formatValue: '自定义显示文本。参数包含单元格坐标、计算结果与默认文本。',
      author: '批注与本地版本的作者名称。',
      collaboration: '协作传输适配器，连接工作簿更新、选区和冲突反馈。',
      shortcuts: '按组合键索引的快捷操作，例如 Mod+Shift+k。回调接收组件实例。',
      contextMenu: '自定义单元格右键菜单及命令处理。false 关闭菜单。',
      dataSource: '按需加载标记为 unloaded 的工作表。切换工作表会取消未完成的请求。',
      fileFormats: '按文件扩展名提供自定义解码和 Blob 导出，默认支持 JSON 和 XLSX。提供同名扩展可覆盖对应的读写方法。',
      plugins: '挂载时安装的扩展。install 可返回卸载函数。',
      theme: '组件主题，可选 light、dark。省略时沿用库主题配置。',
      messages: '按原始文案索引的显示文案覆盖，例如 { 保存: "Save" }。',
    },
    events: {
      'update:modelValue': '编辑、粘贴、格式、结构或历史操作后发出新的工作簿。',
      'update:activeSheet': '请求切换工作表时发出目标 ID。',
      change: '工作簿变更时发出快照及原因 edit、paste、format、structure、undo、redo 或 open。',
      selectionChange: '选区变化时发出工作表 ID 和两个 A1 坐标，清空时为 null。',
      save: '适配器或本地存储成功写入时发出保存的工作簿。',
      open: '成功打开文件、对象或持久化工作簿时发出工作簿。',
      persistenceError: '打开或保存失败时发出操作名称与异常。',
      validationError: '批量或主动校验发现问题时发出以 A1 坐标为键的错误字典。',
      audit: '记录工作簿变更、保存或恢复时发出版本快照。',
      conflict: '收到协作冲突或取消正在进行的编辑时发出消息。',
    },
    exposed: {
      getWorkbook: '读取当前工作簿快照。',
      getSelection: '读取当前选区的工作表 ID 和 A1 坐标，无选区时返回 null。',
      selectRange: '按两个 A1 坐标选择矩形区域，省略第二个坐标时选中一格。坐标无效或超出表格时返回 false。',
      selectAll: '选择当前工作表的所有数据单元格，成功返回 true。',
      getSelectionSummary: '返回选区的格数、非空数、数值数、求和、平均值、最小值和最大值。无选区返回 null，无数值时 average、min、max 为 null。',
      undo: '撤销最近一次操作。没有历史记录或只读时返回 false。',
      redo: '重做最近一次撤销的操作。没有可重做记录或只读时返回 false。',
      setSheet: '按工作表 ID 切换。找不到该工作表时返回 false。',
      manageSheet: '新增、删除、复制、移动、重命名、隐藏、着色或保护工作表。',
      newWorkbook: '创建空白工作簿并清空撤销栈，可指定名称。',
      openWorkbook: '载入指定对象，省略参数则从适配器或浏览器存储载入。',
      importWorkbook: '按文件扩展名打开工作簿。成功后发出 open，失败后保留原工作簿并发出 persistenceError。返回 Promise<boolean>。',
      exportWorkbook: '导出当前工作簿快照为 Blob。默认扩展名为 xlsx，也支持 json 或 fileFormats 注册的格式。',
      saveWorkbookFile: '触发浏览器下载，默认格式为 xlsx，第二个参数可指定文件名。发出 save 或 persistenceError。',
      saveWorkbook: '将当前快照保存到已配置的目标，返回 Promise<boolean>。',
      saveWorkbookAs: '返回可另存的工作簿快照，可覆盖名称。',
      recalculate: '重新计算公式。手动计算模式可由调用方触发。',
      manageAxis: '操作行列，参数索引从 0 开始。支持结构、布局、分组和冻结。',
      setCells: '提交一批从 0 开始的行列坐标及值，整批验证并作为一个历史操作。',
      editSelection: '接收一个字符串草稿，按各目标格的编辑类型解析。公式以选区锚点为基准调整相对引用。整批校验，只读、校验失败或无选区时返回 false。成功时发出一次 edit 变更，可一次撤销。',
      configureCells: '合并当前选区的类型、保护、链接、备注或验证配置。',
      formatCells: '合并选区格式。传入 null 清除格式。',
      validateCells: '验证当前工作表中配置过的单元格，返回错误字典。',
      fill: '向下或向右填充连续可见选区。默认 copy 复制首行或首列并调整相对公式引用。series 延伸数字或日期步长，smart 也支持编号和从相邻示例推断文本。第三个参数可传入循环序列。成功时发出一次 edit 变更。',
      paste: '把 TSV 粘贴到连续选区，最多 10,000 格。默认 all，另有 values、formulas、formats、transpose。复制自组件时可使用公式结果和原格式，外部 TSV 可提供原始值和公式。成功时发出一次 paste 变更。',
      manageData: '按条件排序、筛选、去重、分列、合并文本或分类汇总。',
      setConditionalFormats: '替换当前工作表的条件格式规则，传入空数组清除。',
      copyConditionalFormats: '将来源区域内的规则复制到目标 A1 坐标，平移规则范围及相对公式引用。',
      applyStyle: '将 title、amount 或自定义模板应用于选区。',
      find: '在当前工作表的可见单元格中查找，返回匹配的 A1 坐标。options 支持 matchCase、wholeCell、formulas、wildcards、A1 ranges，以及 order（默认 row，按列为 column）。',
      replace: '使用与 find 相同的匹配选项替换，并一次提交。含有受保护单元格或校验失败时整批拒绝。',
      mergeCells: '合并选区。首格保持可编辑，其余单元格随解除合并恢复显示。',
      unmergeCells: '取消与选区相交的合并。',
      getVersions: '读取当前组件的版本记录。',
      compareVersions: '按版本 ID 对比单元格内容，省略第二个 ID 时与当前工作簿对比。',
      restoreVersion: '恢复历史版本，可撤销恢复操作。',
      addComment: '在活动单元格添加批注。传入父批注 ID 可回复。',
      resolveComment: '更新活动单元格的批注状态，默认标记为已解决。',
      defineName: '设置命名区域，默认使用当前选区和工作表。空范围删除名称。',
    },
    slots: {
      toolbar: '替换默认工作簿入口和快捷工具。工作表管理、单元格设置、批注、版本记录与更多操作保留在工具栏。作用域包含工作簿、选区与组件实例。',
      'toolbar-actions': '在工具栏加入操作，作用域包含工作簿与选区。',
      status: '扩展状态栏，作用域包含选区、统计和未保存状态。',
      'status-bar': '替换底部状态区的内容，右侧缩放仍可用。作用域包含选区、统计和未保存状态。',
      cell: '覆盖单元格渲染，作用域包含坐标、值、显示文本和错误。',
      editor: '渲染 custom 类型的编辑器，作用域提供草稿、提交和取消函数。',
    },
  },
  HysProGrid: {
    props: {
      rows: '宿主拥有的原始记录。保存成功后通过 cellCommit 更新。活动单元格的行对象或原始值变化时取消编辑。',
      columns: '继承 DataGrid 列配置，并支持 render、editor、canEdit、validate。列 key 应唯一；编辑过程中保留活动列配置对象的身份。',
      rowKey: '稳定的字符串或有限数字行标识，接受字段路径或 (row) => key。缺失或重复键的记录仍可展示，编辑入口禁用。',
      gridOptions: 'DataGrid 查询、分页、选中、列设置和显示配置。远程数据通过 serverMode 和 queryChange 由宿主提供。默认使用 DataGrid 自身默认值。',
      readonly: '全表只读，默认 false。切换为 true 时结束活动编辑，仍可使用查询与导航。',
      saveCell: '类型解析与列校验通过后调用 (change, { signal })。返回 true 或 void 通过，false 使用默认错误，字符串作为错误文案，可返回 Promise。未设置时直接发送 cellCommit。',
      clipboard: '传入从 hys-ui/pro-grid/clipboard 创建的实例，启用矩形选区、复制与批量粘贴。每个表格使用独立实例，默认未启用。',
      showEditButton: '是否显示单元格内的铅笔编辑入口，默认 true。双击和键盘编辑入口始终可用。',
      showEditActions: '活动单元格内是否显示确认和取消按钮，默认 true。',
      commitOnBlur: '默认 false。文本或数字编辑器的焦点离开编辑区时提交，成功后保留新焦点。',
      typeToEdit: '默认 false。开启后，在聚焦的文本或数字单元格直接键入字符会以该字符开始编辑，仍需提交才更新数据。',
      enterToEdit: '默认 true。关闭后 Enter 交由宿主处理，F2 仍可进入编辑。',
      messages: '覆盖中文编辑、状态和错误文案。min / max 文案可使用 {value}。未配置的字段保留组件默认值。',
    },
    events: {
      editStart: '打开一个可编辑单元格时触发，载荷为包含原始值、行、列和位置的 HysProGridCell。',
      editCancel: '手动取消或编辑被视图/数据变化中断时触发。载荷为单元格和 cancel、view-change 或 data-change。',
      editError: '解析、校验或保存失败后触发，载荷为 { rowKey, columnKey, stage, message, cause? }。',
      cellCommit: '类型解析、校验和保存全部通过后触发。载荷含行、行键、列键、原值、editor 判别字段和类型化新值；宿主更新 rows。',
      cellsCommit: '剪贴板粘贴的所有单元格通过权限、解析、校验和保存后一次触发。载荷为按行排列的只读 HysProGridChange 数组，宿主一次更新 rows。单格粘贴也通过此事件返回。',
      'update:query': '请求更新 gridOptions.query，载荷为下一份完整 HysDataGridQuery。',
      queryChange: '查询实际变化时触发，可用于请求远程当前页数据。',
      'update:selectedRowKeys': '请求更新 gridOptions.selectedRowKeys，载荷为下一份选中键数组。',
      selectionChange: '选中键实际变化后触发，载荷为当前选中键数组。',
      'update:groupBy': '请求更新 gridOptions.groupBy，载荷为列键或空字符串。',
      'update:currentRowKey': '请求更新 gridOptions.currentRowKey，载荷为行键或 null。',
      columnLayoutChange: '列布局改变后发出独立快照，含 order、hidden、widths 和可选 pins。',
      contextMenuSelect: '选择右键菜单项时发出命令键、表格上下文和菜单事件信息。',
    },
    slots: {
      cell: '自定义显示，接收 HysProGridCell、editable 和 edit()。优先于 render 与 formatter。',
      editor: '用于 type=custom，渲染在活动单元格内。接收 cell、draft、phase、error、inputId、errorId 和 setDraft、commit、cancel。控件可通过 inputId 关联焦点，用 errorId 关联错误提示。',
      'toolbar-actions': '在 DataGrid 工具栏末尾插入内容，参数为 query 和 selectedKeys。',
      'header-cell': '自定义 DataGrid 列标题内容，接收列头上下文。',
      'row-number': '自定义行号内容，接收当前行上下文，需开启 gridOptions.rowNumbers。',
      'row-number-header': '自定义行号列标题，需开启 gridOptions.rowNumbers。',
      empty: '替换无数据内容，接收当前 query。',
    },
    exposed: {
      editing: '活动单元格的 { rowKey, columnKey }，空闲时为 null。',
      commitEdit: '提交当前编辑，返回 Promise<boolean>。成功返回 true，无编辑、处理中、失败或失效返回 false。',
      cancelEdit: '关闭当前编辑并发出取消信号，尝试恢复单元格焦点。',
      focusCell: '按行键和列键定位单元格。第三个参数 focus 默认 true，传入 false 只滚动到目标位置。',
      getQuery: '组件挂载后读取当前 DataGrid 查询快照。',
      setQuery: '请求部分更新查询，合并到当前查询。',
      getColumnLayout: '组件挂载后读取 DataGrid 列布局快照。',
      applyColumnLayout: '应用列布局预设，沿用 DataGrid 的列宽和显隐约束。',
    },
  },
  HysDiffViewer: { props: {
    before: '对比的原始文本，按行显示在左侧',
    after: '对比的新文本，按行显示在右侧',
    alignChanges: '对齐相同文本行，便于识别插入和删除，默认 false。差异区域超过 100 万组行组合时保留首尾对齐，中间使用顺序对比。',
    changesOnly: '只显示新增、删除和修改的行，默认 false。',
    lineNumbers: '显示修改前和修改后各自的原始行号，默认 false。',
    beforeLabel: '原始文本标题，默认“修改前”。',
    afterLabel: '新文本标题，默认“修改后”。',
  } },
  HysDrawer: { events: {
    'update:open': '抽屉请求打开或关闭时返回新的布尔状态，用于 v-model:open',
    'update:fullscreen': '请求进入或退出全屏时返回新的布尔状态',
  } },
  HysFileManager: { props: {
    accept: '允许的文件扩展名、MIME 类型和 MIME 通配符，使用逗号分隔。选择及拖入均校验。',
    maxSize: '允许的单文件最大字节数，省略时不限。',
    maxCount: '允许的总附件数量，包含 modelValue 中的已有附件，省略时不限。',
    multiple: '允许每次选择或拖入多个文件，默认 true。',
    emptyText: '附件为空时的提示，默认“暂无附件”。',
  }, events: {
    upload: '选择或拖入文件时返回校验通过的原生 File 数组，宿主负责上传和更新附件。',
    reject: '选择或拖入文件后返回被拒绝的列表。每项包含 file 和 reason，reason 为 type、size 或 count。',
    remove: '点击移除附件时返回附件 id，由宿主更新列表',
    download: '点击下载附件时返回附件 id，由宿主执行下载',
  } },
  HysForm: { exposed: {
    errors: '按字段路径索引的当前错误信息',
    warnings: '按字段路径索引的当前非阻断校验警告',
    states: '按字段路径索引的校验状态',
    validating: '当前是否有字段校验正在执行',
  } },
  HysFormItem: { exposed: {
    path: '当前字段在表单模型中的规范化路径',
    validateMessage: '当前字段用于显示的校验反馈文字',
    validateState: '当前字段的校验状态，随校验执行及结果变化',
  } },
  HysGantt: {
    props: { scale: '时间轴的显示粒度，用于调整刻度和任务条对应的时间范围' },
    events: { 'update:scale': '请求切换时间轴粒度时返回新的 scale 值' },
  },
  HysInput: {
    ...textInput,
    events: { ...textInput.events, 'update:passwordVisible': '请求切换密码明文可见状态，参数为新的布尔值' },
  },
  HysJsonEditor: {
    props: {
      indent: '格式化时使用的空格数，限制为 0–10，默认 2。',
      compactable: '显示压缩按钮，默认 false。',
      validate: 'JSON 语法正确后调用的业务校验函数，接收解析值，返回错误字符串或不返回。',
      readonly: '允许选择文本，禁止编辑和格式化，默认 false。',
      disabled: '禁用编辑器和操作按钮，默认 false。',
    },
    events: { format: '成功格式化或压缩时触发，载荷依次为转换后的 JSON 文本及 pretty / compact。' },
  },
  HysKanban: {
    props: {
      columns: '看板列，字段为 id、title 和可选 limit。非负整数 limit 限制列容量，省略时不限。',
      cards: '卡片数组，字段为 id、title、column、owner? 和 disabled?。disabled 锁定该卡片。',
      canMove: '移动权限回调，接收 { card, from, to }，返回 false 禁止下拉选项和拖动放置。',
      disabled: '禁用拖动和下拉移动，默认 false。',
      emptyText: '空列的提示，默认“暂无卡片”。',
    },
    slots: { card: '自定义卡片正文，接收 { card, column }。', empty: '自定义空列提示，接收 { column }。' },
    events: {
      move: '拖放或下拉移动通过校验后触发，返回卡片 id 和目标列 id。调用方更新 cards。',
      moveRejected: '拖放被拒绝时触发，返回 { card, from, to }。',
    },
  },
  HysMention: {
    props: {
      throttle: '连续远程搜索两次启动的最短时间间隔，单位为毫秒',
      recentLimit: '所有触发前缀共用的最近选项记录上限',
      recommendations: '用于推荐区域的候选数据，打开推荐时与当前数据源合并',
      defaultValue: '未传 modelValue 时使用的初始文本',
      boundary: '规定触发词可出现的位置，支持任意位置、单词边界或自定义判定函数',
      allowSpaces: '允许触发词后的搜索关键词包含空格',
      parseEntities: '从已有文本中恢复提及实体，可用于初始化及外部文本回显',
      highlightMentions: '按实体范围突出显示文本中的提及',
      entityClass: '为高亮实体添加类名，也可按当前实体计算类名',
      errorText: '远程候选加载失败时显示的默认提示',
      placement: '候选面板相对于输入光标的首选位置',
      showArrow: '显示候选面板指向光标的箭头',
      offset: '候选面板与定位参考点的距离，单位为像素',
      autoAdjustOverflow: '启用视口空间检测，空间不足时调整候选面板位置',
      popupWidth: '设置候选面板宽度，可传像素数字或 CSS 长度',
      popupMaxHeight: '限制候选列表的滚动区域高度，可传像素数字或 CSS 长度',
      zIndex: '候选面板的层级基准，组件仍遵循共享浮层栈',
      itemHeight: '虚拟候选列表用于计算渲染范围的单行像素高度',
      overscan: '虚拟列表在可视范围前后额外渲染的行数',
      popupClass: '添加到候选面板的类名',
      popupStyle: '添加到候选面板的样式，位置由组件计算',
      name: '表单提交时用于保存纯文本值的字段名称',
      autofocus: '组件挂载时尝试聚焦输入区域',
      readonly: '允许阅读和选择文本，禁止修改文本或插入实体',
      maxlength: '允许输入的最大文本长度，也约束程序化插入',
      minlength: '用于原生表单校验的最小文本长度',
      required: '将文本字段标记为必填，并同步无障碍状态',
      clearable: '在存在可编辑文本时显示清空操作',
      showCount: '显示当前文本长度及已配置的最大长度',
      autosize: '允许多行输入随内容改变高度，可指定最小和最大行数',
      restoreFocus: '选择候选或清空后将焦点还给编辑区域',
      shortcuts: '将按键组合映射到打开候选、移动高亮、确认等提及操作',
      locale: '覆盖加载、空结果、重试及无障碍标签等默认文案',
      defaultEntities: '非受控实体集合的初始值，范围需与初始文本对应',
      status: '将输入边框设为 error 或 warning，用于显示校验反馈',
    },
    events: {
      change: '已接受的文本发生变化时返回纯文本内容',
      clear: '开始处理清空操作时触发，受控宿主仍可决定是否接受更新',
      'update:entities': '请求更新完整实体集合，包含实体的标识和文本范围',
      ...fieldEvents,
    },
    slots: {
      prefix: '编辑区域前面的附加内容',
      suffix: '编辑区域后面的附加内容',
      'clear-icon': '替换清空按钮内的图标',
      count: '替换长度统计内容，可按当前计数与上限展示',
      avatar: '替换候选项头像，接收对应 option',
    },
    exposed: {
      input: '当前输入、文本区域或可编辑内容元素',
      dropdownVisible: '候选面板当前是否显示',
      focus: '将焦点移到当前编辑区域',
      blur: '移除当前编辑区域的焦点',
      close: '关闭当前候选列表',
      update: '按当前文本、光标及面板尺寸重新计算候选面板位置',
      retry: '重新执行当前失败的候选加载',
      loadMore: '在存在更多结果时请求下一页候选',
      insertMention: '按当前选区或指定范围插入候选，可覆盖前缀及插入后的焦点行为',
      removeMention: '按实体对象或 id 删除首个匹配实体及紧随其后的分隔符',
      getEntities: '返回当前提及实体对象的副本列表',
      getDocument: '返回当前纯文本与实体副本组成的文档',
      setDocument: '写入结构化文档或其序列化字符串，解析或更新失败时返回 false',
      serialize: '将当前纯文本与实体集合编码为 JSON 字符串',
      clear: '清空可编辑的文本和实体，返回是否接受本次修改',
      undo: '尝试撤销最近一次已接受的编辑',
      redo: '尝试重做最近撤销的编辑',
    },
  },
  HysModal: { events: {
    'update:open': '对话框请求展开或关闭时返回布尔状态，用于 v-model:open',
    'update:fullscreen': '请求切换全屏状态时返回新的布尔值，用于 v-model:fullscreen',
  } },
  HysNotificationCenter: {
    props: {
      searchable: '显示搜索框，默认 false。标题、详情和 category 参与不区分大小写的匹配，可与未读过滤叠加。',
      dismissible: '为每条通知显示移除按钮，默认 false。',
    },
    slots: { notice: '自定义通知正文，接收 { item }。', empty: '替换当前结果为空时的提示。' },
    events: {
    dismiss: '激活移除按钮时请求移除，载荷为通知 id，由宿主更新 items。',
    read: '打开单条通知时请求标记已读，参数为通知 id',
    'read-all': '点击全部已读时触发，由宿主更新通知数据',
  } },
  HysOrgTree: {
    props: {
      checkable: '在组织节点前显示复选框，勾选与节点激活独立',
      checkedKeys: '受控勾选节点 id 列表，可配合 v-model:checkedKeys',
      expandedKeys: '受控展开节点 id 列表，可配合 v-model:expanded-keys。',
      defaultExpandAll: '未受控时初始展开全部分支，默认 true。',
      showDescription: '在节点名称后显示 description，默认 false。node 插槽可替换正文。',
    },
    events: {
      'update:checkedKeys': '组织节点勾选发生变化时返回完整的新 id 列表',
      'update:expandedKeys': '展开状态变化时请求同步新的字符串 id 列表。',
      nodeSelect: '激活节点时触发，返回该节点的原始 OrgNode 对象。',
    },
    slots: { node: '替换节点正文，接收 { node: OrgNode }。' },
  },
  HysPagination: {
    props: {
      jumpGaps: '将页码省略号替换成跳页按钮，默认 false。紧凑模式只显示当前页与总页数。',
      gapStep: '省略号每次跳转的页数，默认 5。正数向下取整，目标限制在有效页码范围内。',
    },
    events: {
      change: '翻页或跳页请求时触发，参数为边界归一后的目标页码',
      pageSizeChange: '选择新的每页条数时触发，参数为目标条数',
      'update:page': '请求更新受控页码，供 v-model:page 同步',
      'update:pageSize': '请求更新受控每页条数，供 v-model:pageSize 同步',
    },
    slots: {
      item: '自定义页码及导航按钮。参数为 type、page、active、disabled。启用省略号跳页时 type 还包含 jump-backward 与 jump-forward，page 为目标页。',
      'jump-button': '替换跳转表单的提交按钮内容',
    },
  },
  HysPermissionMatrix: {
    props: {
      roles: '矩阵的角色列，每个名称用于展示及构造权限键',
      resources: '矩阵的资源行，每个名称用于展示及构造权限键',
      readonly: '保留现有权限的显示与半选状态，禁止修改',
      showSelectAll: '显示全局、按角色和按资源的批量勾选入口',
      cellDisabled: '按单元格锁定权限。接收 { resource, role, key, checked }，返回 true 时禁止单项和批量修改。批量勾选状态根据可编辑单元格计算。',
      caption: '原生表格标题。省略时隐藏。',
      emptyText: '角色或资源为空时的提示，默认“暂无可配置权限”。empty 插槽优先。',
    },
    events: {
      change: '用户切换单项或批量权限时触发，参数为修改后的完整权限映射',
      cellsChange: '单项或批量操作实际改变权限后触发，返回变动项数组。每项包含 resource、role、key 以及操作后的 checked。',
    },
    slots: {
      role: '自定义角色列标题，接收 { role }。',
      resource: '自定义资源行标题，接收 { resource }。',
      empty: '角色或资源为空时替换表体提示。',
    },
  },
  HysRating: { events: { 'update:hoverValue': '指针预览变化时请求更新受控悬停评分，离开时恢复无预览状态' } },
  HysResult: {
    props: {
      layout: 'stacked（默认）从上往下排列内容。inline 将图标放在正文起始侧，适合嵌入卡片或表单。',
      detailsLabel: '详情展开按钮的文字，默认“查看详情”。只在使用 details 插槽时显示。',
      detailsOpen: '受控的详情展开状态，可配合 v-model:details-open。',
      defaultDetailsOpen: '非受控的初始展开状态，默认 false。',
    },
    events: {
      'update:detailsOpen': '激活详情按钮时请求更新展开状态，载荷为目标布尔值。',
      detailsToggle: '激活详情按钮时触发，载荷为本次请求的展开状态。',
    },
    slots: { details: '可折叠的详情正文。接收结果上下文和 detailsOpen，收起时保留正文状态。' },
  },
  HysResizablePanel: {
    props: {
      minWidth: '允许调整的最小宽度，单位为像素',
      maxWidth: '允许调整的最大宽度，单位为像素',
      edge: '拖动手柄所在的逻辑边缘，start 或 end，默认 end。自动适配从右向左的布局。',
      resetWidth: '双击手柄或聚焦后按 Enter 恢复的像素宽度，受 minWidth 和 maxWidth 约束。省略时不重置。',
      snap: '可选吸附宽度列表，单位像素。仅指针拖动时应用，越界值会被忽略。',
      snapThreshold: '吸附距离，默认 8 像素。取非负有限值。',
      resizeLabel: '分隔条无障碍名称，默认“调整面板宽度”。',
    },
    events: {
      resizeStart: '主指针开始拖动边缘分隔条时触发',
      resizeEnd: '拖动结束或取消时触发，参数为当前生效的宽度',
    },
    slots: { default: '随可调整宽度一起布局的面板内容，接收 { width: number }。' },
  },
  HysRichTextEditor: {
    props: {
      readonly: '保留富文本显示，关闭编辑区的文本修改能力',
      hideToolbar: '隐藏格式化操作工具栏',
      plainTextPaste: '粘贴及拖入时仅保留纯文本，默认 false。HTML 模式清理粘贴、拖入及外部传入的内容。',
      showBlockTools: '显示小标题、引用和清除样式按钮，默认 false。',
    },
    events: {
      change: '编辑内容发生变化时返回新的 HTML 字符串',
      ...fieldEvents,
    },
    exposed: {
      focus: '将键盘焦点移到富文本编辑区',
      blur: '移除编辑区焦点',
      getHTML: '读取当前编辑区的 HTML 字符串',
    },
  },
  HysSearch: {
    props: {
      defaultValue: '未传 modelValue 时使用的初始关键词',
      readonly: '允许读取、复制和确认已有关键词，禁止编辑或清空',
      clearable: '在有关键词且允许编辑时显示清空按钮，默认 true',
      searchLabel: '搜索按钮的辅助技术名称，也是未单独命名输入框时的默认名称',
      inputProps: '透传给原生搜索输入框的属性，例如 name、id 和 autocomplete',
    },
    events: {
      search: '达到输入防抖时间或用户确认搜索时触发，返回关键词和可用的原生事件',
      clear: '清空操作被接受后触发，是否查询空字符串由 searchOnClear 与 trigger 决定',
      ...fieldEvents,
    },
    slots: {
      prefix: '替换输入框左侧的默认搜索或加载图标',
      suffix: '在清空按钮之后、输入区域内部显示的附加内容',
      'clear-icon': '替换清空按钮内的图标，保留按钮行为',
      'search-button': '自定义右侧提交操作，接收 search、disabled 和 loading',
    },
    exposed: {
      input: '实际接收关键词的原生搜索输入框',
      search: '立即确认当前关键词，忽略禁用、输入法组合及提交模式下的忙碌操作',
      clear: '清空可编辑的当前关键词，等待模型接受后处理清空反馈',
      focus: '聚焦原生搜索输入框，可传 FocusOptions',
      blur: '移除原生搜索输入框焦点',
      select: '选中搜索输入框内的全部关键词',
    },
  },
  HysSelect: { props: {
    nativeLabelTooltip: '是否使用浏览器原生提示展示选项和已选标签，默认 true。设为 false 关闭原生提示。',
  }, events: {
    clear: '点击清空时触发，单选使用 clearValue，多选请求空数组',
    'update:open': '请求改变浮层的展开状态，供 v-model:open 使用',
    'update:searchValue': '筛选输入或搜索重置请求时返回新的查询文本',
  } },
  HysShortcutHelp: { props: {
    shortcuts: '快捷键数组。keys 与 description 必填，group 可分组，macKeys 为 macOS 的按键文案。',
    searchable: '显示搜索框，默认 false。支持按按键、说明和分组匹配。',
    platform: '使用 default（默认）或 mac 的快捷键文案。缺少 macKeys 时使用 keys。',
    emptyText: '列表或搜索结果为空时的文案，默认“没有匹配的快捷键”。',
  } },
  HysSkeleton: { props: {
    avatar: '在段落骨架旁显示头像占位',
    avatarSize: '头像占位的直径或边长，单位为像素',
  } },
  HysSortableList: {
    props: {
      modelValue: '受控数据。接受 update:modelValue 后更新 v-model。各项必须有唯一且稳定的字符串或数字键。',
      defaultItems: '未传 modelValue 时的初始数据，默认空数组。挂载时的键顺序也作为 reset 的基线。',
      itemKey: '键字段名或取键函数，默认 id。字符串 1 与数字 1 是两个键。重复或缺失键会禁用排序。',
      itemLabel: '显示名称的字段名或函数，默认 label。缺少名称时使用项目键。',
      listId: '跨容器实例操作使用的稳定标识。默认自动生成。自行指定时应在当前页面内唯一。',
      ariaLabel: '列表或表格的辅助技术名称，默认「可排序列表」。',
      layout: 'vertical、horizontal 或 grid。表格行使用纵向布局。横向和网格可独立启用虚拟渲染。',
      mode: 'insert 按边界插入，swap 在当前列表内交换。跨列表始终按插入处理。',
      disabled: '禁用整个列表的排序、选择和放置。变为 true 时取消本列表进行中的拖拽或保存。',
      itemDisabled: '指定不能被拖拽的键数组，或传 (item, index) => boolean。其他项仍可从它旁边移动。',
      fixed: '传键数组固定绝对索引，或返回 true / top / bottom。固定项不能拖动，排序后须满足指定位置。',
      handle: 'true 使用内置手柄，false 允许从行内空白或非文字区域拖动，项目文字仍可选中复制。字符串增加一个 CSS 手柄选择器，触摸手柄需设置 touch-action: none。',
      showHandle: '是否显示内置拖拽手柄，默认 true。关闭后可从行内空白处拖动，项目文字仍可选中复制。如果 handle 是 CSS 选择器，仍通过自定义手柄拖动。',
      showButtons: '显示上移和下移按钮。横向布局对应前移和后移，默认 true。',
      keyboard: '启用 Alt 快捷排序和拾起、放置键盘操作，默认 true。',
      dragDelay: '鼠标或笔启动前需要按住的毫秒数，默认 0。长按前移动超过 dragThreshold 会取消。',
      touchDelay: '触摸长按的毫秒数，默认 180。0 表示移动达到阈值后启动。',
      dragThreshold: '启动拖拽或取消长按所用的最小位移，单位像素，最小 1，默认 5。',
      axis: 'x、y 或 both。限制拖拽预览和命中坐标，默认 both。',
      bounds: 'list 限制在源列表内；viewport 限制在视口；也可传 HTMLElement 或返回元素的函数。越界释放无效。',
      snap: '启用时在距离可放置列表边缘 16 px 内尝试吸附，仍执行放置校验，默认 false。',
      livePreview: '默认在同列表预览时重排可见项目。关闭后仍提供目标指示和 preview 事件。虚拟列表键盘操作保留焦点行。',
      group: '分组名或 { name, pull, put }。同组默认可互移。pull 决定 move/copy/clone，put 可用布尔值、来源分组数组或规则函数。',
      maxItems: '跨列表放置后目标允许的最大项目数。省略时不限；同列表排序不改变数量。',
      selectable: '显示多选复选框，支持 Shift 区间选择和批量移动，默认 false。',
      selectedKeys: '受控选中键，使用 v-model:selectedKeys。仅当前列表内的键会显示为选中。',
      defaultSelectedKeys: '非受控的初始选中键，默认空数组。',
      clone: '复制或克隆时同步调用。参数为原项目和放置提议，返回含新唯一键的项目。省略时组件按操作执行浅拷贝或 structuredClone。',
      canDrag: '拖拽、键盘或实例排序前验证 (item, index)。false 禁止操作，字符串为原因，其他返回值允许。',
      canDrop: '源和目标分别检查放置提议。false 或原因字符串拒绝，其他返回值允许。拖拽预览与最终提交均检查。',
      resolveIndex: '同步改写目标索引。插入允许 0 到目标长度，交换允许 0 到目标长度减一。',
      beforeDrop: '提交前的同步或异步校验，接收提议和 AbortSignal。false、原因字符串或拒绝的 Promise 阻止模型更新。',
      save: '模型接受更新后调用，参数含各列表的前后快照和 AbortSignal。返回 false 或抛出错误时尝试回滚。跨列表优先调用源的 save。',
      history: 'true 记录最近 20 次成功操作，false 或 0 关闭。也可传 1–200 指定每列表上限。',
      storageKey: '浏览器本地顺序键。挂载时按保存的键排列现有项目，成功提交后写入新顺序。',
      autoScroll: '默认开启。可配 threshold（边缘 1–200 px，默认 36）、speed（每帧 1–100 px，默认 14）、axis 和 window。优先滚动最近可滚动容器。',
      virtual: 'true 或虚拟配置。height 默认纵向 320px，estimateSize 默认纵向 48px、横向 160px，overscan 默认 4；网格列数支持函数。',
      listTag: 'div、ul、ol 或 table，默认 div。table 使用原生 table/tbody/tr 元素。',
      tableColumns: '表格总列数，用于空状态和虚拟占位行。省略时按一个内容列和实际渲染的控制列计算。',
      motion: '启用组件移动与回弹动画，默认 true。遵循全局和系统减少动效设置。',
      animationDuration: '同列表位置过渡和松手落位动画的时长，单位毫秒，默认 180，设为 0 立即到位。',
      animationEasing: '同列表位置过渡和松手落位动画的 CSS 缓动函数，默认 ease。',
      moveClass: '自定义 Vue TransitionGroup 的移动类。由宿主 CSS 定义，虚拟渲染时关闭位置过渡。',
      ghostClass: '添加到浮动预览内容上的 CSS 类。',
      ghostStyle: '浮动预览内容样式，可设置缩放、阴影、透明度等 CSS 变量。',
    },
    events: {
      'update:modelValue': '放置或历史操作请求更新时，返回该列表的新数组。回滚时也会返回恢复后的数组。',
      'update:selectedKeys': '勾选、范围选择或调用 select 时返回新的键数组。',
      start: '指针拖拽启动或键盘拾起时触发。返回来源、源列表、项目、键和原始索引。',
      preview: '有效候选位置变化时返回放置提议和各列表的预览数组。清除候选时返回 null。复制预览以原项目表示，确认时才生成新键。',
      change: '排序、撤销、重做、重置保存成功后，或失败回滚后触发。包含 action 和各列表的 previous / next 快照。',
      cancel: 'Escape、指针取消、程序取消或异步操作中止时触发。参数含 reason、message 及可用的 proposal。',
      invalid: '试图放置到无效区域、违反规则或键重复时触发。参数含原因、消息和可用的提议。',
      conflict: '受控宿主未接受、等待期间数据被替换或历史已失效时触发。保留较新的数据。',
      'save-error': '保存回调失败或本地存储写入失败时触发。返回 reason、message、proposal 和可用的 error。',
    },
    slots: {
      item: '自定义项目内容，接收 item、key、index、selected、dragging、disabled、fixed、toggle 和 move。',
      handle: '自定义内置手柄按钮的内容，接收项目上下文。按钮保留拖拽和键盘行为。',
      preview: '自定义跟随指针的浮动预览。接收 drag 和 allowed，支持批量项目。',
      placeholder: '自定义拖拽项在列表内的占位内容。接收项目上下文。',
      empty: '自定义空列表内容，空列表仍可接收符合规则的跨容器拖放。',
      header: '表格模式插入原生 thead，可包含多行表头。',
      cells: '表格模式自定义每行的业务 td 或 th。组件额外渲染手柄列及可选操作列。',
    },
    exposed: {
      move: '按键或键数组排序。options 包含 index、可选目标 listId（to）和受分组限制的 operation。成功保存后返回 true。',
      undo: '撤销最近一条可用历史记录。跨列表记录同时恢复相关列表。无法应用时返回 false。',
      redo: '重做最近撤销的记录。新的成功操作会清空关联列表的重做记录。',
      reset: '按挂载时的顺序恢复仍存在的项目，保留新增项目和固定项的位置。',
      cancel: '取消当前指针或键盘拖拽，并通过 AbortSignal 中止本列表参与的异步校验或保存。',
      select: '在开启 selectable 时按键设置选择，返回受控更新事件。',
      scrollTo: '将指定键滚动到可见区，支持先定位虚拟项。未找到时返回 false。',
      focus: '将指定键滚动到可见区并聚焦其行。未找到时返回 false。',
    },
  },
  HysSplitPane: {
    props: {
      vertical: '切换为上下分割，显式 layout 属性优先',
      layout: '指定横向 horizontal 或纵向 vertical，优先于 vertical。横向布局可通过 responsiveBreakpoint 自动切换。',
      responsiveBreakpoint: '容器宽度低于此正数像素值时，横向布局改为纵向。省略时沿用指定方向。等于断点时保留横向。',
      resizeMode: '多面板的指针与键盘调整方式。adjacent（默认）调整分隔条两侧面板。cascade 先调整最近面板，到达尺寸约束后向外传递，遇到锁定面板停止。',
      snapThreshold: '指针距吸附点的最大距离，单位为 px，默认 12。设为 0 关闭吸附。只有设置了 snapPoints 的面板参与吸附。',
      cancelBehavior: '实时拖动被 Esc、指针取消或窗口失焦打断时，keep（默认）保留已提交尺寸，restore 尝试恢复拖动前尺寸。lazy 模式取消时直接清除预览。',
      firstPanel: '配置前侧面板的 min、max、resizable、collapsible 和 snapPoints。长度数字为 px，字符串支持 px 与 %。',
      secondPanel: '配置后侧面板的 min、max、resizable、collapsible 和 snapPoints。吸附尺寸按本面板的宽度或高度计算。',
      panels: '按显示顺序提供带唯一 id 的多面板数组。每项可设置初始 size、min、max、是否调整和折叠，以及 snapPoints。',
      firstLabel: '前侧面板折叠按钮的辅助技术名称片段',
      secondLabel: '后侧面板折叠按钮的辅助技术名称片段',
    },
    events: {
      collapse: '双面板模式的折叠状态生效时触发，返回面板方向及折叠状态',
      resize: '双面板模式拖动时返回首个面板的预览或实时比例',
      resizeStart: '双面板模式中主指针开始拖动分隔条时触发',
      resizeEnd: '双面板拖动结束或取消时触发，返回实际比例及 cancelled 状态',
      'update:sizes': '多面板调整、折叠或重置时请求更新按 id 索引的尺寸集合',
      panelResizeStart: '多面板拖动开始时返回分隔条索引、相邻面板标识及当前像素尺寸',
      panelResize: '多面板拖动时返回相邻面板标识和预览或实时像素尺寸',
      panelResizeEnd: '多面板拖动结束或取消后返回实际生效的尺寸及 cancelled 状态',
      panelCollapse: '多面板模式下折叠或还原生效时返回面板 id 和折叠状态',
      layoutChange: '生效方向改变时触发，载荷为 horizontal 或 vertical。容器跨过响应式断点或指定方向变化均可触发。',
    },
    slots: {
      first: '双面板前侧内容，接收折叠状态及切换方法',
      second: '双面板后侧内容，接收折叠状态及切换方法',
      'first-collapse': '替换前侧折叠或还原按钮的图标内容',
      'second-collapse': '替换后侧折叠或还原按钮的图标内容',
      panel: '多面板正文，接收面板配置、索引、像素尺寸及折叠状态',
      'panel-collapse': '自定义多面板折叠按钮图标，可读取所在侧及折叠状态',
    },
    exposed: {
      togglePanel: '切换双面板的 first 或 second 折叠状态，返回是否实际改变',
      togglePane: '按 id 切换折叠。双面板使用 first 或 second；多面板可传入从 0 开始的相邻分隔条索引。',
      collapsePane: '按 id 折叠可折叠面板，成功后返回 true。已折叠、受控更新被拒绝或相邻面板无法容纳释放空间时返回 false。',
      expandPane: '按 id 展开已折叠面板，在相邻约束内恢复上次展开尺寸。返回实际状态是否改变。',
      getPanelSizes: '返回各面板沿当前分割轴的像素尺寸。双面板使用 first、second 为键，多面板使用各自 id。',
      getPaneElement: '按 id 获取原生面板容器，可用于定位和聚焦。双面板使用 first 或 second，找不到时返回 undefined。',
      getLayout: '返回当前生效的 horizontal 或 vertical，包含容器宽度断点的影响。',
      resizePane: '按 id 请求指定尺寸，数字为 px，字符串支持 px 或 %。遵守相邻面板的尺寸约束，实际尺寸改变时返回 true。',
      resetSizes: '将当前模式恢复到初始尺寸，受控模式通过更新事件请求宿主同步',
    },
  },
  HysSteps: {
    props: {
      items: '步骤标题或 HysStepItem 对象数组。进行中步骤可设置 progress，有限数值限制为 0–100。',
      linear: '点击和键盘操作只可访问当前及之前的步骤，默认 false。业务可通过 current 推进流程。',
    },
    events: { 'update:current': '选择可用步骤时请求更新当前索引，索引从 0 开始' },
    slots: {
      icon: '替换步骤标记，接收当前项目、索引和状态',
      subtitle: '替换步骤副标题，接收当前项目和索引',
      description: '替换步骤说明，简洁模式下不显示',
    },
  },
  HysTable: { props: {
    search: '受控跨列搜索词，可配合 v-model:search。以空白拆词，每个词可匹配不同列，忽略大小写和重音。空字符串清除搜索，服务端模式由宿主应用。',
    defaultSearch: '非受控初始跨列搜索词，默认空字符串。',
    searchColumns: '限制搜索列 key。省略时搜索所有当前有效数据列；空数组不匹配任何数据行。',
    searchMethod: '本地自定义匹配 (search, row) => boolean，替换内置跨列匹配逻辑。',
    keyboardNavigation: '启用键盘行导航，默认 false。方向键移动，Home/End 到首末可见行，Enter 触发行点击，空格切换可选行。',
    cellNavigation: '启用可见数据单元格的键盘导航，默认 false。开启后表体使用单元格焦点。方向键按合并后的表格位置移动，Home / End 到行首 / 行尾，Ctrl 或 Command + Home / End 到当前可见数据的首 / 末单元格。内嵌控件保留自己的按键操作。',
    emptyCellText: '默认单元格内容遇到 null、undefined 或空字符串时显示的文字，省略时为空。列 emptyText 优先，0 和 false 按原值显示。',
    striped: '为相邻数据行交替绘制背景色',
    bordered: '显示表格与单元格边框',
    tableLayout: '设置 fixed 或 auto 布局，用户调整列宽后使用固定像素布局',
    caption: '表格标题，用于辅助技术识别表格内容',
    scrollbarAlwaysOn: '为表体滚动容器保留纵向滚动条',
    nativeScrollbar: '默认使用 HYS-UI 的滚动条样式。设为 true 时使用浏览器默认样式。',
    scrollbarTabindex: '表体滚动区域的 tabindex，用于通过键盘聚焦和滚动',
    headerRowClassName: '设置表头行类名，也可按列集合与表头层级计算',
    headerRowStyle: '设置表头行样式，也可按列集合与表头层级计算',
    selectionColumn: '配置自动选择列的标题、宽度、固定位置和对齐方式',
    getSelectionProps: '按行配置选择控件的禁用、标签和提示，禁用也约束批量选择',
    sortOrders: '配置默认的排序切换顺序，列自身的排序顺序优先',
    filterColumnKey: '受控的筛选浮层列标识，null 关闭浮层',
    filterPlacement: '设置筛选浮层相对于表头按钮的首选位置',
    appendFilterTo: '设置筛选浮层的挂载目标，false 时保留在原位置',
    showExpandColumn: '为可展开行或树形行显示默认的展开操作列',
    expandColumnTitle: '默认展开操作列的表头文字',
    expandFixed: '展开操作列的固定方向',
    allowDragLastColumn: '允许通过拖动调整最后一列的宽度',
  }, events: {
    'update:search': '请求更新搜索词，载荷为字符串，同时请求回到第 1 页。',
    queryChange: '查询操作请求，包含 action、page、pageSize、sorts、filters、currentData；启用跨列搜索后同时包含 search 字段。',
  }, exposed: {
    setSearch: '应用搜索词并请求回到第 1 页。queryChange 的 action 为 search，服务端模式将查询交给宿主。',
    clearSearch: '清除跨列搜索词，保留列筛选和排序。',
    focusRow: '按行键或行对象聚焦当前可见行。cellNavigation 开启时定位到行首数据单元格，否则需要开启 keyboardNavigation。无法定位时返回 false。',
    focusCell: 'focusCell(rowOrKey, columnKey: string): boolean。cellNavigation 开启时按行对象或行键聚焦已显示的数据单元格。行列不可见、被合并覆盖或正在加载时返回 false。',
  } },
  HysTabPane: {
    slots: {
      loading: '单个声明式面板的异步加载内容，优先于 HysTabs 的同名插槽。',
      error: '单个声明式面板的错误反馈，接收 error 和 reload() 等面板上下文。',
      empty: '单个声明式面板缺少正文时展示，优先于 HysTabs 的同名插槽。',
    },
  },
  HysTabs: {
    slots: {
      prefix: '页签导航前方的附加内容',
      suffix: '页签导航后方的附加内容',
      'close-icon': '替换可关闭页签内的关闭图标',
      'add-icon': '替换新增页签按钮内的图标',
      panel: '按页签数据渲染面板正文',
      default: '页签面板的默认正文，panel 插槽优先',
    },
    exposed: {
      scrollToActiveTab: '滚动导航区域，使当前选中页签进入可视范围',
      focus: '聚焦指定 value 的页签，省略时聚焦当前选中项',
    },
  },
  HysTextarea: {
    ...textInput,
  },
  HysToast: {
    props: { closable: '显示关闭按钮，关闭后可等待 afterClose 确认退出动画结束' },
    slots: {
      icon: '替换提示类型对应的状态图标',
      default: '提示正文，优先于 message 属性',
      action: '提示正文旁的附加操作区域',
    },
    exposed: {
      close: '立即请求关闭提示并停止自动关闭计时',
      pause: '暂停自动关闭并记录剩余时间',
      resume: '从已记录的剩余时间恢复自动关闭',
      restart: '以完整的 duration 重新开始计时',
      element: '提示框的原生元素，挂载前为 undefined',
    },
  },
  HysTour: {
    props: {
      steps: '引导步骤配置列表，可分别设置目标元素、标题、正文及遮罩',
      closeOnEscape: '引导在浮层栈顶部时允许用 Escape 关闭',
      appendTo: '引导卡片和遮罩的挂载位置，默认 body，false 保留在组件原处',
      zIndex: '引导浮层的层级基准，嵌套时遵循共享浮层栈',
      skipText: '底部跳过按钮的显示文字',
      prevText: '默认上一步按钮文字，步骤按钮配置可覆盖',
      nextText: '默认下一步按钮文字，步骤按钮配置可覆盖',
      finishText: '最后一步完成按钮的默认文字',
      mask: '控制遮罩，传对象可分别调整颜色和样式',
      gap: '设置遮罩开孔与目标之间的留白及圆角，留白可按横纵分别指定',
      showArrow: '控制有定位目标的引导卡片是否显示箭头',
      arrow: '配置箭头显示与对齐，可用 pointAtCenter 指向目标中心',
      type: '选择默认表面或主题色引导卡片',
      contentStyle: '应用到引导卡片的装饰样式，步骤级样式可以覆盖',
      scrollIntoViewOptions: '目标在视口外时自动滚动，可传原生滚动选项或传 false 关闭',
      targetAreaClickable: '遮罩存在时，是否允许用户直接操作高亮目标',
      showClose: '控制引导卡片顶部是否显示关闭按钮',
      closeIcon: '替换关闭按钮的图标或文字，close-icon 插槽优先',
      prevButtonProps: '配置上一步按钮的外观、文案及点击处理',
      nextButtonProps: '配置下一步或完成按钮的外观、文案及点击处理',
    },
    events: {
      change: '通过引导导航切换步骤时返回新的从零开始的步骤索引',
      close: '引导因关闭、跳过或完成而请求结束时触发',
      finish: '用户完成最后一个引导步骤时触发',
      'update:open': '请求打开或关闭引导时返回目标布尔状态，供 v-model:open 使用',
      'update:current': '请求切换步骤时返回新索引，供 v-model:current 使用',
    },
    slots: {
      header: '自定义引导标题区域，接收当前步骤及导航方法',
      cover: '替换步骤正文上方的封面内容',
      indicators: '自定义步骤进度，接收当前索引、总数及导航方法',
      footer: '替换底部导航和步骤进度区域',
      'close-icon': '替换顶部关闭按钮图标，保留原有点击处理',
    },
    exposed: {
      start: '打开引导并从指定索引开始，省略时从 current 或首个步骤开始',
      close: '请求关闭当前引导，并触发关闭通知',
      goTo: '跳转到指定步骤，超出范围时归一到可用边界',
      previous: '切换到上一步，已经在首步时保持当前位置',
      next: '切换到下一步，当前为最后一步时完成并关闭引导',
    },
  },
  HysTransfer: { events: {
    'update:checkedKeys': '勾选变化后返回两侧面板的完整勾选键集合',
    'update:searchValues': '某侧搜索词变化后返回两侧当前查询文本',
    'update:pages': '某侧翻页后返回两侧的当前页码',
    'update:pageSizes': '某侧调整页大小后返回两侧的每页条数',
  } },
  HysTree: {
    props: { checkable: '为节点显示复选框，选择关系由复选关联配置决定' },
    events: {
      'update:searchValue': '请求更新树的查询词，供 v-model:searchValue 使用',
      'update:checkedKeys': '请求更新完整勾选键列表，供 v-model:checkedKeys 使用',
      'update:expandedKeys': '请求更新展开节点键列表，供 v-model:expandedKeys 使用',
      'update:loadedKeys': '懒加载状态变化后返回已加载节点的键列表',
      'update:nodes': '节点编辑或拖动后返回更新后的树数据',
    },
  },
  HysTreeSelect: { events: {
    'update:open': '请求打开或关闭下拉树，返回目标布尔状态',
    'update:searchValue': '搜索输入或清空查询时返回新的搜索文本',
    'update:expandedKeys': '请求更新下拉树的展开节点键列表',
    'update:loadedKeys': '下拉树懒加载状态变化后返回已加载节点键列表',
  } },
};

const interactionAnnotations =
{
  "HysBadge": {
    "props": {
      "beforeClose": "关闭前检查，接收原生 MouseEvent。可返回 Promise，返回 false 保留徽章，等待时关闭按钮禁用。"
    },
    "events": {
      "closeError": "关闭检查抛错或拒绝时触发，载荷为错误对象。"
    }
  },
  "HysCard": {
    "props": {
      "keepContentOnLoading": "默认 false。设为 true 时刷新保留正文组件状态，加载层覆盖正文并暂时禁止正文交互。"
    }
  },
  "HysPagination": {
    "props": {
      "pageSizeStrategy": "每页条数生效后使用的页码策略。preserve-page（默认）保留页码并处理越界，first 回到首页，preserve-item 定位至原页首记录所在的新页面。宿主同时提供新页码时优先使用该页码。"
    }
  },
  "HysPermissionMatrix": {
    "props": {
      "filter": "按资源名称筛选，忽略大小写和首尾空白，默认展示所有资源。开启筛选时，行、列及全选只修改可见且未锁定的权限。"
    }
  },
  "HysTabPane": {
    "props": {
      "panelClass": "附加在对应 tabpanel 上的类名。",
      "panelStyle": "应用于对应 tabpanel 的 CSSProperties，可设置高度及独立滚动。",
      "panelTabIndex": "面板的 tabindex，默认 0。-1 从 Tab 顺序移除面板容器，内部控件保持正常焦点顺序。"
    }
  },
  "HysCommandPalette": {
    "props": {
      "recent": "最近使用的命令 ID，从最近到最早，可通过 v-model:recent 管理，默认空数组。",
      "recentLimit": "最多保留的最近使用项数，默认 0。空查询时将有效且可用的最近命令置顶，输入搜索词后恢复原始命令顺序。"
    },
    "events": {
      "update:recent": "选中可用命令时请求更新最近使用列表，载荷为去重并截断后的 ID 数组。"
    }
  },
  "HysNotificationCenter": {
    "props": {
      "categoryFilter": "显示从通知 category 字段生成的分类筛选，默认 false。分类和未读及文本筛选可叠加，全部已读应用于所有通知。"
    },
    "events": {
      "categoryChange": "选择分类时触发，载荷为分类名或代表全部分类的空字符串。"
    }
  },
  "HysShortcutHelp": {
    "props": {
      "shortcuts": "快捷键数组。keys 和 description 必填，group 用于分组。sequence 和 macSequence 可传二维数组，每一项是一次同时按下的键，按数组顺序依次执行。普通显示回退到 keys 或 macKeys。"
    }
  },
  "HysResult": {
    "props": {
      "status": "支持 primary、info、success、warning、error、pending 和 403、404、500，默认 info。pending 对结果区域设置 aria-busy。",
      "progress": "pending 状态下显示的进度百分比。有限数值限制为 0–100，省略时隐藏进度条。"
    }
  },
  "HysCalendarNavigation": {
    "props": {
      "shortcuts": "底部月份快捷入口数组。每项为 { label, month: Date }，读取 UTC 年月，范围外的入口禁用。"
    },
    "events": {
      "navigate": "有效的月份变更请求触发，载荷为目标月份的 UTC 首日 Date 和来源 previous、next、month、year、today、shortcut 或 api。"
    },
    "exposed": {
      "goToMonth": "goToMonth(date: Date): boolean。请求切换至目标 UTC 月份并返回日期视图。禁用、越界或当前月份时返回 false。"
    }
  },
  "HysChart": {
    "props": {
      "reference": "单条参考线 { value, label, color? }。有限数值参与数值轴范围计算，适用于带坐标轴的图表。"
    }
  },
  "HysDiffViewer": {
    "props": {
      "contextLines": "只显示每处变化前后的指定行数。有限数值取非负整数，省略时显示全文，changesOnly 开启时优先只显示变更行。"
    }
  },
  "HysKanban": {
    "props": {
      "reorderable": "显示同列上移和下移按钮，默认 false。锁定卡片以及列表边界限制相邻交换。"
    },
    "events": {
      "reorder": "同列相邻交换通过检查后触发，载荷依次为列 ID 和该列调整后的全部卡片 ID。宿主更新 cards。"
    }
  },
  "HysOrgTree": {
    "props": {
      "searchDetails": "开启后搜索节点 name、description 和 keywords，忽略大小写，多个空格分隔词均需匹配。默认 false。"
    }
  },
  "HysAccordion": {
    "props": {
      "mandatory": "防止通过点击、键盘或实例方法收起最后一个已展开面板，默认 false。初始展开项通过 defaultActive 或 modelValue 设置。"
    }
  },
  "HysResizablePanel": {
    "props": {
      "cancelable": "默认 false。开启后，拖动时按 Esc 或发生 pointercancel 会请求恢复本次拖动开始时的宽度。"
    },
    "events": {
      "resizeCancel": "可取消拖动被取消时触发，载荷为按边界限制后的恢复宽度。"
    }
  },
  "HysSteps": {
    "props": {
      "beforeChange": "用户切换步骤前调用，接收目标索引、当前索引和目标项，可返回 Promise。false 拦截切换，等待时忽略重复请求。"
    },
    "events": {
      "changeError": "切换校验抛错或拒绝时触发，载荷为错误对象。"
    }
  },
  "HysColorTokenEditor": {
    "props": {
      "resetAll": "显示恢复全部默认色按钮，默认 false。只恢复已配置默认色且可编辑、值已变化的令牌。"
    },
    "events": {
      "reset": "批量恢复后触发，载荷为变更的令牌键数组。批量操作发布一次模型更新，随后逐项发布 change。"
    }
  },
  "HysCommentEditor": {
    "props": {
      "submit": "异步发送回调，接收去除首尾空白的文本和 AbortSignal。成功后清空未变化的草稿并触发 send，失败保留草稿。组件卸载或停用时中止信号。"
    },
    "events": {
      "send": "未配置 submit 时在激活发送后触发。配置后在发送成功时触发。载荷为去除首尾空白后的草稿。",
      "sendError": "异步发送失败时触发，依次返回错误和本次提交的文本。"
    }
  },
  "HysCronEditor": {
    "props": {
      "previewCount": "显示未来运行时间条数，默认 0，上限 10。按五段数字 Cron 语法以 UTC 搜索未来五年。",
      "previewFrom": "运行时间预览的基准 Date，默认组件创建时刻。预览只包含严格晚于基准的时间。"
    }
  },
  "HysFileManager": {
    "props": {
      "retryable": "默认 false。为 status 为 error 的附件显示重试按钮。附件由宿主设置 status（uploading、error 或 ready）和 progress（0–100）。"
    },
    "events": {
      "retry": "点击错误附件的重试按钮时触发，载荷为附件 ID。由宿主发起重试并更新附件状态。"
    }
  },
  "HysJsonEditor": {
    "props": {
      "autoIndent": "默认 false。按 Enter 时继承当前行的前导空白，左花括号或左方括号后再增加 indent 个空格。输入法组合期间保留原生处理。"
    }
  },
  "HysRichTextEditor": {
    "props": {
      "showTextCount": "显示正文字符数，默认 false。按 Unicode 码点计数，忽略空白。"
    },
    "exposed": {
      "getText": "getText(): string。读取编辑区域的纯文本，挂载前返回空字符串。"
    }
  }
};

export function applyApiDescriptions(api) {
  for (const [component, sections] of Object.entries(api)) {
    for (const [section, rows] of Object.entries(sections)) {
      for (const row of rows) {
        const description = interactionAnnotations[component]?.[section]?.[row.name] ??
          annotations[component]?.[section]?.[row.name];
        if (description) row.description = description;
        else if (section === 'events' && row.name === 'update:modelValue' &&
          !row.description?.trim() && controlledModels[component]) {
          row.description = controlledModels[component];
        }
      }
    }
  }
}
