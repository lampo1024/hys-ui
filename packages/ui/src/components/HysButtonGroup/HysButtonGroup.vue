<script setup lang="ts">
import { computed, inject, provide, type VNodeChild } from "vue";
import { useHysRootAttrs } from "../../config";
import { buttonGroupKey, buttonSize, buttonVariant } from "../../composables/buttonGroup";
import { useHysControlState } from "../../composables/formContext";
import type { HysButtonAppearance, HysButtonSize, HysButtonVariant } from "../HysButton/HysButton.vue";

export interface HysButtonGroupProps {
  variant?: HysButtonVariant;
  size?: HysButtonSize;
  type?: HysButtonAppearance;
  direction?: "horizontal" | "vertical";
  joined?: boolean;
  gap?: number | string;
  wrap?: boolean;
  block?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
}
const props = withDefaults(defineProps<HysButtonGroupProps>(), {
  direction: "horizontal",
  joined: true,
  gap: 8,
});
defineSlots<{ default?: () => VNodeChild }>();
const skin = useHysRootAttrs();
const parent = inject(buttonGroupKey, undefined);
const { disabled } = useHysControlState({
  get disabled() { return props.disabled || parent?.disabled.value; },
});
provide(buttonGroupKey, {
  variant: computed(() => props.variant ?? buttonVariant(props.type) ?? parent?.variant.value),
  size: computed(() => buttonSize(props.size) ?? parent?.size.value),
  disabled,
});
const gap = computed(() => typeof props.gap === "number"
  ? (Number.isFinite(props.gap) ? Math.max(0, props.gap) : 8) + "px"
  : props.gap);
</script>

<template>
  <div
    v-bind="skin"
    role="group"
    :aria-label="ariaLabel"
    :aria-disabled="disabled || undefined"
    class="hys-ui-button-group"
    :class="[
      'hys-ui-button-group-' + direction,
      { 'hys-ui-button-group-joined': joined, 'hys-ui-button-group-wrap': wrap && !joined,
        'hys-ui-button-group-block': block },
    ]"
    :style="{ '--hys-ui-button-group-gap': gap }"
  >
    <slot />
  </div>
</template>

<style scoped>
.hys-ui-button-group { display: inline-flex; gap: var(--hys-ui-button-group-gap); vertical-align: middle; max-width: 100%; }
.hys-ui-button-group-vertical { flex-direction: column; }
.hys-ui-button-group-wrap { flex-wrap: wrap; }
.hys-ui-button-group-block { display: flex; width: 100%; }
.hys-ui-button-group-block.hys-ui-button-group-horizontal > :deep(.hys-ui-btn) { flex: 1; }
.hys-ui-button-group-joined { gap: 0; }
.hys-ui-button-group-joined > :deep(.hys-ui-btn:hover) { z-index: 1; }
.hys-ui-button-group-joined > :deep(.hys-ui-btn:focus-visible) { z-index: 2; }
.hys-ui-button-group-horizontal.hys-ui-button-group-joined > :deep(.hys-ui-btn:not(:first-child)) {
  margin-inline-start: -1px;
  border-start-start-radius: 0;
  border-end-start-radius: 0;
}
.hys-ui-button-group-horizontal.hys-ui-button-group-joined > :deep(.hys-ui-btn:not(:last-child)) {
  border-start-end-radius: 0;
  border-end-end-radius: 0;
}
.hys-ui-button-group-vertical.hys-ui-button-group-joined > :deep(.hys-ui-btn:not(:first-child)) {
  margin-block-start: -1px;
  border-start-start-radius: 0;
  border-start-end-radius: 0;
}
.hys-ui-button-group-vertical.hys-ui-button-group-joined > :deep(.hys-ui-btn:not(:last-child)) {
  border-end-start-radius: 0;
  border-end-end-radius: 0;
}
</style>
