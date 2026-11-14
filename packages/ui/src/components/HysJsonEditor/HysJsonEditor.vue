<script setup lang="ts">
import { computed, nextTick, ref, useId } from "vue";
import { useHysRootAttrs } from "../../config";

const props = withDefaults(
  defineProps<{
    readonly?: boolean;
    disabled?: boolean;
    compactable?: boolean;
    indent?: number;
    validate?: (value: unknown) => string | void;
    autoIndent?: boolean;
  }>(),
  { indent: 2 },
);
const model = defineModel<string>({ default: "{}" });
const emit = defineEmits<{
  format: [text: string, mode: "pretty" | "compact"];
}>();
const hysRootAttrs = useHysRootAttrs();
const messageId = useId();
const parsed = computed(() => {
  try {
    return { valid: true as const, value: JSON.parse(model.value) as unknown };
  } catch (error) {
    return {
      valid: false as const,
      error: error instanceof Error ? error.message : String(error),
    };
  }
});
const error = computed(() => {
  const result = parsed.value;
  if (!result.valid) return result.error;
  try {
    return props.validate?.(result.value) ?? "";
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
});
const status = ref("");
const input = ref<HTMLTextAreaElement>();
const spaces = computed(() => Number.isFinite(props.indent) ? Math.min(10, Math.max(0, Math.floor(props.indent))) : 2);
async function onKeydown(event: KeyboardEvent) {
  if (!props.autoIndent || props.disabled || props.readonly || event.key !== "Enter" ||
    event.ctrlKey || event.metaKey || event.altKey || event.shiftKey || event.isComposing || event.keyCode === 229) return;
  const field = input.value;
  if (!field) return;
  event.preventDefault();
  const { value, selectionStart, selectionEnd } = field;
  const prefix = value.slice(0, selectionStart);
  const line = prefix.slice(prefix.lastIndexOf("\n") + 1);
  const leading = /^\s*/.exec(line)?.[0] ?? "";
  const nested = /[\[{]\s*$/.test(line) ? " ".repeat(spaces.value) : "";
  const text = "\n" + leading + nested;
  status.value = "";
  model.value = prefix + text + value.slice(selectionEnd);
  await nextTick();
  if (field.value === model.value) field.setSelectionRange(selectionStart + text.length, selectionStart + text.length);
}
function format(mode: "pretty" | "compact") {
  if (props.disabled || props.readonly) return;
  const result = parsed.value;
  if (!result.valid) {
    status.value = "JSON 无效";
    return;
  }
  const text = JSON.stringify(
    result.value,
    null,
    mode === "pretty" ? spaces.value : 0,
  );
  model.value = text;
  status.value = mode === "pretty" ? "已格式化" : "已压缩";
  emit("format", text, mode);
}
</script>

<template>
  <div v-bind="hysRootAttrs" class="hys-ui-ent-panel">
    <div class="hys-ui-ent-toolbar">
      <button
        type="button"
        :disabled="disabled || readonly"
        @click="format('pretty')"
      >
        格式化
      </button>
      <button
        v-if="compactable"
        type="button"
        :disabled="disabled || readonly"
        @click="format('compact')"
      >
        压缩
      </button>
      <span
        :id="messageId"
        class="hys-json-message"
        :class="error ? 'hys-ui-ent-error' : 'hys-ui-ent-ok'"
        >{{ error || "JSON 格式正确" }}</span
      >
    </div>
    <textarea
      ref="input"
      v-model="model"
      class="hys-ui-ent-code hys-ui-scrollbar"
      spellcheck="false"
      aria-label="JSON 编辑器"
      :aria-invalid="!!error"
      :aria-describedby="messageId"
      :readonly="readonly"
      :disabled="disabled"
      @input="status = ''"
      @keydown="onKeydown"
    />
    <small role="status">{{ status }}</small>
  </div>
</template>

<style scoped>
.hys-json-message {
  min-width: 0;
  overflow-wrap: anywhere;
}
</style>
