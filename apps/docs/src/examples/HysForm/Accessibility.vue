<script setup lang="ts">
import { reactive, ref } from "vue";
import { HysButton, HysForm, HysFormItem, HysInput } from "hys-ui";
const model = reactive({ name: "", first: "", last: "" }),
  message = ref("使用 Tab 在字段间移动，Enter 提交");
</script>
<template>
  <div class="demo-content">
    <HysForm
      :model="model"
      :rules="{ name: { required: true, message: '请填写姓名' } }"
      scroll-to-error
      @submit="message = '资料有效'"
      @invalid="message = '已聚焦首个错误字段'"
    >
      <HysFormItem
        label="姓名"
        prop="name"
        hint="此标签会自动关联唯一的输入框 ID"
        ><HysInput v-model="model.name" autocomplete="name"
      /></HysFormItem>
      <HysFormItem
        label="其他语言姓名"
        group
        extra="多个控件使用带名称的分组，各控件仍需自己的名称"
      >
        <div class="name-pair">
          <HysFormItem
            prop="first"
            no-style
            :rules="{ required: true, message: '请填写名' }"
            ><HysInput
              v-model="model.first"
              aria-label="名"
              placeholder="名" /></HysFormItem
          ><HysFormItem
            prop="last"
            no-style
            :rules="{ required: true, message: '请填写姓' }"
            ><HysInput v-model="model.last" aria-label="姓" placeholder="姓"
          /></HysFormItem>
        </div>
      </HysFormItem>
      <template #actions
        ><HysButton type="submit">验证资料</HysButton
        ><HysButton variant="secondary" type="reset"
          >重置资料</HysButton
        ></template
      >
    </HysForm>
    <output class="state-output" aria-live="polite">{{ message }}</output>
    <p class="scenario-note">
      字段通过 aria-invalid、aria-required 和 aria-describedby
      关联状态与说明。多个输入不会复用同一生成 ID；错误使用 alert
      播报，页面离开后取消未完成的校验。
    </p>
  </div>
</template>
<style scoped>
.name-pair {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
@media (max-width: 600px) {
  .name-pair {
    grid-template-columns: 1fr;
  }
}
</style>
