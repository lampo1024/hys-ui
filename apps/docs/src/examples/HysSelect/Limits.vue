<script setup lang="ts">
import { ref } from "vue";
import { HysCheckbox, HysSelect } from "hys-ui";
const selected = ref([0, 1]),
  readonly = ref(false),
  options = [
    { label: "Keller · 产品设计", value: 0 },
    { label: "Lisa · 前端研发", value: 1 },
    { label: "Amy · 质量保障", value: 2 },
    { label: "David · 平台工程", value: 3 },
    { label: "Jack · 暂不可选", value: 4, disabled: true },
  ];
</script>
<template>
  <div class="demo-content">
    <div class="demo-controls">
      <section class="demo-control-section">
        <h3>选择限制</h3>
        <div class="demo-control-toggles">
          <HysCheckbox v-model="readonly" label="只读展示" />
        </div>
      </section>
    </div>
    <label class="select-demo-field"
      ><span>最多选择三位成员，展示两个标签</span
      ><HysSelect
        v-model="selected"
        :options="options"
        multiple
        filterable
        clearable
        :multiple-limit="3"
        :max-tag-count="2"
        :max-tag-text-length="12"
        :readonly="readonly"
        aria-label="受限多选成员" /></label
    ><output class="state-output">已选：{{ selected }}</output>
    <p class="scenario-note">
      达到上限后，未选项不可再选；已选项仍可取消。支持单独移除、Backspace
      删除最后一个可移除标签、文本截断及折叠计数。折叠标签的完整名称可通过悬停查看。
    </p>
  </div>
</template>
