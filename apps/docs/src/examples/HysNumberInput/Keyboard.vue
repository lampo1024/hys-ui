<script setup lang="ts">
import { reactive, ref } from "vue";
import { HysCheckbox, HysNumberInput } from "hys-ui";
const value = ref(0),
  config = reactive({ keyboard: true, wheel: false, repeat: true });
</script>
<template>
  <div class="demo-content">
    <div class="demo-controls">
      <section class="demo-control-section">
        <h3>操作方式</h3>
        <div class="demo-control-toggles">
          <HysCheckbox
            v-model="config.keyboard"
            label="启用键盘步进"
          /><HysCheckbox
            v-model="config.wheel"
            label="聚焦后允许滚轮调整"
          /><HysCheckbox v-model="config.repeat" label="按住按钮连续调整" />
        </div>
      </section>
    </div>
    <HysNumberInput
      v-model="value"
      v-bind="config"
      :min="-20"
      :max="20"
      aria-label="键盘与连续步进"
    /><output class="state-output">{{ value }}</output>
    <p class="scenario-note">
      上 / 下方向键步进；PageUp / PageDown 或 Shift + 方向键调整十步，Home / End
      定位边界。滚轮默认关闭，只在聚焦且启用时调整。连续按住遇到边界、松开、禁用或离开页面后停止。
    </p>
  </div>
</template>
