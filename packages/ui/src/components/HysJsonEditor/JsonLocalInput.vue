<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from "vue";
import HysButton from "../HysButton/HysButton.vue";
import HysTextarea from "../HysTextarea/HysTextarea.vue";
import HysUpload from "../HysUpload/HysUpload.vue";
import { readJsonTextFile } from "./jsonDocument";

const props = defineProps<{ label: string; accept: string; disabled?: boolean }>();
const text = defineModel<string>({ required: true });
const reading = ref(false);
const error = ref("");
let revision = 0;
onBeforeUnmount(() => { revision++; });
watch(() => props.disabled, value => { if (value) { revision++; reading.value = false; } });
function input(value: string) {
  revision++;
  reading.value = false;
  error.value = "";
  text.value = value;
}
async function read(files: File[]) {
  if (!files.length || props.disabled) return;
  const ticket = ++revision;
  error.value = "";
  reading.value = true;
  try {
    const value = await readJsonTextFile(files[0]);
    if (ticket === revision) text.value = value;
  } catch (failure) {
    if (ticket === revision) error.value = failure instanceof Error ? failure.message : "无法读取文件。";
  } finally {
    if (ticket === revision) reading.value = false;
  }
}
</script>

<template>
  <div class="hys-json-tool-panel">
    <HysTextarea :model-value="text" :aria-label="label" :placeholder="label" :rows="4"
      :disabled="disabled" spellcheck="false" @update:model-value="input" />
    <HysUpload :accept="accept" :multiple="false" :auto-upload="false" :show-file-list="false" :drag="false"
      :disabled="disabled || reading" @select="read">
      <template #trigger><HysButton size="sm" variant="secondary" :loading="reading" :disabled="disabled">打开本地文件</HysButton></template>
    </HysUpload>
    <p v-if="error" class="hys-json-form-error" role="alert">{{ error }}</p>
  </div>
</template>
