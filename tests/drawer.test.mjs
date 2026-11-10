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
globalThis.getComputedStyle = window.getComputedStyle.bind(window);
globalThis.requestAnimationFrame = window.requestAnimationFrame.bind(window);
globalThis.cancelAnimationFrame = window.cancelAnimationFrame.bind(window);
window.matchMedia = () => ({
  matches: false,
  addEventListener() {},
  removeEventListener() {},
});
Object.defineProperty(document.documentElement, "clientWidth", {
  value: 1024,
  configurable: true,
});
Object.defineProperty(document.documentElement, "clientHeight", {
  value: 768,
  configurable: true,
});
let panelReads = 0,
  rootWidth = 1024;
const cssSize = (value, extent, fallback) =>
  value?.endsWith("%")
    ? (parseFloat(value) * extent) / 100
    : value?.endsWith("dvh")
      ? (parseFloat(value) * 768) / 100
      : parseFloat(value) || fallback;
HTMLElement.prototype.getBoundingClientRect = function () {
  let width = rootWidth,
    height = 768,
    left = 0,
    top = 0;
  if (this.classList.contains("hys-ui-drawer-panel")) {
    panelReads++;
    width = Math.min(rootWidth, cssSize(this.style.width, rootWidth, 520));
    height = Math.min(768, cssSize(this.style.height, 768, 768));
    if (this.parentElement?.classList.contains("hys-ui-drawer-right"))
      left = rootWidth - width;
    if (this.parentElement?.classList.contains("hys-ui-drawer-bottom"))
      top = 768 - height;
  } else if (!this.classList.contains("hys-ui-drawer-root")) {
    width = 200;
    height = 40;
    left = 20;
    top = 20;
  }
  return {
    x: left,
    y: top,
    left,
    top,
    right: left + width,
    bottom: top + height,
    width,
    height,
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
const { createApp, h, reactive, ref, nextTick, KeepAlive } =
    await import("vue"),
  ui = await import("../packages/ui/dist/index.js"),
  apps = [];
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  settle = async () => {
    for (let i = 0; i < 8; i++) await nextTick();
    await pause(2);
  };
afterEach(() => {
  for (const { app, host } of apps.splice(0)) {
    app.unmount();
    host.remove();
  }
  document.body.replaceChildren();
  document.body.style.overflow = "";
  document.documentElement.style.cursor = "";
  document.documentElement.style.userSelect = "";
  rootWidth = 1024;
});
async function mount(values = {}, slots = {}, accept = true) {
  const props = reactive(values),
    events = {},
    hooks = {},
    vm = ref(),
    shown = ref(true),
    host = document.createElement("div");
  document.body.append(host);
  const handlers = Object.fromEntries(
    ui.HysDrawer.emits.map((name) => [
      "on" + name[0].toUpperCase() + name.slice(1),
      (...args) => {
        (events[name] ??= []).push(args);
        hooks[name]?.(...args);
        if (
          accept &&
          name.startsWith("update:") &&
          Object.hasOwn(values, name.slice(7))
        )
          props[name.slice(7)] = args[0];
      },
    ]),
  );
  const app = createApp({
    setup() {
      ui.provideHysConfig({ motion: "off" });
      return () =>
        h(KeepAlive, null, {
          default: () =>
            shown.value
              ? h(ui.HysDrawer, { ...props, ...handlers, ref: vm }, slots)
              : null,
        });
    },
  });
  app.mount(host);
  apps.push({ app, host });
  await settle();
  return {
    props,
    events,
    hooks,
    shown,
    host,
    get vm() {
      return vm.value;
    },
    get panel() {
      return document.querySelector(".hys-ui-drawer-panel");
    },
    get root() {
      return document.querySelector(".hys-ui-drawer-root");
    },
  };
}
async function fire(target, type, options = {}) {
  const Ctor = type.startsWith("key")
      ? KeyboardEvent
      : type === "click"
        ? MouseEvent
        : Event,
    event = new Ctor(type, { bubbles: true, cancelable: true, ...options });
  if (type.startsWith("pointer"))
    for (const [key, value] of Object.entries({
      pointerId: 1,
      button: 0,
      isPrimary: true,
      clientX: 500,
      clientY: 400,
      ...options,
    }))
      Object.defineProperty(event, key, { value, configurable: true });
  target.dispatchEvent(event);
  await settle();
  return event;
}
const count = (a, event) => a.events[event]?.length ?? 0;
test("Legacy open/close handler, default dimensions and directional variables remain compatible", async () => {
  const a = await mount({ open: true, title: "Legacy" });
  assert.equal(a.panel.style.width, "520px");
  assert.equal(document.body.style.overflow, "hidden");
  for (const placement of ["left", "right", "top", "bottom"]) {
    a.props.placement = placement;
    await settle();
    assert.equal(
      a.panel.style.getPropertyValue("--hys-ui-drawer-enter-x"),
      placement === "left" ? "-100%" : placement === "right" ? "100%" : "0px",
    );
    assert.equal(
      a.panel.style.getPropertyValue("--hys-ui-drawer-enter-y"),
      placement === "top" ? "-100%" : placement === "bottom" ? "100%" : "0px",
    );
  }
  await a.vm.close();
  assert.equal(count(a, "close"), 1);
  assert.equal(a.events.close[0].length, 0);
  assert.equal(a.props.open, false);
  assert.notEqual(document.body.style.overflow, "hidden");
});
test("Uncontrolled defaultOpen and both binding names close and reopen independently", async () => {
  const a = await mount({ defaultOpen: true });
  assert.equal(a.vm.open, true);
  assert.equal(await a.vm.hide(), true);
  assert.equal(a.vm.open, false);
  assert.equal(await a.vm.show(), true);
  await settle();
  assert.equal(a.vm.open, true);
  assert.equal(count(a, "open"), 2);
});
test("Controlled host refusals preserve actual visibility while retaining the close request event", async () => {
  const a = await mount({ modelValue: true, title: "Controlled" }, {}, false);
  assert.equal(await a.vm.close(), false);
  assert.equal(a.vm.open, true);
  assert.equal(count(a, "close"), 1);
  assert.equal(a.events["update:modelValue"][0][0], false);
  assert.equal(count(a, "closed"), 0);
});
test("Lazy, retained and forced content have distinct mounting and inert states", async () => {
  const a = await mount(
    { open: false, destroyOnClose: false },
    { default: () => h("input", { "aria-label": "Retained" }) },
  );
  assert.equal(a.panel, null);
  a.props.open = true;
  await settle();
  const input = a.panel.querySelector("input");
  input.value = "Kept";
  await a.vm.close();
  await settle();
  assert.equal(a.panel.querySelector("input"), input);
  assert(a.root.inert);
  a.props.open = true;
  await settle();
  assert.equal(a.panel.querySelector("input").value, "Kept");
});
test("forceRender creates hidden inert content without acquiring a scroll lock", async () => {
  const a = await mount({ forceRender: true });
  assert(a.panel);
  assert(a.root.inert);
  assert.notEqual(document.body.style.overflow, "hidden");
  assert.equal(a.vm.open, false);
});
test("Open and close delays cancel stale requests and report completion once per cycle", async () => {
  const a = await mount({ open: false, openDelay: 15, closeDelay: 10 });
  a.props.open = true;
  await settle();
  assert.equal(a.vm.open, false);
  a.props.open = false;
  await pause(25);
  assert.equal(count(a, "open"), 0);
  a.props.open = true;
  await pause(25);
  await settle();
  assert.equal(a.vm.open, true);
  await a.vm.close();
  assert.equal(a.vm.open, true);
  await pause(20);
  await settle();
  assert.equal(a.vm.open, false);
  assert.equal(count(a, "closed"), 1);
  assert.deepEqual(
    a.events.afterOpenChange.map((e) => e[0]),
    [true, false],
  );
});
test("Async guard veto, errors and retries preserve the request reason and AbortSignal", async () => {
  let mode = "veto",
    context;
  const a = await mount({
    open: true,
    beforeClose: (reason, info) => {
      context = info;
      assert.equal(reason, "button");
      if (mode === "veto") return false;
      if (mode === "error") throw Error("Failed");
    },
  });
  assert.equal(await a.vm.close(), false);
  assert(context.signal instanceof AbortSignal);
  assert.equal(a.vm.open, true);
  mode = "error";
  assert.equal(await a.vm.close(), false);
  assert.equal(count(a, "closeError"), 1);
  assert.match(a.panel.querySelector('[role="alert"]').textContent, /重试/);
  mode = "ok";
  assert.equal(await a.vm.close(), true);
});
test("Pending confirmation is deduplicated, blocks closure and can keep the drawer open", async () => {
  let finish, signal;
  const a = await mount({
    open: true,
    footer: true,
    closeOnConfirm: false,
    beforeConfirm: (info) => {
      signal = info.signal;
      return new Promise((resolve) => (finish = resolve));
    },
  });
  const first = a.vm.confirm();
  await settle();
  assert.equal(a.vm.confirming, true);
  assert.equal(await a.vm.confirm(), false);
  assert.equal(await a.vm.close(), false);
  finish();
  assert.equal(await first, true);
  assert.equal(signal.aborted, false);
  assert.equal(count(a, "ok"), 1);
  assert.equal(a.vm.open, true);
});
test("External close and page deactivation abort pending work without stale events", async () => {
  let fail, signal;
  const a = await mount({
    open: true,
    beforeConfirm: (info) => {
      signal = info.signal;
      return new Promise((_, reject) => (fail = reject));
    },
  });
  const pending = a.vm.confirm();
  await settle();
  a.shown.value = false;
  await settle();
  assert(signal.aborted);
  fail(Error("Late"));
  assert.equal(await pending, false);
  assert.equal(count(a, "confirmError"), 0);
  assert.equal(count(a, "ok"), 0);
  assert.notEqual(document.body.style.overflow, "hidden");
  a.shown.value = true;
  await settle();
  assert.equal(a.vm.open, false);
});
test("Default actions, Ctrl+Enter, custom header and footer scopes remain usable", async () => {
  let captured;
  const a = await mount(
    { open: true, title: "Scoped", footer: true, confirmOnCtrlEnter: true },
    {
      header: (scope) => {
        captured = scope;
        return h("h3", { id: scope.titleId }, "Custom header");
      },
      extra: () => h("span", "Extra"),
    },
  );
  assert.equal(a.panel.getAttribute("aria-labelledby"), captured.titleId);
  assert(
    a.panel
      .querySelector(".hys-ui-drawer-head-actions")
      .textContent.includes("Extra"),
  );
  await fire(a.panel, "keydown", { key: "Enter", ctrlKey: true });
  assert.equal(count(a, "ok"), 1);
  assert.equal(a.vm.open, false);
});
test("Loading keeps close actions available, hides content and disables confirmation", async () => {
  const a = await mount(
    { open: true, loading: true, footer: true },
    { default: () => h("input", { "aria-label": "Hidden content" }) },
  );
  assert(a.panel.querySelector('[role="status"]'));
  assert(a.panel.querySelector(".hys-ui-drawer-content").inert);
  assert(a.panel.querySelector("[data-hys-modal-confirm]").disabled);
  assert.equal(await a.vm.confirm(), false);
  assert.equal(await a.vm.close(), true);
});
test("Headerless layout keeps a labeled close entry and no dangling title reference", async () => {
  const a = await mount({ open: true, title: "No header", withHeader: false });
  assert.equal(a.panel.querySelector("header"), null);
  assert.equal(a.panel.getAttribute("aria-labelledby"), null);
  assert.equal(a.panel.getAttribute("aria-label"), "No header");
  assert(a.panel.querySelector(".hys-ui-drawer-floating-close"));
});
test("Contained and nonblocking drawers avoid a global scroll lock and modal semantics", async () => {
  const a = await mount({
    open: true,
    appendTo: false,
    contained: true,
    title: "Inline",
  });
  assert(a.host.contains(a.panel));
  assert.equal(a.panel.getAttribute("aria-modal"), null);
  assert.notEqual(document.body.style.overflow, "hidden");
});
test("Background and mask decoration never dim child content or overwrite custom styles", async () => {
  const a = await mount({
    open: true,
    opacity: 0.65,
    maskOpacity: 0.2,
    drawerStyle: { borderRadius: "10px" },
    maskStyle: { backdropFilter: "none" },
  });
  assert.equal(a.panel.style.opacity, "");
  assert.equal(a.panel.style.borderRadius, "10px");
  assert.equal(
    a.root.querySelector(".hys-ui-drawer-mask").style.backdropFilter,
    "none",
  );
});
for (const placement of ["left", "right", "top", "bottom"])
  test(
    placement +
      " edge resize follows direction, clamps bounds and commits once",
    async () => {
      const a = await mount({
        open: true,
        placement,
        resizable: { minSize: 200, maxSize: 700 },
      });
      await pause(25);
      const handle = a.panel.querySelector('[role="separator"]'),
        axis =
          placement === "top" || placement === "bottom" ? "clientY" : "clientX",
        start = 400,
        delta = placement === "left" || placement === "top" ? 100 : -100;
      await fire(handle, "pointerdown", { [axis]: start });
      await fire(window, "pointermove", { [axis]: start + delta });
      await pause(20);
      await fire(window, "pointerup", { [axis]: start + delta });
      assert.equal(a.vm.size, 620);
      assert.equal(count(a, "update:resizeValue"), 1);
      assert.equal(a.events.resizeEnd.at(-1)[1].accepted, true);
      assert.equal(document.documentElement.style.cursor, "");
    },
  );
test("Escape cancels edge resizing before it can dismiss the drawer", async () => {
  const a = await mount({ open: true, resizable: true });
  const handle = a.panel.querySelector('[role="separator"]');
  await fire(handle, "pointerdown", { clientX: 400 });
  await fire(window, "pointermove", { clientX: 300 });
  await pause(20);
  await fire(window, "keydown", { key: "Escape" });
  assert.equal(a.vm.open, true);
  assert.equal(a.vm.size, 520);
  assert.equal(count(a, "close"), 0);
  assert.equal(count(a, "update:resizeValue"), 0);
  assert.equal(a.events.resizeEnd.at(-1)[1].cancelled, true);
});
test("Controlled resize refusal restores the original size without claiming acceptance", async () => {
  const a = await mount(
    { open: true, resizeValue: 400, resizable: true },
    {},
    false,
  );
  const handle = a.panel.querySelector('[role="separator"]');
  await fire(handle, "pointerdown", { clientX: 400 });
  await fire(window, "pointermove", { clientX: 300 });
  await fire(window, "pointerup");
  assert.equal(a.vm.size, 400);
  assert.equal(a.panel.style.width, "400px");
  assert.equal(a.events.resizeEnd.at(-1)[1].accepted, false);
});
test("Resizer keyboard, percentage limits and reset methods support all sizes", async () => {
  const a = await mount({
    open: true,
    resizable: { minSize: "20%", maxSize: "75%" },
  });
  await pause(25);
  const handle = a.panel.querySelector('[role="separator"]');
  await fire(handle, "keydown", { key: "End" });
  assert.equal(a.vm.size, 768);
  await fire(handle, "keydown", { key: "ArrowRight" });
  assert.equal(a.vm.size, 758);
  await a.vm.resizeTo("50%");
  assert.equal(a.vm.size, 512);
  assert.equal(await a.vm.resetSize(), true);
  await settle();
  assert.equal(a.panel.style.width, "520px");
  assert.equal(await a.vm.resizeTo("invalid"), false);
});
test("Resize pointer events coalesce per frame without recurring layout reads", async () => {
  const a = await mount({ open: true, resizable: true });
  await pause(40);
  const handle = a.panel.querySelector('[role="separator"]');
  await fire(handle, "pointerdown", { clientX: 500 });
  const before = panelReads;
  for (let i = 0; i < 80; i++) {
    const event = new Event("pointermove", { bubbles: true });
    Object.defineProperties(event, {
      pointerId: { value: 1 },
      clientX: { value: 500 - i },
      clientY: { value: 0 },
    });
    window.dispatchEvent(event);
  }
  await pause(25);
  assert.equal(count(a, "resize"), 1);
  assert.equal(panelReads, before);
  await fire(window, "pointerup");
  assert.equal(count(a, "update:resizeValue"), 1);
});
test("Fullscreen supports uncontrolled restoration and suppresses edge handles", async () => {
  const a = await mount({
    open: true,
    width: 600,
    showFullscreen: true,
    resizable: true,
  });
  assert.equal(await a.vm.setFullscreen(true), true);
  await settle();
  assert.equal(a.panel.style.width, "100%");
  assert.equal(a.panel.querySelector('[role="separator"]'), null);
  await a.vm.setFullscreen(false);
  await settle();
  assert.equal(a.panel.style.width, "600px");
});
test("Nested drawers push only the parent and closing children restores its transform", async () => {
  const child = ref(false),
    parent = await mount(
      { open: true, title: "Parent", push: { distance: 120 } },
      {
        default: () =>
          h(ui.HysDrawer, {
            open: child.value,
            title: "Child",
            "onUpdate:open": (value) => (child.value = value),
          }),
      },
    );
  assert.equal(parent.vm.pushed, false);
  child.value = true;
  await settle();
  assert.equal(parent.vm.pushed, true);
  assert.equal(
    parent.panel.style.getPropertyValue("--hys-ui-drawer-push-x"),
    "calc(-1 * 120px)",
  );
  await fire(document, "keydown", { key: "Escape" });
  assert.equal(child.value, false);
  assert.equal(parent.vm.open, true);
  assert.equal(parent.vm.pushed, false);
});
test("Close policies suppress mask and Escape requests while direct close remains available", async () => {
  const a = await mount({
    open: true,
    closeOnMask: false,
    closeOnEscape: false,
  });
  await fire(a.root, "pointerdown");
  await fire(a.root, "pointerup");
  await fire(document, "keydown", { key: "Escape" });
  assert.equal(count(a, "close"), 0);
  assert.equal(await a.vm.close(), true);
});

test("Closed drawers do not retain viewport listeners", async () => {
  const add = window.addEventListener,
    remove = window.removeEventListener,
    handlers = new Set();
  window.addEventListener = function (type, handler, ...rest) {
    if (type === "resize") handlers.add(handler);
    return add.call(this, type, handler, ...rest);
  };
  window.removeEventListener = function (type, handler, ...rest) {
    if (type === "resize") handlers.delete(handler);
    return remove.call(this, type, handler, ...rest);
  };
  try {
    const a = await mount({ open: false });
    assert.equal(handlers.size, 0);
    a.props.open = true;
    await settle();
    assert.equal(handlers.size, 1);
    await a.vm.close();
    await settle();
    assert.equal(handlers.size, 0);
  } finally {
    window.addEventListener = add;
    window.removeEventListener = remove;
  }
});

test("Loading closes body-owned popups before hiding their trigger", async () => {
  const a = await mount(
    { open: true },
    {
      default: () =>
        h(ui.HysSelect, {
          defaultOpen: true,
          options: [{ label: "One", value: 1 }],
        }),
    },
  );
  await pause(30);
  await settle();
  assert(document.querySelector('[role="listbox"]'));
  a.props.loading = true;
  await settle();
  assert.equal(document.querySelector('[role="listbox"]'), null);
});

test("Resize requests are cancelled if their start event closes the owner", async () => {
  const a = await mount({ open: true, resizable: true });
  a.hooks.resizeStart = () => {
    a.props.open = false;
  };
  const handle = a.panel.querySelector('[role="separator"]');
  await fire(handle, "pointerdown", { clientX: 400 });
  await fire(window, "pointermove", { clientX: 300 });
  await settle();
  await fire(window, "pointerup");
  assert.equal(count(a, "update:resizeValue"), 0);
  assert.equal(document.documentElement.style.cursor, "");
});

test("Percentage resize bounds account for the actual root width and scrollbar gutters", async () => {
  rootWidth = 950;
  const a = await mount({ open: true, resizable: true });
  await a.vm.resizeTo("100%");
  await settle();
  assert.equal(a.vm.size, 950);
  assert.equal(a.panel.getBoundingClientRect().width, 950);
});
