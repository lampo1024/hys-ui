import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
export function applyFeedbackApi(name, api, root) {
  if (!["HysAlert", "HysEmpty", "HysTimeline"].includes(name)) return;
  const fileName = name === "HysTimeline" ? "timeline.ts" : "feedback.ts";
  const file = ts.createSourceFile(
    fileName,
    fs.readFileSync(
      path.join(root, "packages/ui/src/composables", fileName),
      "utf8",
    ),
    ts.ScriptTarget.Latest,
    true,
  );
  const instance = file.statements.find(
    (s) => ts.isInterfaceDeclaration(s) && s.name.text === name + "Instance",
  );
  api.exposed = instance.members.map((member) => ({
    name: member.name.getText(file),
    type: member.type?.getText(file) || "",
    required: !member.questionToken,
    default: "",
    description: "",
  }));
  const props = {
    HysAlert: {
      tone: "info / primary / success / warning / danger 语义类型；横幅未指定时为 warning",
      title: "提示标题；title 插槽优先",
      description: "补充说明；默认插槽优先于 description 插槽",
      closable: "显示关闭按钮；实例 close 不受此项限制",
      showIcon: "显示语义图标；未指定时跟随 banner",
      center: "内容与操作区居中排列",
      visible: "受控显示状态，优先于 modelValue；配合 v-model:visible",
      modelValue: "受控显示状态；未设置 visible 时生效",
      defaultVisible: "非受控初始显示状态，默认 true",
      effect: "light / dark / outline 外观",
      banner: "横幅布局；未指定 tone/showIcon 时使用 warning 和图标",
      bordered: "显示轻量边框；outline 始终保留轮廓",
      size: "sm / md / lg 提示条尺寸",
      closeText: "以文字替代默认关闭图标；close-icon 插槽优先",
      closeLabel: "关闭操作的辅助技术名称",
      disabled: "禁止关闭和实例显示操作，取消正在执行的检查",
      beforeClose:
        "关闭前检查；接收 reason、event、AbortSignal；false 或异常保留提示",
      transition:
        "fade / slide / collapse / none；collapse 在退出时折叠占用空间",
      transitionDuration:
        "进出时长 0–1500ms，默认 180；系统减少动态效果与全局 off 优先",
      appear: "首次挂载时使用进入动效",
      ariaLabel: "提示区域的辅助技术名称",
      ariaLive: "覆盖默认 role 对应的播报策略",
      ariaAtomic: "播报完整提示，默认 true",
    },
    HysEmpty: {
      title: "空状态标题；false 隐藏整个标题区",
      description: "空状态说明；false 隐藏整个说明区",
      image: "自定义图片 URL；false 隐藏图片区；无效地址或加载失败回退",
      imageSize: "图片区宽高，0 隐藏，范围 0–2000px；imageStyle 可分别覆盖",
      imageStyle: "图片区 CSSProperties；支持独立宽高",
      imageFit: "图片 contain / cover / fill / none / scale-down 填充策略",
      imageAlt: "有信息含义的图片替代文字；默认装饰性图片",
      imageLoading: "原生图片加载策略 eager / lazy",
      crossOrigin: "原生图片跨域策略",
      referrerPolicy: "原生图片来源策略",
      illustration: "inbox（兼容默认）、simple 或 default 内置图形",
      size: "sm / md / lg 内容间距和默认图片尺寸",
      showImageLoading: "加载过程中显示轻量占位图标",
      ariaLabel: "空状态区域的辅助技术名称",
      ariaLive: "可选状态播报；默认不创建实时播报区域",
    },
    HysTimeline: {
      items:
        "时间线原始记录；默认读取 title/time/description/status/color 等字段",
      reverse: "反转显示记录，不修改源数组；默认不反转 pending 位置",
      pending: "末尾待办文字或 true 加载节点；false 同时隐藏 pending 插槽",
      mode: "left / right / alternate / alternate-reverse；表示轴线位置或内容交替顺序",
      itemKey:
        "稳定唯一编号的路径或 (item,sourceIndex) 回调；默认 id/key，无编号时按对象身份保留子内容",
      fieldNames: "默认字段到业务字段的映射，支持点号路径",
      size: "sm / md / lg 字号、节点与间距",
      hollow: "默认空心节点；单项 hollow 优先",
      showTime: "显示时间；单项 hideTime 可隐藏",
      timePlacement: "时间位于标题 top / bottom；单项 timePlacement 优先",
      responsive: "容器不宽于 480px 时将左右内容合并到单侧；不依赖窗口宽度",
      lineStyle: "连接线 solid / dashed / dotted",
      lineColor: "自定义连接线颜色",
      pendingPosition: "待办节点位于 start / end，独立于 reverse",
      pendingLoading: "待办节点显示加载图标；未指定时 pending=true 开启",
      pendingText: "pending=true 的默认文字",
      emptyText: "无记录且无待办时的可选文字；默认空白",
      ariaLabel: "有序时间线的辅助技术名称",
    },
  }[name];
  const defaults = {
    HysAlert: {
      tone: "info（banner 时 warning）",
      showIcon: "false（banner 时 true）",
      visible: "未设置",
      modelValue: "未设置",
    },
    HysEmpty: { image: "未设置", imageSize: "32（sm）/ 48（md）/ 72（lg）" },
    HysTimeline: { pending: "未设置", pendingLoading: "pending=true 时 true" },
  }[name];
  for (const prop of api.props) {
    prop.description = props[prop.name] || prop.description;
    if (prop.name in defaults) prop.default = defaults[prop.name];
  }
  const slots = {
    HysAlert: {
      default:
        "补充内容；优先于 description，接收 tone/visible/closing/disabled/close",
      title: "自定义标题；接收提示条上下文",
      description: "说明内容；默认插槽未提供时生效",
      icon: "自定义语义图标，需要 showIcon；接收提示条上下文",
      action: "操作区；接收 close 和忙碌状态",
      "close-icon": "替代默认关闭图标或文字",
    },
    HysEmpty: {
      default: "兼容的底部内容；未提供 action 时展示",
      image: "替代图片内容；原生图片加载逻辑不再执行",
      title: "标题内容",
      description: "说明内容",
      action: "底部操作区；优先于默认插槽",
      fallback: "原生图片加载失败后的内容；接收 retryImage",
    },
    HysTimeline: {
      item: "整个记录内容；保留原始 item，index 是显示序号，sourceIndex 是源数组序号",
      title: "标题内容",
      description: "说明内容",
      time: "时间内容；仍遵守 showTime / hideTime",
      label: "轴线对侧标签",
      dot: "自定义节点；接收原始记录及归一化上下文",
      pending: "待办内容；接收 pending 和 loading",
      "pending-dot": "待办节点图标；接收 pending 和 loading",
      empty: "无记录和待办时的内容",
    },
  }[name];
  for (const slot of api.slots)
    slot.description = slots[slot.name] || slot.description;
  const events = {
    close: "兼容的无参数关闭请求事件；检查通过后发出，宿主仍可拒绝受控更新",
    closeRequest: "开始关闭请求，参数含 reason、event 与 signal；检查前触发",
    closeError: "有效的关闭检查抛出异常；取消或过期检查不触发",
    afterClose: "实际完成退出后触发；拒绝、重新打开或页面离开不触发",
    visibleChange: "实际显示状态变化",
    "update:visible": "请求更新显示状态",
    "update:modelValue": "请求更新显示状态",
    imageLoad: "当前原生图片加载成功的 Event",
    imageError: "当前原生图片加载失败的 Event；无效 URL 直接回退不触发",
  };
  for (const event of api.events)
    event.description = events[event.name] || event.description;
  const exposed = {
    element: "组件根元素；隐藏或离开后可能为空",
    visible: "当前实际显示状态",
    closing: "关闭检查是否进行中",
    close: "请求关闭；Promise 返回是否接受隐藏，不等待退出动画",
    show: "取消过期检查并请求显示；Promise 返回是否接受",
    imageElement: "当前原生图片节点，回退或插槽模式为空",
    loadingImage: "当前图片加载中状态",
    failedImage: "当前图片错误或无效 URL 状态",
    retryImage: "重新创建当前原生图片；不可重试时返回 false",
    getItems: "按当前显示顺序返回原始记录数组副本，不包含待办节点",
  };
  for (const member of api.exposed)
    member.description = exposed[member.name] || "";
}
