import { useState, useRef } from 'react'
import { listPipelines, savePipeline, deletePipeline, exportPipelineFile, importPipelineFile } from './pipelineStore.js'
import { PRESETS } from './presets.js'

function fmt(iso) {
  try { return new Date(iso).toLocaleString(undefined, { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' }) }
  catch { return '' }
}

const EMPTY_PIPELINE = { nodes: [], edges: [] }

/* ── shared primitives ──────────────────────────────────────── */
function Btn({ children, onClick, accent, danger, disabled, small }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: small ? '5px 10px' : '7px 14px',
      borderRadius:6,
      background: accent ? 'var(--magenta)' : danger ? 'rgba(224,82,82,0.15)' : 'var(--surface)',
      border: `1px solid ${accent ? 'transparent' : danger ? 'var(--red)' : 'var(--border2)'}`,
      color: accent ? 'white' : danger ? 'var(--red)' : 'var(--text)',
      fontSize: small ? 11 : 12, cursor: disabled ? 'not-allowed' : 'pointer',
      fontFamily:'var(--font-ui)', fontWeight: accent ? 500 : 400,
      opacity: disabled ? 0.5 : 1, whiteSpace:'nowrap',
    }}>{children}</button>
  )
}

function IconBtn({ children, onClick, title, danger, accent }) {
  return (
    <button onClick={onClick} title={title} style={{
      width:26, height:26, flexShrink:0,
      background: accent ? 'var(--magenta-subtle)' : 'var(--surface2)',
      border:`1px solid ${accent ? 'var(--magenta)' : danger ? 'rgba(224,82,82,0.3)' : 'var(--border)'}`,
      borderRadius:5,
      color: danger ? 'var(--red)' : accent ? 'var(--magenta-light)' : 'var(--muted)',
      fontSize:13, cursor:'pointer',
      display:'flex', alignItems:'center', justifyContent:'center',
      fontFamily:'monospace',
    }}>{children}</button>
  )
}

function SectionHead({ label }) {
  return (
    <div style={{
      padding:'7px 20px 5px',
      fontSize:9, fontWeight:600, letterSpacing:'0.09em',
      textTransform:'uppercase', color:'var(--muted)',
      fontFamily:'var(--font-mono)', borderBottom:'1px solid var(--border)',
      background:'var(--surface2)',
    }}>{label}</div>
  )
}

/* ── pipeline row ───────────────────────────────────────────── */
function PipelineRow({ p, onLoad, onExport, onDelete, onRename, isPreset }) {
  const [renaming, setRenaming] = useState(false)
  const [draft,    setDraft]    = useState(p.name)

  const nodeCount = p.nodes?.filter(n => n.type === 'pipeline').length ?? 0
  const edgeCount = p.edges?.length ?? 0

  const commitRename = () => {
    const name = draft.trim()
    if (name && name !== p.name) onRename(p.id, name)
    setRenaming(false)
  }

  return (
    <div
      onClick={() => !renaming && onLoad(p)}
      style={{
        display:'flex', alignItems:'center', gap:10, padding:'9px 16px',
        cursor: renaming ? 'default' : 'pointer',
        borderBottom:'1px solid var(--border)', transition:'background 0.12s',
      }}
      onMouseEnter={e => { if (!renaming) e.currentTarget.style.background='var(--surface2)' }}
      onMouseLeave={e => e.currentTarget.style.background='transparent'}
    >
      {/* Icon */}
      <div style={{
        width:30, height:30, borderRadius:6, flexShrink:0,
        background: isPreset ? 'rgba(245,166,35,0.1)' : 'var(--magenta-subtle)',
        border:`1px solid ${isPreset ? 'rgba(245,166,35,0.3)' : 'rgba(226,0,116,0.3)'}`,
        display:'flex', alignItems:'center', justifyContent:'center', fontSize:14,
      }}>{isPreset ? '⚡' : '⬡'}</div>

      {/* Name + meta */}
      <div style={{ flex:1, minWidth:0 }}>
        {renaming ? (
          <input
            autoFocus
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onClick={e => e.stopPropagation()}
            onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setRenaming(false) }}
            onBlur={commitRename}
            style={{
              width:'100%', padding:'3px 6px',
              background:'var(--surface)', color:'var(--text)',
              border:'1px solid var(--magenta)', borderRadius:4,
              fontSize:13, fontFamily:'var(--font-ui)', outline:'none',
            }}
          />
        ) : (
          <div style={{ fontSize:13, fontWeight:500, color:'var(--text)', marginBottom:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</div>
        )}
        <div style={{ fontSize:10, color:'var(--muted)', display:'flex', gap:10 }}>
          <span>{nodeCount} node{nodeCount !== 1 ? 's' : ''}</span>
          <span>{edgeCount} edge{edgeCount !== 1 ? 's' : ''}</span>
          {!isPreset && p.savedAt && <span>{fmt(p.savedAt)}</span>}
          {isPreset && <span style={{ color:'var(--amber)' }}>built-in preset</span>}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display:'flex', gap:5, flexShrink:0 }} onClick={e => e.stopPropagation()}>
        {!isPreset && (
          <IconBtn title="Rename" onClick={() => { setDraft(p.name); setRenaming(true) }}>✎</IconBtn>
        )}
        {!isPreset && (
          <IconBtn title="Export JSON" onClick={() => onExport(p)}>↓</IconBtn>
        )}
        {!isPreset && (
          <IconBtn title="Delete pipeline" danger onClick={() => onDelete(p.id)}>🗑</IconBtn>
        )}
      </div>
    </div>
  )
}

/* ── new pipeline creator ───────────────────────────────────── */
function NewPipelinePanel({ onCreated }) {
  const [name, setName] = useState('')
  const [open, setOpen] = useState(false)

  const create = () => {
    const n = name.trim()
    if (!n) return
    onCreated(n)
    setName('')
    setOpen(false)
  }

  if (!open) return (
    <button
      onClick={() => setOpen(true)}
      style={{
        display:'flex', alignItems:'center', gap:6,
        width:'100%', padding:'10px 20px',
        background:'none', border:'none', borderBottom:'1px solid var(--border)',
        color:'var(--muted)', cursor:'pointer', fontSize:12,
        fontFamily:'var(--font-ui)', transition:'background 0.12s', textAlign:'left',
      }}
      onMouseEnter={e => e.currentTarget.style.background='var(--surface2)'}
      onMouseLeave={e => e.currentTarget.style.background='none'}
    >
      <span style={{ fontSize:16, color:'var(--magenta)' }}>+</span>
      New empty pipeline…
    </button>
  )

  return (
    <div style={{
      padding:'12px 20px', borderBottom:'1px solid var(--border)',
      background:'var(--magenta-subtle)',
      display:'flex', gap:8, alignItems:'center',
    }}>
      <input
        autoFocus
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') create(); if (e.key === 'Escape') setOpen(false) }}
        placeholder="Pipeline name…"
        style={{
          flex:1, padding:'7px 10px',
          background:'var(--surface)', color:'var(--text)',
          border:'1px solid var(--magenta)', borderRadius:6,
          fontSize:13, fontFamily:'var(--font-ui)', outline:'none',
        }}
      />
      <Btn onClick={create} accent>Create</Btn>
      <Btn onClick={() => setOpen(false)}>Cancel</Btn>
    </div>
  )
}

/* ── main modal ─────────────────────────────────────────────── */
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

  const handleDelete = id => {
    if (!confirm('Delete this pipeline? This cannot be undone.')) return
    deletePipeline(id); refresh()
  }

  const handleRename = (id, newName) => {
    const catalog = listPipelines()
    const p = catalog.find(x => x.id === id)
    if (!p) return
    // Re-save under same id with new name
    const updated = { ...p, name: newName }
    // Write directly to localStorage
    const all = catalog.map(x => x.id === id ? updated : x)
    localStorage.setItem('pipeline_catalog', JSON.stringify(all))
    refresh()
  }

  const handleNewPipeline = name => {
    // Save a blank pipeline and immediately load it
    const blank = { nodes: [], edges: [] }
    onSave(name, blank.nodes, blank.edges)
    // Load the empty canvas
    onLoad({ name, nodes: [], edges: [] })
    onClose()
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
        width:600, maxHeight:'84vh',
        background:'var(--surface)', border:'1px solid var(--border2)',
        borderRadius:12, display:'flex', flexDirection:'column',
        overflow:'hidden', boxShadow:'0 24px 80px rgba(0,0,0,0.7)',
      }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', padding:'14px 20px', borderBottom:'1px solid var(--border)' }}>
          <div>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:13, color:'var(--magenta-light)', fontWeight:500 }}>⬡ Pipeline Catalog</div>
            <div style={{ fontSize:10, color:'var(--muted)', marginTop:1 }}>Create, load, save and manage your pipelines</div>
          </div>
          <div style={{ flex:1 }} />
          <button onClick={onClose} style={{ background:'none', border:'none', color:'var(--muted)', cursor:'pointer', fontSize:20, lineHeight:1, padding:'2px 4px' }}>×</button>
        </div>

        {/* Save current strip */}
        <div style={{ padding:'11px 20px', borderBottom:'1px solid var(--border)', background:'rgba(0,0,0,0.15)', display:'flex', gap:8, alignItems:'center' }}>
          <div style={{ fontSize:10, color:'var(--muted)', flexShrink:0, fontFamily:'var(--font-mono)', textTransform:'uppercase', letterSpacing:'0.06em' }}>Save current:</div>
          <input
            value={saveName} onChange={e => { setSaveName(e.target.value); setError('') }}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            placeholder="Pipeline name…"
            style={{
              flex:1, padding:'6px 10px',
              background:'var(--surface)', color:'var(--text)',
              border:'1px solid var(--border2)', borderRadius:6,
              fontSize:12, fontFamily:'var(--font-ui)', outline:'none',
            }}
          />
          <Btn onClick={handleSave} accent>💾 Save</Btn>
          {error && <span style={{ fontSize:11, color:'var(--red)', whiteSpace:'nowrap' }}>{error}</span>}
        </div>

        {/* List */}
        <div style={{ flex:1, overflowY:'auto' }}>

          {/* New pipeline */}
          <SectionHead label="Create new" />
          <NewPipelinePanel onCreated={handleNewPipeline} />

          {/* Presets */}
          <SectionHead label="Built-in presets" />
          {PRESETS.map(p => (
            <PipelineRow key={p.id} p={p} isPreset
              onLoad={pl => { onLoad(pl); onClose() }}
              onExport={() => {}} onDelete={() => {}} onRename={() => {}}
            />
          ))}

          {/* Saved */}
          <SectionHead label={`Saved (${saved.length})`} />
          {saved.length === 0 && (
            <div style={{ padding:'28px 20px', textAlign:'center', color:'var(--muted)', fontSize:12, lineHeight:1.8 }}>
              No saved pipelines yet.<br/>Type a name above and click Save.
            </div>
          )}
          {saved.map(p => (
            <PipelineRow key={p.id} p={p}
              onLoad={pl => { onLoad(pl); onClose() }}
              onExport={exportPipelineFile}
              onDelete={handleDelete}
              onRename={handleRename}
            />
          ))}
        </div>

        {/* Footer */}
        <div style={{ padding:'11px 20px', borderTop:'1px solid var(--border)', display:'flex', gap:8 }}>
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
