const spinProps = {
  spinning:
    "受控加载开关，优先于 modelValue。程序关闭时发出更新请求，由宿主接受。",
  modelValue: "spinning 的 v-model 别名。省略两种受控值时使用组件内部状态。",
  defaultSpinning:
    "非受控初值。独立使用默认 true，绑定 task 时在任务启动前保持隐藏。",
  mode: "inline 行内、block 块级、indicator 独立、container 容器、overlay 局部覆盖、fullscreen 全屏。含默认插槽时默认 container。",
  size: "xs、sm、md、lg、xl 对应 14、20、30、42、56px。也接受像素数字或 CSS 长度，默认 md。",
  width: "单独覆盖指示器宽度。数字为 px，也支持 CSS 长度。",
  height: "单独覆盖指示器高度。数字为 px，也支持 CSS 长度。",
  regionHeight: "加载区域的最小高度。数字为 px，可用 CSS 长度响应式调整。",
  delay: "启动至指示器显示的等待时间，毫秒，默认 0。提前结束时跳过指示器。",
  minDuration:
    "一旦显示至少保留的时间，毫秒，默认 0。重入加载会取消待执行的隐藏。",
  timeout:
    "任务或手动加载的超时时间，毫秒，0 不限制。任务超时会中止 signal 并发出 timeout。",
  autoEnd: "自加载请求开始后的自动结束时间，毫秒，0 不启用。",
  task: "Promise 或接收 HysSpinTaskContext 的工厂。挂载后自动运行，引用更换时替换旧任务。",
  status:
    "覆盖当前状态，可用 idle、loading、retrying、success、error、cancelled、timeout 或业务字符串。",
  showResult:
    "加载结束后保留终态区域，默认 false。可调用 clearResult() 清除内部结果。",
  progress: "0–100 的确定进度。未传时显示不确定加载，越界值截断。",
  progressType: "确定进度使用 ring（默认）、line 或 segments。",
  segments: "分段进度的格数，2–30 取整，默认 8。单格可部分填充。",
  showPercentage: "确定进度是否显示数值文本，默认 true。",
  formatProgress: "自定义百分比文本，接收截断后的 0–100 数值，返回字符串。",
  title: "加载提示标题，可和 message、description 一起显示。",
  message: "加载正文，支持随任务或属性动态更新，message 插槽可替换。",
  description: "正文下方的补充说明。",
  stage: "当前加载阶段的简短说明。",
  remainingTime: "预计剩余时间，毫秒。界面向上取整为秒。",
  layout:
    "图标相对文字的位置，top、bottom、left 或 right。行内默认 left，覆盖默认 top。",
  placement: "覆盖层内的内容位置，默认 center，支持边缘及逻辑起止角。",
  align: "指示器内部对齐，start、center 或 end，默认 center。",
  gap: "图标、正文与动作之间的间距。数字为 px，默认 8px。",
  ariaLabel: "覆盖默认辅助技术播报文本。确定进度使用进度条语义。",
  mask: "显示遮罩背景，覆盖模式默认 true。false 时仍可单独阻止交互。",
  maskColor: "遮罩 CSS 颜色，默认跟随主题表面色。",
  maskOpacity: "遮罩透明度，0–1，默认 .72。",
  blur: "遮罩对底层内容的模糊强度，像素，默认 0。",
  zIndex: "覆盖层层级，全屏默认 2200。参与项目共用的浮层顺序。",
  appendTo:
    "全屏模式或命令式局部加载的目标，CSS 选择器、HTMLElement 或 ShadowRoot。全屏默认 body。",
  blockInteraction: "覆盖期间阻止底层操作，默认 true。局部内容使用 inert。",
  lockScroll: "加载期间锁定滚动，全屏默认 true，局部默认 false。",
  cancellable: "显示取消按钮，触发 cancel() 并中止当前任务。",
  retryable: "失败、超时、取消状态显示重试按钮。工厂任务可重复执行。",
  escapeCancel: "全屏加载中允许按 Escape 取消，需同时开启 cancellable。",
  cancelLabel: "取消按钮文案，默认取消加载。",
  retryLabel: "重试按钮文案，默认重试。",
  preset:
    "选用 provideHysSpin 或 configureHysSpin 注册的动画预设，显式属性可覆盖。",
  animation:
    "内置预设名，默认 circle。完整列表由 hysSpinAnimations 提供，custom 可搭配 indicator 插槽。",
  animationName: "为指示器指定额外的 CSS keyframes 名称。",
  speed: "播放速度倍数，.05–20，默认 1。",
  animationDuration: "单次循环时长，毫秒，默认 900，最终时长再除以 speed。",
  animationDelay: "单次动画的 CSS 延迟，毫秒，可为负数，默认 0。",
  direction:
    "normal 顺时针或 reverse 逆时针，默认 normal。多环效果相邻环交替方向。",
  angle: "旋转类预设每轮转过的角度，默认 360 度。",
  easing: "CSS timing-function，默认 linear。",
  iterations: "CSS 动画循环次数，默认 infinite，也可传非负数字。",
  path: "draw 等路径预设使用的 SVG path d 数据，坐标范围基于 48×48。",
  animated: "设为 false 时显示静态指示器，默认 true。",
  paused: "由宿主暂停或恢复动画。实例 pause() 还能单独控制。",
  pauseWhenHidden: "文档隐藏时暂停动画，默认 true。切回页面后继续。",
  transitionDuration: "加载层淡入和淡出的时长，毫秒，默认 160。",
  color: "覆盖主题的指示器颜色，可传 CSS 颜色或变量。",
  trackColor: "环形、线性和分段进度的底轨颜色。",
  strokeWidth: "SVG 圆环或路径描边宽度，基于 48×48 视框，默认 4。",
  dotSize: "点状预设的点半径，基于视框，1–8，默认 4。",
  dotGap: "点阵或点列的中心间距，基于视框，6–17，默认 11。",
  colors: "多环、点和柱使用的循环颜色列表。",
  gradient: "渐变圆环的颜色停靠点，按输入顺序等距分布。",
  indicatorStyle: "指示器布局附加样式，例如背景、圆角、边框、阴影和透明度。",
  messageStyle: "加载文案区域的附加 CSS 样式。",
  overlayStyle: "加载层附加 CSS 样式，可覆盖遮罩几何、层级和 CSS 变量。",
};

const iconProps = {
  name: "注册表名称或别名。省略命名空间时查找 core，示例 team:metric。",
  source:
    "直接传入结构化 SVG、Sprite、图片、字体、文本或 Vue 组件资源，优先于 name。",
  variant:
    "风格名称，默认 outline。优先匹配注册变体，缺省回退基础资源。bold、thin、round、sharp 可调整 SVG 笔画。",
  registry: "本实例使用的图标注册表，省略时继承 provideHysIcons 或全局注册表。",
  status:
    "业务状态，默认 default。loading、success、error、warning 和 info 可自动选择内置图标。",
  statusIcons: "状态到图标名称或资源的映射，可覆盖内置状态图标或扩展状态。",
  fallback: "加载失败时的备用名称或资源，默认 help。false 隐藏默认回退。",
  loadingIcon: "异步加载时的备用名称或资源，默认 loader。false 隐藏指示器。",
  size: "xs、sm、md、lg、xl 分别对应 12、16、20、28、36px。接受 CSS 长度，默认 1em。",
  width: "独立宽度。数字为 px，字符串为 CSS 长度。",
  height: "独立高度。数字为 px，字符串为 CSS 长度。",
  fit: "SVG 和图片的适配方式，contain（默认）、cover 或 fill。",
  color: "图标 CSS 颜色。currentColor 图形自动继承。",
  theme: "覆盖 HYS-UI 主题，system 根据系统深浅模式切换。省略时继承。",
  fill: "结构化 SVG 的默认填充。节点上显式填充仍生效。",
  stroke: "结构化 SVG 的默认描边颜色。节点上显式描边仍生效。",
  strokeWidth: "SVG 默认描边粗细，outline 默认 1.8，bold 2.8，thin 1。",
  gradient: "为结构化 SVG 描边生成渐变，传 CSS 颜色数组。",
  opacity: "整体透明度，0–1，默认 1。",
  background: "图标外框的 CSS 背景。",
  shape: "背景形状，circle、square 或 rounded，默认圆角矩形。",
  radius: "自定义背景圆角。数字为 px，覆盖 shape。",
  border: "图标外框 CSS border。",
  padding: "图标外框内边距。数字为 px，默认 0。",
  gap: "图形与默认插槽文字之间的间距，默认 6px。",
  shadow: "CSS box-shadow。",
  glow: "CSS drop-shadow() 参数，例如 0 0 5px #669aff。",
  rotate: "图形旋转角度，单位度，默认 0。可和动画、翻转叠加。",
  flipX: "水平翻转图形。",
  flipY: "垂直翻转图形。",
  align: "图标容器内部的水平逻辑对齐，start、center 或 end。",
  verticalAlign: "与周围行内文本的 CSS vertical-align。",
  directional: "在 RTL 中镜像。省略时由注册记录的 directional 决定。",
  animation:
    "内置动效或自定义 CSS keyframes 名称，默认 none。加载状态默认 loading。",
  animateOn:
    "always、hover、click 或 state。默认 always，hover 同时支持键盘焦点。",
  animated: "设为 false 时显示静态图标。",
  paused: "由宿主暂停或恢复动画，文档不可见时也会暂停。",
  duration: "单次动画时长，毫秒，默认 900。",
  speed: "速度倍数，.05–20，默认 1。",
  animationDelay: "动画延迟，毫秒，可为负数，默认 0。",
  iterations: "动画次数。点击和状态触发默认 1 次，其他默认 infinite。",
  easing: "CSS 缓动函数，例如 ease-in-out 或 cubic-bezier(...)。",
  morphTo: "morph 动效的目标 path d。首个路径与目标应使用兼容的命令序列。",
  animationStyle: "图标根元素的附加样式，也可覆盖动画 CSS 变量。",
  decorative: "装饰图标隐藏于辅助技术。带 label 或交互模式时自动保留语义。",
  label: "功能图标的辅助技术名称。图标按钮和图标链接建议显式提供。",
  clickable: "渲染为原生 button，支持 Enter 和空格。",
  href: "渲染为链接，接受 HTTP(S)、相对链接或合法的页面锚点。",
  target: "链接打开方式，例如 _blank。",
  rel: "链接 rel。target 为 _blank 时默认 noopener noreferrer。",
  disabled: "禁用原生按钮或阻止链接导航。",
  readonly: "保留交互语义和焦点，阻止点击动作或链接导航。",
  active: "显示激活样式。",
  selected: "按钮选择状态，使用 v-model:selected 接收切换。",
  tooltip: "使用 HysTooltip 显示悬停和键盘焦点说明。",
  badge: "角标数字、文本或 true 圆点。未传或 false 时隐藏。",
  badgePosition:
    "逻辑角标位置，top-start、top-end、bottom-start、bottom-end，默认 top-end。",
  badgeMax: "数字角标显示上限，默认 99，超过时显示上限加号。",
  secondary: "叠放一个右下辅助图标，可传名称或资源。",
  layers: "多层图标列表，每层接受 icon、size、x、y、rotate、color。",
  allowedOrigins:
    "外部图片和 Sprite 允许的来源列表。相同来源始终可用；省略时允许 HTTP(S) 来源。",
  picker: "显示可搜索的图标选择器，通过 v-model:name 同步选中名称。",
  allowUpload:
    "图标选择器显示 SVG 批量导入入口。导入会进行元素、属性和引用白名单处理。",
  storageKey:
    "图标选择器收藏与最近使用的本地存储键。省略时只保存在当前实例内。",
  pickerLocale: "覆盖选择器的搜索、筛选、收藏、复制和导入文案。",
};

const spinEvents = {
  "update:modelValue": "手动、自动或任务开始结束时请求更新模型，载荷为布尔值。",
  "update:spinning": "与 update:modelValue 同步触发，可使用 v-model:spinning。",
  change:
    "加载快照变化，含 spinning、status、progress、message、stage、remainingTime 和 error。",
  start: "加载请求开始时触发，早于可见延迟。",
  end: "加载请求结束，最短显示时长仍可能保留指示器。",
  show: "加载或结果区域开始显示。",
  hide: "加载或结果区域开始隐藏。",
  afterHide: "退出动画完成，区域已移除。",
  cancel: "显式取消时触发，载荷为当前加载快照。",
  timeout: "任务或加载请求超时，载荷为当前加载快照。",
  retry: "请求重试，记录工厂时会自动再运行。",
  error: "任务失败，参数依次为原始错误与加载快照。",
  success: "任务完成，载荷为终态快照。",
};
const iconEvents = {
  "update:name": "选择器或 select(name) 请求更新图标名称。",
  "update:selected": "可交互按钮激活时请求更新选择状态。",
  change: "名称、风格或状态变更，载荷为 HysIconContext。",
  statusChange: "状态变化，参数为新状态和旧状态。",
  load: "图标资源已就绪，参数为 HysIconContext 和可选的原生图片事件。",
  error: "资源不存在、被限制或加载失败，参数为错误和 HysIconContext。",
  click: "可交互且未禁用时发出原生点击事件。",
  dblclick: "可交互且未禁用时发出原生双击事件。",
  mouseenter: "鼠标进入图标，载荷为原生 MouseEvent。",
  mouseleave: "鼠标离开图标，载荷为原生 MouseEvent。",
  focus: "图标获得焦点，载荷为原生 FocusEvent。",
  blur: "图标失去焦点，载荷为原生 FocusEvent。",
  keydown: "图标接收到按键，载荷为原生 KeyboardEvent。",
};
const spinSlots = {
  default: "被加载层覆盖的业务内容。内容保持挂载，阻断模式下暂时不可交互。",
  indicator: "替换默认动画或进度环。接收 HysSpinContext。",
  icon: "indicator 的备选图标插槽，接收 HysSpinContext。",
  message: "替换消息正文，接收状态、阶段和进度。",
  progress: "替换默认进度条与进度文本，接收 progress 和 percentText。",
  overlay: "替换覆盖层内部的完整内容，接收 cancel()、retry() 和快照。",
  actions: "替换取消与重试操作区域，接收 HysSpinContext。",
};
const iconSlots = {
  default: "在图标后追加文字或内联内容，接收 HysIconContext。",
  icon: "替换当前图形，接收解析后的来源和状态。",
  loading: "替换懒加载占位，接收 HysIconContext。",
  fallback: "替换失败回退图标，接收 HysIconContext。",
  badge: "自定义角标内容，位置遵循 badgePosition。",
};
const spinMethods = {
  show: "手动开始加载，受控时请求更新宿主。",
  hide: "请求停止显示，仍遵循最短显示时间。",
  toggle: "切换请求中的加载状态。",
  run: "执行 Promise 或任务工厂，返回保留业务结果的 Promise。",
  cancel: "中止当前任务或关闭手动加载，并发出取消状态。",
  retry: "再次执行上一任务工厂，返回 Promise；无工厂时只发出 retry 事件。",
  update: "更新内部文案、阶段、状态和进度。显式属性优先。",
  pause: "暂停当前 CSS 动画，加载状态保持。",
  resume: "解除实例暂停或停止。",
  stop: "停止实例的 CSS 动画。",
  restart: "从头启动实例动画。",
  clearResult: "在没有任务运行时清除内部终态。",
  visible: "指示器实际是否显示，包含延迟和最短时长。",
  snapshot: "当前 HysSpinSnapshot。",
};
const iconMethods = {
  element: "图标根元素，选择器模式下为空。",
  focus: "聚焦图标根元素。",
  select: "更新选中名称并发出 update:name。",
  reload: "重新解析当前图标，失败的懒加载可重新请求。",
  preload:
    "按当前风格和 allowedOrigins 预加载名称数组，返回逐项成功或失败结果。",
  play: "触发或重播动画。",
  restart: "从头重播动画。",
  pause: "暂停动画。",
  resume: "恢复播放。",
  stop: "停止动画，图形保留。",
};
export function applySpinIconApi(name, api) {
  const spin = name === "HysSpin";
  const descriptions = {
    props: spin ? spinProps : iconProps,
    events: spin ? spinEvents : iconEvents,
    slots: spin ? spinSlots : iconSlots,
    exposed: spin ? spinMethods : iconMethods,
  };
  for (const [kind, rows] of Object.entries(api))
    for (const row of rows) {
      row.description = descriptions[kind]?.[row.name] ?? row.description;
    }
}
