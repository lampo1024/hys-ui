<script setup lang="ts">
import { ref } from "vue";
import { HysCheckbox, HysKeyValueEditor, type HysKeyValueEntry } from "hys-ui";
const rows = ref<HysKeyValueEntry[]>([
  { id: 1, key: "APP_NAME", value: "dispatch", disabled: true },
  { id: 2, key: "region", value: "east" },
]);
const readonly = ref(false);
const validate = (key: string) => /^[A-Z][A-Z0-9_]*$/.test(key) ? undefined : "请输入大写配置名";
</script>

<template>
  <div class="demo-stack">
    <HysCheckbox v-model="readonly">只读预览</HysCheckbox>
    <HysKeyValueEditor v-model="rows" :readonly="readonly" :validate-key="validate" :max-key-length="24" />
  </div>
</template>
