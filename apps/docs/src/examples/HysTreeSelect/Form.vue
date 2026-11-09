<script setup lang="ts">
import { reactive, ref } from "vue";
import {
  HysTreeSelect,
  HysForm,
  HysFormItem,
  HysButton,
  HysSelect,
  HysCheckbox,
  type HysTreeKey,
} from "hys-ui";
const model = reactive({ teams: [] as HysTreeKey[] }),
  size = ref<"sm" | "md" | "lg">("md"),
  disabled = ref(false),
  result = ref("");
const nodes = [
  {
    value: "r",
    label: "研发中心",
    children: [
      { value: "platform", label: "平台研发" },
      { value: "qa", label: "质量保障" },
    ],
  },
  { value: "p", label: "产品中心" },
];
</script>
<template>
  <div class="demo-stack">
    <div class="demo-actions">
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
      :disabled="disabled"
      :size="size"
      @submit="result = '团队配置已保存'"
      @invalid="result = '请先选择团队'"
      ><HysFormItem
        prop="teams"
        label="协作团队"
        :rules="{
          type: 'array',
          required: true,
          min: 1,
          message: '请至少选择一个团队',
        }"
        ><HysTreeSelect
          v-model="model.teams"
          :nodes="nodes"
          checkable
          clearable /></HysFormItem
      ><template #actions
        ><HysButton native-type="submit">保存配置</HysButton
        ><HysButton native-type="reset" variant="secondary"
          >重置</HysButton
        ></template
      ></HysForm
    ><output>{{
      result || `已选择：${model.teams.join("、") || "无"}`
    }}</output>
  </div>
</template>
