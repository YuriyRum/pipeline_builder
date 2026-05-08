import { memo } from 'react'
import { useReactFlow } from 'reactflow'

function GroupNode({ id, data, selected }) {
  const { label, bg, border, labelColor, buildMode, onDelete } = data

  return (
    <div style={{
      width: '100%', height: '100%',
      background: bg,
      border: `1.5px dashed ${selected ? 'var(--amber)' : border}`,
      borderRadius: 'var(--r-lg)',
      padding: '28px 12px 12px',
      position: 'relative',
    }}>
      {buildMode && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(id); }}
          style={{
            position: 'absolute', top: -10, right: -10,
            width: 20, height: 20,
            background: 'var(--red)', color: 'white',
            border: 'none', borderRadius: '50%',
            fontSize: 13, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, zIndex: 10, padding: 0,
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
          }}
        >×</button>
      )}
      <div style={{
        position: 'absolute', top: 8, left: 12,
        fontSize: 10, fontWeight: 600,
        letterSpacing: '0.08em', textTransform: 'uppercase',
        color: labelColor, fontFamily: 'var(--font-mono)',
      }}>{label}</div>
    </div>
  )
}

export default memo(GroupNode)
