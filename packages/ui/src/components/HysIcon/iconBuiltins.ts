import { accountIcons } from "./builtins/access";
import { actionsIcons, statusIcons } from "./builtins/actions";
import { commerceIcons, dataIcons } from "./builtins/business";
import { communicationIcons, timeIcons } from "./builtins/communication";
import { editorIcons, filesIcons } from "./builtins/documents";
import { extendedBuiltinIcons } from "./builtins/extendedCatalog";
import { locationIcons, mediaIcons } from "./builtins/media";
import { directionsIcons, navigationIcons } from "./builtins/navigation";
import { devicesIcons } from "./builtins/technology";
import type {
  HysIconEntry,
  HysIconLibrary,
  HysIconSvg,
  HysIconSvgNode,
} from "./iconTypes";

const svg = (...nodes: HysIconSvgNode[]): HysIconSvg => ({
  type: "svg",
  nodes,
});
const path = (
  d: string,
  attrs: HysIconSvgNode["attrs"] = {},
): HysIconSvgNode => ({ tag: "path", attrs: { d, ...attrs } });
const circle = (
  cx: number,
  cy: number,
  r: number,
  attrs: HysIconSvgNode["attrs"] = {},
): HysIconSvgNode => ({ tag: "circle", attrs: { cx, cy, r, ...attrs } });
const shape = (
  d: string,
  label: string,
  category: string,
  rest: Partial<HysIconEntry> = {},
): HysIconEntry => ({ source: svg(path(d)), label, category, ...rest });
const star = "m12 2 3.1 6.3 7 .9-5.1 5 1.3 7-6.3-3.3-6.3 3.3 1.3-7-5.1-5 7-.9Z";
const heart =
  "M20.8 8.8c0 4.1-8.8 9.2-8.8 9.2S3.2 12.9 3.2 8.8A4.7 4.7 0 0 1 12 6.5a4.7 4.7 0 0 1 8.8 2.3Z";
const folder =
  "M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z";
const gradientStar = svg(
  {
    tag: "defs",
    children: [
      {
        tag: "linearGradient",
        attrs: { id: "star", x2: "1", y2: "1" },
        children: [
          { tag: "stop", attrs: { offset: 0, "stop-color": "#4f81ff" } },
          { tag: "stop", attrs: { offset: 1, "stop-color": "#a451ee" } },
        ],
      },
    ],
  },
  path(star, { fill: "url(#star)", stroke: "none" }),
);
export const hysBuiltinIcons: HysIconLibrary = {
  namespace: "core",
  version: "1",
  icons: {
    search: {
      source: svg(circle(10.5, 10.5, 6), path("m16 16 4.5 4.5")),
      label: "搜索",
      category: "操作",
      aliases: ["find"],
      keywords: ["查找", "放大镜", "query"],
    },
    plus: shape("M12 5v14M5 12h14", "添加", "操作", {
      aliases: ["add"],
      keywords: ["新增"],
    }),
    minus: shape("M5 12h14", "减少", "操作"),
    close: shape("m6 6 12 12M18 6 6 18", "关闭", "操作", { aliases: ["x"] }),
    check: shape("m5 12 4.5 4.5L19 7", "勾选", "状态", {
      aliases: ["done"],
      keywords: ["完成", "确认"],
    }),
    success: {
      source: svg(circle(12, 12, 9), path("m8 12 2.5 2.5L16 9")),
      label: "成功",
      category: "状态",
      variants: {
        filled: svg(
          circle(12, 12, 10, { fill: "currentColor", stroke: "none" }),
          path("m8 12 2.5 2.5L16 9", { stroke: "white" }),
        ),
      },
    },
    error: {
      source: svg(circle(12, 12, 9), path("M12 8v5m0 3h.01")),
      label: "错误",
      category: "状态",
    },
    info: {
      source: svg(circle(12, 12, 9), path("M12 11v5m0-8h.01")),
      label: "信息",
      category: "状态",
    },
    warning: shape(
      "M10.5 4.6a1.7 1.7 0 0 1 3 0l7.2 13A1.6 1.6 0 0 1 19.3 20H4.7a1.6 1.6 0 0 1-1.4-2.4ZM12 10v4m0 3h.01",
      "警告",
      "状态",
    ),
    help: {
      source: svg(
        circle(12, 12, 9),
        path("M9.5 9a2.6 2.6 0 1 1 3.7 2.4c-1 .5-1.2 1-1.2 2.1m0 3h.01"),
      ),
      label: "帮助",
      category: "状态",
    },
    loader: shape("M12 3a9 9 0 1 1-9 9", "加载", "状态", {
      aliases: ["loading"],
    }),
    "arrow-right": shape("M4 12h15m-6-6 6 6-6 6", "向右", "方向", {
      directional: true,
      aliases: ["next"],
    }),
    "arrow-left": shape("M20 12H5m6-6-6 6 6 6", "向左", "方向", {
      directional: true,
      aliases: ["previous"],
    }),
    "arrow-up": shape("M12 20V5m-6 6 6-6 6 6", "向上", "方向"),
    "arrow-down": shape("M12 4v15m-6-6 6 6 6-6", "向下", "方向"),
    "chevron-right": shape("m9 6 6 6-6 6", "右尖括号", "方向", {
      directional: true,
    }),
    "chevron-down": shape("m6 9 6 6 6-6", "下尖括号", "方向"),
    home: shape(
      "m3 10 9-7 9 7v9a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2Z",
      "首页",
      "导航",
    ),
    menu: shape("M4 6h16M4 12h16M4 18h16", "菜单", "导航"),
    user: {
      source: svg(
        circle(12, 8, 4),
        path("M4 20v-2c0-2 2-4 4-4h8c2 0 4 2 4 4v2"),
      ),
      label: "用户",
      category: "导航",
    },
    settings: {
      source: svg(
        circle(12, 12, 3),
        path(
          "M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2",
        ),
        circle(12, 12, 7),
      ),
      label: "设置",
      category: "操作",
    },
    refresh: shape(
      "M20 8a8 8 0 0 0-13-2L4 9m0-5v5h5m-5 7a8 8 0 0 0 13 2l3-3m0 5v-5h-5",
      "刷新",
      "操作",
    ),
    download: shape("M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4", "下载", "操作"),
    upload: shape("M12 16V4m-5 5 5-5 5 5M4 17v4h16v-4", "上传", "操作"),
    file: shape("M6 3h8l4 4v14H6Zm8 0v5h4M9 13h6m-6 4h6", "文件", "文件"),
    folder: shape(folder, "文件夹", "文件", {
      variants: {
        filled: svg(path(folder, { fill: "currentColor" })),
        duotone: svg(
          path(folder, { fill: "currentColor", "fill-opacity": 0.25 }),
          path("M3 10h18"),
        ),
        multicolor: svg(
          path(folder, { fill: "#f7bf58", stroke: "#ad6d12" }),
          path("M3 10h18", { stroke: "#fff2cc" }),
        ),
        flat: svg(path(folder, { fill: "currentColor", stroke: "none" })),
        sharp: svg(path("M3 5h7l2 2h9v12H3Z", { "stroke-linejoin": "miter" })),
      },
    }),
    image: {
      source: svg(
        { tag: "rect", attrs: { x: 3, y: 3, width: 18, height: 18, rx: 2 } },
        circle(8, 8, 2),
        path("m4 17 5-5 4 4 3-3 5 5"),
      ),
      label: "图片",
      category: "文件",
    },
    copy: shape("M8 8h12v12H8ZM4 16V4h12", "复制", "操作"),
    link: shape(
      "M9 15l6-6m-8 4-2 2a3 3 0 1 0 4 4l3-3m0-8 3-3a3 3 0 1 1 4 4l-2 2",
      "链接",
      "操作",
    ),
    star: shape(star, "收藏", "状态", {
      keywords: ["favorite", "星星"],
      variants: {
        filled: svg(path(star, { fill: "currentColor" })),
        duotone: svg(
          path(star, { fill: "currentColor", "fill-opacity": 0.25 }),
        ),
        gradient: gradientStar,
      },
    }),
    heart: shape(heart, "喜欢", "状态", {
      variants: {
        filled: svg(path(heart, { fill: "currentColor" })),
        duotone: svg(
          path(heart, { fill: "currentColor", "fill-opacity": 0.28 }),
        ),
      },
    }),
    cube: shape(
      "m12 3 8 4.5v9L12 21l-8-4.5v-9Zm0 9 8-4.5M12 12 4 7.5M12 12v9",
      "立方体",
      "形状",
      {
        variants: {
          "3d": svg(
            path("m12 3 8 4.5-8 4.5-8-4.5Z", {
              fill: "#86b4ff",
              stroke: "none",
            }),
            path("m4 7.5 8 4.5v9l-8-4.5Z", { fill: "#527de0", stroke: "none" }),
            path("m20 7.5-8 4.5v9l8-4.5Z", { fill: "#344da6", stroke: "none" }),
          ),
        },
      },
    ),
    number: shape("M9 4 6 20m12-16-3 16M4 9h16M3 15h16", "数字", "形状"),
    "number-one": shape("m9 7 3-3v16m-4 0h8", "数字 1", "形状"),
    vue: {
      source: svg(
        path("M2 4h4l6 10 6-10h4L12 21Z", { fill: "#42b883", stroke: "none" }),
        path("M6 4h3l3 5 3-5h3l-6 10Z", { fill: "#35495e", stroke: "none" }),
      ),
      label: "Vue",
      category: "品牌",
      keywords: ["vuejs", "框架"],
    },
    ...navigationIcons,
    ...directionsIcons,
    ...actionsIcons,
    ...filesIcons,
    ...accountIcons,
    ...dataIcons,
    ...commerceIcons,
    ...devicesIcons,
    ...communicationIcons,
    ...timeIcons,
    ...mediaIcons,
    ...locationIcons,
    ...editorIcons,
    ...statusIcons,
    ...extendedBuiltinIcons,
  },
};
