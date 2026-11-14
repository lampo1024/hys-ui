import {
  ClipboardPaste,
  Copy,
  Eraser,
  FolderOpen,
  Maximize,
  MessageSquareText,
  Redo2,
  PanelsLeftRight,
  SlidersHorizontal,
  Table2,
  Undo2,
} from "lucide-vue-next";
import {
  commandGroups,
  historyTool,
} from "../SpreadsheetCommands/commandGroups";
import {
  colorPanels,
  fontPanels,
  formatActions,
  formatPanels,
  wrapAction,
} from "./formatTools";

export const builtinPanels = [
  { id: "workbook", label: "工作簿", icon: FolderOpen },
  { id: "sheets", label: "工作表管理", icon: Table2 },
  { id: "settings", label: "单元格设置", icon: SlidersHorizontal },
  { id: "comments", label: "批注", icon: MessageSquareText },
  { id: "sheet-transition", label: "工作表切换动效", icon: PanelsLeftRight },
] as const;

export const quickActions = [
  { id: "undo", label: "撤销", icon: Undo2, action: true },
  { id: "redo", label: "重做", icon: Redo2, action: true },
  { id: "copy", label: "复制选区", icon: Copy, action: true },
  { id: "paste", label: "粘贴", icon: ClipboardPaste, action: true },
  { id: "clear", label: "清空选区", icon: Eraser, action: true },
] as const;

const fullscreenAction = {
  id: "fullscreen",
  label: "全屏",
  icon: Maximize,
  action: true,
} as const;
const numberPanel = formatPanels[3];
export const toolbarTools = [
  builtinPanels[0],
  ...quickActions.slice(0, 4),
  formatActions[0],
  ...colorPanels,
  numberPanel,
  fullscreenAction,
  commandGroups[0],
  builtinPanels[1],
  builtinPanels[2],
  quickActions[4],
  ...fontPanels,
  ...formatActions.slice(1),
  formatPanels[0],
  ...commandGroups.slice(1),
  builtinPanels[3],
  wrapAction,
  historyTool,
  builtinPanels[4],
] as const;

const inlineCommands = commandGroups.filter((item) => item.id !== "search");
export const toolbarPanels = [
  ...builtinPanels,
  ...fontPanels,
  ...formatPanels,
  ...inlineCommands,
  historyTool,
] as const;

export type ToolbarTool = (typeof toolbarTools)[number];
export type ToolbarAction = (typeof quickActions)[number]["id"] | "fullscreen";
export type ToolbarPanel = (typeof toolbarPanels)[number]["id"];

export function isInlineCommand(
  group: ToolbarPanel,
): group is (typeof inlineCommands)[number]["id"] {
  return inlineCommands.some(({ id }) => id === group);
}

export const toolbarButtonWidth = 30;

export function toolbarLayout(
  width: number,
  gap: number,
  sizes: readonly number[],
  extra: number,
  maxRows: 1 | 2,
) {
  let line = 0;
  let end = 0;
  function place(size: number, following = 0) {
    const next = end ? end + gap + size : size;
    const wraps = next > width && end > 0;
    const nextLine = line + Number(wraps);
    const nextEnd = wraps ? size : next;
    if (
      nextEnd > width ||
      nextLine >= maxRows ||
      (nextLine === maxRows - 1 &&
        following &&
        nextEnd + gap + following > width)
    )
      return false;
    line = nextLine;
    end = nextEnd;
    return true;
  }
  const allFit = sizes.every((size) => place(size)) && (!extra || place(extra));
  if (allFit) return { count: sizes.length, extraInMenu: false };

  line = 0;
  end = 0;
  const more = Math.min(width, toolbarButtonWidth);
  let count = 0;
  for (const size of sizes) {
    if (!place(size, more)) break;
    count++;
  }
  return { count, extraInMenu: !!extra && !place(extra, more) };
}
