<script setup lang="ts">
import { computed, ref, shallowRef, watch } from "vue";
import HysButton from "../HysButton/HysButton.vue";
import HysInput from "../HysInput/HysInput.vue";
import HysScrollbar from "../HysScrollbar/HysScrollbar.vue";
import HysVirtualTable from "../HysVirtualTable/HysVirtualTable.vue";
import JsonLocalInput from "./JsonLocalInput.vue";
import type { JsonDocument, JsonNode, JsonRange } from "./jsonDocument";
import { queryJson } from "./jsonQuery";
import { parseSchemaText, type JsonSchema, type JsonSchemaIssue } from "./jsonSchema";
import { jsonArrayText, jsonPathLabel, jsonValue } from "./jsonStructure";
import { nodeRange } from "./jsonTreeEdits";

const props = defineProps<{
  tool: "schema" | "query"; source: string; doc: JsonDocument;
  schemaState: string; schemaError: string; schemaIssues: readonly JsonSchemaIssue[];
}>();
const schema = defineModel<JsonSchema | null>("schema", { required: true });
const emit = defineEmits<{
  close: []; reveal: [range: JsonRange, fromQuery?: boolean]; copy: [text: string];
  download: [text: string, extension: string];
}>();
const schemaText = ref("");
const query = ref("$");
const error = ref("");
const result = shallowRef<{ source: string; nodes: JsonNode[] }>();
const resultRows = computed(() => result.value?.nodes.map((node, key) => ({ node, key })) ?? []);
const columns = [{ key: "path", label: "JSON Pointer", width: 240 }, { key: "value", label: "原始值", width: 360 }];
watch(schema, value => {
  try { schemaText.value = value === null ? "" : JSON.stringify(value, null, 2); }
  catch { schemaText.value = ""; }
}, { immediate: true });
watch([query, () => props.source], () => { result.value = undefined; error.value = ""; }, { flush: "sync" });
watch(schemaText, () => { error.value = ""; });
function run(event?: KeyboardEvent) {
  if (event?.isComposing || event?.keyCode === 229) return;
  event?.preventDefault();
  result.value = undefined;
  error.value = "";
  try {
    if (!props.doc.valid) throw new Error("请先修正 JSON 语法。");
    if (props.doc.duplicates.length) throw new Error("请先从状态栏定位并处理重复键。");
    result.value = { source: props.source, nodes: queryJson(props.doc.root, query.value) };
  } catch (failure) {
    error.value = failure instanceof Error ? failure.message : "无法运行查询。";
  }
}
function applySchema() {
  error.value = "";
  try { schema.value = parseSchemaText(schemaText.value); }
  catch (failure) { error.value = failure instanceof Error ? failure.message : "无法读取 Schema。"; }
}
function exportResults(download: boolean) {
  if (!result.value || result.value.source !== props.source) return;
  const text = jsonArrayText(props.source, result.value.nodes);
  if (download) emit("download", text, "json");
  else emit("copy", text);
}
function sample(node: JsonNode) {
  const value = jsonValue(props.source, node);
  return value.length <= 240 ? value : value.slice(0, 240) + "…";
}
</script>

<template>
  <section class="hys-json-tool-panel hys-json-inspector" :aria-label="tool === 'schema' ? 'Schema 校验面板' : 'JSONPath 查询面板'">
    <header class="hys-json-tool-heading">
      <strong>{{ tool === "schema" ? "Schema 校验" : "JSONPath 查询" }}</strong>
      <HysButton size="sm" variant="text" @click="emit('close')">收起</HysButton>
    </header>
    <template v-if="tool === 'schema'">
      <JsonLocalInput v-model="schemaText" label="JSON Schema" accept=".json" />
      <div class="hys-json-tool-line">
        <HysButton size="sm" variant="secondary" :disabled="!schemaText.trim()" @click="applySchema">应用 Schema</HysButton>
        <HysButton size="sm" variant="ghost" :disabled="schema === null" @click="schema = null">移除 Schema</HysButton>
        <span v-if="schemaState === 'running'" role="status">正在校验</span>
        <span v-if="schemaState === 'passed'" class="hys-json-valid" role="status">Schema 校验通过</span>
      </div>
      <p v-if="schemaError" class="hys-json-form-error" role="status">{{ schemaError }}</p>
      <HysScrollbar v-if="schemaIssues.length" max-height="190px" aria-label="Schema 校验问题">
        <ul class="hys-json-tool-list">
          <li v-for="(issue, i) in schemaIssues" :key="i">
            <HysButton size="sm" variant="text" :disabled="!issue.range" @click="issue.range && emit('reveal', issue.range)">
              <code>{{ issue.path || "根节点" }}</code> {{ issue.message }}
            </HysButton>
          </li>
        </ul>
      </HysScrollbar>
    </template>
    <template v-else>
      <div class="hys-json-tool-line">
        <HysInput v-model="query" aria-label="JSONPath 表达式" placeholder="$.items[*].id" size="sm" spellcheck="false" @keydown.enter="run" />
        <HysButton size="sm" variant="secondary" @click="run()">运行查询</HysButton>
      </div>
      <template v-if="result">
        <div class="hys-json-tool-line">
          <span role="status">匹配 {{ result.nodes.length }} 项</span>
          <HysButton size="sm" variant="text" @click="exportResults(false)">复制结果</HysButton>
          <HysButton size="sm" variant="text" @click="exportResults(true)">下载结果</HysButton>
        </div>
        <HysVirtualTable v-if="resultRows.length" :rows="resultRows" :columns="columns" row-key="key" :height="190" aria-label="JSONPath 结果">
          <template #cell="{ row, column }">
            <HysButton v-if="column.key === 'path'" size="sm" variant="text" @click="emit('reveal', nodeRange(row.node), true)">{{ jsonPathLabel(row.node) }}</HysButton>
            <code v-else class="hys-json-query-value">{{ sample(row.node) }}</code>
          </template>
        </HysVirtualTable>
      </template>
    </template>
    <p v-if="error" class="hys-json-form-error" role="alert">{{ error }}</p>
  </section>
</template>
