export interface DiffRow {
  before?: string;
  after?: string;
  beforeLine?: number;
  afterLine?: number;
  type: "equal" | "added" | "removed" | "changed";
}

export function diffRows(before: string, after: string, aligned: boolean) {
  const left = before.split(/\r?\n/);
  const right = after.split(/\r?\n/);
  const rows: DiffRow[] = [];
  function append(a: number | undefined, b: number | undefined) {
    rows.push({
      before: a === undefined ? undefined : left[a],
      after: b === undefined ? undefined : right[b],
      beforeLine: a === undefined ? undefined : a + 1,
      afterLine: b === undefined ? undefined : b + 1,
      type:
        a === undefined
          ? "added"
          : b === undefined
            ? "removed"
            : left[a] === right[b]
              ? "equal"
              : "changed",
    });
  }
  function appendBlock(a: number, aEnd: number, b: number, bEnd: number) {
    for (let offset = 0; offset < Math.max(aEnd - a, bEnd - b); offset++) {
      append(
        a + offset < aEnd ? a + offset : undefined,
        b + offset < bEnd ? b + offset : undefined,
      );
    }
  }
  if (!aligned) {
    appendBlock(0, left.length, 0, right.length);
    return rows;
  }
  let start = 0;
  let leftEnd = left.length;
  let rightEnd = right.length;
  while (start < leftEnd && start < rightEnd && left[start] === right[start]) {
    append(start, start);
    start++;
  }
  while (
    leftEnd > start &&
    rightEnd > start &&
    left[leftEnd - 1] === right[rightEnd - 1]
  ) {
    leftEnd--;
    rightEnd--;
  }
  const leftSize = leftEnd - start;
  const rightSize = rightEnd - start;
  const stride = rightSize + 1;
  if (leftSize && rightSize && leftSize * rightSize <= 1_000_000) {
    const scores = new Uint32Array((leftSize + 1) * stride);
    for (let a = leftSize - 1; a >= 0; a--) {
      for (let b = rightSize - 1; b >= 0; b--) {
        const index = a * stride + b;
        scores[index] =
          left[start + a] === right[start + b]
            ? scores[index + stride + 1] + 1
            : Math.max(scores[index + stride], scores[index + 1]);
      }
    }
    let a = 0;
    let b = 0;
    let blockA = 0;
    let blockB = 0;
    while (a < leftSize && b < rightSize) {
      if (left[start + a] === right[start + b]) {
        appendBlock(start + blockA, start + a, start + blockB, start + b);
        append(start + a, start + b);
        blockA = ++a;
        blockB = ++b;
      } else if (scores[(a + 1) * stride + b] >= scores[a * stride + b + 1]) {
        a++;
      } else {
        b++;
      }
    }
    appendBlock(start + blockA, leftEnd, start + blockB, rightEnd);
  } else {
    appendBlock(start, leftEnd, start, rightEnd);
  }
  appendBlock(leftEnd, left.length, rightEnd, right.length);
  return rows;
}
