import type { HysNumberEffect } from "./animatedNumber";
import type { NumberPresentation } from "./animatedNumberFormat";

export const digitEffects: readonly HysNumberEffect[] = [
  "odometer",
  "wheel",
  "flip",
  "slot",
  "random",
  "scramble",
  "appear",
  "disappear",
];

type DigitSection = "integer" | "fraction";
export function digitCount(parts: Intl.NumberFormatPart[]) {
  return parts.reduce(
    (sum, { type, value }) =>
      sum + (type === "integer" || type === "fraction" ? [...value].length : 0),
    0,
  );
}

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
      carry:
        compatible &&
        base > 1n &&
        difference !== 0n &&
        difference >= -40n &&
        difference <= 40n
          ? {
              start: Number(((fromUnits % base) * 1000000n) / base) / 1000000,
              end: Number(((toUnits % base) * 1000000n) / base) / 1000000,
            }
          : undefined,
      fromPresent:
        (token.position < from.integer.length && token.section === "integer") ||
        (token.position <= from.fraction.length &&
          token.section === "fraction"),
      toPresent:
        (token.position < to.integer.length && token.section === "integer") ||
        (token.position <= to.fraction.length && token.section === "fraction"),
    };
  };
}

const digitIndex = (value: number) => ((value % 10) + 10) % 10;

export function digitMotion(
  effect: HysNumberEffect,
  track: ReturnType<ReturnType<typeof createDigitTracks>>,
  progress: number,
  index: number,
  glyphs: string[],
) {
  const { offset, destination, steps } = track;
  const direction = steps < 0 ? -1 : 1;
  const random = (step: number) =>
    (Math.imul(step + 23, 2246822519) ^ Math.imul(index + 17, 3266489917)) >>>
    0;
  if (effect === "scramble") {
    const travelled = progress * 24;
    const step = Math.floor(travelled);
    return {
      first: glyphs[step === 0 ? offset : random(step) % 10],
      second: glyphs[step >= 23 ? destination : random(step + 1) % 10],
      phase: travelled - step,
      direction,
      changed: true,
    };
  }
  if (effect === "odometer" && track.carry) {
    const { start, end } = track.carry;
    const value = start + (steps + end - start) * progress;
    const whole = Math.floor(value);
    const edge = Math.max(
      0.9,
      whole === 0 ? start : 0,
      whole === steps ? end : 0,
    );
    return {
      first: glyphs[digitIndex(offset + whole)],
      second: glyphs[digitIndex(offset + whole + 1)],
      phase: Math.max(0, (value - whole - edge) / (1 - edge)),
      direction: 1,
      changed: true,
    };
  }
  if (effect === "odometer" || effect === "wheel" || effect === "slot") {
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
  const bucket = Math.floor(Math.min(progress, 0.87) * 37);
  const first =
    effect === "random" && bucket > 0 ? random(bucket) % 10 : offset;
  const reveals = effect === "appear" || effect === "disappear";
  return {
    first: reveals && !track.fromPresent ? "" : glyphs[first],
    second: reveals && !track.toPresent ? "" : glyphs[destination],
    phase:
      effect === "random" ? Math.max(0, (progress - 0.87) / 0.13) : progress,
    direction,
    changed:
      offset !== destination ||
      effect === "random" ||
      (reveals && track.fromPresent !== track.toPresent),
  };
}
