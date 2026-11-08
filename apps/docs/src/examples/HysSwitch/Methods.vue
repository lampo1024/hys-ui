<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import { HysSwitch, HysButton, type HysSwitchInstance } from "hys-ui";
const value = ref(false),
  control = ref<HysSwitchInstance>();
</script>
<template>
  <div class="demo-content">
    <div class="demo-row">
      <HysButton size="sm" @click="control?.focus()">聚焦开关</HysButton
      ><HysButton size="sm" @click="control?.toggle()">切换开关</HysButton>
    </div>
    <HysSwitch ref="control" v-model="value" aria-label="键盘开关" /><output>{{
      value
    }}</output>
    <p class="scenario-note">
      开关保留按钮的 Enter / Space 操作。实例 toggle 返回
      Promise，表示宿主是否接受了请求值。
    </p>
  </div>
</template>
