/**
 * subflowRegistry.js
 * ──────────────────
 * Defines named Subflow types — reusable sub-pipeline containers that
 * behave like pipeline nodes (have controls, doc, run()) but also act
 * as ReactFlow parent nodes whose children execute as a sub-graph.
 *
 * To add a new subflow type:
 *  1. Define an object with the same shape as a node definition
 *     (id, title, icon, iconBg, accentColor, doc, defaultControls, resultType, run)
 *  2. Add it to SUBFLOW_DEFS below.
 *
 * The subflow's run() is called by the execution engine BEFORE the child
 * nodes execute. It can pre-process input, set context, etc.
 * Child nodes then execute in topological order.
 * After all children finish the engine calls subflow.collectResult()
 * (if defined) to produce the final output passed downstream.
 */

const delay = ms => new Promise(r => setTimeout(r, ms))

/* ── Backend API Subflow ─────────────────────────────────────── */
const BackendApiSubflow = {
  id:          'backend-api-subflow',
  title:       'Backend API Subflow',
  icon:        '🔗',
  iconBg:      'rgba(74,144,217,0.25)',
  accentColor: '#4A90D9',
  group:       'subflow',

  doc: `A reusable sub-pipeline for making backend API calls per row of input data.

## How it works
1. Receives the full dataset from upstream (rows, columns)
2. Exposes each row to the child nodes as { item, index, total }
3. Child nodes make backend calls, transform, or validate each item
4. Collects all child outputs into a results array downstream

## Child nodes
Drop any pipeline node inside this subflow. They receive:
  { item: <row object>, index: <number>, total: <number> }

## Controls
- Endpoint: the base URL prefix passed to child API call nodes
- Auth: whether to include authorization headers
- Concurrency: how many items to process in parallel`,

  inputType:  '{ rows[], columns[] }',
  outputType: '{ results[], errors[], total, succeeded, failed }',
  resultType: 'stats',

  defaultControls: [
    { type: 'select', label: 'Endpoint',    key: 'endpoint',    val: '/api/v1',   opts: ['/api/v1', '/api/v2', '/internal', 'custom'] },
    { type: 'toggle', label: 'Auth header', key: 'auth',        val: true },
    { type: 'select', label: 'Concurrency', key: 'concurrency', val: '1',         opts: ['1', '3', '5', '10'] },
  ],

  async run(nodeData, ctx) {
    const endpoint = nodeData.controls?.find(c => c.key === 'endpoint')?.val ?? '/api/v1'
    const auth     = nodeData.controls?.find(c => c.key === 'auth')?.val     ?? true
    ctx.log(`Backend API Subflow initialising (${endpoint}${auth ? ', authenticated' : ''})…`)
    await delay(100)
    return { ok: true, message: 'subflow ready', output: ctx.input }
  },
}

/* ── Data Processing Subflow ─────────────────────────────────── */
const DataProcessingSubflow = {
  id:          'data-processing-subflow',
  title:       'Data Processing Subflow',
  icon:        '⚙️',
  iconBg:      'rgba(29,158,117,0.25)',
  accentColor: '#1D9E75',
  group:       'subflow',

  doc: `A reusable sub-pipeline for multi-step data processing.
Wrap complex transform chains inside this subflow to keep the outer pipeline clean.

## Controls
- Mode: processing strategy (stream, batch, or parallel)
- Retry on fail: automatically retry failed steps`,

  inputType:  'any',
  outputType: 'any',
  resultType: 'stats',

  defaultControls: [
    { type: 'select', label: 'Mode',          key: 'mode',   val: 'batch',    opts: ['stream', 'batch', 'parallel'] },
    { type: 'toggle', label: 'Retry on fail', key: 'retry',  val: false },
  ],

  async run(nodeData, ctx) {
    const mode = nodeData.controls?.find(c => c.key === 'mode')?.val ?? 'batch'
    ctx.log(`Data Processing Subflow (${mode} mode) ready`)
    return { ok: true, message: 'subflow ready', output: ctx.input }
  },
}

/* ── Registry ────────────────────────────────────────────────── */
export const SUBFLOW_DEFS = {
  [BackendApiSubflow.id]:      BackendApiSubflow,
  [DataProcessingSubflow.id]:  DataProcessingSubflow,
}

export default SUBFLOW_DEFS
