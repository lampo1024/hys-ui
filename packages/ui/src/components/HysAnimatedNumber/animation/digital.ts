import {
  clamp,
  glyph,
  noise,
  rectangle,
  rollingGlyph,
  smooth,
  wave,
  type PaintFrame,
} from "./paint";
import { glyphMask } from "./particles";
import { digitPath, tracePath } from "./paths";

const seven = [
  "abcdef",
  "bc",
  "abged",
  "abgcd",
  "fgbc",
  "afgcd",
  "afgecd",
  "abc",
  "abcdefg",
  "abfgcd",
];
const segments = {
  a: [-0.2, -0.41, 0.2, -0.41],
  b: [0.22, -0.37, 0.22, -0.04],
  c: [0.22, 0.04, 0.22, 0.37],
  d: [-0.2, 0.41, 0.2, 0.41],
  e: [-0.22, 0.04, -0.22, 0.37],
  f: [-0.22, -0.37, -0.22, -0.04],
  g: [-0.2, 0, 0.2, 0],
} as const;

function segmentsAt(frame: PaintFrame, index: number, variant: number) {
  const { ctx, size, color, accent } = frame;
  ctx.save();
  ctx.lineWidth = (variant === 3 ? 0.045 : 0.075) * size;
  ctx.lineCap = variant === 3 ? "butt" : "round";
  const active = seven[index] ?? "";
  for (const [key, [x, y, a, b]] of Object.entries(segments)) {
    ctx.globalAlpha = active.includes(key) ? 1 : 0.14;
    ctx.strokeStyle = variant === 3 ? color : accent;
    ctx.beginPath();
    ctx.moveTo(x * size, y * size);
    if (variant === 1 && y === b) {
      ctx.lineTo(-0.022 * size, b * size);
      ctx.moveTo(0.022 * size, b * size);
    }
    ctx.lineTo(a * size, b * size);
    ctx.stroke();
  }
  if (variant === 1) {
    ctx.lineWidth = 0.035 * size;
    const diagonal = [
      [-0.18, -0.35, -0.025, -0.05],
      [0.18, -0.35, 0.025, -0.05],
      [-0.18, 0.35, -0.025, 0.05],
      [0.18, 0.35, 0.025, 0.05],
      [0, -0.37, 0, -0.05],
      [0, 0.05, 0, 0.37],
    ];
    diagonal.forEach(([x, y, a, b], position) => {
      ctx.globalAlpha = (index + position) % 4 === 0 ? 0.65 : 0.12;
      ctx.beginPath();
      ctx.moveTo(x * size, y * size);
      ctx.lineTo(a * size, b * size);
      ctx.stroke();
    });
  }
  ctx.restore();
}

function scan(frame: PaintFrame, variant: number, digit: string) {
  const { p, width, size, ctx, accent } = frame;
  const x = width / size / 2;
  glyph(frame, digit, {
    alpha: variant === 14 ? 0.78 : 0.9,
    color: variant === 14 ? accent : undefined,
  });
  for (let row = 0; row < (variant === 20 ? 12 : 8); row++) {
    const y = -0.54 + row * (variant === 20 ? 0.09 : 0.135);
    const reveal = variant === 20 ? Math.floor(p * 12) > row : true;
    if (!reveal) continue;
    rectangle(frame, -x, y, x * 2, 0.035, () =>
      glyph(frame, digit, { color: accent, alpha: 0.55, glow: 0.09 }),
    );
  }
  rectangle(frame, -x, -0.58 + p * 1.16, x * 2, 0.05, () =>
    glyph(frame, digit, { color: accent, glow: 0.2 }),
  );
  if (variant === 19) {
    ctx.save();
    ctx.strokeStyle = accent;
    ctx.globalAlpha *= 0.7 * wave(p);
    ctx.lineWidth = 0.025 * size;
    ctx.beginPath();
    ctx.arc(0, 0, 0.43 * size, 0, p * Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

export function paintDigital(frame: PaintFrame, variant: number) {
  const {
    ctx,
    p,
    from,
    to,
    toIndex,
    size,
    width,
    accent,
    color,
    seed,
    strength,
  } = frame;
  const q = wave(p) * strength;
  const phase = p > 0.85 ? 1 : Math.floor(p * 28);
  const random = Math.floor(noise(seed, phase) * 10);
  const digit = p >= 0.84 ? to : rollingGlyph(frame, random);
  if (variant <= 3) {
    const index =
      p === 1
        ? toIndex
        : p < 0.24
          ? frame.fromIndex
          : p < 0.68
            ? random
            : toIndex;
    if (variant !== 2) segmentsAt(frame, index, variant);
    else {
      ctx.save();
      ctx.fillStyle = accent;
      for (const [x, y] of glyphMask(
        rollingGlyph(frame, index),
        ctx.font,
        size,
        5,
      )) {
        ctx.beginPath();
        ctx.arc(x * size, y * size, size * 0.038, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
    return;
  }
  if ([6, 7, 8, 9, 22, 23, 24, 25].includes(variant)) {
    const sets = {
      6: "0101ヲヌ",
      7: "01",
      8: "ABCDEF0123456789",
      9: "#@?&XYZ",
      22: "9876543210",
      23: "01Zフォ",
      24: ">_0123456789",
      25: "_",
    };
    const set = sets[variant as keyof typeof sets];
    const sample = set[Math.floor(noise(seed + 6, phase) * set.length)];
    const result = p < (variant === 24 ? 0.58 : 0.84) ? sample : to;
    if (variant === 23 || variant === 22 || variant === 6)
      glyph(frame, sample, {
        y: -0.5 + p * 0.55,
        alpha: 0.35 * q,
        color: accent,
      });
    glyph(frame, result, {
      color: accent,
      glow: 0.08 * q,
      x: variant === 22 ? -0.35 * (1 - p) : 0,
    });
    if (variant === 25 && phase % 2 === 0)
      glyph(frame, "_", { x: 0.32, y: 0.04, alpha: q, color: accent });
    return;
  }
  if ([5, 13, 14, 19, 20, 21, 26, 29].includes(variant)) {
    scan(frame, variant, p < 0.28 ? from : to);
    if (variant === 5)
      glyph(frame, to, {
        y: -0.08 * q,
        sx: 0.92,
        alpha: 0.45 * q,
        color: accent,
        glow: 0.13,
      });
    if (variant === 21 || variant === 29) {
      ctx.save();
      ctx.fillStyle = accent;
      ctx.globalAlpha *= 0.24 * q;
      const d = width / size / 5;
      for (let row = 0; row < 8; row++)
        for (let col = 0; col < 5; col++) {
          const active =
            variant === 21
              ? row / 8 + col * 0.025 < p
              : noise(seed + col, row) < p;
          const dx =
            variant === 29 ? (noise(seed + row, col) - 0.5) * 0.7 * (1 - p) : 0;
          const dy =
            variant === 29
              ? (noise(seed + col + 9, row) - 0.5) * 0.8 * (1 - p)
              : 0;
          if (active)
            ctx.fillRect(
              ((col - 2.5) * d + dx) * size,
              ((row - 4) * 0.13 + dy) * size,
              d * size - 1,
              0.13 * size - 1,
            );
        }
      ctx.restore();
    }
    if (variant === 26) {
      ctx.save();
      ctx.strokeStyle = accent;
      ctx.lineWidth = 0.018 * size;
      ctx.globalAlpha *= 0.6;
      ctx.strokeRect(-width * 0.5, -0.54 * size, width, 1.08 * size);
      ctx.restore();
    }
    return;
  }
  if ([10, 11, 12].includes(variant)) {
    glyph(frame, digit);
    const shift = (noise(seed, phase) - 0.5) * q * 0.35;
    if (variant === 12) {
      glyph(frame, digit, { color: "#ff416b", x: -q * 0.09, alpha: 0.66 * q });
      glyph(frame, digit, { color: "#04b7ff", x: q * 0.09, alpha: 0.7 * q });
    } else {
      const ratio = width / size;
      for (let i = 0; i < 4; i++)
        rectangle(frame, -ratio, -0.46 + i * 0.24, ratio * 2, 0.1, () => {
          glyph(frame, variant === 10 ? digit : to, {
            color: accent,
            alpha: 0.75 * q,
            x: shift * (i % 2 ? 1 : -1),
          });
        });
    }
    return;
  }
  if (variant === 28 || variant === 16) {
    tracePath(frame, digitPath(toIndex), smooth(p), {
      color: accent,
      alpha: 0.8 * q,
      width: variant === 28 ? 0.023 : 0.036,
    });
  }
  const charge = variant === 17 ? p : variant === 18 ? 1 - p : q;
  glyph(frame, from, { alpha: (1 - p) ** 3 });
  glyph(frame, to, {
    alpha: 0.4 + 0.6 * p,
    color: variant === 4 ? accent : color,
    glow: (variant === 4 ? 0.18 : 0.28 * charge) * strength,
  });
  if ([15, 17, 18, 27].includes(variant)) {
    ctx.save();
    ctx.strokeStyle = accent;
    ctx.globalAlpha *= 0.65 * q;
    ctx.lineWidth = 0.021 * size;
    ctx.beginPath();
    ctx.ellipse(
      0,
      0,
      (0.25 + 0.23 * charge) * size,
      (0.37 + 0.25 * charge) * size,
      0,
      0,
      Math.PI * 2 * (variant === 27 ? 1 : charge),
    );
    ctx.stroke();
    ctx.restore();
  }
}

export const persistentDisplay = (variant: number) =>
  [0, 1, 2, 3, 4, 14, 26].includes(variant);
