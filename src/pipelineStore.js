/**
 * pipelineStore.js
 * Save / load pipelines as JSON in localStorage.
 * Strips all runtime-only / non-serialisable fields before saving.
 */

const STORAGE_KEY = 'pipeline_catalog'

function cleanNode(node) {
  const { buildMode, onDelete, renderBody, _progress, status, lastOutput, ...rest } = node.data ?? {}
  return { id: node.id, type: node.type, position: node.position, style: node.style, data: rest }
}

function cleanEdge(edge) {
  const { animated, buildMode, onDelete, ...restData } = edge.data ?? {}
  return { id: edge.id, source: edge.source, target: edge.target, type: edge.type, markerEnd: edge.markerEnd, data: restData }
}

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
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') }
  catch { return [] }
}
function saveCatalog(catalog) { localStorage.setItem(STORAGE_KEY, JSON.stringify(catalog)) }

export function listPipelines() {
  return loadCatalog().sort((a, b) => b.savedAt.localeCompare(a.savedAt))
}

export function savePipeline(name, nodes, edges) {
  const catalog = loadCatalog()
  const record  = serialisePipeline(name, nodes, edges)
  const idx = catalog.findIndex(p => p.name === name)
  if (idx >= 0) catalog[idx] = record
  else catalog.push(record)
  saveCatalog(catalog)
  return record
}

export function deletePipeline(id) {
  saveCatalog(loadCatalog().filter(p => p.id !== id))
}

export function exportPipelineFile(pipeline) {
  const blob = new Blob([JSON.stringify(pipeline, null, 2)], { type: 'application/json' })
  const url  = URL.createObjectURL(blob)
  const a    = Object.assign(document.createElement('a'), { href: url, download: `${pipeline.name.replace(/\s+/g, '_')}.pipeline.json` })
  a.click()
  URL.revokeObjectURL(url)
}

export function importPipelineFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = e => { try { resolve(JSON.parse(e.target.result)) } catch { reject(new Error('Invalid pipeline JSON')) } }
    reader.onerror = () => reject(new Error('File read failed'))
    reader.readAsText(file)
  })
}
