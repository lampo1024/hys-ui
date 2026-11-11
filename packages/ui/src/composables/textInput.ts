import type {
  Component,
  InputHTMLAttributes,
  StyleValue,
  TextareaHTMLAttributes,
} from "vue";
export interface HysInputFormatInfo {
  userTyping: boolean;
  input: string;
}
export interface HysInputCountInfo {
  value: string;
  count: number;
  maxLength?: number;
}
export type HysInputCountStrategy = boolean | ((value: string) => number);
export type HysInputSize =
  "sm" | "md" | "lg" | "small" | "middle" | "default" | "large";
export interface HysInputModelModifiers {
  lazy?: boolean;
  trim?: boolean;
  number?: boolean;
}
export interface HysTextareaStyle {
  height?: string;
  overflowY?: "auto" | "hidden";
}
export interface HysInputProps {
  modelValue?: string | number | null;
  /** Vue v-model 修饰符。lazy 延后写入模型，trim 去首尾空白，number 由 Vue 转换数值。 */
  modelModifiers?: HysInputModelModifiers;
  defaultValue?: string | number | null;
  placeholder?: string;
  type?: string;
  label?: string;
  disabled?: boolean;
  readonly?: boolean;
  ariaLabel?: string;
  error?: string;
  status?: "error" | "warning" | "success";
  clearable?: boolean;
  /** 清空开关别名，clearable 显式设置时优先。 */
  allowClear?: boolean;
  /** 输入框外侧的附加文字，prepend 插槽优先。 */
  addonBefore?: string;
  /** 输入框外侧的附加文字，append 插槽优先。 */
  addonAfter?: string;
  clearIcon?: Component;
  prefixIcon?: Component;
  suffixIcon?: Component;
  showPassword?: boolean;
  showPasswordOn?: "click" | "mousedown";
  passwordVisible?: boolean;
  defaultPasswordVisible?: boolean;
  showCount?: boolean | { formatter: (info: HysInputCountInfo) => string };
  showWordLimit?: boolean;
  countPosition?: "inside" | "outside";
  wordLimitPosition?: "inside" | "outside";
  countGraphemes?: HysInputCountStrategy;
  maxlength?: number | string;
  minlength?: number | string;
  formatter?: (value: string, info: HysInputFormatInfo) => string;
  parser?: (value: string) => string | number;
  allowInput?: (value: string) => boolean;
  autocomplete?: string;
  name?: string;
  size?: HysInputSize;
  rows?: number;
  autosize?: boolean | { minRows?: number; maxRows?: number };
  resize?: "none" | "both" | "horizontal" | "vertical";
  inputProps?: InputHTMLAttributes | TextareaHTMLAttributes;
  /** 应用到原生输入元素的样式。自动高度启用时由组件管理 height 和 overflowY。 */
  inputStyle?: StyleValue;
  /** 原生 inputmode，用于提示移动端键盘布局。 */
  inputmode?: InputHTMLAttributes["inputmode"];
  /** 原生控件的 Tab 顺序。 */
  tabindex?: string | number;
  /** 关联的原生 form 元素 ID，可提交在表单外的输入。 */
  form?: string;
  /** 是否由组件交互触发表单的 change、blur 校验，默认 true。 */
  validateEvent?: boolean;
  autofocus?: boolean;
  selectOnFocus?: boolean;
  bordered?: boolean;
  round?: boolean;
}
export interface HysInputInstance {
  element: HTMLInputElement | HTMLTextAreaElement | undefined;
  input: HTMLInputElement | HTMLTextAreaElement | undefined;
  textarea: HTMLTextAreaElement | undefined;
  isComposing: boolean;
  passwordVisible: boolean;
  textareaStyle: HysTextareaStyle;
  focus: (options?: FocusOptions) => void;
  blur: () => void;
  select: () => void;
  clear: () => void;
  resize: () => Promise<void>;
  resizeTextarea: () => Promise<void>;
  setSelectionRange: (
    start: number,
    end: number,
    direction?: "forward" | "backward" | "none",
  ) => void;
  scrollTo: (options: ScrollToOptions) => void;
}
export type HysTextareaProps = Omit<
  HysInputProps,
  | "type"
  | "showPassword"
  | "showPasswordOn"
  | "passwordVisible"
  | "defaultPasswordVisible"
>;
export interface HysTextareaInstance extends Omit<
  HysInputInstance,
  "input" | "element" | "passwordVisible"
> {
  input: HTMLTextAreaElement | undefined;
  element: HTMLTextAreaElement | undefined;
}

export function textInputSize(size?: HysInputSize) {
  if (size === "small") return "sm";
  if (size === "middle" || size === "default") return "md";
  if (size === "large") return "lg";
  return size;
}

export function modelText(value: string, modifiers?: HysInputModelModifiers) {
  const text = modifiers?.trim ? value.trim() : value;
  const number = modifiers?.number ? parseFloat(text) : NaN;
  return Number.isNaN(number) ? text : String(number);
}
let segmenter:
  { segment: (value: string) => Iterable<{ segment: string }> } | undefined;
function graphemes(value: string) {
  const Constructor = (
    Intl as unknown as {
      Segmenter?: new (
        locale?: string,
        options?: { granularity: string },
      ) => typeof segmenter;
    }
  ).Segmenter;
  if (Constructor) {
    segmenter ??= new Constructor(undefined, { granularity: "grapheme" });
    if (segmenter)
      return Array.from(segmenter.segment(value), (item) => item.segment);
  }
  return Array.from(value);
}
export function textCount(
  value: string,
  strategy?: HysInputCountStrategy,
): number {
  if (typeof strategy === "function") {
    try {
      const count = strategy(value);
      if (Number.isFinite(count) && count >= 0) return count;
    } catch {}
  }
  return strategy ? graphemes(value).length : value.length;
}
export function textLimit(
  value: string,
  max: number | undefined,
  strategy?: HysInputCountStrategy,
): string {
  if (max === undefined || textCount(value, strategy) <= max) return value;
  const parts = strategy ? graphemes(value) : Array.from(value);
  let low = 0,
    high = parts.length;
  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    if (textCount(parts.slice(0, middle).join(""), strategy) <= max)
      low = middle;
    else high = middle - 1;
  }
  return parts.slice(0, low).join("");
}
export function textLengthLimit(value?: string | number): number | undefined {
  if (value === undefined || value === "") return;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0
    ? Math.floor(number)
    : undefined;
}
