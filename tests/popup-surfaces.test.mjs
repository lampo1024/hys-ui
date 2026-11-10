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

const { createApp, h, ref, reactive, nextTick, KeepAlive, defineComponent } =
  await import("vue");
const ui = await import("../packages/ui/dist/index.js");
const apps = [];
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const until = async (predicate) => {
  const end = Date.now() + 1200;
  while (!predicate() && Date.now() < end) await wait(10);
  assert(predicate());
};
const settle = async () => {
  await nextTick();
  await Promise.resolve();
  await nextTick();
};

afterEach(() => {
  for (const { app, host } of apps.splice(0)) {
    app.unmount();
    host.remove();
  }
  document.body.replaceChildren();
});
Object.defineProperty(document.documentElement, "clientWidth", {
  configurable: true,
  value: 1000,
});
Object.defineProperty(document.documentElement, "clientHeight", {
  configurable: true,
  value: 800,
});
const fire = async (el, type, options = {}) => {
  assert(el, "missing " + type);
  const C = type.startsWith("key")
    ? KeyboardEvent
    : type === "click" || type === "contextmenu"
      ? MouseEvent
      : type.startsWith("focus")
        ? FocusEvent
        : Event;
  const e = new C(type, {
    bubbles: !type.startsWith("pointer"),
    cancelable: true,
    ...options,
  });
  el.dispatchEvent(e);
  await settle();
  return e;
};
async function mount(kind = "Popover", values = {}, slots = {}, accept = true) {
  const props = reactive({ ...values }),
    events = [],
    vm = ref(),
    host = document.createElement("div");
  document.body.append(host);
  const Component = ui["Hys" + kind],
    listeners = Object.fromEntries(
      Component.emits.map((name) => [
        "on" + name[0].toUpperCase() + name.slice(1),
        (...args) => {
          events.push({ name, args });
          if (accept && name === "update:open" && props.open !== undefined)
            props.open = args[0];
          if (
            accept &&
            name === "update:modelValue" &&
            props.modelValue !== undefined
          )
            props.modelValue = args[0];
        },
      ]),
    );
  const app = createApp({
    setup() {
      ui.provideHysConfig({ motion: "off" });
      return () =>
        h(
          Component,
          { ...props, ...listeners, ref: vm },
          kind === "Tooltip"
            ? { default: () => "Reference", ...slots }
            : {
                trigger: () => "Reference",
                default: () => h("button", "Action"),
                ...slots,
              },
        );
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
    get reference() {
      return host.querySelector('[tabindex="0"],button');
    },
    get panel() {
      return vm.value?.element;
    },
    count: (name) => events.filter((e) => e.name === name).length,
  };
}
test("Tooltip preserves hover and focus defaults, and Escape never reopens it", async () => {
  const a = await mount("Tooltip", { text: "Help" });
  await fire(a.host.firstElementChild, "pointerenter");
  assert(a.panel);
  assert.equal(a.panel.getAttribute("role"), "tooltip");
  assert.equal(ui.HysTooltip.props.placement.default, "top-start");
  assert.equal(a.vm.placement, "bottom-start");
  assert.equal(
    a.host.firstElementChild.getAttribute("aria-describedby"),
    a.panel.id,
  );
  await fire(document, "keydown", { key: "Escape" });
  assert(!a.panel);
  a.reference.blur();
  a.reference.focus();
  await settle();
  assert(a.panel);
  await fire(document, "keydown", { key: "Escape" });
  assert(!a.panel);
  assert.equal(document.activeElement, a.reference);
});
test("Popover preserves click defaults, content, title and existing scope.close", async () => {
  const a = await mount(
    "Popover",
    { title: "Details", content: "Fallback" },
    { default: ({ close }) => h("button", { onClick: close }, "Done") },
  );
  await fire(a.reference, "click");
  assert(a.panel);
  assert.equal(a.vm.placement, "bottom-end");
  assert.equal(a.panel.getAttribute("aria-label"), "Details");
  await fire(a.panel.querySelector("button"), "click");
  assert(!a.panel);
  assert.equal(a.count("visibleChange"), 2);
});
for (const kind of ["Tooltip", "Popover"])
  test(
    kind + " controlled consumers can reject both opening and dismissal",
    async () => {
      const a = await mount(kind, { open: false, trigger: "click" }, {}, false);
      await fire(a.reference, "click");
      assert(!a.panel);
      assert.equal(a.count("update:open"), 1);
      assert.equal(a.count("visibleChange"), 0);
      a.props.open = true;
      await settle();
      assert(a.panel);
      await fire(document, "keydown", { key: "Escape" });
      assert(a.panel);
      await fire(document.body, "pointerdown");
      assert(a.panel);
      assert.equal(a.count("hide"), 0);
    },
  );
test("Both model aliases work and explicit open takes precedence", async () => {
  const a = await mount("Popover", { modelValue: false });
  await fire(a.reference, "click");
  assert.equal(a.props.modelValue, true);
  assert(a.panel);
  await a.vm.hide();
  assert.equal(a.props.modelValue, false);
  a.props.open = false;
  a.props.modelValue = true;
  await settle();
  assert(!a.panel);
});
test("Hover popover cancels its close timer inside the panel and closes after leaving both regions", async () => {
  const a = await mount("Popover", { trigger: "hover", hideDelay: 15 });
  await fire(a.reference, "pointerenter");
  await fire(a.reference, "pointerleave");
  await fire(a.panel, "pointerenter");
  await wait(40);
  assert(a.panel);
  await fire(a.panel, "pointerleave");
  await wait(35);
  await settle();
  assert(!a.panel);
});
test("Non-enterable tooltip ignores panel hover and closes on trigger exit", async () => {
  const a = await mount("Tooltip", { hideDelay: 10 });
  await fire(a.reference, "pointerenter");
  await fire(a.reference, "pointerleave");
  await fire(a.panel, "pointerenter");
  await wait(30);
  assert(!a.panel);
});
test("Mixed hover/focus trigger remains open while focused after pointer exit", async () => {
  const a = await mount("Tooltip", { hideDelay: 0 });
  a.reference.focus();
  await settle();
  await fire(a.reference, "pointerenter");
  await fire(a.reference, "pointerleave");
  assert(a.panel);
  a.reference.blur();
  await settle();
  assert(!a.panel);
});
test("Mixed click and hover permits pinning until a second click", async () => {
  const a = await mount("Popover", {
    trigger: ["hover", "click"],
    hideDelay: 0,
  });
  await fire(a.reference, "pointerenter");
  await fire(a.reference, "click");
  await fire(a.reference, "pointerleave");
  assert(a.panel);
  await fire(a.reference, "click");
  assert(!a.panel);
});
test("Right click and Shift+F10 open only configured context-menu triggers", async () => {
  const a = await mount("Popover", { trigger: "contextmenu" });
  assert((await fire(a.reference, "contextmenu")).defaultPrevented);
  assert(a.panel);
  await a.vm.hide();
  await fire(a.reference, "keydown", { key: "F10", shiftKey: true });
  assert(a.panel);
  await a.vm.hide();
  a.props.trigger = "manual";
  await settle();
  assert(!(await fire(a.reference, "contextmenu")).defaultPrevented);
  assert(!a.panel);
});
test("Delayed opening is cancelled by leaving, disabling and unmounting", async () => {
  const a = await mount("Tooltip", { showDelay: 20 });
  await fire(a.reference, "pointerenter");
  await fire(a.reference, "pointerleave");
  await wait(40);
  assert(!a.panel);
  await fire(a.reference, "pointerenter");
  a.props.disabled = true;
  await settle();
  await wait(40);
  assert(!a.panel);
  a.props.disabled = false;
  await settle();
  await fire(a.reference, "pointerenter");
  a.app.unmount();
  await wait(40);
  assert.equal(a.count("show"), 0);
});
test("Auto-close is cancellable and a controlled host can refuse its close request", async () => {
  const a = await mount("Popover", { defaultOpen: true, autoClose: 15 });
  assert(a.panel);
  await wait(40);
  assert(!a.panel);
  const b = await mount("Popover", { open: true, autoClose: 15 }, {}, false);
  await wait(40);
  assert(b.panel);
  assert.equal(b.count("update:open"), 1);
  assert.equal(b.count("hide"), 0);
});
test("Instance show, hide, toggle and positioning work with manual triggers", async () => {
  const a = await mount("Tooltip", { trigger: "manual" });
  await fire(a.reference, "click");
  assert(!a.panel);
  assert.equal(await a.vm.show(), true);
  assert(a.panel);
  a.vm.updatePosition();
  assert(a.vm.element);
  assert.equal(await a.vm.toggle(), true);
  assert(!a.panel);
  assert.equal(await a.vm.close(), true);
});
for (const retained of [false, true])
  test(
    (retained ? "Retained" : "Destroyed") + " content follows destroyOnHide",
    async () => {
      const Counter = defineComponent({
        setup() {
          const count = ref(0);
          return () =>
            h("button", { onClick: () => count.value++ }, String(count.value));
        },
      });
      const a = await mount(
        "Popover",
        { destroyOnHide: !retained },
        { default: () => h(Counter) },
      );
      await a.vm.show();
      await fire(a.panel.querySelector("button"), "click");
      assert.equal(a.panel.textContent, "1");
      await a.vm.hide();
      assert.equal(!!a.panel, retained);
      await a.vm.show();
      assert.equal(a.panel.textContent, retained ? "1" : "0");
      assert(!a.panel.inert);
    },
  );
test("forceRender mounts hidden content without opening or registering an overlay", async () => {
  const a = await mount("Popover", { forceRender: true });
  assert(a.panel);
  assert.equal(a.panel.style.display, "none");
  assert.equal(a.count("show"), 0);
  await a.vm.show();
  assert.notEqual(a.panel.style.display, "none");
  await a.vm.hide();
  assert.equal(a.panel.style.display, "none");
});
test("Reference ARIA merges with an existing description and native controls have no extra tab stop", async () => {
  const reference = ref();
  const a = await mount(
    "Tooltip",
    { trigger: "click" },
    {
      default: () =>
        h(
          ui.HysButton,
          { ref: reference, "aria-describedby": "existing" },
          () => "Native",
        ),
    },
  );
  assert(reference.value);
  assert.equal(a.host.firstElementChild.getAttribute("tabindex"), null);
  const button = a.host.querySelector("button");
  await fire(button, "click");
  assert.equal(
    button.getAttribute("aria-describedby"),
    "existing " + a.panel.id,
  );
  await a.vm.hide();
  assert.equal(button.getAttribute("aria-describedby"), "existing");
  assert.equal(a.host.firstElementChild.getAttribute("tabindex"), null);
});
test("Composite input reference keeps its text editing keys and a single tab stop", async () => {
  const a = await mount(
    "Tooltip",
    { trigger: "click" },
    { default: () => h(ui.HysInput, { defaultValue: "Text" }) },
  );
  assert.equal(a.host.firstElementChild.getAttribute("tabindex"), null);
  const input = a.host.querySelector("input");
  assert.equal(
    (await fire(input, "keydown", { key: " " })).defaultPrevented,
    false,
  );
  assert(!a.panel);
});
test("A tooltip never owns or suppresses a popup belonging to its trigger control", async () => {
  const a = await mount(
    "Tooltip",
    { trigger: "manual" },
    {
      default: () =>
        h(ui.HysSelect, {
          defaultOpen: true,
          options: [{ label: "One", value: 1 }],
        }),
    },
  );
  await wait(20);
  assert(document.querySelector('[role="listbox"]'));
  await a.vm.show();
  await a.vm.hide();
  assert(document.querySelector('[role="listbox"]'));
});
test("Popover content owns its child popups and removes them before hiding", async () => {
  const a = await mount(
    "Popover",
    {},
    {
      default: () =>
        h(ui.HysSelect, {
          defaultOpen: true,
          options: [{ label: "One", value: 1 }],
        }),
    },
  );
  await a.vm.show();
  await wait(20);
  assert(document.querySelector('[role="listbox"]'));
  await a.vm.hide();
  assert(!document.querySelector('[role="listbox"]'));
});
test("Native button keyboard handling does not consume or double-fire the generated click", async () => {
  let clicks = 0;
  const a = await mount(
    "Popover",
    {},
    {
      trigger: () =>
        h(ui.HysButton, { onClick: () => clicks++ }, () => "Native"),
    },
  );
  const button = a.reference;
  assert.equal(
    (await fire(button, "keydown", { key: "Enter" })).defaultPrevented,
    false,
  );
  await fire(button, "click");
  assert(a.panel);
  assert.equal(clicks, 1);
  assert.equal(a.count("show"), 1);
});
test("Tab enters popover actions, exits after its last action and Shift+Tab returns to the reference", async () => {
  const a = await mount(
    "Popover",
    {},
    {
      trigger: () => h("button", "Trigger"),
      default: () => [h("button", "First"), h("button", "Last")],
    },
  );
  const next = document.createElement("button");
  document.body.append(next);
  a.reference.focus();
  await a.vm.show();
  await fire(a.reference, "keydown", { key: "Tab" });
  assert.equal(document.activeElement.textContent, "First");
  await fire(document.activeElement, "keydown", { key: "Tab", shiftKey: true });
  assert(!a.panel);
  assert.equal(document.activeElement, a.reference);
  await a.vm.show();
  a.panel.querySelectorAll("button")[1].focus();
  await fire(document.activeElement, "keydown", { key: "Tab" });
  assert(!a.panel);
  assert.equal(document.activeElement, next);
});
test("Escape from content restores the real control and respects dismissal policies", async () => {
  const a = await mount(
    "Popover",
    { closeOnEscape: false, closeOnOutside: false },
    { trigger: () => h("button", "Trigger") },
  );
  await a.vm.show();
  a.panel.querySelector("button").focus();
  await fire(document, "keydown", { key: "Escape" });
  assert(a.panel);
  await fire(document.body, "pointerdown");
  assert(a.panel);
  a.props.closeOnEscape = true;
  await settle();
  await fire(document, "keydown", { key: "Escape" });
  assert(!a.panel);
  assert.equal(document.activeElement, a.reference);
});
test("External references bind and unbind native listeners and restore original ARIA", async () => {
  const button = document.createElement("button");
  button.setAttribute("aria-describedby", "hint");
  document.body.append(button);
  const a = await mount("Tooltip", { reference: button, trigger: "click" });
  await fire(button, "click");
  assert(a.panel);
  assert.equal(button.getAttribute("aria-describedby"), "hint " + a.panel.id);
  await a.vm.hide();
  assert.equal(button.getAttribute("aria-describedby"), "hint");
  a.app.unmount();
  await fire(button, "click");
  assert.equal(a.count("show"), 1);
  assert.equal(button.getAttribute("aria-describedby"), "hint");
});
test("Changing a reference cancels a hover request from the previous reference", async () => {
  const first = document.createElement("button"),
    second = document.createElement("button");
  document.body.append(first, second);
  const a = await mount("Tooltip", { reference: first, showDelay: 20 });
  await fire(first, "pointerenter");
  a.props.reference = second;
  await settle();
  await wait(40);
  assert(!a.panel);
  await fire(first, "pointerenter");
  await wait(40);
  assert(!a.panel);
  await fire(second, "pointerenter");
  await wait(40);
  assert(a.panel);
});

test("An external reference inside the wrapper is not double-bound", async () => {
  const child = ref(),
    a = await mount(
      "Popover",
      {},
      { trigger: () => h("button", { ref: child }, "Trigger") },
    );
  a.props.reference = child.value;
  await settle();
  await fire(child.value, "click");
  assert(a.panel);
  assert.equal(a.count("update:open"), 1);
});
test("Virtual rectangle references can open without an internal trigger", async () => {
  const a = await mount(
    "Tooltip",
    {
      reference: {
        getBoundingClientRect: () => ({
          left: 400,
          right: 440,
          top: 300,
          bottom: 320,
          width: 40,
          height: 20,
          x: 400,
          y: 300,
        }),
      },
      trigger: "manual",
      placement: "bottom",
    },
    { default: () => [] },
  );
  assert.equal(await a.vm.show(), true);
  assert(a.panel);
  assert.equal(a.panel.style.left, "270px");
  assert.equal(a.panel.style.top, "327px");
});
test("In-place content never re-triggers its own click handler and uses absolute positioning", async () => {
  const a = await mount(
    "Popover",
    { appendTo: false },
    { default: ({ close }) => h("button", { onClick: close }, "Done") },
  );
  await a.vm.show();
  assert(a.host.contains(a.panel));
  assert.equal(a.panel.style.position, "absolute");
  await fire(a.panel.querySelector("button"), "click");
  assert(!a.panel);
  assert.equal(a.count("show"), 1);
});
test("A custom portal container receives the floating content", async () => {
  const container = document.createElement("section");
  container.id = "surface-target";
  document.body.append(container);
  const a = await mount("Popover", {
    appendTo: "#surface-target",
    defaultOpen: true,
  });
  assert(container.contains(a.panel));
  assert.equal(a.panel.style.position, "absolute");
});
for (const place of [
  "top",
  "top-start",
  "top-end",
  "bottom",
  "bottom-start",
  "bottom-end",
  "left",
  "left-start",
  "left-end",
  "right",
  "right-start",
  "right-end",
])
  test("Placement " + place + " preserves its axis and alignment", async () => {
    const a = await mount("Popover", {
      placement: place,
      autoAdjustOverflow: false,
      defaultOpen: true,
      showArrow: true,
    });
    a.vm.referenceElement.getBoundingClientRect = () => ({
      left: 400,
      right: 480,
      top: 300,
      bottom: 340,
      width: 80,
      height: 40,
      x: 400,
      y: 300,
    });
    Object.defineProperty(a.panel, "offsetWidth", {
      configurable: true,
      value: 200,
    });
    Object.defineProperty(a.panel, "offsetHeight", {
      configurable: true,
      value: 100,
    });
    a.vm.updatePosition();
    await wait(25);
    const [side, align] = place.split("-"),
      horizontal = side === "left" || side === "right";
    const x = horizontal
      ? side === "left"
        ? 192
        : 488
      : align === "start"
        ? 400
        : align === "end"
          ? 280
          : 340;
    const y = horizontal
      ? align === "start"
        ? 300
        : align === "end"
          ? 240
          : 270
      : side === "top"
        ? 192
        : 348;
    assert.equal(a.panel.style.left, x + "px");
    assert.equal(a.panel.style.top, y + "px");
    assert.equal(a.vm.placement, place);
    assert.equal(a.panel.dataset.placement, place);
    assert(a.panel.querySelector(".hys-ui-popup-arrow"));
    assert(Number.isFinite(parseFloat(a.panel.style.left)));
    assert(Number.isFinite(parseFloat(a.panel.style.top)));
  });
test("A click closes an externally opened click-only popup, and rejected opening can be retried", async () => {
  const a = await mount("Popover", { open: true });
  await fire(a.reference, "click");
  assert(!a.panel);
  const b = await mount("Popover", { open: false }, {}, false);
  await fire(b.reference, "click");
  await fire(b.reference, "click");
  assert.equal(b.count("update:open"), 2);
  assert(
    b.events
      .filter((e) => e.name === "update:open")
      .every((e) => e.args[0] === true),
  );
});
test("Popup geometry reacts to offsets and viewport overflow without measuring animated size", async () => {
  const a = await mount("Popover", {
    defaultOpen: true,
    placement: "bottom-start",
    offset: 8,
  });
  assert.equal(a.panel.style.top, "68px");
  a.props.offset = 28;
  await settle();
  await wait(25);
  assert.equal(a.panel.style.top, "88px");
  a.props.placement = "top-start";
  await settle();
  await wait(25);
  assert.equal(a.vm.placement, "bottom-start");
});
test("Sizing, custom surface colors and constrained scrolling are independent of content opacity", async () => {
  const a = await mount("Tooltip", {
    defaultOpen: true,
    width: 260,
    maxWidth: 300,
    maxHeight: 180,
    color: "#136644",
    textColor: "#ffffff",
    showArrow: true,
    overlayClass: "custom-surface",
    contentClass: "custom-content",
  });
  assert.equal(a.panel.style.width, "260px");
  assert(a.panel.classList.contains("custom-surface"));
  assert.equal(
    a.panel.style.getPropertyValue("--hys-ui-popup-surface"),
    "#136644",
  );
  assert(
    a.panel.querySelector(".custom-content").style.maxHeight.includes("180px"),
  );
  assert.equal(a.panel.style.opacity, "");
});
test("Visibility and transition lifecycle events fire only for accepted actual changes", async () => {
  const a = await mount("Popover", {});
  await a.vm.show();
  await settle();
  assert.equal(a.count("show"), 1);
  assert.equal(a.count("opened"), 1);
  await a.vm.show();
  assert.equal(a.count("show"), 1);
  await a.vm.hide();
  await settle();
  assert.equal(a.count("hide"), 1);
  assert.equal(a.count("closed"), 1);
  assert.equal(a.count("openChange"), 2);
});
test("Cached page deactivation cancels pending hover and does not revive old controlled visibility", async () => {
  const visible = ref(true),
    open = ref(true),
    vm = ref();
  const Page = defineComponent({
    setup: () => () =>
      h(
        ui.HysPopover,
        { ref: vm, open: open.value, trigger: "hover", showDelay: 15 },
        {
          trigger: () => h("button", "Cached"),
          default: () => h("p", "Content"),
        },
      ),
  });
  const host = document.createElement("div");
  document.body.append(host);
  const app = createApp({
    setup() {
      ui.provideHysConfig({ motion: "off" });
      return () =>
        h(KeepAlive, null, {
          default: () => (visible.value ? h(Page) : h("p", "Other")),
        });
    },
  });
  app.mount(host);
  apps.push({ app, host });
  await settle();
  assert(document.querySelector('[role="dialog"]'));
  visible.value = false;
  await settle();
  assert(!document.querySelector('[role="dialog"]'));
  visible.value = true;
  await settle();
  await wait(30);
  assert(!document.querySelector('[role="dialog"]'));
  await vm.value.show();
  assert(document.querySelector('[role="dialog"]'));
});
