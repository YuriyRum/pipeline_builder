/**
 * CSV / XLSX PARSER NODE
 * ───────────────────────
 * Parses CSV and XLSX entirely in the browser using the SheetJS (xlsx) library.
 * No backend required. Receives raw file content from FileUploadNode.
 *
 * CSV  → read as UTF-8 text, parse with SheetJS sheet_to_json
 * XLSX → read as ArrayBuffer, parse with SheetJS read()
 *
 * Output: { rows: object[], columns: string[], totalRows: number, fileName: string }
 */
import * as XLSX from 'xlsx'

const delay = ms => new Promise(r => setTimeout(r, ms))

/* ── helpers ───────────────────────────────────────────────── */

function parseWithSheetJs(raw, fileType, opts = {}) {
  const { header, delim } = opts

  let workbook
  if (fileType === 'csv') {
    // SheetJS can parse CSV text directly
    const csvOpts = {}
    if (delim && delim !== 'Auto') csvOpts.FS = delim === '\\t' ? '\t' : delim
    workbook = XLSX.read(raw, { type: 'string', ...csvOpts })
  } else {
    // XLSX / XLS — raw is an ArrayBuffer
    workbook = XLSX.read(new Uint8Array(raw), { type: 'array' })
  }

  const sheetName = workbook.SheetNames[0]
  const sheet     = workbook.Sheets[sheetName]

  const rows = XLSX.utils.sheet_to_json(sheet, {
    header: header ? undefined : 1,   // undefined = use first row as keys
    defval: '',
    raw:    false,   // format dates/numbers as strings for safety
  })

  // Derive columns from first row
  const columns = rows.length > 0 ? Object.keys(rows[0]) : []
  return { rows, columns }
}

/* ── definition ────────────────────────────────────────────── */
const CsvParserNode = {
  id:     'csv-parser',
  title:  'CSV / XLSX Parser',
  icon:   '📊',
  iconBg: '#1a2030',
  group:  'processing',

  defaultControls: [
    { type: 'select',   label: 'Delimiter',   key: 'delim',  val: 'Auto', opts: ['Auto', ',', ';', '\\t'] },
    { type: 'toggle',   label: 'Header row',  key: 'header', val: true },
    { type: 'checkbox', label: 'Trim spaces', key: 'trim',   val: true },
    { type: 'select',   label: 'Sheet',       key: 'sheet',  val: 'First', opts: ['First'] },
  ],

  async run(nodeData, ctx) {
    const input = ctx.input
    if (!input) return { ok: false, message: 'No file input from upstream' }

    const { fileName, fileType, raw } = input

    if (!raw) return { ok: false, message: 'File content is empty' }

    const header = nodeData.controls.find(c => c.key === 'header')?.val ?? true
    const delim  = nodeData.controls.find(c => c.key === 'delim')?.val  ?? 'Auto'
    const trim   = nodeData.controls.find(c => c.key === 'trim')?.val   ?? true

    ctx.log(`Parsing ${fileName} in browser…`)
    await delay(50)  // yield to let UI update
    if (ctx.signal.aborted) return { ok: false, message: 'aborted' }

    let rows, columns
    try {
      const parsed = parseWithSheetJs(raw, fileType, { header, delim })
      rows    = parsed.rows
      columns = parsed.columns
    } catch (err) {
      return { ok: false, message: `Parse error: ${err.message}` }
    }

    if (ctx.signal.aborted) return { ok: false, message: 'aborted' }

    // Trim string values if requested
    if (trim) {
      rows = rows.map(row =>
        Object.fromEntries(
          Object.entries(row).map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v])
        )
      )
    }

    ctx.log(`Parsed ${rows.length.toLocaleString()} rows, ${columns.length} columns`)

    return {
      ok: true,
      message: `${rows.length.toLocaleString()} rows · ${columns.length} cols`,
      output: { rows, columns, totalRows: rows.length, fileName },
    }
  },
}

export default CsvParserNode
