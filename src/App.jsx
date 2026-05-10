import { useCallback, useEffect, useRef, useState } from 'react'
import ReactFlow, {
  Background, Controls, MiniMap,
  addEdge, applyNodeChanges, applyEdgeChanges,
  MarkerType, BackgroundVariant,
} from 'reactflow'
import 'reactflow/dist/style.css'

import PipelineNode  from './PipelineNode'
import GroupNode     from './GroupNode'
import PipelineEdge  from './PipelineEdge'
import NodePalette   from './NodePalette'
import CatalogModal  from './CatalogModal'
import { NODE_DEFS } from './nodes/registry.js'
import { savePipeline } from './pipelineStore.js'
import { PRESETS } from './presets.js'

const nodeTypes = { pipeline: PipelineNode, group: GroupNode }
const edgeTypes = { pipeline: PipelineEdge }

let uid = 200
const uid_ = () => `n${uid++}`

/* ── edge factory ─────────────────────────────────────────── */
const mkEdge = (id, source, target, animated = false, buildMode = false, onDelete = null) => ({
  id, source, target, type: 'pipeline',
  markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14,
    color: animated ? 'var(--magenta)' : 'rgba(255,255,255,0.2)' },
  data: { animated, buildMode, onDelete },
})

/* ── topological sort ─────────────────────────────────────── */
function buildExecutionPlan(nodes, edges) {
  const pnodes = nodes.filter(n => n.type === 'pipeline')
  const pids   = new Set(pnodes.map(n => n.id))
  const pedges = edges.filter(e => pids.has(e.source) && pids.has(e.target))
  const inDeg  = {}; const adjOut = {}
  pnodes.forEach(n => { inDeg[n.id] = 0; adjOut[n.id] = [] })
  pedges.forEach(e => { inDeg[e.target] = (inDeg[e.target]||0)+1; adjOut[e.source].push(e.target) })
  const waves = []; let queue = pnodes.filter(n=>inDeg[n.id]===0).map(n=>n.id)
  while (queue.length > 0) {
    waves.push({ nodeIds:[...queue], edgeIds: pedges.filter(e=>queue.includes(e.target)).map(e=>e.id) })
    const next = []
    queue.forEach(nid => adjOut[nid].forEach(tid => { if(--inDeg[tid]===0) next.push(tid) }))
    queue = next
  }
  return waves
}

const delay = ms => new Promise(r => setTimeout(r, ms))

/* ── hydrate a saved/preset pipeline into live ReactFlow state ── */
function hydratePipeline(pipeline, onDelNode, onDelEdge) {
  const nodes = pipeline.nodes.map(n => ({
    ...n,
    data: { ...n.data, status:'idle', lastOutput:null, _progress:0,
      buildMode: false, onDelete: onDelNode },
  }))
  const edges = pipeline.edges.map(e => mkEdge(e.id, e.source, e.target, false, false, onDelEdge))
  return { nodes, edges }
}

/* ── initial graph = CSV pipeline preset ─────────────────── */
const INITIAL_PRESET = PRESETS[0]  // "CSV / XLSX → Table"

/* ─────────────────────────────────────────────────────────── */
export default function App() {
  const [buildMode,    setBuildMode]    = useState(false)
  const [running,      setRunning]      = useState(false)
  const [log,          setLog]          = useState([{msg:'Idle — press Run',type:'info'}])
  const [nodes,        setNodes]        = useState([])
  const [edges,        setEdges]        = useState([])
  const [showCatalog,  setShowCatalog]  = useState(false)
  const [pipelineName, setPipelineName] = useState('')

  const runAbort = useRef(false)
  const nodesRef = useRef(nodes)
  const edgesRef = useRef(edges)
  useEffect(() => { nodesRef.current = nodes }, [nodes])
  useEffect(() => { edgesRef.current = edges }, [edges])

  // ── delete handlers (stable refs needed for hydration) ──
  const onDelEdge = useCallback(id => setEdges(eds => eds.filter(e => e.id !== id)), [])
  const onDelNode = useCallback(id => {
    setNodes(nds => nds.filter(n => n.id !== id))
    setEdges(eds => eds.filter(e => e.source !== id && e.target !== id))
  }, [])

  // Load initial preset on mount
  useEffect(() => {
    const { nodes: n, edges: e } = hydratePipeline(INITIAL_PRESET, onDelNode, onDelEdge)
    setNodes(n); setEdges(e)
    setPipelineName(INITIAL_PRESET.name)
  }, []) // eslint-disable-line

  /* ── ReactFlow ── */
  const onNodesChange = useCallback(c => setNodes(n => applyNodeChanges(c, n)), [])
  const onEdgesChange = useCallback(c => setEdges(e => applyEdgeChanges(c, e)), [])

  const onConnect = useCallback(params => {
    setEdges(eds => addEdge({
      ...params, type:'pipeline', id:`e${Date.now()}`,
      markerEnd:{type:MarkerType.ArrowClosed,width:14,height:14,color:'rgba(255,255,255,0.2)'},
      data:{animated:false,buildMode:true,onDelete:onDelEdge},
    }, eds))
  }, [onDelEdge])

  const toggleBuild = useCallback(() => {
    setBuildMode(bm => {
      const next = !bm
      setNodes(nds => nds.map(n => ({...n,data:{...n.data,buildMode:next,onDelete:onDelNode}})))
      setEdges(eds => eds.map(e => ({...e,data:{...e.data,buildMode:next,onDelete:onDelEdge}})))
      return next
    })
  }, [onDelNode, onDelEdge])

  /* ── add node from palette ── */
  const onAddNode = useCallback(tmpl => {
    if (tmpl.type === 'group') {
      setNodes(nds => [...nds, {
        id:uid_(), type:'group',
        position:{x:80+Math.random()*100,y:80+Math.random()*80},
        style:{width:260,height:200},
        data:{label:tmpl.gLabel,bg:tmpl.bg,border:tmpl.border,labelColor:tmpl.lc,buildMode:true,onDelete:onDelNode},
      }])
    } else {
      setNodes(nds => [...nds, {
        id:uid_(), type:'pipeline',
        position:{x:180+Math.random()*200,y:120+Math.random()*160},
        data:{
          nodeDefId:  tmpl.id,
          title:      tmpl.title,
          icon:       tmpl.icon,
          iconBg:     tmpl.iconBg,
          status:     'idle', lastOutput:null,
          controls:   tmpl.defaultControls.map(c=>({...c})),
          buildMode:  true, onDelete: onDelNode,
        },
      }])
    }
  }, [onDelNode])

  /* ── catalog: save ── */
  const handleSave = useCallback((name, nodesOverride, edgesOverride) => {
    savePipeline(name, nodesOverride ?? nodesRef.current, edgesOverride ?? edgesRef.current)
    setPipelineName(name)
  }, [])

  /* ── catalog: load ── */
  const handleLoad = useCallback(pipeline => {
    runAbort.current = true
    setRunning(false)
    setBuildMode(false)
    const { nodes: n, edges: e } = hydratePipeline(pipeline, onDelNode, onDelEdge)
    setNodes(n); setEdges(e)
    setPipelineName(pipeline.name)
    setLog([{msg:`Loaded "${pipeline.name}"`,type:'info'}])
  }, [onDelNode, onDelEdge])

  /* ── run helpers ── */
  const addLog = useCallback((msg,type) => setLog(l=>[...l.slice(-13),{msg,type}]),[])

  const setNodeField = useCallback((id,patch) =>
    setNodes(nds=>nds.map(n=>n.id===id?{...n,data:{...n.data,...patch}}:n))
  ,[])

  const animEdges = useCallback((ids,on)=>{
    setEdges(eds=>eds.map(e=>ids.includes(e.id)
      ?{...e,data:{...e.data,animated:on},
          markerEnd:{type:MarkerType.ArrowClosed,width:14,height:14,color:on?'var(--magenta)':'rgba(255,255,255,0.2)'}}
      :e
    ))
  },[])

  /* ── DYNAMIC RUN ── */
  const startRun = useCallback(async () => {
    if (running) return
    setRunning(true); runAbort.current = false; setLog([])
    const currentNodes = nodesRef.current
    const currentEdges = edgesRef.current

    setNodes(nds=>nds.map(n=>n.type==='pipeline'
      ?{...n,data:{...n.data,status:'idle',lastOutput:null,_progress:0}}:n))
    await delay(80)

    const waves = buildExecutionPlan(currentNodes, currentEdges)
    if (!waves.length) { addLog('No executable nodes found','info'); setRunning(false); return }

    const pipeCount = currentNodes.filter(n=>n.type==='pipeline').length
    addLog(`Pipeline: ${waves.length} stage(s), ${pipeCount} node(s)`,'info')

    const outputs = {}

    for (let wi=0; wi<waves.length; wi++) {
      if (runAbort.current) break
      const wave = waves[wi]
      if (wave.edgeIds.length) animEdges(wave.edgeIds, true)

      const getInput = nodeId => {
        const inEdge = currentEdges.find(e=>e.target===nodeId && outputs[e.source]!=null)
        return inEdge ? outputs[inEdge.source] : null
      }

      const wavePromises = wave.nodeIds.map(async nodeId => {
        const snap    = nodesRef.current.find(n=>n.id===nodeId)
        if (!snap) return
        const def     = NODE_DEFS[snap.data.nodeDefId]
        const label   = snap.data.title ?? nodeId
        setNodeField(nodeId, {status:'running'})

        if (!def?.run) {
          addLog(`⊘ ${label} — no run()`, 'info')
          setNodeField(nodeId, {status:'done',lastOutput:'pass-through'})
          return
        }

        const abortCtrl = new AbortController()
        const check = setInterval(()=>{ if(runAbort.current) abortCtrl.abort() },100)

        try {
          const result = await def.run(
            {...snap.data},
            {
              log: msg=>addLog(`[${label}] ${msg}`,'info'),
              signal: abortCtrl.signal,
              input: getInput(nodeId),
              setNodeData: patch=>setNodeField(nodeId,patch),
            }
          )
          clearInterval(check)
          if (result.ok) {
            outputs[nodeId] = result.output ?? null
            setNodeField(nodeId, {status:'done', lastOutput:result.message??'ok', _lastRunOutput: result.output ?? null})
          } else {
            setNodeField(nodeId, {status:'error', lastOutput:result.message??'error', _lastRunOutput: null})
            addLog(`✗ ${label}: ${result.message??'failed'}`,'error')
          }
        } catch(err) {
          clearInterval(check)
          setNodeField(nodeId, {status:'error', lastOutput:err.message, _lastRunOutput: null})
          addLog(`✗ ${label}: ${err.message}`,'error')
        }
      })

      await Promise.all(wavePromises)
      if (wave.edgeIds.length) animEdges(wave.edgeIds, false)
      const stageLabel = wave.nodeIds.map(id=>currentNodes.find(n=>n.id===id)?.data?.title??id).join(', ')
      addLog(`✓ Stage ${wi+1} (${stageLabel})`,'ok')
      await delay(200)
    }
    setRunning(false)
  }, [running, setNodeField, animEdges, addLog])

  /* ── reset ── */
  const resetAll = useCallback(()=>{
    runAbort.current = true; setRunning(false)
    setNodes(nds=>nds.map(n=>n.type==='pipeline'?{...n,data:{...n.data,status:'idle',lastOutput:null,_progress:0}}:n))
    setEdges(eds=>eds.map(e=>({...e,data:{...e.data,animated:false},
      markerEnd:{type:MarkerType.ArrowClosed,width:14,height:14,color:'rgba(255,255,255,0.2)'}})))
    setLog([{msg:'Idle — press Run',type:'info'}])
  },[])

  /* ── render ── */
  return (
    <div style={{display:'flex',flexDirection:'column',width:'100%',height:'100%'}}>

      {/* ── Top bar ── */}
      <div style={{
        display:'flex', alignItems:'center', gap:10, padding:'8px 16px',
        background:'var(--surface)', borderBottom:'1px solid var(--border2)', flexShrink:0,
      }}>
        <div style={{fontFamily:'var(--font-mono)',fontSize:14,fontWeight:500,color:'var(--magenta-light)',flexShrink:0}}>
          ⬡ Pipeline Builder
        </div>

        {/* Pipeline name badge */}
        {pipelineName && (
          <div style={{
            fontSize:11, color:'var(--muted)', fontFamily:'var(--font-mono)',
            background:'var(--surface2)', border:'1px solid var(--border)',
            borderRadius:999, padding:'3px 10px', maxWidth:200,
            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
          }}>{pipelineName}</div>
        )}

        <div style={{flex:1}} />

        {/* Catalog button */}
        <button onClick={()=>setShowCatalog(true)} disabled={running} style={{
          display:'flex', alignItems:'center', gap:5,
          padding:'6px 13px', borderRadius:999,
          background:'var(--surface2)', border:'1px solid var(--border2)',
          color:'var(--text)', fontSize:12, cursor:running?'not-allowed':'pointer',
          fontFamily:'var(--font-ui)', opacity:running?0.5:1,
        }}>📁 Catalog</button>

        {/* Build / View toggle */}
        <button onClick={toggleBuild} disabled={running} style={{
          display:'flex', alignItems:'center', gap:5,
          padding:'6px 13px', borderRadius:999,
          background: buildMode?'var(--magenta-subtle)':'var(--surface2)',
          border:`1px solid ${buildMode?'var(--magenta)':'var(--border2)'}`,
          color: buildMode?'var(--magenta-light)':'var(--muted)',
          fontSize:12, fontWeight:500, cursor:running?'not-allowed':'pointer',
          fontFamily:'var(--font-ui)', transition:'all 0.2s', opacity:running?0.5:1,
        }}>{buildMode?'🔧 Build':'👁️ View'}</button>

        {/* Run */}
        <button onClick={startRun} disabled={running||buildMode} style={{
          display:'flex', alignItems:'center', gap:5,
          padding:'7px 18px', borderRadius:999,
          background: running||buildMode?'var(--surface2)':'var(--magenta)',
          border:'1px solid transparent',
          color: running||buildMode?'var(--muted)':'white',
          fontSize:13, fontWeight:500,
          cursor:running||buildMode?'not-allowed':'pointer',
          fontFamily:'var(--font-ui)', transition:'all 0.2s',
        }}>{running?'⏳ Running…':'▶ Run pipeline'}</button>

        {/* Reset */}
        <button onClick={resetAll} style={{
          padding:'7px 13px', borderRadius:999, background:'none',
          border:'1px solid var(--border2)', color:'var(--muted)',
          fontSize:12, cursor:'pointer', fontFamily:'var(--font-ui)',
        }}>↺ Reset</button>
      </div>

      {/* ── Body ── */}
      <div style={{display:'flex',flex:1,overflow:'hidden'}}>
        {buildMode && <NodePalette onAddNode={onAddNode} />}

        <div style={{flex:1,position:'relative'}}>
          <ReactFlow
            nodes={nodes} edges={edges}
            onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
            onConnect={buildMode?onConnect:undefined}
            nodeTypes={nodeTypes} edgeTypes={edgeTypes}
            nodesDraggable={true} nodesConnectable={buildMode}
            elementsSelectable={true}
            deleteKeyCode={buildMode?'Backspace':null}
            fitView fitViewOptions={{padding:0.18}}
            minZoom={0.25} maxZoom={2.5}
          >
            <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="rgba(255,255,255,0.07)"/>
            <Controls/>
            <MiniMap
              nodeColor={n=>{
                if(n.type==='group') return 'rgba(255,255,255,0.05)'
                const s=n.data?.status
                return s==='done'?'var(--magenta-dark)':s==='running'?'var(--magenta)':s==='error'?'#E05252':'#3a3a38'
              }}
              maskColor="rgba(15,15,14,0.6)" style={{bottom:80}}
            />
          </ReactFlow>

          {/* Build mode hint */}
          {buildMode && (
            <div style={{
              position:'absolute', bottom:16, left:'50%', transform:'translateX(-50%)',
              background:'rgba(226,0,116,0.08)', border:'1px solid rgba(226,0,116,0.25)',
              borderRadius:999, padding:'6px 16px', fontSize:12, color:'var(--magenta-light)',
              fontFamily:'var(--font-mono)', pointerEvents:'none', whiteSpace:'nowrap',
            }}>
              Drag to move · Handle→Handle to connect · × to delete · Backspace removes selected
            </div>
          )}

          {/* Activity log */}
          {!buildMode && (
            <div style={{
              position:'absolute', top:12, right:12, width:230, maxHeight:220,
              background:'var(--surface)', border:'1px solid var(--border2)',
              borderRadius:8, overflow:'hidden', zIndex:10,
            }}>
              <div style={{
                padding:'7px 10px 5px', fontSize:10, fontWeight:600,
                letterSpacing:'0.08em', textTransform:'uppercase',
                color:'var(--muted)', fontFamily:'var(--font-mono)',
                borderBottom:'1px solid var(--border)',
              }}>Activity log</div>
              <div style={{padding:'4px 10px 8px',overflow:'auto',maxHeight:175}}>
                {log.map((l,i)=>(
                  <div key={i} style={{
                    fontSize:11, lineHeight:1.7,
                    color:l.type==='ok'?'var(--magenta-light)':l.type==='error'?'var(--red)':'var(--muted)',
                  }}>{l.msg}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Catalog Modal ── */}
      {showCatalog && (
        <CatalogModal
          onClose={()=>setShowCatalog(false)}
          onLoad={handleLoad}
          onSave={handleSave}
          currentName={pipelineName}
        />
      )}
    </div>
  )
}
