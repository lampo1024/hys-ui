<script setup lang="ts">
import { ref } from "vue";
import { HysSplitButton } from "hys-ui";
const chosen = ref("");
const actions = [{key: "另存副本", label: "另存副本"}, {key: "保存并关闭", label: "保存并关闭"}];
const sizes = [{ value:"sm", caption:"紧凑" }, { value:"md", caption:"常规" }, { value:"lg", caption:"醒目" }] as const;
</script>

<template>
  <div class="demo-stack">
    <div class="demo-row">
      <HysSplitButton v-for="entry in sizes" :key="entry.value" :size="entry.value" :label="entry.caption + '保存'" variant="secondary"
        :menu-label="entry.caption + '保存选项'" :items="actions" @click="chosen = entry.caption + '保存'" @select="chosen = String($event)" />
    </div>
    <p v-if="chosen" aria-live="polite">{{ chosen }}</p>
  </div>
</template>
