import { computed, onBeforeUnmount, ref, shallowRef, watch, type Ref } from "vue";
import type { MarkdownPreview } from "./markdownPreview";
import type { HysMarkdownEditorView } from "./markdownSource";

export function useMarkdownPreview(
  source: Readonly<Ref<string>>,
  mode: Readonly<Ref<HysMarkdownEditorView>>,
  active: Readonly<Ref<boolean>>,
  id: string,
  status: Ref<string>,
) {
  type Snapshot = { source: string; content: MarkdownPreview };
  const previewSource = ref(source.value);
  const visited = ref(mode.value !== "edit");
  const rendered = shallowRef<Snapshot>();
  const outline = shallowRef<Snapshot>();
  const outlinePending = ref(false);
  let timer: ReturnType<typeof setTimeout> | undefined;
  let outlineRequest = 0;

  function refreshPreview() {
    clearTimeout(timer);
    if (active.value && mode.value !== "edit") {
      previewSource.value = source.value;
      visited.value = true;
    }
  }
  watch(source, () => {
    clearTimeout(timer);
    if (active.value && mode.value !== "edit") timer = setTimeout(refreshPreview, 100);
  });
  watch([mode, active], refreshPreview);
  onBeforeUnmount(() => {
    clearTimeout(timer);
    outlineRequest++;
  });

  const current = computed(() => previewSource.value === source.value);
  const currentOutline = computed(() => {
    if (rendered.value?.source === source.value) return rendered.value;
    if (outline.value?.source === source.value) return outline.value;
    return undefined;
  });
  const headings = computed(() => currentOutline.value?.content.headings ?? []);
  async function prepareOutline() {
    if (currentOutline.value) return currentOutline.value.content.headings;
    const token = ++outlineRequest;
    outlinePending.value = true;
    try {
      const { parseMarkdown } = await import("./markdownPreview");
      if (!active.value || token !== outlineRequest) return [];
      const value = source.value;
      const content = parseMarkdown(value, id);
      outline.value = { source: value, content };
      return content.headings;
    } catch {
      if (active.value && token === outlineRequest) status.value = "无法加载 Markdown 标题大纲，请重试。";
      return [];
    } finally {
      if (token === outlineRequest) outlinePending.value = false;
    }
  }

  function receivePreview(source: string, content: MarkdownPreview) {
    rendered.value = { source, content };
  }

  return { visited, previewSource, rendered, current, headings, outlinePending, prepareOutline, receivePreview };
}
