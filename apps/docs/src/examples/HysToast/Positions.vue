<script setup lang="ts">
import { ref } from 'vue'
import { HysButton, HysToast, type HysToastPosition } from 'hys-ui'
const position = ref<HysToastPosition>('top-center'), message = ref('')
const positions: {label:string;value:HysToastPosition}[] = [{label:'左上',value:'top-left'},{label:'顶部中间',value:'top-center'},{label:'右上',value:'top-right'},{label:'左下',value:'bottom-left'},{label:'底部中间',value:'bottom-center'},{label:'右下',value:'bottom-right'},{label:'窗口正中',value:'center'}]
function show(item: typeof positions[number]) { position.value=item.value; message.value='当前显示位置：'+item.label }
</script>
<template><div><p class="demo-hint">默认在顶部中间显示，提示可放在窗口的七个位置。长内容会自动换行。</p><div class="demo-content"><div class="demo-row"><HysButton v-for="item in positions" :key="item.value" variant="secondary" @click="show(item)">{{item.label}}</HysButton></div><HysToast :message="message" :position="position" :duration="0" @close="message=''"/></div><pre class="state-output">position: {{position}}</pre></div></template>
