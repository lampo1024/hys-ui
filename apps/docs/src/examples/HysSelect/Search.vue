<script setup lang="ts">
import { ref } from 'vue'
import { HysSelect, type HysSelectOption } from 'hys-ui'
const value=ref(''),custom=ref('')
const options=[{label:'北京 · Beijing',value:'bj'},{label:'上海 · Shanghai',value:'sh'},{label:'杭州 · Hangzhou',value:'hz'},{label:'深圳 · Shenzhen',value:'sz',disabled:true}]
const aliases:Record<string,string>={bj:'beijing bj 北京',sh:'shanghai sh 上海',hz:'hangzhou hz 杭州',sz:'shenzhen sz 深圳'}
const match=(query:string,option:HysSelectOption)=>aliases[option.value].includes(query.trim().toLowerCase())
</script>
<template><div><div class="select-demo-grid">
  <label class="select-demo-field"><span>按显示文本搜索</span><HysSelect v-model="value" :options="options" filterable clearable placeholder="输入城市名称" aria-label="按显示文本搜索"/></label>
  <label class="select-demo-field"><span>自定义简称匹配</span><HysSelect v-model="custom" :options="options" filterable clearable :filter-method="match" placeholder="试试 bj、hz 或中文" aria-label="自定义简称匹配"/></label>
</div><output class="state-output">普通搜索：{{value||'未选择'}} · 自定义搜索：{{custom||'未选择'}}</output><p class="scenario-note">禁用选项不能通过鼠标或键盘选中，中文输入法确认文字时不会误选选项。</p></div></template>
