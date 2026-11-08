<script setup lang="ts">
import { ref } from 'vue'
import { HysSelect } from 'hys-ui'
const small=ref('blue'),standard=ref('blue'),large=ref('blue')
const options=[{label:'科技蓝',value:'blue'},{label:'清新绿',value:'green'},{label:'紫色极简',value:'purple'}]
</script>
<template><div class="select-demo-grid"><label class="select-demo-field"><span>小尺寸 sm</span><HysSelect v-model="small" :options="options" size="sm" aria-label="小尺寸选择"/></label><label class="select-demo-field"><span>默认尺寸 md</span><HysSelect v-model="standard" :options="options" aria-label="标准尺寸选择"/></label><label class="select-demo-field"><span>大尺寸 lg</span><HysSelect v-model="large" :options="options" size="lg" aria-label="大尺寸选择"/></label></div></template>
