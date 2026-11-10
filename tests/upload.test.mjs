import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { JSDOM } from "jsdom";
const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost",
  pretendToBeVisual: true,
});
for (const name of [
  "window",
  "document",
  "Document",
  "Node",
  "Element",
  "HTMLElement",
  "SVGElement",
  "HTMLInputElement",
  "HTMLButtonElement",
  "HTMLFormElement",
  "Event",
  "FocusEvent",
  "MouseEvent",
  "KeyboardEvent",
  "MutationObserver",
  "File",
  "Blob",
  "FormData",
  "URL",
])
  globalThis[name] = dom.window[name];
globalThis.getComputedStyle = window.getComputedStyle.bind(window);
globalThis.requestAnimationFrame = window.requestAnimationFrame.bind(window);
globalThis.cancelAnimationFrame = window.cancelAnimationFrame.bind(window);
window.matchMedia = () => ({
  matches: false,
  addEventListener() {},
  removeEventListener() {},
});
HTMLElement.prototype.getBoundingClientRect = function () {
  return {
    left: 20,
    right: 320,
    top: 20,
    bottom: 60,
    x: 20,
    y: 20,
    width: 300,
    height: 40,
    toJSON() {
      return {};
    },
  };
};
HTMLElement.prototype.getClientRects = function () {
  return [this.getBoundingClientRect()];
};
HTMLElement.prototype.scrollIntoView = function () {};
if (!("inert" in HTMLElement.prototype))
  Object.defineProperty(HTMLElement.prototype, "inert", {
    configurable: true,
    get() {
      return this.hasAttribute("inert");
    },
    set(value) {
      this.toggleAttribute("inert", !!value);
    },
  });
let urlCount = 0;
const revoked = [];
URL.createObjectURL = () => "blob:http://localhost/" + ++urlCount;
URL.revokeObjectURL = (url) => revoked.push(url);
class FakeXHR {
  static all = [];
  upload = { onprogress: null };
  headers = {};
  status = 0;
  responseText = "";
  aborted = false;
  constructor() {
    FakeXHR.all.push(this);
  }
  open(method, url, async) {
    this.method = method;
    this.url = url;
    this.async = async;
  }
  setRequestHeader(key, value) {
    this.headers[key] = value;
  }
  send(body) {
    this.body = body;
  }
  abort() {
    this.aborted = true;
    this.onabort?.();
  }
  progress(loaded, total = 100) {
    this.upload.onprogress?.({ lengthComputable: true, loaded, total });
  }
  success(response, status = 200) {
    this.responseText =
      typeof response === "string" ? response : JSON.stringify(response);
    this.status = status;
    this.onload?.();
  }
  fail() {
    this.onerror?.();
  }
  expire() {
    this.ontimeout?.();
  }
}
globalThis.XMLHttpRequest = FakeXHR;
const { createApp, h, ref, reactive, nextTick, KeepAlive, defineComponent } =
    await import("vue"),
  ui = await import("../packages/ui/dist/index.js");
const apps = [],
  wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const settle = async () => {
  await nextTick();
  await Promise.resolve();
  await nextTick();
};
async function until(check) {
  const end = Date.now() + 1800;
  while (!check() && Date.now() < end) await wait(5);
  assert(check());
}
afterEach(async () => {
  for (const { app, host } of apps.splice(0)) {
    app.unmount();
    host.remove();
  }
  document.body.replaceChildren();
  FakeXHR.all = [];
  revoked.splice(0);
  globalThis.XMLHttpRequest = FakeXHR;
  await settle();
});
const file = (name = "doc.txt", text = "Content", type = "text/plain") =>
  new File([text], name, { type });
async function mount(values = {}, slots = {}, accept = true, observe) {
  const props = reactive({ ...values }),
    events = [],
    vm = ref(),
    host = document.createElement("div");
  document.body.append(host);
  const listeners = Object.fromEntries(
    ui.HysUpload.emits.map((name) => [
      "on" + name[0].toUpperCase() + name.slice(1),
      (...args) => {
        events.push({ name, args });
        observe?.(name, args);
        if (
          name === "update:fileList" &&
          values.fileList !== undefined &&
          accept !== false
        ) {
          const next = typeof accept === "function" ? accept(args[0]) : args[0];
          if (next !== undefined) props.fileList = next;
        }
        if (
          name === "update:modelValue" &&
          values.modelValue !== undefined &&
          accept !== false
        )
          props.modelValue = args[0];
      },
    ]),
  );
  const app = createApp({
    setup() {
      ui.provideHysConfig({ motion: "off" });
      return () => h(ui.HysUpload, { ...props, ...listeners, ref: vm }, slots);
    },
  });
  app.mount(host);
  apps.push({ app, host });
  await settle();
  return {
    props,
    events,
    host,
    app,
    get vm() {
      return vm.value;
    },
    get input() {
      return host.querySelector("input[type=file]");
    },
    get zone() {
      return host.querySelector(".hys-ui-upload-zone");
    },
    get files() {
      return vm.value.files;
    },
    count: (name) => events.filter((e) => e.name === name).length,
    last: (name) => events.filter((e) => e.name === name).at(-1)?.args,
  };
}
async function fire(el, type, extra = {}) {
  const C = type.startsWith("key")
    ? KeyboardEvent
    : type === "click"
      ? MouseEvent
      : type.startsWith("focus")
        ? FocusEvent
        : Event;
  const event = new C(type, { bubbles: true, cancelable: true, ...extra });
  for (const [key, value] of Object.entries(extra))
    if (!(key in event)) Object.defineProperty(event, key, { value });
  el.dispatchEvent(event);
  await settle();
  return event;
}
function transport() {
  const calls = [];
  return {
    calls,
    customRequest: (options) => {
      const request = { ...options, aborted: false };
      calls.push(request);
      return {
        abort() {
          request.aborted = true;
        },
      };
    },
  };
}
test("Default local mode preserves raw File identity, events, multiple defaults and synchronous clear notification", async () => {
  const a = await mount(),
    raw = file();
  await a.vm.addFiles([raw]);
  assert.equal(a.files[0].raw, raw);
  assert.equal(a.files[0].size, raw.size);
  assert.equal(a.count("select"), 1);
  assert.equal(a.count("change"), 1);
  assert.equal(a.count("start"), 0);
  assert.equal(FakeXHR.all.length, 0);
  a.vm.clearFiles();
  assert.equal(a.files.length, 0);
  assert.equal(a.last("change")[0].length, 0);
  assert.equal(a.count("change"), 2);
});
test("Single-file mode replaces only after successful validation and keeps the previous entry on rejection", async () => {
  const a = await mount({ multiple: false, limit: 1 });
  await a.vm.addFiles([file("one.txt")]);
  const original = a.files[0];
  a.props.beforeUpload = () => false;
  await settle();
  await a.vm.addFiles([file("reject.txt")]);
  assert.equal(a.files[0].uid, original.uid);
  a.props.beforeUpload = undefined;
  await settle();
  await a.vm.addFiles([file("two.txt"), file("three.txt")]);
  assert.deepEqual(
    a.files.map((f) => f.name),
    ["two.txt"],
  );
  assert.equal(a.count("exceed"), 0);
});
test("Type, size, rejected validation and count limits do not add invalid files", async () => {
  const a = await mount({ accept: ".txt,image/*", maxSize: 8, limit: 3 });
  await a.vm.addFiles([
    file("invalid.pdf"),
    file("large.txt", "123456789"),
    file("valid.txt", "ok"),
  ]);
  assert.deepEqual(
    a.files.map((f) => f.name),
    ["valid.txt"],
  );
  assert.equal(a.count("invalid"), 2);
  await a.vm.addFiles([file("1.txt"), file("2.txt"), file("3.txt")]);
  assert.equal(a.count("exceed"), 1);
  assert.equal(a.files.length, 1);
  a.props.beforeUpload = async () => {
    throw Error("Validation failed");
  };
  await settle();
  await a.vm.addFiles([file("later.txt")]);
  assert.equal(a.last("error")[0], "Validation failed");
  assert.equal(a.files.length, 1);
});
test("Clear cancels pending validation and later completion cannot restore selected files", async () => {
  let finish, signal;
  const a = await mount({
    beforeUpload: (_file, context) => {
      signal = context.signal;
      return new Promise((resolve) => (finish = resolve));
    },
  });
  const adding = a.vm.addFiles([file()]);
  await settle();
  await a.vm.clearFiles();
  assert(signal.aborted);
  finish(true);
  await adding;
  assert.equal(a.files.length, 0);
  assert.equal(a.count("select"), 0);
  assert.equal(a.count("change"), 1);
});
for (const prop of ["disabled", "readonly", "loading"])
  test(
    prop + " cancels pending checks and prevents new file mutations",
    async () => {
      let resolve;
      const a = await mount({
        beforeUpload: () => new Promise((done) => (resolve = done)),
      });
      const adding = a.vm.addFiles([file()]);
      await settle();
      a.props[prop] = true;
      await settle();
      resolve(true);
      await adding;
      assert.equal(a.files.length, 0);
      assert.deepEqual(await a.vm.addFiles([file("blocked.txt")]), []);
      assert(a.input.disabled);
    },
  );
test("Input selection clears its native value so a file can be selected again", async () => {
  const a = await mount(),
    raw = file();
  Object.defineProperty(a.input, "files", { configurable: true, value: [raw] });
  await fire(a.input, "change");
  await until(() => a.files.length === 1);
  assert.equal(a.input.value, "");
  await fire(a.input, "change");
  await until(() => a.files.length === 2);
  assert.notEqual(a.files[0].uid, a.files[1].uid);
});
test("Controlled file lists may accept additions, reorder them and preserve additional metadata", async () => {
  const a = await mount({ fileList: [] }, {}, (next) =>
    next
      .map((f) => ({ ...f, tag: "host" }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  );
  await a.vm.addFiles([file("z.txt"), file("a.txt")]);
  assert.deepEqual(
    a.files.map((f) => f.name),
    ["a.txt", "z.txt"],
  );
  assert(a.files.every((f) => f.tag === "host"));
  assert.equal(a.count("select"), 1);
});
test("Controlled hosts can reject selection, removal, clear and request starts", async () => {
  const a = await mount({ fileList: [] }, {}, false);
  await a.vm.addFiles([file()]);
  assert.equal(a.files.length, 0);
  assert.equal(a.count("select"), 0);
  a.props.fileList = [
    { uid: "old", name: "old.txt", raw: file("old.txt"), size: 7 },
  ];
  await settle();
  assert.equal(await a.vm.remove("old"), false);
  assert.equal(await a.vm.clearFiles(), false);
  assert.equal(a.files.length, 1);
  const request = transport(),
    b = await mount(
      { fileList: [], customRequest: request.customRequest },
      {},
      (next) => (next.some((f) => f.status === "uploading") ? undefined : next),
    );
  await b.vm.addFiles([file()]);
  await wait(30);
  assert.equal(request.calls.length, 0);
  assert.equal(b.files[0].status, "ready");
  assert.equal(b.vm.uploading, 0);
});
test("fileList takes precedence over modelValue and remote entries never require a fabricated raw File", async () => {
  const a = await mount({
    fileList: [
      {
        uid: "server",
        name: "server.pdf",
        url: "https://example.com/server.pdf",
      },
    ],
    modelValue: [],
  });
  assert.equal(a.files[0].raw, undefined);
  assert(a.host.textContent.includes("已完成"));
  assert.equal(await a.vm.submit(), 0);
  assert.equal(await a.vm.remove("server"), true);
  assert.equal(a.files.length, 0);
});
test("HTTP transport sends multipart fields, headers, credentials, method and a transformed file", async () => {
  const original = file("original.txt"),
    body = file("converted.txt", "Converted");
  const a = await mount({
    action: async () => "/files",
    method: "PUT",
    name: "attachment",
    headers: () => ({ "X-Token": "demo" }),
    data: () => ({ id: 7, tags: ["one", "two"], enabled: true, empty: null }),
    withCredentials: true,
    timeout: 1250,
    beforeUpload: () => body,
  });
  await a.vm.addFiles([original]);
  await until(() => FakeXHR.all.length === 1);
  const xhr = FakeXHR.all[0];
  assert.equal(xhr.method, "PUT");
  assert.equal(xhr.url, "/files");
  assert.equal(xhr.headers["X-Token"], "demo");
  assert.equal(xhr.withCredentials, true);
  assert.equal(xhr.timeout, 1250);
  assert.equal(xhr.body.get("id"), "7");
  assert.deepEqual(xhr.body.getAll("tags"), ["one", "two"]);
  assert.equal(xhr.body.get("enabled"), "true");
  assert.equal(xhr.body.get("empty"), "");
  assert.equal(xhr.body.get("attachment").name, "converted.txt");
  assert.equal(a.files[0].raw, original);
  xhr.success({ id: "uploaded" });
  await until(() => a.count("success") === 1);
  assert.equal(a.files[0].status, "success");
  assert.equal(a.files[0].percentage, 100);
  assert.equal(a.vm.uploading, 0);
});
test("HTTP progress is bounded and HTTP, timeout and network errors preserve their metadata", async () => {
  for (const [kind, finish] of [
    ["http", (xhr) => xhr.success({ message: "Denied" }, 403)],
    ["timeout", (xhr) => xhr.expire()],
    ["network", (xhr) => xhr.fail()],
  ]) {
    const a = await mount({ action: "/upload" });
    await a.vm.addFiles([file(kind + ".txt")]);
    await until(() => FakeXHR.all.some((xhr) => xhr.body && !xhr.tested));
    const xhr = FakeXHR.all.find((xhr) => xhr.body && !xhr.tested);
    xhr.tested = true;
    xhr.progress(55);
    await until(() => a.files[0].percentage === 55);
    finish(xhr);
    await until(() => a.count("uploadError") === 1);
    assert.equal(a.files[0].status, "error");
    assert.equal(a.last("uploadError")[0].kind, kind);
    assert.equal(a.last("uploadError")[0].url, "/upload");
    if (kind === "http") assert.equal(a.last("uploadError")[0].status, 403);
  }
});
test("Manual submit starts only ready local files and no transport is invented in local mode", async () => {
  const request = transport(),
    a = await mount({
      customRequest: request.customRequest,
      autoUpload: false,
    });
  await a.vm.addFiles([file()]);
  assert.equal(request.calls.length, 0);
  assert.equal(await a.vm.submit(), 1);
  await until(() => request.calls.length === 1);
  assert.equal(await a.vm.submit(), 0);
  const b = await mount({ autoUpload: true });
  await b.vm.addFiles([file()]);
  assert.equal(await b.vm.submit(), 0);
  assert.equal(FakeXHR.all.length, 0);
});
test("Concurrency bounds both request setup and the upload queue", async () => {
  const request = transport(),
    a = await mount({ customRequest: request.customRequest, concurrency: 2 });
  await a.vm.addFiles(Array.from({ length: 5 }, (_, i) => file(i + ".txt")));
  await until(() => request.calls.length === 2);
  assert.equal(a.vm.queued, 3);
  request.calls[0].onSuccess({ ok: true });
  await until(() => request.calls.length === 3);
  assert.equal(a.vm.uploading, 2);
  assert.equal(a.vm.queued, 2);
  a.vm.abort();
  assert.equal(a.vm.uploading, 0);
  assert.equal(a.vm.queued, 0);
  assert.equal(request.calls[0].signal.aborted, false);
  assert(request.calls.slice(1).every((r) => r.signal.aborted));
});
test("Retries use a new signal, clear stale failure and re-run per-request configuration", async () => {
  const request = transport();
  let checks = 0,
    actions = 0;
  const a = await mount({
    action: () => "/upload/" + ++actions,
    customRequest: request.customRequest,
    beforeUpload: () => {
      checks++;
      return true;
    },
  });
  await a.vm.addFiles([file()]);
  await until(() => request.calls.length === 1);
  request.calls[0].onError(Error("First attempt"));
  await until(() => a.files[0].status === "error");
  assert.equal(await a.vm.retry(a.files[0]), true);
  await until(() => request.calls.length === 2);
  assert.equal(checks, 2);
  assert.equal(actions, 2);
  assert.notEqual(request.calls[0].signal, request.calls[1].signal);
  assert.equal(request.calls[1].action, "/upload/2");
  request.calls[1].onSuccess({ ok: true });
  await until(() => a.files[0].status === "success");
  assert.equal(a.files[0].error, undefined);
});
test("Abort cancels transport handles and makes late callbacks harmless", async () => {
  const request = transport(),
    a = await mount({ customRequest: request.customRequest });
  await a.vm.addFiles([file()]);
  await until(() => request.calls.length === 1);
  const call = request.calls[0];
  assert.equal(a.vm.abort(a.files[0]), 1);
  await settle();
  assert(call.signal.aborted);
  assert(call.aborted);
  assert.equal(a.files[0].status, "ready");
  call.onProgress(90);
  call.onSuccess({ late: true });
  call.onError(Error("Late"));
  await wait(30);
  assert.equal(a.count("success"), 0);
  assert.equal(a.count("uploadError"), 0);
  assert.equal(a.files[0].status, "ready");
});
test("Removing a queued or uploading file cancels only its own work", async () => {
  const request = transport(),
    a = await mount({ customRequest: request.customRequest, concurrency: 1 });
  await a.vm.addFiles([file("one.txt"), file("two.txt"), file("three.txt")]);
  await until(() => request.calls.length === 1);
  const [first, second] = a.files;
  await a.vm.remove(second.uid);
  assert.equal(a.vm.queued, 1);
  await a.vm.remove(first.uid);
  await until(() => request.calls.length === 2);
  assert.equal(request.calls[1].file.name, "three.txt");
  request.calls[0].onSuccess("late");
  await settle();
  assert.equal(a.count("success"), 0);
  assert.equal(a.files.length, 1);
});
test("Host removal or replacing a raw file cancels ownership without stale re-additions", async () => {
  const request = transport(),
    a = await mount({ fileList: [], customRequest: request.customRequest });
  await a.vm.addFiles([file()]);
  await until(() => request.calls.length === 1);
  const call = request.calls[0];
  a.props.fileList = a.files.map((f) => ({
    ...f,
    raw: file("replacement.txt"),
  }));
  await settle();
  assert(call.signal.aborted);
  call.onSuccess("late");
  await settle();
  assert.equal(a.count("success"), 0);
  assert.equal(a.files[0].raw.name, "replacement.txt");
});
test("Async action/data setup is cancelled before the transport can start", async () => {
  let finish, signal;
  const request = transport(),
    a = await mount({
      action: (_file, context) => {
        signal = context.signal;
        return new Promise((resolve) => (finish = resolve));
      },
      customRequest: request.customRequest,
    });
  await a.vm.addFiles([file()]);
  await until(() => !!finish);
  a.vm.abort();
  finish("/late");
  await wait(20);
  assert(signal.aborted);
  assert.equal(request.calls.length, 0);
  assert.equal(a.files[0].status, "ready");
});
test("A start event may remove its file without triggering a request afterwards", async () => {
  const request = transport();
  const a = await mount(
    { fileList: [], customRequest: request.customRequest },
    {},
    true,
    (name) => {
      if (name === "start") void a.vm.clearFiles();
    },
  );
  await a.vm.addFiles([file()]);
  await until(() => a.count("start") === 1);
  await wait(20);
  assert.equal(request.calls.length, 0);
  assert.equal(a.files.length, 0);
});
test("Custom promise and callback transports finish once, including rejection and synchronous failure", async () => {
  for (const mode of ["promise", "callback", "throw", "reject"]) {
    const a = await mount({
      customRequest: (options) => {
        if (mode === "throw") throw Error("Thrown");
        if (mode === "reject") return Promise.reject(Error("Rejected"));
        if (mode === "callback") options.onSuccess("Callback");
        return Promise.resolve("Promise");
      },
    });
    await a.vm.addFiles([file(mode + ".txt")]);
    await until(() => a.count("success") + a.count("uploadError") === 1);
    assert.equal(a.count("success") + a.count("uploadError"), 1);
    assert.equal(a.vm.uploading, 0);
  }
});
test("Progress batches a burst of callbacks into one list update per frame and cannot overwrite completion", async () => {
  const request = transport(),
    a = await mount({ customRequest: request.customRequest });
  await a.vm.addFiles([file()]);
  await until(() => request.calls.length === 1);
  const before = a.count("change");
  for (let i = 1; i < 90; i++) request.calls[0].onProgress(i);
  await until(() => a.count("progress") === 1);
  assert.equal(a.count("change") - before, 1);
  assert.equal(a.files[0].percentage, 89);
  request.calls[0].onProgress(95);
  request.calls[0].onSuccess("Done");
  await until(() => a.files[0].status === "success");
  await wait(30);
  assert.equal(a.files[0].percentage, 100);
  assert.equal(a.count("success"), 1);
});
test("Progress from a completed file is filtered when another file is still uploading", async () => {
  const request = transport(),
    a = await mount({ customRequest: request.customRequest });
  await a.vm.addFiles([file("one.txt"), file("two.txt")]);
  await until(() => request.calls.length === 2);
  request.calls[0].onProgress(20);
  request.calls[1].onProgress(30);
  request.calls[0].onSuccess("Done");
  await until(
    () => a.files[0].status === "success" && a.files[1].percentage === 30,
  );
  assert.equal(a.files[0].percentage, 100);
});
test("beforeRemove may veto, reject or be cancelled by clearing the list", async () => {
  let finish, signal;
  const a = await mount({
    beforeRemove: (_file, _files, context) => {
      signal = context.signal;
      return new Promise((resolve) => (finish = resolve));
    },
  });
  await a.vm.addFiles([file()]);
  let removing = a.vm.remove(a.files[0]);
  await settle();
  finish(false);
  assert.equal(await removing, false);
  assert.equal(a.files.length, 1);
  removing = a.vm.remove(a.files[0]);
  await settle();
  await a.vm.clearFiles();
  assert(signal.aborted);
  finish(true);
  assert.equal(await removing, false);
  assert.equal(a.count("remove"), 0);
});
test("Supplied identifiers and extra data are preserved, while duplicates are rejected without mutating source lists", async () => {
  const preset = Object.freeze({
      uid: "server",
      name: "server.txt",
      status: "success",
    }),
    a = await mount({
      defaultFileList: [preset],
      createFile: (raw) => ({
        uid: "custom",
        name: raw.name,
        raw,
        size: raw.size,
        tag: 42,
      }),
    });
  await a.vm.addFiles([file("first.txt"), file("second.txt")]);
  assert.equal(a.files.length, 2);
  assert.equal(a.files[1].tag, 42);
  assert.equal(a.count("invalid"), 1);
  assert.deepEqual(preset, {
    uid: "server",
    name: "server.txt",
    status: "success",
  });
});
test("Thumbnail object URLs are reused across progress and revoked for removed or cleared files", async () => {
  const a = await mount({ listType: "picture" });
  await a.vm.addFiles([file("photo.png", "PNG", "image/png")]);
  await settle();
  const img = a.host.querySelector(".hys-ui-upload-thumbnail img"),
    src = img.src;
  assert(src.startsWith("blob:"));
  assert.equal(await a.vm.preview(a.files[0]), true);
  assert(document.querySelector(".hys-ui-upload-preview-image"));
  await a.vm.remove(a.files[0]);
  await settle();
  assert(revoked.includes(src));
  assert(!document.querySelector(".hys-ui-upload-preview-image"));
});
test("Remote image previews use the supplied URL and unsafe URLs never reach image or link actions", async () => {
  const a = await mount({
    defaultFileList: [
      { uid: "image", name: "photo.png", url: "https://example.com/photo.png" },
      { uid: "bad", name: "bad.png", url: "javascript:alert(1)" },
    ],
    listType: "picture-card",
  });
  await settle();
  assert.equal(await a.vm.preview("image"), true);
  assert.equal(
    document.querySelector(".hys-ui-upload-preview-image").src,
    "https://example.com/photo.png",
  );
  assert.equal(await a.vm.download("bad"), false);
  assert.equal(await a.vm.preview("bad"), false);
});
test("Async preview and download resolvers are cancelled when a file leaves the list", async () => {
  let finish, signal;
  const a = await mount({
    previewFile: (_file, context) => {
      signal = context.signal;
      return new Promise((resolve) => (finish = resolve));
    },
    downloadFile: (_file, context) => {
      signal = context.signal;
      return new Promise((resolve) => (finish = resolve));
    },
  });
  for (const action of ["preview", "download"]) {
    await a.vm.addFiles([file()]);
    const pending = a.vm[action](a.files[0]);
    await settle();
    await a.vm.clearFiles();
    assert(signal.aborted);
    finish("https://example.com/photo.png");
    assert.equal(await pending, false);
    assert(!document.querySelector(".hys-ui-upload-preview-image"));
  }
});
test("Custom trigger buttons open once from their native click and preserve their keyboard events", async () => {
  const a = await mount(
    {},
    { trigger: () => h(ui.HysButton, {}, () => "Choose") },
  );
  let clicks = 0;
  a.input.click = () => clicks++;
  const button = a.host.querySelector("button");
  assert.equal(a.zone.getAttribute("role"), null);
  assert.equal(a.zone.tabIndex, -1);
  await fire(button, "keydown", { key: "Enter" });
  await fire(button, "click");
  assert.equal(clicks, 1);
  a.props.openFileDialogOnClick = false;
  await settle();
  await fire(button, "click");
  assert.equal(clicks, 1);
  a.vm.open();
  assert.equal(clicks, 2);
});

test("Replacing a raw file cancels pending remove ownership without deleting the replacement", async () => {
  let finish, signal;
  const original = file("original.txt");
  const a = await mount({
    fileList: [
      { uid: "same", name: original.name, raw: original, size: original.size },
    ],
    beforeRemove: (_file, _list, context) => {
      signal = context.signal;
      return new Promise((resolve) => (finish = resolve));
    },
  });
  const removing = a.vm.remove("same");
  await settle();
  const replacement = file("replacement.txt");
  a.props.fileList = [
    {
      uid: "same",
      name: replacement.name,
      raw: replacement,
      size: replacement.size,
    },
  ];
  await settle();
  assert(signal.aborted);
  finish(true);
  assert.equal(await removing, false);
  assert.equal(a.files[0].raw, replacement);
  assert.equal(a.count("remove"), 0);
});

test("Image failures show a fallback and a new thumbnail URL can recover", async () => {
  const a = await mount({
    fileList: [
      { uid: "image", name: "image.png", url: "https://example.com/first.png" },
    ],
    listType: "picture",
  });
  await fire(a.host.querySelector("img"), "error");
  assert.equal(a.host.querySelector("img"), null);
  assert(a.host.querySelector(".hys-ui-upload-thumbnail svg"));
  a.props.fileList = [
    { uid: "image", name: "image.png", url: "https://example.com/second.png" },
  ];
  await settle();
  assert.equal(
    a.host.querySelector("img").getAttribute("src"),
    "https://example.com/second.png",
  );
});

test("Directory selection preserves relative paths and list height remains bounded", async () => {
  const raw = file("nested.txt");
  Object.defineProperty(raw, "webkitRelativePath", {
    value: "folder/nested.txt",
  });
  const a = await mount({ directory: true, listHeight: NaN });
  await a.vm.addFiles([raw]);
  assert(a.input.hasAttribute("webkitdirectory"));
  assert.equal(a.files[0].relativePath, "folder/nested.txt");
  assert.equal(
    a.host.querySelector(".hys-ui-upload-list").style.maxHeight,
    "320px",
  );
});

test("Disabled and loading block exposed preview/download while readonly permits inspection", async () => {
  let downloads = 0;
  const a = await mount({
    fileList: [
      {
        uid: "picture",
        name: "picture.png",
        url: "https://example.com/picture.png",
      },
    ],
    downloadFile: () => {
      downloads++;
      return false;
    },
  });
  for (const state of ["disabled", "loading"]) {
    a.props[state] = true;
    await settle();
    assert.equal(await a.vm.preview("picture"), false);
    assert.equal(await a.vm.download("picture"), false);
    a.props[state] = false;
    await settle();
  }
  assert.equal(downloads, 0);
  a.props.readonly = true;
  await settle();
  assert.equal(await a.vm.preview("picture"), true);
  await a.vm.download("picture");
  assert.equal(downloads, 1);
});
test("Drag depth, disabled drop and optional clipboard files behave independently of text paste", async () => {
  const a = await mount({ paste: true });
  const dataTransfer = { files: [file()], types: ["Files"], dropEffect: "" };
  await fire(a.zone, "dragenter", { dataTransfer });
  assert(a.zone.classList.contains("hys-ui-upload-dragging"));
  await fire(a.zone, "dragenter", { dataTransfer });
  await fire(a.zone, "dragleave", { dataTransfer });
  assert(a.zone.classList.contains("hys-ui-upload-dragging"));
  await fire(a.zone, "drop", { dataTransfer });
  await until(() => a.files.length === 1);
  assert(!a.zone.classList.contains("hys-ui-upload-dragging"));
  await fire(a.host.firstElementChild, "paste", {
    clipboardData: { files: [file("pasted.png", "", "image/png")] },
  });
  await until(() => a.files.length === 2);
  assert(
    !(
      await fire(a.host.firstElementChild, "paste", {
        clipboardData: { files: [] },
      })
    ).defaultPrevented,
  );
  a.props.disabled = true;
  await settle();
  await fire(a.zone, "drop", { dataTransfer });
  assert.equal(a.files.length, 2);
});
test("Native form reset restores uncontrolled defaults and aborts active work", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const vm = ref(),
    request = transport(),
    app = createApp({
      setup: () => () =>
        h("form", {}, [
          h(ui.HysUpload, { ref: vm, customRequest: request.customRequest }),
        ]),
    });
  app.mount(host);
  apps.push({ app, host });
  await settle();
  await vm.value.addFiles([file()]);
  await until(() => request.calls.length === 1);
  host.querySelector("form").reset();
  await settle();
  await wait(5);
  assert.equal(vm.value.files.length, 0);
  assert(request.calls[0].signal.aborted);
});
test("Form integration inherits field size/disabled state, validates values and resets file state", async () => {
  const model = reactive({ files: [] }),
    disabled = ref(false),
    vm = ref(),
    form = ref(),
    host = document.createElement("div");
  document.body.append(host);
  const app = createApp({
    setup: () => () =>
      h(
        ui.HysForm,
        {
          ref: form,
          model,
          disabled: disabled.value,
          size: "sm",
          rules: { files: [{ required: true, type: "array", min: 1 }] },
        },
        () =>
          h(ui.HysFormItem, { prop: "files", label: "Attachments" }, () =>
            h(ui.HysUpload, {
              ref: vm,
              fileList: model.files,
              "onUpdate:fileList": (v) => (model.files = v),
            }),
          ),
      ),
  });
  app.mount(host);
  apps.push({ app, host });
  await settle();
  assert(host.querySelector(".hys-ui-upload-sm"));
  assert.equal(await form.value.validate(), false);
  await vm.value.addFiles([file()]);
  await until(() => !host.querySelector('[aria-invalid="true"]'));
  disabled.value = true;
  await settle();
  assert(host.querySelector("input[type=file]").disabled);
  form.value.resetFields();
  await settle();
  assert.equal(vm.value.files.length, 0);
});
test("Cached pages abort requests, revoke previews and do not restart uploads when returning", async () => {
  const request = transport(),
    active = ref(true),
    vm = ref(),
    Page = defineComponent({
      setup: () => () =>
        h(ui.HysUpload, {
          ref: vm,
          customRequest: request.customRequest,
          listType: "picture",
        }),
    });
  const host = document.createElement("div");
  document.body.append(host);
  const app = createApp({
    setup: () => () =>
      h(KeepAlive, null, {
        default: () => (active.value ? h(Page) : h("p", "Other")),
      }),
  });
  app.mount(host);
  apps.push({ app, host });
  await settle();
  await vm.value.addFiles([file("photo.png", "PNG", "image/png")]);
  await until(() => request.calls.length === 1);
  active.value = false;
  await settle();
  assert(request.calls[0].signal.aborted);
  request.calls[0].onSuccess("Late");
  await settle();
  active.value = true;
  await settle();
  await wait(25);
  assert.equal(request.calls.length, 1);
  assert.equal(vm.value.files[0].status, "ready");
  assert.equal(vm.value.uploading, 0);
});
test("A real multipart request reaches a local HTTP server with the original file bytes", async () => {
  globalThis.XMLHttpRequest = window.XMLHttpRequest;
  let received;
  const server = createServer(async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "http://localhost");
    res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "content-type");
    if (req.method === "OPTIONS") {
      res.writeHead(204).end();
      return;
    }
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    received = {
      body: Buffer.concat(chunks).toString(),
      type: req.headers["content-type"],
    };
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ id: "real" }));
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const a = await mount({
      action: "http://127.0.0.1:" + server.address().port + "/upload",
      data: { project: "demo" },
    });
    await a.vm.addFiles([file("protocol.txt", "Real bytes")]);
    await until(() => a.count("success") === 1);
    assert(received.type.includes("multipart/form-data; boundary="));
    assert(received.body.includes('name="project"'));
    assert(received.body.includes("demo"));
    assert(received.body.includes('filename="protocol.txt"'));
    assert(received.body.includes("Real bytes"));
    assert.equal(a.files[0].response.id, "real");
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
