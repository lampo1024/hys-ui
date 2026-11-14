<script setup lang="ts">
import { ref, useTemplateRef } from "vue";
import type { HysButtonProps } from "../../HysButton/HysButton.vue";
import HysButton from "../../HysButton/HysButton.vue";
import HysTooltip from "../../HysTooltip/HysTooltip.vue";

const tooltipTriggers = ["hover", "focus"] as const;
const tooltipKeys: readonly string[] = [];
defineOptions({ inheritAttrs: false });
withDefaults(
  defineProps<{
    label: string;
    icon: HysButtonProps["icon"];
    disabled?: boolean;
    pressed?: boolean;
    tooltip?: boolean;
    fluid?: boolean;
  }>(),
  { pressed: undefined, tooltip: true },
);
const emit = defineEmits<{ click: [event: MouseEvent] }>();
const dismissed = ref(false);
const hint = useTemplateRef<InstanceType<typeof HysTooltip>>("hint");

function activate(event: MouseEvent) {
  dismissed.value = true;
  emit("click", event);
}

function restoreFocus() {
  hint.value?.focus({ suppressTooltip: true });
}

defineExpose({ restoreFocus });
</script>

<template>
  <HysTooltip
    ref="hint"
    :text="label"
    :trigger="tooltipTriggers"
    :trigger-keys="tooltipKeys"
    :show-delay="700"
    :disabled="!tooltip || dismissed"
    :class="{ 'hys-ui-spreadsheet-icon-fluid': fluid }"
    popup-transition="none"
    placement="bottom"
    @pointerenter="dismissed = false"
    @pointerleave="dismissed = false"
    @focusout="dismissed = false"
  >
    <HysButton
      v-bind="$attrs"
      size="sm"
      variant="ghost"
      class="hys-ui-spreadsheet-icon-button"
      :icon="icon"
      :aria-label="label"
      :disabled="disabled"
      :pressed="pressed"
      @click="activate"
    >
      <template v-if="$slots.suffix" #suffix><slot name="suffix" /></template>
    </HysButton>
  </HysTooltip>
</template>

<style scoped>
.hys-ui-spreadsheet-icon-button {
  box-sizing: border-box;
  inline-size: 30px;
  block-size: 30px;
  padding: 0;
}
.hys-ui-spreadsheet-icon-fluid,
.hys-ui-spreadsheet-icon-fluid .hys-ui-spreadsheet-icon-button {
  inline-size: 100%;
  min-inline-size: 0;
}
.hys-ui-spreadsheet-icon-fluid :deep(svg) {
  max-inline-size: 100%;
}
.hys-ui-spreadsheet-icon-fluid :deep(.hys-ui-button-icon) {
  min-inline-size: 0;
  max-inline-size: 100%;
}
</style>
