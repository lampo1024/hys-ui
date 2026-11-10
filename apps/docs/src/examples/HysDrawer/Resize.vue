<script setup lang="ts">
import { ref } from "vue";
import {
  HysDrawer,
  HysButton,
  HysSelect,
  HysCheckbox,
  type HysDrawerPlacement,
  type HysDrawerInstance,
} from "hys-ui";
const open = ref(false),
  placement = ref<HysDrawerPlacement>("right"),
  controlled = ref(false),
  allow = ref(true),
  value = ref<number | null>(null),
  drawer = ref<HysDrawerInstance>(),
  result = ref("尚未调整"),
  placements = ["left", "right", "top", "bottom"].map((value) => ({
    label: value,
    value,
  }));
function update(next: number | null) {
  if (allow.value) value.value = next;
}
</script>
<template>
  <div class="demo-stack">
    <div class="demo-controls">
      <div class="demo-control-fields">
        <label class="demo-field"
          ><span>缩放方向</span
          ><HysSelect v-model="placement" :options="placements"
        /></label>
      </div>
      <div class="demo-control-actions">
        <HysCheckbox v-model="controlled" label="受控尺寸" /><HysCheckbox
          v-model="allow"
          label="接受尺寸更新"
        />
      </div>
    </div>
    <div class="demo-control-actions">
      <HysButton @click="open = true">拖动边缘调整尺寸</HysButton>
    </div>
    <output class="state-output"
      >{{ result }} · 受控值 {{ value ?? "跟随参数" }}</output
    ><HysDrawer
      ref="drawer"
      v-model:open="open"
      title="可调整的工作区"
      :placement="placement"
      :resizable="{ minSize: 240, maxSize: '85%', step: 10 }"
      :resize-value="controlled ? value : undefined"
      footer
      @update:resize-value="update"
      @resize-end="
        (size, info) =>
          (result =
            Math.round(size) +
            'px · ' +
            (info.cancelled
              ? '已撤销'
              : info.accepted
                ? '已接受'
                : '宿主未接受'))
      "
      ><div class="demo-stack">
        <p>
          拖动靠近页面中心的一侧边缘。方向键每次调整 10px，Shift 加速，Home /
          End 到达限制；双击边缘还原。
        </p>
        <div class="demo-control-actions">
          <HysButton size="sm" @click="drawer?.resizeTo('65%')"
            >调整到 65%</HysButton
          ><HysButton size="sm" @click="drawer?.resetSize()"
            >还原尺寸</HysButton
          >
        </div>
        <p>
          按 Esc 先撤销本次缩放；再次按 Esc
          才关闭抽屉。取消“接受尺寸更新”可验证受控拒绝时的回退。
        </p>
      </div></HysDrawer
    >
    <p class="scenario-note">
      指针移动按帧合并，只在开始时测量边界；update:resizeValue
      在释放时提交一次。resize 提供按帧的预览尺寸，resizeEnd
      返回取消和接受结果。
    </p>
  </div>
</template>
