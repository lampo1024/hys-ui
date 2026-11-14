<script setup lang="ts">
import { computed, nextTick, onMounted, onBeforeUnmount, ref, watch } from "vue";
import { Bold, Italic, Strikethrough, Code, FileCode2, Heading, Quote, List, ListOrdered, ListTodo, Minus, Link, Image, Table, Undo2, Redo2, Search, ListTree, Link2, Ellipsis, FolderOpen, Download, Copy } from "lucide-vue-next";
import HysButton from "../HysButton/HysButton.vue";
import HysTooltip from "../HysTooltip/HysTooltip.vue";
import HysPopover from "../HysPopover/HysPopover.vue";
import HysScrollbar from "../HysScrollbar/HysScrollbar.vue";
import HysSegmented from "../HysSegmented/HysSegmented.vue";
import type { HysMarkdownEditorView, MarkdownFormat } from "./markdownSource";
import type { MarkdownHeading } from "./markdownPreview";

const props = defineProps<{
  mode: HysMarkdownEditorView; wide: boolean; editable: boolean; disabled: boolean;
  undo: boolean; redo: boolean; findOpen: boolean; synced: boolean; headings: MarkdownHeading[];
}>();
export type MarkdownTool = MarkdownFormat | "undo" | "redo" | "link" | "image" | "code" | "table" | "find" | "outline" | "sync" | "import" | "export" | "copy";
const emit = defineEmits<{
  action: [tool: MarkdownTool, level?: number]; view: [view: HysMarkdownEditorView]; heading: [heading: MarkdownHeading];
}>();
const modes = [
  { value: "edit", label: "编辑" }, { value: "split", label: "分栏" }, { value: "preview", label: "预览" },
] as const;
const modeOptions = computed(() => modes.filter(mode => props.wide || mode.value !== "split"));
const tools = [
  { id: "undo", label: "撤销", icon: Undo2 }, { id: "redo", label: "重做", icon: Redo2 },
  { id: "heading", label: "标题与正文", icon: Heading }, { id: "bold", label: "粗体", icon: Bold },
  { id: "italic", label: "斜体", icon: Italic }, { id: "strike", label: "删除线", icon: Strikethrough },
  { id: "quote", label: "引用", icon: Quote }, { id: "bullet", label: "无序列表", icon: List },
  { id: "numbered", label: "有序列表", icon: ListOrdered }, { id: "task", label: "任务列表", icon: ListTodo },
  { id: "inlineCode", label: "行内代码", icon: Code }, { id: "code", label: "代码块", icon: FileCode2 },
  { id: "link", label: "链接", icon: Link }, { id: "image", label: "图片地址", icon: Image },
  { id: "table", label: "表格", icon: Table }, { id: "rule", label: "分隔线", icon: Minus },
  { id: "find", label: "查找与替换", icon: Search }, { id: "outline", label: "标题大纲", icon: ListTree },
  { id: "sync", label: "同步滚动", icon: Link2 }, { id: "import", label: "导入 Markdown", icon: FolderOpen },
  { id: "copy", label: "复制 Markdown", icon: Copy }, { id: "export", label: "下载 Markdown", icon: Download },
] as const satisfies readonly { id: MarkdownTool; label: string; icon: unknown }[];
const priority: readonly MarkdownTool[] = ["undo", "heading", "bold", "link", "table", "find", "outline", "redo", "italic", "task", "image", "bullet", "code"];
const root = ref<HTMLElement>();
const modeRoot = ref<HTMLElement>();
const available = ref(0);
const open = ref<"main" | "more">();
const pane = ref<"heading" | "outline">();
const subMenu = ref<HTMLElement>();
let observer: ResizeObserver | undefined;
const indexed = computed(() => tools.filter(tool => tool.id !== "sync" || props.mode === "split"));
const rank = (tool: MarkdownTool) => {
  const position = priority.indexOf(tool);
  return position < 0 ? priority.length : position;
};
const visible = computed(() => {
  const count = Math.max(0, Math.floor(available.value / 34));
  const ranked = indexed.value.filter(tool => tool.id !== "import" && tool.id !== "copy" && tool.id !== "export")
    .sort((a, b) => rank(a.id) - rank(b.id));
  const chosen = new Set<(typeof tools)[number]>(ranked.slice(0, count));
  return indexed.value.filter(tool => chosen.has(tool));
});
const overflow = computed(() => indexed.value.filter(tool => !visible.value.includes(tool)));

function measure() {
  available.value = (root.value?.clientWidth ?? 0) - (modeRoot.value?.offsetWidth ?? 0) - 56;
}
onMounted(() => {
  measure();
  if (!root.value || !modeRoot.value || typeof ResizeObserver === "undefined") return;
  observer = new ResizeObserver(measure);
  observer.observe(root.value);
  observer.observe(modeRoot.value);
});
onBeforeUnmount(() => observer?.disconnect());
watch([visible, () => props.wide], () => { open.value = undefined; pane.value = undefined; });
watch(() => props.disabled, disabled => { if (disabled) open.value = undefined; });

function blocked(tool: MarkdownTool) {
  if (props.disabled) return true;
  if (["find", "outline", "sync", "copy", "export"].includes(tool)) return false;
  return !props.editable || (tool === "undo" && !props.undo) || (tool === "redo" && !props.redo);
}
function select(tool: MarkdownTool, area: "main" | "more", level?: number) {
  if ((tool === "heading" || tool === "outline") && level == null) {
    open.value = area;
    pane.value = tool;
    if (area === "more") void nextTick(() => subMenu.value?.querySelector("button")?.focus());
    return;
  }
  open.value = undefined;
  emit("action", tool, level);
}
function returnToTools(event: MouseEvent) {
  const dialog = (event.currentTarget as HTMLElement).closest('[role="dialog"]');
  const tool = pane.value;
  pane.value = undefined;
  void nextTick(() => dialog?.querySelector<HTMLElement>(`[data-md-tool="${tool}"]`)?.focus());
}
function chooseHeading(heading: MarkdownHeading) {
  open.value = undefined;
  emit("heading", heading);
}
</script>

<template>
  <div ref="root" class="hys-md-toolbar" role="toolbar" aria-label="Markdown 工具栏">
    <div class="hys-md-actions">
      <template v-for="tool in visible" :key="tool.id">
        <HysPopover v-if="tool.id === 'heading' || tool.id === 'outline'" :open="open === 'main' && pane === tool.id"
          :disabled="blocked(tool.id)" :aria-label="tool.label" placement="bottom-start"
          @update:open="$event ? select(tool.id, 'main') : open === 'main' && pane === tool.id && (open = undefined)">
          <template #trigger>
            <HysTooltip :text="tool.label" :show-delay="600" :trigger-keys="[]" :disabled="open === 'main' && pane === tool.id">
              <HysButton class="hys-md-icon" size="sm" variant="ghost" :icon="tool.icon" :disabled="blocked(tool.id)"
                :aria-label="tool.label" aria-haspopup="dialog" :aria-expanded="open === 'main' && pane === tool.id" @mousedown.prevent />
            </HysTooltip>
          </template>
          <HysScrollbar :tabindex="null" max-height="300">
            <div class="hys-md-menu">
              <template v-if="tool.id === 'heading'">
                <HysButton v-for="level in [0, 1, 2, 3, 4, 5, 6]" :key="level" size="sm" variant="ghost" @click="select('heading', 'main', level)">{{ level ? `标题 ${level}` : "正文" }}</HysButton>
              </template>
              <template v-else>
                <HysButton v-for="heading in headings" :key="heading.id" size="sm" variant="ghost"
                  :style="{ paddingInlineStart: 8 + (heading.level - 1) * 10 + 'px' }" @click="chooseHeading(heading)">{{ heading.title }}</HysButton>
                <p v-if="!headings.length">暂无标题</p>
              </template>
            </div>
          </HysScrollbar>
        </HysPopover>
        <HysTooltip v-else :text="tool.label" :show-delay="600" :trigger-keys="[]">
          <template #default="hint">
            <HysButton class="hys-md-icon" size="sm" variant="ghost" :icon="tool.icon" :disabled="blocked(tool.id)"
              :aria-label="tool.label" :aria-pressed="tool.id === 'find' ? findOpen : tool.id === 'sync' ? synced : undefined"
              @mousedown.prevent @click="void hint.close(); select(tool.id, 'main')" />
          </template>
        </HysTooltip>
      </template>
      <HysPopover :open="open === 'more'" :disabled="disabled" aria-label="更多 Markdown 操作"
        placement="bottom-start" @update:open="open = $event ? 'more' : undefined; pane = undefined">
        <template #trigger>
          <HysButton class="hys-md-icon" size="sm" variant="ghost" :icon="Ellipsis" aria-label="更多 Markdown 操作" :disabled="disabled" @mousedown.prevent />
        </template>
        <HysScrollbar :tabindex="null" max-height="330">
          <div ref="subMenu" class="hys-md-menu">
            <template v-if="pane">
              <HysButton size="sm" variant="ghost" @click="returnToTools">返回更多操作</HysButton>
              <template v-if="pane === 'heading'">
                <HysButton v-for="level in [0, 1, 2, 3, 4, 5, 6]" :key="level" size="sm" variant="ghost" @click="select('heading', 'more', level)">{{ level ? `标题 ${level}` : "正文" }}</HysButton>
              </template>
              <template v-else>
                <HysButton v-for="heading in headings" :key="heading.id" size="sm" variant="ghost"
                  :style="{ paddingInlineStart: 8 + (heading.level - 1) * 10 + 'px' }" @click="chooseHeading(heading)">{{ heading.title }}</HysButton>
                <p v-if="!headings.length">暂无标题</p>
              </template>
            </template>
            <HysButton v-for="tool in pane ? [] : overflow" :key="tool.id" size="sm" variant="ghost" :icon="tool.icon"
              :data-md-tool="tool.id" :disabled="blocked(tool.id)" :aria-pressed="tool.id === 'sync' ? synced : undefined" @click="select(tool.id, 'more')">{{ tool.label }}</HysButton>
          </div>
        </HysScrollbar>
      </HysPopover>
    </div>
    <div ref="modeRoot" class="hys-md-modes">
      <HysSegmented :model-value="mode" :options="modeOptions" :disabled="disabled" aria-label="Markdown 视图" size="sm" @update:model-value="emit('view', $event)" />
    </div>
  </div>
</template>

<style scoped>
.hys-md-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 6px 10px; min-width: 0; }
.hys-md-actions { display: flex; align-items: center; min-width: 0; }
.hys-md-actions > * { flex: none; }
.hys-md-icon { inline-size: 34px; min-inline-size: 0; padding-inline: 0; }
.hys-md-modes { flex: none; }
.hys-md-menu { display: grid; min-inline-size: min(155px, 55vw); max-inline-size: min(280px, 65vw); gap: 2px; }
.hys-md-menu .hys-ui-btn { justify-content: flex-start; white-space: normal; text-align: start; }
.hys-md-menu p { margin: 3px 8px; color: var(--hys-ui-theme-muted); }
</style>
