<script setup lang="ts">
import { ref } from "vue";
import { HysColorPicker } from "hys-ui";
const color = ref("#8955ea"),
  preview = ref(color.value),
  result = ref("等待确认");
</script>
<template>
  <div class="demo-stack">
    <HysColorPicker
      v-model="color"
      :immediate="false"
      show-alpha
      label="确认后应用颜色"
      @active-change="preview = $event"
      @confirm="result = '已确认'"
      @cancel="result = '已取消'"
    /><output class="state-output"
      >实际值：{{ color }} · 预览值：{{ preview }} · {{ result }}</output
    >
    <p class="scenario-note">
      拖动和输入先更新预览；确认才请求修改模型。取消或从浮层外部关闭会放弃预览，外部模型更新也会替换旧草稿。
    </p>
  </div>
</template>
