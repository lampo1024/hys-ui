const props = {
  trigger:
    "打开方式。click 支持点击及原生键盘激活，contextmenu 支持右键和 Shift+F10，manual 由外部状态或实例控制。",
  triggerText: "未提供触发插槽或外部 reference 时，内置按钮的文案。",
  offset: "气泡与锚点的间距，单位 px，默认 9。负值可让气泡与锚点重叠。",
  arrowOffset: "箭头距离气泡边缘的最小留白，单位 px。默认 10，低于 6 时按 6 处理。",
  width: "气泡宽度，支持非负像素数值或 CSS 长度。省略时随内容变化。",
  maxWidth: "气泡最大宽度，支持非负像素数值或 CSS 长度。默认 360px，同时受视口宽度约束。",
  popupTransitionDuration: "展开与收起动画时长，默认 160 ms。值限制在 0–2000 ms，0 关闭动画。",
  open: "受控展开状态，优先于 modelValue。通过 v-model:open 接收展开和收起请求。",
  modelValue: "受控展开状态的别名，通过 v-model 绑定。",
  defaultOpen: "非受控的初始展开状态。挂载后有可用锚点时生效。",
  title: "提示标题和浮层可访问名称。title 插槽优先，空字符串可隐藏标题。",
  description:
    "标题下方的辅助说明。description 插槽优先，默认通过 aria-describedby 关联。",
  tone: "语义外观。neutral、info、success、warning、danger 控制默认图标和状态色，success 与 danger 同时改变确认按钮的默认颜色。",
  icon: "自定义 Vue 图标组件。false 禁用默认图标，icon 插槽优先。",
  showIcon: "控制是否显示图标区域，含 icon 插槽。",
  confirmText: "默认确认按钮的文案。可改为删除报告、发布公告等具体动作。",
  cancelText: "默认取消按钮的文案。",
  pendingText: "执行确认或取消检查时的加载文案，同时用于屏幕阅读器状态播报。",
  errorText:
    "失败时的安全文本，或 (error, context) => string。省略时显示对应动作的通用失败文案。",
  confirmVariant:
    "确认按钮的 HysButton 外观。默认随语义色选择 primary、danger 或 success。",
  cancelVariant: "取消按钮的 HysButton 外观。",
  size: "默认操作按钮尺寸，使用 HysButton 的 sm、md、lg 或相应别名。",
  align: "操作区对齐方式，start、center 或 end。窄屏下按钮可换行。",
  showCancel: "显示默认取消按钮。隐藏后默认初始焦点落在浮层容器。",
  confirmDisabled: "禁用确认操作，同时约束 confirm() 和插槽方法。",
  cancelDisabled: "禁用显式取消操作，同时约束 cancel() 和插槽方法。",
  loading: "由调用方控制的确认忙碌状态。启用时阻止重复确认。",
  allowCancelWhilePending:
    "处理中允许点击取消。若正在运行内部确认任务，会先中止该任务，再运行 beforeCancel。",
  dismissWhilePending:
    "处理中允许通过外部点击、Escape、再次触发或 Tab 离开来收起气泡。收起会中止内部任务。",
  closeOnConfirm: "确认成功后请求收起。受控模式下由父组件接受请求。",
  closeOnCancel: "取消成功后请求收起。受控模式下由父组件接受请求。",
  initialFocus:
    "展开时的初始焦点。cancel、confirm 聚焦相应可用按钮，panel 聚焦浮层，none 保留焦点。",
  restoreFocus:
    "确认、取消、Escape 或实例收起后，将焦点移回仍在页面上的触发控件。点击外部保留用户点击的目标。",
  beforeConfirm:
    "确认前检查，接收 { action, signal, event }。同步或异步返回 false 会停止本次操作。",
  beforeCancel:
    "取消前检查，接收 { action, signal, event }。同步或异步返回 false 会保留浮层。",
  action:
    "业务提交函数，接收 { action, signal, event }。返回值交给 confirm 事件，false 保留浮层，抛出或拒绝时显示错误并允许重试。",
};
const defaults = {
  defaultOpen: "false",
  disabled: "false",
  effect: "'light'",
  width: "按内容",
  maxHeight: "calc(100vh - 20px)",
  arrowOffset: "10",
  triggerTabindex: "0",
  triggerKeys: "['Enter', ' ']",
  errorText: "按动作显示通用失败文案",
  confirmVariant: "按 tone 选择",
  confirmDisabled: "false",
  cancelDisabled: "false",
  loading: "false",
  allowCancelWhilePending: "false",
  dismissWhilePending: "false",
  forceRender: "false",
  maxWidth: "360",
  offset: "9",
};
const events = {
  confirm:
    "检查和提交均完成后发出，载荷为 result、HysPopconfirmActionContext。",
  cancel: "显式取消且取消检查通过后发出，载荷为 HysPopconfirmActionContext。",
  dismiss:
    "非确认、非取消的收起请求被接受后发出。载荷为 trigger、outside、escape、tab、anchor 或 programmatic。",
  error:
    "检查或提交抛出异常时发出，载荷为原始错误和 HysPopconfirmActionContext。",
};
const slots = {
  default:
    "触发按钮内容，与 trigger 插槽等效，trigger 优先。接收 HysPopconfirmContext。",
  trigger:
    "自定义触发内容，接收 HysPopconfirmContext。推荐使用原生按钮或 HysButton。",
  title: "自定义标题，接收 HysPopconfirmContext。保留浮层的辅助技术名称关联。",
  description: "自定义说明或操作前的表单字段，接收 HysPopconfirmContext。",
  icon: "替换默认图标，接收 HysPopconfirmContext。装饰区域对辅助技术隐藏。",
  actions:
    "替换默认操作区。接收 confirm、cancel、abort、pending、busy、confirmDisabled、cancelDisabled 等上下文。",
  error: "自定义错误提示，接收包含 error 的 HysPopconfirmContext。",
};
const methods = {
  confirm:
    "执行确认检查和业务操作，返回 Promise<boolean>。true 表示动作完成，受控显示状态仍由父组件决定。",
  cancel: "执行取消检查，返回 Promise<boolean>。true 表示显式取消动作完成。",
  abort:
    "中止内部等待并清除内部忙碌状态，保持当前浮层。将 signal 传给业务函数以中止请求。",
  clearError: "清除当前错误提示。",
  pending:
    "当前动作，为 confirm、cancel 或 null。loading=true 时视为 confirm。",
  error: "当前显示的失败文案，无错误时为空字符串。",
  close:
    "请求收起并按 restoreFocus 处理焦点，返回 Promise<boolean>。可以结束等待中的操作。",
  hide: "close 的别名。",
};

export function applyPopconfirmApi(api) {
  for (const row of api.props) {
    row.description = props[row.name] ?? row.description;
    row.default = defaults[row.name] ?? row.default;
  }
  for (const [section, descriptions] of [
    ["events", events],
    ["slots", slots],
    ["exposed", methods],
  ])
    for (const row of api[section])
      row.description = descriptions[row.name] ?? row.description;
}
