<script setup lang="ts">
import type { HysTabPaneProps, HysTabPaneSlots } from "../HysTabs/tabsTypes";

defineOptions({ name: "HysTabPane" });
defineProps<HysTabPaneProps>();
defineSlots<HysTabPaneSlots>();
const reload = () => Promise.resolve(false);
</script>

<template>
  <slot :item="$props" :active="true" :loading="false" :reload="reload">{{
    content
  }}</slot>
</template>
