<script setup lang="ts">
import { ref } from "vue";
import {
  HysTree,
  HysButton,
  HysInput,
  type TreeNode,
  type HysTreeInstance,
} from "hys-ui";
const api = ref<HysTreeInstance>(),
  name = ref("新建目录"),
  count = ref(1),
  output = ref("");
const nodes = ref<TreeNode[]>([
  {
    id: "workspace",
    label: "工作空间",
    children: [
      { id: "docs", label: "项目文档" },
      { id: "assets", label: "设计资源" },
    ],
  },
]);
async function add() {
  const id = "folder-" + count.value++;
  output.value = (await api.value?.append(
    { id, label: name.value || "新建目录" },
    "workspace",
  ))
    ? "目录已添加"
    : "未添加";
}
</script>
<template>
  <div class="demo-stack">
    <div class="demo-actions">
      <HysInput v-model="name" placeholder="目录名称" /><HysButton
        size="sm"
        @click="add"
        >添加目录</HysButton
      >
    </div>
    <HysTree
      ref="api"
      v-model:nodes="nodes"
      :default-expanded-keys="['workspace']"
      ><template #actions="{ key, depth }"
        ><HysButton
          v-if="depth > 0"
          size="sm"
          variant="ghost"
          @click="api?.remove(key)"
          >删除</HysButton
        ></template
      ></HysTree
    ><output>{{
      output || "数据编辑通过 v-model:nodes 更新宿主数组，不修改原始对象。"
    }}</output>
  </div>
</template>
