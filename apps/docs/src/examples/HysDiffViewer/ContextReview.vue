<script setup lang="ts">
import { computed, ref } from "vue";
import { HysCheckbox, HysDiffViewer } from "hys-ui";
const context = ref(true);
const before = [
  "region: east",
  "node: 01",
  "profile: stable",
  "retries: 3",
  "timeout: 15",
  "audit: true",
  "notify: ops",
].join("\n");
const after = computed(() => before.replace("retries: 3", "retries: 5"));
</script>

<template>
  <div class="demo-stack">
    <HysCheckbox v-model="context" label="只保留变化附近的行" />
    <HysDiffViewer
      :before="before"
      :after="after"
      :context-lines="context ? 1 : undefined"
      line-numbers
      align-changes
    />
  </div>
</template>
