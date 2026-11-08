<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import { HysCheckbox, HysCheckboxGroup } from "hys-ui";
const values = ref<string[]>(["design"]),
  options = ["design", "dev", "qa"].map((value) => ({
    value,
    label: { design: "设计", dev: "研发", qa: "测试" }[value],
  })),
  all = computed(() => values.value.length === 3),
  partial = computed(() => values.value.length > 0 && !all.value);
</script>
<template>
  <div class="demo-content">
    <HysCheckbox
      :model-value="all"
      :indeterminate="partial"
      label="选择全部角色"
      @change="(next) => (values = next ? ['design', 'dev', 'qa'] : [])"
    /><HysCheckboxGroup
      v-model="values"
      :options="options"
      aria-label="可选角色"
    /><output>{{ values.join("、") || "未选择" }}</output>
  </div>
</template>
