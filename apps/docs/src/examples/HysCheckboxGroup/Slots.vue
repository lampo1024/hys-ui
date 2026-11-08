<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import { HysCheckboxGroup, HysCheckbox, HysBadge } from "hys-ui";
const values = ref(["design"]);
</script>
<template>
  <div class="demo-content">
    <HysCheckboxGroup
      v-model="values"
      type="button"
      button-style="solid"
      aria-label="自定义角色"
      ><HysCheckbox value="design">设计 <HysBadge>推荐</HysBadge></HysCheckbox
      ><HysCheckbox value="dev">研发</HysCheckbox
      ><HysCheckbox value="qa" disabled>测试</HysCheckbox></HysCheckboxGroup
    ><output>{{ values.join("、") }}</output>
  </div>
</template>
