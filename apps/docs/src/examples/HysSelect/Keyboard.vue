<script setup lang="ts">
import { ref } from 'vue'
import { HysSelect } from 'hys-ui'
const value=ref(''),last=ref('尚未操作')
const options=[{value:'blocked',label:'禁用项（键盘会跳过）',disabled:true},{value:'todo',label:'待处理'},{value:'active',label:'处理中'},{value:'done',label:'已完成'}]
</script>
<template><div><div class="demo-content"><label class="select-demo-field"><span>使用 Tab 聚焦后操作</span><HysSelect v-model="value" :options="options" clearable placeholder="选择任务状态" aria-label="键盘选择任务状态" @change="last='change: '+$event" @clear="last='clear'"/></label><div class="select-demo-keys"><span><kbd>↑</kbd><kbd>↓</kbd> 打开并切换选项</span><span><kbd>Home</kbd><kbd>End</kbd> 首项 / 末项</span><span><kbd>Enter</kbd> 选中</span><span><kbd>Esc</kbd> 关闭并返回焦点</span><span><kbd>Tab</kbd> 继续移动焦点</span></div></div><output class="state-output">{{last}} · 值：{{value||'未选择'}}</output></div></template>
