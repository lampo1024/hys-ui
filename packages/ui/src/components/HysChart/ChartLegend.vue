<script setup lang="ts">
import { computed, nextTick, ref, useTemplateRef } from "vue";
import HysButton from "../HysButton/HysButton.vue";
import HysPopover from "../HysPopover/HysPopover.vue";
import HysSelect from "../HysSelect/HysSelect.vue";
import HysTooltip from "../HysTooltip/HysTooltip.vue";
import { ChevronLeft, ChevronRight } from "../HysIcon/svgIcons";
import ChartLegendButton from "./ChartLegendButton.vue";
import ChartLegendList from "./ChartLegendList.vue";
import type { ChartLegendEntry } from "./chartModel";
import type { HysChartLegendLayout } from "./chartTypes";

const props = defineProps<{
  items: readonly ChartLegendEntry[];
  hidden: ReadonlySet<string>;
  width: number;
  layout: HysChartLegendLayout;
  listHeight?: number;
}>();
const emit = defineEmits<{ toggle: [key: string] }>();
const root = useTemplateRef<HTMLElement>("root");
const chooserVersion = ref(0);
const columns = computed(() =>
  Math.max(1, Math.floor((props.width + 6) / 112)),
);
const visible = computed(() =>
  props.items.filter((item) => !props.hidden.has(item.key)),
);

const groups = computed(() => {
  const map = new Map<string, ChartLegendEntry[]>();
  for (const item of props.items) {
    const group = item.group?.trim() || "未分组";
    const entries = map.get(group);
    if (entries) entries.push(item);
    else map.set(group, [item]);
  }
  return map;
});
const groupOptions = computed(() =>
  Array.from(groups.value, ([value, entries]) => {
    const count = entries.filter((item) => !props.hidden.has(item.key)).length;
    return { value, label: value, count, total: entries.length };
  }),
);
const group = ref("");
const currentGroup = computed({
  get: () =>
    groups.value.has(group.value)
      ? group.value
      : (groupOptions.value[0]?.value ?? ""),
  set: (next: string) => {
    group.value = next;
  },
});
const compactGroupControl = computed(
  () => props.width < 440 || groupOptions.value.length > 6,
);
const itemsInLayout = computed(() =>
  props.layout === "grouped"
    ? (groups.value.get(currentGroup.value) ?? [])
    : props.items,
);
const pageSize = computed(() =>
  Math.max(1, Math.floor((props.width - 110) / 112)),
);
const pageCount = computed(() =>
  Math.max(1, Math.ceil(props.items.length / pageSize.value)),
);
const firstOnPage = ref(0);
const page = computed(() =>
  Math.min(pageCount.value - 1, Math.floor(firstOnPage.value / pageSize.value)),
);
function movePage(delta: number) {
  firstOnPage.value =
    Math.max(0, Math.min(page.value + delta, pageCount.value - 1)) *
    pageSize.value;
}
const capacity = computed(() => columns.value * 2);
const hiddenCount = computed(() => {
  if (props.layout === "selected")
    return Math.max(0, visible.value.length - capacity.value + 1);
  return itemsInLayout.value.length > capacity.value
    ? itemsInLayout.value.length - capacity.value + 1
    : 0;
});
const canOpenChooser = computed(
  () =>
    props.layout === "selected" ||
    (hiddenCount.value > 0 && props.layout !== "paged"),
);
const inline = computed(() => {
  if (props.layout === "paged") {
    const start = page.value * pageSize.value;
    return props.items.slice(start, start + pageSize.value);
  }
  if (props.layout === "selected")
    return visible.value.slice(0, capacity.value - 1);
  return hiddenCount.value
    ? itemsInLayout.value.slice(0, capacity.value - 1)
    : itemsInLayout.value;
});
const grid = computed(
  () =>
    props.layout === "paged" ||
    (props.layout !== "selected" && itemsInLayout.value.length > columns.value),
);
const gridColumns = computed(() =>
  props.layout === "paged" ? pageSize.value : columns.value,
);

function toggleInline(key: string, event: MouseEvent) {
  const restoreFocus =
    props.layout === "selected" &&
    document.activeElement === event.currentTarget;
  emit("toggle", key);
  if (restoreFocus) {
    void nextTick(() => {
      if (props.hidden.has(key))
        root.value
          ?.querySelector<HTMLElement>(".hys-chart-legend-chooser")
          ?.focus({ preventScroll: true });
    });
  }
}
</script>

<template>
  <div
    ref="root"
    class="hys-chart-legend"
    :class="{ 'hys-chart-legend-sidebar': layout === 'sidebar' }"
    :data-legend-layout="layout"
    role="group"
    aria-label="图例"
  >
    <template v-if="layout === 'sidebar'">
      <div class="hys-chart-legend-side-heading">
        <strong>图例</strong><span>最新值</span>
      </div>
      <ChartLegendList
        :items="items"
        :hidden="hidden"
        :height="listHeight"
        show-values
        @toggle="emit('toggle', $event)"
      />
    </template>
    <template v-else>
      <div
        v-if="layout === 'grouped' && groupOptions.length > 1"
        class="hys-chart-legend-groups"
        role="group"
        aria-label="图例分组"
      >
        <HysSelect
          v-if="compactGroupControl"
          v-model="currentGroup"
          aria-label="选择图例分组"
          size="sm"
          :options="groupOptions"
          class="hys-chart-legend-group-select"
        />
        <template v-else>
          <HysButton
            v-for="item in groupOptions"
            :key="item.value"
            size="sm"
            variant="ghost"
            class="hys-chart-legend-group"
            :pressed="item.value === currentGroup"
            @click="currentGroup = item.value"
          >
            <span>{{ item.label }}</span>
            <span class="hys-chart-legend-count"
              >{{ item.count }}/{{ item.total }}</span
            >
          </HysButton>
        </template>
      </div>
      <div
        class="hys-chart-legend-row"
        :class="{ 'hys-chart-legend-paged': layout === 'paged' }"
      >
        <div
          class="hys-chart-legend-inline"
          :class="{ 'hys-chart-legend-grid': grid }"
          :style="{ '--hys-chart-legend-columns': gridColumns }"
        >
          <HysTooltip
            v-for="item in inline"
            :key="item.key"
            :text="item.label"
            :show-delay="450"
            :trigger-keys="[]"
            class="hys-chart-legend-slot"
          >
            <ChartLegendButton
              :item="item"
              :visible="!hidden.has(item.key)"
              :stretch="grid"
              :short="layout === 'selected' || layout === 'grouped'"
              :removable="layout === 'selected'"
              @toggle="toggleInline(item.key, $event)"
            />
          </HysTooltip>
          <HysPopover
            v-if="canOpenChooser"
            :key="layout + currentGroup"
            :append-to="false"
            trigger="click"
            placement="bottom-end"
            :width="292"
            max-width="calc(100vw - 24px)"
            :aria-label="layout === 'selected' ? '选择图例系列' : '全部图例'"
            class="hys-chart-legend-more"
            @show="chooserVersion++"
          >
            <template #trigger>
              <HysButton
                size="sm"
                variant="ghost"
                class="hys-chart-legend-chooser"
                :aria-label="
                  layout === 'selected'
                    ? '选择系列'
                    : '更多图例，另有 ' + hiddenCount + ' 项'
                "
              >
                {{ layout === "selected" ? "选择系列" : "更多图例" }}
                <span
                  v-if="hiddenCount"
                  class="hys-chart-legend-count"
                  aria-hidden="true"
                  >+{{ hiddenCount }}</span
                >
              </HysButton>
            </template>
            <ChartLegendList
              :key="chooserVersion"
              :items="itemsInLayout"
              :hidden="hidden"
              @toggle="emit('toggle', $event)"
            />
          </HysPopover>
        </div>
        <div
          v-if="layout === 'paged' && pageCount > 1"
          class="hys-chart-legend-pager"
          role="group"
          aria-label="图例分页"
        >
          <HysButton
            size="sm"
            variant="ghost"
            :icon="ChevronLeft"
            aria-label="上一页图例"
            :disabled="page === 0"
            @click="movePage(-1)"
          />
          <span class="hys-chart-legend-count" aria-live="polite"
            >{{ page + 1 }} / {{ pageCount }}</span
          >
          <HysButton
            size="sm"
            variant="ghost"
            :icon="ChevronRight"
            aria-label="下一页图例"
            :disabled="page === pageCount - 1"
            @click="movePage(1)"
          />
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.hys-chart-legend {
  min-inline-size: 0;
  margin-block-end: 8px;
}
.hys-chart-legend-row {
  min-inline-size: 0;
}
.hys-chart-legend-inline,
.hys-chart-legend-groups {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 6px;
  min-inline-size: 0;
}
.hys-chart-legend-grid {
  display: grid;
  grid-template-columns: repeat(
    var(--hys-chart-legend-columns),
    minmax(0, 1fr)
  );
}
.hys-chart-legend-slot {
  min-inline-size: 0;
  max-inline-size: min(166px, 100%);
}
.hys-chart-legend[data-legend-layout="selected"] .hys-chart-legend-slot {
  max-inline-size: min(106px, 100%);
}
.hys-chart-legend-grid .hys-chart-legend-slot {
  max-inline-size: 100%;
}
.hys-chart-legend-more {
  min-inline-size: 0;
}
.hys-chart-legend-chooser {
  justify-content: flex-start;
  gap: 5px;
  padding-inline: 7px;
  white-space: nowrap;
  font-size: 12px;
}
.hys-chart-legend-grid .hys-chart-legend-chooser {
  inline-size: 100%;
}
.hys-chart-legend-count {
  flex: none;
  color: var(--hys-ui-theme-muted);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.hys-chart-legend-groups {
  gap: 4px;
  padding-block-end: 5px;
  border-block-end: 1px solid var(--hys-ui-theme-border);
  margin-block-end: 5px;
}
.hys-chart-legend-group {
  max-inline-size: 100%;
}
.hys-chart-legend-group > span:first-child {
  min-inline-size: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.hys-chart-legend-group-select {
  inline-size: min(200px, 100%);
}
.hys-chart-legend-paged {
  display: flex;
  align-items: center;
  gap: 6px;
}
.hys-chart-legend-paged .hys-chart-legend-inline {
  flex: 1;
}
.hys-chart-legend-pager {
  display: flex;
  align-items: center;
  gap: 2px;
  flex: none;
}
.hys-chart-legend-pager :deep(.hys-ui-btn) {
  padding-inline: 5px;
  min-inline-size: 26px;
}
.hys-chart-legend-sidebar {
  border: 1px solid var(--hys-ui-theme-border);
  border-radius: 8px;
  padding: 8px;
  margin: 0;
}
.hys-chart-main + .hys-chart-legend-sidebar {
  margin-block-start: 8px;
}
.hys-chart-body-sidebar .hys-chart-legend-sidebar {
  margin-block-start: 0;
}
.hys-chart-legend-side-heading {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 6px;
  margin-block-end: 7px;
  font-size: 12px;
}
.hys-chart-legend-side-heading span {
  color: var(--hys-ui-theme-muted);
}
@media (pointer: coarse) {
  .hys-chart-legend-chooser,
  .hys-chart-legend-group,
  .hys-chart-legend-pager :deep(.hys-ui-btn) {
    min-block-size: 40px;
  }
  .hys-chart-legend-pager :deep(.hys-ui-btn) {
    min-inline-size: 36px;
  }
}
</style>
