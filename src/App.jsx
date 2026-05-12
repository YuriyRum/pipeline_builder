import { useCallback, useEffect, useRef, useState } from 'react'
import ReactFlow, {
  Background, Controls, MiniMap,
  addEdge, applyNodeChanges, applyEdgeChanges,
  MarkerType, BackgroundVariant,
} from 'reactflow'
import 'reactflow/dist/style.css'

import PipelineNode  from './PipelineNode'
import GroupNode     from './GroupNode'
import SubflowNode   from './nodes/SubflowNode.jsx'
import IfNode        from './nodes/IfNode.jsx'
import LoopNode      from './nodes/LoopNode.jsx'
import PipelineEdge  from './PipelineEdge'
import NodePalette   from './NodePalette'
import CatalogModal  from './CatalogModal'
import { NODE_DEFS } from './nodes/registry.js'
import { savePipeline, loadSession, saveSession } from './pipelineStore.js'
import { PRESETS } from './presets.js'

const nodeTypes = { pipeline: PipelineNode, group: GroupNode, subflow: SubflowNode, 'if-branch': IfNode, loop: LoopNode }
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
/* ── execution engine helpers ─────────────────────────────────
 *
 * Supports:
 *  - Normal pipeline nodes (topological wave execution)
 *  - If/Branch nodes  — only one branch's downstream nodes run; the other
 *    branch is "skipped" (optional nodes that don't block completion)
 *  - Loop nodes       — iterate over array, run children per item
 *  - Optional nodes   — nodes only reachable via an un-taken branch;
 *    marked 'skipped' and count as done for pipeline completion purposes
 * ─────────────────────────────────────────────────────────── */

const EXECUTABLE_TYPES = new Set(['pipeline','if-branch','loop','subflow'])

function buildExecutionPlan(nodes, edges) {
  const pnodes = nodes.filter(n => EXECUTABLE_TYPES.has(n.type) && !n.parentId)
  const pids   = new Set(pnodes.map(n => n.id))
  const pedges = edges.filter(e => pids.has(e.source) && pids.has(e.target))
  const inDeg  = {}; const adjOut = {}
  pnodes.forEach(n => { inDeg[n.id] = 0; adjOut[n.id] = [] })
  pedges.forEach(e => {
    inDeg[e.target] = (inDeg[e.target]||0)+1
    adjOut[e.source].push({ id: e.target, edgeId: e.id, sourceHandle: e.sourceHandle })
  })
  const waves = []; let queue = pnodes.filter(n=>inDeg[n.id]===0).map(n=>n.id)
  while (queue.length > 0) {
    waves.push({
      nodeIds: [...queue],
      edgeIds: pedges.filter(e=>queue.includes(e.target)).map(e=>e.id),
    })
    const next = []
    queue.forEach(nid => adjOut[nid].forEach(({id:tid}) => {
      if(--inDeg[tid]===0) next.push(tid)
    }))
    queue = next
  }
  return waves
}

/** Return all downstream node ids reachable from `fromId` (excluding fromId itself). */
function getReachable(fromId, edges, nodeIds) {
  const reachable = new Set()
  const queue = [fromId]
  while (queue.length) {
    const cur = queue.pop()
    edges.filter(e => e.source === cur && nodeIds.has(e.target)).forEach(e => {
      if (!reachable.has(e.target)) { reachable.add(e.target); queue.push(e.target) }
    })
  }
  return reachable
}

const delay = ms => new Promise(r => setTimeout(r, ms))

/* ── hydrate a saved/preset pipeline into live ReactFlow state ── */
function hydratePipeline(pipeline, onDelNode, onDelEdge) {
  const nodes = pipeline.nodes.map(n => {
    const node = {
      ...n,
      position: { x: n.position?.x ?? 0, y: n.position?.y ?? 0 },
      data: {
        ...n.data,
        status: 'idle', lastOutput: null, _progress: 0,
        _lastRunOutput: null,
        buildMode: false, onDelete: onDelNode,
      },
      // Restore parent relationship for subflow children
      ...(n.parentId && { parentId: n.parentId }),
      ...(n.extent   && { extent:   n.extent   }),
    }
    // Restore saved size
    if (n.style?.width || n.width) {
      node.style = {
        ...(n.style ?? {}),
        width:  n.style?.width  ?? n.width,
        height: n.style?.height ?? n.height,
      }
    }
    return node
  })
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
  const [unsaved,      setUnsaved]      = useState(false)
  const [selectedSubflowId, setSelectedSubflowId] = useState(null)
  const [saveFlash,    setSaveFlash]    = useState(false) // brief green flash after save

  const runAbort = useRef(false)
  const nodesRef = useRef(nodes)
  const edgesRef = useRef(edges)
  // Keep refs fresh (no auto-save — user triggers saves explicitly)
  useEffect(() => { nodesRef.current = nodes;  setUnsaved(true) }, [nodes])
  useEffect(() => { edgesRef.current = edges;  setUnsaved(true) }, [edges])

  // ── delete handlers (stable refs needed for hydration) ──
  const onDelEdge = useCallback(id => setEdges(eds => eds.filter(e => e.id !== id)), [])
  const onDelNode = useCallback(id => {
    // When deleting a subflow, also remove its child nodes
    setNodes(nds => nds.filter(n => n.id !== id && n.parentId !== id))
    setEdges(eds => eds.filter(e => e.source !== id && e.target !== id))
  }, [])

  // On mount: restore last session, or fall back to the CSV preset
  useEffect(() => {
    const session = loadSession()
    if (session?.pipeline?.nodes?.length) {
      const { nodes: n, edges: e } = hydratePipeline(session.pipeline, onDelNode, onDelEdge)
      setNodes(n); setEdges(e)
      setPipelineName(session.name || session.pipeline.name || '')
    } else {
      const { nodes: n, edges: e } = hydratePipeline(INITIAL_PRESET, onDelNode, onDelEdge)
      setNodes(n); setEdges(e)
      setPipelineName(INITIAL_PRESET.name)
    }
    setUnsaved(false)
  }, []) // eslint-disable-line

  /* ── ReactFlow ── */
  const onNodesChange = useCallback(c => {
    setNodes(prev => {
      const next = applyNodeChanges(c, prev)
      // Track which subflow (if any) is currently selected
      const sel = next.find(n => n.type === 'subflow' && n.selected)
      setSelectedSubflowId(sel?.id ?? null)
      return next
    })
  }, [])
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
  const onAddNode = useCallback((tmpl, parentId) => {
    if (tmpl.type === 'group') {
      setNodes(nds => [...nds, {
        id:uid_(), type:'group',
        position:{x:80+Math.random()*100, y:80+Math.random()*80},
        style:{width:260,height:200},
        data:{label:tmpl.gLabel,bg:tmpl.bg,border:tmpl.border,labelColor:tmpl.lc,buildMode:true,onDelete:onDelNode},
      }])
    } else if (tmpl.type === 'subflow') {
      const sfDef = null  // no subflow registry — use template values directly
      setNodes(nds => [...nds, {
        id:uid_(), type:'subflow',
        position:{x:120+Math.random()*80, y:100+Math.random()*60},
        style:{width:340,height:240},
        data:{
          subflowDefId: tmpl.subflowDefId ?? null,
          title:        sfDef?.title       ?? tmpl.gLabel ?? 'Subflow',
          icon:         sfDef?.icon        ?? '⬡',
          iconBg:       sfDef?.iconBg      ?? 'rgba(226,0,116,0.2)',
          accentColor:  sfDef?.accentColor ?? tmpl.border ?? '#E20074',
          controls:     (sfDef?.defaultControls ?? []).map(c=>({...c})),
          status:       'idle', lastOutput:null,
          buildMode:    true, onDelete: onDelNode,
        },
      }])
    } else {
      // Pipeline node (or control node: if-branch, loop) — optionally inside a subflow
      const nodeId = uid_()
      // if-branch and loop have their own ReactFlow node types
      const rfType = tmpl.id === 'if-branch' ? 'if-branch'
                   : tmpl.id === 'loop'       ? 'loop'
                   : 'pipeline'
      const base = {
        id:       nodeId,
        type:     rfType,
        position: parentId
          ? { x: 30 + Math.random()*60, y: 50 + Math.random()*40 }  // relative to parent
          : { x: 180+Math.random()*200, y:120+Math.random()*160 },
        data: {
          nodeDefId:  tmpl.id,
          title:      tmpl.title,
          icon:       tmpl.icon,
          iconBg:     tmpl.iconBg,
          status:     'idle', lastOutput:null,
          controls:   tmpl.defaultControls.map(c=>({...c})),
          buildMode:  true, onDelete: onDelNode,
        },
      }
      if (parentId) {
        base.parentId = parentId
        base.extent   = 'parent'
      }
      setNodes(nds => [...nds, base])
    }
  }, [onDelNode])

  /* ── catalog: save ── */
  const handleSave = useCallback((name, nodesOverride, edgesOverride) => {
    const nm = name ?? pipelineName
    if (!nm) return
    savePipeline(nm, nodesOverride ?? nodesRef.current, edgesOverride ?? edgesRef.current)
    saveSession(nm, nodesOverride ?? nodesRef.current, edgesOverride ?? edgesRef.current)
    setPipelineName(nm)
    setUnsaved(false)
    setSaveFlash(true)
    setTimeout(() => setSaveFlash(false), 1500)
  }, [pipelineName])

  /* ── quick save (Ctrl/Cmd+S) ── */
  const quickSave = useCallback(() => {
    if (pipelineName) handleSave(pipelineName)
    else setShowCatalog(true)
  }, [pipelineName, handleSave])

  // Ctrl/Cmd+S keyboard shortcut — must be after quickSave is declared
  useEffect(() => {
    const fn = e => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        quickSave()
      }
    }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [quickSave])

  /* ── catalog: load ── */
  const handleLoad = useCallback(pipeline => {
    runAbort.current = true
    setRunning(false)
    setBuildMode(false)
    const { nodes: n, edges: e } = hydratePipeline(pipeline, onDelNode, onDelEdge)
    setNodes(n); setEdges(e)
    setPipelineName(pipeline.name)
    setUnsaved(false)
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

    // Reset all executable nodes to idle
    setNodes(nds => nds.map(n =>
      EXECUTABLE_TYPES.has(n.type)
        ? {...n, data:{...n.data, status:'idle', lastOutput:null, _progress:0, _lastRunOutput:null, _loopProgress:null}}
        : n
    ))
    await delay(80)

    const waves     = buildExecutionPlan(currentNodes, currentEdges)
    const allPipeIds = new Set(currentNodes.filter(n=>EXECUTABLE_TYPES.has(n.type)&&!n.parentId).map(n=>n.id))

    if (!waves.length) { addLog('No executable nodes found','info'); setRunning(false); return }
    addLog(`Pipeline: ${waves.length} stage(s), ${allPipeIds.size} node(s)`,'info')

    const outputs  = {}   // nodeId → output value
    const skipped  = new Set()  // nodeIds that should be skipped (un-taken branch)

    /* ── helper: run one node ── */
    const runNode = async (nodeId, inputOverride) => {
      if (skipped.has(nodeId)) {
        setNodeField(nodeId, {status:'skipped', lastOutput:'skipped (optional)'})
        return
      }
      const snap  = nodesRef.current.find(n=>n.id===nodeId)
      if (!snap) return
      const def   = NODE_DEFS[snap.data.nodeDefId]
      const label = snap.data.title ?? nodeId
      const input = inputOverride ?? (() => {
        const inEdge = currentEdges.find(e=>e.target===nodeId && outputs[e.source]!=null)
        return inEdge ? outputs[inEdge.source] : null
      })()

      // ── Loop node: engine handles iteration ──────────────────
      if (def?.isLoopNode) {
        setNodeField(nodeId, {status:'running'})
        const arrayField  = snap.data.controls?.find(c=>c.key==='arrayField')?.val ?? 'auto'
        const maxIterStr  = snap.data.controls?.find(c=>c.key==='maxIter')?.val    ?? '100'
        const stopOnErr   = snap.data.controls?.find(c=>c.key==='stopOnError')?.val ?? false
        const maxIter     = maxIterStr === 'unlimited' ? Infinity : Number(maxIterStr)

        // Detect array to iterate
        let arr = []
        if (arrayField === 'auto') {
          arr = Array.isArray(input) ? input
              : Array.isArray(input?.rows)    ? input.rows
              : Array.isArray(input?.items)   ? input.items
              : Array.isArray(input?.lines)   ? input.lines
              : Array.isArray(input?.results) ? input.results
              : Array.isArray(input?.data)    ? input.data
              : []
        } else {
          arr = Array.isArray(input?.[arrayField]) ? input[arrayField] : []
        }
        arr = arr.slice(0, maxIter)

        addLog(`[${label}] Iterating ${arr.length} item(s)…`, 'info')

        const childNodes = currentNodes.filter(n=>n.parentId===nodeId && EXECUTABLE_TYPES.has(n.type))
        const iterResults = []; const iterErrors = []

        for (let i=0; i<arr.length; i++) {
          if (runAbort.current) break
          setNodeField(nodeId, {_loopProgress:{current:i+1,total:arr.length}})
          const item = arr[i]

          // Reset children for this iteration
          childNodes.forEach(cn => setNodeField(cn.id, {status:'idle',lastOutput:null}))

          // Run child pipeline for this item
          const childEdges = currentEdges.filter(e=>
            childNodes.some(n=>n.id===e.source) && childNodes.some(n=>n.id===e.target)
          )
          const childOutputs = {}
          // Simple sequential execution of children (topological)
          const childById = Object.fromEntries(childNodes.map(n=>[n.id,n]))
          const childInDeg = {}; const childAdj = {}
          childNodes.forEach(n=>{childInDeg[n.id]=0;childAdj[n.id]=[]})
          childEdges.forEach(e=>{childInDeg[e.target]=(childInDeg[e.target]||0)+1;childAdj[e.source].push(e.target)})
          let queue = childNodes.filter(n=>childInDeg[n.id]===0).map(n=>n.id)
          let iterFailed = false
          while (queue.length && !runAbort.current) {
            const next = []
            for (const cid of queue) {
              const csnap = nodesRef.current.find(n=>n.id===cid)
              const cdef  = NODE_DEFS[csnap?.data?.nodeDefId]
              const cinput = (() => {
                const ce = childEdges.find(e=>e.target===cid && childOutputs[e.source]!=null)
                return ce ? childOutputs[ce.source] : {item,index:i,total:arr.length}
              })()
              setNodeField(cid, {status:'running'})
              try {
                const ac = new AbortController()
                const ck = setInterval(()=>{if(runAbort.current)ac.abort()},100)
                const res = cdef?.run ? await cdef.run({...csnap.data},{
                  log:()=>{}, signal:ac.signal, input:cinput, setNodeData:p=>setNodeField(cid,p)
                }) : {ok:true,output:cinput}
                clearInterval(ck)
                if (res.ok) { childOutputs[cid]=res.output??null; setNodeField(cid,{status:'done',lastOutput:`iter ${i+1}`}) }
                else { setNodeField(cid,{status:'error',lastOutput:res.message}); if(stopOnErr){iterFailed=true;break} }
              } catch(e) { setNodeField(cid,{status:'error',lastOutput:e.message}); if(stopOnErr){iterFailed=true;break} }
              childAdj[cid].forEach(tid=>{if(--childInDeg[tid]===0)next.push(tid)})
            }
            if (iterFailed) break
            queue = next
          }

          // Collect last child output
          const lastChildId = childNodes[childNodes.length-1]?.id
          const iterOut = lastChildId ? childOutputs[lastChildId] : {item,index:i}
          if (iterFailed) iterErrors.push({index:i,item,error:'iteration failed'})
          else iterResults.push(iterOut ?? {item,index:i})
          await delay(30)
        }

        setNodeField(nodeId, {
          _loopProgress: null, status:'done',
          lastOutput:`${iterResults.length}/${arr.length} ok`,
          _lastRunOutput:{results:iterResults,errors:iterErrors,total:arr.length,succeeded:iterResults.length,failed:iterErrors.length},
        })
        outputs[nodeId] = {results:iterResults,errors:iterErrors,total:arr.length,succeeded:iterResults.length,failed:iterErrors.length}
        return
      }

      // ── If/Branch node ───────────────────────────────────────
      if (def?.isControlNode && snap.type === 'if-branch') {
        setNodeField(nodeId, {status:'running'})
        const abortCtrl = new AbortController()
        const check = setInterval(()=>{if(runAbort.current)abortCtrl.abort()},100)
        try {
          const result = await def.run({...snap.data},{
            log: msg=>addLog(`[${label}] ${msg}`,'info'),
            signal:abortCtrl.signal, input, setNodeData:p=>setNodeField(nodeId,p),
          })
          clearInterval(check)
          if (result.ok) {
            outputs[nodeId] = result.output ?? null
            setNodeField(nodeId,{status:'done',lastOutput:result.message??`→ ${result.branch}`,_lastRunOutput:result.output})

            // Mark un-taken branch as skipped
            const takenHandle   = result.branch === 'true' ? 'true' : 'false'
            const skippedHandle = result.branch === 'true' ? 'false': 'true'
            // Find direct children on the skipped handle
            const skippedEdges  = currentEdges.filter(e=>e.source===nodeId && e.sourceHandle===skippedHandle)
            skippedEdges.forEach(e => {
              // Mark everything reachable from the skipped branch (not also reachable via other paths)
              const reachable = getReachable(e.target, currentEdges, allPipeIds)
              reachable.add(e.target)
              reachable.forEach(rid => {
                // Only skip if not reachable via a non-skipped path
                const hasOtherPath = currentEdges.some(ed =>
                  ed.target===rid && !skippedEdges.some(se=>se.source===nodeId && ed.source===nodeId)
                  && (outputs[ed.source]!=null || ed.source!==nodeId)
                )
                if (!hasOtherPath) skipped.add(rid)
              })
            })
          } else {
            setNodeField(nodeId,{status:'error',lastOutput:result.message??'error',_lastRunOutput:null})
          }
        } catch(err) {
          clearInterval(check)
          setNodeField(nodeId,{status:'error',lastOutput:err.message,_lastRunOutput:null})
        }
        return
      }

      // ── Normal pipeline node ─────────────────────────────────
      setNodeField(nodeId, {status:'running'})
      if (!def?.run) {
        addLog(`⊘ ${label} — no run()`, 'info')
        setNodeField(nodeId, {status:'done',lastOutput:'pass-through'})
        outputs[nodeId] = input
        return
      }
      const abortCtrl = new AbortController()
      const check = setInterval(()=>{if(runAbort.current)abortCtrl.abort()},100)
      try {
        const result = await def.run({...snap.data},{
          log: msg=>addLog(`[${label}] ${msg}`,'info'),
          signal:abortCtrl.signal, input, setNodeData:p=>setNodeField(nodeId,p),
        })
        clearInterval(check)
        if (result.ok) {
          outputs[nodeId] = result.output ?? null
          setNodeField(nodeId,{status:'done',lastOutput:result.message??'ok',_lastRunOutput:result.output??null})
        } else {
          setNodeField(nodeId,{status:'error',lastOutput:result.message??'error',_lastRunOutput:null})
          addLog(`✗ ${label}: ${result.message??'failed'}`,'error')
        }
      } catch(err) {
        clearInterval(check)
        setNodeField(nodeId,{status:'error',lastOutput:err.message,_lastRunOutput:null})
        addLog(`✗ ${label}: ${err.message}`,'error')
      }
    }

    /* ── wave execution ── */
    for (let wi=0; wi<waves.length; wi++) {
      if (runAbort.current) break
      const wave = waves[wi]
      if (wave.edgeIds.length) animEdges(wave.edgeIds, true)

      await Promise.all(wave.nodeIds.map(nodeId => runNode(nodeId)))

      if (wave.edgeIds.length) animEdges(wave.edgeIds, false)
      const stageLabel = wave.nodeIds
        .map(id=>currentNodes.find(n=>n.id===id)?.data?.title??id).join(', ')
      addLog(`✓ Stage ${wi+1} (${stageLabel})`,'ok')
      await delay(200)
    }
    setRunning(false)
  }, [running, setNodeField, animEdges, addLog])

  /* ── reset ── */
  const resetAll = useCallback(()=>{
    runAbort.current = true; setRunning(false)
    setNodes(nds=>nds.map(n=>EXECUTABLE_TYPES.has(n.type)?{...n,data:{...n.data,status:'idle',lastOutput:null,_progress:0,_lastRunOutput:null,_loopProgress:null}}:n))
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
        <div style={{
          display:'flex', alignItems:'center', gap:6,
          background:'var(--surface2)', border:'1px solid var(--border2)',
          borderRadius:999, padding:'2px 4px 2px 12px',
          maxWidth:240, flexShrink:1,
        }}>
          <span style={{
            fontSize:11, color:'var(--muted)', fontFamily:'var(--font-mono)',
            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1,
          }}>{pipelineName || 'Untitled'}</span>
          {unsaved && (
            <div title="Unsaved changes" style={{
              width:7, height:7, borderRadius:'50%', flexShrink:0,
              background:'var(--magenta)', boxShadow:'0 0 6px var(--magenta)',
            }}/>
          )}
        </div>

        <div style={{flex:1}} />

        {/* Save button */}
        <button
          onClick={quickSave}
          disabled={running}
          title={pipelineName ? `Save "${pipelineName}" (Ctrl+S)` : 'Save pipeline (Ctrl+S)'}
          style={{
            display:'flex', alignItems:'center', gap:5,
            padding:'6px 14px', borderRadius:999,
            background: saveFlash ? 'var(--magenta)' : unsaved ? 'var(--magenta-subtle)' : 'var(--surface2)',
            border:`1px solid ${saveFlash ? 'var(--magenta)' : unsaved ? 'var(--magenta)' : 'var(--border2)'}`,
            color: saveFlash ? 'white' : unsaved ? 'var(--magenta-light)' : 'var(--muted)',
            fontSize:12, fontWeight: unsaved ? 500 : 400,
            cursor:running?'not-allowed':'pointer',
            fontFamily:'var(--font-ui)', transition:'all 0.2s',
            opacity:running?0.5:1,
          }}
        >{saveFlash ? '✓ Saved' : '💾 Save'}</button>

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
        {buildMode && <NodePalette onAddNode={onAddNode} selectedSubflowId={selectedSubflowId} />}

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
