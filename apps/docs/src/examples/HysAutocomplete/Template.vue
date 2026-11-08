<script setup lang="ts">
import { ref } from "vue";
import { HysAutocomplete, HysAvatar, HysBadge } from "hys-ui";
const value = ref("");
const options = [
  {
    value: "alex@example.test",
    label: "Alex 陈",
    role: "产品设计",
    online: true,
  },
  {
    value: "lisa@example.test",
    label: "Lisa 林",
    role: "前端研发",
    online: false,
  },
  {
    value: "david@example.test",
    label: "David 周",
    role: "质量保障",
    online: true,
  },
];
</script>
<template>
  <div class="demo-content">
    <label class="autocomplete-demo-field"
      ><span>按姓名或邮箱选择成员</span
      ><HysAutocomplete
        v-model="value"
        :options="options"
        placeholder="输入 Alex 或 example"
        clearable
        ><template #default="{ item }"
          ><div
            v-if="typeof item !== 'string'"
            class="autocomplete-demo-person"
          >
            <HysAvatar :name="String(item.label)" :size="32" />
            <div>
              <strong>{{ item.label }}</strong
              ><small>{{ item.value }} · {{ item.role }}</small>
            </div>
            <HysBadge :tone="item.online ? 'green' : 'gray'">{{
              item.online ? "在线" : "离线"
            }}</HysBadge>
          </div></template
        ></HysAutocomplete
      ></label
    ><output>邮箱：{{ value || "未选择" }}</output>
    <p class="scenario-note">
      默认插槽接收原始 item、标准化 option、query 和 active。标签用于展示，value
      用于输入模型。
    </p>
  </div>
</template>
