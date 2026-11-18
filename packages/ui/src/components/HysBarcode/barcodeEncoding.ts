export type BarcodeFormat = "CODE128" | "CODE39" | "EAN13" | "EAN8" | "UPCA";
export type BarcodeResult = { value: string; bits: string } | { error: string };

// Symbol widths in ISO/IEC 15417 Table 1, in codeword order.
const code128 = (
  "212222 222122 222221 121223 121322 131222 122213 122312 132212 221213 " +
  "221312 231212 112232 122132 122231 113222 123122 123221 223211 221132 " +
  "221231 213212 223112 312131 311222 321122 321221 312212 322112 322211 " +
  "212123 212321 232121 111323 131123 131321 112313 132113 132311 211313 " +
  "231113 231311 112133 112331 132131 113123 113321 133121 313121 211331 " +
  "231131 213113 213311 213131 311123 311321 331121 312113 312311 332111 " +
  "314111 221411 431111 111224 111422 121124 121421 141122 141221 112214 " +
  "112412 122114 122411 142112 142211 241211 221114 413111 241112 134111 " +
  "111242 121142 121241 114212 124112 124211 411212 421112 421211 212141 " +
  "214121 412121 111143 111341 131141 114113 114311 411113 411311 113141 " +
  "114131 311141 411131 211412 211214 211232 2331112"
).split(" ");

const alphabet39 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ-. $/+%*";
const code39 = [
  0x034, 0x121, 0x061, 0x160, 0x031, 0x130, 0x070, 0x025, 0x124, 0x064,
  0x109, 0x049, 0x148, 0x019, 0x118, 0x058, 0x00d, 0x10c, 0x04c, 0x01c,
  0x103, 0x043, 0x142, 0x013, 0x112, 0x052, 0x007, 0x106, 0x046, 0x016,
  0x181, 0x0c1, 0x1c0, 0x091, 0x190, 0x0d0, 0x085, 0x184, 0x0c4, 0x0a8,
  0x0a2, 0x08a, 0x02a, 0x094,
];

const odd = ["0001101", "0011001", "0010011", "0111101", "0100011", "0110001", "0101111", "0111011", "0110111", "0001011"];
const parity13 = ["LLLLLL", "LLGLGG", "LLGGLG", "LLGGGL", "LGLLGG", "LGGLLG", "LGGGLL", "LGLGLG", "LGLGGL", "LGGLGL"];
const invert = (bits: string) => Array.from(bits, bit => bit === "0" ? "1" : "0").join("");

function retail(value: string, format: "EAN13" | "EAN8" | "UPCA"): BarcodeResult {
  const length = { EAN13: 13, EAN8: 8, UPCA: 12 }[format];
  if (!/^\d+$/.test(value) || (value.length !== length - 1 && value.length !== length)) {
    return { error: "请输入 " + (length - 1) + " 位数字，或含校验位的 " + length + " 位数字。" };
  }
  const digits = value.slice(0, length - 1);
  const sum = Array.from(digits).reverse().reduce((total, digit, i) => total + Number(digit) * (i % 2 ? 1 : 3), 0);
  const complete = digits + ((10 - sum % 10) % 10);
  if (value.length === length && complete !== value) return { error: "校验位错误，应为 " + complete.at(-1) + "。" };
  const encoded = format === "UPCA" ? "0" + complete : complete;
  const left = encoded.length === 8 ? encoded.slice(0, 4) : encoded.slice(1, 7);
  const scheme = encoded.length === 8 ? "LLLL" : parity13[Number(encoded[0])];
  const leftBits = Array.from(left, (digit, i) => {
    const bits = odd[Number(digit)];
    return scheme[i] === "L" ? bits : Array.from(invert(bits)).reverse().join("");
  }).join("");
  const rightBits = Array.from(encoded.slice(-left.length), digit => invert(odd[Number(digit)])).join("");
  return { value: complete, bits: "101" + leftBits + "01010" + rightBits + "101" };
}

function widthBits(pattern: string) {
  return Array.from(pattern, (width, i) => (i % 2 ? "0" : "1").repeat(Number(width))).join("");
}

export function encodeBarcode(value: string, format: BarcodeFormat): BarcodeResult {
  if (!value) return { error: "请输入条形码内容。" };
  if (format === "EAN13" || format === "EAN8" || format === "UPCA") return retail(value, format);
  if (format === "CODE39") {
    if (!/^[0-9A-Z. $/+%-]{1,80}$/.test(value)) return { error: "Code 39 支持 1–80 位大写字母、数字及指定符号。" };
    const bits = Array.from("*" + value + "*", char => {
      const widths = code39[alphabet39.indexOf(char)];
      return widthBits(Array.from({ length: 9 }, (_, i) => widths & (1 << (8 - i)) ? "3" : "1").join(""));
    }).join("0");
    return { value, bits };
  }
  if (format !== "CODE128") return { error: "当前条形码格式不受支持。" };
  if (!/^[\x20-\x7e]{1,80}$/.test(value)) return { error: "Code 128 支持 1–80 位可打印 ASCII 字符。" };
  const numeric = /^\d+$/.test(value) && value.length % 2 === 0;
  const words = numeric ? [105, ...value.match(/../g)!.map(Number)] : [104, ...Array.from(value, char => char.charCodeAt(0) - 32)];
  const checksum = words.reduce((total, word, i) => total + word * (i || 1), 0) % 103;
  return { value, bits: [...words, checksum, 106].map(word => widthBits(code128[word])).join("") };
}

export function barcodeBars(bits: string) {
  const bars: { start: number; width: number }[] = [];
  for (const match of bits.matchAll(/1+/g)) bars.push({ start: match.index, width: match[0].length });
  return bars;
}
