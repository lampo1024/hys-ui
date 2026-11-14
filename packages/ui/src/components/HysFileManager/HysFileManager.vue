<script setup lang="ts">
import { useHysControlState } from "../../composables/formContext";
import { useHysRootAttrs } from "../../config";
import HysButton from "../HysButton/HysButton.vue";
import HysProgress from "../HysProgress/HysProgress.vue";
import HysUpload from "../HysUpload/HysUpload.vue";

export interface ManagedFile {
  id: string;
  name: string;
  size: number;
  url?: string;
  status?: "uploading" | "error" | "ready";
  progress?: number;
}
export interface HysFileRejection {
  file: File;
  reason: "type" | "size" | "count";
}
const props = withDefaults(
  defineProps<{
    disabled?: boolean;
    accept?: string;
    maxSize?: number;
    maxCount?: number;
    multiple?: boolean;
    emptyText?: string;
    retryable?: boolean;
  }>(),
  { multiple: true, emptyText: "暂无附件" },
);
const { disabled: controlDisabled } = useHysControlState(props);
const hysRootAttrs = useHysRootAttrs();
const files = defineModel<ManagedFile[]>({ default: () => [] });
const emit = defineEmits<{
  upload: [files: File[]];
  remove: [id: string];
  download: [id: string];
  reject: [files: HysFileRejection[]];
  retry: [id: string];
}>();
function accepted(file: File) {
  const tokens = props.accept
    ?.split(",")
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean);
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  return (
    !tokens?.length ||
    tokens.some((token) =>
      token.startsWith(".")
        ? name.endsWith(token)
        : token.endsWith("/*")
          ? type.startsWith(token.slice(0, -1))
          : token === type,
    )
  );
}
function nonnegative(value?: number) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? Math.floor(value)
    : Infinity;
}
function add(selected: File[]) {
  if (controlDisabled.value || !selected.length) return;
  const acceptedFiles: File[] = [];
  const rejected: HysFileRejection[] = [];
  const limit = Math.min(
    props.multiple ? Infinity : 1,
    Math.max(0, nonnegative(props.maxCount) - files.value.length),
  );
  const size = nonnegative(props.maxSize);
  for (const file of Array.from(selected)) {
    if (!accepted(file)) rejected.push({ file, reason: "type" });
    else if (file.size > size) rejected.push({ file, reason: "size" });
    else if (acceptedFiles.length >= limit)
      rejected.push({ file, reason: "count" });
    else acceptedFiles.push(file);
  }
  if (acceptedFiles.length) emit("upload", acceptedFiles);
  if (rejected.length) emit("reject", rejected);
}

function choose(event: Event) {
  const input = event.target;
  if (!(input instanceof HTMLInputElement) || input.type !== "file") return;
  event.stopPropagation();
  add(Array.from(input.files ?? []));
  input.value = "";
}

function drop(event: DragEvent) {
  if (controlDisabled.value || !event.dataTransfer?.files.length) return;
  event.preventDefault();
  add(Array.from(event.dataTransfer.files));
}
function format(size: number) {
  return size < 1024 ? size + " B" : (size / 1024).toFixed(1) + " KB";
}
</script>

<template>
  <div v-bind="hysRootAttrs" class="hys-ui-ent-panel" @change.capture="choose">
    <HysUpload :disabled="controlDisabled" trigger-label="选择或拖入文件" drag
      :accept="accept" :multiple="multiple" :show-file-list="false"
      :file-list="[]" :validate-event="false" @drop="drop">
      <template #trigger>
      拖拽文件至此或点击选择
      </template>
    </HysUpload>
    <ul class="hys-ui-ent-files">
      <li v-for="file in files" :key="file.id">
        <div class="hys-file-description">
          <span>{{ file.name }} · {{ format(file.size) }}</span>
          <HysProgress v-if="file.status === 'uploading'" class="hys-file-progress" :show-label="false" :stroke-width="6"
            :value="file.progress ?? 0" :indeterminate="!Number.isFinite(file.progress)"
            :aria-label="'上传 ' + file.name" />
          <small v-else-if="file.status === 'error'" class="hys-ui-ent-error">上传失败</small>
        </div>
        <HysButton v-if="retryable && file.status === 'error'" size="sm" variant="ghost" :disabled="controlDisabled"
          :aria-label="'重试 ' + file.name" @click="!controlDisabled && emit('retry', file.id)">重试</HysButton>
        <HysButton size="sm" variant="ghost"
          :disabled="controlDisabled || file.status === 'uploading' || file.status === 'error'"
          @click="!controlDisabled && file.status !== 'uploading' && file.status !== 'error' && emit('download', file.id)"
        >
          下载
        </HysButton>
        <HysButton size="sm" variant="ghost"
          :disabled="controlDisabled"
          @click="!controlDisabled && emit('remove', file.id)"
        >
          移除
        </HysButton>
      </li>
    </ul>
    <p v-if="!files.length" class="hys-ui-ent-muted">{{ emptyText }}</p>
  </div>
</template>

<style scoped>
.hys-file-description {
  display: grid;
  gap: 4px;
  flex: 1;
  min-width: 0;
  overflow-wrap: anywhere;
}
.hys-file-progress {
  width: min(100%, 130px);
}
</style>
