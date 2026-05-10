/**
 * OUTPUT DB NODE
 * Writes processed data to a target database.
 */

const delay = ms => new Promise(r => setTimeout(r, ms))

const OutputDBNode = {
  id:     'output-db',
  title:  'Output DB',
  icon:   '💾',
  iconBg: '#2e2516',
  group:  'output',
  doc: `Writes the processed dataset to a target database.

## On-conflict strategies
- Upsert: insert or update based on primary key.
- Skip: ignore rows that already exist.
- Replace: delete and re-insert.
- Error: abort on any conflict.

## Notes
Tx rollback wraps the write in a transaction - if any row fails, all changes are rolled back.`,
  inputType:  'dataset',
  outputType: 'write-result',
  resultType: 'stats',


  defaultControls: [
    { type: 'select', label: 'Target',      key: 'db',      val: 'Postgres', opts: ['Postgres', 'MySQL', 'Mongo', 'BigQuery', 'Snowflake'] },
    { type: 'toggle', label: 'Batch write', key: 'batch',   val: true },
    { type: 'select', label: 'On conflict', key: 'conflict', val: 'Upsert',  opts: ['Upsert', 'Skip', 'Replace', 'Error'] },
    { type: 'toggle', label: 'Tx rollback', key: 'tx',      val: true },
  ],

  async run(nodeData, ctx) {
    const db       = nodeData.controls.find(c => c.key === 'db')?.val       ?? 'Postgres'
    const batch    = nodeData.controls.find(c => c.key === 'batch')?.val    ?? true
    const conflict = nodeData.controls.find(c => c.key === 'conflict')?.val ?? 'Upsert'

    ctx.log(`Connecting to ${db}…`)
    await delay(400)
    if (ctx.signal.aborted) return { ok: false, message: 'aborted' }

    ctx.log(`Writing${batch ? ' in batches' : ''} (${conflict} on conflict)…`)
    await delay(800)
    if (ctx.signal.aborted) return { ok: false, message: 'aborted' }

    const written = Math.floor(Math.random() * 5000) + 500
    ctx.log(`${written.toLocaleString()} rows written ✓`)

    return {
      ok: true,
      message: `${written.toLocaleString()} rows → ${db}`,
      output: { written, db, conflict },
    }
  },
}

export default OutputDBNode
