<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import { HysCheckbox, HysButton, type HysCheckboxInstance } from "hys-ui";
const value = ref(false),
  control = ref<HysCheckboxInstance>();
</script>
<template>
  <div class="demo-content">
    <div class="demo-row">
      <HysButton size="sm" @click="control?.focus()">聚焦复选框</HysButton
      ><HysButton size="sm" @click="control?.toggle()">切换选中</HysButton>
    </div>
    <HysCheckbox ref="control" v-model="value" label="可用空格切换" /><output>{{
      value
    }}</output>
  </div>
</template>
