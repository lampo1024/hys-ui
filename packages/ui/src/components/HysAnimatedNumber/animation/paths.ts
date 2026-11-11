import { clamp, mix, type PaintFrame } from "./paint";

type Point = [x: number, y: number];
const paths: readonly Point[][] = [
  [
    [0, -0.39],
    [0.18, -0.35],
    [0.25, -0.18],
    [0.25, 0.2],
    [0.16, 0.38],
    [0, 0.42],
    [-0.18, 0.36],
    [-0.25, 0.17],
    [-0.25, -0.19],
    [-0.16, -0.35],
    [0, -0.39],
  ],
  [
    [-0.17, -0.25],
    [0.04, -0.39],
    [0.04, 0.39],
    [-0.19, 0.39],
    [0.23, 0.39],
  ],
  [
    [-0.22, -0.24],
    [-0.14, -0.36],
    [0.04, -0.39],
    [0.22, -0.3],
    [0.23, -0.16],
    [0.12, -0.01],
    [-0.22, 0.33],
    [-0.23, 0.39],
    [0.24, 0.39],
  ],
  [
    [-0.22, -0.33],
    [0.06, -0.39],
    [0.23, -0.29],
    [0.22, -0.15],
    [0.05, -0.02],
    [-0.05, 0],
    [0.17, 0.03],
    [0.25, 0.16],
    [0.22, 0.32],
    [0.05, 0.41],
    [-0.18, 0.36],
    [-0.25, 0.27],
  ],
  [
    [0.16, 0.41],
    [0.16, -0.39],
    [-0.26, 0.15],
    [0.27, 0.15],
  ],
  [
    [0.23, -0.39],
    [-0.2, -0.39],
    [-0.22, -0.02],
    [0.04, -0.06],
    [0.21, 0.03],
    [0.25, 0.2],
    [0.19, 0.36],
    [0, 0.42],
    [-0.2, 0.34],
    [-0.24, 0.23],
  ],
  [
    [0.21, -0.37],
    [0.01, -0.4],
    [-0.17, -0.25],
    [-0.24, -0.02],
    [-0.24, 0.24],
    [-0.13, 0.38],
    [0.04, 0.42],
    [0.21, 0.32],
    [0.24, 0.16],
    [0.16, 0.01],
    [-0.02, -0.05],
    [-0.23, 0.05],
  ],
  [
    [-0.25, -0.39],
    [0.25, -0.39],
    [0.09, -0.14],
    [-0.03, 0.12],
    [-0.11, 0.41],
  ],
  [
    [0, -0.02],
    [-0.21, -0.16],
    [-0.21, -0.29],
    [-0.06, -0.39],
    [0.12, -0.37],
    [0.23, -0.24],
    [0.16, -0.1],
    [0, -0.02],
    [-0.2, 0.09],
    [-0.25, 0.26],
    [-0.12, 0.39],
    [0.1, 0.4],
    [0.24, 0.29],
    [0.24, 0.13],
    [0, -0.02],
  ],
  [
    [0.24, -0.06],
    [0.13, 0.05],
    [-0.06, 0.05],
    [-0.22, -0.04],
    [-0.24, -0.22],
    [-0.15, -0.36],
    [0.04, -0.4],
    [0.2, -0.31],
    [0.24, -0.13],
    [0.22, 0.15],
    [0.11, 0.35],
    [-0.08, 0.42],
    [-0.2, 0.34],
  ],
];

function sample(path: Point[]) {
  const lengths = [0];
  for (let i = 1; i < path.length; i++)
    lengths.push(
      lengths[i - 1] +
        Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]),
    );
  let index = 1;
  return Array.from({ length: 35 }, (_, point): Point => {
    const distance = (lengths[lengths.length - 1] * point) / 34;
    while (distance > lengths[index] && index < path.length - 1) index++;
    const t =
      (distance - lengths[index - 1]) / (lengths[index] - lengths[index - 1]);
    return [
      mix(path[index - 1][0], path[index][0], t),
      mix(path[index - 1][1], path[index][1], t),
    ];
  });
}
const samples = paths.map(sample);

export function digitPath(index: number) {
  return samples[index] ?? samples[0];
}

export function tracePath(
  frame: PaintFrame,
  points: readonly Point[],
  progress = 1,
  options: {
    color?: string;
    width?: number;
    alpha?: number;
    smooth?: boolean;
    close?: boolean;
    fill?: boolean;
  } = {},
) {
  if (progress <= 0) return;
  const { ctx, size, color } = frame;
  const count = Math.min(
    points.length,
    Math.ceil(clamp(progress) * (points.length - 1)) + 1,
  );
  ctx.save();
  ctx.strokeStyle = ctx.fillStyle = options.color ?? color;
  ctx.lineWidth = (options.width ?? 0.11) * size;
  ctx.lineCap = ctx.lineJoin = "round";
  ctx.globalAlpha *= options.alpha ?? 1;
  ctx.beginPath();
  ctx.moveTo(points[0][0] * size, points[0][1] * size);
  for (let i = 1; i < count; i++) {
    const [x, y] = points[i];
    if (options.smooth && i + 1 < count) {
      const next = points[i + 1];
      ctx.quadraticCurveTo(
        x * size,
        y * size,
        ((x + next[0]) * size) / 2,
        ((y + next[1]) * size) / 2,
      );
    } else ctx.lineTo(x * size, y * size);
  }
  if (options.close) ctx.closePath();
  if (options.fill) ctx.fill();
  else ctx.stroke();
  ctx.restore();
}
