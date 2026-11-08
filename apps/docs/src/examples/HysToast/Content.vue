<script setup lang="ts">
import { ref } from 'vue'
import { BellRing } from 'lucide-vue-next'
import { HysButton, HysToast } from 'hys-ui'
const shown = ref(false), result = ref('')
</script>
<template><div><p class="demo-hint">通过内容、图标与操作插槽组合提示，键盘聚焦操作按钮时暂停计时。</p><div class="demo-content"><HysButton variant="secondary" @click="shown=true">自定义提示内容</HysButton><HysToast v-if="shown" :duration="8000" @close="shown=false"><template #icon><BellRing :size="18"/></template><span>有 <strong>3 条新消息</strong>等待查看。</span><template #action="{close}"><HysButton size="sm" variant="text" @click="result='已打开消息列表';close()">查看</HysButton></template></HysToast></div><pre class="state-output">{{result||'可通过插槽加入富文本与操作按钮。'}}</pre></div></template>
