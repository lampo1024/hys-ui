<script setup lang="ts">
import { ref } from "vue";
import { HysCalendar, HysSelect } from "hys-ui";
const value = ref("2026-11-09"),
  locale = ref("zh-CN"),
  first = ref(1);
</script>
<template>
  <div>
    <div class="demo-controls">
      <section class="demo-control-section">
        <h3>语言与周起始日</h3>
        <div class="demo-control-fields">
          <label class="demo-field"
            >语言<HysSelect
              v-model="locale"
              :options="[
                { label: '中文', value: 'zh-CN' },
                { label: 'English', value: 'en-US' },
                { label: '日本語', value: 'ja-JP' },
              ]" /></label
          ><label class="demo-field"
            >每周第一天<HysSelect
              v-model="first"
              :options="[
                { label: '星期一', value: 1 },
                { label: '星期日', value: 0 },
                { label: '星期六', value: 6 },
              ]"
          /></label>
        </div>
      </section>
    </div>
    <div class="demo-content">
      <HysCalendar
        v-model="value"
        :locale="locale"
        :first-day-of-week="first"
        show-week-numbers
        controller-type="select"
      />
    </div>
    <p class="scenario-note">
      周次按 ISO 周编号显示，与周起始日配置独立。日期与月份使用 Intl
      本地化，默认每周从星期一开始。
    </p>
  </div>
</template>
