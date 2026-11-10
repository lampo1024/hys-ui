import {
  uploadFailure,
  type HysUploadItem,
  type HysUploadRequestOptions,
} from "./upload";
/** A cancellable multipart transport. The browser supplies the multipart boundary. */
export function uploadRequest<T extends HysUploadItem>(
  options: HysUploadRequestOptions<T>,
) {
  const xhr = new XMLHttpRequest(),
    form = new FormData();
  for (const [key, raw] of Object.entries(options.data))
    for (const value of Array.isArray(raw) ? raw : [raw]) {
      if (value === undefined) continue;
      form.append(
        key,
        value instanceof Blob ? value : value === null ? "" : String(value),
      );
    }
  form.append(
    options.name,
    options.body,
    options.body instanceof File && options.body !== options.file.raw
      ? options.body.name
      : options.file.name,
  );
  let ended = false;
  const detach = () => {
    options.signal.removeEventListener("abort", abort);
    xhr.upload.onprogress = null;
    xhr.onload = xhr.onerror = xhr.ontimeout = xhr.onabort = null;
  };
  const finish = (error?: unknown, response?: unknown) => {
    if (ended) return;
    ended = true;
    detach();
    if (options.signal.aborted) return;
    error ? options.onError(error) : options.onSuccess(response);
  };
  const failure = (message: string, kind: "http" | "network" | "timeout") =>
    Object.assign(uploadFailure(message, kind), {
      status: xhr.status,
      response: read(),
      url: options.action,
      method: options.method,
    });
  function read() {
    const body = xhr.responseText;
    if (!body) return undefined;
    try {
      return JSON.parse(body);
    } catch {
      return body;
    }
  }
  function abort() {
    if (ended) return;
    ended = true;
    detach();
    xhr.abort();
  }
  xhr.open(options.method, options.action, true);
  xhr.withCredentials = options.withCredentials;
  xhr.timeout = options.timeout;
  for (const [name, value] of Object.entries(options.headers))
    xhr.setRequestHeader(name, value);
  xhr.upload.onprogress = (event) => {
    if (
      !ended &&
      !options.signal.aborted &&
      event.lengthComputable &&
      event.total > 0
    )
      options.onProgress((event.loaded / event.total) * 100);
  };
  xhr.onload = () => {
    if (xhr.status >= 200 && xhr.status < 300) finish(undefined, read());
    else finish(failure("上传请求失败（" + xhr.status + "）", "http"));
  };
  xhr.onerror = () => finish(failure("网络连接失败", "network"));
  xhr.ontimeout = () => finish(failure("上传请求超时", "timeout"));
  xhr.onabort = () => {
    ended = true;
    detach();
  };
  options.signal.addEventListener("abort", abort, { once: true });
  if (options.signal.aborted) {
    abort();
    return abort;
  }
  try {
    xhr.send(form);
  } catch (error) {
    finish(error);
  }
  return abort;
}
