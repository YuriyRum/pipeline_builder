/**
 * TXT UPLOAD NODE
 * ────────────────
 * Drag-and-drop / click-to-browse picker for plain text files (.txt, .log, .md, etc).
 * Shows a live preview of the first few lines inside the node.
 * Passes the full raw text string downstream so other nodes can process it.
 *
 * Output: { fileName, fileSize, fileType: 'txt', raw: string, lineCount: number }
 */
import { useRef } from 'react'

/* ── shared file-size formatter ─────────────────────────────── */
const fmtSize = bytes =>
  bytes < 1024       ? `${bytes} B`
  : bytes < 1024**2  ? `${(bytes/1024).toFixed(1)} KB`
  :                    `${(bytes/1024**2).toFixed(1)} MB`

/* ── custom body ─────────────────────────────────────────────── */
function TxtUploadBody(nodeData, _updateControl, nodeId, setNodes) {
  const inputRef   = useRef()
  const fileName   = nodeData._fileName
  const fileSize   = nodeData._fileSize
  const previewLines = nodeData._previewLines ?? []  // first N lines of text

  const handleFiles = files => {
    const f = files?.[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = e => {
      const text  = e.target.result
      const lines = text.split(/\r?\n/)
      setNodes(nds => nds.map(n => n.id === nodeId
        ? { ...n, data: { ...n.data,
            _file:         f,
            _fileName:     f.name,
            _fileSize:     f.size,
            _rawText:      text,
            _previewLines: lines.slice(0, 5),
          }}
        : n
      ))
    }
    reader.readAsText(f)
  }

  const clear = e => {
    e.stopPropagation()
    setNodes(nds => nds.map(n => n.id === nodeId
      ? { ...n, data: { ...n.data, _file:null, _fileName:null, _fileSize:null, _rawText:null, _previewLines:[] } }
      : n
    ))
  }

  const onDrop = e => { e.preventDefault(); handleFiles(e.dataTransfer.files) }

  return (
    <div>
      {/* Drop zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={e => e.preventDefault()}
        style={{
          border: `1.5px dashed ${fileName ? 'var(--green)' : 'var(--border2)'}`,
          borderRadius: 6, padding: '8px',
          cursor: 'pointer',
          background: fileName ? 'rgba(29,158,117,0.05)' : 'var(--surface2)',
          transition: 'all 0.15s',
          minHeight: 52,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 3,
        }}
      >
        {fileName ? (
          <>
            <span style={{ fontSize: 16 }}>📝</span>
            <span style={{ fontSize: 11, color: 'var(--text)', fontWeight: 500, wordBreak: 'break-all', maxWidth: 150, textAlign: 'center' }}>
              {fileName}
            </span>
            <span style={{ fontSize: 10, color: 'var(--muted)' }}>{fmtSize(fileSize)}</span>
          </>
        ) : (
          <>
            <span style={{ fontSize: 18 }}>📄</span>
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>Drop .txt / .log / .md or click</span>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".txt,.log,.md,.csv,.tsv,.json,.xml,.yaml,.yml"
        style={{ display: 'none' }}
        onChange={e => handleFiles(e.target.files)}
      />

      {/* Preview */}
      {previewLines.length > 0 && (
        <div style={{
          marginTop: 6,
          background: 'var(--surface2)',
          border: '1px solid var(--border)',
          borderRadius: 5,
          padding: '5px 7px',
          maxHeight: 90, overflow: 'hidden',
        }}>
          {previewLines.map((line, i) => (
            <div key={i} style={{
              fontSize: 10, lineHeight: 1.55,
              color: i === 0 ? 'var(--text)' : 'var(--muted)',
              fontFamily: 'var(--font-mono)',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {line || <span style={{ opacity: 0.3 }}>{'(empty line)'}</span>}
            </div>
          ))}
        </div>
      )}

      {/* Clear */}
      {fileName && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
          <button onClick={clear} style={{
            fontSize: 10, color: 'var(--muted)',
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-ui)',
          }}>✕ Clear</button>
        </div>
      )}
    </div>
  )
}

/* ── definition ─────────────────────────────────────────────── */
const TxtUploadNode = {
  id:     'txt-upload',
  title:  'Text File Upload',
  icon:   '📝',
  iconBg: '#1f2a1a',
  group:  'ingestion',

  defaultControls: [],
  renderBody:      null,
  _renderBodyFactory: TxtUploadBody,

  async run(nodeData, ctx) {
    const file    = nodeData._file
    const rawText = nodeData._rawText

    if (!file) return { ok: false, message: 'No file selected' }

    ctx.log(`Reading ${file.name} (${fmtSize(file.size)})…`)

    // If the file was already read by the UI body use the cached text,
    // otherwise re-read it now (e.g. after a page reload).
    let text = rawText
    if (!text) {
      text = await new Promise((res, rej) => {
        const reader = new FileReader()
        reader.onload  = e => res(e.target.result)
        reader.onerror = () => rej(new Error('File read error'))
        reader.readAsText(file)
      })
    }

    const lines = text.split(/\r?\n/)
    ctx.log(`${lines.length.toLocaleString()} lines, ${text.length.toLocaleString()} chars`)

    return {
      ok: true,
      message: `${lines.length.toLocaleString()} lines`,
      output: {
        fileName:  file.name,
        fileSize:  file.size,
        fileType:  'txt',
        raw:       text,
        lineCount: lines.length,
        lines,
      },
    }
  },
}

export default TxtUploadNode
