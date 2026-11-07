<script setup lang="ts">
import { ref } from 'vue'
import { HysMention } from 'hys-ui'
const content = ref('本周计划\n请联系 @ 讨论验收时间。')
const users = [{ id: 'zhang', name: '张工' }, { id: 'li', name: '李工' }, { id: 'wang', name: '王工' }]
</script>
<template>
  <div>
    <p class="demo-hint">将光标放在 @ 后输入姓名。候选列表跟随提及位置，选中后保留后面的文字。使用 ↑ ↓ 选择、Enter 确认、Escape 收起。</p>
    <div class="demo-content"><HysMention v-model="content" :users="users" /></div>
    <pre class="state-output">{{ content }}</pre>
  </div>
</template>
