import * as XLSX from "xlsx";

export type ParsedRow = Record<string, string>;

export type GuestField = "full_name" | "group_name" | null;

export const FIELD_LABELS: Record<Exclude<GuestField, null>, string> = {
  full_name: "Guest name",
  group_name: "Guest group",
};

export async function parseFile(file: File): Promise<{ headers: string[]; rows: ParsedRow[] }> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const first = wb.SheetNames[0];
  if (!first) return { headers: [], rows: [] };
  const sheet = wb.Sheets[first];
  const rows: any[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    blankrows: false,
    defval: "",
  });
  if (rows.length === 0) return { headers: [], rows: [] };
  const headers = rows[0].map(
    (h: any) => String(h ?? "").trim() || `Column ${rows[0].indexOf(h) + 1}`,
  );
  const out: ParsedRow[] = rows.slice(1).map((r) => {
    const obj: ParsedRow = {};
    headers.forEach((h, i) => {
      obj[h] = String(r[i] ?? "").trim();
    });
    return obj;
  });
  return { headers, rows: out.filter((r) => Object.values(r).some((v) => v)) };
}

export function parsePastedTable(text: string): { headers: string[]; rows: ParsedRow[] } {
  const trimmed = text.trim();
  if (!trimmed) return { headers: [], rows: [] };
  const lines = trimmed.split(/\r?\n/);
  const delim = lines[0].includes("\t") ? "\t" : ",";
  const split = (line: string) => {
    if (delim === "\t") return line.split("\t");
    // very simple CSV split (handles quotes)
    const out: string[] = [];
    let cur = "";
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inQ && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else inQ = !inQ;
      } else if (c === "," && !inQ) {
        out.push(cur);
        cur = "";
      } else cur += c;
    }
    out.push(cur);
    return out;
  };
  const headers = split(lines[0]).map((h) => h.trim() || "Column");
  const rows: ParsedRow[] = lines
    .slice(1)
    .map((line) => {
      const cells = split(line);
      const obj: ParsedRow = {};
      headers.forEach((h, i) => {
        obj[h] = (cells[i] ?? "").trim();
      });
      return obj;
    })
    .filter((r) => Object.values(r).some((v) => v));
  return { headers, rows };
}

export function autoMap(headers: string[]): Record<string, GuestField> {
  const map: Record<string, GuestField> = {};
  for (const h of headers) {
    const l = h.toLowerCase();
    if (!map[h]) {
      if (/name|nama|guest/.test(l) && !/group|kumpulan/.test(l)) map[h] = "full_name";
      else if (/group|kumpulan|category|table/.test(l)) map[h] = "group_name";
      else map[h] = null;
    }
  }
  return map;
}
