<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import {
  HysButton,
  HysCheckbox,
  HysForm,
  HysFormItem,
  HysInput,
  HysSelect,
  type HysFormRules,
  type HysFormTrigger,
} from "hys-ui";
const model = reactive({ code: "" }),
  first = ref(false),
  policy = ref("manual"),
  message = ref("点击检查规则查看全部错误");
const trigger = computed<HysFormTrigger[]>(() =>
  policy.value === "manual" ? [] : [policy.value as HysFormTrigger],
);
const rules: HysFormRules = {
  code: [
    { required: true, message: "请填写名称" },
    { min: 4, message: "至少输入 4 个字符" },
    { pattern: /^[A-Z]+$/, message: "只能使用大写英文字母" },
    {
      asyncValidator: (value, done) =>
        done(value === "ADMIN" ? "该名称已被占用" : undefined),
    },
  ],
};
</script>
<template>
  <div class="demo-content">
    <div class="demo-controls">
      <section class="demo-control-section">
        <h3>校验策略</h3>
        <div class="demo-control-fields">
          <label class="demo-field"
            ><span>自动触发</span
            ><HysSelect
              v-model="policy"
              :options="[
                { label: '仅手动检查', value: 'manual' },
                { label: '值变化时', value: 'change' },
                { label: '离开字段时', value: 'blur' },
              ]"
          /></label>
        </div>
        <div class="demo-control-toggles">
          <HysCheckbox v-model="first" label="遇到首个错误后停止" />
        </div>
      </section>
    </div>
    <HysForm
      :model="model"
      :rules="rules"
      :validate-trigger="trigger"
      :validate-first="first"
      feedback-icon
      @validation="(result) => (message = JSON.stringify(result.errorMessages))"
    >
      <HysFormItem
        label="名称"
        prop="code"
        hint="输入 x 可触发多条错误；ADMIN 会触发回调校验错误"
        ><HysInput v-model="model.code"
      /></HysFormItem>
      <template #actions
        ><HysButton type="submit">检查规则</HysButton
        ><HysButton type="reset" variant="secondary"
          >重置规则示例</HysButton
        ></template
      >
    </HysForm>
    <output class="state-output" aria-live="polite">{{ message }}</output>
    <p class="scenario-note">
      validateTrigger
      为空数组时关闭自动检查，实例校验仍执行全部规则。validateFirst
      可在表单项上单独覆盖。message 可使用函数；asyncValidator 支持回调或
      Promise。
    </p>
  </div>
</template>
