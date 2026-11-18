<script setup lang="ts">
import { ref } from "vue";
import { HysTag } from "hys-ui";
const selected = ref("前端");
</script>

<template>
  <div class="demo-stack">
    <div class="demo-row">
      <HysTag v-for="topic in ['前端', '交互', '测试']" :key="topic" round selectable
        :selected="selected === topic" @update:selected="selected = $event ? topic : ''">{{ topic }}</HysTag>
      <HysTag size="sm" disabled selectable>即将开放</HysTag>
    </div>
    <p aria-live="polite">当前课题 {{ selected || "全部" }}</p>
  </div>
</template>
