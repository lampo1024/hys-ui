<script setup lang="ts">
import { reactive, ref } from "vue";
import {
  HysForm,
  HysFormItem,
  HysTransfer,
  HysSelect,
  HysCheckbox,
  HysButton,
} from "hys-ui";
const model = reactive({ members: [] as string[] }),
  size = ref<"sm" | "md" | "lg">("md"),
  disabled = ref(false),
  event = ref("");
const options = [
  { value: "a", label: "产品负责人" },
  { value: "b", label: "研发负责人" },
  { value: "c", label: "测试负责人" },
];
</script>
<template>
  <div class="demo-stack">
    <div class="form-controls">
      <label
        >表单尺寸<HysSelect
          v-model="size"
          :options="[
            { label: '小', value: 'sm' },
            { label: '中', value: 'md' },
            { label: '大', value: 'lg' },
          ]" /></label
      ><HysCheckbox v-model="disabled" label="禁用表单" />
    </div>
    <HysForm
      :model="model"
      :size="size"
      :disabled="disabled"
      @submit="event = '成员配置已保存'"
      @invalid="event = '请先完成成员配置'"
      ><HysFormItem
        label="协作成员"
        prop="members"
        :rules="{
          type: 'array',
          required: true,
          min: 1,
          message: '请至少选择一位成员',
        }"
        ><HysTransfer
          v-model="model.members"
          :options="options"
          :list-height="150" /></HysFormItem
      ><template #actions
        ><HysButton native-type="submit">保存配置</HysButton
        ><HysButton native-type="reset" variant="secondary"
          >重置</HysButton
        ></template
      ></HysForm
    >
  </div>
  <output>{{ event || "请至少移入一位协作成员" }}</output>
</template>
<style scoped>
.form-controls {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 18px;
}
.form-controls label {
  display: grid;
  gap: 6px;
  width: 140px;
  font-size: 12px;
  color: var(--docs-muted);
}
</style>
