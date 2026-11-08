<script setup lang="ts">
import { ref } from 'vue';
import { HysButton, HysDrawer } from 'hys-ui';
import { reactive as demoReactive } from 'vue';
import { HysCheckbox as DemoCheckbox, HysSelect as DemoSelect } from 'hys-ui';
const open = ref(false);
const demoConfig = demoReactive<{
    closeOnMask: boolean;
    closeOnEscape: boolean;
    showClose: boolean;
    destroyOnClose: boolean;
    fullscreen: boolean;
    placement: "left" | "right" | "top" | "bottom";
}>({ "closeOnMask": true, "closeOnEscape": true, "showClose": true, "destroyOnClose": true, "fullscreen": false, "placement": "right" });
</script>
<template><div><div class="demo-controls"><section class="demo-control-section"><h3>参数设置</h3><div class="demo-control-fields"><label class="demo-field"><span class="demo-control-label"><span>展示方向</span><code>placement</code></span><DemoSelect :model-value="demoConfig.placement" @update:model-value="demoConfig.placement=$event as typeof demoConfig.placement" :options='[{"label":"left","value":"left"},{"label":"right","value":"right"},{"label":"top","value":"top"},{"label":"bottom","value":"bottom"}]'/></label></div></section><section class="demo-control-section"><h3>状态与行为</h3><div class="demo-control-toggles"><div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.closeOnMask" label="closeOnMask"/><small>点击遮罩关闭</small></div>
<div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.closeOnEscape" label="closeOnEscape"/><small>按 Esc 关闭</small></div>
<div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.showClose" label="showClose"/><small>显示关闭按钮</small></div>
<div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.destroyOnClose" label="destroyOnClose"/><small>关闭后销毁内容</small></div>
<div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.fullscreen" label="fullscreen"/><small>全屏展示</small></div></div></section></div><div class="demo-content"><HysButton @click="open=true">打开抽屉</HysButton><HysDrawer v-bind="demoConfig" :open="open" title="详情" @close="open=false"><p>抽屉方向、尺寸和动画随上方配置同步变化。</p><template #footer><HysButton @click="open=false">完成</HysButton></template></HysDrawer></div><pre class="state-output">{{JSON.stringify(demoConfig,null,2)}}</pre></div></template>
