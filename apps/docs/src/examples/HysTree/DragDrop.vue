<script setup lang="ts">
import { ref, toRaw } from "vue";
import { HysTree, type TreeNode } from "hys-ui";
const nodes = ref<TreeNode[]>([
  {
    id: "a",
    label: "研发中心",
    children: [
      { id: "b", label: "后端组" },
      { id: "c", label: "前端组" },
    ],
  },
  { id: "d", label: "产品中心" },
]);
const message = ref("");
function move(payload: {
  dragId: string;
  targetId: string;
  position: "before" | "inside" | "after";
}) {
  const next = structuredClone(toRaw(nodes.value)),
    find = (
      list: TreeNode[],
      id: string,
    ):
      | {
          list: TreeNode[];
          index: number;
        }
      | undefined => {
      for (let index = 0; index < list.length; index++) {
        if (list[index].id === id) return { list, index };
        const found = find(list[index].children || [], id);
        if (found) return found;
      }
    };
  const source = find(next, payload.dragId);
  if (!source) return;
  const item = source.list.splice(source.index, 1)[0],
    target = find(next, payload.targetId);
  if (!target) return;
  if (payload.position === "inside") {
    const parent = target.list[target.index];
    (parent.children ??= []).push(item);
  } else
    target.list.splice(
      target.index + (payload.position === "after" ? 1 : 0),
      0,
      item,
    );
  nodes.value = next;
  message.value = `已移动 ${item.label}，位置 ${payload.position}`;
}
</script>
<template>
  <div>
    <HysTree
      :nodes="nodes"
      draggable
      default-expand-all
      show-line
      @node-drop="move"
    /><output aria-live="polite">{{
      message || "拖到节点上部、中部或下部，分别插入之前、内部或之后。"
    }}</output>
  </div>
</template>
