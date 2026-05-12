/**
 * BACKEND CALL NODE
 * ─────────────────
 * Simulates an async HTTP call to a backend service with the current item's data.
 * Designed to run inside a Loop or Subflow — receives { item, index, total } as input.
 *
 * In production: replace the simulated delay + mock response with a real fetch().
 *
 * Output: { success, statusCode, responseTime, requestId, data, item }
 */
const delay = ms => new Promise(r => setTimeout(r, ms))

const BackendCallNode = {
  id:     'backend-call',
  title:  'Backend Call',
  icon:   '🌐',
  iconBg: '#1a2838',
  group:  'processing',

  doc: `Makes an async HTTP call to a backend service with the current item's data.

## When to use
Place inside a Loop node or Subflow to process each row/item individually.
Receives { item, index, total } from the parent Loop or Subflow.

## Simulated behaviour
Mimics a real REST API call with:
- Random realistic latency (80–400 ms)
- Configurable endpoint method
- Occasional simulated 5xx errors (based on error rate setting)
- Returns { success, statusCode, responseTime, requestId, data }

## Controls
- Method: HTTP verb to simulate
- Endpoint: path suffix appended to the subflow's base URL
- Error rate: percentage of calls that randomly fail (for testing error paths)
- Log response: write response summary to the activity log`,

  inputType:  '{ item, index, total }',
  outputType: '{ success, statusCode, responseTime, requestId, data }',
  resultType: 'stats',

  defaultControls: [
    { type: 'select',   label: 'Method',      key: 'method',    val: 'POST',    opts: ['POST', 'PUT', 'PATCH', 'GET'] },
    { type: 'select',   label: 'Endpoint',    key: 'endpoint',  val: '/process', opts: ['/process', '/validate', '/enrich', '/store'] },
    { type: 'select',   label: 'Error rate',  key: 'errorRate', val: '0%',      opts: ['0%', '5%', '10%', '20%'] },
    { type: 'toggle',   label: 'Log response',key: 'logResp',   val: true },
  ],

  async run(nodeData, ctx) {
    const method    = nodeData.controls.find(c => c.key === 'method')?.val    ?? 'POST'
    const endpoint  = nodeData.controls.find(c => c.key === 'endpoint')?.val  ?? '/process'
    const errorRate = nodeData.controls.find(c => c.key === 'errorRate')?.val ?? '0%'
    const logResp   = nodeData.controls.find(c => c.key === 'logResp')?.val   ?? true

    const item  = ctx.input?.item  ?? ctx.input ?? {}
    const index = ctx.input?.index ?? 0

    const errorPct = parseInt(errorRate) / 100
    const shouldFail = Math.random() < errorPct

    // Simulate realistic network latency
    const latency = 80 + Math.floor(Math.random() * 320)
    await delay(latency)
    if (ctx.signal.aborted) return { ok: false, message: 'aborted' }

    const requestId = `req_${Date.now().toString(36)}_${index}`

    if (shouldFail) {
      const msg = `HTTP 503 — service unavailable (item ${index + 1})`
      if (logResp) ctx.log(msg)
      return {
        ok: false,
        message: msg,
        output: { success: false, statusCode: 503, responseTime: latency, requestId, data: null, item },
      }
    }

    const statusCode = 200
    const responseData = {
      id:        requestId,
      processed: true,
      item,
      timestamp: new Date().toISOString(),
      meta:      { method, endpoint, latency },
    }

    if (logResp) ctx.log(`${method} ${endpoint} → ${statusCode} (${latency}ms, item ${index + 1})`)

    return {
      ok: true,
      message: `${statusCode} OK in ${latency}ms`,
      output: {
        success:      true,
        statusCode,
        responseTime: latency,
        requestId,
        data:         responseData,
        item,
      },
    }
  },
}

export default BackendCallNode
