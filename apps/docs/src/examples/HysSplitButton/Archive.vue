<script setup lang="ts">
import { ref } from "vue";
import { HysCheckbox, HysSplitButton } from "hys-ui";
const busy = ref(false);
const message = ref("待处理");
const actions = [{ key: "移到回收站", label: "移到回收站", danger: true }];
</script>

<template>
  <div class="demo-stack">
    <HysCheckbox v-model="busy">显示处理中</HysCheckbox>
    <HysSplitButton label="归档草稿" variant="danger" :items="actions" :loading="busy" @click="message = '已归档'" @select="message = String($event)" />
    <p aria-live="polite">{{ message }}</p>
  </div>
</template>
