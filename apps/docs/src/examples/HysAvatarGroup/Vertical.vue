<script setup lang="ts">
import { HysAvatarGroup, type HysAvatarOption } from "hys-ui";
const members: HysAvatarOption[] = [
  { name: "Alex" },
  { name: "Lisa" },
  { name: "Amy" },
  { name: "David" },
];
</script>
<template>
  <div class="demo-content">
    <div class="arrangement-grid">
      <div class="arrangement-field">
        <span>竖向重叠</span
        ><HysAvatarGroup
          :options="members"
          vertical
          :size="40"
          :gap="-8"
          expand-on-hover
          aria-label="竖向重叠团队"
        />
      </div>
      <div class="arrangement-field">
        <span>正间距横向</span
        ><HysAvatarGroup
          :options="members"
          :size="40"
          :gap="12"
          aria-label="间隔排列团队"
        />
      </div>
    </div>
    <p class="scenario-note">
      竖向与横向都支持正负间距。expandOnHover
      在悬停或键盘焦点进入时展开重叠间距。
    </p>
  </div>
</template>

<style scoped>
.arrangement-grid {
  display: grid;
  grid-template-columns: 180px minmax(0, 1fr);
  gap: 24px;
}
.arrangement-field {
  display: grid;
  justify-items: start;
  align-content: start;
  gap: 16px;
  min-width: 0;
}
.arrangement-field > span {
  font-size: 12px;
  color: var(--docs-muted);
}
@media (max-width: 600px) {
  .arrangement-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
