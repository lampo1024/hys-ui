<script setup lang="ts">
import { ref, computed } from "vue";
import {
  HysTimeline,
  HysSelect,
  HysCheckbox,
  type HysTimelineItem,
} from "hys-ui";
import { Clock3 } from "lucide-vue-next";
const state = ref("loading"),
  reverse = ref(false),
  position = ref<"start" | "end">("end"),
  custom = ref(false),
  pending = computed(() =>
    state.value === "none"
      ? false
      : state.value === "text"
        ? "等待后续记录"
        : true,
  );
const items: HysTimelineItem[] = [
  { id: 0, title: "记录已创建", time: "10:00", status: "done" },
  {
    id: 1,
    title: "正在检查",
    time: "10:30",
    status: "current",
    description: "核对内容并确认操作。",
  },
  { id: 2, title: "等待下一步", time: "11:00", status: "pending" },
];
</script>
<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <label class="demo-field"
        >后续状态<HysSelect
          v-model="state"
          :options="[
            { label: '无后续节点', value: 'none' },
            { label: '文字节点', value: 'text' },
            { label: '加载节点', value: 'loading' },
          ]" /></label
      ><label class="demo-field"
        >后续节点位置<HysSelect
          v-model="position"
          :options="
            ['start', 'end'].map((value) => ({ label: value, value }))
          " /></label
      ><HysCheckbox v-model="reverse" label="反转记录" /><HysCheckbox
        v-model="custom"
        label="自定义后续节点"
      />
    </div>
    <HysTimeline
      :items="items"
      :pending="pending"
      :reverse="reverse"
      :pending-position="position"
      aria-label="后续记录时间线"
      ><template v-if="custom" #pending>正在等待新的操作记录</template
      ><template v-if="custom" #pending-dot><Clock3 :size="18" /></template
    ></HysTimeline>
    <p class="scenario-note">
      原有 pending 文字保持在末尾，不随 reverse 改变位置。pending=true
      使用加载节点，也可通过 pendingPosition 显式放到开头。
    </p>
  </div>
</template>
