<script setup lang="ts">
import {reactive} from 'vue'
import {UserRound} from 'lucide-vue-next'
import {HysForm,HysFormItem,HysInput,HysButton} from 'hys-ui'
const model=reactive({nickname:''})
</script>
<template><div class="demo-content"><HysForm :model="model" :rules="{nickname:{required:true,min:2,message:'请至少输入两个字符'}}"><HysFormItem label="昵称" prop="nickname" required-mark-position="left"><template #label><UserRound :size="14"/>公开昵称</template><HysInput v-model="model.nickname"/><template #hint><span>此名称会显示在个人资料中。</span></template><template #error="{error}"><strong>请检查：</strong>{{error}}</template><template #extra><HysButton variant="link" size="sm" @click="model.nickname='访客用户'">使用建议昵称</HysButton></template></HysFormItem><template #actions><HysButton type="submit">校验昵称</HysButton></template></HysForm><p class="scenario-note">支持 label、hint、error、warning、feedback 与 extra 插槽。自定义反馈区域仍保留可供辅助技术读取的关联标识。</p></div></template>