<script setup lang="ts">
import {reactive,ref} from 'vue'
import {HysTabs,HysSelect,HysCheckbox,type HysTabValue} from 'hys-ui'
const active=ref<HysTabValue>('overview')
const config=reactive({type:'line' as 'line'|'card'|'border-card'|'segment',placement:'top' as 'top'|'right'|'bottom'|'left',size:'md' as 'sm'|'md'|'lg',stretch:false,centered:false,disabled:false})
const items=[{label:'概览',value:'overview',content:'在同一区域切换相关内容。'},{label:'记录',value:'history',content:'查看历史记录和操作详情。'},{label:'设置',value:'settings',content:'维护当前空间的偏好设置。'},{label:'受限内容',value:'restricted',disabled:true}]
</script>
<template><div>
  <div class="demo-controls">
    <section class="demo-control-section"><h3>外观与布局</h3><div class="demo-control-fields">
      <label class="demo-field"><span class="demo-control-label">页签外观 <code>type</code></span><HysSelect v-model="config.type" :options="['line','card','border-card','segment'].map(value=>({label:value,value}))"/></label>
      <label class="demo-field"><span class="demo-control-label">导航位置 <code>placement</code></span><HysSelect v-model="config.placement" :options="['top','right','bottom','left'].map(value=>({label:value,value}))"/></label>
      <label class="demo-field"><span class="demo-control-label">尺寸 <code>size</code></span><HysSelect v-model="config.size" :options="['sm','md','lg'].map(value=>({label:value,value}))"/></label>
    </div></section>
    <section class="demo-control-section"><h3>状态与行为</h3><div class="demo-control-toggles"><div class="demo-control-toggle"><HysCheckbox v-model="config.stretch" label="均分宽度"/><small>stretch</small></div><div class="demo-control-toggle"><HysCheckbox v-model="config.centered" label="标签居中"/><small>centered</small></div><div class="demo-control-toggle"><HysCheckbox v-model="config.disabled" label="禁用交互"/><small>disabled</small></div></div></section>
  </div>
  <div class="demo-content"><HysTabs v-model="active" v-bind="config" :items="items"/></div>
  <output class="state-output">当前页签：{{active}}</output>
</div></template>