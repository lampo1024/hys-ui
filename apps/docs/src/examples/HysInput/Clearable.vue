<script setup lang="ts">
import { ref } from "vue";
import { HysInput } from "hys-ui";
const value = ref("试着清空这段文本"),
  message = ref("尚未清空");
</script>
<template>
  <div class="demo-content">
    <label class="input-demo-field"
      ><span>带清空操作</span
      ><HysInput
        v-model="value"
        clearable
        placeholder="输入后显示清空图标"
        @clear="message = '已清空，焦点保留在输入框'" /></label
    ><output class="state-output"
      >当前值：{{ value || "空" }} · {{ message }}</output
    >
  </div>
</template>
