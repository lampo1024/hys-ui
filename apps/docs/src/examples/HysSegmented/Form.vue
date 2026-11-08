<script setup lang="ts">
import { ref, reactive } from "vue";
import {
  HysSegmented,
  HysForm,
  HysFormItem,
  HysButton,
  HysSelect,
} from "hys-ui";
const data = reactive({ view: "" }),
  form = ref<InstanceType<typeof HysForm>>(),
  size = ref<"sm" | "md" | "lg">("md"),
  message = ref("");
</script>
<template>
  <div class="demo-content">
    <label class="choice-demo-field"
      ><span>表单尺寸</span
      ><HysSelect
        v-model="size"
        :options="
          ['sm', 'md', 'lg'].map((value) => ({ label: value, value }))
        " /></label
    ><HysForm
      ref="form"
      :model="data"
      :size="size"
      :rules="{ view: { required: true, message: '请选择视图' } }"
      @submit="message = '提交成功'"
      ><HysFormItem label="默认视图" prop="view"
        ><HysSegmented
          v-model="data.view"
          :options="['列表', '看板', '日历']"
          name="view"
      /></HysFormItem>
      <div class="demo-row">
        <HysButton type="submit">提交</HysButton
        ><HysButton
          variant="secondary"
          @click="
            form?.resetFields();
            message = '';
          "
          >重置表单</HysButton
        >
      </div></HysForm
    ><output>{{ message || JSON.stringify(data) }}</output>
  </div>
</template>
