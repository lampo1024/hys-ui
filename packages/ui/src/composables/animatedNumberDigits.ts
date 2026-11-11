import type { HysNumberEffect } from "./animatedNumber";
import type { NumberPresentation } from "./animatedNumberFormat";

export const digitEffects: readonly HysNumberEffect[] = [
  "odometer",
  "wheel",
  "flip",
  "slot",
  "random",
  "appear",
  "disappear",
];

type DigitSection = "integer" | "fraction";

export interface DigitToken {
  key: string;
  text: string;
  type: Intl.NumberFormatPartTypes;
  position: number;
  section?: DigitSection;
}

export function numberTokens(
  parts: Intl.NumberFormatPart[],
  split: boolean,
): DigitToken[] {
  let integer = parts
    .filter(({ type }) => type === "integer")
    .reduce((total, part) => total + [...part.value].length, 0);
  let fraction = 0;
  return parts.flatMap(({ type, value }, index) => {
    if (!split || (type !== "integer" && type !== "fraction"))
      return [{ key: `${type}-${index}`, text: value, type, position: 0 }];
    return [...value].map((text) => {
      const position = type === "integer" ? --integer : ++fraction;
      return {
        key: `${type}-digit-${position}`,
        text,
        type,
        position,
        section: type,
      };
    });
  });
}

function digitBounds(value: NumberPresentation, glyphs: string[]) {
  const parts = { integer: "", fraction: "" };
  for (const part of value.parts) {
    if (part.type === "integer" || part.type === "fraction") {
      parts[part.type] += [...part.value]
        .map((digit) => Math.max(0, glyphs.indexOf(digit)))
        .join("");
    }
  }
  return parts;
}

export function createDigitTracks(
  start: NumberPresentation,
  end: NumberPresentation,
  glyphs: string[],
) {
  const from = digitBounds(start, glyphs),
    to = digitBounds(end, glyphs);
  const scale = Math.max(from.fraction.length, to.fraction.length);
  const units = (parts: typeof from) =>
    BigInt(parts.integer + parts.fraction.padEnd(scale, "0"));
  const fromUnits = units(from),
    toUnits = units(to);
  const compatible =
    start.unit === end.unit &&
    start.parts.find(({ type }) => type === "exponentInteger")?.value ===
      end.parts.find(({ type }) => type === "exponentInteger")?.value;
  return (token: DigitToken) => {
    const places =
      token.section === "integer"
        ? scale + token.position
        : scale - token.position;
    const base = 10n ** BigInt(Math.max(0, places));
    const first = fromUnits / base,
      last = toUnits / base;
    const difference = last - first;
    const offset = Number(first % 10n),
      destination = Number(last % 10n);
    const signedSteps =
      difference > 40n
        ? 30 + Number(difference % 10n)
        : difference < -40n
          ? -30 + Number(difference % 10n)
          : Number(difference);
    return {
      offset,
      destination,
      steps: compatible ? signedSteps : destination - offset,
    };
  };
}

const digitIndex = (value: number) => ((value % 10) + 10) % 10;

export function digitMotion(
  effect: HysNumberEffect,
  track: { offset: number; destination: number; steps: number },
  progress: number,
  index: number,
  glyphs: string[],
) {
  const { offset, destination, steps } = track;
  if (effect === "odometer" || effect === "wheel" || effect === "slot") {
    const direction = steps < 0 ? -1 : 1;
    const direct = (destination - offset + 10 * direction) % 10;
    const distance =
      effect === "slot"
        ? 20 * direction + direct
        : effect === "wheel"
          ? direct
          : steps;
    const travelled = Math.abs(distance) * progress;
    const step = Math.floor(travelled);
    const current = offset + step * direction;
    return {
      first: glyphs[digitIndex(current)],
      second: glyphs[digitIndex(current + direction)],
      phase: travelled - step,
      direction,
      changed: distance !== 0,
    };
  }
  const bucket = Math.floor(progress * 37);
  const first =
    effect === "random" && bucket > 0
      ? (bucket * 7 + index * 3 + bucket * bucket) % 10
      : offset;
  return {
    first: glyphs[first],
    second: glyphs[destination],
    phase: effect === "random" && progress < 0.87 ? 0 : progress,
    direction: steps < 0 ? -1 : 1,
    changed: offset !== destination || effect === "random",
  };
}
