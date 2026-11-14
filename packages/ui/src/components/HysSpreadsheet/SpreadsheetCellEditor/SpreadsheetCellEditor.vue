<script setup lang="ts">
import { useSpreadsheetMessages } from "../spreadsheetMessages";
const message = useSpreadsheetMessages();
import { computed, onBeforeUnmount, onMounted, useTemplateRef } from "vue";
import HysAutocomplete from "../../HysAutocomplete/HysAutocomplete.vue";
import HysButton from "../../HysButton/HysButton.vue";
import HysDatePicker from "../../HysDatePicker/HysDatePicker.vue";
import HysInput from "../../HysInput/HysInput.vue";
import HysSelect from "../../HysSelect/HysSelect.vue";
import HysTextarea from "../../HysTextarea/HysTextarea.vue";
import type { HysSpreadsheetCellOptions } from "../spreadsheetTypes";

const props = defineProps<{
  id: string;
  draft: unknown;
  options?: HysSpreadsheetCellOptions;
  errorId?: string;
  disabled?: boolean;
  showActions?: boolean;
}>();
const emit = defineEmits<{
  change: [value: string];
  commit: [restoreFocus?: boolean];
  cancel: [restoreFocus: boolean];
}>();
const text = computed(() => String(props.draft ?? ""));
const initialText = text.value;
const floatingEditor = useTemplateRef<{ $el: HTMLElement; element?: HTMLElement }>("floatingEditor");
const type = computed(() => props.options?.type ?? "auto");
const label = computed(() => props.options?.validation?.prompt ?? message("编辑单元格"));
const multiple = computed(() => type.value === "multiple");
const choices = computed(() =>
  (type.value === "boolean"
    ? ["true", "false"]
    : (props.options?.options ?? [])
  ).map((value) => ({
    label: type.value === "boolean" ? message(value === "true" ? "是" : "否") : value,
    value,
  })),
);
const selected = computed(() =>
  multiple.value ? (text.value ? text.value.split("\n") : []) : text.value,
);
const dateFormat = computed(() =>
  type.value === "date" ? "YYYY-MM-DD" : "YYYY-MM-DD[T]HH:mm:ss",
);
const dateDraft = computed(() => {
  const normalized = text.value.replace(" ", "T");
  return type.value === "datetime-local" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(normalized)
    ? normalized + ":00"
    : type.value === "datetime-local" ? normalized.slice(0, 19) : text.value;
});
const initialDate = dateDraft.value;

function select(value: string | string[] | null | undefined) {
  const draft = Array.isArray(value) ? value.join("\n") : value ?? "";
  emit("change", draft);
  if (!multiple.value && !props.showActions) applyChoice(draft);
}

function applyChoice(value: string) {
  if (value === initialText) emit("cancel", true);
  else emit("commit");
}

function setDateDraft(value: string | null | undefined) {
  emit("change", value === initialDate ? initialText : value ?? "");
}

function commitDate(value: string | null | undefined) {
  if (!props.showActions) applyChoice(value === initialDate ? initialText : value ?? "");
}

function closeDate(visible: boolean) {
  if (!visible && !props.disabled && dateDraft.value === initialDate) {
    const control = ownerDocument?.getElementById(props.id);
    emit("cancel", control === ownerDocument?.activeElement);
  }
}

let ownerDocument: Document | undefined;
function containsEditorTarget(target: Node | null) {
  const control = ownerDocument?.getElementById(props.id);
  if (!control || control.closest(".hys-ui-pro-grid-editor")?.contains(target)) return true;
  const popupId = control.getAttribute("aria-controls");
  const controlled = popupId ? ownerDocument?.getElementById(popupId) : null;
  const popup = controlled?.closest(".hys-ui-select-options, .hys-ui-autocomplete-popup") ?? controlled;
  return !!popup?.contains(target);
}

function leaveFloatingEditor(event: Event) {
  if (props.disabled || containsEditorTarget(event.target as Node | null)) return;
  const changed = text.value !== initialText;
  if (changed && (type.value !== "autocomplete" || props.showActions)) return;
  if (changed) emit("commit", false);
  else emit("cancel", false);
}

onMounted(() => {
  ownerDocument = (floatingEditor.value?.element ?? floatingEditor.value?.$el)?.ownerDocument;
  ownerDocument?.addEventListener("pointerdown", leaveFloatingEditor, true);
  ownerDocument?.addEventListener("focusin", leaveFloatingEditor, true);
  if (type.value === "autocomplete")
    ownerDocument?.defaultView?.addEventListener("keydown", cancelAutocomplete, true);
});
onBeforeUnmount(() => {
  ownerDocument?.removeEventListener("pointerdown", leaveFloatingEditor, true);
  ownerDocument?.removeEventListener("focusin", leaveFloatingEditor, true);
  ownerDocument?.defaultView?.removeEventListener("keydown", cancelAutocomplete, true);
});

function commitMultiline(event: KeyboardEvent) {
  if (event.isComposing || event.keyCode === 229 || !(event.ctrlKey || event.metaKey)) return;
  event.preventDefault();
  event.stopPropagation();
  emit("commit");
}

function commitSuggestion(_option: unknown, value: string) {
  if (!props.showActions) applyChoice(value);
}

function cancelAutocomplete(event: KeyboardEvent) {
  if (type.value !== "autocomplete" || event.key !== "Escape" ||
      event.isComposing || event.keyCode === 229 || props.disabled) return;
  if (!containsEditorTarget(event.target as Node | null)) return;
  event.preventDefault();
  event.stopPropagation();
  emit("cancel", true);
}
</script>

<template>
  <HysTextarea
    v-if="type === 'multiline'"
    :id="props.id"
    class="hys-ui-pro-grid-control"
    :model-value="text"
    size="sm"
    :bordered="false"
    :disabled="disabled"
    :aria-describedby="errorId"
    :rows="2"
    :aria-label="message('编辑多行文本')"
    @update:model-value="emit('change', $event)"
    @press-enter="commitMultiline"
  />
  <HysSelect
    v-else-if="type === 'multiple' || type === 'select' || type === 'boolean'"
    ref="floatingEditor"
    :id="props.id"
    class="hys-ui-pro-grid-control"
    size="sm"
    :bordered="false"
    :native-label-tooltip="false"
    :multiple="multiple"
    :model-value="selected"
    :options="choices"
    :placeholder="message('请选择')"
    clearable
    :disabled="disabled"
    :aria-label="type === 'boolean' ? message('编辑布尔值') : message('选择单元格选项')"
    :aria-describedby="errorId"
    @update:model-value="select"
  >
    <template v-if="multiple && !showActions" #footer>
      <HysButton size="sm" variant="primary" :disabled="disabled" @click="applyChoice(text)">
        {{ message("应用多选") }}
      </HysButton>
    </template>
  </HysSelect>
  <HysAutocomplete
    v-else-if="type === 'autocomplete'"
    ref="floatingEditor"
    :id="props.id"
    class="hys-ui-pro-grid-control"
    size="sm"
    :bordered="false"
    :disabled="disabled"
    :model-value="text"
    :options="options?.options ?? []"
    :placeholder="options?.validation?.prompt"
    :aria-label="label"
    :aria-describedby="errorId"
    data-pro-grid-input
    @update:model-value="emit('change', $event)"
    @select="commitSuggestion"
  />
  <HysDatePicker
    v-else-if="type === 'date' || type === 'datetime-local'"
    ref="floatingEditor"
    :id="props.id"
    class="hys-ui-pro-grid-control"
    size="sm"
    default-open
    clearable
    show-seconds
    :bordered="false"
    :disabled="disabled"
    :type="type === 'date' ? 'date' : 'datetime'"
    :model-value="dateDraft"
    :value-format="dateFormat"
    :format="dateFormat"
    :placeholder="options?.validation?.prompt ?? (type === 'date' ? 'YYYY-MM-DD' : 'YYYY-MM-DDTHH:mm:ss')"
    :aria-label="type === 'date' ? message('选择日期') : message('选择日期与时间')"
    :aria-describedby="errorId"
    @update:model-value="setDateDraft"
    @change="commitDate"
    @visible-change="closeDate"
  />
  <HysInput
    v-else
    :id="props.id"
    class="hys-ui-pro-grid-control"
    size="sm"
    :bordered="false"
    :inputmode="
      ['number', 'currency', 'percent'].includes(type) ? 'decimal' : undefined
    "
    :model-value="text"
    :placeholder="options?.validation?.prompt ?? (type === 'time' ? 'HH:mm:ss' : undefined)"
    :disabled="disabled"
    :aria-label="type === 'time' ? message('编辑时间') : label"
    :aria-describedby="errorId"
    data-pro-grid-input
    @update:model-value="emit('change', $event)"
  />
</template>
