<script setup lang="ts">
import { ref } from "vue";
import { HysColorPicker } from "hys-ui";
const first = ref("#3867f5"),
  second = ref("rgba(137, 85, 234, 0.7)");
</script>
<template>
  <div class="demo-stack">
    <div class="feedback-demo-grid">
      <HysColorPicker
        v-model="first"
        inline
        label="内嵌品牌色"
      /><HysColorPicker
        v-model="second"
        inline
        show-alpha
        :immediate="false"
        label="内嵌透明色"
      />
    </div>
    <output class="state-output">{{ first }} · {{ second }}</output>
    <p class="scenario-note">
      内嵌面板可直接参与表单或设置页布局；确认模式下只有点击确认才应用预览。
    </p>
  </div>
</template>
