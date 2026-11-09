<script setup lang="ts">
import { ref } from "vue";
import { HysBadge, HysButton, HysNumberInput } from "hys-ui";
import { Bell } from "lucide-vue-next";
const x = ref(0),
  y = ref(0);
const placements = [
  "top-left",
  "top-right",
  "bottom-left",
  "bottom-right",
] as const;
</script>
<template>
  <div class="demo-stack">
    <div class="demo-row">
      <label>水平偏移<HysNumberInput v-model="x" :min="-20" :max="20" /></label
      ><label
        >垂直偏移<HysNumberInput v-model="y" :min="-20" :max="20"
      /></label>
    </div>
    <div class="badge-positions">
      <HysBadge
        v-for="position in placements"
        :key="position"
        :value="6"
        :placement="position"
        :offset="[x, y]"
        ><HysButton variant="secondary">{{ position }}</HysButton></HysBadge
      >
    </div>
    <HysBadge
      :value="12"
      badge-class="custom-counter"
      :badge-style="{ background: '#7945d5', fontWeight: 600 }"
      ><HysButton variant="secondary">通知</HysButton
      ><template #content="{ displayValue }"
        ><Bell :size="11" />{{ displayValue }}</template
      ></HysBadge
    >
  </div>
</template>
<style scoped>
.badge-positions {
  display: flex;
  gap: 36px;
  flex-wrap: wrap;
  padding: 18px 12px;
}
</style>
