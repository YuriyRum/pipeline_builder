import { useState } from 'react'
import REGISTRY from './nodes/registry.js'

const GROUP_META = {
  ingestion:  { label: 'Ingestion',  dot: '#4A90D9' },
  processing: { label: 'Processing', dot: 'var(--magenta)' },
  output:     { label: 'Output',     dot: '#F5A623' },
}
const GROUP_ORDER = ['ingestion', 'processing', 'output']

const PRESET_COLORS = [
  { bg:'rgba(226,0,116,0.08)',   border:'#E20074', label:'#E20074', name:'Magenta'  },
  { bg:'rgba(74,144,217,0.08)',  border:'#4A90D9', label:'#4A90D9', name:'Blue'     },
  { bg:'rgba(29,158,117,0.08)',  border:'#1D9E75', label:'#1D9E75', name:'Teal'     },
  { bg:'rgba(245,166,35,0.08)',  border:'#F5A623', label:'#F5A623', name:'Amber'    },
  { bg:'rgba(155,89,182,0.08)',  border:'#9B59B6', label:'#9B59B6', name:'Purple'   },
  { bg:'rgba(231,76,60,0.08)',   border:'#E74C3C', label:'#E74C3C', name:'Red'      },
  { bg:'rgba(26,188,156,0.08)',  border:'#1ABC9C', label:'#1ABC9C', name:'Green'    },
  { bg:'rgba(255,255,255,0.04)', border:'#666666', label:'#888888', name:'Grey'     },
]

function NodeBtn({ def, onAddNode }) {
  return (
    <button
      onClick={() => onAddNode(def)}
      title={def.title}
      style={{
        display:'flex', alignItems:'center', gap:8,
        width:'100%', padding:'6px 14px',
        background:'none', border:'none',
        color:'var(--text)', cursor:'pointer',
        textAlign:'left', fontSize:12,
        fontFamily:'var(--font-ui)', transition:'background 0.12s',
      }}
      onMouseEnter={e => e.currentTarget.style.background='var(--surface2)'}
      onMouseLeave={e => e.currentTarget.style.background='none'}
    >
      <span style={{
        width:22, height:22, borderRadius:5, background:def.iconBg,
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:12, flexShrink:0,
      }}>{def.icon}</span>
      {def.title}
    </button>
  )
}

function SectionLabel({ label, color }) {
  return (
    <div style={{ padding:'10px 14px 4px', display:'flex', alignItems:'center', gap:6 }}>
      <div style={{ width:6, height:6, borderRadius:'50%', background:color, flexShrink:0 }}/>
      <span style={{
        fontSize:9, fontWeight:600, color:'var(--muted)',
        letterSpacing:'0.08em', textTransform:'uppercase', fontFamily:'var(--font-mono)',
      }}>{label}</span>
    </div>
  )
}

export default function NodePalette({ onAddNode }) {
  const [groupName,  setGroupName]  = useState('My Group')
  const [groupColor, setGroupColor] = useState(PRESET_COLORS[0])
  const [groupOpen,  setGroupOpen]  = useState(false)

  const handleAddGroup = () => {
    onAddNode({
      type:   'group',
      gLabel: groupName.trim() || 'Group',
      bg:     groupColor.bg,
      border: groupColor.border,
      lc:     groupColor.label,
    })
    setGroupOpen(false)
  }

  return (
    <div style={{
      width:210, background:'var(--surface)',
      borderRight:'1px solid var(--border2)',
      overflowY:'auto', display:'flex', flexDirection:'column', flexShrink:0,
    }}>
      {/* Header */}
      <div style={{
        padding:'11px 14px 9px',
        fontSize:9, fontWeight:600, letterSpacing:'0.1em',
        textTransform:'uppercase', color:'var(--muted)',
        fontFamily:'var(--font-mono)', borderBottom:'1px solid var(--border)',
      }}>Node Palette</div>

      {/* Nodes by group */}
      {GROUP_ORDER.map(g => {
        const nodes = REGISTRY.filter(n => n.group === g)
        if (!nodes.length) return null
        const meta = GROUP_META[g]
        return (
          <div key={g}>
            <SectionLabel label={meta.label} color={meta.dot} />
            {nodes.map(def => <NodeBtn key={def.id} def={def} onAddNode={onAddNode} />)}
          </div>
        )
      })}

      {/* Groups section */}
      <div style={{ borderTop:'1px solid var(--border)', marginTop:8 }}>
        <div style={{ padding:'10px 14px 4px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{
            fontSize:9, fontWeight:600, color:'var(--muted)',
            letterSpacing:'0.08em', textTransform:'uppercase', fontFamily:'var(--font-mono)',
          }}>Groups</span>
          <button
            onClick={() => setGroupOpen(o => !o)}
            style={{
              fontSize:11, color: groupOpen ? 'var(--magenta-light)' : 'var(--muted)',
              background:'none', border:'none', cursor:'pointer', fontFamily:'var(--font-ui)',
              padding:'1px 4px',
            }}
          >{groupOpen ? '▲ close' : '+ new'}</button>
        </div>

        {/* Group creator */}
        {groupOpen && (
          <div style={{
            margin:'4px 10px 10px',
            background:'var(--surface2)',
            border:'1px solid var(--border2)',
            borderRadius:'var(--r)',
            padding:'10px',
          }}>
            <div style={{ fontSize:10, color:'var(--muted)', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.06em', fontFamily:'var(--font-mono)' }}>Title</div>
            <input
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddGroup()}
              style={{
                width:'100%', padding:'5px 8px', marginBottom:8,
                background:'var(--surface)', color:'var(--text)',
                border:'1px solid var(--border2)', borderRadius:4,
                fontSize:12, fontFamily:'var(--font-ui)', outline:'none',
              }}
            />
            <div style={{ fontSize:10, color:'var(--muted)', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.06em', fontFamily:'var(--font-mono)' }}>Color</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginBottom:10 }}>
              {PRESET_COLORS.map(c => (
                <button
                  key={c.name}
                  title={c.name}
                  onClick={() => setGroupColor(c)}
                  style={{
                    width:20, height:20, borderRadius:4,
                    background:c.bg, cursor:'pointer', padding:0,
                    border:`2px solid ${groupColor.border === c.border ? 'white' : c.border}`,
                    boxShadow: groupColor.border === c.border ? `0 0 0 2px ${c.border}` : 'none',
                    transition:'all 0.12s',
                  }}
                />
              ))}
            </div>
            {/* Preview */}
            <div style={{
              width:'100%', height:28, borderRadius:4,
              background:groupColor.bg,
              border:`1.5px dashed ${groupColor.border}`,
              display:'flex', alignItems:'center', paddingLeft:8, marginBottom:8,
            }}>
              <span style={{ fontSize:9, color:groupColor.label, fontFamily:'var(--font-mono)', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase' }}>
                {groupName || 'Group'}
              </span>
            </div>
            <button
              onClick={handleAddGroup}
              style={{
                width:'100%', padding:'6px 0',
                background:'var(--magenta)', color:'white',
                border:'none', borderRadius:4,
                fontSize:12, cursor:'pointer', fontFamily:'var(--font-ui)', fontWeight:500,
              }}
            >Add Group</button>
          </div>
        )}
      </div>
    </div>
  )
}
