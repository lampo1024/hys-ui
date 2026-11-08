<script setup lang="ts">
import { ref } from 'vue'
import { HysSelect } from 'hys-ui'
const owner=ref('all'),fixed=ref('all')
const options=[{value:'all',label:'全部负责人'},{value:'keller',label:'Keller'},{value:'design',label:'产品设计与交互体验团队'},{value:'long',label:'跨部门协作项目的需求分析、交互设计与工程实施负责人'}]
</script>
<template><div class="demo-content"><div class="demo-row">
  <label class="select-demo-field">按内容扩展浮层<HysSelect v-model="owner" style="width:140px" :options="options" aria-label="按内容扩展浮层"/></label>
  <label class="select-demo-field">浮层与选择框等宽<HysSelect v-model="fixed" style="width:180px" :options="options" popup-match-width aria-label="等宽浮层"/></label>
</div><p class="scenario-note">选项保持单行。默认浮层至少与选择框等宽，并按内容扩展；超出视口时省略，可悬停查看全文。</p></div></template>
