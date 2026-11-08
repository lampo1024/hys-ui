<script setup lang="ts">
import {computed,ref} from 'vue'
import {HysTabs,HysButton,HysCheckbox,type HysTabValue} from 'hys-ui'
const active=ref<HysTabValue>(1),compact=ref(false)
const items=computed(()=>Array.from({length:16},(_,index)=>({value:index+1,label:compact.value?String(index+1):'内容分类 '+(index+1),content:'分类 '+(index+1)+' 的内容。'})))
</script>
<template><div class="demo-content"><HysTabs v-model="active" :items="items" aria-label="可滚动页签"/><div class="demo-row"><HysButton variant="secondary" @click="active=16">切换到最后一项</HysButton><HysButton variant="ghost" @click="active=1">回到第一项</HysButton><HysCheckbox v-model="compact" label="使用简短标签"/></div><p class="scenario-note">标签超出可用宽度时显示滚动按钮，并在标签或容器变化时更新。通过键盘或外部状态切换时，当前标签会自动进入可视区域，不移动整个文档。</p></div></template>
