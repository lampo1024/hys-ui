import type { HysPopupTransition } from "../motion/popup";
import type { Component, CSSProperties, VNodeChild } from "vue";
import type { Placement } from "./useFloating";
export type HysDateScalar = string | Date | number;
export type HysDatePickerValue =
  HysDateScalar | readonly (HysDateScalar | null)[] | null;
export type HysDateRangeValue =
  readonly [HysDateScalar | null, HysDateScalar | null] | null;
export type HysDatePickerType =
  | "date"
  | "dates"
  | "week"
  | "weeks"
  | "month"
  | "months"
  | "quarter"
  | "quarters"
  | "year"
  | "years"
  | "datetime"
  | "daterange"
  | "weekrange"
  | "monthrange"
  | "quarterrange"
  | "yearrange"
  | "datetimerange";
export type HysDatePickerView =
  "date" | "month" | "quarter" | "year" | "decade" | "time";
export type HysDatePickerUnit = "date" | "week" | "month" | "quarter" | "year";
export type HysDateDisplayFormat = string | ((date: Date) => string);
export type HysDatePanelValues = readonly [HysDateScalar, HysDateScalar];
export type HysDateDefaultTime = string | Date;
export interface HysDateTimeOptions {
  defaultValue?:
    HysDateDefaultTime | readonly [HysDateDefaultTime, HysDateDefaultTime];
  format?: string;
  use12Hours?: boolean;
  hourStep?: number;
  minuteStep?: number;
  secondStep?: number;
  hideDisabledOptions?: boolean;
}
export interface HysDatePopupOptions {
  strategy?: "fixed" | "absolute";
  offset?: number;
  padding?: number;
  flip?: boolean;
}
export interface HysDatePoint {
  day: number;
  second: number;
}
export interface HysDatePickerContext {
  range: "start" | "end";
  from: Date | null;
  iso: string;
}
export interface HysDateDisabledTime {
  hours?: readonly number[];
  minutes?: (hour: number) => readonly number[];
  seconds?: (hour: number, minute: number) => readonly number[];
  disabledHours?: () => readonly number[];
  disabledMinutes?: (hour: number) => readonly number[];
  disabledSeconds?: (hour: number, minute: number) => readonly number[];
}
export interface HysDateShortcut {
  label: string;
  value: HysDatePickerValue | (() => HysDatePickerValue);
  disabled?: boolean;
}
export interface HysDatePickerCell {
  date: Date;
  iso: string;
  value: number;
  end: number;
  text: string;
  type: HysDatePickerView;
  outside: boolean;
  disabled: boolean;
  selected: boolean;
  inRange: boolean;
  today: boolean;
  week: number;
  weekYear: number;
  weekStart: string;
  weekEnd: string;
  range?: "start" | "end";
  rangeStart?: boolean;
  rangeEnd?: boolean;
  row?: number;
  column?: number;
}
export interface HysDatePickerWeek {
  year: number;
  week: number;
  start: string;
  end: string;
  dates: readonly string[];
}
export interface HysDatePickerChange {
  source: "date" | "time" | "input" | "shortcut" | "clear" | "confirm" | "api";
  dates: readonly (Date | null)[];
  formatted: readonly string[];
  weeks?: readonly (HysDatePickerWeek | null)[];
}
export interface HysDateCalendarChange {
  range: "start" | "end";
  dates: readonly (Date | null)[];
  formatted: readonly string[];
}
export interface HysDatePickerLocale {
  today: string;
  now: string;
  clear: string;
  cancel: string;
  close: string;
  confirm: string;
  start: string;
  end: string;
  chooseStart: string;
  chooseEnd: string;
  invalid: string;
  week: string;
  year: string;
  month: string;
  back: string;
  prevMonth: string;
  nextMonth: string;
  prevYear: string;
  nextYear: string;
  hour: string;
  minute: string;
  second: string;
  empty: string;
  limit: string;
}
export interface HysDatePickerProps<
  V extends HysDatePickerValue = HysDatePickerValue,
> {
  popupTransition?: HysPopupTransition;
  popupTransitionDuration?: number;
  modelValue?: V;
  value?: V;
  defaultValue?: V;
  clearValue?: V;
  emptyValues?: readonly HysDatePickerValue[];
  valueOnClear?: V | (() => V);
  type?: HysDatePickerType;
  picker?: HysDatePickerUnit;
  valueType?: "string" | "date" | "timestamp";
  valueFormat?: string;
  format?: HysDateDisplayFormat | readonly HysDateDisplayFormat[];
  inputFormats?: readonly string[];
  disabled?: boolean | readonly [boolean, boolean];
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
  status?: "error" | "warning" | "success";
  bordered?: boolean;
  placeholder?: string | readonly [string, string];
  id?: string | readonly [string, string];
  label?: string;
  ariaLabel?: string;
  name?: string | readonly [string, string];
  form?: string;
  autofocus?: boolean;
  min?: HysDateScalar;
  max?: HysDateScalar;
  disabledDate?: (date: Date, context: HysDatePickerContext) => boolean;
  disabledTime?: (
    date: Date,
    context: HysDatePickerContext,
  ) => HysDateDisabledTime;
  disabledHours?: (
    range: "start" | "end",
    from: Date | null,
  ) => readonly number[];
  disabledMinutes?: (
    hour: number,
    range: "start" | "end",
    from: Date | null,
  ) => readonly number[];
  disabledSeconds?: (
    hour: number,
    minute: number,
    range: "start" | "end",
    from: Date | null,
  ) => readonly number[];
  firstDayOfWeek?: number;
  firstWeekContainsDate?: number;
  weekNumberFormatter?: (week: HysDatePickerWeek) => string;
  disabledWeek?: (week: HysDatePickerWeek) => boolean;
  weekValidation?: "any" | "full";
  locale?: string;
  messages?: Partial<HysDatePickerLocale>;
  showWeekNumbers?: boolean;
  showWeekNumber?: boolean;
  showAdjacentDays?: boolean;
  defaultPickerValue?: HysDateScalar | HysDatePanelValues;
  panelValue?: HysDateScalar;
  panelValues?: HysDatePanelValues;
  mode?: HysDatePickerView;
  defaultMode?: HysDatePickerView;
  shortcuts?: readonly HysDateShortcut[];
  presets?: readonly HysDateShortcut[];
  ranges?: Readonly<Record<string, HysDateShortcut["value"]>>;
  shortcutPlacement?: "top" | "start";
  clearable?: boolean;
  allowClear?: boolean;
  editable?: boolean;
  inputReadonly?: boolean;
  showOnFocus?: boolean;
  automaticDropdown?: boolean;
  showToday?: boolean;
  showNow?: boolean;
  showFooter?: boolean;
  showConfirm?: boolean;
  showTime?: boolean | HysDateTimeOptions;
  defaultTime?:
    HysDateDefaultTime | readonly [HysDateDefaultTime, HysDateDefaultTime];
  dateFormat?: string;
  timeFormat?: string;
  use12Hours?: boolean;
  hideDisabledOptions?: boolean;
  arrowControl?: boolean;
  hourStep?: number;
  minuteStep?: number;
  secondStep?: number;
  showSeconds?: boolean;
  rangeSeparator?: string;
  separator?: string;
  startPlaceholder?: string;
  endPlaceholder?: string;
  allowEmpty?: readonly [boolean, boolean];
  singlePanel?: boolean;
  unlinkPanels?: boolean;
  minRangeDays?: number;
  maxRangeDays?: number;
  rangeValidation?: "endpoints" | "continuous";
  maxDates?: number;
  open?: boolean;
  defaultOpen?: boolean;
  inline?: boolean;
  placement?: Placement | "topLeft" | "topRight" | "bottomLeft" | "bottomRight";
  appendTo?: string | HTMLElement | false;
  teleported?: boolean;
  getPopupContainer?: (trigger: HTMLElement) => HTMLElement;
  fallbackPlacements?: readonly Placement[];
  popperOptions?: HysDatePopupOptions;
  popupWidth?: number | string;
  popupClass?: string;
  popupClassName?: string;
  popperClass?: string;
  popupStyle?: CSSProperties;
  popperStyle?: CSSProperties | string;
  prefixIcon?: Component | string;
  clearIcon?: Component | string;
  validateEvent?: boolean;
  cellClassName?: (cell: HysDatePickerCell) => string;
}
export interface HysDateRangePickerProps<
  V extends HysDatePickerValue = HysDateRangeValue,
> extends HysDatePickerProps<V> {}
export interface HysDatePickerInstance<
  V extends HysDatePickerValue = HysDatePickerValue,
> {
  readonly element: HTMLElement | undefined;
  readonly open: boolean;
  readonly value: V;
  readonly draft: readonly (Date | null)[];
  focus: () => void;
  blur: () => void;
  show: () => Promise<boolean>;
  hide: (restoreFocus?: boolean) => void;
  handleOpen: () => Promise<boolean>;
  handleClose: () => void;
  clear: () => Promise<boolean>;
  setValue: (value: V) => Promise<boolean>;
  confirm: () => Promise<boolean>;
  cancel: () => void;
  showMonth: (value: HysDateScalar) => Promise<boolean>;
  setMode: (view: HysDatePickerView) => boolean;
}
export interface HysDatePickerSlots {
  "week-number"?: (
    week: HysDatePickerWeek & { selected: boolean; disabled: boolean },
  ) => any;
  default?: (cell: HysDatePickerCell) => any;
  cell?: (cell: HysDatePickerCell) => any;
  prefix?: () => any;
  suffix?: () => any;
  "clear-icon"?: () => any;
  "prev-month"?: () => any;
  "next-month"?: () => any;
  "prev-year"?: () => any;
  "next-year"?: () => any;
  "extra-footer"?: (context: {
    dates: readonly (Date | null)[];
    view: HysDatePickerView;
  }) => any;
  "date-render"?: (cell: HysDatePickerCell) => any;
  "month-cell-render"?: (cell: HysDatePickerCell) => any;
  header?: (context: {
    dates: readonly (Date | null)[];
    view: HysDatePickerView;
  }) => any;
  footer?: (context: {
    dates: readonly (Date | null)[];
    confirm: () => Promise<boolean>;
    cancel: () => void;
    clear: () => Promise<boolean>;
  }) => any;
  shortcut?: (context: { shortcut: HysDateShortcut; index: number }) => any;
  "range-separator"?: () => any;
}
export type HysDateRangePickerInstance<
  V extends HysDatePickerValue = HysDateRangeValue,
> = HysDatePickerInstance<V>;
