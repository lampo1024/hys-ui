<script setup lang="ts">
import { ChevronLeft, ChevronRight } from "lucide-vue-next";
import { computed, nextTick, ref } from "vue";
import { calendarDay, calendarParts } from "../../composables/calendar";
import { useHysRootAttrs } from "../../config";

export type HysCalendarNavigationView = "days" | "months" | "years";
type ChangeSource = "previous" | "next" | "month" | "year" | "today" | "shortcut" | "api";
export interface HysCalendarMonthShortcut { label: string; month: Date }
const props = defineProps<{
  month: Date;
  min?: string;
  max?: string;
  locale?: string;
  disabled?: boolean;
  showToday?: boolean;
  today?: Date;
  shortcuts?: readonly HysCalendarMonthShortcut[];
}>();
const emit = defineEmits<{
  "update:month": [value: Date];
  navigate: [value: Date, source: ChangeSource];
  viewChange: [view: HysCalendarNavigationView];
}>();
const hysRootAttrs = useHysRootAttrs();
const root = ref<HTMLElement>();
const monthButton = ref<HTMLButtonElement>();
const view = ref<HysCalendarNavigationView>("days");
const year = computed(() => props.month.getUTCFullYear());
const monthIndex = computed(() => year.value * 12 + props.month.getUTCMonth());
const minMonth = computed(() => boundary(props.min) ?? 12);
const maxMonth = computed(() => boundary(props.max) ?? 9999 * 12 + 11);
const minYear = computed(() => Math.floor(minMonth.value / 12));
const maxYear = computed(() => Math.floor(maxMonth.value / 12));
const yearPage = ref(0);
const years = computed(() =>
  Array.from({ length: 12 }, (_, index) => yearPage.value + index),
);
const months = computed(() => {
  if (!props.locale)
    return Array.from({ length: 12 }, (_, month) => month + 1 + "月");
  let formatter: Intl.DateTimeFormat;
  try {
    formatter = new Intl.DateTimeFormat(props.locale, {
      month: "short",
      timeZone: "UTC",
    });
  } catch {
    formatter = new Intl.DateTimeFormat("zh-CN", {
      month: "short",
      timeZone: "UTC",
    });
  }
  return Array.from({ length: 12 }, (_, month) =>
    formatter.format(new Date(Date.UTC(2000, month, 1))),
  );
});

function boundary(value: string | undefined) {
  const day = calendarDay(value);
  if (day === undefined) return;
  const { year, month } = calendarParts(day);
  return year * 12 + month;
}
function dateOf(index: number) {
  const value = new Date(0);
  value.setUTCFullYear(Math.floor(index / 12), index % 12, 1);
  return value;
}
function allowedMonth(index: number) {
  return index >= minMonth.value && index <= maxMonth.value;
}
function allowedYear(value: number) {
  return (
    minMonth.value <= maxMonth.value &&
    value >= minYear.value &&
    value <= maxYear.value
  );
}
function request(index: number, source: ChangeSource) {
  if (props.disabled || !allowedMonth(index) || index === monthIndex.value)
    return false;
  const month = dateOf(index);
  emit("update:month", month);
  emit("navigate", month, source);
  return true;
}
function clampToYear(value: number) {
  return Math.min(
    maxMonth.value,
    Math.max(minMonth.value, value * 12 + props.month.getUTCMonth()),
  );
}
function canMove(offset: number) {
  if (props.disabled || minMonth.value > maxMonth.value) return false;
  if (view.value === "years") {
    const start = yearPage.value + offset * 12;
    return start <= maxYear.value && start + 11 >= minYear.value;
  }
  if (view.value === "months") return allowedYear(year.value + offset);
  return allowedMonth(monthIndex.value + offset);
}
function move(offset: number) {
  if (!canMove(offset)) return;
  if (view.value === "years") {
    yearPage.value += offset * 12;
    return;
  }
  const index =
    view.value === "months"
      ? clampToYear(year.value + offset)
      : monthIndex.value + offset;
  request(index, offset < 0 ? "previous" : "next");
}
async function setView(next: HysCalendarNavigationView) {
  if (props.disabled || next === view.value) return;
  if (next === "years") yearPage.value = Math.floor(year.value / 12) * 12;
  view.value = next;
  emit("viewChange", next);
  await nextTick();
  if (view.value !== next) return;
  if (next === "days") {
    (
      root.value?.querySelector<HTMLButtonElement>(
        "[data-date]:not(:disabled)",
      ) ?? monthButton.value
    )?.focus();
    return;
  }
  const selected = root.value?.querySelector<HTMLButtonElement>(
    "[data-period][aria-pressed='true']:not(:disabled)",
  );
  (
    selected ??
    root.value?.querySelector<HTMLButtonElement>("[data-period]:not(:disabled)")
  )?.focus();
}
function selectYear(value: number) {
  if (!allowedYear(value) || props.disabled) return;
  request(clampToYear(value), "year");
  void setView("months");
}
function selectMonth(month: number) {
  if (!allowedMonth(year.value * 12 + month) || props.disabled) return;
  request(year.value * 12 + month, "month");
  void setView("days");
}
function todayMonth() {
  const today = props.today ?? new Date();
  return today.getUTCFullYear() * 12 + today.getUTCMonth();
}
function indexOf(date: Date) {
  return date.getUTCFullYear() * 12 + date.getUTCMonth();
}
function goTo(date: Date, source: "shortcut" | "api") {
  const index = indexOf(date);
  if (props.disabled || !allowedMonth(index)) return false;
  const changed = request(index, source);
  void setView("days");
  return changed;
}
defineExpose({ goToMonth: (date: Date) => goTo(date, "api") });
function goToday() {
  const index = todayMonth();
  if (!allowedMonth(index) || props.disabled) return;
  request(index, "today");
  void setView("days");
}
function onPeriodKey(event: KeyboardEvent) {
  if (
    event.defaultPrevented ||
    event.altKey ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey
  )
    return;
  if (event.key === "Escape") {
    event.preventDefault();
    void setView(view.value === "years" ? "months" : "days");
    return;
  }
  const choices = Array.from(
    root.value?.querySelectorAll<HTMLButtonElement>("[data-period]") ?? [],
  );
  const current = choices.indexOf(event.target as HTMLButtonElement);
  if (current < 0) return;
  const rtl = root.value && getComputedStyle(root.value).direction === "rtl";
  const offsets = {
    ArrowLeft: rtl ? 1 : -1,
    ArrowRight: rtl ? -1 : 1,
    ArrowUp: -3,
    ArrowDown: 3,
  };
  const step = offsets[event.key as keyof typeof offsets];
  if (step !== undefined) {
    event.preventDefault();
    for (
      let index = current + step;
      index >= 0 && index < choices.length;
      index += step
    ) {
      if (!choices[index].disabled) {
        choices[index].focus();
        break;
      }
    }
  } else if (event.key === "Home" || event.key === "End") {
    event.preventDefault();
    if (event.key === "End") choices.reverse();
    choices.find((button) => !button.disabled)?.focus();
  }
}
</script>

<template>
  <div ref="root" v-bind="hysRootAttrs" class="hys-ui-calendar-navigation">
    <div class="hys-ui-pf-calendar-heading">
      <button
        type="button"
        :disabled="!canMove(-1)"
        :aria-label="
          view === 'years'
            ? '上一组年份'
            : view === 'months'
              ? '上一年'
              : '上个月'
        "
        @click="move(-1)"
      >
        <ChevronLeft :size="16" aria-hidden="true" />
      </button>
      <div class="hys-ui-pf-calendar-period-title" aria-live="polite">
        <button
          v-if="view === 'years'"
          type="button"
          :disabled="disabled"
          aria-label="返回日期"
          @click="setView('days')"
        >
          {{ Math.max(1, yearPage) }} — {{ Math.min(9999, yearPage + 11) }}
        </button>
        <template v-else>
          <button
            type="button"
            :disabled="disabled"
            aria-label="选择年份"
            @click="setView('years')"
          >
            {{ year }}年
          </button>
          <button
            ref="monthButton"
            type="button"
            :disabled="disabled"
            :aria-label="view === 'months' ? '返回日期' : '选择月份'"
            :aria-pressed="view === 'months'"
            @click="setView(view === 'months' ? 'days' : 'months')"
          >
            {{ months[month.getUTCMonth()] }}
          </button>
        </template>
      </div>
      <button
        type="button"
        :disabled="!canMove(1)"
        :aria-label="
          view === 'years'
            ? '下一组年份'
            : view === 'months'
              ? '下一年'
              : '下个月'
        "
        @click="move(1)"
      >
        <ChevronRight :size="16" aria-hidden="true" />
      </button>
    </div>
    <div
      v-if="view === 'years'"
      class="hys-ui-pf-calendar-periods"
      role="group"
      aria-label="年份选择"
      @keydown="onPeriodKey"
    >
      <button
        v-for="value in years"
        :key="value"
        type="button"
        data-period
        :aria-pressed="value === year"
        :disabled="disabled || !allowedYear(value)"
        @click="selectYear(value)"
      >
        {{ value || "—" }}年
      </button>
    </div>
    <div
      v-else-if="view === 'months'"
      class="hys-ui-pf-calendar-periods"
      role="group"
      aria-label="月份选择"
      @keydown="onPeriodKey"
    >
      <button
        v-for="(label, index) in months"
        :key="index"
        type="button"
        data-period
        :aria-pressed="index === month.getUTCMonth()"
        :disabled="disabled || !allowedMonth(year * 12 + index)"
        @click="selectMonth(index)"
      >
        {{ label }}
      </button>
    </div>
    <slot v-else :month="month" />
    <div v-if="showToday || shortcuts?.length" class="hys-calendar-nav-footer">
      <button v-for="shortcut in shortcuts" :key="shortcut.label" type="button"
        :disabled="disabled || !allowedMonth(indexOf(shortcut.month))"
        @click="goTo(shortcut.month, 'shortcut')">{{ shortcut.label }}</button>
      <button
        v-if="showToday"
        type="button"
        :disabled="disabled || !allowedMonth(todayMonth())"
        @click="goToday"
      >
        回到本月
      </button>
    </div>
  </div>
</template>

<style scoped>
.hys-ui-calendar-navigation button {
  border: 1px solid transparent;
  border-radius: 7px;
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;
}
.hys-ui-calendar-navigation
  button:not(:disabled):not([aria-pressed="true"]):hover {
  background: var(
    --hys-ui-surface-secondary,
    var(--hys-ui-theme-surface-secondary)
  );
}
.hys-ui-calendar-navigation button:focus-visible {
  outline: 2px solid var(--hys-ui-primary, var(--hys-ui-theme-primary));
  outline-offset: -2px;
}
.hys-ui-calendar-navigation button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.hys-calendar-nav-footer {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: end;
  padding-top: 10px;
}
.hys-calendar-nav-footer button {
  min-height: 32px;
  padding: 4px 10px;
  border-color: var(--hys-ui-border, var(--hys-ui-theme-border));
}
</style>
