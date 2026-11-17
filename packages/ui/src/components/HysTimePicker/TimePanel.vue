<script setup lang="ts">
import { computed, nextTick, onMounted, ref, useId, watch } from "vue";
import HysButton from "../HysButton/HysButton.vue";
import HysScrollbar from "../HysScrollbar/HysScrollbar.vue";
import { timeParts, type createTimeOptions } from "./timeParts";
import type { HysTimePickerLabels } from "./timeLabels";

const props = defineProps<{
  options: ReturnType<typeof createTimeOptions>;
  selected?: number;
  seconds?: boolean;
  labels: HysTimePickerLabels;
  twelveHour?: boolean;
  presets: readonly { label: string; value: string; disabled: boolean }[];
}>();
const emit = defineEmits<{
  pick: [time: number];
  confirm: [];
  cancel: [];
  preset: [value: string];
}>();
const id = useId();
const panel = ref<HTMLElement>();
const columns = computed(() => {
  if (props.selected === undefined) return [];
  const [hour, minute, second] = timeParts(props.selected);
  const minutes = props.options.get(hour);
  const rows = [
    {
      label: props.labels.hour,
      values: [...props.options.keys()],
      selected: hour,
    },
    {
      label: props.labels.minute,
      values: [...(minutes?.keys() ?? [])],
      selected: minute,
    },
  ];
  if (props.seconds)
    rows.push({
      label: props.labels.second,
      values: minutes?.get(minute) ?? [],
      selected: second,
    });
  return rows;
});
function item(column: number, value: number) {
  return panel.value?.querySelector<HTMLElement>(
    '[data-time-option="' + column + "-" + value + '"]',
  );
}
function show(column: number, value: number) {
  const option = item(column, value);
  const viewport = option?.closest(".hys-ui-scrollbar-viewport");
  if (!option || !viewport) return;
  const range = option.getBoundingClientRect();
  const view = viewport.getBoundingClientRect();
  if (range.top < view.top) viewport.scrollTop += range.top - view.top;
  if (range.bottom > view.bottom)
    viewport.scrollTop += range.bottom - view.bottom;
}
function alignSelected() {
  columns.value.forEach(({ selected }, column) => show(column, selected));
}
onMounted(() => {
  void nextTick(alignSelected);
});
watch(columns, () => {
  void nextTick(alignSelected);
});
function focus() {
  const first = columns.value[0];
  if (first) item(0, first.selected)?.focus({ preventScroll: true });
  else panel.value?.querySelector<HTMLElement>("[data-time-cancel]")?.focus();
  alignSelected();
}
defineExpose({ focus });

function label(index: number, value: number) {
  if (index === 0 && props.twelveHour)
    return `${String(value % 12 || 12).padStart(2, "0")} ${value < 12 ? "AM" : "PM"}`;
  return String(value).padStart(2, "0");
}

function pick(column: number, value: number) {
  if (props.selected === undefined) return;
  let [hour, minute, second] = timeParts(props.selected);
  if (column === 0) hour = value;
  if (column === 1) minute = value;
  if (column === 2) second = value;
  const minutes = props.options.get(hour)!;
  if (!minutes.has(minute)) minute = minutes.keys().next().value!;
  const seconds = minutes.get(minute)!;
  if (!seconds.includes(second)) second = seconds[0];
  emit("pick", hour * 3600 + minute * 60 + second);
}

async function key(event: KeyboardEvent, index: number, value: number) {
  if (event.altKey || event.metaKey || event.ctrlKey || event.isComposing)
    return;
  const column = columns.value[index];
  if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
    const next = index + (event.key === "ArrowRight" ? 1 : -1);
    if (columns.value[next]) {
      event.preventDefault();
      item(next, columns.value[next].selected)?.focus({ preventScroll: true });
      show(next, columns.value[next].selected);
    }
    return;
  }
  const current = column.values.indexOf(value);
  let next: number | undefined;
  if (event.key === "ArrowUp") next = column.values[Math.max(0, current - 1)];
  if (event.key === "ArrowDown")
    next = column.values[Math.min(column.values.length - 1, current + 1)];
  if (event.key === "Home") next = column.values[0];
  if (event.key === "End") next = column.values.at(-1);
  if (next === undefined) return;
  event.preventDefault();
  pick(index, next);
  await nextTick();
  item(index, next)?.focus({ preventScroll: true });
  show(index, next);
}
</script>

<template>
  <div ref="panel" class="hys-time-panel">
    <div v-if="columns.length" class="hys-time-columns">
      <div
        v-for="(column, index) in columns"
        :key="index"
        class="hys-time-column"
      >
        <div :id="id + '-' + index" class="hys-time-column-label">
          {{ column.label }}
        </div>
        <HysScrollbar direction="vertical" :height="162">
          <div
            role="listbox"
            :aria-labelledby="id + '-' + index"
            class="hys-time-options"
          >
            <HysButton
              v-for="value in column.values"
              :key="value"
              size="sm"
              variant="ghost"
              :data-time-option="index + '-' + value"
              role="option"
              :aria-selected="value === column.selected"
              :tabindex="value === column.selected ? 0 : -1"
              @click="pick(index, value)"
              @keydown="key($event, index, value)"
            >
              {{ label(index, value) }}
            </HysButton>
          </div>
        </HysScrollbar>
      </div>
    </div>
    <p v-else class="hys-time-empty" role="status">{{ labels.empty }}</p>
    <div
      v-if="presets.length"
      class="hys-time-presets"
      role="group"
      :aria-label="labels.presets"
    >
      <HysButton
        v-for="(preset, index) in presets"
        :key="index"
        variant="secondary"
        size="sm"
        :disabled="preset.disabled"
        @click="emit('preset', preset.value)"
        >{{ preset.label }}</HysButton
      >
    </div>
    <div class="hys-time-panel-actions">
      <HysButton
        size="sm"
        variant="ghost"
        data-time-cancel
        @click="emit('cancel')"
        >{{ labels.cancel }}</HysButton
      >
      <HysButton
        size="sm"
        :disabled="selected === undefined"
        @click="emit('confirm')"
        >{{ labels.confirm }}</HysButton
      >
    </div>
  </div>
</template>

<style scoped>
.hys-time-panel {
  inline-size: min(235px, calc(100vw - 40px));
  min-inline-size: 0;
}
.hys-time-columns {
  display: flex;
  gap: 6px;
  direction: ltr;
}
.hys-time-column {
  flex: 1 1 0;
  min-width: 0;
  text-align: center;
}
.hys-time-column-label {
  padding: 3px 4px;
  color: var(--hys-ui-theme-muted);
  font-size: 12px;
}
.hys-time-options {
  display: grid;
  gap: 2px;
  padding: 3px 5px;
}
.hys-time-options :deep(.hys-ui-btn) {
  min-width: 0;
  justify-content: center;
  font-variant-numeric: tabular-nums;
}
.hys-time-options :deep([aria-selected="true"]) {
  background: var(--hys-ui-theme-primary-soft);
  color: var(--hys-ui-theme-primary);
}
.hys-time-panel-actions {
  display: flex;
  justify-content: end;
  gap: 5px;
  border-block-start: 1px solid var(--hys-ui-theme-border);
  padding-block-start: 6px;
}
.hys-time-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding-block: 5px;
}
.hys-time-empty {
  color: var(--hys-ui-theme-muted);
  font-size: 13px;
}
</style>
