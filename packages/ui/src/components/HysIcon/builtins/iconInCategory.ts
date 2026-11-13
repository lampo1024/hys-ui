import type { HysIconEntry, HysIconSvgNode } from "../iconTypes";

// The curated SVG geometry in this directory comes from Lucide 0.468.0.
// Its ISC notice is included in packages/ui/LICENSE.
export function iconInCategory(category: string) {
  return (
    label: string,
    nodes: readonly HysIconSvgNode[],
    options: Pick<HysIconEntry, "keywords" | "aliases" | "directional">,
  ): HysIconEntry => ({
    source: { type: "svg", nodes },
    label,
    category,
    ...options,
  });
}
