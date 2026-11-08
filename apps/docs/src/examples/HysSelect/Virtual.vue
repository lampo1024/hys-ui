<script setup lang="ts">
import { ref } from "vue";
import { HysButton, HysSelect, type HysSelectInstance } from "hys-ui";
const select = ref<HysSelectInstance>(),
  value = ref<number | null>(0),
  options = Array.from({ length: 10000 }, (_, value) => ({
    label: "数据项 " + String(value + 1).padStart(5, "0"),
    value,
  }));
</script>
<template>
  <div class="demo-content">
    <label class="select-demo-field"
      ><span>大列表搜索与键盘定位</span
      ><HysSelect
        ref="select"
        v-model="value"
        :options="options"
        filterable
        clearable
        :clear-value="null"
        :list-height="252"
        :popup-width="360"
        aria-label="虚拟列表数据项"
    /></label>
    <div class="demo-row">
      <HysButton
        variant="secondary"
        @click="select?.open().then(() => select?.scrollTo(9999))"
        >定位最后一项</HysButton
      ><HysButton variant="ghost" @click="select?.focus()"
        >聚焦选择器</HysButton
      >
    </div>
    <output class="state-output"
      >当前值：{{ value === null ? "未选择" : value }}</output
    >
    <p class="scenario-note">
      长列表自动只渲染可见行与少量缓冲行。Home / End、PageUp / PageDown
      可快速移动；scrollTo 按值定位。自定义选项含多行内容时需设置足够的
      itemHeight，或关闭 virtual。
    </p>
  </div>
</template>
