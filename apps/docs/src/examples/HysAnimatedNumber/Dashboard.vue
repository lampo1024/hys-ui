<script setup lang="ts">
import { computed, ref } from "vue";
import {
  HysAnimatedNumber,
  HysButton,
  HysCard,
  HysCheckbox,
  provideHysConfig,
  type HysTheme,
} from "hys-ui";

const theme = ref<HysTheme>("dark");
provideHysConfig({ theme });
const snapshot = ref(0);
const samples = [
  { name: "华东", visits: [35800, 38250, 41500] },
  { name: "华北", visits: [29100, 44000, 43200] },
  { name: "华南", visits: [22500, 31200, 47000] },
];
const ranking = computed(() =>
  samples
    .map(({ name, visits }) => ({ name, value: visits[snapshot.value] }))
    .sort((a, b) => b.value - a.value),
);
const total = computed(() =>
  ranking.value.reduce((sum, row) => sum + row.value, 0),
);
</script>

<template>
  <div class="demo-stack">
    <div class="demo-control-actions preview-controls">
      <HysButton size="sm" @click="snapshot = (snapshot + 1) % 3"
        >刷新访问量</HysButton
      >
      <HysCheckbox
        :model-value="theme === 'dark'"
        label="深色大屏"
        @update:model-value="theme = $event ? 'dark' : 'blue'"
      />
    </div>
    <div class="dashboard">
      <HysCard class="dashboard-card" title="访问总量">
        <HysAnimatedNumber
          :value="total"
          :duration="1200"
          effect="flip"
          appearance="display"
          :minimum-integer-digits="6"
          :stagger="65"
          :digit-duration="850"
          stable-width
          aria-label="访问总量"
        />
      </HysCard>
      <HysCard class="dashboard-card" title="区域访问排行">
        <TransitionGroup
          tag="ol"
          name="ranking"
          class="ranking"
          aria-label="区域访问排行"
        >
          <li v-for="row in ranking" :key="row.name">
            <span>{{ row.name }}</span>
            <HysAnimatedNumber
              :value="row.value"
              :duration="850"
              locale="zh-CN"
              effect="odometer"
              color-by-direction
              stable-width
            />
          </li>
        </TransitionGroup>
      </HysCard>
    </div>
  </div>
</template>

<style scoped>
.preview-controls {
  --hys-ui-text: var(--docs-text, #172744);
  --hys-ui-surface: var(--docs-surface, #fff);
  --hys-ui-border: var(--docs-border, #e6ebf4);
  --hys-ui-primary: #3168f5;
}
.dashboard {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(17rem, 100%), 1fr));
  gap: 12px;
}
.dashboard-card {
  min-inline-size: 0;
}
.ranking {
  display: grid;
  gap: 8px;
  margin: 0;
  padding-inline-start: 1.5em;
}
.ranking li {
  padding: 0.25rem 0;
}
.ranking li > span:last-child {
  float: inline-end;
}
.ranking-move {
  transition: transform 0.45s cubic-bezier(0.2, 0.75, 0.25, 1);
}
@media (prefers-reduced-motion: reduce) {
  .ranking-move {
    transition: none;
  }
}
</style>
