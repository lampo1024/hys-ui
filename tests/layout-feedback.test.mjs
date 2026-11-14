import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "https://example.test",
});
for (const name of [
  "window",
  "document",
  "Node",
  "Element",
  "HTMLElement",
  "SVGElement",
])
  globalThis[name] = dom.window[name];
const { Comment, Fragment, createApp, h, nextTick, reactive, ref } =
  await import("vue");
const { HysDescriptions, HysResult, HysScrollbar, HysSpace } =
  await import("../packages/ui/dist/index.js");
const apps = [];
function mount(render) {
  const host = document.createElement("div");
  document.body.append(host);
  const app = createApp({ render });
  app.mount(host);
  apps.push(app);
  return host;
}
afterEach(() => {
  for (const app of apps.splice(0)) app.unmount();
  document.body.replaceChildren();
  delete globalThis.ResizeObserver;
});

test("Scrollbar exposes its viewport and reports native scroll coordinates", async () => {
  const scrollbar = ref();
  const direction = ref("vertical");
  const positions = [];
  const host = mount(() =>
    h(HysScrollbar, {
      ref: scrollbar,
      direction: direction.value,
      ariaLabel: "Activity",
      wrapClass: "test-wrap",
      wrapStyle: { overscrollBehavior: "contain" },
      viewClass: "test-view",
      viewStyle: { color: "red" },
      tag: "section",
      id: "activity-view",
      height: 180,
      maxHeight: "50dvh",
      onScroll: (position) => positions.push(position),
    }, () => "Content"),
  );
  const root = host.firstElementChild;
  const viewport = root.querySelector(".test-wrap");
  assert.equal(scrollbar.value.viewport, viewport);
  assert.equal(scrollbar.value.wrapRef, viewport);
  assert.equal(viewport.getAttribute("role"), "region");
  assert.equal(viewport.getAttribute("aria-label"), "Activity");
  assert.equal(viewport.tabIndex, 0);
  assert.equal(root.style.height, "180px");
  assert.equal(root.style.maxHeight, "50dvh");
  assert.equal(viewport.style.overscrollBehavior, "contain");
  assert.equal(viewport.dataset.direction, "vertical");
  assert.equal(viewport.querySelector("section#activity-view.test-view").textContent, "Content");
  assert.equal(viewport.querySelector("#activity-view").style.color, "red");

  const calls = [];
  viewport.scrollTo = (...options) => calls.push(["to", ...options]);
  viewport.scrollBy = (options) => calls.push(["by", options]);
  scrollbar.value.scrollTo({ top: 80 });
  scrollbar.value.scrollTo(12, 25);
  scrollbar.value.scrollBy({ left: 12, behavior: "smooth" });
  assert.deepEqual(calls, [["to", { top: 80 }], ["to", 12, 25], ["by", { left: 12, behavior: "smooth" }]]);

  viewport.scrollTop = 80;
  viewport.scrollLeft = 12;
  viewport.dispatchEvent(new dom.window.Event("scroll"));
  assert.deepEqual(positions, [{ scrollTop: 80, scrollLeft: 12 }]);

  direction.value = "horizontal";
  await nextTick();
  assert.equal(viewport.dataset.direction, "horizontal");
});

test("Scrollbar reports each reached edge once per entry and handles physical RTL edges", async () => {
  const end = [];
  const scrollbar = ref();
  const host = mount(() => h(HysScrollbar, {
    ref: scrollbar,
    mask: true,
    distance: 20,
    noresize: true,
    wrapStyle: { direction: "rtl" },
    onEndReached: edge => end.push(edge),
  }));
  const { viewport, handleScroll, setScrollLeft, setScrollTop, update } = scrollbar.value;
  let contentHeight = 300;
  Object.defineProperties(viewport, {
    clientWidth: { value: 100 },
    clientHeight: { value: 100 },
    scrollWidth: { value: 300 },
    scrollHeight: { get: () => contentHeight },
  });
  const visible = () => [...host.querySelectorAll("[data-edge][data-visible]")].map(el => el.dataset.edge);
  update();
  await nextTick();
  assert.deepEqual(visible(), ["bottom", "left"]);

  setScrollTop(185);
  setScrollLeft(-195);
  handleScroll();
  setScrollTop(195);
  setScrollLeft(-200);
  handleScroll();
  handleScroll();
  await nextTick();
  assert.deepEqual(end, ["bottom", "left"]);
  assert.deepEqual(visible(), ["top", "bottom", "right"]);

  setScrollTop(0);
  setScrollLeft(0);
  handleScroll();
  assert.deepEqual(end, ["bottom", "left", "top", "right"]);
  setScrollTop(200);
  handleScroll();
  contentHeight += 200;
  update();
  setScrollTop(400);
  handleScroll();
  assert.deepEqual(end, ["bottom", "left", "top", "right", "bottom", "bottom"]);
});

test("Space ignores conditional placeholders and keeps keyed controls across fragment updates", async () => {
  const order = ref(["first", "second"]);
  const host = mount(() =>
    h(
      HysSpace,
      { size: [14, "0.5rem"], wrap: true },
      {
        default: () => [
          h(Comment),
          " ",
          h(
            Fragment,
            null,
            order.value.map((key) => h("input", { key, "aria-label": key })),
          ),
        ],
        separator: ({ index, count }) => `${index}/${count}`,
      },
    ),
  );
  const root = host.firstElementChild;
  const first = root.querySelector('[aria-label="first"]');
  first.value = "draft";
  assert.equal(root.style.getPropertyValue("--hys-space-inline-gap"), "14px");
  assert.equal(root.style.getPropertyValue("--hys-space-block-gap"), "0.5rem");
  assert.equal(root.querySelector(".hys-space-separator").textContent, "1/2");
  assert.equal(
    root.querySelector(".hys-space-separator").getAttribute("aria-hidden"),
    "true",
  );
  order.value = ["second", "first"];
  await nextTick();
  assert.equal(root.querySelectorAll("input")[1], first);
  assert.equal(first.value, "draft");
  order.value = ["first"];
  await nextTick();
  assert.equal(root.querySelector(".hys-space-separator"), null);
});

test("Descriptions responds to container width, clamps spans and releases its observer", async () => {
  let resize,
    disconnected = false;
  globalThis.ResizeObserver = class {
    constructor(callback) {
      resize = callback;
    }
    observe() {}
    disconnect() {
      disconnected = true;
    }
  };
  const host = mount(() =>
    h(HysDescriptions, {
      columns: { xs: 1, sm: 2, md: 3 },
      items: [
        { key: "photo", label: "Member", value: "Lu", rowSpan: 2 },
        { key: "name", label: "Name", value: "Li" },
        { key: "note", label: "Note", value: "Details", span: "full" },
      ],
    }),
  );
  const root = host.firstElementChild;
  let width = 900;
  Object.defineProperty(root, "clientWidth", { get: () => width });
  resize();
  await nextTick();
  const fields = [...host.querySelectorAll(".hys-descriptions-field")];
  assert.equal(root.style.getPropertyValue("--hys-descriptions-columns"), "3");
  assert.equal(fields[0].style.gridRow, "span 2");
  assert.equal(fields[2].style.gridColumn, "span 3");
  width = 320;
  resize();
  await nextTick();
  assert.equal(root.style.getPropertyValue("--hys-descriptions-columns"), "1");
  assert.equal(fields[0].style.gridRow, "span 1");
  assert.equal(fields[2].style.gridColumn, "span 1");
  apps.pop().unmount();
  assert.equal(disconnected, true);
});

test("Descriptions preserves zero and false and scopes item overrides to the matching key", async () => {
  const data = ref([
    { key: "hidden", label: "Hidden", value: "hidden", hidden: true },
    { key: "zero", label: "Zero", value: 0 },
    { key: "flag", label: "Flag", value: false },
    { key: "missing", label: "Missing", value: "raw", format: () => "" },
  ]);
  const host = mount(() =>
    h(
      HysDescriptions,
      { items: data.value, title: "Record", placeholder: "Missing" },
      {
        "label-zero": ({ index }) => "Count " + index,
        empty: () => "No fields",
      },
    ),
  );
  assert.deepEqual(
    [...host.querySelectorAll("dt")].map((el) => el.textContent),
    ["Count 0", "Flag", "Missing"],
  );
  assert.deepEqual(
    [...host.querySelectorAll("dd")].map((el) => el.textContent),
    ["0", "false", "Missing"],
  );
  assert.equal(
    document.getElementById(
      host.firstElementChild.getAttribute("aria-labelledby"),
    ).textContent,
    "Record",
  );
  data.value = [];
  await nextTick();
  assert.equal(host.querySelector("dl"), null);
  assert.equal(
    host.querySelector(".hys-descriptions-empty").textContent,
    "No fields",
  );
});

test("Result normalizes error codes, announces updates, and exposes focus without extra tab stops", async () => {
  const view = reactive({ status: 403, showCode: true, icon: false });
  const instance = ref();
  const host = mount(() =>
    h(
      HysResult,
      { ...view, announce: "polite", headingLevel: 3, ref: instance },
      {
        extra: ({ status }) => h("button", "Continue " + status),
      },
    ),
  );
  assert.equal(host.querySelector("h3").textContent, "无权访问");
  assert.equal(host.querySelector(".hys-result-code").textContent, "403");
  assert.equal(host.querySelector(".hys-result-icon"), null);
  assert.equal(
    host.querySelector('[aria-live="polite"]').textContent,
    "403 无权访问",
  );
  view.status = "success";
  await nextTick();
  assert.equal(
    host.querySelector('[aria-live="polite"]').textContent,
    "操作成功",
  );
  assert.equal(host.querySelector(".hys-result-code"), null);
  assert.equal(host.querySelector("button").textContent, "Continue success");
  instance.value.focus();
  assert.equal(document.activeElement, host.querySelector("h3"));
  assert.equal(document.activeElement.tabIndex, -1);
});
