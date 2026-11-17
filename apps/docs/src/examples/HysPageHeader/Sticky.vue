<script setup lang="ts">
import { ref } from "vue";
import { HysAvatar, HysButton, HysPageHeader, HysScrollbar } from "hys-ui";
const sticky = ref(true);
const checkpoints = [
  "核对发布版本",
  "准备灰度名单",
  "通知值班负责人",
  "验证回滚脚本",
  "同步部署状态",
  "检查指标报表",
  "记录交付时间",
  "复核变更清单",
  "关闭临时权限",
];
</script>
<template>
  <div class="demo-stack">
    <HysButton variant="secondary" size="sm" @click="sticky = !sticky">{{
      sticky ? "取消吸顶" : "启用吸顶"
    }}</HysButton>
    <HysScrollbar :height="240" direction="vertical">
      <section class="demo-checkpoints">
        <HysPageHeader
          title="上线检查"
          :heading-level="3"
          :sticky="sticky"
          compact
        >
          <template #leading><HysAvatar :size="32" name="值班" /></template>
          <template #meta>值班团队 · 部署窗口 15:00—16:00</template>
        </HysPageHeader>
        <ol>
          <li v-for="step in checkpoints" :key="step">{{ step }}</li>
        </ol>
      </section>
    </HysScrollbar>
  </div>
</template>
<style scoped>
.demo-checkpoints {
  padding: 0 8px;
}
.demo-checkpoints li {
  padding-block: 8px;
}
</style>
