const NODE_TEMPLATES = [
  { type: 'pipeline', label: 'File source',   icon: '📂', iconBg: '#1a2d3a', group: 'ingestion',
    controls: [
      { type: 'toggle', label: 'Watch dir', key: 'watch', val: true },
      { type: 'select', label: 'Format',    key: 'fmt',   val: 'CSV', opts: ['CSV','JSON','Parquet'] },
    ]},
  { type: 'pipeline', label: 'API stream',    icon: '🌐', iconBg: '#1a2d3a', group: 'ingestion',
    controls: [
      { type: 'toggle',   label: 'Enabled',    key: 'enabled', val: false },
      { type: 'checkbox', label: 'Auth token',  key: 'auth',    val: true  },
    ]},
  { type: 'pipeline', label: 'Database',      icon: '🗄️', iconBg: '#1a2d3a', group: 'ingestion',
    controls: [
      { type: 'select', label: 'Driver', key: 'driver', val: 'Postgres', opts: ['Postgres','MySQL','SQLite'] },
    ]},
  { type: 'pipeline', label: 'Transformer',   icon: '⚙️', iconBg: '#1a3028', group: 'processing',
    controls: [
      { type: 'select',   label: 'Mode',      key: 'mode',  val: 'Normalize', opts: ['Normalize','Scale','Encode'] },
      { type: 'checkbox', label: 'Drop nulls', key: 'nulls', val: true },
      { type: 'checkbox', label: 'Dedupe',     key: 'dup',   val: false },
    ]},
  { type: 'pipeline', label: 'Validator',     icon: '✅', iconBg: '#1e2e1a', group: 'processing',
    controls: [
      { type: 'toggle', label: 'Strict mode', key: 'strict', val: true },
      { type: 'select', label: 'Schema',      key: 'schema', val: 'v2', opts: ['v1','v2','v3'] },
    ]},
  { type: 'pipeline', label: 'Filter',        icon: '🔍', iconBg: '#1e2e1a', group: 'processing',
    controls: [
      { type: 'select',   label: 'Condition', key: 'cond',  val: '>0', opts: ['>0','!=null','custom'] },
      { type: 'toggle',   label: 'Invert',    key: 'inv',   val: false },
    ]},
  { type: 'pipeline', label: 'Output DB',     icon: '💾', iconBg: '#2e2516', group: 'output',
    controls: [
      { type: 'select', label: 'Target',      key: 'db',    val: 'Postgres', opts: ['Postgres','MySQL','Mongo'] },
      { type: 'toggle', label: 'Batch write', key: 'batch', val: true },
    ]},
  { type: 'pipeline', label: 'Notifier',      icon: '🔔', iconBg: '#2e2516', group: 'output',
    controls: [
      { type: 'checkbox', label: 'Email',         key: 'email',  val: true  },
      { type: 'checkbox', label: 'Slack',         key: 'slack',  val: false },
      { type: 'toggle',   label: 'On error only', key: 'eronly', val: false },
    ]},
  { type: 'pipeline', label: 'HTTP Export',   icon: '🚀', iconBg: '#2e2516', group: 'output',
    controls: [
      { type: 'select', label: 'Method', key: 'method', val: 'POST', opts: ['POST','PUT','PATCH'] },
      { type: 'toggle', label: 'Auth',   key: 'auth',   val: true },
    ]},
]

const GROUP_COLORS = {
  ingestion:  { label: 'Ingestion',  dot: '#4A90D9' },
  processing: { label: 'Processing', dot: '#1D9E75' },
  output:     { label: 'Output',     dot: '#F5A623' },
}

export default function NodePalette({ onAddNode }) {
  const groups = ['ingestion', 'processing', 'output']

  return (
    <div style={{
      width: 200,
      background: 'var(--surface)',
      borderRight: '1px solid var(--border2)',
      overflowY: 'auto',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{
        padding: '12px 14px 8px',
        fontSize: 10, fontWeight: 600,
        letterSpacing: '0.1em', textTransform: 'uppercase',
        color: 'var(--muted)', fontFamily: 'var(--font-mono)',
        borderBottom: '1px solid var(--border)',
      }}>Node Palette</div>

      {groups.map(g => (
        <div key={g}>
          <div style={{
            padding: '10px 14px 4px',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: GROUP_COLORS[g].dot }} />
            <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--muted)', letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
              {GROUP_COLORS[g].label}
            </span>
          </div>
          {NODE_TEMPLATES.filter(t => t.group === g).map(tmpl => (
            <button
              key={tmpl.label}
              onClick={() => onAddNode(tmpl)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                width: '100%', padding: '7px 14px',
                background: 'none', border: 'none',
                color: 'var(--text)', cursor: 'pointer',
                textAlign: 'left', fontSize: 12,
                fontFamily: 'var(--font-ui)',
                transition: 'background 0.15s',
                borderRadius: 0,
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <span style={{
                width: 22, height: 22, borderRadius: 5,
                background: tmpl.iconBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, flexShrink: 0,
              }}>{tmpl.icon}</span>
              {tmpl.label}
            </button>
          ))}
        </div>
      ))}

      {/* Group adder */}
      <div style={{ borderTop: '1px solid var(--border)', marginTop: 8, padding: '10px 14px 4px' }}>
        <div style={{
          fontSize: 10, fontWeight: 600, color: 'var(--muted)',
          letterSpacing: '0.06em', textTransform: 'uppercase',
          fontFamily: 'var(--font-mono)', marginBottom: 6,
        }}>Groups</div>
        {[
          { label: 'Ingestion group', bg: 'rgba(74,144,217,0.08)', border: '#4A90D9', lc: '#4A90D9', gLabel: 'Data ingestion' },
          { label: 'Processing group', bg: 'rgba(29,158,117,0.08)', border: '#1D9E75', lc: '#1D9E75', gLabel: 'Processing' },
          { label: 'Output group', bg: 'rgba(245,166,35,0.08)', border: '#F5A623', lc: '#F5A623', gLabel: 'Output' },
        ].map(g => (
          <button
            key={g.label}
            onClick={() => onAddNode({ type: 'group', ...g })}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              width: '100%', padding: '7px 0',
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
