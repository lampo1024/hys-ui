<script setup lang="ts">
import { Braces, Copy, Download, Ellipsis, FileUp, Minimize2, Redo2, Search, Undo2, Wrench } from "lucide-vue-next";
import { computed, onMounted, onBeforeUnmount, ref, watch } from "vue";
import HysButton from "../HysButton/HysButton.vue";
import HysPopover from "../HysPopover/HysPopover.vue";
import HysSegmented from "../HysSegmented/HysSegmented.vue";
import HysTooltip from "../HysTooltip/HysTooltip.vue";
import type { HysJsonEditorView } from "./HysJsonEditor.vue";
import { jsonTools, type JsonTool } from "./jsonTools";

const props = defineProps<{
  view: HysJsonEditorView;
  disabled: boolean;
  editable: boolean;
  compactable: boolean;
  valid: boolean;
  undo: boolean;
  redo: boolean;
  finding: boolean;
}>();
const tools = [
  { id: "pretty", label: "格式化", icon: Braces },
  { id: "find", label: "查找与替换", icon: Search },
  { id: "undo", label: "撤销", icon: Undo2 },
  { id: "redo", label: "重做", icon: Redo2 },
  { id: "tools", label: "JSON 工具", icon: Wrench },
  { id: "compact", label: "压缩", icon: Minimize2 },
  { id: "import", label: "导入 JSON", icon: FileUp },
  { id: "copy", label: "复制源码", icon: Copy },
  { id: "download", label: "下载 JSON", icon: Download },
] as const;
type Tool = (typeof tools)[number]["id"];
const emit = defineEmits<{ action: [tool: Exclude<Tool, "tools">]; view: [mode: HysJsonEditorView]; tool: [tool: JsonTool] }>();
const modes = [{ value: "text", label: "源码" }, { value: "tree", label: "树视图" }, { value: "table", label: "表格" }] as const;
const strip = ref<HTMLElement>();
const width = ref<number>();
const open = ref(false);
const toolsOpen = ref(false);
let observer: ResizeObserver | undefined;
const actions = computed(() => tools.filter(tool => tool.id !== "compact" || props.compactable));
const visibleCount = computed(() => {
  const slots = width.value === undefined ? 4 : Math.floor(width.value / 34);
  return slots >= actions.value.length ? actions.value.length : Math.max(0, slots - 1);
});
const visible = computed(() => actions.value.slice(0, visibleCount.value));
const overflow = computed(() => actions.value.slice(visibleCount.value));
function locked(tool: Tool) {
  if (props.disabled) return true;
  if (tool === "undo" || tool === "redo") return !props.editable || !props[tool];
  if (tool === "download") return !props.valid;
  return ["pretty", "compact", "import"].includes(tool) && !props.editable;
}
function action(tool: Exclude<Tool, "tools">) {
  open.value = false;
  emit("action", tool);
}
function selectTool(tool: JsonTool) {
  open.value = toolsOpen.value = false;
  emit("tool", tool);
}
onMounted(() => {
  if (!strip.value || typeof ResizeObserver === "undefined") return;
  observer = new ResizeObserver(([entry]) => { width.value = entry.contentRect.width; });
  observer.observe(strip.value);
});
onBeforeUnmount(() => observer?.disconnect());
watch(() => props.disabled || !overflow.value.length, closed => { if (closed) open.value = false; });
watch(() => props.disabled || !visible.value.some(tool => tool.id === "tools"), closed => { if (closed) toolsOpen.value = false; });
</script>

<template>
  <div class="hys-json-toolbar" role="group" aria-label="JSON 工具栏">
    <div ref="strip" class="hys-json-tools">
      <template v-for="tool in visible" :key="tool.id">
        <HysPopover v-if="tool.id === 'tools'" v-model:open="toolsOpen" trigger="click" placement="bottom-start" :disabled="disabled">
          <template #trigger>
            <HysTooltip text="JSON 工具">
              <HysButton class="hys-json-tool" size="sm" variant="ghost" :icon="Wrench" aria-label="JSON 工具" :disabled="disabled" />
            </HysTooltip>
          </template>
          <div class="hys-json-menu" role="group" aria-label="JSON 工具">
            <HysButton v-for="item in jsonTools" :key="item.id" size="sm" variant="ghost" :disabled="disabled || item.writes && !editable"
              @click="selectTool(item.id)">{{ item.label }}</HysButton>
          </div>
        </HysPopover>
        <HysTooltip v-else :text="tool.label">
          <HysButton class="hys-json-tool" size="sm" variant="ghost" :icon="tool.icon" :aria-label="tool.label"
            :aria-pressed="tool.id === 'find' ? finding : undefined" :disabled="locked(tool.id)" @click="action(tool.id)" />
        </HysTooltip>
      </template>
      <HysPopover v-if="overflow.length" v-model:open="open" trigger="click" placement="bottom-start"
        :disabled="disabled" aria-label="更多 JSON 操作">
        <template #trigger>
          <HysButton class="hys-json-tool" size="sm" variant="ghost" :icon="Ellipsis" aria-label="更多 JSON 操作" :disabled="disabled" />
        </template>
        <div class="hys-json-menu" role="group" aria-label="更多 JSON 操作">
          <template v-for="tool in overflow" :key="tool.id">
            <template v-if="tool.id === 'tools'">
              <span class="hys-json-menu-label">JSON 工具</span>
              <HysButton v-for="item in jsonTools" :key="item.id" size="sm" variant="ghost" :disabled="disabled || item.writes && !editable"
                @click="selectTool(item.id)">{{ item.label }}</HysButton>
            </template>
            <HysButton v-else size="sm" variant="ghost" :icon="tool.icon" :disabled="locked(tool.id)" @click="action(tool.id)">{{ tool.label }}</HysButton>
          </template>
        </div>
      </HysPopover>
    </div>
    <HysSegmented :model-value="view" :options="modes" :disabled="disabled" size="sm"
      aria-label="JSON 视图" @update:model-value="emit('view', $event)" />
  </div>
</template>
