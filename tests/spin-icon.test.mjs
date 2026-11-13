import { afterEach, test } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  pretendToBeVisual: true,
  url: "https://example.test/",
});
for (const name of [
  "window",
  "document",
  "Node",
  "Element",
  "HTMLElement",
  "SVGElement",
  "ShadowRoot",
  "Event",
  "MouseEvent",
  "KeyboardEvent",
  "DOMParser",
  "getComputedStyle",
  "requestAnimationFrame",
  "cancelAnimationFrame",
]) {
  Object.defineProperty(globalThis, name, {
    configurable: true,
    value: [
      "getComputedStyle",
      "requestAnimationFrame",
      "cancelAnimationFrame",
    ].includes(name)
      ? dom.window[name].bind(dom.window)
      : dom.window[name],
  });
}
window.matchMedia = () => ({
  matches: false,
  addEventListener() {},
  removeEventListener() {},
});
const { createApp, h, reactive, ref, nextTick } = await import("vue");
const ui = await import("../packages/ui/dist/index.js");
const cleanup = [];
async function mount(Component, initial = {}, slots = {}) {
  const props = reactive(initial),
    host = document.createElement("div"),
    instance = ref();
  document.body.append(host);
  const app = createApp({
    render: () => h(Component, { ...props, ref: instance }, slots),
  });
  app.mount(host);
  cleanup.push(() => app.unmount());
  await settle();
  return { props, host, instance: instance.value };
}
async function settle() {
  await nextTick();
  await Promise.resolve();
  await nextTick();
}
async function until(predicate) {
  const deadline = Date.now() + 1500;
  while (!predicate() && Date.now() < deadline)
    await new Promise((resolve) => setTimeout(resolve, 10));
  assert(predicate());
}
afterEach(() => {
  for (const dispose of cleanup.splice(0).reverse()) dispose();
  document.body.replaceChildren();
});
const deferred = () => {
  let resolve;
  const promise = new Promise((done) => {
    resolve = done;
  });
  return { promise, resolve };
};
const glyph = (d) => ({ type: "svg", nodes: [{ tag: "path", attrs: { d } }] });

test("Spin skips short requests and honors its minimum visible duration", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout", "Date"] });
  const events = [];
  const { props, instance, host } = await mount(ui.HysSpin, {
    spinning: false,
    delay: 120,
    minDuration: 300,
    onShow: () => events.push("show"),
    onHide: () => events.push("hide"),
  });
  props.spinning = true;
  await settle();
  t.mock.timers.tick(70);
  props.spinning = false;
  await settle();
  t.mock.timers.tick(1000);
  assert(!host.querySelector(".hys-spin-layer"));
  assert.deepEqual(events, []);
  props.spinning = true;
  await settle();
  t.mock.timers.tick(120);
  await settle();
  assert(instance.visible);
  props.spinning = false;
  await settle();
  t.mock.timers.tick(299);
  assert(instance.visible);
  t.mock.timers.tick(1);
  await settle();
  assert.equal(instance.visible, false);
  assert.deepEqual(events, ["show", "hide"]);
});

test("Spin replaces stale tasks, aborts on timeout, and retries a factory", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout", "Date"] });
  const task = ui.useHysSpinTask(),
    old = deferred();
  let oldSignal;
  const previous = task.run(({ signal }) => {
    oldSignal = signal;
    return old.promise;
  });
  const cancelled = assert.rejects(previous, { name: "AbortError" });
  await Promise.resolve();
  const current = task.run(
    ({ attempt, update }) => {
      update({ progress: 65, stage: "Verifying" });
      return attempt === 1 ? new Promise(() => {}) : 48;
    },
    { timeout: 100 },
  );
  const timedOut = assert.rejects(current, { name: "TimeoutError" });
  await cancelled;
  assert(oldSignal.aborted);
  old.resolve("stale");
  await Promise.resolve();
  assert.equal(task.state.value.progress, 65);
  t.mock.timers.tick(100);
  await timedOut;
  assert.equal(task.state.value.status, "timeout");
  assert.equal(await task.retry(), 48);
  assert.equal(task.state.value.status, "success");
  assert.equal(task.state.value.progress, 100);
});

test("A blocking Spin makes local content inert and restores fullscreen scroll", async () => {
  const local = await mount(
    ui.HysSpin,
    { spinning: true, mode: "overlay", progress: 25 },
    { default: () => h("button", "Underlying") },
  );
  assert(local.host.querySelector(".hys-spin-content").hasAttribute("inert"));
  assert.equal(
    local.host
      .querySelector('[role="progressbar"]')
      .getAttribute("aria-valuenow"),
    "25",
  );
  local.props.blockInteraction = false;
  await settle();
  assert(!local.host.querySelector(".hys-spin-content").hasAttribute("inert"));
  const full = await mount(ui.HysSpin, {
    spinning: true,
    mode: "fullscreen",
    ariaLabel: "Loading records",
  });
  assert.equal(document.body.style.overflow, "hidden");
  assert(
    document.querySelector('[role="dialog"][aria-label="Loading records"]'),
  );
  full.props.spinning = false;
  await settle();
  assert.equal(document.body.style.overflow, "");
});

test("Programmatic Spin returns business data and disposes its host", async () => {
  const service = ui.createHysSpin({ motion: "off" });
  cleanup.push(() => service.dispose());
  const result = await service.run(({ progress }) => {
    progress(100);
    return "ready";
  });
  assert.equal(result, "ready");
  const handle = service.show({ message: "Manual loading" });
  await settle();
  handle.update({ message: "Updated loading" });
  await settle();
  assert(document.body.textContent.includes("Updated loading"));
  handle.close();
  await handle.closed;
  await until(() => !document.querySelector("[data-hys-spin-host]"));
});

test("Built-in icons resolve as SVGs and are searchable across business categories", async () => {
  const registry = ui.createHysIconRegistry();
  const records = registry.list();
  assert.ok(records.length >= 1000);
  assert.equal(records.length, Object.keys(ui.hysBuiltinIcons.icons).length);
  assert.equal(registry.get("calendar-range"), undefined);
  assert.ok(registry.get("search"));
  const outlines = await Promise.all(
    records.map(({ name }) => registry.load(name)),
  );
  const distinct = new Set();
  for (const [index, { name, label, category }] of records.entries()) {
    assert.match(name, /^core:/);
    assert.ok(label && category, name);
    const source = outlines[index];
    assert.equal(source.type, "svg", name);
    const markup = ui.serializeHysIconSvg(source);
    assert.ok(ui.importHysIconSvg(markup).nodes[0].children.length, name);
    distinct.add(markup);
  }
  assert.equal(distinct.size, records.length);

  const searches = [
    ["工作台", "导航", "layout-dashboard"],
    ["修改", "操作", "pencil"],
    ["电子表格", "文件", "file-spreadsheet"],
    ["防护", "账户与安全", "shield-check"],
    ["折线图", "数据与图表", "chart-line"],
    ["物流", "商业与物流", "truck"],
    ["wifi", "设备与网络", "wifi"],
    ["电子邮件", "沟通与通知", "mail"],
    ["排期", "日期与时间", "calendar"],
    ["麦克风", "媒体", "mic"],
    ["坐标", "地图与位置", "map-pin"],
    ["斜体", "编辑器", "italic"],
    ["日期范围", "日期与时间", "calendar-range"],
    ["雷暴", "天气", "cloud-lightning"],
  ];
  for (const [query, category, name] of searches)
    assert.ok(
      registry
        .search(query, { category, namespace: "core", fuzzy: false })
        .some((record) => record.name === "core:" + name),
      name,
    );

  assert.equal(registry.get("edit"), registry.get("core:pencil"));
  assert.equal(registry.get("clock-4"), registry.get("core:clock"));
  assert.equal(registry.search("line-chart")[0].name, "core:chart-line");
  assert.equal(
    registry.search("calendar-range", { variant: "thin" })[0].name,
    "core:calendar-range",
  );
  assert.equal(
    registry.get("calendar-range", "thin"),
    registry.get("calendar-range"),
  );
  assert.equal(registry.resolve("chevron-left").directional, true);
  assert.ok(registry.resolve("folder").variants.includes("filled"));
  assert.equal(ui.createHysIconRegistry({ builtins: false }).list().length, 0);

  const { host } = await mount(ui.HysIcon, {
    name: "calendar-range",
    variant: "thin",
  });
  await until(() => host.querySelector('svg[stroke-width="1"]'));
});

test("Icon registry shares lazy loads across aliases and replaces a version atomically", async () => {
  const registry = ui.createHysIconRegistry({ builtins: false });
  let calls = 0;
  registry.register({
    namespace: "team",
    version: "1",
    icons: {
      metric: {
        aliases: ["trend"],
        label: "趋势指标",
        keywords: ["chart"],
        source: async () => {
          calls++;
          return glyph("M1 1L2 2");
        },
      },
    },
  });
  const [a, b] = await Promise.all([
    registry.load("team:trend"),
    registry.load("team:metric"),
  ]);
  assert.equal(a, b);
  assert.equal(calls, 1);
  assert.equal(
    registry.search("trd", { namespace: "team" })[0].name,
    "team:metric",
  );
  assert.throws(
    () =>
      registry.register({
        namespace: "team",
        icons: { another: { aliases: ["trend"], source: glyph("M1 1L3 3") } },
      }),
    /Duplicate/,
  );
  assert.equal(registry.list().length, 1);
  registry.register(
    {
      namespace: "team",
      version: "2",
      icons: {
        metric: { aliases: ["trend"], source: glyph("M1 1L4 4") },
      },
    },
    "replace",
  );
  assert.equal(registry.resolve("team:trend").version, "2");
  assert.notEqual(registry.get("team:trend"), a);
});

test("SVG import filters executable content and scopes local references per icon", async () => {
  const imported =
    ui.importHysIconSvg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" onload="bad()">
    <script>bad()</script><foreignObject><div xmlns="http://www.w3.org/1999/xhtml">bad</div></foreignObject>
    <defs><linearGradient id="paint"><stop offset="0" stop-color="red"/></linearGradient></defs>
    <path d="M2 2L20 20" fill="url(#paint)" stroke="url(https://evil.test/x)" onclick="bad()"/>
  </svg>`);
  const xml = ui.serializeHysIconSvg(imported);
  assert(!/bad\(|script|foreignObject|evil\.test/.test(xml));
  assert(xml.includes('fill="url(#paint)"'));
  assert.throws(
    () => ui.importHysIconSvg("<!DOCTYPE svg><svg/>"),
    /document type/,
  );
  const a = await mount(ui.HysIcon, { source: imported });
  const b = await mount(ui.HysIcon, { source: imported });
  const first = a.host.querySelector("linearGradient").id,
    second = b.host.querySelector("linearGradient").id;
  assert.notEqual(first, second);
  assert.equal(
    a.host.querySelector("path").getAttribute("fill"),
    "url(#" + first + ")",
  );
});

test("Icon ignores stale async resources and rejects unsafe image URLs", async () => {
  const registry = ui.createHysIconRegistry();
  const slow = deferred();
  registry.register({
    namespace: "team",
    icons: {
      slow: () => slow.promise,
      fast: glyph("M2 2L3 3"),
      external: { type: "image", src: "https://cdn.example.test/icon.svg" },
    },
  });
  const [external] = await registry.preload(["team:external"], "outline", []);
  assert.equal(external.status, "rejected");
  assert.equal(
    registry.search("fast", { variant: "round" })[0].name,
    "team:fast",
  );
  let failures = 0;
  const { host, props } = await mount(ui.HysIcon, {
    registry,
    name: "team:slow",
    onError: () => failures++,
  });
  props.name = "team:fast";
  await settle();
  slow.resolve(glyph("M0 0L1 1"));
  await settle();
  assert.equal(host.querySelector("path").getAttribute("d"), "M2 2L3 3");
  props.source = { type: "image", src: "javascript:alert(1)" };
  await settle();
  assert(!host.querySelector("img"));
  assert(host.querySelector("svg"));
  assert.equal(failures, 1);
});

test("Icon buttons expose an accessible name and ignore disabled actions", async () => {
  const events = [];
  const { host, props } = await mount(ui.HysIcon, {
    name: "star",
    clickable: true,
    selected: false,
    label: "Favorite",
    onClick: () => events.push("click"),
    "onUpdate:selected": (value) => events.push(value),
  });
  const button = host.querySelector("button");
  assert.equal(button.getAttribute("aria-label"), "Favorite");
  button.click();
  assert.deepEqual(events, [true, "click"]);
  props.disabled = true;
  await settle();
  button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  assert.deepEqual(events, [true, "click"]);
});
test("Overlapping local Spin services restore the target only after the last release", async () => {
  const target = document.createElement("section");
  target.style.overflow = "auto";
  const original = document.createElement("button");
  original.textContent = "Region action";
  target.append(original);
  document.body.append(target);
  const service = ui.createHysSpin({ motion: "off" });
  cleanup.push(() => service.dispose());
  const options = {
    mode: "overlay",
    appendTo: target,
    lockScroll: true,
    message: "Working",
  };
  const first = service.show(options),
    second = service.show(options);
  await settle();
  assert.equal(target.querySelectorAll("[data-hys-spin-portal]").length, 2);
  assert.equal(target.style.position, "relative");
  assert.equal(target.style.overflow, "hidden");
  assert(original.hasAttribute("inert"));
  first.close();
  await first.closed;
  assert(original.hasAttribute("inert"));
  second.close();
  await second.closed;
  await settle();
  assert(!original.hasAttribute("inert"));
  assert.equal(target.style.position, "");
  assert.equal(target.style.overflow, "auto");
});
