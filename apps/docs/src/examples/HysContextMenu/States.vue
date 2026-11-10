<script setup lang="ts">
import { ref } from "vue";
import { HysContextMenu, HysButton, HysCheckbox } from "hys-ui";
const loading = ref(false),
  empty = ref(false);
</script>
<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <HysCheckbox v-model="loading" label="加载中" /><HysCheckbox
        v-model="empty"
        label="空菜单"
      />
    </div>
    <div class="demo-content">
      <HysContextMenu
        trigger="click"
        :loading="loading"
        :items="
          empty
            ? []
            : [
                { label: '正常操作', value: 'open' },
                { label: '已禁用', value: 'locked', disabled: true },
              ]
        "
        ><HysButton>查看状态</HysButton
        ><template #empty>当前没有可用操作</template></HysContextMenu
      >
    </div>
    <p class="scenario-note">
      加载时保留浮层并阻止条目操作。数据更新后，已移除或禁用条目的焦点自动移到可用位置。页面离开、父弹窗关闭和禁用会清理浮层、计时器与观察器。
    </p>
  </div>
</template>
