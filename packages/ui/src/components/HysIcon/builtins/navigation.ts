import { iconInCategory } from "./iconInCategory";

const navigationIcon = iconInCategory("导航");

export const navigationIcons = {
  "layout-dashboard": navigationIcon(
    "仪表盘",
    [
      {
        tag: "rect",
        attrs: { width: "7", height: "9", x: "3", y: "3", rx: "1" },
      },
      {
        tag: "rect",
        attrs: { width: "7", height: "5", x: "14", y: "3", rx: "1" },
      },
      {
        tag: "rect",
        attrs: { width: "7", height: "9", x: "14", y: "12", rx: "1" },
      },
      {
        tag: "rect",
        attrs: { width: "7", height: "5", x: "3", y: "16", rx: "1" },
      },
    ],
    { keywords: ["工作台", "控制台", "概览"], aliases: ["dashboard"] },
  ),
  "layout-grid": navigationIcon(
    "应用网格",
    [
      {
        tag: "rect",
        attrs: { width: "7", height: "7", x: "3", y: "3", rx: "1" },
      },
      {
        tag: "rect",
        attrs: { width: "7", height: "7", x: "14", y: "3", rx: "1" },
      },
      {
        tag: "rect",
        attrs: { width: "7", height: "7", x: "14", y: "14", rx: "1" },
      },
      {
        tag: "rect",
        attrs: { width: "7", height: "7", x: "3", y: "14", rx: "1" },
      },
    ],
    { keywords: ["应用", "九宫格", "模块"], aliases: ["apps"] },
  ),
  "panel-left": navigationIcon(
    "左侧面板",
    [
      {
        tag: "rect",
        attrs: { width: "18", height: "18", x: "3", y: "3", rx: "2" },
      },
      { tag: "path", attrs: { d: "M9 3v18" } },
    ],
    { keywords: ["侧边栏", "导航栏", "左栏"], directional: true },
  ),
  "panel-right": navigationIcon(
    "右侧面板",
    [
      {
        tag: "rect",
        attrs: { width: "18", height: "18", x: "3", y: "3", rx: "2" },
      },
      { tag: "path", attrs: { d: "M15 3v18" } },
    ],
    { keywords: ["侧边栏", "详情栏", "右栏"], directional: true },
  ),
  list: navigationIcon(
    "列表",
    [
      { tag: "path", attrs: { d: "M3 12h.01" } },
      { tag: "path", attrs: { d: "M3 18h.01" } },
      { tag: "path", attrs: { d: "M3 6h.01" } },
      { tag: "path", attrs: { d: "M8 12h13" } },
      { tag: "path", attrs: { d: "M8 18h13" } },
      { tag: "path", attrs: { d: "M8 6h13" } },
    ],
    { keywords: ["条目", "清单"] },
  ),
  "list-tree": navigationIcon(
    "层级列表",
    [
      { tag: "path", attrs: { d: "M21 12h-8" } },
      { tag: "path", attrs: { d: "M21 6H8" } },
      { tag: "path", attrs: { d: "M21 18h-8" } },
      { tag: "path", attrs: { d: "M3 6v4c0 1.1.9 2 2 2h3" } },
      { tag: "path", attrs: { d: "M3 10v6c0 1.1.9 2 2 2h3" } },
    ],
    { keywords: ["树形", "目录", "层级"] },
  ),
  navigation: navigationIcon(
    "导航定位",
    [{ tag: "polygon", attrs: { points: "3 11 22 2 13 21 11 13 3 11" } }],
    { keywords: ["指向", "航向", "指南"] },
  ),
  compass: navigationIcon(
    "指南针",
    [
      {
        tag: "path",
        attrs: {
          d: "m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z",
        },
      },
      { tag: "circle", attrs: { cx: "12", cy: "12", r: "10" } },
    ],
    { keywords: ["探索", "发现", "方位"] },
  ),
  bookmark: navigationIcon(
    "书签",
    [
      {
        tag: "path",
        attrs: { d: "m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" },
      },
    ],
    { keywords: ["保存", "阅读列表"] },
  ),
  "external-link": navigationIcon(
    "外部链接",
    [
      { tag: "path", attrs: { d: "M15 3h6v6" } },
      { tag: "path", attrs: { d: "M10 14 21 3" } },
      {
        tag: "path",
        attrs: {
          d: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6",
        },
      },
    ],
    { keywords: ["外链", "新窗口", "跳转"], directional: true },
  ),
  "log-in": navigationIcon(
    "登录",
    [
      {
        tag: "path",
        attrs: { d: "M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" },
      },
      { tag: "polyline", attrs: { points: "10 17 15 12 10 7" } },
      { tag: "line", attrs: { x1: "15", x2: "3", y1: "12", y2: "12" } },
    ],
    { keywords: ["登入", "进入", "sign-in"], directional: true },
  ),
  "log-out": navigationIcon(
    "退出登录",
    [
      { tag: "path", attrs: { d: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" } },
      { tag: "polyline", attrs: { points: "16 17 21 12 16 7" } },
      { tag: "line", attrs: { x1: "21", x2: "9", y1: "12", y2: "12" } },
    ],
    { keywords: ["注销", "离开", "sign-out"], directional: true },
  ),
  ellipsis: navigationIcon(
    "更多",
    [
      { tag: "circle", attrs: { cx: "12", cy: "12", r: "1" } },
      { tag: "circle", attrs: { cx: "19", cy: "12", r: "1" } },
      { tag: "circle", attrs: { cx: "5", cy: "12", r: "1" } },
    ],
    { keywords: ["省略号", "菜单", "more"], aliases: ["more-horizontal"] },
  ),
  "ellipsis-vertical": navigationIcon(
    "垂直更多",
    [
      { tag: "circle", attrs: { cx: "12", cy: "12", r: "1" } },
      { tag: "circle", attrs: { cx: "12", cy: "5", r: "1" } },
      { tag: "circle", attrs: { cx: "12", cy: "19", r: "1" } },
    ],
    { keywords: ["省略号", "菜单"], aliases: ["more-vertical"] },
  ),
};

const directionsIcon = iconInCategory("方向");

export const directionsIcons = {
  "chevron-left": directionsIcon(
    "左尖括号",
    [{ tag: "path", attrs: { d: "m15 18-6-6 6-6" } }],
    { keywords: ["左折线", "上一页"], directional: true },
  ),
  "chevron-up": directionsIcon(
    "上尖括号",
    [{ tag: "path", attrs: { d: "m18 15-6-6-6 6" } }],
    { keywords: ["上折线", "展开"] },
  ),
  "chevrons-left": directionsIcon(
    "双左尖括号",
    [
      { tag: "path", attrs: { d: "m11 17-5-5 5-5" } },
      { tag: "path", attrs: { d: "m18 17-5-5 5-5" } },
    ],
    { keywords: ["最左", "第一页"], directional: true },
  ),
  "chevrons-right": directionsIcon(
    "双右尖括号",
    [
      { tag: "path", attrs: { d: "m6 17 5-5-5-5" } },
      { tag: "path", attrs: { d: "m13 17 5-5-5-5" } },
    ],
    { keywords: ["最右", "末页"], directional: true },
  ),
  "chevrons-up": directionsIcon(
    "双上尖括号",
    [
      { tag: "path", attrs: { d: "m17 11-5-5-5 5" } },
      { tag: "path", attrs: { d: "m17 18-5-5-5 5" } },
    ],
    { keywords: ["返回顶部", "上移"] },
  ),
  "chevrons-down": directionsIcon(
    "双下尖括号",
    [
      { tag: "path", attrs: { d: "m7 6 5 5 5-5" } },
      { tag: "path", attrs: { d: "m7 13 5 5 5-5" } },
    ],
    { keywords: ["跳到底部", "下移"] },
  ),
  "arrow-up-right": directionsIcon(
    "右上箭头",
    [
      { tag: "path", attrs: { d: "M7 7h10v10" } },
      { tag: "path", attrs: { d: "M7 17 17 7" } },
    ],
    { keywords: ["斜向", "外跳"], directional: true },
  ),
  "arrow-down-left": directionsIcon(
    "左下箭头",
    [
      { tag: "path", attrs: { d: "M17 7 7 17" } },
      { tag: "path", attrs: { d: "M17 17H7V7" } },
    ],
    { keywords: ["斜向", "返回"], directional: true },
  ),
  "arrow-left-right": directionsIcon(
    "左右交换",
    [
      { tag: "path", attrs: { d: "M8 3 4 7l4 4" } },
      { tag: "path", attrs: { d: "M4 7h16" } },
      { tag: "path", attrs: { d: "m16 21 4-4-4-4" } },
      { tag: "path", attrs: { d: "M20 17H4" } },
    ],
    { keywords: ["双向", "水平", "互换"] },
  ),
  "arrow-up-down": directionsIcon(
    "上下排序",
    [
      { tag: "path", attrs: { d: "m21 16-4 4-4-4" } },
      { tag: "path", attrs: { d: "M17 20V4" } },
      { tag: "path", attrs: { d: "m3 8 4-4 4 4" } },
      { tag: "path", attrs: { d: "M7 4v16" } },
    ],
    { keywords: ["双向", "垂直", "排序"] },
  ),
  "corner-up-left": directionsIcon(
    "向左转向",
    [
      { tag: "polyline", attrs: { points: "9 14 4 9 9 4" } },
      { tag: "path", attrs: { d: "M20 20v-7a4 4 0 0 0-4-4H4" } },
    ],
    { keywords: ["折线", "回转"], directional: true },
  ),
  move: directionsIcon(
    "四向移动",
    [
      { tag: "path", attrs: { d: "M12 2v20" } },
      { tag: "path", attrs: { d: "m15 19-3 3-3-3" } },
      { tag: "path", attrs: { d: "m19 9 3 3-3 3" } },
      { tag: "path", attrs: { d: "M2 12h20" } },
      { tag: "path", attrs: { d: "m5 9-3 3 3 3" } },
      { tag: "path", attrs: { d: "m9 5 3-3 3 3" } },
    ],
    { keywords: ["位移", "拖动", "方向"] },
  ),
};
