import { iconInCategory } from "./iconInCategory";

const filesIcon = iconInCategory("文件");

export const filesIcons = {
  "file-text": filesIcon(
    "文本文件",
    [
      {
        tag: "path",
        attrs: {
          d: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z",
        },
      },
      { tag: "path", attrs: { d: "M14 2v4a2 2 0 0 0 2 2h4" } },
      { tag: "path", attrs: { d: "M10 9H8" } },
      { tag: "path", attrs: { d: "M16 13H8" } },
      { tag: "path", attrs: { d: "M16 17H8" } },
    ],
    { keywords: ["文档", "报告", "document"] },
  ),
  files: filesIcon(
    "多份文件",
    [
      { tag: "path", attrs: { d: "M20 7h-3a2 2 0 0 1-2-2V2" } },
      {
        tag: "path",
        attrs: {
          d: "M9 18a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h7l4 4v10a2 2 0 0 1-2 2Z",
        },
      },
      { tag: "path", attrs: { d: "M3 7.6v12.8A1.6 1.6 0 0 0 4.6 22h9.8" } },
    ],
    { keywords: ["附件", "文件副本", "文档"] },
  ),
  "file-plus": filesIcon(
    "新增文件",
    [
      {
        tag: "path",
        attrs: {
          d: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z",
        },
      },
      { tag: "path", attrs: { d: "M14 2v4a2 2 0 0 0 2 2h4" } },
      { tag: "path", attrs: { d: "M9 15h6" } },
      { tag: "path", attrs: { d: "M12 18v-6" } },
    ],
    { keywords: ["文档", "新建"] },
  ),
  "file-search": filesIcon(
    "搜索文件",
    [
      { tag: "path", attrs: { d: "M14 2v4a2 2 0 0 0 2 2h4" } },
      {
        tag: "path",
        attrs: {
          d: "M4.268 21a2 2 0 0 0 1.727 1H18a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v3",
        },
      },
      { tag: "path", attrs: { d: "m9 18-1.5-1.5" } },
      { tag: "circle", attrs: { cx: "5", cy: "14", r: "3" } },
    ],
    { keywords: ["文档", "查询"] },
  ),
  "file-code": filesIcon(
    "代码文件",
    [
      { tag: "path", attrs: { d: "M10 12.5 8 15l2 2.5" } },
      { tag: "path", attrs: { d: "m14 12.5 2 2.5-2 2.5" } },
      { tag: "path", attrs: { d: "M14 2v4a2 2 0 0 0 2 2h4" } },
      {
        tag: "path",
        attrs: {
          d: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z",
        },
      },
    ],
    { keywords: ["源码", "开发", "脚本"] },
  ),
  "file-spreadsheet": filesIcon(
    "电子表格",
    [
      {
        tag: "path",
        attrs: {
          d: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z",
        },
      },
      { tag: "path", attrs: { d: "M14 2v4a2 2 0 0 0 2 2h4" } },
      { tag: "path", attrs: { d: "M8 13h2" } },
      { tag: "path", attrs: { d: "M14 13h2" } },
      { tag: "path", attrs: { d: "M8 17h2" } },
      { tag: "path", attrs: { d: "M14 17h2" } },
    ],
    { keywords: ["Excel", "工作表", "数据"] },
  ),
  "file-image": filesIcon(
    "图片文件",
    [
      {
        tag: "path",
        attrs: {
          d: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z",
        },
      },
      { tag: "path", attrs: { d: "M14 2v4a2 2 0 0 0 2 2h4" } },
      { tag: "circle", attrs: { cx: "10", cy: "12", r: "2" } },
      {
        tag: "path",
        attrs: { d: "m20 17-1.296-1.296a2.41 2.41 0 0 0-3.408 0L9 22" },
      },
    ],
    { keywords: ["照片", "图像", "附件"] },
  ),
  "folder-open": filesIcon(
    "打开文件夹",
    [
      {
        tag: "path",
        attrs: {
          d: "m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2",
        },
      },
    ],
    { keywords: ["目录", "资源"] },
  ),
  "folder-plus": filesIcon(
    "新建文件夹",
    [
      { tag: "path", attrs: { d: "M12 10v6" } },
      { tag: "path", attrs: { d: "M9 13h6" } },
      {
        tag: "path",
        attrs: {
          d: "M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z",
        },
      },
    ],
    { keywords: ["目录", "创建"] },
  ),
  archive: filesIcon(
    "归档",
    [
      {
        tag: "rect",
        attrs: { width: "20", height: "5", x: "2", y: "3", rx: "1" },
      },
      { tag: "path", attrs: { d: "M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" } },
      { tag: "path", attrs: { d: "M10 12h4" } },
    ],
    { keywords: ["存档", "打包", "压缩"] },
  ),
  paperclip: filesIcon(
    "附件",
    [
      { tag: "path", attrs: { d: "M13.234 20.252 21 12.3" } },
      {
        tag: "path",
        attrs: {
          d: "m16 6-8.414 8.586a2 2 0 0 0 0 2.828 2 2 0 0 0 2.828 0l8.414-8.586a4 4 0 0 0 0-5.656 4 4 0 0 0-5.656 0l-8.415 8.585a6 6 0 1 0 8.486 8.486",
        },
      },
    ],
    { keywords: ["回形针", "附加文件"], aliases: ["attachment"] },
  ),
  printer: filesIcon(
    "打印",
    [
      {
        tag: "path",
        attrs: {
          d: "M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2",
        },
      },
      { tag: "path", attrs: { d: "M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6" } },
      {
        tag: "rect",
        attrs: { x: "6", y: "14", width: "12", height: "8", rx: "1" },
      },
    ],
    { keywords: ["打印机", "输出"] },
  ),
};

const editorIcon = iconInCategory("编辑器");

export const editorIcons = {
  bold: editorIcon(
    "粗体",
    [
      {
        tag: "path",
        attrs: {
          d: "M6 12h9a4 4 0 0 1 0 8H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h7a4 4 0 0 1 0 8",
        },
      },
    ],
    { keywords: ["加粗", "文字", "排版"] },
  ),
  italic: editorIcon(
    "斜体",
    [
      { tag: "line", attrs: { x1: "19", x2: "10", y1: "4", y2: "4" } },
      { tag: "line", attrs: { x1: "14", x2: "5", y1: "20", y2: "20" } },
      { tag: "line", attrs: { x1: "15", x2: "9", y1: "4", y2: "20" } },
    ],
    { keywords: ["字体", "文字", "排版"] },
  ),
  underline: editorIcon(
    "下划线",
    [
      { tag: "path", attrs: { d: "M6 4v6a6 6 0 0 0 12 0V4" } },
      { tag: "line", attrs: { x1: "4", x2: "20", y1: "20", y2: "20" } },
    ],
    { keywords: ["底线", "文字", "排版"] },
  ),
  strikethrough: editorIcon(
    "删除线",
    [
      { tag: "path", attrs: { d: "M16 4H9a3 3 0 0 0-2.83 4" } },
      { tag: "path", attrs: { d: "M14 12a4 4 0 0 1 0 8H6" } },
      { tag: "line", attrs: { x1: "4", x2: "20", y1: "12", y2: "12" } },
    ],
    { keywords: ["划线", "文字", "排版"] },
  ),
  "align-left": editorIcon(
    "左对齐",
    [
      { tag: "path", attrs: { d: "M15 12H3" } },
      { tag: "path", attrs: { d: "M17 18H3" } },
      { tag: "path", attrs: { d: "M21 6H3" } },
    ],
    { keywords: ["文本", "排版", "段落"] },
  ),
  "align-center": editorIcon(
    "居中对齐",
    [
      { tag: "path", attrs: { d: "M17 12H7" } },
      { tag: "path", attrs: { d: "M19 18H5" } },
      { tag: "path", attrs: { d: "M21 6H3" } },
    ],
    { keywords: ["文本", "排版", "段落"] },
  ),
  "align-right": editorIcon(
    "右对齐",
    [
      { tag: "path", attrs: { d: "M21 12H9" } },
      { tag: "path", attrs: { d: "M21 18H7" } },
      { tag: "path", attrs: { d: "M21 6H3" } },
    ],
    { keywords: ["文本", "排版", "段落"] },
  ),
  "align-justify": editorIcon(
    "两端对齐",
    [
      { tag: "path", attrs: { d: "M3 12h18" } },
      { tag: "path", attrs: { d: "M3 18h18" } },
      { tag: "path", attrs: { d: "M3 6h18" } },
    ],
    { keywords: ["文本", "排版", "段落"] },
  ),
  heading: editorIcon(
    "标题",
    [
      { tag: "path", attrs: { d: "M6 12h12" } },
      { tag: "path", attrs: { d: "M6 20V4" } },
      { tag: "path", attrs: { d: "M18 20V4" } },
    ],
    { keywords: ["文本", "章节", "排版"] },
  ),
  quote: editorIcon(
    "引用",
    [
      {
        tag: "path",
        attrs: {
          d: "M16 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z",
        },
      },
      {
        tag: "path",
        attrs: {
          d: "M5 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z",
        },
      },
    ],
    { keywords: ["引号", "摘录", "正文"] },
  ),
  code: editorIcon(
    "代码",
    [
      { tag: "polyline", attrs: { points: "16 18 22 12 16 6" } },
      { tag: "polyline", attrs: { points: "8 6 2 12 8 18" } },
    ],
    { keywords: ["标签", "编程", "源码"] },
  ),
  "indent-increase": editorIcon(
    "增加缩进",
    [
      { tag: "path", attrs: { d: "M21 12H11" } },
      { tag: "path", attrs: { d: "M21 18H11" } },
      { tag: "path", attrs: { d: "M21 6H11" } },
      { tag: "path", attrs: { d: "m3 8 4 4-4 4" } },
    ],
    { keywords: ["段落", "缩进", "排版"], directional: true },
  ),
  "indent-decrease": editorIcon(
    "减少缩进",
    [
      { tag: "path", attrs: { d: "M21 12H11" } },
      { tag: "path", attrs: { d: "M21 18H11" } },
      { tag: "path", attrs: { d: "M21 6H11" } },
      { tag: "path", attrs: { d: "m7 8-4 4 4 4" } },
    ],
    { keywords: ["段落", "缩进", "排版"], directional: true },
  ),
};
