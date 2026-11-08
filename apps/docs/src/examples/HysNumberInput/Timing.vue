<script setup lang="ts">
import { ref } from "vue";
import { HysNumberInput } from "hys-ui";
const committed = ref<number | null>(2),
  live = ref<number | null>(2);
</script>
<template>
  <div class="demo-content">
    <div class="timing-grid">
      <label class="demo-field"
        ><span>确认后更新模型</span
        ><HysNumberInput
          v-model="committed"
          :show-controls="false"
          clearable
          aria-label="确认后更新" /></label
      ><label class="demo-field"
        ><span>合法输入立即更新模型</span
        ><HysNumberInput
          v-model="live"
          update-on-input
          :show-controls="false"
          clearable
          aria-label="即时更新"
      /></label>
    </div>
    <output class="state-output"
      >确认模式：{{ committed }} · 即时模式：{{ live }}</output
    >
    <p class="scenario-note">
      默认保留输入草稿，Enter、失焦或 change 时归一化并提交。updateOnInput
      开启后，合法值即时更新，仍保留小数点等编辑状态。Escape
      撤销尚未提交的草稿；外部值更新与表单重置会覆盖草稿。
    </p>
  </div>
</template>
<style scoped>
.timing-grid {
  display: flex;
  gap: 28px;
  flex-wrap: wrap;
}
</style>
