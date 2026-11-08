<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import { HysCheckboxGroup } from "hys-ui";
const values = ref(["design"]),
  options = [
    { label: "设计", value: "design" },
    { label: "研发", value: "dev" },
    { label: "测试", value: "qa", disabled: true },
  ];
</script>
<template>
  <div class="demo-content">
    <HysCheckboxGroup
      v-model="values"
      :options="options"
      aria-label="团队角色"
    /><output>{{ values.join("、") }}</output>
  </div>
</template>
