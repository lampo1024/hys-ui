<script setup lang="ts">
import { HysFormItem, HysInput } from 'hys-ui';
</script>
<template><div class="demo-content"><HysFormItem label="负责人" required hint="请输入姓名"><HysInput placeholder="负责人"/></HysFormItem><HysFormItem label="校验错误" error="此项不能为空"><HysInput/></HysFormItem></div></template>
