const pane = {
  label:
    "标签文字。label 插槽可自定义可见内容，文字仍用于搜索、提示和关闭按钮。",
  value: "组内唯一标识，接受字符串或有限数字。数字 1 和字符串 '1' 是不同标签。",
  content: "纯文本面板内容。默认插槽或 load 返回内容优先。",
  component: "同步面板组件。可搭配 componentProps。",
  componentProps: "传递给同步 component 的属性。",
  load: "接收 { item, signal } 的加载函数。返回文本、Vue 组件、{ component, props } 或 null，可返回 Promise。移除或重新加载时中止旧请求。",
  disabled: "禁止选中、聚焦导航和关闭该标签。",
  readonly: "允许查看和切换，禁止修改、移动和关闭。",
  hidden: "从标签栏和面板移除。隐藏时中止该项的待处理加载。",
  closable: "覆盖列表的关闭配置。固定或只读标签仍受保护。",
  movable: "设为 false 后禁止移动该项，其他项也不能跨越它。",
  pinned: "固定在标签栏前方，并阻止关闭和拖动。可由工作台取消固定。",
  favorite: "加入更多菜单的收藏分组。",
  dirty: "标记未保存状态。关闭时默认弹出确认。",
  unread: "显示未读状态点。",
  badge: "显示数字或文字徽章，0 也会显示。",
  dot: "显示状态点。",
  status: "loading、success、warning、error 或 info。loading 显示旋转图标。",
  icon: "显示在标签文字前的 Vue 图标组件。icon 插槽优先。",
  statusIcon: "替换末尾的默认状态图标。",
  color: "覆盖当前标签的文字颜色，接受 CSS 颜色。",
  class: "附加到标签项容器的 CSS 类名。",
  style: "附加到标签项容器的 CSSProperties。",
  width: "单项宽度，支持非负像素或 CSS 长度。优先于列表 tabWidth。",
  lazy: "覆盖面板的首次挂载策略。",
  cache: "false 在离开时卸载面板并丢弃异步内容，forceRender 优先保留挂载。",
  forceRender: "提前挂载并持续保留面板，隐藏或删除标签时仍会卸载。",
  preload: "挂载时提前准备该面板和异步资源。",
};
const props = {
  modelValue: ["受控标签标识。v-model 同步选择请求，父组件可保留原值。"],
  defaultValue: ["非受控初始标识。未配置或不可用时使用首个可用项。"],
  items: [
    "数据模式的标签列表。工作台模式通过 v-model:items 接收关闭结果。添加、重命名、固定和排序也可输出新数组。",
  ],
  defaultItems: ["非受控工作台的初始列表，仅在创建实例时读取。"],
  workbench: [
    "启用新增、关闭、更多搜索和右键管理。可配合 defaultItems 自管理或通过 v-model:items 受控。",
    "false",
  ],
  disabled: ["禁用标签栏交互并中止待处理守卫。", "false"],
  readonly: ["允许选择和刷新，禁止添加、关闭、移动、收藏与重命名。", "false"],
  type: [
    "支持 line、card、border-card、pill、segment、button、minimal、borderless。",
    "line",
  ],
  vertical: ["省略 placement 时，true 使用 left，false 使用 top。", "false"],
  placement: [
    "标签栏位于 top、bottom、left 或 right。显式值优先于 vertical。",
    "top",
  ],
  responsive: ["容器窄于 breakpoint 时，将左右标签栏自动改为顶部。", "false"],
  breakpoint: [
    "启用 responsive 时的容器宽度阈值，单位 px，范围 0–2400。",
    "560",
  ],
  size: ["sm、md、lg 控制标签最小高度与字体尺寸。", "md"],
  stretch: ["让标签均分标签栏的剩余空间。", "false"],
  centered: ["省略 align 时将标签居中。", "false"],
  align: ["沿标签栏主轴对齐。start、center、end 或 between。", "start"],
  tabWidth: ["默认标签宽度。数值为非负像素，也可传 CSS 长度。"],
  tabHeight: ["标签的最小高度。数值为非负像素，也可传 CSS 长度。"],
  tabMaxWidth: ["限制长标签宽度，超出内容省略。", "240px"],
  gap: ["标签之间的间距，支持非负像素或 CSS 长度。", "随外观"],
  radius: ["标签圆角，支持非负像素或 CSS 圆角值。", "随外观"],
  separator: ["在相邻标签之间显示装饰分隔线。", "false"],
  sticky: ["按就近滚动容器吸顶，底部标签栏吸底。", "false"],
  fixed: [
    "将顶部或底部标签栏固定在视口，并为原位置保留高度。垂直布局可用 sticky。",
    "false",
  ],
  barOffset: ["吸附边缘的偏移量，支持非负像素或 CSS 长度。", "0"],
  panelHeight: ["固定面板高度，并启用内容独立滚动。"],
  panelMaxHeight: ["面板最大高度，超过后在面板内滚动。"],
  closable: ["默认显示关闭按钮，单项 closable 可覆盖。", "false"],
  addable: [
    "显示添加按钮并发出 add。配置 createTab 或 workbench 可生成实际标签。",
    "false",
  ],
  editable: ["同时开启添加和关闭。", "false"],
  autoActivate: [
    "添加、恢复时激活新项。当前标签移除或隐藏时，优先选择右侧最近的可用标签，再向左查找。",
    "true",
  ],
  trigger: ["click 点击激活，hover 悬停达到延迟后激活。", "click"],
  hoverDelay: [
    "悬停操作的等待时间，0–5000 ms。预览默认 180 ms，直接激活默认 0 ms。",
    "随触发方式",
  ],
  preview: ["click 模式悬停时显示预览，移动到其他标签或离开时结束。", "false"],
  activation: [
    "auto 用方向键移动并选中，manual 只移动焦点，Enter 或空格激活。",
    "auto",
  ],
  lazy: ["首次激活或预加载时挂载内容。", "true"],
  preload: ["true 预加载所有可见标签，也可传要提前准备的标识数组。", "false"],
  destroyOnHide: [
    "隐藏时卸载面板 DOM，forceRender 优先。设为 false 时保留已访问面板。",
    "false",
  ],
  cacheLimit: [
    "延迟挂载模式的已访问面板缓存上限，至少 1。当前与 forceRender 面板始终保留。",
    "不限",
  ],
  animated: ["控制标签和面板动画，遵循全局动效和系统减少动效。", "true"],
  animation: ["面板切换效果。fade、slide、scale、spring 或 none。", "fade"],
  animationName: [
    "使用调用方定义的 CSS @keyframes 名称，优先于 animation，遵循动效关闭设置。",
  ],
  duration: ["动画时长，单位 ms，范围 0–5000。", "160"],
  easing: ["CSS 动画缓动函数，可传 cubic-bezier()。", "随效果"],
  overflow: [
    "scroll 单行滚动，wrap 自动换行，menu 增加搜索菜单，clip 裁切并通过菜单访问。",
    "scroll",
  ],
  showScrollButtons: ["标签溢出时显示方向滚动按钮。", "true"],
  scrollAlign: ["激活标签只滚动到可见位置，或滚动到居中位置。", "nearest"],
  wheel: [
    "none 跟随原生滚动，scroll 滚动标签栏，switch 切换到相邻可用项。",
    "none",
  ],
  dragScroll: [
    "使用鼠标拖动页签栏滚动。开启拖拽排序后，拖住排序标签时优先排序。",
    "false",
  ],
  swipe: ["内容区接受触摸横向滑动，保留纵向滚动。", "false"],
  draggable: ["允许拖动和 Alt + Shift + 方向键调整可移动标签。", "false"],
  dragHandle: ["拖动排序时只接受从手柄开始的手势。", "false"],
  longPress: [
    "触屏或笔长按时长，范围 0–5000 ms。0 关闭，工作台和右键模式默认 550 ms。",
    "随模式",
  ],
  contextMenu: [
    "启用右键与 Shift + F10 菜单。工作台默认开启。",
    "随 workbench",
  ],
  shortcuts: [
    "启用 F2 重命名及 Alt + Shift + PageUp/PageDown 切换。关闭按钮可用 Delete。",
    "false",
  ],
  titleTooltip: ["使用原生 title 显示完整标签文字。", "true"],
  moreSearch: ["在更多菜单内显示搜索框。", "true"],
  confirmDirty: [
    "批量或单项关闭 dirty 标签前显示确认。仍会执行 beforeClose。",
    "true",
  ],
  historyLimit: ["最近使用和最近关闭各自保存的记录数，范围 0–200。", "20"],
  storageKey: ["选择性启用浏览器持久化。实例使用独立键可隔离会话。"],
  storage: ["选择 sessionStorage 或 localStorage。", "session"],
  persistScroll: ["保存并恢复标签栏横向与纵向滚动位置。", "false"],
  restoreItem: [
    "根据持久化快照重新构造原列表已没有的标签。可恢复加载函数、图标与业务内容。",
  ],
  createTab: [
    "点击新增时生成标签，接收当前列表。可返回 Promise，返回 undefined 时结束新增。",
  ],
  ariaLabel: ["标签列表的可访问名称。", "页签"],
  beforeLeave: [
    "切换守卫，接收 (next, current, { item, signal, source })。返回 false 或拒绝时停止。新请求会中止旧检查。",
  ],
  beforeClose: [
    "每个待关闭标签的守卫。返回 false 保留该项，批量关闭中的其他项仍可继续检查。",
  ],
  beforeReorder: [
    "同步排序检查，接收 { value, from, to, items }。false 保留原顺序。",
  ],
};
const events = {
  "update:modelValue": "请求切换至新标签标识，供 v-model 同步。",
  "update:items": "变更后的标签数组，供 v-model:items 同步。",
  change: "切换通过守卫后发送目标标签标识，与 update:modelValue 同时发出。",
  selectionChange: "切换通过守卫后的来源信息，包含 value、previous、source。",
  tabClick: "点击可用标签时发送标识和原生 MouseEvent。",
  tabDblclick: "双击可用标签时发送标识和原生 MouseEvent。",
  tabContextmenu: "右键或键盘请求标签菜单时发送标识和原生事件。",
  tabLongpress: "触屏长按达到阈值时发送标签标识和 PointerEvent。",
  previewChange: "预览开始时发送标签标识，结束时发送 undefined。",
  close: "通过检查的单项关闭请求，载荷为标签标识。",
  closeBatch: "批量检查结束后发送允许关闭的标识数组。",
  add: "请求创建新标签，在调用 createTab 前触发。",
  edit: "兼容新增与关闭通知，载荷为标识或 undefined，以及 add 或 remove。",
  reorder: "提交排序方案时发送 { value, from, to, items }，索引从 0 开始。",
  restore: "恢复项被接受后发送完整标签对象。",
  rename: "名称更新被接受后发送标签标识和新名称。",
  pinChange: "固定状态更新被接受后发送标识和布尔值。",
  favoriteChange: "收藏状态更新被接受后发送标识和布尔值。",
  loadStart: "异步内容请求开始时发送标签标识。",
  load: "异步内容加载成功时发送标签标识和加载结果。",
  loadError: "异步内容加载失败时发送标签标识和原始错误。",
  guardError: "切换、关闭、排序或创建回调抛出异常时发送原始错误。",
  storageError: "存储访问或解析失败时发送原始错误。",
};
const slots = {
  default:
    "数据模式的当前内容插槽，接收 active。未传数据时可直接声明 HysTabPane。",
  panes: "声明式 HysTabPane 列表，可通过 v-if 和 v-for 动态生成。",
  label: "标签文字，接收 { item, active }。",
  icon: "标签图标，接收 { item, active }。",
  badge: "标签徽章，接收 { item, active }。",
  "status-icon": "标签末尾的状态图标，接收 { item, active }。",
  panel: "自定义面板，接收 { item, active, loading, error, content, reload }。",
  loading: "加载中的面板内容，接收面板上下文。",
  error: "面板加载失败的内容，接收错误和 reload 方法。",
  empty: "面板没有内容时显示，接收面板上下文。",
  preview: "悬停预览的非交互内容，接收 { item, active }。",
  prefix: "标签栏起始侧的附加区域。",
  suffix: "标签栏末尾的附加操作区。",
  "close-icon": "替换关闭按钮图形，接收 { item, active }。",
  "add-icon": "替换新增按钮图形。",
  "more-icon": "替换更多菜单按钮图形。",
  more: "自定义更多菜单。接收 items、overflowed、active、select 和 close。",
  contextmenu: "自定义右键菜单。接收 item、run(action) 和 close。",
};
const exposed = {
  active: "当前激活的标签标识。",
  recent: "最近激活的标签标识，按最近使用排序。",
  closed: "最近关闭的标签快照，最新项在前。",
  select: "运行切换守卫并选择标签，返回是否实际激活。",
  focus: "聚焦指定标签。省略标识时聚焦当前或首个可用项。",
  scrollToActiveTab: "将当前标签滚动到可视区域，不滚动整个页面。",
  add: "请求新增，接受标签对象。省略时使用 createTab 或工作台默认项。",
  close: "请求关闭指定标签，省略时关闭当前项。",
  closeMany:
    "关闭一组标识或 current、left、right、others、all，返回通过检查的标识。",
  rename: "设置指定标签的新名称，返回父组件是否接受变更。",
  move: "将指定项放到目标前，after=true 放到目标后，遵守固定和移动规则。",
  pin: "设置或切换指定标签的固定状态。",
  favorite: "设置或切换指定标签的收藏状态。",
  restore: "恢复最近关闭且尚未打开的标签。",
  preload: "提前准备指定标签并等待异步内容。",
  reload: "中止旧加载、重建指定面板并重新请求。默认使用当前标签。",
  save: "立即写入已配置的浏览器存储，成功返回 true。",
};
export function applyTabsApi(name, api) {
  if (name !== "HysTabs" && name !== "HysTabPane") return;
  for (const row of api.props) {
    if (name === "HysTabPane")
      row.description = pane[row.name] ?? row.description;
    else if (props[row.name]) {
      row.description = props[row.name][0];
      row.default = props[row.name][1] ?? "";
    }
  }
  for (const [section, map] of [
    ["events", events],
    ["slots", slots],
    ["exposed", exposed],
  ])
    for (const row of api[section])
      row.description = map[row.name] ?? row.description;
  if (name === "HysTabPane")
    for (const row of api.slots)
      if (row.name === "default")
        row.description =
          "该面板的内容，接收 { item, active, loading, error, content, reload }。";
}
