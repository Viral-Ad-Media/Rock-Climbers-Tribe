/**
 * Minimal parser for phpMyAdmin / mysqldump exports.
 * Extracts the rows of selected tables from `INSERT INTO ... VALUES (...)` statements
 * without needing a MySQL server.
 */

export type Row = Record<string, string | null>;

const ESCAPES: Record<string, string> = {
  n: "\n",
  r: "\r",
  t: "\t",
  "0": "\0",
  Z: "\x1a",
  b: "\b",
};

function skipWs(s: string, i: number) {
  while (i < s.length && /\s/.test(s[i])) i++;
  return i;
}

/** Parses the tuple list that follows `VALUES`, returning rows and the index after the closing `;`. */
function parseValues(s: string, start: number): { rows: (string | null)[][]; end: number } {
  const rows: (string | null)[][] = [];
  let i = start;
  for (;;) {
    while (i < s.length && (s[i] === "," || /\s/.test(s[i]))) i++;
    if (s[i] === ";") return { rows, end: i + 1 };
    if (s[i] !== "(") throw new Error(`Unexpected "${s.slice(i, i + 40)}" at ${i}`);
    i++;
    const row: (string | null)[] = [];
    for (;;) {
      i = skipWs(s, i);
      if (s[i] === "'") {
        i++;
        let buf = "";
        let chunkStart = i;
        for (;;) {
          const c = s[i];
          if (c === "\\") {
            buf += s.slice(chunkStart, i);
            const n = s[i + 1];
            buf += ESCAPES[n] ?? n;
            i += 2;
            chunkStart = i;
          } else if (c === "'") {
            if (s[i + 1] === "'") {
              buf += s.slice(chunkStart, i) + "'";
              i += 2;
              chunkStart = i;
            } else {
              buf += s.slice(chunkStart, i);
              i++;
              break;
            }
          } else {
            i++;
          }
        }
        row.push(buf);
      } else {
        let j = i;
        while (s[j] !== "," && s[j] !== ")") j++;
        const raw = s.slice(i, j).trim();
        row.push(raw === "NULL" ? null : raw);
        i = j;
      }
      i = skipWs(s, i);
      if (s[i] === ",") {
        i++;
        continue;
      }
      if (s[i] === ")") {
        i++;
        break;
      }
      throw new Error(`Unexpected "${s.slice(i, i + 40)}" at ${i}`);
    }
    rows.push(row);
  }
}

/** Returns the rows of each requested table, keyed by table name. */
export function readTables(sql: string, tables: string[]): Record<string, Row[]> {
  const out: Record<string, Row[]> = Object.fromEntries(tables.map((t) => [t, []]));
  const re = /INSERT INTO `([^`]+)` \(([^)]*)\) VALUES\s*/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(sql))) {
    const table = m[1];
    if (!(table in out)) continue;
    const cols = m[2].split(",").map((c) => c.trim().replace(/`/g, ""));
    const { rows, end } = parseValues(sql, re.lastIndex);
    for (const r of rows) {
      out[table].push(Object.fromEntries(cols.map((c, idx) => [c, r[idx] ?? null])));
    }
    re.lastIndex = end;
  }
  return out;
}

/** Finds the WordPress table prefix (e.g. "wp_" or "03_") from the dump. */
export function detectPrefix(sql: string): string {
  const m = /CREATE TABLE `([^`]*?)posts`/.exec(sql);
  if (!m) throw new Error("Could not find a WordPress posts table in this dump.");
  return m[1];
}
