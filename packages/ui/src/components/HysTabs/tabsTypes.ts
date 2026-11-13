import type {
  Component,
  CSSProperties,
  MaybeRefOrGetter,
  VNodeChild,
} from "vue";

export type HysTabValue = string | number;
export type HysTabPlacement = "top" | "right" | "bottom" | "left";
export type HysTabType =
  | "line"
  | "card"
  | "border-card"
  | "pill"
  | "segment"
  | "button"
  | "minimal"
  | "borderless";
export type HysTabStatus = "loading" | "success" | "warning" | "error" | "info";
export type HysTabSource =
  | "click"
  | "hover"
  | "keyboard"
  | "wheel"
  | "swipe"
  | "menu"
  | "api"
  | "fallback"
  | "restore";
export type HysTabAnimation = "fade" | "slide" | "scale" | "spring" | "none";
export type HysTabCloseScope = "current" | "left" | "right" | "others" | "all";
export type HysTabContent =
  | string
  | Component
  | { component: Component; props?: Record<string, unknown> }
  | null;
export interface HysTabLoadContext {
  item: HysTabItem;
  signal: AbortSignal;
}
export interface HysTabItem {
  label: string;
  value: HysTabValue;
  content?: string;
  component?: Component;
  componentProps?: Record<string, unknown>;
  load?: (
    context: HysTabLoadContext,
  ) => HysTabContent | PromiseLike<HysTabContent>;
  disabled?: boolean;
  readonly?: boolean;
  hidden?: boolean;
  closable?: boolean;
  movable?: boolean;
  pinned?: boolean;
  favorite?: boolean;
  dirty?: boolean;
  unread?: boolean;
  badge?: number | string;
  dot?: boolean;
  status?: HysTabStatus;
  icon?: Component;
  statusIcon?: Component;
  color?: string;
  class?: string;
  style?: CSSProperties;
  width?: number | string;
  lazy?: boolean;
  cache?: boolean;
  forceRender?: boolean;
  preload?: boolean;
}
export interface HysTabGuardContext {
  signal: AbortSignal;
  source: HysTabSource;
  item: HysTabItem;
}
export interface HysTabChangeContext {
  value: HysTabValue;
  previous: HysTabValue;
  source: HysTabSource;
}
export interface HysTabOrderContext {
  value: HysTabValue;
  from: number;
  to: number;
  items: HysTabItem[];
}
export type HysTabSnapshot = Pick<
  HysTabItem,
  "value" | "label" | "pinned" | "favorite"
>;
export interface HysTabsProps {
  modelValue?: HysTabValue;
  defaultValue?: HysTabValue;
  items?: readonly HysTabItem[];
  defaultItems?: readonly HysTabItem[];
  workbench?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  type?: HysTabType;
  vertical?: boolean;
  placement?: HysTabPlacement;
  responsive?: boolean;
  breakpoint?: number;
  size?: "sm" | "md" | "lg";
  stretch?: boolean;
  centered?: boolean;
  align?: "start" | "center" | "end" | "between";
  tabWidth?: number | string;
  tabHeight?: number | string;
  tabMaxWidth?: number | string;
  gap?: number | string;
  radius?: number | string;
  separator?: boolean;
  sticky?: boolean;
  fixed?: boolean;
  barOffset?: number | string;
  panelHeight?: number | string;
  panelMaxHeight?: number | string;
  closable?: boolean;
  addable?: boolean;
  editable?: boolean;
  autoActivate?: boolean;
  trigger?: "click" | "hover";
  hoverDelay?: number;
  preview?: boolean;
  activation?: "auto" | "manual";
  lazy?: boolean;
  preload?: boolean | readonly HysTabValue[];
  destroyOnHide?: boolean;
  cacheLimit?: number;
  animated?: boolean;
  animation?: HysTabAnimation;
  animationName?: string;
  duration?: number;
  easing?: string;
  overflow?: "scroll" | "wrap" | "menu" | "clip";
  showScrollButtons?: boolean;
  scrollAlign?: "nearest" | "center";
  wheel?: "none" | "scroll" | "switch";
  dragScroll?: boolean;
  swipe?: boolean;
  draggable?: boolean;
  dragHandle?: boolean;
  longPress?: number;
  contextMenu?: boolean;
  shortcuts?: boolean;
  titleTooltip?: boolean;
  moreSearch?: boolean;
  confirmDirty?: boolean;
  historyLimit?: number;
  storageKey?: string;
  storage?: "session" | "local";
  persistScroll?: boolean;
  restoreItem?: (snapshot: HysTabSnapshot) => HysTabItem | undefined;
  createTab?: (
    items: readonly HysTabItem[],
  ) => HysTabItem | undefined | PromiseLike<HysTabItem | undefined>;
  ariaLabel?: string;
  beforeLeave?: (
    next: HysTabValue,
    current: HysTabValue,
    context: HysTabGuardContext,
  ) => boolean | void | PromiseLike<boolean | void>;
  beforeClose?: (
    value: HysTabValue,
    context: HysTabGuardContext,
  ) => boolean | void | PromiseLike<boolean | void>;
  beforeReorder?: (context: HysTabOrderContext) => boolean | void;
}
export interface HysTabsEmits {
  "update:modelValue": [value: HysTabValue];
  "update:items": [items: HysTabItem[]];
  change: [value: HysTabValue];
  selectionChange: [context: HysTabChangeContext];
  tabClick: [value: HysTabValue, event: MouseEvent];
  tabDblclick: [value: HysTabValue, event: MouseEvent];
  tabContextmenu: [
    value: HysTabValue,
    event: MouseEvent | KeyboardEvent | PointerEvent,
  ];
  tabLongpress: [value: HysTabValue, event: PointerEvent];
  previewChange: [value: HysTabValue | undefined];
  close: [value: HysTabValue];
  closeBatch: [values: HysTabValue[]];
  add: [];
  edit: [value: HysTabValue | undefined, action: "add" | "remove"];
  reorder: [context: HysTabOrderContext];
  restore: [item: HysTabItem];
  rename: [value: HysTabValue, label: string];
  pinChange: [value: HysTabValue, pinned: boolean];
  favoriteChange: [value: HysTabValue, favorite: boolean];
  loadStart: [value: HysTabValue];
  load: [value: HysTabValue, content: HysTabContent];
  loadError: [value: HysTabValue, error: unknown];
  guardError: [error: unknown];
  storageError: [error: unknown];
}
export type TabsEmit = <K extends keyof HysTabsEmits>(
  event: K,
  ...args: HysTabsEmits[K]
) => void;
export interface HysTabScope {
  item: HysTabItem;
  active: boolean;
}
export interface HysTabPanelScope extends HysTabScope {
  loading: boolean;
  error?: unknown;
  content?: HysTabContent;
  reload: () => Promise<boolean>;
}
export interface HysTabsMenuScope {
  items: readonly HysTabItem[];
  overflowed: readonly HysTabItem[];
  active: HysTabValue;
  select: (value: HysTabValue) => Promise<boolean>;
  close: () => void;
}
export interface HysTabsContextScope {
  item: HysTabItem;
  run: (action: HysTabMenuAction) => void;
  close: () => void;
}
export type HysTabMenuAction =
  HysTabCloseScope | "reload" | "pin" | "favorite" | "rename" | "restore";
export interface HysTabsSlots {
  default?: (scope: { active: HysTabValue }) => VNodeChild;
  panes?: () => VNodeChild;
  label?: (scope: HysTabScope) => VNodeChild;
  icon?: (scope: HysTabScope) => VNodeChild;
  badge?: (scope: HysTabScope) => VNodeChild;
  "status-icon"?: (scope: HysTabScope) => VNodeChild;
  panel?: (scope: HysTabPanelScope) => VNodeChild;
  loading?: (scope: HysTabPanelScope) => VNodeChild;
  error?: (scope: HysTabPanelScope) => VNodeChild;
  empty?: (scope: HysTabPanelScope) => VNodeChild;
  preview?: (scope: HysTabScope) => VNodeChild;
  prefix?: () => VNodeChild;
  suffix?: () => VNodeChild;
  "close-icon"?: (scope: HysTabScope) => VNodeChild;
  "add-icon"?: () => VNodeChild;
  "more-icon"?: () => VNodeChild;
  more?: (scope: HysTabsMenuScope) => VNodeChild;
  contextmenu?: (scope: HysTabsContextScope) => VNodeChild;
}
export type HysTabPaneProps = HysTabItem;
export interface HysTabPaneSlots {
  default?: (scope: HysTabPanelScope) => VNodeChild;
  label?: (scope: HysTabScope) => VNodeChild;
  icon?: (scope: HysTabScope) => VNodeChild;
  badge?: (scope: HysTabScope) => VNodeChild;
}
export interface HysTabsInstance {
  readonly active: HysTabValue;
  readonly recent: readonly HysTabValue[];
  readonly closed: readonly HysTabSnapshot[];
  select: (value: HysTabValue) => Promise<boolean>;
  focus: (value?: HysTabValue) => void;
  scrollToActiveTab: () => void;
  add: (item?: HysTabItem) => Promise<boolean>;
  close: (value?: HysTabValue) => Promise<boolean>;
  closeMany: (
    scope: HysTabCloseScope | readonly HysTabValue[],
    anchor?: HysTabValue,
  ) => Promise<HysTabValue[]>;
  rename: (value: HysTabValue, label: string) => Promise<boolean>;
  move: (
    value: HysTabValue,
    target: HysTabValue,
    after?: boolean,
  ) => Promise<boolean>;
  pin: (value: HysTabValue, pinned?: boolean) => Promise<boolean>;
  favorite: (value: HysTabValue, favorite?: boolean) => Promise<boolean>;
  restore: () => Promise<boolean>;
  preload: (value: HysTabValue) => Promise<boolean>;
  reload: (value?: HysTabValue) => Promise<boolean>;
  save: () => boolean;
}
export interface HysTabsConfig {
  defaults?: MaybeRefOrGetter<Partial<HysTabsProps>>;
}
