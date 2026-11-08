<script setup lang="ts">
import { ref } from "vue";
import { HysSegmented, HysButton } from "hys-ui";
const value = ref("概览"),
  options = ref(["概览", "详情"]),
  count = ref(0);
function append() {
  options.value.push("标签 " + ++count.value);
}
function remove() {
  options.value.pop();
}
</script>
<template>
  <div class="demo-content">
    <div class="demo-row">
      <HysButton variant="secondary" @click="append">添加选项</HysButton
      ><HysButton
        variant="secondary"
        :disabled="!options.length"
        @click="remove"
        >删除末项</HysButton
      >
    </div>
    <HysSegmented
      v-model="value"
      :options="options"
      aria-label="动态分段"
    /><output>实际值：{{ value }} · 当前选项：{{ options.join("、") }}</output>
    <p class="hint">删除选中项不会擅自改写模型；选项恢复后重新显示选中状态。</p>
  </div>
</template>
