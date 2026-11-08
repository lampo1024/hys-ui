<script setup lang="ts">
import { ref } from 'vue'
import { HysButton, HysToast, type HysToastType } from 'hys-ui'
const message = ref(''), type = ref<HysToastType>('success')
const types: {label:string;value:HysToastType;text:string}[] = [{label:'成功',value:'success',text:'保存成功，可以继续下一步。'},{label:'信息',value:'info',text:'有一条新的消息。'},{label:'警告',value:'warning',text:'请检查尚未填写的内容。'},{label:'错误',value:'error',text:'操作失败，请稍后重试。'},{label:'加载',value:'loading',text:'正在处理，请稍候…'}]
function show(item: typeof types[number]) { type.value=item.value;message.value=item.text }
</script>
<template><div><p class="demo-hint">提示默认显示在顶部中间。普通提示 3 秒后关闭，加载提示默认保留。</p><div class="demo-content"><div class="demo-row"><HysButton v-for="item in types" :key="item.value" variant="secondary" @click="show(item)">{{item.label}}</HysButton></div><HysToast :message="message" :type="type" @close="message=''"/></div></div></template>
