import { useState, useRef } from 'react'
import { listPipelines, deletePipeline, exportPipelineFile, importPipelineFile } from './pipelineStore.js'
import { PRESETS } from './presets.js'

function fmt(iso) {
  try { return new Date(iso).toLocaleString(undefined, { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' }) }
  catch { return '' }
}

function Btn({ children, onClick, accent, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding:'7px 14px', borderRadius:6,
      background: accent ? 'var(--green)' : 'var(--surface)',
      border: `1px solid ${accent ? 'transparent' : 'var(--border2)'}`,
      color: accent ? 'white' : 'var(--text)',
      fontSize:12, cursor: disabled ? 'not-allowed' : 'pointer',
      fontFamily:'var(--font-ui)', fontWeight: accent ? 500 : 400,
      opacity: disabled ? 0.5 : 1, whiteSpace:'nowrap',
    }}>{children}</button>
  )
}

function IconBtn({ children, onClick, title, danger }) {
  return (
    <button onClick={onClick} title={title} style={{
      width:28, height:28, background:'var(--surface2)',
      border:'1px solid var(--border)', borderRadius:6,
      color: danger ? 'var(--red)' : 'var(--muted)',
      fontSize:13, cursor:'pointer',
      display:'flex', alignItems:'center', justifyContent:'center',
    }}>{children}</button>
  )
}

function SectionHead({ label }) {
  return (
    <div style={{
      padding:'8px 20px 4px',
      fontSize:10, fontWeight:600, letterSpacing:'0.08em',
      textTransform:'uppercase', color:'var(--muted)',
      fontFamily:'var(--font-mono)', borderBottom:'1px solid var(--border)',
      background:'var(--surface2)',
    }}>{label}</div>
  )
}

function PipelineRow({ p, onLoad, onExport, onDelete, isPreset }) {
  const nodeCount = p.nodes?.filter(n => n.type === 'pipeline').length ?? 0
  const edgeCount = p.edges?.length ?? 0
  return (
    <div onClick={() => onLoad(p)}
      style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 20px',
        cursor:'pointer', borderBottom:'1px solid var(--border)', transition:'background 0.12s' }}
      onMouseEnter={e => e.currentTarget.style.background='var(--surface2)'}
      onMouseLeave={e => e.currentTarget.style.background='transparent'}
    >
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:13, fontWeight:500, color:'var(--text)', marginBottom:2 }}>{p.name}</div>
        <div style={{ fontSize:11, color:'var(--muted)', display:'flex', gap:10 }}>
          <span>{nodeCount} node{nodeCount !== 1 ? 's' : ''}</span>
          <span>{edgeCount} edge{edgeCount !== 1 ? 's' : ''}</span>
          {!isPreset && <span>{fmt(p.savedAt)}</span>}
          {isPreset && <span style={{ color:'var(--amber)' }}>built-in</span>}
        </div>
      </div>
      <div style={{ display:'flex', gap:6 }}>
        {!isPreset && <IconBtn title="Export JSON" onClick={e => { e.stopPropagation(); onExport(p) }}>↓</IconBtn>}
        {!isPreset && <IconBtn title="Delete" danger onClick={e => { e.stopPropagation(); onDelete(p.id) }}>🗑</IconBtn>}
      </div>
    </div>
  )
}

export default function CatalogModal({ onClose, onLoad, onSave, currentName }) {
  const [saved,     setSaved]     = useState(listPipelines)
  const [saveName,  setSaveName]  = useState(currentName || '')
  const [error,     setError]     = useState('')
  const [importing, setImporting] = useState(false)
  const importRef = useRef()

  const refresh = () => setSaved(listPipelines())

  const handleSave = () => {
    const name = saveName.trim()
    if (!name) { setError('Enter a name'); return }
    onSave(name); refresh(); setError('')
  }

  const handleDelete = (id) => {
    if (!confirm('Delete this pipeline?')) return
    deletePipeline(id); refresh()
  }

  const handleImportFile = async e => {
    const file = e.target.files?.[0]; if (!file) return
    setImporting(true)
    try { const pl = await importPipelineFile(file); onLoad(pl); onClose() }
    catch (err) { setError(err.message) }
    finally { setImporting(false); e.target.value = '' }
  }

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:1000,
      background:'rgba(0,0,0,0.72)', backdropFilter:'blur(4px)',
      display:'flex', alignItems:'center', justifyContent:'center',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width:580, maxHeight:'82vh',
        background:'var(--surface)', border:'1px solid var(--border2)',
        borderRadius:12, display:'flex', flexDirection:'column',
        overflow:'hidden', boxShadow:'0 24px 80px rgba(0,0,0,0.6)',
      }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', padding:'16px 20px', borderBottom:'1px solid var(--border)' }}>
          <span style={{ fontFamily:'var(--font-mono)', fontSize:13, color:'var(--green2)', fontWeight:500 }}>
            ⬡ Pipeline Catalog
          </span>
          <div style={{ flex:1 }} />
          <button onClick={onClose} style={{ background:'none', border:'none', color:'var(--muted)', cursor:'pointer', fontSize:20, lineHeight:1, padding:'0 2px' }}>×</button>
        </div>

        {/* Save strip */}
        <div style={{ padding:'12px 20px', borderBottom:'1px solid var(--border)', background:'rgba(0,0,0,0.2)', display:'flex', gap:8, alignItems:'center' }}>
          <input
            value={saveName} onChange={e => { setSaveName(e.target.value); setError('') }}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            placeholder="Name and save current pipeline…"
            style={{
              flex:1, padding:'7px 10px',
              background:'var(--surface)', color:'var(--text)',
              border:'1px solid var(--border2)', borderRadius:6,
              fontSize:13, fontFamily:'var(--font-ui)', outline:'none',
            }}
          />
          <Btn onClick={handleSave} accent>💾 Save</Btn>
          {error && <span style={{ fontSize:11, color:'var(--red)', whiteSpace:'nowrap' }}>{error}</span>}
        </div>

        {/* Scrollable list */}
        <div style={{ flex:1, overflowY:'auto' }}>
          {/* Presets */}
          <SectionHead label="Built-in presets" />
          {PRESETS.map(p => (
            <PipelineRow key={p.id} p={p} isPreset
              onLoad={pl => { onLoad(pl); onClose() }}
              onExport={() => {}} onDelete={() => {}}
            />
          ))}

          {/* Saved */}
          <SectionHead label={`Saved pipelines (${saved.length})`} />
          {saved.length === 0 && (
            <div style={{ padding:'28px 20px', textAlign:'center', color:'var(--muted)', fontSize:12 }}>
              No saved pipelines yet.
            </div>
          )}
          {saved.map(p => (
            <PipelineRow key={p.id} p={p}
              onLoad={pl => { onLoad(pl); onClose() }}
              onExport={exportPipelineFile}
              onDelete={handleDelete}
            />
          ))}
        </div>

        {/* Footer */}
        <div style={{ padding:'12px 20px', borderTop:'1px solid var(--border)', display:'flex', gap:8 }}>
          <input ref={importRef} type="file" accept=".json" style={{ display:'none' }} onChange={handleImportFile} />
          <Btn onClick={() => importRef.current?.click()} disabled={importing}>
            {importing ? 'Importing…' : '↑ Import .json'}
          </Btn>
          <div style={{ flex:1 }} />
          <Btn onClick={onClose}>Close</Btn>
        </div>
      </div>
    </div>
  )
}
