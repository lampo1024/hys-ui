<script setup lang="ts">
import { ref } from "vue";
import { HysKeyValueEditor, type HysKeyValueEntry } from "hys-ui";
const rows = ref<HysKeyValueEntry[]>([
  { id: "accept", key: "Accept", value: "application/json" },
  { id: "region", key: "X-Region", value: "cn-east" },
]);
const snapshot = ref<Record<string, unknown> | null>(Object.fromEntries(rows.value.map(row => [row.key, row.value])));
</script>

<template>
  <div class="demo-stack">
    <HysKeyValueEditor v-model="rows" @change="(_, object) => snapshot = object" />
    <pre v-if="snapshot">{{ JSON.stringify(snapshot, null, 2) }}</pre>
    <p v-else role="status">修正键名后可读取对象。</p>
  </div>
</template>
