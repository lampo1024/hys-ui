<script setup lang="ts">
import { HysAlert } from "hys-ui";
</script>
<template>
  <div class="demo-stack">
    <HysAlert
      title="操作已完成"
      tone="success"
      description="内容已保存，可继续进行下一步。"
      closable
      show-icon
    /><HysAlert title="请补充必要信息" tone="warning" show-icon
      >提交前请检查尚未填写的字段。</HysAlert
    ><HysAlert title="连接暂时不可用" tone="danger" show-icon
      >稍后重试，当前填写内容已保留。</HysAlert
    ><HysAlert
      title="信息提示"
      description="提示会保留在页面中，直到主动关闭。"
      show-icon
    />
  </div>
</template>
