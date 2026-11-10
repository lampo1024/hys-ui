<script setup lang="ts">
import { ref } from "vue";
import { HysDrawer, HysButton, HysCheckbox, HysSelect } from "hys-ui";
const open = ref(false),
  child = ref(false),
  push = ref(true),
  role = ref("member");
</script>
<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <HysCheckbox v-model="push" label="内层打开时推移外层" /><HysButton
        @click="open = true"
        >嵌套抽屉</HysButton
      >
    </div>
    <HysDrawer
      v-model:open="open"
      title="外层工作区"
      :width="680"
      :push="push ? { distance: 140 } : false"
      footer
      @close="child = false"
      ><HysButton @click="child = true">打开内层详情</HysButton
      ><HysDrawer v-model:open="child" title="内层详情" :width="420" footer
        ><div class="demo-stack">
          <HysSelect
            v-model="role"
            :options="[
              { label: '普通成员', value: 'member' },
              { label: '管理员', value: 'admin' },
            ]"
          />
          <p>
            菜单、内层抽屉和外层抽屉按层级处理
            Esc；内层关闭后外层平滑还原。关闭或离开外层页面会清理内层浮层。
          </p>
        </div></HysDrawer
      ></HysDrawer
    >
  </div>
</template>
