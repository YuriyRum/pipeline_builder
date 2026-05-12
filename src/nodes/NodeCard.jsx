import { memo, useCallback, useState } from 'react'
import { Handle, Position, useReactFlow } from 'reactflow'
import NodeDocsDialog   from './NodeDocsDialog.jsx'
import NodeResultDialog from './NodeResultDialog.jsx'

/* ── status colours ─────────────────────────────────────────── */
const STATUS_COLORS = {
  idle:    'var(--muted)',
  running: 'var(--magenta)',
  done:    'var(--magenta-dark)',
  error:   'var(--red)',
  skipped: '#444444',
}

/* ── shared control primitives ─────────────────────────────── */
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

/* ── default controls ───────────────────────────────────────── */
function DefaultControls({ controls, onUpdate }) {
  return controls.map(ctrl => {
    const { type, label, key, val, opts } = ctrl
    if (type === 'toggle') return (
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
    if (type === 'select') return (
      <ControlRow key={key} label={label}>
        <MiniSelect value={val} opts={opts} onChange={v => onUpdate(key, v)}/>
      </ControlRow>
    )
    return null
  })
}

/* ── main card ──────────────────────────────────────────────── */
function NodeCard({ id, data, selected }) {
  const { setNodes } = useReactFlow()
  const [showDocs,   setShowDocs]   = useState(false)
  const [showResult, setShowResult] = useState(false)

  const {
    title        = 'Node',
    icon         = '⬡',
    iconBg       = '#222',
    controls     = [],
    status       = 'idle',
    buildMode,
    onDelete,
    renderBody,
    lastOutput,
    _lastRunOutput,
    _doc,
    _resultType,
    _inputType,
    _outputType,
    _defaultControls,
  } = data

  const updateControl = useCallback((key, val) => {
    setNodes(nds => nds.map(n =>
      n.id === id
        ? { ...n, data: { ...n.data, controls: n.data.controls.map(c => c.key===key ? {...c,val} : c) } }
        : n
    ))
  }, [id, setNodes])

  const borderColor =
    selected            ? '#E20074'
    : status==='running'  ? 'var(--magenta)'
    : status==='done'     ? '#8B0040'
    : status==='error'    ? 'var(--red)'
    : status==='skipped'  ? '#333333'
    : 'var(--border2)'

  const shadow =
    selected          ? '0 0 0 2px rgba(226,0,116,0.3)'
    : status==='running' ? '0 0 0 3px rgba(226,0,116,0.25)'
    : status==='error'   ? '0 0 0 3px rgba(224,82,82,0.2)'
    : '0 4px 20px rgba(0,0,0,0.4)'

  const hasDoc    = Boolean(_doc)
  const hasResult = Boolean(_resultType) && _resultType !== 'none'
  const hasOutput = _lastRunOutput != null

  const defForDialog = {
    title, icon,
    doc:             _doc,
    inputType:       _inputType,
    outputType:      _outputType,
    resultType:      _resultType,
    defaultControls: _defaultControls ?? controls,
  }

  return (
    <>
      <div style={{
        background:    'var(--surface)',
        border:        `1.5px solid ${borderColor}`,
        borderRadius:  'var(--r)',
        minWidth:      210,
        // Fill the ReactFlow wrapper so width AND height resize both work
        width:         '100%',
        height:        '100%',
        boxShadow:     shadow,
        transition:    'border-color 0.2s, box-shadow 0.2s',
        position:      'relative',
        fontFamily:    'var(--font-ui)',
        display:       'flex',
        flexDirection: 'column',
        overflow:      'hidden',
      }}>

        {/* ── delete button ── */}
        {buildMode && (
          <button
            onClick={e => { e.stopPropagation(); onDelete(id) }}
            style={{
              position:'absolute', top:-10, right:-10, zIndex:20,
              width:20, height:20,
              background:'var(--red)', color:'white',
              border:'none', borderRadius:'50%',
              fontSize:14, cursor:'pointer',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontWeight:700, padding:0,
              boxShadow:'0 2px 8px rgba(0,0,0,0.5)',
            }}
          >×</button>
        )}

        {/* ── handles ── */}
        <Handle type="target" position={Position.Left}   style={{left:-6}}/>
        <Handle type="target" position={Position.Top}    style={{top:-6}}/>
        <Handle type="source" position={Position.Right}  style={{right:-6}}/>
        <Handle type="source" position={Position.Bottom} style={{bottom:-6}}/>

        {/* ── header ── */}
        <div style={{
          display:'flex', alignItems:'center', gap:6,
          padding:'8px 8px 6px',
          borderBottom:'1px solid var(--border)',
        }}>
          {/* icon chip */}
          <div style={{
            width:24, height:24, borderRadius:5, background:iconBg,
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:13, flexShrink:0,
          }}>{icon}</div>

          {/* title */}
          <span style={{
            fontSize:12, fontWeight:600, color:'var(--text)',
            flex:1, minWidth:0,
            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
          }}>{title}</span>

          {/* right-side action row — fixed width so it can never be squeezed out */}
          <div style={{
            display:'flex', alignItems:'center', gap:4, flexShrink:0,
          }}>
            {/* status dot */}
            <div style={{
              width:7, height:7, borderRadius:'50%', flexShrink:0,
              background: STATUS_COLORS[status] ?? 'var(--muted)',
              boxShadow: status==='running' ? '0 0 6px var(--magenta)' : 'none',
              transition:'background 0.3s',
            }}/>

            {/* docs button — ALWAYS rendered if _doc exists, with strong visible style */}
            {hasDoc && (
              <DocBtn onClick={() => setShowDocs(true)} />
            )}

            {/* result button */}
            {hasResult && (
              <ResultBtn
                active={hasOutput}
                onClick={() => hasOutput && setShowResult(true)}
              />
            )}
          </div>
        </div>

        {/* ── body ── */}
        <div style={{ padding:'8px 10px 10px', display:'flex', flexDirection:'column', gap:6, flex:1, overflowY:'auto' }}>
          {renderBody
            ? renderBody(data, updateControl)
            : <DefaultControls controls={controls} onUpdate={updateControl}/>
          }
        </div>

        {/* ── output strip ── */}
        {lastOutput && (
          <div style={{
            padding:'3px 10px 5px',
            borderTop:'1px solid var(--border)',
            fontSize:10, fontFamily:'var(--font-mono)',
            color: status==='error' ? 'var(--red)' : '#E20074',
            whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
          }}>↳ {lastOutput}</div>
        )}
      </div>

      {/* ── dialogs rendered via portals, outside the card ── */}
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

/* ── DocBtn: always magenta, hard-coded style, nothing conditional ── */
function DocBtn({ onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <div style={{ position:'relative', flexShrink:0, lineHeight:0 }}>
      <button
        title="Documentation"
        onMouseDown={e => e.stopPropagation()}
        onClick={e => { e.stopPropagation(); e.preventDefault(); onClick() }}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          display:'inline-flex', alignItems:'center', justifyContent:'center',
          width:20, height:20, padding:0,
          background: hov ? '#E20074' : 'rgba(226,0,116,0.18)',
          border:'1.5px solid #E20074',
          borderRadius:5,
          color:'#FF80C8',
          fontSize:12, fontWeight:900,
          cursor:'pointer',
          lineHeight:1,
          fontFamily:'monospace',
          userSelect:'none',
          transition:'background 0.15s',
        }}
      >?</button>
      {hov && (
        <div style={{
          position:'absolute', bottom:'calc(100% + 6px)', left:'50%',
          transform:'translateX(-50%)',
          background:'#1a1a18', border:'1px solid #E20074',
          borderRadius:4, padding:'3px 8px',
          fontSize:10, color:'#FF80C8', whiteSpace:'nowrap',
          pointerEvents:'none', zIndex:9999,
        }}>Documentation</div>
      )}
    </div>
  )
}

/* ── ResultBtn ── */
function ResultBtn({ active, onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <div style={{ position:'relative', flexShrink:0, lineHeight:0 }}>
      <button
        title={active ? 'View result' : 'Run pipeline first'}
        onMouseDown={e => e.stopPropagation()}
        onClick={e => { e.stopPropagation(); e.preventDefault(); onClick() }}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          display:'inline-flex', alignItems:'center', justifyContent:'center',
          width:20, height:20, padding:0,
          background: active && hov ? '#E20074' : active ? 'rgba(226,0,116,0.18)' : 'var(--surface2)',
          border: `1.5px solid ${active ? '#E20074' : 'var(--border2)'}`,
          borderRadius:5,
          color: active ? '#FF80C8' : 'var(--muted)',
          fontSize:11, fontWeight:700,
          cursor: active ? 'pointer' : 'default',
          lineHeight:1, fontFamily:'monospace',
          userSelect:'none', transition:'background 0.15s',
          opacity: active ? 1 : 0.45,
        }}
      >▤</button>
      {hov && (
        <div style={{
          position:'absolute', bottom:'calc(100% + 6px)', left:'50%',
          transform:'translateX(-50%)',
          background:'#1a1a18', border:'1px solid var(--border2)',
          borderRadius:4, padding:'3px 8px',
          fontSize:10, color:'var(--text)', whiteSpace:'nowrap',
          pointerEvents:'none', zIndex:9999,
        }}>{active ? 'View result' : 'Run pipeline first'}</div>
      )}
    </div>
  )
}

export default memo(NodeCard)
