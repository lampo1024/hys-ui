import {
  Calculator,
  History,
  ListFilter,
  Palette,
  PencilRuler,
  Rows3,
  Search,
} from "lucide-vue-next";

export const historyTool = {
  id: "history",
  label: "版本记录",
  icon: History,
} as const;

export const commandGroups = [
  { id: "search", label: "查找与替换", icon: Search },
  { id: "edit", label: "编辑与填充", icon: PencilRuler },
  { id: "axes", label: "行列与冻结", icon: Rows3 },
  { id: "data", label: "数据与筛选", icon: ListFilter },
  { id: "format", label: "样式与条件格式", icon: Palette },
  { id: "view", label: "视图与计算", icon: Calculator },
] as const;

export type CommandGroup = (typeof commandGroups)[number]["id"];
