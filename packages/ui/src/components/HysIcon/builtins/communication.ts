import { iconInCategory } from "./iconInCategory";

const communicationIcon = iconInCategory("沟通与通知");

export const communicationIcons = {
  mail: communicationIcon(
    "邮件",
    [
      {
        tag: "rect",
        attrs: { width: "20", height: "16", x: "2", y: "4", rx: "2" },
      },
      {
        tag: "path",
        attrs: { d: "m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" },
      },
    ],
    { keywords: ["电子邮件", "邮箱", "信封", "email"] },
  ),
  "mail-open": communicationIcon(
    "已读邮件",
    [
      {
        tag: "path",
        attrs: {
          d: "M21.2 8.4c.5.38.8.97.8 1.6v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V10a2 2 0 0 1 .8-1.6l8-6a2 2 0 0 1 2.4 0l8 6Z",
        },
      },
      {
        tag: "path",
        attrs: { d: "m22 10-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 10" },
      },
    ],
    { keywords: ["电子邮件", "信封", "阅读"] },
  ),
  inbox: communicationIcon(
    "收件箱",
    [
      {
        tag: "polyline",
        attrs: { points: "22 12 16 12 14 15 10 15 8 12 2 12" },
      },
      {
        tag: "path",
        attrs: {
          d: "M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z",
        },
      },
    ],
    { keywords: ["接收", "消息", "托盘"] },
  ),
  send: communicationIcon(
    "发送",
    [
      {
        tag: "path",
        attrs: {
          d: "M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z",
        },
      },
      { tag: "path", attrs: { d: "m21.854 2.147-10.94 10.939" } },
    ],
    { keywords: ["纸飞机", "提交", "投递"] },
  ),
  "message-circle": communicationIcon(
    "消息",
    [{ tag: "path", attrs: { d: "M7.9 20A9 9 0 1 0 4 16.1L2 22Z" } }],
    { keywords: ["对话", "聊天", "评论"], aliases: ["chat"] },
  ),
  "messages-square": communicationIcon(
    "会话",
    [
      {
        tag: "path",
        attrs: {
          d: "M14 9a2 2 0 0 1-2 2H6l-4 4V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2z",
        },
      },
      {
        tag: "path",
        attrs: { d: "M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1" },
      },
    ],
    { keywords: ["聊天", "讨论", "沟通"] },
  ),
  bell: communicationIcon(
    "通知",
    [
      { tag: "path", attrs: { d: "M10.268 21a2 2 0 0 0 3.464 0" } },
      {
        tag: "path",
        attrs: {
          d: "M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326",
        },
      },
    ],
    { keywords: ["铃铛", "提醒", "消息"], aliases: ["notification"] },
  ),
  "bell-off": communicationIcon(
    "关闭通知",
    [
      { tag: "path", attrs: { d: "M10.268 21a2 2 0 0 0 3.464 0" } },
      {
        tag: "path",
        attrs: {
          d: "M17 17H4a1 1 0 0 1-.74-1.673C4.59 13.956 6 12.499 6 8a6 6 0 0 1 .258-1.742",
        },
      },
      { tag: "path", attrs: { d: "m2 2 20 20" } },
      {
        tag: "path",
        attrs: { d: "M8.668 3.01A6 6 0 0 1 18 8c0 2.687.77 4.653 1.707 6.05" },
      },
    ],
    { keywords: ["免打扰", "静音", "提醒"] },
  ),
  phone: communicationIcon(
    "通话",
    [
      {
        tag: "path",
        attrs: {
          d: "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z",
        },
      },
    ],
    { keywords: ["电话", "来电", "呼叫"] },
  ),
  "phone-off": communicationIcon(
    "挂断",
    [
      {
        tag: "path",
        attrs: {
          d: "M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91",
        },
      },
      { tag: "line", attrs: { x1: "22", x2: "2", y1: "2", y2: "22" } },
    ],
    { keywords: ["电话", "结束通话"] },
  ),
  headset: communicationIcon(
    "客服",
    [
      {
        tag: "path",
        attrs: {
          d: "M3 11h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5Zm0 0a9 9 0 1 1 18 0m0 0v5a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3Z",
        },
      },
      { tag: "path", attrs: { d: "M21 16v2a4 4 0 0 1-4 4h-5" } },
    ],
    { keywords: ["耳麦", "支持", "呼叫中心"] },
  ),
  megaphone: communicationIcon(
    "公告",
    [
      { tag: "path", attrs: { d: "m3 11 18-5v12L3 14v-3z" } },
      { tag: "path", attrs: { d: "M11.6 16.8a3 3 0 1 1-5.8-1.6" } },
    ],
    { keywords: ["广播", "推广", "通知"] },
  ),
  "share-2": communicationIcon(
    "分享",
    [
      { tag: "circle", attrs: { cx: "18", cy: "5", r: "3" } },
      { tag: "circle", attrs: { cx: "6", cy: "12", r: "3" } },
      { tag: "circle", attrs: { cx: "18", cy: "19", r: "3" } },
      {
        tag: "line",
        attrs: { x1: "8.59", x2: "15.42", y1: "13.51", y2: "17.49" },
      },
      {
        tag: "line",
        attrs: { x1: "15.41", x2: "8.59", y1: "6.51", y2: "10.49" },
      },
    ],
    { keywords: ["转发", "传播"], aliases: ["share"] },
  ),
  "at-sign": communicationIcon(
    "提及",
    [
      { tag: "circle", attrs: { cx: "12", cy: "12", r: "4" } },
      { tag: "path", attrs: { d: "M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8" } },
    ],
    { keywords: ["艾特", "账号", "@"], aliases: ["mention"] },
  ),
};

const timeIcon = iconInCategory("日期与时间");

export const timeIcons = {
  calendar: timeIcon(
    "日历",
    [
      { tag: "path", attrs: { d: "M8 2v4" } },
      { tag: "path", attrs: { d: "M16 2v4" } },
      {
        tag: "rect",
        attrs: { width: "18", height: "18", x: "3", y: "4", rx: "2" },
      },
      { tag: "path", attrs: { d: "M3 10h18" } },
    ],
    { keywords: ["日期", "排期", "日程"] },
  ),
  "calendar-days": timeIcon(
    "月历",
    [
      { tag: "path", attrs: { d: "M8 2v4" } },
      { tag: "path", attrs: { d: "M16 2v4" } },
      {
        tag: "rect",
        attrs: { width: "18", height: "18", x: "3", y: "4", rx: "2" },
      },
      { tag: "path", attrs: { d: "M3 10h18" } },
      { tag: "path", attrs: { d: "M8 14h.01" } },
      { tag: "path", attrs: { d: "M12 14h.01" } },
      { tag: "path", attrs: { d: "M16 14h.01" } },
      { tag: "path", attrs: { d: "M8 18h.01" } },
      { tag: "path", attrs: { d: "M12 18h.01" } },
      { tag: "path", attrs: { d: "M16 18h.01" } },
    ],
    { keywords: ["日期", "月份", "日程"] },
  ),
  "calendar-check": timeIcon(
    "日程确认",
    [
      { tag: "path", attrs: { d: "M8 2v4" } },
      { tag: "path", attrs: { d: "M16 2v4" } },
      {
        tag: "rect",
        attrs: { width: "18", height: "18", x: "3", y: "4", rx: "2" },
      },
      { tag: "path", attrs: { d: "M3 10h18" } },
      { tag: "path", attrs: { d: "m9 16 2 2 4-4" } },
    ],
    { keywords: ["签到", "预约", "已完成"] },
  ),
  "calendar-plus": timeIcon(
    "新建日程",
    [
      { tag: "path", attrs: { d: "M8 2v4" } },
      { tag: "path", attrs: { d: "M16 2v4" } },
      {
        tag: "path",
        attrs: {
          d: "M21 13V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8",
        },
      },
      { tag: "path", attrs: { d: "M3 10h18" } },
      { tag: "path", attrs: { d: "M16 19h6" } },
      { tag: "path", attrs: { d: "M19 16v6" } },
    ],
    { keywords: ["日历", "排期", "预约"] },
  ),
  clock: timeIcon(
    "时钟",
    [
      { tag: "circle", attrs: { cx: "12", cy: "12", r: "10" } },
      { tag: "polyline", attrs: { points: "12 6 12 12 16 14" } },
    ],
    { keywords: ["时间", "等待", "钟表"], aliases: ["clock-4"] },
  ),
  "alarm-clock": timeIcon(
    "闹钟",
    [
      { tag: "circle", attrs: { cx: "12", cy: "13", r: "8" } },
      { tag: "path", attrs: { d: "M12 9v4l2 2" } },
      { tag: "path", attrs: { d: "M5 3 2 6" } },
      { tag: "path", attrs: { d: "m22 6-3-3" } },
      { tag: "path", attrs: { d: "M6.38 18.7 4 21" } },
      { tag: "path", attrs: { d: "M17.64 18.67 20 21" } },
    ],
    { keywords: ["提醒", "时间", "定时"] },
  ),
  timer: timeIcon(
    "计时器",
    [
      { tag: "line", attrs: { x1: "10", x2: "14", y1: "2", y2: "2" } },
      { tag: "line", attrs: { x1: "12", x2: "15", y1: "14", y2: "11" } },
      { tag: "circle", attrs: { cx: "12", cy: "14", r: "8" } },
    ],
    { keywords: ["秒表", "倒计时", "时长"] },
  ),
  history: timeIcon(
    "历史",
    [
      {
        tag: "path",
        attrs: { d: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" },
      },
      { tag: "path", attrs: { d: "M3 3v5h5" } },
      { tag: "path", attrs: { d: "M12 7v5l4 2" } },
    ],
    { keywords: ["记录", "最近", "时间线"] },
  ),
  hourglass: timeIcon(
    "沙漏",
    [
      { tag: "path", attrs: { d: "M5 22h14" } },
      { tag: "path", attrs: { d: "M5 2h14" } },
      {
        tag: "path",
        attrs: {
          d: "M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22",
        },
      },
      {
        tag: "path",
        attrs: {
          d: "M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2",
        },
      },
    ],
    { keywords: ["等待", "时间", "加载"] },
  ),
};
