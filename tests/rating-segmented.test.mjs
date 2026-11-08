import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost",
  pretendToBeVisual: true,
});
for (const key of [
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
  "HTMLSelectElement",
  "HTMLTextAreaElement",
  "Event",
  "MouseEvent",
  "FocusEvent",
  "KeyboardEvent",
  "MutationObserver",
])
  globalThis[key] = dom.window[key];
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
    x: 0,
    y: 0,
    left: 0,
    top: 0,
    right: 100,
    bottom: 32,
    width: 100,
    height: 32,
  };
};
HTMLElement.prototype.getClientRects = function () {
  return [this.getBoundingClientRect()];
};
HTMLElement.prototype.scrollIntoView = function () {};
const observers = new Set();
globalThis.ResizeObserver = class {
  constructor(callback) {
    this.callback = callback;
    this.targets = new Set();
  }
  observe(target) {
    this.targets.add(target);
    observers.add(this);
  }
  disconnect() {
    this.targets.clear();
    observers.delete(this);
  }
  unobserve(target) {
    this.targets.delete(target);
  }
};
const { createApp, h, ref, reactive, nextTick, KeepAlive } =
    await import("vue"),
  ui = await import("../packages/ui/dist/index.js"),
  mounts = new Set();
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  settle = async () => {
    await nextTick();
    await pause(0);
    await nextTick();
  };
async function mount(Component, values = {}, slots = {}, accept = true) {
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
        if (accept && name.startsWith("update:"))
          props[name.slice(7)] = args[0];
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
    find: (s) => host.querySelector(s),
    all: (s) => [...host.querySelectorAll(s)],
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
const fire = async (el, type, data = {}) => {
    el.dispatchEvent(
      new (type === "keydown" ? KeyboardEvent : MouseEvent)(type, {
        bubbles: true,
        cancelable: true,
        ...data,
      }),
    );
    await settle();
  },
  click = (el) => fire(el, "click", { clientX: 90 }),
  key = (el, key) => fire(el, "keydown", { key });
afterEach(async () => {
  for (const item of [...mounts]) item.unmount();
  await settle();
  document.body.innerHTML = "";
  assert.equal(observers.size, 0, "resize observers leaked");
});

test("Rating supports uncontrolled defaults, clearing and change-only hosts", async () => {
  const a = await mount(ui.HysRating, { defaultValue: 2 }, {}, false);
  assert.equal(a.vm.value, 2);
  await click(a.all("button")[3]);
  assert.equal(a.vm.value, 4);
  await click(a.all("button")[3]);
  assert.equal(a.vm.value, 0);
  assert.equal(a.events.clear.length, 1);
  const score = ref(1),
    host = await mount({
      setup: () => () =>
        h(ui.HysRating, {
          modelValue: score.value,
          onChange: (value) => (score.value = value),
        }),
    });
  await click(host.all("button")[2]);
  assert.equal(score.value, 3);
});
test("Rating preserves controlled host decisions and normalizes invalid values without mutating them", async () => {
  const a = await mount(ui.HysRating, { modelValue: 2 }, {}, false);
  assert.equal(await a.vm.setValue(4), false);
  assert.equal(a.vm.value, 2);
  assert.equal(a.events.change.at(-1)[0], 4);
  a.props.modelValue = Infinity;
  await settle();
  assert.equal(a.vm.value, 0);
  assert.equal(a.props.modelValue, Infinity);
  a.props.modelValue = 20;
  a.props.max = 3;
  await settle();
  assert.equal(a.vm.value, 3);
  assert.equal(a.all("button").length, 3);
  a.props.max = 0;
  await settle();
  assert.equal(a.all("button").length, 0);
  assert.equal(await a.vm.setValue(1), false);
});
test("Rating supports half selection, exact fractional display and score templates", async () => {
  const a = await mount(ui.HysRating, {
    modelValue: 3.7,
    readonly: true,
    showScore: true,
    scoreTemplate: "{value} 分",
  });
  assert(
    Math.abs(parseFloat(a.all(".hys-ui-rating-fill")[3].style.width) - 70) <
      0.001,
  );
  assert.equal(a.find(".hys-ui-rating-score").textContent, "3.7 分");
  a.props.readonly = false;
  a.props.allowHalf = true;
  await settle();
  await fire(a.all("button")[1], "click", { clientX: 20 });
  assert.equal(a.props.modelValue, 1.5);
  assert.equal(a.find("[role=slider]").getAttribute("aria-valuenow"), "1.5");
});
test("Rating previews independently, restores on leave and prevents readonly preview", async () => {
  const a = await mount(ui.HysRating, {
    modelValue: 2,
    showText: true,
    texts: ["差", "一般", "良好", "满意", "非常满意"],
  });
  await fire(a.all("button")[4], "mousemove", { clientX: 80 });
  assert.equal(a.props.modelValue, 2);
  assert.equal(a.vm.hoverValue, 5);
  assert.equal(a.find(".hys-ui-rating-score").textContent, "非常满意");
  await fire(a.find("[role=slider]"), "mouseleave");
  assert.equal(a.vm.hoverValue, null);
  assert.equal(a.find(".hys-ui-rating-score").textContent, "一般");
  a.props.readonly = true;
  await settle();
  await fire(a.all("button")[4], "mousemove", { clientX: 80 });
  assert.equal(a.vm.hoverValue, null);
});
test("Externally controlled rating previews request clearing even before pointer entry", async () => {
  const control = await mount(ui.HysRating, { modelValue: 2, hoverValue: 4 });
  await fire(control.find("[role=slider]"), "mouseleave");
  assert.equal(control.vm.hoverValue, null);
  assert.equal(control.props.modelValue, 2);
  assert.equal(control.events["update:hoverValue"].at(-1)[0], null);
});
test("Rating colors and icons resolve inclusive and excluded thresholds", async () => {
  const One = { render: () => h("svg", { "data-icon": "one" }) },
    Two = { render: () => h("svg", { "data-icon": "two" }) },
    Three = { render: () => h("svg", { "data-icon": "three" }) };
  const a = await mount(ui.HysRating, {
    modelValue: 2,
    colors: { 2: "red", 4: { value: "orange", excluded: true }, 5: "green" },
    icons: [One, Two, Three],
  });
  assert.equal(a.find(".hys-ui-rating-fill").style.color, "red");
  assert(a.find(".hys-ui-rating-fill [data-icon=one]"));
  a.props.modelValue = 4;
  await settle();
  assert.equal(a.find(".hys-ui-rating-fill").style.color, "green");
  assert(a.find(".hys-ui-rating-fill [data-icon=three]"));
  a.props.modelValue = 3;
  await settle();
  assert.equal(a.find(".hys-ui-rating-fill").style.color, "orange");
});
test("Rating keyboard supports halves, RTL, Home/End and non-clearable policy", async () => {
  const a = await mount(ui.HysRating, {
    modelValue: 2,
    allowHalf: true,
    style: { direction: "rtl" },
  });
  const root = a.find("[role=slider]");
  await key(root, "ArrowLeft");
  assert.equal(a.props.modelValue, 2.5);
  await key(root, "ArrowRight");
  assert.equal(a.props.modelValue, 2);
  await key(root, "End");
  assert.equal(a.props.modelValue, 5);
  await key(root, "Home");
  assert.equal(a.props.modelValue, 0);
  a.props.modelValue = 2;
  a.props.allowClear = false;
  await settle();
  await fire(a.all("button")[1], "click", { clientX: 10 });
  await key(root, "Delete");
  assert.equal(a.props.modelValue, 2);
  a.props.keyboard = false;
  await settle();
  await key(root, "ArrowUp");
  assert.equal(a.props.modelValue, 2);
});
test("Rating custom content, focus methods, labels and errors remain accessible", async () => {
  const a = await mount(
    ui.HysRating,
    {
      modelValue: 2,
      ariaLabel: "评分标题",
      error: "评分有误",
      autofocus: true,
      tooltips: ["一", "二"],
    },
    {
      character: ({ value, filled }) =>
        h("b", { "data-value": value, "data-filled": filled }, "好"),
      text: ({ value }) => "当前 " + value,
    },
  );
  assert.equal(document.activeElement, a.vm.element);
  assert.equal(a.find("[role=slider]").getAttribute("aria-label"), "评分标题");
  assert.equal(a.find("[role=slider]").getAttribute("aria-invalid"), "true");
  assert.equal(a.find("button").title, "一");
  assert.equal(a.all("[data-filled=true]").length, 5);
  assert.equal(a.find(".hys-ui-rating-score").textContent, "当前 2");
  a.vm.blur();
  assert.notEqual(document.activeElement, a.vm.element);
  a.vm.setCurrentValue(4);
  await settle();
  assert.equal(a.vm.hoverValue, 4);
  assert.equal(a.vm.value, 2);
  a.vm.resetCurrentValue();
  await settle();
  assert.equal(a.vm.hoverValue, null);
});
test("Rating native form values and reset use initial state", async () => {
  const a = await mount({
    setup: () => () =>
      h(
        "form",
        { id: "owner" },
        h(ui.HysRating, { defaultValue: 1, name: "score" }),
      ),
  });
  const form = a.find("form");
  await click(a.all("button")[3]);
  assert.equal(new window.FormData(form).get("score"), "4");
  form.reset();
  await settle();
  assert.equal(new window.FormData(form).get("score"), "1");
});
test("Segmented accepts typed primitives, mapped records and distinct identifiers", async () => {
  const a = await mount(ui.HysSegmented, {
    modelValue: 0,
    options: [0, "0", false, true, NaN, 0],
  });
  assert.equal(a.all("[role=radio]").length, 4);
  await click(a.all("[role=radio]")[1]);
  assert.equal(a.props.modelValue, "0");
  await click(a.all("[role=radio]")[2]);
  assert.equal(a.props.modelValue, false);
  a.props.options = [
    { id: 3, title: "第三项", blocked: true },
    { id: 4, title: "第四项" },
  ];
  a.props.fieldNames = { value: "id", label: "title", disabled: "blocked" };
  await settle();
  assert.equal(a.all("button")[0].disabled, true);
  await click(a.all("button")[1]);
  assert.equal(a.props.modelValue, 4);
});
test("Segmented uncontrolled default picks the first available option and preserves dynamic missing values", async () => {
  const a = await mount(
    ui.HysSegmented,
    { options: [{ label: "A", value: "a", disabled: true }, "b", "c"] },
    {},
    false,
  );
  assert.equal(a.vm.value, "b");
  await click(a.all("button")[2]);
  assert.equal(a.vm.value, "c");
  a.props.options = ["d"];
  await settle();
  assert.equal(a.vm.value, "c");
  assert.equal(a.find("[aria-checked=true]"), null);
  assert.equal(a.find('[tabindex="0"]').textContent.trim(), "d");
  a.props.options = ["c", "d"];
  await settle();
  assert.equal(a.find("[aria-checked=true]").textContent.trim(), "c");
});
test("Segmented controlled values are not replaced when hosts reject requests", async () => {
  const a = await mount(
    ui.HysSegmented,
    { modelValue: "a", options: ["a", "b"] },
    {},
    false,
  );
  await click(a.all("button")[1]);
  assert.equal(a.vm.value, "a");
  assert.equal(a.events.change.at(-1)[0], "b");
  assert.equal(a.all("button")[1].getAttribute("aria-checked"), "false");
  assert.equal(await a.vm.select("missing"), false);
});
test("Segmented keyboard skips disabled items, handles RTL and non-looping endpoints", async () => {
  const a = await mount(ui.HysSegmented, {
    modelValue: "a",
    options: ["a", { label: "B", value: "b", disabled: true }, "c"],
    style: { direction: "rtl" },
  });
  await key(a.all("button")[0], "ArrowLeft");
  assert.equal(a.props.modelValue, "c");
  assert.equal(document.activeElement, a.all("button")[2]);
  await key(a.all("button")[2], "ArrowLeft");
  assert.equal(a.props.modelValue, "a");
  a.props.loopNavigation = false;
  await settle();
  await key(a.all("button")[0], "ArrowRight");
  assert.equal(a.props.modelValue, "a");
  await key(a.all("button")[0], "End");
  assert.equal(a.props.modelValue, "c");
  assert.equal(a.all("button").filter((el) => el.tabIndex === 0).length, 1);
});
test("Segmented readonly, disabled, unknown and empty states remain operable only as allowed", async () => {
  const a = await mount(ui.HysSegmented, {
    modelValue: "x",
    options: ["a", "b"],
    readonly: true,
  });
  await click(a.all("button")[1]);
  await key(a.all("button")[0], "End");
  assert.equal(a.props.modelValue, "x");
  assert.equal(
    a.find("[role=radiogroup]").getAttribute("aria-readonly"),
    "true",
  );
  a.props.disabled = true;
  await settle();
  assert(a.all("button").every((el) => el.disabled && el.tabIndex === -1));
  a.props.options = [];
  await settle();
  assert.equal(a.find(".hys-ui-segment-empty").textContent, "暂无选项");
  assert.equal(a.all("button").length, 0);
});
test("Segmented custom content, orientation, inherited form size and validation work together", async () => {
  const data = reactive({ score: 0, mode: "" });
  const form = await mount(
    ui.HysForm,
    {
      model: data,
      size: "sm",
      rules: {
        score: { type: "number", min: 1, message: "请评分" },
        mode: { required: true, message: "请选择" },
      },
    },
    {
      default: () => [
        h(ui.HysFormItem, { label: "满意度", prop: "score" }, () =>
          h(ui.HysRating, {
            modelValue: data.score,
            "onUpdate:modelValue": (v) => (data.score = v),
          }),
        ),
        h(ui.HysFormItem, { label: "布局", prop: "mode" }, () =>
          h(
            ui.HysSegmented,
            {
              modelValue: data.mode,
              "onUpdate:modelValue": (v) => (data.mode = v),
              options: ["a", "b"],
              direction: "vertical",
            },
            { label: ({ option }) => h("b", option.label) },
          ),
        ),
      ],
    },
  );
  assert(form.find(".hys-ui-rating-sm"));
  assert(form.find(".hys-ui-segment-sm"));
  assert.equal(
    form.find("[role=radiogroup]").getAttribute("aria-orientation"),
    "vertical",
  );
  assert.equal(await form.vm.validate(), false);
  await click(form.all(".hys-ui-ex-rating button")[2]);
  await click(form.all(".hys-ui-segment-option")[0]);
  assert.equal(await form.vm.validate(), true);
  form.vm.resetFields();
  await settle();
  assert.equal(data.score, 0);
  assert.equal(data.mode, "");
});
test("Segmented native submission omits disabled values and resets uncontrolled state", async () => {
  const a = await mount({
    setup: () => () =>
      h("form", h(ui.HysSegmented, { options: ["a", "b"], name: "view" })),
  });
  await click(a.all("button")[1]);
  assert.equal(new window.FormData(a.find("form")).get("view"), "b");
  a.find("form").reset();
  await settle();
  assert.equal(new window.FormData(a.find("form")).get("view"), "a");
  const b = await mount({
    setup: () => () =>
      h(
        "form",
        h(ui.HysSegmented, {
          modelValue: "a",
          options: [{ label: "A", value: "a", disabled: true }],
          name: "view",
        }),
      ),
  });
  assert.equal(new window.FormData(b.find("form")).get("view"), null);
});
test("Segmented observes only live geometry and reconnects after cached page activation", async () => {
  const visible = ref(true),
    selected = ref("a"),
    Score = {
      setup: () => () =>
        h(ui.HysSegmented, { options: ["a", "b"], modelValue: selected.value }),
    };
  const a = await mount({
    setup: () => () =>
      h(KeepAlive, null, () => (visible.value ? h(Score) : null)),
  });
  await pause(35);
  assert.equal(observers.size, 1);
  assert.equal([...observers][0].targets.size, 2);
  visible.value = false;
  await settle();
  assert.equal(observers.size, 0);
  selected.value = "b";
  await settle();
  assert.equal(observers.size, 0);
  visible.value = true;
  await settle();
  await pause(35);
  assert.equal(observers.size, 1);
  assert.equal(a.find("[aria-checked=true]").textContent.trim(), "b");
});
test("Cached rating previews clear and inactive instance methods cannot change models", async () => {
  const visible = ref(true),
    api = ref(),
    Score = {
      setup: () => () => h(ui.HysRating, { ref: api, defaultValue: 1 }),
    };
  await mount({
    setup: () => () =>
      h(KeepAlive, null, () => (visible.value ? h(Score) : null)),
  });
  api.value.setCurrentValue(5);
  await settle();
  assert.equal(api.value.hoverValue, 5);
  visible.value = false;
  await settle();
  assert.equal(await api.value.setValue(4), false);
  assert.equal(api.value.hoverValue, null);
  visible.value = true;
  await settle();
  assert.equal(api.value.value, 1);
});
