<script setup lang="ts">
import { computed, ref } from "vue";
import { PackageCheck } from "lucide-vue-next";
import {
  HysButton,
  HysCheckbox,
  HysResult,
  HysSelect,
  HysSpace,
  type HysResultStatus,
} from "hys-ui";
const status = ref<HysResultStatus>("success"),
  customIcon = ref(false);
const feedback = ref("");
const options = [
  { value: "success", label: "成功" },
  { value: "warning", label: "警告" },
  { value: "error", label: "失败" },
  { value: "info", label: "信息" },
  { value: "primary", label: "主题提示" },
];
const texts = {
  success: ["报告已发布", "工作区成员现在可以查看最新版本。", "查看报告"],
  warning: ["报告已保存为草稿", "有 2 个必填字段待补充。", "继续编辑"],
  error: ["暂时无法发布报告", "文件上传失败，请重新提交。", "重新提交"],
  info: ["报告已进入审核", "审核完成后会通知提交人。", "查看进度"],
  primary: ["报告模板已就绪", "使用模板快速建立月度报告。", "使用模板"],
};
const copy = computed(
  () => texts[status.value as keyof typeof texts] ?? texts.info,
);
</script>

<template>
  <div class="demo-stack">
    <div class="demo-controls">
      <div class="demo-control-fields">
        <label class="demo-field"
          >结果状态
          <HysSelect
            v-model="status"
            :options="options"
            aria-label="结果状态"
            @change="feedback = ''"
          />
        </label>
      </div>
      <div class="demo-control-actions">
        <HysCheckbox v-model="customIcon" label="替换图标" />
      </div>
    </div>
    <div class="result-preview">
      <HysResult
        :status="status"
        :icon="customIcon ? PackageCheck : undefined"
        :title="copy[0]"
        :subtitle="copy[1]"
        announce="polite"
      >
        <template #extra>
          <HysSpace justify="center" wrap>
            <HysButton @click="feedback = '已选择：' + copy[2]">{{
              copy[2]
            }}</HysButton>
            <HysButton variant="secondary" @click="feedback = '已返回报告列表'"
              >返回列表</HysButton
            >
          </HysSpace>
        </template>
      </HysResult>
    </div>
    <output v-if="feedback" class="state-output" aria-live="polite">{{
      feedback
    }}</output>
  </div>
</template>

<style scoped>
.result-preview {
  border: 1px solid var(--docs-border);
  border-radius: 10px;
}
</style>
