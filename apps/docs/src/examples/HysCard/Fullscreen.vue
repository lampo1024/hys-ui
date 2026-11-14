<script setup lang="ts">
import { ref } from "vue";
import { HysCard, HysCheckbox, HysInput } from "hys-ui";

const fullscreen = ref(false);
const transition = ref(true);
const note = ref("核对交付清单后更新发布状态。");
</script>

<template>
  <HysCard
    v-model:fullscreen="fullscreen"
    title="发布检查"
    subtitle="进入全屏可专注查看进度和编辑交付备注。"
    fullscreenable
    :fullscreen-transition="transition"
  >
    <div class="card-fullscreen-example">
      <HysCheckbox v-model="transition">全屏过渡动画</HysCheckbox>
      <HysInput v-model="note" label="交付备注" />
      <dl>
        <div><dt>需求验收</dt><dd>已完成</dd></div>
        <div><dt>交付材料</dt><dd>待核对</dd></div>
        <div><dt>上线窗口</dt><dd>周五 15:00</dd></div>
      </dl>
    </div>
    <template v-if="fullscreen" #footer>按 Esc 或点击右上角按钮退出全屏。</template>
  </HysCard>
</template>

<style scoped>
.card-fullscreen-example {
  display: grid;
  gap: 14px;
  max-inline-size: 36rem;
}
dl {
  display: grid;
  margin: 0;
  border-top: 1px solid var(--hys-ui-theme-border);
}
dl div {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 4px 12px;
  padding-block: 10px;
  border-bottom: 1px solid var(--hys-ui-theme-border);
}
dd { margin: 0; color: var(--hys-ui-theme-muted); }
</style>
