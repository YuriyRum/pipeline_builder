/**
 * TABLE VIEW NODE
 * ────────────────
 * Renders the parsed/transformed dataset as a compact scrollable table
 * directly inside the node card. Also provides a "Download CSV" button.
 *
 * Uses a custom renderBody to show the live data after the pipeline runs.
 * Input: { rows, columns, totalRows, fileName }
 */

const delay = ms => new Promise(r => setTimeout(r, ms))

/* ── helpers ───────────────────────────────────────────────── */
function toCsv(rows, columns) {
  const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`
  return [
    columns.join(','),
    ...rows.map(r => columns.map(c => esc(r[c])).join(',')),
  ].join('\n')
}

function downloadCsv(rows, columns, name) {
  const blob = new Blob([toCsv(rows, columns)], { type: 'text/csv' })
  const url  = URL.createObjectURL(blob)
  const a    = Object.assign(document.createElement('a'), {
    href: url,
    download: (name || 'output').replace(/\.[^.]+$/, '') + '_output.csv',
  })
  a.click()
  URL.revokeObjectURL(url)
}

/* ── custom body ───────────────────────────────────────────── */
function TableBody(nodeData) {
  const tableData = nodeData._tableData   // { rows, columns, fileName }
  const rows      = tableData?.rows    ?? []
  const columns   = tableData?.columns ?? []
  const preview   = rows.slice(0, 6)

  if (!tableData) {
    return (
      <div style={{
        padding: '14px 0', textAlign: 'center',
        color: 'var(--muted)', fontSize: 12,
      }}>
        Run the pipeline to see data here
      </div>
    )
  }

  return (
    <div>
      {/* Stats row */}
      <div style={{
        display: 'flex', gap: 12, marginBottom: 6,
        fontSize: 11, color: 'var(--muted)',
      }}>
        <span style={{ color: 'var(--green)', fontFamily: 'var(--font-mono)', fontWeight: 500 }}>
          {rows.length.toLocaleString()} rows
        </span>
        <span>{columns.length} cols</span>
        {tableData.fileName && <span style={{ marginLeft: 'auto', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 100 }}>
          {tableData.fileName}
        </span>}
      </div>

      {/* Table */}
      <div style={{
        overflowX: 'auto', overflowY: 'auto', maxHeight: 180,
        border: '1px solid var(--border)', borderRadius: 6,
        fontSize: 11,
      }}>
        <table style={{ borderCollapse: 'collapse', minWidth: '100%', width: 'max-content' }}>
          <thead>
            <tr>
              {columns.map(c => (
                <th key={c} style={{
                  padding: '4px 8px', textAlign: 'left',
                  background: 'var(--surface2)',
                  borderBottom: '1px solid var(--border)',
                  color: 'var(--muted)', fontWeight: 500,
                  whiteSpace: 'nowrap', position: 'sticky', top: 0,
                  fontFamily: 'var(--font-mono)', fontSize: 10,
                }}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {preview.map((row, i) => (
              <tr key={i}>
                {columns.map(c => (
                  <td key={c} style={{
                    padding: '3px 8px',
                    borderBottom: i < preview.length - 1 ? '1px solid var(--border)' : 'none',
                    color: typeof row[c] === 'number' ? 'var(--green2)' : 'var(--text)',
                    whiteSpace: 'nowrap', maxWidth: 120,
                    overflow: 'hidden', textOverflow: 'ellipsis',
                    fontFamily: typeof row[c] === 'number' ? 'var(--font-mono)' : 'inherit',
                  }}>{String(row[c] ?? '')}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Truncation hint */}
      {rows.length > preview.length && (
        <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 3, textAlign: 'right' }}>
          showing {preview.length} of {rows.length.toLocaleString()} rows
        </div>
      )}

      {/* Download */}
      <button
        onClick={() => downloadCsv(rows, columns, tableData.fileName)}
        style={{
          marginTop: 8, width: '100%',
          padding: '5px 0', borderRadius: 5,
          background: 'var(--surface2)', border: '1px solid var(--border2)',
          color: 'var(--text)', fontSize: 11, cursor: 'pointer',
          fontFamily: 'var(--font-ui)',
        }}
      >↓ Download CSV ({rows.length.toLocaleString()} rows)</button>
    </div>
  )
}

/* ── definition ────────────────────────────────────────────── */
const TableViewNode = {
  id:     'table-view',
  title:  'Table View',
  icon:   '📋',
  iconBg: '#1e2516',
  group:  'output',
  doc: `Renders the final dataset as a scrollable table inside the node card.
After running, click the result button in the header to open a full paginated DataTable dialog.

## Features
- Inline preview of the first 6 rows.
- Download button exports the full dataset as CSV.
- Numeric values are highlighted for quick scanning.`,
  inputType:  'dataset',
  outputType: 'display',
  resultType: 'table',


  defaultControls: [],

  renderBody: TableBody,

  async run(nodeData, ctx) {
    const input = ctx.input
    if (!input?.rows) return { ok: false, message: 'No dataset from upstream' }

    ctx.log(`Rendering ${input.rows.length} rows into table…`)
    await delay(200)

    // Store the data so the custom body can render it
    ctx.setNodeData({ _tableData: {
      rows:     input.rows,
      columns:  input.columns,
      fileName: input.fileName,
    }})

    ctx.log('Table ready ✓')
    return {
      ok: true,
      message: `${input.rows.length} rows displayed`,
      output: input,
    }
  },
}

export default TableViewNode
