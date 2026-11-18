<script setup lang="ts">
import { computed, type Component, type VNodeChild } from "vue";
import { useHysRootAttrs } from "../../config";
import HysBadge from "../HysBadge/HysBadge.vue";
import HysButton from "../HysButton/HysButton.vue";
import HysPopover from "../HysPopover/HysPopover.vue";

export interface HysTagGroupItem {
  key: string | number;
  label: string;
  tone?: HysTagProps["tone"];
  disabled?: boolean;
  closable?: boolean;
  selected?: boolean;
}
export interface HysTagProps {
  /** 标签文字，默认插槽优先。 */
  label?: string;
  /** 使用同一组件展示一组标签。 */
  items?: readonly HysTagGroupItem[];
  /** 标签组直显数量。超过后通过 +N 查看和操作。 */
  maxVisible?: number;
  /** 标签组的可访问名称，默认「标签」。 */
  groupLabel?: string;
  /** primary、success、warning、danger 或 neutral 主题色。 */
  tone?: "primary" | "success" | "warning" | "danger" | "neutral";
  /** 自定义颜色，优先于 tone。 */
  color?: string;
  /** 标签外观，默认 light。 */
  variant?: "solid" | "light" | "outline" | "text";
  /** 标签尺寸，默认 md。 */
  size?: "sm" | "md" | "lg";
  /** 使用胶囊形外观。 */
  round?: boolean;
  /** 前置图标。 */
  icon?: Component;
  /** 后置图标，位于关闭入口之前。 */
  trailingIcon?: Component;
  /** 允许关闭，由调用方移除标签。 */
  closable?: boolean;
  /** 返回 false 或拒绝 Promise 时保留标签。 */
  beforeClose?: (event: MouseEvent) => boolean | void | PromiseLike<boolean | void>;
  /** 限制单个标签的宽度。带 label 的标签悬停可查看完整文字。 */
  maxWidth?: number | string;
  /** 使标签可选择，可键盘激活。 */
  selectable?: boolean;
  /** 受控选中状态，配合 v-model:selected。 */
  selected?: boolean;
  /** 非受控的初始选中状态。 */
  defaultSelected?: boolean;
  /** 禁止选择、点击和关闭。 */
  disabled?: boolean;
}
const props = withDefaults(defineProps<HysTagProps>(), { tone: "primary", variant: "light", size: "md", selected: undefined });
const emit = defineEmits<{
  /** 激活标签时发出点击事件。 */
  click: [event: MouseEvent];
  /** 点击关闭入口时发出。 */
  close: [event: MouseEvent];
  /** 关闭拦截器抛出错误时发出。 */
  closeError: [error: unknown];
  /** 可选标签请求改变状态时发出。 */
  "update:selected": [selected: boolean];
  /** 标签组内某项改变选中状态时发出键和值。 */
  selectItem: [key: string | number, selected: boolean];
  /** 标签组内某项关闭时发出键及点击事件。 */
  closeItem: [key: string | number, event: MouseEvent];
}>();
defineSlots<{
  /** 标签内容。 */
  default?: () => VNodeChild;
  /** 自定义前置图标。 */
  prefix?: () => VNodeChild;
  /** 自定义后置图标。 */
  suffix?: () => VNodeChild;
}>();
const skin = useHysRootAttrs();
const limit = computed(() => Number.isFinite(props.maxVisible) ? Math.max(0, Math.floor(props.maxVisible!)) : (props.items?.length ?? 0));
const visible = computed(() => props.items?.slice(0, limit.value) ?? []);
const hidden = computed(() => props.items?.slice(limit.value) ?? []);
const palette = { primary: "blue", success: "green", warning: "orange", danger: "red", neutral: "gray" } as const;
const effect = computed(() => props.variant === "solid" ? "dark" : props.variant === "light" ? "light" : "plain");
</script>

<template>
  <div v-if="items" v-bind="skin" class="hys-tag-group" role="group" :aria-label="groupLabel ?? '标签'">
    <HysTag v-for="item in visible" :key="item.key" :label="item.label" :tone="item.tone ?? tone" :size="size"
      :selectable="selectable" :closable="item.closable ?? closable" :disabled="disabled || item.disabled" :selected="item.selected"
      :max-width="maxWidth" :before-close="beforeClose" :variant="variant" :color="color" :round="round"
      @update:selected="emit('selectItem', item.key, $event)" @close="emit('closeItem', item.key, $event)" @close-error="emit('closeError', $event)" />
    <HysPopover v-if="hidden.length" :aria-label="'更多标签（' + hidden.length + ' 个）'" placement="bottom-start">
      <template #trigger><HysButton variant="secondary" size="sm" :aria-label="'查看其余 ' + hidden.length + ' 个标签'">+{{ hidden.length }}</HysButton></template>
      <div class="hys-tag-group more">
        <HysTag v-for="item in hidden" :key="item.key" :label="item.label" :tone="item.tone ?? tone" :size="size"
          :selectable="selectable" :closable="item.closable ?? closable" :disabled="disabled || item.disabled" :selected="item.selected"
          :max-width="maxWidth" :before-close="beforeClose" :variant="variant" :color="color" :round="round"
          @update:selected="emit('selectItem', item.key, $event)" @close="emit('closeItem', item.key, $event)" @close-error="emit('closeError', $event)" />
      </div>
    </HysPopover>
  </div>
  <HysBadge v-else v-bind="skin" class="hys-tag" :class="'hys-tag-' + variant" :tone="palette[tone]" :color="color" :effect="effect" :size="size"
    :round="round" :closable="closable" :before-close="beforeClose" :checkable="selectable" :checked="selected" :default-checked="defaultSelected" :disabled="disabled"
    :style="{ maxWidth: typeof maxWidth === 'number' ? maxWidth + 'px' : maxWidth }"
    @update:checked="emit('update:selected', $event)" @close="emit('close', $event)"
    @close-error="emit('closeError', $event)" @click="!disabled && emit('click', $event)">
    <slot name="prefix"><component :is="icon" v-if="icon" aria-hidden="true" /></slot>
    <span class="hys-tag-caption" :title="maxWidth !== undefined ? label : undefined"><slot>{{ label }}</slot></span>
    <slot name="suffix"><component :is="trailingIcon" v-if="trailingIcon" aria-hidden="true" /></slot>
  </HysBadge>
</template>

<style scoped>
.hys-tag-group { display: flex; flex-wrap: wrap; gap: 6px; min-width: 0; align-items: center; }
.hys-tag-group.more { max-inline-size: min(20rem, 90vw); padding: 6px; }
.hys-tag, .hys-tag :deep(.hys-ui-badge-content), .hys-tag :deep(.hys-ui-badge-check) { min-width: 0; }
.hys-tag :deep(.hys-ui-badge) { max-inline-size: 100%; box-sizing: border-box; }
.hys-tag-caption { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.hys-tag :deep(svg) { flex: none; width: 1em; height: 1em; vertical-align: -0.13em; }
.hys-tag.hys-tag-text, .hys-tag-text :deep(.hys-ui-badge) { border-color: transparent; }
</style>
