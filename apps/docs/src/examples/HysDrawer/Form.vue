<script setup lang="ts">
import { reactive, ref } from "vue";
import {
  HysButton,
  HysForm,
  HysFormItem,
  HysInput,
  HysDrawer,
  HysSelect,
} from "hys-ui";
const open = ref(false),
  form = ref<InstanceType<typeof HysForm>>(),
  result = ref("尚未创建");
const model = reactive({ name: "", role: "member" });
async function submit() {
  if (!(await form.value?.validate())) return false;
  result.value = "已创建：" + model.name;
}
</script>
<template>
  <div class="demo-content">
    <HysButton @click="open = true">新建成员</HysButton>
  </div>
  <p class="state-output">{{ result }}</p>
  <HysDrawer
    v-model:open="open"
    title="新建成员"
    footer
    confirm-on-ctrl-enter
    :before-confirm="submit"
    ok-text="创建成员"
    description="填写必要信息，Ctrl / Cmd + Enter 可快速提交。"
  >
    <HysForm
      ref="form"
      :model="model"
      :rules="{ name: [{ required: true, message: '请输入成员名称' }] }"
    >
      <HysFormItem prop="name" label="成员名称"
        ><HysInput v-model="model.name" placeholder="输入名称"
      /></HysFormItem>
      <HysFormItem prop="role" label="角色"
        ><HysSelect
          v-model="model.role"
          :options="[
            { label: '普通成员', value: 'member' },
            { label: '管理员', value: 'admin' },
          ]"
      /></HysFormItem>
    </HysForm>
  </HysDrawer>
</template>
