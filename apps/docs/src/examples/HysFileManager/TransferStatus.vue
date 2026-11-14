<script setup lang="ts">
import { onScopeDispose, ref } from "vue";
import { HysFileManager, type ManagedFile } from "hys-ui";
const files = ref<ManagedFile[]>([
  { id: "a", name: "orders.csv", size: 12800, status: "error" },
]);
const timers = new Map<string, ReturnType<typeof setInterval>>();
let id = 0;
function remove(key: string) {
  clearInterval(timers.get(key));
  timers.delete(key);
  files.value = files.value.filter((file) => file.id !== key);
}
function start(key: string) {
  if (timers.has(key)) return;
  const file = files.value.find((item) => item.id === key);
  if (!file) return;
  file.status = "uploading";
  file.progress = 0;
  timers.set(
    key,
    setInterval(() => {
      file.progress = Math.min(100, (file.progress ?? 0) + 25);
      if (file.progress === 100) {
        file.status = "ready";
        clearInterval(timers.get(key));
        timers.delete(key);
      }
    }, 220),
  );
}
function add(selected: File[]) {
  for (const file of selected) {
    const key = String(++id);
    files.value.push({ id: key, name: file.name, size: file.size });
    start(key);
  }
}
onScopeDispose(() => timers.forEach((timer) => clearInterval(timer)));
</script>

<template>
  <HysFileManager
    v-model="files"
    retryable
    @retry="start"
    @upload="add"
    @remove="remove"
  />
</template>
