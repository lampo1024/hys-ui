import { iconInCategory } from "./iconInCategory";

const actionsIcon = iconInCategory("操作");

export const actionsIcons = {
  pencil: actionsIcon(
    "编辑",
    [
      {
        tag: "path",
        attrs: {
          d: "M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z",
        },
      },
      { tag: "path", attrs: { d: "m15 5 4 4" } },
    ],
    { keywords: ["修改", "写入", "铅笔"], aliases: ["edit"] },
  ),
  "square-pen": actionsIcon(
    "撰写",
    [
      {
        tag: "path",
        attrs: {
          d: "M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7",
        },
      },
      {
        tag: "path",
        attrs: {
          d: "M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z",
        },
      },
    ],
    { keywords: ["写作", "创建", "编辑"], aliases: ["compose"] },
  ),
  "trash-2": actionsIcon(
    "删除",
    [
      { tag: "path", attrs: { d: "M3 6h18" } },
      { tag: "path", attrs: { d: "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" } },
      { tag: "path", attrs: { d: "M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" } },
      { tag: "line", attrs: { x1: "10", x2: "10", y1: "11", y2: "17" } },
      { tag: "line", attrs: { x1: "14", x2: "14", y1: "11", y2: "17" } },
    ],
    { keywords: ["垃圾桶", "移除", "delete"], aliases: ["trash"] },
  ),
  save: actionsIcon(
    "保存",
    [
      {
        tag: "path",
        attrs: {
          d: "M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z",
        },
      },
      {
        tag: "path",
        attrs: { d: "M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7" },
      },
      { tag: "path", attrs: { d: "M7 3v4a1 1 0 0 0 1 1h7" } },
    ],
    { keywords: ["储存", "写入", "软盘"] },
  ),
  clipboard: actionsIcon(
    "剪贴板",
    [
      {
        tag: "rect",
        attrs: { width: "8", height: "4", x: "8", y: "2", rx: "1", ry: "1" },
      },
      {
        tag: "path",
        attrs: {
          d: "M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2",
        },
      },
    ],
    { keywords: ["粘贴", "拷贝", "paste"] },
  ),
  scissors: actionsIcon(
    "剪切",
    [
      { tag: "circle", attrs: { cx: "6", cy: "6", r: "3" } },
      { tag: "path", attrs: { d: "M8.12 8.12 12 12" } },
      { tag: "path", attrs: { d: "M20 4 8.12 15.88" } },
      { tag: "circle", attrs: { cx: "6", cy: "18", r: "3" } },
      { tag: "path", attrs: { d: "M14.8 14.8 20 20" } },
    ],
    { keywords: ["裁剪", "剪刀", "cut"] },
  ),
  eye: actionsIcon(
    "查看",
    [
      {
        tag: "path",
        attrs: {
          d: "M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0",
        },
      },
      { tag: "circle", attrs: { cx: "12", cy: "12", r: "3" } },
    ],
    { keywords: ["可见", "显示", "预览"], aliases: ["visibility"] },
  ),
  "eye-off": actionsIcon(
    "隐藏",
    [
      {
        tag: "path",
        attrs: {
          d: "M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49",
        },
      },
      { tag: "path", attrs: { d: "M14.084 14.158a3 3 0 0 1-4.242-4.242" } },
      {
        tag: "path",
        attrs: {
          d: "M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143",
        },
      },
      { tag: "path", attrs: { d: "m2 2 20 20" } },
    ],
    { keywords: ["不可见", "密码", "隐私"], aliases: ["visibility-off"] },
  ),
  filter: actionsIcon(
    "筛选",
    [
      {
        tag: "polygon",
        attrs: { points: "22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" },
      },
    ],
    { keywords: ["过滤", "漏斗"] },
  ),
  "list-filter": actionsIcon(
    "筛选列表",
    [
      { tag: "path", attrs: { d: "M3 6h18" } },
      { tag: "path", attrs: { d: "M7 12h10" } },
      { tag: "path", attrs: { d: "M10 18h4" } },
    ],
    { keywords: ["条件", "过滤"] },
  ),
  "undo-2": actionsIcon(
    "撤销",
    [
      { tag: "path", attrs: { d: "M9 14 4 9l5-5" } },
      {
        tag: "path",
        attrs: {
          d: "M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11",
        },
      },
    ],
    { keywords: ["取消", "上一步"], aliases: ["undo"], directional: true },
  ),
  "redo-2": actionsIcon(
    "重做",
    [
      { tag: "path", attrs: { d: "m15 14 5-5-5-5" } },
      {
        tag: "path",
        attrs: { d: "M20 9H9.5A5.5 5.5 0 0 0 4 14.5A5.5 5.5 0 0 0 9.5 20H13" },
      },
    ],
    { keywords: ["恢复", "下一步"], aliases: ["redo"], directional: true },
  ),
  maximize: actionsIcon(
    "最大化",
    [
      { tag: "path", attrs: { d: "M8 3H5a2 2 0 0 0-2 2v3" } },
      { tag: "path", attrs: { d: "M21 8V5a2 2 0 0 0-2-2h-3" } },
      { tag: "path", attrs: { d: "M3 16v3a2 2 0 0 0 2 2h3" } },
      { tag: "path", attrs: { d: "M16 21h3a2 2 0 0 0 2-2v-3" } },
    ],
    { keywords: ["全屏", "放大"], aliases: ["fullscreen"] },
  ),
  minimize: actionsIcon(
    "最小化",
    [
      { tag: "path", attrs: { d: "M8 3v3a2 2 0 0 1-2 2H3" } },
      { tag: "path", attrs: { d: "M21 8h-3a2 2 0 0 1-2-2V3" } },
      { tag: "path", attrs: { d: "M3 16h3a2 2 0 0 1 2 2v3" } },
      { tag: "path", attrs: { d: "M16 21v-3a2 2 0 0 1 2-2h3" } },
    ],
    { keywords: ["缩小", "退出全屏"] },
  ),
  "zoom-in": actionsIcon(
    "放大",
    [
      { tag: "circle", attrs: { cx: "11", cy: "11", r: "8" } },
      { tag: "line", attrs: { x1: "21", x2: "16.65", y1: "21", y2: "16.65" } },
      { tag: "line", attrs: { x1: "11", x2: "11", y1: "8", y2: "14" } },
      { tag: "line", attrs: { x1: "8", x2: "14", y1: "11", y2: "11" } },
    ],
    { keywords: ["放大镜", "缩放"] },
  ),
  "zoom-out": actionsIcon(
    "缩小",
    [
      { tag: "circle", attrs: { cx: "11", cy: "11", r: "8" } },
      { tag: "line", attrs: { x1: "21", x2: "16.65", y1: "21", y2: "16.65" } },
      { tag: "line", attrs: { x1: "8", x2: "14", y1: "11", y2: "11" } },
    ],
    { keywords: ["放大镜", "缩放"] },
  ),
  "grip-vertical": actionsIcon(
    "垂直拖拽手柄",
    [
      { tag: "circle", attrs: { cx: "9", cy: "12", r: "1" } },
      { tag: "circle", attrs: { cx: "9", cy: "5", r: "1" } },
      { tag: "circle", attrs: { cx: "9", cy: "19", r: "1" } },
      { tag: "circle", attrs: { cx: "15", cy: "12", r: "1" } },
      { tag: "circle", attrs: { cx: "15", cy: "5", r: "1" } },
      { tag: "circle", attrs: { cx: "15", cy: "19", r: "1" } },
    ],
    { keywords: ["抓取", "拖放", "drag"] },
  ),
  pin: actionsIcon(
    "固定",
    [
      { tag: "path", attrs: { d: "M12 17v5" } },
      {
        tag: "path",
        attrs: {
          d: "M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z",
        },
      },
    ],
    { keywords: ["图钉", "置顶"] },
  ),
};

const statusIcon = iconInCategory("状态");

export const statusIcons = {
  "circle-x": statusIcon(
    "失败",
    [
      { tag: "circle", attrs: { cx: "12", cy: "12", r: "10" } },
      { tag: "path", attrs: { d: "m15 9-6 6" } },
      { tag: "path", attrs: { d: "m9 9 6 6" } },
    ],
    { keywords: ["错误", "叉号", "失败状态"] },
  ),
  "circle-dashed": statusIcon(
    "待处理",
    [
      { tag: "path", attrs: { d: "M10.1 2.182a10 10 0 0 1 3.8 0" } },
      { tag: "path", attrs: { d: "M13.9 21.818a10 10 0 0 1-3.8 0" } },
      { tag: "path", attrs: { d: "M17.609 3.721a10 10 0 0 1 2.69 2.7" } },
      { tag: "path", attrs: { d: "M2.182 13.9a10 10 0 0 1 0-3.8" } },
      { tag: "path", attrs: { d: "M20.279 17.609a10 10 0 0 1-2.7 2.69" } },
      { tag: "path", attrs: { d: "M21.818 10.1a10 10 0 0 1 0 3.8" } },
      { tag: "path", attrs: { d: "M3.721 6.391a10 10 0 0 1 2.7-2.69" } },
      { tag: "path", attrs: { d: "M6.391 20.279a10 10 0 0 1-2.69-2.7" } },
    ],
    { keywords: ["等待", "占位", "虚线"] },
  ),
  "circle-dot": statusIcon(
    "当前状态",
    [
      { tag: "circle", attrs: { cx: "12", cy: "12", r: "10" } },
      { tag: "circle", attrs: { cx: "12", cy: "12", r: "1" } },
    ],
    { keywords: ["指示点", "选中", "状态点"] },
  ),
  ban: statusIcon(
    "禁止",
    [
      { tag: "circle", attrs: { cx: "12", cy: "12", r: "10" } },
      { tag: "path", attrs: { d: "m4.9 4.9 14.2 14.2" } },
    ],
    { keywords: ["禁用", "阻止", "无权限"] },
  ),
  "octagon-alert": statusIcon(
    "严重告警",
    [
      { tag: "path", attrs: { d: "M12 16h.01" } },
      { tag: "path", attrs: { d: "M12 8v4" } },
      {
        tag: "path",
        attrs: {
          d: "M15.312 2a2 2 0 0 1 1.414.586l4.688 4.688A2 2 0 0 1 22 8.688v6.624a2 2 0 0 1-.586 1.414l-4.688 4.688a2 2 0 0 1-1.414.586H8.688a2 2 0 0 1-1.414-.586l-4.688-4.688A2 2 0 0 1 2 15.312V8.688a2 2 0 0 1 .586-1.414l4.688-4.688A2 2 0 0 1 8.688 2z",
        },
      },
    ],
    { keywords: ["紧急", "错误", "中断"] },
  ),
  triangle: statusIcon(
    "三角标记",
    [
      {
        tag: "path",
        attrs: {
          d: "M13.73 4a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z",
        },
      },
    ],
    { keywords: ["符号", "提醒", "形状"] },
  ),
  sparkles: statusIcon(
    "闪光",
    [
      {
        tag: "path",
        attrs: {
          d: "M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z",
        },
      },
      { tag: "path", attrs: { d: "M20 3v4" } },
      { tag: "path", attrs: { d: "M22 5h-4" } },
      { tag: "path", attrs: { d: "M4 17v2" } },
      { tag: "path", attrs: { d: "M5 18H3" } },
    ],
    { keywords: ["亮点", "新功能", "特效"] },
  ),
  zap: statusIcon(
    "闪电",
    [
      {
        tag: "path",
        attrs: {
          d: "M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z",
        },
      },
    ],
    { keywords: ["快速", "性能", "触发"], aliases: ["lightning"] },
  ),
};
