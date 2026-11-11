<script setup lang="ts">
import { ref } from "vue";
import { HysMention } from "hys-ui";

const text = ref("请 @张 复核 #发 的安排。");
const options = [
  { id: "zhang", title: "张工", prefix: "@" },
  { id: "li", title: "李工", prefix: "@" },
  { id: "发布", title: "发布计划", prefix: "#" },
  { id: "验收", title: "验收清单", prefix: "#" },
];
const search = ref("");
</script>

<template>
  <div class="demo-stack">
    <HysMention
      v-model="text"
      :prefix="['@', '#']"
      :options="options"
      :field-names="{ value: 'id', label: 'title' }"
      whole
      highlight-match
      replace-rest
      show-arrow
      not-found-text="没有匹配的候选"
      @search="(query, prefix) => (search = prefix + query)"
    >
      <template #header="{ context }">
        <div class="mention-category">
          {{ context?.prefix === "#" ? "话题" : "团队成员" }}
        </div>
      </template>
    </HysMention>
    <output class="state-output">当前查询 {{ search || "未开始" }}</output>
    <p class="scenario-note">
      把光标放在 @ 或 #
      后输入。选择后保留后文，在已插入的提及词末尾按退格键可整段删除。
    </p>
  </div>
</template>

<style scoped>
.mention-category {
  padding: 6px 10px;
  font-weight: 600;
}
</style>
