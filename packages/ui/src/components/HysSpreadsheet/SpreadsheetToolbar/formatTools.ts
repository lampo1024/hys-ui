import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  AlignVerticalJustifyStart,
  Binary,
  Baseline,
  Bold,
  Italic,
  PaintBucket,
  Square,
  Type,
  CaseSensitive,
  Underline,
  WrapText,
} from "lucide-vue-next";
import type { HysSpreadsheetCellFormat } from "../spreadsheetTypes";

export const wrapAction = {
  id: "wrap",
  label: "自动换行",
  icon: WrapText,
  format: { overflow: "wrap" },
} as const;

export const formatActions = [
  { id: "bold", label: "粗体", icon: Bold, toggle: "bold" },
  { id: "italic", label: "斜体", icon: Italic, toggle: "italic" },
  { id: "underline", label: "下划线", icon: Underline, toggle: "underline" },
  {
    id: "align-left",
    label: "左对齐",
    icon: AlignLeft,
    format: { align: "left" },
  },
  {
    id: "align-center",
    label: "水平居中",
    icon: AlignCenter,
    format: { align: "center" },
  },
  {
    id: "align-right",
    label: "右对齐",
    icon: AlignRight,
    format: { align: "right" },
  },
  {
    id: "align-top",
    label: "顶端对齐",
    icon: AlignVerticalJustifyStart,
    format: { verticalAlign: "top" },
  },
  {
    id: "align-middle",
    label: "垂直居中",
    icon: AlignVerticalJustifyCenter,
    format: { verticalAlign: "middle" },
  },
  {
    id: "align-bottom",
    label: "底端对齐",
    icon: AlignVerticalJustifyEnd,
    format: { verticalAlign: "bottom" },
  },
] as const satisfies readonly {
  id: string;
  label: string;
  icon: unknown;
  toggle?: keyof HysSpreadsheetCellFormat;
  format?: HysSpreadsheetCellFormat;
}[];

export const fontPanels = [
  { id: "font-family", label: "字体", icon: Type },
  { id: "font-size", label: "字号", icon: CaseSensitive },
] as const;

export const colorPanels = [
  { id: "font-color", label: "字体颜色", icon: Baseline },
  { id: "fill-color", label: "填充颜色", icon: PaintBucket },
] as const;
export const formatPanels = [
  { id: "borders", label: "边框", icon: Square },
  ...colorPanels,
  { id: "number-format", label: "数字格式", icon: Binary },
] as const;
export const fontFamilies = [
  "Arial",
  "Calibri",
  "Aptos",
  "Microsoft YaHei",
  "SimSun",
  "Times New Roman",
  "Consolas",
];

export type FormatAction = (typeof formatActions)[number] | typeof wrapAction;
export type FormatTool =
  FormatAction | (typeof formatPanels)[number] | (typeof fontPanels)[number];
export type FormatPanel =
  (typeof formatPanels)[number]["id"] | (typeof fontPanels)[number]["id"];
export function isFormatPanel(id: string): id is FormatPanel {
  return [...formatPanels, ...fontPanels].some((panel) => panel.id === id);
}
