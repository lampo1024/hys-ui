<script setup lang="ts">
import { useSpreadsheetMessages } from "../spreadsheetMessages";
const message = useSpreadsheetMessages();
import { computed, ref, watch } from "vue";
import HysButton from "../../HysButton/HysButton.vue";
import HysInput from "../../HysInput/HysInput.vue";
import HysSelect from "../../HysSelect/HysSelect.vue";
import type {
  HysSpreadsheetComment,
  HysSpreadsheetInstance,
  HysSpreadsheetVersion,
} from "../spreadsheetTypes";

const props = defineProps<{
  panel: "comments" | "history";
  versions?: readonly HysSpreadsheetVersion[];
  compare?: HysSpreadsheetInstance["compareVersions"];
  comments?: readonly HysSpreadsheetComment[];
  address?: string;
  readonly?: boolean;
  commentsDisabled?: boolean;
  locale?: string;
}>();
const emit = defineEmits<{
  restore: [id: string];
  comment: [text: string, parentId?: string];
  resolve: [id: string, resolved: boolean];
}>();
const version = ref("");
const draft = ref("");
const replyTo = ref("");
const differences = computed(() =>
  version.value ? (props.compare?.(version.value) ?? []) : [],
);
const labels: Record<HysSpreadsheetVersion["action"], string> = {
  edit: "编辑",
  paste: "粘贴",
  format: "格式",
  structure: "结构",
  undo: "撤销",
  redo: "重做",
  open: "打开",
  save: "保存",
  restore: "恢复",
  remote: "协作更新",
};
const versionOptions = computed(() =>
  [...(props.versions ?? [])].reverse().map((entry) => ({
    value: entry.id,
    label: `${message(labels[entry.action])} · ${new Date(entry.timestamp).toLocaleTimeString(props.locale)}${entry.author ? ` · ${entry.author}` : ""}`,
  })),
);
watch(
  () => props.address,
  () => {
    draft.value = "";
    replyTo.value = "";
  },
);
function submit() {
  if (!draft.value.trim()) return;
  emit("comment", draft.value, replyTo.value || undefined);
  draft.value = "";
  replyTo.value = "";
}
</script>

<template>
  <div class="hys-ui-spreadsheet-history">
    <template v-if="panel === 'comments'">
      <div v-if="address" class="entries">
        <p class="address">{{ address }}</p>
        <ul v-if="comments?.length" class="hys-ui-scrollbar">
          <li
            v-for="comment in comments"
            :key="comment.id"
            :class="{ reply: comment.parentId }"
          >
            <span
              >{{ comment.author
              }}{{ comment.resolved ? " · 已解决" : "" }}</span
            >
            <p>{{ comment.text }}</p>
            <HysButton
              v-if="!commentsDisabled"
              size="sm"
              variant="ghost"
              @click="replyTo = comment.id"
              >{{ message("回复") }}</HysButton
            >
            <HysButton
              v-if="!commentsDisabled"
              size="sm"
              variant="ghost"
              @click="emit('resolve', comment.id, !comment.resolved)"
              >{{ comment.resolved ? "重新打开" : "解决" }}</HysButton
            >
          </li>
        </ul>
        <div v-if="!commentsDisabled" class="actions">
          <HysInput
            v-model="draft"
            size="sm"
            :placeholder="replyTo ? '写回复' : '添加批注，可使用 @名称'"
            :aria-label="message('批注内容')"
            @press-enter="submit"
          />
          <HysButton
            size="sm"
            variant="ghost"
            :disabled="!draft.trim()"
            @click="submit"
            >{{ replyTo ? "发送回复" : "添加批注" }}</HysButton
          >
          <HysButton
            v-if="replyTo"
            size="sm"
            variant="ghost"
            @click="replyTo = ''"
            >{{ message("取消回复") }}</HysButton
          >
        </div>
      </div>
      <p v-else>{{ message("选择单元格后查看批注。") }}</p>
    </template>
    <template v-else>
      <div v-if="versions?.length" class="entries">
        <div class="actions">
          <HysSelect
            v-model="version"
            class="version-select"
            size="sm"
            :options="versionOptions"
            :placeholder="message('选择版本')"
            :native-label-tooltip="false"
            :aria-label="message('版本')"
          />
          <HysButton
            size="sm"
            variant="ghost"
            :disabled="readonly || !version"
            @click="emit('restore', version)"
            >{{ message("恢复此版本") }}</HysButton
          >
        </div>
        <div v-if="version" aria-live="polite">
          <p>{{ differences.length }} {{ message("格内容有变化") }}</p>
          <ul class="hys-ui-scrollbar">
            <li
              v-for="cell in differences.slice(0, 25)"
              :key="cell.sheetId + cell.address"
            >
              {{ cell.sheetId }} / {{ cell.address }} ·
              {{ cell.before ?? "空" }} → {{ cell.after ?? "空" }}
            </li>
          </ul>
        </div>
      </div>
      <p v-else>{{ message("暂无版本记录。") }}</p>
    </template>
  </div>
</template>

<style scoped>
.hys-ui-spreadsheet-history {
  font-size: 13px;
}
.address {
  font-weight: 600;
}
.entries {
  display: grid;
  gap: 8px;
  max-width: 520px;
}
.actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
}
.actions :deep(.hys-ui-input-wrap) {
  flex: 1 1 150px;
  min-width: 0;
}
ul {
  list-style: none;
  padding: 0;
  margin: 0;
  max-height: 170px;
  overflow: auto;
}
li {
  padding: 4px 0;
  overflow-wrap: anywhere;
}
li.reply {
  padding-inline-start: 14px;
}
p {
  margin: 4px 0;
}
.version-select {
  inline-size: min(200px, 100%);
}
</style>
