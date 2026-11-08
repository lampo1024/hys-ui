<script setup lang="ts">
import { ref } from "vue";
import { HysSegmented, HysButton, HysCheckbox } from "hys-ui";
import type { HysSegmentedInstance } from "hys-ui";
const value = ref("a"),
  loop = ref(true),
  control = ref<HysSegmentedInstance>(),
  options = [
    { label: "首项", value: "a" },
    { label: "不可用", value: "b", disabled: true },
    { label: "末项", value: "c" },
  ];
</script>
<template>
  <div class="demo-content">
    <div class="demo-row">
      <HysButton variant="secondary" @click="control?.focus()"
        >聚焦当前项</HysButton
      ><HysCheckbox v-model="loop" label="循环导航" />
    </div>
    <HysSegmented
      ref="control"
      v-model="value"
      :options="options"
      :loop-navigation="loop"
      aria-label="键盘分段"
    /><output>{{ value }}</output>
    <p class="hint">
      Tab 保留一个入口；方向键跳过禁用项，Home / End
      定位首尾。关闭循环后在边界停止。
    </p>
  </div>
</template>
