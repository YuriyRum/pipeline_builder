import { useCallback, useRef, useState } from 'react'
import ReactFlow, {
  Background, Controls, MiniMap,
  addEdge, applyNodeChanges, applyEdgeChanges,
  MarkerType, BackgroundVariant,
} from 'reactflow'
import 'reactflow/dist/style.css'

import PipelineNode from './PipelineNode'
import GroupNode    from './GroupNode'
import PipelineEdge from './PipelineEdge'
import NodePalette  from './NodePalette'

const nodeTypes = { pipeline: PipelineNode, group: GroupNode }
const edgeTypes = { pipeline: PipelineEdge }

let uid = 100
const uid_ = () => `n${uid++}`

const mkEdge = (id, source, target, animated, buildMode, onDelete) => ({
  id, source, target, type: 'pipeline',
  markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14,
    color: animated ? '#1D9E75' : 'rgba(255,255,255,0.2)' },
  data: { animated, buildMode, onDelete },
})

const INIT_NODES = [
  { id:'g1', type:'group', position:{x:20,y:20}, style:{width:240,height:280},
    data:{label:'Data ingestion',bg:'rgba(74,144,217,0.07)',border:'#4A90D9',labelColor:'#4A90D9'}},
  { id:'g2', type:'group', position:{x:300,y:20}, style:{width:280,height:280},
    data:{label:'Processing',bg:'rgba(29,158,117,0.07)',border:'#1D9E75',labelColor:'#1D9E75'}},
  { id:'g3', type:'group', position:{x:20,y:340}, style:{width:560,height:220},
    data:{label:'Output',bg:'rgba(245,166,35,0.07)',border:'#F5A623',labelColor:'#F5A623'}},
  { id:'n1', type:'pipeline', position:{x:50,y:80},
    data:{title:'File source',icon:'📂',iconBg:'#1a2d3a',status:'idle',controls:[
      {type:'toggle',label:'Watch dir',key:'watch',val:true},
      {type:'select',label:'Format',key:'fmt',val:'CSV',opts:['CSV','JSON','Parquet']},
    ]}},
  { id:'n2', type:'pipeline', position:{x:50,y:210},
    data:{title:'API stream',icon:'🌐',iconBg:'#1a2d3a',status:'idle',controls:[
      {type:'toggle',label:'Enabled',key:'enabled',val:false},
      {type:'checkbox',label:'Auth token',key:'auth',val:true},
    ]}},
  { id:'n3', type:'pipeline', position:{x:330,y:60},
    data:{title:'Transformer',icon:'⚙️',iconBg:'#1a3028',status:'idle',controls:[
      {type:'select',label:'Mode',key:'mode',val:'Normalize',opts:['Normalize','Scale','Encode']},
      {type:'checkbox',label:'Drop nulls',key:'nulls',val:true},
      {type:'checkbox',label:'Dedupe',key:'dup',val:false},
    ]}},
  { id:'n4', type:'pipeline', position:{x:330,y:200},
    data:{title:'Validator',icon:'✅',iconBg:'#1e2e1a',status:'idle',controls:[
      {type:'toggle',label:'Strict mode',key:'strict',val:true},
      {type:'select',label:'Schema',key:'schema',val:'v2',opts:['v1','v2','v3']},
    ]}},
  { id:'n5', type:'pipeline', position:{x:50,y:380},
    data:{title:'Output DB',icon:'💾',iconBg:'#2e2516',status:'idle',controls:[
      {type:'select',label:'Target',key:'db',val:'Postgres',opts:['Postgres','MySQL','Mongo']},
      {type:'toggle',label:'Batch write',key:'batch',val:true},
    ]}},
  { id:'n6', type:'pipeline', position:{x:340,y:380},
    data:{title:'Notifier',icon:'🔔',iconBg:'#2e2516',status:'idle',controls:[
      {type:'checkbox',label:'Email',key:'email',val:true},
      {type:'checkbox',label:'Slack',key:'slack',val:false},
      {type:'toggle',label:'On error only',key:'eronly',val:false},
    ]}},
]

const INIT_EDGES_RAW = [
  {id:'e1',source:'n1',target:'n3'},
  {id:'e2',source:'n2',target:'n3'},
  {id:'e3',source:'n3',target:'n4'},
  {id:'e4',source:'n4',target:'n5'},
  {id:'e4b',source:'n3',target:'n5'},
  {id:'e5',source:'n4',target:'n6'},
  {id:'e6',source:'n5',target:'n6'},
]

export default function App() {
  const [buildMode, setBuildMode] = useState(false)
  const [running, setRunning]     = useState(false)
  const [log, setLog]             = useState([{msg:'Idle — press Run',type:'info'}])
  const [nodes, setNodes]         = useState(INIT_NODES)
  const [edges, setEdges]         = useState(() =>
    INIT_EDGES_RAW.map(e => mkEdge(e.id,e.source,e.target,false,false,null))
  )
  const runAbort = useRef(false)

  const onNodesChange = useCallback(c => setNodes(n => applyNodeChanges(c,n)),[])
  const onEdgesChange = useCallback(c => setEdges(e => applyEdgeChanges(c,e)),[])

  const onDelEdge = useCallback((id) => setEdges(eds => eds.filter(e => e.id !== id)),[])
  const onDelNode = useCallback((id) => {
    setNodes(nds => nds.filter(n => n.id !== id))
    setEdges(eds => eds.filter(e => e.source !== id && e.target !== id))
  },[])

  const onConnect = useCallback((params) => {
    setEdges(eds => addEdge({
      ...params, type:'pipeline', id:`e${Date.now()}`,
      markerEnd:{type:MarkerType.ArrowClosed,width:14,height:14,color:'rgba(255,255,255,0.2)'},
      data:{animated:false,buildMode:true,onDelete:onDelEdge}
    }, eds))
  },[onDelEdge])

  const toggleBuild = useCallback(() => {
    setBuildMode(bm => {
      const next = !bm
      setNodes(nds => nds.map(n => ({...n,data:{...n.data,buildMode:next,onDelete:onDelNode}})))
      setEdges(eds => eds.map(e => ({...e,data:{...e.data,buildMode:next,onDelete:onDelEdge}})))
      return next
    })
  },[onDelNode,onDelEdge])

  const onAddNode = useCallback((tmpl) => {
    const id = uid_()
    if (tmpl.type === 'group') {
      setNodes(nds => [...nds, {
        id, type:'group',
        position:{x:60+Math.random()*120, y:60+Math.random()*80},
        style:{width:260,height:200},
        data:{label:tmpl.gLabel,bg:tmpl.bg,border:tmpl.border,labelColor:tmpl.lc,buildMode:true,onDelete:onDelNode},
      }])
    } else {
      setNodes(nds => [...nds, {
        id, type:'pipeline',
        position:{x:200+Math.random()*200, y:150+Math.random()*150},
        data:{...tmpl,status:'idle',buildMode:true,onDelete:onDelNode},
      }])
    }
  },[onDelNode])

  const addLog = (msg,type) => setLog(l => [...l.slice(-7),{msg,type}])

  const setNodeStatus = useCallback((id,status) =>
    setNodes(nds => nds.map(n => n.id===id ? {...n,data:{...n.data,status}} : n))
  ,[])

  const animEdges = useCallback((ids,on) => {
    setEdges(eds => eds.map(e => ids.includes(e.id)
      ? {...e, data:{...e.data,animated:on},
          markerEnd:{type:MarkerType.ArrowClosed,width:14,height:14,color:on?'#1D9E75':'rgba(255,255,255,0.2)'}}
      : e
    ))
  },[])

  const delay = ms => new Promise(r => setTimeout(r,ms))

  const startRun = useCallback(async () => {
    if (running) return
    setRunning(true)
    runAbort.current = false
    setLog([])
    const SEQ = [
      {nodes:['n1','n2'],edges:['e1','e2'],label:'Ingesting data…'},
      {nodes:['n3'],edges:['e3','e4b'],label:'Transforming…'},
      {nodes:['n4'],edges:['e4','e5'],label:'Validating…'},
      {nodes:['n5','n6'],edges:['e6'],label:'Writing output…'},
    ]
    INIT_NODES.filter(n=>n.type==='pipeline').forEach(n=>setNodeStatus(n.id,'idle'))
    for (const step of SEQ) {
      if (runAbort.current) break
      addLog(step.label,'info')
      step.nodes.forEach(id=>setNodeStatus(id,'running'))
      animEdges(step.edges,true)
      await delay(1400)
      step.nodes.forEach(id=>setNodeStatus(id,'done'))
      animEdges(step.edges,false)
      addLog('✓ '+step.label.replace('…',' done'),'ok')
      await delay(300)
    }
    setRunning(false)
  },[running,setNodeStatus,animEdges])

  const resetAll = useCallback(() => {
    runAbort.current = true
    setRunning(false)
    setNodes(nds => nds.map(n => n.type==='pipeline' ? {...n,data:{...n.data,status:'idle'}} : n))
    setEdges(eds => eds.map(e => ({...e,data:{...e.data,animated:false},
      markerEnd:{type:MarkerType.ArrowClosed,width:14,height:14,color:'rgba(255,255,255,0.2)'}})))
    setLog([{msg:'Idle — press Run',type:'info'}])
  },[])

  return (
    <div style={{display:'flex',flexDirection:'column',width:'100%',height:'100%'}}>
      {/* Topbar */}
      <div style={{display:'flex',alignItems:'center',gap:12,padding:'10px 18px',
        background:'var(--surface)',borderBottom:'1px solid var(--border2)',flexShrink:0}}>
        <div style={{fontFamily:'var(--font-mono)',fontSize:14,fontWeight:500,
          letterSpacing:'0.04em',color:'var(--green2)'}}>⬡ Pipeline Builder</div>
        <div style={{flex:1}}/>
        <button onClick={toggleBuild} disabled={running} style={{
          display:'flex',alignItems:'center',gap:6,padding:'6px 14px',borderRadius:999,
          background:buildMode?'rgba(245,166,35,0.15)':'var(--surface2)',
          border:`1px solid ${buildMode?'rgba(245,166,35,0.4)':'var(--border2)'}`,
          color:buildMode?'var(--amber)':'var(--muted)',
          fontSize:12,fontWeight:500,cursor:running?'not-allowed':'pointer',
          fontFamily:'var(--font-ui)',transition:'all 0.2s',opacity:running?0.5:1,
        }}>
          <span>{buildMode?'🔧':'👁️'}</span>
          {buildMode?'Build mode':'View mode'}
        </button>
        <button onClick={startRun} disabled={running||buildMode} style={{
          display:'flex',alignItems:'center',gap:6,padding:'7px 18px',borderRadius:999,
          background:running||buildMode?'var(--surface2)':'var(--green)',
          border:'1px solid transparent',
          color:running||buildMode?'var(--muted)':'white',
          fontSize:13,fontWeight:500,
          cursor:running||buildMode?'not-allowed':'pointer',
          fontFamily:'var(--font-ui)',transition:'all 0.2s',
        }}>{running?'⏳ Running…':'▶ Run pipeline'}</button>
        <button onClick={resetAll} style={{
          padding:'7px 14px',borderRadius:999,background:'none',
          border:'1px solid var(--border2)',color:'var(--muted)',fontSize:12,
          cursor:'pointer',fontFamily:'var(--font-ui)',
        }}>↺ Reset</button>
      </div>

      {/* Body */}
      <div style={{display:'flex',flex:1,overflow:'hidden'}}>
        {buildMode && <NodePalette onAddNode={onAddNode}/>}
        <div style={{flex:1,position:'relative'}}>
          <ReactFlow
            nodes={nodes} edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={buildMode?onConnect:undefined}
            nodeTypes={nodeTypes} edgeTypes={edgeTypes}
            nodesDraggable={true}
            nodesConnectable={buildMode}
            elementsSelectable={true}
            deleteKeyCode={buildMode?'Backspace':null}
            fitView fitViewOptions={{padding:0.2}}
            minZoom={0.3} maxZoom={2}
          >
            <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="rgba(255,255,255,0.07)"/>
            <Controls/>
            <MiniMap
              nodeColor={n=>{
                if(n.type==='group') return 'rgba(255,255,255,0.05)'
                const s=n.data?.status
                return s==='done'?'#1D9E75':s==='running'?'#5DCAA5':'#3a3a38'
              }}
              maskColor="rgba(15,15,14,0.6)"
              style={{bottom:80}}
            />
          </ReactFlow>

          {buildMode && (
            <div style={{
              position:'absolute',bottom:16,left:'50%',transform:'translateX(-50%)',
              background:'rgba(245,166,35,0.1)',border:'1px solid rgba(245,166,35,0.25)',
              borderRadius:999,padding:'6px 16px',fontSize:12,color:'var(--amber)',
              fontFamily:'var(--font-mono)',pointerEvents:'none',whiteSpace:'nowrap',
            }}>
              Drag to move · Handle→Handle to connect · × to delete · Backspace to remove selected
            </div>
          )}

          {!buildMode && (
            <div style={{
              position:'absolute',top:12,right:12,width:200,maxHeight:170,
              background:'var(--surface)',border:'1px solid var(--border2)',
              borderRadius:'var(--r)',overflow:'hidden',zIndex:10,
            }}>
              <div style={{padding:'7px 10px 5px',fontSize:10,fontWeight:600,
                letterSpacing:'0.08em',textTransform:'uppercase',color:'var(--muted)',
                fontFamily:'var(--font-mono)',borderBottom:'1px solid var(--border)'}}>
                Activity log
              </div>
              <div style={{padding:'4px 10px 8px',overflow:'auto',maxHeight:130}}>
                {log.map((l,i)=>(
                  <div key={i} style={{fontSize:11,lineHeight:1.7,
                    color:l.type==='ok'?'var(--green)':'var(--muted)'}}>
                    {l.msg}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
