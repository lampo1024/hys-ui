<script setup lang="ts">
import { computed, onBeforeUnmount, ref, useId, watch, type VNodeChild } from "vue";
import { useHysRootAttrs } from "../../config";
import HysButton from "../HysButton/HysButton.vue";
import HysEmpty from "../HysEmpty/HysEmpty.vue";
import HysInput from "../HysInput/HysInput.vue";
import HysModal from "../HysModal/HysModal.vue";
import HysCopyButton from "../HysCopyButton/HysCopyButton.vue";
import HysSelect from "../HysSelect/HysSelect.vue";
import HysUpload from "../HysUpload/HysUpload.vue";
import { keyValueFromText, readKeyValueRows, type HysKeyValueType, type HysKeyValueValue } from "./keyValueData";
export type { HysKeyValueType, HysKeyValueValue } from "./keyValueData";
import HysSortableList from "../HysSortableList/HysSortableList.vue";
import { Plus, Trash2 } from "../HysIcon/svgIcons";

export interface HysKeyValueEntry {
  id: string | number;
  key: string;
  value: string;
  disabled?: boolean;
  /** 值类型，省略时按原始文本读取。 */
  type?: HysKeyValueType;
  /** 使用密码遮掩该行的文本。 */
  sensitive?: boolean;
}
export interface HysKeyValueEditorProps {
  /** 受控数据，按行数组输出。每行 id 必须唯一且稳定。 */
  modelValue: readonly HysKeyValueEntry[];
  /** 禁止全部编辑、增删和移动。 */
  disabled?: boolean;
  /** 保留查看，禁止编辑。 */
  readonly?: boolean;
  /** 键名长度上限，默认 80。 */
  maxKeyLength?: number;
  /** 附加验证，返回该行错误文案。 */
  validateKey?: (key: string, entry: HysKeyValueEntry) => string | undefined;
  /** 附加值验证，返回该行的错误文案。 */
  validateValue?: (value: HysKeyValueValue, entry: HysKeyValueEntry) => string | undefined;
  /** 显示每行的类型选择。 */
  typed?: boolean;
  /** 启用 JSON 文件导入、批量粘贴以及 JSON 预览、复制与下载。 */
  showTools?: boolean;
  /** 键占位，默认「键名」。 */
  keyPlaceholder?: string;
  /** 值占位，默认「值」。 */
  valuePlaceholder?: string;
}
const props = withDefaults(defineProps<HysKeyValueEditorProps>(), { maxKeyLength: 80, keyPlaceholder: "键名", valuePlaceholder: "值" });
const emit = defineEmits<{
  /** 修改、插入、删除、排序时请求更新行数组。 */
  "update:modelValue": [entries: HysKeyValueEntry[]];
  /** 提交请求时提供行数组和校验结果，存在行错误时 object 为 null。 */
  change: [entries: HysKeyValueEntry[], object: Record<string, HysKeyValueValue> | null];
}>();
defineSlots<{
  /** 自定义空数据文案。 */
  empty?: () => VNodeChild;
}>();
const skin = useHysRootAttrs();
const rootId = useId();
let lastId = 0;
const valueTypes = [{ value: "string", label: "文本" }, { value: "number", label: "数字" }, { value: "boolean", label: "布尔值" }, { value: "json", label: "JSON" }] as const;
const tool = ref<"import" | "export">("import");
const opened = ref(false);
const format = ref<"json" | "pairs">("json");
const pasted = ref("");
const parsingError = ref("");
const reading = ref(false);
let fileRead = 0;
const importFormats = [{ value: "json", label: "JSON 对象" }, { value: "pairs", label: "每行键值（Tab 或 = 分隔）" }] as const;
const locked = computed(() => !!(props.readonly || props.disabled));
function issues(rows: readonly HysKeyValueEntry[]) {
  const counts = new Map<string, number>();
  for (const entry of rows) counts.set(entry.key, (counts.get(entry.key) ?? 0) + 1);
  return rows.map(entry => ({
    key: !entry.key.trim() ? "请输入键名"
      : entry.key.length > props.maxKeyLength ? "键名不能超过 " + props.maxKeyLength + " 个字符"
      : counts.get(entry.key)! > 1 ? "键名重复" : props.validateKey?.(entry.key, entry),
    value: valueIssue(entry),
  }));
}
const hasIssue = (issue: ReturnType<typeof issues>[number]) => Boolean(issue.key || issue.value);
function valueIssue(entry: HysKeyValueEntry) {
  try {
    return props.validateValue?.(keyValueFromText(entry.value, entry.type), entry);
  } catch (error) {
    return error instanceof SyntaxError ? "请输入有效的 " + (entry.type === "number" ? "数字" : "JSON") : error instanceof Error ? error.message : "值校验失败";
  }
}
const errors = computed(() => issues(props.modelValue));
function objectFor(rows: readonly HysKeyValueEntry[]) {
  return issues(rows).some(hasIssue) ? null : Object.fromEntries(rows.map(entry => [entry.key, keyValueFromText(entry.value, entry.type)]));
}
/** 转换为对象。键名无效或重复时返回 null。 */
function getObject() { return objectFor(props.modelValue); }
const exportText = computed(() => JSON.stringify(getObject(), null, 2));
function stopRead() {
  fileRead++;
  reading.value = false;
}
watch(opened, value => { if (!value) stopRead(); }, { flush: "sync" });
watch(locked, value => { if (value) stopRead(); });
onBeforeUnmount(stopRead);
function showTool(next: "import" | "export") {
  tool.value = next;
  pasted.value = "";
  parsingError.value = "";
  opened.value = true;
}
function editPasted(value: string) {
  stopRead();
  pasted.value = value;
  parsingError.value = "";
}
async function readFile(files: File[]) {
  const file = files[0];
  if (!file || locked.value || !opened.value) return;
  const ticket = ++fileRead;
  reading.value = true;
  parsingError.value = "";
  try {
    const contents = new TextDecoder("utf-8", { fatal: true }).decode(await file.arrayBuffer());
    if (ticket === fileRead && !locked.value) {
      format.value = "json";
      pasted.value = contents;
    }
  } catch {
    if (ticket === fileRead) parsingError.value = "无法读取文件，请选择 UTF-8 编码的 JSON 文件。";
  } finally {
    if (ticket === fileRead) reading.value = false;
  }
}
function downloadJson() {
  if (props.disabled || errors.value.some(hasIssue)) return;
  let url: string | undefined;
  try {
    url = URL.createObjectURL(new Blob([exportText.value], { type: "application/json;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "key-values.json";
    document.body.append(link);
    try { link.click(); } finally { link.remove(); }
  } catch {
    parsingError.value = "无法下载文件，可复制 JSON 后保存。";
  } finally {
    if (url) {
      const objectUrl = url;
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    }
  }
}
/** 把一组记录追加到现有行。采用追加方式保留禁用和敏感配置。 */
function importText(text: string, source: "json" | "pairs" = "json") {
  if (locked.value) return false;
  try {
    const rows = readKeyValueRows(text, source);
    if (!rows.length) { parsingError.value = "没有可导入的键值对"; return false; }
    commit([...props.modelValue, ...rows.map(row => ({ ...row, id: nextId() }))]);
    return true;
  } catch (error) {
    parsingError.value = error instanceof SyntaxError ? "输入不是有效 JSON 对象" : error instanceof Error ? error.message : "无法导入";
    return false;
  }
}
function confirmImport() {
  return !reading.value && importText(pasted.value, format.value);
}
defineExpose({ getObject, importText });
function commit(entries: HysKeyValueEntry[]) {
  if (locked.value) return;
  emit("update:modelValue", entries);
  emit("change", entries, objectFor(entries));
}
function update(index: number, patch: Partial<HysKeyValueEntry>) {
  if (props.modelValue[index]?.disabled) return;
  commit(props.modelValue.map((entry, i) => i === index ? { ...entry, ...patch } : entry));
}
function nextId() {
  let id: string;
  do { id = rootId + "-" + ++lastId; } while (props.modelValue.some(entry => entry.id === id));
  return id;
}
function add() { commit([...props.modelValue, { id: nextId(), key: "", value: "" }]); }
function remove(index: number) {
  if (!props.modelValue[index]?.disabled) commit(props.modelValue.filter((_, i) => i !== index));
}
</script>
<template>
  <div v-bind="skin" class="hys-key-value-editor">
    <HysSortableList :model-value="modelValue" item-key="id" :disabled="locked" :item-disabled="entry => !!entry.disabled"
      :history="false" :show-buttons="false" @update:model-value="commit">
      <template #item="{ item, index }">
        <div class="fields" :class="{ typed }">
          <HysInput :model-value="item.key" :placeholder="keyPlaceholder" :aria-label="'第 ' + (index + 1) + ' 行键名'"
            :status="errors[index]?.key ? 'error' : undefined" :aria-describedby="errors[index]?.key ? rootId + '-key-error-' + index : undefined"
            :disabled="disabled || item.disabled" :readonly="readonly" @update:model-value="update(index, { key: $event })" />
          <HysSelect v-if="typed" :model-value="item.type ?? 'string'" :options="[...valueTypes]" :disabled="locked || item.disabled"
            :aria-label="'第 ' + (index + 1) + ' 行类型'" @update:model-value="update(index, { type: ($event || 'string') as HysKeyValueType })" />
          <HysInput :model-value="item.value" :placeholder="valuePlaceholder" :type="item.sensitive ? 'password' : 'text'" :show-password="item.sensitive" :aria-label="'第 ' + (index + 1) + ' 行的值'"
            :disabled="disabled || item.disabled" :readonly="readonly"
            :status="errors[index]?.value ? 'error' : undefined" :aria-describedby="errors[index]?.value ? rootId + '-value-error-' + index : undefined"
            @update:model-value="update(index, { value: $event })" />
          <HysButton v-if="!readonly" size="sm" variant="ghost" :icon="Trash2" :disabled="disabled || item.disabled"
            :aria-label="'删除第 ' + (index + 1) + ' 行'" @click="remove(index)" />
          <p v-if="errors[index]?.key" :id="rootId + '-key-error-' + index" class="error">{{ errors[index].key }}</p>
          <p v-if="errors[index]?.value" :id="rootId + '-value-error-' + index" class="error">{{ errors[index].value }}</p>
        </div>
      </template>
      <template #empty><slot name="empty"><HysEmpty description="暂无键值对" /></slot></template>
    </HysSortableList>
    <div class="tools">
      <HysButton v-if="!readonly" variant="secondary" :icon="Plus" :disabled="disabled" @click="add">添加键值对</HysButton>
      <HysButton v-if="showTools && !readonly" variant="secondary" :disabled="disabled" @click="showTool('import')">批量导入</HysButton>
      <HysButton v-if="showTools" variant="secondary" :disabled="disabled || errors.some(hasIssue)" @click="showTool('export')">导出 JSON</HysButton>
    </div>
    <HysModal v-if="showTools" v-model:open="opened" :footer="tool === 'import'" :title="tool === 'import' ? '批量导入键值' : '导出 JSON'"
      :confirm-disabled="reading || locked" :before-confirm="confirmImport">
      <div v-if="tool === 'import'" class="editor-panel">
        <HysSelect  :model-value="format" @update:model-value="format = $event === 'pairs' ? 'pairs' : 'json'" :options="[...importFormats]" aria-label="导入格式" />
        <HysInput :model-value="pasted" type="textarea" :rows="6" aria-label="粘贴数据" :disabled="locked"
          :error="parsingError" @update:model-value="editPasted" />
        <HysUpload accept=".json" :multiple="false" :auto-upload="false" :show-file-list="false" :drag="false"
          :disabled="reading || locked" @select="readFile">
          <template #trigger><HysButton size="sm" variant="secondary" :loading="reading" :disabled="locked">打开 JSON 文件</HysButton></template>
        </HysUpload>
      </div>
      <div v-else class="editor-panel">
        <HysInput :model-value="exportText" type="textarea" :rows="6" readonly aria-label="待导出的 JSON" />
        <div class="tools">
          <HysCopyButton :text="exportText" label="复制 JSON" :disabled="disabled || errors.some(hasIssue)" />
          <HysButton size="sm" variant="secondary" :disabled="disabled || errors.some(hasIssue)" @click="downloadJson">下载 JSON</HysButton>
        </div>
        <p v-if="parsingError" class="error" role="status">{{ parsingError }}</p>
      </div>
    </HysModal>
  </div>
</template>
<style scoped>
.hys-key-value-editor { display: grid; justify-items: start; gap: 8px; min-width: 0; }
.hys-key-value-editor > :first-child { width: 100%; min-width: 0; }
.fields { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)) auto; align-items: center; gap: 6px; min-width: 0; }
.fields.typed { grid-template-columns: minmax(0, 1fr) minmax(5.5rem, .5fr) minmax(0, 1fr) auto; }
.tools { display: flex; flex-wrap: wrap; gap: 8px; }
.editor-panel { display: grid; gap: 10px; padding: 4px; justify-items: start; }
@media (max-width: 540px) { .fields.typed { grid-template-columns: minmax(0, 1fr) minmax(6rem, .65fr); } }
.error { grid-column: 1/-1; margin: 0; color: var(--hys-ui-theme-danger, #c23b48); font-size: 12px; }
</style>
