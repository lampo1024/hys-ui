<script setup lang="ts">
import { FileText, Folder } from "lucide-vue-next";
import { HysSortableList, type HysSortChange } from "hys-ui";

type Node = { id: string; label: string; folder?: boolean };
const props = defineProps<{
  branch: string;
  label: string;
  model: Record<string, Node[]>;
}>();
const emit = defineEmits<{
  update: [branch: string, items: Node[]];
  change: [event: HysSortChange<Node>];
  message: [text: string];
}>();
</script>

<template>
  <HysSortableList
    :model-value="props.model[branch] ?? []"
    :list-id="'tree-' + branch"
    :aria-label="label"
    group="document-tree"
    :show-buttons="false"
    class="branch"
    @update:model-value="emit('update', branch, $event)"
    @change="emit('change', $event)"
    @invalid="emit('message', $event.message)"
  >
    <template #item="{ item }">
      <div class="node">
        <span
          ><component
            :is="item.folder ? Folder : FileText"
            :size="15"
            aria-hidden="true"
          />{{ item.label }}</span
        >
        <SortableTreeBranch
          v-if="item.folder"
          :branch="item.id"
          :label="item.label"
          :model="model"
          @update="(id, items) => emit('update', id, items)"
          @change="emit('change', $event)"
          @message="emit('message', $event)"
        />
      </div>
    </template>
    <template #empty>拖到此处放入文件夹</template>
  </HysSortableList>
</template>

<style scoped>
.branch {
  --hys-sort-gap: 6px;
}
.branch > :deep(.hys-sort-viewport > div > .hys-sort-list > .hys-sort-row) {
  align-items: flex-start;
}
.node {
  display: grid;
  gap: 6px;
  min-width: 0;
}
.node > span {
  display: flex;
  min-height: 30px;
  align-items: center;
  gap: 7px;
}
.node > span svg {
  flex: none;
  color: var(--docs-muted);
}
.node .branch {
  border-inline-start: 1px solid var(--docs-border);
  padding-inline-start: 6px;
}
</style>
