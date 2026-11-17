<script setup lang="ts">
import { ref } from "vue";
import { HysActionBar, HysCheckbox, type HysActionBarItem } from "hys-ui";
const available = ["报价 A", "报价 B", "报价 C"];
const selected = ref<string[]>([]);
const result = ref("");
const actions: HysActionBarItem[] = [
  {
    key: "compare",
    label: "对比两份报价",
    minSelection: 2,
    maxSelection: 2,
    variant: "primary",
  },
  { key: "new", label: "新建询价", minSelection: 0 },
  {
    key: "send",
    label: "发给审批人",
    minSelection: 1,
    overflow: true,
    confirm: true,
  },
];
function toggle(item: string, checked: boolean) {
  selected.value = checked
    ? [...selected.value, item]
    : selected.value.filter((name) => name !== item);
}
</script>
<template>
  <div class="demo-stack">
    <div class="demo-row">
      <HysCheckbox
        v-for="item in available"
        :key="item"
        :model-value="selected.includes(item)"
        @update:model-value="toggle(item, $event === true)"
        >{{ item }}</HysCheckbox
      >
    </div>
    <HysActionBar
      :actions="actions"
      :selected-count="selected.length"
      visible-when-empty
      @clear-selection="selected = []"
      @action="
        result =
          $event === 'compare'
            ? selected.join(' 与 ')
            : $event === 'new'
              ? '已创建询价草稿'
              : '已送审 ' + selected.length + ' 份报价'
      "
    />
    <small>恰好选两份报价时可对比。新建询价随时可用。</small>
    <span role="status">{{ result }}</span>
  </div>
</template>
