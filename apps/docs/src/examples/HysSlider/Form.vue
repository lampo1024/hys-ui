<script setup lang="ts">
import { reactive, ref } from "vue";
import { HysButton, HysForm, HysFormItem, HysSelect, HysSlider } from "hys-ui";
const model = reactive({ progress: 20 }),
  size = ref<"sm" | "md" | "lg">("md"),
  message = ref("完成率达到 50 后可以提交。");
</script>
<template>
  <div class="demo-content">
    <label class="demo-field"
      ><span>表单尺寸</span
      ><HysSelect
        v-model="size"
        :options="['sm', 'md', 'lg'].map((value) => ({ label: value, value }))"
        aria-label="滑块表单尺寸"
    /></label>
    <HysForm
      :model="model"
      :size="size"
      :rules="{
        progress: { type: 'number', min: 50, message: '完成率不能小于 50' },
      }"
      @submit="message = '提交完成率：' + model.progress"
      @invalid="message = '请检查完成率'"
    >
      <HysFormItem
        label="完成率"
        prop="progress"
        hint="标签、尺寸、反馈和重置由表单统一管理"
        ><HysSlider
          v-model="model.progress"
          :show-value="false"
          show-input
          name="progress"
      /></HysFormItem>
      <template #actions
        ><HysButton type="submit">提交进度</HysButton
        ><HysButton variant="secondary" type="reset"
          >重置进度</HysButton
        ></template
      >
    </HysForm>
    <output class="state-output" aria-live="polite">{{ message }}</output>
  </div>
</template>
