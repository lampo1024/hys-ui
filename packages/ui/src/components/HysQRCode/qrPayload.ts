// QR Code Model 2, ISO/IEC 18004. Rows give the per-block correction
// codewords and number of blocks for versions 1 through 40.
export type QrCorrection = "L" | "M" | "Q" | "H";

const correctionWords = {
  L: [
    7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28,
    28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
    30, 30,
  ],
  M: [
    10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26,
    26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28,
    28, 28,
  ],
  Q: [
    13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26,
    30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
    30, 30,
  ],
  H: [
    17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26,
    28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
    30, 30,
  ],
};
const blocks = {
  L: [
    1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12,
    12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25,
  ],
  M: [
    1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17,
    18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49,
  ],
  Q: [
    1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23,
    25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68,
  ],
  H: [
    1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25,
    34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81,
  ],
};
const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:";
const modes = {
  numeric: { indicator: 1, length: [10, 12, 14] },
  alphanumeric: { indicator: 2, length: [9, 11, 13] },
  bytes: { indicator: 4, length: [8, 16, 16] },
};

function append(bits: number[], number: number, length: number) {
  for (let shift = length - 1; shift >= 0; shift--)
    bits.push((number >>> shift) & 1);
}

function rawCapacity(version: number) {
  const width = version * 4 + 17;
  let dataModules = width * width - 3 * 64 - (width - 16) * 2 - 31;
  if (version > 1) {
    const centers = Math.floor(version / 7) + 2;
    dataModules -= (centers ** 2 - 3) * 25 - (centers - 2) * 10;
  }
  if (version >= 7) dataModules -= 36;
  return Math.floor(dataModules / 8);
}

// QR Reed–Solomon uses GF(256), reduced by x⁸ + x⁴ + x³ + x² + 1.
function multiply(a: number, b: number) {
  let result = 0;
  for (; b; b >>>= 1) {
    if (b & 1) result ^= a;
    a <<= 1;
    if (a & 256) a ^= 0x11d;
  }
  return result;
}

function generator(degree: number) {
  const coefficients = new Uint8Array(degree + 1);
  coefficients[0] = 1;
  let root = 1;
  for (let i = 1; i <= degree; i++) {
    for (let j = i; j > 0; j--)
      coefficients[j] ^= multiply(coefficients[j - 1], root);
    root = multiply(root, 2);
  }
  return coefficients;
}

function withCorrection(
  data: Uint8Array,
  rawLength: number,
  blockCount: number,
  degree: number,
) {
  const baseLength = Math.floor(data.length / blockCount);
  const longBlocks = data.length % blockCount;
  const divisor = generator(degree);
  const payloads: Uint8Array[] = [];
  const checksums: Uint8Array[] = [];
  let offset = 0;
  for (let i = 0; i < blockCount; i++) {
    const size = baseLength + (i >= blockCount - longBlocks ? 1 : 0);
    const payload = data.subarray(offset, offset + size);
    offset += size;
    const remainder = new Uint8Array(size + degree);
    remainder.set(payload);
    for (let k = 0; k < size; k++) {
      const factor = remainder[k];
      if (factor)
        for (let j = 1; j <= degree; j++)
          remainder[k + j] ^= multiply(divisor[j], factor);
    }
    payloads.push(payload);
    checksums.push(remainder.subarray(size));
  }

  const words = new Uint8Array(rawLength);
  const owners = new Uint8Array(rawLength);
  let position = 0;
  for (let i = 0; i <= baseLength; i++) {
    for (const [block, payload] of payloads.entries()) {
      if (i < payload.length) {
        owners[position] = block;
        words[position++] = payload[i];
      }
    }
  }
  for (let i = 0; i < degree; i++)
    for (const [block, checksum] of checksums.entries()) {
      owners[position] = block;
      words[position++] = checksum[i];
    }
  return { words, owners, degree, blockCount };
}

export function qrCodewords(text: string, correction: QrCorrection) {
  if (text.length > 7089) return undefined;
  const dataBits: number[] = [];
  let length = text.length;
  let mode: keyof typeof modes;
  let utf8 = false;
  if (/^[0-9]+$/u.test(text)) {
    mode = "numeric";
    for (let i = 0; i < text.length; i += 3) {
      const digits = text.slice(i, i + 3);
      append(dataBits, Number(digits), 1 + digits.length * 3);
    }
  } else if ([...text].every((character) => alphabet.includes(character))) {
    mode = "alphanumeric";
    for (let i = 0; i < text.length; i += 2) {
      const first = alphabet.indexOf(text[i]);
      if (i + 1 < text.length)
        append(dataBits, first * 45 + alphabet.indexOf(text[i + 1]), 11);
      else append(dataBits, first, 6);
    }
  } else {
    mode = "bytes";
    const bytes = new TextEncoder().encode(text);
    utf8 = bytes.some((byte) => byte > 127);
    length = bytes.length;
    for (const byte of bytes) append(dataBits, byte, 8);
  }

  for (let version = 1; version <= 40; version++) {
    const raw = rawCapacity(version);
    const blockCount = blocks[correction][version - 1];
    const degree = correctionWords[correction][version - 1];
    const capacity = raw - blockCount * degree;
    const countBits =
      modes[mode].length[version < 10 ? 0 : version < 27 ? 1 : 2];
    const required = (utf8 ? 12 : 0) + 4 + countBits + dataBits.length;
    if (length >= 2 ** countBits || required > capacity * 8) continue;

    const bits: number[] = [];
    if (utf8) {
      append(bits, 7, 4); // ECI mode
      append(bits, 26, 8); // UTF-8 assignment
    }
    append(bits, modes[mode].indicator, 4);
    append(bits, length, countBits);
    bits.push(...dataBits);
    append(bits, 0, Math.min(4, capacity * 8 - bits.length));
    append(bits, 0, (8 - (bits.length % 8)) % 8);
    const data = new Uint8Array(capacity);
    let i = 0;
    for (; i * 8 < bits.length; i++) {
      let word = 0;
      for (let bit = 0; bit < 8; bit++) word = (word << 1) | bits[i * 8 + bit];
      data[i] = word;
    }
    for (let pad = 0; i < capacity; i++, pad++) data[i] = pad % 2 ? 0x11 : 0xec;
    return { version, ...withCorrection(data, raw, blockCount, degree) };
  }
  return undefined;
}
