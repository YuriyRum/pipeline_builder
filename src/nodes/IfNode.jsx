/**
 * IF NODE
 * ────────
 * Evaluates a condition against its input and routes execution to either
 * the "true" branch or the "false" branch.
 *
 * run() returns { ok: true, branch: 'true'|'false', output, message }
 *
 * The execution engine reads result.branch and only executes downstream
 * nodes reachable via the matching edge label.
 *
 * Edge convention: connect the If node's RIGHT handle to the "true" node
 * and the BOTTOM handle to the "false" node (or any two targets; the engine
 * uses edge label / order to distinguish them).  The palette adds edges
 * labelled "true" and "false" automatically — but you can also wire manually.
 *
 * Output: { branch, value, input }
 */
import { memo, useState } from 'react'
import { Handle, Position, useReactFlow, NodeResizer } from 'reactflow'
import { ToggleSwitch, ControlRow, MiniSelect } from './NodeCard.jsx'
import NodeDocsDialog   from './NodeDocsDialog.jsx'
import NodeResultDialog from './NodeResultDialog.jsx'

const STATUS_COLORS = { idle:'var(--muted)', running:'#F5A623', done:'#4A90D9', error:'var(--red)', skipped:'#555' }

function DocBtn({ onClick }) {
  const [h,setH] = useState(false)
  return (
    <button title="Documentation"
      onMouseDown={e=>e.stopPropagation()}
      onClick={e=>{e.stopPropagation();e.preventDefault();onClick()}}
      onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
      style={{
        width:20,height:20,padding:0,
        background:h?'#E20074':'rgba(226,0,116,0.18)',
        border:'1.5px solid #E20074', borderRadius:5,
        color:'#FF80C8', fontSize:12, fontWeight:900,
        cursor:'pointer', lineHeight:1, fontFamily:'monospace',
        display:'inline-flex', alignItems:'center', justifyContent:'center',
      }}>?</button>
  )
}

function IfNode({ id, data, selected }) {
  const { setNodes } = useReactFlow()
  const [showDocs, setShowDocs] = useState(false)
  const [showResult, setShowResult] = useState(false)

  const {
    status='idle', lastOutput, _lastRunOutput,
    buildMode, onDelete,
    controls=[],
  } = data

  const condition = controls.find(c=>c.key==='condition')?.val ?? 'truthy'
  const field     = controls.find(c=>c.key==='field')?.val     ?? 'value'
  const negate    = controls.find(c=>c.key==='negate')?.val    ?? false

  const updateControl = (key, val) => {
    setNodes(nds=>nds.map(n=>n.id===id?{
      ...n,data:{...n.data,controls:n.data.controls.map(c=>c.key===key?{...c,val}:c)}
    }:n))
  }

  const border =
    selected          ? '#FFAB00'
    : status==='running' ? '#F5A623'
    : status==='done'    ? '#4A90D9'
    : status==='error'   ? 'var(--red)'
    : 'rgba(245,166,35,0.4)'

  return (
    <>
      <div style={{
        background:'var(--surface)',
        border:`1.5px solid ${border}`,
        borderRadius:'var(--r)',
        minWidth:190, width:'100%', height:'100%',
        display:'flex', flexDirection:'column',
        position:'relative', fontFamily:'var(--font-ui)',
        boxShadow: selected?'0 0 0 2px rgba(245,166,35,0.3)':'0 4px 20px rgba(0,0,0,0.4)',
        transition:'border-color 0.2s',
      }}>
        {buildMode && (
          <NodeResizer isVisible={selected} minWidth={190} minHeight={100}
            lineStyle={{stroke:'#F5A623',strokeWidth:1,strokeDasharray:'4 3'}}
            handleStyle={{width:10,height:10,background:'var(--surface)',border:'2px solid #F5A623',borderRadius:2}}/>
        )}
        {buildMode && (
          <button onClick={e=>{e.stopPropagation();onDelete(id)}} style={{
            position:'absolute',top:-10,right:-10,zIndex:20,
            width:20,height:20,background:'var(--red)',color:'white',
            border:'none',borderRadius:'50%',fontSize:14,cursor:'pointer',
            display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,padding:0,
          }}>×</button>
        )}

        {/* Input handle */}
        <Handle type="target" position={Position.Left}  style={{left:-6}}/>
        <Handle type="target" position={Position.Top}   style={{top:-6}}/>

        {/* Output handles — right=true, bottom=false */}
        <Handle type="source" position={Position.Right}  id="true"   style={{right:-6,top:'35%'}}/>
        <Handle type="source" position={Position.Bottom} id="false"  style={{bottom:-6}}/>

        {/* Header */}
        <div style={{
          display:'flex',alignItems:'center',gap:6,
          padding:'8px 8px 6px',
          borderBottom:'1px solid var(--border)',
          background:'rgba(245,166,35,0.06)',
          flexShrink:0,
        }}>
          <div style={{
            width:24,height:24,borderRadius:5,
            background:'rgba(245,166,35,0.2)',
            display:'flex',alignItems:'center',justifyContent:'center',
            fontSize:13,flexShrink:0,
          }}>⎇</div>
          <span style={{fontSize:12,fontWeight:600,color:'#F5A623',flex:1}}>If / Branch</span>
          <div style={{
            width:7,height:7,borderRadius:'50%',
            background:STATUS_COLORS[status]??'var(--muted)',
            boxShadow:status==='running'?'0 0 6px #F5A623':'none',
          }}/>
          <DocBtn onClick={()=>setShowDocs(true)}/>
          {_lastRunOutput!=null && (
            <button title="View result" onMouseDown={e=>e.stopPropagation()}
              onClick={e=>{e.stopPropagation();setShowResult(true)}}
              style={{
                width:20,height:20,padding:0,
                background:'rgba(74,144,217,0.18)',border:'1.5px solid #4A90D9',
                borderRadius:5,color:'#7BB8F5',fontSize:11,fontWeight:700,
                cursor:'pointer',lineHeight:1,fontFamily:'monospace',
                display:'inline-flex',alignItems:'center',justifyContent:'center',
              }}>▤</button>
          )}
        </div>

        {/* Controls */}
        <div style={{padding:'8px 10px 10px',display:'flex',flexDirection:'column',gap:6,flex:1,overflowY:'auto'}}>
          <ControlRow label="Field">
            <MiniSelect value={field} opts={['value','id','status','count','error']}
              onChange={v=>updateControl('field',v)}/>
          </ControlRow>
          <ControlRow label="Condition">
            <MiniSelect value={condition}
              opts={['truthy','=== true','!== null','> 0','=== 0','has error','custom']}
              onChange={v=>updateControl('condition',v)}/>
          </ControlRow>
          <ControlRow label="Negate (NOT)">
            <ToggleSwitch checked={negate} onChange={v=>updateControl('negate',v)}/>
          </ControlRow>

          {/* Branch labels */}
          <div style={{marginTop:4,display:'flex',flexDirection:'column',gap:3}}>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:10,fontFamily:'var(--font-mono)'}}>
              <span style={{color:'#4DD6A8'}}>→ true  </span>
              <span style={{color:'var(--muted)',fontSize:9}}>right handle</span>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:10,fontFamily:'var(--font-mono)'}}>
              <span style={{color:'var(--red)'}}>→ false </span>
              <span style={{color:'var(--muted)',fontSize:9}}>bottom handle</span>
            </div>
          </div>
        </div>

        {lastOutput && (
          <div style={{
            padding:'3px 10px 5px',borderTop:'1px solid var(--border)',
            fontSize:10,fontFamily:'var(--font-mono)',
            color:status==='error'?'var(--red)':'#F5A623',
            whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',
          }}>↳ {lastOutput}</div>
        )}
      </div>

      {showDocs && (
        <NodeDocsDialog node={{
          title:'If / Branch', icon:'⎇',
          doc:`Routes execution to one of two branches based on a condition evaluated against the input data.\n\n## Branch handles\n- Right handle → "true" branch\n- Bottom handle → "false" branch\n\nNodes connected to the un-taken branch are automatically marked as **skipped** (optional) — they don't block the pipeline from completing.\n\n## Conditions\n- truthy: any value that is truthy in JS\n- === true: strict boolean check\n- !== null: value must not be null or undefined\n- > 0: numeric check\n- has error: checks if the input has an error field\n\n## Notes\nConnect multiple nodes to each branch. The execution engine follows only the winning branch's edges.`,
          defaultControls: IfNodeDef.defaultControls,
          inputType: 'any', outputType: '{ branch, value }',
        }} onHide={()=>setShowDocs(false)}/>
      )}
      {showResult && (
        <NodeResultDialog nodeTitle="If / Branch" resultType="stats"
          output={_lastRunOutput} status={status} onHide={()=>setShowResult(false)}/>
      )}
    </>
  )
}

export const IfNodeDef = {
  id: 'if-branch', title: 'If / Branch', icon: '⎇', iconBg: 'rgba(245,166,35,0.2)',
  group: 'control',
  doc: `Routes execution to one of two branches based on a condition.\n\n## Branch handles\n- Right handle → true branch\n- Bottom handle → false branch\n\nNodes on the un-taken branch are marked skipped (optional) automatically.\n\n## Conditions\ntruthy, === true, !== null, > 0, === 0, has error, custom`,
  inputType: 'any', outputType: '{ branch, value }', resultType: 'stats',
  isControlNode: true,
  defaultControls: [
    { type:'select', label:'Field',       key:'field',     val:'value',   opts:['value','id','status','count','error'] },
    { type:'select', label:'Condition',   key:'condition', val:'truthy',  opts:['truthy','=== true','!== null','> 0','=== 0','has error','custom'] },
    { type:'toggle', label:'Negate (NOT)',key:'negate',    val:false },
  ],
  async run(nodeData, ctx) {
    const input     = ctx.input
    const field     = nodeData.controls.find(c=>c.key==='field')?.val     ?? 'value'
    const condition = nodeData.controls.find(c=>c.key==='condition')?.val ?? 'truthy'
    const negate    = nodeData.controls.find(c=>c.key==='negate')?.val    ?? false

    const raw = input?.[field] ?? input

    let result = false
    switch (condition) {
      case 'truthy':    result = Boolean(raw); break
      case '=== true':  result = raw === true;  break
      case '!== null':  result = raw != null;   break
      case '> 0':       result = Number(raw) > 0; break
      case '=== 0':     result = Number(raw) === 0; break
      case 'has error': result = Boolean(input?.error || input?.ok === false); break
      default:          result = Boolean(raw)
    }
    if (negate) result = !result

    const branch = result ? 'true' : 'false'
    ctx.log(`Condition "${field} ${condition}" → ${branch}${negate?' (negated)':''}`)

    return {
      ok:     true,
      branch,
      message: `→ ${branch} branch`,
      output: { branch, value: raw, input },
    }
  },
}

export default memo(IfNode)
