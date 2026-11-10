import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost",
  pretendToBeVisual: true,
});
for (const name of [
  "window",
  "document",
  "Document",
  "ShadowRoot",
  "Node",
  "Element",
  "HTMLElement",
  "SVGElement",
  "HTMLInputElement",
  "HTMLTextAreaElement",
  "HTMLButtonElement",
  "HTMLSelectElement",
  "HTMLFormElement",
  "Event",
  "FocusEvent",
  "MouseEvent",
  "KeyboardEvent",
  "MutationObserver",
])
  globalThis[name] = dom.window[name];
globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
globalThis.requestAnimationFrame = dom.window.requestAnimationFrame.bind(
  dom.window,
);
globalThis.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(
  dom.window,
);
window.matchMedia = () => ({
  matches: false,
  addEventListener() {},
  removeEventListener() {},
});
HTMLElement.prototype.getBoundingClientRect = function () {
  return {
    x: 20,
    y: 20,
    left: 20,
    top: 20,
    right: 320,
    bottom: 60,
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

const {
  createApp,
  h,
  reactive,
  ref,
  nextTick,
  KeepAlive,
  defineComponent,
  provide,
  inject,
} = await import("vue");
const ui = await import("../packages/ui/dist/index.js");
const warnings = [],
  originalWarn = console.warn;
console.warn = (...args) => {
  warnings.push(args.join(" "));
  originalWarn(...args);
};
const mounts = new Set(),
  services = new Set();
const pause = (ms) => new Promise((done) => setTimeout(done, ms)),
  settle = async () => {
    for (let i = 0; i < 8; i++) await nextTick();
    await pause(2);
  };
async function mount(Component = ui.HysModal, values = {}, slots = {}) {
  const props = reactive(values),
    events = {},
    element = ref(),
    host = document.createElement("div");
  document.body.append(host);
  const listeners = Object.fromEntries(
    (Array.isArray(Component.emits)
      ? Component.emits
      : Object.keys(Component.emits || {})
    ).map((name) => [
      "on" + name[0].toUpperCase() + name.slice(1),
      (...args) => {
        (events[name] ??= []).push(args);
        if (name.startsWith("update:")) props[name.slice(7)] = args[0];
      },
    ]),
  );
  const app = createApp({
    setup() {
      ui.provideHysConfig({ motion: "off" });
      return () =>
        h(Component, { ...props, ...listeners, ref: element }, slots);
    },
  });
  app.mount(host);
  const item = {
    props,
    events,
    host,
    get vm() {
      return element.value;
    },
    find: (s) => document.querySelector(s),
    all: (s) => [...document.querySelectorAll(s)],
    unmount() {
      app.unmount();
      host.remove();
      mounts.delete(item);
    },
  };
  mounts.add(item);
  await settle();
  return item;
}
async function fire(target, type, options = {}) {
  assert(target, "Missing " + type + " target");
  const C = type.startsWith("key")
      ? KeyboardEvent
      : type === "click"
        ? MouseEvent
        : Event,
    e = new C(type, { bubbles: true, cancelable: true, ...options });
  if (type.startsWith("pointer"))
    for (const [key, value] of Object.entries({
      button: 0,
      pointerId: 1,
      clientX: 100,
      clientY: 100,
      ...options,
    }))
      Object.defineProperty(e, key, { value });
  target.dispatchEvent(e);
  await settle();
  return e;
}
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((a, b) => {
    resolve = a;
    reject = b;
  });
  return { promise, resolve, reject };
};
const dialog = () => document.querySelector('[role="dialog"]'),
  ok = () => document.querySelector("[data-hys-modal-confirm]"),
  cancel = () => document.querySelector("[data-hys-modal-cancel]");
afterEach(async () => {
  for (const service of services) service.dispose();
  services.clear();
  for (const item of [...mounts]) item.unmount();
  await settle();
  document.body.innerHTML = "";
  document.body.style.cssText = "";
  assert.deepEqual(warnings.splice(0), [], "Unexpected Vue runtime warnings");
});

test("Modal keeps legacy footer opt-in and supports both model aliases and uncontrolled methods", async () => {
  const a = await mount(ui.HysModal, { title: "Legacy", defaultOpen: true });
  assert(dialog());
  assert(!ok());
  assert.equal(a.events.open.length, 1);
  assert.equal(a.events.opened.length, 1);
  assert(await a.vm.close());
  await settle();
  assert(!dialog());
  assert.equal(a.events.close.length, 1);
  assert.equal(a.events.closed.length, 1);
  assert(await a.vm.show());
  await settle();
  assert(dialog());
  assert.equal(a.events.opened.length, 2);
  a.unmount();
  const b = await mount(ui.HysModal, { modelValue: true, footer: true });
  assert(ok());
  await fire(cancel(), "click");
  assert.equal(b.props.modelValue, false);
  assert.equal(b.events.cancel[0][0].reason, "cancel");
  assert.equal(document.body.style.overflow, "");
});
test("Modal controlled requests can be declined without visually closing", async () => {
  const instance = ref(),
    requests = [],
    Root = defineComponent({
      setup: () => () =>
        h(ui.HysModal, {
          ref: instance,
          open: true,
          footer: true,
          "onUpdate:open": (value) => requests.push(value),
        }),
    }),
    a = await mount(Root);
  assert.equal(await instance.value.close(), false);
  assert.deepEqual(requests, [false]);
  assert(dialog());
});
test("Modal async confirmation blocks duplicate submissions and closes only after success", async () => {
  const job = deferred();
  let calls = 0,
    signal;
  const a = await mount(ui.HysModal, {
    open: true,
    footer: true,
    beforeConfirm: (context) => {
      calls++;
      signal = context.signal;
      return job.promise;
    },
  });
  const first = a.vm.confirm();
  await settle();
  assert(a.vm.confirming);
  assert.equal(await a.vm.confirm(), false);
  assert(ok().disabled);
  assert.equal(await a.vm.cancel(), false);
  job.resolve();
  assert(await first);
  await settle();
  assert.equal(calls, 1);
  assert.equal(a.events.ok.length, 1);
  assert(!dialog());
  assert(signal.aborted);
});
test("Modal confirmation veto and failure remain open, expose an accessible retry error and recover", async () => {
  let attempt = 0;
  const a = await mount(ui.HysModal, {
    open: true,
    footer: true,
    beforeConfirm: () => {
      if (++attempt === 1) return false;
      if (attempt === 2) throw Error("secret");
    },
    errorText: "保存失败，请重试",
  });
  assert.equal(await a.vm.confirm(), false);
  assert(!a.find('[role="alert"]'));
  assert.equal(await a.vm.confirm(), false);
  assert.equal(a.find('[role="alert"]').textContent, "保存失败，请重试");
  assert.equal(a.events.confirmError.length, 1);
  assert(dialog());
  assert(await a.vm.confirm());
  await settle();
  assert(!dialog());
});
test("Modal close during a cancellable confirmation aborts stale work and never emits stale ok", async () => {
  const job = deferred();
  let signal;
  const a = await mount(ui.HysModal, {
    open: true,
    footer: true,
    closeWhileConfirming: true,
    beforeConfirm: (context) => {
      signal = context.signal;
      return job.promise;
    },
  });
  const pending = a.vm.confirm();
  await settle();
  assert(await a.vm.cancel());
  assert(signal.aborted);
  job.reject(Error("late"));
  assert.equal(await pending, false);
  assert(!a.events.ok);
  assert(!a.events.confirmError);
});
test("Modal external close and reopen invalidate in-flight confirmations", async () => {
  const job = deferred();
  const a = await mount(ui.HysModal, {
    open: true,
    beforeConfirm: () => job.promise,
  });
  const pending = a.vm.confirm();
  await settle();
  a.props.open = false;
  await settle();
  a.props.open = true;
  await settle();
  job.resolve();
  assert.equal(await pending, false);
  assert(dialog());
  assert(!a.events.ok);
});
test("Modal beforeClose covers confirm and cancel, with safe false and rejection behavior", async () => {
  const reasons = [];
  let allow = false;
  const a = await mount(ui.HysModal, {
    open: true,
    footer: true,
    beforeClose: (reason) => {
      reasons.push(reason);
      if (!allow) return false;
    },
  });
  assert.equal(await a.vm.confirm(), false);
  assert.equal(await a.vm.cancel(), false);
  assert.deepEqual(reasons, ["confirm", "cancel"]);
  assert(!a.events.ok);
  allow = true;
  assert(await a.vm.confirm());
  await settle();
  assert.equal(a.events.ok.length, 1);
});
test("Modal supports repeated confirmation without closing and keyboard shortcut respects IME", async () => {
  const a = await mount(ui.HysModal, {
    open: true,
    footer: true,
    closeOnConfirm: false,
    confirmOnCtrlEnter: true,
  });
  await fire(dialog(), "keydown", {
    key: "Enter",
    ctrlKey: true,
    isComposing: true,
  });
  assert(!a.events.ok);
  await fire(dialog(), "keydown", { key: "Enter", ctrlKey: true });
  assert.equal(a.events.ok.length, 1);
  assert(dialog());
  await fire(dialog(), "keydown", { key: "Enter", metaKey: true });
  assert.equal(a.events.ok.length, 2);
});
test("Modal mask closes only from a complete mask gesture, not after selecting text in content", async () => {
  const a = await mount(ui.HysModal, { open: true });
  const mask = a.find(".hys-ui-modal-overlay");
  await fire(dialog(), "pointerdown");
  await fire(mask, "pointerup");
  assert(dialog());
  await fire(mask, "pointerdown");
  await fire(mask, "pointerup", { clientX: 120 });
  assert(dialog());
  await fire(mask, "pointerdown");
  await fire(mask, "pointerup");
  assert(!dialog());
  assert.equal(a.events.cancel[0][0].reason, "mask");
});
test("Modal pending close guards are abortable, de-duplicated and cannot report stale failures", async () => {
  const job = deferred();
  let signal,
    calls = 0;
  const a = await mount(ui.HysModal, {
    open: true,
    beforeClose: (_, context) => {
      signal = context.signal;
      calls++;
      return job.promise;
    },
  });
  const first = a.vm.close();
  await settle();
  assert.equal(await a.vm.close(), false);
  a.props.open = false;
  await settle();
  job.reject(Error("late"));
  assert.equal(await first, false);
  assert(signal.aborted);
  assert.equal(calls, 1);
  assert(!a.events.closeError);
});
test("Modal delays are cancelled when toggled and lifecycle events do not repeat", async () => {
  const a = await mount(ui.HysModal, {
    open: false,
    openDelay: 25,
    closeDelay: 25,
  });
  a.props.open = true;
  await nextTick();
  a.props.open = false;
  await pause(40);
  assert(!dialog());
  assert(!a.events.open);
  a.props.open = true;
  await pause(40);
  await settle();
  assert(dialog());
  a.props.open = false;
  await nextTick();
  a.props.open = true;
  await pause(40);
  assert(dialog());
  assert.equal(a.events.open.length, 1);
});
test("Modal retained and force-rendered content preserve state; destroyOnClose removes children", async () => {
  const value = ref("start"),
    a = await mount(
      ui.HysModal,
      { open: false, forceRender: true, destroyOnClose: false },
      {
        default: () =>
          h("input", {
            value: value.value,
            onInput: (e) => (value.value = e.target.value),
          }),
      },
    );
  assert(a.find("input"));
  await a.vm.show();
  a.find("input").value = "edited";
  await fire(a.find("input"), "input");
  await a.vm.close();
  await settle();
  assert.equal(a.find("input").value, "edited");
  await a.vm.show();
  assert.equal(a.find("input").value, "edited");
  a.props.destroyOnClose = true;
  a.props.forceRender = false;
  await a.vm.close();
  await settle();
  assert(!a.find("input"));
});
test("Modal custom slots receive busy state, title ids and async actions; false footer hides slot", async () => {
  const a = await mount(
    ui.HysModal,
    { open: true, title: "Custom", footer: true },
    {
      header: (scope) => h("h3", { id: scope.titleId }, "Heading"),
      footer: (scope) => h("button", { onClick: scope.cancel }, "Dismiss"),
      default: (scope) => h("span", String(scope.busy)),
    },
  );
  assert.equal(dialog().getAttribute("aria-labelledby"), a.find("h3").id);
  assert(!ok());
  await fire(a.find("footer button"), "click");
  assert(!dialog());
  a.props.open = true;
  a.props.footer = false;
  await settle();
  assert(!a.find("footer"));
});
test("Modal loading preserves content, exposes status and disables confirmation", async () => {
  const a = await mount(
    ui.HysModal,
    { open: true, footer: true, loading: true },
    { default: () => h("input", { value: "retained" }) },
  );
  assert(a.find('[role="status"]'));
  assert(ok().disabled);
  assert.equal(await a.vm.confirm(), false);
  a.props.loading = false;
  await settle();
  assert.equal(a.find("input").value, "retained");
  assert(!a.find('[role="status"]'));
});
test("Modal fullscreen is controllable and preserves pre-fullscreen position and dimensions", async () => {
  const a = await mount(ui.HysModal, {
    open: true,
    showFullscreen: true,
    resizable: true,
    overflow: true,
  });
  a.vm.setPosition({ x: 25, y: 35 });
  a.vm.setSize({ width: 500, height: 300 });
  await settle();
  assert(await a.vm.toggleFullscreen());
  assert(a.vm.fullscreen);
  assert(!a.find('[aria-label="调整弹窗尺寸"]'));
  assert.equal(dialog().style.height, "100dvh");
  assert(await a.vm.toggleFullscreen());
  assert.deepEqual(a.vm.position, { x: 25, y: 35 });
  assert.equal(a.vm.dimensions.width, 500);
});
test("Modal drag is limited to the header and bounded in the viewport, Escape cancels just the gesture", async () => {
  const a = await mount(ui.HysModal, { open: true, draggable: true });
  const header = a.find("[data-hys-modal-drag-handle]");
  await fire(header, "pointerdown");
  await fire(document, "pointermove", { clientX: 500, clientY: 400 });
  await pause(25);
  assert(a.vm.position.x > 0);
  await fire(document, "keydown", { key: "Escape" });
  assert.deepEqual(a.vm.position, { x: 0, y: 0 });
  assert(dialog());
  assert.equal(a.events.dragEnd.at(-1)[1].cancelled, true);
  await fire(header, "pointerdown");
  await fire(document, "pointerup", { clientX: 2000, clientY: 2000 });
  assert(a.vm.position.x <= 696);
  assert(a.vm.position.y <= 700);
});
test("Modal cancelled resize restores auto size; resizing clamps conflicting bounds and supports keyboard reset", async () => {
  const a = await mount(ui.HysModal, {
    open: true,
    resizable: true,
    minWidth: 600,
    maxWidth: 400,
    maxHeight: 250,
  });
  const handle = a.find('[aria-label="调整弹窗尺寸"]');
  await fire(handle, "pointerdown");
  await fire(document, "pointermove", { clientX: 300, clientY: 300 });
  await pause(25);
  assert.equal(a.vm.dimensions.width, 400);
  assert(a.vm.dimensions.height <= 250);
  await fire(document, "pointercancel");
  assert.equal(a.vm.dimensions, undefined);
  await fire(handle, "keydown", { key: "ArrowRight" });
  assert.equal(a.vm.dimensions.width, 400);
  await fire(handle, "keydown", { key: "Home" });
  assert.equal(a.vm.dimensions, undefined);
});
test("Modal header keyboard positioning, double-click reset and close reset follow configuration", async () => {
  const a = await mount(ui.HysModal, {
    open: true,
    draggable: true,
    overflow: true,
    resetPositionOnClose: false,
  });
  const head = a.find("[data-hys-modal-drag-handle]");
  await fire(head, "keydown", { key: "ArrowRight", altKey: true });
  assert.equal(a.vm.position.x, 10);
  await fire(head, "dblclick");
  assert.equal(a.vm.position.x, 0);
  a.vm.setPosition({ x: 40, y: 20 });
  await a.vm.close();
  await settle();
  await a.vm.show();
  assert.equal(a.vm.position.x, 40);
  a.props.resetPositionOnClose = true;
  await a.vm.close();
  await settle();
  assert.equal(a.vm.position.x, 0);
});
test("Modal focus is trapped, restored and can be explicitly cancelled with autofocus events", async () => {
  const trigger = document.createElement("button");
  document.body.append(trigger);
  trigger.focus();
  const a = await mount(ui.HysModal, {
    open: true,
    footer: true,
    initialFocus: "cancel",
  });
  assert.equal(document.activeElement, cancel());
  ok().focus();
  await fire(document, "keydown", { key: "Tab" });
  assert.equal(document.activeElement, a.find('[aria-label="关闭"]'));
  await a.vm.close();
  await settle();
  assert.equal(document.activeElement, trigger);
  a.unmount();
  const Root = defineComponent({
    setup: () => () =>
      h(ui.HysModal, {
        open: true,
        onOpenAutoFocus: (event) => event.preventDefault(),
      }),
  });
  await mount(Root);
  assert.equal(document.activeElement, trigger);
});
test("Nested Modal uses ordered layers and Escape closes only the top dialog while retaining scroll lock", async () => {
  const child = ref(true),
    Root = defineComponent({
      setup: () => () =>
        h(ui.HysModal, { open: true, title: "Parent", zIndex: 1700 }, () =>
          h(ui.HysModal, {
            open: child.value,
            title: "Child",
            zIndex: 10,
            "onUpdate:open": (v) => (child.value = v),
          }),
        ),
    });
  await mount(Root);
  const masks = [...document.querySelectorAll(".hys-ui-modal-overlay")];
  assert(+masks[1].style.zIndex > +masks[0].style.zIndex);
  await fire(document, "keydown", { key: "Escape" });
  assert.equal(child.value, false);
  assert.equal(document.querySelectorAll('[role="dialog"]').length, 1);
  assert.equal(document.body.style.overflow, "hidden");
});
test("Closing a retained Modal also closes teleported child Select and releases its popup listeners", async () => {
  const a = await mount(
    ui.HysModal,
    { open: true, destroyOnClose: false },
    {
      default: () => h(ui.HysSelect, { options: [{ label: "One", value: 1 }] }),
    },
  );
  await fire(a.find('[role="combobox"]'), "click");
  assert(a.find('[role="listbox"]'));
  await a.vm.close();
  await settle();
  assert(!a.find('[role="listbox"]'));
  assert.equal(document.body.style.overflow, "");
  await a.vm.show();
  await settle();
  assert(!a.find('[role="listbox"]'));
});
test("Modal floating controls stack above a custom high zIndex dialog", async () => {
  const a = await mount(
    ui.HysModal,
    { open: true, zIndex: 5000 },
    {
      default: () => h(ui.HysSelect, { options: [{ label: "One", value: 1 }] }),
    },
  );
  await fire(a.find('[role="combobox"]'), "click");
  const list = a.find('[role="listbox"]');
  assert(list);
  const portal = list.closest('[style*="z-index"]');
  assert(+portal.style.zIndex > 5000);
});
test("Modal cached-page leave cancels jobs and gestures, unlocks and does not reopen on return", async () => {
  const instance = ref(),
    visible = ref(true),
    open = ref(true),
    job = deferred();
  let signal;
  const Page = defineComponent({
      setup: () => () =>
        h(ui.HysModal, {
          ref: instance,
          open: open.value,
          draggable: true,
          beforeConfirm: (ctx) => {
            signal = ctx.signal;
            return job.promise;
          },
          "onUpdate:open": (v) => (open.value = v),
        }),
    }),
    Root = defineComponent({
      setup: () => () =>
        h(KeepAlive, {}, () => (visible.value ? h(Page) : null)),
    });
  const a = await mount(Root);
  const modal = instance.value;
  const pending = modal.confirm();
  await settle();
  visible.value = false;
  await settle();
  assert(!dialog());
  assert.equal(document.body.style.overflow, "");
  assert(signal.aborted);
  job.resolve();
  assert.equal(await pending, false);
  visible.value = true;
  await settle();
  assert(!dialog());
  open.value = true;
  await settle();
  assert(dialog());
});
test("Modal scroll locks compensate the scrollbar once and restore existing padding", async () => {
  document.body.style.paddingRight = "5px";
  Object.defineProperty(document.documentElement, "clientWidth", {
    value: 1000,
    configurable: true,
  });
  const a = await mount(ui.HysModal, { open: true });
  assert.equal(document.body.style.paddingRight, "29px");
  const b = await mount(ui.HysModal, { open: true });
  assert.equal(document.body.style.paddingRight, "29px");
  b.unmount();
  await settle();
  assert.equal(document.body.style.overflow, "hidden");
  a.unmount();
  await settle();
  assert.equal(document.body.style.paddingRight, "5px");
  Object.defineProperty(document.documentElement, "clientWidth", {
    value: 0,
    configurable: true,
  });
});
test("Modal penetrable mode defaults to no focus trap or body scroll lock", async () => {
  const trigger = document.createElement("button");
  document.body.append(trigger);
  const a = await mount(ui.HysModal, {
    open: true,
    modal: false,
    modalPenetrable: true,
  });
  assert.equal(document.body.style.overflow, "");
  trigger.focus();
  assert.equal(document.activeElement, trigger);
  assert(!dialog().hasAttribute("aria-modal"));
  assert(a.find(".hys-ui-modal-penetrable"));
});
test("Modal service supports results, update, confirm veto/retry and explicit force destruction", async () => {
  const api = ui.createHysModal({ motion: "off" });
  services.add(api);
  let allow = false;
  const item = api.confirm({
    title: "First",
    content: "Content",
    onOk: () => allow,
  });
  await settle();
  assert.equal(dialog().getAttribute("aria-label"), "First");
  item.update({ title: "Updated", content: "Next" });
  await settle();
  assert.equal(dialog().getAttribute("aria-label"), "Updated");
  assert.equal(await item.confirm(), false);
  assert(dialog());
  allow = true;
  assert(await item.confirm());
  assert.deepEqual(await item.closed, { action: "confirm", reason: "confirm" });
  assert(!dialog());
  const next = api.info("Message");
  next.destroy();
  assert.deepEqual(await next.closed, { action: "destroy", reason: "destroy" });
  await settle();
  assert(!dialog());
});
test("Modal service cancellation awaits the user callback and returns the close reason", async () => {
  const api = ui.createHysModal({ motion: "off" });
  services.add(api);
  const job = deferred(),
    item = api.confirm({ content: "Cancel me", onCancel: () => job.promise });
  const result = item.cancel();
  await settle();
  assert(dialog());
  job.resolve();
  assert(await result);
  assert.deepEqual(await item.closed, { action: "cancel", reason: "cancel" });
});
test("Modal service inherits custom ancestor providers, reactive themes and scope disposal", async () => {
  const key = Symbol("tenant"),
    theme = ref("blue");
  let api, item;
  const Content = defineComponent({
      setup() {
        const value = inject(key);
        return () => h("span", { "data-tenant": "" }, value);
      },
    }),
    Root = defineComponent({
      setup() {
        provide(key, "Tenant A");
        ui.provideHysConfig({ theme: () => theme.value, motion: "off" });
        api = ui.useHysModal();
        return () => null;
      },
    }),
    a = await mount(Root);
  item = api.info({ content: () => h(Content) });
  await settle();
  assert.equal(a.find("[data-tenant]").textContent, "Tenant A");
  theme.value = "purple";
  await settle();
  assert.equal(dialog().getAttribute("data-hys-theme"), "purple");
  a.unmount();
  assert.deepEqual(await item.closed, {
    action: "owner-dispose",
    reason: "owner-dispose",
  });
  assert.throws(() => api.info("Late"), /inactive/);
});
test("Modal service destroyAll cleans every layer, even during async work and before mounting", async () => {
  const api = ui.createHysModal({ motion: "off" });
  services.add(api);
  const job = deferred(),
    a = api.confirm({ onOk: () => job.promise }),
    b = api.info("Second");
  await settle();
  const pending = a.confirm();
  await settle();
  api.destroyAll();
  assert.equal((await a.closed).action, "destroy");
  assert.equal((await b.closed).action, "destroy");
  job.resolve();
  assert.equal(await pending, false);
  assert(!dialog());
  assert.equal(document.body.style.overflow, "");
  api.dispose();
  assert.throws(() => api.info("No"), /inactive/);
});

test("Modal drag coalesces pointer bursts without rendering content or reading layout per frame", async () => {
  let renders = 0;
  const a = await mount(
      ui.HysModal,
      { open: true, draggable: true, overflow: true },
      {
        default: () => {
          renders++;
          return h(
            "div",
            Array.from({ length: 200 }, (_, i) => h("p", "Content " + i)),
          );
        },
      },
    ),
    element = dialog(),
    originalRect = element.getBoundingClientRect.bind(element);
  let reads = 0;
  element.getBoundingClientRect = () => {
    reads++;
    return originalRect();
  };
  const header = a.find("[data-hys-modal-drag-handle]");
  await fire(header, "pointerdown");
  await fire(document, "pointermove", { clientX: 110, clientY: 110 });
  await pause(25);
  await settle();
  const before = renders,
    startReads = reads;
  for (let frame = 0; frame < 4; frame++) {
    for (let i = 0; i < 30; i++) {
      const event = new Event("pointermove", {
        bubbles: true,
        cancelable: true,
      });
      for (const [key, value] of Object.entries({
        pointerId: 1,
        clientX: 150 + frame * 20 + i,
        clientY: 140 + frame * 10 + i,
      }))
        Object.defineProperty(event, key, { value });
      document.dispatchEvent(event);
    }
    await pause(25);
    await settle();
  }
  assert.equal(renders, before);
  assert.equal(reads, startReads);
  assert(a.vm.position.x > 0);
  assert(a.events.drag.length <= 5);
  assert.equal(
    element.style.getPropertyValue("--hys-ui-modal-x"),
    a.vm.position.x + "px",
  );
  await fire(document, "pointerup", { clientX: 250, clientY: 200 });
  assert.deepEqual(a.vm.position, { x: 150, y: 100 });
  assert(renders <= before + 1);
});
test("Modal sizes supply useful widths, custom width wins and dynamic presets reset manual dimensions", async () => {
  const a = await mount(ui.HysModal, {
    open: true,
    size: "xs",
    resizable: true,
  });
  assert.equal(dialog().style.width, "360px");
  for (const [size, width] of [
    ["sm", "440px"],
    ["md", "560px"],
    ["lg", "720px"],
    ["xl", "960px"],
    ["2xl", "1200px"],
    ["full", "100%"],
  ]) {
    a.props.size = size;
    await settle();
    assert.equal(dialog().style.width, width);
  }
  a.props.width = "800px";
  a.props.size = "xs";
  await settle();
  assert.equal(dialog().style.width, "800px");
  a.vm.setSize({ width: 600, height: 300 });
  await settle();
  a.props.size = "md";
  await settle();
  assert.equal(a.vm.dimensions, undefined);
  assert.equal(dialog().style.width, "800px");
});
test("Modal opacity clamps surface and mask independently without fading interactive content", async () => {
  const a = await mount(
    ui.HysModal,
    { open: true, opacity: 0.75, maskOpacity: 0.3 },
    { default: () => h("input") },
  );
  assert(dialog().style.getPropertyValue("--hys-ui-modal-opacity") === "75%");
  assert(
    a
      .find(".hys-ui-modal-overlay")
      .style.getPropertyValue("--hys-ui-modal-mask-opacity") === "30%",
  );
  assert.equal(dialog().style.opacity, "");
  a.props.opacity = 2;
  a.props.maskOpacity = -1;
  await settle();
  assert(dialog().style.getPropertyValue("--hys-ui-modal-opacity") === "100%");
  assert(
    a
      .find(".hys-ui-modal-overlay")
      .style.getPropertyValue("--hys-ui-modal-mask-opacity") === "0%",
  );
  a.props.modal = false;
  await settle();
  assert.equal(a.find(".hys-ui-modal-overlay").style.background, "");
});
test("Modal animates fullscreen and restore without pointer transitions and cancels on close", async () => {
  const original = HTMLElement.prototype.animate,
    animations = [];
  HTMLElement.prototype.animate = function (frames, options) {
    const entry = {
      frames,
      options,
      cancelled: false,
      cancel() {
        this.cancelled = true;
        this.oncancel?.();
      },
    };
    animations.push(entry);
    return entry;
  };
  const api = ref(),
    Root = defineComponent({
      setup() {
        ui.provideHysConfig({ motion: "full" });
        return () =>
          h(ui.HysModal, {
            ref: api,
            defaultOpen: true,
            transitionDuration: 200,
          });
      },
    });
  try {
    await mount(Root);
    await api.value.setFullscreen(true);
    assert.equal(animations.length, 1);
    assert.equal(animations[0].options.duration, 200);
    assert(animations[0].frames[0].transform.includes("scale("));
    await api.value.setFullscreen(false);
    assert(animations[0].cancelled);
    assert.equal(animations.length, 2);
    await api.value.close();
    await settle();
    assert(animations[1].cancelled);
  } finally {
    HTMLElement.prototype.animate = original;
  }
});

test("Modal header and footer have independent density, height and button sizing", async () => {
  const a = await mount(ui.HysModal, {
    open: true,
    title: "Sections",
    footer: true,
    headerSize: "sm",
    footerSize: "lg",
    headerHeight: 80,
    footerHeight: "90px",
    titleFontSize: 21,
  });
  assert(a.find("header").classList.contains("hys-ui-modal-header-sm"));
  assert(a.find("footer").classList.contains("hys-ui-modal-footer-lg"));
  assert.equal(a.find("header").style.minHeight, "80px");
  assert.equal(a.find("footer").style.minHeight, "90px");
  assert.equal(a.find(".hys-ui-modal-title").style.fontSize, "21px");
  assert(ok().classList.contains("hys-ui-btn-lg"));
  a.props.okButtonProps = { size: "sm" };
  await settle();
  assert(ok().classList.contains("hys-ui-btn-sm"));
  assert(cancel().classList.contains("hys-ui-btn-lg"));
});

test("Modal preview dragging moves only the target outline until release and Escape discards it", async () => {
  const a = await mount(ui.HysModal, {
    open: true,
    title: "Preview",
    draggable: true,
    dragMode: "preview",
    overflow: true,
  });
  const element = dialog();
  await fire(a.find("[data-hys-modal-drag-handle]"), "pointerdown");
  assert(!a.find(".hys-ui-modal-drag-preview"));
  await fire(document, "pointermove", { clientX: 110, clientY: 110 });
  assert(a.find(".hys-ui-modal-drag-preview"));
  await fire(document, "pointermove", { clientX: 220, clientY: 170 });
  await pause(25);
  assert.equal(element.style.getPropertyValue("--hys-ui-modal-x"), "0px");
  assert(
    a.find(".hys-ui-modal-drag-preview").style.transform.includes("120px,70px"),
  );
  await fire(document, "pointerup", { clientX: 240, clientY: 180 });
  assert.deepEqual(a.vm.position, { x: 140, y: 80 });
  assert.equal(element.style.getPropertyValue("--hys-ui-modal-x"), "140px");
  assert(!a.find(".hys-ui-modal-drag-preview"));
  await fire(a.find("[data-hys-modal-drag-handle]"), "pointerdown");
  await fire(document, "pointermove", { clientX: 500, clientY: 350 });
  await fire(document, "keydown", { key: "Escape" });
  assert.deepEqual(a.vm.position, { x: 140, y: 80 });
  assert(!a.find(".hys-ui-modal-drag-preview"));
  assert(dialog());
});
test("Modal preview release uses a transform animation and cleans it when closed", async () => {
  const original = HTMLElement.prototype.animate,
    animations = [];
  HTMLElement.prototype.animate = function (frames, options) {
    const animation = {
      frames,
      options,
      cancelled: false,
      cancel() {
        this.cancelled = true;
        this.oncancel?.();
      },
    };
    animations.push(animation);
    return animation;
  };
  const api = ref(),
    Root = defineComponent({
      setup() {
        ui.provideHysConfig({ motion: "full" });
        return () =>
          h(ui.HysModal, {
            ref: api,
            defaultOpen: true,
            draggable: true,
            dragMode: "preview",
            overflow: true,
          });
      },
    });
  try {
    const a = await mount(Root);
    await fire(a.find("[data-hys-modal-drag-handle]"), "pointerdown");
    await fire(document, "pointerup", { clientX: 250, clientY: 200 });
    assert.equal(animations.length, 1);
    assert.equal(animations[0].frames[0].transform, "translate3d(0px,0px,0)");
    assert.equal(
      animations[0].frames[1].transform,
      "translate3d(150px,100px,0)",
    );
    assert.equal(api.value.position.x, 150);
    await api.value.close();
    await settle();
    assert(animations[0].cancelled);
    assert(!a.find(".hys-ui-modal-drag-preview"));
  } finally {
    HTMLElement.prototype.animate = original;
  }
});

test("Modal header press and small jitter do not create drag state, events or a preview", async () => {
  const a = await mount(ui.HysModal, {
    open: true,
    title: "Threshold",
    draggable: true,
    dragMode: "preview",
    overflow: true,
  });
  const header = a.find("[data-hys-modal-drag-handle]");
  const down = await fire(header, "pointerdown");
  assert(!down.defaultPrevented);
  assert(!dialog().classList.contains("hys-ui-modal-dragging"));
  assert(!a.find(".hys-ui-modal-drag-preview"));
  await fire(document, "pointermove", { clientX: 103, clientY: 101 });
  assert(!a.events.dragStart);
  await fire(document, "pointerup", { clientX: 103, clientY: 101 });
  assert(!a.events.dragEnd);
  assert.deepEqual(a.vm.position, { x: 0, y: 0 });
  await fire(header, "pointerdown");
  await fire(document, "pointermove", { clientX: 108, clientY: 100 });
  assert.equal(a.events.dragStart.length, 1);
  assert(dialog().classList.contains("hys-ui-modal-dragging"));
  assert(a.find(".hys-ui-modal-drag-preview"));
  await fire(document, "pointercancel");
  assert.equal(a.events.dragEnd.at(-1)[1].cancelled, true);
  a.props.dragThreshold = 0;
  await settle();
  await fire(header, "pointerdown");
  assert.equal(a.events.dragStart.length, 2);
});

test("Modal drag zone is restricted to the dedicated handle instead of title text and header whitespace", async () => {
  const a = await mount(ui.HysModal, {
    open: true,
    title: "Handle only",
    draggable: true,
    overflow: true,
  });
  assert(a.find("[data-hys-modal-drag-handle]"));
  await fire(a.find("header"), "pointerdown");
  await fire(document, "pointermove", { clientX: 240, clientY: 200 });
  await fire(document, "pointerup", { clientX: 240, clientY: 200 });
  assert(!a.events.dragStart);
  assert.deepEqual(a.vm.position, { x: 0, y: 0 });
  await fire(a.find(".hys-ui-modal-title"), "pointerdown");
  await fire(document, "pointermove", { clientX: 260, clientY: 210 });
  await fire(document, "pointerup", { clientX: 260, clientY: 210 });
  assert(!a.events.dragStart);
  await fire(a.find("[data-hys-modal-drag-handle]"), "pointerdown");
  await fire(document, "pointerup", { clientX: 200, clientY: 180 });
  assert.equal(a.events.dragStart.length, 1);
  assert.deepEqual(a.vm.position, { x: 100, y: 80 });
});

test("Modal keeps its move handle visible in overflow mode and Alt+Home recovers from any focus inside", async () => {
  const a = await mount(
    ui.HysModal,
    { open: true, draggable: true, overflow: true },
    { default: () => h("input") },
  );
  const handle = a.find("[data-hys-modal-drag-handle]");
  a.vm.setPosition({ x: 9999, y: 9999 });
  await settle();
  assert(a.vm.position.x < 1000);
  assert(a.vm.position.y < 768);
  a.props.keepHandleVisible = false;
  await settle();
  a.vm.setPosition({ x: 9999, y: 9999 });
  await settle();
  assert.equal(a.vm.position.x, 9999);
  a.find("input").focus();
  await fire(a.find("input"), "keydown", { key: "Home", altKey: true });
  assert.deepEqual(a.vm.position, { x: 0, y: 0 });
  a.props.keepHandleVisible = true;
  await settle();
  await fire(handle, "pointerdown");
  await fire(document, "pointerup", { clientX: 9999, clientY: 9999 });
  assert(a.vm.position.x < 1000);
});
test("Modal reset methods animate movement and size and close cancels their animations", async () => {
  const original = HTMLElement.prototype.animate,
    animations = [];
  HTMLElement.prototype.animate = function (frames, options) {
    const animation = {
      frames,
      options,
      cancelled: false,
      cancel() {
        this.cancelled = true;
        this.oncancel?.();
      },
    };
    animations.push(animation);
    return animation;
  };
  const api = ref(),
    Root = defineComponent({
      setup() {
        ui.provideHysConfig({ motion: "full" });
        return () =>
          h(ui.HysModal, {
            ref: api,
            defaultOpen: true,
            draggable: true,
            overflow: true,
          });
      },
    });
  try {
    await mount(Root);
    api.value.setPosition({ x: 60, y: 40 });
    await settle();
    api.value.resetPosition();
    assert.equal(animations.length, 1);
    assert.equal(animations[0].frames[1].transform, "translate3d(0px,0px,0)");
    api.value.setSize({ width: 500, height: 300 });
    await settle();
    api.value.resetSize();
    assert.equal(animations.length, 2);
    assert(animations[1].frames[0].transform.includes("scale("));
    await api.value.close();
    await settle();
    assert(animations[1].cancelled);
  } finally {
    HTMLElement.prototype.animate = original;
  }
});

test("Modal repeated viewport resize events clamp against the applied position without cumulative jumps", async () => {
  const a = await mount(ui.HysModal, {
      open: true,
      draggable: true,
      overflow: true,
    }),
    panel = dialog(),
    handle = a.find("[data-hys-modal-drag-handle]");
  const rect = (x, y, w, h) => ({
    x,
    y,
    left: x,
    top: y,
    right: x + w,
    bottom: y + h,
    width: w,
    height: h,
  });
  const x = () =>
      parseFloat(panel.style.getPropertyValue("--hys-ui-modal-x")) || 0,
    y = () => parseFloat(panel.style.getPropertyValue("--hys-ui-modal-y")) || 0;
  panel.getBoundingClientRect = () => rect(200 + x(), 150 + y(), 560, 400);
  handle.getBoundingClientRect = () => rect(224 + x(), 170 + y(), 24, 28);
  try {
    a.vm.setPosition({ x: 600, y: 0 });
    await settle();
    Object.defineProperty(document.documentElement, "clientWidth", {
      value: 500,
      configurable: true,
    });
    window.dispatchEvent(new Event("resize"));
    window.dispatchEvent(new Event("resize"));
    window.dispatchEvent(new Event("resize"));
    await settle();
    assert.equal(a.vm.position.x, 244);
    assert.equal(handle.getBoundingClientRect().right, 492);
  } finally {
    Object.defineProperty(document.documentElement, "clientWidth", {
      value: 0,
      configurable: true,
    });
  }
});
