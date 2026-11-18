<script setup lang="ts">
import { ref } from "vue";
import { HysTag, HysCheckbox } from "hys-ui";
const removable = ref(false);
const shown = ref(true);
</script>

<template>
  <div class="demo-stack">
    <HysCheckbox v-model="removable">允许移除交付标签</HysCheckbox>
    <div class="demo-row">
      <HysTag v-if="shown" label="华东配送中心交付审批负责人" :max-width="142" closable
        :before-close="() => removable" @close="shown = false" />
      <p v-else role="status">已移除交付标签</p>
    </div>
  </div>
</template>
