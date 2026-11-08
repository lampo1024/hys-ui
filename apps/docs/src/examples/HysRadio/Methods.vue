<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import { HysRadio, HysButton, type HysRadioInstance } from "hys-ui";
const value = ref<string | null>(null),
  control = ref<HysRadioInstance>();
</script>
<template>
  <div class="demo-content">
    <div class="demo-row">
      <HysButton size="sm" @click="control?.focus()">聚焦单选框</HysButton
      ><HysButton size="sm" @click="control?.select()">选中此项</HysButton>
    </div>
    <HysRadio
      ref="control"
      v-model="value"
      value="choice"
      label="目标选项"
    /><output>{{ value || "未选择" }}</output>
  </div>
</template>
