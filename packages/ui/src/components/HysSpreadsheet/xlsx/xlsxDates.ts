import type { HysSpreadsheetCellType } from "../spreadsheetTypes";

const day = 86_400_000;
const epoch = Date.UTC(1899, 11, 31);
const epoch1904 = Date.UTC(1904, 0, 1);

export function serialToDate(
  serial: number,
  kind: "date" | "time" | "datetime-local",
  date1904: boolean,
) {
  if (kind === "time") {
    const ms = Math.round((((serial % 1) + 1) % 1) * day) % day;
    return new Date(ms).toISOString().slice(11, 19);
  }
  const leap = !date1904 && Math.floor(serial) === 60;
  const time = new Date(
    (date1904 ? epoch1904 : epoch) +
      Math.round((serial - (!date1904 && serial >= 60 ? 1 : 0)) * day),
  );
  if (!Number.isFinite(time.getTime())) return undefined;
  const iso = time.toISOString();
  const date = leap ? "1900-02-29" : iso.slice(0, 10);
  return kind === "date" ? date : date + iso.slice(10, 19);
}

export function dateToSerial(
  value: string,
  kind?: HysSpreadsheetCellType,
): number | undefined {
  if (kind === "time") {
    const parsed = /^(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/.exec(value);
    if (!parsed) return undefined;
    const [, hours, minutes, seconds = "0", ms = ""] = parsed;
    if (+hours > 23 || +minutes > 59 || +seconds > 59) return undefined;
    return (
      ((+hours * 60 * 60 + +minutes * 60 + +seconds) * 1000 +
        Number(ms.padEnd(3, "0"))) /
      day
    );
  }
  if (kind !== "date" && kind !== "datetime-local") return undefined;
  if (!/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?)?$/.test(value))
    return undefined;
  if (value.startsWith("1900-02-29"))
    return 60 + (dateToSerial(value.slice(11), "time") ?? 0);
  const ms = Date.parse(value.length === 10 ? value : value + "Z");
  if (
    !Number.isFinite(ms) ||
    new Date(ms).toISOString().slice(0, 10) !== value.slice(0, 10)
  )
    return undefined;
  const serial = (ms - epoch) / day;
  return serial >= 60 ? serial + 1 : serial;
}
