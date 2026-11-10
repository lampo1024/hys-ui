<script setup lang="ts">
import { ref } from "vue";
import { HysAlert, HysButton } from "hys-ui";
import { Bell, Check } from "lucide-vue-next";
const result = ref("等待操作");
</script>
<template>
  <div class="demo-stack">
    <HysAlert show-icon closable tone="primary"
      ><template #icon><Bell :size="22" /></template
      ><template #title>有一条新的协作消息</template
      ><template #description
        >正文可放置说明或链接，操作区独立布局，窄容器中会换行。</template
      ><template #action="{ close, closing }"
        ><HysButton size="sm" :disabled="closing" @click="result = '已查看消息'"
          >查看</HysButton
        ><HysButton size="sm" variant="ghost" :disabled="closing" @click="close"
          >忽略</HysButton
        ></template
      ><template #close-icon
        ><Check :size="16" aria-hidden="true" /></template></HysAlert
    ><HysAlert
      title="自定义关闭文字"
      description="关闭入口仍可通过键盘操作。"
      closable
      close-text="知道了"
    /><output class="state-output">{{ result }}</output>
  </div>
</template>
