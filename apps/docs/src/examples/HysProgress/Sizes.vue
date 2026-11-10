<script setup lang="ts">
import { HysProgress } from "hys-ui";
const sizes = ["sm", "md", "lg"] as const;
</script>
<template>
  <div class="demo-stack">
    <div v-for="size in sizes" :key="size" class="demo-stack">
      <span class="scenario-note">{{ size }}</span
      ><HysProgress :value="60" :size="size" :aria-label="size + ' 线形'" />
    </div>
    <div class="demo-content progress-examples">
      <HysProgress
        v-for="size in sizes"
        :key="size"
        :value="60"
        :size="size"
        type="circle"
        :aria-label="size + ' 环形'"
      />
    </div>
    <HysProgress
      :value="75"
      type="dashboard"
      :width="160"
      :stroke-width="12"
      aria-label="自定义尺寸"
    />
    <p class="scenario-note">
      size 统一文字、粗细与环形直径；显式 strokeWidth / width 优先。width
      用于环形；线形通过容器宽度或 style 设置长度。
    </p>
  </div>
</template>
