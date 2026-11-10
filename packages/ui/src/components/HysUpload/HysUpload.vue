<script setup lang="ts" generic="T extends HysUploadItem = HysUploadFile">
import {
  computed,
  nextTick,
  onMounted,
  onUpdated,
  ref,
  useAttrs,
  watch,
} from "vue";
import {
  CloudUpload,
  FileText,
  ImageOff,
  X,
  Eye,
  Download,
  RotateCw,
  LoaderCircle,
  CheckCircle2,
  AlertCircle,
  Pause,
} from "lucide-vue-next";
import HysButton from "../HysButton/HysButton.vue";
import HysProgress from "../HysProgress/HysProgress.vue";
import HysModal from "../HysModal/HysModal.vue";
import { useHysRootAttrs } from "../../config";
import { useUpload } from "../../composables/useUpload";
import {
  uploadStatus,
  uploadPercent,
  uploadSize,
  type HysUploadProps,
  type HysUploadFile,
  type HysUploadItem,
  type HysUploadSlots,
  type HysUploadChange,
  type HysUploadInvalid,
  type HysUploadError,
} from "../../composables/upload";
export type { HysUploadFile } from "../../composables/upload";
defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<HysUploadProps<T>>(), {
  multiple: true,
  drag: true,
  showFileList: true,
  listType: "text",
  showToolbar: true,
  showPreview: true,
  showDownload: true,
  showRemove: true,
  showRetry: true,
  openFileDialogOnClick: true,
  autoUpload: true,
  concurrency: 2,
  method: "POST",
  name: "file",
  validateEvent: true,
  listHeight: 320,
});
const emit = defineEmits<{
  "update:fileList": [files: T[]];
  "update:modelValue": [files: T[]];
  change: [files: T[]];
  fileChange: [change: HysUploadChange<T>];
  remove: [file: T];
  exceed: [files: File[]];
  error: [message: string];
  select: [files: File[]];
  invalid: [info: HysUploadInvalid<T>];
  start: [file: T];
  progress: [percentage: number, file: T];
  success: [response: unknown, file: T];
  uploadError: [error: HysUploadError, file: T];
  removeError: [error: Error, file: T];
  abort: [file: T, reason: string];
  preview: [file: T];
  download: [file: T];
  drop: [event: DragEvent];
  paste: [event: ClipboardEvent];
}>();
defineSlots<HysUploadSlots<T>>();
const skin = useHysRootAttrs(),
  attrs = useAttrs(),
  state = useUpload(props, (name, ...args) => (emit as any)(name, ...args));
const rootAttrs = computed(() =>
  Object.fromEntries(
    Object.entries(attrs).filter(([key]) => !["id", "form"].includes(key)),
  ),
);
const customTrigger = ref(false);
function inspectTrigger() {
  customTrigger.value = !!state.zone.value?.querySelector(
    'button,a[href],input,select,textarea,[tabindex="0"]',
  );
}
onMounted(inspectTrigger);
onUpdated(inspectTrigger);
const statuses = (file: T) => state.context(file),
  busy = (file: T) => state.requests.activeKeys.value.has(file.uid),
  canMutate = computed(() => state.available.value);
const rows = new Map<string, HTMLElement>();
const brokenImages = ref(new Map<string, string>());
watch(
  () => state.files.value.map((file) => file.uid),
  (keys) => {
    const present = new Set(keys);
    for (const key of brokenImages.value.keys())
      if (!present.has(key)) brokenImages.value.delete(key);
  },
);
async function remove(file: T) {
  const index = state.files.value.findIndex((f) => f.uid === file.uid);
  if (await state.remove(file)) {
    await nextTick();
    const next =
      state.files.value[Math.min(index, state.files.value.length - 1)];
    if (next) rows.get(next.uid)?.focus({ preventScroll: true });
    else state.focus();
  }
}
function rowKey(event: KeyboardEvent, file: T) {
  if (
    (event.target as HTMLElement).closest(
      'input,textarea,select,[contenteditable="true"]',
    )
  )
    return;
  const index = state.files.value.findIndex((f) => f.uid === file.uid);
  if (event.key === "Delete" && canMutate.value && props.showRemove) {
    event.preventDefault();
    void remove(file);
  } else if (
    event.target === event.currentTarget &&
    ["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)
  ) {
    event.preventDefault();
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? state.files.value.length - 1
          : Math.max(
              0,
              Math.min(
                state.files.value.length - 1,
                index + (event.key === "ArrowDown" ? 1 : -1),
              ),
            );
    rows.get(state.files.value[next]?.uid)?.focus();
  }
}
function rowRef(uid: string, el: unknown) {
  if (el instanceof HTMLElement) rows.set(uid, el);
  else rows.delete(uid);
}
function label(file: T) {
  if (state.removing.value.has(file.uid)) return state.words.value.removing;
  if (state.requests.queuedKeys.value.has(file.uid))
    return state.words.value.queued;
  if (busy(file) && uploadStatus(file) === "ready")
    return state.words.value.checking;
  return state.words.value[uploadStatus(file)];
}
const listStyle = computed(() => ({
  ...props.listStyle,
  maxHeight:
    typeof props.listHeight === "number"
      ? (Number.isFinite(props.listHeight)
          ? Math.max(80, props.listHeight)
          : 320) + "px"
      : props.listHeight,
}));
defineExpose({
  element: state.element,
  input: state.input,
  files: state.files,
  busy: state.checking,
  uploading: state.requests.uploading,
  queued: state.requests.queued,
  open: state.open,
  focus: state.focus,
  addFiles: state.addFiles,
  getFiles: () => [...state.files.value],
  clearFiles: state.clearFiles,
  remove: state.remove,
  submit: (file?: T | string) =>
    state.requests.submit(typeof file === "string" ? file : file?.uid),
  retry: (file: T | string) =>
    state.requests.retry(typeof file === "string" ? file : file.uid),
  abort: (file?: T | string) =>
    state.requests.abort(typeof file === "string" ? file : file?.uid),
  preview: state.previewFile,
  download: state.download,
});
</script>
<template>
  <div
    :ref="(el) => (state.element.value = el as HTMLElement)"
    v-bind="{ ...skin, ...rootAttrs }"
    class="hys-ui-upload"
    :class="[
      'hys-ui-upload-' + state.size.value,
      {
        'hys-ui-upload-disabled': state.disabled.value,
        'hys-ui-upload-readonly': readonly,
      },
    ]"
    role="group"
    :aria-label="ariaLabel || state.label.value || '文件上传'"
    :aria-busy="
      state.checking.value || state.requests.uploading.value > 0 || undefined
    "
    :aria-invalid="!!(error || state.field?.invalid?.value) || undefined"
    :aria-describedby="state.field?.describedBy.value"
    @paste="state.paste"
    @focusout="state.blur"
  >
    <div
      :ref="(el) => (state.zone.value = el as HTMLElement)"
      class="hys-ui-upload-zone"
      :class="{
        'hys-ui-upload-dragging': state.dragging.value,
        'hys-ui-upload-click': !drag,
      }"
      :role="customTrigger ? undefined : 'button'"
      :aria-disabled="!canMutate || state.checking.value"
      :tabindex="customTrigger || !canMutate ? -1 : 0"
      :aria-label="triggerLabel || state.label.value || '选择上传文件'"
      @click="state.click"
      @keydown="state.keys"
      @dragenter="state.dragEnter"
      @dragover="state.dragOver"
      @dragleave="state.dragLeave"
      @drop="state.drop"
    >
      <slot name="trigger" v-bind="state.scope.value"
        ><slot v-bind="state.scope.value"
          ><LoaderCircle
            v-if="state.checking.value"
            class="hys-ui-upload-spinner"
            :size="28"
            aria-hidden="true"
          /><CloudUpload v-else :size="28" aria-hidden="true" /><strong>{{
            state.checking.value
              ? state.words.value.checking
              : drag
                ? state.words.value.drag
                : state.words.value.choose
          }}</strong
          ><span>{{
            state.requests.configured.value
              ? state.words.value.uploadHint
              : state.words.value.localHint
          }}</span></slot
        ></slot
      >
    </div>
    <input
      :ref="(el) => (state.input.value = el as HTMLInputElement)"
      :id="(attrs.id as string) || state.field?.id.value"
      :form="attrs.form as string"
      hidden
      type="file"
      :accept="accept"
      :multiple="multiple"
      :webkitdirectory="directory || undefined"
      :disabled="!canMutate || state.checking.value"
      @change="
        state.addFiles(
          Array.from(($event.target as HTMLInputElement).files || []),
        )
      "
    />
    <div v-if="$slots.tip" class="hys-ui-upload-tip">
      <slot name="tip" v-bind="state.scope.value" />
    </div>
    <p
      v-if="error || state.lastError.value"
      class="hys-ui-upload-error"
      role="alert"
    >
      {{ error || state.lastError.value }}
    </p>
    <template v-if="showFileList">
      <div
        v-if="state.files.value.length && showToolbar"
        class="hys-ui-upload-toolbar"
      >
        <slot name="toolbar" v-bind="state.scope.value"
          ><span class="hys-ui-upload-count"
            >{{ state.words.value.files }}
            <strong>{{ state.files.value.length }}</strong></span
          >
          <div class="hys-ui-upload-actions">
            <HysButton
              v-if="state.requests.configured.value"
              variant="ghost"
              size="sm"
              :disabled="
                !canMutate ||
                !state.files.value.some(
                  (file) =>
                    file.raw && ['ready', 'error'].includes(uploadStatus(file)),
                )
              "
              @click="state.requests.submit()"
              >{{ state.words.value.submit }}</HysButton
            ><HysButton
              v-if="
                state.requests.uploading.value || state.requests.queued.value
              "
              variant="ghost"
              size="sm"
              :disabled="!canMutate"
              @click="state.requests.abort()"
              >{{ state.words.value.abort }}</HysButton
            ><HysButton
              variant="ghost"
              size="sm"
              :disabled="!canMutate"
              @click="state.clearFiles()"
              >{{ state.words.value.clear }}</HysButton
            >
          </div></slot
        >
      </div>
      <ul
        v-if="state.files.value.length"
        class="hys-ui-upload-list"
        :class="'hys-ui-upload-list-' + listType"
        :style="listStyle"
        :aria-label="state.words.value.files"
      >
        <li
          v-for="(file, index) in state.files.value"
          :key="file.uid"
          :ref="(el) => rowRef(file.uid, el)"
          class="hys-ui-upload-file"
          :class="[
            'hys-ui-upload-file-' + uploadStatus(file),
            { 'hys-ui-upload-file-busy': busy(file) },
          ]"
          :data-upload-uid="file.uid"
          :tabindex="index === 0 ? 0 : -1"
          @keydown="rowKey($event, file)"
        >
          <slot v-if="$slots.item" name="item" v-bind="statuses(file)" />
          <template v-else>
            <div
              class="hys-ui-upload-thumbnail"
              :class="{ 'hys-ui-upload-thumbnail-image': listType !== 'text' }"
            >
              <img
                v-if="
                  listType !== 'text' &&
                  statuses(file).thumbnail &&
                  brokenImages.get(file.uid) !== statuses(file).thumbnail
                "
                :src="statuses(file).thumbnail"
                :alt="file.name"
                loading="lazy"
                @error="brokenImages.set(file.uid, statuses(file).thumbnail!)"
              /><ImageOff
                v-else-if="listType !== 'text' && statuses(file).thumbnail"
                :size="28"
                aria-hidden="true"
              /><FileText
                v-else
                :size="listType === 'text' ? 20 : 28"
                aria-hidden="true"
              />
            </div>
            <div class="hys-ui-upload-file-content">
              <slot name="file" v-bind="statuses(file)"
                ><span class="hys-ui-upload-name" :title="file.name">{{
                  file.name
                }}</span></slot
              >
              <div class="hys-ui-upload-meta">
                <span v-if="file.size !== undefined">{{
                  uploadSize(file.size)
                }}</span
                ><span class="hys-ui-upload-status"
                  ><LoaderCircle
                    v-if="busy(file) || state.removing.value.has(file.uid)"
                    class="hys-ui-upload-spinner"
                    :size="12"
                    aria-hidden="true"
                  /><CheckCircle2
                    v-else-if="uploadStatus(file) === 'success'"
                    :size="12"
                    aria-hidden="true"
                  /><AlertCircle
                    v-else-if="uploadStatus(file) === 'error'"
                    :size="12"
                    aria-hidden="true"
                  />{{ label(file) }}</span
                >
              </div>
              <slot
                v-if="uploadStatus(file) === 'uploading'"
                name="progress"
                v-bind="statuses(file)"
                ><HysProgress
                  :value="uploadPercent(file)"
                  :stroke-width="3"
                  :show-label="false"
                  :aria-label="file.name + ' 上传进度'" /></slot
              ><span
                v-if="file.error && uploadStatus(file) === 'error'"
                class="hys-ui-upload-file-error"
                role="status"
                >{{ file.error.message }}</span
              >
            </div>
            <div class="hys-ui-upload-row-actions">
              <HysButton
                v-if="state.canPreview(file)"
                variant="ghost"
                size="sm"
                :disabled="state.disabled.value || loading"
                :aria-label="state.words.value.preview + file.name"
                @click="state.previewFile(file)"
                ><Eye :size="15" aria-hidden="true" /></HysButton
              ><HysButton
                v-if="state.canDownload(file)"
                variant="ghost"
                size="sm"
                :disabled="state.disabled.value || loading"
                :aria-label="state.words.value.download + file.name"
                @click="state.download(file)"
                ><Download :size="15" aria-hidden="true" /></HysButton
              ><HysButton
                v-if="
                  busy(file) || state.requests.queuedKeys.value.has(file.uid)
                "
                variant="ghost"
                size="sm"
                :disabled="!canMutate"
                :aria-label="state.words.value.abort + file.name"
                @click="state.requests.abort(file.uid)"
                ><Pause :size="15" aria-hidden="true" /></HysButton
              ><HysButton
                v-else-if="
                  showRetry &&
                  file.raw &&
                  uploadStatus(file) === 'error' &&
                  state.requests.configured.value
                "
                variant="ghost"
                size="sm"
                :disabled="!canMutate"
                :aria-label="state.words.value.retry + file.name"
                @click="state.requests.retry(file.uid)"
                ><RotateCw :size="15" aria-hidden="true" /></HysButton
              ><HysButton
                v-if="showRemove"
                variant="ghost"
                size="sm"
                :disabled="!canMutate || state.removing.value.has(file.uid)"
                :aria-label="state.words.value.remove + file.name"
                @click="remove(file)"
                ><LoaderCircle
                  v-if="state.removing.value.has(file.uid)"
                  class="hys-ui-upload-spinner"
                  :size="15"
                  aria-hidden="true" /><X v-else :size="15" aria-hidden="true"
              /></HysButton>
            </div>
          </template>
        </li>
      </ul>
      <div v-else-if="$slots.empty" class="hys-ui-upload-empty">
        <slot name="empty" v-bind="state.scope.value" />
      </div>
    </template>
    <HysModal
      :open="!!state.preview.value"
      :title="state.preview.value?.file.name || state.words.value.preview"
      :footer="false"
      size="lg"
      @close="state.closePreview"
      ><template v-if="state.preview.value"
        ><slot
          name="preview"
          :file="state.preview.value.file"
          :url="state.preview.value.url"
          :close="state.closePreview"
          ><img
            class="hys-ui-upload-preview-image"
            :src="state.preview.value.url"
            :alt="state.preview.value.file.name" /></slot></template
    ></HysModal>
  </div>
</template>
<style scoped>
.hys-ui-upload {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}
.hys-ui-upload-zone {
  box-sizing: border-box;
  min-height: 146px;
  outline: 0;
  transition:
    background-color 0.15s,
    border-color 0.15s;
}
.hys-ui-upload-zone:not([aria-disabled="true"]):hover,
.hys-ui-upload-zone:focus-visible {
  border-color: var(--hys-ui-primary, var(--hys-ui-theme-primary));
  background: color-mix(
    in srgb,
    var(--hys-ui-primary, var(--hys-ui-theme-primary)) 5%,
    var(--hys-ui-surface, var(--hys-ui-theme-surface))
  );
}
.hys-ui-upload-zone:focus-visible {
  outline: 2px solid var(--hys-ui-primary, var(--hys-ui-theme-primary));
  outline-offset: 3px;
}
.hys-ui-upload-zone[aria-disabled="true"] {
  opacity: 0.55;
  cursor: not-allowed;
}
.hys-ui-upload-zone.hys-ui-upload-dragging {
  background: var(--hys-ui-primary-soft, var(--hys-ui-theme-primary-soft));
  border-style: solid;
}
.hys-ui-upload-zone.hys-ui-upload-click {
  min-height: unset;
  border: 0;
  padding: 0;
  align-items: flex-start;
  background: none;
  color: inherit;
}
.hys-ui-upload-tip,
.hys-ui-upload-meta {
  font-size: 12px;
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted));
  line-height: 1.6;
}
.hys-ui-upload-error,
.hys-ui-upload-file-error {
  margin: 0;
  color: var(--hys-ui-red, var(--hys-ui-theme-red));
  font-size: 12px;
  line-height: 1.5;
  overflow-wrap: anywhere;
}
.hys-ui-upload-toolbar,
.hys-ui-upload-actions,
.hys-ui-upload-row-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}
.hys-ui-upload-toolbar {
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
}
.hys-ui-upload-count {
  font-size: 12px;
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted));
}
.hys-ui-upload-count strong {
  color: var(--hys-ui-text, var(--hys-ui-theme-text));
  margin-left: 4px;
}
.hys-ui-upload-list {
  margin: 0;
  padding: 2px;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: auto;
  overscroll-behavior: contain;
}
.hys-ui-upload-file {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--hys-ui-border, var(--hys-ui-theme-border));
  border-radius: 10px;
  min-width: 0;
  flex: none;
  outline: none;
}
.hys-ui-upload-file:focus-visible {
  outline: 2px solid var(--hys-ui-primary, var(--hys-ui-theme-primary));
  outline-offset: 0;
}
.hys-ui-upload-file-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.hys-ui-upload-name {
  font-size: 13px;
  font-weight: 550;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.hys-ui-upload-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.hys-ui-upload-status {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.hys-ui-upload-file-success .hys-ui-upload-status {
  color: var(--hys-ui-green, var(--hys-ui-theme-green));
}
.hys-ui-upload-file-error .hys-ui-upload-status {
  color: var(--hys-ui-red, var(--hys-ui-theme-red));
}
.hys-ui-upload-thumbnail {
  flex: none;
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted));
  display: grid;
  place-items: center;
}
.hys-ui-upload-thumbnail-image {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  overflow: hidden;
  background: var(--hys-ui-surface-alt, var(--hys-ui-theme-surface-alt));
}
.hys-ui-upload-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.hys-ui-upload-row-actions {
  flex: none;
  flex-wrap: wrap;
  justify-content: flex-end;
}
.hys-ui-upload-row-actions :deep(.hys-ui-btn) {
  padding: 5px;
  min-height: 28px;
  width: 28px;
}
.hys-ui-upload-list-picture-card {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(165px, 1fr));
  align-items: stretch;
}
.hys-ui-upload-list-picture-card .hys-ui-upload-file {
  flex-direction: column;
  align-items: stretch;
  gap: 10px;
}
.hys-ui-upload-list-picture-card .hys-ui-upload-thumbnail {
  width: 100%;
  height: 112px;
}
.hys-ui-upload-list-picture-card .hys-ui-upload-row-actions {
  justify-content: flex-start;
}
.hys-ui-upload-sm .hys-ui-upload-zone {
  min-height: 118px;
  padding: 18px;
}
.hys-ui-upload-sm .hys-ui-upload-file {
  padding: 8px;
}
.hys-ui-upload-lg .hys-ui-upload-zone {
  min-height: 170px;
  padding: 30px;
}
.hys-ui-upload-lg .hys-ui-upload-name {
  font-size: 15px;
}
.hys-ui-upload-preview-image {
  display: block;
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
  margin: auto;
}
.hys-ui-upload-spinner {
  animation: hys-ui-upload-spin 1s linear infinite;
}
@keyframes hys-ui-upload-spin {
  to {
    transform: rotate(360deg);
  }
}
:where([data-hys-motion="off"]) .hys-ui-upload-spinner {
  animation: none;
}
@media (prefers-reduced-motion: reduce) {
  .hys-ui-upload-spinner {
    animation: none;
  }
  .hys-ui-upload-zone {
    transition: none;
  }
}
@media (max-width: 500px) {
  .hys-ui-upload-file {
    gap: 8px;
    padding: 9px;
  }
  .hys-ui-upload-row-actions {
    max-width: 64px;
  }
  .hys-ui-upload-list-picture-card .hys-ui-upload-row-actions {
    max-width: none;
  }
  .hys-ui-upload-list-picture-card {
    grid-template-columns: repeat(auto-fill, minmax(145px, 1fr));
  }
}
</style>
