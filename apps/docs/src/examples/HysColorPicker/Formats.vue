<script setup lang="ts">
import { ref } from "vue";
import { HysColorPicker } from "hys-ui";
const hex = ref("#f59e0b"),
  rgb = ref("rgb(56, 103, 245)"),
  hsl = ref("hsl(120, 50%, 40%)"),
  hsv = ref("hsv(280, 60%, 80%)");
</script>
<template>
  <div class="demo-stack">
    <div class="feedback-demo-grid">
      <label class="demo-field"
        >HEX<HysColorPicker
          v-model="hex"
          format="hex"
          label="HEX 颜色" /></label
      ><label class="demo-field"
        >RGB<HysColorPicker
          v-model="rgb"
          format="rgb"
          label="RGB 颜色" /></label
      ><label class="demo-field"
        >HSL<HysColorPicker
          v-model="hsl"
          format="hsl"
          label="HSL 颜色" /></label
      ><label class="demo-field"
        >HSV<HysColorPicker v-model="hsv" format="hsv" label="HSV 颜色"
      /></label>
    </div>
    <output class="state-output"
      >{{ hex }}
      {{ rgb }}
      {{ hsl }}
      {{ hsv }}</output
    >
    <p class="scenario-note">
      支持常见十六进制、RGB、HSL、HSV 及带透明度写法；format
      控制下一次编辑的输出，不会仅因格式配置变化改写模型。
    </p>
  </div>
</template>
