<script setup lang="ts">
import {HysSteps} from 'hys-ui'
</script>
<template><div class="demo-content"><HysSteps :current="1" :items="[{title:'填写资料',description:'输入基本信息'},{title:'核对信息',description:'确认提交内容'},{title:'完成',description:'保存并生效'}]"/></div></template>