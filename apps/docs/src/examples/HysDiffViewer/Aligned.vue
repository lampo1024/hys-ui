<script setup lang="ts">
import { ref } from "vue";
import { HysCheckbox, HysDiffViewer } from "hys-ui";
const onlyChanges = ref(false);
const before = "version: 2\nregion: east\nreplicas: 2\nlogging: enabled";
const after =
  "version: 2\nowner: platform\nregion: east\nreplicas: 3\nlogging: enabled";
</script>
<template>
  <div class="demo-stack">
    <HysCheckbox v-model="onlyChanges" label="只看变化行" />
    <HysDiffViewer
      :before="before"
      :after="after"
      :changes-only="onlyChanges"
      before-label="当前配置"
      after-label="待上线配置"
      align-changes
      line-numbers
    />
  </div>
</template>
