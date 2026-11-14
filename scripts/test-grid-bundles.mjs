import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { build } from "vite";

export async function checkGridBundles(root) {
  const entry = path.join(root, "grid-entry.js");
  const html = path.join(root, "grid-entry.html");
  fs.writeFileSync(
    html,
    '<div id="grid"></div><script type="module" src="./grid-entry.js"></script>',
  );

  const fixtures = [
    { name: "HysTable" },
    { name: "HysDataGrid" },
    { name: "HysProGrid" },
    { name: "HysProGrid", conditionalFormat: true },
    { name: "HysProGrid", clipboard: true },
  ];
  for (const {
    name,
    conditionalFormat = false,
    clipboard = false,
  } of fixtures) {
    fs.writeFileSync(
      entry,
      [
        'import { createApp, h } from "vue";',
        `import { ${name} as Grid } from "hys-ui";`,
        'import "hys-ui/style.css";',
        name === "HysProGrid" ? 'import "hys-ui/pro-grid.css";' : "",
        conditionalFormat
          ? 'import { createProGridConditionalFormat } from "hys-ui/pro-grid/conditional-format";\nimport "hys-ui/pro-grid/conditional-format.css";\nconst gridOptions = { cellClassName: createProGridConditionalFormat([{ when: () => true, tone: "warning" }]) };'
          : "const gridOptions = undefined;",
        clipboard
          ? 'import { createProGridClipboard } from "hys-ui/pro-grid/clipboard";\nimport "hys-ui/pro-grid/clipboard.css";\nconst clipboard = createProGridClipboard();'
          : "const clipboard = undefined;",
        'createApp(() => h(Grid, { rows: [], columns: [], rowKey: "id", gridOptions, clipboard })).mount("#grid");',
      ].join("\n"),
    );

    const modules = new Set();
    const result = await build({
      root,
      configFile: false,
      logLevel: "silent",
      build: { write: false, rollupOptions: { input: html } },
      plugins: [
        {
          name: "verify-grid-boundaries",
          generateBundle(_, bundle) {
            for (const output of Object.values(bundle)) {
              if (output.type !== "chunk") continue;
              for (const [id, module] of Object.entries(output.modules))
                if (module.renderedLength > 0)
                  modules.add(id.replaceAll("\\", "/"));
            }
          },
        },
      ],
    });
    const has = (component) =>
      [...modules].some((id) => id.includes(`/components/${component}/`));
    const css = (Array.isArray(result) ? result : [result])
      .flatMap((chunk) => chunk.output)
      .filter(
        (asset) => asset.type === "asset" && asset.fileName.endsWith(".css"),
      )
      .map((asset) => asset.source.toString())
      .join("\n");
    assert(has(name), `${name} fixture did not render its grid`);
    const isPro = name === "HysProGrid";
    assert.equal(has("HysProGrid"), isPro, `${name} ProGrid JS dependency`);
    assert.equal(
      [...modules].some((id) => id.endsWith("/pro-grid/conditional-format.js")),
      conditionalFormat,
      `${name} optional conditional formatting JS`,
    );
    assert.equal(
      css.includes(".hys-ui-pro-grid-format-warning"),
      conditionalFormat,
      `${name} optional conditional formatting CSS`,
    );
    assert.equal(
      [...modules].some(
        (id) =>
          id.endsWith("/pro-grid/clipboard.js") ||
          id.includes("/HysProGrid/clipboard/"),
      ),
      clipboard,
      `${name} optional clipboard JS`,
    );
    assert.equal(
      css.includes("[data-hys-pro-grid-range]"),
      clipboard,
      `${name} optional clipboard CSS`,
    );
    assert.equal(
      css.includes(".hys-ui-pro-grid-editor"),
      isPro,
      `${name} ProGrid CSS dependency`,
    );
    assert.equal(
      has("HysDataGrid"),
      name !== "HysTable",
      `${name} DataGrid dependency`,
    );
    assert.equal(
      has("HysTable"),
      name === "HysTable",
      `${name} Table dependency`,
    );
    assert.equal(
      has("HysVirtualTable"),
      false,
      `${name} VirtualTable dependency`,
    );
  }
  console.log("PASS: Table, DataGrid and ProGrid consumer JS/CSS boundaries");
}
