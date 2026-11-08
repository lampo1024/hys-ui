<script setup lang="ts">
import { reactive, ref } from "vue";
import { HysCheckbox, HysForm, HysFormItem, HysInput } from "hys-ui";
const model = reactive({ name: "", alias: "", note: "" }),
  inline = ref(true),
  icons = ref(true);
</script>
<template>
  <div class="demo-content">
    <div class="demo-row">
      <HysCheckbox v-model="inline" label="行内反馈" /><HysCheckbox
        v-model="icons"
        label="状态图标"
      />
    </div>
    <HysForm
      :model="model"
      :inline-feedback="inline"
      :feedback-icon="icons"
      label-position="right"
      label-width="auto"
      optional-mark="（选填）"
    >
      <HysFormItem
        label="公开名称"
        prop="name"
        status="error"
        help="该名称已被占用"
        extra="extra 说明与错误提示可同时出现"
        tooltip="对外展示的名称"
        ><HysInput v-model="model.name"
      /></HysFormItem>
      <HysFormItem
        label="显示别名"
        prop="alias"
        status="warning"
        warning="建议使用容易辨认的名称"
        ><HysInput v-model="model.alias"
      /></HysFormItem>
      <HysFormItem
        label="备注"
        prop="note"
        status="success"
        hint="状态可由调用方控制"
        ><HysInput v-model="model.note"
      /></HysFormItem>
    </HysForm>
    <p class="scenario-note">
      inlineFeedback、feedbackIcon、optionalMark
      可由表单统一配置，也可以逐项覆盖。help
      会替代自动消息；feedback、error、warning、hint、extra 和 tooltip
      插槽可定制内容。
    </p>
  </div>
</template>
