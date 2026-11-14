import { copyFileSync, mkdirSync } from "node:fs";

mkdirSync("dist/pro-grid", { recursive: true });
copyFileSync("src/components/HysProGrid/pro-grid.css", "dist/pro-grid.css");
copyFileSync(
  "src/components/HysProGrid/conditional-format.css",
  "dist/pro-grid/conditional-format.css",
);
copyFileSync("src/components/HysProGrid/clipboard/clipboard.css", "dist/pro-grid/clipboard.css");
