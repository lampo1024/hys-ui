<script setup lang="ts">
import { useHysControlState } from "../../composables/formContext";

import { useHysRootAttrs } from "../../config";
const hysRootAttrs = useHysRootAttrs();

import { computed } from "vue";
import HysTree, { type TreeNode } from "../HysTree/HysTree.vue";
export interface OrgNode {
  id: string;
  name: string;
  parentId?: string;
  disabled?: boolean;
  description?: string;
  keywords?: readonly string[];
}
const props = withDefaults(
  defineProps<{
    nodes: OrgNode[];
    modelValue?: string;
    searchable?: boolean;
    checkable?: boolean;
    checkedKeys?: string[];
    disabled?: boolean;
    expandedKeys?: readonly string[];
    defaultExpandAll?: boolean;
    showDescription?: boolean;
    searchDetails?: boolean;
  }>(),
  { searchable: true, defaultExpandAll: true },
);
const { disabled: controlDisabled } = useHysControlState(props);

const emit = defineEmits<{
  "update:modelValue": [id: string];
  "update:checkedKeys": [keys: string[]];
  "update:expandedKeys": [keys: string[]];
  nodeSelect: [node: OrgNode];
}>();
defineSlots<{ node?: (scope: { node: OrgNode }) => unknown }>();
const nodeMap = computed(() => {
  const nodes = new Map<string, OrgNode>();
  for (const node of props.nodes)
    if (!nodes.has(node.id)) nodes.set(node.id, node);
  return nodes;
});
function select(id: string) {
  const node = nodeMap.value.get(id);
  if (node) emit("nodeSelect", node);
}
function filterDetails(query: string, node: TreeNode) {
  const source = nodeMap.value.get(String(node.id));
  const text = [source?.name, source?.description, ...(source?.keywords ?? [])].join(" ").toLowerCase();
  return query.trim().toLowerCase().split(/\s+/).every((term) => text.includes(term));
}
const tree = computed<TreeNode[]>(() => {
  const unique = nodeMap.value;
  const map = new Map<string, TreeNode>();
  for (const n of unique.values())
    if (!map.has(n.id))
      map.set(n.id, {
        id: n.id,
        label: n.name,
        disabled: n.disabled,
        children: [],
      });
  const roots: TreeNode[] = [];
  for (const n of unique.values()) {
    const node = map.get(n.id)!;
    if (n.parentId && n.parentId !== n.id && map.has(n.parentId)) {
      let p = n.parentId;
      const seen = new Set([n.id]);
      let cyclic = false;
      while (p) {
        if (seen.has(p)) {
          cyclic = true;
          break;
        }
        seen.add(p);
        p = unique.get(p)?.parentId || "";
      }
      if (!cyclic) {
        map.get(n.parentId)!.children!.push(node);
        continue;
      }
    }
    roots.push(node);
  }
  return roots;
});
</script>
<template>
  <HysTree
    v-bind="hysRootAttrs"
    :nodes="tree"
    :model-value="modelValue"
    :checked-keys="checkedKeys"
    :expanded-keys="expandedKeys"
    :checkable="checkable"
    :searchable="searchable !== false"
    :disabled="controlDisabled"
    :default-expand-all="defaultExpandAll"
    :filter-node="searchDetails ? filterDetails : undefined"
    @update:model-value="emit('update:modelValue', $event)"
    @update:checked-keys="emit('update:checkedKeys', $event.map(String))"
    @update:expanded-keys="emit('update:expandedKeys', $event.map(String))"
    @select="select(String($event.id))"
  >
    <template v-if="showDescription || $slots.node" #node="{ node }">
      <slot name="node" :node="nodeMap.get(String(node.id))!">
        <span>{{ node.label }}</span>
        <small
          v-if="showDescription && nodeMap.get(String(node.id))?.description"
          class="hys-org-description"
          >{{ nodeMap.get(String(node.id))?.description }}</small
        >
      </slot>
    </template>
  </HysTree>
</template>

<style scoped>
.hys-org-description {
  margin-inline-start: 8px;
  color: var(--hys-ui-theme-muted);
}
</style>
