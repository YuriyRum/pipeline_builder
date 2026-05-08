import { memo, useCallback } from 'react'
import { Handle, Position, useReactFlow } from 'reactflow'

const STATUS_COLORS = {
  idle:    'var(--muted)',
  running: 'var(--green)',
  done:    '#639922',
  error:   'var(--red)',
}

function PipelineNode({ id, data, selected }) {
  const { setNodes } = useReactFlow()
  const { title, icon, iconBg, controls = [], status = 'idle', buildMode, onDelete } = data

  const updateControl = useCallback((key, val) => {
    setNodes(nds => nds.map(n =>
      n.id === id
        ? { ...n, data: { ...n.data, controls: n.data.controls.map(c => c.key === key ? { ...c, val } : c) } }
        : n
    ))
  }, [id, setNodes])

  return (
    <div style={{
      background: 'var(--surface)',
      border: `1.5px solid ${selected ? 'var(--amber)' : status === 'running' ? 'var(--green)' : status === 'done' ? '#639922' : 'var(--border2)'}`,
      borderRadius: 'var(--r)',
      minWidth: 180,
      boxShadow: selected
        ? '0 0 0 2px rgba(245,166,35,0.2)'
        : status === 'running'
        ? '0 0 0 3px rgba(29,158,117,0.2)'
        : '0 4px 20px rgba(0,0,0,0.4)',
      transition: 'border-color 0.2s, box-shadow 0.2s',
      overflow: 'visible',
      position: 'relative',
    }}>
      {/* Delete button in build mode */}
      {buildMode && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(id); }}
          style={{
            position: 'absolute', top: -10, right: -10,
            width: 20, height: 20,
            background: 'var(--red)', color: 'white',
            border: 'none', borderRadius: '50%',
            fontSize: 13, lineHeight: 1, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, zIndex: 10, padding: 0,
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
          }}
        >×</button>
      )}

      {/* Handles */}
      <Handle type="target" position={Position.Left}  style={{ left: -6 }} />
      <Handle type="target" position={Position.Top}   style={{ top: -6 }} />
      <Handle type="source" position={Position.Right}  style={{ right: -6 }} />
      <Handle type="source" position={Position.Bottom} style={{ bottom: -6 }} />

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 12px 8px',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: 6,
          background: iconBg, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          fontSize: 15, flexShrink: 0,
        }}>{icon}</div>
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', flex: 1 }}>{title}</span>
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: STATUS_COLORS[status],
          flexShrink: 0,
          boxShadow: status === 'running' ? '0 0 6px var(--green)' : 'none',
          transition: 'background 0.3s',
        }} />
      </div>

      {/* Controls */}
      <div style={{ padding: '8px 12px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {controls.map(ctrl => (
          <Control key={ctrl.key} ctrl={ctrl} onUpdate={updateControl} />
        ))}
      </div>
    </div>
  )
}

function Control({ ctrl, onUpdate }) {
  const { type, label, key, val, opts } = ctrl

  if (type === 'toggle') return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 12, color: 'var(--muted)' }}>{label}</span>
      <ToggleSwitch checked={val} onChange={v => onUpdate(key, v)} />
    </div>
  )

  if (type === 'checkbox') return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
      <input
        type="checkbox"
        checked={val}
        onChange={e => onUpdate(key, e.target.checked)}
        style={{ width: 13, height: 13, accentColor: 'var(--green)', cursor: 'pointer' }}
      />
      <span style={{ fontSize: 12, color: 'var(--muted)' }}>{label}</span>
    </label>
  )

  if (type === 'select') return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 12, color: 'var(--muted)' }}>{label}</span>
      <select
        value={val}
        onChange={e => onUpdate(key, e.target.value)}
        style={{
          fontSize: 12,
          background: 'var(--surface2)',
          color: 'var(--text)',
          border: '1px solid var(--border2)',
          borderRadius: 5, padding: '2px 6px',
          cursor: 'pointer', fontFamily: 'var(--font-ui)',
          maxWidth: 100,
        }}
      >
        {opts.map(o => <option key={o}>{o}</option>)}
      </select>
    </div>
  )

  return null
}

function ToggleSwitch({ checked, onChange }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{
        width: 32, height: 18, borderRadius: 9, cursor: 'pointer',
        background: checked ? 'var(--green)' : 'var(--border2)',
        position: 'relative', transition: 'background 0.2s', flexShrink: 0,
      }}
    >
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

export default memo(PipelineNode)
