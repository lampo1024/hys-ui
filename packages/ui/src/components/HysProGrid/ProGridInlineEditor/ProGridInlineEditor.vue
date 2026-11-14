<script setup lang="ts" generic="T extends object">
import { computed, onMounted, shallowRef, useTemplateRef, watch } from "vue";
import { Check, RotateCcw, X } from "lucide-vue-next";
import HysButton from "../../HysButton/HysButton.vue";
import HysInput from "../../HysInput/HysInput.vue";
import HysSelect from "../../HysSelect/HysSelect.vue";
import { useHysRootAttrs } from "../../../config";
import { useFloating } from "../../../composables/useFloating";
import type {
  HysProGridEditor,
  HysProGridEditorScope,
  HysProGridMessages,
} from "../proGridTypes";

const props = defineProps<{
  scope: HysProGridEditorScope<T>;
  editor: HysProGridEditor<T>;
  words: HysProGridMessages;
  showActions: boolean;
  commitOnBlur: boolean;
  commitFromBlur: () => Promise<boolean>;
  commitAndMove: (
    origin: HTMLTableCellElement,
    backwards: boolean,
  ) => Promise<boolean>;
}>();
defineSlots<{ custom?: (scope: HysProGridEditorScope<T>) => unknown }>();

const area = useTemplateRef<HTMLElement>("area");
const feedback = shallowRef<HTMLElement>();
const attrs = useHysRootAttrs();
const cell = computed(() => area.value?.closest("td") ?? undefined);
const { open, style, show, close } = useFloating(cell, feedback, {
  placement: "bottom-start",
  gap: 6,
  closeOnEscape: false,
  closeOnOutside: false,
  closeOnTab: false,
});
const busy = computed(() => props.scope.phase !== "editing");
const message = computed(() => {
  if (props.scope.error) return props.scope.error.message;
  if (busy.value)
    return props.scope.phase === "validating"
      ? props.words.validating
      : props.words.saving;
});
const activeChoice = computed(() => {
  const { editor, scope } = props;
  if (editor.type !== "select") return null;
  const index = editor.options.findIndex(({ value }) =>
    Object.is(value, scope.draft),
  );
  return index < 0 ? null : index;
});
const choices = computed(() =>
  props.editor.type === "select"
    ? props.editor.options.map(({ label }, index) => ({ label, value: index }))
    : [],
);

function setChoice(index: number | null) {
  if (props.editor.type === "select" && index !== null)
    props.scope.setDraft(props.editor.options[index]?.value);
}

watch(
  message,
  (value) => {
    if (value) void show();
    else close();
  },
  { flush: "post" },
);

onMounted(() => {
  const editor = area.value;
  const control =
    editor?.querySelector<HTMLElement>("[data-pro-grid-input]") ??
    editor?.querySelector<HTMLElement>(
      ".hys-ui-pro-grid-custom :is(input:not([type='hidden']), select, textarea, [contenteditable='true'], [role='combobox'][tabindex='0'], button[role='combobox']:not(:disabled))",
    );
  (control ?? editor)?.focus();
});

function keydown(event: KeyboardEvent) {
  if (event.defaultPrevented || event.isComposing || event.keyCode === 229)
    return;
  if (event.key === "Escape") {
    event.preventDefault();
    event.stopPropagation();
    props.scope.cancel();
    return;
  }
  if (!(event.target as HTMLElement).hasAttribute("data-pro-grid-input"))
    return;
  if (event.key === "Enter" && props.editor.type !== "select") {
    event.preventDefault();
    void props.scope.commit();
  }
  if (
    event.key === "Tab" &&
    !event.altKey &&
    !event.ctrlKey &&
    !event.metaKey &&
    cell.value
  ) {
    // On failure, leave Tab available for reaching the action buttons and leaving the grid.
    if (props.scope.error || busy.value) return;
    event.preventDefault();
    void props.commitAndMove(cell.value, event.shiftKey);
  }
}

function onBlur(event: FocusEvent) {
  if (
    !props.commitOnBlur ||
    busy.value ||
    event.defaultPrevented ||
    (props.editor.type !== "text" && props.editor.type !== "number" &&
      !(props.editor.type === "custom" && props.editor.commitOnBlur?.(props.scope.cell))) ||
    area.value?.contains(event.relatedTarget as Node | null)
  )
    return;
  void props.commitFromBlur();
}
</script>

<template>
  <span
    ref="area"
    class="hys-ui-pro-grid-editor"
    :data-invalid="scope.error ? '' : undefined"
    role="group"
    :aria-label="words.edit + ' ' + scope.cell.column.label"
    tabindex="-1"
    title=""
    @click.stop
    @dblclick.stop
    @contextmenu.stop
    @keydown="keydown"
    @focusout="onBlur"
  >
    <span v-if="editor.type === 'custom'" class="hys-ui-pro-grid-custom">
      <slot name="custom" v-bind="scope" />
    </span>
    <HysSelect
      v-else-if="editor.type === 'select'"
      :id="scope.inputId"
      class="hys-ui-pro-grid-control"
      data-pro-grid-input
      size="sm"
      :bordered="false"
      :aria-label="scope.cell.column.label"
      :model-value="activeChoice"
      :options="choices"
      :placeholder="words.choose"
      :disabled="busy"
      :status="scope.error ? 'error' : undefined"
      :aria-describedby="message ? scope.inputId + '-feedback' : undefined"
      @update:model-value="setChoice"
    />
    <HysInput
      v-else
      :id="scope.inputId"
      class="hys-ui-pro-grid-control"
      data-pro-grid-input
      size="sm"
      :bordered="false"
      :validate-event="false"
      :aria-label="scope.cell.column.label"
      :inputmode="editor.type === 'number' ? 'decimal' : undefined"
      :model-value="String(scope.draft ?? '')"
      :readonly="busy"
      :status="scope.error ? 'error' : undefined"
      :aria-describedby="message ? scope.inputId + '-feedback' : undefined"
      @update:model-value="scope.setDraft"
    />
    <span v-if="showActions" class="hys-ui-pro-grid-editor-actions">
      <HysButton
        size="sm"
        variant="ghost"
        :loading="busy"
        :icon="scope.error?.stage === 'save' ? RotateCcw : Check"
        :aria-label="scope.error?.stage === 'save' ? words.retry : words.save"
        @click="scope.commit()"
      />
      <HysButton
        size="sm"
        variant="ghost"
        :icon="X"
        :aria-label="words.cancel"
        @click="scope.cancel()"
      />
    </span>
  </span>
  <Teleport to="body">
    <div
      v-if="open && message"
      :id="scope.inputId + '-feedback'"
      :ref="(el) => (feedback = (el as HTMLElement | null) ?? undefined)"
      v-bind="attrs"
      class="hys-ui-pro-grid-feedback"
      :style="style"
      :role="scope.error ? 'alert' : 'status'"
    >
      {{ message }}
    </div>
  </Teleport>
</template>
