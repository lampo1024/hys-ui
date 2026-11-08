<script setup lang="ts">
import { reactive, ref } from "vue";
import { HysButton, HysCheckbox, HysForm, HysFormItem, HysInput } from "hys-ui";
const shown = ref(true),
  model = reactive<{ retained?: string; temporary?: string }>({
    retained: "保留的资料",
    temporary: "临时资料",
  });
</script>
<template>
  <div class="demo-content">
    <HysCheckbox v-model="shown" label="显示条件字段" />
    <HysForm :model="model">
      <template v-if="shown"
        ><HysFormItem
          label="保留值"
          prop="retained"
          hint="默认 preserve=true，隐藏后保留数据"
          ><HysInput v-model="model.retained" /></HysFormItem
        ><HysFormItem
          label="临时值"
          prop="temporary"
          :preserve="false"
          hint="preserve=false，卸载字段时移除此值"
          ><HysInput v-model="model.temporary" /></HysFormItem
      ></template>
      <template #actions
        ><HysButton variant="secondary" type="reset"
          >恢复初始值</HysButton
        ></template
      >
    </HysForm>
    <output class="state-output">{{ JSON.stringify(model, null, 2) }}</output>
    <p class="scenario-note">
      条件字段卸载后清除反馈并取消正在进行的检查。隐藏字段不再参与整表校验，重新挂载后恢复规则注册。
    </p>
  </div>
</template>
