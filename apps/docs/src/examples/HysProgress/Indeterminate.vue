<script setup lang="ts">
import { HysProgress } from "hys-ui";
</script>
<template>
  <div class="demo-stack">
    <HysProgress
      :value="0"
      indeterminate
      :format="() => '正在处理'"
      aria-label="未知总量"
    />
    <div class="demo-content progress-examples">
      <HysProgress
        :value="0"
        indeterminate
        type="circle"
        :format="() => '加载中'"
        aria-label="环形加载"
      /><HysProgress
        :value="0"
        indeterminate
        type="dashboard"
        :format="() => '加载中'"
        aria-label="仪表盘加载"
      />
    </div>
    <p class="scenario-note">
      未知总量时不提供 aria-valuenow，使用连续轨道表达等待。此时 steps
      暂不生效；关闭动画时保留静态进度提示。
    </p>
  </div>
</template>
