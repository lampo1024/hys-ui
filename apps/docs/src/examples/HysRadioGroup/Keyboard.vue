<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import { HysRadioGroup, HysButton, type HysRadioGroupInstance } from "hys-ui";
const value = ref("a"),
  control = ref<HysRadioGroupInstance>();
</script>
<template>
  <div class="demo-content">
    <div class="demo-row">
      <HysButton size="sm" @click="control?.focus()">聚焦当前选项</HysButton
      ><HysButton size="sm" @click="control?.select('c')"
        >选中最后一项</HysButton
      >
    </div>
    <HysRadioGroup
      ref="control"
      v-model="value"
      :options="['a', { label: '不可选', value: 'b', disabled: true }, 'c']"
      aria-label="键盘单选组"
    /><output>{{ value }}</output>
    <p class="scenario-note">
      Tab 进入当前选项。方向键跳过禁用项，Home / End 定位首尾；循环导航可通过
      loopNavigation 关闭。
    </p>
  </div>
</template>
