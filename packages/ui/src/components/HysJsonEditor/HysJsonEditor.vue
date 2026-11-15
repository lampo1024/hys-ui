<script lang="ts">
export type HysJsonEditorView = "text" | "tree" | "table";
export type HysJsonEditorSchema = import("./jsonSchema").JsonSchema;
</script>

<script setup lang="ts">
import { ChevronDown, ChevronUp, TriangleAlert, X } from "lucide-vue-next";
import { computed, nextTick, onActivated, onDeactivated, ref, toRef, useId, watch } from "vue";
import { useHysRootAttrs } from "../../config";
import { useCodeSearch } from "../../composables/useCodeSearch";
import HysButton from "../HysButton/HysButton.vue";
import HysCheckbox from "../HysCheckbox/HysCheckbox.vue";
import HysInput from "../HysInput/HysInput.vue";
import HysModal from "../HysModal/HysModal.vue";
import HysPopover from "../HysPopover/HysPopover.vue";
import HysScrollbar from "../HysScrollbar/HysScrollbar.vue";
import HysTooltip from "../HysTooltip/HysTooltip.vue";
import HysUpload from "../HysUpload/HysUpload.vue";
import ScrollbarOverlay from "../HysScrollbar/ScrollbarOverlay.vue";
import { useScrollbarGeometry } from "../HysScrollbar/useScrollbarGeometry";
import JsonNodeForm from "./JsonNodeForm.vue";
import JsonToolbar from "./JsonToolbar.vue";
import JsonTreeView from "./JsonTreeView.vue";
import JsonTableView from "./JsonTableView.vue";
import JsonInspectTools from "./JsonInspectTools.vue";
import JsonTransformTools from "./JsonTransformTools.vue";
import { formatJson, jsonLineStarts, jsonLocation, jsonPointer, parseJsonDocument, type JsonNode, type JsonRange, type JsonType } from "./jsonDocument";
import { appendJsonChild, encodeJsonValue, initialJsonValue, nodeRange, removeJsonChild, swapJsonChildren, type JsonNodeAction } from "./jsonTreeEdits";
import { useJsonCode } from "./useJsonCode";
import { useJsonFiles } from "./useJsonFiles";
import { useJsonSchemaValidation } from "./useJsonSchemaValidation";
import { jsonSchemaHints } from "./jsonSchema";
import { duplicateRemoval } from "./jsonStructure";
import type { JsonTool } from "./jsonTools";

const props = withDefaults(defineProps<{
  /** 保留浏览、查找、复制和下载。 */
  readonly?: boolean;
  /** 禁用编辑和工具栏操作。 */
  disabled?: boolean;
  /** 在工具栏提供压缩命令。 */
  compactable?: boolean;
  /** 格式化和自动缩进的空格数，取整并限制为 0–10。 */
  indent?: number;
  /** JSON 语法正确时接收 JSON.parse 的结果，可返回业务错误提示。 */
  validate?: (value: unknown) => string | void;
  /** 回车时延续当前行缩进，在对象或数组开头增加一级。 */
  autoIndent?: boolean;
}>(), { indent: 2 });
/** JSON 源码，包含未完成的语法草稿。 */
const model = defineModel<string>({ default: "{}" });
/** 源码、树视图或表格。 */
const view = defineModel<HysJsonEditorView>("view", { default: "text" });
/** 校验文档使用的本地 JSON Schema，null 表示移除。 */
const schema = defineModel<HysJsonEditorSchema | null>("schema", { default: null });
const emit = defineEmits<{
  /** 用户修改源码后发出，包括树操作、文件导入、撤销和重做。 */
  change: [text: string];
  /** 格式化或压缩成功后发出，包含生成的 JSON 及命令类型。 */
  format: [text: string, mode: "pretty" | "compact"];
}>();
const skin = useHysRootAttrs();
const messageId = useId();
const spaces = computed(() => Number.isFinite(props.indent) ? Math.min(10, Math.max(0, Math.floor(props.indent))) : 2);
const disabled = toRef(props, "disabled");
const readonly = toRef(props, "readonly");
const editable = computed(() => !props.disabled && !props.readonly);
const doc = computed(() => parseJsonDocument(model.value));
const syntaxError = computed(() => doc.value.valid ? undefined : doc.value.error);
const duplicates = computed(() => doc.value.valid ? doc.value.duplicates : []);
const duplicateOriginals = computed(() => [...new Map(duplicates.value.map(warning =>
  [warning.original, { from: warning.original, to: warning.originalTo, label: warning.label }])).values()]);
const { issues: schemaIssues, state: schemaState, error: schemaError } = useJsonSchemaValidation(schema, model, doc, disabled);
const lineStarts = computed(() => jsonLineStarts(model.value));
const businessError = computed(() => {
  if (!doc.value.valid || !props.validate) return "";
  try { return props.validate(JSON.parse(model.value)) ?? ""; }
  catch (error) { return error instanceof Error ? error.message : String(error); }
});
const message = ref("");
const warningOpen = ref(false);
const findOpen = ref(false);
const findInput = ref<{ focus(): void }>();
const host = ref<HTMLElement>();
const visitedTree = ref(view.value === "tree");
const treeSelection = ref("root");
const tableTarget = ref("root");
const activeTool = ref<JsonTool>();
const queryHighlight = ref<JsonRange>();
const showMatches = computed(() => findOpen.value && view.value === "text" ? matches.value : []);
const treeHeight = 300;

function publish(text: string) {
  if (text === model.value) return;
  message.value = "";
  model.value = text;
  emit("change", text);
}
const code = useJsonCode(host, model, disabled, readonly, spaces, {
  describedBy: messageId,
  autoIndent: () => props.autoIndent,
  change: publish,
  find: () => toggleFind(true),
});
const { geometry } = useScrollbarGeometry(() => code.editor.value?.scrollDOM, () => code.editor.value?.contentDOM, {
  autoResize: () => view.value === "text", observeMutations: true,
});
const search = useCodeSearch(model, code.selection, range => code.reveal(range, false), code.change);
const { find: query, replacement, sensitive, index, matches } = search;
const files = useJsonFiles(model, editable, disabled, message, text => {
  if (!code.replace(text)) return false;
  view.value = "text";
  return true;
});
const { open: fileOpen, busy, error: fileError, candidate } = files;

function position(offset: number) {
  const { line, column } = jsonLocation(lineStarts.value, offset);
  return `第 ${line} 行，第 ${column} 列`;
}
function updateMarkers() {
  const error = syntaxError.value;
  const marks: (JsonRange & { kind?: "warning" | "match" | "query" })[] =
    showMatches.value.map(range => ({ ...range, kind: "match" }));
  if (error) {
    const from = Math.min(error.from, Math.max(0, model.value.length - 1));
    marks.push({ from, to: Math.min(model.value.length, Math.max(from + 1, error.to)) });
  } else {
    for (const range of [...duplicates.value, ...duplicateOriginals.value]) marks.push({ ...range, kind: "warning" });
  }
  if (queryHighlight.value) marks.push({ ...queryHighlight.value, kind: "query" });
  code.mark(marks);
}
watch([model, code.editor, showMatches, queryHighlight], updateMarkers, { flush: "post" });
watch(model, () => { queryHighlight.value = undefined; });
watch(view, mode => {
  if (mode === "tree") visitedTree.value = true;
  else if (mode === "text") code.editor.value?.requestMeasure();
  findOpen.value = false;
}, { flush: "post" });
onActivated(updateMarkers);
onDeactivated(() => { warningOpen.value = false; findOpen.value = false; closePanel(); closeTool(); });
watch(disabled, value => { if (value) closeTool(); });
watch(activeTool, tool => { if (tool !== "query") queryHighlight.value = undefined; });

async function reveal(range: JsonRange, fromQuery = false) {
  if (props.disabled) return;
  queryHighlight.value = fromQuery ? range : undefined;
  view.value = "text";
  warningOpen.value = false;
  await nextTick();
  code.reveal(range, true);
}
function setView(mode: HysJsonEditorView) {
  if (mode === "table" && view.value === "tree") tableTarget.value = treeSelection.value;
  view.value = mode;
}
function openTree(node: JsonNode) {
  treeSelection.value = node.id;
  view.value = "tree";
}
function closeTool() { activeTool.value = undefined; }
function applyTool(base: string, text: string) {
  if (!editable.value || model.value !== base || !parseJsonDocument(text).valid || !code.replace(text)) return;
  closeTool();
  view.value = "text";
  message.value = "已应用修改，可撤销";
}
function revealComparison(range: JsonRange) {
  closeTool();
  void reveal(range);
}
function downloadTool(value: string, extension: string) {
  const types: Record<string, string> = { json: "application/json", yaml: "application/yaml", csv: "text/csv", ts: "text/plain" };
  files.download(value, "result." + extension, types[extension]);
}
function removeDuplicate(offset: number) {
  if (!editable.value || !doc.value.valid) return;
  const edit = duplicateRemoval(doc.value.root, offset);
  if (edit && code.change(edit)) { warningOpen.value = false; message.value = "已删除选中的重复键，可撤销"; }
}
function toggleFind(force = false) {
  if (props.disabled) return false;
  if (view.value !== "text") {
    view.value = "text";
    void nextTick(() => toggleFind(true));
    return true;
  }
  findOpen.value = force || !findOpen.value;
  void nextTick(() => {
    if (findOpen.value) findInput.value?.focus();
    else code.editor.value?.focus();
  });
  return true;
}
function searchEnter(event: KeyboardEvent) {
  if (event.isComposing || event.keyCode === 229) return;
  event.preventDefault();
  search.step(event.shiftKey ? -1 : 1);
}
function format(mode: "pretty" | "compact") {
  if (!editable.value) return;
  if (syntaxError.value) {
    void reveal(syntaxError.value);
    return;
  }
  const formatted = formatJson(model.value, mode === "compact" ? 0 : spaces.value);
  if (formatted !== model.value && !code.replace(formatted)) return;
  message.value = mode === "pretty" ? "已格式化" : "已压缩";
  emit("format", formatted, mode);
}
function action(tool: "pretty" | "compact" | "find" | "undo" | "redo" | "import" | "copy" | "download") {
  if (props.disabled) return;
  switch (tool) {
    case "pretty": case "compact": format(tool); break;
    case "undo": case "redo": code.stepHistory(tool, view.value === "text"); break;
    case "find": toggleFind(); break;
    case "import": files.begin(); break;
    case "copy": void files.copy(model.value, "源码"); break;
    case "download": if (doc.value.valid) files.download(); break;
  }
}

const panel = ref<{ action: JsonNodeAction; node: JsonNode; base: string; keyName?: string; type: JsonType; value: string }>();
const panelError = ref("");
function closePanel() { panel.value = undefined; panelError.value = ""; }
watch(model, closePanel);
watch(editable, enabled => { if (!enabled) { closePanel(); warningOpen.value = false; } });
function editNode(action: JsonNodeAction, node: JsonNode, keyName?: string) {
  if (!editable.value || node.ambiguous) return;
  const raw = model.value.slice(node.from, node.to);
  panel.value = {
    action, node, base: model.value,
    keyName: action === "rename" ? node.label : action === "add" && node.type === "object" ? keyName ?? "" : undefined,
    type: action === "add" ? "string" : node.type,
    value: action === "add" ? initialJsonValue("string") : node.type === "string" ? JSON.parse(raw) as string : raw,
  };
}
function editTableCell(row: JsonNode, key: string, field?: JsonNode) {
  if (field) editNode("edit", field);
  else editNode("add", row, key);
}
function panelHints(key: string) {
  const draft = panel.value;
  if (!draft) return { keys: [], values: [] };
  return jsonSchemaHints(schema.value, draft.node, draft.action === "add" ? key : undefined);
}
function parentOf(node: JsonNode) {
  if (!doc.value.valid || !node.parent) return undefined;
  const pending = [doc.value.root];
  while (pending.length) {
    const current = pending.pop()!;
    if (current.id === node.parent) return current;
    for (const child of current.children ?? []) pending.push(child);
  }
}
function submitNode(key: string, type: JsonType, value: string) {
  const draft = panel.value;
  if (!draft || !editable.value || draft.base !== model.value) return;
  const { node, action } = draft;
  const rename = action === "rename";
  if (rename && key === node.label) { closePanel(); return; }
  const siblings = rename ? parentOf(node)?.children : action === "add" && node.type === "object" ? node.children : undefined;
  if (siblings?.some(child => child.id !== node.id && child.label === key)) {
    panelError.value = "同一对象中已存在这个字段名。";
    return;
  }
  const insert = rename ? JSON.stringify(key)
    : action === "edit" && node.type === "string" && type === "string" && value === draft.value
      ? model.value.slice(node.from, node.to) : encodeJsonValue(type, value);
  if (insert === undefined) { panelError.value = "请输入与所选类型匹配的有效 JSON 值。"; return; }
  const range = rename ? node.key! : { from: node.from, to: node.to };
  const change = action === "add" ? appendJsonChild(model.value, node, key, insert, spaces.value) : { ...range, insert };
  if (model.value.slice(change.from, change.to) === insert && action !== "add") { closePanel(); return; }
  if (code.change(change)) closePanel();
}
function removeNode(node: JsonNode, siblings: JsonNode[], index: number) {
  if (editable.value && !node.ambiguous) code.change(removeJsonChild(node, siblings, index));
}
function moveNode(node: JsonNode, target: JsonNode) {
  if (editable.value && !node.ambiguous) code.change(swapJsonChildren(model.value, node, target));
}
function copyNode(node: JsonNode, path: boolean) {
  const value = path ? jsonPointer(node) : model.value.slice(node.from, node.to);
  if (value !== undefined) void files.copy(value, path ? "节点路径" : "节点值");
}
</script>

<template>
  <section v-bind="skin" class="hys-json-editor" :aria-disabled="disabled || undefined">
    <JsonToolbar :view="view" :editable="editable" :disabled="disabled || !code.editor.value" :valid="doc.valid"
      :compactable="compactable" :undo="code.historyState.value.undo" :redo="code.historyState.value.redo"
      :finding="findOpen" @action="action" @view="setView" @tool="activeTool = $event" />

    <JsonInspectTools v-if="activeTool === 'schema' || activeTool === 'query'" :key="activeTool"
      v-model:schema="schema" :tool="activeTool" :source="model" :doc="doc" :schema-state="schemaState"
      :schema-error="schemaError" :schema-issues="schemaIssues" @close="closeTool" @reveal="reveal"
      @copy="files.copy($event, '结果')" @download="downloadTool" />

    <section v-if="findOpen && view === 'text' && !disabled" class="hys-json-find" aria-label="JSON 查找与替换"
      @keydown.esc.stop="toggleFind()">
      <div class="hys-json-find-line">
        <HysInput ref="findInput" v-model="query" aria-label="查找内容" placeholder="查找内容" size="sm" @keydown.enter="searchEnter" />
        <span class="hys-json-find-count" aria-live="polite">{{ query ? (matches.length ? `${index < 0 ? '–' : index + 1} / ${matches.length}` : "无匹配") : "" }}</span>
        <HysTooltip v-for="direction in [-1, 1] as const" :key="direction" :text="direction < 0 ? '上一项' : '下一项'">
          <HysButton size="sm" variant="ghost" :icon="direction < 0 ? ChevronUp : ChevronDown" :aria-label="direction < 0 ? '上一项' : '下一项'"
            :disabled="!matches.length" @click="search.step(direction)" />
        </HysTooltip>
        <HysTooltip text="关闭查找">
          <HysButton size="sm" variant="ghost" :icon="X" aria-label="关闭查找" @click="toggleFind()" />
        </HysTooltip>
      </div>
      <div class="hys-json-find-line hys-json-find-options">
        <HysCheckbox v-model="sensitive" size="sm" label="区分大小写" />
        <template v-if="editable">
          <HysInput v-model="replacement" aria-label="替换为" placeholder="替换为" size="sm" />
          <HysButton size="sm" variant="ghost" :disabled="index < 0" @click="search.replaceCurrent">替换</HysButton>
          <HysButton size="sm" variant="ghost" :disabled="!matches.length" @click="search.replaceAll">全部替换</HysButton>
        </template>
      </div>
    </section>

    <div v-show="view === 'text'" class="hys-json-source" :style="{ blockSize: treeHeight + 'px' }">
      <div ref="host" class="hys-json-code-host" />
      <ScrollbarOverlay :viewport="code.editor.value?.scrollDOM" :geometry="geometry" />
    </div>
    <div v-if="visitedTree || view === 'tree'" v-show="view === 'tree'" class="hys-json-tree-pane">
      <JsonTreeView v-if="doc.valid" v-model:selected-id="treeSelection" :root="doc.root" :disabled="disabled" :editable="editable" :height="treeHeight"
        @edit="editNode" @remove="removeNode" @move="moveNode" @copy="copyNode" @reveal="reveal(nodeRange($event))" />
      <div v-else class="hys-json-invalid-tree" :style="{ minBlockSize: treeHeight + 'px' }">
        <p>修正 JSON 语法后即可查看树结构。</p>
        <HysButton size="sm" variant="secondary" :disabled="disabled" @click="reveal(doc.error)">定位语法错误</HysButton>
      </div>
    </div>

    <template v-if="view === 'table'">
      <JsonTableView v-if="doc.valid && !duplicates.length" v-model:target="tableTarget" :root="doc.root" :source="model"
        :disabled="disabled" :editable="editable" @edit="editTableCell" @reveal="reveal(nodeRange($event))" @tree="openTree" />
      <div v-else class="hys-json-invalid-tree">
        <p>{{ doc.valid ? "请先处理重复键再查看表格。" : "请先修正 JSON 语法。" }}</p>
        <HysButton v-if="syntaxError" size="sm" variant="secondary" :disabled="disabled" @click="reveal(syntaxError)">定位语法错误</HysButton>
      </div>
    </template>

    <footer class="hys-json-footer">
      <div :id="messageId" class="hys-json-diagnostics">
        <HysButton v-if="syntaxError" size="sm" variant="ghost" :icon="TriangleAlert" class="hys-json-form-error"
          :disabled="disabled" @click="reveal(syntaxError)">JSON 无效 · {{ position(syntaxError.from) }}</HysButton>
        <span v-else-if="businessError" class="hys-json-form-error" role="status">{{ businessError }}</span>
        <span v-else-if="!duplicates.length" class="hys-json-valid" role="status">JSON 格式正确</span>
        <HysPopover v-if="duplicates.length" v-model:open="warningOpen" trigger="click" placement="top-start" :disabled="disabled">
          <template #trigger>
            <HysButton size="sm" variant="ghost" :icon="TriangleAlert" class="hys-json-warning-text" :disabled="disabled">
              {{ duplicates.length }} 处重复键
            </HysButton>
          </template>
          <HysScrollbar max-height="240px" tabindex="0" aria-label="重复键位置">
            <ul class="hys-json-warning-list">
              <li v-for="warning in duplicates" :key="warning.from">
                <HysButton size="sm" variant="ghost" @click="reveal(warning)">
                  <span class="hys-json-warning-entry">
                    <strong>{{ JSON.stringify(warning.label) }} · {{ position(warning.from) }}</strong>
                    <span>首次出现 {{ position(warning.original) }}</span>
                  </span>
                </HysButton>
                <HysButton v-if="editable" size="sm" variant="text" :aria-label="'删除重复键副本 · ' + position(warning.from)"
                  @click="removeDuplicate(warning.from)">删除此副本</HysButton>
              </li>
              <li v-for="original in duplicateOriginals" :key="'first-' + original.from">
                <HysButton size="sm" variant="ghost" @click="reveal(original)">
                  {{ JSON.stringify(original.label) }} · 首次出现 {{ position(original.from) }}
                </HysButton>
                <HysButton v-if="editable" size="sm" variant="text" :aria-label="'删除首次出现的键 · ' + position(original.from)"
                  @click="removeDuplicate(original.from)">删除首次出现项</HysButton>
              </li>
            </ul>
          </HysScrollbar>
        </HysPopover>
        <HysButton v-if="schema !== null && !disabled" size="sm" variant="text" @click="activeTool = 'schema'">
          {{ schemaState === "failed" ? schemaIssues.length + " 项 Schema 问题" : schemaState === "passed" ? "Schema 校验通过" : "Schema 校验" }}
        </HysButton>
      </div>
      <span v-if="message" class="hys-json-message" role="status">{{ message }}</span>
    </footer>

    <JsonNodeForm v-if="panel" :action="panel.action" :key-name="panel.keyName" :type="panel.type" :value="panel.value"
      :error="panelError" :schema-hints="schema === null ? undefined : panelHints" @submit="submitNode" @close="closePanel" />
    <JsonTransformTools v-if="activeTool === 'repair' || activeTool === 'compare' || activeTool === 'organize' || activeTool === 'convert'"
      :key="activeTool" :tool="activeTool" :source="model" :doc="doc" :selected-id="view === 'table' ? tableTarget : treeSelection"
      :editable="editable" @close="closeTool" @apply="applyTool" @reveal="revealComparison" @download="downloadTool" @copy="files.copy($event, '结果')" />
    <HysModal v-if="fileOpen" open title="导入 JSON" size="sm" drag-mode="preview" @close="files.close">
      <p v-if="candidate" class="hys-json-import-note">导入「{{ candidate.name }}」将替换当前源码。导入后可撤销。</p>
      <HysUpload v-else accept=".json" :multiple="false" :auto-upload="false" :show-file-list="false"
        :disabled="busy" :drag="false" @select="files.select" @invalid="fileError = '请选择 .json 文件。'">
        <template #trigger><HysButton variant="secondary" :disabled="busy" :loading="busy">选择 .json 文件</HysButton></template>
      </HysUpload>
      <p v-if="fileError" class="hys-json-form-error" role="alert">{{ fileError }}</p>
      <template #footer>
        <HysButton variant="secondary" @click="files.close">取消</HysButton>
        <HysButton v-if="candidate" @click="files.confirm">替换源码</HysButton>
      </template>
    </HysModal>
  </section>
</template>

<style src="./jsonEditor.css"></style>
