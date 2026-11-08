<script setup lang="ts">
import { computed, ref } from "vue";
import { HysNumberInput, HysSelect } from "hys-ui";
const value = ref<number | null>(null),
  policy = ref("null"),
  clearValue = computed(() =>
    policy.value === "null" ? null : policy.value === "zero" ? 0 : policy.value,
  );
</script>
<template>
  <div class="demo-content">
    <div class="demo-controls">
      <section class="demo-control-section">
        <h3>清空策略</h3>
        <div class="demo-control-fields">
          <label class="demo-field"
            ><span>清空后的值</span
            ><HysSelect
              v-model="policy"
              :options="[
                { label: '保持空值 null', value: 'null' },
                { label: '数值 0', value: 'zero' },
                { label: '最小值 min', value: 'min' },
                { label: '最大值 max', value: 'max' },
              ]"
          /></label>
        </div>
      </section>
    </div>
    <label class="demo-field"
      ><span>可为空的数量</span
      ><HysNumberInput
        v-model="value"
        :min="0"
        :max="10"
        :value-on-clear="clearValue"
        clearable
        placeholder="尚未填写"
        aria-label="可为空的数量" /></label
    ><output class="state-output"
      >值：{{ JSON.stringify(value) }} · 类型：{{
        value === null ? "null" : typeof value
      }}</output
    >
    <p class="scenario-note">
      空值与 0 分开处理。输入清空后在提交时应用
      valueOnClear；清空按钮立即应用此策略。未传 v-model 时，也可使用
      defaultValue 管理初始值。
    </p>
  </div>
</template>
