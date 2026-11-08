<script setup lang="ts">
import { reactive } from "vue";
import {
  HysButton,
  HysForm,
  HysFormItem,
  HysInput,
  HysSelect,
  HysTextarea,
} from "hys-ui";
const model = reactive({
  name: "",
  email: "",
  role: "member",
  department: "engineering",
  note: "",
});
</script>
<template>
  <div class="demo-content">
    <HysForm :model="model" :columns="{ xs: 1, md: 2 }" :gap="24">
      <HysFormItem label="姓名" prop="name"
        ><HysInput v-model="model.name"
      /></HysFormItem>
      <HysFormItem label="联系邮箱" prop="email"
        ><HysInput v-model="model.email"
      /></HysFormItem>
      <HysFormItem label="角色" prop="role"
        ><HysSelect
          v-model="model.role"
          :options="[
            { label: '成员', value: 'member' },
            { label: '管理员', value: 'admin' },
          ]"
      /></HysFormItem>
      <HysFormItem label="部门" prop="department"
        ><HysSelect
          v-model="model.department"
          :options="[
            { label: '研发', value: 'engineering' },
            { label: '产品', value: 'product' },
          ]"
      /></HysFormItem>
      <HysFormItem label="补充说明" prop="note" :span="{ xs: 1, md: 2 }"
        ><HysTextarea v-model="model.note" :rows="3"
      /></HysFormItem>
      <template #actions
        ><HysButton type="reset" variant="secondary"
          >清空填写</HysButton
        ></template
      >
    </HysForm>
    <p class="scenario-note">
      columns 与 span 使用容器断点，放入抽屉或弹窗也会按可用宽度调整。xs / sm /
      md / lg / xl / xxl 分别从 0 / 576 / 768 / 992 / 1200 / 1600px 生效。
    </p>
    <HysForm
      :model="model"
      layout="horizontal"
      :label-col="{ span: 6, xs: 8, md: 6 }"
      :wrapper-col="{ span: 18, xs: 16, md: 18 }"
      colon
    >
      <HysFormItem label="栅格标签" prop="name"
        ><HysInput
          v-model="model.name"
          placeholder="标签与控件使用 24 栅格比例"
      /></HysFormItem>
      <HysFormItem
        label="局部偏移"
        prop="email"
        :label-col="{ span: 5, offset: 1 }"
        :wrapper-col="{ span: 16, offset: 1 }"
        ><HysInput v-model="model.email"
      /></HysFormItem>
    </HysForm>
  </div>
</template>
