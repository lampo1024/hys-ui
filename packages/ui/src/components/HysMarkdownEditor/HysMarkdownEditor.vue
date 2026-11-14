<script lang="ts">
import type { HysMarkdownEditorView as MarkdownView } from "./markdownSource";
export type HysMarkdownEditorView = MarkdownView;
</script>

<script setup lang="ts">
import { computed, nextTick, onActivated, onBeforeUnmount, onDeactivated, onMounted, ref, shallowRef, toRef, useId, watch } from "vue";
import { useHysRootAttrs } from "../../config";
import { useHysControlState } from "../../composables/formContext";
import HysButton from "../HysButton/HysButton.vue";
import HysModal from "../HysModal/HysModal.vue";
import HysScrollbar, { type HysScrollbarInstance } from "../HysScrollbar/HysScrollbar.vue";
import HysUpload from "../HysUpload/HysUpload.vue";
import ScrollbarOverlay from "../HysScrollbar/ScrollbarOverlay.vue";
import { useScrollbarGeometry } from "../HysScrollbar/useScrollbarGeometry";
import MarkdownFind from "./MarkdownFind.vue";
import MarkdownInsert, { type MarkdownInsertFields } from "./MarkdownInsert.vue";
import MarkdownPreviewView from "./MarkdownPreview.vue";
import MarkdownToolbar, { type MarkdownTool } from "./MarkdownToolbar.vue";
import { findMarkdownLink, parseMarkdown, type MarkdownHeading } from "./markdownPreview";
import { formatMarkdown, insertMarkdownBlock, insertMarkdownLink, type MarkdownRange } from "./markdownSource";
import { useMarkdownCode } from "./useMarkdownCode";
import { useMarkdownFiles } from "./useMarkdownFiles";
import { useMarkdownScroll } from "./useMarkdownScroll";
import { useMarkdownSearch } from "./useMarkdownSearch";

const props = withDefaults(defineProps<{
  placeholder?: string;
  readonly?: boolean;
  disabled?: boolean;
  hideToolbar?: boolean;
  syncScroll?: boolean;
}>(), { placeholder: "输入 Markdown…", syncScroll: true });
const model = defineModel<string>({ default: "" });
const view = defineModel<HysMarkdownEditorView>("view", { default: "split" });
const emit = defineEmits<{ change: [markdown: string] }>();
const { disabled: controlDisabled } = useHysControlState(props);
const skin = useHysRootAttrs();
const id = useId();
const root = ref<HTMLElement>();
const host = ref<HTMLElement>();
const previewRef = ref<HysScrollbarInstance>();
const active = ref(true);
const wide = ref(false);
const findOpen = ref(false);
const status = ref("");
const syncOn = ref(props.syncScroll);
const source = ref(model.value);
const readonly = toRef(props, "readonly");
const disabled = computed(() => !active.value || controlDisabled.value);
const editable = computed(() => !disabled.value && !props.readonly);
const mode = computed(() => view.value === "split" && !wide.value ? "edit" : view.value);
const previewViewport = computed(() => previewRef.value?.viewport ?? undefined);
const renderedSource = ref(source.value);
const rendered = shallowRef(parseMarkdown(renderedSource.value, id));
let previewTimer: ReturnType<typeof setTimeout> | undefined;
let contained: ResizeObserver | undefined;
let panelVersion = 0;

type Panel = { range: MarkdownRange; original: string; version: number; title: string; labelSource?: string; fields: MarkdownInsertFields };
const panel = shallowRef<Panel>();

function invalidate() {
  panelVersion++;
  panel.value = undefined;
  files.cancel();
}
function publish(value: string) {
  if (!editable.value || value === source.value) return;
  source.value = value;
  model.value = value;
  emit("change", value);
}
const code = useMarkdownCode(host, source, disabled, readonly, toRef(props, "placeholder"), {
  change: publish, invalidate,
  shortcut(key) {
    if (disabled.value || (key !== "find" && !editable.value)) return false;
    action(key);
    return true;
  },
});
const currentPreview = computed(() => renderedSource.value === source.value);
const scroll = useMarkdownScroll(code.editor, previewViewport,
  computed(() => active.value && syncOn.value && mode.value === "split" && currentPreview.value), rendered);
const { geometry } = useScrollbarGeometry(() => code.viewport.value, () => code.editor.value?.contentDOM, {
  enabled: () => mode.value !== "preview",
});
const files = useMarkdownFiles(source, editable, disabled, status, text => {
  const editor = code.editor.value;
  if (!editor) return false;
  ensureSource();
  return code.transact({ from: 0, to: editor.state.doc.length, insert: text }, { from: 0, to: 0 });
});
const { importing, busy, candidate } = files;
const searchSource = computed(() => source.value.replace(/\r\n?/g, "\n"));
const search = useMarkdownSearch(searchSource, code.selection, range => code.reveal(range), changes => code.transact(changes, undefined, false));
const { find, replacement, sensitive, index, matches } = search;

function setView(next: HysMarkdownEditorView) {
  view.value = next;
}
function ensureSource() {
  if (mode.value === "preview") setView("edit");
}
function refreshPreview() {
  if (previewTimer !== undefined) clearTimeout(previewTimer);
  previewTimer = undefined;
  if (renderedSource.value === source.value) return;
  rendered.value = parseMarkdown(source.value, id);
  renderedSource.value = source.value;
}
watch(source, () => {
  if (previewTimer !== undefined) clearTimeout(previewTimer);
  previewTimer = setTimeout(refreshPreview, 100);
});
watch(model, value => {
  if (value === source.value) return;
  invalidate();
  source.value = value;
  code.replaceExternal(value);
});
watch(() => props.syncScroll, value => { syncOn.value = value; });
watch(disabled, value => { if (value) { invalidate(); findOpen.value = false; } });
watch(editable, value => { if (!value) invalidate(); });
watch(mode, value => {
  if (value !== "edit") refreshPreview();
  void nextTick(() => code.editor.value?.requestMeasure());
});
onMounted(() => {
  const el = root.value;
  if (!el) return;
  const resize = () => { wide.value = el.clientWidth >= 760; };
  resize();
  if (typeof ResizeObserver !== "undefined") {
    contained = new ResizeObserver(resize);
    contained.observe(el);
  }
});
onActivated(() => { active.value = true; });
onDeactivated(() => { active.value = false; invalidate(); });
onBeforeUnmount(() => {
  contained?.disconnect();
  if (previewTimer !== undefined) clearTimeout(previewTimer);
});

function openPanel(kind: MarkdownInsertFields["kind"]) {
  const document = code.editor.value?.state.doc;
  if (!document) return;
  const original = document.toString();
  const range = code.selection.value;
  const existing = kind === "link" || kind === "image" ? findMarkdownLink(original, range, kind === "image") : undefined;
  const selected = kind === "link" || kind === "image" ? document.sliceString(range.from, range.to) : "";
  panel.value = {
    range: existing?.range ?? range, title: existing?.title ?? "", labelSource: existing?.labelSource, original, version: panelVersion,
    fields: { kind, text: existing?.text ?? selected, url: existing?.url ?? "", editing: !!existing },
  };
}
function closePanel() {
  const previous = panel.value;
  panel.value = undefined;
  if (previous?.version === panelVersion) void nextTick(() => code.focus());
}
function submitPanel(values: { text: string; url: string; rows: number; columns: number; language: string }) {
  const target = panel.value;
  panel.value = undefined;
  if (!target || target.version !== panelVersion || !editable.value || code.editor.value?.state.doc.toString() !== target.original) return;
  const { kind } = target.fields;
  const edit = kind === "link" || kind === "image"
    ? insertMarkdownLink(target.range, kind === "image", values.text, values.url, target.title, values.text === target.fields.text ? target.labelSource : undefined)
    : insertMarkdownBlock(target.original, target.range, kind, values);
  void nextTick(() => {
    if (target.version === panelVersion && code.editor.value?.state.doc.toString() === target.original) code.apply(edit);
  });
}
function action(tool: MarkdownTool, level?: number) {
  if (disabled.value) return;
  if (tool === "find") {
    findOpen.value = !findOpen.value;
    if (findOpen.value) ensureSource();
    else code.focus();
  } else if (tool === "sync") {
    syncOn.value = !syncOn.value;
  } else if (tool === "copy") {
    void files.copy(source.value);
  } else if (tool === "export") {
    files.download();
  } else if (editable.value) {
    if (tool === "import") { files.open(); return; }
    if (tool === "outline") return;
    ensureSource();
    if (tool === "undo" || tool === "redo") code.stepHistory(tool);
    else if (tool === "link" || tool === "image" || tool === "code" || tool === "table") openPanel(tool);
    else if (code.editor.value) code.apply(formatMarkdown(code.editor.value.state.doc.toString(), code.selection.value, tool, level));
  }
}
function goToId(target: string) {
  const viewport = previewViewport.value;
  const element = Array.from(viewport?.querySelectorAll<HTMLElement>("[id]") ?? []).find(node => node.id === target);
  if (element && viewport) viewport.scrollTop += element.getBoundingClientRect().top - viewport.getBoundingClientRect().top;
}
function goToHeading(heading: MarkdownHeading) {
  refreshPreview();
  const resolved = rendered.value.headings.find(item => item.line === heading.line && item.title === heading.title);
  if (!resolved) return;
  const doc = code.editor.value?.state.doc;
  if (doc) {
    const position = doc.line(Math.min(doc.lines, resolved.line)).from;
    code.reveal({ from: position, to: position });
  }
  void nextTick(() => goToId(resolved.id));
}
function toggleTask(offset: number, checked: boolean) {
  if (!editable.value || !currentPreview.value) return;
  const doc = code.editor.value?.state.doc;
  if (!doc) return;
  const position = renderedSource.value.includes("\r") ? renderedSource.value.slice(0, offset).replace(/\r\n?/g, "\n").length : offset;
  const before = doc.sliceString(position - 1, position + 2);
  if (!/^\[[ xX]\]$/.test(before)) return;
  code.transact({ from: position, to: position + 1, insert: checked ? "x" : " " }, undefined, false);
}
function focus() {
  if (disabled.value) return;
  ensureSource();
  void nextTick(code.focus);
}
defineExpose({ focus, blur: code.blur, getMarkdown: () => source.value });
</script>

<template>
  <section ref="root" v-bind="skin" class="hys-md-editor" :aria-disabled="disabled || undefined">
    <MarkdownToolbar v-if="!hideToolbar" :mode="mode" :wide="wide" :editable="editable" :disabled="disabled || !code.ready.value"
      :undo="code.historyState.value.undo" :redo="code.historyState.value.redo" :find-open="findOpen" :synced="syncOn"
      :headings="rendered.headings" @action="action" @view="setView" @heading="goToHeading" />
    <MarkdownFind v-if="findOpen && !disabled" v-model:find="find" v-model:replacement="replacement" v-model:sensitive="sensitive"
      :readonly="readonly" :count="matches.length" :index="index" @step="search.step" @replace="search.replaceCurrent"
      @replace-all="search.replaceAll" @close="action('find')" />
    <div class="hys-md-panes" :data-view="mode">
      <div v-show="mode !== 'preview'" class="hys-md-source hys-ui-scrollbar">
        <div ref="host" class="hys-md-code-host" />
        <ScrollbarOverlay :viewport="code.viewport.value" :geometry="geometry" />
      </div>
      <HysScrollbar v-show="mode !== 'edit'" ref="previewRef" class="hys-md-preview" height="100%"
        aria-label="Markdown 预览区域" :tabindex="disabled ? null : 0" @scroll="scroll.fromPreview">
        <MarkdownPreviewView :content="rendered" :source="renderedSource" :current="currentPreview" :editable="editable"
          :disabled="disabled" @task="toggleTask" @copy="files.copy($event, '代码')" @anchor="goToId" />
      </HysScrollbar>
    </div>
    <p v-if="status && !importing" class="hys-md-status" role="status">{{ status }}</p>
    <MarkdownInsert v-if="panel" :values="panel.fields" @submit="submitPanel" @close="closePanel" />
    <HysModal v-if="importing" open title="导入 Markdown" size="sm" drag-mode="preview" :restore-focus="!candidate" @close="files.cancel">
      <p v-if="candidate" class="hys-md-import-note">导入「{{ candidate.name }}」将替换当前正文。导入后可撤销。</p>
      <HysUpload v-else accept=".md" :multiple="false" :auto-upload="false" :show-file-list="false" :disabled="busy"
        :drag="false" @select="files.select" @invalid="status = '请选择 .md 文件。'">
        <template #trigger><HysButton variant="secondary" :disabled="busy" :loading="busy">选择 .md 文件</HysButton></template>
      </HysUpload>
      <p v-if="status" class="hys-md-status" role="alert">{{ status }}</p>
      <template #footer>
        <HysButton variant="secondary" @click="files.cancel">取消</HysButton>
        <HysButton v-if="candidate" @click="files.commit">替换正文</HysButton>
      </template>
    </HysModal>
  </section>
</template>

<style src="./markdownEditor.css"></style>
