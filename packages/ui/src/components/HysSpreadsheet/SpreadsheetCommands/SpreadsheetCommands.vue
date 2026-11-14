<script setup lang="ts">
import { useSpreadsheetMessages } from "../spreadsheetMessages";
const message = useSpreadsheetMessages();
import { computed, ref } from "vue";
import {
  ArrowDown,
  ArrowDownAZ,
  ArrowUpAZ,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  ClipboardPaste,
  Copy,
  Eye,
  Grid2X2,
  Italic,
  Merge,
  Paintbrush,
  Pencil,
  Ruler,
  Scissors,
  ShieldCheck,
  Snowflake,
  Split,
  Underline,
  WrapText,
} from "lucide-vue-next";
import HysAccordion from "../../HysAccordion/HysAccordion.vue";
import SpreadsheetToolbarButton from "../SpreadsheetToolbarButton/SpreadsheetToolbarButton.vue";
import HysButton from "../../HysButton/HysButton.vue";
import HysCheckbox from "../../HysCheckbox/HysCheckbox.vue";
import HysColorPicker from "../../HysColorPicker/HysColorPicker.vue";
import HysInput from "../../HysInput/HysInput.vue";
import HysNumberInput from "../../HysNumberInput/HysNumberInput.vue";
import HysSelect from "../../HysSelect/HysSelect.vue";
import HysTextarea from "../../HysTextarea/HysTextarea.vue";
import SpreadsheetFieldHint from "../SpreadsheetFieldHint/SpreadsheetFieldHint.vue";
import {
  columnFilterOptions,
  useSpreadsheetOptions,
} from "../spreadsheetControlOptions";
import { axisCount } from "../spreadsheetAxis";
import { areaFromAddresses } from "../spreadsheetCells";
import { parseCellInput } from "../spreadsheetModel";
import type { CommandGroup } from "./commandGroups";
import type {
  HysSpreadsheetAxisCommand,
  HysSpreadsheetCellFormat,
  HysSpreadsheetCellOptions,
  HysSpreadsheetConditionalFormat,
  HysSpreadsheetDataCommand,
  HysSpreadsheetFillMode,
  HysSpreadsheetPasteMode,
  HysSpreadsheetSelection,
  HysSpreadsheetSheet,
  HysSpreadsheetValue,
} from "../spreadsheetTypes";

const props = defineProps<{
  group: Exclude<CommandGroup, "search">;
  feedback?: string;
  selection: HysSpreadsheetSelection | null;
  sheet: HysSpreadsheetSheet;
  disabled?: boolean;
  index?: { row: number; column: number };
  format?: HysSpreadsheetCellFormat | null;
}>();
const emit = defineEmits<{
  axis: [command: HysSpreadsheetAxisCommand];
  data: [command: HysSpreadsheetDataCommand];
  format: [format: HysSpreadsheetCellFormat | null];
  configure: [options: HysSpreadsheetCellOptions];
  fill: [direction: "down" | "right", mode: HysSpreadsheetFillMode, sequence?: readonly HysSpreadsheetValue[]];
  editSelection: [value: string];
  paste: [mode: HysSpreadsheetPasteMode];
  cut: [];
  merge: [active: boolean];
  conditional: [rule?: HysSpreadsheetConditionalFormat];
  validate: [];
  brush: [apply: boolean];
  fit: [axis: "row" | "column"];
  style: [name: string];
}>();
const filter = ref("");
const delimiter = ref(",");
const secondary = ref<number | null>(null);
const filterOperator = ref<
  "contains" | "eq" | "gt" | "gte" | "lt" | "lte" | "color"
>("contains");
const keepHeader = ref(true);
const criterion = ref("");
const axis = ref<"row" | "column">("column");
const dimension = ref(124);
const label = ref("");
const fillMode = ref<HysSpreadsheetFillMode | "custom">("copy");
const sequenceText = ref("");
const batchDraft = ref("");
const sequence = computed(() => sequenceText.value.split(/\r?\n/)
  .map((item) => item.trim()).filter(Boolean).map(parseCellInput));
const fillArea = computed(() => props.selection && !props.selection.additional?.length
  ? areaFromAddresses(props.selection.anchor, props.selection.focus) : undefined);
function canFill(direction: "down" | "right") {
  const area = fillArea.value;
  return !props.disabled && !!area &&
    (direction === "down" ? area.bottom > area.top : area.right > area.left) &&
    (fillMode.value !== "custom" || sequence.value.length > 0);
}
function fillSelection(direction: "down" | "right") {
  if (!canFill(direction)) return;
  if (fillMode.value === "custom") emit("fill", direction, "copy", sequence.value);
  else emit("fill", direction, fillMode.value);
}
const choicesFor = useSpreadsheetOptions();
const fillOptions = computed(() =>
  choicesFor([
    ["copy", "复制"],
    ["series", "数字与日期序列"],
    ["smart", "智能填充"],
    ["custom", "自定义序列"],
  ]),
);
const axisOptions = computed(() =>
  choicesFor([
    ["row", "行"],
    ["column", "列"],
  ]),
);
const filterOptions = computed(() => choicesFor(columnFilterOptions));
const pasteModes: { label: string; mode: HysSpreadsheetPasteMode }[] = [
  { label: "公式", mode: "formulas" },
  { label: "格式", mode: "formats" },
  { label: "转置", mode: "transpose" },
];
const colorControls = [
  { property: "color", label: "字体颜色", fallback: "#34435c" },
  { property: "backgroundColor", label: "填充颜色", fallback: "#d8e7ff" },
] as const;

function configure(options: {
  size?: number;
  hidden?: boolean;
  locked?: boolean;
  label?: string;
}) {
  if (props.index)
    emit("axis", {
      type: "configure",
      axis: axis.value,
      index: props.index[axis.value],
      options,
    });
}

function filterSelection() {
  if (!props.index) return;
  const numeric = ["gt", "gte", "lt", "lte"].includes(filterOperator.value);
  const value =
    numeric &&
    filter.value.trim() !== "" &&
    Number.isFinite(Number(filter.value))
      ? Number(filter.value)
      : filter.value;
  emit("data", {
    type: "filter",
    filters: [
      { column: props.index.column, operator: filterOperator.value, value },
    ],
    header: keepHeader.value,
  });
}
</script>

<template>
  <div class="command-panel">
    <template v-if="group === 'edit'">
      <div class="feature-panel">
        <div class="quick-edit">
          <HysButton
            size="sm"
            variant="ghost"
            :icon="Scissors"
            :disabled="disabled || !selection"
            @click="emit('cut')"
            >{{ message("剪切") }}</HysButton
          >
          <HysButton
            size="sm"
            variant="ghost"
            :icon="ClipboardPaste"
            :disabled="disabled || !selection"
            @click="emit('paste', 'values')"
            >{{ message("粘贴数值") }}</HysButton
          >
          <HysButton
            size="sm"
            variant="ghost"
            :icon="Merge"
            :disabled="disabled || !selection"
            @click="emit('merge', true)"
            >{{ message("合并") }}</HysButton
          >
          <HysButton
            size="sm"
            variant="ghost"
            :disabled="disabled || !selection"
            @click="emit('merge', false)"
            >{{ message("取消合并") }}</HysButton
          >
        </div>
        <section class="feature-fill">
          <h4>{{ message("填充方式") }}</h4>
          <div class="feature-fill-controls">
            <HysSelect
              v-model="fillMode"
              size="sm"
              :options="fillOptions"
              :native-label-tooltip="false"
              :aria-label="message('填充方式')"
            />
            <HysButton
              size="sm"
              variant="secondary"
              :icon="ArrowDown"
              :disabled="!canFill('down')"
              @click="fillSelection('down')"
              >{{ message("向下填充") }}</HysButton
            >
            <HysButton
              size="sm"
              variant="secondary"
              :icon="ArrowRight"
              :disabled="!canFill('right')"
              @click="fillSelection('right')"
              >{{ message("向右填充") }}</HysButton
            >
          </div>
          <HysTextarea
            v-if="fillMode === 'custom'"
            v-model="sequenceText"
            class="feature-edit-input"
            size="sm"
            :rows="3"
            :disabled="disabled"
            :aria-label="message('自定义序列，每行一项')"
            :placeholder="message('每行一项，例如：待办、进行中、已完成各占一行')"
          />
        </section>
        <HysAccordion
          class="feature-disclosure"
          ghost
          size="sm"
          multiple
          :items="[
            { id: 'batch', title: message('批量编辑选区') },
            { id: 'paste', title: message('其他粘贴选项') },
            { id: 'protection', title: message('保护与验证') },
          ]"
        >
          <template #title="{ item }">
            <component
              :is="item.id === 'batch' ? Pencil : item.id === 'paste' ? Copy : ShieldCheck"
              :size="17"
              aria-hidden="true"
            />
            {{ item.title }}
          </template>
          <template #icon="{ expanded }">
            <component :is="expanded ? ChevronDown : ChevronRight" :size="15" />
          </template>
          <template #content="{ item }">
            <div v-if="item.id === 'batch'" class="command-grid paired-controls">
              <HysTextarea
                v-model="batchDraft"
                size="sm"
                :rows="2"
                :disabled="disabled || !selection"
                :aria-label="message('批量编辑内容')"
                :placeholder="message('输入内容或公式')"
              />
              <HysButton
                variant="secondary"
                size="sm"
                :disabled="disabled || !selection"
                @click="emit('editSelection', batchDraft)"
                >{{ message("应用到选区") }}</HysButton
              >
            </div>
            <div v-else-if="item.id === 'paste'" class="command-grid two-controls">
              <HysButton
                v-for="{ label, mode } in pasteModes"
                :key="mode"
                size="sm"
                variant="secondary"
                :disabled="disabled || !selection"
                @click="emit('paste', mode)"
                >{{ message("粘贴" + label) }}</HysButton
              >
            </div>
            <div v-else class="command-grid two-controls">
              <HysButton
                size="sm"
                variant="secondary"
                :disabled="disabled || !selection"
                @click="
                  emit('configure', {
                    locked: !sheet.cells?.[selection!.anchor]?.locked,
                  })
                "
              >
                {{
                  message(
                    selection && sheet.cells?.[selection.anchor]?.locked
                      ? "解锁选区"
                      : "锁定选区",
                  )
                }}
              </HysButton>
              <HysButton
                size="sm"
                variant="secondary"
                @click="emit('validate')"
                >{{ message("验证工作表") }}</HysButton
              >
            </div>
          </template>
        </HysAccordion>
      </div>
    </template>
    <template v-else-if="group === 'axes'">
      <div class="feature-panel">
        <div
          class="axis-structure"
          role="group"
          :aria-label="message('插入与删除')"
        >
          <slot name="structure" />
        </div>
        <section class="feature-fill feature-section">
          <h4>{{ message("冻结") }}</h4>
          <div class="command-grid three-controls">
            <HysButton
              size="sm"
              variant="secondary"
              :disabled="disabled"
              @click="emit('axis', { type: 'freeze', rows: 1, columns: 0 })"
              >{{ message("冻结首行") }}</HysButton
            >
            <HysButton
              size="sm"
              variant="secondary"
              :disabled="disabled"
              @click="emit('axis', { type: 'freeze', rows: 0, columns: 1 })"
              >{{ message("冻结首列") }}</HysButton
            >
            <HysButton
              size="sm"
              variant="secondary"
              :disabled="disabled"
              @click="emit('axis', { type: 'freeze', rows: 0, columns: 0 })"
              >{{ message("取消冻结") }}</HysButton
            >
          </div>
        </section>
        <section class="feature-fill">
          <h4>{{ message("操作对象") }}</h4>
          <SpreadsheetFieldHint class="field" :text="message('对象')">
            <HysSelect
              v-model="axis"
              size="sm"
              :options="axisOptions"
              :native-label-tooltip="false"
              :aria-label="message('对象')"
            />
          </SpreadsheetFieldHint>
        </section>
        <HysAccordion
          class="feature-disclosure"
          ghost
          size="sm"
          multiple
          :items="[
            { id: 'dimensions', title: message('尺寸与标题') },
            { id: 'visibility', title: message('显示与分组') },
            { id: 'freeze', title: message('更多冻结选项') },
          ]"
        >
          <template #title="{ item }">
            <component
              :is="
                item.id === 'dimensions'
                  ? Ruler
                  : item.id === 'visibility'
                    ? Eye
                    : Snowflake
              "
              :size="17"
              aria-hidden="true"
            />
            {{ item.title }}
          </template>
          <template #icon="{ expanded }">
            <component :is="expanded ? ChevronDown : ChevronRight" :size="15" />
          </template>
          <template #content="{ item }">
            <div
              v-if="item.id === 'dimensions'"
              class="command-grid paired-controls"
            >
              <HysButton
                size="sm"
                variant="secondary"
                :disabled="disabled || !index"
                @click="emit('fit', axis)"
                >{{ message("自动适应") }}</HysButton
              >
              <SpreadsheetFieldHint class="field" :text="message('尺寸')">
                <HysNumberInput
                  v-model="dimension"
                  size="sm"
                  :min="16"
                  :max="1000"
                  :aria-label="message('尺寸')"
                />
              </SpreadsheetFieldHint>
              <HysButton
                size="sm"
                variant="secondary"
                :disabled="disabled || !index"
                @click="configure({ size: dimension })"
                >{{ message("应用尺寸") }}</HysButton
              >
              <HysInput
                v-model="label"
                size="sm"
                :placeholder="message('行列标题')"
                :aria-label="message('行列标题')"
              />
              <HysButton
                size="sm"
                variant="secondary"
                :disabled="disabled || !index"
                @click="configure({ label })"
                >{{ message("设为标题") }}</HysButton
              >
            </div>
            <div
              v-else-if="item.id === 'visibility'"
              class="command-grid two-controls"
            >
              <HysButton
                size="sm"
                variant="secondary"
                :disabled="disabled || !index"
                @click="configure({ hidden: true })"
                >{{ message("隐藏") }}</HysButton
              >
              <HysButton
                size="sm"
                variant="secondary"
                :disabled="disabled || !index"
                @click="
                  configure({
                    locked: !(
                      axis === 'row' ? sheet.rowOptions : sheet.columnOptions
                    )?.[index![axis]]?.locked,
                  })
                "
                >{{ message("切换行列锁定") }}</HysButton
              >
              <HysButton
                size="sm"
                variant="secondary"
                :disabled="disabled"
                @click="
                  emit('axis', {
                    type: 'configure',
                    axis,
                    index: 0,
                    count: axisCount(sheet, axis),
                    options: { hidden: false },
                  })
                "
                >{{ message("显示全部") }}</HysButton
              >
              <HysButton
                size="sm"
                variant="secondary"
                :disabled="disabled || !index"
                @click="
                  emit('axis', { type: 'copy', axis, index: index![axis] })
                "
                >{{ message("复制") }}</HysButton
              >
              <HysButton
                size="sm"
                variant="secondary"
                :disabled="disabled || !index"
                @click="
                  emit('axis', {
                    type: 'group',
                    axis,
                    index: index![axis],
                    count: 2,
                  })
                "
                >{{ message("分组两项") }}</HysButton
              >
              <HysButton
                size="sm"
                variant="secondary"
                :disabled="disabled || !index"
                @click="
                  emit('axis', {
                    type: 'toggleGroup',
                    axis,
                    index: index![axis],
                  })
                "
                >{{ message("展开或折叠分组") }}</HysButton
              >
            </div>
            <div v-else class="command-grid">
              <HysButton
                size="sm"
                variant="secondary"
                :disabled="disabled || !index"
                @click="
                  emit('axis', {
                    type: 'freeze',
                    rows: index!.row,
                    columns: index!.column,
                  })
                "
                >{{ message("冻结选区上方与左侧") }}</HysButton
              >
            </div>
          </template>
        </HysAccordion>
      </div>
    </template>
    <template v-else-if="group === 'data'">
      <div class="feature-panel">
        <div class="quick-edit" role="group" :aria-label="message('排序')">
          <HysButton
            v-for="direction in ['asc', 'desc'] as const"
            :key="direction"
            :icon="direction === 'asc' ? ArrowDownAZ : ArrowUpAZ"
            size="sm"
            variant="ghost"
            :disabled="disabled || !index"
            @click="
              emit('data', {
                type: 'sort',
                keys: [
                  { column: index!.column, direction },
                  ...(secondary && secondary - 1 !== index!.column
                    ? [{ column: secondary - 1, direction }]
                    : []),
                ],
                header: keepHeader,
              })
            "
            >{{ message(direction === "asc" ? "升序" : "降序") }}</HysButton
          >
          <HysButton
            size="sm"
            variant="ghost"
            :disabled="
              disabled || (!sheet.sortRowOrder && !sheet.sortKeys?.length)
            "
            @click="emit('data', { type: 'clearSort' })"
            >{{ message("取消排序") }}</HysButton
          >
        </div>
        <section class="feature-fill">
          <h4>{{ message("筛选") }}</h4>
          <div class="command-grid filter-controls">
            <HysInput
              v-model="filter"
              size="sm"
              :placeholder="message('筛选文本')"
              :aria-label="message('筛选文本')"
            />
            <SpreadsheetFieldHint class="field" :text="message('筛选条件')">
              <HysSelect
                v-model="filterOperator"
                size="sm"
                :options="filterOptions"
                :native-label-tooltip="false"
                :aria-label="message('筛选条件')"
              />
            </SpreadsheetFieldHint>
            <HysButton
              size="sm"
              variant="secondary"
              :disabled="disabled || !index"
              @click="filterSelection"
              >{{ message("筛选选中列") }}</HysButton
            >
            <HysButton
              size="sm"
              variant="secondary"
              :disabled="disabled || !sheet.filters?.length"
              @click="emit('data', { type: 'filter', filters: [] })"
              >{{ message("清除筛选") }}</HysButton
            >
          </div>
        </section>
        <HysAccordion
          class="feature-disclosure"
          ghost
          size="sm"
          multiple
          :items="[
            { id: 'sort', title: message('排序与标题设置') },
            { id: 'groups', title: message('去重与分组') },
            { id: 'text', title: message('文本处理') },
          ]"
        >
          <template #title="{ item }">
            <component
              :is="
                item.id === 'sort'
                  ? ArrowDownAZ
                  : item.id === 'groups'
                    ? Grid2X2
                    : Split
              "
              :size="17"
              aria-hidden="true"
            />
            {{ item.title }}
          </template>
          <template #icon="{ expanded }">
            <component :is="expanded ? ChevronDown : ChevronRight" :size="15" />
          </template>
          <template #content="{ item }">
            <div v-if="item.id === 'sort'" class="command-grid two-controls">
              <HysCheckbox
                v-model="keepHeader"
                size="sm"
                :label="message('保留首行标题')"
              />
              <SpreadsheetFieldHint
                class="field field-sort"
                :text="message('第二排序列（可选）')"
              >
                <HysNumberInput
                  v-model="secondary"
                  size="sm"
                  :min="1"
                  :max="sheet.columnCount"
                  :show-controls="false"
                  :placeholder="message('第二排序列')"
                  :aria-label="message('第二排序列（可选）')"
                />
              </SpreadsheetFieldHint>
            </div>
            <div
              v-else-if="item.id === 'groups'"
              class="command-grid two-controls"
            >
              <HysButton
                size="sm"
                variant="secondary"
                :disabled="disabled || !index"
                @click="
                  emit('data', {
                    type: 'deduplicate',
                    columns: [index!.column],
                    header: keepHeader,
                  })
                "
                >{{ message("按选中列去重") }}</HysButton
              >
              <HysButton
                size="sm"
                variant="secondary"
                :disabled="disabled || !index"
                @click="
                  emit('data', {
                    type: 'group',
                    column: index!.column,
                    header: true,
                  })
                "
                >{{ message("按选中列分组") }}</HysButton
              >
              <HysButton
                v-if="sheet.groupColumn !== undefined"
                size="sm"
                variant="secondary"
                :disabled="disabled"
                @click="emit('data', { type: 'group' })"
                >{{ message("清除分组") }}</HysButton
              >
            </div>
            <div v-else class="command-grid two-controls">
              <HysInput
                v-model="delimiter"
                class="full-control"
                size="sm"
                :aria-label="message('分隔符')"
                :placeholder="message('分隔符')"
              />
              <HysButton
                size="sm"
                variant="secondary"
                :disabled="disabled || !selection || !delimiter"
                @click="emit('data', { type: 'split', delimiter })"
                >{{ message("文本分列") }}</HysButton
              >
              <HysButton
                size="sm"
                variant="secondary"
                :disabled="disabled || !selection"
                @click="emit('data', { type: 'combine', delimiter })"
                >{{ message("合并文本") }}</HysButton
              >
            </div>
          </template>
        </HysAccordion>
      </div>
    </template>
    <template v-else-if="group === 'format'">
      <div class="feature-panel">
        <div
          class="quick-format"
          role="group"
          :aria-label="message('文字样式')"
        >
          <SpreadsheetToolbarButton
            :icon="Italic"
            :label="message('斜体')"
            :pressed="!!format?.italic"
            :disabled="disabled || !selection"
            @click="emit('format', { italic: !format?.italic })"
          />
          <SpreadsheetToolbarButton
            :icon="Underline"
            :label="message('下划线')"
            :pressed="!!format?.underline"
            :disabled="disabled || !selection"
            @click="emit('format', { underline: !format?.underline })"
          />
          <SpreadsheetToolbarButton
            :icon="WrapText"
            :label="message('换行')"
            :pressed="format?.overflow === 'wrap'"
            :disabled="disabled || !selection"
            @click="
              emit('format', {
                overflow: format?.overflow === 'wrap' ? 'clip' : 'wrap',
              })
            "
          />
        </div>
        <div class="feature-colors">
          <div
            v-for="{ property, label, fallback } in colorControls"
            :key="property"
            class="color-field"
          >
            <HysColorPicker
              :model-value="format?.[property] ?? fallback"
              size="sm"
              immediate="release"
              :show-footer="false"
              :disabled="disabled || !selection"
              :aria-label="message(label)"
              @update:model-value="emit('format', { [property]: $event })"
            >
              <template #trigger="{ value, disabled: unavailable, show }">
                <HysButton
                  class="color-trigger"
                  size="sm"
                  variant="secondary"
                  aria-haspopup="dialog"
                  :disabled="unavailable"
                  @click="show()"
                >
                  <span
                    class="color-swatch"
                    :style="{ backgroundColor: value }"
                    aria-hidden="true"
                  />
                  {{ message(label) }}
                  <ChevronDown
                    :size="14"
                    class="color-chevron"
                    aria-hidden="true"
                  />
                </HysButton>
              </template>
            </HysColorPicker>
          </div>
        </div>
        <div class="style-previews">
          <HysButton
            size="sm"
            variant="secondary"
            :disabled="disabled || !selection"
            @click="emit('style', 'title')"
            >{{ message("标题样式") }}</HysButton
          >
          <HysButton
            size="sm"
            variant="secondary"
            :aria-label="message('金额样式')"
            :disabled="disabled || !selection"
            @click="emit('style', 'amount')"
          >
            <span>{{ message("金额样式") }}</span>
            <span class="amount-preview" aria-hidden="true">¥1,080.00</span>
          </HysButton>
        </div>
        <HysAccordion
          class="feature-disclosure"
          ghost
          size="sm"
          multiple
          :items="[
            { id: 'brush', title: message('格式刷') },
            { id: 'conditional', title: message('条件格式') },
          ]"
        >
          <template #title="{ item }">
            <component
              :is="item.id === 'brush' ? Paintbrush : Grid2X2"
              :size="17"
              aria-hidden="true"
            />
            {{ item.title }}
          </template>
          <template #icon="{ expanded }">
            <component :is="expanded ? ChevronDown : ChevronRight" :size="15" />
          </template>
          <template #content="{ item }">
            <div v-if="item.id === 'brush'" class="command-grid three-controls">
              <HysButton
                size="sm"
                variant="ghost"
                :disabled="disabled || !selection"
                @click="emit('brush', false)"
                >{{ message("取格式") }}</HysButton
              >
              <HysButton
                size="sm"
                variant="ghost"
                :disabled="disabled || !selection"
                @click="emit('brush', true)"
                >{{ message("应用格式") }}</HysButton
              >
              <HysButton
                size="sm"
                variant="ghost"
                :disabled="disabled || !selection"
                @click="emit('format', null)"
                >{{ message("清除格式") }}</HysButton
              >
            </div>
            <div v-else class="command-grid two-controls">
              <HysInput
                v-model="criterion"
                size="sm"
                inputmode="decimal"
                :aria-label="message('高亮阈值')"
                :placeholder="message('高亮阈值')"
              />
              <HysButton
                size="sm"
                variant="ghost"
                :disabled="
                  disabled ||
                  !selection ||
                  (criterion !== '' && !Number.isFinite(Number(criterion)))
                "
                @click="
                  emit('conditional', {
                    type: 'greater',
                    value: Number(criterion),
                    range: selection!.anchor + ':' + selection!.focus,
                    format: {
                      backgroundColor: format?.backgroundColor ?? '#d8e7ff',
                    },
                  })
                "
                >{{ message("高亮较大值") }}</HysButton
              >
              <HysButton
                size="sm"
                variant="ghost"
                :disabled="disabled || !selection"
                @click="
                  emit('conditional', {
                    type: 'duplicate',
                    range: selection!.anchor + ':' + selection!.focus,
                  })
                "
                >{{ message("标记重复") }}</HysButton
              >
              <HysButton
                size="sm"
                variant="ghost"
                :disabled="disabled || !sheet.conditionalFormats?.length"
                @click="emit('conditional')"
                >{{ message("清除条件格式") }}</HysButton
              >
            </div>
          </template>
        </HysAccordion>
      </div>
    </template>
    <slot v-else-if="group === 'view'" name="view" />
    <p v-if="feedback" class="feedback" role="status">{{ feedback }}</p>
  </div>
</template>

<style scoped>
.command-panel {
  display: grid;
  gap: 10px;
  min-inline-size: 0;
  font-size: 13px;
}
.command-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 68px), 1fr));
  gap: 4px;
  align-items: start;
}
.two-controls {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.three-controls {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
.feature-panel {
  display: grid;
  min-inline-size: 0;
  gap: 14px;
  color: var(--hys-ui-theme-text);
}
.quick-edit,
.quick-format {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}
.quick-edit {
  padding-block-end: 10px;
  border-block-end: 1px solid var(--hys-ui-theme-border);
}
.quick-edit > :deep(.hys-ui-btn) {
  color: var(--hys-ui-theme-text);
}
.quick-edit :deep(.hys-ui-button-icon),
.feature-fill :deep(.hys-ui-button-icon),
.feature-disclosure :deep(.hys-ui-accordion-title-content > svg) {
  color: var(--hys-ui-theme-primary);
}
.quick-format :deep(.hys-ui-spreadsheet-icon-button) {
  inline-size: 34px;
  block-size: 34px;
  border-radius: 6px;
  border-color: var(--hys-ui-theme-border);
  color: var(--hys-ui-theme-text);
}
.quick-format :deep(.hys-ui-spreadsheet-icon-button[aria-pressed="true"]) {
  color: var(--hys-ui-theme-primary);
  background: var(--hys-ui-theme-primary-soft);
}
.feature-colors,
.style-previews {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}
.style-previews {
  border-block-start: 1px solid var(--hys-ui-theme-border);
  padding-block-start: 12px;
}
.style-previews > :deep(.hys-ui-btn) {
  flex-direction: column;
  gap: 2px;
  min-block-size: 60px;
  background: var(--hys-ui-theme-surface-alt);
  color: var(--hys-ui-theme-primary);
}
.amount-preview {
  font-size: 12px;
  font-weight: 400;
  color: var(--hys-ui-theme-text);
  font-variant-numeric: tabular-nums;
}
.feature-fill h4 {
  margin: 0 0 7px;
  font-size: inherit;
  font-weight: 500;
}
.feature-fill-controls {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) repeat(2, minmax(0, 1fr));
  gap: 8px;
}
.feature-fill-controls > :deep(*) {
  min-inline-size: 0;
}
.feature-fill-controls > :deep(.hys-ui-btn) {
  padding-inline: 6px;
}
.feature-edit-input {
  margin-block-start: 8px;
}
.feature-disclosure :deep(.hys-ui-accordion-item:first-child),
.feature-disclosure :deep(.hys-ui-accordion-item + .hys-ui-accordion-item) {
  border-block-start: 1px solid var(--hys-ui-theme-border);
}
.feature-disclosure :deep(.hys-ui-accordion-heading) {
  padding-inline: 0;
}
.feature-disclosure :deep(.hys-ui-accordion-title) {
  padding: 13px 3px;
  font-size: 13px;
}
.feature-disclosure :deep(.hys-ui-accordion-title-content) {
  display: flex;
  align-items: center;
  gap: 8px;
}
.feature-disclosure :deep(.hys-ui-ex-accordion-body) {
  padding-inline: 0;
}
.command-grid > :deep(*) {
  min-inline-size: 0;
}
.command-grid > :deep(.hys-ui-btn) {
  justify-content: flex-start;
  min-block-size: 30px;
  padding-inline: 6px;
  white-space: normal;
  text-align: start;
  line-height: 1.35;
}
.axis-structure {
  display: flex;
  flex-wrap: wrap;
  gap: 5px 7px;
  align-items: center;
}
.axis-structure > :deep(.hys-ui-spreadsheet-row-insert) {
  justify-content: flex-start;
}
.axis-structure > :deep(.hys-ui-btn) {
  padding-inline: 7px;
  color: var(--hys-ui-theme-text);
}
.axis-structure :deep(.hys-ui-button-icon) {
  color: var(--hys-ui-theme-primary);
}
.feature-section {
  border-block-start: 1px solid var(--hys-ui-theme-border);
  padding-block-start: 12px;
}
.paired-controls,
.filter-controls {
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
}
.full-control {
  grid-column: 1 / -1;
}
.color-field :deep(.hys-ui-pf-color-picker),
.color-field :deep(.hys-ui-color-custom-trigger),
.color-trigger {
  inline-size: 100%;
}
.color-trigger {
  justify-content: flex-start;
  padding-inline: 7px;
}
.color-chevron {
  margin-inline-start: auto;
  color: var(--hys-ui-theme-muted);
}
.color-swatch {
  inline-size: 14px;
  block-size: 14px;
  flex: none;
  border-radius: 3px;
  box-shadow: inset 0 0 0 1px var(--hys-ui-theme-border);
}
.feedback {
  margin: 0;
  color: var(--hys-ui-theme-muted);
}
@container spreadsheet-command-panel (max-width: 355px) {
  .axis-structure {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .axis-structure > :deep(.hys-ui-spreadsheet-row-insert) {
    grid-column: 1 / -1;
  }
  .feature-fill-controls {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .feature-fill-controls > :deep(.hys-ui-select-wrap) {
    grid-column: 1 / -1;
  }
}
</style>
