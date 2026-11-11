<script setup lang="ts">
import { computed, ref } from "vue";
import { HysButton, HysSelect, type HysSelectLabeledValue } from "hys-ui";

const value = ref<HysSelectLabeledValue | null>({ value: "design", label: "设计组" });
const teams = ref<HysSelectLabeledValue[]>([{ value: "security", label: "安全组" }]);
const loaded = ref(false);
const options = computed(() => [
  ...(loaded.value ? [{ value: "design", label: "产品设计组" }] : []),
  { value: "engineering", label: "研发组" },
  { value: "quality", label: "质量组" },
]);
const clearValue = () => null;
</script>

<template>
  <div class="demo-panel select-labeled-demo">
    <div class="select-labeled-row">
      <HysSelect
        v-model="value"
        :options="options"
        :clear-value="clearValue"
        label-in-value
        clearable
        first-active-value="engineering"
        aria-label="分配团队"
      />
      <HysButton size="sm" variant="secondary" :disabled="loaded" @click="loaded = true">载入设计组资料</HysButton>
      <output aria-live="polite">{{ value ? value.label + ' · ' + value.value : '未分配团队' }}</output>
    </div>
    <div class="select-labeled-row">
      <HysSelect
        v-model="teams"
        :options="options"
        label-in-value
        multiple
        clearable
        aria-label="协作团队"
        placeholder="选择协作团队"
      />
      <output aria-live="polite">{{ teams.map(team => team.label).join('、') || '无协作团队' }}</output>
    </div>
  </div>
</template>

<style scoped>
.select-labeled-demo { display: grid; gap: 12px; }
.select-labeled-row { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }
</style>
