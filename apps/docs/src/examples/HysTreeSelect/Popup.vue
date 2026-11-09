<script setup lang="ts">
import { ref } from "vue";
import { HysTreeSelect, HysCheckbox } from "hys-ui";
const value = ref(""),
  match = ref(false);
const nodes = [
  { value: "engineering", label: "平台研发与基础设施协作团队" },
  { value: "design", label: "产品体验与交互设计团队" },
  { value: "quality", label: "质量保障与自动化测试团队" },
];
</script>
<template>
  <div class="demo-stack">
    <HysCheckbox v-model="match" label="浮层严格与触发器等宽" />
    <div class="narrow">
      <HysTreeSelect
        v-model="value"
        :nodes="nodes"
        :popup-match-width="match"
        :searchable="false"
        placeholder="选择团队"
      />
    </div>
    <p class="scenario-note">
      允许浮层宽于触发器，长名称保持单行，浮层始终限制在窗口内。
    </p>
  </div>
</template>
<style scoped>
.narrow {
  max-width: 210px;
}
</style>
