<script setup lang="ts">
import { reactive, ref } from "vue";
import {
  HysButton,
  HysForm,
  HysFormItem,
  HysTimePicker,
  type HysFormRules,
} from "hys-ui";
const model = reactive({ time: null as string | null });
const result = ref("");
const rules: HysFormRules = {
  time: { required: true, message: "请选择到货时间" },
};
</script>
<template>
  <div class="demo-stack">
    <HysForm
      :model="model"
      :rules="rules"
      @submit="result = '已预约 ' + model.time"
      @invalid="result = '请检查到货时间'"
      @reset="result = ''"
    >
      <HysFormItem prop="time" label="到货时间">
        <HysTimePicker
          v-model="model.time"
          min-time="09:00"
          max-time="17:30"
          :minute-step="30"
        />
      </HysFormItem>
      <template #actions>
        <HysButton type="submit">提交预约</HysButton>
        <HysButton type="reset" variant="secondary">重置</HysButton>
      </template>
    </HysForm>
    <span role="status">{{ result }}</span>
  </div>
</template>
