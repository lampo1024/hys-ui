<script setup lang="ts">
import { computed, ref, watch } from "vue";
import {
  HysTransfer,
  HysSelect,
  HysNumberInput,
  HysCheckbox,
  HysButton,
  type HysTransferInstance,
} from "hys-ui";
type Resource = { value: number; label: string };
const api = ref<HysTransferInstance<Resource, number>>(),
  value = ref<number[]>([]),
  checked = ref<number[]>([0, 1, 2]),
  effect = ref<"flight" | "fade" | "none">("flight"),
  duration = ref(400),
  limit = ref(6),
  highlight = ref(true),
  large = ref(false),
  message = ref("");
const small = Array.from({ length: 18 }, (_, i) => ({
    value: i,
    label: "交付资源 " + String(i + 1).padStart(2, "0"),
  })),
  big = Array.from({ length: 10000 }, (_, i) => ({
    value: i,
    label: "数据资源 " + String(i + 1).padStart(5, "0"),
  })),
  options = computed(() => (large.value ? big : small));
const effects = [
  { label: "跨区域飞入", value: "flight" },
  { label: "目标位置淡入", value: "fade" },
  { label: "关闭动效", value: "none" },
];
watch(large, () => {
  value.value = [];
  checked.value = [0, 1, 2];
  message.value = "";
});
async function all() {
  await api.value?.checkAll("left", true, "all");
  await api.value?.move("right");
}
function reset() {
  value.value = [];
  checked.value = [0, 1, 2];
  message.value = "";
}
</script>
<template>
  <div class="demo-stack">
    <div class="demo-controls">
      <section class="demo-control-section">
        <h3>移动动效</h3>
        <div class="demo-control-fields">
          <label class="demo-field"
            ><span>效果</span
            ><HysSelect
              v-model="effect"
              :options="effects"
              aria-label="移动动效" /></label
          ><label class="demo-field"
            ><span>时长（毫秒）</span
            ><HysNumberInput
              v-model="duration"
              :min="0"
              :max="1500"
              :step="100"
              aria-label="移动时长" /></label
          ><label class="demo-field"
            ><span>最多动画项目</span
            ><HysNumberInput
              v-model="limit"
              :min="0"
              :max="12"
              aria-label="最多动画项目"
          /></label>
        </div>
      </section>
      <section class="demo-control-section">
        <div class="demo-row">
          <HysCheckbox v-model="highlight" label="落地高亮" /><HysCheckbox
            v-model="large"
            label="大数据虚拟列表"
          />
        </div>
      </section>
    </div>
    <div class="demo-control-actions">
      <HysButton variant="secondary" @click="all">整批移入目标</HysButton
      ><HysButton variant="ghost" @click="reset">重置演示</HysButton>
    </div>
    <HysTransfer
      ref="api"
      v-model="value"
      v-model:checked-keys="checked"
      :options="options"
      :virtual="large"
      :move-animation="effect"
      :move-duration="duration"
      :max-animated-items="limit"
      :highlight-on-arrival="highlight"
      :list-height="260"
      :filterable="false"
      @change="
        (_, side, keys) =>
          (message =
            (side === 'right' ? '移入' : '移回') + ' ' + keys.length + ' 项')
      "
    />
    <output class="state-output"
      >{{ message || "已勾选前三项，可点击中间按钮或拖动任一勾选项到另一侧" }} ·
      目标列表 {{ value.length }} 项</output
    >
    <p class="scenario-note">
      项目从原位置飞向目标，落地后柔和高亮。大数据模式只渲染可见行，每批最多绘制设定数量的代表项目，其余合并为数量提示。不会为每个项目创建飞行节点，也不会逐帧计算布局。
    </p>
  </div>
</template>
