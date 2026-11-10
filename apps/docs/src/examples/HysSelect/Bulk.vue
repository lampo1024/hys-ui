<script setup lang="ts">
import { ref } from "vue";
import { HysSelect, type HysSelectDataOption } from "hys-ui";
const basic = ref(["vue"]),
  filtered = ref(["vue", "design"]),
  limited = ref<string[]>([]),
  compact = ref<string[]>([]),
  hidden = ref(["vue"]),
  last = ref("尚未执行批量操作");
const narrow = ref<string[]>([]),
  large = ref<number[]>([]),
  many = Array.from({ length: 200 }, (_, i) => ({
    label: "资源 " + String(i + 1).padStart(3, "0"),
    value: i,
  }));
const options: HysSelectDataOption[] = [
  {
    label: "前端开发",
    options: [
      { label: "Vue", value: "vue" },
      { label: "TypeScript", value: "ts" },
      { label: "Vite", value: "vite" },
      { label: "React", value: "react" },
      { label: "停用方案", value: "legacy", disabled: true },
    ],
  },
  {
    label: "协作工具",
    options: [
      { label: "界面设计", value: "design" },
      { label: "质量测试", value: "qa" },
      { label: "交付文档", value: "docs" },
    ],
  },
];
</script>
<template>
  <div class="demo-stack">
    <div class="select-demo-grid">
      <label class="select-demo-field"
        ><span>全选与全不选</span
        ><HysSelect
          v-model="basic"
          :options="options"
          multiple
          :max-tag-count="2"
          aria-label="基础批量选择"
          @select-all="(_, items) => (last = '已添加 ' + items.length + ' 项')"
          @deselect-all="
            (_, items) => (last = '已取消 ' + items.length + ' 项')
          "
      /></label>
      <label class="select-demo-field"
        ><span>筛选后只操作匹配结果</span
        ><HysSelect
          v-model="filtered"
          :options="options"
          multiple
          filterable
          :max-tag-count="2"
          aria-label="筛选批量选择"
      /></label>
      <label class="select-demo-field"
        ><span>最多选择 3 项</span
        ><HysSelect
          v-model="limited"
          :options="options"
          multiple
          :multiple-limit="3"
          :max-tag-count="2"
          aria-label="有限批量选择"
      /></label>
      <label class="select-demo-field"
        ><span>始终作用于全部已加载选项</span
        ><HysSelect
          v-model="compact"
          :options="options"
          multiple
          filterable
          select-all-scope="all"
          size="sm"
          :max-tag-count="1"
          aria-label="全部选项批量选择"
      /></label>
      <label class="select-demo-field"
        ><span>按需隐藏操作区</span
        ><HysSelect
          v-model="hidden"
          :options="options"
          multiple
          :show-select-all="false"
          :max-tag-count="2"
          aria-label="隐藏批量工具栏"
      /></label>
      <label class="select-demo-field"
        ><span>紧凑宽度与小尺寸</span
        ><HysSelect
          v-model="narrow"
          :options="options"
          multiple
          popup-match-width
          :max-tag-count="0"
          size="sm"
          style="width: 160px"
          aria-label="紧凑批量选择"
      /></label>
      <label class="select-demo-field"
        ><span>大量选项与虚拟列表</span
        ><HysSelect
          v-model="large"
          :options="many"
          multiple
          filterable
          aria-label="大批量选择"
      /></label>
    </div>
    <output class="state-output"
      >{{ last }} · 当前选择：{{ basic.join("、") || "无" }}</output
    >
    <p class="scenario-note">
      批量操作位于选项浮层顶部。默认只作用于当前结果，跳过禁用项，保留其他已选值；搜索词不会被清空。全选遇到数量上限后停止追加，不改变已有顺序。工具栏按钮支持
      Tab、Enter 与空格。
    </p>
  </div>
</template>
