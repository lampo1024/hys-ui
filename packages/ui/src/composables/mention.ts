import type { StyleValue, VNodeChild } from "vue";
import type { Placement } from "./useFloating";
import type { HysPopupMotionProps } from "../motion/popup";

export interface HysMentionUser {
  id: string;
  name: string;
  disabled?: boolean;
}
export interface HysMentionOption {
  id?: string | number;
  value: string | number;
  label?: string | ((option: HysMentionOption) => VNodeChild);
  disabled?: boolean;
  prefix?: string;
  type?: string;
  avatar?: string;
  description?: string;
  group?: string;
  keywords?: readonly string[];
  recommended?: boolean;
  class?: string;
  style?: StyleValue;
  payload?: unknown;
}
export interface HysMentionContext {
  prefix: string;
  query: string;
  start: number;
  end: number;
  manual?: boolean;
}
export interface HysMentionFieldNames {
  value?: string;
  label?: string;
  disabled?: string;
  id?: string;
  group?: string;
  avatar?: string;
  description?: string;
  type?: string;
}
export type HysMentionDataOption = HysMentionOption | Record<string, unknown>;
export interface HysMentionLoadContext extends HysMentionContext {
  signal: AbortSignal;
  text: string;
  page: number;
  pageSize: number;
  cursor?: string | number;
}
export interface HysMentionPage {
  items: readonly HysMentionDataOption[];
  hasMore?: boolean;
  nextCursor?: string | number | null;
  total?: number;
}
export type HysMentionLoader = (
  context: HysMentionLoadContext,
) =>
  | readonly HysMentionDataOption[]
  | HysMentionPage
  | Promise<readonly HysMentionDataOption[] | HysMentionPage>;
export type HysMentionFilter =
  | boolean
  | ((query: string, option: HysMentionOption, prefix: string) => boolean);
export type HysMentionSearchField =
  string | ((option: HysMentionOption) => unknown);
export type HysMentionSearchMode = "includes" | "fuzzy" | "pinyin" | "initials";
export type HysMentionMatch = (context: {
  text: string;
  caret: number;
  prefix: string;
}) => { start: number; query: string } | null | undefined;
export interface HysMentionTrigger {
  prefix: string;
  minQueryLength?: number;
  boundary?: "any" | "word" | ((text: string, index: number) => boolean);
  allowSpaces?: boolean;
  match?: HysMentionMatch;
  split?: string;
  type?: string;
  options?: readonly HysMentionDataOption[];
  loadOptions?: HysMentionLoader;
  filterOption?: HysMentionFilter;
  searchMode?: HysMentionSearchMode | readonly HysMentionSearchMode[];
  formatMention?: HysMentionProps["formatMention"];
  allowCreate?: boolean;
}
export interface HysMentionSource {
  key: string;
  prefixes?: readonly string[];
  group?: string;
  options?: readonly HysMentionDataOption[];
  loadOptions?: HysMentionLoader;
  fieldNames?: HysMentionFieldNames;
}
export interface HysMentionEntity {
  id: string | number;
  value: string | number;
  label: string;
  type: string;
  prefix: string;
  text: string;
  start: number;
  end: number;
  payload?: unknown;
}
export interface HysMentionDocument {
  text: string;
  entities: HysMentionEntity[];
}
export interface HysMentionOpenOptions {
  prefix?: string;
  query?: string;
  position?: number;
}
export interface HysMentionInsertOptions {
  prefix?: string;
  start?: number;
  end?: number;
  focus?: boolean;
}
export interface HysMentionAutosize {
  minRows?: number;
  maxRows?: number;
}
export interface HysMentionLocale {
  input: string;
  list: string;
  placeholder: string;
  loading: string;
  empty: string;
  error: string;
  retry: string;
  more: string;
  recent: string;
  recommended: string;
  clear: string;
  create: string;
}
export interface HysMentionSlots {
  prefix?: () => VNodeChild;
  suffix?: () => VNodeChild;
  "clear-icon"?: () => VNodeChild;
  count?: (props: { count: number; max?: number }) => VNodeChild;
  option?: (props: {
    user: HysMentionUser;
    option: HysMentionOption;
    context?: HysMentionContext;
    created: boolean;
  }) => VNodeChild;
  avatar?: (props: { option: HysMentionOption }) => VNodeChild;
  group?: (props: { label: string; context?: HysMentionContext }) => VNodeChild;
  header?: (props: { context?: HysMentionContext }) => VNodeChild;
  footer?: (props: {
    context?: HysMentionContext;
    hasMore: boolean;
    loadMore: () => Promise<boolean>;
  }) => VNodeChild;
  loading?: () => VNodeChild;
  empty?: () => VNodeChild;
  error?: (props: {
    error: unknown;
    retry: () => void;
    context?: HysMentionContext;
  }) => VNodeChild;
}
export type HysMentionAction =
  | "next"
  | "previous"
  | "first"
  | "last"
  | "select"
  | "close"
  | "open"
  | "retry";
export interface HysMentionInstance {
  readonly input: HTMLElement | undefined;
  readonly dropdownVisible: boolean;
  focus: () => void;
  blur: () => void;
  open: (options?: HysMentionOpenOptions) => boolean;
  close: () => void;
  update: () => void;
  retry: () => void;
  loadMore: () => Promise<boolean>;
  insertMention: (
    option: HysMentionOption,
    options?: HysMentionInsertOptions,
  ) => Promise<boolean>;
  removeMention: (
    target: HysMentionEntity | string | number,
  ) => Promise<boolean>;
  getEntities: () => HysMentionEntity[];
  getDocument: () => HysMentionDocument;
  setDocument: (document: HysMentionDocument | string) => Promise<boolean>;
  serialize: () => string;
  clear: () => Promise<boolean>;
  undo: () => Promise<boolean>;
  redo: () => Promise<boolean>;
}
export interface HysMentionProps extends HysPopupMotionProps {
  modelValue?: string;
  users?: readonly HysMentionUser[];
  /** 候选选项。提供时优先于 users。 */
  options?: readonly HysMentionDataOption[];
  fieldNames?: HysMentionFieldNames;
  /** 输入触发词后按当前关键字加载候选。过期请求会被取消。 */
  loadOptions?: HysMentionLoader;
  sources?: readonly HysMentionSource[];
  debounce?: number;
  throttle?: number;
  pageSize?: number;
  cache?: boolean | { ttl?: number; maxEntries?: number };
  historyKey?: string;
  recentLimit?: number;
  recommendations?: readonly HysMentionOption[];
  recommendOnFocus?: boolean;
  minQueryLength?: number;
  defaultValue?: string;
  /** 提及触发词，可传多个前缀。 */
  prefix?: string | readonly string[];
  triggers?: readonly HysMentionTrigger[];
  boundary?: HysMentionTrigger["boundary"];
  allowSpaces?: boolean;
  matchTrigger?: HysMentionMatch;
  /** 选择候选后插入的分隔符。 */
  split?: string;
  filterOption?: HysMentionFilter;
  searchMode?: HysMentionTrigger["searchMode"];
  searchFields?: readonly HysMentionSearchField[];
  sortOptions?:
    | boolean
    | ((
        a: HysMentionOption,
        b: HysMentionOption,
        context: HysMentionContext,
      ) => number);
  groupBy?: (
    option: HysMentionOption,
    context: HysMentionContext,
  ) => string | undefined;
  validateSearch?: (query: string, context: HysMentionContext) => boolean;
  whole?: boolean;
  checkIsWhole?: (value: string, prefix: string) => boolean;
  validateEntity?: (entity: HysMentionEntity) => boolean;
  invalidEntity?: "mark" | "text" | "remove";
  canSelect?: (option: HysMentionOption, context: HysMentionContext) => boolean;
  beforeRemove?: (entity: HysMentionEntity) => boolean;
  parseEntities?: (text: string) => readonly HysMentionEntity[];
  highlightMentions?: boolean;
  entityClass?: string | ((entity: HysMentionEntity) => string);
  allowCreate?: boolean;
  createOption?: (context: HysMentionContext) => HysMentionOption | false;
  /** 自定义写入的提及文本，包含所需前缀。组件会追加 split。 */
  formatMention?: (
    option: HysMentionOption,
    context: HysMentionContext,
  ) => string;
  /** 替换光标后的同一提及词尾。默认保留光标后的文本。 */
  replaceRest?: boolean;
  selectOnTab?: boolean;
  highlightMatch?: boolean;
  loading?: boolean;
  notFoundText?: string;
  errorText?: string;
  maxOptions?: number;
  placement?: Placement;
  showArrow?: boolean;
  offset?: number;
  autoAdjustOverflow?: boolean;
  popupWidth?: string | number;
  popupMaxHeight?: string | number;
  zIndex?: number;
  virtual?: boolean;
  itemHeight?: number;
  overscan?: number;
  appendTo?: string | HTMLElement | false;
  popupClass?: string;
  popupStyle?: StyleValue;
  type?: "text" | "textarea" | "rich";
  rows?: number;
  name?: string;
  autofocus?: boolean;
  placeholder?: string;
  disabled?: boolean;
  readonly?: boolean;
  maxlength?: number;
  minlength?: number;
  required?: boolean;
  clearable?: boolean;
  showCount?: boolean;
  autosize?: boolean | HysMentionAutosize;
  restoreFocus?: boolean;
  shortcuts?: Partial<Record<string, HysMentionAction>>;
  locale?: Partial<HysMentionLocale>;
  defaultEntities?: readonly HysMentionEntity[];
  entities?: readonly HysMentionEntity[];
  ariaLabel?: string;
  status?: "error" | "warning";
  size?: "sm" | "md" | "lg";
}
