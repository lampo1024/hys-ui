<script setup lang="ts">
import { ref, reactive } from "vue";
import {
  HysDatePicker,
  HysDateRangePicker,
  HysButton,
  HysSelect,
  HysCheckbox,
  HysForm,
  HysFormItem,
} from "hys-ui";
const model = reactive({ day: "", range: ["", ""] as [string, string] }),
  size = ref<"sm" | "md" | "lg">("md"),
  disabled = ref(false),
  result = ref("");
</script>
<template>
  <div class="demo-stack">
    <div class="demo-content demo-stack">
      <div class="demo-controls">
        <label class="demo-field"
          >表单尺寸<HysSelect
            v-model="size"
            :options="[
              { label: '小', value: 'sm' },
              { label: '中', value: 'md' },
              { label: '大', value: 'lg' },
            ]" /></label
        ><HysCheckbox v-model="disabled">禁用表单</HysCheckbox>
      </div>
      <HysForm
        :model="model"
        :size="size"
        :disabled="disabled"
        @submit="result = '计划已保存'"
        @invalid="result = '请完善日期'"
        ><HysFormItem
          prop="day"
          label="交付日期"
          :rules="{ required: true, message: '请选择交付日期' }"
          ><HysDatePicker
            v-model="model.day"
            name="delivery"
            clearable /></HysFormItem
        ><HysFormItem
          prop="range"
          label="实施周期"
          :rules="{
            validator: (value: unknown) =>
              (Array.isArray(value) && value.every(Boolean)) ||
              '请选择完整周期',
          }"
          ><HysDateRangePicker
            v-model="model.range"
            :name="['start', 'end']"
            clearable /></HysFormItem
        ><template #actions
          ><HysButton native-type="submit">保存计划</HysButton
          ><HysButton native-type="reset" variant="secondary"
            >重置</HysButton
          ></template
        ></HysForm
      >
    </div>
    <output class="state-output">{{ result || model }}</output>
  </div>
</template>
<style scoped>
.date-demo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 250px), 1fr));
  gap: 22px;
}
.date-demo-grid > label {
  display: flex;
  flex-direction: column;
  gap: 9px;
  font-size: 13px;
  color: var(--docs-muted);
}
.date-demo-inline {
  max-width: 350px;
}
.date-demo-cell {
  position: relative;
  display: inline-grid;
  place-items: center;
  min-width: 20px;
}
.date-demo-cell i {
  position: absolute;
  bottom: -5px;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: currentColor;
}
.date-demo-summary {
  margin-inline-end: auto;
  color: var(--docs-muted);
  font-size: 12px;
}
</style>
