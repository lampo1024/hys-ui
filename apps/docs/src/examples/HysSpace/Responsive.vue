<script setup lang="ts">
import { ref } from "vue";
import { HysButton, HysCheckbox, HysSelect, HysSpace } from "hys-ui";
const narrow = ref(true),
  fill = ref(false);
const justify = ref<"start" | "center" | "between">("start");
const active = ref("全部");
const views = ["全部", "待审核", "已发布", "已归档"];
</script>

<template>
  <div class="demo-stack">
    <div class="demo-controls">
      <div class="demo-control-fields">
        <label class="demo-field"
          >主轴分布
          <HysSelect
            v-model="justify"
            :disabled="fill"
            aria-label="主轴分布"
            :options="[
              { label: '起始对齐', value: 'start' },
              { label: '居中', value: 'center' },
              { label: '两端对齐', value: 'between' },
            ]"
          />
        </label>
      </div>
      <div class="demo-control-actions">
        <HysCheckbox v-model="narrow" label="模拟窄容器" />
        <HysCheckbox v-model="fill" label="操作项伸展" />
      </div>
    </div>
    <div class="demo-panel report-actions-preview" :class="{ narrow }">
      <HysSpace
        :size="[12, 8]"
        :justify="justify"
        :fill="fill"
        :fill-ratio="40"
        block
        wrap
      >
        <HysButton
          v-for="view in views"
          :key="view"
          :block="fill"
          :variant="active === view ? 'primary' : 'secondary'"
          :aria-pressed="active === view"
          @click="active = view"
          >{{ view }}</HysButton
        >
      </HysSpace>
    </div>
    <output class="state-output" aria-live="polite"
      >当前视图 · {{ active }}</output
    >
  </div>
</template>

<style scoped>
.report-actions-preview {
  box-sizing: border-box;
  inline-size: 100%;
}
.report-actions-preview.narrow {
  inline-size: min(100%, 300px);
}
</style>
