<script setup lang="ts">
import { computed, ref, type Component, type VNodeChild } from "vue";
import HysButton, { type HysButtonVariant } from "../HysButton/HysButton.vue";
import HysButtonGroup from "../HysButtonGroup/HysButtonGroup.vue";
import HysDropdown from "../HysDropdown/HysDropdown.vue";
import type { HysMenuItem, HysMenuSelection } from "../HysMenu/HysMenu.vue";
import { ChevronDown } from "../HysIcon/svgIcons";
import { shortcutMatches } from "../../composables/shortcutMatch";

export interface HysSplitButtonProps {
  /** 主操作文字。 */
  label: string;
  /** 更多操作项，沿用菜单分组、禁用和子菜单。 */
  items: readonly HysMenuItem[];
  /** 主操作的图标。 */
  icon?: Component;
  /** 两侧共用的按钮样式，默认 primary。 */
  variant?: HysButtonVariant;
  /** 两侧共用尺寸，默认 md。 */
  size?: "sm" | "md" | "lg";
  /** 禁用两侧操作。 */
  disabled?: boolean;
  /** 加载中禁用重复操作。 */
  loading?: boolean;
  /** 更多操作按钮的可访问名称。 */
  menuLabel?: string;
  /** 将最后选择的操作作为主操作。 */
  rememberSelection?: boolean;
  /** 主操作的受控菜单键。 */
  primaryKey?: string | number;
  /** 非受控初始主操作键。 */
  defaultPrimaryKey?: string | number;
  /** 聚焦按钮组时触发主操作，例如 Alt+S 或 Mod+Enter。 */
  shortcut?: string;
}
const props = withDefaults(defineProps<HysSplitButtonProps>(), { variant: "primary", size: "md", menuLabel: "更多操作" });
const emit = defineEmits<{
  /** 点击主按钮时发出。 */
  click: [event: MouseEvent];
  /** 选择菜单项时发出键和操作上下文。 */
  select: [key: string | number, context: HysMenuSelection];
  /** 下拉操作的异步回调失败时发出键和错误。 */
  selectError: [key: string | number, error: unknown];
  /** 主操作激活时发出当前键和原始事件。 */
  primary: [key: string | number | undefined, event: MouseEvent];
  /** 记忆主操作发生变化时发出。 */
  "update:primaryKey": [key: string | number];
}>();
defineSlots<{
  /** 主按钮内容，默认显示 label。 */
  default?: () => VNodeChild;
  /** 替换下拉菜单内容。 */
  menu?: (scope: { close: () => Promise<boolean> }) => VNodeChild;
}>();
const recent = ref(props.defaultPrimaryKey);
const mainButton = ref<InstanceType<typeof HysButton>>();
function onShortcut(event: KeyboardEvent) {
  if (mainButton.value?.disabled || !shortcutMatches(event, props.shortcut)) return;
  event.preventDefault();
  mainButton.value?.element?.click();
}
function find(items: readonly HysMenuItem[], key: string | number): Extract<HysMenuItem, { key: string | number }> | undefined {
  for (const item of items) {
    if (item.hidden || ("disabled" in item && item.disabled)) continue;
    if ("children" in item && item.children?.length) {
      const child = find(item.children, key);
      if (child) return child;
    } else if ("key" in item && item.key === key) return item;
  }
  return undefined;
}
const primary = computed(() => {
  const key = props.primaryKey ?? recent.value;
  return key === undefined ? undefined : find(props.items, key);
});
function select(key: string | number, context: HysMenuSelection) {
  if (props.rememberSelection) {
    recent.value = key;
    emit("update:primaryKey", key);
  }
  emit("select", key, context);
}
function click(event: MouseEvent) {
  emit("click", event);
  emit("primary", primary.value?.key, event);
}
</script>
<template>
  <HysButtonGroup class="hys-split-button" :class="{ 'is-busy': loading, 'is-disabled': disabled && !loading }" :aria-busy="loading || undefined"  :data-size="size" :data-variant="variant" :variant="variant" :size="size" :disabled="disabled || loading" :aria-label="label" @keydown="onShortcut">
    <HysButton ref="mainButton" class="hys-split-main" :icon="primary?.icon ?? icon" :loading="loading || primary?.loading" :aria-keyshortcuts="shortcut" @click="click"><slot>{{ primary?.label ?? label }}</slot><kbd v-if="shortcut" class="shortcut">{{ shortcut }}</kbd></HysButton>
    <HysDropdown class="hys-split-menu" :items="items" :aria-label="menuLabel" :disabled="disabled || loading" @select="select" @select-error="(key, error) => emit('selectError', key, error)">
      <template v-if="$slots.menu" #default="scope"><slot name="menu" v-bind="scope" /></template>
      <template #trigger><HysButton class="hys-split-trigger" :icon="ChevronDown" :aria-label="menuLabel" /></template>
    </HysDropdown>
  </HysButtonGroup>
</template>

<style scoped>
.shortcut { font-size: .82em; opacity: .78; }
.hys-split-button {
  --hys-split-trigger-width: 34px;
  align-items: stretch;
  min-inline-size: 0;
}
.hys-split-button[data-size="sm"] { --hys-split-trigger-width: 30px; }
.hys-split-button[data-size="lg"] { --hys-split-trigger-width: 40px; }
.hys-split-button :deep(.hys-split-main) {
  min-inline-size: 0;
  border-inline-end-width: 0;
  border-start-end-radius: 0;
  border-end-end-radius: 0;
  overflow-wrap: anywhere;
}
.hys-split-button :deep(.hys-split-menu) {
  flex: 0 0 auto;
  align-items: stretch;
  margin-inline-start: -1px;
}
.hys-split-button :deep(.hys-split-trigger) {
  inline-size: var(--hys-split-trigger-width);
  justify-content: center;
  padding-inline: 0;
  border-inline-start-width: 0;
  border-start-start-radius: 0;
  border-end-start-radius: 0;
}
.hys-split-button :deep(.hys-split-trigger::before) {
  content: "";
  position: absolute;
  pointer-events: none;
  inset-block: 7px;
  inset-inline-start: 1px;
  inline-size: 1px;
  background: color-mix(in srgb, currentColor 33%, transparent);
}
.hys-split-button:has(.hys-split-main:active) :deep(.hys-split-trigger::before),
.hys-split-button :deep(.hys-split-trigger:is(:active, [aria-expanded="true"])::before) {
  opacity: 0;
}
.hys-split-button[data-variant="secondary"] :deep(.hys-split-trigger::before) {
  background: var(--hys-ui-border, var(--hys-ui-theme-border));
}
.hys-split-button[data-variant="secondary"] :deep(.hys-ui-btn:not(.hys-ui-button-locked):is(:hover, [aria-expanded="true"])) {
  background: color-mix(in srgb, var(--hys-ui-button-color) 7%, var(--hys-ui-surface, var(--hys-ui-theme-surface)));
  border-color: var(--hys-ui-border, var(--hys-ui-theme-border));
  color: var(--hys-ui-text, var(--hys-ui-theme-text));
}
.hys-split-button[data-variant="secondary"] :deep(.hys-ui-btn:not(.hys-ui-button-locked):active) {
  background: color-mix(in srgb, var(--hys-ui-button-color) 13%, var(--hys-ui-surface, var(--hys-ui-theme-surface)));
}
.hys-split-button.is-disabled { opacity: .6; }
.hys-split-button.is-disabled :deep(.hys-ui-button-locked),
.hys-split-button.is-busy :deep(.hys-ui-button-locked) { opacity: 1; }
.hys-split-button.is-busy :deep(.hys-ui-button-locked) {
  background: color-mix(in srgb, var(--hys-ui-button-color) 12%, var(--hys-ui-theme-surface));
  border-color: color-mix(in srgb, var(--hys-ui-button-color) 32%, var(--hys-ui-theme-surface));
  color: color-mix(in srgb, var(--hys-ui-button-color) 65%, var(--hys-ui-theme-text));
}
.hys-split-button.is-busy :deep(.hys-split-trigger .hys-ui-button-icon) { opacity: .5; }
.hys-split-button.is-busy :deep(.hys-split-trigger::before),
.hys-split-button.is-disabled :deep(.hys-split-trigger::before) { opacity: 0; }
.hys-split-button :deep(.hys-split-trigger:focus-visible) {
  z-index: 2;
}
</style>
