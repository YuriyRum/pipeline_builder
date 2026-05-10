const delay = ms => new Promise(r => setTimeout(r, ms))
const FileSourceNode = {
  id:'file-source', title:'File source', icon:'📂', iconBg:'#1a2d3a', group:'ingestion',
  doc:`Simulates reading files from a server-side directory or object storage bucket.

In production, replace the run() body with a real backend call (e.g. POST /api/ingest/files) that returns the parsed file list.

## How to use
Configure the format and whether to watch the directory for changes, then connect to a Transformer or Parser node.

## Output
Passes { fileCount, fmt, rows } to downstream nodes.`,
  inputType:'none', outputType:'{ fileCount, fmt, rows }', resultType:'stats',
  defaultControls:[
    {type:'toggle',label:'Watch dir',key:'watch',val:true},
    {type:'select',label:'Format',key:'fmt',val:'CSV',opts:['CSV','JSON','Parquet','XLSX']},
    {type:'select',label:'Encoding',key:'enc',val:'UTF-8',opts:['UTF-8','Latin-1','ASCII']},
  ],
  async run(nodeData, ctx) {
    const fmt=nodeData.controls.find(c=>c.key==='fmt')?.val??'CSV'
    const watch=nodeData.controls.find(c=>c.key==='watch')?.val??false
    ctx.log(`Opening ${fmt} reader${watch?' (watch mode)':''}…`); await delay(400)
    if(ctx.signal.aborted) return {ok:false,message:'aborted'}
    ctx.log('Scanning directory…'); await delay(600)
    if(ctx.signal.aborted) return {ok:false,message:'aborted'}
    const fileCount=Math.floor(Math.random()*8)+3
    ctx.log(`Found ${fileCount} ${fmt} file(s)`)
    return {ok:true,message:`${fileCount} ${fmt} files read`,output:{fileCount,fmt,rows:fileCount*120}}
  },
}
export default FileSourceNode
