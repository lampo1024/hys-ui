<script setup lang="ts">
import { reactive, ref } from "vue";
import {
  HysTree,
  HysForm,
  HysFormItem,
  HysButton,
  HysCheckbox,
  type HysTreeKey,
} from "hys-ui";
const model = reactive({ teams: [] as HysTreeKey[] }),
  disabled = ref(false),
  result = ref("");
const nodes = [
  {
    id: "r",
    label: "研发中心",
    children: [
      { id: "a", label: "平台研发" },
      { id: "b", label: "质量保障" },
    ],
  },
  { id: "p", label: "产品中心" },
];
</script>
<template>
  <div class="demo-stack">
    <HysCheckbox v-model="disabled" label="禁用表单" /><HysForm
      :model="model"
      :disabled="disabled"
      @submit="result = '团队配置已保存'"
      @invalid="result = '请先选择团队'"
      ><HysFormItem
        prop="teams"
        label="协作团队"
        :rules="{
          type: 'array',
          min: 1,
          required: true,
          message: '请至少勾选一个团队',
        }"
        ><HysTree
          v-model:checked-keys="model.teams"
          :nodes="nodes"
          checkable
          :selectable="false"
          default-expand-all /></HysFormItem
      ><template #actions
        ><HysButton native-type="submit">保存配置</HysButton
        ><HysButton native-type="reset" variant="secondary"
          >重置</HysButton
        ></template
      ></HysForm
    ><output>{{
      result || `已勾选：${model.teams.join("、") || "无"}`
    }}</output>
  </div>
</template>
