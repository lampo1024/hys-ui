<script setup lang="ts">
import { ref, reactive } from "vue";
import { HysRating, HysForm, HysFormItem, HysButton, HysSelect } from "hys-ui";
const data = reactive({ score: 0 }),
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
      :rules="{
        score: { type: 'number', min: 1, max: 5, message: '请至少给出一分' },
      }"
      @submit="message = '提交成功'"
      ><HysFormItem label="服务评分" prop="score"
        ><HysRating v-model="data.score" show-score name="score"
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
