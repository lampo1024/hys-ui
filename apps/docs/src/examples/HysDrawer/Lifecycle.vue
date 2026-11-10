<script setup lang="ts">
import { ref } from "vue";
import { HysButton, HysCheckbox, HysInput, HysDrawer } from "hys-ui";
const open = ref(false),
  destroy = ref(false),
  force = ref(false),
  events = ref<string[]>([]);
function record(value: string) {
  events.value = [...events.value.slice(-7), value];
}
</script>
<template>
  <div class="demo-content">
    <HysCheckbox v-model="destroy" label="关闭销毁内容" /><HysCheckbox
      v-model="force"
      label="提前挂载内容"
    /><HysButton @click="open = true">查看挂载与生命周期</HysButton>
  </div>
  <p class="state-output">{{ events.join(" → ") || "等待打开" }}</p>
  <HysDrawer
    v-model:open="open"
    title="挂载策略"
    footer
    :destroy-on-close="destroy"
    :force-render="force"
    @open="record('开始打开')"
    @opened="record('打开完成')"
    @close="record('请求关闭')"
    @closed="record('关闭完成')"
  >
    <HysInput default-value="可修改的内部状态" label="再次打开检查内容" />
    <p>
      保留内容时输入状态延续；销毁后重新挂载恢复初始值。提前挂载适合预先获取表单引用。
    </p>
  </HysDrawer>
</template>
