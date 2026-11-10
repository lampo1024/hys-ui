<script setup lang="ts">
import { reactive } from "vue";
import {
  HysEmpty,
  HysInput,
  HysSelect,
  HysNumberInput,
  HysCheckbox,
  type HysEmptyIllustration,
} from "hys-ui";
const config = reactive({
  title: "暂无内容",
  description: "试试调整条件，或创建一条新记录。",
  illustration: "inbox" as HysEmptyIllustration,
  size: "md" as "sm" | "md" | "lg",
  imageSize: 72,
  showTitle: true,
  showDescription: true,
  showImage: true,
});
</script>
<template>
  <div class="demo-stack">
    <div class="demo-controls">
      <section class="demo-control-section">
        <h3>内容与外观</h3>
        <div class="demo-control-fields">
          <label class="demo-field"
            >标题<HysInput v-model="config.title" /></label
          ><label class="demo-field"
            >说明<HysInput v-model="config.description" /></label
          ><label class="demo-field"
            >插图<HysSelect
              v-model="config.illustration"
              :options="
                ['inbox', 'simple', 'default'].map((value) => ({
                  label: value,
                  value,
                }))
              " /></label
          ><label class="demo-field"
            >尺寸<HysSelect
              v-model="config.size"
              :options="
                ['sm', 'md', 'lg'].map((value) => ({ label: value, value }))
              " /></label
          ><label class="demo-field"
            >图片尺寸<HysNumberInput
              v-model="config.imageSize"
              :min="0"
              :max="200"
              :step="8"
          /></label>
        </div>
      </section>
      <section class="demo-control-section">
        <h3>显示区域</h3>
        <div class="demo-control-toggles">
          <div class="demo-control-toggle">
            <HysCheckbox v-model="config.showTitle" label="显示标题" />
          </div>
          <div class="demo-control-toggle">
            <HysCheckbox v-model="config.showDescription" label="显示说明" />
          </div>
          <div class="demo-control-toggle">
            <HysCheckbox v-model="config.showImage" label="显示图片" />
          </div>
        </div>
      </section>
    </div>
    <HysEmpty
      :title="config.showTitle ? config.title : false"
      :description="config.showDescription ? config.description : false"
      :image="config.showImage ? undefined : false"
      :illustration="config.illustration"
      :size="config.size"
      :image-size="config.imageSize"
    />
  </div>
</template>
