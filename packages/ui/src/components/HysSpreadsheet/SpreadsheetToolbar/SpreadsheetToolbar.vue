<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  useId,
  useTemplateRef,
  watch,
} from "vue";
import { ChevronDown, ChevronUp, X } from "lucide-vue-next";
import SpreadsheetToolbarButton from "../SpreadsheetToolbarButton/SpreadsheetToolbarButton.vue";
import HysPopover from "../../HysPopover/HysPopover.vue";
import { useSpreadsheetMessages } from "../spreadsheetMessages";
import { colorPanels, isFormatPanel } from "./formatTools";
import {
  builtinPanels,
  quickActions,
  toolbarButtonWidth,
  toolbarLayout,
  toolbarPanels,
  toolbarTools,
  type ToolbarPanel,
} from "./toolbarTools";

const props = defineProps<{ custom?: boolean; settingsAddress?: string }>();
const message = useSpreadsheetMessages();
const id = useId();
const root = useTemplateRef<HTMLElement>("root");
const row = useTemplateRef<HTMLElement>("row");
const extra = useTemplateRef<HTMLElement>("extra");
const layoutWidth = ref<number>();
const active = ref<ToolbarPanel>();
const triggerId = `${id}-commands-button`;
const available = ref(0);
const extraInMenu = ref(false);
const expanded = ref(false);
const toggleWidth = ref(0);
let extraWidth = 0;
let resize: ResizeObserver | undefined;

const tools = computed(() =>
  toolbarTools.filter(
    (tool) =>
      !props.custom ||
      (tool.id !== "workbook" &&
        !("action" in tool) &&
        !isFormatPanel(tool.id) &&
        !("format" in tool || "toggle" in tool)),
  ),
);
const inlineWidths = {
  "number-format": 94,
  "font-family": 116,
  "font-size": 48,
} as const;
const inlineControls = computed(
  () => layoutWidth.value === undefined || layoutWidth.value >= 420,
);
const inlineFonts = computed(() => (layoutWidth.value ?? 0) >= 740);
const builtin = (panel: string) => builtinPanels.some(({ id }) => id === panel);
const directCommands = computed(() =>
  layoutWidth.value === undefined
    ? tools.value.filter(
        ({ id }) =>
          (id !== "comments" && id !== "sheet-transition" && builtin(id)) ||
          quickActions.some((tool) => tool.id === id) ||
          id === "number-format" ||
          id === "fullscreen" ||
          colorPanels.some((tool) => tool.id === id),
      )
    : tools.value.slice(0, available.value),
);
const overflowCommands = computed(() =>
  tools.value.filter((tool) => !directCommands.value.includes(tool)),
);
const selectedPanel = computed(() =>
  toolbarPanels.find(({ id }) => id === active.value),
);

function inlineWidth(key: string) {
  if (key === "number-format" && inlineControls.value) return inlineWidths[key];
  if ((key === "font-family" || key === "font-size") && inlineFonts.value)
    return inlineWidths[key];
}
const width = computed(() =>
  active.value === "workbook"
    ? 260
    : active.value === "sheet-transition"
      ? 228
      : active.value === "settings"
        ? 720
        : active.value && isFormatPanel(active.value)
          ? 284
          : active.value === "comments" || active.value === "history"
            ? 410
            : 460,
);

function triggerFor(panel: ToolbarPanel) {
  return directCommands.value.some(({ id }) => id === panel)
    ? `${id}-${panel}-button`
    : triggerId;
}

const reference = shallowRef<HTMLElement>();
watch(
  () => (active.value ? triggerFor(active.value) : undefined),
  (id) => {
    reference.value = id
      ? (root.value?.ownerDocument.getElementById(id) ?? undefined)
      : undefined;
  },
  { flush: "post" },
);

function measure() {
  const track = row.value;
  if (!track) return;
  const styles = getComputedStyle(track);
  const width = Number.parseFloat(styles.width) || track.clientWidth;
  if (!width) return;
  layoutWidth.value = width;
  const gap = Number.parseFloat(styles.columnGap) || 0;
  if (extra.value && !extraInMenu.value) {
    const measured = Number.parseFloat(getComputedStyle(extra.value).width);
    if (Number.isFinite(measured)) extraWidth = measured;
  }
  const sizes = tools.value.map(
    ({ id }) => inlineWidth(id) ?? toolbarButtonWidth,
  );
  const compact = toolbarLayout(width, gap, sizes, extraWidth, 1);
  const canExpand = compact.count < sizes.length || compact.extraInMenu;
  const control = canExpand
    ? Math.max(0, Math.min(toolbarButtonWidth, (width - gap) / 2))
    : 0;
  const layout = canExpand
    ? toolbarLayout(
        width - control - gap,
        gap,
        sizes,
        extraWidth,
        expanded.value ? 2 : 1,
      )
    : compact;
  if (!canExpand) expanded.value = false;
  toggleWidth.value = control;
  const focused = track.ownerDocument.activeElement;
  const lostToggle = !canExpand && focused?.id === `${id}-toolbar-toggle`;
  const lostExtra =
    layout.extraInMenu && !extraInMenu.value && extra.value?.contains(focused);
  const focusedItem = focused?.closest<HTMLElement>("[data-toolbar-tool]")
    ?.dataset.toolbarTool;
  const lostItem =
    focusedItem &&
    directCommands.value.some(({ id }) => id === focusedItem) &&
    !tools.value.slice(0, layout.count).some(({ id }) => id === focusedItem);
  available.value = layout.count;
  extraInMenu.value = layout.extraInMenu;
  if (lostItem || lostExtra) void nextTick(() => focus(triggerId));
  if (lostToggle)
    void nextTick(() => {
      track
        .querySelector<HTMLElement>(
          "button:not([disabled]), input:not([disabled])",
        )
        ?.focus({ preventScroll: true });
    });
}

function toggleRows() {
  expanded.value = !expanded.value;
  measure();
}
onMounted(() => {
  measure();
  if (typeof ResizeObserver === "undefined") return;
  resize = new ResizeObserver(measure);
  if (row.value) resize.observe(row.value);
  if (extra.value) resize.observe(extra.value);
});
watch(extra, (element, previous) => {
  if (previous) resize?.unobserve(previous);
  if (element) resize?.observe(element);
  else extraWidth = 0;
  measure();
});
onBeforeUnmount(() => resize?.disconnect());

function focus(id: string) {
  root.value?.ownerDocument.getElementById(id)?.focus({ preventScroll: true });
}

let focusOnOpen = false;
function showCommand(group: ToolbarPanel, moveFocus = true) {
  focusOnOpen = moveFocus;
  active.value = active.value === group ? undefined : group;
}

async function opened() {
  const target = active.value;
  if (!target || !focusOnOpen) return;
  await nextTick();
  if (active.value === target) focus(`${id}-${target}`);
}

function close(restore = true) {
  if (!active.value) return;
  const button = triggerFor(active.value);
  active.value = undefined;
  if (restore) focus(button);
}

function escape(event: KeyboardEvent) {
  if (!active.value || event.defaultPrevented) return;
  event.stopPropagation();
  close();
}

watch(
  () =>
    active.value &&
    inlineWidth(active.value) &&
    directCommands.value.some(({ id }) => id === active.value),
  (inline) => {
    if (inline) close(false);
  },
);
watch(
  () => props.custom,
  (custom) => {
    if (custom && active.value === "workbook") active.value = undefined;
    void nextTick(measure);
  },
);
defineExpose({
  close,
  showCommand,
  focusCommand: (panel: ToolbarPanel) => focus(triggerFor(panel)),
});
</script>

<template>
  <div
    ref="root"
    class="hys-ui-spreadsheet-toolbar"
    role="group"
    :aria-label="message('工作簿工具栏')"
    @keydown.esc="escape"
  >
    <div
      class="toolbar-track"
      :style="{ '--toolbar-toggle-width': toggleWidth + 'px' }"
    >
      <div
        :id="`${id}-toolbar-commands`"
        ref="row"
        class="toolbar-row"
        :class="{
          'toolbar-row-expanded': expanded,
          'toolbar-row-with-toggle': toggleWidth > 0,
        }"
      >
        <slot
          name="commands"
          :trigger-id="triggerId"
          :id-prefix="id"
          :active="active"
          :direct="directCommands"
          :overflow="overflowCommands"
          :inline-width="inlineWidth"
          :extra-in-menu="extraInMenu"
          :measure="measure"
        />
        <Teleport
          v-if="$slots.extra"
          defer
          :to="`#${id}-extra`"
          :disabled="!extraInMenu"
        >
          <div
            ref="extra"
            class="toolbar-extra"
            :class="{ 'toolbar-extra-in-menu': extraInMenu }"
          >
            <slot name="extra" />
          </div>
        </Teleport>
      </div>
      <div v-if="toggleWidth > 0" class="toolbar-row-toggle">
        <SpreadsheetToolbarButton
          :id="`${id}-toolbar-toggle`"
          :icon="expanded ? ChevronUp : ChevronDown"
          :label="message(expanded ? '收起工具栏' : '展开工具栏')"
          :aria-expanded="expanded"
          :aria-controls="`${id}-toolbar-commands`"
          fluid
          @click="toggleRows"
        />
      </div>
    </div>
    <HysPopover
      :open="!!active"
      :reference="reference"
      trigger="manual"
      placement="bottom-start"
      :width="width"
      :max-width="width"
      :max-height="
        active === 'settings' ? 'min(640px, 75dvh)' : 'min(470px, 70dvh)'
      "
      :destroy-on-hide="false"
      :force-render="true"
      :aria-label="selectedPanel && message(selectedPanel.label)"
      class="toolbar-popover-anchor"
      @update:open="!$event && close(false)"
      @opened="opened"
    >
      <div
        v-for="{ id: panel, label } in toolbarPanels"
        :key="panel"
        v-show="active === panel"
        :id="`${id}-${panel}`"
        class="hys-ui-spreadsheet-toolbar-panel"
        :class="{
          'command-panel-container': [
            'edit',
            'axes',
            'data',
            'format',
          ].includes(panel),
        }"
        role="region"
        :aria-label="message(label)"
        tabindex="-1"
        @keydown.esc="escape"
      >
        <div v-if="panel !== 'workbook'" class="panel-heading">
          <div class="panel-title">
            <strong>{{ message(label) }}</strong>
            <span
              v-if="panel === 'settings' && settingsAddress"
              class="settings-address"
              role="note"
              :aria-label="message('当前选区') + ' ' + settingsAddress"
              >{{ settingsAddress }}</span
            >
          </div>
          <SpreadsheetToolbarButton
            :icon="X"
            :label="message('收起面板')"
            @click="close()"
          />
        </div>
        <slot v-if="builtin(panel) || panel === 'history'" :name="panel" />
        <slot
          v-else-if="active === panel"
          name="command-panel"
          :group="panel"
        />
      </div>
    </HysPopover>
  </div>
</template>

<style scoped>
.hys-ui-spreadsheet-toolbar {
  container: spreadsheet-toolbar / inline-size;
  min-width: 0;
  padding: 6px min(8px, 4%);
  background: var(--hys-ui-theme-surface-alt);
  border-radius: 9px 9px 0 0;
}
.toolbar-row {
  display: flex;
  box-sizing: border-box;
  inline-size: 100%;
  flex-wrap: nowrap;
  justify-content: flex-start;
  align-items: center;
  gap: 6px 4px;
  min-inline-size: 0;
}
.toolbar-track {
  position: relative;
}
.toolbar-row-with-toggle {
  padding-inline-end: calc(var(--toolbar-toggle-width) + 4px);
}
.toolbar-row-expanded {
  flex-wrap: wrap;
}
.toolbar-row-toggle {
  position: absolute;
  inset-block-start: 0;
  inset-inline-end: 0;
  inline-size: var(--toolbar-toggle-width);
}
.toolbar-extra {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: none;
  inline-size: max-content;
}
.toolbar-extra-in-menu {
  max-inline-size: 100%;
  flex-wrap: wrap;
  overflow-wrap: anywhere;
}
.toolbar-popover-anchor {
  position: absolute;
  inline-size: 0;
  block-size: 0;
}
.toolbar-trigger[aria-expanded="true"] {
  color: var(--hys-ui-theme-primary);
  background: var(--hys-ui-theme-primary-soft);
  border-color: var(--hys-ui-theme-border);
}
.panel-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-block-end: 10px;
  padding-block-end: 6px;
  border-block-end: 1px solid var(--hys-ui-theme-border);
  color: var(--hys-ui-theme-text);
  font-size: 13px;
}
.panel-title {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 8px;
  min-inline-size: 0;
}
.command-panel-container .panel-heading {
  font-size: 15px;
  margin-block-end: 12px;
}
.settings-address {
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--hys-ui-theme-primary-soft);
  color: var(--hys-ui-theme-primary);
  font-variant-numeric: tabular-nums;
}
.hys-ui-spreadsheet-toolbar-panel {
  overflow-wrap: anywhere;
}
.command-panel-container {
  container: spreadsheet-command-panel / inline-size;
}
.hys-ui-spreadsheet-toolbar-panel:focus-visible {
  outline: 2px solid var(--hys-ui-theme-primary);
  outline-offset: -2px;
}
</style>
