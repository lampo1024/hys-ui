<script setup lang="ts">
import { reactive, ref } from 'vue'
import { HysButton, HysCheckbox, HysInput, HysNumberInput, HysSelect, HysToast, type HysToastPosition, type HysToastType } from 'hys-ui'
const message = ref(''), content = ref('设置已保存，可继续下一步操作。')
const config = reactive({ type: 'success' as HysToastType, position: 'top-center' as HysToastPosition, duration: 3000, closable: true, showIcon: true, pauseOnHover: true, closeOnEscape: false, plain: false })
const positions = [{label:'左上',value:'top-left'},{label:'顶部中间',value:'top-center'},{label:'右上',value:'top-right'},{label:'左下',value:'bottom-left'},{label:'底部中间',value:'bottom-center'},{label:'右下',value:'bottom-right'},{label:'窗口正中',value:'center'}]
</script>
<template>
  <div>
    <div class="demo-controls"><section class="demo-control-section"><h3>参数设置</h3><div class="demo-control-fields"><label class="demo-field">提示内容<HysInput v-model="content" aria-label="提示内容"/></label>
<label class="demo-field">状态<HysSelect v-model="config.type" :options="[{label:'成功',value:'success'},{label:'信息',value:'info'},{label:'警告',value:'warning'},{label:'错误',value:'error'},{label:'加载',value:'loading'}]"/></label>
<label class="demo-field">显示位置<HysSelect v-model="config.position" :options="positions"/></label>
<label class="demo-field">显示时长（毫秒）<HysNumberInput v-model="config.duration" :min="0" :step="500" :show-controls="false"/></label></div></section><section class="demo-control-section"><h3>状态与行为</h3><div class="demo-control-toggles"><div class="demo-control-toggle"><HysCheckbox v-model="config.closable" label="显示关闭按钮"/></div>
<div class="demo-control-toggle"><HysCheckbox v-model="config.showIcon" label="显示图标"/></div>
<div class="demo-control-toggle"><HysCheckbox v-model="config.pauseOnHover" label="悬停暂停"/></div>
<div class="demo-control-toggle"><HysCheckbox v-model="config.closeOnEscape" label="Esc 关闭"/></div>
<div class="demo-control-toggle"><HysCheckbox v-model="config.plain" label="柔和背景"/></div></div></section></div>
    <div class="demo-content"><div class="demo-row"><HysButton @click="message=content">显示轻提示</HysButton><span class="hint">时长为 0 时保留，直到手动关闭。</span></div><HysToast v-bind="config" :message="message" @close="message=''"/></div>
    <pre class="state-output">{{JSON.stringify(config,null,2)}}</pre>
  </div>
</template>
