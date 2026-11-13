import { iconInCategory } from "./iconInCategory";

const dataIcon = iconInCategory("数据与图表");

export const dataIcons = {
  "chart-column": dataIcon(
    "柱状图",
    [
      { tag: "path", attrs: { d: "M3 3v16a2 2 0 0 0 2 2h16" } },
      { tag: "path", attrs: { d: "M18 17V9" } },
      { tag: "path", attrs: { d: "M13 17V5" } },
      { tag: "path", attrs: { d: "M8 17v-3" } },
    ],
    { keywords: ["统计", "报表", "直方图"], aliases: ["bar-chart"] },
  ),
  "chart-bar": dataIcon(
    "条形图",
    [
      { tag: "path", attrs: { d: "M3 3v16a2 2 0 0 0 2 2h16" } },
      { tag: "path", attrs: { d: "M7 16h8" } },
      { tag: "path", attrs: { d: "M7 11h12" } },
      { tag: "path", attrs: { d: "M7 6h3" } },
    ],
    { keywords: ["横向", "条状图", "统计"] },
  ),
  "chart-line": dataIcon(
    "折线图",
    [
      { tag: "path", attrs: { d: "M3 3v16a2 2 0 0 0 2 2h16" } },
      { tag: "path", attrs: { d: "m19 9-5 5-4-4-3 3" } },
    ],
    { keywords: ["曲线", "趋势", "报表"], aliases: ["line-chart"] },
  ),
  "chart-pie": dataIcon(
    "饼图",
    [
      {
        tag: "path",
        attrs: {
          d: "M21 12c.552 0 1.005-.449.95-.998a10 10 0 0 0-8.953-8.951c-.55-.055-.998.398-.998.95v8a1 1 0 0 0 1 1z",
        },
      },
      { tag: "path", attrs: { d: "M21.21 15.89A10 10 0 1 1 8 2.83" } },
    ],
    { keywords: ["比例", "占比", "统计"], aliases: ["pie-chart"] },
  ),
  "chart-area": dataIcon(
    "面积图",
    [
      { tag: "path", attrs: { d: "M3 3v16a2 2 0 0 0 2 2h16" } },
      {
        tag: "path",
        attrs: {
          d: "M7 11.207a.5.5 0 0 1 .146-.353l2-2a.5.5 0 0 1 .708 0l3.292 3.292a.5.5 0 0 0 .708 0l4.292-4.292a.5.5 0 0 1 .854.353V16a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1z",
        },
      },
    ],
    { keywords: ["面积", "曲线", "时序"], aliases: ["area-chart"] },
  ),
  "trending-up": dataIcon(
    "趋势上升",
    [
      { tag: "polyline", attrs: { points: "22 7 13.5 15.5 8.5 10.5 2 17" } },
      { tag: "polyline", attrs: { points: "16 7 22 7 22 13" } },
    ],
    { keywords: ["增长", "上涨", "升高"] },
  ),
  "trending-down": dataIcon(
    "趋势下降",
    [
      { tag: "polyline", attrs: { points: "22 17 13.5 8.5 8.5 13.5 2 7" } },
      { tag: "polyline", attrs: { points: "16 17 22 17 22 11" } },
    ],
    { keywords: ["下跌", "衰退", "降低"] },
  ),
  activity: dataIcon(
    "活动监测",
    [
      {
        tag: "path",
        attrs: {
          d: "M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2",
        },
      },
    ],
    { keywords: ["波形", "心率", "监控"] },
  ),
  database: dataIcon(
    "数据库",
    [
      { tag: "ellipse", attrs: { cx: "12", cy: "5", rx: "9", ry: "3" } },
      { tag: "path", attrs: { d: "M3 5V19A9 3 0 0 0 21 19V5" } },
      { tag: "path", attrs: { d: "M3 12A9 3 0 0 0 21 12" } },
    ],
    { keywords: ["数据源", "存储", "SQL"] },
  ),
  table: dataIcon(
    "表格",
    [
      { tag: "path", attrs: { d: "M12 3v18" } },
      {
        tag: "rect",
        attrs: { width: "18", height: "18", x: "3", y: "3", rx: "2" },
      },
      { tag: "path", attrs: { d: "M3 9h18" } },
      { tag: "path", attrs: { d: "M3 15h18" } },
    ],
    { keywords: ["列", "行", "数据"] },
  ),
  gauge: dataIcon(
    "量表",
    [
      { tag: "path", attrs: { d: "m12 14 4-4" } },
      { tag: "path", attrs: { d: "M3.34 19a10 10 0 1 1 17.32 0" } },
    ],
    { keywords: ["仪表", "指针", "性能"] },
  ),
  "list-ordered": dataIcon(
    "有序列表",
    [
      { tag: "path", attrs: { d: "M10 12h11" } },
      { tag: "path", attrs: { d: "M10 18h11" } },
      { tag: "path", attrs: { d: "M10 6h11" } },
      { tag: "path", attrs: { d: "M4 10h2" } },
      { tag: "path", attrs: { d: "M4 6h1v4" } },
      { tag: "path", attrs: { d: "M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" } },
    ],
    { keywords: ["序号", "步骤", "清单"] },
  ),
  percent: dataIcon(
    "百分比",
    [
      { tag: "line", attrs: { x1: "19", x2: "5", y1: "5", y2: "19" } },
      { tag: "circle", attrs: { cx: "6.5", cy: "6.5", r: "2.5" } },
      { tag: "circle", attrs: { cx: "17.5", cy: "17.5", r: "2.5" } },
    ],
    { keywords: ["比例", "折扣", "百分号"] },
  ),
};

const commerceIcon = iconInCategory("商业与物流");

export const commerceIcons = {
  "shopping-cart": commerceIcon(
    "购物车",
    [
      { tag: "circle", attrs: { cx: "8", cy: "21", r: "1" } },
      { tag: "circle", attrs: { cx: "19", cy: "21", r: "1" } },
      {
        tag: "path",
        attrs: {
          d: "M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12",
        },
      },
    ],
    { keywords: ["电商", "结算", "cart"] },
  ),
  "shopping-bag": commerceIcon(
    "购物袋",
    [
      {
        tag: "path",
        attrs: { d: "M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" },
      },
      { tag: "path", attrs: { d: "M3 6h18" } },
      { tag: "path", attrs: { d: "M16 10a4 4 0 0 1-8 0" } },
    ],
    { keywords: ["购买", "电商", "提袋"] },
  ),
  store: commerceIcon(
    "门店",
    [
      {
        tag: "path",
        attrs: {
          d: "m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7",
        },
      },
      {
        tag: "path",
        attrs: { d: "M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" },
      },
      {
        tag: "path",
        attrs: { d: "M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" },
      },
      { tag: "path", attrs: { d: "M2 7h20" } },
      {
        tag: "path",
        attrs: {
          d: "M22 7v3a2 2 0 0 1-2 2a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12a2 2 0 0 1-2-2V7",
        },
      },
    ],
    { keywords: ["商店", "店铺", "线下"] },
  ),
  package: commerceIcon(
    "包裹",
    [
      {
        tag: "path",
        attrs: {
          d: "M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z",
        },
      },
      { tag: "path", attrs: { d: "M12 22V12" } },
      {
        tag: "path",
        attrs: { d: "m3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7" },
      },
      { tag: "path", attrs: { d: "m7.5 4.27 9 5.15" } },
    ],
    { keywords: ["包装", "纸箱", "货物"] },
  ),
  "package-check": commerceIcon(
    "包裹签收",
    [
      { tag: "path", attrs: { d: "m16 16 2 2 4-4" } },
      {
        tag: "path",
        attrs: {
          d: "M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14",
        },
      },
      { tag: "path", attrs: { d: "m7.5 4.27 9 5.15" } },
      { tag: "polyline", attrs: { points: "3.29 7 12 12 20.71 7" } },
      { tag: "line", attrs: { x1: "12", x2: "12", y1: "22", y2: "12" } },
    ],
    { keywords: ["物流", "已收货", "验收"] },
  ),
  truck: commerceIcon(
    "货运",
    [
      {
        tag: "path",
        attrs: {
          d: "M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2",
        },
      },
      { tag: "path", attrs: { d: "M15 18H9" } },
      {
        tag: "path",
        attrs: {
          d: "M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14",
        },
      },
      { tag: "circle", attrs: { cx: "17", cy: "18", r: "2" } },
      { tag: "circle", attrs: { cx: "7", cy: "18", r: "2" } },
    ],
    { keywords: ["快递", "物流", "配送"], aliases: ["delivery"] },
  ),
  receipt: commerceIcon(
    "收据",
    [
      {
        tag: "path",
        attrs: {
          d: "M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z",
        },
      },
      { tag: "path", attrs: { d: "M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" } },
      { tag: "path", attrs: { d: "M12 17.5v-11" } },
    ],
    { keywords: ["小票", "凭证", "账单"] },
  ),
  "credit-card": commerceIcon(
    "银行卡",
    [
      {
        tag: "rect",
        attrs: { width: "20", height: "14", x: "2", y: "5", rx: "2" },
      },
      { tag: "line", attrs: { x1: "2", x2: "22", y1: "10", y2: "10" } },
    ],
    { keywords: ["信用卡", "支付", "付款"] },
  ),
  wallet: commerceIcon(
    "钱包",
    [
      {
        tag: "path",
        attrs: {
          d: "M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1",
        },
      },
      {
        tag: "path",
        attrs: { d: "M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" },
      },
    ],
    { keywords: ["余额", "资金", "付款"] },
  ),
  banknote: commerceIcon(
    "纸币",
    [
      {
        tag: "rect",
        attrs: { width: "20", height: "12", x: "2", y: "6", rx: "2" },
      },
      { tag: "circle", attrs: { cx: "12", cy: "12", r: "2" } },
      { tag: "path", attrs: { d: "M6 12h.01M18 12h.01" } },
    ],
    { keywords: ["现金", "金额", "钞票"] },
  ),
  coins: commerceIcon(
    "硬币",
    [
      { tag: "circle", attrs: { cx: "8", cy: "8", r: "6" } },
      { tag: "path", attrs: { d: "M18.09 10.37A6 6 0 1 1 10.34 18" } },
      { tag: "path", attrs: { d: "M7 6h1v4" } },
      { tag: "path", attrs: { d: "m16.71 13.88.7.71-2.82 2.82" } },
    ],
    { keywords: ["积分", "金币", "金额"] },
  ),
  gift: commerceIcon(
    "礼物",
    [
      {
        tag: "rect",
        attrs: { x: "3", y: "8", width: "18", height: "4", rx: "1" },
      },
      { tag: "path", attrs: { d: "M12 8v13" } },
      {
        tag: "path",
        attrs: { d: "M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" },
      },
      {
        tag: "path",
        attrs: {
          d: "M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5",
        },
      },
    ],
    { keywords: ["礼包", "赠品", "礼品"] },
  ),
  tag: commerceIcon(
    "价格标签",
    [
      {
        tag: "path",
        attrs: {
          d: "M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z",
        },
      },
      {
        tag: "circle",
        attrs: { cx: "7.5", cy: "7.5", r: ".5", fill: "currentColor" },
      },
    ],
    { keywords: ["商品", "分类", "标记"] },
  ),
  ticket: commerceIcon(
    "票券",
    [
      {
        tag: "path",
        attrs: {
          d: "M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z",
        },
      },
      { tag: "path", attrs: { d: "M13 5v2" } },
      { tag: "path", attrs: { d: "M13 17v2" } },
      { tag: "path", attrs: { d: "M13 11v2" } },
    ],
    { keywords: ["入场券", "门票", "优惠券"] },
  ),
};
