export const masks = {
  phone: "### #### ####",
  date: "####-##-##",
  time: "##:##",
  card: "#### #### #### #### ###",
  identifier: "#### #### #### #####*",
} as const;

type Token = { literal: string } | { test: RegExp };
const types: Record<string, RegExp> = { "#": /^[0-9]$/, A: /^\p{L}$/u, "*": /^[\p{L}\p{N}]$/u };
export function maskTokens(mask: string, rules: Readonly<Record<string, RegExp>> = {}): Token[] {
  const patterns = { ...types, ...rules };
  const chars = Array.from(mask);
  const tokens: Token[] = [];
  function literal(char: string) {
    const last = tokens.at(-1);
    if (last && "literal" in last) last.literal += char;
    else tokens.push({ literal: char });
  }
  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];
    if (char === "\\" && i + 1 < chars.length) literal(chars[++i]);
    else if (Object.hasOwn(patterns, char)) {
      const rule = patterns[char];
      tokens.push({ test: new RegExp("^(?:" + rule.source + ")$", rule.flags.replace(/[gy]/g, "")) });
    }
    else literal(char);
  }
  return tokens;
}

export function readMask(tokens: Token[], value: string, formatted = false) {
  let raw = "";
  let index = 0;
  for (const token of tokens) {
    if ("literal" in token) {
      if (formatted && value.startsWith(token.literal, index)) index += token.literal.length;
      continue;
    }
    let found = false;
    while (index < value.length) {
      const character = String.fromCodePoint(value.codePointAt(index)!);
      index += character.length;
      if (token.test.test(character)) {
        raw += character;
        found = true;
        break;
      }
    }
    if (!found) break;
  }
  return raw;
}

export function formatMask(tokens: Token[], raw: string) {
  let text = "";
  let index = 0;
  const offsets = [0];
  for (const token of tokens) {
    if (index >= raw.length) break;
    if ("literal" in token) text += token.literal;
    else {
      const character = String.fromCodePoint(raw.codePointAt(index)!);
      text += character;
      index += character.length;
      for (let unit = 0; unit < character.length; unit++) offsets.push(text.length);
    }
  }
  return { text, offsets };
}
