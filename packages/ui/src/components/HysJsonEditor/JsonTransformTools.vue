<script setup lang="ts">
import { computed, onBeforeUnmount, ref, shallowRef, watch } from "vue";
import HysButton from "../HysButton/HysButton.vue";
import HysDiffViewer from "../HysDiffViewer/HysDiffViewer.vue";
import HysModal from "../HysModal/HysModal.vue";
import HysScrollbar from "../HysScrollbar/HysScrollbar.vue";
import HysSelect from "../HysSelect/HysSelect.vue";
import HysTextarea from "../HysTextarea/HysTextarea.vue";
import HysVirtualTable from "../HysVirtualTable/HysVirtualTable.vue";
import JsonLocalInput from "./JsonLocalInput.vue";
import { convertJson, jsonColumns, type JsonConversion } from "./jsonConvert";
import { jsonPointer, type JsonDocument, type JsonNode, type JsonRange } from "./jsonDocument";
import { compareJsonDocuments, jsonNodes, jsonPathLabel, jsonValue, organizeJson, requireJson, type JsonDifference, type JsonOrganizeAction } from "./jsonStructure";
import { nodeRange } from "./jsonTreeEdits";

const props = defineProps<{
  tool: "repair" | "organize" | "compare" | "convert"; source: string; doc: JsonDocument; selectedId: string; editable: boolean;
}>();
const emit = defineEmits<{
  close: []; apply: [base: string, value: string]; reveal: [range: JsonRange];
  copy: [value: string]; download: [value: string, extension: string];
}>();
const titles = { repair: "修复 JSON", organize: "排序与去重", compare: "结构对比", convert: "格式转换" };
const sourceInput = ref("");
const conversion = ref<JsonConversion>("to-csv");
const startingNode = props.doc.valid ? [...jsonNodes(props.doc.root)].find(node => node.id === props.selectedId) : undefined;
const operation = ref<JsonOrganizeAction>(startingNode?.type === "array"
  ? startingNode.children?.some(node => node.type === "object" && node.children?.length) ? "sort-array" : "dedupe"
  : "sort-keys");
const targetId = ref(props.selectedId);
const direction = ref<"asc" | "desc">("asc");
const fieldToken = ref("all");
const preview = shallowRef<{ base: string; value: string; extension: string; summary?: string }>();
const differences = shallowRef<JsonDifference[]>();
const error = ref("");
const busy = ref(false);
let revision = 0;
const conversions: { value: JsonConversion; label: string }[] = [
  { value: "to-csv", label: "JSON → CSV" }, { value: "from-csv", label: "CSV → JSON" },
  { value: "to-yaml", label: "JSON → YAML" }, { value: "from-yaml", label: "YAML → JSON" },
  { value: "to-typescript", label: "JSON → TypeScript" },
];
const operations: { value: JsonOrganizeAction; label: string }[] = [
  { value: "sort-keys", label: "对象键排序" }, { value: "sort-array", label: "按字段排序数组" }, { value: "dedupe", label: "数组去重" },
];
const directions: { value: "asc" | "desc"; label: string }[] = [{ value: "asc", label: "升序" }, { value: "desc", label: "降序" }];
const differenceLabels = { added: "新增", removed: "删除", changed: "修改" };
const comparisonColumns = [{ key: "type", label: "变更", width: 80 }, { key: "path", label: "JSON Pointer", width: 170 },
  { key: "before", label: "当前值", width: 190 }, { key: "after", label: "对比值", width: 190 }];
const incoming = computed(() => conversion.value === "from-csv" || conversion.value === "from-yaml");
const targetNodes = computed(() => {
  if (props.tool !== "organize" || !props.doc.valid) return [];
  return [...jsonNodes(props.doc.root)].filter(node => !node.ambiguous && node.type === (operation.value === "sort-keys" ? "object" : "array"));
});
const target = computed(() => targetNodes.value.find(node => node.id === targetId.value) ?? targetNodes.value[0]);
const keys = computed(() => jsonColumns(target.value?.children?.filter(node => node.type === "object") ?? []));
const fieldOptions = computed(() => [
  ...(operation.value === "dedupe" ? [{ value: "all", label: "整项内容" }] : []),
  ...keys.value.map((key, i) => ({ value: String(i), label: key || '""' })),
]);
const selectedField = computed(() => fieldOptions.value.some(field => field.value === fieldToken.value)
  ? fieldToken.value : fieldOptions.value[0]?.value);
const canApply = computed(() => props.editable && !!preview.value && preview.value.base === props.source
  && preview.value.value !== props.source && (props.tool !== "convert" || incoming.value));
watch([() => props.source, sourceInput, conversion, operation, targetId, direction, fieldToken], reset, { flush: "sync" });
onBeforeUnmount(() => { revision++; });

function reset() {
  revision++;
  busy.value = false;
  preview.value = differences.value = undefined;
  error.value = "";
}
async function run() {
  reset();
  const ticket = revision;
  const base = props.source;
  busy.value = true;
  try {
    if (props.tool === "compare") {
      differences.value = compareJsonDocuments(requireJson(base), requireJson(sourceInput.value));
    } else if (props.tool === "organize") {
      requireJson(base);
      if (!target.value) throw new Error("当前 JSON 中暂无可整理的节点。");
      const key = selectedField.value === "all" ? undefined : keys.value[Number(selectedField.value)];
      const result = organizeJson(base, target.value, operation.value, direction.value === "asc" ? 1 : -1, key);
      preview.value = { base, value: result.source, extension: "json", summary: "受影响 " + result.affected + " 项" };
    } else if (props.tool === "convert") {
      const result = await convertJson(conversion.value, incoming.value ? sourceInput.value : base);
      if (ticket === revision && base === props.source) preview.value = { base, ...result };
    } else {
      const { jsonrepair } = await import("jsonrepair");
      if (ticket !== revision || base !== props.source) return;
      const repaired = props.doc.valid ? base : jsonrepair(base);
      requireJson(repaired, false);
      preview.value = { base, value: repaired, extension: "json" };
    }
  } catch (failure) {
    if (ticket === revision) error.value = failure instanceof Error ? failure.message : "当前内容无法处理。";
  } finally {
    if (ticket === revision) busy.value = false;
  }
}

function sample(source: string, node: JsonNode | undefined) {
  if (!node) return "—";
  const value = jsonValue(source, node);
  return value.length > 250 ? value.slice(0, 250) + "…" : value;
}
function apply() {
  if (canApply.value && preview.value) emit("apply", preview.value.base, preview.value.value);
}
</script>

<template>
  <HysModal open :title="titles[tool]" size="lg" drag-mode="preview" @close="emit('close')">
    <div class="hys-json-tool-panel">
      <JsonLocalInput v-if="tool === 'compare'" v-model="sourceInput" label="对比 JSON" accept=".json" />
      <template v-if="tool === 'organize'">
        <div class="hys-json-tool-line">
          <HysSelect v-model="operation" :options="operations" aria-label="整理方式" size="sm" />
          <HysSelect :model-value="target?.id" :options="targetNodes.map(node => ({ value: node.id, label: jsonPathLabel(node) }))"
            aria-label="目标节点" size="sm" @update:model-value="targetId = $event" />
          <HysSelect v-if="operation !== 'sort-keys'" :model-value="selectedField" :options="fieldOptions"
            aria-label="整理字段" placeholder="选择字段" size="sm" @update:model-value="fieldToken = $event" />
          <HysSelect v-if="operation !== 'dedupe'" v-model="direction" :options="directions" aria-label="排序方向" size="sm" />
        </div>
      </template>
      <template v-if="tool === 'convert'">
        <div class="hys-json-tool-line">
          <HysSelect v-model="conversion" :options="conversions" aria-label="转换方式" size="sm" />
        </div>
        <JsonLocalInput v-if="incoming" :key="conversion" v-model="sourceInput" :label="conversion === 'from-csv' ? '输入 CSV' : '输入 YAML'"
          :accept="conversion === 'from-csv' ? '.csv' : '.yaml,.yml'" />
        <p v-if="conversion === 'from-csv'" class="hys-json-tool-note">第一行用作表头，数据按字符串导入。</p>
        <p v-else-if="conversion === 'to-csv'" class="hys-json-tool-note">空值和缺失字段导出为空白。对象和数组以紧凑 JSON 写入单元格。</p>
      </template>
      <HysButton class="hys-json-tool-run" size="sm" variant="secondary" :loading="busy" @click="run">
        {{ tool === "compare" ? "开始对比" : "生成预览" }}
      </HysButton>
      <p v-if="error" role="alert" class="hys-json-form-error">{{ error }}</p>
      <template v-if="differences">
        <p role="status">发现 {{ differences.length }} 处结构差异</p>
        <HysVirtualTable v-if="differences.length" :rows="differences" :columns="comparisonColumns" row-key="path" :height="250" aria-label="JSON 结构差异">
          <template #cell="{ row, column }">
            <span v-if="column.key === 'type'" :data-json-difference="row.type">{{ differenceLabels[row.type] }}</span>
            <HysButton v-else-if="column.key === 'path' && row.before" size="sm" variant="text" @click="emit('reveal', nodeRange(row.before))">{{ row.path || "根节点" }}</HysButton>
            <code v-else-if="column.key === 'path'">{{ row.path || "根节点" }}</code>
            <code v-else>{{ column.key === "before" ? sample(source, row.before) : sample(sourceInput, row.after) }}</code>
          </template>
        </HysVirtualTable>
      </template>
      <template v-if="preview">
        <p v-if="preview.summary" role="status">{{ preview.summary }}</p>
        <HysTextarea v-if="tool === 'convert'" :model-value="preview.value" aria-label="转换结果" :rows="8" readonly spellcheck="false" />
        <p v-else-if="preview.value === preview.base" role="status">当前内容无需修改。</p>
        <HysScrollbar v-else max-height="310px" aria-label="修改差异预览">
          <HysDiffViewer :before="preview.base" :after="preview.value" :context-lines="2" line-numbers align-changes />
        </HysScrollbar>
      </template>
    </div>
    <template #footer>
      <HysButton variant="secondary" @click="emit('close')">关闭</HysButton>
      <template v-if="tool === 'convert' && preview">
        <HysButton variant="secondary" @click="emit('copy', preview.value)">复制结果</HysButton>
        <HysButton variant="secondary" @click="emit('download', preview.value, preview.extension)">下载结果</HysButton>
      </template>
      <HysButton v-if="canApply" @click="apply">{{ tool === "convert" ? "替换当前源码" : "应用修改" }}</HysButton>
    </template>
  </HysModal>
</template>
