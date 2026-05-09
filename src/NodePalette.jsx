/**
 * NODE PALETTE
 * Reads node definitions straight from the registry.
 * No hardcoded templates — adding a node to registry.js
 * automatically makes it appear here.
 */
import REGISTRY from './nodes/registry.js'

const GROUP_META = {
  ingestion:  { label: 'Ingestion',  dot: '#4A90D9' },
  processing: { label: 'Processing', dot: '#1D9E75' },
  output:     { label: 'Output',     dot: '#F5A623' },
}

const GROUP_ORDER = ['ingestion', 'processing', 'output']

const GROUP_TEMPLATES = [
  { type: 'group', label: 'Ingestion group',  gLabel: 'Data ingestion', bg: 'rgba(74,144,217,0.07)',  border: '#4A90D9', lc: '#4A90D9' },
  { type: 'group', label: 'Processing group', gLabel: 'Processing',     bg: 'rgba(29,158,117,0.07)',  border: '#1D9E75', lc: '#1D9E75' },
  { type: 'group', label: 'Output group',     gLabel: 'Output',         bg: 'rgba(245,166,35,0.07)',  border: '#F5A623', lc: '#F5A623' },
]

export default function NodePalette({ onAddNode }) {
  return (
    <div style={{
      width: 210,
      background: 'var(--surface)',
      borderRight: '1px solid var(--border2)',
      overflowY: 'auto',
      display: 'flex', flexDirection: 'column',
      flexShrink: 0,
    }}>
      <div style={{
        padding: '12px 14px 8px',
        fontSize: 10, fontWeight: 600,
        letterSpacing: '0.1em', textTransform: 'uppercase',
        color: 'var(--muted)', fontFamily: 'var(--font-mono)',
        borderBottom: '1px solid var(--border)',
      }}>Node Palette</div>

      {GROUP_ORDER.map(g => {
        const nodes = REGISTRY.filter(n => n.group === g)
        if (!nodes.length) return null
        const meta = GROUP_META[g]
        return (
          <div key={g}>
            <div style={{ padding: '10px 14px 4px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: meta.dot }} />
              <span style={{
                fontSize: 10, fontWeight: 600, color: 'var(--muted)',
                letterSpacing: '0.06em', textTransform: 'uppercase',
                fontFamily: 'var(--font-mono)',
              }}>{meta.label}</span>
            </div>
            {nodes.map(def => (
              <button
                key={def.id}
                onClick={() => onAddNode(def)}
                title={def.title}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  width: '100%', padding: '7px 14px',
                  background: 'none', border: 'none',
                  color: 'var(--text)', cursor: 'pointer',
                  textAlign: 'left', fontSize: 12,
                  fontFamily: 'var(--font-ui)',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <span style={{
                  width: 22, height: 22, borderRadius: 5,
                  background: def.iconBg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, flexShrink: 0,
                }}>{def.icon}</span>
                {def.title}
              </button>
            ))}
          </div>
        )
      })}

      {/* Group backgrounds */}
      <div style={{ borderTop: '1px solid var(--border)', marginTop: 8, padding: '10px 14px 4px' }}>
        <div style={{
          fontSize: 10, fontWeight: 600, color: 'var(--muted)',
          letterSpacing: '0.06em', textTransform: 'uppercase',
          fontFamily: 'var(--font-mono)', marginBottom: 6,
        }}>Groups</div>
        {GROUP_TEMPLATES.map(g => (
          <button
            key={g.label}
            onClick={() => onAddNode(g)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              width: '100%', padding: '6px 0',
              background: 'none', border: 'none',
              color: 'var(--text)', cursor: 'pointer',
              textAlign: 'left', fontSize: 12,
              fontFamily: 'var(--font-ui)',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            <div style={{
              width: 22, height: 16, borderRadius: 4,
              border: `1.5px dashed ${g.border}`,
              background: g.bg, flexShrink: 0,
            }} />
            {g.label}
          </button>
        ))}
      </div>
    </div>
  )
}
