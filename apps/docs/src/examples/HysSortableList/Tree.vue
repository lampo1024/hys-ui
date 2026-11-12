<script setup lang="ts">
import { reactive, ref } from "vue";
import type { HysSortChange } from "hys-ui";
import SortableTreeBranch from "../../components/SortableTreeBranch/SortableTreeBranch.vue";

type Node = { id: string; label: string; folder?: boolean };
const branches = reactive<Record<string, Node[]>>({
  root: [
    { id: "design", label: "设计资料", folder: true },
    { id: "release", label: "发布资料", folder: true },
    { id: "readme", label: "项目说明" },
  ],
  design: [
    { id: "draft", label: "界面草稿" },
    { id: "archive", label: "历史版本", folder: true },
  ],
  archive: [{ id: "v1", label: "第一版" }],
  release: [],
});
const status = ref("拖到其他文件夹可调整层级。");
function update(id: string, items: Node[]) {
  branches[id] = items;
}
function changed(event: HysSortChange<Node>) {
  status.value =
    event.lists.length === 2 ? "已移动到新的层级" : "已调整同层顺序";
}
</script>

<template>
  <div class="demo-stack">
    <SortableTreeBranch
      branch="root"
      label="文件目录"
      :model="branches"
      @update="update"
      @change="changed"
      @message="status = $event"
    />
    <small class="status" role="status">{{ status }}</small>
  </div>
</template>

<style scoped>
.status {
  color: var(--docs-muted);
}
</style>
