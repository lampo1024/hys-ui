<script setup lang="ts">
import { computed, ref } from "vue";
import HysButton from "../HysButton/HysButton.vue";
import HysInput from "../HysInput/HysInput.vue";
import HysModal from "../HysModal/HysModal.vue";
import HysNumberInput from "../HysNumberInput/HysNumberInput.vue";
import { markdownUrl } from "./markdownSource";

export interface MarkdownInsertFields {
  kind: "link" | "image" | "code" | "table";
  text: string;
  url: string;
  editing: boolean;
}
const props = defineProps<{ values: MarkdownInsertFields }>();
const emit = defineEmits<{ close: []; submit: [values: { text: string; url: string; language: string; rows: number; columns: number }] }>();
const text = ref(props.values.text);
const url = ref(props.values.url);
const language = ref("");
const rows = ref<number | null>(2);
const columns = ref<number | null>(3);
const error = ref("");
const titles = { link: "链接", image: "图片", code: "代码块", table: "表格" };
const title = computed(() => (props.values.editing ? "编辑" : "插入") + titles[props.values.kind]);
function submit() {
  const kind = props.values.kind;
  const address = markdownUrl(url.value, kind === "image");
  if ((kind === "link" || kind === "image") && !address) {
    error.value = kind === "image" ? "请输入有效的 HTTPS 图片地址。" : "请输入有效的 HTTP、HTTPS、相对地址或文内锚点。";
    return;
  }
  if (kind === "code" && !/^[a-zA-Z0-9_+.#-]*$/.test(language.value.trim())) {
    error.value = "请输入有效的语言标识，例如 typescript。";
    return;
  }
  if (kind === "table" && (!rows.value || !columns.value)) return;
  emit("submit", { text: text.value, url: address ?? "", rows: rows.value ?? 2, columns: columns.value ?? 3, language: language.value.trim() });
}
function enter(event: KeyboardEvent) {
  if (event.isComposing || event.keyCode === 229 || props.values.kind === "table") return;
  event.preventDefault();
  submit();
}
</script>

<template>
  <HysModal open :title="title" size="sm" drag-mode="preview" :restore-focus="false" @close="emit('close')">
    <div class="hys-md-fields" @keydown.enter.stop="enter">
      <template v-if="values.kind === 'link' || values.kind === 'image'">
        <HysInput v-model="url" :label="values.kind === 'image' ? '图片地址' : '链接地址'"
          :placeholder="values.kind === 'image' ? 'https://example.com/image.png' : 'https://example.com 或 #章节'"
          :error="error" @update:model-value="error = ''" />
        <HysInput v-model="text" :label="values.kind === 'image' ? '替代文字' : '显示文字'" />
      </template>
      <HysInput v-else-if="values.kind === 'code'" v-model="language" label="语言标识" placeholder="例如 typescript"
        :error="error" @update:model-value="error = ''" />
      <div v-else class="hys-md-table-fields">
        <label>数据行数<HysNumberInput v-model="rows" aria-label="数据行数" :min="1" :max="50" :precision="0" block /></label>
        <label>列数<HysNumberInput v-model="columns" aria-label="列数" :min="1" :max="20" :precision="0" block /></label>
      </div>
    </div>
    <template #footer>
      <HysButton variant="secondary" @click="emit('close')">取消</HysButton>
      <HysButton variant="primary" :disabled="values.kind === 'table' && (!rows || !columns)" @click="submit">{{ values.editing ? "保存" : "插入" }}</HysButton>
    </template>
  </HysModal>
</template>

<style scoped>
.hys-md-fields, .hys-md-table-fields, .hys-md-table-fields label { display: grid; gap: 10px; }
.hys-md-table-fields { grid-template-columns: repeat(auto-fit, minmax(min(100%, 120px), 1fr)); }
.hys-md-table-fields label { gap: 6px; font-size: 13px; }
</style>
