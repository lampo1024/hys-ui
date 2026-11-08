<script setup lang="ts">
import { ref } from 'vue'
import { HysButton,HysSelect } from 'hys-ui'
const value=ref<string[]>(['vue'])
const options=[{label:'Vue',value:'vue'},{label:'TypeScript',value:'ts'},{label:'不可选',value:'disabled',disabled:true},{label:'Vite',value:'vite'},{label:'JavaScript',value:'js'}]
</script>
<template><div><div class="demo-content"><label class="select-demo-field"><span>搜索并选择多个技术标签</span><HysSelect v-model="value" :options="options" multiple filterable clearable placeholder="可输入关键词筛选" aria-label="多选技术标签"/></label><div class="demo-row"><HysButton variant="secondary" size="sm" @click="value=['vue','ts','vite']">预设常用组合</HysButton><HysButton variant="ghost" size="sm" :disabled="!value.length" @click="value=[]">清空选择</HysButton></div><p class="scenario-note">再次点击已选项即可取消；多选后浮层保持打开，选中顺序与值数组一致。</p></div><output class="state-output">{{value.length?value.join('、'):'未选择标签'}}</output></div></template>
