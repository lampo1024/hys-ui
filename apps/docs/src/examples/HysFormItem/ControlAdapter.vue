<script setup lang="ts">
import { defineComponent, h, reactive, ref } from "vue";
import {
  HysButton,
  HysCheckbox,
  HysForm,
  HysFormItem,
  useHysFormItemContext,
} from "hys-ui";
const ChoiceControl = defineComponent({
  props: { modelValue: { type: String, default: "" } },
  emits: ["update:modelValue"],
  setup(props, { emit }) {
    const field = useHysFormItemContext();
    return () =>
      h(
        "div",
        {
          id: field.id.value,
          role: "group",
          "aria-label": field.label.value,
          "aria-invalid": field.invalid.value,
          "aria-describedby": field.describedBy.value,
          style: { display: "flex", gap: "10px" },
        },
        ["个人", "团队"].map((value) =>
          h(
            HysButton,
            {
              disabled: field.disabled.value,
              size: field.size.value,
              variant: props.modelValue === value ? "primary" : "secondary",
              "aria-pressed": props.modelValue === value,
              onClick: async () => {
                emit("update:modelValue", value);
                await field.validate("change");
              },
            },
            () => value,
          ),
        ),
      );
  },
});
const model = reactive({ choice: "" }),
  disabled = ref(false),
  message = ref("选择一种使用方式");
</script>
<template>
  <div class="demo-content">
    <HysCheckbox v-model="disabled" label="禁用整个表单" />
    <HysForm
      :model="model"
      :disabled="disabled"
      :rules="{ choice: { required: true, message: '请选择一种使用方式' } }"
      @submit="message = '已选择：' + model.choice"
    >
      <HysFormItem label="使用方式" prop="choice" group
        ><ChoiceControl v-model="model.choice"
      /></HysFormItem>
      <template #actions
        ><HysButton type="submit">验证自定义控件</HysButton
        ><HysButton variant="secondary" type="reset"
          >重置选择</HysButton
        ></template
      >
    </HysForm>
    <output class="state-output">{{ message }}</output>
    <p class="scenario-note">
      useHysFormItemContext 为复合控件提供标签、尺寸、禁用、错误和描述关联，以及
      validate('change' / 'blur')。无须依赖控件的内部 DOM 结构。
    </p>
  </div>
</template>
