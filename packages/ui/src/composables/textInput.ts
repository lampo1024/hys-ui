import type {
  Component,
  InputHTMLAttributes,
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
export interface HysInputProps {
  modelValue?: string | number | null;
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
  size?: "sm" | "md" | "lg";
  rows?: number;
  autosize?: boolean | { minRows?: number; maxRows?: number };
  resize?: "none" | "both" | "horizontal" | "vertical";
  inputProps?: InputHTMLAttributes | TextareaHTMLAttributes;
  autofocus?: boolean;
  selectOnFocus?: boolean;
  bordered?: boolean;
  round?: boolean;
}
export interface HysInputInstance {
  input: HTMLInputElement | HTMLTextAreaElement | undefined;
  textarea: HTMLTextAreaElement | undefined;
  isComposing: boolean;
  focus: (options?: FocusOptions) => void;
  blur: () => void;
  select: () => void;
  clear: () => void;
  resize: () => Promise<void>;
  setSelectionRange: (
    start: number,
    end: number,
    direction?: "forward" | "backward" | "none",
  ) => void;
  scrollTo: (options: ScrollToOptions) => void;
}
export type HysTextareaProps = Omit<HysInputProps, 'type' | 'showPassword' | 'showPasswordOn' | 'passwordVisible' | 'defaultPasswordVisible'>
export interface HysTextareaInstance extends Omit<HysInputInstance, 'input'> {
  input: HTMLTextAreaElement | undefined
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
