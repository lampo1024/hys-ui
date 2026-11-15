export type SourceRange = { from: number; to: number };

export function findCodeMatches(source: string, query: string, caseSensitive: boolean): SourceRange[] {
  const normalize = (value: string) => {
    const normalized = value.normalize("NFKD");
    return caseSensitive ? normalized : normalized.toLowerCase();
  };
  const needle = normalize(query);
  if (!needle || !source) return [];

  const ascii = /^[\x00-\x7f]*$/.test(source);
  const starts: number[] = [];
  const ends: number[] = [];
  const nextOffsets: number[] = [];
  let text = ascii ? normalize(source) : "";
  if (!ascii) {
    let original = 0;
    for (const character of source) {
      const folded = normalize(character);
      const next = original + character.length;
      const normalizedEnd = text.length + folded.length;
      for (let index = 0, offset = original; index < folded.length; index++) {
        starts.push(offset);
        ends.push(next);
        nextOffsets.push(normalizedEnd);
        if (offset === original + index && character[index] === folded[index]) offset++;
      }
      text += folded;
      original = next;
    }
  }

  const result: SourceRange[] = [];
  let offset = 0;
  while ((offset = text.indexOf(needle, offset)) >= 0) {
    const end = offset + needle.length;
    result.push(ascii ? { from: offset, to: end } : { from: starts[offset], to: ends[end - 1] });
    // A match can end inside an expanded character. A replacement owns the whole source character.
    offset = ascii ? end : nextOffsets[end - 1];
  }
  return result;
}
