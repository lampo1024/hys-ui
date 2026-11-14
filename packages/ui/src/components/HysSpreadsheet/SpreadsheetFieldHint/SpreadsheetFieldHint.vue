<script setup lang="ts">
import HysTooltip from "../../HysTooltip/HysTooltip.vue";

defineProps<{ text: string }>();
const triggers = ["hover", "focus"] as const;
</script>

<template>
  <HysTooltip
    class="spreadsheet-field-hint"
    :text="text"
    :trigger="triggers"
    :trigger-keys="[]"
    :show-delay="500"
    placement="top"
  >
    <slot />
  </HysTooltip>
</template>

<style scoped>
.spreadsheet-field-hint {
  display: flex;
  min-inline-size: 0;
}
.spreadsheet-field-hint :deep(.hys-ui-select-wrap) {
  flex: 1;
}
</style>
