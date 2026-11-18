<script setup lang="ts">
import { computed, nextTick, ref, useId } from "vue";
import { useHysRootAttrs } from "../../config";
import { useHysFormItemContext } from "../../composables/formContext";
import HysInput from "../HysInput/HysInput.vue";
import { formatMask, maskTokens, masks, readMask } from "./maskInput";

export interface HysInputMaskProps {
  /** 受控原始值，格式分隔符由组件展示。 */
  modelValue?: string;
  /** 非受控原始值初始内容。 */
  defaultValue?: string;
  /** 自定义掩码。# 数字，A 字母，* 字母或数字，反斜线转义。动态函数接收正在输入的文本，可能含格式分隔符。 */
  mask?: string | ((text: string) => string);
  /** 单字符掩码规则。支持 Unicode 正则，覆盖内置标记。 */
  rules?: Readonly<Record<string, RegExp>>;
  /** 聚焦时显示原值，离开后再展示分隔符。 */
  rawOnFocus?: boolean;
  /** 显示给用户的格式说明。 */
  hint?: string;
  /** 内置手机、日期、时间、银行卡或证件模板。默认 phone。 */
  preset?: keyof typeof masks;
  /** 输入框占位文字。 */
  placeholder?: string;
  /** 显示清空按钮。 */
  clearable?: boolean;
  /** 禁止修改。 */
  readonly?: boolean;
  /** 禁用输入。 */
  disabled?: boolean;
  /** 输入框外观状态。 */
  status?: "error" | "warning" | "success";
}
defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<HysInputMaskProps>(), { preset: "phone", defaultValue: "" });
const emit = defineEmits<{
  /** 整理后请求更新不含格式分隔符的值。 */
  "update:modelValue": [raw: string];
  /** 请求更新时同时提供原始值与格式化文本。 */
  change: [raw: string, formatted: string];
  /** 原始值发生编辑变更时发出格式化值。 */
  "update:formatted": [formatted: string];
  /** 点击清空按钮时发出。 */
  clear: [];
}>();
const skin = useHysRootAttrs();
const field = useHysFormItemContext();
const input = ref<InstanceType<typeof HysInput>>();
const hintId = useId();
function description(external: unknown) {
  const ids = [typeof external === "string" ? external : undefined, props.hint ? hintId : undefined].filter(Boolean);
  return ids.join(" ") || undefined;
}
const local = ref(props.defaultValue);
const source = computed(() => props.modelValue ?? local.value);
const selectedMask = (value: string) => typeof props.mask === "function" ? props.mask(value) : props.mask ?? masks[props.preset];
const pattern = computed(() => selectedMask(source.value));
const tokens = computed(() => maskTokens(pattern.value, props.rules));
const raw = computed(() => readMask(tokens.value, source.value));
const formatted = computed(() => formatMask(tokens.value, raw.value).text);
const numeric = computed(() => !props.rules && !/[A*]/.test(pattern.value));
const focused = ref(false);
const rawMode = computed(() => focused.value && props.rawOnFocus);
const display = computed(() => rawMode.value ? raw.value : formatted.value);
let edit: { type: string; start: number; end: number } | undefined;
function beforeInput(event: InputEvent) {
  const node = event.target as HTMLInputElement;
  edit = { type: event.inputType, start: node.selectionStart ?? 0, end: node.selectionEnd ?? 0 };
}
async function apply(value: string) {
  const entry = input.value?.input;
  const caret = entry?.selectionStart ?? value.length;
  const before = edit;
  edit = undefined;
  const nextTokens = maskTokens(selectedMask(value), props.rules);
  let next = readMask(nextTokens, value, !rawMode.value);
  let position = readMask(nextTokens, value.slice(0, caret), !rawMode.value).length;
  if (next === raw.value && before && before.start === before.end && before.type.startsWith("deleteContent")) {
    const prior = Array.from(readMask(tokens.value, display.value.slice(0, before.start), !rawMode.value)).length;
    const removed = before.type.endsWith("Backward") ? prior - 1 : prior;
    const characters = Array.from(next);
    if (removed >= 0 && removed < characters.length) {
      characters.splice(removed, 1);
      next = characters.join("");
      position = characters.slice(0, removed).join("").length;
    }
  }
  if (next !== raw.value) {
    local.value = next;
    emit("update:modelValue", next);
    const formattedNext = formatMask(nextTokens, next).text;
    emit("update:formatted", formattedNext);
    emit("change", next, formattedNext);
    await nextTick();
    if (props.modelValue === undefined) void field.validate?.("change");
  } else await nextTick();
  const shown = formatMask(tokens.value, raw.value);
  if (entry && document.activeElement === entry) {
    const offset = rawMode.value ? Math.min(position, raw.value.length) : shown.offsets[Math.min(position, shown.offsets.length - 1)];
    entry.value = display.value;
    input.value?.setSelectionRange(offset, offset);
  }
}
/** 聚焦掩码输入框。 */
function focus() { input.value?.focus(); }
defineExpose({ focus });
</script>
<template>
  <div v-bind="skin" class="hys-input-mask" @beforeinput.capture="beforeInput">
    <HysInput ref="input" v-bind="$attrs" :model-value="display" :placeholder="placeholder" :inputmode="numeric ? 'numeric' : 'text'"
      :clearable="clearable" :readonly="readonly" :disabled="disabled" :status="status" :validate-event="false"
      :aria-describedby="description($attrs['aria-describedby'])"
      @update:model-value="apply" @focus="focused = true" @blur="focused = false; field.validate?.('blur')" @clear="emit('clear')" />
    <small v-if="hint" :id="hintId" class="hys-mask-hint">{{ hint }}</small>
  </div>
</template>
<style scoped>
.hys-mask-hint { display: block; margin-top: 4px; color: var(--hys-ui-theme-muted); font-size: 12px; }
</style>
