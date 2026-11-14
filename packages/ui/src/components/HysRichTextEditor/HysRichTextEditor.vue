<script setup lang="ts">
import { useHysControlState } from "../../composables/formContext";

import {
  ref,
  onMounted,
  watch,
  nextTick,
  onActivated,
  onDeactivated,
  onBeforeUnmount,
} from "vue";
import DOMPurify from "dompurify";
import { useHysRootAttrs } from "../../config";
import HysModal from "../HysModal/HysModal.vue";
import HysInput from "../HysInput/HysInput.vue";
import HysButton from "../HysButton/HysButton.vue";
const props = defineProps<{
    disabled?: boolean;
    readonly?: boolean;
    placeholder?: string;
    hideToolbar?: boolean;
    plainTextPaste?: boolean;
    showBlockTools?: boolean;
    showTextCount?: boolean;
  }>(),
  model = defineModel<string>({ default: "" }),
  emit = defineEmits<{
    change: [html: string];
    focus: [event: FocusEvent];
    blur: [event: FocusEvent];
  }>(),
  hysRootAttrs = useHysRootAttrs(),
  editor = ref<HTMLElement>(),
  linkOpen = ref(false),
  link = ref(""),
  error = ref("");
const { disabled: controlDisabled } = useHysControlState(props);
const textCount = ref(0);
function getText() {
  const element = editor.value;
  return element?.innerText ?? element?.textContent ?? "";
}
function updateTextCount() {
  if (props.showTextCount) textCount.value = Array.from(getText().replace(/\s/g, "")).length;
}
watch(() => props.showTextCount, updateTextCount);

const tools = [
  ["bold", "粗体"],
  ["italic", "斜体"],
  ["insertUnorderedList", "列表"],
  ["insertOrderedList", "编号"],
  ["createLink", "链接"],
  ["undo", "撤销"],
  ["redo", "重做"],
];
const blocks = [
  ["heading", "小标题"],
  ["blockquote", "引用"],
  ["removeFormat", "清除样式"],
];
let selection: Range | undefined,
  active = true,
  generation = 0;
function invalidate() {
  generation++;
  linkOpen.value = false;
  selection = undefined;
}
watch(() => [controlDisabled.value, props.readonly], invalidate);
onActivated(() => {
  active = true;
});
onDeactivated(() => {
  active = false;
  invalidate();
});
onBeforeUnmount(() => {
  active = false;
  invalidate();
});
function sanitize(value: string) {
  return DOMPurify.isSupported
    ? DOMPurify.sanitize(value, {
        USE_PROFILES: { html: true },
        FORBID_TAGS: ["style", "form", "input", "button", "textarea", "select"],
        FORBID_ATTR: ["srcset", "contenteditable"],
      })
    : "";
}
function render(value: string) {
  const element = editor.value;
  if (!element) return;
  if (element.innerHTML !== value) {
    if (DOMPurify.isSupported) element.innerHTML = sanitize(value);
    else element.textContent = value;
  }
  updateTextCount();
}
onMounted(() => render(model.value));
watch(model, render);
function sync() {
  if (controlDisabled.value || props.readonly || !editor.value) return;
  updateTextCount();
  const html = sanitize(editor.value.innerHTML);
  if (html === model.value) return;
  model.value = html;
  emit("change", html);
}
function insertTransfer(event: ClipboardEvent | DragEvent) {
  event.preventDefault();
  const element = editor.value;
  if (!element || controlDisabled.value || props.readonly) return;
  const data =
    "clipboardData" in event ? event.clipboardData : event.dataTransfer;
  if (!data) return;
  element.focus();
  const current = window.getSelection();
  if (current && !element.contains(current.anchorNode)) {
    const end = document.createRange();
    end.selectNodeContents(element);
    end.collapse(false);
    current.removeAllRanges();
    current.addRange(end);
  }
  const html = !props.plainTextPaste && data.getData("text/html");
  if (html) document.execCommand("insertHTML", false, sanitize(html));
  else document.execCommand("insertText", false, data.getData("text/plain"));
  sync();
}
function command(name: string) {
  if (!active || controlDisabled.value || props.readonly) return;
  if (name === "createLink") {
    const range = window.getSelection();
    selection =
      range?.rangeCount &&
      editor.value?.contains(range.getRangeAt(0).commonAncestorContainer)
        ? range.getRangeAt(0).cloneRange()
        : undefined;
    link.value = "";
    error.value = "";
    linkOpen.value = true;
    return;
  }
  editor.value?.focus();
  if (name === "heading" || name === "blockquote")
    document.execCommand(
      "formatBlock",
      false,
      name === "heading" ? "h3" : "blockquote",
    );
  else document.execCommand(name, false);
  sync();
}
async function applyLink() {
  if (!active || controlDisabled.value || props.readonly) return;
  if (!/^https?:\/\//i.test(link.value)) {
    error.value = "请输入 http:// 或 https:// 链接";
    return;
  }
  const token = ++generation;
  linkOpen.value = false;
  await nextTick();
  if (
    !active ||
    controlDisabled.value ||
    props.readonly ||
    token !== generation ||
    !editor.value?.isConnected
  )
    return;
  editor.value.focus();
  if (selection && editor.value.contains(selection.commonAncestorContainer)) {
    const range = window.getSelection();
    range?.removeAllRanges();
    range?.addRange(selection);
  } else {
    const current = window.getSelection();
    if (current && !editor.value.contains(current.anchorNode)) {
      const end = document.createRange();
      end.selectNodeContents(editor.value);
      end.collapse(false);
      current.removeAllRanges();
      current.addRange(end);
    }
  }
  document.execCommand("createLink", false, link.value);
  sync();
}
defineExpose({
  focus: () => editor.value?.focus(),
  blur: () => editor.value?.blur(),
  getHTML: () => editor.value?.innerHTML || "",
  getText,
});
</script>
<template>
  <div v-bind="hysRootAttrs" class="hys-ui-ent-panel">
    <div
      v-if="!hideToolbar"
      class="hys-ui-ent-toolbar"
      role="toolbar"
      aria-label="文本格式"
    >
      <button
        v-for="tool in showBlockTools ? [...tools, ...blocks] : tools"
        :key="tool[0]"
        type="button"
        :disabled="controlDisabled || readonly"
        @mousedown.prevent
        @click="command(tool[0])"
      >
        {{ tool[1] }}
      </button>
    </div>
    <div
      ref="editor"
      class="hys-ui-ent-editor"
      :contenteditable="!controlDisabled && !readonly"
      :data-placeholder="placeholder"
      role="textbox"
      :aria-readonly="readonly"
      :aria-disabled="controlDisabled"
      aria-label="富文本编辑器"
      aria-multiline="true"
      @input="sync"
      @paste="insertTransfer"
      @drop="insertTransfer"
      @focus="emit('focus', $event)"
      @blur="emit('blur', $event)"
    />
    <p v-if="showTextCount" class="hys-rich-text-count">{{ textCount }} 字符</p>
    <HysModal :open="linkOpen" title="插入链接" @close="linkOpen = false"
      ><HysInput
        v-model="link"
        placeholder="https://example.com"
        :error="error"
      /><template #footer
        ><HysButton @click="applyLink">插入</HysButton></template
      ></HysModal
    >
  </div>
</template>
<style scoped>
.hys-ui-ent-editor:empty:before {
  content: attr(data-placeholder);
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted));
  pointer-events: none;
}
.hys-ui-ent-editor[contenteditable="false"] {
  background: var(--hys-ui-surface-alt, var(--hys-ui-theme-surface-alt));
}
.hys-rich-text-count {
  margin: 6px 0 0;
  color: var(--hys-ui-theme-muted);
  font-size: 12px;
  text-align: end;
}
</style>
