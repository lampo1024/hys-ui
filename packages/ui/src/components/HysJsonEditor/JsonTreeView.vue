<script setup lang="ts">
import { ArrowDown, ArrowUp, Braces, ChevronsDownUp, ChevronsUpDown, CodeXml, Copy, Link2, Pencil, Plus, TextCursor, Trash2 } from "lucide-vue-next";
import { computed, nextTick, ref, onMounted, watch } from "vue";
import HysButton from "../HysButton/HysButton.vue";
import HysTooltip from "../HysTooltip/HysTooltip.vue";
import HysTree from "../HysTree/HysTree.vue";
import type { HysTreeInstance } from "../../composables/tree";
import { jsonPointer, type JsonNode } from "./jsonDocument";
import type { JsonNodeAction } from "./jsonTreeEdits";

const props = defineProps<{ root: JsonNode; disabled: boolean; editable: boolean; height: number }>();
const current = defineModel<string>("selectedId", { default: "root" });
const emit = defineEmits<{
  edit: [action: JsonNodeAction, node: JsonNode];
  remove: [node: JsonNode, siblings: JsonNode[], index: number];
  move: [node: JsonNode, target: JsonNode];
  copy: [node: JsonNode, path: boolean];
  reveal: [node: JsonNode];
}>();
const tree = ref<HysTreeInstance<JsonNode>>();
const nodes = computed(() => [props.root]);
const selected = computed(() => tree.value?.getNode(current.value) ?? props.root);
const parent = computed(() => selected.value.parent ? tree.value?.getNode(selected.value.parent) : undefined);
const siblings = computed(() => parent.value?.children ?? []);
const index = computed(() => siblings.value.indexOf(selected.value));
const path = computed(() => jsonPointer(selected.value));
async function revealSelection(id: string) {
  if (!tree.value || !tree.value.getNode(id)) return;
  await tree.value.setCurrentKey(id, true);
  await tree.value.scrollTo({ key: id, align: "auto" });
}
watch(current, revealSelection, { flush: "post" });
onMounted(() => { if (current.value !== "root") void revealSelection(current.value); });
const actions = computed(() => {
  const node = selected.value;
  const enabled = props.editable && !node.ambiguous;
  const array = enabled && parent.value?.type === "array";
  return [
    { label: "在源码中定位", icon: CodeXml, show: true, run: () => emit("reveal", node) },
    { label: "复制节点值", icon: Copy, show: true, run: () => emit("copy", node, false) },
    { label: "复制节点路径", icon: Link2, show: path.value !== undefined, run: () => emit("copy", node, true) },
    { label: "编辑节点值", icon: Pencil, show: enabled, run: () => emit("edit", "edit", node) },
    { label: "添加子节点", icon: Plus, show: enabled && !!node.children, run: () => emit("edit", "add", node) },
    { label: "重命名字段", icon: TextCursor, show: enabled && !!node.key, run: () => emit("edit", "rename", node) },
    { label: "上移数组项", icon: ArrowUp, show: array && index.value > 0, run: () => move(-1) },
    { label: "下移数组项", icon: ArrowDown, show: array && index.value < siblings.value.length - 1, run: () => move(1) },
    { label: "删除节点", icon: Trash2, show: enabled && index.value >= 0, run: () => {
      emit("remove", node, siblings.value, index.value);
      current.value = parent.value?.id ?? "root";
    } },
  ].filter(action => action.show);
});
function move(by: number) {
  const target = siblings.value[index.value + by];
  if (!target) return;
  emit("move", selected.value, target);
  void nextTick(() => {
    if (tree.value?.getNode(target.id)) current.value = target.id;
  });
}
function matches(query: string, node: JsonNode) {
  const lower = query.toLocaleLowerCase();
  const value = node.type === "string" ? JSON.parse(node.preview) as string : node.preview;
  return node.label.toLocaleLowerCase().includes(lower) || value.toLocaleLowerCase().includes(lower);
}
</script>

<template>
  <div class="hys-json-tree">
    <div class="hys-json-node-tools hys-json-tree-navigation" role="group" aria-label="树节点展开与折叠">
      <HysTooltip text="展开全部节点">
        <HysButton size="sm" variant="ghost" class="hys-json-node-tool" :icon="ChevronsUpDown" aria-label="展开全部节点"
          :disabled="disabled || !root.children?.length" @click="tree?.expandAll()" />
      </HysTooltip>
      <HysTooltip text="折叠全部节点">
        <HysButton size="sm" variant="ghost" class="hys-json-node-tool" :icon="ChevronsDownUp" aria-label="折叠全部节点"
          :disabled="disabled || !root.children?.length" @click="tree?.collapseAll()" />
      </HysTooltip>
    </div>
    <HysTree ref="tree" v-model="current" :nodes="nodes" :default-expanded-keys="['root']" :disabled="disabled"
      :filter-node="matches" :viewport-height="height" aria-label="JSON 节点" search-placeholder="搜索键名或值"
      virtual :row-height="32" :show-icon="false" size="sm" show-line>
      <template #node="{ node }">
        <span class="hys-json-tree-row" :data-json-node="node.id">
          <Braces v-if="node.children" class="hys-json-branch-icon" :size="14" aria-hidden="true" />
          <span class="hys-json-node-name">{{ node.label || '""' }}</span>
          <code :class="['hys-json-preview', `hys-json-${node.type}`]">{{ node.preview }}</code>
          <span v-if="node.duplicate" class="hys-json-warning-text">重复键</span>
        </span>
      </template>
    </HysTree>
    <div class="hys-json-node-bar" role="group" aria-label="选中节点操作">
      <code class="hys-json-node-path">{{ path === undefined ? "重复键 · 可在源码中定位" : path === "" ? "根节点" : path }}</code>
      <div class="hys-json-node-tools">
        <HysTooltip v-for="action in actions" :key="action.label" :text="action.label">
          <HysButton size="sm" variant="ghost" class="hys-json-node-tool" :icon="action.icon" :aria-label="action.label"
            :disabled="disabled" @click="action.run" />
        </HysTooltip>
      </div>
    </div>
  </div>
</template>
