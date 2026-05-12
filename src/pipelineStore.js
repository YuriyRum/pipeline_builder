/**
 * pipelineStore.js
 * ─────────────────
 * Save / load pipelines in localStorage.
 *
 * Serialisation rules:
 *  - position  → always preserved (x, y)
 *  - style     → always preserved (width, height set by NodeResizer / GroupNode)
 *  - data      → runtime-only fields stripped:
 *                  buildMode, onDelete, renderBody (function),
 *                  _progress, status, lastOutput, _lastRunOutput,
 *                  _file, _rawText, _previewLines (File objects / binary)
 *               everything else (controls, nodeDefId, iconBg, …) kept.
 */

const CATALOG_KEY = 'pipeline_catalog'
const SESSION_KEY = 'pipeline_session'

/* ── strip runtime-only fields from a node ─────────────────── */
const RUNTIME_FIELDS = new Set([
  'buildMode', 'onDelete', 'renderBody',
  '_progress', 'status', 'lastOutput', '_lastRunOutput',
  '_file', '_rawText', '_previewLines',
  // _doc / _resultType / _inputType / _outputType are re-injected by
  // PipelineNode at render-time from the registry, no need to persist
  '_doc', '_resultType', '_inputType', '_outputType', '_defaultControls',
])

function cleanNode(node) {
  const cleanedData = Object.fromEntries(
    Object.entries(node.data ?? {}).filter(([k]) => !RUNTIME_FIELDS.has(k))
  )
  return {
    id:       node.id,
    type:     node.type,
    position: { x: node.position?.x ?? 0, y: node.position?.y ?? 0 },
    style:    node.style ? { ...node.style } : undefined,
    width:    node.width,
    height:   node.height,
    // Preserve subflow child relationship
    ...(node.parentId && { parentId: node.parentId }),
    ...(node.extent   && { extent:   node.extent   }),
    data:     cleanedData,
  }
}

function cleanEdge(edge) {
  // eslint-disable-next-line no-unused-vars
  const { animated, buildMode, onDelete, ...restData } = edge.data ?? {}
  return {
    id:        edge.id,
    source:    edge.source,
    target:    edge.target,
    type:      edge.type,
    markerEnd: edge.markerEnd,
    data:      restData,
  }
}

/* ── public API ────────────────────────────────────────────── */

export function serialisePipeline(name, nodes, edges) {
  return {
    id:      `pl_${Date.now()}`,
    name,
    savedAt: new Date().toISOString(),
    nodes:   nodes.map(cleanNode),
    edges:   edges.map(cleanEdge),
  }
}

function loadCatalog() {
  try { return JSON.parse(localStorage.getItem(CATALOG_KEY) ?? '[]') }
  catch { return [] }
}
function writeCatalog(catalog) {
  localStorage.setItem(CATALOG_KEY, JSON.stringify(catalog))
}

export function listPipelines() {
  return loadCatalog().sort((a, b) => b.savedAt.localeCompare(a.savedAt))
}

/** Save (or overwrite if same name) to the catalog. */
export function savePipeline(name, nodes, edges) {
  const catalog = loadCatalog()
  const record  = serialisePipeline(name, nodes ?? [], edges ?? [])
  const idx     = catalog.findIndex(p => p.name === name)
  if (idx >= 0) catalog[idx] = record
  else catalog.push(record)
  writeCatalog(catalog)
  return record
}

export function deletePipeline(id) {
  writeCatalog(loadCatalog().filter(p => p.id !== id))
}

export function exportPipelineFile(pipeline) {
  const blob = new Blob([JSON.stringify(pipeline, null, 2)], { type: 'application/json' })
  const url  = URL.createObjectURL(blob)
  Object.assign(document.createElement('a'), {
    href:     url,
    download: `${pipeline.name.replace(/\s+/g, '_')}.pipeline.json`,
  }).click()
  URL.revokeObjectURL(url)
}

export function importPipelineFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = e => {
      try { resolve(JSON.parse(e.target.result)) }
      catch { reject(new Error('Invalid pipeline JSON')) }
    }
    reader.onerror = () => reject(new Error('File read failed'))
    reader.readAsText(file)
  })
}

/* ── session: remembers last open pipeline across page reloads ─ */

export function saveSession(name, nodes, edges) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify({
      name,
      pipeline: serialisePipeline(name || 'Untitled', nodes, edges),
    }))
  } catch {}
}

export function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const { name, pipeline } = JSON.parse(raw)
    return { name, pipeline }
  } catch { return null }
}
