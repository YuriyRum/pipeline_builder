/**
 * TIMER / DELAY NODE
 * Introduces a configurable async delay in the pipeline.
 * Demonstrates a custom renderBody with a live countdown UI.
 */

import { ControlRow, MiniSelect } from './NodeCard.jsx'

const DURATIONS = { '0.5s': 500, '1s': 1000, '2s': 2000, '3s': 3000, '5s': 5000 }

/* Custom body rendered inside the shared NodeCard shell */
function TimerBody(nodeData) {
  const dur    = nodeData.controls.find(c => c.key === 'dur')?.val    ?? '1s'
  const reason = nodeData.controls.find(c => c.key === 'reason')?.val ?? 'rate-limit'
  const pct    = nodeData._progress ?? 0   // 0–100, set during run

  return (
    <>
      <ControlRow label="Duration">
        {/* read-only display — changes via updateControl called from run() */}
        <span style={{ fontSize: 12, color: 'var(--text)', fontFamily: 'var(--font-mono)' }}>{dur}</span>
      </ControlRow>
      <ControlRow label="Reason">
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>{reason}</span>
      </ControlRow>
      {pct > 0 && pct < 100 && (
        <div style={{ marginTop: 4 }}>
          <div style={{
            height: 3, background: 'var(--border)',
            borderRadius: 99, overflow: 'hidden',
          }}>
            <div style={{
              width: `${pct}%`, height: '100%',
              background: 'var(--green)',
              transition: 'width 0.15s linear',
            }} />
          </div>
          <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2, textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
            {pct}%
          </div>
        </div>
      )}
    </>
  )
}

const delay = ms => new Promise(r => setTimeout(r, ms))

const TimerNode = {
  id:     'timer',
  title:  'Timer / Delay',
  icon:   '⏱️',
  iconBg: '#1e2030',
  group:  'processing',
  doc: `Introduces a deliberate async delay in the pipeline.
Useful for rate-limiting, cooldown between API calls, or demo pacing.

## Notes
A live progress bar renders inside the node during the delay.
The delay is aborted when you reset the pipeline mid-run.`,
  inputType:  'any',
  outputType: 'passthrough',
  resultType: 'stats',


  defaultControls: [
    { type: 'select', label: 'Duration', key: 'dur',    val: '1s',           opts: Object.keys(DURATIONS) },
    { type: 'select', label: 'Reason',   key: 'reason', val: 'rate-limit',   opts: ['rate-limit', 'backoff', 'cooldown', 'sync'] },
  ],

  /** Custom body function — receives (nodeData, updateControl) */
  renderBody: (nodeData, _updateControl) => TimerBody(nodeData),

  async run(nodeData, ctx) {
    const durKey = nodeData.controls.find(c => c.key === 'dur')?.val ?? '1s'
    const ms     = DURATIONS[durKey] ?? 1000
    const steps  = 10
    const step   = ms / steps

    ctx.log(`Waiting ${durKey}…`)

    for (let i = 1; i <= steps; i++) {
      await delay(step)
      if (ctx.signal.aborted) return { ok: false, message: 'aborted' }
      // update live progress via ctx.setNodeData
      ctx.setNodeData({ _progress: Math.round((i / steps) * 100) })
    }

    ctx.setNodeData({ _progress: 0 })
    ctx.log(`Delay complete (${durKey})`)

    return {
      ok: true,
      message: `delayed ${durKey}`,
      output: { waited: durKey },
    }
  },
}

export default TimerNode
