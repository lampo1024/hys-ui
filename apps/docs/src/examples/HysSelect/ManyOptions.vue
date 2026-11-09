<script setup lang="ts">
import { ref } from "vue";
import { HysSelect } from "hys-ui";
const single = ref<number | null>(1),
  multiple = ref<number[]>([2, 18]);
const options = Array.from({ length: 80 }, (_, i) => ({
  value: i + 1,
  label: `成员 ${String(i + 1).padStart(2, "0")} · ${["产品设计", "前端研发", "质量保障", "运营支持"][i % 4]}`,
  disabled: i === 8,
}));
</script>
<template>
  <div>
    <div class="select-demo-grid">
      <label class="select-demo-field"
        ><span>多选项单选 · 支持搜索</span
        ><HysSelect
          v-model="single"
          :options="options"
          filterable
          clearable
          aria-label="多选项单选"
          placeholder="选择成员"
      /></label>
      <label class="select-demo-field"
        ><span>多选项多选 · 最多显示两个标签</span
        ><HysSelect
          v-model="multiple"
          :options="options"
          multiple
          filterable
          clearable
          :max-tag-count="2"
          aria-label="多选项多选"
          placeholder="选择协作成员"
          ><template #header><small>选择本次协作的成员</small></template
          ><template #footer
            ><small>可输入编号或职能查找</small></template
          ></HysSelect
        ></label
      >
    </div>
    <output class="state-output"
      >单选：{{ single ?? "未选择" }} · 多选：{{
        multiple.join("、") || "未选择"
      }}</output
    >
    <p class="scenario-note">
      选项较多时在浮层内部滚动；默认列表最大高度为
      240px，并随窗口高度收缩。搜索区和底部说明始终可见，方向键可滚动定位到后面的选项。更多数据可使用下方的虚拟列表示例。
    </p>
  </div>
</template>
