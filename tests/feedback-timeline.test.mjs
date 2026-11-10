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
  "Node",
  "Element",
  "HTMLElement",
  "SVGElement",
  "HTMLImageElement",
  "HTMLInputElement",
  "Event",
  "MouseEvent",
  "KeyboardEvent",
  "MutationObserver",
])
  globalThis[name] = dom.window[name];
globalThis.getComputedStyle = window.getComputedStyle.bind(window);
globalThis.requestAnimationFrame = window.requestAnimationFrame.bind(window);
globalThis.cancelAnimationFrame = window.cancelAnimationFrame.bind(window);
let mediaListeners = new Set();
const media = {
  matches: false,
  addEventListener(_event, fn) {
    mediaListeners.add(fn);
  },
  removeEventListener(_event, fn) {
    mediaListeners.delete(fn);
  },
};
window.matchMedia = () => media;
const {
    createApp,
    h,
    reactive,
    ref,
    nextTick,
    defineComponent,
    KeepAlive,
    toRaw,
  } = await import("vue"),
  ui = await import("../packages/ui/dist/index.js");
const apps = [],
  wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  settle = async () => {
    await nextTick();
    await Promise.resolve();
    await nextTick();
  };
afterEach(async () => {
  for (const { app, host } of apps.splice(0)) {
    app.unmount();
    host.remove();
  }
  document.body.replaceChildren();
  media.matches = false;
  mediaListeners.clear();
  await settle();
});
async function mount(
  Component,
  values = {},
  slots = {},
  accept = true,
  config = { motion: "off" },
) {
  const props = reactive({ ...values }),
    events = [],
    warnings = [],
    host = document.createElement("div"),
    vm = ref();
  document.body.append(host);
  const listeners = Object.fromEntries(
    (Component.emits ?? []).map((name) => [
      "on" + name[0].toUpperCase() + name.slice(1),
      (...args) => {
        events.push({ name, args });
        if (
          name.startsWith("update:") &&
          values[name.slice(7)] !== undefined &&
          accept !== false
        )
          props[name.slice(7)] = args[0];
      },
    ]),
  );
  const app = createApp({
    setup() {
      ui.provideHysConfig(config);
      return () => h(Component, { ...props, ...listeners, ref: vm }, slots);
    },
  });
  app.config.warnHandler = (message) => warnings.push(message);
  app.mount(host);
  apps.push({ app, host });
  await settle();
  return {
    app,
    host,
    props,
    events,
    warnings,
    get vm() {
      return vm.value;
    },
    find: (s) => host.querySelector(s),
    all: (s) => [...host.querySelectorAll(s)],
    count: (name) => events.filter((e) => e.name === name).length,
  };
}
async function fire(el, type, options = {}) {
  assert(el);
  el.dispatchEvent(
    new (type === "click"
      ? MouseEvent
      : type === "keydown"
        ? KeyboardEvent
        : Event)(type, { bubbles: true, cancelable: true, ...options }),
  );
  await settle();
}
test("Alert retains visible defaults, legacy content and close request events", async () => {
  const a = await mount(ui.HysAlert, {
    title: "Notice",
    description: "Description",
    closable: true,
  });
  assert(a.find("[role=status]"));
  assert(a.host.textContent.includes("Notice"));
  assert.equal(await a.vm.close(), true);
  assert.equal(a.count("close"), 1);
  assert.equal(a.count("update:visible"), 1);
  assert.equal(a.count("afterClose"), 1);
  assert(!a.find("[role=status]"));
  a.props.title = "Replacement";
  await settle();
  assert(a.find("[role=status]"));
  assert.equal(a.vm.visible, true);
});
test("Controlled Alert veto preserves content but still sends its legacy close request", async () => {
  const a = await mount(
    ui.HysAlert,
    { visible: true, closable: true },
    {},
    false,
  );
  assert.equal(await a.vm.close(), false);
  assert(a.find("[role=status]"));
  assert.equal(a.count("close"), 1);
  assert.equal(a.count("afterClose"), 0);
  assert.equal(a.vm.visible, true);
});
test("Visible takes precedence over modelValue and accepted changes notify afterClose once", async () => {
  const a = await mount(ui.HysAlert, {
    visible: true,
    modelValue: false,
    closable: true,
  });
  assert.equal(a.vm.visible, true);
  await fire(a.find("button"), "click");
  assert.equal(a.props.visible, false);
  assert.equal(a.props.modelValue, false);
  assert.equal(a.count("close"), 1);
  assert.equal(a.count("afterClose"), 1);
  assert.equal(await a.vm.show(), true);
  assert.equal(a.vm.visible, true);
});
test("Non-controlled defaultVisible false opens only through show or the legacy title reset", async () => {
  const a = await mount(ui.HysAlert, {
    defaultVisible: false,
    title: "Hidden",
  });
  assert.equal(a.find("[role=status]"), null);
  assert.equal(await a.vm.show(), true);
  assert(a.find("[role=status]"));
  await a.vm.close();
  a.props.description = "Same notice";
  await settle();
  assert(!a.find("[role=status]"));
});
test("Asynchronous Alert checks prevent duplicate work and false leaves the message visible", async () => {
  let finish, signal;
  const a = await mount(ui.HysAlert, {
    closable: true,
    beforeClose: (context) => {
      signal = context.signal;
      return new Promise((resolve) => (finish = resolve));
    },
  });
  const pending = a.vm.close();
  await settle();
  assert.equal(a.vm.closing, true);
  assert(a.find("button").disabled);
  assert.equal(await a.vm.close(), false);
  finish(false);
  assert.equal(await pending, false);
  assert.equal(signal.aborted, false);
  assert.equal(a.count("close"), 0);
  assert(a.find("[role=status]"));
});
test("Rejected Alert checks emit an error without closing", async () => {
  const a = await mount(ui.HysAlert, {
    beforeClose: async () => {
      throw Error("Denied");
    },
  });
  assert.equal(await a.vm.close(), false);
  assert.equal(a.count("closeError"), 1);
  assert.equal(a.count("close"), 0);
  assert(a.find("[role=status]"));
});
for (const kind of ["disabled", "title", "visible"])
  test(
    "Changing Alert " +
      kind +
      " invalidates an old check and prevents a late dismissal",
    async () => {
      let finish, signal;
      const a = await mount(ui.HysAlert, {
        visible: true,
        beforeClose: (context) => {
          signal = context.signal;
          return new Promise((resolve) => (finish = resolve));
        },
      });
      const pending = a.vm.close();
      await settle();
      a.props[kind] =
        kind === "disabled" ? true : kind === "title" ? "New notice" : false;
      await settle();
      assert(signal.aborted);
      finish(true);
      assert.equal(await pending, false);
      assert.equal(a.count("close"), 0);
      if (kind !== "visible") assert.equal(a.vm.visible, true);
    },
  );
test("Show cancels a pending close before it can affect the current notice", async () => {
  let finish, signal;
  const a = await mount(ui.HysAlert, {
    beforeClose: (context) => {
      signal = context.signal;
      return new Promise((resolve) => (finish = resolve));
    },
  });
  const pending = a.vm.close();
  await settle();
  assert.equal(await a.vm.show(), true);
  assert(signal.aborted);
  finish(true);
  assert.equal(await pending, false);
  assert.equal(a.vm.visible, true);
});
test("Alert actions, title, icon, description and close content receive scoped operations", async () => {
  let scope;
  const a = await mount(
    ui.HysAlert,
    { title: "Old", closable: true, showIcon: true },
    {
      title: () => h("span", "New title"),
      description: () => h("span", "New description"),
      icon: () => h("i", "Icon"),
      "close-icon": () => h("span", "Dismiss"),
      action: (context) => {
        scope = context;
        return h(
          ui.HysButton,
          { onClick: () => context.close() },
          () => "Action",
        );
      },
    },
  );
  assert(a.host.textContent.includes("New title"));
  assert(a.host.textContent.includes("New description"));
  assert(a.host.textContent.includes("Dismiss"));
  assert.equal(scope.tone, "info");
  await fire(a.find(".hys-ui-alert-action button"), "click");
  assert.equal(a.vm.visible, false);
});
test("The Alert default slot keeps priority over the new description slot", async () => {
  const a = await mount(
    ui.HysAlert,
    { description: "Prop" },
    { default: () => "Legacy", description: () => "Other" },
  );
  assert(a.host.textContent.includes("Legacy"));
  assert(!a.host.textContent.includes("Other"));
});
test("Banner defaults can be explicitly overridden and close buttons never submit a form", async () => {
  const a = await mount(ui.HysAlert, { banner: true, closable: true });
  assert(a.find(".hys-ui-ex-warning"));
  assert(a.find(".hys-ui-alert-icon"));
  assert.equal(a.find("button").type, "button");
  a.props.tone = "success";
  a.props.showIcon = false;
  await settle();
  assert(a.find(".hys-ui-ex-success"));
  assert.equal(a.find(".hys-ui-alert-icon"), null);
});
test("Alert custom announcement attributes are preserved", async () => {
  const a = await mount(ui.HysAlert, {
    tone: "danger",
    ariaLive: "off",
    ariaAtomic: false,
    "aria-describedby": "note",
    role: "region",
    ariaLabel: "Notice region",
  });
  const root = a.host.firstElementChild;
  assert.equal(root.getAttribute("role"), "region");
  assert.equal(root.getAttribute("aria-live"), "off");
  assert.equal(root.getAttribute("aria-atomic"), "false");
  assert.equal(root.getAttribute("aria-describedby"), "note");
  assert.equal(root.getAttribute("aria-label"), "Notice region");
});
test("Cached Alert cancels guards, removes media listeners and retains its state", async () => {
  const shown = ref(true),
    vm = ref();
  let finish, signal;
  const Page = defineComponent({
      setup: () => () =>
        h(ui.HysAlert, {
          ref: vm,
          title: "Cached",
          beforeClose: (context) => {
            signal = context.signal;
            return new Promise((resolve) => (finish = resolve));
          },
        }),
    }),
    host = document.createElement("div");
  document.body.append(host);
  const app = createApp({
    setup() {
      ui.provideHysConfig({ motion: "off" });
      return () =>
        h(KeepAlive, () => (shown.value ? h(Page) : h("p", "Other")));
    },
  });
  app.mount(host);
  apps.push({ app, host });
  await settle();
  assert.equal(mediaListeners.size, 1);
  const pending = vm.value.close();
  shown.value = false;
  await settle();
  assert(signal.aborted);
  assert.equal(mediaListeners.size, 0);
  finish(true);
  assert.equal(await pending, false);
  shown.value = true;
  await settle();
  assert.equal(vm.value.visible, true);
  assert.equal(mediaListeners.size, 1);
});
test("Empty retains the Inbox, text defaults and bottom content", async () => {
  const a = await mount(
    ui.HysEmpty,
    {},
    { default: () => h(ui.HysButton, () => "Create") },
  );
  assert(a.host.textContent.includes("暂无数据"));
  assert(a.host.textContent.includes("当前没有符合条件的内容"));
  assert.equal(a.find(".hys-ui-empty-image").style.width, "48px");
  assert(a.find(".hys-ui-empty-builtin"));
  assert(a.find(".hys-ui-empty-action button"));
});
test("Empty text and image may be hidden without leaving blank wrappers", async () => {
  const a = await mount(ui.HysEmpty, {
    title: false,
    description: false,
    image: false,
  });
  assert.equal(a.find(".hys-ui-empty-image"), null);
  assert.equal(a.find(".hys-ui-empty-title"), null);
  assert.equal(a.find(".hys-ui-empty-description"), null);
  assert.equal(a.host.textContent, "");
});
test("Empty illustration choices, size presets and custom image styles are independent", async () => {
  const a = await mount(ui.HysEmpty, {
    illustration: "default",
    size: "lg",
    imageStyle: { width: "150px", height: "90px" },
  });
  assert(a.find(".hys-ui-empty-illustration"));
  assert(a.find(".hys-ui-empty-lg"));
  assert.equal(a.find(".hys-ui-empty-image").style.width, "150px");
  assert.equal(a.find(".hys-ui-empty-image").style.height, "90px");
  a.props.illustration = "simple";
  a.props.imageStyle = {};
  a.props.size = "sm";
  await settle();
  assert.equal(a.find(".hys-ui-empty-image").style.width, "32px");
  assert.equal(a.find(".hys-ui-empty-illustration"), null);
});
test("Remote Empty images expose loading, load and fallback states", async () => {
  const a = await mount(ui.HysEmpty, {
    image: "/image.png",
    imageAlt: "Image",
  });
  assert.equal(a.vm.loadingImage, true);
  assert(a.find(".hys-ui-empty-loading"));
  await fire(a.find("img"), "load");
  assert.equal(a.count("imageLoad"), 1);
  assert.equal(a.vm.loadingImage, false);
  a.props.image = "/bad.png";
  await settle();
  await fire(a.find("img"), "error");
  assert.equal(a.count("imageError"), 1);
  assert.equal(a.vm.failedImage, true);
  assert.equal(a.find("img"), null);
  assert(a.find(".hys-ui-empty-builtin"));
  assert.equal(a.vm.retryImage(), true);
  await settle();
  assert(a.find("img"));
  assert.equal(a.vm.failedImage, false);
});
test("Old Empty image events cannot affect a replacement source", async () => {
  const a = await mount(ui.HysEmpty, { image: "/one.png" }),
    old = a.find("img");
  a.props.image = "/two.png";
  await settle();
  await fire(old, "error");
  assert.equal(a.count("imageError"), 0);
  assert.equal(a.vm.failedImage, false);
  assert(a.find("img").src.endsWith("/two.png"));
});
test("Empty does not render unsafe URLs and can use an accessible custom fallback", async () => {
  const a = await mount(
    ui.HysEmpty,
    { image: "javascript:alert(1)" },
    {
      fallback: ({ retryImage }) =>
        h(ui.HysButton, { onClick: retryImage }, () => "Retry"),
    },
  );
  assert.equal(a.find("img"), null);
  assert(a.find("button"));
  assert.equal(a.find(".hys-ui-empty-image").getAttribute("aria-hidden"), null);
});
test("Empty named content and custom image templates preserve legacy slot behavior", async () => {
  const a = await mount(
    ui.HysEmpty,
    { image: "/ignored.png" },
    {
      image: () => h("span", "Custom image"),
      title: () => "Custom title",
      description: () => "Custom description",
      action: () => h(ui.HysButton, () => "Refresh"),
    },
  );
  assert.equal(a.find("img"), null);
  assert(a.host.textContent.includes("Custom title"));
  assert(a.host.textContent.includes("Custom description"));
  assert(a.host.textContent.includes("Custom image"));
  assert.equal(a.vm.retryImage(), false);
});
test("Empty image-size edge values do not emit invalid dimensions", async () => {
  const a = await mount(ui.HysEmpty, { imageSize: NaN });
  assert.equal(a.find(".hys-ui-empty-image").style.width, "48px");
  a.props.imageSize = 0;
  await settle();
  assert.equal(a.find(".hys-ui-empty-image"), null);
  a.props.imageSize = -50;
  await settle();
  assert.equal(a.find(".hys-ui-empty-image"), null);
});
test("Empty preserves informative image alt text and caller accessibility", async () => {
  const a = await mount(ui.HysEmpty, {
    image: "/image.png",
    imageAlt: "No attachments",
    ariaLabel: "Empty files",
    ariaLive: "polite",
    role: "status",
  });
  assert.equal(a.find("img").alt, "No attachments");
  assert.equal(a.find(".hys-ui-empty-image").getAttribute("aria-hidden"), null);
  assert.equal(
    a.host.firstElementChild.getAttribute("aria-label"),
    "Empty files",
  );
  assert.equal(a.host.firstElementChild.getAttribute("aria-live"), "polite");
});
test("Cached Empty ignores inactive events and reconciles a completed image on return", async () => {
  const shown = ref(true),
    vm = ref();
  let emitted = 0;
  const Page = defineComponent({
      setup: () => () =>
        h(ui.HysEmpty, {
          ref: vm,
          image: "/image.png",
          onImageLoad: () => emitted++,
        }),
    }),
    host = document.createElement("div");
  document.body.append(host);
  const app = createApp({
    setup: () => () =>
      h(KeepAlive, () => (shown.value ? h(Page) : h("p", "Other"))),
  });
  app.mount(host);
  apps.push({ app, host });
  await settle();
  const image = vm.value.imageElement;
  shown.value = false;
  await settle();
  Object.defineProperties(image, {
    complete: { configurable: true, value: true },
    naturalWidth: { configurable: true, value: 100 },
  });
  await fire(image, "load");
  assert.equal(emitted, 0);
  shown.value = true;
  await settle();
  assert.equal(vm.value.loadingImage, false);
  assert.equal(vm.value.failedImage, false);
  assert.equal(emitted, 0);
});
const items = [
  { id: 0, title: "Created", time: "10:00", status: "done" },
  {
    id: 1,
    title: "Review",
    time: "11:00",
    description: "Waiting",
    status: "current",
  },
  { id: 2, title: "Release", status: "pending" },
];
test("Timeline preserves legacy item fields, classes and displayed slot index", async () => {
  const contexts = [],
    a = await mount(
      ui.HysTimeline,
      { items },
      {
        item: (context) => {
          contexts.push(context);
          return h("span", context.item.title + " " + context.index);
        },
      },
    );
  assert(a.host.textContent.includes("Created 0"));
  assert(a.find(".hys-ui-current"));
  assert.equal(a.find(".hys-ui-current").getAttribute("aria-current"), "step");
  assert.equal(contexts[0].key, 0);
  assert.equal(toRaw(contexts[0].item), items[0]);
});
test("Reverse order never mutates source and retains each raw item and source index", async () => {
  const seen = [],
    a = await mount(
      ui.HysTimeline,
      { items, reverse: true },
      {
        item: (context) => {
          seen.push(context);
          return context.item.title;
        },
      },
    );
  assert.deepEqual(
    a.vm.getItems().map((x) => x.title),
    ["Release", "Review", "Created"],
  );
  assert.deepEqual(
    items.map((x) => x.title),
    ["Created", "Review", "Release"],
  );
  assert.equal(seen[0].sourceIndex, 2);
  assert.equal(seen[0].index, 0);
});
test("Timeline item keys preserve interactive slot state across reverse, insertion and host replacement", async () => {
  const Item = defineComponent({
      props: ["name"],
      setup(props) {
        const count = ref(0);
        return () =>
          h(
            "button",
            { onClick: () => count.value++ },
            props.name + " " + count.value,
          );
      },
    }),
    a = await mount(
      ui.HysTimeline,
      { items: [...items] },
      { item: ({ item }) => h(Item, { name: item.title }) },
    );
  await fire(a.all("button")[0], "click");
  a.props.reverse = true;
  await settle();
  assert.equal(a.all("button").at(-1).textContent, "Created 1");
  a.props.items = [
    { id: 3, title: "Inserted" },
    ...a.props.items.map((item) => ({ ...item })),
  ];
  await settle();
  assert.equal(a.all("button").at(-1).textContent, "Inserted 0");
  assert(a.all("button").some((el) => el.textContent === "Created 1"));
});
test("Timeline without ids keeps object-backed state when reordering", async () => {
  const aItem = { title: "A" },
    bItem = { title: "B" },
    a = await mount(
      ui.HysTimeline,
      { items: [aItem, bItem] },
      { item: ({ item }) => h("input", { "data-name": item.title }) },
    );
  a.all("input")[0].value = "Typed";
  a.props.items = [bItem, aItem];
  await settle();
  assert.equal(a.all("input")[1].value, "Typed");
});
test("Duplicate keys and repeated object references stay renderable without Vue duplicate warnings", async () => {
  const raw = { id: 0, title: "Same" },
    a = await mount(ui.HysTimeline, {
      items: [raw, raw, raw, { id: 0, title: "Other" }],
    });
  assert.equal(a.all(".hys-ui-timeline-item").length, 4);
  a.props.reverse = true;
  await settle();
  assert.deepEqual(a.warnings, []);
});
test("Business fields, numeric zero and original source indexes are preserved", async () => {
  let info;
  const raw = { code: 0, meta: { name: "Raw", when: "Today" }, side: "left" };
  const a = await mount(
    ui.HysTimeline,
    {
      items: [null, raw],
      fieldNames: {
        id: "code",
        title: "meta.name",
        time: "meta.when",
        position: "side",
      },
    },
    {
      item: (context) => {
        info = context;
        return context.title;
      },
    },
  );
  assert.equal(info.key, 0);
  assert.equal(info.sourceIndex, 1);
  assert.equal(info.title, "Raw");
  assert.equal(info.time, "Today");
  assert.equal(info.position, "left");
  assert.equal(toRaw(info.item), raw);
});
test("Timeline modes and per-item position choose the expected content sides", async () => {
  const a = await mount(ui.HysTimeline, { items, mode: "alternate" });
  assert.deepEqual(
    a.all(".hys-ui-timeline-item").map((el) => el.dataset.position),
    ["right", "left", "right"],
  );
  a.props.mode = "alternate-reverse";
  await settle();
  assert.deepEqual(
    a.all(".hys-ui-timeline-item").map((el) => el.dataset.position),
    ["left", "right", "left"],
  );
  a.props.mode = "right";
  await settle();
  assert(
    a
      .all(".hys-ui-timeline-item")
      .every((el) => el.dataset.position === "left"),
  );
  a.props.items = [
    { title: "Left", position: "left" },
    { title: "Right", position: "right" },
  ];
  await settle();
  assert(a.find(".hys-ui-timeline-centered"));
});
test("Timeline timestamp placement, hiding and independent labels work together", async () => {
  const a = await mount(ui.HysTimeline, {
    items: [
      {
        title: "A",
        time: "Now",
        label: "Label",
        dateTime: "2026-11-11",
        timePlacement: "top",
      },
    ],
  });
  assert(a.find(".hys-ui-timeline-time-top"));
  assert.equal(a.find("time").getAttribute("datetime"), "2026-11-11");
  assert.equal(a.find(".hys-ui-timeline-label").textContent, "Label");
  a.props.showTime = false;
  await settle();
  assert.equal(a.find("time"), null);
  assert(a.find(".hys-ui-timeline-label"));
});
test("Timeline color, node size, hollow marker and icon templates retain business data", async () => {
  const Icon = defineComponent({
      setup: () => () => h("svg", { "data-node-icon": "" }),
    }),
    a = await mount(
      ui.HysTimeline,
      {
        items: [
          { title: "A", icon: Icon, size: 30, hollow: true, color: "red" },
        ],
      },
      { title: ({ item }) => item.title + " title" },
    );
  assert(a.find("[data-node-icon]"));
  assert.deepEqual(a.warnings, []);
  assert(a.find(".hys-ui-timeline-hollow"));
  assert.equal(
    a
      .find(".hys-ui-timeline-item")
      .style.getPropertyValue("--hys-ui-timeline-node-size"),
    "30px",
  );
  assert.equal(
    a
      .find(".hys-ui-timeline-item")
      .style.getPropertyValue("--hys-ui-timeline-color"),
    "red",
  );
});
test("Pending strings remain at the end when reversing and boolean pending supports loading", async () => {
  const a = await mount(ui.HysTimeline, {
    items,
    reverse: true,
    pending: "More soon",
  });
  assert.equal(a.all(".hys-ui-timeline-item").at(-1).textContent, "More soon");
  assert(!a.find(".hys-ui-timeline-pending .hys-ui-timeline-custom-dot"));
  a.props.pending = true;
  a.props.pendingPosition = "start";
  await settle();
  assert(
    a
      .all(".hys-ui-timeline-item")[0]
      .classList.contains("hys-ui-timeline-pending"),
  );
  assert(a.find(".hys-ui-timeline-pending .hys-ui-timeline-spinner"));
  assert.equal(a.host.firstElementChild.getAttribute("aria-busy"), "true");
});
test("Pending and dot slots can customize the final node and explicit false suppresses it", async () => {
  const a = await mount(
    ui.HysTimeline,
    { items: [] },
    { pending: () => "Custom pending", "pending-dot": () => h("span", "Dot") },
  );
  assert(a.host.textContent.includes("Custom pending"));
  assert(a.host.textContent.includes("Dot"));
  a.props.pending = false;
  await settle();
  assert.equal(a.all("li").length, 0);
});
test("Empty Timeline stays empty by default but supports caller-provided empty content", async () => {
  const a = await mount(ui.HysTimeline, { items: [] });
  assert.equal(a.all("li").length, 0);
  a.props.emptyText = "No history";
  await settle();
  assert.equal(a.find(".hys-ui-timeline-empty").textContent, "No history");
});
test("Timeline loading respects inherited motion and cache departure without global listeners", async () => {
  const motion = ref("off"),
    a = await mount(
      ui.HysTimeline,
      { items: [{ title: "Loading", loading: true }] },
      {},
      true,
      { motion },
    );
  assert(!a.find(".hys-ui-timeline-motion"));
  motion.value = "subtle";
  await settle();
  assert(a.find(".hys-ui-timeline-motion"));
  assert.equal(mediaListeners.size, 0);
});

test("Alert close resolves before its animated exit and afterClose waits for completion", async () => {
  const a = await mount(
    ui.HysAlert,
    {
      title: "Animated",
      closable: true,
      transition: "collapse",
      transitionDuration: 60,
    },
    {},
    true,
    { motion: "subtle" },
  );
  assert.equal(await a.vm.close(), true);
  const leaving = a.find(".hys-ui-alert-panel");
  assert(leaving);
  assert.equal(leaving.getAttribute("aria-hidden"), "true");
  assert(leaving.inert);
  assert.equal(a.count("afterClose"), 0);
  await wait(180);
  assert.equal(a.find(".hys-ui-alert-panel"), null);
  assert.equal(a.count("afterClose"), 1);
});
test("Alert reopened during exit restores semantics without a stale afterClose", async () => {
  const a = await mount(
    ui.HysAlert,
    {
      title: "Reopened",
      closable: true,
      transitionDuration: 70,
      role: "region",
      "aria-hidden": "false",
    },
    {},
    true,
    { motion: "subtle" },
  );
  await a.vm.close();
  await a.vm.show();
  await wait(190);
  const node = a.find("[role=region]");
  assert(node);
  assert.equal(node.getAttribute("aria-hidden"), "false");
  assert.equal(node.inert, false);
  assert.equal(a.count("afterClose"), 0);
});
test("Alert observes reduced motion and releases the listener on unmount", async () => {
  const a = await mount(
    ui.HysAlert,
    { title: "Reduced", transitionDuration: 700 },
    {},
    true,
    { motion: "subtle" },
  );
  assert.equal(mediaListeners.size, 1);
  media.matches = true;
  for (const listener of mediaListeners) listener();
  await settle();
  assert.equal(
    a
      .find(".hys-ui-alert-panel")
      .style.getPropertyValue("--hys-ui-alert-duration"),
    "0ms",
  );
  await a.vm.close();
  await settle();
  assert.equal(a.count("afterClose"), 1);
  a.app.unmount();
  apps.splice(
    apps.findIndex(({ app }) => app === a.app),
    1,
  );
  a.host.remove();
  assert.equal(mediaListeners.size, 0);
});
