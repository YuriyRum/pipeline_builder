import { useState } from 'react'
import REGISTRY from './nodes/registry.js'

const GROUP_META = {
  control:    { label: 'Control Flow', dot: '#F5A623' },
  ingestion:  { label: 'Ingestion',    dot: '#4A90D9' },
  processing: { label: 'Processing',   dot: '#E20074' },
  output:     { label: 'Output',       dot: '#F5A623' },
}
const GROUP_ORDER = ['control', 'ingestion', 'processing', 'output']

const PRESET_COLORS = [
  { bg:'rgba(226,0,116,0.08)',   border:'#E20074', label:'#E20074', name:'Magenta' },
  { bg:'rgba(74,144,217,0.08)',  border:'#4A90D9', label:'#4A90D9', name:'Blue'    },
  { bg:'rgba(29,158,117,0.08)',  border:'#1D9E75', label:'#1D9E75', name:'Teal'    },
  { bg:'rgba(245,166,35,0.08)',  border:'#F5A623', label:'#F5A623', name:'Amber'   },
  { bg:'rgba(155,89,182,0.08)',  border:'#9B59B6', label:'#9B59B6', name:'Purple'  },
  { bg:'rgba(231,76,60,0.08)',   border:'#E74C3C', label:'#E74C3C', name:'Red'     },
  { bg:'rgba(26,188,156,0.08)',  border:'#1ABC9C', label:'#1ABC9C', name:'Green'   },
  { bg:'rgba(255,255,255,0.04)', border:'#666666', label:'#888888', name:'Grey'    },
]

/* ── shared ── */
function NodeBtn({ def, onAddNode, parentId }) {
  return (
    <button
      onClick={() => onAddNode(def, parentId)}
      title={def.title}
      style={{
        display:'flex', alignItems:'center', gap:8,
        width:'100%', padding:'5px 14px',
        background:'none', border:'none',
        color:'var(--text)', cursor:'pointer',
        textAlign:'left', fontSize:12,
        fontFamily:'var(--font-ui)', transition:'background 0.12s',
      }}
      onMouseEnter={e=>e.currentTarget.style.background='var(--surface2)'}
      onMouseLeave={e=>e.currentTarget.style.background='none'}
    >
      <span style={{
        width:20, height:20, borderRadius:4, background:def.iconBg,
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:11, flexShrink:0,
      }}>{def.icon}</span>
      <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
        {def.title}
      </span>
    </button>
  )
}

function SectionHeader({ label, color, open, onToggle, count }) {
  return (
    <button
      onClick={onToggle}
      style={{
        display:'flex', alignItems:'center', gap:7,
        width:'100%', padding:'8px 14px 6px',
        background:'none', border:'none', cursor:'pointer',
        textAlign:'left', transition:'background 0.12s',
      }}
      onMouseEnter={e=>e.currentTarget.style.background='var(--surface2)'}
      onMouseLeave={e=>e.currentTarget.style.background='none'}
    >
      <div style={{ width:6, height:6, borderRadius:'50%', background:color, flexShrink:0 }}/>
      <span style={{
        flex:1, fontSize:9, fontWeight:700, color:'var(--muted)',
        letterSpacing:'0.09em', textTransform:'uppercase', fontFamily:'var(--font-mono)',
      }}>{label}</span>
      {count != null && (
        <span style={{
          fontSize:9, color:'var(--muted)', fontFamily:'var(--font-mono)',
          background:'var(--surface3)', borderRadius:3, padding:'1px 5px',
        }}>{count}</span>
      )}
      <span style={{
        fontSize:10, color:'var(--muted)', flexShrink:0, lineHeight:1,
        transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
        transition:'transform 0.2s', display:'inline-block',
      }}>▾</span>
    </button>
  )
}

function GroupCreator({ onAddNode, isSubflow=false }) {
  const [name,  setName]  = useState(isSubflow ? 'Subflow' : 'My Group')
  const [color, setColor] = useState(PRESET_COLORS[0])

  const handleAdd = () => {
    if (isSubflow) {
      onAddNode({
        type:   'subflow',
        gLabel: name.trim() || 'Subflow',
        bg:     color.bg,
        border: color.border,
        lc:     color.label,
      })
    } else {
      onAddNode({
        type:   'group',
        gLabel: name.trim() || 'Group',
        bg:     color.bg,
        border: color.border,
        lc:     color.label,
      })
    }
    setName(isSubflow ? 'Subflow' : 'My Group')
  }

  return (
    <div style={{
      margin:'4px 10px 10px',
      background:'var(--surface2)',
      border:'1px solid var(--border2)',
      borderRadius:6, padding:10,
    }}>
      <input
        value={name}
        onChange={e=>setName(e.target.value)}
        onKeyDown={e=>e.key==='Enter'&&handleAdd()}
        placeholder={isSubflow?'Subflow name…':'Group name…'}
        style={{
          width:'100%', padding:'5px 8px', marginBottom:8,
          background:'var(--surface)', color:'var(--text)',
          border:'1px solid var(--border2)', borderRadius:4,
          fontSize:12, fontFamily:'var(--font-ui)', outline:'none',
        }}
      />
      <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginBottom:8 }}>
        {PRESET_COLORS.map(c=>(
          <button key={c.name} title={c.name} onClick={()=>setColor(c)} style={{
            width:18, height:18, borderRadius:3, background:c.bg, padding:0, cursor:'pointer',
            border:`2px solid ${color.border===c.border?'white':c.border}`,
            boxShadow:color.border===c.border?`0 0 0 2px ${c.border}`:'none',
            transition:'all 0.12s',
          }}/>
        ))}
      </div>
      {/* preview */}
      <div style={{
        height:22, borderRadius:4, marginBottom:8,
        background:color.bg,
        border:`${isSubflow?'2px solid':'1.5px dashed'} ${color.border}`,
        display:'flex', alignItems:'center', paddingLeft:8,
      }}>
        <span style={{ fontSize:9, color:color.label, fontFamily:'var(--font-mono)', fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase' }}>
          {name||'Preview'}
        </span>
      </div>
      <button onClick={handleAdd} style={{
        width:'100%', padding:'5px 0',
        background:'var(--magenta)', color:'white',
        border:'none', borderRadius:4,
        fontSize:11, cursor:'pointer', fontFamily:'var(--font-ui)', fontWeight:500,
      }}>Add {isSubflow?'Subflow':'Group'}</button>
    </div>
  )
}

/* ── main palette ─────────────────────────────────────────── */
export default function NodePalette({ onAddNode, selectedSubflowId }) {
  // track which sections are open (all open by default)
  const [open, setOpen] = useState({
    ingestion:  true,
    processing: true,
    output:     true,
    groups:     false,
    subflows:   false,
    subflow_nodes: false,
  })

  const toggle = key => setOpen(o => ({ ...o, [key]: !o[key] }))

  const nodeCounts = Object.fromEntries(
    GROUP_ORDER.map(g => [g, REGISTRY.filter(n=>n.group===g).length])
  )

  return (
    <div style={{
      width:210, background:'var(--surface)',
      borderRight:'1px solid var(--border2)',
      overflowY:'auto', display:'flex', flexDirection:'column', flexShrink:0,
    }}>
      {/* ── header ── */}
      <div style={{
        padding:'10px 14px 8px',
        fontSize:9, fontWeight:700, letterSpacing:'0.1em',
        textTransform:'uppercase', color:'var(--muted)',
        fontFamily:'var(--font-mono)', borderBottom:'1px solid var(--border)',
        flexShrink:0,
      }}>Node Palette</div>

      {/* ── node sections ── */}
      {GROUP_ORDER.map(g => {
        const nodes = REGISTRY.filter(n => n.group === g)
        if (!nodes.length) return null
        const meta  = GROUP_META[g]
        const isOpen = open[g]
        return (
          <div key={g} style={{ borderBottom:'1px solid var(--border)' }}>
            <SectionHeader
              label={meta.label} color={meta.dot}
              open={isOpen} onToggle={()=>toggle(g)}
              count={nodes.length}
            />
            {isOpen && nodes.map(def=>(
              <NodeBtn key={def.id} def={def} onAddNode={onAddNode}/>
            ))}
          </div>
        )
      })}

      {/* ── "Add inside subflow" section — only shown when a subflow is selected ── */}
      {selectedSubflowId && (
        <div style={{ borderBottom:'1px solid var(--border)', background:'rgba(226,0,116,0.05)' }}>
          <SectionHeader
            label="→ Inside subflow" color="#E20074"
            open={open.subflow_nodes} onToggle={()=>toggle('subflow_nodes')}
            count={REGISTRY.length}
          />
          {open.subflow_nodes && (
            <>
              <div style={{ padding:'2px 14px 5px', fontSize:9, color:'var(--magenta)', fontFamily:'var(--font-mono)' }}>
                drops into selected subflow
              </div>
              {REGISTRY.map(def=>(
                <NodeBtn key={def.id} def={def} onAddNode={onAddNode} parentId={selectedSubflowId}/>
              ))}
            </>
          )}
        </div>
      )}

      {/* ── groups ── */}
      <div style={{ borderBottom:'1px solid var(--border)' }}>
        <SectionHeader
          label="Groups" color="#888"
          open={open.groups} onToggle={()=>toggle('groups')}
        />
        {open.groups && <GroupCreator onAddNode={onAddNode} isSubflow={false}/>}
      </div>

      {/* ── subflows ── */}
      <div>
        <SectionHeader
          label="Subflows" color="#E20074"
          open={open.subflows} onToggle={()=>toggle('subflows')}
        />
        {open.subflows && (
          <>
            <div style={{ padding:'2px 14px 5px', fontSize:9, color:'var(--muted)', fontFamily:'var(--font-mono)', lineHeight:1.5 }}>
              A subflow is a parent node.<br/>Drag child nodes inside it.
            </div>
            <GroupCreator onAddNode={onAddNode} isSubflow={true}/>
          </>
        )}
      </div>
    </div>
  )
}
