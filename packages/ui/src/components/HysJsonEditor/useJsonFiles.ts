import { onBeforeUnmount, onDeactivated, ref, shallowRef, watch, type Ref } from "vue";
import { readJsonFile } from "./jsonDocument";

export function useJsonFiles(
  source: Ref<string>,
  editable: Readonly<Ref<boolean>>,
  disabled: Readonly<Ref<boolean>>,
  message: Ref<string>,
  replace: (text: string) => boolean,
) {
  const open = ref(false);
  const busy = ref(false);
  const error = ref("");
  const candidate = shallowRef<{ name: string; text: string }>();
  let revision = 0;
  let url: string | undefined;

  function close() {
    revision++;
    open.value = busy.value = false;
    candidate.value = undefined;
    error.value = "";
  }
  function begin() {
    if (editable.value) {
      message.value = "";
      open.value = true;
    }
  }
  function confirm() {
    if (!editable.value || !candidate.value) return;
    const { name, text } = candidate.value;
    if (text !== source.value && !replace(text)) {
      error.value = "当前无法替换源码，请结束编辑后重试。";
      return;
    }
    close();
    message.value = `已导入 ${name}`;
  }
  async function select(files: File[]) {
    const file = files[0];
    if (!file || !editable.value || !open.value) return;
    const ticket = ++revision;
    busy.value = true;
    error.value = "";
    try {
      const text = await readJsonFile(file);
      if (ticket !== revision || !editable.value) return;
      candidate.value = { name: file.name, text };
      if (!source.value.trim()) confirm();
    } catch (failure) {
      if (ticket === revision) error.value = failure instanceof Error ? failure.message : "无法读取文件。";
    } finally {
      if (ticket === revision) busy.value = false;
    }
  }
  async function copy(value: string, label: string) {
    if (disabled.value) return;
    const ticket = revision;
    let result: string;
    try {
      await navigator.clipboard.writeText(value);
      result = `已复制${label}`;
    } catch {
      result = "无法访问剪贴板，请选中文本后手动复制。";
    }
    if (ticket === revision && !disabled.value) message.value = result;
  }
  function revokeUrl() {
    if (url) URL.revokeObjectURL(url);
    url = undefined;
  }
  function download(value = source.value, name = "document.json", type = "application/json") {
    if (disabled.value) return;
    try {
      revokeUrl();
      url = URL.createObjectURL(new Blob([value], { type: type + ";charset=utf-8" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = name;
      document.body.append(link);
      try { link.click(); } finally { link.remove(); }
    } catch {
      message.value = "下载失败，请复制 JSON 后另存为文件。";
    }
  }

  watch(source, () => { if (open.value) close(); });
  watch(editable, value => { if (!value) close(); });
  onDeactivated(close);
  onBeforeUnmount(() => { close(); revokeUrl(); });
  return { open, busy, error, candidate, begin, close, confirm, select, copy, download };
}
