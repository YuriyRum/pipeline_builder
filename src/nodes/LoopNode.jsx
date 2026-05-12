/**
 * LOOP NODE
 * ─────────
 * Iterates over an array from input and executes child pipeline nodes
 * once per item, collecting results.
 *
 * - If the input has an array field (rows, items, lines, data, or the input itself)
 *   it iterates that array.
 * - Each iteration runs the child nodes (nodes with parentId === this node's id)
 *   as a mini sub-pipeline, passing { item, index, total } as input.
 * - After all iterations, emits { results: [], errors: [], total, succeeded, failed }.
 *
 * isControlNode: true — the execution engine gives it special treatment.
 */
import { memo, useState } from 'react'
import { Handle, Position, useReactFlow, NodeResizer } from 'reactflow'
import { ToggleSwitch, ControlRow, MiniSelect } from './NodeCard.jsx'
import NodeDocsDialog   from './NodeDocsDialog.jsx'
import NodeResultDialog from './NodeResultDialog.jsx'

const STATUS_COLORS = { idle:'var(--muted)', running:'#9B59B6', done:'#9B59B6', error:'var(--red)', skipped:'#555' }

function DocBtn({ onClick }) {
  const [h,setH] = useState(false)
  return (
    <button title="Documentation"
      onMouseDown={e=>e.stopPropagation()}
      onClick={e=>{e.stopPropagation();e.preventDefault();onClick()}}
      onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
      style={{
        width:20,height:20,padding:0,
        background:h?'#9B59B6':'rgba(155,89,182,0.18)',
        border:'1.5px solid #9B59B6',borderRadius:5,
        color:'#D7AAFF',fontSize:12,fontWeight:900,
        cursor:'pointer',lineHeight:1,fontFamily:'monospace',
        display:'inline-flex',alignItems:'center',justifyContent:'center',
      }}>?</button>
  )
}

function LoopNode({ id, data, selected }) {
  const { setNodes, getNodes } = useReactFlow()
  const [showDocs,   setShowDocs]   = useState(false)
  const [showResult, setShowResult] = useState(false)

  const {
    status='idle', lastOutput, _lastRunOutput,
    buildMode, onDelete, controls=[],
    _loopProgress,
  } = data

  const arrayField  = controls.find(c=>c.key==='arrayField')?.val  ?? 'auto'
  const maxIter     = controls.find(c=>c.key==='maxIter')?.val     ?? '100'
  const stopOnError = controls.find(c=>c.key==='stopOnError')?.val ?? false

  const updateControl = (key, val) => {
    setNodes(nds=>nds.map(n=>n.id===id?{
      ...n,data:{...n.data,controls:n.data.controls.map(c=>c.key===key?{...c,val}:c)}
    }:n))
  }

  const childCount = getNodes().filter(n=>n.parentId===id).length

  const border =
    selected             ? 'rgba(155,89,182,0.9)'
    : status==='running' ? '#9B59B6'
    : status==='done'    ? '#9B59B6'
    : status==='error'   ? 'var(--red)'
    : 'rgba(155,89,182,0.4)'

  const prog = _loopProgress // { current, total } during run

  return (
    <>
      <div style={{
        background:'var(--surface)',
        border:`1.5px solid ${border}`,
        borderRadius:'var(--r)',
        minWidth:210, width:'100%', height:'100%',
        display:'flex',flexDirection:'column',
        position:'relative',fontFamily:'var(--font-ui)',
        boxShadow:selected?'0 0 0 2px rgba(155,89,182,0.3)':'0 4px 20px rgba(0,0,0,0.4)',
      }}>
        {buildMode && (
          <NodeResizer isVisible={selected} minWidth={210} minHeight={160}
            lineStyle={{stroke:'#9B59B6',strokeWidth:1,strokeDasharray:'4 3'}}
            handleStyle={{width:10,height:10,background:'var(--surface)',border:'2px solid #9B59B6',borderRadius:2}}/>
        )}
        {buildMode && (
          <button onClick={e=>{e.stopPropagation();onDelete(id)}} style={{
            position:'absolute',top:-10,right:-10,zIndex:20,
            width:20,height:20,background:'var(--red)',color:'white',
            border:'none',borderRadius:'50%',fontSize:14,cursor:'pointer',
            display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,padding:0,
          }}>×</button>
        )}

        <Handle type="target" position={Position.Left}  style={{left:-6,zIndex:10}}/>
        <Handle type="target" position={Position.Top}   style={{top:-6, zIndex:10}}/>
        <Handle type="source" position={Position.Right}  style={{right:-6,zIndex:10}}/>
        <Handle type="source" position={Position.Bottom} style={{bottom:-6,zIndex:10}}/>

        {/* Header */}
        <div style={{
          display:'flex',alignItems:'center',gap:6,
          padding:'8px 8px 6px',
          borderBottom:'1px solid var(--border)',
          background:'rgba(155,89,182,0.06)',
          flexShrink:0,
        }}>
          <div style={{
            width:24,height:24,borderRadius:5,
            background:'rgba(155,89,182,0.2)',
            display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,flexShrink:0,
          }}>↺</div>
          <span style={{fontSize:12,fontWeight:600,color:'#9B59B6',flex:1}}>Loop</span>
          <span style={{fontSize:9,color:'var(--muted)',fontFamily:'var(--font-mono)'}}>
            {childCount} child{childCount!==1?'s':''}
          </span>
          <div style={{
            width:7,height:7,borderRadius:'50%',flexShrink:0,
            background:STATUS_COLORS[status]??'var(--muted)',
            boxShadow:status==='running'?'0 0 6px #9B59B6':'none',
          }}/>
          <DocBtn onClick={()=>setShowDocs(true)}/>
          {_lastRunOutput!=null && (
            <button title="View results" onMouseDown={e=>e.stopPropagation()}
              onClick={e=>{e.stopPropagation();setShowResult(true)}}
              style={{
                width:20,height:20,padding:0,
                background:'rgba(155,89,182,0.18)',border:'1.5px solid #9B59B6',
                borderRadius:5,color:'#D7AAFF',fontSize:11,fontWeight:700,
                cursor:'pointer',lineHeight:1,fontFamily:'monospace',
                display:'inline-flex',alignItems:'center',justifyContent:'center',
              }}>▤</button>
          )}
        </div>

        {/* Controls */}
        <div style={{padding:'8px 10px 10px',display:'flex',flexDirection:'column',gap:6,flex:1,overflowY:'auto'}}>
          <ControlRow label="Array field">
            <MiniSelect value={arrayField}
              opts={['auto','rows','items','lines','data','results']}
              onChange={v=>updateControl('arrayField',v)}/>
          </ControlRow>
          <ControlRow label="Max iterations">
            <MiniSelect value={maxIter} opts={['10','50','100','500','1000','unlimited']}
              onChange={v=>updateControl('maxIter',v)}/>
          </ControlRow>
          <ControlRow label="Stop on error">
            <ToggleSwitch checked={stopOnError} onChange={v=>updateControl('stopOnError',v)}/>
          </ControlRow>

          {/* Drop hint */}
          {childCount === 0 && (
            <div style={{
              marginTop:6,padding:'8px',
              border:'1px dashed rgba(155,89,182,0.4)',borderRadius:5,
              fontSize:10,color:'rgba(155,89,182,0.6)',textAlign:'center',
              fontFamily:'var(--font-mono)',
            }}>
              {buildMode?'Drop child nodes inside':'No child nodes'}
            </div>
          )}

          {/* Progress bar during run */}
          {prog && prog.total > 0 && (
            <div style={{marginTop:4}}>
              <div style={{
                height:3,background:'var(--border)',borderRadius:99,overflow:'hidden',
              }}>
                <div style={{
                  height:'100%',background:'#9B59B6',borderRadius:99,
                  width:`${Math.round((prog.current/prog.total)*100)}%`,
                  transition:'width 0.15s',
                }}/>
              </div>
              <div style={{fontSize:9,color:'var(--muted)',textAlign:'right',marginTop:2,fontFamily:'var(--font-mono)'}}>
                {prog.current}/{prog.total}
              </div>
            </div>
          )}
        </div>

        {lastOutput && (
          <div style={{
            padding:'3px 10px 5px',borderTop:'1px solid var(--border)',
            fontSize:10,fontFamily:'var(--font-mono)',color:'#9B59B6',
            whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',
          }}>↳ {lastOutput}</div>
        )}
      </div>

      {showDocs && (
        <NodeDocsDialog node={{
          title:'Loop',icon:'↺',
          doc:`Iterates over an array of items and executes child nodes once per item.\n\n## How it works\n1. Reads the input array (auto-detected or by field name)\n2. For each item, runs child nodes (added inside the loop via the palette) as a mini pipeline\n3. Collects all results into a results array\n4. Passes { results, errors, total, succeeded, failed } downstream\n\n## Child nodes\nDrop any pipeline node inside the Loop node. They receive { item, index, total } as input.\n\n## Controls\n- Array field: which field of the input to iterate (auto = detect automatically)\n- Max iterations: safety cap to prevent runaway loops\n- Stop on error: abort the entire loop if any iteration fails\n\n## Notes\nChild nodes execute sequentially per iteration.`,
          defaultControls: LoopNodeDef.defaultControls,
          inputType:'{ array }',outputType:'{ results[], errors[], total, succeeded, failed }',
        }} onHide={()=>setShowDocs(false)}/>
      )}
      {showResult && (
        <NodeResultDialog nodeTitle="Loop" resultType="stats"
          output={_lastRunOutput} status={status} onHide={()=>setShowResult(false)}/>
      )}
    </>
  )
}

export const LoopNodeDef = {
  id:'loop', title:'Loop', icon:'↺', iconBg:'rgba(155,89,182,0.2)',
  group:'control',
  doc:`Iterates over an array and runs child nodes for each item.\n\nDrop nodes inside to define the per-item logic. Output collects all results.`,
  inputType:'{ array }', outputType:'{ results[], errors[], total }', resultType:'stats',
  isControlNode: true,
  isLoopNode: true,
  defaultControls:[
    {type:'select',label:'Array field', key:'arrayField',  val:'auto',  opts:['auto','rows','items','lines','data','results']},
    {type:'select',label:'Max iter',    key:'maxIter',     val:'100',   opts:['10','50','100','500','1000','unlimited']},
    {type:'toggle',label:'Stop on error',key:'stopOnError',val:false},
  ],
  // run() is implemented in the execution engine (it needs getNodes, setNodeField etc.)
  // We export a stub that the engine replaces with the real implementation
  async run(nodeData, ctx) {
    // Engine intercepts loop nodes before calling run()
    // This is a fallback if called directly
    ctx.log('Loop node — engine handles iteration')
    return { ok:true, message:'loop (engine-handled)', output: ctx.input }
  },
}

export default memo(LoopNode)
