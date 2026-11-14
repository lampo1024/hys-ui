import { onBeforeUnmount, ref, shallowRef, type Ref } from "vue";
import { readMarkdownFile } from "./markdownSource";

export function useMarkdownFiles(
  source: Ref<string>,
  editable: Readonly<Ref<boolean>>,
  disabled: Readonly<Ref<boolean>>,
  status: Ref<string>,
  replace: (text: string) => boolean,
) {
  const importing = ref(false);
  const busy = ref(false);
  const candidate = shallowRef<{ name: string; text: string }>();
  let epoch = 0;
  let downloadUrl: string | undefined;

  function cancel() {
    epoch++;
    importing.value = false;
    busy.value = false;
    candidate.value = undefined;
  }
  function open() {
    if (editable.value) {
      status.value = "";
      importing.value = true;
    }
  }
  function commit() {
    if (!editable.value || !candidate.value) return;
    const { name, text } = candidate.value;
    cancel();
    if (text !== source.value && !replace(text)) return;
    status.value = `已导入 ${name}`;
  }
  async function select(files: File[]) {
    const file = files[0];
    if (!file || !editable.value || !importing.value) return;
    const ticket = ++epoch;
    busy.value = true;
    status.value = "";
    try {
      const text = await readMarkdownFile(file);
      if (ticket !== epoch || !editable.value) return;
      candidate.value = { name: file.name, text };
      if (!source.value) commit();
    } catch (error) {
      if (ticket === epoch) status.value = error instanceof Error ? error.message : "读取文件失败。";
    } finally {
      if (ticket === epoch) busy.value = false;
    }
  }
  async function copy(text: string, label = "Markdown") {
    if (disabled.value) return;
    const ticket = epoch;
    try {
      await navigator.clipboard.writeText(text);
      if (ticket === epoch && !disabled.value) status.value = `已复制 ${label}`;
    } catch {
      if (ticket === epoch && !disabled.value) status.value = "无法访问剪贴板，请选中文字后手动复制。";
    }
  }
  function download() {
    if (disabled.value) return;
    try {
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
      downloadUrl = URL.createObjectURL(new Blob([source.value], { type: "text/markdown;charset=utf-8" }));
      const anchor = document.createElement("a");
      anchor.href = downloadUrl;
      anchor.download = "document.md";
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
    } catch {
      status.value = "下载失败，请复制 Markdown 后另存为文件。";
    }
  }
  onBeforeUnmount(() => {
    cancel();
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
  });
  return { importing, busy, candidate, open, cancel, select, commit, copy, download };
}
