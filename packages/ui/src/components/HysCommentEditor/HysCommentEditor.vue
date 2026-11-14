<script setup lang="ts">
import { computed, ref, onBeforeUnmount, onDeactivated } from "vue";
import { useHysRootAttrs } from "../../config";

export interface Comment {
  id: string;
  author: string;
  text: string;
  time?: string;
  removable?: boolean;
}
const props = defineProps<{
  comments: Comment[];
  disabled?: boolean;
  maxLength?: number;
  submitting?: boolean;
  placeholder?: string;
  submit?: (text: string, signal: AbortSignal) => unknown | PromiseLike<unknown>;
}>();
const emit = defineEmits<{ send: [text: string]; remove: [id: string]; sendError: [error: unknown, text: string] }>();
const draft = defineModel<string>("draft", { default: "" });
const hysRootAttrs = useHysRootAttrs();
const maximum = computed(() =>
  typeof props.maxLength === "number" &&
  Number.isFinite(props.maxLength) &&
  props.maxLength >= 0
    ? Math.floor(props.maxLength)
    : undefined,
);
const length = computed(() => Array.from(draft.value).length);
const tooLong = computed(
  () => maximum.value !== undefined && length.value > maximum.value,
);
const pending = ref(false);
const failed = ref(false);
let task: AbortController | undefined;
function cancel() {
  task?.abort();
  task = undefined;
  pending.value = false;
}
onBeforeUnmount(cancel);
onDeactivated(cancel);
const busy = computed(() => pending.value || props.submitting);
const blocked = computed(() => props.disabled || busy.value);
async function send() {
  const text = draft.value.trim();
  if (!text || tooLong.value || blocked.value) return;
  failed.value = false;
  if (!props.submit) {
    draft.value = "";
    emit("send", text);
    return;
  }
  const submitted = draft.value;
  const controller = new AbortController();
  task = controller;
  pending.value = true;
  try {
    await props.submit(text, controller.signal);
  } catch (error) {
    if (!controller.signal.aborted) {
      failed.value = true;
      emit("sendError", error, text);
    }
    return;
  } finally {
    if (task === controller) {
      task = undefined;
      pending.value = false;
    }
  }
  if (controller.signal.aborted) return;
  if (draft.value === submitted) draft.value = "";
  emit("send", text);
}
function keyboard(event: KeyboardEvent) {
  if (
    event.key !== "Enter" ||
    (!event.ctrlKey && !event.metaKey) ||
    event.isComposing ||
    event.keyCode === 229
  )
    return;
  event.preventDefault();
  send();
}
</script>

<template>
  <section
    v-bind="hysRootAttrs"
    class="hys-ui-ent-panel"
    :aria-busy="busy || undefined"
  >
    <div
      v-for="comment in comments"
      :key="comment.id"
      class="hys-ui-ent-comment"
    >
      <strong>{{ comment.author }}</strong>
      <small v-if="comment.time">{{ comment.time }}</small>
      <p>{{ comment.text }}</p>
      <button
        v-if="comment.removable !== false"
        type="button"
        :disabled="blocked"
        @click="emit('remove', comment.id)"
      >
        删除
      </button>
    </div>
    <div class="hys-comment-compose">
      <textarea
        v-model="draft"
        aria-label="评论内容"
        :aria-invalid="tooLong || undefined"
        :placeholder="placeholder ?? '输入评论，Ctrl 或 Command + Enter 发送'"
        :disabled="disabled"
        @keydown="keyboard"
      />
      <div class="hys-comment-footer">
        <span
          v-if="maximum !== undefined"
          class="hys-ui-ent-muted"
          :class="{ 'hys-ui-ent-error': tooLong }"
          >{{ length }} / {{ maximum }}</span
        >
        <button
          type="button"
          :disabled="blocked || tooLong || !draft.trim()"
          @click="send"
        >
          {{ busy ? "发送中" : "发送评论" }}
        </button>
      </div>
      <span v-if="failed" class="hys-ui-ent-error" role="alert">发送失败，草稿已保留。可再次发送。</span>
    </div>
  </section>
</template>

<style scoped>
.hys-comment-compose {
  display: grid;
  gap: 8px;
  margin-block-start: 10px;
}
.hys-comment-footer {
  display: flex;
  align-items: center;
  justify-content: end;
  gap: 10px;
  font-size: 13px;
}
.hys-ui-ent-comment p {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
</style>
