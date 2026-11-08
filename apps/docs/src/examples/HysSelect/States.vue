<script setup lang="ts">
import { ref } from 'vue'
import { HysSelect } from 'hys-ui'
const empty=ref(''),loading=ref(''),disabled=ref('a'),blocked=ref('')
const options=[{label:'已选择的选项',value:'a'},{label:'另一个选项',value:'b'}]
</script>
<template><div class="select-demo-grid"><label class="select-demo-field"><span>空数据与自定义提示</span><HysSelect v-model="empty" :options="[]" empty-text="当前没有可用成员" aria-label="空数据选择"/></label><label class="select-demo-field"><span>正在加载</span><HysSelect v-model="loading" :options="[]" loading aria-label="加载中选择"><template #loading>正在获取成员…</template></HysSelect></label><label class="select-demo-field"><span>整体禁用</span><HysSelect v-model="disabled" :options="options" disabled aria-label="禁用选择"/></label><label class="select-demo-field"><span>全部选项禁用</span><HysSelect v-model="blocked" :options="options.map(option=>({...option,disabled:true}))" aria-label="全部选项禁用"/></label></div></template>
