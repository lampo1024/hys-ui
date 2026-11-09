<script setup lang="ts">
import { ref } from "vue";
import { HysCard, HysButton, HysAvatar, HysBadge } from "hys-ui";
import { Layers, Star, Share2 } from "lucide-vue-next";
const saved = ref(false),
  message = ref("");
</script>
<template>
  <div class="card-content-grid">
    <HysCard
      title="设计资源"
      subtitle="团队共享资源与更新记录"
      footer="最近更新于今天"
      :body-style="{ padding: '20px' }"
    >
      <template #cover
        ><div class="resource-cover">
          <Layers :size="40" /><span>Design resources</span>
        </div></template
      >
      <template #action><HysBadge tone="green">已发布</HysBadge></template>
      <div class="demo-row">
        <HysAvatar name="林" />
        <p>组件、图标与使用指南，帮助团队保持一致的交付体验。</p>
      </div>
      <template #actions
        ><HysButton variant="ghost" size="sm" @click="saved = !saved"
          ><Star :size="15" />{{ saved ? "已收藏" : "收藏" }}</HysButton
        ><HysButton
          variant="ghost"
          size="sm"
          @click="message = '分享链接已准备好'"
          ><Share2 :size="15" />分享</HysButton
        ></template
      >
    </HysCard>
    <HysCard
      title="内容分区"
      type="inner"
      body-class="resource-body"
      :header-style="{ padding: '16px' }"
      :footer-style="{ textAlign: 'right' }"
    >
      <p>
        headerStyle、bodyStyle 和 footerStyle
        可分别设置区域样式，插槽可以替换各区域的内容。
      </p>
      <template #footer
        ><HysButton size="sm" @click="message = '已保存设置'"
          >保存设置</HysButton
        ></template
      >
    </HysCard>
  </div>
  <output v-if="message" aria-live="polite">{{ message }}</output>
</template>
<style scoped>
.card-content-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
  gap: 22px;
  align-items: start;
}
.resource-cover {
  height: 160px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: linear-gradient(
    135deg,
    var(--hys-ui-primary-soft, var(--hys-ui-theme-primary-soft)),
    var(--hys-ui-surface, var(--hys-ui-theme-surface))
  );
  color: var(--hys-ui-primary, var(--hys-ui-theme-primary));
  font-weight: 600;
}
.demo-row p {
  flex: 1;
  min-width: 150px;
  line-height: 1.8;
}
</style>
