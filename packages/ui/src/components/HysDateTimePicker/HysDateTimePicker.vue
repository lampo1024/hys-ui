<script setup lang="ts" generic="V extends HysDatePickerValue = string">
import { computed, ref, type VNodeChild } from "vue";
import HysDatePicker from "../HysDatePicker/HysDatePicker.vue";
import type { HysDatePickerChange, HysDatePickerInstance, HysDatePickerProps, HysDatePickerValue, HysDateShortcut } from "../../composables/datePicker";

export interface HysDateTimePickerProps<V extends HysDatePickerValue = string> {
  /** 受控日期时间，配合 v-model。 */
  modelValue?: V;
  /** 非受控的初始值。 */
  defaultValue?: V;
  /** 选择日期时间范围，绑定值为起止二元组。支持 null 作为空值。 */
  range?: boolean;
  /** 字符串、Date 或毫秒时间戳。默认 string。 */
  valueType?: HysDatePickerProps["valueType"];
  /** 绑定字符串的格式。 */
  valueFormat?: string;
  /** 日期与时间的显示格式。省略时根据 use12Hours 和 showSeconds 生成。 */
  format?: string;
  /** 采用 12 小时制和上午/下午。 */
  use12Hours?: boolean;
  /** 默认显示格式及时间面板是否包含秒，默认 true。 */
  showSeconds?: boolean;
  /** 时间面板的小时步长，默认 1。 */
  hourStep?: number;
  /** 时间面板的分钟步长，默认 1。 */
  minuteStep?: number;
  /** 时间面板的秒步长，默认 1。 */
  secondStep?: number;
  /** 范围模式只用一个日历面板，默认 true；设为 false 显示双面板。 */
  singlePanel?: boolean;
  /** 快捷项的位置，默认 top；start 显示在面板起始侧，窄屏时回到顶部。 */
  shortcutPlacement?: HysDatePickerProps["shortcutPlacement"];
  /** 允许直接编辑输入框，默认 true。 */
  editable?: boolean;
  /** 在面板底部显示业务时区名称。输入和比较沿用浏览器本地日期时间。 */
  timeZoneLabel?: string;
  /** 可选择的最早日期时间。 */
  min?: HysDatePickerProps["min"];
  /** 可选择的最晚日期时间。 */
  max?: HysDatePickerProps["max"];
  /** 自定义禁用日期规则。 */
  disabledDate?: HysDatePickerProps["disabledDate"];
  /** 自定义禁用时间规则。 */
  disabledTime?: HysDatePickerProps["disabledTime"];
  /** 自定义快捷项。省略时提供现在和今天起止时间。 */
  shortcuts?: readonly HysDateShortcut[];
  /** 禁用输入和选择。 */
  disabled?: boolean;
  /** 只读状态。 */
  readonly?: boolean;
  /** 显示清空入口，默认 true。 */
  clearable?: boolean;
  /** 输入框占位文字。 */
  placeholder?: string;
}
defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<HysDateTimePickerProps<V>>(), {
  valueType: "string",
  clearable: true,
  editable: true,
  showSeconds: true,
  singlePanel: true,
  placeholder: "选择日期和时间",
});
const emit = defineEmits<{
  /** 提交或清空后请求更新日期时间。 */
  "update:modelValue": [value: V];
  /** 有效值变更时发出日期时间与操作来源。 */
  change: [value: V, context: HysDatePickerChange];
  /** 点击清空入口后发出。 */
  clear: [];
  /** 文本格式无效或日期时间超出限制时发出原因。 */
  invalid: [info: { reason: string; dates?: readonly (Date | null)[]; error?: unknown }];
}>();
defineSlots<{
  /** 日期时间面板底部追加内容。 */
  "extra-footer"?: () => VNodeChild;
}>();
const picker = ref<HysDatePickerInstance<V>>();
const presets = computed<readonly HysDateShortcut[]>(() => {
  if (props.shortcuts) return props.shortcuts;
  if (props.range) {
    return [{ label: "今天全天", value: () => {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setHours(23, 59, props.showSeconds ? 59 : 0, 0);
      return [start, end];
    } }];
  }
  return [
  { label: "现在", value: () => new Date() },
  { label: "今天开始", value: () => { const date = new Date(); date.setHours(0, 0, 0, 0); return date; } },
  { label: "今天结束", value: () => { const date = new Date(); date.setHours(23, 59, 59, 0); return date; } },
  ];
});
const displayFormat = computed(() => {
  if (props.format) return props.format;
  const clock = props.use12Hours ? "hh:mm" : "HH:mm";
  return "YYYY-MM-DD " + clock + (props.showSeconds ? ":ss" : "") + (props.use12Hours ? " A" : "");
});
const pickerProps = computed(() => {
  const { range, timeZoneLabel, shortcuts, ...rest } = props;
  return rest;
});
/** 聚焦日期时间输入框。 */
function focus() { picker.value?.focus(); }
defineExpose({ focus });
</script>
<template>
  <HysDatePicker ref="picker" v-bind="{ ...$attrs, ...pickerProps }" :type="range ? 'datetimerange' : 'datetime'" :format="displayFormat" :shortcuts="presets"
    @update:model-value="emit('update:modelValue', $event)" @change="(value, context) => emit('change', value, context)" @clear="emit('clear')" @invalid="emit('invalid', $event)">
    <template v-if="timeZoneLabel || $slots['extra-footer']" #extra-footer>
      <span v-if="timeZoneLabel" class="hys-date-time-zone">{{ timeZoneLabel }}</span>
      <slot name="extra-footer" />
    </template>
  </HysDatePicker>
</template>
