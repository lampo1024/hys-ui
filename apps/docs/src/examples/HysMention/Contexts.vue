<script setup lang="ts">
import { ref } from "vue";
import { HysButton, HysDrawer, HysMention, HysModal } from "hys-ui";

const dialog = ref(false);
const drawer = ref(false);
const text = ref("");
const options = [
  { id: "one", value: "张三", description: "研发" },
  { id: "two", value: "李娜", description: "设计" },
];
</script>

<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <HysButton size="sm" variant="secondary" @click="dialog = true"
        >打开对话框</HysButton
      >
      <HysButton size="sm" variant="secondary" @click="drawer = true"
        >打开抽屉</HysButton
      >
    </div>
    <HysModal v-model:open="dialog" title="对话框里的提及">
      <HysMention
        v-model="text"
        :options="options"
        show-arrow
        placeholder="在对话框输入 @"
      />
    </HysModal>
    <HysDrawer v-model:open="drawer" title="抽屉里的提及">
      <HysMention
        v-model="text"
        :options="options"
        :append-to="false"
        placeholder="在抽屉输入 @"
      />
    </HysDrawer>
    <output class="state-output">{{ text }}</output>
  </div>
</template>
