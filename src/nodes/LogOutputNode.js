/**
 * LOG OUTPUT NODE
 * ───────────────
 * Collects all results from upstream nodes and writes a structured
 * execution log to the activity panel. Also stores the log as its
 * output so downstream nodes can read it.
 *
 * Works great as the last node inside a Loop or Subflow to
 * summarise what happened per iteration.
 *
 * Output: { log: string[], summary: { total, ok, failed, avgMs } }
 */
const delay = ms => new Promise(r => setTimeout(r, ms))

const LogOutputNode = {
  id:     'log-output',
  title:  'Log Output',
  icon:   '📋',
  iconBg: '#1a2520',
  group:  'output',

  doc: `Collects upstream results and writes a structured log.

## When to use
Place after a Backend Call node (or any processing node) inside a Loop or Subflow.
Summarises all results from the iteration/sub-pipeline into a readable log.

## Output
\`\`\`json
{
  "log": ["line 1", "line 2", ...],
  "summary": {
    "total": 10,
    "ok": 9,
    "failed": 1,
    "avgResponseMs": 142
  }
}
\`\`\`

## Controls
- Format: plain text or JSON structured log
- Include timing: add response time to each log entry
- Severity filter: only log errors, warnings, or all entries`,

  inputType:  '{ success, statusCode, responseTime, data, item }',
  outputType: '{ log[], summary }',
  resultType: 'log',

  defaultControls: [
    { type: 'select', label: 'Format',         key: 'format',   val: 'plain',   opts: ['plain', 'JSON', 'CSV'] },
    { type: 'toggle', label: 'Include timing',  key: 'timing',   val: true },
    { type: 'select', label: 'Severity filter', key: 'severity', val: 'all',    opts: ['all', 'errors only', 'warnings+'] },
  ],

  async run(nodeData, ctx) {
    const format   = nodeData.controls.find(c => c.key === 'format')?.val   ?? 'plain'
    const timing   = nodeData.controls.find(c => c.key === 'timing')?.val   ?? true
    const severity = nodeData.controls.find(c => c.key === 'severity')?.val ?? 'all'

    const input = ctx.input

    await delay(60)
    if (ctx.signal.aborted) return { ok: false, message: 'aborted' }

    const logLines = []
    const summary  = { total: 0, ok: 0, failed: 0, avgResponseMs: 0, totalMs: 0 }

    // Handle both single item results and arrays of results
    const items = Array.isArray(input?.results) ? input.results
      : Array.isArray(input)                     ? input
      : input != null                            ? [input]
      : []

    summary.total = items.length

    for (const r of items) {
      const isOk   = r?.success !== false && r?.ok !== false && r?.statusCode !== 503
      const ms     = r?.responseTime ?? r?.responseTime ?? null
      const id     = r?.requestId ?? r?.id ?? '?'
      const status = r?.statusCode ?? (isOk ? 200 : 500)

      if (isOk) {
        summary.ok++
        if (ms) summary.totalMs += ms
        if (severity === 'all') {
          logLines.push(`✓ ${id}  HTTP ${status}${timing && ms ? `  ${ms}ms` : ''}`)
        }
      } else {
        summary.failed++
        if (severity !== 'errors only' || true) {   // errors always logged
          logLines.push(`✗ ${id}  HTTP ${status}  FAILED`)
        }
      }
    }

    summary.avgResponseMs = summary.ok > 0 ? Math.round(summary.totalMs / summary.ok) : 0

    // Summary footer
    logLines.push('')
    logLines.push(`─── Summary ────────────────────`)
    logLines.push(`Total:    ${summary.total}`)
    logLines.push(`Succeeded: ${summary.ok}`)
    logLines.push(`Failed:    ${summary.failed}`)
    if (summary.avgResponseMs) logLines.push(`Avg time:  ${summary.avgResponseMs}ms`)

    ctx.log(`Log: ${summary.ok}/${summary.total} succeeded`)

    // Store lines for the result dialog
    ctx.setNodeData({ _tableData: null })

    const output = { log: logLines, lines: logLines, summary, raw: logLines.join('\n') }

    return {
      ok:      true,
      message: `${summary.ok}/${summary.total} ok · ${summary.avgResponseMs}ms avg`,
      output,
    }
  },
}

export default LogOutputNode
