/**
 * Minimal client-side CSV export. No dependency, no server round-trip — the
 * rows handed in are already the real data the user is looking at.
 */

/** A value that has an unambiguous single-cell text form. */
export type CsvCell = string | number | boolean | null | undefined;

/** RFC-4180 quoting: wrap in quotes and double any embedded quote. */
function escapeCell(value: CsvCell): string {
  if (value === null || value === undefined) return '';
  const s = String(value);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Joins rows of cells into a CSV document with CRLF line endings. */
export function toCsv(rows: CsvCell[][]): string {
  return rows.map((row) => row.map(escapeCell).join(',')).join('\r\n');
}

/**
 * Triggers a browser download of `content` as `filename`. The leading
 * byte-order mark makes Excel read the file as UTF-8 rather than the local
 * ANSI codepage.
 */
export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob(['\uFEFF' + content], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Revoking immediately can race the download in some browsers.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
