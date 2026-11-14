<script setup lang="ts">
import { computed, nextTick, ref, useTemplateRef } from "vue";
import {
  ArrowLeft,
  ArrowRight,
  Copy,
  Eye,
  EyeOff,
  LockKeyhole,
  LockKeyholeOpen,
  Palette,
  Pencil,
  Plus,
  Trash2,
} from "lucide-vue-next";
import HysColorPicker from "../../HysColorPicker/HysColorPicker.vue";
import HysContextMenu from "../../HysContextMenu/HysContextMenu.vue";
import HysInput from "../../HysInput/HysInput.vue";
import HysModal from "../../HysModal/HysModal.vue";
import type {
  HysContextMenuInstance,
  HysContextMenuItem,
  HysMenuKey,
} from "../../../composables/menu";
import { useSpreadsheetMessages } from "../spreadsheetMessages";
import { sameSheetName, sheetLimits } from "../spreadsheetModel";
import type {
  HysSpreadsheetSheet,
  HysSpreadsheetSheetCommand,
} from "../spreadsheetTypes";

const props = defineProps<{
  sheets: readonly HysSpreadsheetSheet[];
  disabled: boolean;
  command: (command: HysSpreadsheetSheetCommand) => boolean;
}>();
const emit = defineEmits<{ focusTab: [id?: string] }>();
const message = useSpreadsheetMessages();
const menu = useTemplateRef<HysContextMenuInstance>("menu");
const modal = useTemplateRef<InstanceType<typeof HysModal>>("modal");
const sheetId = ref("");
const sheet = computed(() =>
  props.sheets.find(({ id, hidden }) => id === sheetId.value && !hidden),
);
const visible = computed(() => props.sheets.filter(({ hidden }) => !hidden));
const visibleIndex = computed(() =>
  visible.value.findIndex(({ id }) => id === sheetId.value),
);
const full = computed(() => props.sheets.length >= sheetLimits.sheets);
const hiddenSheets = computed(() =>
  props.sheets
    .filter(({ hidden }) => hidden)
    .map(({ id, name }) => ({ value: `show:${id}`, label: name })),
);
const actions = computed<HysContextMenuItem[]>(() => {
  const target = sheet.value;
  if (!target) return [];
  const lastVisible = visible.value.length <= 1;
  return [
    {
      label: message("新建工作表"),
      value: "add",
      icon: Plus,
      disabled: full.value,
    },
    { label: message("重命名"), value: "rename", icon: Pencil },
    {
      label: message("复制工作表"),
      value: "duplicate",
      icon: Copy,
      disabled: full.value,
    },
    {
      label: message("左移"),
      value: "left",
      icon: ArrowLeft,
      disabled: visibleIndex.value <= 0,
    },
    {
      label: message("右移"),
      value: "right",
      icon: ArrowRight,
      disabled: visibleIndex.value >= visible.value.length - 1,
    },
    { label: "", type: "divider", value: "display" },
    { label: message("标签颜色"), value: "color", icon: Palette },
    {
      label: message("清除标签颜色"),
      value: "clear-color",
      disabled: !target.tabColor,
    },
    {
      label: message("隐藏工作表"),
      value: "hide",
      icon: EyeOff,
      disabled: lastVisible,
    },
    {
      label: message("取消隐藏"),
      value: "show",
      icon: Eye,
      children: hiddenSheets.value,
      disabled: !hiddenSheets.value.length,
    },
    {
      label: message(target.protected ? "取消保护" : "保护工作表"),
      value: "protect",
      icon: target.protected ? LockKeyholeOpen : LockKeyhole,
    },
    { label: "", type: "divider", value: "remove" },
    {
      label: message("删除工作表"),
      value: "delete",
      icon: Trash2,
      danger: true,
      disabled: lastVisible,
    },
  ];
});

const dialog = ref<"rename" | "color" | "delete">();
const dialogOpen = ref(false);
let restoreDeleteTrigger: (() => void) | undefined;
const name = ref("");
const color = ref("");
const nameError = computed(() => {
  const candidate = name.value.trim();
  return candidate &&
    props.sheets.some(
      (item) =>
        item.id !== sheetId.value && sameSheetName(item.name, candidate),
    )
    ? message("请输入唯一的工作表名称。")
    : "";
});
const dialogTitle = computed(() =>
  message(
    dialog.value === "rename"
      ? "重命名工作表"
      : dialog.value === "color"
        ? "标签颜色"
        : "删除工作表",
  ),
);
const confirmDisabled = computed(
  () =>
    props.disabled ||
    !sheet.value ||
    (dialog.value === "rename" && (!name.value.trim() || !!nameError.value)) ||
    (dialog.value === "delete" && visible.value.length <= 1),
);

async function show(
  id: string,
  event: MouseEvent | KeyboardEvent | PointerEvent,
) {
  if (props.disabled || dialogOpen.value) return;
  const tab =
    event.target instanceof Element
      ? event.target.closest<HTMLElement>('[role="tab"]')
      : undefined;
  if (!tab) return;
  event.preventDefault();
  sheetId.value = id;
  tab.focus({ preventScroll: true });
  const bounds = tab.getBoundingClientRect();
  const pointer =
    event instanceof MouseEvent && (event.clientX || event.clientY);
  await nextTick();
  await menu.value?.showAt(
    pointer ? event.clientX : bounds.left,
    pointer ? event.clientY : bounds.bottom,
  );
}

async function select(value: HysMenuKey) {
  const target = sheet.value;
  if (props.disabled || !target || typeof value !== "string") return;
  const id = target.id;
  if (value === "rename" || value === "color" || value === "delete") {
    name.value = target.name;
    color.value = target.tabColor ?? "#4468c8";
    await menu.value?.hide(true);
    if (sheetId.value !== id || !sheet.value || props.disabled) return;
    if (value === "delete") {
      requestDelete(id);
      return;
    }
    dialog.value = value;
    dialogOpen.value = true;
    return;
  }
  if (value === "add") props.command({ type: "add" });
  else if (value === "duplicate") props.command({ type: "duplicate", id });
  else if (value === "hide")
    props.command({ type: "visibility", id, hidden: true });
  else if (value === "protect")
    props.command({ type: "protect", id, protected: !target.protected });
  else if (value === "clear-color") props.command({ type: "color", id });
  else if (value === "left" || value === "right") {
    const neighbor =
      visible.value[visibleIndex.value + (value === "left" ? -1 : 1)];
    if (neighbor)
      props.command({
        type: "move",
        id,
        index: props.sheets.indexOf(neighbor),
      });
  } else if (value.startsWith("show:"))
    props.command({ type: "visibility", id: value.slice(5), hidden: false });
  await menu.value?.hide();
  emit("focusTab", value === "add" || value === "duplicate" ? undefined : id);
}

function requestDelete(id: string, restore?: () => void) {
  if (
    props.disabled ||
    dialogOpen.value ||
    visible.value.length <= 1 ||
    !visible.value.some((item) => item.id === id)
  )
    return;
  sheetId.value = id;
  restoreDeleteTrigger = restore;
  dialog.value = "delete";
  dialogOpen.value = true;
}

function confirm() {
  const target = sheet.value;
  if (confirmDisabled.value || !target) return false;
  const id = target.id;
  if (dialog.value === "rename")
    return (
      name.value.trim() === target.name ||
      props.command({ type: "rename", id, name: name.value })
    );
  if (dialog.value === "color")
    return (
      color.value === target.tabColor ||
      props.command({ type: "color", id, color: color.value })
    );
  return props.command({ type: "delete", id });
}

function restoreFocus(event: Event) {
  event.preventDefault();
  const restore = restoreDeleteTrigger;
  restoreDeleteTrigger = undefined;
  if (restore) restore();
  else emit("focusTab", sheetId.value);
}

defineExpose({ show, requestDelete });
</script>

<template>
  <HysContextMenu
    ref="menu"
    style="display: none"
    :trigger="[]"
    :items="actions"
    :disabled="disabled"
    :hide-on-click="false"
    :aria-label="message('工作表标签操作')"
    size="sm"
    @select="select"
  />
  <HysModal
    ref="modal"
    v-model:open="dialogOpen"
    :title="dialogTitle"
    :width="dialog === 'color' ? 332 : 380"
    :z-index="1102"
    header-size="sm"
    footer-size="sm"
    footer
    :ok-text="message(dialog === 'delete' ? '删除' : '确定')"
    :cancel-text="message('取消')"
    :close-text="message('关闭')"
    :initial-focus="
      dialog === 'rename'
        ? 'input'
        : dialog === 'delete'
          ? '[data-hys-modal-cancel]'
          : 'auto'
    "
    :confirm-disabled="confirmDisabled"
    :before-confirm="confirm"
    :ok-variant="dialog === 'delete' ? 'danger' : 'primary'"
    :close-on-mask="false"
    draggable
    drag-mode="preview"
    @close-auto-focus="restoreFocus"
  >
    <HysInput
      v-if="dialog === 'rename'"
      v-model="name"
      size="sm"
      :aria-label="message('工作表名称')"
      :placeholder="message('工作表名称')"
      :error="nameError"
      @press-enter="modal?.confirm($event)"
    />
    <HysColorPicker
      v-else-if="dialog === 'color'"
      v-model="color"
      inline
      :show-footer="false"
      :aria-label="message('标签颜色')"
    />
    <p v-else-if="sheet" class="delete-message">
      {{
        message("确定删除工作表「{name}」吗？").replace("{name}", sheet.name)
      }}
    </p>
  </HysModal>
</template>

<style scoped>
.delete-message {
  margin: 0;
  overflow-wrap: anywhere;
}
</style>
