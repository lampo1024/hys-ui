<script setup lang="ts">
import { ref } from "vue";
import { HysActionBar, HysCheckbox, type HysActionBarItem } from "hys-ui";
const files = ref(["发运清单草稿", "旧版签收模板", "对账备份"]);
const selected = ref<string[]>(["旧版签收模板"]);
const actions: HysActionBarItem[] = [
  {
    key: "remove",
    label: "删除草稿",
    variant: "danger",
    confirm: {
      title: "删除已选草稿？",
      description: "删除后，草稿将从当前目录移除。",
      confirmText: "删除",
    },
  },
];
const feedback = ref("");
function remove() {
  files.value = files.value.filter((file) => !selected.value.includes(file));
  feedback.value = `已删除 ${selected.value.length} 份草稿`;
  selected.value = [];
}
</script>

<template>
  <div class="demo-stack">
    <HysActionBar
      :selected-count="selected.length"
      :actions="actions"
      visible-when-empty
      @action="remove"
      @clear-selection="selected = []"
    />
    <div v-for="file in files" :key="file">
      <HysCheckbox
        :model-value="selected.includes(file)"
        @update:model-value="
          selected = $event
            ? [...selected, file]
            : selected.filter((name) => name !== file)
        "
        >{{ file }}</HysCheckbox
      >
    </div>
    <span role="status">{{ feedback || "请确认要删除的草稿" }}</span>
  </div>
</template>
