<script setup lang="ts">
import { ref } from 'vue'
import { HysButton, useHysToast, type HysToastHandle } from 'hys-ui'
const toast = useHysToast({ maxCount: 3, closeOnEscape: true })
const result = ref(''), pending = ref<HysToastHandle>()
function loading() { pending.value=toast.loading({id:'upload',message:'正在上传文件…'});result.value='加载提示会保留，完成后可更新同一条提示。' }
function complete() { pending.value?.update({type:'success',message:'文件上传完成',duration:2000}); result.value='已更新原提示。' }
function grouped() { toast.info({message:'网络已恢复连接',grouping:true}); result.value='重复提示会合并并显示次数。' }
async function watched() { const handle=toast.success({message:'操作完成，2 秒后关闭',duration:2000});await handle.closed;result.value='提示已关闭，退出动画已完成。' }
</script>
<template><div><p class="demo-hint">调用 API 会自动管理堆叠，最多保留 3 条。页面离开或示例重置时自动清理。</p><div class="demo-content"><div class="demo-row"><HysButton variant="secondary" @click="toast.success('保存成功')">成功提示</HysButton><HysButton variant="secondary" @click="toast.warning('请检查输入内容')">警告提示</HysButton><HysButton variant="secondary" @click="loading">开始上传</HysButton><HysButton variant="secondary" :disabled="!pending" @click="complete">上传完成</HysButton><HysButton variant="secondary" @click="grouped">合并重复提示</HysButton><HysButton variant="secondary" @click="watched">等待关闭</HysButton><HysButton variant="ghost" @click="toast.closeAll()">关闭全部</HysButton></div></div><pre class="state-output">{{result||'通过按钮体验快捷调用、加载更新和队列行为。'}}</pre></div></template>
