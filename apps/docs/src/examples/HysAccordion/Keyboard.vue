<script setup lang="ts">
import {HysAccordion} from 'hys-ui'
</script>
<template><div class="demo-content"><HysAccordion :items="[{title:'第一项',content:'第一项内容。'},{title:'禁用项',disabled:true},{title:'第三项',content:'第三项内容。'}]"/><p class="scenario-note">Tab 聚焦标题；Enter 或空格展开与收起；上下方向键、Home 和 End 在可用标题间移动焦点。内容区中的输入和快捷键保持独立。</p></div></template>