/**
 * NodeResultDialog — zero-dependency result viewer modal.
 * Shows node run output as: table | log | stats | json
 * Uses createPortal so it renders above everything including ReactFlow.
 */
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

/* ── helpers ──────────────────────────────────────────────── */
function toCsv(rows, cols) {
  const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`
  return [cols.join(','), ...rows.map(r => cols.map(c => esc(r[c])).join(','))].join('\n')
}
function downloadCsv(rows, cols, name = 'output') {
  const blob = new Blob([toCsv(rows, cols)], { type: 'text/csv' })
  const url  = URL.createObjectURL(blob)
  Object.assign(document.createElement('a'), { href: url, download: `${name}.csv` }).click()
  URL.revokeObjectURL(url)
}

/* ── Table viewer ──────────────────────────────────────────── */
function TableViewer({ output }) {
  const rows = output?.rows ?? []
  const cols = output?.columns ?? (rows.length ? Object.keys(rows[0]) : [])
  const [page, setPage]       = useState(0)
  const [sortCol, setSortCol] = useState(null)
  const [sortDir, setSortDir] = useState(1)
  const PAGE = 20

  const sorted = sortCol
    ? [...rows].sort((a, b) => {
        const av = a[sortCol], bv = b[sortCol]
        if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * sortDir
        return String(av).localeCompare(String(bv)) * sortDir
      })
    : rows

  const total = sorted.length
  const pages = Math.ceil(total / PAGE)
  const slice = sorted.slice(page * PAGE, (page + 1) * PAGE)

  const toggleSort = col => {
    if (sortCol === col) setSortDir(d => -d)
    else { setSortCol(col); setSortDir(1) }
    setPage(0)
  }

  if (!rows.length) return (
    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>No rows in result</div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>
          {total.toLocaleString()} rows · {cols.length} cols
        </span>
        <div style={{ flex: 1 }} />
        <button
          onClick={() => downloadCsv(rows, cols, output?.fileName ?? 'result')}
          style={{
            padding: '4px 12px', borderRadius: 5,
            background: 'var(--magenta-subtle)',
            border: '1px solid var(--magenta)',
            color: 'var(--magenta-light)', fontSize: 11,
            cursor: 'pointer', fontFamily: 'var(--font-ui)',
          }}
        >↓ Download CSV</button>
      </div>

      {/* table */}
      <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 6 }}>
        <table style={{ width: 'max-content', minWidth: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr>
              {cols.map(col => (
                <th
                  key={col}
                  onClick={() => toggleSort(col)}
                  style={{
                    padding: '6px 10px', textAlign: 'left', cursor: 'pointer',
                    background: sortCol === col ? 'var(--magenta-subtle)' : 'var(--surface2)',
                    borderBottom: '1px solid var(--border)',
                    color: sortCol === col ? 'var(--magenta-light)' : 'var(--muted)',
                    fontWeight: 600, fontSize: 10, textTransform: 'uppercase',
                    letterSpacing: '0.05em', whiteSpace: 'nowrap',
                    userSelect: 'none',
                  }}
                >
                  {col}
                  {sortCol === col && <span style={{ marginLeft: 4 }}>{sortDir > 0 ? '↑' : '↓'}</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slice.map((row, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? 'var(--surface)' : 'var(--surface2)' }}>
                {cols.map(col => (
                  <td key={col} style={{
                    padding: '4px 10px',
                    borderBottom: '1px solid var(--border)',
                    color: typeof row[col] === 'number' ? 'var(--magenta-light)' : 'var(--text)',
                    fontFamily: typeof row[col] === 'number' ? 'var(--font-mono)' : 'inherit',
                    fontSize: 12, whiteSpace: 'nowrap',
                    maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>{String(row[col] ?? '')}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* pagination */}
      {pages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
          <PagBtn onClick={() => setPage(0)} disabled={page === 0}>«</PagBtn>
          <PagBtn onClick={() => setPage(p => p - 1)} disabled={page === 0}>‹</PagBtn>
          <span style={{ fontSize: 12, color: 'var(--muted)', padding: '0 8px' }}>
            {page + 1} / {pages}
          </span>
          <PagBtn onClick={() => setPage(p => p + 1)} disabled={page >= pages - 1}>›</PagBtn>
          <PagBtn onClick={() => setPage(pages - 1)} disabled={page >= pages - 1}>»</PagBtn>
        </div>
      )}
    </div>
  )
}

function PagBtn({ children, onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: 28, height: 28, borderRadius: 5,
      background: 'var(--surface2)', border: '1px solid var(--border2)',
      color: disabled ? 'var(--border2)' : 'var(--muted)',
      cursor: disabled ? 'default' : 'pointer', fontSize: 14,
    }}>{children}</button>
  )
}

/* ── Stats viewer ──────────────────────────────────────────── */
function StatsViewer({ output }) {
  if (!output || typeof output !== 'object') return (
    <div style={{ fontSize: 13, color: 'var(--muted)', padding: 8 }}>No output data</div>
  )
  const entries = Object.entries(output).filter(([, v]) => typeof v !== 'object' || v === null)
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      {entries.map(([k, v]) => (
        <div key={k} style={{
          background: 'var(--surface2)', border: '1px solid var(--border)',
          borderRadius: 6, padding: '10px 14px',
        }}>
          <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{k}</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--magenta-light)', fontFamily: 'var(--font-mono)' }}>
            {typeof v === 'number' ? v.toLocaleString() : String(v)}
          </div>
        </div>
      ))}
    </div>
  )
}

/* ── Log viewer ────────────────────────────────────────────── */
function LogViewer({ output }) {
  const lines = Array.isArray(output?.lines) ? output.lines
    : typeof output?.raw === 'string'         ? output.raw.split('\n')
    : typeof output === 'string'              ? output.split('\n')
    : ['(no log output)']
  return (
    <div style={{
      background: 'var(--surface2)', border: '1px solid var(--border)',
      borderRadius: 6, padding: '10px 14px',
      maxHeight: 320, overflowY: 'auto',
      fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.6,
    }}>
      {lines.map((line, i) => (
        <div key={i} style={{ display: 'flex', gap: 12, color: line.trim() ? 'var(--text)' : 'var(--border2)' }}>
          <span style={{ color: 'var(--muted)', userSelect: 'none', minWidth: 30, textAlign: 'right' }}>{i + 1}</span>
          <span style={{ flex: 1, wordBreak: 'break-all' }}>{line || ' '}</span>
        </div>
      ))}
    </div>
  )
}

/* ── JSON viewer ───────────────────────────────────────────── */
function JsonViewer({ output }) {
  const text = JSON.stringify(output, null, 2)
  return (
    <pre style={{
      background: 'var(--surface2)', border: '1px solid var(--border)',
      borderRadius: 6, padding: '12px 14px',
      fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.6,
      color: 'var(--text)', overflowX: 'auto', maxHeight: 340,
      whiteSpace: 'pre-wrap', wordBreak: 'break-word',
      margin: 0,
    }}>{text}</pre>
  )
}

/* ── main modal ────────────────────────────────────────────── */
export default function NodeResultDialog({ nodeTitle, resultType, output, status, onHide }) {
  useEffect(() => {
    const fn = e => { if (e.key === 'Escape') onHide() }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [onHide])

  const statusColor = status === 'error' ? 'var(--red)' : 'var(--magenta-light)'

  const body = !output
    ? <div style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>No result yet — run the pipeline first.</div>
    : resultType === 'table'  ? <TableViewer output={output} />
    : resultType === 'log'    ? <LogViewer   output={output} />
    : resultType === 'stats'  ? <StatsViewer output={output} />
    : resultType === 'json'   ? <JsonViewer  output={output} />
    : <JsonViewer output={output} />

  const modal = (
    <div onClick={onHide} style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(3px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: resultType === 'table' ? 700 : 520,
        maxHeight: '82vh',
        background: 'var(--surface)', border: '1px solid var(--border2)',
        borderRadius: 12, display: 'flex', flexDirection: 'column',
        overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '13px 18px', borderBottom: '1px solid var(--border)',
          background: 'var(--surface2)', flexShrink: 0,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Result — {nodeTitle}</div>
            <div style={{ fontSize: 10, color: statusColor, fontFamily: 'var(--font-mono)', marginTop: 1 }}>
              {status} · {resultType}
            </div>
          </div>
          <button onClick={onHide} style={{
            background: 'none', border: 'none', color: 'var(--muted)',
            cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: '2px 4px',
          }}>×</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 18 }}>
          {body}
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
