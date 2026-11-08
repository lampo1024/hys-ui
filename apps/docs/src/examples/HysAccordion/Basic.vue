<script setup lang="ts">
import {HysAccordion} from 'hys-ui'
const items=[{title:'如何修改个人资料？',content:'打开账户设置，修改昵称和联系信息后保存。'},{title:'如何管理通知？',content:'在通知偏好中选择接收渠道和提醒频率。'},{title:'如何退出当前账户？',content:'在账户菜单中选择退出登录。'}]
</script>
<template><div class="demo-content"><HysAccordion :items="items" :default-active="[0]"/><p class="scenario-note">默认每次展开一项；点击已展开的标题可以收起。使用 multiple 可同时展开多项。</p></div></template>