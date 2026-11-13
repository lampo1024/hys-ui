<script setup lang="ts">
import type { HysIconReference, HysIconRegistry } from "../iconTypes";
import { useIconResource } from "../useIconResource";
import IconGraphic from "../IconGraphic/IconGraphic.vue";
const props = defineProps<{
  icon: HysIconReference;
  registry: HysIconRegistry;
  variant?: string;
  allowedOrigins?: readonly string[];
}>();
const { source } = useIconResource({
  reference: () => props.icon,
  registry: () => props.registry,
  variant: () => props.variant ?? "outline",
  allowedOrigins: () => props.allowedOrigins,
});
</script>
<template>
  <IconGraphic
    v-if="source"
    :source="source"
    :variant="variant"
    :allowed-origins="allowedOrigins"
  />
</template>
