import assert from "node:assert/strict";
import { test } from "node:test";
import { createSSRApp, h } from "vue";
import { renderToString } from "vue/server-renderer";
import { HysModal, HysSplitPane, HysTour } from "../packages/ui/dist/index.js";

test("Initially open overlays render without installing browser-only effects", async () => {
  assert.equal(typeof document, "undefined");
  const app = createSSRApp(() =>
    h("main", [
      h(HysModal, { open: true, title: "SSR dialog" }),
      h(HysTour, {
        modelValue: true,
        steps: [{ title: "SSR tour", target: "#tour-ssr-target" }],
      }),
      h(HysSplitPane, { defaultValue: 46 }, {
        first: () => h("p", { id: "tour-ssr-target" }, "Target"),
      }),
    ]),
  );
  const context = {};
  const html = await renderToString(app, context);
  assert.match(html, /aria-valuenow="46"/);
  assert.match(html, /id="tour-ssr-target"/);
  assert.match(context.teleports.body, /aria-label="SSR dialog"/);
  assert.match(context.teleports.body, /aria-label="SSR tour"/);
});
