<script setup lang="ts">
import {ref} from 'vue'
import {HysAccordion,HysCheckbox,type HysAccordionKey} from 'hys-ui'
const locked=ref(true),message=ref('展开前检查访问条件')
async function beforeToggle(key:HysAccordionKey,expanded:boolean){if(!expanded)return true;message.value='检查中…';await new Promise(resolve=>setTimeout(resolve,350));message.value=locked.value?'当前条件未满足，面板保持关闭。':'检查通过，内容已展开。';return !locked.value}
</script>
<template><div class="demo-content"><HysCheckbox v-model="locked" label="条件未满足，阻止展开"/><HysAccordion :items="[{id:'protected',title:'受保护内容',content:'此内容仅在检查通过后展示。'}]" :before-toggle="beforeToggle"/><output class="state-output" aria-live="polite">{{message}}</output></div></template>