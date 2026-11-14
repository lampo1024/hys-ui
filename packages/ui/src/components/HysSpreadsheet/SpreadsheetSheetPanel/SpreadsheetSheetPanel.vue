<script setup lang="ts">
import { useSpreadsheetMessages } from "../spreadsheetMessages";
const message = useSpreadsheetMessages();
import { computed, ref, watch } from "vue";
import HysButton from "../../HysButton/HysButton.vue";
import HysColorPicker from "../../HysColorPicker/HysColorPicker.vue";
import HysInput from "../../HysInput/HysInput.vue";
import SpreadsheetFieldHint from "../SpreadsheetFieldHint/SpreadsheetFieldHint.vue";
import { sheetLimits } from "../spreadsheetModel";
import type {
  HysSpreadsheetSheet,
  HysSpreadsheetSheetCommand,
} from "../spreadsheetTypes";

const props = defineProps<{
  sheets: readonly HysSpreadsheetSheet[];
  active: string;
  readonly?: boolean;
  templates?: Readonly<
    Record<string, Omit<HysSpreadsheetSheet, "id" | "name">>
  >;
}>();
const emit = defineEmits<{
  select: [id: string];
  command: [command: HysSpreadsheetSheetCommand];
  delete: [id: string, event: MouseEvent];
}>();
const query = ref("");
const name = ref("");
const activeIndex = computed(() =>
  props.sheets.findIndex(({ id }) => id === props.active),
);
const activeSheet = computed(() => props.sheets[activeIndex.value]);
const visible = computed(
  () => props.sheets.filter(({ hidden }) => !hidden).length,
);
const matches = computed(() =>
  props.sheets.filter(({ name }) =>
    name.toLowerCase().includes(query.value.trim().toLowerCase()),
  ),
);
watch(
  () => activeSheet.value?.name,
  (value) => (name.value = value ?? ""),
  { immediate: true },
);

function move(event: DragEvent, target: string) {
  const id = event.dataTransfer?.getData("application/x-hys-sheet");
  if (id && !props.readonly) {
    emit("command", {
      type: "move",
      id,
      index: props.sheets.findIndex((sheet) => sheet.id === target),
    });
  }
}
</script>

<template>
  <div class="sheet-controls">
    <div v-if="!readonly" class="sheet-actions">
      <HysButton
        size="sm"
        variant="secondary"
        :disabled="sheets.length >= sheetLimits.sheets"
        @click="emit('command', { type: 'add' })"
        >{{ message("新增工作表") }}</HysButton
      >
      <HysButton
        size="sm"
        variant="ghost"
        :disabled="visible < 2 || !activeSheet"
        @click="emit('delete', active, $event)"
        >{{ message("删除工作表") }}</HysButton
      >
    </div>
    <HysInput
      v-model="query"
      size="sm"
      :aria-label="message('搜索工作表')"
      :placeholder="message('搜索工作表')"
    />
    <ul class="sheet-list" :aria-label="message('工作表')">
      <li
        v-for="item in matches"
        :key="item.id"
        :draggable="!readonly"
        @dragstart="
          $event.dataTransfer?.setData('application/x-hys-sheet', item.id)
        "
        @dragover.prevent
        @drop.prevent="move($event, item.id)"
      >
        <i
          v-if="item.tabColor"
          :style="{ backgroundColor: item.tabColor }"
          aria-hidden="true"
        />
        <HysButton
          v-if="!item.hidden"
          size="sm"
          variant="ghost"
          :pressed="item.id === active"
          @click="emit('select', item.id)"
        >
          {{ item.name }}
        </HysButton>
        <HysButton
          v-else
          size="sm"
          variant="ghost"
          :disabled="readonly"
          @click="
            emit('command', {
              type: 'visibility',
              id: item.id,
              hidden: false,
            })
          "
        >
          {{ message("显示") }} {{ item.name }}
        </HysButton>
      </li>
      <li v-if="!matches.length">{{ message("没有匹配的工作表") }}</li>
    </ul>
    <template v-if="activeSheet && !readonly">
      <div class="sheet-rename">
        <HysInput
          v-model="name"
          size="sm"
          :aria-label="message('工作表名称')"
          @press-enter="emit('command', { type: 'rename', id: active, name })"
        />
        <HysButton
          size="sm"
          variant="ghost"
          @click="emit('command', { type: 'rename', id: active, name })"
          >{{ message("重命名") }}</HysButton
        >
      </div>
      <div class="sheet-actions">
        <HysButton
          size="sm"
          variant="ghost"
          :disabled="sheets.length >= sheetLimits.sheets"
          @click="emit('command', { type: 'duplicate', id: active })"
          >{{ message("复制") }}</HysButton
        >
        <HysButton
          size="sm"
          variant="ghost"
          :disabled="activeIndex <= 0"
          @click="
            emit('command', {
              type: 'move',
              id: active,
              index: activeIndex - 1,
            })
          "
          >{{ message("左移") }}</HysButton
        >
        <HysButton
          size="sm"
          variant="ghost"
          :disabled="activeIndex >= sheets.length - 1"
          @click="
            emit('command', {
              type: 'move',
              id: active,
              index: activeIndex + 1,
            })
          "
          >{{ message("右移") }}</HysButton
        >
        <HysButton
          size="sm"
          variant="ghost"
          :disabled="visible <= 1"
          @click="
            emit('command', { type: 'visibility', id: active, hidden: true })
          "
          >{{ message("隐藏") }}</HysButton
        >
        <HysButton
          size="sm"
          variant="ghost"
          @click="
            emit('command', {
              type: 'protect',
              id: active,
              protected: !activeSheet.protected,
            })
          "
        >
          {{ activeSheet.protected ? "取消保护" : "保护工作表" }}
        </HysButton>
        <SpreadsheetFieldHint class="sheet-color" :text="message('标签颜色')">
          <HysColorPicker
            size="sm"
            :aria-label="message('标签颜色')"
            :immediate="false"
            :model-value="activeSheet.tabColor || '#4468c8'"
            @change="
              emit('command', {
                type: 'color',
                id: active,
                color: $event,
              })
            "
          />
        </SpreadsheetFieldHint>
        <HysButton
          v-if="activeSheet.tabColor"
          size="sm"
          variant="ghost"
          @click="emit('command', { type: 'color', id: active })"
          >{{ message("清除颜色") }}</HysButton
        >
      </div>
      <div
        v-if="templates && Object.keys(templates).length"
        class="sheet-actions"
      >
        <HysButton
          v-for="(template, label) in templates"
          :key="label"
          size="sm"
          variant="ghost"
          :disabled="sheets.length >= sheetLimits.sheets"
          @click="emit('command', { type: 'add', name: label, template })"
        >
          {{ message("新建") }} {{ label }}
        </HysButton>
      </div>
    </template>
  </div>
</template>

<style scoped>
.sheet-controls {
  display: grid;
  gap: 8px;
  max-width: 540px;
}
.sheet-list,
.sheet-actions,
.sheet-rename {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
}
.sheet-list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.sheet-list li {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.sheet-list i {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.sheet-rename > :first-child {
  flex: 1 1 120px;
  min-width: 0;
}
.sheet-color :deep(.hys-ui-pf-color-picker) {
  inline-size: 80px;
}
</style>
