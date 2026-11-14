<script setup lang="ts">
import { nextTick, ref, useTemplateRef, watch } from "vue";
import { Ellipsis, Minimize } from "lucide-vue-next";
import HysModal from "../../HysModal/HysModal.vue";
import HysPopover from "../../HysPopover/HysPopover.vue";
import SpreadsheetToolbarButton from "../SpreadsheetToolbarButton/SpreadsheetToolbarButton.vue";
import { useSpreadsheetMessages } from "../spreadsheetMessages";
import {
  isFormatPanel,
  type FormatAction,
} from "../SpreadsheetToolbar/formatTools";
import type {
  ToolbarAction,
  ToolbarPanel,
  ToolbarTool,
} from "../SpreadsheetToolbar/toolbarTools";
import type { HysSpreadsheetCellFormat } from "../spreadsheetTypes";

const message = useSpreadsheetMessages();
const props = defineProps<{
  triggerId: string;
  idPrefix: string;
  direct: readonly ToolbarTool[];
  overflow: readonly ToolbarTool[];
  extraInMenu: boolean;
  inlineWidth: (key: string) => number | undefined;
  actionDisabled: (action: ToolbarAction) => boolean;
  measure: () => void;
  fullscreen: boolean;
  active?: string;
  format?: HysSpreadsheetCellFormat | null;
  canFormat: boolean;
}>();
const emit = defineEmits<{
  select: [group: ToolbarPanel, focus: boolean];
  action: [action: ToolbarAction];
  format: [format: HysSpreadsheetCellFormat];
  search: [];
}>();
const trigger =
  useTemplateRef<InstanceType<typeof SpreadsheetToolbarButton>>("trigger");
const menuOpen = ref(false);
const dialogOpen = ref(false);
const searchEngaged = ref(false);
const initialFocus = ref("input[data-hys-find-input]");
let restoreTarget: HTMLElement | undefined;
let restoreDirect = false;
let restoringAction = false;
const directButtons = new Map<
  string,
  InstanceType<typeof SpreadsheetToolbarButton>
>();
watch(
  () => props.overflow.length > 0 || props.extraInMenu,
  (hasOverflow) => {
    if (hasOverflow) return;
    menuOpen.value = false;
    if (restoringAction) return;
    const focused = document.activeElement;
    if (
      focused?.id === props.triggerId ||
      focused
        ?.closest('[role="dialog"]')
        ?.contains(document.getElementById(`${props.idPrefix}-extra`))
    )
      void nextTick(() => {
        for (const [key, button] of [...directButtons].reverse()) {
          const tool = props.direct.find(({ id }) => id === key);
          if (!tool || disabled(tool)) continue;
          button.restoreFocus();
          break;
        }
      });
  },
);

async function show(field: "find" | "replace" = "find", restore?: HTMLElement) {
  if (!dialogOpen.value) restoreTarget = restore;
  searchEngaged.value = true;
  menuOpen.value = false;
  initialFocus.value = `input[data-hys-${field}-input]`;
  emit("search");
  await nextTick();
  if (dialogOpen.value) {
    dialog.value?.element
      ?.querySelector<HTMLInputElement>(initialFocus.value)
      ?.focus();
    return;
  }
  dialogOpen.value = true;
}

function isAction(item: ToolbarTool): item is FormatAction {
  return "toggle" in item || "format" in item;
}

function isCommand(item: ToolbarTool) {
  return !isAction(item) && !("action" in item);
}

function disabled(item: ToolbarTool) {
  return "action" in item
    ? props.actionDisabled(item.id)
    : (isAction(item) || isFormatPanel(item.id)) && !props.canFormat;
}

function label(item: ToolbarTool) {
  return message(
    item.id === "fullscreen" && props.fullscreen ? "退出全屏" : item.label,
  );
}

function formatPressed(item: FormatAction) {
  if (!props.canFormat) return false;
  if ("toggle" in item) return !!props.format?.[item.toggle];
  if ("align" in item.format) return props.format?.align === item.format.align;
  if ("overflow" in item.format)
    return props.format?.overflow === item.format.overflow;
  return (
    (props.format?.verticalAlign ?? "middle") === item.format.verticalAlign
  );
}

function actionFormat(item: FormatAction): HysSpreadsheetCellFormat {
  if ("toggle" in item) return { [item.toggle]: !props.format?.[item.toggle] };
  if (item.id === "wrap" && formatPressed(item)) return { overflow: undefined };
  return item.format;
}

async function choose(item: ToolbarTool, direct = false, event?: MouseEvent) {
  if (disabled(item)) return;
  if ("action" in item) {
    restoringAction = !direct;
    menuOpen.value = false;
    emit("action", item.id);
    if (!direct) {
      await nextTick();
      if (item.id === "fullscreen") props.measure();
      await nextTick();
      (directButtons.get(item.id) ?? trigger.value)?.restoreFocus();
      restoringAction = false;
    }
    return;
  }
  if (isAction(item)) {
    menuOpen.value = false;
    if (props.canFormat) emit("format", actionFormat(item));
    if (!direct) await nextTick(() => trigger.value?.restoreFocus());
    return;
  }
  const group = item.id;
  if (group === "search") {
    restoreDirect = direct;
    await show();
    return;
  }
  menuOpen.value = false;
  await nextTick();
  emit("select", group, !direct || event?.detail === 0);
}

const dialog = useTemplateRef<InstanceType<typeof HysModal>>("dialog");
function restoreFocus(event: Event) {
  event.preventDefault();
  const focused = document.activeElement;
  if (
    focused === document.body ||
    !focused ||
    dialog.value?.element?.contains(focused)
  ) {
    if (restoreTarget?.isConnected)
      restoreTarget.focus({ preventScroll: true });
    else
      (restoreDirect
        ? (directButtons.get("search") ?? trigger.value)
        : (trigger.value ?? directButtons.get("search"))
      )?.restoreFocus();
  }
  restoreTarget = undefined;
  restoreDirect = false;
}

defineExpose({ show });
</script>

<template>
  <template v-for="item in direct" :key="item.id">
    <div
      v-if="inlineWidth(item.id)"
      class="toolbar-inline-control"
      :data-toolbar-tool="item.id"
      :style="{ inlineSize: `${inlineWidth(item.id)}px` }"
    >
      <slot name="inline" :item="item" />
    </div>
    <SpreadsheetToolbarButton
      v-else
      :id="`${idPrefix}-${item.id}-button`"
      :data-toolbar-tool="item.id"
      :ref="
        (button) =>
          button
            ? directButtons.set(
                item.id,
                button as InstanceType<typeof SpreadsheetToolbarButton>,
              )
            : directButtons.delete(item.id)
      "
      :icon="item.id === 'fullscreen' && fullscreen ? Minimize : item.icon"
      :label="label(item)"
      :pressed="
        isAction(item)
          ? formatPressed(item)
          : item.id === 'fullscreen'
            ? fullscreen
            : isCommand(item)
              ? active === item.id || (item.id === 'search' && dialogOpen)
              : undefined
      "
      :disabled="disabled(item)"
      :aria-expanded="
        !isCommand(item)
          ? undefined
          : item.id === 'search'
            ? dialogOpen
            : active === item.id
      "
      :aria-controls="
        !isCommand(item) || item.id === 'search'
          ? undefined
          : `${idPrefix}-${item.id}`
      "
      :aria-haspopup="isCommand(item) ? 'dialog' : undefined"
      @click="choose(item, true, $event)"
    />
  </template>
  <HysPopover
    v-show="overflow.length || extraInMenu"
    force-render
    class="toolbar-more"
    v-model:open="menuOpen"
    trigger="click"
    placement="bottom-start"
    :aria-label="message('更多操作')"
    :max-width="240"
    max-height="min(300px, 60dvh)"
    :content-style="{ padding: '8px' }"
  >
    <template #trigger>
      <SpreadsheetToolbarButton
        ref="trigger"
        :id="triggerId"
        :label="message('更多操作')"
        :icon="Ellipsis"
        :pressed="menuOpen"
        fluid
        :tooltip="!menuOpen && !searchEngaged"
      />
    </template>
    <div class="command-menu" role="group" :aria-label="message('操作分类')">
      <SpreadsheetToolbarButton
        v-for="item in overflow"
        :key="item.id"
        :icon="item.id === 'fullscreen' && fullscreen ? Minimize : item.icon"
        :label="label(item)"
        :aria-haspopup="isCommand(item) ? 'dialog' : undefined"
        :disabled="disabled(item)"
        :pressed="isAction(item) ? formatPressed(item) : undefined"
        @click="choose(item)"
      />
    </div>
    <div
      :id="`${idPrefix}-extra`"
      v-show="extraInMenu"
      class="command-menu-extra"
    />
  </HysPopover>
  <HysModal
    ref="dialog"
    v-model:open="dialogOpen"
    :title="message('查找与替换')"
    :close-text="message('关闭')"
    header-size="sm"
    drag-handle-position="left"
    :body-style="{ padding: '12px 16px 16px' }"
    :footer="false"
    :modal="false"
    modal-penetrable
    :close-on-mask="false"
    draggable
    drag-mode="preview"
    :destroy-on-close="false"
    :initial-focus="initialFocus"
    :width="500"
    :z-index="1102"
    @close-auto-focus="restoreFocus"
    @closed="searchEngaged = false"
  >
    <slot />
  </HysModal>
</template>

<style scoped>
.toolbar-inline-control {
  flex: none;
}
.toolbar-more {
  flex: none;
  inline-size: min(30px, 100%);
}
.command-menu {
  display: grid;
  grid-template-columns: repeat(auto-fill, 30px);
  gap: 4px;
}
.command-menu-extra {
  margin-block-start: 4px;
  min-inline-size: 0;
}
</style>
