<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import { HysSwitch } from "hys-ui";
const value = ref(true);
</script>
<template>
  <div class="demo-content">
    <div class="demo-row">
      <HysSwitch
        v-model="value"
        inline-prompt
        active-text="开"
        inactive-text="关"
      /><HysSwitch
        v-model="value"
        inline-prompt
        active-text="自动同步已开启"
        inactive-text="关闭"
      /><HysSwitch
        v-model="value"
        inline-prompt
        active-text="较长的开启状态文字"
        inactive-text="关闭"
        :width="90"
      />
    </div>
    <p class="scenario-note">
      内置文字默认预留较长状态的宽度。指定固定宽度后内容在轨道内裁切，不撑破外层容器。
    </p>
  </div>
</template>
