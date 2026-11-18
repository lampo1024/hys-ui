<script setup lang="ts">
import { ref } from "vue";
import { HysStepForm, HysFormItem, HysInput } from "hys-ui";
const model = ref({ title: "", owner: "" });
const step = ref(0);
const result = ref("");
const rules = [{ required: true, message: "请填写此项" }];
</script>

<template>
  <div class="demo-stack">
    <HysStepForm v-model:current="step" :steps="['工作区', '负责人', '检查']" :model="model" @finish="result = '已提交 ' + model.title">
      <HysFormItem v-if="step === 0" label="工作区名称" prop="title" :rules="rules"><HysInput v-model="model.title" /></HysFormItem>
      <HysFormItem v-else-if="step === 1" label="负责人" prop="owner" :rules="rules"><HysInput v-model="model.owner" /></HysFormItem>
      <p v-else>工作区 {{ model.title }} · 负责人 {{ model.owner }}</p>
    </HysStepForm>
    <p v-if="result" aria-live="polite">{{ result }}</p>
  </div>
</template>
