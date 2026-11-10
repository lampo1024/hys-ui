<script setup lang="ts">
import { ref } from "vue";
import { HysDrawer, HysButton, HysNumberInput, HysCheckbox } from "hys-ui";
const open = ref(false),
  opacity = ref(0.9),
  maskOpacity = ref(0.3),
  modal = ref(true),
  penetrable = ref(false),
  count = ref(0);
</script>
<template>
  <div class="demo-stack">
    <div class="demo-controls">
      <div class="demo-control-fields">
        <label class="demo-field"
          ><span>背景透明度</span
          ><HysNumberInput
            v-model="opacity"
            :min="0"
            :max="1"
            :step="0.05" /></label
        ><label class="demo-field"
          ><span>遮罩透明度</span
          ><HysNumberInput v-model="maskOpacity" :min="0" :max="1" :step="0.05"
        /></label>
      </div>
      <div class="demo-control-actions">
        <HysCheckbox v-model="modal" label="显示遮罩" /><HysCheckbox
          v-model="penetrable"
          label="无蒙层时允许背景交互"
        />
      </div>
    </div>
    <div class="demo-control-actions">
      <HysButton @click="open = true">背景与透明度</HysButton
      ><HysButton variant="secondary" @click="count++"
        >背景操作 {{ count }}</HysButton
      >
    </div>
    <HysDrawer
      v-model:open="open"
      title="透明工作区"
      :opacity="opacity"
      :mask-opacity="maskOpacity"
      :modal="modal"
      :modal-penetrable="penetrable"
      footer
      ><p>
        透明度只影响背景，不会降低文字、控件或操作按钮的不透明度。无蒙层且允许穿透时，默认不锁定滚动、不限制焦点。
      </p></HysDrawer
    >
  </div>
</template>
