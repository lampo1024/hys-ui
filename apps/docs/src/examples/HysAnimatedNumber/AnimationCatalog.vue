<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import {
  HysAccordion,
  HysButton,
  HysCheckbox,
  HysNumberInput,
  HysSelect,
  HysTextarea,
  hysNumberAnimationCatalog,
  hysNumberAnimationCategories,
  parseHysNumberAnimation,
  stringifyHysNumberAnimation,
  type HysNumberAnimationConfig,
  type HysNumberAnimation,
  type HysNumberAnimationCategory,
} from "hys-ui";
import NumberAnimationSample from "../../components/NumberAnimationSample/NumberAnimationSample.vue";

const category = ref<HysNumberAnimationCategory | "all">("rolling");
const selected = ref<string>("drum-roll");
const duration = ref(1600);
const intensity = ref(1);
const cycles = ref(2);
const stagger = ref(0);
const seed = ref(37);
const easing = ref<"linear" | "ease-in" | "ease-out" | "ease-in-out">("linear");
const axis = ref<"vertical" | "horizontal">("vertical");
const mode = ref<"full" | "simplified" | "off">("full");
const combine = ref(false);
const override = ref(false);
const importedLayers = ref<readonly HysNumberAnimationConfig[]>();
const effectStrength = ref<number>();
const json = ref("");
const message = ref("");
const categories = [
  { value: "all", label: "全部效果" },
  ...hysNumberAnimationCategories.map(({ id, label }) => ({
    value: id,
    label,
  })),
];
const entries = computed(() =>
  hysNumberAnimationCatalog.filter(
    ({ category: id }) => category.value === "all" || id === category.value,
  ),
);
const choices = computed(() =>
  entries.value.map(({ name, label, english }) => ({
    value: name,
    label: english ? `${label} · ${english}` : label,
  })),
);
const entry = computed(() =>
  hysNumberAnimationCatalog.find(({ name }) => name === selected.value),
);
watch(category, () => {
  if (!entries.value.some(({ name }) => name === selected.value))
    selected.value = entries.value[0].name;
});
watch(selected, () => {
  importedLayers.value = undefined;
  effectStrength.value = undefined;
});
const config = computed<HysNumberAnimationConfig>(() => ({
  name: selected.value,
  cycles: cycles.value,
  stagger: stagger.value,
  seed: seed.value,
  axis: axis.value,
  strength: effectStrength.value,
}));
const animation = computed<HysNumberAnimation>(() =>
  importedLayers.value
    ? [config.value, ...importedLayers.value]
    : combine.value
      ? [config.value, { name: "highlight", strength: 0.5 }]
      : config.value,
);
const digitAnimations = computed(() =>
  override.value
    ? { "integer:0": { name: "cube-rotate", strength: 0.75 } }
    : undefined,
);

function exportConfig() {
  json.value = JSON.stringify(
    {
      animation: JSON.parse(stringifyHysNumberAnimation(animation.value)),
      duration: duration.value,
      intensity: intensity.value,
      easing: easing.value,
      mode: mode.value,
      perDigit: override.value,
    },
    null,
    2,
  );
  message.value = "配置已填入文本框";
}
async function importConfig() {
  try {
    const raw = JSON.parse(json.value);
    const document =
      raw && typeof raw === "object" && "animation" in raw ? raw : undefined;
    const items = parseHysNumberAnimation(
      document ? JSON.stringify(document.animation) : json.value,
    );
    const first = hysNumberAnimationCatalog.find(
      ({ name }) => name === items[0]?.name,
    );
    if (!first) throw Error("Unknown preset");
    category.value = first.category;
    selected.value = first.name;
    await nextTick();
    importedLayers.value = items.slice(1);
    effectStrength.value = items[0].strength;
    cycles.value = items[0].cycles ?? 2;
    stagger.value = items[0].stagger ?? 0;
    seed.value = items[0].seed ?? 37;
    axis.value = items[0].axis ?? "vertical";
    if (document) {
      if (Number.isFinite(document.duration))
        duration.value = Math.min(5000, Math.max(250, document.duration));
      if (Number.isFinite(document.intensity))
        intensity.value = Math.min(2, Math.max(0, document.intensity));
      if (
        ["linear", "ease-in", "ease-out", "ease-in-out"].includes(
          document.easing,
        )
      )
        easing.value = document.easing;
      if (["full", "simplified", "off"].includes(document.mode))
        mode.value = document.mode;
      override.value = document.perDigit === true;
    }
    message.value = "配置已应用";
  } catch {
    message.value = "请输入以目录效果开头的 JSON 配置";
  }
}
</script>

<template>
  <div class="demo-stack">
    <div class="demo-control-fields catalog-fields">
      <label class="demo-field">
        分类
        <HysSelect
          v-model="category"
          :options="categories"
          aria-label="动效分类"
        />
      </label>
      <label class="demo-field">
        动画效果
        <HysSelect
          v-model="selected"
          :options="choices"
          searchable
          aria-label="搜索或选择动画效果"
        />
      </label>
    </div>
    <NumberAnimationSample
      :entry="entry"
      :animation="animation"
      :duration="duration"
      :intensity="intensity"
      :mode="mode"
      :easing="easing"
      :digit-animations="digitAnimations"
    />
    <HysAccordion
      :items="[{ title: '播放与配置' }]"
      size="sm"
      :destroy-on-hide="false"
    >
      <template #content>
        <div class="catalog-settings demo-stack">
          <div class="demo-control-fields">
            <label class="demo-field"
              >时长（ms）<HysNumberInput
                v-model="duration"
                :min="250"
                :max="5000"
                :step="100"
            /></label>
            <label class="demo-field"
              >强度<HysNumberInput
                v-model="intensity"
                :min="0"
                :max="2"
                :step="0.1"
            /></label>
            <label class="demo-field"
              >圈数<HysNumberInput v-model="cycles" :min="1" :max="12"
            /></label>
            <label class="demo-field"
              >逐位交错<HysNumberInput
                v-model="stagger"
                :min="0"
                :max="0.9"
                :step="0.1"
            /></label>
            <label class="demo-field"
              >随机种子<HysNumberInput v-model="seed" :min="0" :max="9999"
            /></label>
            <label class="demo-field">
              方向
              <HysSelect
                v-model="axis"
                :options="[
                  { value: 'vertical', label: '纵向' },
                  { value: 'horizontal', label: '横向' },
                ]"
              />
            </label>
            <label class="demo-field">
              缓动
              <HysSelect
                v-model="easing"
                :options="[
                  { value: 'linear', label: '线性' },
                  { value: 'ease-in', label: '加速' },
                  { value: 'ease-out', label: '减速' },
                  { value: 'ease-in-out', label: '平滑' },
                ]"
              />
            </label>
            <label class="demo-field">
              动效模式
              <HysSelect
                v-model="mode"
                :options="[
                  { value: 'full', label: '完整效果' },
                  { value: 'simplified', label: '简化为计数' },
                  { value: 'off', label: '立即显示' },
                ]"
              />
            </label>
          </div>
          <div class="demo-control-actions">
            <HysCheckbox
              v-model="combine"
              label="组合高亮"
              @change="importedLayers = undefined"
            />
            <HysCheckbox v-model="override" label="个位使用立方体旋转" />
          </div>
          <HysTextarea v-model="json" label="动画 JSON" :rows="3" />
          <div class="demo-control-actions">
            <HysButton size="sm" variant="secondary" @click="importConfig"
              >导入配置</HysButton
            >
            <HysButton size="sm" variant="secondary" @click="exportConfig"
              >导出配置</HysButton
            >
            <small v-if="message" role="status">{{ message }}</small>
          </div>
        </div>
      </template>
    </HysAccordion>
  </div>
</template>

<style scoped>
.catalog-fields {
  grid-template-columns: repeat(auto-fit, minmax(min(15rem, 100%), 1fr));
}
.catalog-settings {
  padding: 14px;
}
</style>
