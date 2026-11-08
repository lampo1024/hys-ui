<script setup lang="ts">
import {ref} from 'vue'
import {HysTabs,type HysTabValue} from 'hys-ui'
const active=ref<HysTabValue>(0)
const items=[{value:0,label:'总览',content:'当前为总览面板。'},{value:1,label:'不可用',disabled:true},{value:2,label:'活动记录',content:'当前为活动记录面板。'}]
</script>
<template><div class="demo-content"><HysTabs v-model="active" :items="items" activation="manual" aria-label="手动激活示例"/><p class="scenario-note">Tab 进入导航后，用左右方向键、Home、End 移动焦点，跳过禁用项；按 Enter 或空格确认。手动模式适合切换时需要请求数据的页面。自动模式会在移动焦点时直接切换；左右布局使用上下方向键。</p><output class="state-output">当前值：{{active}}（数字）</output></div></template>