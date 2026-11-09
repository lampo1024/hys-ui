<script setup lang="ts">
import { ref } from "vue";
import { HysTransfer, HysButton } from "hys-ui";
import type { HysTransferInstance } from "hys-ui";
interface Member {
  value: string;
  label: string;
  code: string;
}
const value = ref(["carol"]),
  api = ref<HysTransferInstance<Member, string>>(),
  events = ref("");
const options: Member[] = [
  { value: "alice", label: "艾丽丝 · 设计", code: "DESIGN" },
  { value: "bob", label: "鲍勃 · 研发", code: "ENGINEER" },
  { value: "carol", label: "卡罗尔 · 测试", code: "QA" },
  { value: "david", label: "大卫 · 研发", code: "ENGINEER" },
];
const filter = (query: string, item: Member) =>
  [item.label, item.code].some((text) =>
    text.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
  );
</script>
<template>
  <div class="demo-content">
    <HysTransfer
      ref="api"
      v-model="value"
      :options="options"
      :filter-method="filter"
      :filter-placeholder="['姓名或岗位编码', '搜索已选成员']"
      show-invert
      @search="
        (side, query) =>
          (events = (side === 'left' ? '待选' : '已选') + '搜索：' + query)
      "
    />
    <div class="demo-row">
      <HysButton variant="secondary" size="sm" @click="api?.clearSearch()"
        >清除两侧搜索</HysButton
      ><HysButton
        variant="secondary"
        size="sm"
        @click="api?.setSearch('left', 'ENGINEER')"
        >查找研发成员</HysButton
      >
    </div>
  </div>
  <output>{{
    events || "可以输入中文姓名或 DESIGN、ENGINEER、QA 搜索"
  }}</output>
  <p class="hint">
    搜索只改变面板中的展示结果。已移入的条目和已勾选的其他条目会保留。
  </p>
</template>
