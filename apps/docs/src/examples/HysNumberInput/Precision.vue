<script setup lang="ts">
import { ref } from "vue";
import { HysNumberInput } from "hys-ui";
const decimal = ref(0.1),
  strict = ref(0.2),
  tiny = ref(0);
</script>
<template>
  <div class="demo-content">
    <div class="number-demo-grid">
      <label class="demo-field"
        ><span>两位小数，每次增加 0.2</span
        ><HysNumberInput
          v-model="decimal"
          :step="0.2"
          :precision="2"
          aria-label="小数步进" /></label
      ><label class="demo-field"
        ><span>有效步进网格：0.2、0.4、0.6、0.8</span
        ><HysNumberInput
          v-model="strict"
          :min="0.15"
          :max="0.9"
          :step="0.2"
          step-strictly
          :precision="2"
          aria-label="严格步进" /></label
      ><label class="demo-field"
        ><span>科学计数法的小步长</span
        ><HysNumberInput
          v-model="tiny"
          :step="1e-7"
          :precision="7"
          aria-label="微小步长"
      /></label>
    </div>
    <output class="state-output"
      >小数：{{ decimal }} · 网格：{{ strict }} · 微小步长：{{ tiny }}</output
    >
    <p class="scenario-note">
      步进与舍入通过十进制运算完成。严格步进同时遵守范围，不会把上限 0.9 当作
      0.2 的倍数；无可用网格时禁止提交与步进。外部值和范围变化不会自行触发
      change。
    </p>
  </div>
</template>
<style scoped>
.number-demo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 230px), 1fr));
  gap: 20px;
}
</style>
