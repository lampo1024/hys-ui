<script setup lang="ts">
import { ref } from 'vue';
import { HysTransfer } from 'hys-ui';
const selected = ref(['b']);
const options = [{ value: 'a', label: '可移动成员' }, { value: 'b', label: '固定已选成员', disabled: true }, { value: 'c', label: '不可操作成员', disabled: true }, { value: 'd', label: '另一位成员' }];
</script>
<template><div><HysTransfer v-model="selected" :options="options"/><output>已选 {{selected.join(', ')}}。禁用成员无法拖动或通过按钮移动。</output></div></template>
