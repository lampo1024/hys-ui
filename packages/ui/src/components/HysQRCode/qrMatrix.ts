import { qrCodewords, type QrCorrection } from "./qrPayload";

const formatLevel = { L: 1, M: 0, Q: 3, H: 2 };
const masks = [
  (x: number, y: number) => (x + y) % 2 === 0,
  (_x: number, y: number) => y % 2 === 0,
  (x: number) => x % 3 === 0,
  (x: number, y: number) => (x + y) % 3 === 0,
  (x: number, y: number) => (Math.floor(y / 2) + Math.floor(x / 3)) % 2 === 0,
  (x: number, y: number) => ((x * y) % 2) + ((x * y) % 3) === 0,
  (x: number, y: number) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
  (x: number, y: number) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
];

function bch(value: number, shift: number, polynomial: number) {
  let remainder = value << shift;
  for (let bit = 31 - Math.clz32(remainder); bit >= shift; bit--) {
    if ((remainder >>> bit) & 1) remainder ^= polynomial << (bit - shift);
  }
  return (value << shift) | remainder;
}

function writeFormat(
  matrix: Int8Array[],
  correction: QrCorrection,
  mask: number,
) {
  const size = matrix.length;
  const word = bch((formatLevel[correction] << 3) | mask, 10, 0x537) ^ 0x5412;
  const bit = (index: number) => (word >>> index) & 1;
  for (let i = 0; i < 6; i++) matrix[i][8] = bit(i);
  matrix[7][8] = bit(6);
  matrix[8][8] = bit(7);
  matrix[8][7] = bit(8);
  for (let i = 9; i < 15; i++) matrix[8][14 - i] = bit(i);
  for (let i = 0; i < 8; i++) matrix[8][size - 1 - i] = bit(i);
  for (let i = 8; i < 15; i++) matrix[size - 15 + i][8] = bit(i);
  matrix[size - 8][8] = 1;
}

function layout(version: number, correction: QrCorrection) {
  const size = 17 + version * 4;
  const cells = Array.from({ length: size }, () =>
    new Int8Array(size).fill(-1),
  );
  for (let i = 0; i < size; i++) {
    cells[6][i] = cells[i][6] = 1 - (i % 2);
  }
  for (const [cx, cy] of [
    [3, 3],
    [size - 4, 3],
    [3, size - 4],
  ]) {
    for (let y = Math.max(0, cy - 4); y <= Math.min(size - 1, cy + 4); y++) {
      for (let x = Math.max(0, cx - 4); x <= Math.min(size - 1, cx + 4); x++) {
        const distance = Math.max(Math.abs(x - cx), Math.abs(y - cy));
        cells[y][x] = distance === 2 || distance === 4 ? 0 : 1;
      }
    }
  }
  if (version > 1) {
    const count = Math.floor(version / 7) + 2;
    const interval =
      version === 32 ? 26 : 2 * Math.ceil((size - 13) / (2 * count - 2));
    const centers = Array.from({ length: count }, (_, i) =>
      i === 0 ? 6 : size - 7 - interval * (count - 1 - i),
    );
    const last = centers.at(-1);
    for (const cx of centers) {
      for (const cy of centers) {
        if (
          (cy === 6 && (cx === 6 || cx === last)) ||
          (cx === 6 && cy === last)
        )
          continue;
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            cells[cy + dy][cx + dx] =
              Math.max(Math.abs(dx), Math.abs(dy)) === 1 ? 0 : 1;
          }
        }
      }
    }
  }
  if (version >= 7) {
    const word = bch(version, 12, 0x1f25);
    for (let i = 0; i < 18; i++) {
      const x = size - 11 + (i % 3);
      const y = Math.floor(i / 3);
      cells[y][x] = cells[x][y] = (word >>> i) & 1;
    }
  }
  writeFormat(cells, correction, 0);
  return cells;
}

function placements(cells: Int8Array[], words: Uint8Array) {
  const points: { x: number; y: number; bit: number }[] = [];
  const size = cells.length;
  let upward = true;
  for (let right = size - 1; right > 0; right -= 2) {
    if (right === 6) right--;
    for (let row = 0; row < size; row++) {
      const y = upward ? size - row - 1 : row;
      for (let x = right; x >= right - 1; x--) {
        if (cells[y][x] !== -1) continue;
        const index = points.length;
        const word = words[index >>> 3] ?? 0;
        points.push({ x, y, bit: (word >>> (7 - (index % 8))) & 1 });
      }
    }
    upward = !upward;
  }
  return points;
}

function linePenalty(length: number, cell: (index: number) => number) {
  let run = 1,
    score = 0,
    prior = -1,
    pattern = 0;
  // Four light modules beyond either edge complete finder-like patterns.
  for (let i = 0; i < length + 4; i++) {
    const bit = i < length ? cell(i) : 0;
    pattern = ((pattern << 1) | bit) & 0x7ff;
    if (i >= 6 && (pattern === 0b00001011101 || pattern === 0b10111010000))
      score += 40;
    if (i >= length) continue;
    run = prior === bit ? run + 1 : 1;
    if (run >= 5) score += run === 5 ? 3 : 1;
    prior = bit;
  }
  return score;
}

function penalty(matrix: Int8Array[]) {
  let score = 0,
    dark = 0;
  const size = matrix.length;
  for (let y = 0; y < size; y++) {
    score +=
      linePenalty(size, (index) => matrix[y][index]) +
      linePenalty(size, (index) => matrix[index][y]);
    for (let x = 0; x < size; x++) {
      const bit = matrix[y][x];
      dark += bit;
      if (
        x > 0 &&
        y > 0 &&
        matrix[y - 1][x] === bit &&
        matrix[y][x - 1] === bit &&
        matrix[y - 1][x - 1] === bit
      )
        score += 3;
    }
  }
  return (
    score +
    Math.floor(Math.abs(dark * 20 - size * size * 10) / (size * size)) * 10
  );
}

export function qrSymbol(text: string, correction: QrCorrection) {
  const payload = qrCodewords(text, correction);
  if (!payload) return undefined;
  const matrix = layout(payload.version, correction);
  const data = placements(matrix, payload.words);
  const width = matrix.length;
  const modules = Array.from({ length: width }, () =>
    new Int16Array(width).fill(-1),
  );
  for (const [index, { x, y }] of data.entries()) modules[y][x] = index >>> 3;
  let best = Infinity,
    selected = 0;
  for (const [mask, apply] of masks.entries()) {
    for (const { x, y, bit } of data) matrix[y][x] = bit ^ Number(apply(x, y));
    writeFormat(matrix, correction, mask);
    const score = penalty(matrix);
    if (score < best) {
      best = score;
      selected = mask;
    }
  }
  for (const { x, y, bit } of data)
    matrix[y][x] = bit ^ Number(masks[selected](x, y));
  writeFormat(matrix, correction, selected);
  return { ...payload, matrix, modules };
}
