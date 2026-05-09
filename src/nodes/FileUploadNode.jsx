/**
 * FILE UPLOAD NODE
 * ─────────────────
 * Renders a drag-and-drop / click-to-browse file picker inside the node.
 * Stores the picked File object in node data so the run() function can send
 * it to the backend. Supports CSV and XLSX.
 *
 * Output: { fileName, fileSize, fileType, rawFile (File object) }
 */
import { useRef } from 'react'
import { useReactFlow } from 'reactflow'

/* ── custom body ───────────────────────────────────────────── */
function FileUploadBody(nodeData, _updateControl, nodeId, setNodes) {
  const file     = nodeData._file   // File object stored at runtime
  const fileName = nodeData._fileName
  const fileSize = nodeData._fileSize

  const inputRef = useRef()

  const handleFiles = files => {
    const f = files?.[0]
    if (!f) return
    // Store File reference in node data (not serialised, cleared on load)
    setNodes(nds => nds.map(n => n.id === nodeId
      ? { ...n, data: { ...n.data,
          _file:     f,
          _fileName: f.name,
          _fileSize: f.size,
        }}
      : n
    ))
  }

  const onDrop = e => {
    e.preventDefault()
    handleFiles(e.dataTransfer.files)
  }

  const fmt = bytes => bytes < 1024 ? `${bytes} B`
    : bytes < 1024**2 ? `${(bytes/1024).toFixed(1)} KB`
    : `${(bytes/1024**2).toFixed(1)} MB`

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={e => e.preventDefault()}
        style={{
          border: `1.5px dashed ${fileName ? 'var(--green)' : 'var(--border2)'}`,
          borderRadius: 6,
          padding: '10px 8px',
          textAlign: 'center',
          cursor: 'pointer',
          background: fileName ? 'rgba(29,158,117,0.05)' : 'var(--surface2)',
          transition: 'all 0.15s',
          minHeight: 58,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 3,
        }}
      >
        {fileName ? (
          <>
            <span style={{ fontSize: 18 }}>📄</span>
            <span style={{ fontSize: 11, color: 'var(--text)', fontWeight: 500, wordBreak: 'break-all', maxWidth: 140 }}>
              {fileName}
            </span>
            <span style={{ fontSize: 10, color: 'var(--muted)' }}>{fmt(fileSize)}</span>
          </>
        ) : (
          <>
            <span style={{ fontSize: 20 }}>📂</span>
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>Drop CSV / XLSX or click</span>
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        style={{ display: 'none' }}
        onChange={e => handleFiles(e.target.files)}
      />
      {fileName && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
          <button
            onClick={e => {
              e.stopPropagation()
              setNodes(nds => nds.map(n => n.id === nodeId
                ? { ...n, data: { ...n.data, _file: null, _fileName: null, _fileSize: null } }
                : n
              ))
            }}
            style={{
              fontSize: 10, color: 'var(--muted)',
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-ui)',
            }}
          >✕ Clear</button>
        </div>
      )}
    </div>
  )
}

/* ── definition ────────────────────────────────────────────── */
const FileUploadNode = {
  id:     'file-upload',
  title:  'File Upload',
  icon:   '📤',
  iconBg: '#1a2d3a',
  group:  'ingestion',

  defaultControls: [],

  // renderBody receives (nodeData, updateControl) – we need nodeId and setNodes too,
  // so we pass a factory; App.jsx's PipelineNode injects them via a wrapper.
  renderBody: null,       // set at registration time below
  _renderBodyFactory: FileUploadBody,

  async run(nodeData, ctx) {
    const file = nodeData._file
    if (!file) {
      return { ok: false, message: 'No file selected' }
    }

    ctx.log(`Reading ${file.name} (${(file.size/1024).toFixed(1)} KB)…`)

    // Read raw text/binary from the browser File object
    const raw = await new Promise((res, rej) => {
      const reader = new FileReader()
      reader.onload  = e => res(e.target.result)
      reader.onerror = () => rej(new Error('File read error'))
      // Read as text for CSV, arraybuffer for xlsx (backend will handle actual parsing)
      if (file.name.endsWith('.csv')) reader.readAsText(file)
      else reader.readAsArrayBuffer(file)
    })

    ctx.log(`File loaded — ${file.name}`)

    return {
      ok: true,
      message: `${file.name}`,
      output: {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.name.endsWith('.csv') ? 'csv' : 'xlsx',
        raw,          // raw text (CSV) or ArrayBuffer (XLSX)
      },
    }
  },
}

export default FileUploadNode
