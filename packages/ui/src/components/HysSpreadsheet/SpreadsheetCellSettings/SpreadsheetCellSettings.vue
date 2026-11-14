<script setup lang="ts">
import { computed, ref } from "vue";
import HysButton from "../../HysButton/HysButton.vue";
import HysCheckbox from "../../HysCheckbox/HysCheckbox.vue";
import HysColorPicker from "../../HysColorPicker/HysColorPicker.vue";
import HysInput from "../../HysInput/HysInput.vue";
import HysNumberInput from "../../HysNumberInput/HysNumberInput.vue";
import HysSelect from "../../HysSelect/HysSelect.vue";
import SpreadsheetFieldHint from "../SpreadsheetFieldHint/SpreadsheetFieldHint.vue";
import { useSpreadsheetOptions } from "../spreadsheetControlOptions";
import type {
  HysSpreadsheetCellFormat,
  HysSpreadsheetCellOptions,
  HysSpreadsheetCellType,
  HysSpreadsheetValidation,
} from "../spreadsheetTypes";
import { useSpreadsheetMessages } from "../spreadsheetMessages";

defineProps<{ disabled: boolean }>();
const emit = defineEmits<{
  format: [value: HysSpreadsheetCellFormat];
  configure: [value: HysSpreadsheetCellOptions];
  name: [name: string];
}>();
const message = useSpreadsheetMessages();
const font = ref("");
const size = ref(14);
const border =
  ref<NonNullable<HysSpreadsheetCellFormat["borderStyle"]>>("solid");
const color = ref("#8a98ab");
const align = ref<NonNullable<HysSpreadsheetCellFormat["align"]>>("left");
const vertical =
  ref<NonNullable<HysSpreadsheetCellFormat["verticalAlign"]>>("middle");
const overflow =
  ref<NonNullable<HysSpreadsheetCellFormat["overflow"]>>("ellipsis");
const rotation = ref(0);
const indent = ref(0);
const precision = ref(2);
const thousands = ref(true);
const strike = ref(false);
const type = ref<HysSpreadsheetCellType>("auto");
const choices = ref("");
const link = ref("");
const note = ref("");
const tooltip = ref("");
const name = ref("");
const required = ref(false);
const uniqueness = ref("any");
const rule = ref("");
const options: [HysSpreadsheetCellType, string][] = [
  ["auto", "自动"],
  ["text", "文本"],
  ["number", "数字"],
  ["date", "日期"],
  ["time", "时间"],
  ["datetime-local", "日期与时间"],
  ["percent", "百分比"],
  ["currency", "金额"],
  ["boolean", "布尔值"],
  ["select", "下拉选择"],
  ["multiple", "多选"],
  ["autocomplete", "自动补全"],
  ["formula", "公式"],
  ["multiline", "多行文本"],
];
const choicesFor = useSpreadsheetOptions();
const typeOptions = computed(() => choicesFor(options));
const duplicateOptions = computed(() =>
  choicesFor([
    ["any", "不限"],
    ["unique", "仅唯一值"],
    ["duplicate", "仅已有值"],
  ]),
);
const borderOptions = computed(() =>
  choicesFor([
    ["solid", "实线"],
    ["dashed", "虚线"],
    ["dotted", "点线"],
    ["double", "双线"],
  ]),
);
const horizontalOptions = computed(() =>
  choicesFor([
    ["left", "左"],
    ["center", "居中"],
    ["right", "右"],
  ]),
);
const verticalOptions = computed(() =>
  choicesFor([
    ["top", "上"],
    ["middle", "居中"],
    ["bottom", "下"],
  ]),
);
const overflowOptions = computed(() =>
  choicesFor([
    ["ellipsis", "省略"],
    ["clip", "裁切"],
    ["wrap", "换行"],
    ["visible", "显示溢出"],
  ]),
);
function validation(): HysSpreadsheetValidation {
  return {
    required: required.value,
    unique: uniqueness.value === "unique",
    duplicate: uniqueness.value === "duplicate",
    pattern: rule.value || undefined,
  };
}
</script>

<template>
  <div class="settings">
    <p v-if="disabled">{{ message("请选择可编辑的单元格。") }}</p>
    <fieldset :disabled="disabled">
      <legend>{{ message("内容与验证") }}</legend>
      <div class="field-grid">
        <SpreadsheetFieldHint :text="message('编辑类型')">
          <HysSelect
            v-model="type"
            :options="typeOptions"
            size="sm"
            :disabled="disabled"
            :native-label-tooltip="false"
            :aria-label="message('编辑类型')"
          />
        </SpreadsheetFieldHint>
        <HysInput
          v-if="['select', 'multiple', 'autocomplete'].includes(type)"
          v-model="choices"
          class="full-row"
          size="sm"
          :disabled="disabled"
          :placeholder="message('选项（逗号分隔）')"
          :aria-label="message('选项（逗号分隔）')"
        />
        <HysInput
          v-model="link"
          size="sm"
          type="url"
          :disabled="disabled"
          :placeholder="message('超链接')"
          :aria-label="message('超链接')"
        />
        <HysInput
          v-model="note"
          size="sm"
          :disabled="disabled"
          :placeholder="message('备注')"
          :aria-label="message('备注')"
        />
        <HysInput
          v-model="tooltip"
          size="sm"
          :disabled="disabled"
          :placeholder="message('内容提示')"
          :aria-label="message('内容提示')"
        />
        <SpreadsheetFieldHint :text="message('重复值')">
          <HysSelect
            v-model="uniqueness"
            :options="duplicateOptions"
            size="sm"
            :disabled="disabled"
            :native-label-tooltip="false"
            :aria-label="message('重复值')"
          />
        </SpreadsheetFieldHint>
        <HysInput
          v-model="rule"
          size="sm"
          :disabled="disabled"
          :placeholder="message('正则表达式')"
          :aria-label="message('正则表达式')"
        />
      </div>
      <div class="field-actions">
        <HysCheckbox
          v-model="required"
          size="sm"
          :disabled="disabled"
          :label="message('必填')"
        />
        <HysButton
          size="sm"
          :disabled="disabled"
          @click="
            emit('configure', {
              type,
              options: choices
                .split(',')
                .map((item) => item.trim())
                .filter(Boolean),
              link: link || undefined,
              note: note || undefined,
              tooltip: tooltip || undefined,
              validation: validation(),
            })
          "
          >{{ message("应用内容设置") }}</HysButton
        >
      </div>
    </fieldset>
    <fieldset :disabled="disabled">
      <legend>{{ message("字体与布局") }}</legend>
      <div class="field-grid">
        <HysInput
          v-model="font"
          size="sm"
          :placeholder="message('字体')"
          :disabled="disabled"
          :aria-label="message('字体')"
        />
        <SpreadsheetFieldHint :text="message('字号')">
          <HysNumberInput
            v-model="size"
            size="sm"
            :min="8"
            :max="72"
            block
            controls-position="right"
            :disabled="disabled"
            :aria-label="message('字号')"
          />
        </SpreadsheetFieldHint>
        <SpreadsheetFieldHint :text="message('边框')">
          <HysSelect
            v-model="border"
            :options="borderOptions"
            size="sm"
            :disabled="disabled"
            :native-label-tooltip="false"
            :aria-label="message('边框')"
          />
        </SpreadsheetFieldHint>
        <SpreadsheetFieldHint :text="message('边框颜色')">
          <HysColorPicker
            v-model="color"
            size="sm"
            :disabled="disabled"
            :aria-label="message('边框颜色')"
          />
        </SpreadsheetFieldHint>
        <SpreadsheetFieldHint :text="message('水平对齐')">
          <HysSelect
            v-model="align"
            :options="horizontalOptions"
            size="sm"
            :disabled="disabled"
            :native-label-tooltip="false"
            :aria-label="message('水平对齐')"
          />
        </SpreadsheetFieldHint>
        <SpreadsheetFieldHint :text="message('垂直对齐')">
          <HysSelect
            v-model="vertical"
            :options="verticalOptions"
            size="sm"
            :disabled="disabled"
            :native-label-tooltip="false"
            :aria-label="message('垂直对齐')"
          />
        </SpreadsheetFieldHint>
        <SpreadsheetFieldHint :text="message('文本溢出')">
          <HysSelect
            v-model="overflow"
            :options="overflowOptions"
            size="sm"
            :disabled="disabled"
            :native-label-tooltip="false"
            :aria-label="message('文本溢出')"
          />
        </SpreadsheetFieldHint>
        <SpreadsheetFieldHint :text="message('旋转角度')">
          <HysNumberInput
            v-model="rotation"
            size="sm"
            :min="-90"
            :max="90"
            block
            controls-position="right"
            :disabled="disabled"
            :aria-label="message('旋转角度')"
          />
        </SpreadsheetFieldHint>
        <SpreadsheetFieldHint :text="message('缩进像素')">
          <HysNumberInput
            v-model="indent"
            size="sm"
            :min="0"
            :max="120"
            block
            controls-position="right"
            :disabled="disabled"
            :aria-label="message('缩进像素')"
          />
        </SpreadsheetFieldHint>
        <SpreadsheetFieldHint :text="message('小数位数')">
          <HysNumberInput
            v-model="precision"
            size="sm"
            :min="0"
            :max="20"
            block
            controls-position="right"
            :disabled="disabled"
            :aria-label="message('小数位数')"
          />
        </SpreadsheetFieldHint>
      </div>
      <div class="field-actions">
        <div class="field-toggles">
          <HysCheckbox
            v-model="thousands"
            size="sm"
            :disabled="disabled"
            :label="message('千分位')"
          />
          <HysCheckbox
            v-model="strike"
            size="sm"
            :disabled="disabled"
            :label="message('删除线')"
          />
        </div>
        <HysButton
          size="sm"
          :disabled="disabled"
          @click="
            emit('format', {
              fontFamily: font || undefined,
              fontSize: size,
              borderStyle: border,
              borderColor: color,
              align,
              verticalAlign: vertical,
              overflow,
              rotation,
              indent,
              precision,
              thousands,
              strike,
            })
          "
          >{{ message("应用样式") }}</HysButton
        >
      </div>
    </fieldset>
    <fieldset :disabled="disabled">
      <legend>{{ message("命名选区") }}</legend>
      <div class="name-row">
        <HysInput
          v-model="name"
          size="sm"
          :disabled="disabled"
          :placeholder="message('区域名称')"
          :aria-label="message('区域名称')"
          @press-enter="emit('name', name)"
        />
        <HysButton
          size="sm"
          :disabled="disabled || !name.trim()"
          @click="emit('name', name)"
          >{{ message("保存名称") }}</HysButton
        >
      </div>
    </fieldset>
  </div>
</template>

<style scoped>
.settings {
  font-size: 13px;
  min-width: 0;
  display: grid;
  gap: 12px;
}
.settings p {
  margin: 0;
  color: var(--hys-ui-theme-muted);
}
fieldset {
  min-width: 0;
  margin: 0;
  padding: 10px 12px 12px;
  border: 1px solid var(--hys-ui-theme-border);
  border-radius: 8px;
}
legend {
  padding-inline: 4px;
  font-weight: 600;
}
.field-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 205px), 1fr));
  gap: 10px 14px;
  align-items: center;
}
.full-row {
  grid-column: 1 / -1;
}
.field-actions,
.field-toggles,
.name-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
  align-items: center;
}
.field-actions {
  margin-block-start: 12px;
  padding-block-start: 10px;
  border-block-start: 1px solid var(--hys-ui-theme-border);
}
.field-actions > .hys-ui-btn {
  margin-inline-start: auto;
}
.name-row {
  align-items: end;
}
.name-row :deep(.hys-ui-input-wrap) {
  flex: 1 1 195px;
}
</style>
