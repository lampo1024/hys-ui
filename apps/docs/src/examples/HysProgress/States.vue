<script setup lang="ts">
import { HysProgress } from "hys-ui";
</script>
<template>
  <div class="demo-stack">
    <HysProgress :value="0" aria-label="未开始" /><HysProgress
      :value="100"
      aria-label="全部完成"
    /><HysProgress :value="-20" aria-label="小于零的输入" /><HysProgress
      :value="150"
      aria-label="超过上限的输入"
    /><HysProgress :value="NaN" aria-label="无效输入" /><HysProgress
      :value="60"
      :show-label="false"
      :stroke-width="3"
      aria-label="紧凑无文字"
    />
    <div class="progress-demo-narrow">
      <HysProgress
        :value="65"
        :format="() => '这是较长的进度说明，窄容器中仍保留轨道空间'"
        aria-label="窄容器长文字"
      />
    </div>
    <p class="scenario-note">
      无效数值归零，越界值限制到 0–100。隐藏文字不会移除辅助技术所需的进度语义。
    </p>
  </div>
</template>
<style scoped>
.progress-demo-narrow {
  width: 240px;
  max-width: 100%;
}
</style>
