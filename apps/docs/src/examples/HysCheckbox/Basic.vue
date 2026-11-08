<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import { HysCheckbox } from "hys-ui";
const value = ref(false);
</script>
<template>
  <div class="demo-content">
    <HysCheckbox v-model="value" label="接收更新通知" /><HysCheckbox
      :default-value="true"
      label="默认选中，无需绑定状态"
    /><output>接收通知：{{ value ? "是" : "否" }}</output>
  </div>
</template>
