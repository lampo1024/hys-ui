export function applyToastApi(api) {
  const descriptions = {
    open: "受控显示状态。省略时由非空 message、title 或内容插槽触发；配合 v-model:open 使用。",
    message:
      "纯文本正文，自动换行。富文本使用默认插槽，或命令式调用的 content。",
    title: "可选标题，header 插槽可替换标题区域。",
    type: "success、error、warning、info、loading、default、custom。声明式默认 success，服务默认 info；default 和 custom 可使用 icon 插槽。",
    duration:
      "自动关闭时长，单位毫秒。默认 3000，loading 默认 0。非正数持续显示。",
    persistent: "设为 true 时持续显示，优先于 duration。",
    closable: "显示关闭按钮，默认 true。interactive 为 false 时隐藏。",
    closeOnClick: "点击消息区域请求关闭，内部按钮、链接和表单控件独立处理。",
    closeOnEscape:
      "允许按 Escape 关闭。优先关闭含当前焦点的提示，否则关闭最近显示的一条符合条件的提示。",
    keyboardDismiss:
      "将消息加入 Tab 顺序，聚焦消息本身后可按 Delete 关闭。closeOnClick 开启时也支持 Enter 和空格。",
    pauseOnHover: "鼠标悬停时暂停剩余计时，默认 true；聚焦提示内部也会暂停。",
    pauseOnBlur:
      "浏览器窗口失焦或文档隐藏时暂停，默认 true。恢复后继续剩余时间。",
    swipe: "允许鼠标或触摸横向拖动关闭。短距离拖动或关闭拦截后回弹。",
    interactive:
      "是否允许关闭按钮、操作按钮、复制、点击、键盘与滑动交互，默认 true。程序调用和定时关闭仍生效。",
    position:
      "top-left、top-center（默认）、top-right、bottom-left、bottom-center、bottom-right、center、custom；兼容 top 和 bottom。",
    offset:
      "与窗口边缘的默认距离，非负像素，默认 24；offsetX、offsetY 分别覆盖对应轴。",
    offsetX: "横向边缘偏移，非负像素。水平居中的位置使用居中对齐。",
    offsetY: "纵向边缘偏移，非负像素。center 使用双轴居中。",
    coordinates:
      "position 为 custom 时使用的 CSS 定位对象，接受 top、right、bottom、left、translate。缺省轴使用偏移量。",
    zIndex: "定位容器的层级，默认 2000。",
    width:
      "消息宽度，数字为像素，也可传 CSS 长度；默认按内容适配并受视口限制。",
    showIcon: "显示状态图标或 icon 插槽，默认 true。",
    plain: "使用主题的柔和背景。",
    glass: "使用半透明背景及背景模糊。",
    theme: "本条提示的 HYS-UI 主题，省略时继承当前配置。",
    toastStyle:
      "附加 CSS 样式，可配置背景、文字、边框、圆角、阴影、透明度以及 CSS 变量。",
    progressStyle: "进度条填充区域的样式，可覆盖颜色、渐变等。",
    progress:
      "业务进度，数值范围 0–100，超出会截断；indeterminate 表示不确定进度。设置后优先于关闭计时条。",
    showProgress: "显示自动关闭的剩余进度，持续显示时不出现计时条。",
    countdown: "显示自动关闭的剩余秒数，向上取整。持续显示时不出现倒计时。",
    maxLines: "正整数。正文折叠行数，默认不限，开启交互时可展开。",
    copyable: "显示复制按钮，通过浏览器 Clipboard API 写入。",
    copyText: "覆盖复制文本，默认使用 message 或可见正文文本。",
    actionLayout: "inline（默认）在内容旁排列，footer 单独占一行并靠右。",
    actions:
      "操作数组。每项包含 id、label，可选 disabled、run(context)、closeOnSuccess、success 和 error。异步执行时显示加载，默认成功后关闭。",
    animation:
      "scale（默认）、fade、slide、spring、bounce、rotate、none，或传 {enterFrom,leaveTo?,opacity?} 指定 CSS transform。",
    direction: "top、bottom、left、right，控制位移动画来源。省略时从位置推断。",
    animationDuration:
      "入场和退场时长，单位毫秒，默认跟随全局动效；0 表示立即完成。",
    easing:
      "CSS 缓动字符串或接收 0–1 进度的函数。函数采样为 CSS linear()；省略或不支持时使用预设。",
    live: "polite、assertive 或 off。错误默认 assertive，其余默认 polite。",
    locale:
      "部分覆盖界面文案和格式化函数，包括关闭、复制、展开、倒计时、重复次数、队列折叠和操作失败反馈。",
    beforeClose:
      "关闭前接收 {id,message,title,type,reason,event?}，支持异步。返回 false 或拒绝 Promise 时保留提示。",
    teleport: "是否传送到 appendTo，默认 true。false 表示在原位置展示。",
    appendTo: "选择器、HTMLElement 或 ShadowRoot，默认 body。",
    repeat: "重复次数，默认 1，大于 1 时显示计数。",
    paused: "由外部暂停关闭计时。恢复仍受悬停、聚焦、失焦和操作状态约束。",
  };
  const events = {
    "update:open":
      "请求关闭受控提示，载荷为 false。宿主更新 open 后才开始关闭。",
    update: "请求合并 HysToastPatch，来自操作或插槽。监听后由宿主处理更新。",
    show: "提示开始显示，载荷为 HysToastContext。",
    afterShow: "入场动画结束，载荷为 HysToastContext。",
    close: "接受关闭并开始退场，载荷为 HysToastCloseContext，含关闭来源。",
    afterClose: "退场动画结束，载荷与 close 相同。",
    click: "点击消息区域，参数为原生 MouseEvent 和 HysToastContext。",
    action: "操作开始、成功或失败，载荷含 action、status 及可选 result。",
    stateChange:
      "显示状态变化，参数为 visible、closing 或 closed，以及 HysToastContext。",
  };
  const slots = {
    default: "替换正文，接收 HysToastActionContext。",
    icon: "替换状态图标，接收 HysToastActionContext。",
    header: "替换标题区域，接收 HysToastActionContext。",
    footer: "在正文下加入自定义内容，接收 HysToastActionContext。",
    action:
      "替换内置操作按钮，接收包含 close()、update(patch)、copy() 的 HysToastActionContext。",
  };
  const exposed = {
    element: "提示根元素，未显示时为空。",
    close:
      "请求关闭并返回 Promise<boolean>，默认原因 api。用于业务调用时受 beforeClose 约束。",
    pause: "手动暂停关闭计时。",
    resume: "解除手动暂停，并遵循其他暂停条件。",
    restart: "按当前 duration 重新计时。",
    extend: "在有关闭计时的提示上增加指定的正数毫秒。",
    snapshotClock:
      "读取当前计时快照，包含 remaining、total 和 expired，单位毫秒。",
    restoreClock: "恢复计时快照，调用后遵循当前暂停条件。",
  };
  for (const prop of api.props)
    prop.description = descriptions[prop.name] ?? prop.description;
  for (const event of api.events)
    event.description = events[event.name] ?? event.description;
  for (const slot of api.slots)
    slot.description = slots[slot.name] ?? slot.description;
  for (const method of api.exposed)
    method.description = exposed[method.name] ?? method.description;
}
