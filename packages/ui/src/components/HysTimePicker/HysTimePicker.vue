<script setup lang="ts">
import {
  computed,
  inject,
  nextTick,
  onScopeDispose,
  ref,
  useTemplateRef,
  watch,
} from "vue";
import {
  fieldKey,
  formKey,
  useHysControlState,
  useHysFormItemContext,
} from "../../composables/formContext";
import { useChoiceModel } from "../../composables/choiceModel";
import type { Placement } from "../../composables/useFloating";
import HysButton from "../HysButton/HysButton.vue";
import { Clock } from "../HysIcon/svgIcons";
import HysInput from "../HysInput/HysInput.vue";
import HysPopover from "../HysPopover/HysPopover.vue";
import TimePanel from "./TimePanel.vue";
import {
  timeLabels,
  type HysTimePickerLabels as TimeLabels,
} from "./timeLabels";
import {
  createTimeOptions,
  firstTime,
  formatTime,
  parseTime,
  parseTimeInput,
  formatTimeInput,
  usesTime,
} from "./timeParts";

export type HysTimePickerLabels = TimeLabels;
export interface HysTimePickerPreset {
  label: string;
  value: string;
}

export interface HysTimePickerProps {
  /** 受控时间字符串。无值传 null，支持 v-model。 */
  modelValue?: string | null;
  /** 非受控的初始时间。 */
  defaultValue?: string | null;
  /** 启用秒列与 HH:mm:ss 格式，默认 false。 */
  showSeconds?: boolean;
  /** 以每小时的 00 分为基准的步长，整数 1–60，默认 1。 */
  minuteStep?: number;
  /** 以每分钟的 00 秒为基准的步长，整数 1–60，默认 1。 */
  secondStep?: number;
  /** 同日最早时间，含边界，支持 HH:mm 和 HH:mm:ss。 */
  minTime?: string;
  /** 同日最晚时间，含边界，支持 HH:mm 和 HH:mm:ss。 */
  maxTime?: string;
  /** 禁止输入和面板操作。 */
  disabled?: boolean;
  /** 可聚焦并读取当前值，禁止修改。 */
  readonly?: boolean;
  /** 显示清空按钮，默认 true。 */
  clearable?: boolean;
  /** 输入器的占位文字。 */
  placeholder?: string;
  /** 输入器的可访问名称。默认使用表单项名称或「时间」。 */
  ariaLabel?: string;
  /** 覆盖时间面板及输入错误文案。invalidFormat 支持 {format}。 */
  labels?: Partial<HysTimePickerLabels>;
  /** 显示 AM/PM 时间。提交给 v-model 的值仍为 24 小时制。 */
  twelveHour?: boolean;
  /** 为每个候选的标准时间返回是否禁用，手动输入也应用此限制。 */
  disabledTime?: (time: string) => boolean;
  /** 单击应用的常用时间。越界、禁用或格式错误的预设不可选。 */
  presets?: readonly HysTimePickerPreset[];
  /** 面板优先位置，实际可自动翻转避开视口边缘。 */
  placement?: Placement;
  /** 自定义输入框显示格式。模型、禁用规则和预设仍使用标准 24 小时格式。 */
  formatter?: (value: string) => string;
  /** 将手动输入转换为标准时间。标准时间本身始终可输入。 */
  parser?: (text: string) => string | undefined;
  /** 占位及输入校验中的格式说明。 */
  formatHint?: string;
}

const props = withDefaults(defineProps<HysTimePickerProps>(), {
  clearable: true,
  defaultValue: null,
});
const emit = defineEmits<{
  "update:modelValue": [value: string | null];
  change: [value: string | null];
  invalid: [text: string, reason: "format" | "range"];
}>();
const control = useHysControlState(props);
const field = useHysFormItemContext();
const fieldContext = inject(fieldKey, undefined);
const form = inject(formKey, undefined);
const blocked = computed(() => control.disabled.value || props.readonly);
const model = useChoiceModel(props, () => props.defaultValue);
const editor = useTemplateRef("editor");
const surface = useTemplateRef("surface");
const panel = useTemplateRef("panel");
const open = ref(false);
const draft = ref(model.current.value ?? "");
const error = ref("");
const editing = ref(false);
const activeTime = ref<number>();
let focusPending = false;
const options = computed(() => createTimeOptions(props));
const labels = computed(() => ({ ...timeLabels, ...props.labels }));
const inputPattern = computed(() =>
  props.formatHint ?? (props.twelveHour
    ? props.showSeconds
      ? "hh:mm:ss AM/PM"
      : "hh:mm AM/PM"
    : props.showSeconds
      ? "HH:mm:ss"
      : "HH:mm"),
);
const shortcuts = computed(() =>
  (props.presets ?? []).map((preset) => ({
    ...preset,
    disabled: !!invalidReason(preset.value.trim(), parseTime(preset.value.trim(), props.showSeconds)) || !preset.value.trim(),
  })),
);
function parseInput(text: string) {
  const value = model.current.value;
  if (value && !editing.value && props.formatter?.(value).trim() === text)
    return parseTime(value, props.showSeconds);
  const standard = parseTimeInput(text, props.showSeconds, props.twelveHour);
  if (standard !== undefined) return standard;
  const parsed = props.parser?.(text);
  return parsed === undefined ? undefined : parseTime(parsed, props.showSeconds);
}

function sync() {
  const value = model.current.value ?? "";
  const parsed = parseTime(value, props.showSeconds);
  draft.value =
    parsed === undefined
      ? value
      : props.formatter?.(value) ?? formatTimeInput(parsed, props.showSeconds, props.twelveHour);
  activeTime.value =
    parsed !== undefined && usesTime(options.value, parsed)
      ? parsed
      : firstTime(options.value);
  error.value = "";
  editing.value = false;
}
watch([model.current, () => props.showSeconds, () => props.twelveHour, () => props.formatter], sync, {
  immediate: true,
});
watch(options, () => {
  if (
    activeTime.value === undefined ||
    !usesTime(options.value, activeTime.value)
  )
    activeTime.value = firstTime(options.value);
});
watch(blocked, (inactive) => {
  if (inactive) close();
});
watch(
  () => form?.resetting.value,
  (resetting) => {
    if (resetting) {
      sync();
      close();
    }
  },
);

function change(value: string) {
  draft.value = value;
  editing.value = true;
  error.value = "";
}
function message(reason: "format" | "range") {
  return reason === "format"
    ? labels.value.invalidFormat.replace("{format}", inputPattern.value)
    : labels.value.invalidRange;
}
function invalidReason(text: string, time: number | undefined) {
  if (!text) return;
  if (time === undefined) return "format";
  if (!usesTime(options.value, time)) return "range";
}
const removeRule = fieldContext?.registerControlRule?.({
  validator: () => {
    const clean = draft.value.trim();
    const reason = invalidReason(clean, parseInput(clean));
    return !model.isLive() || control.disabled.value || !reason
      ? true
      : message(reason);
  },
});
if (removeRule) onScopeDispose(removeRule);
function rejected(reason: "format" | "range", deferringValidation: boolean) {
  if (!deferringValidation || !removeRule) error.value = message(reason);
  emit("invalid", draft.value, reason);
  return false;
}
async function commit(
  text: string,
  { deferValidation = false, canonical = false } = {},
) {
  if (blocked.value) return false;
  const clean = text.trim();
  const parsed = !clean
    ? undefined
    : canonical
      ? parseTime(clean, props.showSeconds)
      : parseInput(clean);
  const reason = invalidReason(clean, parsed);
  if (reason) return rejected(reason, deferValidation);
  const next =
    parsed === undefined ? null : formatTime(parsed, props.showSeconds);
  if (next !== model.current.value) {
    // Keep the form footer stable until the submit control receives its click.
    const release = deferValidation
      ? fieldContext?.deferChangeValidation?.()
      : undefined;
    try {
      const accepted = await model.commit(
        next,
        (value) => emit("update:modelValue", value),
        (value) => emit("change", value),
      );
      if (!accepted) {
        sync();
        return false;
      }
    } finally {
      release?.();
    }
  }
  sync();
  return true;
}
async function show(focus = false) {
  if (blocked.value) return;
  const parsed = parseInput(draft.value.trim());
  activeTime.value =
    parsed !== undefined && usesTime(options.value, parsed)
      ? parsed
      : firstTime(options.value);
  focusPending = focus;
  open.value = true;
  await nextTick();
  focusPanel();
}
function focusPanel() {
  if (!open.value || !focusPending || !surface.value?.element) return;
  const body = surface.value.element;
  if (!body.contains(body.ownerDocument.activeElement)) panel.value?.focus();
  if (body.contains(body.ownerDocument.activeElement)) focusPending = false;
}
function close(restore = false) {
  focusPending = false;
  open.value = false;
  if (restore) void nextTick(() => editor.value?.focus());
}
async function confirm() {
  if (
    activeTime.value !== undefined &&
    (await commit(formatTime(activeTime.value, props.showSeconds), { canonical: true }))
  )
    close(true);
}
async function selectPreset(value: string) {
  if (await commit(value, { canonical: true })) close(true);
}
defineExpose({
  /** 聚焦时间输入框。 */
  focus: () => editor.value?.focus(),
  /** 打开选择面板，将焦点移到当前时间。 */
  openPanel: () => show(true),
  /** 请求清空时间，返回是否接受。 */
  clear: () => commit(""),
});
async function blur(event: FocusEvent) {
  const next = event.relatedTarget as HTMLElement | null;
  if (
    surface.value?.element?.contains(next) ||
    surface.value?.referenceElement?.contains(next)
  )
    return;
  const submit = next?.closest<HTMLButtonElement | HTMLInputElement>(
    '[type="submit"]',
  );
  const submitting =
    !!submit?.form && submit.form === editor.value?.input?.form;
  if (editing.value) await commit(draft.value, { deferValidation: submitting });
  if (!submitting) void field.validate("blur");
}
function keyboard(event: KeyboardEvent) {
  if (event.isComposing || blocked.value || event.defaultPrevented) return;
  if (event.key === "ArrowDown" && !event.altKey) {
    event.preventDefault();
    void show(true);
  } else if (event.key === "Enter") {
    event.preventDefault();
    void commit(draft.value).then((accepted) => {
      if (accepted) close();
    });
  } else if (event.key === "Escape" && !open.value && editing.value) {
    event.preventDefault();
    sync();
  }
}
</script>

<template>
  <HysPopover
    ref="surface"
    class="hys-time-picker"
    trigger="manual"
    :open="open"
    :disabled="blocked"
    :placement="placement ?? 'bottom-start'"
    :aria-label="labels.panel"
    max-width="calc(100vw - 16px)"
    @update:open="$event ? (open = true) : close()"
    @opened="focusPanel"
  >
    <template #trigger>
      <HysInput
        ref="editor"
        :model-value="draft"
        :size="control.size.value"
        :placeholder="placeholder ?? inputPattern"
        :aria-label="ariaLabel || field.label.value || labels.input"
        :aria-expanded="open"
        aria-haspopup="dialog"
        autocomplete="off"
        :disabled="control.disabled.value"
        :readonly="readonly"
        :clearable="clearable"
        :validate-event="false"
        :error="field.error.value ? undefined : error"
        @update:model-value="change"
        @clear="commit('')"
        @keydown="keyboard"
        @blur="blur"
      >
        <template #suffix>
          <HysButton
            variant="ghost"
            class="hys-time-trigger"
            size="sm"
            :icon="Clock"
            :aria-label="labels.open"
            :aria-expanded="open"
            aria-haspopup="dialog"
            :disabled="blocked"
            @click="open ? close() : show(true)"
          />
        </template>
      </HysInput>
    </template>

    <TimePanel
      ref="panel"
      :selected="activeTime"
      :options="options"
      :labels="labels"
      :seconds="showSeconds"
      :twelve-hour="twelveHour"
      :presets="shortcuts"
      @pick="activeTime = $event"
      @confirm="confirm"
      @preset="selectPreset"
      @cancel="close(true)"
    />
  </HysPopover>
</template>

<style scoped>
.hys-time-picker {
  display: inline-flex;
  inline-size: min(100%, 250px);
  max-inline-size: 100%;
  vertical-align: middle;
}
.hys-time-picker :deep(.hys-ui-ex-field) {
  flex: 1 1 auto;
  min-width: 0;
}
.hys-time-trigger {
  min-block-size: 24px;
  min-inline-size: 24px;
  padding: 1px;
}
</style>
