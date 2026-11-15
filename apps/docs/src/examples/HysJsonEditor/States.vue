<script setup lang="ts">
import { ref } from "vue";
import { HysJsonEditor } from "hys-ui";

const value = ref(`{
  "status": "pending",
  "status": "ready",
  "enabled":
}`);
</script>

<template>
  <div class="demo-stack">
    <HysJsonEditor v-model="value" />
    <p class="scenario-note">在 enabled 后输入 true，再展开底部的重复键提示。点击任意提示即可定位，并查看该键首次出现的行列。</p>
  </div>
</template>
