/**
 * NodeCard — the shared shell every pipeline node renders inside.
 *
 * Node definitions export a `renderBody(nodeData, updateControl)` function.
 * If omitted, the default controls UI (toggle / checkbox / select) is rendered.
 *
 * Props come straight from ReactFlow's custom node interface:
 *   id, data, selected
 */
import { memo, useCallback } from 'react'
import { Handle, Position, useReactFlow } from 'reactflow'

const STATUS_COLORS = {
  idle:    'var(--muted)',
  running: 'var(--green)',
  done:    '#639922',
  error:   'var(--red)',
}

const STATUS_LABELS = {
  idle:    '',
  running: 'running',
  done:    'done',
  error:   'error',
}

/* ── default controls ────────────────────────────────────── */
export function ToggleSwitch({ checked, onChange }) {
  return (
    <div onClick={() => onChange(!checked)} style={{
      width: 32, height: 18, borderRadius: 9, cursor: 'pointer',
      background: checked ? 'var(--green)' : 'var(--border2)',
      position: 'relative', transition: 'background 0.2s', flexShrink: 0,
    }}>
      <div style={{
        width: 12, height: 12, borderRadius: '50%',
        background: 'white', position: 'absolute',
        top: 3, left: checked ? 17 : 3,
        transition: 'left 0.2s',
        boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
      }} />
    </div>
  )
}

export function ControlRow({ label, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
      <span style={{ fontSize: 12, color: 'var(--muted)', flexShrink: 0 }}>{label}</span>
      {children}
    </div>
  )
}

export function MiniSelect({ value, opts, onChange }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={{
      fontSize: 12,
      background: 'var(--surface2)', color: 'var(--text)',
      border: '1px solid var(--border2)',
      borderRadius: 5, padding: '2px 6px',
      cursor: 'pointer', fontFamily: 'var(--font-ui)',
      maxWidth: 110,
    }}>
      {opts.map(o => <option key={o}>{o}</option>)}
    </select>
  )
}

export function MiniTextarea({ value, onChange, rows = 3, placeholder }) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      rows={rows}
      placeholder={placeholder}
      style={{
        width: '100%', fontSize: 11,
        background: 'var(--surface2)', color: 'var(--text)',
        border: '1px solid var(--border2)',
        borderRadius: 5, padding: '4px 6px',
        fontFamily: 'var(--font-mono)', resize: 'none',
        lineHeight: 1.5,
      }}
    />
  )
}

function DefaultControls({ controls, onUpdate }) {
  return controls.map(ctrl => {
    const { type, label, key, val, opts } = ctrl
    if (type === 'toggle') return (
      <ControlRow key={key} label={label}>
        <ToggleSwitch checked={val} onChange={v => onUpdate(key, v)} />
      </ControlRow>
    )
    if (type === 'checkbox') return (
      <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
        <input type="checkbox" checked={val}
          onChange={e => onUpdate(key, e.target.checked)}
          style={{ width: 13, height: 13, accentColor: 'var(--green)', cursor: 'pointer' }}
        />
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>{label}</span>
      </label>
    )
    if (type === 'select') return (
      <ControlRow key={key} label={label}>
        <MiniSelect value={val} opts={opts} onChange={v => onUpdate(key, v)} />
      </ControlRow>
    )
    return null
  })
}

/* ── main card ───────────────────────────────────────────── */
function NodeCard({ id, data, selected }) {
  const { setNodes } = useReactFlow()
  const {
    title, icon, iconBg,
    controls = [], status = 'idle',
    buildMode, onDelete,
    renderBody,         // optional custom body from the node definition
    lastOutput,         // last run result message
  } = data

  const updateControl = useCallback((key, val) => {
    setNodes(nds => nds.map(n =>
      n.id === id
        ? { ...n, data: { ...n.data, controls: n.data.controls.map(c => c.key === key ? { ...c, val } : c) } }
        : n
    ))
  }, [id, setNodes])

  const borderColor = selected
    ? 'var(--amber)'
    : status === 'running' ? 'var(--green)'
    : status === 'done'    ? '#639922'
    : status === 'error'   ? 'var(--red)'
    : 'var(--border2)'

  const shadow = selected
    ? '0 0 0 2px rgba(245,166,35,0.2)'
    : status === 'running' ? '0 0 0 3px rgba(29,158,117,0.2)'
    : status === 'error'   ? '0 0 0 3px rgba(224,82,82,0.2)'
    : '0 4px 20px rgba(0,0,0,0.4)'

  return (
    <div style={{
      background: 'var(--surface)',
      border: `1.5px solid ${borderColor}`,
      borderRadius: 'var(--r)',
      minWidth: 190,
      boxShadow: shadow,
      transition: 'border-color 0.2s, box-shadow 0.2s',
      position: 'relative',
    }}>
      {/* delete button */}
      {buildMode && (
        <button onClick={e => { e.stopPropagation(); onDelete(id) }} style={{
          position: 'absolute', top: -10, right: -10,
          width: 20, height: 20,
          background: 'var(--red)', color: 'white',
          border: 'none', borderRadius: '50%',
          fontSize: 13, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, zIndex: 10, padding: 0,
          boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
        }}>×</button>
      )}

      {/* handles */}
      <Handle type="target" position={Position.Left}   style={{ left: -6 }} />
      <Handle type="target" position={Position.Top}    style={{ top: -6 }} />
      <Handle type="source" position={Position.Right}  style={{ right: -6 }} />
      <Handle type="source" position={Position.Bottom} style={{ bottom: -6 }} />

      {/* header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 12px 8px',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: 6,
          background: iconBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 15, flexShrink: 0,
        }}>{icon}</div>
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', flex: 1 }}>{title}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {STATUS_LABELS[status] && (
            <span style={{ fontSize: 10, color: STATUS_COLORS[status], fontFamily: 'var(--font-mono)' }}>
              {STATUS_LABELS[status]}
            </span>
          )}
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: STATUS_COLORS[status],
            boxShadow: status === 'running' ? '0 0 6px var(--green)' : 'none',
            transition: 'background 0.3s',
          }} />
        </div>
      </div>

      {/* body */}
      <div style={{ padding: '8px 12px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {renderBody
          ? renderBody(data, updateControl)
          : <DefaultControls controls={controls} onUpdate={updateControl} />
        }
      </div>

      {/* last output strip */}
      {lastOutput && (
        <div style={{
          padding: '4px 12px 6px',
          borderTop: '1px solid var(--border)',
          fontSize: 10, color: status === 'error' ? 'var(--red)' : 'var(--green)',
          fontFamily: 'var(--font-mono)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>↳ {lastOutput}</div>
      )}
    </div>
  )
}

export default memo(NodeCard)
