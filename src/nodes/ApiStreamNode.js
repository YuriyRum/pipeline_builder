/**
 * API STREAM NODE
 * Simulates polling or streaming from an HTTP endpoint.
 */

const delay = ms => new Promise(r => setTimeout(r, ms))

const ApiStreamNode = {
  id:     'api-stream',
  title:  'API stream',
  icon:   '🌐',
  iconBg: '#1a2838',
  group:  'ingestion',

  defaultControls: [
    { type: 'toggle',   label: 'Enabled',    key: 'enabled', val: true },
    { type: 'select',   label: 'Method',     key: 'method',  val: 'GET',  opts: ['GET', 'POST', 'WebSocket'] },
    { type: 'checkbox', label: 'Auth token', key: 'auth',    val: true },
    { type: 'select',   label: 'Retry',      key: 'retry',   val: '3×',   opts: ['1×', '3×', '5×', 'none'] },
  ],

  async run(nodeData, ctx) {
    const enabled = nodeData.controls.find(c => c.key === 'enabled')?.val ?? true
    const method  = nodeData.controls.find(c => c.key === 'method')?.val  ?? 'GET'
    const auth    = nodeData.controls.find(c => c.key === 'auth')?.val    ?? false

    if (!enabled) {
      ctx.log('Node disabled — skipping')
      return { ok: true, message: 'disabled (skipped)', output: null }
    }

    ctx.log(`Connecting via ${method}${auth ? ' (authenticated)' : ''}…`)
    await delay(500)
    if (ctx.signal.aborted) return { ok: false, message: 'aborted' }

    ctx.log('Receiving stream…')
    await delay(700)
    if (ctx.signal.aborted) return { ok: false, message: 'aborted' }

    const records = Math.floor(Math.random() * 500) + 100
    ctx.log(`${records} records received`)

    return {
      ok: true,
      message: `${records} records via ${method}`,
      output: { records, method },
    }
  },
}

export default ApiStreamNode
