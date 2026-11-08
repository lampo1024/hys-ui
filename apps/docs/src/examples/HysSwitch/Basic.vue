<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import { HysSwitch } from "hys-ui";
const value = ref(false);
</script>
<template>
  <div class="demo-content">
    <HysSwitch
      v-model="value"
      active-text="自动保存已开启"
      inactive-text="自动保存已关闭"
      aria-label="自动保存"
    /><HysSwitch :default-value="true" active-text="默认开启" /><output
      >自动保存：{{ value }}</output
    >
  </div>
</template>
