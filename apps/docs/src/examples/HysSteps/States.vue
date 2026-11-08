<script setup lang="ts">
import {HysSteps} from 'hys-ui'
</script>
<template><div class="demo-content"><div class="demo-panel"><p>单项状态优先于整体状态</p><HysSteps :current="1" :items="[{title:'资料缺失',status:'error'},{title:'审核中'},{title:'等待处理',disabled:true}]" size="sm"/></div><div class="demo-panel"><p>全部完成</p><HysSteps :current="3" :items="['提交','处理','完成']" progress-dot label-placement="bottom"/></div><div class="demo-panel"><p>尚未开始</p><HysSteps :current="-1" :items="['提交','处理','完成']" size="sm"/></div><div class="demo-panel"><p>空数据</p><HysSteps :items="[]"/></div></div></template>