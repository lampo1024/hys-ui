<script setup lang="ts">
import { ref } from "vue";
import { HysButton, HysCard, HysDropdown } from "hys-ui";
const status = ref("待校对");
</script>
<template>
  <div class="demo-stack">
    <HysCard title="待审发票" style="max-width: 310px; overflow: hidden">
      <div class="demo-row" style="justify-content: space-between">
        <span role="status">{{ status }}</span>
        <HysDropdown label="审批结果" placement="bottom-end">
          <template #default="{ close }">
            <div class="approval-actions">
              <HysButton
                role="menuitem"
                variant="ghost"
                size="sm"
                @click="
                  status = '已通过';
                  close();
                "
                >通过</HysButton
              >
              <HysButton
                role="menuitem"
                variant="ghost"
                size="sm"
                @click="
                  status = '退回补充';
                  close();
                "
                >退回补充</HysButton
              >
            </div>
          </template>
        </HysDropdown>
      </div>
    </HysCard>
  </div>
</template>
<style scoped>
.approval-actions {
  min-width: 128px;
  display: grid;
}
</style>
