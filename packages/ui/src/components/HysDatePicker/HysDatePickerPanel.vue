<script setup lang="ts">
import { computed, nextTick, ref } from "vue";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-vue-next";
import {
  calendarDate,
  calendarISO,
  calendarParts,
  calendarShift,
  calendarWeek,
  civilDay,
} from "../../composables/calendar";
import {
  DATE_MIN,
  DATE_MAX,
  dateLocale,
  datePeriod,
  dateShift,
  type HysDatePoint,
  type HysDatePickerCell,
  type HysDatePickerView,
  type HysDatePickerUnit,
  type HysDatePickerLocale,
} from "../../composables/datePicker";
const props = defineProps<{
  month: number;
  view: HysDatePickerView;
  unit: HysDatePickerUnit;
  selected: readonly (HysDatePoint | null)[];
  range: boolean;
  preview?: number;
  first: number;
  locale: string;
  words: HysDatePickerLocale;
  weekNumbers: boolean;
  adjacent: boolean;
  disabled: boolean;
  available: (day: number) => boolean;
  periodAvailable: (start: number, end: number) => boolean;
  cellClassName?: (cell: HysDatePickerCell) => string;
}>();
const emit = defineEmits<{
  browse: [day: number];
  mode: [view: HysDatePickerView];
  pick: [day: number];
  preview: [day: number | undefined];
}>();
const root = ref<HTMLElement>(),
  focused = ref<number>(),
  year = computed(() => calendarParts(props.month).year),
  month = computed(() => calendarParts(props.month).month),
  pageYear = computed(() => Math.floor((year.value - 1) / 12) * 12 + 1),
  baseView = computed(() => (props.unit === "week" ? "date" : props.unit)),
  today = () =>
    calendarISO(
      civilDay(
        new Date().getFullYear(),
        new Date().getMonth(),
        new Date().getDate(),
      ),
    );
const weekdayLabels = computed(() =>
  Array.from({ length: 7 }, (_, i) => {
    const date = calendarDate(
      civilDay(2026, 10, 2) + ((props.first + 6) % 7) + i,
    );
    try {
      return new Intl.DateTimeFormat(props.locale, { weekday: "short" }).format(
        date,
      );
    } catch {
      return new Intl.DateTimeFormat("zh-CN", { weekday: "short" }).format(
        date,
      );
    }
  }),
);
const cells = computed<HysDatePickerCell[]>(() => {
  const selected = props.selected.filter((p): p is HysDatePoint => !!p),
    start = civilDay(year.value, month.value, 1),
    first = start - ((calendarParts(start).weekday - props.first + 7) % 7),
    values =
      props.view === "date"
        ? Array.from({ length: 42 }, (_, i) => first + i)
        : props.view === "month"
          ? Array.from({ length: 12 }, (_, i) => civilDay(year.value, i, 1))
          : props.view === "quarter"
            ? Array.from({ length: 4 }, (_, i) =>
                civilDay(year.value, i * 3, 1),
              )
            : Array.from({ length: 12 }, (_, i) =>
                civilDay(pageYear.value + i, 0, 1),
              ),
    endpoints =
      props.preview !== undefined && selected[0]
        ? [selected[0].day, props.preview]
        : selected.map((p) => p.day),
    range =
      props.range && endpoints.length === 2
        ? endpoints.sort((a, b) => a - b)
        : undefined;
  return values.map((day) => {
    const parts = calendarParts(day),
      unit = props.view === "date" ? props.unit : props.view,
      period = datePeriod(day, unit, props.first),
      outside = parts.month !== month.value,
      text =
        props.view === "date"
          ? String(parts.day)
          : props.view === "month"
            ? dateLocale(props.locale).format(calendarDate(day))
            : props.view === "quarter"
              ? "Q" + (Math.floor(parts.month / 3) + 1)
              : String(parts.year),
      disabled =
        props.disabled ||
        day < DATE_MIN ||
        day > DATE_MAX ||
        (props.view === "date"
          ? !props.available(day) || (!props.adjacent && outside)
          : !props.periodAvailable(period[0], period[1]));
    return {
      date: new Date(day * 86400000),
      iso: calendarISO(day),
      value: day,
      end: period[1],
      text,
      type: props.view,
      outside: props.view === "date" && outside,
      disabled,
      selected: selected.some(
        (p) => datePeriod(p.day, unit, props.first)[0] === period[0],
      ),
      inRange: !!range && day >= range[0] && day <= range[1],
      today: calendarISO(day) === today(),
      week: calendarWeek(day),
    };
  });
});
const tabDay = computed(() => {
  const usable = cells.value.filter((c) => !c.disabled);
  return (
    usable.find((c) => c.value === focused.value)?.value ??
    usable.find((c) => c.selected)?.value ??
    usable.find((c) => !c.outside)?.value ??
    usable[0]?.value
  );
});
const rows = computed(() => {
  const width = props.view === "date" ? 7 : 3;
  return Array.from(
    { length: Math.ceil(cells.value.length / width) },
    (_, index) => cells.value.slice(index * width, (index + 1) * width),
  );
});
function target(day: number) {
  return [
    ...(root.value?.querySelectorAll<HTMLButtonElement>("[data-picker-day]") ??
      []),
  ].find((el) => el.dataset.pickerDay === String(day));
}
async function focus(day = tabDay.value) {
  if (day === undefined) return;
  let el = target(day);
  if (!el) {
    await nextTick();
    el = target(day);
  }
  if (el && !el.disabled) el.focus();
}
async function changeView(view: HysDatePickerView) {
  if (props.disabled) return;
  emit("mode", view);
  await nextTick();
  await focus();
}
async function browse(day: number) {
  emit("browse", day);
  await nextTick();
}
function move(direction: number, large = false) {
  const months =
    props.view === "year"
      ? 144
      : large || props.view === "month" || props.view === "quarter"
        ? 12
        : 1;
  void browse(dateShift(props.month, months * direction));
}
async function pick(cell: HysDatePickerCell) {
  if (cell.disabled) return;
  const granularity = { year: 0, quarter: 1, month: 2, date: 3 };
  if (granularity[props.view] >= granularity[baseView.value]) {
    emit("pick", cell.value);
    return;
  }
  await browse(cell.value);
  await changeView(
    props.view === "year"
      ? props.unit === "quarter"
        ? "quarter"
        : "month"
      : props.view === "quarter"
        ? "month"
        : "date",
  );
}
async function keyboard(event: KeyboardEvent, cell: HysDatePickerCell) {
  if (
    props.disabled ||
    event.isComposing ||
    event.keyCode === 229 ||
    event.altKey ||
    event.metaKey
  )
    return;
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    await pick(cell);
    return;
  }
  let next = cell.value,
    step = 0;
  const arrows: Record<string, number> = {
    ArrowLeft: -1,
    ArrowRight: 1,
    ArrowUp: props.view === "date" ? -7 : -3,
    ArrowDown: props.view === "date" ? 7 : 3,
  };
  if (event.key in arrows) step = arrows[event.key];
  else if (event.key === "Home" || event.key === "End") {
    if (props.view === "date") {
      const offset = (calendarParts(next).weekday - props.first + 7) % 7;
      next += event.key === "Home" ? -offset : 6 - offset;
    } else
      next =
        cells.value[event.key === "Home" ? 0 : cells.value.length - 1].value;
  } else if (event.key === "PageUp" || event.key === "PageDown") {
    const count =
      (event.key === "PageUp" ? -1 : 1) *
      (event.ctrlKey
        ? 12
        : props.view === "year"
          ? 144
          : props.view === "date"
            ? 1
            : 12);
    next = dateShift(next, count);
  } else return;
  event.preventDefault();
  const offset = (day: number, n: number) =>
    props.view === "date"
      ? day + n
      : dateShift(
          day,
          n * (props.view === "year" ? 12 : props.view === "quarter" ? 3 : 1),
        );
  if (step) next = offset(next, step);
  let found = false;
  for (let i = 0; i < 370 && next >= DATE_MIN && next <= DATE_MAX; i++) {
    const end = datePeriod(
      next,
      props.view === "date" ? props.unit : props.view,
      props.first,
    )[1];
    if (
      props.view === "date"
        ? props.available(next)
        : props.periodAvailable(next, end)
    ) {
      found = true;
      break;
    }
    next = offset(next, step || 1);
  }
  if (!found || next < DATE_MIN || next > DATE_MAX) return;
  focused.value = next;
  if (
    !cells.value.some((c) => c.value === next) ||
    (props.view === "date" && calendarParts(next).month !== month.value)
  )
    await browse(next);
  await focus(next);
}
defineExpose({ focus, element: root });
</script>
<template>
  <section
    ref="root"
    class="hys-ui-date-panel"
    :aria-label="year + '-' + String(month + 1).padStart(2, '0')"
  >
    <div class="hys-ui-date-panel-heading">
      <div class="hys-ui-date-navigation">
        <button
          type="button"
          :aria-label="words.prevYear"
          :disabled="disabled || year <= 1"
          @click="move(-1, true)"
        >
          <slot name="prev-year"><ChevronsLeft :size="15" /></slot></button
        ><button
          v-if="view === 'date'"
          type="button"
          :aria-label="words.prevMonth"
          :disabled="disabled || (month === 0 && year <= 1)"
          @click="move(-1)"
        >
          <slot name="prev-month"><ChevronLeft :size="15" /></slot>
        </button>
      </div>
      <div class="hys-ui-date-period-title" aria-live="polite">
        <button
          v-if="view === 'year'"
          type="button"
          :aria-label="words.back"
          @click="changeView(baseView)"
        >
          {{ pageYear }} — {{ Math.min(9999, pageYear + 11) }}</button
        ><template v-else
          ><button
            type="button"
            :aria-label="words.year"
            @click="changeView('year')"
          >
            {{ year }}<span v-if="locale.startsWith('zh')">年</span></button
          ><button
            v-if="view !== 'quarter'"
            type="button"
            :aria-label="view === 'month' ? words.back : words.month"
            @click="changeView(view === 'month' ? baseView : 'month')"
          >
            {{
              dateLocale(locale).format(calendarDate(civilDay(year, month, 1)))
            }}
          </button></template
        >
      </div>
      <div class="hys-ui-date-navigation">
        <button
          v-if="view === 'date'"
          type="button"
          :aria-label="words.nextMonth"
          :disabled="disabled || (month === 11 && year >= 9999)"
          @click="move(1)"
        >
          <slot name="next-month"><ChevronRight :size="15" /></slot></button
        ><button
          type="button"
          :aria-label="words.nextYear"
          :disabled="disabled || year >= 9999"
          @click="move(1, true)"
        >
          <slot name="next-year"><ChevronsRight :size="15" /></slot>
        </button>
      </div>
    </div>
    <div
      v-if="view === 'date'"
      class="hys-ui-date-weekdays"
      :class="{ 'hys-ui-date-with-weeks': weekNumbers }"
      aria-hidden="true"
    >
      <span v-if="weekNumbers">{{ words.week }}</span
      ><span v-for="(label, index) in weekdayLabels" :key="index">{{
        label
      }}</span>
    </div>
    <div
      class="hys-ui-date-cells"
      :class="[
        'hys-ui-date-view-' + view,
        { 'hys-ui-date-with-weeks': weekNumbers && view === 'date' },
      ]"
      role="grid"
      :aria-label="
        view === 'date'
          ? words.empty
          : view === 'year'
            ? words.year
            : words.month
      "
      @mouseleave="emit('preview', undefined)"
    >
      <div
        v-for="row in rows"
        :key="row[0].value"
        role="row"
        class="hys-ui-date-grid-row"
      >
        <template v-for="(cell, index) in row" :key="cell.value"
          ><span
            v-if="view === 'date' && weekNumbers && index % 7 === 0"
            class="hys-ui-date-week-number"
            role="rowheader"
            >{{ cell.week }}</span
          ><button
            type="button"
            role="gridcell"
            :data-picker-day="cell.value"
            :data-date="view === 'date' ? cell.iso : undefined"
            :data-period="view !== 'date' ? cell.iso : undefined"
            :aria-label="view === 'date' ? cell.iso : cell.text"
            :aria-selected="cell.selected"
            :aria-current="cell.today ? 'date' : undefined"
            :tabindex="cell.value === tabDay ? 0 : -1"
            :disabled="cell.disabled"
            :class="[
              cellClassName?.(cell),
              {
                'hys-ui-is-selected': cell.selected,
                'hys-ui-is-today': cell.today,
                'hys-ui-is-outside': cell.outside,
                'hys-ui-is-in-range': cell.inRange && !cell.selected,
              },
            ]"
            @focus="
              focused = cell.value;
              emit('preview', cell.value);
            "
            @pointerenter="!cell.disabled && emit('preview', cell.value)"
            @click="pick(cell)"
            @keydown="keyboard($event, cell)"
          >
            <slot name="cell" v-bind="cell">{{ cell.text }}</slot>
          </button></template
        >
      </div>
    </div>
  </section>
</template>
<style scoped>
.hys-ui-date-panel {
  flex: 1 0 272px;
  min-width: 0;
  padding: 12px;
  box-sizing: border-box;
  color: var(--hys-ui-text, var(--hys-ui-theme-text));
}
.hys-ui-date-grid-row {
  display: contents;
}
.hys-ui-date-panel + .hys-ui-date-panel {
  border-inline-start: 1px solid
    var(--hys-ui-border, var(--hys-ui-theme-border));
}
.hys-ui-date-panel-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 6px;
  min-height: 34px;
  margin-bottom: 12px;
}
.hys-ui-date-navigation,
.hys-ui-date-period-title {
  display: flex;
  align-items: center;
  gap: 2px;
}
.hys-ui-date-panel button {
  font: inherit;
  border: 0;
  border-radius: 7px;
  color: inherit;
  background: transparent;
  cursor: pointer;
  box-sizing: border-box;
}
.hys-ui-date-navigation button {
  display: grid;
  place-items: center;
  width: 26px;
  height: 30px;
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted));
}
.hys-ui-date-period-title button {
  padding: 5px 4px;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
}
.hys-ui-date-panel button:not(:disabled):hover {
  background: var(--hys-ui-primary-soft, var(--hys-ui-theme-primary-soft));
  color: var(--hys-ui-primary, var(--hys-ui-theme-primary));
}
.hys-ui-date-weekdays,
.hys-ui-date-cells {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 3px;
  text-align: center;
}
.hys-ui-date-with-weeks {
  grid-template-columns: 24px repeat(7, minmax(0, 1fr));
}
.hys-ui-date-weekdays {
  font-size: 11px;
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted));
  margin-bottom: 6px;
}
.hys-ui-date-cells button {
  min-width: 0;
  height: 32px;
  font-size: 12px;
  position: relative;
}
.hys-ui-date-cells .hys-ui-is-outside {
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted));
  opacity: 0.55;
}
.hys-ui-date-cells .hys-ui-is-in-range {
  background: var(--hys-ui-primary-soft, var(--hys-ui-theme-primary-soft));
  color: var(--hys-ui-primary, var(--hys-ui-theme-primary));
  border-radius: 4px;
  opacity: 1;
}
.hys-ui-date-cells .hys-ui-is-selected,
.hys-ui-date-cells .hys-ui-is-selected:not(:disabled):hover {
  background: var(--hys-ui-primary, var(--hys-ui-theme-primary));
  color: #fff;
  opacity: 1;
  font-weight: 600;
}
.hys-ui-date-cells .hys-ui-is-today:not(.hys-ui-is-selected) {
  box-shadow: inset 0 0 0 1px var(--hys-ui-primary, var(--hys-ui-theme-primary));
  color: var(--hys-ui-primary, var(--hys-ui-theme-primary));
}
.hys-ui-date-panel button:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
.hys-ui-date-panel button:focus-visible {
  outline: 2px solid var(--hys-ui-primary, var(--hys-ui-theme-primary));
  outline-offset: -2px;
}
.hys-ui-date-view-month,
.hys-ui-date-view-quarter,
.hys-ui-date-view-year {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  min-height: 236px;
  align-content: space-around;
  gap: 8px;
}
.hys-ui-date-view-month button,
.hys-ui-date-view-quarter button,
.hys-ui-date-view-year button {
  height: 44px;
  font-size: 13px;
}
.hys-ui-date-week-number {
  align-self: center;
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted));
  font-size: 10px;
}
</style>
