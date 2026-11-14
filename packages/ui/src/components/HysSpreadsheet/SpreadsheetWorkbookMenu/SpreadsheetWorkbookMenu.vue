<script setup lang="ts">
import { Download, FilePlus2, FolderOpen, Save } from "lucide-vue-next";
import { useSpreadsheetMessages } from "../spreadsheetMessages";
const message = useSpreadsheetMessages();
import { computed, ref } from "vue";
import HysButton from "../../HysButton/HysButton.vue";
import HysInput from "../../HysInput/HysInput.vue";
import HysUpload from "../../HysUpload/HysUpload.vue";
import type {
  HysSpreadsheetFileFormat,
  HysSpreadsheetWorkbook,
} from "../spreadsheetTypes";

const props = defineProps<{
  readonly?: boolean;
  busy: boolean;
  canSave: boolean;
  canLoad: boolean;
  workbook: HysSpreadsheetWorkbook;
  formats?: readonly HysSpreadsheetFileFormat[];
  saveWorkbookFile: (extension: string, name?: string) => Promise<boolean>;
}>();
const emit = defineEmits<{
  create: [];
  open: [workbook?: HysSpreadsheetWorkbook];
  import: [file: File];
  save: [];
}>();
const saveName = ref("");
const accept = computed(() =>
  props.formats
    ?.filter(({ decode }) => decode)
    .map(({ extension }) => "." + extension.replace(/^\./, ""))
    .join(","),
);

function read([source]: File[]) {
  if (source) emit("import", source);
}
</script>

<template>
  <div class="commands">
    <div class="file-actions">
      <HysButton
        size="sm"
        variant="ghost"
        :icon="FilePlus2"
        :disabled="readonly || busy"
        @click="emit('create')"
        >{{ message("新建") }}</HysButton
      >
      <HysUpload
        class="workbook-upload"
        size="sm"
        :disabled="readonly || busy"
        :accept="accept"
        :show-file-list="false"
        @select="read"
      >
        <template #trigger="{ open }">
          <HysButton
            size="sm"
            variant="ghost"
            :icon="FolderOpen"
            :disabled="readonly || busy"
            @click="open"
            >{{ message("打开文件") }}</HysButton
          >
        </template>
      </HysUpload>
      <HysButton
        v-if="canLoad"
        size="sm"
        variant="ghost"
        :icon="FolderOpen"
        :disabled="readonly || busy"
        @click="emit('open')"
        >{{ message("打开已保存") }}</HysButton
      >
      <HysButton
        v-if="canSave"
        size="sm"
        variant="ghost"
        :icon="Save"
        :disabled="busy"
        @click="emit('save')"
        >{{ message("保存") }}</HysButton
      >
    </div>
    <HysInput
      v-model="saveName"
      class="filename"
      size="sm"
      :aria-label="message('另存文件名')"
      :placeholder="
        workbook.name
          ? message('另存文件名') + ' · ' + workbook.name
          : message('另存文件名')
      "
      :disabled="busy"
    />
    <div class="file-actions">
      <HysButton
        size="sm"
        variant="ghost"
        :icon="Download"
        :disabled="busy"
        @click="saveWorkbookFile('json', saveName)"
        >{{ canSave ? "另存为 JSON" : "保存为 JSON" }}</HysButton
      >
      <template v-for="format in formats" :key="format.extension">
        <HysButton
          v-if="format.encode && format.extension !== 'json'"
          size="sm"
          variant="ghost"
          :icon="Download"
          :disabled="busy"
          @click="saveWorkbookFile(format.extension, saveName)"
          >{{ message("导出") }} {{ format.label }}</HysButton
        >
      </template>
    </div>
  </div>
</template>

<style scoped>
.commands {
  display: grid;
  gap: 8px;
}
.file-actions {
  display: grid;
  gap: 2px;
}
.file-actions .hys-ui-btn,
.workbook-upload :deep(.hys-ui-btn) {
  inline-size: 100%;
  justify-content: flex-start;
}
.filename {
  inline-size: auto;
  margin-inline: 7px;
  padding-block-start: 8px;
  border-block-start: 1px solid var(--hys-ui-theme-border);
}
.workbook-upload :deep(.hys-ui-upload-zone) {
  min-height: 0;
  padding: 0;
  border: 0;
  background: transparent;
}
</style>
