<script setup lang="ts">
import { ref } from "vue";
import { HysButton, HysNumberInput, type HysNumberInputInstance } from "hys-ui";
const input = ref<HysNumberInputInstance>(),
  value = ref<number | null>(2),
  events = ref<string[]>([]);
function record(text: string) {
  events.value = [...events.value.slice(-5), text];
}
</script>
<template>
  <div class="demo-content">
    <label class="demo-field"
      ><span>只接受偶数，输入时仅允许数字与负号</span
      ><HysNumberInput
        ref="input"
        v-model="value"
        :step="2"
        :validator="(value) => value === null || Number(value) % 2 === 0"
        :allow-input="(text) => /^-?\d*$/.test(text)"
        clearable
        aria-label="偶数限制"
        @input="(value) => record('input：' + value)"
        @change="(value) => record('change：' + value)"
        @step="
          (value, info) => record(info.source + ' ' + info.type + '：' + value)
        "
        @invalid="(info) => record('未更新：' + info.reason)"
    /></label>
    <div class="demo-row">
      <HysButton variant="secondary" @click="input?.focus()">聚焦</HysButton
      ><HysButton variant="secondary" @click="input?.select()"
        >选中内容</HysButton
      ><HysButton variant="secondary" @click="input?.increase()"
        >方法增加</HysButton
      ><HysButton variant="ghost" @click="input?.clear()">方法清空</HysButton>
    </div>
    <output class="state-output"
      >当前值：{{ JSON.stringify(value) }}
      {{ events.join("\n") || "操作后查看事件" }}</output
    >
    <p class="scenario-note">
      allowInput 筛选原始草稿，validator
      同步检查将要提交的值。失败会保留原模型。业务异步校验可交给
      HysForm；实例方法可通过 HysNumberInputInstance 标注类型。
    </p>
  </div>
</template>
