<script setup lang="ts">
import { ref } from "vue";
import { HysCheckbox, HysDropdown } from "hys-ui";
const keepOpen = ref(false);
const selection = ref("");
const items = [{key:"review",label:"待审核"}, {key:"closed",label:"已关闭"}];
</script>

<template>
  <div class="demo-stack">
    <HysCheckbox v-model="keepOpen">选择后保留菜单</HysCheckbox>
    <HysDropdown label="处理状态" :items="items" :close-on-select="!keepOpen"
      :close-on-outside="!keepOpen" @select="selection = String($event)" />
    <p v-if="selection" aria-live="polite">已选择 {{ selection }}</p>
  </div>
</template>
