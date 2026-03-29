/**
 * RFC 4180 CSV parser. Returns a 2D array of strings (rows × cells).
 * Handles quoted fields, embedded commas, and escaped double-quotes.
 */
export function parseCSV(text) {
  const rows = []
  let row = []
  let cell = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    const next = text[i + 1]

    if (inQuotes) {
      if (ch === '"' && next === '"') { cell += '"'; i++ }
      else if (ch === '"') { inQuotes = false }
      else { cell += ch }
    } else {
      if (ch === '"') { inQuotes = true }
      else if (ch === ',') { row.push(cell); cell = '' }
      else if (ch === '\n' || (ch === '\r' && next === '\n')) {
        if (ch === '\r') i++
        row.push(cell); cell = ''
        if (row.some((c) => c !== '')) rows.push(row)
        row = []
      } else { cell += ch }
    }
  }

  row.push(cell)
  if (row.some((c) => c !== '')) rows.push(row)
  return rows
}
