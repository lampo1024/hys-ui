<script setup lang="ts">
import { ref } from "vue";
import { HysButton, HysSpin } from "hys-ui";
const visible = ref(true);
</script>

<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <HysButton @click="visible = !visible">{{
        visible ? "停止加载" : "开始加载"
      }}</HysButton>
      <span class="hint"
        >切换后，行内指示器、块级状态和局部覆盖层会同步更新。</span
      >
    </div>
    <div class="spin-basic-grid">
      <div class="demo-panel">
        <span class="hint">行内</span>
        <div class="demo-row">
          <span>同步项目</span
          ><HysSpin
            :spinning="visible"
            mode="inline"
            size="sm"
            aria-label="正在同步项目"
          />
        </div>
      </div>
      <div class="demo-panel">
        <span class="hint">块级</span
        ><HysSpin
          :spinning="visible"
          mode="block"
          message="正在查询"
          region-height="72px"
        />
      </div>
      <div class="demo-panel">
        <span class="hint">容器</span
        ><HysSpin
          :spinning="visible"
          region-height="72px"
          message="正在载入权限"
        >
          <p>成员 · 编辑权限</p>
          <small>最近同步于 10:30</small>
        </HysSpin>
      </div>
    </div>
  </div>
</template>

<style scoped>
.spin-basic-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 180px), 1fr));
  gap: 10px;
}
.spin-basic-grid :deep(.demo-panel) {
  display: grid;
  align-content: start;
  gap: 8px;
}
.spin-basic-grid p {
  margin: 7px 0 3px;
}
</style>
