import { iconInCategory } from "./iconInCategory";

const devicesIcon = iconInCategory("设备与网络");

export const devicesIcons = {
  monitor: devicesIcon(
    "显示器",
    [
      {
        tag: "rect",
        attrs: { width: "20", height: "14", x: "2", y: "3", rx: "2" },
      },
      { tag: "line", attrs: { x1: "8", x2: "16", y1: "21", y2: "21" } },
      { tag: "line", attrs: { x1: "12", x2: "12", y1: "17", y2: "21" } },
    ],
    { keywords: ["桌面", "屏幕", "电脑"] },
  ),
  laptop: devicesIcon(
    "笔记本电脑",
    [
      {
        tag: "path",
        attrs: {
          d: "M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.28 2.55a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45L4 16",
        },
      },
    ],
    { keywords: ["电脑", "设备", "便携"] },
  ),
  tablet: devicesIcon(
    "平板电脑",
    [
      {
        tag: "rect",
        attrs: { width: "16", height: "20", x: "4", y: "2", rx: "2", ry: "2" },
      },
      { tag: "line", attrs: { x1: "12", x2: "12.01", y1: "18", y2: "18" } },
    ],
    { keywords: ["平板", "设备"] },
  ),
  smartphone: devicesIcon(
    "智能手机",
    [
      {
        tag: "rect",
        attrs: { width: "14", height: "20", x: "5", y: "2", rx: "2", ry: "2" },
      },
      { tag: "path", attrs: { d: "M12 18h.01" } },
    ],
    { keywords: ["移动端", "设备", "电话"] },
  ),
  battery: devicesIcon(
    "电池",
    [
      {
        tag: "rect",
        attrs: { width: "16", height: "10", x: "2", y: "7", rx: "2", ry: "2" },
      },
      { tag: "line", attrs: { x1: "22", x2: "22", y1: "11", y2: "13" } },
    ],
    { keywords: ["电量", "供电", "充电"] },
  ),
  "battery-charging": devicesIcon(
    "正在充电",
    [
      { tag: "path", attrs: { d: "M15 7h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2" } },
      { tag: "path", attrs: { d: "M6 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h1" } },
      { tag: "path", attrs: { d: "m11 7-3 5h4l-3 5" } },
      { tag: "line", attrs: { x1: "22", x2: "22", y1: "11", y2: "13" } },
    ],
    { keywords: ["电源", "电池", "供电"] },
  ),
  wifi: devicesIcon(
    "无线网络",
    [
      { tag: "path", attrs: { d: "M12 20h.01" } },
      { tag: "path", attrs: { d: "M2 8.82a15 15 0 0 1 20 0" } },
      { tag: "path", attrs: { d: "M5 12.859a10 10 0 0 1 14 0" } },
      { tag: "path", attrs: { d: "M8.5 16.429a5 5 0 0 1 7 0" } },
    ],
    { keywords: ["联网", "无线", "热点"] },
  ),
  "wifi-off": devicesIcon(
    "无线网络断开",
    [
      { tag: "path", attrs: { d: "M12 20h.01" } },
      { tag: "path", attrs: { d: "M8.5 16.429a5 5 0 0 1 7 0" } },
      { tag: "path", attrs: { d: "M5 12.859a10 10 0 0 1 5.17-2.69" } },
      { tag: "path", attrs: { d: "M19 12.859a10 10 0 0 0-2.007-1.523" } },
      { tag: "path", attrs: { d: "M2 8.82a15 15 0 0 1 4.177-2.643" } },
      { tag: "path", attrs: { d: "M22 8.82a15 15 0 0 0-11.288-3.764" } },
      { tag: "path", attrs: { d: "m2 2 20 20" } },
    ],
    { keywords: ["断网", "离线", "无信号"] },
  ),
  signal: devicesIcon(
    "移动信号",
    [
      { tag: "path", attrs: { d: "M2 20h.01" } },
      { tag: "path", attrs: { d: "M7 20v-4" } },
      { tag: "path", attrs: { d: "M12 20v-8" } },
      { tag: "path", attrs: { d: "M17 20V8" } },
      { tag: "path", attrs: { d: "M22 4v16" } },
    ],
    { keywords: ["信号强度", "网络"] },
  ),
  bluetooth: devicesIcon(
    "蓝牙",
    [{ tag: "path", attrs: { d: "m7 7 10 10-5 5V2l5 5L7 17" } }],
    { keywords: ["无线连接", "设备"] },
  ),
  cloud: devicesIcon(
    "云端",
    [
      {
        tag: "path",
        attrs: { d: "M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" },
      },
    ],
    { keywords: ["云服务", "远程"] },
  ),
  "cloud-upload": devicesIcon(
    "上传到云端",
    [
      { tag: "path", attrs: { d: "M12 13v8" } },
      {
        tag: "path",
        attrs: {
          d: "M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242",
        },
      },
      { tag: "path", attrs: { d: "m8 17 4-4 4 4" } },
    ],
    { keywords: ["网盘", "备份", "同步"] },
  ),
  "cloud-download": devicesIcon(
    "从云端下载",
    [
      { tag: "path", attrs: { d: "M12 13v8l-4-4" } },
      { tag: "path", attrs: { d: "m12 21 4-4" } },
      {
        tag: "path",
        attrs: {
          d: "M4.393 15.269A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.436 8.284",
        },
      },
    ],
    { keywords: ["网盘", "取回", "同步"] },
  ),
  server: devicesIcon(
    "服务器",
    [
      {
        tag: "rect",
        attrs: { width: "20", height: "8", x: "2", y: "2", rx: "2", ry: "2" },
      },
      {
        tag: "rect",
        attrs: { width: "20", height: "8", x: "2", y: "14", rx: "2", ry: "2" },
      },
      { tag: "line", attrs: { x1: "6", x2: "6.01", y1: "6", y2: "6" } },
      { tag: "line", attrs: { x1: "6", x2: "6.01", y1: "18", y2: "18" } },
    ],
    { keywords: ["后端", "主机", "机房"] },
  ),
  "hard-drive": devicesIcon(
    "硬盘",
    [
      { tag: "line", attrs: { x1: "22", x2: "2", y1: "12", y2: "12" } },
      {
        tag: "path",
        attrs: {
          d: "M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z",
        },
      },
      { tag: "line", attrs: { x1: "6", x2: "6.01", y1: "16", y2: "16" } },
      { tag: "line", attrs: { x1: "10", x2: "10.01", y1: "16", y2: "16" } },
    ],
    { keywords: ["存储", "磁盘", "容量"] },
  ),
  terminal: devicesIcon(
    "终端",
    [
      { tag: "polyline", attrs: { points: "4 17 10 11 4 5" } },
      { tag: "line", attrs: { x1: "12", x2: "20", y1: "19", y2: "19" } },
    ],
    { keywords: ["命令行", "控制台", "shell"] },
  ),
};
