/**
 * HTTP EXPORT NODE
 * POSTs processed data to an external HTTP endpoint.
 */

const delay = ms => new Promise(r => setTimeout(r, ms))

const HttpExportNode = {
  id:     'http-export',
  title:  'HTTP Export',
  icon:   '🚀',
  iconBg: '#1e1a30',
  group:  'output',

  defaultControls: [
    { type: 'select',   label: 'Method',  key: 'method',  val: 'POST',   opts: ['POST', 'PUT', 'PATCH'] },
    { type: 'select',   label: 'Format',  key: 'fmt',     val: 'JSON',   opts: ['JSON', 'CSV', 'NDJSON'] },
    { type: 'toggle',   label: 'Auth',    key: 'auth',    val: true  },
    { type: 'select',   label: 'Retries', key: 'retry',   val: '3×',     opts: ['1×', '3×', '5×', 'none'] },
  ],

  async run(nodeData, ctx) {
    const method = nodeData.controls.find(c => c.key === 'method')?.val ?? 'POST'
    const fmt    = nodeData.controls.find(c => c.key === 'fmt')?.val    ?? 'JSON'
    const auth   = nodeData.controls.find(c => c.key === 'auth')?.val   ?? true
    const retry  = nodeData.controls.find(c => c.key === 'retry')?.val  ?? '3×'

    ctx.log(`Preparing ${fmt} payload…`)
    await delay(300)
    if (ctx.signal.aborted) return { ok: false, message: 'aborted' }

    ctx.log(`${method} → endpoint${auth ? ' (Bearer)' : ''}…`)
    await delay(700)
    if (ctx.signal.aborted) return { ok: false, message: 'aborted' }

    // simulate occasional retry
    if (Math.random() < 0.2 && retry !== 'none') {
      ctx.log(`Server 503 — retrying (${retry})…`)
      await delay(500)
    }

    const statusCode = 200
    ctx.log(`HTTP ${statusCode} OK`)

    return {
      ok: true,
      message: `${method} ${fmt} → 200 OK`,
      output: { method, fmt, statusCode },
    }
  },
}

export default HttpExportNode
