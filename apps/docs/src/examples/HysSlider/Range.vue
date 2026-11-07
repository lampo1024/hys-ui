<script setup lang="ts">
import {ref} from 'vue'
import {HysSlider} from 'hys-ui'
const value=ref<[number,number]>([20,70])
</script>
<template><div><HysSlider v-model="value" label="范围" :step="5" :marks="{0:'0',50:'50',100:'100'}"/><output>{{value.join(' ~ ')}}</output></div></template>
