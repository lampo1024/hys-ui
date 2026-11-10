<script setup lang="ts">
import { HysBreadcrumb } from "hys-ui";
</script>
<template>
  <div class="demo-content">
    <div class="demo-panel">
      <p>逐项分隔与不可用链接</p>
      <HysBreadcrumb
        :items="[
          { label: '首页', href: '#home' },
          {
            label: '不可用层级',
            href: '#blocked',
            disabled: true,
            separator: '>',
          },
          { label: '当前页面', separator: '·' },
        ]"
      />
    </div>
    <div class="demo-panel">
      <p>外部页面与单级路径</p>
      <HysBreadcrumb
        :items="[
          { label: 'Vue 文档', href: 'https://vuejs.org/', target: '_blank' },
          { label: '当前页面' },
        ]"
      /><HysBreadcrumb :items="[{ label: '唯一层级' }]" />
    </div>
    <div class="demo-panel">
      <p>空路径</p>
      <HysBreadcrumb :items="[]" />
    </div>
    <p class="scenario-note">
      末项显示当前页面语义，不产生跳转链接；禁用项保持为文本。新窗口链接自动补充
      noopener noreferrer，可为每项配置 separator 与 showSeparator。
    </p>
  </div>
</template>
