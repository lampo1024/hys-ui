<script setup lang="ts">
import { ref } from "vue";
import { HysColorTokenEditor } from "hys-ui";
const colors = ref({ primary: "#7854ce", accent: "#1b8a63" });
const defaults = { primary: "#3674e9", accent: "#1b8a63" };
const labels = { primary: "品牌主色", accent: "成功状态色" };
</script>
<template>
  <div class="demo-stack">
    <HysColorTokenEditor
      v-model="colors"
      :defaults="defaults"
      :labels="labels"
      :locked-keys="['accent']"
    />
    <output class="state-output"
      ><span
        class="brand-preview"
        :style="{ backgroundColor: colors.primary }"
      />品牌主色 {{ colors.primary }}</output
    >
  </div>
</template>
<style scoped>
.brand-preview {
  display: inline-block;
  width: 12px;
  height: 12px;
  margin-inline-end: 6px;
  border-radius: 3px;
  vertical-align: middle;
}
.state-output {
  margin: 0;
}
</style>
