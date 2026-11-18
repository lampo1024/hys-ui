<script setup lang="ts">
import { ref } from "vue";
import { HysButton, HysCheckbox, HysFormItem, HysStepForm } from "hys-ui";
const model = ref({ ready: true });
const busy = ref(false);
const note = ref("");
</script>

<template>
  <div class="demo-stack">
    <HysStepForm :steps="['确认发布']" :model="model" :loading="busy" @finish="busy = true; note = '已交给发布系统'" @cancel="note = '已取消'">
      <HysFormItem label="发布检查" prop="ready"><HysCheckbox v-model="model.ready">材料已核对</HysCheckbox></HysFormItem>
      <template #actions="{ next, cancel }">
        <div class="demo-row"><HysButton variant="ghost" :disabled="busy" @click="cancel">取消申请</HysButton><HysButton :disabled="!model.ready" :loading="busy" @click="next">发起申请</HysButton><HysButton v-if="busy" variant="secondary" @click="busy = false">结束演示</HysButton></div>
      </template>
    </HysStepForm>
    <p v-if="note" aria-live="polite">{{ note }}</p>
  </div>
</template>
