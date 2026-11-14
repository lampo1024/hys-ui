export const maxClipboardCharacters = 1_000_000;

export function writeTsv(rows: readonly (readonly string[])[]) {
  return rows
    .map((row) =>
      row
        .map((value) =>
          /["\t\r\n]/.test(value) || (row.length === 1 && !value)
            ? `"${value.replaceAll('"', '""')}"`
            : value,
        )
        .join("\t"),
    )
    .join("\r\n");
}

export function readTsv(text: string, maxCells: number): string[][] {
  if (text.length > maxClipboardCharacters) throw new Error("limit");
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  let closedQuote = false;
  let count = 0;
  const pushField = () => {
    if (++count > maxCells) throw new Error("limit");
    row.push(field);
    field = "";
    closedQuote = false;
  };
  for (let index = 0; index < text.length; index++) {
    const char = text[index];
    if (quoted) {
      if (char !== '"') field += char;
      else if (text[index + 1] === '"') {
        field += char;
        index++;
      } else {
        quoted = false;
        closedQuote = true;
      }
    } else if (char === "\t") pushField();
    else if (char === "\r" || char === "\n") {
      if (char === "\r" && text[index + 1] === "\n") index++;
      pushField();
      rows.push(row);
      row = [];
    } else if (closedQuote) throw new Error("shape");
    else if (char === '"' && field === "") quoted = true;
    else field += char;
  }
  if (quoted) throw new Error("shape");
  if (row.length || !rows.length || !/[\r\n]$/.test(text)) {
    pushField();
    rows.push(row);
  }
  if (rows.some((line) => line.length !== rows[0].length))
    throw new Error("shape");
  return rows;
}
