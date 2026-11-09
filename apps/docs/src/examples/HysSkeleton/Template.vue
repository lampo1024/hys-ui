<script setup lang="ts">
import { ref } from "vue";
import { HysSkeleton, HysCheckbox, HysAvatar } from "hys-ui";
const loading = ref(true);
</script>
<template>
  <div class="demo-stack">
    <HysCheckbox v-model="loading" label="加载中" /><HysSkeleton
      :loading="loading"
      :count="2"
      ><template #template="{ index }"
        ><div class="member-placeholder">
          <HysSkeleton variant="circle" :width="46" :height="46" />
          <div class="member-text">
            <HysSkeleton
              variant="text"
              :width="index === 0 ? '45%' : '60%'"
            /><HysSkeleton variant="text" width="85%" />
          </div></div
      ></template>
      <div class="member-placeholder">
        <HysAvatar name="林" />
        <div>
          林工
          <p class="hint">成员信息已加载</p>
        </div>
      </div></HysSkeleton
    >
  </div>
</template>
<style scoped>
.member-placeholder {
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 70px;
}
.member-text {
  flex: 1;
  min-width: 0;
  display: grid;
  gap: 12px;
}
</style>
