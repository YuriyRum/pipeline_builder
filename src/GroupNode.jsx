import { memo, useState, useCallback } from 'react'
import { useReactFlow, NodeResizer } from 'reactflow'

const PRESET_COLORS = [
  { bg: 'rgba(226,0,116,0.08)',   border: '#E20074', label: '#E20074',   name: 'Magenta'  },
  { bg: 'rgba(74,144,217,0.08)',  border: '#4A90D9', label: '#4A90D9',   name: 'Blue'     },
  { bg: 'rgba(29,158,117,0.08)',  border: '#1D9E75', label: '#1D9E75',   name: 'Teal'     },
  { bg: 'rgba(245,166,35,0.08)',  border: '#F5A623', label: '#F5A623',   name: 'Amber'    },
  { bg: 'rgba(155,89,182,0.08)',  border: '#9B59B6', label: '#9B59B6',   name: 'Purple'   },
  { bg: 'rgba(231,76,60,0.08)',   border: '#E74C3C', label: '#E74C3C',   name: 'Red'      },
  { bg: 'rgba(26,188,156,0.08)',  border: '#1ABC9C', label: '#1ABC9C',   name: 'Green'    },
  { bg: 'rgba(255,255,255,0.04)', border: '#666666', label: '#888888',   name: 'Grey'     },
]

function GroupNode({ id, data, selected }) {
  const { setNodes } = useReactFlow()
  const { label = 'Group', bg, border, labelColor, buildMode, onDelete } = data

  const [editing, setEditing] = useState(false)
  const [draft,   setDraft]   = useState({ label, color: PRESET_COLORS[0] })

  const currentColor = PRESET_COLORS.find(c => c.border === border) ?? PRESET_COLORS[0]

  const openEdit = e => {
    e.stopPropagation()
    setDraft({ label, color: currentColor })
    setEditing(true)
  }

  const commitEdit = useCallback(() => {
    setNodes(nds => nds.map(n => n.id === id ? {
      ...n,
      data: {
        ...n.data,
        label:      draft.label || 'Group',
        bg:         draft.color.bg,
        border:     draft.color.border,
        labelColor: draft.color.label,
      }
    } : n))
    setEditing(false)
  }, [id, draft, setNodes])

  const cancelEdit = e => { e.stopPropagation(); setEditing(false) }

  return (
    <div style={{
      width: '100%', height: '100%',
      background: bg,
      border: `1.5px dashed ${selected ? 'rgba(255,255,255,0.5)' : border}`,
      borderRadius: 'var(--r-lg)',
      position: 'relative',
    }}>
      {/* ReactFlow built-in resizer — only show in build mode */}
      {buildMode && (
        <NodeResizer
          minWidth={160}
          minHeight={120}
          isVisible={selected}
          lineStyle={{ stroke: border, strokeWidth: 1.5 }}
          handleStyle={{
            width: 10, height: 10,
            background: 'var(--surface)',
            border: `2px solid ${border}`,
            borderRadius: 2,
          }}
        />
      )}

      {/* Label */}
      <div style={{
        position: 'absolute', top: 7, left: 10,
        fontSize: 10, fontWeight: 600,
        letterSpacing: '0.08em', textTransform: 'uppercase',
        color: labelColor, fontFamily: 'var(--font-mono)',
        pointerEvents: 'none',
        userSelect: 'none',
      }}>{label}</div>

      {/* Build-mode controls */}
      {buildMode && !editing && (
        <div style={{
          position: 'absolute', top: 5, right: 6,
          display: 'flex', gap: 4, alignItems: 'center',
        }}>
          {/* Edit button */}
          <button
            onClick={openEdit}
            className="nodrag"
            title="Edit group"
            style={{
              width: 20, height: 20,
              background: 'var(--surface2)',
              border: `1px solid ${border}`,
              borderRadius: 4,
              color: labelColor,
              fontSize: 11, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 600, padding: 0,
            }}
          >✎</button>

          {/* Delete button */}
          <button
            onClick={e => { e.stopPropagation(); onDelete(id) }}
            className="nodrag"
            title="Delete group"
            style={{
              width: 20, height: 20,
              background: 'var(--red)',
              border: 'none', borderRadius: 4,
              color: 'white', fontSize: 13, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, padding: 0,
            }}
          >×</button>
        </div>
      )}

      {/* Inline edit panel */}
      {editing && (
        <div
          className="nodrag nopan"
          onClick={e => e.stopPropagation()}
          style={{
            position: 'absolute', top: 28, left: 8, right: 8,
            background: 'var(--surface)',
            border: '1px solid var(--border2)',
            borderRadius: 'var(--r)',
            padding: '10px 12px',
            zIndex: 100,
            boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
          }}
        >
          {/* Title input */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-mono)' }}>Title</div>
            <input
              autoFocus
              value={draft.label}
              onChange={e => setDraft(d => ({ ...d, label: e.target.value }))}
              onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') cancelEdit(e) }}
              style={{
                width: '100%', padding: '5px 8px',
                background: 'var(--surface2)', color: 'var(--text)',
                border: '1px solid var(--border2)', borderRadius: 4,
                fontSize: 12, fontFamily: 'var(--font-ui)', outline: 'none',
              }}
            />
          </div>

          {/* Color swatches */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-mono)' }}>Color</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {PRESET_COLORS.map(c => (
                <button
                  key={c.name}
                  title={c.name}
                  onClick={() => setDraft(d => ({ ...d, color: c }))}
                  style={{
                    width: 22, height: 22, borderRadius: 4,
                    background: c.bg,
                    border: `2px solid ${draft.color.border === c.border ? 'white' : c.border}`,
                    cursor: 'pointer', padding: 0,
                    boxShadow: draft.color.border === c.border ? `0 0 0 2px ${c.border}` : 'none',
                    transition: 'all 0.12s',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={commitEdit}
              style={{
                flex: 1, padding: '5px 0',
                background: 'var(--magenta)', color: 'white',
                border: 'none', borderRadius: 4,
                fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-ui)',
                fontWeight: 500,
              }}
            >Apply</button>
            <button
              onClick={cancelEdit}
              style={{
                flex: 1, padding: '5px 0',
                background: 'var(--surface2)', color: 'var(--muted)',
                border: '1px solid var(--border2)', borderRadius: 4,
                fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-ui)',
              }}
            >Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default memo(GroupNode)
