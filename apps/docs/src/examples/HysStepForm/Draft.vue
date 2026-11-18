<script setup lang="ts">
import { ref } from "vue";
import { HysStepForm, HysFormItem, HysInput, HysCheckbox, type HysStepDraft } from "hys-ui";
const model = ref<Record<string, unknown>>({ name:"", managed:false, contact:"" });
const saved = ref<HysStepDraft>();
const output = ref("");
const steps = [
  "账户",
  { title: "联系人", when: (data: Record<string, unknown>) => data.managed === true },
  "完成设置",
];
async function validateStep(step: number, values: Record<string, unknown>) {
  if (step !== 0) return;
  await new Promise(resolve => setTimeout(resolve, 450));
  if (String(values.name).trim().toLowerCase() === "admin") {
    return { field: "name", message: "该账户名称已被占用，请换一个名称。" };
  }
}
</script>

<template>
  <div class="demo-stack">
    <HysStepForm :steps="steps" :model="model" :validate-step="validateStep" jump-to-visited
      :save-draft="draft => { saved = draft; }" :load-draft="() => saved"
      @restore-draft="model = $event.values" @finish="output = String($event.name)">
      <template #default="{ step }">
        <template v-if="step === 0">
          <HysFormItem label="账户名称" prop="name" :rules="{ required: true }">
            <HysInput :model-value="String(model.name)" @update:model-value="model.name = $event" />
          </HysFormItem>
          <p class="demo-note">输入 admin 可查看异步校验回到出错字段的效果。</p>
          <HysCheckbox :model-value="model.managed === true" @update:model-value="model.managed = $event">委托他人管理</HysCheckbox>
        </template>
        <HysFormItem v-else-if="step === 1" label="管理联系人" prop="contact" :rules="{ required:true }"><HysInput :model-value="String(model.contact)" @update:model-value="model.contact = $event" /></HysFormItem>
        <p v-else>账户 {{ model.name }} 的设置已填完。</p>
      </template>
      <template #review="{ values }"><p>即将提交账户 {{ values.name }}<template v-if="values.managed">，联系人 {{ values.contact }}</template>。</p></template>
    </HysStepForm>
    <p v-if="output" role="status">已提交账户 {{ output }}</p>
  </div>
</template>
