<script setup lang="ts">
import { ref } from "vue";
import { HysInput, HysSelect, HysButton } from "hys-ui";
import { Search } from "lucide-vue-next";
const domain = ref("hys-ui"),
  query = ref(""),
  category = ref("name"),
  submitted = ref("尚未搜索");
function search() {
  submitted.value = `${category.value}：${query.value || "空关键词"}`;
}
</script>
<template>
  <div class="demo-content">
    <label class="input-demo-field"
      ><span>前后置文本</span
      ><HysInput v-model="domain" aria-label="网站名称"
        ><template #prepend>https://</template
        ><template #append>.example.com</template></HysInput
      ></label
    >
    <div class="input-demo-field">
      <span>选择类别并搜索</span
      ><HysInput
        v-model="query"
        clearable
        placeholder="输入关键词"
        aria-label="复合搜索"
        @press-enter="search"
        ><template #prepend
          ><HysSelect
            v-model="category"
            aria-label="搜索类别"
            style="width: 118px"
            :options="[
              { label: '名称', value: 'name' },
              { label: '编号', value: 'id' },
            ]" /></template
        ><template #append
          ><HysButton aria-label="执行复合搜索" @click="search"
            ><Search :size="16" /></HysButton></template
      ></HysInput>
    </div>
    <output class="state-output">{{ submitted }}</output>
    <p class="scenario-note">
      prepend / append 适合放短标签、选择器或操作按钮，prefix / suffix
      适合输入区域内的辅助内容。
    </p>
  </div>
</template>
