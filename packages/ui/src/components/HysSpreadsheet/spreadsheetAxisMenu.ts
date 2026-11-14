import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowLeftRight,
  ArrowUp,
  ArrowUpDown,
  Copy,
  Eye,
  EyeOff,
  LockKeyhole,
  LockKeyholeOpen,
  Snowflake,
  Trash2,
} from "lucide-vue-next";
import type { HysContextMenuItem } from "../../composables/menu";
import { axisCount, axisHidden } from "./spreadsheetAxis";
import { sheetLimits } from "./spreadsheetModel";
import type {
  HysSpreadsheetAxis,
  HysSpreadsheetAxisCommand,
  HysSpreadsheetSheet,
} from "./spreadsheetTypes";

type AxisMenuAction = HysSpreadsheetAxisCommand | "fit" | "size";
type AxisMenuItem = Omit<HysContextMenuItem, "children"> & {
  action?: AxisMenuAction;
  children?: AxisMenuItem[];
};

const rowLabels = {
  copy: "复制此行到下方",
  insertBefore: "在上方插入行",
  insertAfter: "在下方插入行",
  moveBefore: "上移一行",
  moveAfter: "下移一行",
  size: "行高",
  setSize: "设置行高",
  fit: "自动适应行高",
  hide: "隐藏此行",
  showBefore: "取消隐藏上方行",
  showAfter: "取消隐藏下方行",
  freeze: "冻结至此行",
  unfreeze: "取消冻结行",
  lock: "锁定此行",
  unlock: "解锁此行",
  delete: "删除此行",
};
const columnLabels = {
  copy: "复制此列到右侧",
  insertBefore: "在左侧插入列",
  insertAfter: "在右侧插入列",
  moveBefore: "左移一列",
  moveAfter: "右移一列",
  size: "列宽",
  setSize: "设置列宽",
  fit: "自动适应列宽",
  hide: "隐藏此列",
  showBefore: "取消隐藏左侧列",
  showAfter: "取消隐藏右侧列",
  freeze: "冻结至此列",
  unfreeze: "取消冻结列",
  lock: "锁定此列",
  unlock: "解锁此列",
  delete: "删除此列",
};

export function spreadsheetAxisMenu(
  sheet: HysSpreadsheetSheet,
  axis: HysSpreadsheetAxis,
  index: number,
  disabled: boolean,
  message: (label: string) => string,
): AxisMenuItem[] {
  const count = axisCount(sheet, axis);
  if (
    !Number.isInteger(index) ||
    index < 0 ||
    index >= count ||
    disabled ||
    sheet.protected
  )
    return [];

  const row = axis === "row";
  const labels = row ? rowLabels : columnLabels;
  const before = row ? ArrowUp : ArrowLeft;
  const after = row ? ArrowDown : ArrowRight;
  const options = row ? sheet.rowOptions : sheet.columnOptions;
  const groups = row ? sheet.rowGroups : sheet.columnGroups;
  const group = !row ? groups?.find(({ start }) => start === index) : undefined;
  const otherFrozen = (row ? sheet.frozenColumns : sheet.frozenRows) ?? 0;
  const frozen = (row ? sheet.frozenRows : sheet.frozenColumns) ?? 0;
  const full = count >= (row ? sheetLimits.rows : sheetLimits.columns);
  const locked = options?.[index]?.locked;
  let hasOtherVisible = false;
  for (let position = 0; position < count; position++) {
    if (position !== index && !axisHidden(sheet, axis, position)) {
      hasOtherVisible = true;
      break;
    }
  }
  const freeze = (extent: number): HysSpreadsheetAxisCommand => ({
    type: "freeze",
    rows: row ? extent : otherFrozen,
    columns: row ? otherFrozen : extent,
  });
  const adjacentHidden: AxisMenuItem[] = [];
  let first = index;
  let last = index;
  while (first > 0 && options?.[first - 1]?.hidden) first--;
  while (last + 1 < count && options?.[last + 1]?.hidden) last++;
  if (first < index)
    adjacentHidden.push({
      value: `${axis}-show-before`,
      label: message(labels.showBefore),
      icon: Eye,
      action: {
        type: "configure",
        axis,
        index: first,
        count: index - first,
        options: { hidden: false },
      },
    });
  if (last > index)
    adjacentHidden.push({
      value: `${axis}-show-after`,
      label: message(labels.showAfter),
      icon: Eye,
      action: {
        type: "configure",
        axis,
        index: index + 1,
        count: last - index,
        options: { hidden: false },
      },
    });

  return [
    {
      value: `${axis}-copy`,
      label: message(labels.copy),
      icon: Copy,
      disabled: full,
      action: { type: "copy", axis, index },
    },
    {
      value: `${axis}-insert-before`,
      label: message(labels.insertBefore),
      icon: before,
      disabled: full,
      action: { type: "insert", axis, index },
    },
    {
      value: `${axis}-insert-after`,
      label: message(labels.insertAfter),
      icon: after,
      disabled: full,
      action: { type: "insert", axis, index: index + 1 },
    },
    {
      value: `${axis}-move-up`,
      label: message(labels.moveBefore),
      icon: before,
      disabled: index === 0,
      action: { type: "move", axis, index, to: index - 1 },
    },
    {
      value: `${axis}-move-down`,
      label: message(labels.moveAfter),
      icon: after,
      disabled: index + 1 === count,
      action: { type: "move", axis, index, to: index + 1 },
    },
    { value: `${axis}-layout-separator`, label: "", type: "divider" },
    {
      value: row ? "row-height" : "column-width",
      label: message(labels.size),
      icon: row ? ArrowUpDown : ArrowLeftRight,
      children: [
        {
          value: row ? "row-set-height" : "column-set-width",
          label: message(labels.setSize),
          action: "size",
        },
        { value: `${axis}-fit`, label: message(labels.fit), action: "fit" },
      ],
    },
    {
      value: `${axis}-hide`,
      label: message(labels.hide),
      icon: EyeOff,
      disabled: !hasOtherVisible,
      action: {
        type: "configure",
        axis,
        index,
        options: { hidden: true },
      },
    },
    ...adjacentHidden,
    ...(!row && (group || index + 1 < count)
      ? [
          {
            value: "column-groups",
            label: message("列分组"),
            children: group
              ? [
                  {
                    value: "column-toggle-group",
                    label: message(group.collapsed ? "展开分组" : "折叠分组"),
                    action: { type: "toggleGroup", axis, index },
                  },
                  {
                    value: "column-remove-group",
                    label: message("取消分组"),
                    action: { type: "removeGroup", axis, index },
                  },
                ]
              : [
                  {
                    value: "column-group",
                    label: message("与右侧列分组"),
                    action: { type: "group", axis, index, count: 2 },
                  },
                ],
          } satisfies AxisMenuItem,
        ]
      : []),
    {
      value: `${axis}-freeze`,
      label: message(labels.freeze),
      icon: Snowflake,
      disabled: frozen === index + 1,
      action: freeze(index + 1),
    },
    ...(frozen
      ? [
          {
            value: `${axis}-unfreeze`,
            label: message(labels.unfreeze),
            action: freeze(0),
          },
        ]
      : []),
    {
      value: `${axis}-lock`,
      label: message(locked ? labels.unlock : labels.lock),
      icon: locked ? LockKeyholeOpen : LockKeyhole,
      action: {
        type: "configure",
        axis,
        index,
        options: { locked: !locked },
      },
    },
    { value: `${axis}-delete-separator`, label: "", type: "divider" },
    {
      value: `${axis}-delete`,
      label: message(labels.delete),
      icon: Trash2,
      danger: true,
      disabled: !hasOtherVisible,
      action: { type: "delete", axis, index },
    },
  ];
}

export function spreadsheetAxisAction(
  items: AxisMenuItem[],
  key: string | number,
) {
  for (const item of items) {
    if (item.disabled) continue;
    if (item.value === key) return item.action;
    const child = item.children?.find(
      (entry) => !entry.disabled && entry.value === key,
    );
    if (child) return child.action;
  }
}
