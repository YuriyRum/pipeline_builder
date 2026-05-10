import { useRef } from 'react'

function FileUploadBody(nodeData, _updateControl, nodeId, setNodes) {
  const inputRef = useRef()
  const fileName = nodeData._fileName
  const fileSize = nodeData._fileSize
  const fmt = bytes => bytes < 1024 ? `${bytes} B` : bytes < 1024**2 ? `${(bytes/1024).toFixed(1)} KB` : `${(bytes/1024**2).toFixed(1)} MB`
  const handleFiles = files => {
    const f = files?.[0]; if (!f) return
    setNodes(nds => nds.map(n => n.id===nodeId ? {...n,data:{...n.data,_file:f,_fileName:f.name,_fileSize:f.size}} : n))
  }
  const onDrop = e => { e.preventDefault(); handleFiles(e.dataTransfer.files) }
  return (
    <div>
      <div onClick={()=>inputRef.current?.click()} onDrop={onDrop} onDragOver={e=>e.preventDefault()}
        style={{ border:`1.5px dashed ${fileName?'var(--green)':'var(--border2)'}`, borderRadius:6, padding:'10px 8px', textAlign:'center', cursor:'pointer', background:fileName?'rgba(29,158,117,0.05)':'var(--surface2)', transition:'all 0.15s', minHeight:58, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:3 }}>
        {fileName ? (<><span style={{fontSize:18}}>📄</span><span style={{fontSize:11,color:'var(--text)',fontWeight:500,wordBreak:'break-all',maxWidth:140}}>{fileName}</span><span style={{fontSize:10,color:'var(--muted)'}}>{fmt(fileSize)}</span></>) : (<><span style={{fontSize:20}}>📂</span><span style={{fontSize:11,color:'var(--muted)'}}>Drop CSV / XLSX or click</span></>)}
      </div>
      <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls" style={{display:'none'}} onChange={e=>handleFiles(e.target.files)}/>
      {fileName && (<div style={{display:'flex',justifyContent:'flex-end',marginTop:4}}><button onClick={e=>{e.stopPropagation();setNodes(nds=>nds.map(n=>n.id===nodeId?{...n,data:{...n.data,_file:null,_fileName:null,_fileSize:null}}:n))}} style={{fontSize:10,color:'var(--muted)',background:'none',border:'none',cursor:'pointer',fontFamily:'var(--font-ui)'}}>✕ Clear</button></div>)}
    </div>
  )
}

const FileUploadNode = {
  id: 'file-upload', title: 'File Upload', icon: '📤', iconBg: '#1a2d3a', group: 'ingestion',
  doc: `Drag-and-drop or click-to-browse file picker for CSV and XLSX files.

Reads the file entirely in the browser using the FileReader API and passes the raw content downstream to a CSV/XLSX Parser node.

## How to use
1. Drop a .csv or .xlsx/.xls file onto the drop zone, or click to open the file browser.
2. The file name and size are shown once picked.
3. Connect this node to a CSV / XLSX Parser node.
4. Press Run — the file is read and its content forwarded automatically.

## Notes
The File object is stored in memory and is not serialised when you save the pipeline. You will need to re-select the file after reloading.`,
  inputType:  'none',
  outputType: '{ fileName, fileType, raw }',
  resultType: 'stats',
  defaultControls: [],
  renderBody: null,
  _renderBodyFactory: FileUploadBody,
  async run(nodeData, ctx) {
    const file = nodeData._file
    if (!file) return { ok:false, message:'No file selected' }
    ctx.log(`Reading ${file.name} (${(file.size/1024).toFixed(1)} KB)…`)
    const raw = await new Promise((res,rej) => {
      const reader = new FileReader()
      reader.onload  = e => res(e.target.result)
      reader.onerror = () => rej(new Error('File read error'))
      if (file.name.endsWith('.csv')) reader.readAsText(file)
      else reader.readAsArrayBuffer(file)
    })
    ctx.log(`File loaded — ${file.name}`)
    return { ok:true, message:`${file.name}`, output:{ fileName:file.name, fileSize:file.size, fileType:file.name.endsWith('.csv')?'csv':'xlsx', raw } }
  },
}
export default FileUploadNode
