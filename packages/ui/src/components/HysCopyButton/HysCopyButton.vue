<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onDeactivated,
  ref,
  useTemplateRef,
  type VNodeChild,
} from "vue";
import { useHysRootAttrs } from "../../config";
import HysButton, {
  type HysButtonSize,
  type HysButtonVariant,
} from "../HysButton/HysButton.vue";
import { Check, CircleAlert, Copy } from "../HysIcon/svgIcons";
import HysTooltip from "../HysTooltip/HysTooltip.vue";
import HysInput from "../HysInput/HysInput.vue";

export type HysCopyButtonState = "idle" | "copying" | "success" | "error";
export type HysCopyButtonWriter = (text: string) => void | Promise<void>;

export interface HysCopyButtonProps {
  /** 原样写入剪贴板的纯文本，包括空格和换行。 */
  text: string;
  /** 禁止复制，默认 false。 */
  disabled?: boolean;
  /** 按钮尺寸，继承 HysButton 的尺寸规则。 */
  size?: HysButtonSize;
  /** 按钮外观，默认 secondary。 */
  variant?: HysButtonVariant;
  /** 按钮文字和无障碍名称，默认「复制」。 */
  label?: string;
  /** 悬停提示文字，默认无提示。 */
  tooltip?: string;
  /** 是否显示和朗读复制结果，默认 true。 */
  showFeedback?: boolean;
  /** 复制成功时的提示，默认「已复制」。 */
  successText?: string;
  /** 剪贴板写入失败时的提示。 */
  errorText?: string;
  /** 替换系统剪贴板写入操作，例如使用宿主桥接。失败时应抛出异常。 */
  writeText?: HysCopyButtonWriter;
  /** 点击后生成文本，例如刷新签名链接。失败时显示同样的复制错误。 */
  prepareText?: (context: {
    text: string;
    signal: AbortSignal;
  }) => string | Promise<string>;
  /** 仅显示图标，保留 label 作为辅助名称。默认 false。 */
  iconOnly?: boolean;
  /** 失败时提供可选中的原文供手动复制。默认 false。 */
  manualFallback?: boolean;
  /** 状态图标和反馈保留时长，默认 2000 毫秒。传 0 保留到下次操作。 */
  feedbackDuration?: number;
}

const props = withDefaults(defineProps<HysCopyButtonProps>(), {
  label: "复制",
  variant: "secondary",
  showFeedback: true,
  successText: "已复制",
  errorText: "无法写入剪贴板",
  feedbackDuration: 2000,
});
const emit = defineEmits<{
  /** 剪贴板写入成功时发出实际复制的文本。 */
  copy: [text: string];
  /** 写入不可用或被拒绝时发出异常及尝试复制的文本。 */
  error: [reason: unknown, text: string];
}>();
defineSlots<{
  /** 自定义按钮内容，接收当前复制状态。 */
  default?: (scope: { state: HysCopyButtonState }) => VNodeChild;
  /** 替换状态文案。text 为本次操作对应的文案。 */
  feedback?: (scope: { state: HysCopyButtonState; text: string }) => VNodeChild;
}>();

const skin = useHysRootAttrs();
const state = ref<HysCopyButtonState>("idle");
let attempt = 0;
let resetTimer: ReturnType<typeof setTimeout> | undefined;
let controller: AbortController | undefined;
const fallback = ref<string>();
const original = useTemplateRef("original");
const feedbackText = computed(() =>
  state.value === "success"
    ? props.successText
    : state.value === "error"
      ? props.errorText
      : "",
);

function reset() {
  attempt++;
  controller?.abort();
  controller = undefined;
  clearTimeout(resetTimer);
  state.value = "idle";
  fallback.value = undefined;
}

/** 执行一次复制，剪贴板写入成功时返回 true。 */
async function copy() {
  if (controller || props.disabled) return false;
  controller = new AbortController();
  const { signal } = controller;
  const ticket = ++attempt;
  let text = props.text;
  let prepared = !props.prepareText;
  fallback.value = undefined;
  clearTimeout(resetTimer);
  state.value = "copying";
  try {
    if (props.prepareText) {
      text = await props.prepareText({ text, signal });
      prepared = true;
    }
    if (signal.aborted || ticket !== attempt) return false;
    if (props.writeText) await props.writeText(text);
    else {
      if (!navigator.clipboard?.writeText)
        throw new Error("当前环境未提供剪贴板写入权限");
      await navigator.clipboard.writeText(text);
    }
    if (signal.aborted || ticket !== attempt) return false;
    state.value = "success";
    emit("copy", text);
    return true;
  } catch (reason) {
    if (signal.aborted || ticket !== attempt) return false;
    state.value = "error";
    if (prepared && props.manualFallback) fallback.value = text;
    emit("error", reason, text);
    return false;
  } finally {
    if (ticket === attempt) {
      controller = undefined;
      const duration = Number.isFinite(props.feedbackDuration)
        ? Math.min(60_000, Math.max(0, props.feedbackDuration))
        : 2000;
      if (duration && fallback.value === undefined)
        resetTimer = setTimeout(reset, duration);
    }
  }
}

async function selectOriginal() {
  await nextTick();
  original.value?.focus();
  original.value?.select();
}
defineExpose({ copy });
onDeactivated(reset);
onBeforeUnmount(reset);
</script>

<template>
  <span v-bind="skin" class="hys-copy-button">
    <HysTooltip
      :disabled="(!tooltip?.trim() && !iconOnly) || disabled"
      :text="tooltip?.trim() || label"
      :trigger-keys="[]"
      placement="top"
      :show-delay="300"
    >
      <HysButton
        :loading="state === 'copying'"
        :disabled="disabled"
        :aria-label="label"
        :size="size"
        :variant="variant"
        :icon="
          state === 'success' ? Check : state === 'error' ? CircleAlert : Copy
        "
        @click="copy"
      >
        <slot :state="state">{{ iconOnly ? "" : label }}</slot>
      </HysButton>
    </HysTooltip>
    <span
      v-if="showFeedback"
      role="status"
      :data-state="state"
      class="hys-copy-result"
      ><slot name="feedback" :state="state" :text="feedbackText">{{
        feedbackText
      }}</slot></span
    >
    <div
      v-if="fallback !== undefined && manualFallback"
      class="hys-copy-manual"
    >
      <HysInput
        ref="original"
        type="textarea"
        :rows="2"
        :model-value="fallback"
        aria-label="待手动复制的文本"
        readonly
      />
      <HysButton variant="secondary" size="sm" @click="selectOriginal"
        >选择文本</HysButton
      >
    </div>
  </span>
</template>

<style scoped>
.hys-copy-button {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 8px;
  max-inline-size: 100%;
}
.hys-copy-result {
  color: var(--hys-ui-theme-muted);
  font-size: 12px;
  overflow-wrap: anywhere;
}
.hys-copy-result:empty {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  overflow: hidden;
  clip-path: inset(50%);
}
.hys-copy-result[data-state="error"] {
  color: var(--hys-ui-theme-red);
}
.hys-copy-manual {
  display: grid;
  flex: 1 1 100%;
  gap: 6px;
  justify-items: start;
  min-width: 0;
}
.hys-copy-manual :deep(.hys-ui-ex-field) {
  width: 100%;
}
</style>
