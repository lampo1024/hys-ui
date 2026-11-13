<script setup lang="ts">
import { ref } from "vue";
import { HysButton, HysSelect, HysSpace } from "hys-ui";
const direction = ref<"horizontal" | "vertical">("horizontal");
const size = ref("sm");
const message = ref("等待操作");
</script>

<template>
  <div class="demo-stack">
    <div class="demo-controls demo-control-fields">
      <label class="demo-field"
        >排列方向
        <HysSelect
          v-model="direction"
          aria-label="排列方向"
          :options="[
            { label: '横排', value: 'horizontal' },
            { label: '竖排', value: 'vertical' },
          ]"
        />
      </label>
      <label class="demo-field"
        >预设间距
        <HysSelect
          v-model="size"
          aria-label="预设间距"
          :options="[
            { label: '紧凑（8 px）', value: 'sm' },
            { label: '标准（12 px）', value: 'md' },
            { label: '宽松（20 px）', value: 'lg' },
          ]"
        />
      </label>
    </div>
    <div class="demo-panel">
      <HysSpace :direction="direction" :size="size" wrap>
        <HysButton @click="message = '已创建报告草稿'">新建报告</HysButton>
        <HysButton variant="secondary" @click="message = '已导出报告列表'"
          >导出列表</HysButton
        >
        <HysButton variant="ghost" @click="message = '已刷新数据'"
          >刷新</HysButton
        >
      </HysSpace>
    </div>
    <output class="state-output" aria-live="polite">{{ message }}</output>
  </div>
</template>
