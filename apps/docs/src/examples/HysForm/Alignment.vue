<script setup lang="ts">
import { reactive, ref } from "vue";
import {
  HysButton,
  HysCheckbox,
  HysForm,
  HysFormItem,
  HysInput,
  HysSelect,
} from "hys-ui";
const model = reactive({ name: "", email: "", description: "" });
const align = ref<"left" | "right">("right"),
  longLabel = ref(true),
  wrap = ref(true);
</script>
<template>
  <div class="demo-content">
    <div class="demo-controls">
      <section class="demo-control-section">
        <h3>标签对齐</h3>
        <div class="demo-control-fields">
          <label class="demo-field"
            ><span>对齐方式</span
            ><HysSelect
              v-model="align"
              :options="[
                { label: '右对齐', value: 'right' },
                { label: '左对齐', value: 'left' },
              ]"
          /></label>
        </div>
        <div class="demo-control-toggles">
          <HysCheckbox v-model="longLabel" label="显示较长标签" /><HysCheckbox
            v-model="wrap"
            label="允许固定宽度标签换行"
          />
        </div>
      </section>
    </div>
    <HysForm
      :model="model"
      layout="horizontal"
      label-width="auto"
      :label-align="align"
      colon
      optional-mark="（选填）"
    >
      <HysFormItem
        label="姓名"
        prop="name"
        :rules="{ required: true }"
        tooltip="填写可用于联系的姓名"
        ><HysInput v-model="model.name"
      /></HysFormItem>
      <HysFormItem v-if="longLabel" label="常用联系邮箱" prop="email"
        ><HysInput v-model="model.email"
      /></HysFormItem>
      <HysFormItem label="较长的字段说明" :label-width="120" :label-wrap="wrap"
        ><HysInput
          v-model="model.description"
          placeholder="单项可以覆盖标签宽度"
      /></HysFormItem>
      <template #actions
        ><HysButton type="submit">验证表单</HysButton
        ><HysButton variant="secondary" type="reset">重置</HysButton></template
      >
    </HysForm>
    <p class="scenario-note">
      auto
      按可见字段的最长标签统一对齐。标签、尺寸或可见字段变化时自动重新测量；单项可覆盖宽度和对齐方式。操作区与控件起点保持一致。
    </p>
  </div>
</template>
