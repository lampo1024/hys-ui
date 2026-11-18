import { afterEach, test } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost",
  pretendToBeVisual: true,
});
for (const name of [
  "window",
  "document",
  "navigator",
  "Node",
  "Element",
  "HTMLElement",
  "HTMLInputElement",
  "HTMLFormElement",
  "SVGElement",
  "Event",
  "MouseEvent",
  "KeyboardEvent",
  "FocusEvent",
  "MutationObserver",
  "XMLSerializer",
]) {
  Object.defineProperty(globalThis, name, {
    configurable: true,
    value: dom.window[name],
  });
}
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

const { createApp, h, reactive, nextTick, shallowRef } = await import("vue");
const ui = await import("../packages/ui/dist/index.js");
const cleanup = [];
afterEach(() => cleanup.splice(0).forEach((dispose) => dispose()));

async function mount(component, initial, slots) {
  const host = document.createElement("div");
  document.body.append(host);
  const props = reactive(initial);
  const instance = shallowRef();
  const events = [];
  const handlers = {
    onCopy: (value) => events.push(["copy", value]),
    onError: (reason, value) => events.push(["error", reason, value]),
    "onUpdate:modelValue": (value) => {
      events.push(["update", value]);
      props.modelValue = value;
    },
    onComplete: (value) => events.push(["complete", value]),
    onBack: (event) => events.push(["back", event.type]),
    onRefresh: () => events.push(["refresh"]),
  };
  const app = createApp({
    setup() {
      ui.provideHysConfig({ motion: "off" });
      return () =>
        h(component, { ...props, ...handlers, ref: instance }, slots);
    },
  });
  app.mount(host);
  cleanup.push(() => {
    app.unmount();
    host.remove();
  });
  await nextTick();
  return { host, events, props, instance };
}
async function settled() {
  await Promise.resolve();
  await nextTick();
  await Promise.resolve();
  await nextTick();
}

test("CopyButton writes exact strings, blocks repeat activation, and reports a denied write", async () => {
  let release;
  let calls = 0;
  const content = " 交付\n📦 https://example.com/?q=确认 ";
  const form = await mount(
    ui.HysCopyButton,
    {
      text: content,
      writeText: (value) => {
        calls++;
        assert.equal(value, content);
        return new Promise((resolve) => {
          release = resolve;
        });
      },
    },
    {
      default: ({ state }) =>
        state === "copying" ? "正在复制" : "复制交付信息",
    },
  );
  const button = form.host.querySelector("button");
  button.click();
  button.click();
  await nextTick();
  assert.equal(calls, 1);
  assert.match(button.textContent, /正在复制/);
  assert.equal(form.events.length, 0);
  release();
  await settled();
  assert.deepEqual(form.events, [["copy", content]]);
  assert.equal(
    form.host.querySelector("[role=status]").textContent.trim(),
    "已复制",
  );
  const reason = new Error("Permission denied");
  form.props.writeText = () => Promise.reject(reason);
  await nextTick();
  button.click();
  await settled();
  assert.deepEqual(form.events.at(-1), ["error", reason, content]);
  assert.equal(
    form.host.querySelector("[role=status]").textContent.trim(),
    "无法写入剪贴板",
  );
  form.props.disabled = true;
  await nextTick();
  button.click();
  await settled();
  assert.equal(form.events.length, 2);
});

test("CopyButton supports all display modes and restores feedback without removing manual text", async () => {
  const app = await mount(ui.HysCopyButton, {
    text: "delivery-42",
    label: "复制编号",
    iconOnly: true,
    manualFallback: true,
    feedbackDuration: 15,
    writeText: () => Promise.reject(new Error("denied")),
  });
  const button = app.host.querySelector("button");
  assert(button.querySelector("svg"));
  assert.equal(button.textContent.trim(), "");
  app.props.display = "text";
  await settled();
  assert.equal(button.querySelector("svg"), null);
  assert.equal(button.textContent.trim(), "复制编号");
  app.props.display = "both";
  await settled();
  assert(button.querySelector("svg"));
  assert.equal(button.textContent.trim(), "复制编号");

  await app.instance.value.copy();
  await settled();
  const result = app.host.querySelector("[role=status]");
  assert.equal(result.getAttribute("data-state"), "error");
  await new Promise(resolve => setTimeout(resolve, 30));
  await settled();
  assert.equal(result.getAttribute("data-state"), "idle");
  assert.equal(app.host.querySelector("textarea").value, "delivery-42");
});

test("CopyButton shows the configured tooltip text and skips a blank tooltip", async () => {
  const form = await mount(ui.HysCopyButton, {
    text: "123",
    tooltip: "复制工单编号",
  });
  const wrapper = form.host.querySelector(".hys-ui-tooltip-wrap");
  for (const element of [wrapper, ...wrapper.querySelectorAll("*")]) {
    element.getBoundingClientRect = () => new window.DOMRect(100, 90, 60, 28);
    element.getClientRects = () => [element.getBoundingClientRect()];
  }
  const hover = () =>
    wrapper.dispatchEvent(
      new MouseEvent("pointerenter", { clientX: 120, clientY: 105 }),
    );
  hover();
  await new Promise((resolve) => setTimeout(resolve, 370));
  assert.match(
    document.querySelector("[role=tooltip]")?.textContent ?? "",
    /复制工单编号/,
  );
  form.props.tooltip = " ";
  await nextTick();
  wrapper.dispatchEvent(
    new MouseEvent("pointerleave", { clientX: 0, clientY: 0 }),
  );
  hover();
  await new Promise((resolve) => setTimeout(resolve, 370));
  const tooltip = document.querySelector("[role=tooltip]");
  assert(!tooltip || tooltip.style.display === "none");
});

test("CopyButton does not publish an in-flight copy after unmount", async () => {
  let release;
  const form = await mount(ui.HysCopyButton, {
    text: "alpha",
    writeText: () =>
      new Promise((resolve) => {
        release = resolve;
      }),
  });
  form.host.querySelector("button").click();
  cleanup.pop()();
  release();
  await settled();
  assert.deepEqual(form.events, []);
});

test("CopyButton prepares at most one value and preserves it for manual copying after a denial", async () => {
  let prepared = 0;
  const app = await mount(ui.HysCopyButton, {
    text: "report 7",
    iconOnly: true,
    manualFallback: true,
    feedbackDuration: 0,
    prepareText: async ({ text }) => {
      prepared++;
      return text.replace(" ", "-");
    },
    writeText: () => {
      throw new Error("denied");
    },
  });
  const active = app.instance.value.copy();
  assert.equal(await app.instance.value.copy(), false);
  assert.equal(await active, false);
  await settled();
  assert.equal(prepared, 1);
  assert.equal(app.host.querySelector("textarea").value, "report-7");
  assert.equal(
    app.host.querySelector("button").getAttribute("aria-label"),
    "复制",
  );
  assert.equal(app.events[0][0], "error");
});

function modules(svg, quietZone) {
  const size = Number(svg.getAttribute("viewBox").split(" ")[2]);
  const cells = Array.from({ length: size }, () => new Uint8Array(size));
  const path = svg.querySelector("path").getAttribute("d");
  for (const [, x, y, width] of path.matchAll(/M(\d+) (\d+)h(\d+)v1h-\d+z/gu))
    cells[Number(y)].fill(1, Number(x), Number(x) + Number(width));
  for (const [index, row] of cells.entries()) {
    for (const [column, bit] of row.entries()) {
      if (
        index < quietZone ||
        column < quietZone ||
        index >= size - quietZone ||
        column >= size - quietZone
      )
        assert.equal(bit, 0);
    }
  }
  return cells
    .slice(quietZone, -quietZone)
    .map((row) => row.slice(quietZone, -quietZone));
}

// Independent readback of clean symbols with known standard block layouts.
function verifySymbol(
  cells,
  centers,
  dataLengths,
  correctionLength,
  levelBits,
) {
  const size = cells.length;
  const format = [0, 1, 2, 3, 4, 5, 7, 8]
    .map((y) => cells[y][8])
    .concat([7, 5, 4, 3, 2, 1, 0].map((x) => cells[8][x]));
  const word =
    format.reduce((number, bit, index) => number | (bit << index), 0) ^ 0x5412;
  assert.equal(word >>> 13, levelBits);
  let remainder = word;
  for (let shift = 4; shift >= 0; shift--)
    if ((remainder >>> (10 + shift)) & 1) remainder ^= 0x537 << shift;
  assert.equal(remainder, 0);
  const mask = (word >>> 10) & 7;
  const maskBit = (x, y) => {
    const product = x * y;
    return [
      (x + y) & 1,
      y & 1,
      x % 3,
      (x + y) % 3,
      (Math.floor(y / 2) + Math.floor(x / 3)) & 1,
      (product % 2) + (product % 3),
      ((product % 2) + (product % 3)) & 1,
      (((x + y) % 2) + (product % 3)) & 1,
    ][mask] === 0
      ? 1
      : 0;
  };
  const alignment = centers
    .flatMap((y) => centers.map((x) => [x, y]))
    .filter(
      ([x, y]) =>
        !(x === 6 && (y === 6 || y === size - 7)) &&
        !(x === size - 7 && y === 6),
    );
  function reserved(x, y) {
    return (
      x === 6 ||
      y === 6 ||
      (y <= 8 && (x <= 8 || x >= size - 8)) ||
      (y >= size - 8 && x <= 8) ||
      (size >= 45 &&
        ((y < 6 && x >= size - 11) || (x < 6 && y >= size - 11))) ||
      alignment.some(
        ([cx, cy]) => Math.abs(x - cx) <= 2 && Math.abs(y - cy) <= 2,
      )
    );
  }

  const columns = Array.from({ length: size }, (_, i) => size - i - 1).filter(
    (x) => x !== 6,
  );
  const bits = [];
  for (let start = 0; start < columns.length; start += 2) {
    for (let offset = 0; offset < size; offset++) {
      const y = start % 4 === 0 ? size - 1 - offset : offset;
      for (const x of columns.slice(start, start + 2))
        if (!reserved(x, y)) bits.push(cells[y][x] ^ maskBit(x, y));
    }
  }
  const read = (source, offset, length) => {
    let value = 0;
    for (let i = offset; i < offset + length; i++)
      value = (value << 1) | source[i];
    return value;
  };

  const blockWords = dataLengths.map(
    (length) => new Uint8Array(length + correctionLength),
  );
  const total = blockWords.reduce((sum, block) => sum + block.length, 0);
  assert.equal(Math.floor(bits.length / 8), total);
  assert(bits.slice(total * 8).every((bit) => bit === 0));
  let offset = 0;
  for (let i = 0; i < Math.max(...dataLengths); i++) {
    for (const [index, block] of blockWords.entries()) {
      if (i >= dataLengths[index]) continue;
      block[i] = read(bits, offset, 8);
      offset += 8;
    }
  }
  for (let i = 0; i < correctionLength; i++) {
    for (const [index, block] of blockWords.entries()) {
      block[dataLengths[index] + i] = read(bits, offset, 8);
      offset += 8;
    }
  }

  const powers = [],
    letters = [];
  let exponent = 1;
  for (let i = 0; i < 255; i++) {
    powers[i] = exponent;
    letters[exponent] = i;
    exponent = exponent < 128 ? exponent * 2 : (exponent * 2) ^ 285;
  }
  for (const block of blockWords) {
    for (let i = 0; i < correctionLength; i++) {
      let check = 0;
      for (const word of block)
        check = word ^ (check ? powers[(letters[check] + i) % 255] : 0);
      assert.equal(check, 0, "Reed–Solomon polynomial root");
    }
  }
  const payload = blockWords.flatMap((block, i) =>
    Array.from(block.slice(0, dataLengths[i])).flatMap((word) =>
      Array.from({ length: 8 }, (_, j) => (word >>> (7 - j)) & 1),
    ),
  );
  let cursor = 0;
  const take = (bitsNeeded) => {
    const next = read(payload, cursor, bitsNeeded);
    cursor += bitsNeeded;
    return next;
  };
  let mode = take(4);
  if (mode === 7) {
    assert.equal(take(8), 26);
    mode = take(4);
  }
  if (mode === 4) {
    const count = take(size < 57 ? 8 : 16);
    return new TextDecoder("utf-8", { fatal: true }).decode(
      Uint8Array.from({ length: count }, () => take(8)),
    );
  }
  assert.equal(mode, 1);
  const count = take(size < 57 ? 10 : size < 125 ? 12 : 14);
  let digits = "";
  while (digits.length < count) {
    const batch = Math.min(3, count - digits.length);
    digits += String(take([0, 4, 7, 10][batch])).padStart(batch, "0");
  }
  return digits;
}

test("QRCode round-trips numeric, URL, UTF-8, and multi-block payloads from the rendered SVG", async () => {
  const form = await mount(ui.HysQRCode, {
    value: "0123456789",
    errorCorrectionLevel: "L",
  });
  const samples = [
    ["0123456789", "L", [], [19], 7, 1, 21],
    ["中文🚚", "M", [], [16], 10, 0, 21],
    ["https://example.com", "M", [6, 18], [28], 16, 0, 25],
    ["x".repeat(80), "Q", [6, 22, 38], [14, 14, 15, 15, 15, 15], 18, 3, 45],
    ["ship123", "H", [], [9], 17, 2, 21],
    [
      "2".repeat(7089),
      "L",
      [6, 30, 58, 86, 114, 142, 170],
      [...Array(19).fill(118), ...Array(6).fill(119)],
      30,
      1,
      177,
    ],
  ];
  for (const [
    value,
    correction,
    centers,
    blocks,
    checks,
    level,
    length,
  ] of samples) {
    form.props.value = value;
    form.props.errorCorrectionLevel = correction;
    await nextTick();
    const cells = modules(form.host.querySelector("svg"), 4);
    assert.equal(cells.length, length);
    assert.equal(verifySymbol(cells, centers, blocks, checks, level), value);
  }
  form.props.value = "";
  await nextTick();
  assert.match(form.host.textContent, /暂无二维码内容/);
  form.props.value = "a".repeat(8000);
  await nextTick();
  assert.match(form.host.textContent, /内容超出二维码容量/);
  form.props.value = "42";
  form.props.foreground = "#123456";
  form.props.background = "#eaeaea";
  form.props.size = 200;
  form.props.margin = 8;
  await nextTick();
  const svg = form.host.querySelector("svg");
  assert.equal(modules(svg, 8).length, 21);
  assert.equal(svg.querySelector("path").getAttribute("fill"), "#123456");
  assert.equal(svg.querySelector("rect").getAttribute("fill"), "#eaeaea");
  assert.equal(form.host.firstElementChild.style.inlineSize, "200px");
});

test("QRCode refreshes only expired status and exports an independent SVG with alias colors", async () => {
  const app = await mount(ui.HysQRCode, {
    value: "https://example.com/session",
    status: "expired",
    color: "#132744",
    bgColor: "transparent",
    errorLevel: "H",
    bordered: false,
  });
  assert.equal(
    app.host.querySelector("svg[role=img]").getAttribute("aria-hidden"),
    "true",
  );
  assert.equal(await app.instance.value.exportImage(), null);
  assert(
    !app.host.querySelector(".hys-qr-frame").classList.contains("is-bordered"),
  );
  app.host.querySelector("button").click();
  assert.deepEqual(app.events, [["refresh"]]);
  app.props.status = "scanned";
  await settled();
  assert.match(app.host.textContent, /已扫码/);
  app.props.status = "active";
  await settled();
  const exported = await app.instance.value.exportImage("svg", 320);
  assert.equal(exported.type, "image/svg+xml;charset=utf-8");
  assert.match(await exported.text(), /width="320".*height="320"/);
  const svg = app.host.querySelector("svg[role=img]");
  assert.equal(
    svg.querySelector("[data-qr-modules]").getAttribute("fill"),
    "#132744",
  );
  assert.equal(svg.querySelector("rect").getAttribute("fill"), "transparent");
  assert.equal(svg.hasAttribute("hidden"), false);
});

test("Branding preserves function modules and retains a correction reserve in every block", async () => {
  const { qrSymbol } =
    await import("../packages/ui/dist/components/HysQRCode/qrMatrix.js");
  const { logoRegion } =
    await import("../packages/ui/dist/components/HysQRCode/qrArtwork.js");
  for (const [payload, level] of [
    ["https://example.com/check-in", "H"],
    ["https://example.com", "L"],
    ["x".repeat(120), "Q"],
    ["设备登录".repeat(40), "H"],
  ]) {
    const symbol = qrSymbol(payload, level);
    const margin = 4;
    const mark = logoRegion(symbol, symbol.matrix.length / 2, margin);
    assert(mark);
    const touched = Array.from({ length: symbol.blockCount }, () => new Set());
    for (const { x, y, width } of mark.regions)
      for (let offset = 0; offset < width; offset++) {
        const word = symbol.modules[y - margin][x - margin + offset];
        assert(word >= 0, "protected module under the logo");
        if (word < symbol.words.length) touched[symbol.owners[word]].add(word);
      }
    assert(
      touched.every((words) => words.size < Math.floor(symbol.degree / 2)),
    );
  }
});

test("RefreshCw and ScanLine are exposed by the public icon subpath", async () => {
  const icons = await import("../packages/ui/dist/icons.js");
  for (const name of ["RefreshCw", "ScanLine"]) {
    const app = await mount(icons[name], { size: 18 });
    assert(app.host.querySelectorAll("svg path").length >= 4);
  }
});

test("InputOtp uses a single form input, filters pasted content, and completes only new user values", async () => {
  const form = await mount(ui.HysInputOtp, {
    modelValue: "",
    length: 4,
    name: "pin",
  });
  const input = form.host.querySelector('input[autocomplete="one-time-code"]');
  assert(input);
  assert.equal(
    form.host.querySelectorAll("input:not([type=hidden])").length,
    1,
  );
  assert.equal(input.getAttribute("inputmode"), "numeric");

  async function type(value, caret = value.length) {
    input.value = value;
    input.setSelectionRange(caret, caret);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await settled();
  }

  input.focus();
  await type("a1-2 3d4 55");
  assert.equal(input.value, "1234");
  assert.deepEqual(form.events, [
    ["update", "1234"],
    ["complete", "1234"],
  ]);
  await type("1234");
  assert.equal(form.events.length, 2);
  await type("1294", 3);
  assert.equal(input.selectionStart, 3);
  await type("194", 1);
  assert.equal(input.selectionStart, 1);
  assert.equal(form.events.filter(([name]) => name === "complete").length, 2);
  form.props.modelValue = "9876";
  await settled();
  assert.equal(form.events.filter(([name]) => name === "complete").length, 2);
  assert.equal(form.host.querySelector("input[name=pin]").value, "9876");
  form.props.readonly = true;
  form.props.error = true;
  await nextTick();
  assert(input.readOnly);
  assert.equal(input.getAttribute("aria-invalid"), "true");
  form.props.disabled = true;
  await nextTick();
  assert(input.disabled);
});

test("Statistic formats zero, negative and precise values, reports trends, and distinguishes missing data from loading", async () => {
  const form = await mount(ui.HysStatistic, {
    title: "收入",
    value: 0,
    prefix: "¥",
    suffix: " 元",
    precision: 2,
    trend: { direction: "down", text: "2%" },
  });
  assert.match(form.host.textContent, /¥0\.00 元/);
  assert.match(form.host.textContent, /减少 2%/);
  form.props.value = "-123456789012345678.44";
  await settled();
  assert.match(form.host.textContent, /-123,456,789,012,345,678\.44/);
  form.props.formatter = (_value, text) => "(" + text + ")";
  await settled();
  assert.match(form.host.textContent, /\(-123,456,789,012,345,678\.44\)/u);
  form.props.value = null;
  await settled();
  assert.match(form.host.textContent, /—/);
  assert.doesNotMatch(form.host.textContent, /减少/);
  form.props.loading = true;
  await settled();
  assert.equal(
    form.host.querySelector("[aria-busy=true]")?.className,
    "hys-statistic",
  );
  assert.doesNotMatch(form.host.textContent, /—/);
});

test("PageHeader keeps caller-provided heading and action slots and delegates back navigation", async () => {
  const form = await mount(
    ui.HysPageHeader,
    {
      title: "fallback",
      subtitle: "待交付",
      showBack: true,
      compact: true,
      breadcrumbs: [{ label: "仓库", href: "/warehouse" }, { label: "工单" }],
    },
    {
      title: () => h("h2", "工单 123"),
      extra: () => h(ui.HysButton, {}, () => "提交"),
    },
  );
  assert.equal(form.host.querySelector("h2").textContent, "工单 123");
  assert.doesNotMatch(form.host.textContent, /fallback/);
  assert.equal(
    form.host.querySelector("nav a").getAttribute("href"),
    "/warehouse",
  );
  assert.equal(
    form.host.querySelector(".hys-page-extra button").textContent.trim(),
    "提交",
  );
  form.host.querySelector('button[aria-label="返回"]').click();
  await settled();
  assert.deepEqual(form.events, [["back", "click"]]);
  form.props.showBack = false;
  await nextTick();
  assert.equal(form.host.querySelector('button[aria-label="返回"]'), null);
});
