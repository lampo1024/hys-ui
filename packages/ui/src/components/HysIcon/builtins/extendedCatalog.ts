/// <reference types="vite/client" />
import type { HysIconEntry, HysIconLoader, HysIconSvgNode } from "../iconTypes";
import manifest from "./catalog/manifest.json";

type CatalogMetadata = { name: string } & Pick<
  HysIconEntry,
  "label" | "keywords" | "aliases" | "directional"
>;
interface CatalogGroup {
  chunk: string;
  category: string;
  icons: readonly CatalogMetadata[];
}
const loadGlyphs = import.meta.glob<Record<string, readonly HysIconSvgNode[]>>(
  ["./catalog/*.json", "!./catalog/manifest.json"],
  { import: "default" },
);

function displayLabel(name: string) {
  return name[0].toUpperCase() + name.slice(1).replaceAll("-", " ");
}

function createCatalog(groups: readonly CatalogGroup[]) {
  const icons: Record<string, HysIconEntry> = {};
  for (const { chunk, category, icons: entries } of groups) {
    const loadGroup = loadGlyphs[`./catalog/${chunk}.json`];
    for (const { name, ...metadata } of entries) {
      const source: HysIconLoader = async () => ({
        type: "svg",
        nodes: (await loadGroup())[name],
      });
      icons[name] = {
        ...metadata,
        label: metadata.label ?? displayLabel(name),
        category,
        source,
        variants: { round: source, sharp: source, bold: source, thin: source },
      };
    }
  }
  return icons;
}

export const extendedBuiltinIcons = createCatalog(manifest);
