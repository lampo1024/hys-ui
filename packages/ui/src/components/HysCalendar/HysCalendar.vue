<script setup lang="ts" generic="T extends HysCalendarValue = string">
import { computed, nextTick, onDeactivated, ref, useId, watch } from "vue";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  LoaderCircle,
  X,
} from "lucide-vue-next";
import HysButton from "../HysButton/HysButton.vue";
import HysSelect from "../HysSelect/HysSelect.vue";
import HysSegmented from "../HysSegmented/HysSegmented.vue";
import { useHysRootAttrs } from "../../config";
import { useMotion } from "../../motion/useMotion";
import { useFloating } from "../../composables/useFloating";
import {
  calendarDay,
  calendarParts,
  calendarISO,
  calendarDate,
  calendarFormat,
  calendarShift,
  calendarWeeks,
  calendarWeek,
  calendarEvents,
  civilDay,
  type HysCalendarValue,
  type HysCalendarMode,
  type HysCalendarTransition,
  type HysCalendarAction,
  type HysCalendarSelectInfo,
  type HysCalendarCell,
  type HysCalendarMonthCell,
  type CalendarEvent,
} from "../../composables/calendar";
const props = withDefaults(
  defineProps<{
    modelValue?: T;
    defaultValue?: T;
    valueType?: "string" | "date";
    valueFormat?: string;
    mode?: HysCalendarMode;
    defaultMode?: HysCalendarMode;
    fullscreen?: boolean;
    transition?: HysCalendarTransition;
    transitionDuration?: number;
    controllerType?: "button" | "select";
    formatter?: (value: number, type: "year" | "month") => string;
    showModeSwitch?: boolean;
    showHeader?: boolean;
    showToday?: boolean;
    firstDayOfWeek?: number;
    locale?: string;
    range?: readonly [HysCalendarValue, HysCalendarValue];
    validRange?: readonly [HysCalendarValue, HysCalendarValue];
    disabled?: boolean;
    readonly?: boolean;
    disabledDate?: (date: string) => boolean;
    showAdjacentDays?: boolean;
    fixedWeeks?: boolean;
    showWeekNumbers?: boolean;
    keyboard?: boolean;
    loading?: boolean;
    events?: readonly CalendarEvent[];
    maxEvents?: number;
    ariaLabel?: string;
  }>(),
  {
    defaultMode: "month",
    fullscreen: true,
    transition: "slide",
    transitionDuration: 180,
    controllerType: "button",
    showModeSwitch: true,
    showHeader: true,
    showToday: true,
    firstDayOfWeek: 1,
    locale: "zh-CN",
    showAdjacentDays: true,
    fixedWeeks: false,
    showWeekNumbers: false,
    keyboard: true,
    maxEvents: 3,
    valueFormat: "YYYY-MM-DD",
  },
);
const emit = defineEmits<{
  "update:modelValue": [date: T];
  "update:mode": [mode: HysCalendarMode];
  change: [date: T];
  select: [date: T, info: HysCalendarSelectInfo];
  panelChange: [date: T, mode: HysCalendarMode];
  event: [id: string, event: CalendarEvent, date: string];
  more: [date: string, events: CalendarEvent[]];
}>();
const attrs = useHysRootAttrs(),
  element = ref<HTMLElement>(),
  id = useId();
const today = calendarDay(new Date())!,
  MIN = civilDay(1, 0, 1),
  MAX = civilDay(9999, 11, 31);
const parse = (value: HysCalendarValue | undefined) =>
  calendarDay(value, props.valueFormat);
const serial = (value: string) => {
  const [y, m, d] = value.split("-").map(Number);
  return civilDay(y, m - 1, d);
};
const initial = parse(props.modelValue ?? props.defaultValue) ?? today;
const ownValue = ref(initial),
  panelDay = ref(initial),
  focusDay = ref(initial),
  ownMode = ref(props.defaultMode);
const selected = computed(() =>
  props.modelValue === undefined ? ownValue.value : parse(props.modelValue),
);
const currentMode = computed(() =>
  props.range ? "month" : (props.mode ?? ownMode.value),
);
const parts = computed(() => calendarParts(panelDay.value));
const first = computed(() =>
  Number.isInteger(props.firstDayOfWeek)
    ? ((props.firstDayOfWeek % 7) + 7) % 7
    : 1,
);
const busy = computed(() => props.disabled || props.loading);
const chinese = computed(() => props.locale.toLowerCase().startsWith("zh"));
const words = computed(() =>
  chinese.value
    ? {
        today: "今天",
        month: "月",
        year: "年",
        previous: "上一",
        next: "下一",
        more: "更多日程",
        close: "关闭",
        loading: "加载中",
        week: "周",
        label: "日历",
      }
    : {
        today: "Today",
        month: "Month",
        year: "Year",
        previous: "Previous ",
        next: "Next ",
        more: "More events",
        close: "Close",
        loading: "Loading",
        week: "Wk",
        label: "Calendar",
      },
);
function intl(options: Intl.DateTimeFormatOptions) {
  try {
    return new Intl.DateTimeFormat(props.locale, {
      ...options,
      timeZone: "UTC",
    });
  } catch {
    return new Intl.DateTimeFormat("zh-CN", { ...options, timeZone: "UTC" });
  }
}
const monthFormatter = computed(() => intl({ month: "long" })),
  dayFormatter = computed(() =>
    intl({ year: "numeric", month: "long", day: "numeric", weekday: "long" }),
  );
const weekdays = computed(() => {
  const f = intl({ weekday: "short" });
  return Array.from({ length: 7 }, (_, i) =>
    f.format(
      new Date((civilDay(2024, 0, 7) + ((first.value + i) % 7)) * 86400000),
    ),
  );
});
function output(day: number): T {
  return (
    props.valueType === "date" ||
    (props.valueType === undefined &&
      (props.modelValue instanceof Date || props.defaultValue instanceof Date))
      ? calendarDate(day)
      : calendarFormat(day, props.valueFormat)
  ) as T;
}
const selectionBounds = computed(() => {
  if (!props.validRange) return [MIN, MAX] as const;
  const a = parse(props.validRange[0]),
    b = parse(props.validRange[1]);
  return a !== undefined && b !== undefined && a <= b
    ? ([a, b] as const)
    : ([1, 0] as const);
});
const displayRange = computed(() => {
  if (!props.range) return;
  const a = parse(props.range[0]),
    b = parse(props.range[1]);
  if (a === undefined || b === undefined || a > b) return;
  const pa = calendarParts(a),
    pb = calendarParts(b);
  if ((pb.year - pa.year) * 12 + pb.month - pa.month > 1) return;
  return [a, b] as const;
});
const visibleDays = computed<[number, number]>(() => {
  const p = parts.value;
  if (currentMode.value === "year")
    return [civilDay(p.year, 0, 1), civilDay(p.year, 11, 31)];
  const [a, b] = displayRange.value ?? [
    civilDay(p.year, p.month, 1),
    civilDay(p.year, p.month + 1, 0),
  ];
  const [start, end] = calendarWeeks(a, b, first.value);
  return [start, props.fixedWeeks && !displayRange.value ? start + 41 : end];
});
const visibleRange = computed<readonly [string, string]>(() => [
  calendarISO(visibleDays.value[0]),
  calendarISO(visibleDays.value[1]),
]);
const { effectiveMotion } = useMotion();
const direction = ref("next");
const panelRank = computed(
  () =>
    parts.value.year * 12 +
    (currentMode.value === "year" ? 0 : parts.value.month),
);
const panelKey = computed(() =>
  displayRange.value
    ? "range:" + visibleRange.value.join(":")
    : currentMode.value + ":" + panelRank.value,
);
watch(
  panelRank,
  (next, previous) => (direction.value = next >= previous ? "next" : "prev"),
  { flush: "sync" },
);
const animationDuration = computed(() =>
  Math.max(
    0,
    Math.min(
      800,
      Number.isFinite(props.transitionDuration)
        ? props.transitionDuration
        : 180,
    ),
  ),
);
const animate = computed(
  () =>
    props.transition !== "none" &&
    animationDuration.value > 0 &&
    effectiveMotion.value !== "off",
);
const transitionName = computed(
  () =>
    "hys-ui-calendar-" +
    props.transition +
    (["slide", "slide-up"].includes(props.transition)
      ? "-" + direction.value
      : ""),
);
function leaving(element: Element) {
  element.setAttribute("aria-hidden", "true");
  (element as HTMLElement).inert = true;
}
const indexed = computed(() =>
  calendarEvents(props.events ?? [], ...visibleDays.value),
);
function unavailable(day: number) {
  const [a, b] = selectionBounds.value;
  return (
    day < MIN ||
    day > MAX ||
    day < a ||
    day > b ||
    !!props.disabledDate?.(calendarISO(day)) ||
    (!!displayRange.value &&
      (day < displayRange.value[0] || day > displayRange.value[1]))
  );
}
function cell(day: number): HysCalendarCell {
  const p = calendarParts(day),
    month = p.year * 12 + p.month,
    base = parts.value.year * 12 + parts.value.month;
  return {
    day: calendarISO(day),
    date: calendarDate(day),
    type:
      month < base
        ? "prev-month"
        : month > base
          ? "next-month"
          : "current-month",
    isSelected: selected.value === day,
    isToday: today === day,
    disabled: !!busy.value || unavailable(day),
    events: indexed.value.dates.get(day) ?? [],
  };
}
const cells = computed(() =>
  Array.from(
    { length: visibleDays.value[1] - visibleDays.value[0] + 1 },
    (_, i) => cell(visibleDays.value[0] + i),
  ),
);
const weeks = computed(() =>
  Array.from({ length: cells.value.length / 7 }, (_, i) => ({
    number: calendarWeek(visibleDays.value[0] + i * 7),
    days: cells.value.slice(i * 7, i * 7 + 7),
  })),
);
function monthUnavailable(month: number) {
  const start = civilDay(parts.value.year, month, 1),
    end = civilDay(parts.value.year, month + 1, 0);
  for (let d = start; d <= end; d++) if (!unavailable(d)) return false;
  return true;
}
const months = computed<HysCalendarMonthCell[]>(() =>
  Array.from({ length: 12 }, (_, month) => {
    const day = civilDay(parts.value.year, month, 1),
      s =
        selected.value === undefined
          ? undefined
          : calendarParts(selected.value);
    return {
      month: month + 1,
      date: calendarDate(day),
      day: calendarISO(day),
      isSelected: s?.year === parts.value.year && s.month === month,
      isToday:
        calendarParts(today).year === parts.value.year &&
        calendarParts(today).month === month,
      disabled: !!busy.value || monthUnavailable(month),
      events: indexed.value.months.get(parts.value.year * 12 + month) ?? [],
    };
  }),
);
const label = computed(() =>
  displayRange.value
    ? `${calendarISO(displayRange.value[0])} — ${calendarISO(displayRange.value[1])}`
    : currentMode.value === "year"
      ? `${parts.value.year}${chinese.value ? "年" : ""}`
      : chinese.value
        ? `${parts.value.year}年${parts.value.month + 1}月`
        : intl({ year: "numeric", month: "long" }).format(
            new Date(panelDay.value * 86400000),
          ),
);
const yearOptions = computed(() => {
  const center = parts.value.year,
    start = Math.max(1, center - 100),
    end = Math.min(9999, center + 100);
  return Array.from({ length: end - start + 1 }, (_, i) => ({
    label:
      props.formatter?.(start + i, "year") ??
      `${start + i}${chinese.value ? "年" : ""}`,
    value: start + i,
  }));
});
const monthOptions = computed(() =>
  Array.from({ length: 12 }, (_, i) => ({
    label:
      props.formatter?.(i + 1, "month") ??
      monthFormatter.value.format(new Date(civilDay(2024, i, 1) * 86400000)),
    value: i,
  })),
);
const tabDay = computed(() => {
  const usable = cells.value.filter(
    (c) =>
      !c.disabled &&
      (props.showAdjacentDays ||
        c.type === "current-month" ||
        displayRange.value),
  );
  return (
    usable.find((c) => parse(c.day) === focusDay.value)?.day ??
    usable.find((c) => c.isSelected)?.day ??
    usable.find((c) => c.type === "current-month")?.day ??
    usable[0]?.day
  );
});
const tabMonth = computed(() => {
  const m = calendarParts(focusDay.value).month + 1;
  return (
    months.value.find((c) => c.month === m && !c.disabled)?.month ??
    months.value.find((c) => c.isSelected && !c.disabled)?.month ??
    months.value.find((c) => !c.disabled)?.month
  );
});
const maxEvents = computed(() =>
  Math.min(
    100,
    Math.max(
      0,
      Math.floor(Number.isFinite(props.maxEvents) ? props.maxEvents : 3),
    ),
  ),
);
const anchor = ref<HTMLElement>(),
  popup = ref<HTMLElement>(),
  moreCell = ref<HysCalendarCell>();
const { open, style, show, close } = useFloating(anchor, popup, {
  placement: "bottom-start",
  width: () => 320,
  closeOnTab: true,
});
function closeMore() {
  close();
  moreCell.value = undefined;
}
watch([() => props.modelValue, () => props.valueFormat], () => {
  const day = parse(props.modelValue);
  if (day !== undefined) {
    panelDay.value = day;
    focusDay.value = day;
  }
  closeMore();
});
watch(
  [
    () => props.mode,
    () => props.range,
    () => props.validRange,
    busy,
    () => props.readonly,
  ],
  closeMore,
);
watch(
  () => props.events,
  () => {
    if (moreCell.value) moreCell.value = cell(serial(moreCell.value.day));
  },
  { deep: true },
);
onDeactivated(closeMore);
function panelAllowed(day: number, mode = currentMode.value) {
  const p = calendarParts(day),
    a = civilDay(p.year, mode === "year" ? 0 : p.month, 1),
    b = civilDay(p.year, mode === "year" ? 12 : p.month + 1, 0),
    [min, max] = selectionBounds.value;
  return day >= MIN && day <= MAX && b >= min && a <= max;
}
// Keep an out-of-range host value intact, while leaving a usable panel to browse.
watch(
  [selectionBounds, () => props.modelValue],
  () => {
    const [min, max] = selectionBounds.value;
    if (min <= max && !panelAllowed(panelDay.value)) {
      panelDay.value = Math.max(min, Math.min(max, panelDay.value));
      focusDay.value = panelDay.value;
      closeMore();
    }
  },
  { immediate: true },
);
function changePanel(day: number) {
  if (busy.value || displayRange.value || !panelAllowed(day)) return false;
  const before = calendarParts(panelDay.value),
    after = calendarParts(day);
  panelDay.value = day;
  focusDay.value = day;
  closeMore();
  if (before.year !== after.year || before.month !== after.month)
    emit("panelChange", output(day), currentMode.value);
  return true;
}
function showMonth(value: HysCalendarValue) {
  const day = parse(value);
  return day === undefined ? false : changePanel(day);
}
function navigateDay(action: HysCalendarAction) {
  return action === "today"
    ? today
    : calendarShift(
        panelDay.value,
        action === "prev-month"
          ? -1
          : action === "next-month"
            ? 1
            : action === "prev-year"
              ? -12
              : 12,
      );
}
function selectDate(action: HysCalendarAction) {
  return changePanel(navigateDay(action));
}
function setMode(mode: HysCalendarMode) {
  if (busy.value || displayRange.value || !["month", "year"].includes(mode))
    return false;
  if (mode === currentMode.value) return true;
  if (props.mode === undefined) ownMode.value = mode;
  emit("update:mode", mode);
  emit("panelChange", output(panelDay.value), mode);
  closeMore();
  return true;
}
async function select(
  day: number,
  source: HysCalendarSelectInfo["source"] = "date",
) {
  if (busy.value || props.readonly || unavailable(day)) return false;
  const value = output(day),
    previous = selected.value;
  if (props.modelValue === undefined) ownValue.value = day;
  emit("update:modelValue", value);
  emit("select", output(day), { source });
  if (previous !== day) emit("change", output(day));
  if (!props.range) changePanel(day);
  focusDay.value = day;
  await nextTick();
  return selected.value === day;
}
function pickDay(value: HysCalendarValue) {
  const day = parse(value);
  return day === undefined ? Promise.resolve(false) : select(day, "customize");
}
function selectMonth(data: HysCalendarMonthCell) {
  if (busy.value || data.disabled) return;
  const start = serial(data.day),
    end = civilDay(parts.value.year, data.month, 0),
    current = selected.value ?? start,
    p = calendarParts(current);
  let day = Math.max(
    start,
    Math.min(
      end,
      calendarShift(
        current,
        (parts.value.year - p.year) * 12 + data.month - 1 - p.month,
      ),
    ),
  );
  if (unavailable(day)) {
    day = start;
    while (day <= end && unavailable(day)) day++;
  }
  void select(day, "month");
}
function eventClick(event: CalendarEvent, day: string) {
  if (!busy.value && !event.disabled) emit("event", event.id, event, day);
}
async function more(data: HysCalendarCell, event: MouseEvent) {
  if (busy.value) return;
  anchor.value = event.currentTarget as HTMLElement;
  moreCell.value = data;
  emit("more", data.day, data.events);
  show();
  await nextTick();
  popup.value?.querySelector<HTMLButtonElement>("button")?.focus();
}
function cellClick(day: number, event: MouseEvent) {
  if (
    (event.target as Element).closest(
      'button,a,input,select,textarea,[contenteditable="true"],[role="button"]',
    )
  )
    return;
  void select(day);
}
async function focus() {
  await nextTick();
  Array.from(
    element.value?.querySelectorAll<HTMLElement>(".hys-ui-calendar-page") ?? [],
  )
    .find((page) => page.dataset.calendarPanel === panelKey.value)
    ?.querySelector<HTMLElement>('[role="gridcell"][tabindex="0"]')
    ?.focus();
}
async function keydown(event: KeyboardEvent, day: number, year = false) {
  if (
    !props.keyboard ||
    busy.value ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    (event.target !== event.currentTarget &&
      !(event.target as Element).classList.contains("hys-ui-calendar-day"))
  )
    return;
  let target: number | undefined;
  const direction =
    getComputedStyle(element.value!).direction === "rtl" ? -1 : 1;
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    if (year) selectMonth(months.value[calendarParts(day).month]);
    else await select(day, "keyboard");
    return;
  }
  if (event.key === "ArrowLeft")
    target = year ? calendarShift(day, -direction) : day - direction;
  if (event.key === "ArrowRight")
    target = year ? calendarShift(day, direction) : day + direction;
  if (event.key === "ArrowUp") target = year ? calendarShift(day, -3) : day - 7;
  if (event.key === "ArrowDown")
    target = year ? calendarShift(day, 3) : day + 7;
  if (event.key === "Home")
    target = year
      ? civilDay(parts.value.year, 0, 1)
      : day - ((calendarParts(day).weekday - first.value + 7) % 7);
  if (event.key === "End")
    target = year
      ? civilDay(parts.value.year, 11, 1)
      : day + ((first.value + 6 - calendarParts(day).weekday + 7) % 7);
  if (event.key === "PageUp" || event.key === "PageDown")
    target = calendarShift(
      day,
      (event.key === "PageUp" ? -1 : 1) * (event.shiftKey || year ? 12 : 1),
    );
  if (target === undefined) return;
  event.preventDefault();
  if (
    target < MIN ||
    target > MAX ||
    (props.range &&
      (target < visibleDays.value[0] || target > visibleDays.value[1]))
  )
    return;
  const sign =
    event.key === "Home"
      ? 1
      : event.key === "End"
        ? -1
        : target >= day
          ? 1
          : -1;
  for (let attempts = 0; attempts < (year ? 12 : 366); attempts++) {
    const p = calendarParts(target);
    if (
      year
        ? !Array.from(
            { length: calendarParts(civilDay(p.year, p.month + 1, 0)).day },
            (_, i) => target! - p.day + 1 + i,
          ).every(unavailable)
        : !unavailable(target)
    )
      break;
    target = year ? calendarShift(target, sign) : target + sign;
    if (
      target < MIN ||
      target > MAX ||
      (props.range &&
        (target < visibleDays.value[0] || target > visibleDays.value[1]))
    )
      return;
    if (attempts === (year ? 11 : 365)) return;
  }
  if (!props.range && !changePanel(target)) return;
  focusDay.value = target;
  await focus();
}
defineExpose({
  element,
  selectedDay: computed(() =>
    selected.value === undefined ? undefined : output(selected.value),
  ),
  panelValue: computed(() => output(panelDay.value)),
  currentMode,
  visibleRange,
  pickDay,
  selectDate,
  showMonth,
  setMode,
  focus,
});
</script>

<template>
  <section
    ref="element"
    v-bind="attrs"
    class="hys-ui-calendar"
    :class="{
      'hys-ui-calendar--card': !fullscreen,
      'hys-ui-calendar--disabled': disabled,
    }"
    :aria-busy="loading || undefined"
    :aria-label="ariaLabel || words.label"
  >
    <header v-if="showHeader" class="hys-ui-calendar-header">
      <slot
        name="header"
        :date="label"
        :value="output(panelDay)"
        :mode="currentMode"
        :select-date="selectDate"
        :show-month="showMonth"
        :set-mode="setMode"
      >
        <strong class="hys-ui-calendar-title" aria-live="polite">{{
          label
        }}</strong>
        <div v-if="!displayRange" class="hys-ui-calendar-controls">
          <template v-if="controllerType === 'select'">
            <HysSelect
              :model-value="parts.year"
              :options="yearOptions"
              filterable
              size="sm"
              :disabled="busy"
              :aria-label="words.year"
              class="hys-ui-calendar-year-select"
              @update:model-value="
                changePanel(civilDay(Number($event), parts.month, 1))
              "
            />
            <HysSelect
              v-if="currentMode === 'month'"
              :model-value="parts.month"
              :options="monthOptions"
              size="sm"
              :disabled="busy"
              :aria-label="words.month"
              class="hys-ui-calendar-month-select"
              @update:model-value="
                changePanel(civilDay(parts.year, Number($event), 1))
              "
            />
          </template>
          <div class="hys-ui-calendar-navigation">
            <HysButton
              v-if="controllerType === 'button' && currentMode === 'month'"
              size="sm"
              variant="ghost"
              :disabled="busy || !panelAllowed(navigateDay('prev-year'))"
              :aria-label="words.previous + words.year"
              @click="selectDate('prev-year')"
              ><ChevronsLeft :size="16"
            /></HysButton>
            <HysButton
              size="sm"
              variant="ghost"
              :disabled="
                busy ||
                !panelAllowed(
                  navigateDay(
                    currentMode === 'year' ? 'prev-year' : 'prev-month',
                  ),
                )
              "
              :aria-label="
                words.previous +
                (currentMode === 'year' ? words.year : words.month)
              "
              @click="
                selectDate(currentMode === 'year' ? 'prev-year' : 'prev-month')
              "
              ><ChevronLeft :size="16"
            /></HysButton>
            <HysButton
              v-if="showToday"
              size="sm"
              variant="secondary"
              :disabled="busy || !panelAllowed(today)"
              @click="selectDate('today')"
              >{{ words.today }}</HysButton
            >
            <HysButton
              size="sm"
              variant="ghost"
              :disabled="
                busy ||
                !panelAllowed(
                  navigateDay(
                    currentMode === 'year' ? 'next-year' : 'next-month',
                  ),
                )
              "
              :aria-label="
                words.next + (currentMode === 'year' ? words.year : words.month)
              "
              @click="
                selectDate(currentMode === 'year' ? 'next-year' : 'next-month')
              "
              ><ChevronRight :size="16"
            /></HysButton>
            <HysButton
              v-if="controllerType === 'button' && currentMode === 'month'"
              size="sm"
              variant="ghost"
              :disabled="busy || !panelAllowed(navigateDay('next-year'))"
              :aria-label="words.next + words.year"
              @click="selectDate('next-year')"
              ><ChevronsRight :size="16"
            /></HysButton>
          </div>
          <HysSegmented
            v-if="showModeSwitch"
            :model-value="currentMode"
            :options="[
              { label: words.month, value: 'month' },
              { label: words.year, value: 'year' },
            ]"
            size="sm"
            :disabled="busy"
            :aria-label="chinese ? '日历视图' : 'Calendar view'"
            @update:model-value="setMode($event as HysCalendarMode)"
          />
        </div>
      </slot>
    </header>
    <div
      class="hys-ui-calendar-body"
      :style="{ '--hys-ui-calendar-duration': animationDuration + 'ms' }"
    >
      <div v-if="loading" class="hys-ui-calendar-loading" role="status">
        <slot name="loading"
          ><LoaderCircle :size="22" class="hys-ui-calendar-spinner" />{{
            words.loading
          }}</slot
        >
      </div>
      <Transition :name="transitionName" :css="animate" @before-leave="leaving">
        <div
          :key="panelKey"
          class="hys-ui-calendar-page"
          :data-calendar-panel="panelKey"
        >
          <div
            v-if="currentMode === 'month'"
            role="grid"
            :aria-label="label"
            :aria-readonly="readonly || undefined"
            class="hys-ui-calendar-grid"
          >
            <div
              role="row"
              class="hys-ui-calendar-weekdays"
              :class="{ 'hys-ui-calendar--weeks': showWeekNumbers }"
            >
              <span v-if="showWeekNumbers" role="columnheader">{{
                words.week
              }}</span
              ><span v-for="w in weekdays" :key="w" role="columnheader">{{
                w
              }}</span>
            </div>
            <div
              v-for="(week, index) in weeks"
              :key="index"
              role="row"
              class="hys-ui-calendar-week"
              :class="{ 'hys-ui-calendar--weeks': showWeekNumbers }"
            >
              <span
                v-if="showWeekNumbers"
                role="rowheader"
                class="hys-ui-calendar-week-number"
                >{{ week.number }}</span
              >
              <div
                v-for="data in week.days"
                :key="data.day"
                role="gridcell"
                :data-date="data.day"
                :aria-selected="data.isSelected"
                :aria-current="data.isToday ? 'date' : undefined"
                :aria-disabled="data.disabled || undefined"
                :aria-label="
                  dayFormatter.format(new Date(serial(data.day) * 86400000))
                "
                :tabindex="data.day === tabDay ? 0 : -1"
                class="hys-ui-calendar-cell"
                :class="{
                  'hys-ui-calendar-cell--outside':
                    data.type !== 'current-month' && !displayRange,
                  'hys-ui-calendar-cell--selected': data.isSelected,
                  'hys-ui-calendar-cell--today': data.isToday,
                  'hys-ui-calendar-cell--disabled': data.disabled,
                  'hys-ui-calendar-cell--hidden':
                    !showAdjacentDays &&
                    data.type !== 'current-month' &&
                    !displayRange,
                }"
                @focus="focusDay = serial(data.day)"
                @keydown="keydown($event, serial(data.day))"
                @click="cellClick(serial(data.day), $event)"
              >
                <slot name="date-full-cell" :date="data.date" :data="data">
                  <div class="hys-ui-calendar-day-heading">
                    <button
                      type="button"
                      tabindex="-1"
                      :disabled="data.disabled"
                      :aria-pressed="data.isSelected"
                      :aria-readonly="readonly || undefined"
                      class="hys-ui-calendar-day"
                      @click.stop="select(serial(data.day))"
                    >
                      <slot
                        name="date"
                        :date="data.day"
                        :day="calendarParts(serial(data.day)).day"
                        >{{
                          displayRange
                            ? data.day.slice(5).replace("-", "/")
                            : calendarParts(serial(data.day)).day
                        }}</slot
                      >
                    </button>
                  </div>
                  <slot name="date-cell" :date="data.date" :data="data" />
                  <div v-if="data.events.length" class="hys-ui-calendar-events">
                    <button
                      v-for="(event, i) in data.events.slice(0, maxEvents)"
                      :key="event.id + ':' + i"
                      type="button"
                      :tabindex="data.day === tabDay ? 0 : -1"
                      class="hys-ui-calendar-event"
                      :disabled="busy || event.disabled"
                      :title="
                        [event.time, event.title, event.description]
                          .filter(Boolean)
                          .join(' · ')
                      "
                      @click.stop="eventClick(event, data.day)"
                    >
                      <slot name="event" :event="event" :date="data.day"
                        ><span
                          class="hys-ui-calendar-dot"
                          :style="{ background: event.color }"
                        /><time v-if="event.time">{{ event.time }}</time
                        ><span>{{ event.title }}</span></slot
                      >
                    </button>
                    <button
                      v-if="data.events.length > maxEvents"
                      type="button"
                      :tabindex="data.day === tabDay ? 0 : -1"
                      :disabled="busy"
                      class="hys-ui-calendar-more"
                      :aria-expanded="open && moreCell?.day === data.day"
                      @click.stop="more(data, $event)"
                    >
                      <slot
                        name="more"
                        :date="data.day"
                        :count="data.events.length - maxEvents"
                        >+{{ data.events.length - maxEvents }}
                        {{ words.more }}</slot
                      >
                    </button>
                  </div>
                </slot>
              </div>
            </div>
          </div>
          <div
            v-else
            role="grid"
            :aria-label="label"
            :aria-readonly="readonly || undefined"
            class="hys-ui-calendar-year-grid"
          >
            <div
              v-for="row in 4"
              :key="row"
              role="row"
              class="hys-ui-calendar-month-row"
            >
              <div
                v-for="data in months.slice((row - 1) * 3, row * 3)"
                :key="data.month"
                role="gridcell"
                :data-month="data.month"
                :aria-selected="data.isSelected"
                :aria-disabled="data.disabled || undefined"
                :tabindex="data.month === tabMonth ? 0 : -1"
                class="hys-ui-calendar-cell hys-ui-calendar-month"
                :class="{
                  'hys-ui-calendar-cell--selected': data.isSelected,
                  'hys-ui-calendar-cell--today': data.isToday,
                  'hys-ui-calendar-cell--disabled': data.disabled,
                }"
                @focus="focusDay = serial(data.day)"
                @keydown="keydown($event, serial(data.day), true)"
                @click="
                  !($event.target as Element).closest(
                    'button,a,input,[contenteditable]',
                  ) && selectMonth(data)
                "
              >
                <slot name="month-full-cell" :date="data.date" :data="data"
                  ><button
                    type="button"
                    tabindex="-1"
                    :disabled="data.disabled"
                    class="hys-ui-calendar-day"
                    :aria-pressed="data.isSelected"
                    @click.stop="selectMonth(data)"
                  >
                    {{
                      monthFormatter.format(
                        new Date(serial(data.day) * 86400000),
                      )
                    }}</button
                  ><slot name="month-cell" :date="data.date" :data="data"
                    ><span
                      v-if="data.events.length"
                      class="hys-ui-calendar-month-count"
                      >{{ data.events.length }}
                      {{ chinese ? "项日程" : "events" }}</span
                    ></slot
                  ></slot
                >
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>
    <footer v-if="$slots.footer" class="hys-ui-calendar-footer">
      <slot
        name="footer"
        :selected="selected === undefined ? undefined : output(selected)"
        :value="output(panelDay)"
        :mode="currentMode"
        :visible-range="visibleRange"
      />
    </footer>
    <Teleport to="body"
      ><div
        v-if="open && moreCell"
        :id="id + '-events'"
        ref="popup"
        v-bind="attrs"
        role="dialog"
        :aria-label="moreCell.day + ' ' + words.more"
        class="hys-ui-calendar-popup hys-ui-floating-surface"
        :style="style"
      >
        <header>
          <strong>{{ moreCell.day }}</strong
          ><HysButton
            variant="ghost"
            size="sm"
            :aria-label="words.close"
            @click="closeMore"
            ><X :size="15"
          /></HysButton>
        </header>
        <div class="hys-ui-calendar-popup-events">
          <button
            v-for="(event, i) in moreCell.events"
            :key="event.id + ':' + i"
            type="button"
            class="hys-ui-calendar-event"
            :disabled="busy || event.disabled"
            @click="eventClick(event, moreCell!.day)"
          >
            <slot name="event" :event="event" :date="moreCell.day"
              ><span
                class="hys-ui-calendar-dot"
                :style="{ background: event.color }"
              /><time v-if="event.time">{{ event.time }}</time
              ><span
                >{{ event.title
                }}<small v-if="event.description">{{
                  event.description
                }}</small></span
              ></slot
            >
          </button>
        </div>
      </div></Teleport
    >
  </section>
</template>

<style scoped>
.hys-ui-calendar {
  width: 100%;
  min-width: 0;
  border: 1px solid var(--hys-ui-border, var(--hys-ui-theme-border));
  border-radius: 16px;
  background: var(--hys-ui-surface, var(--hys-ui-theme-surface));
  color: var(--hys-ui-text, var(--hys-ui-theme-text));
  overflow: hidden;
  font-size: 14px;
}
.hys-ui-calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  padding: 18px 20px;
  border-bottom: 1px solid var(--hys-ui-border, var(--hys-ui-theme-border));
}
.hys-ui-calendar-title {
  font-size: 17px;
  font-weight: 650;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.hys-ui-calendar-controls,
.hys-ui-calendar-navigation {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.hys-ui-calendar-controls {
  gap: 10px;
}
.hys-ui-calendar-year-select {
  width: 120px;
}
.hys-ui-calendar-month-select {
  width: 108px;
}
.hys-ui-calendar-navigation :deep(.hys-ui-button) {
  padding-inline: 8px;
}
.hys-ui-calendar-body {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  overflow: hidden;
}
.hys-ui-calendar-page {
  grid-area: 1 / 1;
  min-width: 0;
}
.hys-ui-calendar-page[aria-hidden="true"] {
  pointer-events: none;
}
.hys-ui-calendar-fade-enter-active,
.hys-ui-calendar-fade-leave-active,
.hys-ui-calendar-slide-next-enter-active,
.hys-ui-calendar-slide-next-leave-active,
.hys-ui-calendar-slide-prev-enter-active,
.hys-ui-calendar-slide-prev-leave-active,
.hys-ui-calendar-slide-up-next-enter-active,
.hys-ui-calendar-slide-up-next-leave-active,
.hys-ui-calendar-slide-up-prev-enter-active,
.hys-ui-calendar-slide-up-prev-leave-active,
.hys-ui-calendar-zoom-enter-active,
.hys-ui-calendar-zoom-leave-active {
  transition:
    opacity var(--hys-ui-calendar-duration) ease,
    transform var(--hys-ui-calendar-duration) cubic-bezier(0.2, 0.8, 0.2, 1);
}
.hys-ui-calendar-fade-enter-from,
.hys-ui-calendar-fade-leave-to,
.hys-ui-calendar-slide-next-enter-from,
.hys-ui-calendar-slide-next-leave-to,
.hys-ui-calendar-slide-prev-enter-from,
.hys-ui-calendar-slide-prev-leave-to,
.hys-ui-calendar-slide-up-next-enter-from,
.hys-ui-calendar-slide-up-next-leave-to,
.hys-ui-calendar-slide-up-prev-enter-from,
.hys-ui-calendar-slide-up-prev-leave-to,
.hys-ui-calendar-zoom-enter-from,
.hys-ui-calendar-zoom-leave-to {
  opacity: 0;
}
.hys-ui-calendar-slide-next-enter-from,
.hys-ui-calendar-slide-prev-leave-to {
  transform: translateX(18px);
}
.hys-ui-calendar-slide-prev-enter-from,
.hys-ui-calendar-slide-next-leave-to {
  transform: translateX(-18px);
}
.hys-ui-calendar-slide-up-next-enter-from,
.hys-ui-calendar-slide-up-prev-leave-to {
  transform: translateY(14px);
}
.hys-ui-calendar-slide-up-prev-enter-from,
.hys-ui-calendar-slide-up-next-leave-to {
  transform: translateY(-14px);
}
.hys-ui-calendar-zoom-enter-from,
.hys-ui-calendar-zoom-leave-to {
  transform: scale(0.975);
}
.hys-ui-calendar-weekdays,
.hys-ui-calendar-week {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
}
.hys-ui-calendar--weeks {
  grid-template-columns: 32px repeat(7, minmax(0, 1fr));
}
.hys-ui-calendar-weekdays {
  background: var(--hys-ui-bg, var(--hys-ui-theme-bg));
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted));
  text-align: end;
  font-size: 12px;
}
.hys-ui-calendar-weekdays > span {
  padding: 12px;
}
.hys-ui-calendar-week + .hys-ui-calendar-week {
  border-top: 1px solid var(--hys-ui-border, var(--hys-ui-theme-border));
}
.hys-ui-calendar-cell {
  position: relative;
  min-width: 0;
  min-height: 116px;
  padding: 8px;
  cursor: pointer;
  outline: none;
  transition: background-color 0.15s;
}
.hys-ui-calendar-cell + .hys-ui-calendar-cell {
  border-inline-start: 1px solid
    var(--hys-ui-border, var(--hys-ui-theme-border));
}
.hys-ui-calendar-cell:hover {
  background: color-mix(
    in srgb,
    var(--hys-ui-primary, var(--hys-ui-theme-primary)) 4%,
    var(--hys-ui-surface, var(--hys-ui-theme-surface))
  );
}
.hys-ui-calendar-cell--selected {
  background: color-mix(
    in srgb,
    var(--hys-ui-primary, var(--hys-ui-theme-primary)) 7%,
    var(--hys-ui-surface, var(--hys-ui-theme-surface))
  );
}
.hys-ui-calendar-cell:focus-visible {
  box-shadow: inset 0 0 0 2px var(--hys-ui-primary, var(--hys-ui-theme-primary));
  z-index: 1;
}
.hys-ui-calendar-cell--outside .hys-ui-calendar-day {
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted));
  opacity: 0.65;
}
.hys-ui-calendar-cell--disabled {
  cursor: default;
  background: color-mix(
    in srgb,
    var(--hys-ui-muted, var(--hys-ui-theme-muted)) 5%,
    var(--hys-ui-surface, var(--hys-ui-theme-surface))
  );
}
.hys-ui-calendar-cell--disabled .hys-ui-calendar-day {
  opacity: 0.4;
  cursor: not-allowed;
}
.hys-ui-calendar-cell--hidden {
  visibility: hidden;
  pointer-events: none;
}
.hys-ui-calendar-day-heading {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 5px;
}
.hys-ui-calendar-day {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  min-height: 28px;
  padding: 2px 5px;
  border: 0;
  background: transparent;
  border-radius: 8px;
  font: inherit;
  color: inherit;
  cursor: inherit;
  font-variant-numeric: tabular-nums;
}
.hys-ui-calendar-cell--today .hys-ui-calendar-day {
  color: var(--hys-ui-primary, var(--hys-ui-theme-primary));
  font-weight: 700;
}
.hys-ui-calendar-cell--selected .hys-ui-calendar-day {
  color: var(--hys-ui-primary-contrast, #fff);
  background: var(--hys-ui-primary, var(--hys-ui-theme-primary));
  opacity: 1;
}
.hys-ui-calendar-events {
  display: grid;
  gap: 3px;
}
.hys-ui-calendar-event {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  min-width: 0;
  padding: 4px 5px;
  border: 0;
  border-radius: 5px;
  text-align: start;
  background: transparent;
  color: var(--hys-ui-text, var(--hys-ui-theme-text));
  font: inherit;
  font-size: 12px;
  cursor: pointer;
  line-height: 1.4;
}
.hys-ui-calendar-event:hover {
  background: color-mix(
    in srgb,
    var(--hys-ui-primary, var(--hys-ui-theme-primary)) 9%,
    transparent
  );
}
.hys-ui-calendar-event > span:last-child {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.hys-ui-calendar-event:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.hys-ui-calendar-event time {
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted));
  font-size: 11px;
  flex-shrink: 0;
}
.hys-ui-calendar-dot {
  flex: 0 0 6px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--hys-ui-primary, var(--hys-ui-theme-primary));
}
.hys-ui-calendar-more {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: start;
  border: 0;
  padding: 3px 5px;
  font: inherit;
  font-size: 11px;
  background: transparent;
  color: var(--hys-ui-primary, var(--hys-ui-theme-primary));
  cursor: pointer;
  border-radius: 5px;
}
.hys-ui-calendar-more:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.hys-ui-calendar-event:focus-visible,
.hys-ui-calendar-more:focus-visible,
.hys-ui-calendar-day:focus-visible {
  outline: 2px solid var(--hys-ui-primary, var(--hys-ui-theme-primary));
  outline-offset: 1px;
}
.hys-ui-calendar-week-number {
  padding-top: 15px;
  text-align: center;
  font-size: 11px;
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted));
  background: var(--hys-ui-bg, var(--hys-ui-theme-bg));
  border-inline-end: 1px solid var(--hys-ui-border, var(--hys-ui-theme-border));
}
.hys-ui-calendar-month-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
.hys-ui-calendar-month-row + .hys-ui-calendar-month-row {
  border-top: 1px solid var(--hys-ui-border, var(--hys-ui-theme-border));
}
.hys-ui-calendar-month {
  min-height: 100px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
}
.hys-ui-calendar-month-count {
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted));
  font-size: 12px;
}
.hys-ui-calendar--card .hys-ui-calendar-header {
  padding: 14px;
  gap: 10px;
}
.hys-ui-calendar--card .hys-ui-calendar-title {
  font-size: 15px;
}
.hys-ui-calendar--card .hys-ui-calendar-cell {
  min-height: 54px;
  padding: 4px;
}
.hys-ui-calendar--card .hys-ui-calendar-day-heading {
  justify-content: center;
  margin: 0;
}
.hys-ui-calendar--card .hys-ui-calendar-month {
  min-height: 72px;
  align-items: center;
  justify-content: center;
  gap: 4px;
}
.hys-ui-calendar--card .hys-ui-calendar-weekdays > span {
  padding: 8px 2px;
  text-align: center;
}
.hys-ui-calendar--card .hys-ui-calendar-controls {
  gap: 6px;
}
.hys-ui-calendar--card
  .hys-ui-calendar-controls:has(.hys-ui-calendar-year-select) {
  width: 100%;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;
  align-items: center;
}
.hys-ui-calendar--card .hys-ui-calendar-year-select,
.hys-ui-calendar--card .hys-ui-calendar-month-select {
  width: 100%;
  min-width: 0;
}
.hys-ui-calendar--card .hys-ui-calendar-navigation { gap: 0; }
.hys-ui-calendar--card .hys-ui-calendar-navigation :deep(.hys-ui-btn-sm) { padding-inline: 5px; }
.hys-ui-calendar--card .hys-ui-calendar-events {
  max-width: 100%;
}
.hys-ui-calendar--card .hys-ui-calendar-event time {
  display: none;
}
.hys-ui-calendar-footer {
  padding: 12px 20px;
  border-top: 1px solid var(--hys-ui-border, var(--hys-ui-theme-border));
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted));
  font-size: 13px;
}
.hys-ui-calendar-loading {
  position: absolute;
  inset: 0;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: color-mix(
    in srgb,
    var(--hys-ui-surface, var(--hys-ui-theme-surface)) 75%,
    transparent
  );
  color: var(--hys-ui-primary, var(--hys-ui-theme-primary));
}
.hys-ui-calendar-spinner {
  animation: hys-ui-calendar-spin 1s linear infinite;
}
.hys-ui-calendar--disabled {
  opacity: 0.6;
}
.hys-ui-calendar-popup {
  width: 320px;
  max-width: calc(100vw - 20px);
  padding: 12px;
  border: 1px solid var(--hys-ui-border, var(--hys-ui-theme-border));
  border-radius: 12px;
  box-shadow: 0 14px 45px #101f3f24;
  background: var(--hys-ui-surface, var(--hys-ui-theme-surface));
  color: var(--hys-ui-text, var(--hys-ui-theme-text));
}
.hys-ui-calendar-popup > header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2px 8px;
  border-bottom: 1px solid var(--hys-ui-border, var(--hys-ui-theme-border));
  font-size: 14px;
}
.hys-ui-calendar-popup-events {
  display: grid;
  gap: 4px;
  max-height: min(320px, 55vh);
  overflow: auto;
  padding-top: 8px;
}
.hys-ui-calendar-popup .hys-ui-calendar-event {
  padding: 9px 6px;
  font-size: 13px;
}
.hys-ui-calendar-popup .hys-ui-calendar-event > span:last-child {
  white-space: normal;
  overflow-wrap: anywhere;
}
.hys-ui-calendar-popup small {
  display: block;
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted));
  font-size: 11px;
  margin-top: 3px;
}
@keyframes hys-ui-calendar-spin {
  to {
    transform: rotate(360deg);
  }
}
@media (max-width: 640px) {
  .hys-ui-calendar-header {
    padding: 12px;
    gap: 10px;
  }
  .hys-ui-calendar-controls {
    width: 100%;
    gap: 6px;
    justify-content: space-between;
  }
  .hys-ui-calendar-title {
    font-size: 15px;
  }
  .hys-ui-calendar-cell {
    min-height: 84px;
    padding: 3px;
  }
  .hys-ui-calendar-weekdays > span {
    padding: 9px 4px;
  }
  .hys-ui-calendar-event {
    padding: 3px 1px;
    gap: 3px;
    font-size: 10px;
  }
  .hys-ui-calendar-event time {
    display: none;
  }
  .hys-ui-calendar-dot {
    flex-basis: 4px;
    width: 4px;
    height: 4px;
  }
  .hys-ui-calendar-more {
    padding: 2px 0;
    font-size: 10px;
  }
  .hys-ui-calendar-month {
    min-height: 90px;
    padding: 12px;
  }
  .hys-ui-calendar-year-select {
    width: 108px;
  }
  .hys-ui-calendar-month-select {
    width: 94px;
  }
  .hys-ui-calendar--weeks {
    grid-template-columns: 24px repeat(7, minmax(0, 1fr));
  }
}
@media (prefers-reduced-motion: reduce) {
  .hys-ui-calendar-cell {
    transition: none;
  }
  .hys-ui-calendar-spinner {
    animation: none;
  }
}
</style>
