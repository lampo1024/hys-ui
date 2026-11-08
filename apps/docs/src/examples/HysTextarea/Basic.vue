<script setup lang="ts">
import { ref } from "vue";
import { HysTextarea } from "hys-ui";
const text = ref("");
</script>
<template>
  <div class="demo-content">
    <HysTextarea
      v-model="text"
      label="需求描述"
      placeholder="请输入描述"
      :maxlength="200"
    />
  </div>
</template>
