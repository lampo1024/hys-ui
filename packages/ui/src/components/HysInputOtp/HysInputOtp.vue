<script setup lang="ts">
import {
  computed,
  inject,
  nextTick,
  ref,
  useTemplateRef,
  watch,
  type InputHTMLAttributes,
} from "vue";
import { useHysRootAttrs } from "../../config";
import { useChoiceNativeReset } from "../../composables/choiceModel";
import {
  formKey,
  useHysControlState,
  useHysFormItemContext,
} from "../../composables/formContext";
import HysInput from "../HysInput/HysInput.vue";

export interface HysInputOtpProps {
  /** 验证码字符串，支持 v-model。外部值按同样规则显示。 */
  modelValue?: string;
  /** 非受控初始验证码。重置表单时恢复该值。 */
  defaultValue?: string;
  /** 验证码位数，取整数 1–12，默认 6。 */
  length?: number;
  /** 每位允许的字符正则表达式，默认 [0-9]。无效表达式退回数字。 */
  pattern?: string;
  /** 禁止输入及聚焦，默认 false。 */
  disabled?: boolean;
  /** 保留可聚焦及选择状态，禁止修改，默认 false。 */
  readonly?: boolean;
  /** 启用错误外观及 aria-invalid，默认 false。 */
  error?: boolean;
  /** 挂载时聚焦输入框，默认 false。 */
  autoFocus?: boolean;
  /** 原生表单提交的字段名称。 */
  name?: string;
  /** 辅助技术使用的名称，默认「验证码」。 */
  ariaLabel?: string;
  /** 每组的位数，例如 [3, 3]，总数应等于 length。 */
  groups?: readonly number[];
  /** 隐藏单元格中的内容，适合交易或设备配对。默认 false。 */
  masked?: boolean;
  /** 字符大小写规范化，在 pattern 校验之前执行。 */
  letterCase?: "upper" | "lower";
  /** 覆盖移动端输入键盘类型。 */
  inputMode?: InputHTMLAttributes["inputmode"];
}

const props = withDefaults(defineProps<HysInputOtpProps>(), {
  length: 6,
  pattern: "[0-9]",
  ariaLabel: "验证码",
});
const emit = defineEmits<{
  /** 用户修改验证码后发出过滤与截断后的字符串。 */
  "update:modelValue": [value: string];
  /** 本次用户输入已填满且被调用方接受时发出。 */
  complete: [value: string];
  /** 值被接受后发出完整的当前字符串，包括未填满的编辑。 */
  change: [value: string];
}>();
const skin = useHysRootAttrs();
const { disabled } = useHysControlState(props);
const field = useHysFormItemContext();
const invalid = computed(() => props.error || field.invalid.value);
const editor = useTemplateRef("editor");
const cells = useTemplateRef<HTMLElement>("cells");
const local = ref(props.defaultValue ?? "");
const selection = ref({ start: 0, end: 0 });
const focused = ref(false);
const length = computed(() =>
  Number.isFinite(props.length)
    ? Math.min(12, Math.max(1, Math.floor(props.length)))
    : 6,
);
const allowed = computed(() => {
  try {
    return new RegExp("^(?:" + props.pattern + ")$", "u");
  } catch {
    return /^[0-9]$/u;
  }
});
function parse(value: string) {
  const normalized =
    props.letterCase === "upper"
      ? value.toUpperCase()
      : props.letterCase === "lower"
        ? value.toLowerCase()
        : value;
  return Array.from(normalized)
    .filter((character) => allowed.value.test(character))
    .slice(0, length.value)
    .join("");
}
const value = computed(() => parse(props.modelValue ?? local.value));
const characters = computed(() => Array.from(value.value));
const layout = computed(() => {
  const groups = props.groups ?? [];
  const valid =
    groups.length > 1 &&
    groups.every((size) => Number.isInteger(size) && size > 0) &&
    groups.reduce((total, item) => total + item, 0) === length.value;
  const tracks: string[] = [];
  const positions: number[] = [];
  for (const size of valid ? groups : [length.value]) {
    if (tracks.length) tracks.push("minmax(1px, 0.28fr)");
    for (let index = 0; index < size; index++) {
      tracks.push("minmax(0, 1fr)");
      positions.push(tracks.length);
    }
  }
  return { tracks: tracks.join(" "), positions };
});

function syncSelection() {
  const input = editor.value?.input;
  if (!input) return;
  selection.value = {
    start: Array.from(input.value.slice(0, input.selectionStart ?? 0)).length,
    end: Array.from(input.value.slice(0, input.selectionEnd ?? 0)).length,
  };
}

function placeCaret(event: MouseEvent) {
  const input = editor.value?.input;
  if (
    event.detail !== 1 ||
    event.shiftKey ||
    !input ||
    input.selectionStart !== input.selectionEnd
  )
    return;
  const index = Array.from(cells.value?.children ?? []).findIndex(
    (element) => event.clientX <= element.getBoundingClientRect().right,
  );
  if (index >= 0) {
    const offset = characters.value.slice(0, index).join("").length;
    input.setSelectionRange(offset, offset);
  }
  syncSelection();
}
function cellActive(index: number) {
  if (!focused.value) return false;
  const { start, end } = selection.value;
  return start === end
    ? index === Math.min(start, length.value - 1)
    : index >= start && index < end;
}

let change = 0;
async function update(next: string) {
  const normalized = parse(next);
  if (normalized === value.value || disabled.value || props.readonly) {
    void nextTick(syncSelection);
    return;
  }
  const ticket = ++change;
  if (props.modelValue === undefined) local.value = normalized;
  emit("update:modelValue", normalized);
  await nextTick();
  syncSelection();
  if (change === ticket && normalized === value.value) {
    emit("change", normalized);
    if (Array.from(normalized).length === length.value)
      emit("complete", normalized);
  }
}
function reset() {
  change++;
  if (props.modelValue === undefined) local.value = props.defaultValue ?? "";
}
useChoiceNativeReset(
  computed(() => editor.value?.input),
  reset,
);
const form = inject(formKey, undefined);
watch(
  () => form?.resetting.value,
  (resetting) => {
    if (resetting) reset();
  },
);
defineExpose({
  /** 聚焦单一验证码输入框。 */
  focus: () => editor.value?.focus(),
  /** 选中整个验证码，下一次输入可以直接替换。 */
  select: () => editor.value?.select(),
  /** 请求清空验证码，保留受控模式与禁用规则。 */
  clear: () => update(""),
});
</script>

<template>
  <div
    v-bind="skin"
    class="hys-input-otp"
    :class="{ 'is-disabled': disabled, 'is-invalid': invalid }"
  >
    <div
      ref="cells"
      dir="ltr"
      class="hys-otp-cells"
      :class="{ 'is-focused': focused }"
      :style="{
        gridTemplateColumns: layout.tracks,
        inlineSize: length * 46 + 'px',
      }"
      aria-hidden="true"
    >
      <span
        v-for="index in length"
        :key="index"
        class="hys-otp-cell"
        :style="{ gridColumn: layout.positions[index - 1] }"
        :class="{ 'is-active': cellActive(index - 1) }"
        >{{
          masked && characters[index - 1] ? "•" : characters[index - 1]
        }}</span
      >
    </div>
    <HysInput
      ref="editor"
      class="hys-otp-editor"
      dir="ltr"
      :type="masked ? 'password' : 'text'"
      :model-value="value"
      :parser="parse"
      :name="name"
      :disabled="disabled"
      :readonly="readonly"
      :status="error ? 'error' : undefined"
      :autofocus="autoFocus"
      :aria-label="ariaLabel"
      :inputmode="inputMode ?? (pattern === '[0-9]' ? 'numeric' : 'text')"
      autocomplete="one-time-code"
      @update:model-value="update"
      @focus="
        focused = true;
        syncSelection();
      "
      @blur="focused = false"
      @keyup="syncSelection"
      @select="syncSelection"
      @click="placeCaret"
    />
  </div>
</template>

<style scoped>
.hys-input-otp {
  position: relative;
  display: inline-grid;
  grid-template-columns: minmax(0, 1fr);
  max-inline-size: 100%;
  vertical-align: middle;
}
.hys-otp-cells {
  display: grid;
  gap: clamp(2px, 1vw, 6px);
  max-inline-size: 100%;
}
.hys-otp-cell {
  display: grid;
  place-items: center;
  min-inline-size: 0;
  height: 42px;
  border: 1px solid var(--hys-ui-theme-border);
  border-radius: 8px;
  background: var(--hys-ui-theme-surface);
  color: var(--hys-ui-theme-text);
  font-weight: 650;
  font-variant-numeric: tabular-nums;
}
.is-invalid .hys-otp-cell {
  border-color: var(--hys-ui-theme-red);
}
.is-focused .is-active {
  outline: 2px solid var(--hys-ui-theme-primary);
  outline-offset: -2px;
  background: var(--hys-ui-theme-primary-soft);
}
.is-disabled .hys-otp-cells {
  opacity: 0.55;
}
.hys-otp-editor {
  position: absolute;
  inset: 0;
  opacity: 0;
}
.hys-otp-editor :deep(input) {
  width: 100%;
  height: 42px;
  cursor: text;
}
</style>
