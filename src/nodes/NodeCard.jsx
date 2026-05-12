/**
 * NodeCard — shared card shell for every pipeline node.
 *
 * Header row (right side):
 *   ?  → opens NodeDocsDialog   (always shown — no PrimeIcons dependency)
 *   ▤  → opens NodeResultDialog (shown after run)
 */
import { memo, useCallback, useState } from 'react'
import { Handle, Position, useReactFlow } from 'reactflow'
import NodeDocsDialog   from '../NodeDocsDialog.jsx'
import NodeResultDialog from '../NodeResultDialog.jsx'

const STATUS_COLORS = {
  idle:    'var(--muted)',
  running: 'var(--magenta)',
  done:    'var(--magenta-dark)',
  error:   'var(--red)',
}
const STATUS_LABELS = { idle:'', running:'running', done:'done', error:'error' }

/* ── shared primitives exported for node bodies ─────────── */
export function ToggleSwitch({ checked, onChange }) {
  return (
    <div onClick={() => onChange(!checked)} style={{
      width:32, height:18, borderRadius:9, cursor:'pointer',
      background: checked ? 'var(--magenta)' : 'var(--border2)',
      position:'relative', transition:'background 0.2s', flexShrink:0,
    }}>
      <div style={{
        width:12, height:12, borderRadius:'50%', background:'white',
        position:'absolute', top:3, left: checked ? 17 : 3,
        transition:'left 0.2s', boxShadow:'0 1px 4px rgba(0,0,0,0.4)',
      }}/>
    </div>
  )
}
export function ControlRow({ label, children }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
      <span style={{ fontSize:12, color:'var(--muted)', flexShrink:0 }}>{label}</span>
      {children}
    </div>
  )
}
export function MiniSelect({ value, opts, onChange }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={{
      fontSize:12, background:'var(--surface2)', color:'var(--text)',
      border:'1px solid var(--border2)', borderRadius:5, padding:'2px 6px',
      cursor:'pointer', fontFamily:'var(--font-ui)', maxWidth:110,
    }}>
      {opts.map(o => <option key={o}>{o}</option>)}
    </select>
  )
}
export function MiniTextarea({ value, onChange, rows=3, placeholder }) {
  return (
    <textarea value={value} onChange={e => onChange(e.target.value)}
      rows={rows} placeholder={placeholder}
      style={{
        width:'100%', fontSize:11,
        background:'var(--surface2)', color:'var(--text)',
        border:'1px solid var(--border2)', borderRadius:5,
        padding:'4px 6px', fontFamily:'var(--font-mono)',
        resize:'none', lineHeight:1.5,
      }}/>
  )
}

function DefaultControls({ controls, onUpdate }) {
  return controls.map(ctrl => {
    const { type, label, key, val, opts } = ctrl
    if (type === 'toggle')   return (
      <ControlRow key={key} label={label}>
        <ToggleSwitch checked={val} onChange={v => onUpdate(key, v)}/>
      </ControlRow>
    )
    if (type === 'checkbox') return (
      <label key={key} style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer' }}>
        <input type="checkbox" checked={val} onChange={e => onUpdate(key, e.target.checked)}
          style={{ width:13, height:13, accentColor:'var(--magenta)', cursor:'pointer' }}/>
        <span style={{ fontSize:12, color:'var(--muted)' }}>{label}</span>
      </label>
    )
    if (type === 'select')   return (
      <ControlRow key={key} label={label}>
        <MiniSelect value={val} opts={opts} onChange={v => onUpdate(key, v)}/>
      </ControlRow>
    )
    return null
  })
}

/* ── plain-text header button with tooltip ──────────────── */
function HeaderBtn({ label, tooltip, onClick, disabled, active }) {
  const [tip, setTip] = useState(false)

  // Docs button (?) always magenta so it's clearly visible
  // Result button (▤) magenta when result available, muted otherwise
  const isDoc = label === '?'
  const col = disabled
    ? 'rgba(255,255,255,0.25)'
    : isDoc
    ? 'var(--magenta-light)'
    : active ? 'var(--magenta-light)' : 'var(--muted)'
  const bg = isDoc
    ? 'rgba(226,0,116,0.12)'
    : active ? 'rgba(226,0,116,0.12)' : 'var(--surface2)'
  const border = isDoc
    ? '1px solid rgba(226,0,116,0.5)'
    : `1px solid ${active ? 'var(--magenta)' : 'var(--border2)'}`

  return (
    <div style={{ position:'relative', flexShrink:0 }}>
      <button
        onClick={e => { e.stopPropagation(); if (!disabled) onClick() }}
        onMouseEnter={() => setTip(true)}
        onMouseLeave={() => setTip(false)}
        style={{
          width:22, height:22, background:bg, border,
          borderRadius:5, cursor: disabled ? 'default' : 'pointer',
          display:'flex', alignItems:'center', justifyContent:'center',
          color:col, fontSize:13, fontWeight:700, padding:0,
          fontFamily:'monospace', lineHeight:1, transition:'all 0.15s',
          userSelect:'none',
        }}
      >{label}</button>
      {tip && (
        <div style={{
          position:'absolute', bottom:'calc(100% + 6px)', left:'50%',
          transform:'translateX(-50%)',
          background:'var(--surface3)', border:'1px solid var(--border2)',
          borderRadius:4, padding:'3px 8px',
          fontSize:10, color:'var(--text)', whiteSpace:'nowrap',
          pointerEvents:'none', zIndex:9999,
          boxShadow:'0 4px 14px rgba(0,0,0,0.6)',
        }}>{tooltip}{disabled ? ' (run first)' : ''}</div>
      )}
    </div>
  )
}

/* ── main card ──────────────────────────────────────────── */
function NodeCard({ id, data, selected }) {
  const { setNodes } = useReactFlow()
  const [showDocs,   setShowDocs]   = useState(false)
  const [showResult, setShowResult] = useState(false)

  const {
    title, icon, iconBg,
    controls = [], status = 'idle',
    buildMode, onDelete,
    renderBody,
    lastOutput,
    _lastRunOutput,
    _doc, _resultType, _inputType, _outputType, _defaultControls,
  } = data

  const updateControl = useCallback((key, val) => {
    setNodes(nds => nds.map(n =>
      n.id === id
        ? { ...n, data: { ...n.data, controls: n.data.controls.map(c => c.key===key ? {...c,val} : c) } }
        : n
    ))
  }, [id, setNodes])

  const borderColor = selected
    ? 'var(--magenta-light)'
    : status === 'running' ? 'var(--magenta)'
    : status === 'done'    ? 'var(--magenta-dark)'
    : status === 'error'   ? 'var(--red)'
    : 'var(--border2)'

  const shadow = selected
    ? '0 0 0 2px rgba(226,0,116,0.25)'
    : status === 'running' ? '0 0 0 3px rgba(226,0,116,0.2)'
    : status === 'error'   ? '0 0 0 3px rgba(224,82,82,0.2)'
    : '0 4px 20px rgba(0,0,0,0.4)'

  const hasDocs   = Boolean(_doc)
  const hasResult = Boolean(_resultType) && _resultType !== 'none'
  const hasOutput = _lastRunOutput !== undefined && _lastRunOutput !== null

  const defForDialog = {
    title, icon,
    doc:             _doc,
    inputType:       _inputType,
    outputType:      _outputType,
    resultType:      _resultType,
    defaultControls: _defaultControls ?? controls,
    group:           data.group,
  }

  return (
    <>
      <div style={{
        background:'var(--surface)',
        border:`1.5px solid ${borderColor}`,
        borderRadius:'var(--r)',
        minWidth:200,
        boxShadow:shadow,
        transition:'border-color 0.2s, box-shadow 0.2s',
        position:'relative',
      }}>
        {/* delete button */}
        {buildMode && (
          <button onClick={e => { e.stopPropagation(); onDelete(id) }} style={{
            position:'absolute', top:-10, right:-10,
            width:20, height:20,
            background:'var(--red)', color:'white',
            border:'none', borderRadius:'50%',
            fontSize:14, cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontWeight:700, zIndex:10, padding:0,
            boxShadow:'0 2px 8px rgba(0,0,0,0.5)',
          }}>×</button>
        )}

        <Handle type="target" position={Position.Left}   style={{left:-6}}/>
        <Handle type="target" position={Position.Top}    style={{top:-6}}/>
        <Handle type="source" position={Position.Right}  style={{right:-6}}/>
        <Handle type="source" position={Position.Bottom} style={{bottom:-6}}/>

        {/* header */}
        <div style={{
          display:'flex', alignItems:'center', gap:6,
          padding:'9px 10px 7px',
          borderBottom:'1px solid var(--border)',
        }}>
          <div style={{
            width:26, height:26, borderRadius:6, background:iconBg,
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:14, flexShrink:0,
          }}>{icon}</div>

          <span style={{
            fontSize:12, fontWeight:500, color:'var(--text)',
            flex:1, minWidth:0, overflow:'hidden',
            textOverflow:'ellipsis', whiteSpace:'nowrap',
          }}>{title}</span>

          {/* status */}
          <div style={{ display:'flex', alignItems:'center', gap:4, flexShrink:0 }}>
            {STATUS_LABELS[status] && (
              <span style={{ fontSize:9, color:STATUS_COLORS[status], fontFamily:'var(--font-mono)' }}>
                {STATUS_LABELS[status]}
              </span>
            )}
            <div style={{
              width:7, height:7, borderRadius:'50%',
              background:STATUS_COLORS[status],
              boxShadow: status==='running' ? '0 0 6px var(--magenta)' : 'none',
              transition:'background 0.3s',
            }}/>
          </div>

          {/* docs button — always visible when node has doc */}
          {hasDocs && (
            <HeaderBtn
              label="?"
              tooltip="Documentation"
              onClick={() => setShowDocs(true)}
            />
          )}

          {/* result button */}
          {hasResult && (
            <HeaderBtn
              label="▤"
              tooltip={hasOutput ? 'View result' : 'Run pipeline first'}
              onClick={() => setShowResult(true)}
              disabled={!hasOutput}
              active={hasOutput && status === 'done'}
            />
          )}
        </div>

        {/* body */}
        <div style={{ padding:'8px 12px 10px', display:'flex', flexDirection:'column', gap:6 }}>
          {renderBody
            ? renderBody(data, updateControl)
            : <DefaultControls controls={controls} onUpdate={updateControl}/>
          }
        </div>

        {/* output strip */}
        {lastOutput && (
          <div style={{
            padding:'4px 12px 6px',
            borderTop:'1px solid var(--border)',
            fontSize:10, color: status==='error' ? 'var(--red)' : 'var(--magenta)',
            fontFamily:'var(--font-mono)',
            whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
          }}>↳ {lastOutput}</div>
        )}
      </div>

      {showDocs && (
        <NodeDocsDialog node={defForDialog} onHide={() => setShowDocs(false)} />
      )}
      {showResult && (
        <NodeResultDialog
          nodeTitle={title}
          resultType={_resultType}
          output={_lastRunOutput}
          status={status}
          onHide={() => setShowResult(false)}
        />
      )}
    </>
  )
}

export default memo(NodeCard)
