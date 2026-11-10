<script setup lang="ts">
import { ref } from "vue";
import { ArrowLeft, Check } from "lucide-vue-next";
import { HysDrawer, HysButton, HysBadge } from "hys-ui";
const open = ref(false),
  saved = ref(false);
</script>
<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <HysButton @click="open = true">定制标题和操作</HysButton>
    </div>
    <HysDrawer
      v-model:open="open"
      title="自定义工作区"
      header-size="sm"
      :show-close="false"
      ><template #header="{ titleId, close }"
        ><div class="custom-drawer-title">
          <HysButton
            size="sm"
            variant="ghost"
            aria-label="返回"
            @click="close()"
            ><ArrowLeft :size="16"
          /></HysButton>
          <h3 :id="titleId">自定义工作区</h3>
        </div></template
      ><template #extra
        ><HysBadge :value="saved ? '已保存' : '草稿'"
      /></template>
      <p>
        header 和 extra 分别管理标题与右侧操作；自定义标题通过 titleId
        保留可访问名称。
      </p>
      <template #footer="{ confirm, cancel, busy }"
        ><HysButton :disabled="busy" variant="secondary" @click="cancel()"
          >返回列表</HysButton
        ><HysButton
          :disabled="busy"
          @click="
            saved = true;
            confirm();
          "
          ><Check :size="16" />保存并返回</HysButton
        ></template
      ></HysDrawer
    >
  </div>
</template>
<style scoped>
.custom-drawer-title {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.custom-drawer-title h3 {
  margin: 0;
  font-size: 16px;
}
</style>
