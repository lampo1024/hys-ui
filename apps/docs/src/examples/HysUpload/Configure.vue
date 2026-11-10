<script setup lang="ts">
import { reactive, ref } from "vue";
import {
  HysUpload,
  HysCheckbox,
  HysSelect,
  HysNumberInput,
  type HysUploadListType,
  type HysUploadFile,
} from "hys-ui";
const files = ref<HysUploadFile[]>([]);
const config = reactive({
  disabled: false,
  readonly: false,
  loading: false,
  drag: true,
  paste: false,
  showFileList: true,
  showToolbar: true,
  listType: "text" as HysUploadListType,
  size: "md" as "sm" | "md" | "lg",
  limit: 5,
  listHeight: 240,
});
const toggles = [
  "disabled",
  "readonly",
  "loading",
  "drag",
  "paste",
  "showFileList",
  "showToolbar",
] as const;
</script>
<template>
  <div class="demo-stack">
    <div class="demo-controls">
      <section class="demo-control-section">
        <h3>外观与数量</h3>
        <div class="demo-control-fields">
          <label class="demo-control-field"
            ><span>列表样式</span
            ><HysSelect
              v-model="config.listType"
              :options="
                ['text', 'picture', 'picture-card'].map((value) => ({
                  label: value,
                  value,
                }))
              " /></label
          ><label class="demo-control-field"
            ><span>控件尺寸</span
            ><HysSelect
              v-model="config.size"
              :options="
                ['sm', 'md', 'lg'].map((value) => ({ label: value, value }))
              " /></label
          ><label class="demo-control-field"
            ><span>文件上限</span
            ><HysNumberInput v-model="config.limit" :min="1" :max="20" /></label
          ><label class="demo-control-field"
            ><span>列表最大高度</span
            ><HysNumberInput
              v-model="config.listHeight"
              :min="120"
              :max="600"
              :step="40"
          /></label>
        </div>
      </section>
      <section class="demo-control-section">
        <h3>状态与行为</h3>
        <div class="demo-control-toggles">
          <div v-for="key in toggles" :key="key" class="demo-control-toggle">
            <HysCheckbox v-model="config[key]" :label="key" />
          </div>
        </div>
      </section>
    </div>
    <HysUpload v-model:file-list="files" v-bind="config" /><output
      class="state-output"
      >文件 {{ files.length }} 项 · {{ config.listType }} ·
      {{ config.size }}</output
    >
  </div>
</template>
