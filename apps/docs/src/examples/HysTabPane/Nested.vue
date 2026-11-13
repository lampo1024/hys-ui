<script setup lang="ts">
import { ref } from "vue";
import { HysInput, HysTabPane, HysTabs, type HysTabValue } from "hys-ui";
const draft = ref(""),
  group = ref<HysTabValue>("account"),
  field = ref<HysTabValue>("profile");
</script>
<template>
  <div class="demo-panel">
    <HysTabs v-model="group" type="card" aria-label="设置分组">
      <template #panes>
        <HysTabPane value="account" label="账号设置">
          <HysTabs v-model="field" size="sm" aria-label="账号设置分类">
            <HysTabPane value="profile" label="资料">
              <label class="demo-field"
                >显示名称<HysInput
                  v-model="draft"
                  aria-label="显示名称"
                  placeholder="输入后切换页签"
              /></label>
            </HysTabPane>
            <HysTabPane value="permissions" label="权限" lazy
              >账号拥有项目查看权限。</HysTabPane
            >
          </HysTabs>
        </HysTabPane>
        <HysTabPane value="preferences" label="偏好" force-render
          >通知偏好跟随工作区设置。</HysTabPane
        >
      </template>
    </HysTabs>
  </div>
</template>
