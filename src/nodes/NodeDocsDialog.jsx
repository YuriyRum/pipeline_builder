/**
 * NodeDocsDialog — zero-dependency custom modal.
 * No PrimeReact Dialog needed; uses a plain React portal overlay.
 * Opens when the user clicks the [?] button on a node card.
 */
import { useEffect } from 'react'
import { createPortal } from 'react-dom'

const CTRL_COLORS = {
  toggle:   '#4A90D9',
  checkbox: '#9B59B6',
  select:   '#F5A623',
  text:     'var(--magenta)',
}

export default function NodeDocsDialog({ node, onHide }) {
  if (!node) return null
  const { title, icon, doc, defaultControls = [], inputType, outputType, group } = node

  // Close on Escape
  useEffect(() => {
    const fn = e => { if (e.key === 'Escape') onHide() }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [onHide])

  // Parse doc string into sections by ## heading
  const sections = []
  if (doc) {
    const lines = doc.split('\n')
    let cur = { heading: null, body: [] }
    for (const line of lines) {
      if (line.startsWith('## ')) {
        if (cur.body.length || cur.heading) sections.push(cur)
        cur = { heading: line.slice(3).trim(), body: [] }
      } else {
        cur.body.push(line)
      }
    }
    if (cur.body.length || cur.heading) sections.push(cur)
  }

  const modal = (
    <div
      onClick={onHide}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(3px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 520, maxHeight: '82vh',
          background: 'var(--surface)',
          border: '1px solid var(--border2)',
          borderRadius: 12,
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 18px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface2)',
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: 'var(--magenta-subtle)',
            border: '1px solid var(--magenta)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, flexShrink: 0,
          }}>{icon}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{title}</div>
            {group && (
              <div style={{
                fontSize: 10, color: 'var(--muted)',
                textTransform: 'uppercase', letterSpacing: '0.07em',
                fontFamily: 'var(--font-mono)', marginTop: 1,
              }}>{group}</div>
            )}
          </div>
          <button onClick={onHide} style={{
            background: 'none', border: 'none', color: 'var(--muted)',
            cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: '2px 4px',
            flexShrink: 0,
          }}>×</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Doc sections */}
          {sections.map((s, i) => (
            <div key={i}>
              {s.heading && (
                <div style={{
                  fontSize: 10, fontWeight: 700, color: 'var(--magenta-light)',
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                  fontFamily: 'var(--font-mono)', marginBottom: 6,
                  paddingBottom: 4, borderBottom: '1px solid var(--border)',
                }}>{s.heading}</div>
              )}
              <div style={{
                fontSize: 13, color: 'var(--text)', lineHeight: 1.7,
                whiteSpace: 'pre-wrap',
              }}>{s.body.join('\n').trim()}</div>
            </div>
          ))}

          {/* Controls reference */}
          {defaultControls.length > 0 && (
            <div>
              <div style={{
                fontSize: 10, fontWeight: 700, color: 'var(--magenta-light)',
                textTransform: 'uppercase', letterSpacing: '0.08em',
                fontFamily: 'var(--font-mono)', marginBottom: 8,
                paddingBottom: 4, borderBottom: '1px solid var(--border)',
              }}>Controls</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr>
                    {['Label','Type','Default','Options'].map(h => (
                      <th key={h} style={{
                        padding: '5px 8px', textAlign: 'left',
                        background: 'var(--surface2)',
                        borderBottom: '1px solid var(--border)',
                        color: 'var(--muted)', fontWeight: 600,
                        fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {defaultControls.map((c, i) => (
                    <tr key={i}>
                      <td style={{ padding: '5px 8px', borderBottom: '1px solid var(--border)', color: 'var(--text)' }}>{c.label}</td>
                      <td style={{ padding: '5px 8px', borderBottom: '1px solid var(--border)' }}>
                        <span style={{
                          display: 'inline-block', padding: '1px 7px', borderRadius: 4,
                          background: CTRL_COLORS[c.type] ?? 'var(--muted)',
                          color: 'white', fontSize: 10, fontWeight: 600,
                        }}>{c.type}</span>
                      </td>
                      <td style={{ padding: '5px 8px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--magenta-light)' }}>
                        {String(c.val)}
                      </td>
                      <td style={{ padding: '5px 8px', borderBottom: '1px solid var(--border)', color: 'var(--muted)', fontSize: 11 }}>
                        {c.opts ? c.opts.join(', ') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Input / Output type badges */}
          {(inputType || outputType) && (
            <div style={{ display: 'flex', gap: 24 }}>
              {inputType && (
                <div>
                  <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>Input</div>
                  <span style={{
                    display: 'inline-block', padding: '3px 10px', borderRadius: 5,
                    background: 'var(--surface2)', color: 'var(--blue)',
                    border: '1px solid var(--blue)', fontSize: 11, fontFamily: 'var(--font-mono)',
                  }}>{inputType}</span>
                </div>
              )}
              {outputType && (
                <div>
                  <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>Output</div>
                  <span style={{
                    display: 'inline-block', padding: '3px 10px', borderRadius: 5,
                    background: 'var(--magenta-subtle)', color: 'var(--magenta-light)',
                    border: '1px solid var(--magenta)', fontSize: 11, fontFamily: 'var(--font-mono)',
                  }}>{outputType}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
