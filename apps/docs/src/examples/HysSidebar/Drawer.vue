<script setup lang="ts">
import { ref } from "vue";
import { HysSidebar } from "hys-ui";
const selected = ref<readonly (string | number)[]>(["交接"]);
const items = [{ key: "交接", label: "交接概览", badge: 2 }, { key: "值班", label: "值班计划" }];
</script>

<template>
  <div class="demo-stack">
    <HysSidebar v-model:selected-keys="selected" placement="drawer" title="打开移动端导航" :items="items" />
    <p aria-live="polite">当前页面 {{ selected[0] }}</p>
  </div>
</template>
