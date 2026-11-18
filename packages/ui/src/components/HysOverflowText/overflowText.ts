const segmenter = typeof Intl.Segmenter === "function" ? new Intl.Segmenter() : undefined;

export function middleEllipsis(text: string, fits: (text: string) => boolean) {
  if (fits(text)) return text;
  const characters = segmenter ? Array.from(segmenter.segment(text), ({ segment }) => segment) : Array.from(text);
  let low = 0;
  let high = characters.length;
  let result = "…";
  while (low < high) {
    const count = Math.floor((low + high) / 2);
    const left = Math.ceil(count / 2);
    const right = count - left;
    const candidate = characters.slice(0, left).join("") + "…" + characters.slice(characters.length - right).join("");
    if (fits(candidate)) {
      result = candidate;
      low = count + 1;
    } else {
      high = count;
    }
  }
  return result;
}

export function highlightText(text: string, keywords: string | readonly string[] = []) {
  const terms = Array.from(new Set(typeof keywords === "string" ? [keywords] : keywords))
    .filter(Boolean)
    .sort((left, right) => right.length - left.length)
    .map(term => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  if (!terms.length) return [{ text, match: false }];
  return text.split(new RegExp("(" + terms.join("|") + ")", "giu"))
    .flatMap((part, index) => part ? [{ text: part, match: index % 2 === 1 }] : []);
}
