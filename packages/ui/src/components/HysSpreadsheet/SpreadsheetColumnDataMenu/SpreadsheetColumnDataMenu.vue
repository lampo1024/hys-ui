<script setup lang="ts">
import { computed, nextTick, ref, useId, useTemplateRef, watch } from "vue";
import { ArrowDown, ArrowUp, FilterX, RotateCcw } from "lucide-vue-next";
import HysButton from "../../HysButton/HysButton.vue";
import HysCheckbox from "../../HysCheckbox/HysCheckbox.vue";
import HysInput from "../../HysInput/HysInput.vue";
import HysPopover from "../../HysPopover/HysPopover.vue";
import HysSelect from "../../HysSelect/HysSelect.vue";
import {
  columnFilterOptions,
  useSpreadsheetOptions,
} from "../spreadsheetControlOptions";
import { useSpreadsheetMessages } from "../spreadsheetMessages";
import type {
  HysSpreadsheetDataCommand,
  HysSpreadsheetSheet,
} from "../spreadsheetTypes";

const props = defineProps<{
  menu?: {
    mode: "sort" | "filter";
    column: number;
    label: string;
    anchor: HTMLElement;
  };
  sheet: HysSpreadsheetSheet;
  command: (command: HysSpreadsheetDataCommand) => boolean;
}>();
const emit = defineEmits<{ close: [] }>();
const message = useSpreadsheetMessages();
const optionsFor = useSpreadsheetOptions();
const id = useId();
const panel = useTemplateRef<HTMLElement>("panel");
const options = computed(() => optionsFor(columnFilterOptions));
type Operator = (typeof columnFilterOptions)[number][0];
const operator = ref<Operator>("contains");
const value = ref("");
const keepHeader = ref(true);
const error = ref(false);
const numeric = computed(() =>
  ["gt", "gte", "lt", "lte"].includes(operator.value),
);
const activeFilters = computed(
  () =>
    props.sheet.filters?.filter(
      ({ column }) => column === props.menu?.column,
    ) ?? [],
);
const sortDirection = computed(() => {
  const key = props.sheet.sortKeys?.find(
    ({ column }) => column === props.menu?.column,
  );
  return key && (key.direction ?? "asc");
});
const title = computed(() =>
  (props.menu?.mode === "sort"
    ? message("排序 {column} 列")
    : message("筛选 {column} 列")
  ).replace("{column}", props.menu?.label ?? ""),
);

const invalid = computed(
  () =>
    !value.value.trim() ||
    (numeric.value && !Number.isFinite(Number(value.value))),
);

watch(
  () => props.menu,
  () => {
    const existing =
      activeFilters.value.length === 1 ? activeFilters.value[0] : undefined;
    const option = columnFilterOptions.find(
      ([key]) => key === existing?.operator,
    );
    operator.value = option?.[0] ?? "contains";
    value.value = option ? String(existing?.value ?? "") : "";
    keepHeader.value =
      props.menu?.mode === "filter" && props.sheet.filters?.length
        ? !!props.sheet.filterHeader
        : true;
    error.value = false;
  },
);

async function focusFirst() {
  await nextTick();
  if (props.menu)
    panel.value
      ?.querySelector<HTMLElement>("input, button")
      ?.focus({ preventScroll: true });
}

async function run(command: HysSpreadsheetDataCommand) {
  const anchor = props.menu?.anchor;
  if (!anchor || !props.command(command)) {
    error.value = true;
    return;
  }
  emit("close");
  await nextTick();
  if (anchor.isConnected) anchor.focus({ preventScroll: true });
}

function sort(direction: "asc" | "desc") {
  if (!props.menu) return;
  void run({
    type: "sort",
    keys: [{ column: props.menu.column, direction }],
    header: keepHeader.value,
  });
}

function filter(clear: boolean) {
  if (!props.menu) return;
  const { column } = props.menu;
  const current = props.sheet.filters ?? [];
  const filters = current.filter((rule) => rule.column !== column);
  if (!clear) {
    if (invalid.value) return;
    filters.push({
      column,
      operator: operator.value,
      value: numeric.value ? Number(value.value) : value.value,
    });
  }
  void run({
    type: "filter",
    filters,
    header: current.length ? props.sheet.filterHeader : keepHeader.value,
    match: props.sheet.filterMode,
  });
}

function applyFilterWithEnter(event: KeyboardEvent) {
  event.preventDefault();
  filter(false);
}
</script>

<template>
  <HysPopover
    class="column-data-anchor"
    trigger="manual"
    :open="!!menu"
    :reference="menu?.anchor"
    :placement="menu?.mode === 'sort' ? 'bottom' : 'bottom-start'"
    :show-arrow="menu?.mode === 'sort'"
    :width="menu?.mode === 'filter' ? 276 : 240"
    :max-width="276"
    :z-index="1101"
    :aria-label="title"
    @update:open="!$event && emit('close')"
    @opened="focusFirst"
  >
    <div
      v-if="menu"
      ref="panel"
      class="column-data-menu"
      :data-mode="menu.mode"
      :aria-labelledby="id"
    >
      <strong :id="id">{{ title }}</strong>
      <template v-if="menu.mode === 'sort'">
        <div
          class="sort-directions"
          role="group"
          :aria-label="message('排序方向')"
        >
          <HysButton
            v-for="direction in ['asc', 'desc'] as const"
            :key="direction"
            size="sm"
            variant="secondary"
            :icon="direction === 'asc' ? ArrowUp : ArrowDown"
            :pressed="sortDirection === direction"
            @click="sort(direction)"
            >{{ message(direction === "asc" ? "升序" : "降序") }}</HysButton
          >
        </div>
        <HysCheckbox
          class="sort-header-option"
          v-model="keepHeader"
          size="sm"
          :label="message('保留首行标题')"
        />
        <div class="sort-footer">
          <HysButton
            size="sm"
            variant="ghost"
            :icon="RotateCcw"
            :disabled="!sheet.sortRowOrder && !sheet.sortKeys?.length"
            @click="run({ type: 'clearSort' })"
            >{{ message("取消排序") }}</HysButton
          >
        </div>
      </template>
      <template v-else>
        <HysInput
          v-model="value"
          size="sm"
          :aria-label="message('筛选文本')"
          :placeholder="message('筛选文本')"
          @press-enter="applyFilterWithEnter"
        />
        <HysSelect
          v-model="operator"
          size="sm"
          :options="options"
          :native-label-tooltip="false"
          :aria-label="message('筛选条件')"
        />
        <HysCheckbox
          v-model="keepHeader"
          size="sm"
          :label="message('保留首行标题')"
          :disabled="!!sheet.filters?.length"
        />
        <div class="filter-actions">
          <HysButton
            size="sm"
            variant="primary"
            :disabled="invalid"
            @click="filter(false)"
            >{{ message("应用筛选") }}</HysButton
          >
          <HysButton
            size="sm"
            variant="ghost"
            :icon="FilterX"
            :disabled="!activeFilters.length"
            @click="filter(true)"
            >{{ message("清除此列筛选") }}</HysButton
          >
        </div>
      </template>
      <small v-if="error" role="status">{{
        message("无法应用此列操作。")
      }}</small>
    </div>
  </HysPopover>
</template>

<style scoped>
.column-data-anchor {
  position: absolute;
  inline-size: 0;
  block-size: 0;
}
.column-data-menu {
  display: grid;
  gap: 6px;
  color: var(--hys-ui-theme-text);
}
.column-data-menu > strong {
  margin-block-end: 2px;
  font-size: 13px;
}
.column-data-menu[data-mode="sort"] {
  gap: 10px;
}
.column-data-menu[data-mode="sort"] > strong {
  margin-block-end: 0;
  font-size: 14px;
}
.sort-directions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
}
.sort-header-option {
  justify-self: start;
}
.sort-footer {
  padding-block-start: 4px;
  border-block-start: 1px solid var(--hys-ui-theme-border);
}
.sort-footer :deep(.hys-ui-btn) {
  color: var(--hys-ui-theme-text);
}
.sort-footer :deep(.hys-ui-btn:not(:disabled):hover) {
  color: var(--hys-ui-theme-primary);
}
.filter-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
</style>
