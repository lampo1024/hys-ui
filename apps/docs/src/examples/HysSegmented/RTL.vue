<script setup lang="ts">
import { ref } from "vue";
import { HysSegmented } from "hys-ui";
const value = ref("a");
</script>
<template>
  <div class="demo-content">
    <div dir="rtl">
      <HysSegmented
        v-model="value"
        :options="[
          { label: '开始', value: 'a' },
          { label: '中间', value: 'b' },
          { label: '结束', value: 'c' },
        ]"
        aria-label="从右向左分段"
      />
    </div>
    <output>{{ value }}</output>
    <p class="hint">横向方向键与视觉方向一致；上下方向键仍按选项顺序移动。</p>
  </div>
</template>
