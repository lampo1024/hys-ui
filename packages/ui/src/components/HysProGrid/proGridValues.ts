import type {
  HysProGridCell,
  HysProGridChange,
  HysProGridDecision,
  HysProGridEditor,
  HysProGridMessages,
  HysProGridParseResult,
} from "./proGridTypes";

export function gridEditRejection(value: HysProGridDecision, fallback: string) {
  if (value === false) return fallback;
  if (typeof value === "string") return value.trim() ? value : fallback;
}

export function gridEditChange<T extends object>(
  cell: HysProGridCell<T>,
  editor: HysProGridEditor<T>,
  value: unknown,
): HysProGridChange<T> {
  return {
    row: cell.row,
    rowKey: cell.rowKey,
    columnKey: cell.column.key,
    previousValue: cell.value,
    editor: editor.type,
    value,
  } as HysProGridChange<T>;
}

export const proGridMessages: HysProGridMessages = {
  edit: "编辑",
  save: "保存",
  cancel: "取消",
  retry: "重试保存",
  validating: "正在校验",
  saving: "正在保存",
  choose: "请选择",
  invalidNumber: "请输入有效数字",
  min: "数值不得小于 {value}",
  max: "数值不得大于 {value}",
  invalidChoice: "请选择有效选项",
  invalidValue: "无法解析输入值",
  validationFailed: "校验未通过",
  saveFailed: "保存失败，请重试",
};

export function initialGridDraft<T extends object>(
  cell: HysProGridCell<T>,
  editor: HysProGridEditor<T>,
) {
  if (editor.type === "custom")
    return editor.toDraft ? editor.toDraft(cell) : cell.value;
  if (editor.type === "select") return cell.value;
  return String(cell.value ?? "");
}

export function parseGridDraft<T extends object>(
  draft: unknown,
  cell: HysProGridCell<T>,
  editor: HysProGridEditor<T>,
  words: HysProGridMessages,
): HysProGridParseResult {
  if (editor.type === "custom")
    return editor.parse
      ? editor.parse(draft, cell)
      : { ok: true, value: draft };
  if (editor.type === "select") {
    const choice = editor.options.find(({ value }) => Object.is(draft, value));
    return choice
      ? { ok: true, value: choice.value }
      : { ok: false, message: words.invalidChoice };
  }
  const text = String(draft ?? "");
  if (editor.type === "text")
    return { ok: true, value: editor.trim ? text.trim() : text };
  const clean = text.trim();
  if (!clean && editor.nullable) return { ok: true, value: null };
  const number = Number(clean);
  if (
    !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(clean) ||
    !Number.isFinite(number)
  )
    return { ok: false, message: words.invalidNumber };
  if (editor.min !== undefined && number < editor.min)
    return {
      ok: false,
      message: words.min.replace("{value}", String(editor.min)),
    };
  if (editor.max !== undefined && number > editor.max)
    return {
      ok: false,
      message: words.max.replace("{value}", String(editor.max)),
    };
  return { ok: true, value: number };
}
