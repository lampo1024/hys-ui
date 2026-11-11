<script setup lang="ts">
import { ref } from "vue";
import { Grid2X2, List, PanelsTopLeft } from "lucide-vue-next";
import { HysButton, HysButtonGroup } from "hys-ui";

const view = ref("列表");
const views = [
  { label: "列表", icon: List },
  { label: "网格", icon: Grid2X2 },
  { label: "看板", icon: PanelsTopLeft },
];
</script>

<template>
  <HysButtonGroup aria-label="视图" variant="secondary" size="sm">
    <HysButton v-for="item in views" :key="item.label" :icon="item.icon" :pressed="view === item.label" @click="view = item.label">
      {{ item.label }}
    </HysButton>
  </HysButtonGroup>
</template>
