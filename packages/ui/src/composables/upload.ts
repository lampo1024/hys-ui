import type { CSSProperties, VNodeChild } from "vue";
export type HysUploadStatus = "ready" | "uploading" | "success" | "error";
export type HysUploadListType = "text" | "picture" | "picture-card";
export interface HysUploadItem {
  uid: string;
  name: string;
  size?: number;
  raw?: File;
  status?: HysUploadStatus;
  percentage?: number;
  response?: unknown;
  error?: Error;
  url?: string;
  thumbUrl?: string;
  type?: string;
  relativePath?: string;
}
/** The original local-file contract remains the default generic. */
export interface HysUploadFile extends HysUploadItem {
  size: number;
  raw: File;
}
export type HysUploadChangeType =
  | "select"
  | "remove"
  | "clear"
  | "reset"
  | "start"
  | "progress"
  | "success"
  | "error"
  | "abort"
  | "retry";
export interface HysUploadChange<T extends HysUploadItem = HysUploadFile> {
  type: HysUploadChangeType;
  files: readonly T[];
  changed: readonly T[];
}
export interface HysUploadContext<T extends HysUploadItem = HysUploadFile> {
  signal: AbortSignal;
  files: readonly T[];
}
export interface HysUploadInvalid<T extends HysUploadItem = HysUploadFile> {
  reason: "type" | "size" | "validation" | "identity";
  file: File;
  message: string;
  files: readonly T[];
}
export interface HysUploadError extends Error {
  status?: number;
  response?: unknown;
  url?: string;
  method?: string;
  kind?: "http" | "network" | "timeout" | "configuration" | "custom";
}
export type HysUploadDataScalar =
  string | number | boolean | Blob | null | undefined;
export type HysUploadData = Record<
  string,
  HysUploadDataScalar | readonly HysUploadDataScalar[]
>;
export interface HysUploadRequestOptions<
  T extends HysUploadItem = HysUploadFile,
> extends HysUploadContext<T> {
  file: T;
  body: Blob;
  action: string;
  method: string;
  name: string;
  headers: Record<string, string>;
  data: HysUploadData;
  withCredentials: boolean;
  timeout: number;
  onProgress: (percentage: number) => void;
  onSuccess: (response: unknown) => void;
  onError: (error: unknown) => void;
}
export type HysUploadRequestResult =
  | void
  | Promise<unknown>
  | (() => void)
  | { abort?: () => void; promise?: Promise<unknown> };
export interface HysUploadLocale {
  choose: string;
  drag: string;
  checking: string;
  localHint: string;
  uploadHint: string;
  files: string;
  ready: string;
  uploading: string;
  success: string;
  error: string;
  queued: string;
  removing: string;
  submit: string;
  abort: string;
  retry: string;
  clear: string;
  remove: string;
  preview: string;
  download: string;
  empty: string;
}
export const uploadLocale: HysUploadLocale = {
  choose: "选择文件",
  drag: "点击选择或拖入文件",
  checking: "正在检查文件…",
  localHint: "文件通过事件交给业务层上传",
  uploadHint: "支持选择、拖入和上传进度管理",
  files: "文件列表",
  ready: "待上传",
  uploading: "上传中",
  success: "已完成",
  error: "上传失败",
  queued: "等待上传",
  removing: "正在移除",
  submit: "开始上传",
  abort: "取消上传",
  retry: "重试",
  clear: "清空",
  remove: "移除",
  preview: "预览",
  download: "下载",
  empty: "暂无文件",
};
export interface HysUploadProps<T extends HysUploadItem = HysUploadFile> {
  fileList?: readonly T[];
  modelValue?: readonly T[];
  defaultFileList?: readonly T[];
  defaultValue?: readonly T[];
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  loading?: boolean;
  limit?: number;
  maxSize?: number;
  drag?: boolean;
  paste?: boolean;
  directory?: boolean;
  showFileList?: boolean;
  listType?: HysUploadListType;
  listHeight?: number | string;
  size?: "sm" | "md" | "lg";
  showToolbar?: boolean;
  showPreview?: boolean;
  showDownload?: boolean;
  showRemove?: boolean;
  showRetry?: boolean;
  openFileDialogOnClick?: boolean;
  autoUpload?: boolean;
  concurrency?: number;
  action?:
    | string
    | ((file: T, context: HysUploadContext<T>) => string | Promise<string>);
  method?: string;
  name?: string;
  headers?:
    | Record<string, string>
    | ((
        file: T,
        context: HysUploadContext<T>,
      ) => Record<string, string> | Promise<Record<string, string>>);
  data?:
    | HysUploadData
    | ((
        file: T,
        context: HysUploadContext<T>,
      ) => HysUploadData | Promise<HysUploadData>);
  withCredentials?: boolean;
  timeout?: number;
  customRequest?: (
    options: HysUploadRequestOptions<T>,
  ) => HysUploadRequestResult;
  beforeUpload?: (
    file: File,
    context: HysUploadContext<T>,
  ) => boolean | void | File | Blob | Promise<boolean | void | File | Blob>;
  beforeRemove?: (
    file: T,
    files: readonly T[],
    context: HysUploadContext<T>,
  ) => boolean | void | Promise<boolean | void>;
  createFile?: (raw: File, uid: string) => T;
  previewFile?: (
    file: T,
    context: HysUploadContext<T>,
  ) => string | false | Promise<string | false>;
  downloadFile?: (
    file: T,
    context: HysUploadContext<T>,
  ) => void | boolean | string | Promise<void | boolean | string>;
  locale?: Partial<HysUploadLocale>;
  ariaLabel?: string;
  triggerLabel?: string;
  error?: string;
  validateEvent?: boolean;
  listStyle?: CSSProperties;
}
export interface HysUploadActions {
  preview: () => Promise<boolean>;
  download: () => Promise<boolean>;
  remove: () => Promise<boolean>;
  retry: () => Promise<boolean>;
  abort: () => number;
}
export interface HysUploadFileContext<T extends HysUploadItem = HysUploadFile> {
  file: T;
  status: HysUploadStatus;
  percentage: number;
  queued: boolean;
  busy: boolean;
  actions: HysUploadActions;
  thumbnail?: string;
}
export interface HysUploadSlotContext<T extends HysUploadItem = HysUploadFile> {
  files: readonly T[];
  busy: boolean;
  disabled: boolean;
  uploading: number;
  queued: number;
  open: (event?: Event) => void;
  submit: () => Promise<number>;
  abort: () => number;
  clear: () => Promise<boolean>;
}
export interface HysUploadSlots<T extends HysUploadItem = HysUploadFile> {
  default?: (scope: HysUploadSlotContext<T>) => VNodeChild;
  trigger?: (scope: HysUploadSlotContext<T>) => VNodeChild;
  tip?: (scope: HysUploadSlotContext<T>) => VNodeChild;
  toolbar?: (scope: HysUploadSlotContext<T>) => VNodeChild;
  file?: (scope: HysUploadFileContext<T>) => VNodeChild;
  item?: (scope: HysUploadFileContext<T>) => VNodeChild;
  empty?: (scope: HysUploadSlotContext<T>) => VNodeChild;
  progress?: (scope: HysUploadFileContext<T>) => VNodeChild;
  preview?: (scope: { file: T; url: string; close: () => void }) => VNodeChild;
}
export interface HysUploadInstance<T extends HysUploadItem = HysUploadFile> {
  readonly element: HTMLElement | undefined;
  readonly input: HTMLInputElement | undefined;
  readonly files: readonly T[];
  readonly busy: boolean;
  readonly uploading: number;
  readonly queued: number;
  open: (event?: Event) => void;
  focus: () => void;
  addFiles: (files: readonly File[]) => Promise<T[]>;
  getFiles: () => T[];
  clearFiles: (statuses?: readonly HysUploadStatus[]) => Promise<boolean>;
  remove: (file: T | string) => Promise<boolean>;
  submit: (file?: T | string) => Promise<number>;
  retry: (file: T | string) => Promise<boolean>;
  abort: (file?: T | string) => number;
  preview: (file: T | string) => Promise<boolean>;
  download: (file: T | string) => Promise<boolean>;
}
export const uploadStatus = (file: HysUploadItem): HysUploadStatus =>
  ["ready", "uploading", "success", "error"].includes(file.status ?? "")
    ? file.status!
    : file.raw
      ? "ready"
      : "success";
export const uploadPercent = (file: HysUploadItem) =>
  uploadStatus(file) === "success"
    ? 100
    : Number.isFinite(file.percentage)
      ? Math.max(0, Math.min(100, file.percentage!))
      : 0;
export const uploadImage = (file: HysUploadItem) =>
  !!(file.type ?? file.raw?.type)?.startsWith("image/") ||
  /\.(png|jpe?g|gif|webp|avif|bmp|svg)(?:[?#]|$)/i.test(
    file.name || file.url || "",
  );
export function uploadSize(value?: number) {
  if (!Number.isFinite(value) || value! < 0) return "";
  if (value! < 1024) return value + " B";
  if (value! < 1048576) return (value! / 1024).toFixed(1) + " KB";
  return (value! / 1048576).toFixed(1) + " MB";
}
export function uploadFailure(
  error: unknown,
  kind: HysUploadError["kind"] = "custom",
): HysUploadError {
  return error instanceof Error
    ? Object.assign(new Error(error.message, { cause: error }), error, {
        kind: (error as HysUploadError).kind ?? kind,
      })
    : Object.assign(new Error(typeof error === "string" ? error : "上传失败"), {
        kind,
      });
}
export function uploadUrl(value: string | undefined, image = false) {
  if (!value) return;
  try {
    const url = new URL(value, document.baseURI);
    if (
      ["http:", "https:", "blob:"].includes(url.protocol) ||
      (image && /^data:image\//i.test(value))
    )
      return url.href;
  } catch {}
}
