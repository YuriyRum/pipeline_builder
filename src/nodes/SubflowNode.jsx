/**
 * SubflowNode
 * ───────────
 * A ReactFlow parent node that acts as a self-contained sub-pipeline.
 * Child pipeline nodes can be dragged inside it; they get parentId set
 * so they move with the subflow and stay within its bounds.
 *
 * Visual difference from GroupNode:
 *  - Solid (not dashed) border — it IS a node, not just a background label
 *  - Has source/target handles so it can be connected in the outer flow
 *  - Header with title + action buttons
 *  - Resizable in build mode
 */
import { memo, useState, useCallback } from 'react'
import { Handle, Position, useReactFlow, NodeResizer } from 'reactflow'

const PRESET_COLORS = [
  { bg:'rgba(226,0,116,0.10)', border:'#E20074', label:'#E20074', name:'Magenta' },
  { bg:'rgba(74,144,217,0.10)',border:'#4A90D9', label:'#4A90D9', name:'Blue'    },
  { bg:'rgba(29,158,117,0.10)',border:'#1D9E75', label:'#1D9E75', name:'Teal'    },
  { bg:'rgba(245,166,35,0.10)',border:'#F5A623', label:'#F5A623', name:'Amber'   },
  { bg:'rgba(155,89,182,0.10)',border:'#9B59B6', label:'#9B59B6', name:'Purple'  },
  { bg:'rgba(231,76,60,0.10)', border:'#E74C3C', label:'#E74C3C', name:'Red'     },
]

function SubflowNode({ id, data, selected }) {
  const { setNodes, getNodes } = useReactFlow()
  const { label='Subflow', border='#E20074', bg='rgba(226,0,116,0.10)',
          labelColor='#E20074', buildMode, onDelete } = data

  const [editing, setEditing]   = useState(false)
  const [draft,   setDraft]     = useState({ label, color: PRESET_COLORS[0] })

  const currentColor = PRESET_COLORS.find(c => c.border === border) ?? PRESET_COLORS[0]

  const openEdit = e => {
    e.stopPropagation()
    setDraft({ label, color: currentColor })
    setEditing(true)
  }

  const commitEdit = useCallback(() => {
    setNodes(nds => nds.map(n => n.id === id ? {
      ...n,
      data: { ...n.data,
        label:      draft.label || 'Subflow',
        bg:         draft.color.bg,
        border:     draft.color.border,
        labelColor: draft.color.label,
      }
    } : n))
    setEditing(false)
  }, [id, draft, setNodes])

  // Count children
  const childCount = getNodes().filter(n => n.parentId === id).length

  const borderStyle = `2px solid ${border}`

  return (
    <div style={{
      width:'100%', height:'100%',
      background: bg,
      border: selected ? `2px solid white` : borderStyle,
      borderRadius: 10,
      display:'flex', flexDirection:'column',
      overflow:'hidden',
      boxShadow: selected ? `0 0 0 2px ${border}` : `0 4px 20px rgba(0,0,0,0.3)`,
      transition:'border 0.15s, box-shadow 0.15s',
    }}>

      {buildMode && (
        <NodeResizer
          isVisible={selected}
          minWidth={240}
          minHeight={160}
          lineStyle={{ stroke: border, strokeWidth:1.5, strokeDasharray:'4 3' }}
          handleStyle={{
            width:10, height:10,
            background:'var(--surface)', border:`2px solid ${border}`, borderRadius:2,
          }}
        />
      )}

      {/* Handles — connect the subflow as a whole to outer nodes */}
      <Handle type="target" position={Position.Left}   style={{ left:-6, zIndex:10 }}/>
      <Handle type="target" position={Position.Top}    style={{ top:-6,  zIndex:10 }}/>
      <Handle type="source" position={Position.Right}  style={{ right:-6,zIndex:10 }}/>
      <Handle type="source" position={Position.Bottom} style={{ bottom:-6,zIndex:10 }}/>

      {/* Header bar */}
      <div style={{
        display:'flex', alignItems:'center', gap:6,
        padding:'6px 8px',
        background:'rgba(0,0,0,0.25)',
        borderBottom:`1px solid ${border}`,
        flexShrink:0,
      }}>
        <div style={{
          width:18, height:18, borderRadius:4,
          background: border,
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:11, flexShrink:0,
        }}>⬡</div>

        <span style={{
          flex:1, fontSize:11, fontWeight:600, color: labelColor,
          fontFamily:'var(--font-mono)', letterSpacing:'0.04em',
          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
        }}>{label}</span>

        <span style={{ fontSize:9, color:'rgba(255,255,255,0.4)', flexShrink:0 }}>
          {childCount} node{childCount!==1?'s':''}
        </span>

        {buildMode && !editing && (
          <>
            <button onClick={openEdit} className="nodrag" title="Edit subflow" style={{
              width:18, height:18, background:'rgba(255,255,255,0.1)',
              border:`1px solid ${border}`, borderRadius:3,
              color:labelColor, fontSize:11, cursor:'pointer',
              display:'flex', alignItems:'center', justifyContent:'center',
              padding:0, flexShrink:0,
            }}>✎</button>
            <button onClick={e=>{e.stopPropagation();onDelete(id)}} className="nodrag" style={{
              width:18, height:18, background:'var(--red)',
              border:'none', borderRadius:3, color:'white',
              fontSize:13, cursor:'pointer',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontWeight:700, padding:0, flexShrink:0,
            }}>×</button>
          </>
        )}
      </div>

      {/* Drop zone body */}
      <div style={{
        flex:1, display:'flex', alignItems:'center', justifyContent:'center',
        position:'relative', minHeight:80,
      }}>
        {childCount === 0 && (
          <div style={{
            fontSize:10, color:'rgba(255,255,255,0.2)',
            fontFamily:'var(--font-mono)', textAlign:'center',
            pointerEvents:'none', userSelect:'none',
          }}>
            {buildMode ? 'Drag nodes here or use palette' : 'Empty subflow'}
          </div>
        )}
      </div>

      {/* Inline editor */}
      {editing && (
        <div className="nodrag nopan" onClick={e=>e.stopPropagation()} style={{
          position:'absolute', top:36, left:8, right:8, zIndex:200,
          background:'var(--surface)', border:`1px solid ${border}`,
          borderRadius:8, padding:12,
          boxShadow:'0 8px 30px rgba(0,0,0,0.7)',
        }}>
          <div style={{ fontSize:9, color:'var(--muted)', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.06em', fontFamily:'var(--font-mono)' }}>Title</div>
          <input autoFocus value={draft.label}
            onChange={e=>setDraft(d=>({...d,label:e.target.value}))}
            onKeyDown={e=>{if(e.key==='Enter')commitEdit();if(e.key==='Escape')setEditing(false)}}
            style={{
              width:'100%', padding:'5px 8px', marginBottom:8,
              background:'var(--surface2)', color:'var(--text)',
              border:'1px solid var(--border2)', borderRadius:4,
              fontSize:12, fontFamily:'var(--font-ui)', outline:'none',
            }}/>
          <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginBottom:10 }}>
            {PRESET_COLORS.map(c=>(
              <button key={c.name} title={c.name} onClick={()=>setDraft(d=>({...d,color:c}))}
                style={{
                  width:20, height:20, borderRadius:4, background:c.bg,
                  cursor:'pointer', padding:0,
                  border:`2px solid ${draft.color.border===c.border?'white':c.border}`,
                  boxShadow:draft.color.border===c.border?`0 0 0 2px ${c.border}`:'none',
                }}/>
            ))}
          </div>
          <div style={{ display:'flex', gap:6 }}>
            <button onClick={commitEdit} style={{
              flex:1, padding:'5px 0', background:border, color:'white',
              border:'none', borderRadius:4, fontSize:12, cursor:'pointer', fontFamily:'var(--font-ui)',
            }}>Apply</button>
            <button onClick={()=>setEditing(false)} style={{
              flex:1, padding:'5px 0', background:'var(--surface2)', color:'var(--muted)',
              border:'1px solid var(--border2)', borderRadius:4, fontSize:12, cursor:'pointer', fontFamily:'var(--font-ui)',
            }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default memo(SubflowNode)
